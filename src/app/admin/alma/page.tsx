import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { ArrowRight, AlertTriangle, CheckCircle2, Globe, Mail, Send } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ALMA Enrichment Dashboard | Admin',
};

export default async function AlmaDashboard() {
  // Admin gate (same pattern as outreach-queue/page.tsx)
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login?next=/admin/alma');
  const { data: profile } = await (supabaseAuth as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/');

  const supabase = createServiceClient() as any;

  // Run all stat queries in parallel
  const [
    eligibleRes,
    fundedRes,
    candidatesByStatus,
    candidatesByReason,
    providerStats,
    last7Approvals,
    last7Outreach,
    recentActivity,
  ] = await Promise.all([
    // Eligible org pool
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .neq('archived', true)
      .eq('is_indigenous_org', false)
      .neq('featured_on_map', true)
      .or('website_url.not.is.null,website.not.is.null'),
    // Total orgs with a completeness score
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .not('profile_completeness_score', 'is', null),
    // Candidate funnel
    supabase.rpc('exec_sql', {}).then(async () => {
      // Workaround — no RPC for ad-hoc aggregates. Pull rows.
      const { data } = await supabase
        .from('alma_org_enrichment_candidates')
        .select('status')
        .eq('source', 'website_scrape')
        .limit(50000);
      const counts: Record<string, number> = {};
      for (const r of data || []) counts[r.status] = (counts[r.status] || 0) + 1;
      return { data: counts };
    }),
    // Rejection-reason breakdown
    (async () => {
      const { data } = await supabase
        .from('alma_org_enrichment_candidates')
        .select('rejection_reason')
        .eq('source', 'website_scrape')
        .eq('status', 'rejected')
        .not('rejection_reason', 'is', null)
        .limit(10000);
      const counts: Record<string, number> = {};
      for (const r of data || []) {
        const key = r.rejection_reason || 'unknown';
        counts[key] = (counts[key] || 0) + 1;
      }
      return { data: counts };
    })(),
    // Provider quality
    (async () => {
      const { data } = await supabase
        .from('alma_org_enrichment_candidates')
        .select('provenance, confidence, status')
        .eq('source', 'website_scrape')
        .not('provenance', 'is', null)
        .limit(10000);
      const byProvider: Record<
        string,
        { count: number; conf_total: number; mismatch: number }
      > = {};
      for (const r of data || []) {
        const p = (r.provenance as any)?.llm_provider;
        if (!p) continue;
        if (!byProvider[p]) byProvider[p] = { count: 0, conf_total: 0, mismatch: 0 };
        byProvider[p].count++;
        byProvider[p].conf_total += Number(r.confidence) || 0;
        if (r.status === 'pending_data_repair') byProvider[p].mismatch++;
      }
      return { data: byProvider };
    })(),
    // Approvals in last 7 days, per day
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('alma_org_enrichment_candidates')
        .select('reviewed_at, provenance, status')
        .eq('status', 'approved')
        .gte('reviewed_at', since)
        .limit(5000);
      const perDay: Record<string, { human: number; auto: number }> = {};
      for (const r of data || []) {
        if (!r.reviewed_at) continue;
        const day = r.reviewed_at.slice(0, 10);
        if (!perDay[day]) perDay[day] = { human: 0, auto: 0 };
        const isAuto = (r.provenance as any)?.auto_approved_by;
        if (isAuto) perDay[day].auto++;
        else perDay[day].human++;
      }
      return { data: perDay };
    })(),
    // Outreach in last 7 days
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('organization_outreach_log')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', since);
      return { data };
    })(),
    // Recent activity feed
    (async () => {
      const { data } = await supabase
        .from('alma_org_enrichment_candidates')
        .select('id, status, reviewed_at, provenance, organization_id')
        .not('reviewed_at', 'is', null)
        .order('reviewed_at', { ascending: false })
        .limit(10);
      if (!data || data.length === 0) return { data: [] };
      const orgIds = data.map((d: any) => d.organization_id);
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', orgIds);
      const orgMap = Object.fromEntries((orgs || []).map((o: any) => [o.id, o]));
      return {
        data: data.map((d: any) => ({
          id: d.id,
          status: d.status,
          reviewed_at: d.reviewed_at,
          actor: (d.provenance as any)?.auto_approved_by ? 'auto' : 'human',
          org: orgMap[d.organization_id] || null,
        })),
      };
    })(),
  ]);

  const eligible = eligibleRes.count || 0;
  const scored = fundedRes.count || 0;
  const funnel = candidatesByStatus.data as Record<string, number>;
  const reasons = candidatesByReason.data as Record<string, number>;
  const providers = providerStats.data as Record<
    string,
    { count: number; conf_total: number; mismatch: number }
  >;
  const approvalsPerDay = last7Approvals.data as Record<string, { human: number; auto: number }>;
  const outreachCount = (last7Outreach.data as any) || 0;
  const activity = recentActivity.data as Array<any>;

  const pending = funnel.pending_review || 0;
  const dataRepair = funnel.pending_data_repair || 0;
  const approved = funnel.approved || 0;
  const totalCandidates = Object.values(funnel).reduce((s, n) => s + n, 0);
  const coveragePct = eligible > 0 ? ((approved / eligible) * 100).toFixed(2) : '—';

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    return d.toISOString().slice(0, 10);
  }).reverse();

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/50 mb-1"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Admin · Australian Living Map of Alternatives
        </p>
        <h1
          className="text-2xl font-bold tracking-tight mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Enrichment dashboard
        </h1>

        {/* Top-level stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Eligible orgs" value={eligible.toLocaleString()} sub="non-Indigenous-led, has website" />
          <StatCard label="Approved → org" value={approved.toLocaleString()} sub={`${coveragePct}% of eligible`} accent="#059669" />
          <StatCard
            label="Pending review"
            value={pending.toLocaleString()}
            sub="awaiting admin"
            accent={pending > 100 ? '#DC2626' : pending > 0 ? '#F59E0B' : undefined}
            href="/admin/alma/outreach-queue"
          />
          <StatCard label="Scored / total" value={`${scored.toLocaleString()} / ${eligible.toLocaleString()}`} sub="run alma-rescore.mjs if low" />
        </div>

        {/* Funnel */}
        <Section title="Candidate funnel">
          <div className="bg-white rounded border border-[#0A0A0A]/10 p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#0A0A0A]/5 text-left text-[10px] uppercase tracking-wide text-[#0A0A0A]/50">
                  <th className="py-1.5">Status</th>
                  <th className="py-1.5 text-right">Count</th>
                  <th className="py-1.5 text-right">% of total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A0A0A]/5">
                {[
                  ['pending_review', 'Pending review', '#F59E0B'],
                  ['pending_data_repair', 'Pending URL repair', '#DC2626'],
                  ['approved', 'Approved', '#059669'],
                  ['rejected', 'Rejected (incl. skip markers)', '#0A0A0A'],
                ].map(([key, label, color]) => {
                  const n = funnel[key] || 0;
                  const pct = totalCandidates > 0 ? ((n / totalCandidates) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={key}>
                      <td className="py-2">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} />
                        {label}
                      </td>
                      <td className="py-2 text-right font-mono">{n.toLocaleString()}</td>
                      <td className="py-2 text-right text-[#0A0A0A]/60 font-mono">{pct}%</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-[#0A0A0A]/10 font-semibold">
                  <td className="py-2">Total candidates</td>
                  <td className="py-2 text-right font-mono">{totalCandidates.toLocaleString()}</td>
                  <td className="py-2 text-right" />
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Rejection reasons */}
        {Object.keys(reasons).length > 0 && (
          <Section title="Skip-marker reasons">
            <div className="bg-white rounded border border-[#0A0A0A]/10 p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(reasons)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => (
                  <div key={reason} className="flex items-baseline justify-between border-b border-[#0A0A0A]/5 pb-1">
                    <span
                      className="text-[11px] text-[#0A0A0A]/70"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {reason}
                    </span>
                    <span className="text-xs font-mono">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
            <p className="text-[10px] text-[#0A0A0A]/40 mt-2">
              homepage_fetch_failed counts are recoverable — run{' '}
              <code className="px-1 py-0.5 bg-[#0A0A0A]/5 rounded">--retry-failed</code>.
            </p>
          </Section>
        )}

        {/* Provider quality */}
        {Object.keys(providers).length > 0 && (
          <Section title="LLM provider quality">
            <div className="bg-white rounded border border-[#0A0A0A]/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]">
                    <th className="text-left px-3 py-2">Provider</th>
                    <th className="text-right px-3 py-2">Candidates</th>
                    <th className="text-right px-3 py-2">Avg confidence</th>
                    <th className="text-right px-3 py-2">Mismatch %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/5">
                  {Object.entries(providers)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([name, stats]) => {
                      const avgConf = stats.count > 0 ? (stats.conf_total / stats.count) : 0;
                      const mismatchPct = stats.count > 0 ? (stats.mismatch / stats.count) * 100 : 0;
                      const tone = avgConf >= 0.7 ? 'text-[#059669]' : avgConf >= 0.5 ? 'text-amber-600' : 'text-[#DC2626]';
                      return (
                        <tr key={name}>
                          <td className="px-3 py-2 font-semibold">{name}</td>
                          <td className="px-3 py-2 text-right font-mono">{stats.count.toLocaleString()}</td>
                          <td className={`px-3 py-2 text-right font-mono ${tone}`}>{avgConf.toFixed(3)}</td>
                          <td className="px-3 py-2 text-right font-mono">{mismatchPct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 7-day approvals */}
        <Section title="Last 7 days · approvals">
          <div className="bg-white rounded border border-[#0A0A0A]/10 p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#0A0A0A]/5 text-left text-[10px] uppercase tracking-wide text-[#0A0A0A]/50">
                  <th className="py-1.5">Day</th>
                  <th className="py-1.5 text-right">Human</th>
                  <th className="py-1.5 text-right">Auto</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A0A0A]/5">
                {last7Days.map((day) => {
                  const v = approvalsPerDay[day] || { human: 0, auto: 0 };
                  const total = v.human + v.auto;
                  return (
                    <tr key={day}>
                      <td className="py-1.5 font-mono text-[10px]">{day}</td>
                      <td className="py-1.5 text-right font-mono">{v.human}</td>
                      <td className="py-1.5 text-right font-mono text-[#0A0A0A]/60">{v.auto}</td>
                      <td className="py-1.5 text-right font-mono font-semibold">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-[#0A0A0A]/40 mt-2">
              Outreach emails logged in same period: <span className="font-mono">{outreachCount}</span>
            </p>
          </div>
        </Section>

        {/* Recent activity */}
        {activity.length > 0 && (
          <Section title="Recent activity">
            <div className="bg-white rounded border border-[#0A0A0A]/10 divide-y divide-[#0A0A0A]/5">
              {activity.map((a) => (
                <div key={a.id} className="flex items-baseline gap-3 px-3 py-2 text-xs">
                  <span
                    className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                      a.status === 'approved'
                        ? 'bg-[#059669]/10 text-[#059669]'
                        : 'bg-[#DC2626]/10 text-[#DC2626]'
                    }`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {a.status}
                  </span>
                  <span className="flex-1 min-w-0 truncate">{a.org?.name || '(unknown org)'}</span>
                  <span
                    className="text-[10px] text-[#0A0A0A]/40 shrink-0"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {a.actor === 'auto' ? '🤖 auto' : '👤 human'}
                  </span>
                  <span
                    className="text-[10px] text-[#0A0A0A]/40 shrink-0"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {new Date(a.reviewed_at).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Operations cheatsheet */}
        <Section title="Operations">
          <div className="bg-white rounded border border-[#0A0A0A]/10 p-4 text-xs space-y-2">
            <p className="text-[#0A0A0A]/70">
              <span className="font-semibold">Daily cron stack</span> (recommended):
            </p>
            <pre className="text-[10px] bg-[#0A0A0A]/5 rounded p-2 overflow-x-auto" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{`02:00  alma-rescore.mjs --apply --all
03:00  alma-org-enrichment.mjs --apply --batch 200 --concurrency 4
04:00  alma-org-url-discovery.mjs --apply --batch 50
11:00  alma-auto-approve.mjs --apply --limit 200
Sun 04:00  alma-org-enrichment.mjs --apply --retry-failed --batch 100`}</pre>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href="/admin/alma/outreach-queue"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A0A0A] text-white text-[11px] font-semibold hover:bg-[#0A0A0A]/90"
              >
                Outreach queue
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/admin/alma/elder-review"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#0A0A0A]/20 text-[11px] font-semibold hover:bg-[#0A0A0A]/5"
              >
                Elder review
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/admin/alma/verify"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#0A0A0A]/20 text-[11px] font-semibold hover:bg-[#0A0A0A]/5"
              >
                Verify interventions
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A]/30 transition-colors h-full">
      <p
        className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/50"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold tracking-tight mt-1"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: accent }}
      >
        {value}
      </p>
      <p className="text-[10px] text-[#0A0A0A]/50 mt-1">{sub}</p>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2
        className="text-sm font-bold tracking-tight mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
