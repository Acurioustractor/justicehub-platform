// Governance v1 — shared "not legal advice" disclaimer + CC BY-NC license notice.
//
// Single source of truth for the disclaimer wording so it stays identical
// everywhere it appears. Server component, no client JS. Two layouts via the
// `tone` prop:
//   - `inline`  : thin one-line bar (used under the explore search header)
//   - `footer`  : full block with license line (case + campaign profiles)
//
// Editorial warmth tokens, matching the Justice Matrix profile pages
// (cream surface, deep purple ink, warm gold kicker). No em dashes.

import React from 'react';

// The disclaimer wording. Keep this exact string in one place.
export const DISCLAIMER_FULL =
  'This is a research and reference resource, not legal advice. Summaries are prepared from public sources and may be incomplete or out of date. Always read the original judgment or document and consult a qualified lawyer in the relevant jurisdiction before acting.';

// The short one-line variant shown on the inline bar.
export const DISCLAIMER_SHORT =
  'Research resource, not legal advice. Read the original source before acting.';

// The CC BY-NC license line. Applies to JusticeHub-authored narrative only.
export const LICENSE_LEAD =
  'Narrative summaries on this page are licensed';
export const LICENSE_TAIL =
  '. Reuse them with attribution to JusticeHub for non-commercial purposes. Original judgments and source documents remain under their own terms; follow the authoritative link for the source of record.';

const CC_BY_NC_URL = 'https://creativecommons.org/licenses/by-nc/4.0/';

export function LegalDisclaimer({
  tone = 'footer',
  showLicense = true,
}: {
  tone?: 'inline' | 'footer';
  // License line only applies where JusticeHub publishes narrative. Allow
  // callers to suppress it (e.g. the explore bar where space is tight, though
  // the explore footer keeps it on).
  showLicense?: boolean;
}) {
  if (tone === 'inline') {
    return (
      <div
        className="w-full border-b"
        style={{ background: '#f3eadb', borderColor: '#e6d7c1', color: '#5e5145' }}
        role="note"
        aria-label="Disclaimer"
      >
        <details className="max-w-7xl mx-auto px-6 md:px-10 py-2">
          <summary
            className="cursor-pointer text-[12px] leading-5 list-none [&::-webkit-details-marker]:hidden"
            style={{ color: '#5e5145' }}
          >
            <span className="font-semibold" style={{ color: '#8d6a44' }}>
              Note
            </span>{' '}
            {DISCLAIMER_SHORT}{' '}
            <span className="underline" style={{ color: '#4a2560' }}>
              Read full disclaimer
            </span>
          </summary>
          <p className="mt-2 text-[12px] leading-5 max-w-3xl" style={{ color: '#5e5145' }}>
            {DISCLAIMER_FULL}
          </p>
        </details>
      </div>
    );
  }

  // footer block
  return (
    <div
      className="rounded-[18px] p-5 md:p-6 border"
      style={{ background: '#f3eadb', borderColor: '#e6d7c1' }}
      role="note"
      aria-label="Disclaimer and licence"
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-3"
        style={{ color: '#8d6a44' }}
      >
        Disclaimer and licence
      </div>
      <p className="text-[13px] leading-6" style={{ color: '#5e5145' }}>
        {DISCLAIMER_FULL}
      </p>
      {showLicense && (
        <p className="text-[13px] leading-6 mt-3" style={{ color: '#5e5145' }}>
          {LICENSE_LEAD}{' '}
          <a
            href={CC_BY_NC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: '#4a2560' }}
          >
            CC BY-NC 4.0
          </a>
          {LICENSE_TAIL}
        </p>
      )}
    </div>
  );
}

export default LegalDisclaimer;
