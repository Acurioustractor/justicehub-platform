import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { AlmaSearchClient, type AlmaSearchModel } from './AlmaSearchClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Search the Map | Australian Living Map of Alternatives | JusticeHub',
  description:
    'Search the Australian Living Map of Alternatives. Find community-led youth justice programs by postcode, state, practice type, or evidence level. Every entry verified.',
};

export default async function AlmaSearchPage() {
  const supabase = createServiceClient() as any;

  // Fetch every verified intervention with its operating organisation.
  // The page is client-filtered, so we pull the full set once and let the
  // browser do the work. This stays fast at ~1-2k rows.
  const { data, count } = await supabase
    .from('alma_interventions')
    .select(
      `
      id, name, type, description, evidence_level, cost_per_young_person, updated_at,
      operating_organization_id,
      organizations!alma_interventions_operating_organization_id_fkey(
        name, slug, state, is_indigenous_org
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
    costPerYoungPerson: m.cost_per_young_person ? Number(m.cost_per_young_person) : null,
    updatedAt: m.updated_at,
    org: m.organizations
      ? {
          name: m.organizations.name,
          slug: m.organizations.slug,
          state: m.organizations.state,
          isIndigenousOrg: !!m.organizations.is_indigenous_org,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <AlmaSearchClient models={models} totalCount={count || models.length} />
      </main>
      <Footer />
    </div>
  );
}
