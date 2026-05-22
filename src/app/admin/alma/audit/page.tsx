import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { ExternalLink, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrichment Audit Log | Admin',
};

const PAGE_SIZE = 100;

interface PageProps {
  searchParams: Promise<{
    actor?: string;
    status?: string;
    since?: string;
    page?: string;
  }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  // Admin gate
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login?next=/admin/alma/audit');
  const { data: profile } = await (supabaseAuth as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/');

  const params = await searchParams;
  const actor = params.actor || ''; // '', 'human', 'auto', or a uuid
  const status = params.status || ''; // '', 'approved', 'rejected'
  const since = params.since || '7d'; // '24h' | '7d' | '30d' | 'all'
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = createServiceClient() as any;

  // Convert since into a timestamp
  const sinceDate = (() => {
    const ms =
      since === '24h'
        ? 24 * 3600_000
        : since === '7d'
        ? 7 * 24 * 3600_000
        : since === '30d'
        ? 30 * 24 * 3600_000
        : null;
    return ms ? new Date(Date.now() - ms).toISOString() : null;
  })();

  let query = supabase
    .from('alma_org_enrichment_candidates')
    .select(
      'id, organization_id, status, reviewed_at, reviewed_by, rejection_reason, provenance, confidence, extracted_fields',
      { count: 'exact' }
    )
    .not('reviewed_at', 'is', null);

  if (status) query = query.eq('status', status);
  if (sinceDate) query = query.gte('reviewed_at', sinceDate);
  if (actor === 'auto') {
    query = query.not('provenance->>auto_approved_by', 'is', null);
  } else if (actor === 'human') {
    query = query.is('provenance->>auto_approved_by', null);
  } else if (actor && actor !== 'all') {
    query = query.eq('reviewed_by', actor);
  }

  const {
    data: events,
    count,
    error,
  } = await query
    .order('reviewed_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) console.error('[audit] query failed:', error.message);

  // Hydrate orgs
  const orgIds = Array.from(new Set((events || []).map((e: any) => e.organization_id)));
  const orgsById: Record<string, any> = {};
  if (orgIds.length > 0) {
    for (let i = 0; i < orgIds.length; i += 100) {
      const slice = orgIds.slice(i, i + 100);
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug, state')
        .in('id', slice);
      for (const o of orgs || []) orgsById[o.id] = o;
    }
  }

  // Hydrate reviewer profiles (for the human ones with a uuid)
  const reviewerIds = Array.from(
    new Set((events || []).map((e: any) => e.reviewed_by).filter(Boolean))
  );
  const profilesByReviewerId: Record<string, any> = {};
  if (reviewerIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', reviewerIds);
    for (const p of profs || []) profilesByReviewerId[p.id] = p;
  }

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <Link
          href="/admin/alma"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/50 hover:text-[#0A0A0A]/80 mb-1"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <ArrowLeft className="w-3 h-3" />
          Admin · ALMA
        </Link>
        <h1
          className="text-2xl font-bold tracking-tight mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Audit log
        </h1>
        <p className="text-xs text-[#0A0A0A]/60 mb-6">
          Every approve and reject action. {(count || 0).toLocaleString()} matching events.
        </p>

        {/* Filter form — GET, server-driven so back/forward + share-link work */}
        <form
          method="get"
          className="bg-white rounded border border-[#0A0A0A]/10 p-3 mb-4 flex flex-wrap items-end gap-3 text-xs"
        >
          <Field label="Actor">
            <select
              name="actor"
              defaultValue={actor}
              className="px-2 py-1 rounded border border-[#0A0A0A]/15 bg-white text-xs"
            >
              <option value="">Any</option>
              <option value="human">Human</option>
              <option value="auto">Auto-approve script</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={status}
              className="px-2 py-1 rounded border border-[#0A0A0A]/15 bg-white text-xs"
            >
              <option value="">Any</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <Field label="Since">
            <select
              name="since"
              defaultValue={since}
              className="px-2 py-1 rounded border border-[#0A0A0A]/15 bg-white text-xs"
            >
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </Field>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-[#0A0A0A] text-white text-[11px] font-semibold"
          >
            Filter
          </button>
          {(actor || status || since !== '7d') && (
            <Link
              href="/admin/alma/audit"
              className="text-[10px] text-[#0A0A0A]/50 hover:text-[#0A0A0A] underline"
            >
              Reset
            </Link>
          )}
        </form>

        {/* Events table */}
        <div className="bg-white rounded border border-[#0A0A0A]/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr
                className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                <th className="text-left px-3 py-2 w-32">When</th>
                <th className="text-left px-3 py-2">Organisation</th>
                <th className="text-left px-3 py-2 w-24">Action</th>
                <th className="text-left px-3 py-2 w-32">Fields / Reason</th>
                <th className="text-left px-3 py-2 w-32">Actor</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A0A0A]/5">
              {(events || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#0A0A0A]/40">
                    No events match these filters.
                  </td>
                </tr>
              ) : (
                events.map((e: any) => {
                  const org = orgsById[e.organization_id];
                  const isAuto = !!e.provenance?.auto_approved_by;
                  const reviewer = e.reviewed_by ? profilesByReviewerId[e.reviewed_by] : null;
                  const actorLabel = isAuto
                    ? 'auto-approve'
                    : reviewer?.full_name || reviewer?.email || (e.reviewed_by ? e.reviewed_by.slice(0, 8) : 'unknown');
                  const fieldsOrReason =
                    e.status === 'approved'
                      ? e.provenance?.auto_applied_fields?.join(', ') ||
                        ['email', 'phone', 'logo', 'history', 'annual_report']
                          .filter((f) => e.extracted_fields?.[`contact_${f}`] || e.extracted_fields?.[`${f}_url`] || e.extracted_fields?.[`${f}_summary`])
                          .join(', ') ||
                        '—'
                      : e.rejection_reason || '—';
                  return (
                    <tr key={e.id} className="hover:bg-[#F5F0E8]/40">
                      <td
                        className="px-3 py-2 text-[10px] text-[#0A0A0A]/60"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {e.reviewed_at
                          ? new Date(e.reviewed_at).toLocaleString('en-AU', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {org ? (
                          <Link
                            href={`/sites/${org.slug}`}
                            target="_blank"
                            className="font-semibold hover:underline"
                          >
                            {org.name}
                          </Link>
                        ) : (
                          <span className="text-[#0A0A0A]/40">(unknown org)</span>
                        )}
                        {org?.state && (
                          <span
                            className="ml-2 text-[10px] text-[#0A0A0A]/40"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {org.state}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                            e.status === 'approved'
                              ? 'bg-[#059669]/10 text-[#059669]'
                              : 'bg-[#DC2626]/10 text-[#DC2626]'
                          }`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td
                        className="px-3 py-2 text-[10px] text-[#0A0A0A]/70 truncate max-w-[200px]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {fieldsOrReason}
                      </td>
                      <td
                        className="px-3 py-2 text-[10px] text-[#0A0A0A]/60"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {isAuto ? '🤖 ' : '👤 '}
                        {actorLabel}
                      </td>
                      <td className="px-3 py-2">
                        {org && (
                          <Link
                            href={`/sites/${org.slug}`}
                            target="_blank"
                            className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                            title="View public org page"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 text-[11px] text-[#0A0A0A]/60">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/alma/audit?actor=${actor}&status=${status}&since=${since}&page=${page - 1}`}
                  className="px-2 py-1 rounded border border-[#0A0A0A]/20 hover:bg-[#0A0A0A]/5"
                >
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/alma/audit?actor=${actor}&status=${status}&since=${since}&page=${page + 1}`}
                  className="px-2 py-1 rounded border border-[#0A0A0A]/20 hover:bg-[#0A0A0A]/5"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="inline-flex flex-col gap-1">
      <span
        className="text-[10px] uppercase tracking-wide text-[#0A0A0A]/50"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
