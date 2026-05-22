import { ExternalLink } from 'lucide-react';

export interface AnnualReportFacts {
  report_year?: number | null;
  people_served?: { number?: number | null; definition?: string | null } | null;
  top_outcomes?: string[] | null;
  funders?: string[] | null;
  board_members?: string[] | null;
  programs?: string[] | null;
  revenue_aud?: number | null;
  expenditure_aud?: number | null;
  staff_count?: number | null;
  volunteers_count?: number | null;
  cultural_indicators?: string[] | null;
  notes?: string | null;
  extracted_at?: string | null;
  extractor?: { provider?: string | null; model?: string | null } | null;
}

function formatMoney(n: number | null | undefined): string | null {
  if (!n || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

/**
 * Renders structured annual-report facts on an org page.
 * Skips rendering entirely when no facts are present so it never
 * appears as an empty section.
 */
export function AnnualReportFactsSection({
  facts,
  annualReportUrl,
  orgName,
  variant = 'editorial',
}: {
  facts: AnnualReportFacts | null | undefined;
  annualReportUrl?: string | null;
  orgName: string;
  variant?: 'editorial' | 'compact';
}) {
  if (!facts || typeof facts !== 'object') return null;

  const hasContent =
    facts.report_year ||
    facts.people_served?.number ||
    (facts.top_outcomes && facts.top_outcomes.length > 0) ||
    (facts.funders && facts.funders.length > 0) ||
    facts.revenue_aud ||
    facts.staff_count;
  if (!hasContent) return null;

  const yearLabel = facts.report_year ? `${facts.report_year} annual report` : 'annual report';

  if (variant === 'compact') {
    // Compact one-line variant for use inside admin queues or sidebars.
    const bits = [
      facts.report_year ? `FY${facts.report_year}` : null,
      facts.people_served?.number ? `${facts.people_served.number.toLocaleString()} served` : null,
      facts.staff_count ? `${facts.staff_count} staff` : null,
      facts.revenue_aud ? formatMoney(facts.revenue_aud) : null,
    ].filter(Boolean);
    return (
      <div className="text-xs text-[#0A0A0A]/70">
        From {yearLabel}: {bits.join(' · ')}
      </div>
    );
  }

  return (
    <section className="bg-white border-y border-[#0A0A0A]/10 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-baseline justify-between mb-6">
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            From the {yearLabel}
          </h2>
          {annualReportUrl && (
            <a
              href={annualReportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#0A0A0A]/60 hover:text-[#0A0A0A]"
            >
              Full PDF
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Top-line numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {facts.people_served?.number && (
            <StatBlock
              value={facts.people_served.number.toLocaleString()}
              label={facts.people_served.definition || 'people supported'}
            />
          )}
          {facts.staff_count && <StatBlock value={facts.staff_count.toLocaleString()} label="staff" />}
          {facts.volunteers_count && (
            <StatBlock value={facts.volunteers_count.toLocaleString()} label="volunteers" />
          )}
          {facts.revenue_aud && <StatBlock value={formatMoney(facts.revenue_aud)!} label="revenue" />}
        </div>

        {/* Outcomes */}
        {facts.top_outcomes && facts.top_outcomes.length > 0 && (
          <div className="mb-8">
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/40 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              What they reported
            </p>
            <ul className="space-y-2 text-sm text-[#0A0A0A]/80">
              {facts.top_outcomes.slice(0, 5).map((o, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#059669] shrink-0">·</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Funders + programs in two columns when both present */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {facts.funders && facts.funders.length > 0 && (
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/40 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Funders + partners
              </p>
              <div className="flex flex-wrap gap-1.5">
                {facts.funders.slice(0, 12).map((f, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/80"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {facts.programs && facts.programs.length > 0 && (
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/40 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Programs
              </p>
              <div className="flex flex-wrap gap-1.5">
                {facts.programs.slice(0, 12).map((p, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/80"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {facts.cultural_indicators && facts.cultural_indicators.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#0A0A0A]/5">
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/40 mb-2"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Cultural context
            </p>
            <ul className="text-xs text-[#0A0A0A]/70 space-y-1">
              {facts.cultural_indicators.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Provenance footer */}
        <p
          className="text-[10px] text-[#0A0A0A]/30 mt-8 pt-4 border-t border-[#0A0A0A]/5"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Auto-extracted from {orgName}'s annual report PDF
          {facts.extractor?.provider ? ` via ${facts.extractor.provider}` : ''}
          {facts.extracted_at
            ? ` on ${new Date(facts.extracted_at).toLocaleDateString('en-AU')}`
            : ''}
          . Numbers reflect what the report claims, not independent verification.
        </p>
      </div>
    </section>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#0A0A0A]/50 mt-0.5">{label}</p>
    </div>
  );
}
