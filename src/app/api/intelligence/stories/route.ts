import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/* ── Types ────────────────────────────────────────────────────── */

interface OrgContext {
  id: string;
  name: string;
  state: string | null;
  is_indigenous_org: boolean;
  control_type: string | null;
  funding_total: number;
  intervention_count: number;
  interventions: {
    name: string;
    evidence_level: string | null;
    cost_per_young_person: number | null;
  }[];
}

interface StoryWithContext {
  id: string;
  title: string;
  summary: string | null;
  full_story: string | null;
  story_type: string | null;
  region_slug: string | null;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  source: 'alma_stories' | 'synced_stories';
  organizations: OrgContext[];
}

/* ── Route ────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const supabase = createServiceClient();

    // 1. Fetch all alma_stories
    const [almaRes, syncedRes] = await Promise.all([
      supabase
        .from('alma_stories')
        .select('id, title, summary, full_story, story_type, region_slug, featured, published_at, created_at, linked_organization_ids')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('synced_stories')
        .select('id, title, summary, story_type, themes, is_featured, created_at, source')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const almaStories = almaRes.data || [];
    const syncedStories = syncedRes.data || [];

    // 2. Collect all unique org IDs from alma_stories
    const orgIds = new Set<string>();
    for (const story of almaStories) {
      const linked = story.linked_organization_ids as string[] | null;
      if (linked) {
        for (const id of linked) orgIds.add(id);
      }
    }

    // 3. Fetch org details, funding totals, and interventions for linked orgs
    let orgMap: Record<string, OrgContext> = {};

    if (orgIds.size > 0) {
      const orgIdArr = Array.from(orgIds);

      const [orgsRes, fundingRes, interventionsRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, state, is_indigenous_org, control_type')
          .in('id', orgIdArr),
        supabase
          .from('justice_funding')
          .select('alma_organization_id, amount_dollars')
          .in('alma_organization_id', orgIdArr)
          .gt('amount_dollars', 0),
        supabase
          .from('alma_interventions')
          .select('name, evidence_level, cost_per_young_person, operating_organization_id')
          .in('operating_organization_id', orgIdArr)
          .neq('verification_status', 'ai_generated'),
      ]);

      const orgs = orgsRes.data || [];
      const funding = fundingRes.data || [];
      const interventions = interventionsRes.data || [];

      // Build funding totals per org
      const fundingByOrg: Record<string, number> = {};
      for (const f of funding) {
        const oid = f.alma_organization_id;
        if (oid) {
          fundingByOrg[oid] = (fundingByOrg[oid] || 0) + (Number(f.amount_dollars) || 0);
        }
      }

      // Build interventions per org
      const interventionsByOrg: Record<string, typeof interventions> = {};
      for (const i of interventions) {
        const oid = (i as any).operating_organization_id;
        if (oid) {
          if (!interventionsByOrg[oid]) interventionsByOrg[oid] = [];
          interventionsByOrg[oid].push(i);
        }
      }

      // Build org map
      for (const org of orgs) {
        orgMap[org.id] = {
          id: org.id,
          name: org.name,
          state: org.state,
          is_indigenous_org: org.is_indigenous_org ?? false,
          control_type: org.control_type,
          funding_total: fundingByOrg[org.id] || 0,
          intervention_count: interventionsByOrg[org.id]?.length || 0,
          interventions: (interventionsByOrg[org.id] || []).map((i: any) => ({
            name: i.name,
            evidence_level: i.evidence_level,
            cost_per_young_person: i.cost_per_young_person,
          })),
        };
      }
    }

    // 4. Build response — alma stories with org context
    const storiesWithContext: StoryWithContext[] = almaStories.map((s: any) => {
      const linkedIds = (s.linked_organization_ids as string[] | null) || [];
      return {
        id: s.id,
        title: s.title,
        summary: s.summary,
        full_story: s.full_story,
        story_type: s.story_type,
        region_slug: s.region_slug,
        featured: s.featured ?? false,
        published_at: s.published_at,
        created_at: s.created_at,
        source: 'alma_stories' as const,
        organizations: linkedIds
          .map((id: string) => orgMap[id])
          .filter(Boolean),
      };
    });

    // 5. Add synced stories (no org linkage, simpler)
    for (const s of syncedStories) {
      storiesWithContext.push({
        id: s.id,
        title: s.title || 'Untitled',
        summary: s.summary,
        full_story: null,
        story_type: s.story_type,
        region_slug: null,
        featured: s.is_featured ?? false,
        published_at: null,
        created_at: s.created_at,
        source: 'synced_stories' as const,
        organizations: [],
      });
    }

    // 6. Stats for the "stories we can't tell yet" section
    // Count LGAs with organizations but no stories
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('is_indigenous_org', true);

    const statesWithStories = new Set(
      almaStories
        .flatMap((s: any) => {
          const ids = (s.linked_organization_ids as string[] | null) || [];
          return ids.map((id: string) => orgMap[id]?.state).filter(Boolean);
        })
    );

    return NextResponse.json({
      stories: storiesWithContext,
      stats: {
        alma_story_count: almaStories.length,
        synced_story_count: syncedStories.length,
        total_indigenous_orgs: totalOrgs || 0,
        states_with_stories: Array.from(statesWithStories),
        states_without_stories: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'].filter(
          s => !statesWithStories.has(s)
        ),
      },
    });
  } catch (err: any) {
    console.error('[stories API]', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
