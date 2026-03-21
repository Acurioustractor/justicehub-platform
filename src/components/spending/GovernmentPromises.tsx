'use client';

import Link from 'next/link';

interface GovernmentProgram {
  id: string;
  name: string;
  programType: string | null;
  announcedDate: string | null;
  status: string | null;
  budgetAmount: number | null;
  description: string | null;
  url: string | null;
  minister: string | null;
  department: string | null;
  targetCohort: string[] | null;
}

interface PromiseVsReality {
  totalPromised: number;
  totalActualFunding: number;
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  implemented: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Implemented' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Progress' },
  announced: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Announced' },
  abandoned: { bg: 'bg-red-100', text: 'text-red-800', label: 'Abandoned' },
};

export default function GovernmentPromises({
  programs,
  promiseVsReality,
  jurisdiction,
}: {
  programs: GovernmentProgram[];
  promiseVsReality: PromiseVsReality;
  jurisdiction?: string;
}) {
  if (!programs.length) return null;

  const withBudget = programs.filter((p) => p.budgetAmount && p.budgetAmount > 0);
  const statusCounts = programs.reduce<Record<string, number>>((acc, p) => {
    const s = p.status || 'announced';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="py-12 px-6 bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-2xl font-bold tracking-tight mb-1 text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Government Promises
        </h2>
        <p className="font-mono text-xs text-gray-400 mb-6">
          Announced programs tracked against actual spending
        </p>

        {/* Promise vs Reality summary */}
        {(promiseVsReality.totalPromised > 0 || promiseVsReality.totalActualFunding > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Promised</p>
              <p
                className="text-2xl font-bold text-white mt-1"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {formatDollars(promiseVsReality.totalPromised)}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Actual Spending</p>
              <p
                className="text-2xl font-bold text-white mt-1"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {formatDollars(promiseVsReality.totalActualFunding)}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Programs Tracked</p>
              <p
                className="text-2xl font-bold text-white mt-1"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {programs.length}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Status</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const style = STATUS_COLORS[status] || STATUS_COLORS.announced;
                  return (
                    <span
                      key={status}
                      className={`text-xs font-mono px-2 py-0.5 ${style.bg} ${style.text}`}
                    >
                      {count} {style.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Program cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.slice(0, 12).map((program) => {
            const statusStyle = STATUS_COLORS[program.status || 'announced'] || STATUS_COLORS.announced;

            return (
              <div key={program.id} className="border border-gray-700 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-white leading-tight flex-1">
                    <Link
                      href={`/spending/programs/${program.id}`}
                      className="hover:text-[#059669] transition-colors"
                    >
                      {program.name}
                    </Link>
                    {program.url && (
                      <a
                        href={program.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block ml-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                        title="Official source"
                      >
                        <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </h3>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                {program.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {program.description}
                  </p>
                )}

                <div className="mt-auto flex items-end justify-between">
                  <div>
                    {program.budgetAmount ? (
                      <span
                        className="text-lg font-bold text-[#059669]"
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        {formatDollars(program.budgetAmount)}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-gray-500">No $ figure</span>
                    )}
                  </div>
                  <div className="text-right">
                    {program.announcedDate && (
                      <p className="text-xs font-mono text-gray-500">
                        {formatDate(program.announcedDate)}
                      </p>
                    )}
                    {program.minister && (
                      <p className="text-xs text-gray-500 truncate max-w-[150px]" title={program.minister}>
                        {program.minister}
                      </p>
                    )}
                  </div>
                </div>

                {program.targetCohort && program.targetCohort.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-800">
                    {program.targetCohort.slice(0, 3).map((cohort) => (
                      <span
                        key={cohort}
                        className="text-xs font-mono px-1.5 py-0.5 bg-gray-800 text-gray-400"
                      >
                        {cohort}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {programs.length > 12 && (
          <div className="text-center mt-6">
            <Link
              href={jurisdiction ? `/spending/programs?state=${jurisdiction}` : '/spending/programs'}
              className="inline-block font-mono text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 transition-colors"
            >
              View all {programs.length} programs →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
