'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Globe,
  Copy,
  Send,
} from 'lucide-react';
import { describeMissing, type CompletenessBreakdown } from '@/lib/alma/profile-completeness';

export interface QueueRow {
  candidateId: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  state: string | null;
  suburb: string | null;
  city: string | null;
  website: string | null;
  logoUrl: string | null;
  completenessScore: number | null;
  completenessBreakdown: CompletenessBreakdown | null;
  currentEmail: string | null;
  currentPhone: string | null;
  extractedFields: Record<string, any>;
  candidateConfidence: number | null;
  candidateCreatedAt: string | null;
  existingClaim: { status: string; contact_name: string | null; contact_email: string | null } | null;
  lastOutreach: { attempt_kind: string; response_status: string; sent_at: string } | null;
}

export interface UntouchedRow {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  score: number | null;
  website: string | null;
}

interface Props {
  rows: QueueRow[];
  untouched: UntouchedRow[];
}

function draftOutreach(row: QueueRow): { subject: string; body: string } {
  const subject = `${row.orgName} on the Australian Living Map of Alternatives`;
  const greetingName = row.extractedFields?.contact_name || 'team';
  const body = `Hi ${greetingName},

I am writing from JusticeHub. We run the Australian Living Map of Alternatives, a public record of community-led work that exists as an alternative to youth detention.

${row.orgName} is on the Map. The page sits at https://justicehub.com.au/sites/${row.orgSlug}.

A few things I wanted to ask:

1. Is the contact line still you, or someone else? We have ${row.currentEmail || 'no email on file'}.
2. Would you like to set the consent level for how your org appears on the Map? Three options:
   · Strictly Private (listing only, no story)
   · Public Knowledge Commons (full Map entry, evidence linked)
   · Community Controlled (every change requires your sign-off)
3. If you would like a richer profile (logo, photos, history, annual report link), I can walk you through how to update it. Two minutes once you have a login.

Either way, no pressure. If you want to be removed from the Map entirely, let me know and we will archive the entry within fourteen days.

Claim link (one click, sets up your login): https://justicehub.com.au/organizations/${row.orgId}/claim

Thanks for the work you do.

Ben`;
  return { subject, body };
}

function StatusPill({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = Math.round(score * 100);
  const tone =
    pct >= 50
      ? 'bg-[#059669]/10 text-[#059669]'
      : pct >= 30
      ? 'bg-amber-500/10 text-amber-600'
      : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/50';
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tone}`}
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {pct}%
    </span>
  );
}

export function OutreachQueueClient({ rows, untouched }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
      <p
        className="text-xs uppercase tracking-[0.3em] text-[#0A0A0A]/50 mb-3"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        Admin · Australian Living Map of Alternatives
      </p>
      <h1
        className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Outreach queue.
      </h1>
      <p className="text-base text-[#0A0A0A]/70 max-w-3xl mb-8">
        Orgs where AI enrichment has produced candidate contact data. Review the candidates,
        draft personalised outreach, send from your own mail account, then log the send below.
        Indigenous-led orgs are routed to the elder-review queue and never appear here.
      </p>

      {/* Top-line stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <Stat label="Ready for outreach" value={rows.length} />
        <Stat label="Need enrichment" value={untouched.length} />
        <Stat
          label="Avg candidate confidence"
          value={
            rows.length === 0
              ? '—'
              : `${Math.round(
                  (rows.reduce((s, r) => s + (r.candidateConfidence || 0), 0) / rows.length) * 100
                )}%`
          }
        />
      </div>

      {/* Ready-for-outreach section */}
      <section className="mb-12">
        <h2
          className="text-xl font-bold tracking-tight mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Ready for outreach
        </h2>
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8 text-center">
            <p className="text-sm text-[#0A0A0A]/60 mb-2">
              No pending-review candidates yet.
            </p>
            <p className="text-xs text-[#0A0A0A]/40 max-w-md mx-auto">
              Run the enrichment script:{' '}
              <code className="bg-[#0A0A0A]/5 px-1.5 py-0.5 rounded">
                node scripts/alma-org-enrichment.mjs --apply --batch 25
              </code>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const draft = draftOutreach(row);
              const isOpen = expanded === row.candidateId;
              const missing = row.completenessBreakdown
                ? (Object.keys(row.completenessBreakdown) as Array<keyof CompletenessBreakdown>)
                    .filter((k) => !row.completenessBreakdown![k])
                    .map((k) => describeMissing(k))
                : [];

              return (
                <div
                  key={row.candidateId}
                  className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : row.candidateId)}
                    className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[#F5F0E8]/40 transition-colors text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-[#0A0A0A]/40" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#0A0A0A]/40" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{row.orgName}</h3>
                        <StatusPill score={row.completenessScore} />
                        {row.lastOutreach && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            sent {new Date(row.lastOutreach.sent_at).toLocaleDateString('en-AU')}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs text-[#0A0A0A]/50 mt-0.5"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {row.state || '?'} · {[row.suburb, row.city].filter(Boolean).join(', ') || 'no location'}
                        {row.candidateConfidence !== null && (
                          <> · candidate confidence {Math.round(row.candidateConfidence * 100)}%</>
                        )}
                      </p>
                    </div>
                    {row.website && (
                      <a
                        href={row.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#0A0A0A]/40 hover:text-[#0A0A0A] inline-flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        site
                      </a>
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-[#0A0A0A]/5 space-y-5">
                      {/* What we have vs what's missing */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/50 mb-2"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            On file
                          </p>
                          <KV label="Email" value={row.currentEmail} />
                          <KV label="Phone" value={row.currentPhone} />
                          <KV label="Website" value={row.website} link />
                          <KV
                            label="Claim status"
                            value={row.existingClaim?.status || 'unclaimed'}
                          />
                          {row.existingClaim?.contact_name && (
                            <KV label="Claim contact" value={row.existingClaim.contact_name} />
                          )}
                        </div>
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-[0.15em] text-[#DC2626] mb-2"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            AI candidate fields
                          </p>
                          <KV label="Email" value={row.extractedFields.contact_email} />
                          <KV label="Phone" value={row.extractedFields.contact_phone} />
                          <KV label="Contact name" value={row.extractedFields.contact_name} />
                          <KV
                            label="Annual report"
                            value={row.extractedFields.annual_report_url}
                            link
                          />
                          <KV label="Logo URL" value={row.extractedFields.logo_url} link />
                          {row.extractedFields.history_summary && (
                            <div className="mt-2">
                              <p
                                className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/50 mb-1"
                                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                              >
                                History
                              </p>
                              <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">
                                {row.extractedFields.history_summary}
                              </p>
                            </div>
                          )}
                          {row.extractedFields.notes && (
                            <p
                              className="text-[10px] mt-2 text-amber-600 italic"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              note: {row.extractedFields.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {missing.length > 0 && (
                        <p className="text-xs text-[#0A0A0A]/50">
                          <span className="font-semibold">Missing from public profile:</span>{' '}
                          {missing.join(', ')}
                        </p>
                      )}

                      {/* Drafted outreach */}
                      <div>
                        <p
                          className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/50 mb-2"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          Drafted outreach
                        </p>
                        <div className="bg-[#F5F0E8] rounded-lg p-4 text-xs leading-relaxed">
                          <div className="mb-3">
                            <span className="font-bold">To: </span>
                            {row.extractedFields.contact_email ||
                              row.currentEmail ||
                              '(no email yet — find one before sending)'}
                          </div>
                          <div className="mb-3">
                            <span className="font-bold">Subject: </span>
                            {draft.subject}
                          </div>
                          <div className="whitespace-pre-wrap font-mono text-[11px]">
                            {draft.body}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `Subject: ${draft.subject}\n\n${draft.body}`,
                                row.candidateId
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-[#0A0A0A]/90"
                          >
                            <Copy className="w-3 h-3" />
                            {copied === row.candidateId ? 'Copied' : 'Copy draft'}
                          </button>
                          <a
                            href={`mailto:${row.extractedFields.contact_email || row.currentEmail || ''}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0A0A0A]/20 text-xs font-semibold hover:bg-[#0A0A0A]/5"
                          >
                            <Mail className="w-3 h-3" />
                            Open in mail
                          </a>
                          <span
                            className="text-[10px] text-[#0A0A0A]/40 ml-2"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            sending logs to organization_outreach_log via the claim flow
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Untouched-orgs section */}
      <section>
        <h2
          className="text-xl font-bold tracking-tight mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Needs enrichment ({untouched.length})
        </h2>
        <p className="text-sm text-[#0A0A0A]/60 mb-4 max-w-3xl">
          Orgs with a website and a public intervention but no AI candidate yet. Run the
          enrichment script to extract candidate contact data:
          <code className="bg-[#0A0A0A]/5 px-1.5 py-0.5 rounded ml-1">
            node scripts/alma-org-enrichment.mjs --apply --batch 25
          </code>
        </p>
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                <th className="text-left px-4 py-3">Organisation</th>
                <th className="text-left px-4 py-3">State</th>
                <th className="text-right px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A0A0A]/5">
              {untouched.slice(0, 30).map((o) => (
                <tr key={o.id} className="hover:bg-[#F5F0E8]/40">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/sites/${o.slug}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {o.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#0A0A0A]/60">{o.state || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <StatusPill score={o.score} />
                  </td>
                  <td className="px-4 py-2.5">
                    {o.website ? (
                      <a
                        href={o.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#059669] hover:underline inline-flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        visit
                      </a>
                    ) : (
                      <span className="text-xs text-[#0A0A0A]/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4">
      <p
        className="text-3xl font-bold"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p
        className="text-xs text-[#0A0A0A]/50 mt-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </p>
    </div>
  );
}

function KV({ label, value, link = false }: { label: string; value: string | null | undefined; link?: boolean }) {
  if (!value) {
    return (
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[10px] text-[#0A0A0A]/40 w-24 shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {label}
        </span>
        <span className="text-xs text-[#0A0A0A]/30">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-2 mb-1">
      <span className="text-[10px] text-[#0A0A0A]/50 w-24 shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </span>
      {link && value.startsWith('http') ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#059669] hover:underline inline-flex items-center gap-1 break-all"
        >
          {value}
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ) : (
        <span className="text-xs text-[#0A0A0A] break-all">{value}</span>
      )}
    </div>
  );
}
