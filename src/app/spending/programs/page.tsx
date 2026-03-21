import { headers } from 'next/headers';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Government Programs | JusticeHub',
  description: 'All government youth justice programs tracked against actual spending',
};

const STATES = ['ALL', 'QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  implemented: { bg: 'bg-emerald-900/40', text: 'text-emerald-400', label: 'Implemented' },
  in_progress: { bg: 'bg-amber-900/40', text: 'text-amber-400', label: 'In Progress' },
  announced: { bg: 'bg-blue-900/40', text: 'text-blue-400', label: 'Announced' },
  abandoned: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'Abandoned' },
};

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', { year: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function getRequestBaseUrl(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const protocol = h.get('x-forwarded-proto') || 'http';
  return host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004');
}

interface Program {
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
  jurisdiction: string | null;
  interventionCount: number;
}

export default async function AllProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state: stateFilter } = await searchParams;
  const activeState = stateFilter?.toUpperCase() || 'ALL';

  const url = activeState === 'ALL'
    ? `${getRequestBaseUrl()}/api/spending/programs`
    : `${getRequestBaseUrl()}/api/spending/programs?state=${activeState}`;

  const res = await fetch(url, { cache: 'no-store' });
  const data = res.ok ? await res.json() : { programs: [], stats: { total: 0, totalPromised: 0, statusBreakdown: {}, withBudget: 0 } };

  const programs: Program[] = data.programs || [];
  const stats = data.stats || {};

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Breadcrumb */}
      <nav className="border-b border-gray-800 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 font-mono text-xs text-gray-400">
          <Link href="/spending" className="hover:text-white transition-colors">Spending</Link>
          <span>/</span>
          <span className="text-white">Government Programs</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Government Programs
        </h1>
        <p className="font-mono text-sm text-gray-400 mb-8">
          {stats.total || 0} programs tracked — {stats.withBudget || 0} with budget figures — {formatDollars(stats.totalPromised || 0)} total promised
        </p>

        {/* State filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STATES.map((s) => (
            <Link
              key={s}
              href={s === 'ALL' ? '/spending/programs' : `/spending/programs?state=${s}`}
              className={`px-3 py-1.5 font-mono text-xs border transition-colors ${
                activeState === s
                  ? 'border-white bg-white text-[#0A0A0A] font-bold'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {/* Status summary */}
        {stats.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            {Object.entries(stats.statusBreakdown as Record<string, number>).map(([status, count]) => {
              const style = STATUS_COLORS[status] || STATUS_COLORS.announced;
              return (
                <span key={status} className={`font-mono text-xs px-3 py-1 ${style.bg} ${style.text}`}>
                  {count} {style.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Program grid */}
        {programs.length === 0 ? (
          <p className="text-gray-500 font-mono text-sm">No programs found for this filter.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((program) => {
              const statusStyle = STATUS_COLORS[program.status || 'announced'] || STATUS_COLORS.announced;

              return (
                <Link
                  key={program.id}
                  href={`/spending/programs/${program.id}`}
                  className="border border-gray-700 p-4 flex flex-col hover:border-gray-500 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-white leading-tight flex-1 group-hover:text-[#059669] transition-colors">
                      {program.name}
                    </h3>
                    <span className={`text-xs font-mono px-2 py-0.5 whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                  </div>

                  {program.description && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{program.description}</p>
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
                      {program.jurisdiction && (
                        <span className="text-xs font-mono text-gray-500 mr-2">{program.jurisdiction}</span>
                      )}
                      {program.announcedDate && (
                        <span className="text-xs font-mono text-gray-500">
                          {formatDate(program.announcedDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
                    <div className="flex flex-wrap gap-1">
                      {program.targetCohort?.slice(0, 3).map((cohort) => (
                        <span key={cohort} className="text-xs font-mono px-1.5 py-0.5 bg-gray-800 text-gray-400">
                          {cohort}
                        </span>
                      ))}
                    </div>
                    {program.interventionCount > 0 && (
                      <span className="text-xs font-mono text-[#059669]">
                        {program.interventionCount} intervention{program.interventionCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
