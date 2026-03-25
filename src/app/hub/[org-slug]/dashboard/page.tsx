import { createServiceClient } from '@/lib/supabase/service-lite';
import { getThisWeekSummary } from '@/lib/bgfit/queries';
import { getEntityEnrichment, type EntityEnrichment } from '@/lib/grantscope/entity-enrichment';
import { DashboardView } from './DashboardView';
import { OrgEnrichmentPanel } from './OrgEnrichmentPanel';

async function getOrg(slug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, name, abn, state, city')
    .eq('slug', slug)
    .single();
  return data;
}

async function getGsEntityByAbn(abn: string): Promise<string | null> {
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('gs_entities')
    .select('id')
    .eq('abn', abn)
    .limit(1)
    .single();
  return data?.id ?? null;
}

export default async function DashboardPage({ params }: { params: { 'org-slug': string } }) {
  const org = await getOrg(params['org-slug']);
  if (!org) return <p className="text-gray-500">Organization not found.</p>;

  const summary = await getThisWeekSummary(org.id);

  // Try to get GS enrichment via ABN
  let enrichment: EntityEnrichment | null = null;
  if (org.abn) {
    const gsEntityId = await getGsEntityByAbn(org.abn);
    if (gsEntityId) {
      enrichment = await getEntityEnrichment(gsEntityId);
    }
  }

  return (
    <div className="space-y-8">
      {enrichment && <OrgEnrichmentPanel enrichment={enrichment} orgName={org.name} />}
      <DashboardView summary={summary} />
    </div>
  );
}
