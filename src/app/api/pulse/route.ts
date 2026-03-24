import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min cache

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTH_JUSTICE_KEYWORDS = [
  'youth', 'justice', 'detention', 'child', 'young people', 'juvenile',
  'diversion', 'reoffending', 'recidivism', 'bail', 'remand', 'watch house',
  'early intervention', 'rehabilitation', 'therapeutic', 'community safety'
];

function youthJusticeFilter(column: string) {
  return YOUTH_JUSTICE_KEYWORDS.map(k => `${column}.ilike.%${k}%`).join(',');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      statementsRes,
      mediaRes,
      evidenceRes,
      findingsRes,
      alertsRes,
      hansardRes,
      opportunitiesRes,
      interventionsRes,
      storiesRes,
    ] = await Promise.all([
      // Government statements — youth justice filtered
      supabase
        .from('civic_ministerial_statements')
        .select('id, headline, minister_name, portfolio, published_at, summary, source_url, topics, jurisdiction, mentioned_amounts, mentioned_orgs')
        .or(youthJusticeFilter('headline') + ',' + youthJusticeFilter('body_text'))
        .gte('published_at', cutoff)
        .order('published_at', { ascending: false })
        .limit(20),

      // Media coverage
      supabase
        .from('alma_media_articles')
        .select('id, headline, source_name, published_date, sentiment, sentiment_score, topics, summary, url')
        .order('created_at', { ascending: false })
        .limit(20),

      // New evidence
      supabase
        .from('alma_evidence')
        .select('id, title, source_url, evidence_type, created_at')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(15),

      // Research findings
      supabase
        .from('alma_research_findings')
        .select('id, finding_type, confidence, content, sources, created_at')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(10),

      // Civic alerts
      supabase
        .from('civic_alerts')
        .select('id, title, alert_type, severity, summary, source_url, created_at')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(10),

      // Hansard
      supabase
        .from('civic_hansard')
        .select('id, title, speaker, party, chamber, spoken_at, summary, source_url, topics')
        .or(youthJusticeFilter('title') + ',' + youthJusticeFilter('summary'))
        .gte('spoken_at', cutoff)
        .order('spoken_at', { ascending: false })
        .limit(10),

      // Open funding opportunities
      supabase
        .from('alma_funding_opportunities')
        .select('id, name, funder_name, source_type, category, min_grant_amount, max_grant_amount, deadline, status, jurisdictions, source_url, application_url')
        .eq('status', 'open')
        .order('deadline', { ascending: true })
        .limit(10),

      // Recently added interventions
      supabase
        .from('alma_interventions')
        .select('id, name, evidence_level, operating_organization, cost_per_young_person, created_at')
        .neq('verification_status', 'ai_generated')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(10),

      // Recent Empathy Ledger stories
      supabase
        .from('synced_stories')
        .select('id, title, excerpt, image_url, published_at, slug')
        .eq('source', 'empathy_ledger')
        .order('published_at', { ascending: false })
        .limit(5),
    ]);

    // Build stats
    const totalStatements = statementsRes.data?.length || 0;
    const totalMedia = mediaRes.data?.length || 0;
    const totalEvidence = evidenceRes.data?.length || 0;
    const totalAlerts = alertsRes.data?.length || 0;

    const negativeSentiment = (mediaRes.data || []).filter(m => m.sentiment === 'negative').length;
    const positiveSentiment = (mediaRes.data || []).filter(m => m.sentiment === 'positive').length;

    return NextResponse.json({
      period_days: days,
      generated_at: new Date().toISOString(),
      stats: {
        government_statements: totalStatements,
        media_articles: totalMedia,
        new_evidence: totalEvidence,
        civic_alerts: totalAlerts,
        media_sentiment: {
          positive: positiveSentiment,
          negative: negativeSentiment,
          neutral: totalMedia - positiveSentiment - negativeSentiment,
        },
      },
      government: {
        statements: statementsRes.data || [],
        hansard: hansardRes.data || [],
      },
      media: mediaRes.data || [],
      evidence: {
        new_sources: evidenceRes.data || [],
        findings: findingsRes.data || [],
      },
      alerts: alertsRes.data || [],
      opportunities: opportunitiesRes.data || [],
      interventions: interventionsRes.data || [],
      stories: storiesRes.data || [],
    });
  } catch (error) {
    console.error('Pulse API error:', error);
    return NextResponse.json({ error: 'Failed to generate pulse' }, { status: 500 });
  }
}
