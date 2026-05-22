'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  LayoutGrid,
  List,
  Building2,
  Check,
  X as XIcon,
  Loader2,
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
  currentHistory: string | null;
  currentAnnualReport: string | null;
  extractedFields: Record<string, any>;
  candidateConfidence: number | null;
  candidateCreatedAt: string | null;
  provenance: Record<string, any> | null;
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

// Tight, single-purpose claim invite — used after a candidate is approved
// and we have a verified contact email. Doesn't ask for consent levels or
// profile-richness; only the claim.
function draftClaimInvite(row: QueueRow): { subject: string; body: string } {
  const subject = `Claim ${row.orgName} on the Australian Living Map of Alternatives`;
  const greetingName = row.extractedFields?.contact_name || 'team';
  const body = `Hi ${greetingName},

${row.orgName} is listed on the Australian Living Map of Alternatives, a public record of community-led work that exists as an alternative to youth detention.

You can claim the entry in one click here:
https://justicehub.com.au/organizations/${row.orgId}/claim

Once claimed, you control what shows on the Map: who the named contact is, what stories link to the org, and the consent level for any future use. You can also remove the entry entirely if you would rather not be listed.

Two minutes to claim, no account needed beforehand.

If you have any questions, just reply to this email.

Ben`;
  return { subject, body };
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

function isRepair(r: QueueRow): boolean {
  return r.extractedFields?.identity_match?.represents_named_org === false;
}

function getLogo(r: QueueRow): string | null {
  const raw = r.extractedFields?.logo_url || r.logoUrl || null;
  if (!raw) return null;
  // Resolve relative paths against the org's website so the browser doesn't
  // try to fetch /assets/logo.png from JusticeHub itself.
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!r.website) return null;
  try {
    return new URL(raw, r.website.startsWith('http') ? r.website : `https://${r.website}`).href;
  } catch {
    return null;
  }
}

export function OutreachQueueClient({ rows }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  // Optimistic action state: candidates we've just approved/rejected
  // disappear from the queue without a hard reload. router.refresh() syncs
  // the server-rendered list afterward.
  const [actioned, setActioned] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  async function callAction(
    candidateId: string,
    payload: { action: 'approve'; fields: string[]; overwrite?: boolean } | { action: 'reject'; rejection_reason: string }
  ) {
    setBusyId(candidateId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/alma/enrichment/${candidateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      if (json.status === 'no_changes') {
        setError({
          id: candidateId,
          message: 'No fields applied — org already has values. Tick "Overwrite existing" to replace.',
        });
        return;
      }
      setActioned((prev) => ({ ...prev, [candidateId]: payload.action === 'approve' ? 'approved' : 'rejected' }));
      // Soft-refresh so the server-side queue picks up new state on next nav.
      router.refresh();
    } catch (e: any) {
      setError({ id: candidateId, message: e?.message || 'Action failed' });
    } finally {
      setBusyId(null);
    }
  }

  async function callBulkApprove(rowsToApprove: QueueRow[]) {
    if (rowsToApprove.length === 0) return;
    setBulkBusy(true);
    setBulkResult(null);
    try {
      // Chunk client-side to stay under the 200-per-call API cap and surface
      // partial progress instead of one giant request that times out.
      const CHUNK = 100;
      let approved = 0;
      let noChanges = 0;
      let errored = 0;
      let fieldsApplied = 0;
      for (let i = 0; i < rowsToApprove.length; i += CHUNK) {
        const chunk = rowsToApprove.slice(i, i + CHUNK);
        const res = await fetch('/api/admin/alma/enrichment/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve_many',
            candidate_ids: chunk.map((r) => r.candidateId),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        approved += json.summary.approved;
        noChanges += json.summary.no_changes;
        errored += json.summary.errored;
        fieldsApplied += json.summary.fields_applied;
        // Mark every successful candidate as actioned so it disappears immediately.
        const successful = (json.results || []).filter((r: any) => r.ok).map((r: any) => r.candidateId);
        setActioned((prev) => {
          const next = { ...prev };
          for (const id of successful) next[id] = 'approved';
          return next;
        });
      }
      setBulkResult(
        `Approved ${approved} · ${fieldsApplied} fields written · ${noChanges} skipped (org full) · ${errored} errors`
      );
      router.refresh();
    } catch (e: any) {
      setBulkResult(`Bulk approve failed: ${e?.message || 'unknown error'}`);
    } finally {
      setBulkBusy(false);
    }
  }

  // Hide actioned rows, apply search, then state filter
  const liveRows = rows.filter((r) => !actioned[r.candidateId]);

  const afterSearch = liveRows.filter((r) => {
    if (!search) return true;
    return r.orgName.toLowerCase().includes(search.toLowerCase());
  });
  const states = Array.from(new Set(afterSearch.map((r) => r.state).filter(Boolean))).sort() as string[];
  const filtered = afterSearch.filter((r) => {
    if (stateFilter && r.state !== stateFilter) return false;
    return true;
  });

  const reviewRows = filtered.filter((r) => !isRepair(r));
  const repairRows = filtered.filter((r) => isRepair(r));

  const avgConf = liveRows.length === 0
    ? '—'
    : `${Math.round((liveRows.reduce((s, r) => s + (r.candidateConfidence || 0), 0) / liveRows.length) * 100)}%`;
  const actionedCount = Object.keys(actioned).length;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
      {/* Compact header */}
      <div className="flex items-baseline justify-between mb-1">
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/50"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Admin · Australian Living Map of Alternatives
        </p>
        <p
          className="text-[10px] text-[#0A0A0A]/40"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {reviewRows.length} review · {repairRows.length} repair · avg conf {avgConf}
          {actionedCount > 0 ? ` · ${actionedCount} actioned this session` : ''}
        </p>
      </div>
      <h1
        className="text-2xl font-bold tracking-tight mb-1"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Outreach queue
      </h1>
      <p className="text-xs text-[#0A0A0A]/60 mb-6">
        Review AI-extracted contact data, copy a drafted email, send from your mail account.
        Indigenous-led orgs are routed to the elder-review queue.
      </p>

      {/* Filter bar — sticky so it stays visible while scrolling */}
      <div className="sticky top-0 z-20 -mx-6 sm:-mx-8 px-6 sm:px-8 py-2 bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-[#0A0A0A]/5 mb-4 flex flex-wrap items-center gap-2 text-xs">
        <input
          type="text"
          placeholder="Search org name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded border border-[#0A0A0A]/15 bg-white text-xs w-56 focus:outline-none focus:border-[#0A0A0A]/40"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-1.5 rounded border border-[#0A0A0A]/15 bg-white text-xs focus:outline-none focus:border-[#0A0A0A]/40"
        >
          <option value="">All states ({afterSearch.length})</option>
          {states.map((s) => (
            <option key={s} value={s}>{s} ({afterSearch.filter((r) => r.state === s).length})</option>
          ))}
        </select>
        <div className="inline-flex rounded border border-[#0A0A0A]/15 overflow-hidden ml-1">
          <button
            onClick={() => setView('table')}
            className={`px-2 py-1.5 inline-flex items-center gap-1 ${view === 'table' ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#0A0A0A]/60 hover:bg-[#F5F0E8]'}`}
            title="Table view"
          >
            <List className="w-3 h-3" />
            <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Table</span>
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-2 py-1.5 inline-flex items-center gap-1 ${view === 'grid' ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#0A0A0A]/60 hover:bg-[#F5F0E8]'}`}
            title="Grid view"
          >
            <LayoutGrid className="w-3 h-3" />
            <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Grid</span>
          </button>
        </div>
        <span
          className="text-[10px] text-[#0A0A0A]/40 ml-auto"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          showing {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Bulk-approve toolbar — only shows when the current filter has
          high-confidence review rows. We bulk-apply gap-fill only (no
          overwrites), so the worst case is no-op. */}
      {(() => {
        const eligible = reviewRows.filter(
          (r) => (r.candidateConfidence || 0) >= 0.85
        );
        if (eligible.length === 0 && !bulkResult) return null;
        return (
          <div className="bg-white border border-[#059669]/30 rounded p-3 mb-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] uppercase tracking-[0.15em] text-[#059669]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Bulk approve
              </p>
              <p className="text-xs text-[#0A0A0A]/70 mt-0.5">
                {eligible.length} candidate{eligible.length === 1 ? '' : 's'} in this filter at ≥85% confidence.
                Bulk apply only fills empty fields — never overwrites.
              </p>
              {bulkResult && (
                <p
                  className="text-[10px] mt-1 text-[#0A0A0A]/70"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {bulkResult}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Approve ${eligible.length} candidates? This will fill empty fields on each org. No overwrites.`
                  )
                ) {
                  callBulkApprove(eligible);
                }
              }}
              disabled={bulkBusy || eligible.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#059669] text-white text-xs font-semibold hover:bg-[#059669]/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bulkBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Approve {eligible.length}
            </button>
          </div>
        );
      })()}

      {/* Review section */}
      <Section
        title="Ready for outreach"
        accent="#059669"
        count={reviewRows.length}
        helper="Identity verified. Send personalised outreach."
      >
        {reviewRows.length === 0 ? (
          <EmptyState rowsTotal={liveRows.length} />
        ) : view === 'table' ? (
          <RowTable
            rows={reviewRows}
            expanded={expanded}
            setExpanded={setExpanded}
            showEmail={showEmail}
            setShowEmail={setShowEmail}
            copied={copied}
            copyToClipboard={copyToClipboard}
            callAction={callAction}
            busyId={busyId}
            error={error}
          />
        ) : (
          <RowGrid
            rows={reviewRows}
            expanded={expanded}
            setExpanded={setExpanded}
            showEmail={showEmail}
            setShowEmail={setShowEmail}
            copied={copied}
            copyToClipboard={copyToClipboard}
            callAction={callAction}
            busyId={busyId}
            error={error}
          />
        )}
      </Section>

      {/* Repair section */}
      <Section
        title="Needs URL repair"
        accent="#DC2626"
        count={repairRows.length}
        helper="The website on file represents a different org. Fix the URL on the org record."
      >
        {repairRows.length === 0 ? (
          <div className="bg-white rounded border border-[#0A0A0A]/10 p-6 text-center text-xs text-[#0A0A0A]/50">
            No repair candidates in this filter.
          </div>
        ) : view === 'table' ? (
          <RepairTable
            rows={repairRows}
            expanded={expanded}
            setExpanded={setExpanded}
            callAction={callAction}
            busyId={busyId}
            error={error}
          />
        ) : (
          <RowGrid
            rows={repairRows}
            expanded={expanded}
            setExpanded={setExpanded}
            showEmail={showEmail}
            setShowEmail={setShowEmail}
            copied={copied}
            copyToClipboard={copyToClipboard}
            callAction={callAction}
            busyId={busyId}
            error={error}
          />
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ title, accent, count, helper, children }: { title: string; accent: string; count: number; helper: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <h2
            className="text-base font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {title}
          </h2>
          <span
            className="text-[11px] px-1.5 py-0.5 rounded"
            style={{ fontFamily: "'IBM Plex Mono', monospace", backgroundColor: `${accent}15`, color: accent }}
          >
            {count}
          </span>
        </div>
        <p
          className="text-[10px] text-[#0A0A0A]/40"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {helper}
        </p>
      </div>
      {children}
    </section>
  );
}

interface SectionProps {
  rows: QueueRow[];
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  showEmail: string | null;
  setShowEmail: (v: string | null) => void;
  copied: string | null;
  copyToClipboard: (text: string, id: string) => void;
  callAction: (
    candidateId: string,
    payload:
      | { action: 'approve'; fields: string[]; overwrite?: boolean }
      | { action: 'reject'; rejection_reason: string }
  ) => Promise<void>;
  busyId: string | null;
  error: { id: string; message: string } | null;
}

function RowTable({ rows, expanded, setExpanded, showEmail, setShowEmail, copied, copyToClipboard, callAction, busyId, error }: SectionProps) {
  return (
    <div className="bg-white rounded border border-[#0A0A0A]/10 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr
            className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <th className="w-6"></th>
            <th className="w-8"></th>
            <th className="text-left px-3 py-2">Organisation</th>
            <th className="text-left px-3 py-2 w-14">State</th>
            <th className="text-right px-3 py-2 w-14">Conf</th>
            <th className="text-left px-3 py-2 w-52">AI Email</th>
            <th className="text-left px-3 py-2 w-32">AI Phone</th>
            <th className="text-left px-3 py-2 w-20">Sent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#0A0A0A]/5">
          {rows.map((row) => {
            const isOpen = expanded === row.candidateId;
            const logo = getLogo(row);
            return (
              <Fragment key={row.candidateId}>
                <tr
                  onClick={() => setExpanded(isOpen ? null : row.candidateId)}
                  className={`cursor-pointer hover:bg-[#F5F0E8]/60 ${isOpen ? 'bg-[#F5F0E8]/40' : ''}`}
                >
                  <td className="pl-3 text-[#0A0A0A]/40">
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </td>
                  <td className="py-1.5">
                    <LogoThumb logo={logo} size={24} />
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    {row.orgName}
                    {row.lastOutreach && (
                      <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        sent
                      </span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2 text-[#0A0A0A]/60"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.state || '—'}
                  </td>
                  <td
                    className="px-3 py-2 text-right text-[#0A0A0A]/70"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.candidateConfidence !== null
                      ? `${Math.round(row.candidateConfidence * 100)}%`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-[#0A0A0A]/70 truncate max-w-[200px]">
                    {row.extractedFields.contact_email ? (
                      <span className="inline-flex items-center gap-1">
                        {row.extractedFields.contact_email}
                        <EmailBadge ev={row.extractedFields.email_validation} />
                      </span>
                    ) : (
                      <span className="text-[#0A0A0A]/25">—</span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2 text-[#0A0A0A]/70"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.extractedFields.contact_phone || (
                      <span className="text-[#0A0A0A]/25">—</span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2 text-[10px] text-[#0A0A0A]/50"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.lastOutreach
                      ? new Date(row.lastOutreach.sent_at).toLocaleDateString('en-AU')
                      : '—'}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-[#F5F0E8]/30">
                    <td colSpan={8} className="px-3 pb-4 pt-1">
                      <RowExpanded
                        row={row}
                        showEmail={showEmail === row.candidateId}
                        setShowEmail={(v) => setShowEmail(v ? row.candidateId : null)}
                        copied={copied === row.candidateId}
                        copyToClipboard={copyToClipboard}
                        callAction={callAction}
                        busy={busyId === row.candidateId}
                        error={error && error.id === row.candidateId ? error.message : null}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RepairTable({
  rows,
  expanded,
  setExpanded,
  callAction,
  busyId,
  error,
}: {
  rows: QueueRow[];
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  callAction: SectionProps['callAction'];
  busyId: string | null;
  error: { id: string; message: string } | null;
}) {
  return (
    <div className="bg-white rounded border border-[#0A0A0A]/10 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr
            className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <th className="w-6"></th>
            <th className="text-left px-3 py-2">Organisation</th>
            <th className="text-left px-3 py-2 w-14">State</th>
            <th className="text-left px-3 py-2">URL on file represents</th>
            <th className="text-left px-3 py-2 w-52">Wrong website</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#0A0A0A]/5">
          {rows.map((row) => {
            const isOpen = expanded === row.candidateId;
            const realOwner = row.extractedFields?.identity_match?.represented_entity_name || '—';
            return (
              <Fragment key={row.candidateId}>
                <tr
                  onClick={() => setExpanded(isOpen ? null : row.candidateId)}
                  className={`cursor-pointer hover:bg-[#F5F0E8]/60 ${isOpen ? 'bg-[#F5F0E8]/40' : ''}`}
                >
                  <td className="pl-3 text-[#0A0A0A]/40">
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </td>
                  <td className="px-3 py-2 font-semibold">{row.orgName}</td>
                  <td
                    className="px-3 py-2 text-[#0A0A0A]/60"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.state || '—'}
                  </td>
                  <td className="px-3 py-2 text-[#DC2626]">{realOwner}</td>
                  <td className="px-3 py-2 text-[#0A0A0A]/50 truncate max-w-[200px]">
                    {row.website && (
                      <a
                        href={row.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#059669] hover:underline inline-flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        visit
                      </a>
                    )}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-[#F5F0E8]/30">
                    <td colSpan={5} className="px-3 pb-4 pt-2">
                      <p className="text-[11px] text-[#0A0A0A]/60 mb-2">
                        AI says this site primarily represents <strong className="text-[#DC2626]">{realOwner}</strong>, not {row.orgName}.
                        Reason: {row.extractedFields?.identity_match?.reason || '(no reason given)'}
                      </p>
                      <RepairUrlProposals
                        row={row}
                        callAction={callAction}
                        busy={busyId === row.candidateId}
                        error={error && error.id === row.candidateId ? error.message : null}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RowGrid({ rows, expanded, setExpanded, showEmail, setShowEmail, copied, copyToClipboard, callAction, busyId, error }: SectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {rows.map((row) => {
        const isOpen = expanded === row.candidateId;
        const logo = getLogo(row);
        const repair = isRepair(row);
        return (
          <div
            key={row.candidateId}
            className={`bg-white rounded border ${isOpen ? 'border-[#0A0A0A]/30 ring-1 ring-[#0A0A0A]/10' : 'border-[#0A0A0A]/10'} overflow-hidden`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : row.candidateId)}
              className="w-full text-left p-3 hover:bg-[#F5F0E8]/40 transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <LogoThumb logo={logo} size={40} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm leading-tight truncate">{row.orgName}</h3>
                  <p
                    className="text-[10px] text-[#0A0A0A]/50 mt-0.5"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {row.state || '—'} · {row.suburb || row.city || ''}
                  </p>
                </div>
                {row.candidateConfidence !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${repair ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-[#059669]/10 text-[#059669]'}`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {Math.round(row.candidateConfidence * 100)}%
                  </span>
                )}
              </div>
              <div className="space-y-0.5 text-[11px] text-[#0A0A0A]/70">
                {row.extractedFields.contact_email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0 text-[#0A0A0A]/30" />
                    <span className="truncate">{row.extractedFields.contact_email}</span>
                    <EmailBadge ev={row.extractedFields.email_validation} />
                  </div>
                )}
                {row.extractedFields.contact_phone && (
                  <div
                    className="flex items-center gap-1.5"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <span className="w-3 text-[#0A0A0A]/30">☎</span>
                    <span>{row.extractedFields.contact_phone}</span>
                  </div>
                )}
                {!row.extractedFields.contact_email && !row.extractedFields.contact_phone && (
                  <p className="text-[10px] text-[#0A0A0A]/40 italic">no contact extracted</p>
                )}
              </div>
              {row.lastOutreach && (
                <span
                  className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  sent {new Date(row.lastOutreach.sent_at).toLocaleDateString('en-AU')}
                </span>
              )}
            </button>
            {isOpen && (
              <div className="px-3 pb-3 pt-1 border-t border-[#0A0A0A]/5 bg-[#F5F0E8]/30">
                <RowExpanded
                  row={row}
                  showEmail={showEmail === row.candidateId}
                  setShowEmail={(v) => setShowEmail(v ? row.candidateId : null)}
                  copied={copied === row.candidateId}
                  copyToClipboard={copyToClipboard}
                  callAction={callAction}
                  busy={busyId === row.candidateId}
                  error={error && error.id === row.candidateId ? error.message : null}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ rowsTotal }: { rowsTotal: number }) {
  return (
    <div className="bg-white rounded border border-[#0A0A0A]/10 p-6 text-center text-xs text-[#0A0A0A]/50">
      {rowsTotal === 0
        ? 'No pending-review candidates yet. Run scripts/alma-org-enrichment.mjs.'
        : 'No candidates match your filters.'}
    </div>
  );
}

function LogoThumb({ logo, size }: { logo: string | null; size: number }) {
  if (!logo) {
    return (
      <div
        className="rounded bg-[#F5F0E8] flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Building2 className="text-[#0A0A0A]/20" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      className="rounded object-contain bg-white shrink-0 border border-[#0A0A0A]/5"
      style={{ width: size, height: size }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

function RowExpanded({ row, showEmail, setShowEmail, copied, copyToClipboard, callAction, busy, error }: {
  row: QueueRow;
  showEmail: boolean;
  setShowEmail: (v: boolean) => void;
  copied: boolean;
  copyToClipboard: (text: string, id: string) => void;
  callAction: (
    candidateId: string,
    payload:
      | { action: 'approve'; fields: string[]; overwrite?: boolean }
      | { action: 'reject'; rejection_reason: string }
  ) => Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const draft = draftOutreach(row);
  const repair = isRepair(row);
  const missing = row.completenessBreakdown
    ? (Object.keys(row.completenessBreakdown) as Array<keyof CompletenessBreakdown>)
        .filter((k) => !row.completenessBreakdown![k])
        .map((k) => describeMissing(k))
    : [];

  // Per-field selection — only show fields the extractor actually produced.
  // For each, also surface the current org value (when present) so admin
  // sees both sides of any conflict and can choose to replace.
  const availableFields: Array<{
    key: string;
    label: string;
    value: string;
    currentValue: string | null;
  }> = [
    {
      key: 'email',
      label: 'Email',
      value: row.extractedFields.contact_email,
      currentValue: row.currentEmail,
    },
    {
      key: 'phone',
      label: 'Phone',
      value: row.extractedFields.contact_phone,
      currentValue: row.currentPhone,
    },
    {
      key: 'logo',
      label: 'Logo',
      value: row.extractedFields.logo_url,
      currentValue: row.logoUrl,
    },
    {
      key: 'history',
      label: 'History',
      value: row.extractedFields.history_summary,
      currentValue: row.currentHistory,
    },
    {
      key: 'annual_report',
      label: 'Annual report',
      value: row.extractedFields.annual_report_url,
      currentValue: row.currentAnnualReport,
    },
  ].filter((f) => f.value && typeof f.value === 'string');

  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      availableFields.map((f) => [f.key, !f.currentValue && !!f.value])
    )
  );
  // Per-field "replace" intent — when ticked, the AI value overwrites the
  // existing org value for THIS field only. Lets admin upgrade a stale
  // history without flipping the global Overwrite toggle.
  const [perFieldReplace, setPerFieldReplace] = useState<Record<string, boolean>>({});
  const [overwrite, setOverwrite] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const toggle = (key: string) => setSelected((p) => ({ ...p, [key]: !p[key] }));
  const toggleReplace = (key: string) =>
    setPerFieldReplace((p) => {
      const next = { ...p, [key]: !p[key] };
      // Auto-tick the checkbox when admin opts into replace, so they don't
      // also have to toggle the include checkbox.
      if (next[key]) setSelected((s) => ({ ...s, [key]: true }));
      return next;
    });
  const selectedFields = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  // If any per-field replace is on, we need to send overwrite=true to the API
  // (which then applies to ALL selected fields). For pure first-touch fills
  // overwrite stays off and the helper silently skips already-populated fields.
  const anyPerFieldReplace = Object.values(perFieldReplace).some(Boolean);
  const effectiveOverwrite = overwrite || anyPerFieldReplace;

  const onApprove = () => {
    if (selectedFields.length === 0) return;
    callAction(row.candidateId, {
      action: 'approve',
      fields: selectedFields,
      overwrite: effectiveOverwrite,
    });
  };
  const onReject = () => {
    const reason = rejectReason.trim();
    if (!reason) return;
    callAction(row.candidateId, { action: 'reject', rejection_reason: reason });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/50 mb-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            On file
          </p>
          <KV label="Email" value={row.currentEmail} />
          <KV label="Phone" value={row.currentPhone} />
          <KV label="Website" value={row.website} link />
          <KV label="Claim status" value={row.existingClaim?.status || 'unclaimed'} />
          {row.existingClaim?.contact_name && (
            <KV label="Claim contact" value={row.existingClaim.contact_name} />
          )}
        </div>
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.15em] text-[#DC2626] mb-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            AI candidate
          </p>
          <KV label="Contact name" value={row.extractedFields.contact_name} />
          <KV label="Annual report" value={row.extractedFields.annual_report_url} link />
          <KV label="Logo URL" value={row.extractedFields.logo_url} link />
          {row.extractedFields.history_summary && (
            <div className="mt-1.5">
              <p
                className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/50 mb-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                History
              </p>
              <p className="text-xs text-[#0A0A0A]/70 leading-snug">
                {row.extractedFields.history_summary}
              </p>
            </div>
          )}
          {row.extractedFields.notes && (
            <p
              className="text-[10px] mt-1.5 text-amber-700 italic"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              note: {row.extractedFields.notes}
            </p>
          )}
          {repair && row.extractedFields?.identity_match?.represented_entity_name && (
            <p
              className="text-[10px] mt-1.5 text-[#DC2626]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Site represents: {row.extractedFields.identity_match.represented_entity_name}
            </p>
          )}
        </div>
      </div>

      {missing.length > 0 && (
        <p className="text-[11px] text-[#0A0A0A]/50 mb-3">
          <span className="font-semibold">Missing from profile:</span> {missing.join(', ')}
        </p>
      )}

      {/* Approve / reject panel — only for review rows (not repair) */}
      {!repair && availableFields.length > 0 && (
        <div className="bg-white border border-[#059669]/20 rounded p-3 mb-3">
          <div className="flex items-baseline justify-between mb-2">
            <p
              className="text-[10px] uppercase tracking-[0.15em] text-[#059669]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Promote to org profile
            </p>
            <label className="inline-flex items-center gap-1.5 text-[10px] text-[#0A0A0A]/60 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-3 h-3"
              />
              Overwrite existing
            </label>
          </div>
          <div className="space-y-1.5 mb-3">
            {availableFields.map((f) => {
              const hasConflict = !!f.currentValue && f.currentValue !== f.value;
              const sameValue = !!f.currentValue && f.currentValue === f.value;
              const empty = !f.currentValue;
              return (
                <div
                  key={f.key}
                  className={`px-1.5 py-1 rounded ${
                    hasConflict ? 'bg-amber-50' : empty ? 'bg-[#059669]/5' : 'bg-[#0A0A0A]/[0.02]'
                  }`}
                >
                  <label className="flex items-start gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selected[f.key]}
                      onChange={() => toggle(f.key)}
                      className="w-3 h-3 mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-semibold">{f.label}</span>
                        <span
                          className="text-[9px] uppercase tracking-wide"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {empty ? (
                            <span className="text-[#059669]">new</span>
                          ) : hasConflict ? (
                            <span className="text-amber-700">conflict</span>
                          ) : sameValue ? (
                            <span className="text-[#0A0A0A]/40">same</span>
                          ) : null}
                        </span>
                      </div>
                      {hasConflict ? (
                        <div className="grid grid-cols-2 gap-2 mt-1 text-[10px]">
                          <div>
                            <p
                              className="uppercase tracking-wide text-[9px] text-[#0A0A0A]/40 mb-0.5"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              Current
                            </p>
                            <p className="text-[#0A0A0A]/70 break-words">{f.currentValue}</p>
                          </div>
                          <div>
                            <p
                              className="uppercase tracking-wide text-[9px] text-[#059669] mb-0.5"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              AI proposes
                            </p>
                            <p className="text-[#0A0A0A] break-words">{f.value}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#0A0A0A]/60 mt-0.5 break-words">{f.value}</p>
                      )}
                      {hasConflict && (
                        <label className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!perFieldReplace[f.key]}
                            onChange={() => toggleReplace(f.key)}
                            className="w-3 h-3"
                          />
                          <span>Replace current value with AI value</span>
                        </label>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onApprove}
              disabled={busy || selectedFields.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#059669] text-white text-[11px] font-semibold hover:bg-[#059669]/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Approve {selectedFields.length > 0 && `(${selectedFields.length})`}
            </button>
            <button
              onClick={() => setRejecting((v) => !v)}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DC2626]/40 text-[#DC2626] text-[11px] font-semibold hover:bg-[#DC2626]/5 disabled:opacity-40"
            >
              <XIcon className="w-3 h-3" />
              Reject
            </button>
            {error && (
              <span
                className="text-[10px] text-[#DC2626]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {error}
              </span>
            )}
          </div>
          {rejecting && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g. wrong site, spam, defunct)"
                className="flex-1 px-2 py-1 rounded border border-[#0A0A0A]/15 bg-white text-[11px] focus:outline-none focus:border-[#DC2626]"
                autoFocus
              />
              <button
                onClick={onReject}
                disabled={busy || !rejectReason.trim()}
                className="px-2 py-1 rounded bg-[#DC2626] text-white text-[10px] font-semibold disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm reject'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          onClick={() =>
            copyToClipboard(
              `Subject: ${draft.subject}\n\n${draft.body}`,
              row.candidateId
            )
          }
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A0A0A] text-white text-[11px] font-semibold hover:bg-[#0A0A0A]/90"
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copied' : 'Copy draft'}
        </button>
        <a
          href={`mailto:${row.extractedFields.contact_email || row.currentEmail || ''}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#0A0A0A]/20 text-[11px] font-semibold hover:bg-[#0A0A0A]/5"
        >
          <Mail className="w-3 h-3" />
          Open in mail
        </a>
        <ClaimInviteButton row={row} />
        <OutreachMarkSent
          row={row}
          draft={draft}
        />
        {row.website && (
          <a
            href={row.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#0A0A0A]/20 text-[11px] font-semibold hover:bg-[#0A0A0A]/5"
          >
            <Globe className="w-3 h-3" />
            Site
          </a>
        )}
        <button
          onClick={() => setShowEmail(!showEmail)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#0A0A0A]/20 text-[11px] font-semibold hover:bg-[#0A0A0A]/5 ml-auto"
        >
          {showEmail ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {showEmail ? 'Hide' : 'View'} drafted email
        </button>
      </div>

      {showEmail && (
        <div className="bg-white border border-[#0A0A0A]/10 rounded p-3 text-xs leading-snug">
          <div className="mb-2">
            <span className="font-bold">To: </span>
            {row.extractedFields.contact_email ||
              row.currentEmail ||
              <span className="text-[#DC2626]">(no email — find one first)</span>}
            <span className="ml-3 font-bold">Subject: </span>
            {draft.subject}
          </div>
          <div className="whitespace-pre-wrap font-mono text-[11px] text-[#0A0A0A]/80">
            {draft.body}
          </div>
        </div>
      )}
    </>
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

function RepairUrlProposals({
  row,
  callAction,
  busy,
  error,
}: {
  row: QueueRow;
  callAction: SectionProps['callAction'];
  busy: boolean;
  error: string | null;
}) {
  const discovery = row.provenance?.url_discovery as
    | {
        proposed_urls?: Array<{ url: string; confidence: number; reason: string; rank: number }>;
        needs_human?: boolean;
        reason?: string;
      }
    | undefined;

  const [manual, setManual] = useState('');

  const apply = (url: string) => {
    if (!url) return;
    callAction(row.candidateId, { action: 'update_url', url });
  };

  if (!discovery) {
    return (
      <div className="text-[11px] text-[#0A0A0A]/60">
        <p className="mb-2">
          No URL discovery has run for this candidate yet. Run{' '}
          <code className="px-1 py-0.5 bg-[#0A0A0A]/5 rounded text-[10px]">
            node scripts/alma-org-url-discovery.mjs --apply
          </code>{' '}
          to fetch suggestions, or set the URL manually:
        </p>
        <ManualUrlInput
          value={manual}
          onChange={setManual}
          onApply={() => apply(manual)}
          busy={busy}
          error={error}
        />
      </div>
    );
  }

  const proposals = discovery.proposed_urls || [];

  return (
    <div className="text-[11px]">
      {proposals.length === 0 ? (
        <p className="text-[#0A0A0A]/60 mb-2">
          URL discovery ran but found no obvious replacement. {discovery.reason || ''}
        </p>
      ) : (
        <div className="space-y-1 mb-3">
          <p
            className="text-[10px] uppercase tracking-[0.15em] text-[#059669] mb-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            AI-proposed URLs
          </p>
          {proposals.map((p, i) => (
            <div
              key={`${p.url}-${i}`}
              className="flex items-center gap-2 bg-white border border-[#0A0A0A]/10 rounded px-2 py-1.5"
            >
              <span
                className="text-[10px] text-[#0A0A0A]/40 w-4 shrink-0"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {i + 1}.
              </span>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#059669] hover:underline truncate flex-1"
              >
                {p.url}
              </a>
              {typeof p.confidence === 'number' && p.confidence > 0 && (
                <span
                  className="text-[10px] text-[#0A0A0A]/50 shrink-0"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {Math.round(p.confidence * 100)}%
                </span>
              )}
              <button
                onClick={() => apply(p.url)}
                disabled={busy}
                className="px-2 py-0.5 rounded bg-[#059669] text-white text-[10px] font-semibold hover:bg-[#059669]/90 disabled:opacity-40 shrink-0"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Use this'}
              </button>
            </div>
          ))}
          {proposals[0]?.reason && (
            <p className="text-[10px] text-[#0A0A0A]/50 italic pl-6">{proposals[0].reason}</p>
          )}
        </div>
      )}
      <ManualUrlInput
        value={manual}
        onChange={setManual}
        onApply={() => apply(manual)}
        busy={busy}
        error={error}
      />
    </div>
  );
}

function ClaimInviteButton({ row }: { row: QueueRow }) {
  const email = row.extractedFields.contact_email || row.currentEmail;
  if (!email) return null;
  const draft = draftClaimInvite(row);
  const href = `mailto:${email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#059669]/40 text-[#059669] text-[11px] font-semibold hover:bg-[#059669]/5"
      title="Send a focused claim invitation (one ask: claim the entry)"
    >
      <Send className="w-3 h-3" />
      Claim invite
    </a>
  );
}

function OutreachMarkSent({
  row,
  draft,
}: {
  row: QueueRow;
  draft: { subject: string; body: string };
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>(
    row.lastOutreach ? 'done' : 'idle'
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const router = useRouter();

  if (state === 'done') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-amber-700 bg-amber-100 rounded"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <Check className="w-3 h-3" />
        logged
      </span>
    );
  }

  const onClick = async () => {
    setState('busy');
    setErrMsg(null);
    try {
      const email = row.extractedFields.contact_email || row.currentEmail;
      const res = await fetch('/api/admin/alma/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: row.orgId,
          attempt_kind: 'email',
          email_to: email || null,
          email_subject: draft.subject,
          email_body: draft.body,
          response_status: 'sent',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setState('done');
      router.refresh();
    } catch (e: any) {
      setErrMsg(e?.message || 'Mark-sent failed');
      setState('error');
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        disabled={state === 'busy'}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-500/40 text-amber-700 text-[11px] font-semibold hover:bg-amber-50 disabled:opacity-40"
        title="Log that you sent this email so it doesn't show in the queue again"
      >
        {state === 'busy' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        Mark sent
      </button>
      {state === 'error' && errMsg && (
        <span
          className="text-[10px] text-[#DC2626]"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {errMsg}
        </span>
      )}
    </>
  );
}

function EmailBadge({ ev }: { ev: any }) {
  if (!ev || typeof ev !== 'object') return null;
  if (ev.kind === 'invalid') {
    return (
      <span
        className="text-[9px] px-1 rounded bg-[#DC2626]/10 text-[#DC2626]"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        title={ev.reason || 'invalid'}
      >
        invalid
      </span>
    );
  }
  if (ev.kind === 'valid' && ev.generic) {
    return (
      <span
        className="text-[9px] px-1 rounded bg-[#059669]/10 text-[#059669]"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        title="Generic mailbox (info@, contact@ — safe to publish)"
      >
        generic
      </span>
    );
  }
  if (ev.kind === 'valid') {
    return (
      <span
        className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-700"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        title="Personal mailbox — needs explicit consent before publishing"
      >
        personal
      </span>
    );
  }
  return null;
}

function ManualUrlInput({
  value,
  onChange,
  onApply,
  busy,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="https://example.com.au"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 rounded border border-[#0A0A0A]/15 bg-white text-[11px] focus:outline-none focus:border-[#0A0A0A]/40"
        />
        <button
          onClick={onApply}
          disabled={busy || !value.trim()}
          className="px-2.5 py-1 rounded bg-[#0A0A0A] text-white text-[11px] font-semibold disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Set URL'}
        </button>
      </div>
      {error && (
        <p
          className="text-[10px] text-[#DC2626] mt-1"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
