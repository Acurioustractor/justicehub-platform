import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch nodes without the FK join (FK relationship doesn't exist in DB)
    const { data: nodes, error } = await supabase
      .from('justicehub_nodes')
      .select(`
        id, name, node_type, state_code, country, description, status,
        latitude, longitude, contact_email, website_url, lead_organization_id
      `)
      .order('name');

    if (error) {
      console.error('Error fetching nodes:', error);
      return NextResponse.json({ nodes: [] });
    }

    // If we need organization names, fetch them separately
    const orgIds = (nodes || [])
      .map(n => n.lead_organization_id)
      .filter((id): id is string => !!id);

    let orgMap: Record<string, { id: string; name: string }> = {};

    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);

      if (orgs) {
        orgMap = Object.fromEntries(orgs.map(o => [o.id, o]));
      }
    }

    // Enrich nodes with organization data
    const enrichedNodes = (nodes || []).map(node => ({
      ...node,
      lead_organization: node.lead_organization_id
        ? orgMap[node.lead_organization_id] || null
        : null
    }));

    return NextResponse.json({ nodes: enrichedNodes });
  } catch (error) {
    console.error('Error in network-nodes API:', error);
    return NextResponse.json({ nodes: [] });
  }
}
