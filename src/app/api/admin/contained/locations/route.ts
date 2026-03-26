import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient() as any;

  // 1. Get all tour stops
  const { data: stops } = await supabase
    .from('tour_stops')
    .select('city, state, venue, partner, description, event_slug, date, status')
    .eq('campaign_slug', 'the-contained')
    .order('date');

  if (!stops || stops.length === 0) {
    return NextResponse.json({ locations: [] });
  }

  // 2. Get all outreach contacts
  const { data: outreach } = await supabase
    .from('campaign_outreach')
    .select('name, org, location, status, priority, next_action, notes');

  // 3. Get scored campaign entities with approaches
  const { data: entities } = await supabase
    .from('campaign_alignment_entities')
    .select('name, entity_type, sector_tag, composite_score, outreach_status, recommended_approach')
    .gt('composite_score', 50)
    .order('composite_score', { ascending: false })
    .limit(200);

  // 4. For each stop state, get top Indigenous orgs
  const states = [...new Set(stops.map((s: any) => s.state))] as string[];
  const orgsByState: Record<string, any[]> = {};

  for (const state of states) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('name, city, is_indigenous_org')
      .eq('state', state)
      .eq('is_active', true)
      .eq('is_indigenous_org', true)
      .order('name')
      .limit(12);
    orgsByState[state] = (orgs || []).map((o: any) => ({
      name: o.name, city: o.city, is_indigenous_org: true,
      interventions: 0, total_funding: 0,
    }));
  }

  // 5. Get state-level stats (simple counts, no nested queries)
  const statsByState: Record<string, any> = {};
  for (const state of states) {
    const { count: indOrgs } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('state', state)
      .eq('is_indigenous_org', true)
      .eq('is_active', true);

    statsByState[state] = {
      indigenous_orgs: indOrgs || 0,
      interventions: 0,
      funding_records: 0,
    };
  }

  // 6. Map people to locations
  const stateKeywords: Record<string, string[]> = {
    NSW: ['nsw', 'sydney', 'mount druitt', 'mt druitt', 'redfern', 'parramatta', 'armidale'],
    QLD: ['qld', 'queensland', 'brisbane', 'townsville', 'palm island', 'noosa', 'toowoomba', 'mount isa', 'cairns', 'yac'],
    VIC: ['vic', 'victoria', 'melbourne', 'geelong'],
    SA: ['sa ', 'south australia', 'adelaide', 'onkaparinga'],
    WA: ['wa ', 'western australia', 'perth', 'forest chase', 'kununurra', 'minderoo'],
    NT: ['nt ', 'northern territory', 'alice springs', 'tennant creek', 'darwin', 'katherine', 'oonchiumpa'],
  };

  function matchState(text: string): string[] {
    const lower = ` ${text.toLowerCase()} `;
    return Object.entries(stateKeywords)
      .filter(([, keywords]) => keywords.some(kw => lower.includes(kw)))
      .map(([st]) => st);
  }

  // Build location data
  const locations = stops.map((stop: any) => {
    const state = stop.state;

    // Match people from outreach
    const outreachPeople = (outreach || [])
      .filter((o: any) => {
        if (o.location === state) return true;
        if (o.location === 'National') return false;
        const matched = matchState(`${o.location || ''} ${o.notes || ''}`);
        return matched.includes(state);
      })
      .map((o: any) => ({
        name: o.name, org: o.org, status: o.status, score: 0,
        approach: o.next_action, location: o.location,
      }));

    // Match people from scored entities
    const entityPeople = (entities || [])
      .filter((e: any) => {
        if (e.entity_type !== 'person') return false;
        const approach = e.recommended_approach || '';
        const matched = matchState(approach);
        return matched.includes(state);
      })
      .map((e: any) => ({
        name: e.name, org: e.sector_tag, status: e.outreach_status || 'pending',
        score: e.composite_score, approach: e.recommended_approach, location: null,
      }));

    // Deduplicate
    const allPeople = [...outreachPeople];
    for (const ep of entityPeople) {
      if (!allPeople.find(p => p.name === ep.name)) allPeople.push(ep);
    }
    allPeople.sort((a, b) => {
      const order: Record<string, number> = { hot: 0, overdue: 1, active: 2, responded: 3, warm: 4, 'follow-up': 5, sent: 6, pending: 7, cold: 8 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });

    return {
      stop: {
        city: stop.city, state: stop.state, partner: stop.partner,
        date: stop.date, status: stop.status, description: stop.description,
        event_slug: stop.event_slug,
      },
      orgs: orgsByState[state] || [],
      people: allPeople,
      stats: statsByState[state] || { indigenous_orgs: 0, interventions: 0, funding_records: 0 },
    };
  });

  return NextResponse.json({ locations });
}
