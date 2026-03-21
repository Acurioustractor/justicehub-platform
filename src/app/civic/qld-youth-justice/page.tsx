import { createServiceClient } from '@/lib/supabase/service-lite';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 min cache

type CharterCommitment = {
  id: string;
  minister_name: string;
  portfolio: string;
  commitment_type: string;
  commitment_text: string;
  category: string;
  status: string;
  youth_justice_relevant: boolean;
};

type MinisterialStatement = {
  id: string;
  source_id: string;
  headline: string;
  minister_name: string;
  portfolio: string;
  published_at: string;
  source_url: string;
  mentioned_amounts: string[];
  mentioned_locations: string[];
  body_text: string;
};

export default async function QldYouthJusticePage() {
  const supabase = createServiceClient();

  // Fetch all data in parallel
  const [charterRes, statementsRes, fundingRes, interventionsRes] = await Promise.all([
    // Charter commitments (youth justice relevant)
    supabase
      .from('civic_charter_commitments')
      .select('*')
      .eq('youth_justice_relevant', true)
      .order('minister_name'),

    // Recent ministerial statements (all — we filter client-side for YJ relevance)
    supabase
      .from('civic_ministerial_statements')
      .select('id, source_id, headline, minister_name, portfolio, published_at, source_url, mentioned_amounts, mentioned_locations, body_text')
      .order('published_at', { ascending: false })
      .limit(50),

    // QLD justice funding summary
    supabase
      .from('justice_funding')
      .select('id, program_name, recipient_name, amount_dollars, financial_year, source')
      .eq('state', 'QLD')
      .order('amount_dollars', { ascending: false })
      .limit(20),

    // QLD ALMA interventions
    supabase
      .from('alma_interventions')
      .select('id, name, evidence_level, cost_per_young_person, portfolio_score')
      .neq('verification_status', 'ai_generated')
      .not('gs_entity_id', 'is', null)
      .order('portfolio_score', { ascending: false })
      .limit(15),
  ]);

  const charter = (charterRes.data || []) as CharterCommitment[];
  const statements = (statementsRes.data || []) as MinisterialStatement[];
  const funding = fundingRes.data || [];
  const interventions = interventionsRes.data || [];

  // Filter statements for youth justice relevance
  const YJ_KEYWORDS = ['youth justice', 'juvenile', 'detention', 'young offender', 'child safety',
    'crime prevention', 'early intervention', 'watch house', 'corrective', 'victim',
    'safer', 'crime', 'rehabilitation', 'bail', 'sentencing'];

  const yjStatements = statements.filter(s => {
    const text = `${s.headline} ${s.body_text || ''}`.toLowerCase();
    return YJ_KEYWORDS.some(kw => text.includes(kw));
  });

  const allStatements = statements; // keep all for the full timeline

  // Group charter commitments by minister
  const charterByMinister = charter.reduce((acc, c) => {
    if (!acc[c.minister_name]) acc[c.minister_name] = [];
    acc[c.minister_name].push(c);
    return acc;
  }, {} as Record<string, CharterCommitment[]>);

  // Stats
  const totalFunding = funding.reduce((sum, f) => sum + (f.amount_dollars || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-mono text-[#DC2626] tracking-widest uppercase mb-4">
            CivicScope / Queensland
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Youth Justice Intelligence
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            Live tracking of what Queensland ministers promised, what they&apos;re saying, and where the money is going.
            Updated daily from ministerial statements, Hansard, and budget data.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard label="Charter Commitments" value={charter.length} sub="Youth justice specific" />
            <StatCard label="Minister Statements" value={allStatements.length} sub={`${yjStatements.length} YJ relevant`} />
            <StatCard label="Funding Records" value={`${(funding.length)}+`} sub={`$${(totalFunding / 1_000_000).toFixed(0)}M tracked`} />
            <StatCard label="ALMA Programs" value={interventions.length} sub="Evidence-rated" />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">

        {/* Section 1: What They Promised */}
        <section>
          <SectionHeader
            title="What They Promised"
            subtitle="Premier Crisafulli's charter letters to ministers (8 Nov 2024) — the commitments they were sworn in to deliver"
          />

          {Object.entries(charterByMinister).map(([minister, commitments]) => (
            <div key={minister} className="mb-8">
              <h3 className="text-xl font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {minister}
              </h3>
              <p className="text-sm text-gray-500 font-mono mb-4">
                {commitments[0]?.portfolio}
              </p>

              <div className="space-y-2">
                {commitments.map(c => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <StatusBadge status={c.status} />
                    <div className="flex-1">
                      <p className="text-sm text-[#0A0A0A]">{c.commitment_text}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {c.commitment_type}
                        </span>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {c.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Section 2: What They're Saying */}
        <section>
          <SectionHeader
            title="What They&apos;re Saying"
            subtitle="Recent ministerial media statements — youth justice relevant highlighted"
          />

          <div className="space-y-3">
            {allStatements.slice(0, 20).map(s => {
              const isYJ = yjStatements.some(yj => yj.id === s.id);
              return (
                <a
                  key={s.id}
                  href={s.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-4 rounded-lg border transition-colors ${
                    isYJ
                      ? 'bg-red-50 border-[#DC2626]/30 hover:border-[#DC2626]'
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#0A0A0A]">{s.headline}</h4>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-mono text-gray-500">
                          {s.published_at ? new Date(s.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'undated'}
                        </span>
                        {s.minister_name && !s.minister_name.includes('State of Queensland') && (
                          <span className="text-xs font-mono text-gray-400">
                            {s.minister_name.replace('The Honourable ', '')}
                          </span>
                        )}
                        {isYJ && (
                          <span className="text-xs font-mono text-[#DC2626] bg-red-100 px-2 py-0.5 rounded">
                            Youth Justice
                          </span>
                        )}
                        {(s.mentioned_amounts as string[] || []).slice(0, 2).map((a, i) => (
                          <span key={i} className="text-xs font-mono text-[#059669] bg-emerald-50 px-2 py-0.5 rounded">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">&#8599;</span>
                  </div>
                </a>
              );
            })}
          </div>

          {allStatements.length > 20 && (
            <p className="text-sm text-gray-500 mt-4 font-mono">
              Showing 20 of {allStatements.length} statements. More available via search.
            </p>
          )}
        </section>

        {/* Section 3: Where the Money Goes */}
        <section>
          <SectionHeader
            title="Where the Money Goes"
            subtitle="QLD justice funding — linked to organisations and programs"
          />

          <div className="grid md:grid-cols-2 gap-4">
            {funding.slice(0, 10).map(f => (
              <div key={f.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0A0A0A]">{f.program_name || 'Untitled program'}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-1">{f.recipient_name}</p>
                  </div>
                  {f.amount_dollars && (
                    <span className="text-sm font-mono font-bold text-[#059669]">
                      ${(f.amount_dollars / 1_000_000).toFixed(1)}M
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {f.financial_year}
                  </span>
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {f.source}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/spending/qld"
            className="inline-block mt-6 text-sm font-mono text-[#DC2626] hover:underline"
          >
            View full QLD spending breakdown &rarr;
          </Link>
        </section>

        {/* Section 4: Programs on the Ground */}
        <section>
          <SectionHeader
            title="Programs on the Ground"
            subtitle="Evidence-rated youth justice interventions operating in Queensland"
          />

          <div className="grid md:grid-cols-3 gap-4">
            {interventions.map(i => (
              <div key={i.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-[#0A0A0A] mb-2">{i.name}</h4>
                <div className="flex gap-2 flex-wrap">
                  {i.evidence_level && (
                    <EvidenceBadge level={i.evidence_level} />
                  )}
                  {i.cost_per_young_person && (
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      ${Math.round(i.cost_per_young_person).toLocaleString()}/person
                    </span>
                  )}
                  {i.portfolio_score && (
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Score: {i.portfolio_score}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <section className="border-t border-gray-300 pt-8">
          <p className="text-xs font-mono text-gray-400">
            Data sourced from: statements.qld.gov.au, parliament.qld.gov.au, data.qld.gov.au,
            ROGS, AusTender, ALMA evidence library. Updated daily by CivicScope scrapers.
          </p>
          <p className="text-xs font-mono text-gray-400 mt-2">
            Charter letters from Premier David Crisafulli to ministers (8 November 2024).
            Commitment status tracking is editorial and based on publicly available evidence.
          </p>
        </section>
      </div>
    </div>
  );
}

// ── Components ────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      <p className="text-sm text-gray-300">{label}</p>
      <p className="text-xs font-mono text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {title}
      </h2>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    not_started: 'bg-gray-200 text-gray-600',
    in_progress: 'bg-amber-100 text-amber-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    broken: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    not_started: 'Pending',
    in_progress: 'In Progress',
    delivered: 'Delivered',
    broken: 'Broken',
  };

  return (
    <span className={`text-xs font-mono px-2 py-1 rounded shrink-0 ${styles[status] || styles.not_started}`}>
      {labels[status] || 'Pending'}
    </span>
  );
}

function EvidenceBadge({ level }: { level: string }) {
  const color = level.startsWith('Proven') ? 'text-emerald-700 bg-emerald-100'
    : level.startsWith('Effective') ? 'text-blue-700 bg-blue-100'
    : level.startsWith('Promising') ? 'text-amber-700 bg-amber-100'
    : level.startsWith('Indigenous') ? 'text-purple-700 bg-purple-100'
    : 'text-gray-600 bg-gray-100';

  const short = level.split('(')[0].trim();

  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${color}`}>
      {short}
    </span>
  );
}
