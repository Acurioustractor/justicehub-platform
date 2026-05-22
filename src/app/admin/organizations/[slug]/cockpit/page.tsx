import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server-lite';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { ExternalLink, ArrowLeft, Globe, Mail, Phone, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Org Cockpit | Admin',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrgCockpit({ params }: PageProps) {
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

  const { slug } = await params;
  const supabase = createServiceClient() as any;

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !org) notFound();

  // Pull everything in parallel
  const [candidatesRes, outreachRes, claimsRes] = await Promise.all([
    supabase
      .from('alma_org_enrichment_candidates')
      .select('id, status, confidence, extracted_fields, provenance, created_at, reviewed_at, reviewed_by, rejection_reason')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('organization_outreach_log')
      .select('id, attempt_kind, response_status, sent_at, responded_at, email_to, email_subject, notes')
      .eq('organization_id', org.id)
      .order('sent_at', { ascending: false }),
    supabase
      .from('organization_claims')
      .select('id, status, contact_name, contact_email, role_at_org, created_at, verified_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
  ]);

  const candidates = (candidatesRes.data || []) as any[];
  const outreach = (outreachRes.data || []) as any[];
  const claims = (claimsRes.data || []) as any[];
  const acnc = (org.acnc_data || {}) as Record<string, any>;
  const annualFacts = acnc.annual_report_facts;

  const completenessPct =
    org.profile_completeness_score !== null
      ? Math.round(Number(org.profile_completeness_score) * 100)
      : null;

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

        {/* Org header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {org.name}
            </h1>
            <p
              className="text-[11px] text-[#0A0A0A]/50 mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {org.slug} · {org.state || '—'} · {org.suburb || org.city || '—'}
              {org.abn ? ` · ABN ${org.abn}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Link
              href={`/sites/${org.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#0A0A0A] text-white text-[11px] font-semibold hover:bg-[#0A0A0A]/90"
            >
              View public page
              <ExternalLink className="w-3 h-3" />
            </Link>
            {completenessPct !== null && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  completenessPct >= 50
                    ? 'bg-[#059669]/10 text-[#059669]'
                    : completenessPct >= 30
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/60'
                }`}
              >
                {completenessPct}% complete
              </span>
            )}
          </div>
        </div>

        {/* Current profile fields */}
        <Section title="Current profile">
          <div className="bg-white rounded border border-[#0A0A0A]/10 p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <KV label="Email" icon={<Mail className="w-3 h-3" />} value={org.contact_email || org.email} />
            <KV label="Phone" icon={<Phone className="w-3 h-3" />} value={org.phone} />
            <KV label="Website" icon={<Globe className="w-3 h-3" />} value={org.website_url || org.website} link />
            <KV label="Location" icon={<MapPin className="w-3 h-3" />} value={[org.suburb, org.city, org.state].filter(Boolean).join(', ')} />
            <KV label="Logo URL" value={org.logo_url} link wide />
            <KV label="Annual report" value={org.annual_report_url} link wide />
            <KV label="History" value={org.history_summary} multiline wide />
            <KV label="Description" value={org.description} multiline wide />
          </div>
        </Section>

        {/* Candidates history */}
        <Section title={`Enrichment candidates (${candidates.length})`}>
          {candidates.length === 0 ? (
            <Empty>No enrichment runs against this org yet.</Empty>
          ) : (
            <div className="bg-white rounded border border-[#0A0A0A]/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr
                    className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <th className="text-left px-3 py-2 w-32">When</th>
                    <th className="text-left px-3 py-2 w-28">Status</th>
                    <th className="text-right px-3 py-2 w-14">Conf</th>
                    <th className="text-left px-3 py-2">Extracted</th>
                    <th className="text-left px-3 py-2 w-32">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/5">
                  {candidates.map((c) => {
                    const ext = c.extracted_fields || {};
                    const fields = [
                      ext.contact_email ? 'email' : null,
                      ext.contact_phone ? 'phone' : null,
                      ext.logo_url ? 'logo' : null,
                      ext.history_summary ? 'history' : null,
                      ext.annual_report_url ? 'annual_report' : null,
                    ].filter(Boolean);
                    return (
                      <tr key={c.id} className="hover:bg-[#F5F0E8]/40">
                        <td
                          className="px-3 py-2 text-[10px] text-[#0A0A0A]/60"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {new Date(c.created_at).toLocaleDateString('en-AU')}
                          {c.reviewed_at && (
                            <div className="text-[9px] text-[#0A0A0A]/40">
                              ↳ reviewed {new Date(c.reviewed_at).toLocaleDateString('en-AU')}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <CandidateStatusBadge status={c.status} rejection={c.rejection_reason} />
                          {c.provenance?.auto_approved_by && (
                            <div className="text-[9px] text-[#0A0A0A]/40 mt-0.5">auto</div>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 text-right font-mono text-[10px]"
                        >
                          {c.confidence !== null ? `${Math.round(Number(c.confidence) * 100)}%` : '—'}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-[#0A0A0A]/70">
                          {fields.length > 0 ? fields.join(', ') : <span className="text-[#0A0A0A]/30">none</span>}
                          {c.provenance?.represented_entity_name && (
                            <div className="text-[9px] text-[#DC2626] mt-0.5">
                              site represents: {c.provenance.represented_entity_name}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 text-[10px] text-[#0A0A0A]/60"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {c.provenance?.llm_provider || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Outreach log */}
        <Section title={`Outreach log (${outreach.length})`}>
          {outreach.length === 0 ? (
            <Empty>No outreach attempts logged.</Empty>
          ) : (
            <div className="bg-white rounded border border-[#0A0A0A]/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr
                    className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <th className="text-left px-3 py-2 w-28">When</th>
                    <th className="text-left px-3 py-2 w-20">Kind</th>
                    <th className="text-left px-3 py-2 w-32">Status</th>
                    <th className="text-left px-3 py-2">Email to / Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/5">
                  {outreach.map((o) => (
                    <tr key={o.id}>
                      <td
                        className="px-3 py-2 text-[10px] text-[#0A0A0A]/60"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {new Date(o.sent_at).toLocaleDateString('en-AU')}
                      </td>
                      <td
                        className="px-3 py-2 text-[10px]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {o.attempt_kind}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0A]/5"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {o.response_status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-[#0A0A0A]/70">
                        {o.email_to && <div className="font-mono">{o.email_to}</div>}
                        {o.email_subject && <div className="text-[#0A0A0A]/60">{o.email_subject}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Claims */}
        <Section title={`Claims (${claims.length})`}>
          {claims.length === 0 ? (
            <Empty>No claims on this org.</Empty>
          ) : (
            <div className="bg-white rounded border border-[#0A0A0A]/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr
                    className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <th className="text-left px-3 py-2 w-28">When</th>
                    <th className="text-left px-3 py-2 w-24">Status</th>
                    <th className="text-left px-3 py-2">Contact</th>
                    <th className="text-left px-3 py-2 w-32">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/5">
                  {claims.map((c) => (
                    <tr key={c.id}>
                      <td
                        className="px-3 py-2 text-[10px] text-[#0A0A0A]/60"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {new Date(c.created_at).toLocaleDateString('en-AU')}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            c.status === 'verified'
                              ? 'bg-[#059669]/10 text-[#059669]'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        {c.contact_name || '—'}
                        {c.contact_email && (
                          <div className="text-[10px] text-[#0A0A0A]/50 font-mono">{c.contact_email}</div>
                        )}
                      </td>
                      <td
                        className="px-3 py-2 text-[10px] text-[#0A0A0A]/60"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {c.role_at_org || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Annual-report extract */}
        {annualFacts && (
          <Section title="Annual report extract">
            <div className="bg-white rounded border border-[#0A0A0A]/10 p-4 text-xs">
              <pre className="text-[10px] overflow-x-auto" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {JSON.stringify(annualFacts, null, 2)}
              </pre>
            </div>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded border border-[#0A0A0A]/10 p-6 text-center text-xs text-[#0A0A0A]/50">
      {children}
    </div>
  );
}

function KV({
  label,
  value,
  icon,
  link,
  multiline,
  wide,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
  link?: boolean;
  multiline?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <p
        className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/40 mb-0.5 inline-flex items-center gap-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {icon}
        {label}
      </p>
      {!value ? (
        <p className="text-[#0A0A0A]/30">—</p>
      ) : link && value.startsWith('http') ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#059669] hover:underline break-all inline-flex items-center gap-1"
        >
          {value}
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ) : (
        <p className={`text-xs text-[#0A0A0A] ${multiline ? '' : 'truncate'} break-words`}>{value}</p>
      )}
    </div>
  );
}

function CandidateStatusBadge({ status, rejection }: { status: string; rejection: string | null }) {
  const tone =
    status === 'approved'
      ? 'bg-[#059669]/10 text-[#059669]'
      : status === 'rejected'
      ? 'bg-[#DC2626]/10 text-[#DC2626]'
      : status === 'pending_data_repair'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/60';
  return (
    <div>
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded ${tone}`}
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {status}
      </span>
      {rejection && (
        <div className="text-[9px] text-[#0A0A0A]/40 mt-0.5">{rejection}</div>
      )}
    </div>
  );
}
