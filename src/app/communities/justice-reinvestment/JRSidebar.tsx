'use client';

import Link from 'next/link';
import type { JrSite } from '@/lib/communities/justice-reinvestment';
import type {
  JrSiteDetail,
  JrSiteConnection,
} from '@/lib/communities/justice-reinvestment';

const C = {
  cream: '#f8f1e6',
  surface: '#fff8ef',
  border: '#eadfce',
  ink: '#2b2530',
  body: '#584b40',
  muted: '#8d6a44',
  purple: '#4a2560',
};

const SERIF = "'Cormorant Garamond', Georgia, serif";

/** Two-letter initials from a display name, for the fallback identity mark. */
function initialsOf(name: string): string {
  const words = name
    .replace(/[(),]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'JR';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatAmount(amount: number | null): string {
  if (amount == null) return 'Amount not recorded';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProfileStatusChip({ detail }: { detail: JrSiteDetail | null }) {
  const claimed =
    detail?.claimStatus === 'verified' ||
    detail?.claimStatus === 'community_verified';
  const label =
    claimed
      ? 'Community-claimed'
      : detail?.claimStatus === 'pending'
        ? 'Claim pending'
        : detail?.orgVerificationStatus === 'verified' ||
            detail?.orgVerificationStatus === 'acnc_verified'
          ? 'Verified organisation'
          : 'On record';

  return (
    <span
      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{ borderColor: '#e6d7c1', color: '#7d5f3d' }}
      title={
        detail?.claimContactName
          ? `Claimed by ${detail.claimContactName}`
          : undefined
      }
    >
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: C.muted }}
    >
      {children}
    </p>
  );
}

export default function JRSidebar({
  site,
  detail,
  connection,
  relatedDisplayNames,
  onClose,
  onSelectRelated,
}: {
  site: JrSite;
  detail: JrSiteDetail | null;
  connection: JrSiteConnection | null;
  /** match_name -> display_name, to label related-site links. */
  relatedDisplayNames: Record<string, string>;
  onClose: () => void;
  onSelectRelated: (matchName: string) => void;
}) {
  const place = [site.town, site.state].filter(Boolean).join(', ');
  const initials = initialsOf(site.displayName);
  const leadOrg = detail?.orgName ?? site.org;
  const siteProgram = detail?.siteProgram ?? null;
  const programs = detail?.programs ?? [];
  const funding = detail?.funding ?? [];
  const isClaimed =
    detail?.claimStatus === 'verified' ||
    detail?.claimStatus === 'community_verified';
  const profileHref = detail?.orgSlug
    ? `/organizations/${detail.orgSlug}`
    : site.profileSlug
      ? `/communities/${site.profileSlug}`
      : null;
  const claimHref = detail?.orgSlug
    ? `/organizations/${detail.orgSlug}#claim-organization`
    : site.profileSlug
    ? `/communities/${site.profileSlug}/claim`
    : '/communities';

  return (
    <aside
      className="flex h-full w-full flex-col"
      style={{ background: C.cream, fontFamily: 'Inter, system-ui, sans-serif' }}
      role="dialog"
      aria-label={`${site.displayName} details`}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 border-b px-6 py-5"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {site.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.logoUrl}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 flex-none rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-sm font-semibold"
              style={{
                background: C.purple,
                color: '#f1e6f7',
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                letterSpacing: '0.04em',
              }}
            >
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <h2
              className="text-2xl leading-7"
              style={{ fontFamily: SERIF, fontWeight: 500, color: C.ink }}
            >
              {site.displayName}
            </h2>
            {place ? (
              <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
                {place}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex-none rounded-full border px-2.5 py-1 text-sm font-semibold transition-colors duration-150"
          style={{ borderColor: C.border, color: C.body }}
        >
          &times;
        </button>
      </div>

      {/* Scroll body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <ProfileStatusChip detail={detail} />
          {leadOrg ? (
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-medium"
              style={{ borderColor: C.border, color: C.body }}
            >
              {leadOrg}
            </span>
          ) : null}
        </div>

        {/* About */}
        <section className="mt-6">
          <SectionLabel>About</SectionLabel>
          {site.blurb ? (
            <p
              className="mt-3 text-sm leading-6"
              style={{ color: C.body }}
            >
              {site.blurb}
            </p>
          ) : null}
          {detail?.description && detail.description !== site.blurb ? (
            <p className="mt-3 text-sm leading-6" style={{ color: '#6b5d50' }}>
              {detail.description}
            </p>
          ) : null}
        </section>

        <section className="mt-6">
          <SectionLabel>Profile record</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] border p-3" style={{ borderColor: C.border, background: C.surface }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                Public profile
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: C.ink }}>
                {profileHref ? 'Linked' : 'To connect'}
              </p>
            </div>
            <div className="rounded-[14px] border p-3" style={{ borderColor: C.border, background: C.surface }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                Story consent
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: C.ink }}>
                {isClaimed ? 'Org controlled' : 'Needs setup'}
              </p>
            </div>
            <div className="rounded-[14px] border p-3" style={{ borderColor: C.border, background: C.surface }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                Data status
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: C.ink }}>
                {detail ? 'Matched record' : 'Curated only'}
              </p>
            </div>
            <div className="rounded-[14px] border p-3" style={{ borderColor: C.border, background: C.surface }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                Network
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: C.ink }}>
                {connection?.relatedSites.length ? `${connection.relatedSites.length} links` : 'Open'}
              </p>
            </div>
          </div>
        </section>

        {/* Exact site program */}
        {siteProgram ? (
          <section className="mt-7">
            <SectionLabel>This site</SectionLabel>
            <article
              className="mt-3 rounded-[16px] border p-4"
              style={{ borderColor: C.border, background: C.surface }}
            >
              <div className="flex flex-wrap gap-2">
                {siteProgram.type ? (
                  <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: C.border, color: C.muted }}>
                    {siteProgram.type}
                  </span>
                ) : null}
                {siteProgram.evidenceLevel ? (
                  <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: C.border, color: C.muted }}>
                    {siteProgram.evidenceLevel}
                  </span>
                ) : null}
              </div>
              <p
                className="mt-3 text-base leading-6"
                style={{ fontFamily: SERIF, fontWeight: 500, color: C.ink }}
              >
                {siteProgram.name}
              </p>
              {siteProgram.description ? (
                <p className="mt-1.5 text-[13px] leading-5" style={{ color: C.body }}>
                  {siteProgram.description}
                </p>
              ) : null}
            </article>
          </section>
        ) : null}

        {/* Other lead organisation programs */}
        {programs.length > 0 ? (
          <section className="mt-7">
            <SectionLabel>Lead organisation also supports</SectionLabel>
            <ul className="mt-3 space-y-3">
              {programs.map((program, i) => (
                <li
                  key={`${program.name}-${i}`}
                  className="rounded-[16px] border p-4"
                  style={{ borderColor: C.border, background: C.surface }}
                >
                  <p
                    className="text-base leading-6"
                    style={{ fontFamily: SERIF, fontWeight: 500, color: C.ink }}
                  >
                    {program.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {program.type ? (
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ borderColor: C.border, color: C.muted }}>
                        {program.type}
                      </span>
                    ) : null}
                    {program.evidenceLevel ? (
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ borderColor: C.border, color: C.muted }}>
                        {program.evidenceLevel}
                      </span>
                    ) : null}
                  </div>
                  {program.description ? (
                    <p
                      className="mt-1.5 text-[13px] leading-5"
                      style={{ color: C.body }}
                    >
                      {program.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Funding */}
        {funding.length > 0 ? (
          <section className="mt-7">
            <SectionLabel>Funding attached to lead organisation</SectionLabel>
            <ul className="mt-3 space-y-2">
              {funding.map((record, i) => (
                <li
                  key={`fund-${i}`}
                  className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-b-0"
                  style={{ borderColor: C.border }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: C.ink,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatAmount(record.amountDollars)}
                  </span>
                  {record.source ? (
                    <span
                      className="text-right text-[12px] leading-5"
                      style={{ color: C.muted }}
                    >
                      {record.source}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Connections (optional curated layer) */}
        {connection &&
        (connection.abn ||
          connection.charityStatus ||
          connection.relatedSites.length > 0) ? (
          <section className="mt-7">
            <SectionLabel>Connections</SectionLabel>
            <div className="mt-3 space-y-2 text-sm" style={{ color: C.body }}>
              {connection.abn ? (
                <p>
                  <span style={{ color: C.muted }}>ABN: </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {connection.abn}
                  </span>
                </p>
              ) : null}
              {connection.charityStatus ? (
                <p>
                  <span style={{ color: C.muted }}>Charity status: </span>
                  {connection.charityStatus}
                </p>
              ) : null}
              {connection.relatedSites.length > 0 ? (
                <div>
                  <p style={{ color: C.muted }}>Related sites</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {connection.relatedSites.map((related) => (
                      <li key={related}>
                        <button
                          type="button"
                          onClick={() => onSelectRelated(related)}
                          className="rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150"
                          style={{ borderColor: C.border, color: C.purple }}
                        >
                          {relatedDisplayNames[related] ?? related}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {/* Footer */}
      <div
        className="flex flex-wrap items-center gap-3 border-t px-6 py-4"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <Link
          href={`/communities/justice-reinvestment/${site.siteSlug}`}
          className="rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-150"
          style={{ background: C.purple, color: '#f1e6f7' }}
        >
          Full site profile &rarr;
        </Link>
        {profileHref ? (
          <Link
            href={profileHref}
            className="rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-150"
            style={{ borderColor: C.border, color: C.body, background: C.surface }}
          >
            Open organisation &rarr;
          </Link>
        ) : null}
        {site.website ? (
          <Link
            href={site.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-150"
            style={{
              border: `1px solid ${C.border}`,
              color: C.body,
              background: C.surface,
            }}
          >
            Visit website &rarr;
          </Link>
        ) : null}
        {!isClaimed ? (
          <Link
            href={claimHref}
            className="rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-150"
            style={{ borderColor: C.border, color: C.body }}
          >
            Claim this profile &rarr;
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
