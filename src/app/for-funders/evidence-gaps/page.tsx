import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Evidence Gap Matrix | JusticeHub',
  description: 'Where is the evidence strong? Where are the gaps? A 3ie-style evidence gap map for Australian youth justice alternatives.',
};

const EVIDENCE_LEVELS = [
  { key: 'Proven (RCT/quasi-experimental, replicated)', label: 'Proven', color: 'bg-emerald-600', textColor: 'text-emerald-700' },
  { key: 'Effective (strong evaluation, positive outcomes)', label: 'Effective', color: 'bg-green-600', textColor: 'text-green-700' },
  { key: 'Promising (community-endorsed, emerging evidence)', label: 'Promising', color: 'bg-amber-500', textColor: 'text-amber-700' },
  { key: 'Indigenous-led (culturally grounded, community authority)', label: 'Indigenous-led', color: 'bg-purple-600', textColor: 'text-purple-700' },
  { key: 'Untested (theory/pilot stage)', label: 'Untested', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

const INTERVENTION_TYPES = [
  'Cultural Connection',
  'Diversion',
  'Wraparound Support',
  'Community-Led',
  'Justice Reinvestment',
  'Prevention',
  'Education/Employment',
  'Therapeutic',
  'Family Strengthening',
  'Early Intervention',
  'Mentoring',
  'Sport/Recreation',
  'Arts/Media',
  'Housing/Accommodation',
  'Legal Support',
];

interface MatrixCell {
  count: number;
  programs: { name: string; org: string; orgSlug: string | null }[];
  hasFunding: boolean;
}

async function getMatrixData() {
  const supabase = createServiceClient();

  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, intervention_type, evidence_level, operating_organization_id, organizations!alma_interventions_operating_organization_id_fkey(name, slug)')
    .neq('verification_status', 'ai_generated');

  if (!interventions) return { matrix: {}, typeTotals: {}, levelTotals: {}, total: 0 };

  // Get funded org IDs
  const { data: fundedOrgs } = await supabase
    .from('justice_funding')
    .select('alma_organization_id')
    .not('alma_organization_id', 'is', null)
    .not('amount_dollars', 'is', null);

  const fundedOrgIds = new Set((fundedOrgs || []).map(f => f.alma_organization_id));

  // Build matrix
  const matrix: Record<string, Record<string, MatrixCell>> = {};
  const typeTotals: Record<string, number> = {};
  const levelTotals: Record<string, number> = {};

  for (const type of INTERVENTION_TYPES) {
    matrix[type] = {};
    for (const level of EVIDENCE_LEVELS) {
      matrix[type][level.key] = { count: 0, programs: [], hasFunding: false };
    }
  }

  for (const i of interventions) {
    const type = i.intervention_type || 'Other';
    const level = i.evidence_level || 'Untested (theory/pilot stage)';
    const org = i.organizations as any;

    // Map to our type list or skip
    const matchedType = INTERVENTION_TYPES.find(t =>
      type.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(type.toLowerCase())
    ) || type;

    if (!matrix[matchedType]) {
      matrix[matchedType] = {};
      for (const l of EVIDENCE_LEVELS) {
        matrix[matchedType][l.key] = { count: 0, programs: [], hasFunding: false };
      }
    }

    if (!matrix[matchedType][level]) continue;

    matrix[matchedType][level].count++;
    if (matrix[matchedType][level].programs.length < 3) {
      matrix[matchedType][level].programs.push({
        name: i.name,
        org: org?.name || 'Unknown',
        orgSlug: org?.slug || null,
      });
    }
    if (i.operating_organization_id && fundedOrgIds.has(i.operating_organization_id)) {
      matrix[matchedType][level].hasFunding = true;
    }

    typeTotals[matchedType] = (typeTotals[matchedType] || 0) + 1;
    levelTotals[level] = (levelTotals[level] || 0) + 1;
  }

  return { matrix, typeTotals, levelTotals, total: interventions.length };
}

function CellContent({ cell }: { cell: MatrixCell }) {
  if (cell.count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-300 text-lg">—</span>
      </div>
    );
  }

  const size = Math.min(cell.count, 50);
  const opacity = Math.min(0.15 + (size / 50) * 0.85, 1);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 group relative">
      <span className="text-lg font-bold" style={{ opacity }}>{cell.count}</span>
      {!cell.hasFunding && cell.count > 0 && (
        <span className="text-[10px] text-[#DC2626] font-mono">no funding</span>
      )}
      {/* Tooltip */}
      {cell.programs.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0A0A0A] text-white p-3 rounded-lg text-xs w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
          {cell.programs.map((p, i) => (
            <div key={i} className="mb-1 last:mb-0">
              <span className="font-medium">{p.name}</span>
              <span className="text-white/50 block">{p.org}</span>
            </div>
          ))}
          {cell.count > 3 && <p className="text-white/40 mt-1">+ {cell.count - 3} more</p>}
        </div>
      )}
    </div>
  );
}

export default async function EvidenceGapMatrixPage() {
  const { matrix, typeTotals, levelTotals, total } = await getMatrixData();

  // Find gaps — types with interventions but no proven/effective evidence
  const gaps = Object.entries(matrix)
    .filter(([type, levels]) => {
      const hasInterventions = (typeTotals[type] || 0) > 0;
      const hasStrongEvidence =
        (levels['Proven (RCT/quasi-experimental, replicated)']?.count || 0) > 0 ||
        (levels['Effective (strong evaluation, positive outcomes)']?.count || 0) > 0;
      return hasInterventions && !hasStrongEvidence;
    })
    .map(([type]) => type);

  // Find unfunded — cells with programs but no funding
  const unfundedCount = Object.values(matrix).reduce((sum, levels) => {
    return sum + Object.values(levels).filter(cell => cell.count > 0 && !cell.hasFunding).length;
  }, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-sm">
          <Link href="/for-funders" className="flex items-center gap-2 text-white/70 hover:text-white">
            <ArrowRight className="w-4 h-4 rotate-180" /> Funder Hub
          </Link>
          <span className="font-mono text-xs text-white/50">EVIDENCE GAP MATRIX</span>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Evidence Gap Matrix
          </h1>
          <p className="text-white/60 max-w-2xl">
            Where is the evidence strong? Where are the gaps? This 3ie-style evidence gap map shows
            {' '}{total.toLocaleString()} verified interventions across evidence levels and intervention types.
            Hover over cells to see specific programs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <p className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {total.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 font-mono">Total Interventions</p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <p className="text-2xl font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {(levelTotals['Proven (RCT/quasi-experimental, replicated)'] || 0) + (levelTotals['Effective (strong evaluation, positive outcomes)'] || 0)}
            </p>
            <p className="text-sm text-gray-500 font-mono">Proven + Effective</p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <p className="text-2xl font-bold text-[#DC2626]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {gaps.length}
            </p>
            <p className="text-sm text-gray-500 font-mono">Evidence Gaps</p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <p className="text-2xl font-bold text-amber-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {unfundedCount}
            </p>
            <p className="text-sm text-gray-500 font-mono">Unfunded Cells</p>
          </div>
        </div>

        {/* The Matrix */}
        <section>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-mono text-gray-500 uppercase border-b border-gray-200 w-48 sticky left-0 bg-white z-10">
                    Intervention Type
                  </th>
                  {EVIDENCE_LEVELS.map(level => (
                    <th key={level.key} className="px-3 py-3 text-center border-b border-gray-200 w-32">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-white ${level.color}`}>
                        {level.label}
                      </span>
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        {(levelTotals[level.key] || 0).toLocaleString()}
                      </p>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center border-b border-gray-200 text-xs font-mono text-gray-500 w-20">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(matrix)
                  .filter(([type]) => (typeTotals[type] || 0) > 0)
                  .sort((a, b) => (typeTotals[b[0]] || 0) - (typeTotals[a[0]] || 0))
                  .map(([type, levels]) => (
                    <tr key={type} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-4 py-3 text-sm font-medium text-[#0A0A0A] sticky left-0 bg-white z-10">
                        {type}
                      </td>
                      {EVIDENCE_LEVELS.map(level => {
                        const cell = levels[level.key] || { count: 0, programs: [], hasFunding: false };
                        return (
                          <td key={level.key} className="px-3 py-3 text-center">
                            <CellContent cell={cell} />
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center text-sm font-mono text-gray-400">
                        {typeTotals[type] || 0}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="text-[#DC2626] font-mono">no funding</span> = programs exist but no tracked philanthropic funding
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-300 text-lg">—</span> = no interventions in this cell
            </span>
          </div>
        </section>

        {/* Evidence Gaps */}
        {gaps.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Where Funders Can Move the Needle
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4">
                These intervention types have active programs but lack proven or effective evidence.
                Funding evaluations in these areas would fill critical gaps.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {gaps.map(type => {
                  const promising = matrix[type]?.['Promising (community-endorsed, emerging evidence)']?.count || 0;
                  const indigenousLed = matrix[type]?.['Indigenous-led (culturally grounded, community authority)']?.count || 0;
                  const untested = matrix[type]?.['Untested (theory/pilot stage)']?.count || 0;
                  return (
                    <div key={type} className="flex items-center justify-between p-4 bg-[#DC2626]/5 rounded-lg border border-[#DC2626]/10">
                      <div>
                        <p className="text-sm font-medium text-[#0A0A0A]">{type}</p>
                        <p className="text-xs text-gray-500">
                          {promising > 0 && `${promising} promising`}
                          {indigenousLed > 0 && `${promising > 0 ? ', ' : ''}${indigenousLed} Indigenous-led`}
                          {untested > 0 && `${(promising + indigenousLed) > 0 ? ', ' : ''}${untested} untested`}
                        </p>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* What funders should know */}
        <section className="bg-[#0A0A0A] rounded-xl p-8 text-white">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Reading this matrix
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-white/70">
            <div>
              <p className="text-white font-medium mb-2">Dense columns = strong evidence</p>
              <p>If a column (evidence level) is full, that category has been well-studied. Proven and Effective programs have the strongest case for scaling.</p>
            </div>
            <div>
              <p className="text-white font-medium mb-2">Empty cells = funding opportunity</p>
              <p>A gap in the matrix means either no programs exist in that space, or existing programs haven&apos;t been evaluated. Both are fundable.</p>
            </div>
            <div>
              <p className="text-white font-medium mb-2">&quot;No funding&quot; = immediate impact</p>
              <p>Programs running without philanthropic support represent the highest-leverage funding opportunities — they&apos;re already working, they just need resources.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/for-funders/compare"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Compare Funder Portfolios <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-funders/calculator"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#0A0A0A] text-[#0A0A0A] rounded-lg font-medium hover:bg-[#0A0A0A] hover:text-white transition-colors"
            >
              Impact Calculator
            </Link>
          </div>
          <p className="text-xs text-gray-400 font-mono">
            Data: ALMA Network ({total.toLocaleString()} verified interventions). Methodology: 3ie evidence gap map framework.
          </p>
        </div>
      </div>
    </div>
  );
}
