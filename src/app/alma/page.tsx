import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { AlmaSearchClient, type AlmaSearchModel } from './AlmaSearchClient';
import { WhatsNewFeed } from '@/components/alma/WhatsNew';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Search the Map | Australian Living Map of Alternatives | JusticeHub',
  description:
    'Search the Australian Living Map of Alternatives. Find youth justice support records by postcode, state, practice type, evidence level, and review status.',
};

async function loadAlmaSearchData(): Promise<{ models: AlmaSearchModel[]; totalCount: number }> {
  const supabase = createServiceClient() as any;

  // Fetch every verified intervention with its operating organisation.
  // The page is client-filtered, so we pull the full set once and let the
  // browser do the work. This stays fast at ~1-2k rows.
  const { data, count } = await supabase
    .from('alma_interventions')
    .select(
      `
      id, name, type, description, evidence_level, cost_per_young_person, updated_at,
      geography, verification_status, review_status, source_documents, website,
      operating_organization_id,
      organizations!alma_interventions_operating_organization_id_fkey(
        name, slug, state, is_indigenous_org,
        featured_on_map, profile_completeness_score, profile_completeness_breakdown
      )
    `,
      { count: 'exact' }
    )
    .neq('verification_status', 'ai_generated')
    .order('evidence_level', { ascending: true })
    .order('name')
    .limit(2000);

  const models: AlmaSearchModel[] = (data || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    description: m.description,
    evidenceLevel: m.evidence_level,
    verificationStatus: m.verification_status,
    reviewStatus: m.review_status,
    geography: Array.isArray(m.geography) ? m.geography : [],
    hasSource: Boolean(m.website || (Array.isArray(m.source_documents) && m.source_documents.length > 0)),
    costPerYoungPerson: m.cost_per_young_person ? Number(m.cost_per_young_person) : null,
    updatedAt: m.updated_at,
    org: m.organizations
      ? {
          name: m.organizations.name,
          slug: m.organizations.slug,
          state: m.organizations.state,
          isIndigenousOrg: !!m.organizations.is_indigenous_org,
          featuredOnMap: !!m.organizations.featured_on_map,
          completenessScore: m.organizations.profile_completeness_score
            ? Number(m.organizations.profile_completeness_score)
            : null,
          completenessBreakdown: m.organizations.profile_completeness_breakdown || null,
        }
      : null,
  }));

  return {
    models,
    totalCount: count || models.length,
  };
}

const getAlmaSearchData = unstable_cache(loadAlmaSearchData, ['alma-search-public-v2'], {
  revalidate: 300,
  tags: ['alma-search'],
});

export default async function AlmaSearchPage() {
  const { models, totalCount } = await getAlmaSearchData();

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <WhatsNewFeed limit={10} />
        <AlmaSearchClient models={models} totalCount={totalCount} />
      </main>
      <Footer />
    </div>
  );
}
