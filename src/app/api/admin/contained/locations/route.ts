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
    .gt('composite_score', 40)
    .not('recommended_approach', 'is', null)
    .order('composite_score', { ascending: false })
    .limit(300);

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

  // 6. Map people to locations using CITY-level keywords (not state)
  // Each tour stop has its own keyword set to avoid cross-contamination
  const cityKeywords: Record<string, string[]> = {
    'contained-mount-druitt-launch': ['mount druitt', 'mt druitt', 'western sydney', 'wsu', 'sydney details', 'sydney plans', 'redfern', 'parramatta', 'uniting', 'thread together', 'alexandria'],
    'contained-brisbane': ['brisbane', 'yac', 'south brisbane', 'fortitude valley', 'west end', 'noosa', 'toowoomba', 'qld youth justice', 'queensland safer', 'futures radio'],
    'contained-adelaide-reintegration': ['adelaide', 'onkaparinga', 'south australia', 'sa '],
    'contained-townsville-picc': ['townsville', 'palm island', 'picc', 'cleveland ydc', 'garbutt', 'north queensland', 'rachel atkinson'],
    'contained-perth-uwa': ['perth', 'forest chase', 'western australia', 'minderoo', 'banksia hill', 'unit 18', 'kununurra', 'jri perth'],
    'contained-tennant-creek': ['tennant creek', 'alice springs', 'oonchiumpa', 'atnarpa', 'katherine', 'darwin', 'central arrernte'],
  };

  // Outreach contacts have explicit location fields — map directly
  const outreachLocationMap: Record<string, string> = {
    NSW: 'contained-mount-druitt-launch',
    WA: 'contained-perth-uwa',
    VIC: '', // no stop yet
    National: '', // skip
  };

  function matchStop(text: string, stopSlug: string): boolean {
    const keywords = cityKeywords[stopSlug] || [];
    const lower = ` ${text.toLowerCase()} `;
    return keywords.some(kw => lower.includes(kw));
  }

  // Build location data
  const locations = stops.map((stop: any) => {
    const slug = stop.event_slug;
    const state = stop.state;

    // Match people from outreach — by explicit location or keyword match
    const outreachPeople = (outreach || [])
      .filter((o: any) => {
        // Check location + notes for city-level keywords (NOT next_action — it often mentions other locations)
        const searchText = `${o.location || ''} ${o.notes || ''}`;
        if (matchStop(searchText, slug)) return true;
        // Explicit state match — but only if there's one stop per state
        if (o.location === state && stops.filter((s: any) => s.state === state).length === 1) return true;
        return false;
      })
      .map((o: any) => ({
        name: o.name, org: o.org, status: o.status, score: 0,
        approach: o.next_action, location: o.location,
      }));

    // Match people from scored entities — keyword match on approach text
    const entityPeople = (entities || [])
      .filter((e: any) => {
        if (e.entity_type !== 'person') return false;
        const approach = e.recommended_approach || '';
        return matchStop(approach, slug);
      })
      .map((e: any) => ({
        name: e.name, org: e.sector_tag, status: e.outreach_status || 'pending',
        score: e.composite_score, approach: e.recommended_approach, location: null,
      }));

    // Deduplicate (case-insensitive)
    const allPeople = [...outreachPeople];
    const seenNames = new Set(allPeople.map(p => p.name.toLowerCase()));
    for (const ep of entityPeople) {
      if (seenNames.has(ep.name.toLowerCase())) continue;
      seenNames.add(ep.name.toLowerCase());
      allPeople.push(ep);
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

  // Add Melbourne and Canberra as demand-signal locations (not tour stops yet)
  const demandLocations = [
    { city: 'Melbourne', state: 'VIC', keywords: ['melbourne', 'geelong', 'design week', 'cherry creek', 'parkville', 'good bank gallery'] },
    { city: 'Canberra', state: 'ACT', keywords: ['canberra', 'act gov', 'federal level', 'parliament'] },
  ];

  for (const dl of demandLocations) {
    const dlPeople: typeof locations[0]['people'] = [];
    const seenDl = new Set<string>();

    // Check outreach
    for (const o of (outreach || [])) {
      if (o.location === dl.state || dl.keywords.some(kw => ` ${(o.notes || '').toLowerCase()} `.includes(kw))) {
        if (seenDl.has(o.name.toLowerCase())) continue;
        seenDl.add(o.name.toLowerCase());
        dlPeople.push({ name: o.name, org: o.org, status: o.status, score: 0, approach: o.next_action, location: o.location });
      }
    }

    // Check entities
    for (const e of (entities || [])) {
      if (e.entity_type !== 'person') continue;
      const approach = (e.recommended_approach || '').toLowerCase();
      if (!dl.keywords.some(kw => approach.includes(kw))) continue;
      if (seenDl.has(e.name.toLowerCase())) continue;
      seenDl.add(e.name.toLowerCase());
      dlPeople.push({ name: e.name, org: e.sector_tag, status: e.outreach_status || 'pending', score: e.composite_score, approach: e.recommended_approach, location: null });
    }

    if (dlPeople.length > 0) {
      dlPeople.sort((a, b) => {
        const order: Record<string, number> = { hot: 0, overdue: 1, active: 2, responded: 3, warm: 4, 'follow-up': 5, sent: 6, pending: 7, cold: 8 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      });

      locations.push({
        stop: {
          city: dl.city, state: dl.state, partner: 'Demand signal — not a stop yet',
          date: '2026-12-01', status: 'demand',
          description: `${dlPeople.length} people have asked about ${dl.city}. Consider adding as a tour stop.`,
          event_slug: `demand-${dl.city.toLowerCase()}`,
        },
        orgs: [],
        people: dlPeople,
        stats: { indigenous_orgs: 0, interventions: 0, funding_records: 0 },
      });
    }
  }

  // Add a "National / Unassigned" bucket for people not matching any stop
  // Exclude the national bucket itself from assigned names
  const assignedNames = new Set(locations.flatMap((l: any) => l.people.map((p: any) => p.name)));

  const nationalOutreach = (outreach || [])
    .filter((o: any) => !assignedNames.has(o.name))
    .map((o: any) => ({
      name: o.name, org: o.org, status: o.status, score: 0,
      approach: o.next_action, location: o.location,
    }));

  const nationalEntities = (entities || [])
    .filter((e: any) => e.entity_type === 'person' && !assignedNames.has(e.name))
    .slice(0, 20)
    .map((e: any) => ({
      name: e.name, org: e.sector_tag, status: e.outreach_status || 'pending',
      score: e.composite_score, approach: e.recommended_approach, location: null,
    }));

  const nationalPeople: typeof nationalOutreach = [];
  const seenNational = new Set<string>();
  for (const p of [...nationalOutreach, ...nationalEntities]) {
    if (seenNational.has(p.name)) continue;
    seenNational.add(p.name);
    nationalPeople.push(p);
  }
  nationalPeople.sort((a, b) => {
    const order: Record<string, number> = { hot: 0, overdue: 1, active: 2, responded: 3, warm: 4, 'follow-up': 5, sent: 6, pending: 7, cold: 8 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  locations.push({
    stop: {
      city: 'National / Unassigned', state: 'ALL', partner: 'Not linked to a specific tour stop',
      date: '2026-12-31', status: 'ongoing', description: 'People engaged with the campaign who haven\'t been assigned to a specific tour stop location yet.',
      event_slug: 'national',
    },
    orgs: [],
    people: nationalPeople,
    stats: { indigenous_orgs: 0, interventions: 0, funding_records: 0 },
  });

  return NextResponse.json({ locations });
}
