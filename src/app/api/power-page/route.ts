import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const view = params.get('view') || 'stats';
  const state = params.get('state') || 'QLD';

  if (view === 'sankey') {
    const { data, error } = await supabase.rpc('power_page_sankey', { p_state: state });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'network') {
    const limit = Math.min(parseInt(params.get('limit') || '80'), 200);
    const { data, error } = await supabase.rpc('power_page_network', {
      p_state: state,
      p_limit: limit,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'map') {
    const { data, error } = await supabase.rpc('justice_funding_map_locations', {
      p_state: state,
      p_q: params.get('q') || null,
      p_sector: params.get('sector') || null,
      p_indigenous_only: params.get('indigenous') === 'true',
      p_location: null,
      p_funding_type: null,
      p_source: null,
      p_beneficiary: null,
      p_purpose: null,
      p_charity_size: null,
      p_alma_only: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'stats') {
    const [overview, power] = await Promise.all([
      supabase.rpc('justice_funding_overview', { p_state: state }),
      supabase.rpc('justice_funding_power_concentration', { p_state: state }),
    ]);
    if (overview.error) return NextResponse.json({ error: overview.error.message }, { status: 500 });
    return NextResponse.json({
      overview: overview.data,
      power: power.data,
    });
  }

  if (view === 'evidence') {
    // State name mapping for geography array matching
    const stateNames: Record<string, string[]> = {
      QLD: ['QLD', 'Queensland'],
      NSW: ['NSW', 'New South Wales'],
      VIC: ['VIC', 'Victoria'],
      WA: ['WA', 'Western Australia'],
      SA: ['SA', 'South Australia'],
      TAS: ['TAS', 'Tasmania'],
      ACT: ['ACT', 'Australian Capital Territory'],
      NT: ['NT', 'Northern Territory'],
    };
    const geoMatches = [...(stateNames[state] || [state]), 'National'];

    // Get a diverse mix: top interventions per evidence level category
    const { data, error } = await supabase
      .from('alma_interventions')
      .select('id, name, type, portfolio_score, evidence_level, community_authority_signal, harm_risk_level, geography')
      .not('portfolio_score', 'is', null)
      .overlaps('geography', geoMatches)
      .order('portfolio_score', { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Ensure diverse evidence levels — pick top from each category
    const categories = ['Proven', 'Effective', 'Promising', 'Indigenous-led'];
    const result: typeof data = [];
    const limit = parseInt(params.get('limit') || '20');

    for (const cat of categories) {
      const matching = (data || []).filter(d =>
        d.evidence_level?.startsWith(cat) && !result.find(r => r.id === d.id)
      );
      result.push(...matching.slice(0, Math.ceil(limit / categories.length)));
    }
    // Fill remaining slots with highest-scored not yet included
    for (const d of (data || [])) {
      if (result.length >= limit) break;
      if (!result.find(r => r.id === d.id)) result.push(d);
    }

    // Sort final list by score descending
    result.sort((a, b) => (b.portfolio_score || 0) - (a.portfolio_score || 0));

    // Convert scores to 0-100 and drop total_funding (no linked data exists)
    const formatted = result.slice(0, limit).map(d => ({
      ...d,
      portfolio_score: Math.round((d.portfolio_score || 0) * 100),
      total_funding: 0,
    }));

    return NextResponse.json(formatted);
  }

  if (view === 'top-orgs') {
    const limit = Math.min(parseInt(params.get('limit') || '50'), 100);
    const { data, error } = await supabase.rpc('power_page_top_orgs', {
      p_state: state,
      p_limit: limit,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'donations') {
    const { data, error } = await supabase.rpc('power_page_donations', {
      p_state: state,
      p_limit: parseInt(params.get('limit') || '50'),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
}
