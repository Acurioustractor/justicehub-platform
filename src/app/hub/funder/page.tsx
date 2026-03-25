import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { FunderHubDashboard } from './FunderHubDashboard';

export default async function FunderHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/funder');

  const service = createServiceClient();

  const { data: profile } = await service
    .from('public_profiles')
    .select('preferred_name, full_name, role_tags, location')
    .eq('user_id', user.id)
    .single();

  const userName = profile?.preferred_name || profile?.full_name || 'Member';
  const userState = profile?.location || '';

  // Funding landscape stats
  const { count: totalFunding } = await service
    .from('justice_funding')
    .select('id', { count: 'exact', head: true });

  // Funding by state
  const stateFunding: Array<{ state: string; count: number; total_amount: number }> = [];
  const states = ['NSW', 'QLD', 'SA', 'WA', 'NT', 'VIC', 'TAS', 'ACT'];
  for (const state of states) {
    const { count } = await service
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .eq('state', state);
    if (count && count > 0) {
      stateFunding.push({ state, count, total_amount: 0 });
    }
  }
  stateFunding.sort((a, b) => b.count - a.count);

  // Top funded organizations (by number of funding records)
  const { data: topFunded } = await service
    .from('justice_funding')
    .select('alma_organization_id, organizations(name, slug, state, is_indigenous_org)')
    .not('alma_organization_id', 'is', null)
    .limit(500);

  // Aggregate top funded orgs
  const orgCounts: Record<string, { name: string; slug: string | null; state: string | null; indigenous: boolean; count: number }> = {};
  for (const f of (topFunded || [])) {
    const org = f.organizations as any;
    if (!org?.name) continue;
    const key = f.alma_organization_id;
    if (!orgCounts[key]) {
      orgCounts[key] = { name: org.name, slug: org.slug, state: org.state, indigenous: org.is_indigenous_org || false, count: 0 };
    }
    orgCounts[key].count++;
  }
  const topOrgs = Object.values(orgCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  // Evidence: what works
  const { data: provenInterventionsRaw } = await service
    .from('alma_interventions')
    .select('id, name, evidence_level, operating_organization_id, organizations(name, slug)')
    .neq('verification_status', 'ai_generated')
    .in('evidence_level', [
      'Proven (RCT/quasi-experimental, replicated)',
      'Effective (strong evaluation, positive outcomes)',
    ])
    .limit(10);

  const provenInterventions = (provenInterventionsRaw || []).map((i: any) => ({
    id: i.id as string,
    name: i.name as string,
    evidence_level: i.evidence_level as string | null,
    organizations: i.organizations as { name: string; slug: string | null } | null,
  }));

  // Indigenous org count
  const { count: indigenousOrgCount } = await service
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_indigenous_org', true);

  return (
    <FunderHubDashboard
      userName={userName}
      userState={userState}
      totalFunding={totalFunding || 0}
      stateFunding={stateFunding}
      topOrgs={topOrgs}
      provenInterventions={provenInterventions || []}
      indigenousOrgCount={indigenousOrgCount || 0}
    />
  );
}
