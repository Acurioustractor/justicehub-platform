import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * ALMA Research Agent API
 *
 * POST /api/intelligence/research - Start a new research session
 * GET /api/intelligence/research - List recent research sessions
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      query,
      depth = 'quick',
      maxConsentLevel = 'Public Knowledge Commons',
    } = body;

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Create research session
    const { data: session, error: sessionError } = await supabase
      .rpc('create_research_session', {
        p_query: query.trim(),
        p_depth: depth,
        p_max_consent_level: maxConsentLevel,
      });

    if (sessionError) {
      console.error('Failed to create research session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create research session' },
        { status: 500 }
      );
    }

    // Generate research plan based on query
    const plan = generateResearchPlan(query, depth);

    // Update session with plan
    await supabase.rpc('update_research_session', {
      p_session_id: session,
      p_status: 'planning',
      p_plan: plan,
    });

    // For quick depth, execute synchronously
    if (depth === 'quick') {
      const results = await executeQuickResearch(supabase, session, query, maxConsentLevel);

      await supabase.rpc('update_research_session', {
        p_session_id: session,
        p_status: 'complete',
        p_results: results,
      });

      return NextResponse.json({
        sessionId: session,
        status: 'complete',
        results,
      });
    }

    // For thorough/comprehensive, return session ID for polling
    return NextResponse.json({
      sessionId: session,
      status: 'planning',
      plan,
      message: 'Research session created. Poll /api/intelligence/research/[sessionId] for results.',
    });

  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data: sessions, error } = await supabase
      .from('alma_research_sessions')
      .select('id, query, status, depth, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch research sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a research plan based on the query
 */
function generateResearchPlan(query: string, depth: string) {
  const queryLower = query.toLowerCase();
  const steps = [];

  // Always start with ALMA search
  steps.push({
    step: 1,
    tool: 'search_alma_interventions',
    description: 'Search ALMA knowledge base for relevant interventions',
    status: 'pending',
  });

  // Check for geographic focus
  const jurisdictions = ['nt', 'qld', 'nsw', 'vic', 'wa', 'sa', 'tas', 'act'];
  const hasJurisdiction = jurisdictions.some(j =>
    queryLower.includes(j) || queryLower.includes(getFullJurisdictionName(j))
  );

  if (hasJurisdiction) {
    steps.push({
      step: 2,
      tool: 'get_jurisdiction_stats',
      description: 'Get jurisdiction-specific statistics',
      status: 'pending',
    });
  }

  // Check for evidence/outcome focus
  if (queryLower.includes('evidence') || queryLower.includes('effective') || queryLower.includes('works')) {
    steps.push({
      step: steps.length + 1,
      tool: 'get_intervention_comprehensive',
      description: 'Get detailed evidence for top interventions',
      status: 'pending',
    });
  }

  // Check for gap analysis
  if (queryLower.includes('gap') || queryLower.includes('missing') || queryLower.includes('need')) {
    steps.push({
      step: steps.length + 1,
      tool: 'find_evidence_gaps',
      description: 'Identify evidence gaps in the data',
      status: 'pending',
    });
  }

  // For thorough/comprehensive, add more steps
  if (depth !== 'quick') {
    steps.push({
      step: steps.length + 1,
      tool: 'compare_interventions',
      description: 'Compare top interventions',
      status: 'pending',
    });

    steps.push({
      step: steps.length + 1,
      tool: 'synthesize',
      description: 'Synthesize findings into research summary',
      status: 'pending',
    });
  }

  return steps;
}

function getFullJurisdictionName(abbrev: string): string {
  const names: Record<string, string> = {
    nt: 'northern territory',
    qld: 'queensland',
    nsw: 'new south wales',
    vic: 'victoria',
    wa: 'western australia',
    sa: 'south australia',
    tas: 'tasmania',
    act: 'australian capital territory',
  };
  return names[abbrev] || abbrev;
}

/**
 * Execute quick research (synchronous, limited scope)
 */
async function executeQuickResearch(
  supabase: any,
  sessionId: string,
  query: string,
  maxConsentLevel: string
) {
  const startTime = Date.now();
  const findings: any[] = [];

  // Step 1: Search interventions
  const { data: interventions, error: searchError } = await supabase
    .rpc('search_alma_interventions', {
      p_query: query,
      p_consent_level: maxConsentLevel,
      p_limit: 10,
    });

  // Log tool execution
  await supabase.rpc('log_research_tool', {
    p_session_id: sessionId,
    p_tool_name: 'search_alma_interventions',
    p_tool_input: { query, consent_level: maxConsentLevel },
    p_tool_output: { count: interventions?.length || 0 },
    p_execution_time_ms: Date.now() - startTime,
    p_success: !searchError,
    p_error_message: searchError?.message,
  });

  if (searchError || !interventions?.length) {
    return {
      query,
      interventions: [],
      summary: `No interventions found matching "${query}"`,
      evidenceGaps: [],
      recommendations: ['Broaden search terms', 'Check for alternative program names'],
    };
  }

  // Step 2: Get comprehensive data for top 3 interventions
  const topInterventions = interventions.slice(0, 3);
  const comprehensiveData = [];

  for (const intervention of topInterventions) {
    const { data: comprehensive } = await supabase
      .rpc('get_intervention_comprehensive', {
        p_intervention_id: intervention.id,
      });

    if (comprehensive) {
      comprehensiveData.push(comprehensive);

      // Record finding if has evidence
      if (comprehensive.evidence?.length > 0) {
        await supabase.rpc('record_research_finding', {
          p_session_id: sessionId,
          p_finding_type: 'evidence_link',
          p_content: {
            intervention: intervention.name,
            evidence_count: comprehensive.evidence.length,
          },
          p_entity_type: 'intervention',
          p_entity_id: intervention.id,
          p_confidence: 0.9,
        });
      }
    }
  }

  // Step 3: Find evidence gaps
  const { data: gaps } = await supabase
    .rpc('find_evidence_gaps', {
      p_limit: 5,
    });

  if (gaps?.length) {
    await supabase.rpc('record_research_finding', {
      p_session_id: sessionId,
      p_finding_type: 'gap_identified',
      p_content: {
        gap_count: gaps.length,
        critical_gaps: gaps.filter((g: any) => g.gap_severity === 'critical').length,
      },
      p_confidence: 0.85,
    });
  }

  // Generate summary
  const summary = generateResearchSummary(query, interventions, comprehensiveData, gaps);

  return {
    query,
    interventions: interventions.map((i: any) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      geography: i.geography,
      evidenceLevel: i.evidence_level,
      evidenceCount: i.evidence_count,
      outcomeCount: i.outcome_count,
    })),
    topInterventionDetails: comprehensiveData,
    evidenceGaps: gaps || [],
    summary,
    recommendations: generateRecommendations(interventions, gaps),
    executionTimeMs: Date.now() - startTime,
  };
}

function generateResearchSummary(
  query: string,
  interventions: any[],
  comprehensiveData: any[],
  gaps: any[]
) {
  const total = interventions.length;
  const withEvidence = interventions.filter(i => i.evidence_count > 0).length;
  const withOutcomes = interventions.filter(i => i.outcome_count > 0).length;

  let summary = `## Research Summary: "${query}"\n\n`;
  summary += `Found **${total} interventions** matching your query.\n\n`;

  if (withEvidence > 0) {
    summary += `- ${withEvidence} have linked evidence research\n`;
  }
  if (withOutcomes > 0) {
    summary += `- ${withOutcomes} have linked outcome measures\n`;
  }

  if (comprehensiveData.length > 0) {
    summary += `\n### Top Interventions\n\n`;
    comprehensiveData.forEach((data, i) => {
      const intervention = data.intervention;
      summary += `**${i + 1}. ${intervention.name}**\n`;
      summary += `- Type: ${intervention.type}\n`;
      summary += `- Evidence Level: ${intervention.evidence_level || 'Unknown'}\n`;
      if (data.evidence?.length > 0) {
        summary += `- Evidence: ${data.evidence.length} studies linked\n`;
      }
      summary += '\n';
    });
  }

  if (gaps?.length > 0) {
    const critical = gaps.filter((g: any) => g.gap_severity === 'critical');
    if (critical.length > 0) {
      summary += `\n### ⚠️ Evidence Gaps\n\n`;
      summary += `${critical.length} interventions have critical evidence gaps requiring attention.\n`;
    }
  }

  return summary;
}

function generateRecommendations(interventions: any[], gaps: any[]) {
  const recommendations = [];

  if (interventions.length === 0) {
    recommendations.push('Expand search to include related terms');
    recommendations.push('Check spelling of program names');
  } else if (interventions.filter(i => i.evidence_count === 0).length > interventions.length / 2) {
    recommendations.push('Many interventions lack evidence - consider commissioning research');
  }

  if (gaps?.filter((g: any) => g.gap_severity === 'critical').length > 3) {
    recommendations.push('Prioritize filling critical evidence gaps');
  }

  recommendations.push('Use "Research This" on specific interventions for deeper analysis');

  return recommendations;
}
