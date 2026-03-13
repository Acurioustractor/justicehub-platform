import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { SiteEditorClient } from './SiteEditorClient';

async function getOrgWithContent(slug: string) {
  const supabase = createServiceClient() as any;

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, type, partner_tier, description, location, state, website')
    .eq('slug', slug)
    .single();

  if (!org) return null;

  const [photos, contacts, goals, metrics, storytellers, siteLocations] = await Promise.all([
    supabase.from('partner_photos').select('*').eq('organization_id', org.id).order('display_order'),
    supabase.from('partner_contacts').select('*').eq('organization_id', org.id),
    supabase.from('partner_goals').select('*').eq('organization_id', org.id),
    supabase.from('partner_impact_metrics').select('*').eq('organization_id', org.id),
    supabase.from('partner_storytellers').select('*').eq('organization_id', org.id),
    supabase.from('partner_site_locations').select('*').eq('organization_id', org.id),
  ]);

  return {
    org,
    photos: photos.data || [],
    contacts: contacts.data || [],
    goals: goals.data || [],
    metrics: metrics.data || [],
    storytellers: storytellers.data || [],
    siteLocations: siteLocations.data || [],
  };
}

export default async function SiteEditorPage({ params }: { params: { 'org-slug': string } }) {
  const data = await getOrgWithContent(params['org-slug']);
  if (!data) redirect('/');

  if (data.org.type !== 'basecamp' && data.org.partner_tier !== 'basecamp') {
    redirect(`/hub/${params['org-slug']}/dashboard`);
  }

  return <SiteEditorClient data={data} />;
}
