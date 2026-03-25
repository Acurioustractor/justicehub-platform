import { createServiceClient } from '@/lib/supabase/service-lite';
import { tourStops } from '@/content/campaign';
import { CampaignView } from './CampaignView';

export default async function CampaignPage({ params }: { params: { 'org-slug': string } }) {
  const service = createServiceClient();

  // Get the org
  const { data: org } = await service
    .from('organizations')
    .select('id, name, slug, state, city')
    .eq('slug', params['org-slug'])
    .single();

  if (!org) {
    return <div className="p-8 text-gray-500">Organisation not found</div>;
  }

  // Match to tour stop
  const matchedStop = tourStops.find(s => s.state === org.state);

  // Get funding count for this org's state
  let stateFundingCount = 0;
  if (org.state) {
    const { count } = await service
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .eq('state', org.state);
    stateFundingCount = count || 0;
  }

  // Get org's own funding records
  const { data: orgFunding } = await service
    .from('justice_funding')
    .select('id, program_name, amount_dollars, financial_year, source')
    .eq('alma_organization_id', org.id)
    .order('financial_year', { ascending: false })
    .limit(10);

  return (
    <CampaignView
      orgName={org.name}
      orgState={org.state || ''}
      orgCity={org.city || ''}
      matchedStop={matchedStop || null}
      stateFundingCount={stateFundingCount}
      orgFunding={orgFunding || []}
    />
  );
}
