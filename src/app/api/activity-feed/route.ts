import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

interface ActivityItem {
  id: string;
  type: 'intervention' | 'funding' | 'media' | 'organization';
  actor: string;
  action: string;
  timestamp: string;
}

export async function GET() {
  const supabase = createServiceClient();
  const items: ActivityItem[] = [];

  try {
    // Recent interventions discovered
    const { data: interventions } = await supabase
      .from('alma_interventions')
      .select('id, name, created_at, operating_organization_id')
      .neq('verification_status', 'ai_generated')
      .order('created_at', { ascending: false })
      .limit(5);

    if (interventions?.length) {
      // Get org names for interventions
      const orgIds = interventions
        .map((i) => i.operating_organization_id)
        .filter(Boolean);
      const { data: orgs } = orgIds.length
        ? await supabase
            .from('organizations')
            .select('id, state')
            .in('id', orgIds)
        : { data: [] };
      const orgMap = new Map(orgs?.map((o) => [o.id, o]) ?? []);

      for (const item of interventions) {
        const org = orgMap.get(item.operating_organization_id);
        const location = org?.state ? ` in ${org.state}` : '';
        items.push({
          id: `int-${item.id}`,
          type: 'intervention',
          actor: 'ALMA Intelligence',
          action: `Documented "${item.name}" program${location}`,
          timestamp: item.created_at,
        });
      }
    }

    // Recent funding records with linked orgs
    const { data: funding } = await supabase
      .from('justice_funding')
      .select('id, program_name, amount_dollars, created_at, alma_organization_id')
      .gt('amount_dollars', 0)
      .not('alma_organization_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (funding?.length) {
      const fundOrgIds = funding.map((f) => f.alma_organization_id).filter(Boolean);
      const { data: fundOrgs } = fundOrgIds.length
        ? await supabase
            .from('organizations')
            .select('id, name')
            .in('id', fundOrgIds)
        : { data: [] };
      const fundOrgMap = new Map(fundOrgs?.map((o) => [o.id, o.name]) ?? []);

      for (const item of funding) {
        const orgName = fundOrgMap.get(item.alma_organization_id) ?? 'Unknown org';
        const amount = Number(item.amount_dollars);
        const formatted = amount >= 1_000_000
          ? `$${(amount / 1_000_000).toFixed(1)}M`
          : amount >= 1_000
            ? `$${(amount / 1_000).toFixed(0)}K`
            : `$${amount.toFixed(0)}`;
        items.push({
          id: `fund-${item.id}`,
          type: 'funding',
          actor: orgName,
          action: `${formatted} tracked for ${item.program_name || 'youth justice services'}`,
          timestamp: item.created_at,
        });
      }
    }

    // Recent media articles
    const { data: media } = await supabase
      .from('alma_media_articles')
      .select('id, headline, source_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (media?.length) {
      for (const item of media) {
        items.push({
          id: `media-${item.id}`,
          type: 'media',
          actor: item.source_name || 'Media',
          action: `Published: "${item.headline}"`,
          timestamp: item.created_at,
        });
      }
    }

    // Recent organizations added
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, state, created_at')
      .not('name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (orgs?.length) {
      for (const item of orgs) {
        const location = item.state ? ` (${item.state})` : '';
        items.push({
          id: `org-${item.id}`,
          type: 'organization',
          actor: item.name + location,
          action: 'Added to the JusticeHub network',
          timestamp: item.created_at,
        });
      }
    }

    // Sort by timestamp descending and take top 8
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const feed = items.slice(0, 8);

    return NextResponse.json({ feed });
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json({ feed: [] }, { status: 500 });
  }
}
