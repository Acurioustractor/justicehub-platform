/**
 * /intelligence/civic/claim/[id]
 *
 * The "earn its headline" drill-down. For a given civic_intelligence_claims row,
 * show every civic_claim_evidence row backing it, with the named entities
 * (orgs, detention centres, AIHW rows, RoGS rows, oversight reports) made
 * visible. Closes the loop: visitors can audit every claim end-to-end.
 *
 * Org-id-bearing source_record_ids we know how to render:
 *   - organizations + detention_centre_ids (state detention-bed claims)
 *   - civic_intelligence_claims + indigenous_org_ids (state Indigenous-share)
 *   - civic_org_classifications + organization_ids (state Tier 1 counts)
 *
 * Other source_tables render with their methodology note + confidence only.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getClaim, getEvidenceSummary } from '@/lib/civic-intelligence/queries';
import { SnapshotStatCard } from '@/components/intelligence/civic/SnapshotStatCard';

export const revalidate = 3600;

interface EvidenceRow {
  id: string;
  claim_id: string;
  source_table: string;
  source_record_ids: any;
  supports: boolean;
  confidence: number | string | null;
  methodology_note: string | null;
  contributed_by: string | null;
  contributed_at: string | null;
  reviewer_status: string | null;
}

interface RelatedOrg {
  id: string;
  name: string;
  slug: string | null;
  state: string | null;
  abn: string | null;
  is_indigenous_org: boolean;
}

async function getEvidence(claimId: string): Promise<EvidenceRow[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('civic_claim_evidence')
    .select('*')
    .eq('claim_id', claimId)
    .order('confidence', { ascending: false, nullsFirst: false });
  if (error) {
    console.error('getEvidence failed:', error.message);
    return [];
  }
  return (data || []) as EvidenceRow[];
}

async function getOrgsByIds(ids: string[]): Promise<RelatedOrg[]> {
  if (ids.length === 0) return [];
  const supabase = createServiceClient() as any;
  const out: RelatedOrg[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, state, abn, is_indigenous_org')
      .in('id', chunk);
    if (error) {
      console.error('getOrgsByIds chunk failed:', error.message);
      continue;
    }
    out.push(...(data || []));
  }
  return out;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const claim = await getClaim(decodeURIComponent(params.id));
  if (!claim) return { title: 'Claim not found' };
  return {
    title: `${claim.display_label} — evidence trail`,
    description: claim.value_text || claim.display_label,
  };
}

const TIER_LABEL: Record<string, string> = {
  triangulated: 'Triangulated — 3 or more independent sources',
  corroborated: 'Corroborated — 2 independent sources',
  single_source: 'Single source — only one dataset behind this claim',
  no_evidence: 'No evidence registered yet',
};

const SOURCE_TABLE_HUMAN: Record<string, string> = {
  organizations: 'Organisations register',
  civic_org_classifications: 'Civic org tier classifications',
  civic_intelligence_claims: 'Cross-claim derivation',
  aihw_youth_justice_stats: 'AIHW Youth Justice in Australia',
  rogs_justice_spending: 'Productivity Commission Report on Government Services',
  oversight_recommendations: 'Independent oversight recommendations',
  justice_funding: 'Justice funding ledger',
  foundation_grantees: 'Foundation grantee ledger',
  auditor_general_audits: 'Auditor-General audits',
  children_commissioner_reports: 'Children’s Commissioner reports',
  civic_charter_commitments: 'Government charter commitments',
  civic_meeting_tags: 'Government meeting register',
};

export default async function ClaimDetailPage({ params }: { params: { id: string } }) {
  const claimId = decodeURIComponent(params.id);
  const [claim, evidence, evidenceSummary] = await Promise.all([
    getClaim(claimId),
    getEvidence(claimId),
    getEvidenceSummary(),
  ]);
  if (!claim) notFound();

  const summary = evidenceSummary[claimId] || null;

  // Collect all org IDs referenced by any evidence row
  const orgIds = new Set<string>();
  for (const ev of evidence) {
    if (!ev.source_record_ids) continue;
    for (const key of ['detention_centre_ids', 'indigenous_org_ids', 'organization_ids', 'tier1_org_ids']) {
      const ids = ev.source_record_ids[key];
      if (Array.isArray(ids)) ids.forEach((id: string) => orgIds.add(id));
    }
  }
  const orgs = await getOrgsByIds([...orgIds]);
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* HEADER */}
      <header className="border-b-2 border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link href="/intelligence/civic/centre-of-excellence" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
            ← Centre of Excellence
          </Link>
          <p className="mt-4 text-xs font-mono uppercase tracking-widest text-stone-500">Evidence trail</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            {claim.display_label}
          </h1>
          {summary && (
            <p className="mt-3 text-sm text-stone-700">
              {TIER_LABEL[summary.triangulation_tier]} · {summary.supporting_sources} {summary.supporting_sources === 1 ? 'source' : 'sources'} on record
            </p>
          )}
        </div>
      </header>

      {/* HEADLINE VALUE */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <SnapshotStatCard
          claim={claim}
          size="lg"
          {...(summary && {
            triangulationTier: summary.triangulation_tier,
            supportingSources: summary.supporting_sources,
          })}
        />
      </section>

      {/* EVIDENCE TRAIL */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">How this claim earns its headline</h2>
        {evidence.length === 0 ? (
          <div className="border-2 border-rose-300 bg-rose-50 p-5 rounded">
            <p className="text-rose-900 font-semibold">No evidence registered yet.</p>
            <p className="mt-2 text-sm text-rose-800">
              This claim has not been linked to any dataset. Treat it as provisional until evidence is registered in civic_claim_evidence.
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {evidence.map((ev) => {
              const referencedOrgs: RelatedOrg[] = [];
              if (ev.source_record_ids) {
                for (const key of ['detention_centre_ids', 'indigenous_org_ids', 'organization_ids', 'tier1_org_ids']) {
                  const ids = ev.source_record_ids[key];
                  if (Array.isArray(ids)) {
                    for (const id of ids) {
                      const o = orgById.get(id);
                      if (o) referencedOrgs.push(o);
                    }
                  }
                }
              }
              const otherKeys = ev.source_record_ids
                ? Object.keys(ev.source_record_ids).filter(
                    (k) => !['detention_centre_ids', 'indigenous_org_ids', 'organization_ids', 'tier1_org_ids'].includes(k)
                  )
                : [];
              return (
                <li
                  key={ev.id}
                  className={`border-2 rounded p-5 ${
                    ev.supports ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-3 mb-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-stone-700">
                      {SOURCE_TABLE_HUMAN[ev.source_table] || ev.source_table}
                    </span>
                    {ev.confidence != null && (
                      <span className="text-xs font-mono text-stone-500">
                        confidence {Number(ev.confidence).toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                        ev.supports
                          ? 'text-emerald-700 bg-emerald-100 border-emerald-300'
                          : 'text-rose-700 bg-rose-100 border-rose-300'
                      }`}
                    >
                      {ev.supports ? 'supports' : 'contradicts'}
                    </span>
                  </div>

                  {ev.methodology_note && (
                    <p className="text-sm text-stone-800 mb-3 leading-relaxed">{ev.methodology_note}</p>
                  )}

                  {referencedOrgs.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">
                        Named entities backing this row ({referencedOrgs.length})
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {referencedOrgs.map((o) => (
                          <li key={o.id}>
                            <Link
                              href={o.slug ? `/sites/${o.slug}` : '#'}
                              className="block bg-white border border-stone-300 px-3 py-2 rounded hover:border-stone-900 transition-colors"
                            >
                              <span className="font-semibold text-stone-900">{o.name}</span>
                              <span className="ml-2 text-xs font-mono text-stone-500">
                                {o.state || ''}{o.is_indigenous_org ? ' · Indigenous-led' : ''}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {otherKeys.length > 0 && (
                    <div className="mt-3 text-xs font-mono text-stone-500">
                      <span className="uppercase tracking-widest">Source record fields: </span>
                      {otherKeys.map((k, i) => (
                        <span key={k}>
                          {i > 0 && ', '}
                          {k}={JSON.stringify(ev.source_record_ids[k]).slice(0, 80)}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* TRANSPARENCY FOOTER */}
      <footer className="bg-stone-900 text-stone-300 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">Audit trail</p>
          <p className="text-sm leading-relaxed">
            Claim id: <span className="font-mono text-white">{claim.claim_id}</span>
          </p>
          <p className="text-sm leading-relaxed mt-1">
            Region: <span className="font-mono text-white">{claim.region}</span> · Tier: <span className="font-mono text-white">{claim.tier}</span> · Verification: <span className="font-mono text-white">{claim.verification_status}</span>
          </p>
          {claim.source_url && (
            <p className="text-sm mt-2">
              Primary source: <a href={claim.source_url} target="_blank" rel="noreferrer" className="text-emerald-400 underline">{claim.source_url}</a>
            </p>
          )}
        </div>
      </footer>
    </main>
  );
}
