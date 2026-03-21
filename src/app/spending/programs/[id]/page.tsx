import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

function getRequestBaseUrl(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const protocol = h.get('x-forwarded-proto') || 'http';
  return host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004');
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
    return new Date(dateStr).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  implemented: { bg: 'bg-emerald-900/40', text: 'text-emerald-400', label: 'Implemented' },
  in_progress: { bg: 'bg-amber-900/40', text: 'text-amber-400', label: 'In Progress' },
  announced: { bg: 'bg-blue-900/40', text: 'text-blue-400', label: 'Announced' },
  abandoned: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'Abandoned' },
};

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'text-emerald-400',
  'Effective (strong evaluation, positive outcomes)': 'text-emerald-400',
  'Promising (community-endorsed, emerging evidence)': 'text-amber-400',
  'Indigenous-led (culturally grounded, community authority)': 'text-blue-400',
  'Untested (theory/pilot stage)': 'text-gray-500',
};

function evidenceShortLabel(level: string | null): string {
  if (!level) return 'Unknown';
  const match = level.match(/^(\w[\w-]*)/);
  return match ? match[1] : level;
}

interface ProgramDetail {
  program: {
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
  };
  interventions: {
    id: string;
    name: string;
    description: string | null;
    evidenceLevel: string | null;
    costPerYoungPerson: number | null;
    organizationName: string | null;
  }[];
  organisations: {
    id: string;
    name: string;
    abn: string | null;
    state: string | null;
    website: string | null;
  }[];
  funding: {
    id: string;
    source: string;
    amount: number;
    year: string | null;
    programName: string;
    recipientName: string | null;
    recipientAbn: string | null;
    state: string | null;
  }[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Program ${id} | JusticeHub`,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`${getRequestBaseUrl()}/api/spending/programs/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) notFound();

  const data: ProgramDetail = await res.json();
  const { program, interventions, organisations, funding } = data;

  const statusStyle = STATUS_COLORS[program.status || 'announced'] || STATUS_COLORS.announced;
  const totalFundingAmount = funding.reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Breadcrumb */}
      <nav className="border-b border-gray-800 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 font-mono text-xs text-gray-400">
          <Link href="/spending" className="hover:text-white transition-colors">Spending</Link>
          <span>/</span>
          <Link href="/spending/programs" className="hover:text-white transition-colors">Programs</Link>
          <span>/</span>
          <span className="text-white truncate max-w-[200px]">{program.name}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start gap-3 mb-4">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight text-white flex-1"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {program.name}
            </h1>
            <span className={`text-sm font-mono px-3 py-1 whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 font-mono text-sm text-gray-400 mb-6">
            {program.jurisdiction && <span>{program.jurisdiction}</span>}
            {program.department && <span>{program.department}</span>}
            {program.minister && <span>Minister: {program.minister}</span>}
            {program.announcedDate && <span>{formatDate(program.announcedDate)}</span>}
          </div>

          {/* Budget + funding comparison */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Promised Budget</p>
              <p className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {program.budgetAmount ? formatDollars(program.budgetAmount) : '—'}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Actual Funding Found</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', color: totalFundingAmount > 0 ? '#059669' : undefined }}>
                {totalFundingAmount > 0 ? formatDollars(totalFundingAmount) : '—'}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Linked Interventions</p>
              <p className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {interventions.length}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-400">Delivering Orgs</p>
              <p className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {organisations.length}
              </p>
            </div>
          </div>

          {/* Target cohort */}
          {program.targetCohort && program.targetCohort.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {program.targetCohort.map((cohort) => (
                <span key={cohort} className="text-xs font-mono px-2 py-1 bg-gray-800 text-gray-300">
                  {cohort}
                </span>
              ))}
            </div>
          )}

          {program.url && (
            <a
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#059669] hover:text-emerald-300 transition-colors"
            >
              Official source
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Description */}
        {program.description && (
          <section className="mb-10 border border-gray-700 p-6">
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Description
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {program.description}
            </p>
          </section>
        )}

        {/* Organisations */}
        {organisations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Delivering Organisations ({organisations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organisations.map((org) => (
                <div key={org.id} className="border border-gray-700 p-4">
                  <h3 className="font-bold text-sm text-white mb-1">{org.name}</h3>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-gray-400">
                    {org.abn && <span>ABN {org.abn}</span>}
                    {org.state && <span>{org.state}</span>}
                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#059669] hover:text-emerald-300 transition-colors"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Linked Interventions */}
        {interventions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Linked Interventions ({interventions.length})
            </h2>
            <div className="space-y-3">
              {interventions.map((intv) => (
                <Link
                  key={intv.id}
                  href={`/intelligence/interventions/${intv.id}`}
                  className="block border border-gray-700 p-4 hover:border-gray-500 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-white group-hover:text-[#059669] transition-colors">
                        {intv.name}
                      </h3>
                      {intv.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{intv.description}</p>
                      )}
                      {intv.organizationName && (
                        <p className="text-xs text-gray-500 mt-1">Delivered by: {intv.organizationName}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {intv.evidenceLevel && (
                        <span className={`text-xs font-mono ${EVIDENCE_COLORS[intv.evidenceLevel] || 'text-gray-500'}`}>
                          {evidenceShortLabel(intv.evidenceLevel)}
                        </span>
                      )}
                      {intv.costPerYoungPerson != null && (
                        <p className="text-xs font-mono text-gray-400 mt-1">
                          {formatDollars(intv.costPerYoungPerson)}/youth
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Funding Records */}
        {funding.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Funding Records ({funding.length})
            </h2>
            <div className="border border-gray-700 overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="text-left p-3">Year</th>
                    <th className="text-left p-3">Recipient</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3">Source</th>
                    <th className="text-left p-3">State</th>
                  </tr>
                </thead>
                <tbody>
                  {funding.map((f) => (
                    <tr key={f.id} className="border-b border-gray-800 text-gray-300">
                      <td className="p-3">{f.year || '—'}</td>
                      <td className="p-3 max-w-[200px] truncate">{f.recipientName || '—'}</td>
                      <td className="p-3 text-right text-[#059669] font-bold">{formatDollars(f.amount)}</td>
                      <td className="p-3 text-gray-500">{f.source}</td>
                      <td className="p-3 text-gray-500">{f.state || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-mono text-xs text-gray-500 mt-2">
              Total: <span className="text-[#059669] font-bold">{formatDollars(totalFundingAmount)}</span> across {funding.length} records
            </p>
          </section>
        )}

        {/* Back link */}
        <div className="pt-6 border-t border-gray-800">
          <Link
            href={program.jurisdiction ? `/spending/programs?state=${program.jurisdiction}` : '/spending/programs'}
            className="font-mono text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Back to all programs
          </Link>
        </div>
      </div>
    </div>
  );
}
