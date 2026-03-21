import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const abn = request.nextUrl.searchParams.get('abn');
    const orgId = request.nextUrl.searchParams.get('org_id');

    if (!abn && !orgId) {
      return NextResponse.json({ error: 'abn or org_id required' }, { status: 400 });
    }

    // 1. Get the org
    const orgFilter = abn
      ? `WHERE o.abn = '${abn.replace(/'/g, "''")}'`
      : `WHERE o.id = '${(orgId || '').replace(/'/g, "''")}'`;

    const { data: orgRows } = await supabase.rpc('exec_sql', {
      query: `
        SELECT o.id, o.name, o.state, o.is_indigenous_org, o.abn,
               o.acnc_data->>'seifa_irsd_decile' as seifa_decile,
               o.acnc_data->>'seifa_irsd_score' as seifa_score
        FROM organizations o
        ${orgFilter}
        LIMIT 1
      `
    });

    if (!orgRows?.length) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    }

    const org = orgRows[0];
    const state = org.state || 'Unknown';

    // Run remaining queries in parallel
    const [findingsResult, relatedResult, similarResult, overlapResult] = await Promise.all([
      // 2. Relevant research findings for this state
      supabase.rpc('exec_sql', {
        query: `
          SELECT content, finding_type, confidence, sources
          FROM alma_research_findings
          WHERE (
            content::text ILIKE '%${state.replace(/'/g, "''")}%'
            OR finding_type IN ('recidivism', 'cost_effectiveness', 'indigenous_justice')
          )
          ORDER BY confidence DESC NULLS LAST
          LIMIT 5
        `
      }),

      // 3. Related orgs in same state with interventions
      supabase.rpc('exec_sql', {
        query: `
          SELECT o.name, o.abn,
                 COUNT(DISTINCT ai.id) as programs,
                 MAX(ai.evidence_level) as best_evidence
          FROM organizations o
          JOIN alma_interventions ai ON ai.organization_id = o.id
          WHERE o.state = '${state.replace(/'/g, "''")}'
            AND o.id != '${org.id}'
            AND ai.verification_status != 'ai_generated'
          GROUP BY o.id, o.name, o.abn
          ORDER BY COUNT(DISTINCT ai.id) DESC
          LIMIT 8
        `
      }),

      // 4. Similar charities — same ACNC beneficiary flags, prioritise same state
      (async () => {
        // First get this charity's flags
        const { data: thisCharity } = await supabase
          .from('acnc_charities')
          .select('ben_aboriginal_tsi, ben_youth, ben_children, ben_pre_post_release, ben_victims_of_crime, ben_people_at_risk_of_homelessness, state')
          .eq('abn', abn || '')
          .limit(1)
          .single();

        if (!thisCharity) return { data: [] };

        // Build filter: must share at least one key beneficiary
        let query = supabase
          .from('acnc_charities')
          .select('name, abn, charity_size, town_city, state, ben_aboriginal_tsi, ben_youth, ben_children, ben_pre_post_release, ben_victims_of_crime')
          .neq('abn', abn || '')
          .not('name', 'eq', '')
          .limit(8);

        // Prioritise same state
        if (thisCharity.state) {
          query = query.eq('state', thisCharity.state);
        }

        // Must serve youth or pre/post release
        if (thisCharity.ben_youth && thisCharity.ben_pre_post_release) {
          query = query.or('ben_youth.eq.true,ben_pre_post_release.eq.true');
        } else if (thisCharity.ben_youth) {
          query = query.eq('ben_youth', true);
        } else if (thisCharity.ben_pre_post_release) {
          query = query.eq('ben_pre_post_release', true);
        }

        const { data: rows } = await query;
        return { data: rows || [] };
      })(),

      // 5. System overlap — check what cross-system issues appear in findings for this state
      supabase.rpc('exec_sql', {
        query: `
          SELECT
            EXISTS(SELECT 1 FROM alma_research_findings WHERE content::text ILIKE '%child protection%' AND content::text ILIKE '%${state.replace(/'/g, "''")}%') as child_protection,
            EXISTS(SELECT 1 FROM alma_research_findings WHERE content::text ILIKE '%disability%' AND content::text ILIKE '%${state.replace(/'/g, "''")}%') as disability,
            EXISTS(SELECT 1 FROM alma_research_findings WHERE content::text ILIKE '%homelessness%' AND content::text ILIKE '%${state.replace(/'/g, "''")}%') as homelessness,
            EXISTS(SELECT 1 FROM alma_research_findings WHERE content::text ILIKE '%poverty%' AND content::text ILIKE '%${state.replace(/'/g, "''")}%') as poverty
        `
      }),
    ]);

    // Build SEIFA context
    const seifaDecile = org.seifa_decile ? parseInt(org.seifa_decile) : null;
    const seifa = seifaDecile ? {
      decile: seifaDecile,
      label: seifaDecile <= 2 ? 'Most disadvantaged' :
             seifaDecile <= 4 ? 'Disadvantaged' :
             seifaDecile <= 6 ? 'Middle' :
             seifaDecile <= 8 ? 'Less disadvantaged' : 'Least disadvantaged',
    } : null;

    // Format related orgs
    const relatedOrgs = (relatedResult.data || []).map((r: Record<string, unknown>) => ({
      name: r.name,
      abn: r.abn,
      programs: Number(r.programs),
      evidence: r.best_evidence ? String(r.best_evidence).split(' (')[0] : 'Untested',
    }));

    // Format findings
    const findings = (findingsResult.data || []).map((f: Record<string, unknown>) => ({
      content: f.content,
      finding_type: f.finding_type,
      confidence: f.confidence,
      sources: f.sources || [],
    }));

    // Format system overlap
    const overlapRow = overlapResult.data?.[0] || {};
    const systemOverlap = {
      childProtection: !!overlapRow.child_protection,
      disability: !!overlapRow.disability,
      homelessness: !!overlapRow.homelessness,
      poverty: !!overlapRow.poverty,
    };

    // Format similar charities
    const similarCharities = (similarResult.data || []).map((c: Record<string, unknown>) => {
      const tags: string[] = [];
      if (c.ben_aboriginal_tsi) tags.push('First Nations');
      if (c.ben_youth) tags.push('Youth');
      if (c.ben_children) tags.push('Children');
      if (c.ben_pre_post_release) tags.push('Pre/Post Release');
      if (c.ben_victims_of_crime) tags.push('Victims of Crime');
      return {
        name: c.name,
        abn: c.abn,
        size: c.charity_size,
        location: [c.town_city, c.state].filter(Boolean).join(', '),
        tags,
        matchScore: Number(c.match_score),
      };
    });

    return NextResponse.json({
      org: { id: org.id, name: org.name, state, isIndigenous: org.is_indigenous_org },
      seifa,
      relatedOrgs,
      findings,
      systemOverlap,
      similarCharities,
    });
  } catch (err) {
    console.error('org-context error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
