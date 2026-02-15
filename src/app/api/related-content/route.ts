import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type'); // 'intervention', 'article', 'evidence', 'story', 'profile'
  const id = searchParams.get('id');

  if (!type || !id) {
    return NextResponse.json(
      { error: 'Missing required parameters: type and id' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    switch (type) {
      case 'intervention':
        return await getInterventionRelatedContent(supabase, id);

      case 'article':
        return await getArticleRelatedContent(supabase, id);

      case 'evidence':
        return await getEvidenceRelatedContent(supabase, id);

      case 'story':
        return await getStoryRelatedContent(supabase, id);

      case 'profile':
        return await getProfileRelatedContent(supabase, id);

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error fetching related content:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function normalizeEvidenceItem(evidence: any) {
  if (!evidence) return null;
  return {
    id: evidence.id,
    title: evidence.title,
    source_title: evidence.metadata?.source_title || evidence.source_url || 'Source unavailable',
  };
}

async function getInterventionRelatedContent(supabase: any, interventionId: string) {
  // Fetch all related content for an intervention
  const [
    { data: articles },
    { data: stories },
    { data: profiles },
    { data: evidence },
    { data: mediaArticles },
  ] = await Promise.all([
    // Related articles
    supabase
      .from('article_related_interventions')
      .select(`
        relevance_note,
        articles:article_id (
          id,
          title,
          slug
        )
      `)
      .eq('intervention_id', interventionId),

    // Related stories
    supabase
      .from('story_related_interventions')
      .select(`
        relevance_note,
        stories:story_id (
          id,
          title,
          slug
        )
      `)
      .eq('intervention_id', interventionId),

    // Related profiles
    supabase
      .from('alma_intervention_profiles')
      .select(`
        role,
        notes,
        public_profiles:public_profile_id (
          id,
          first_name,
          last_name,
          slug
        )
      `)
      .eq('intervention_id', interventionId),

    // Related evidence (through the intervention)
    supabase
      .from('alma_intervention_evidence')
      .select(`
        evidence_id,
        alma_evidence:evidence_id (
          id,
          title,
          source_url,
          metadata
        )
      `)
      .eq('intervention_id', interventionId),

    // Media mentions (from alma_media_articles that mention this intervention)
    supabase
      .from('alma_media_articles')
      .select('id, headline, source_name, article_url')
      .contains('related_programs', [interventionId])
      .limit(10),
  ]);

  return NextResponse.json({
    articles: articles?.map((item: any) => ({
      ...item.articles,
      relevance_note: item.relevance_note,
    })) || [],
    stories: stories?.map((item: any) => ({
      ...item.stories,
      relevance_note: item.relevance_note,
    })) || [],
    profiles: profiles?.map((item: any) => ({
      ...item.public_profiles,
      role: item.role,
      relevance_note: item.notes,
    })) || [],
    evidence: evidence?.map((item: any) => normalizeEvidenceItem(item.alma_evidence)).filter(Boolean) || [],
    mediaArticles: mediaArticles || [],
  });
}

async function getArticleRelatedContent(supabase: any, articleId: string) {
  // Fetch all related content for an article
  const [
    { data: interventions },
    { data: evidence },
  ] = await Promise.all([
    // Related interventions
    supabase
      .from('article_related_interventions')
      .select(`
        relevance_note,
        alma_interventions:intervention_id (
          id,
          name
        )
      `)
      .eq('article_id', articleId),

    // Related evidence
    supabase
      .from('article_related_evidence')
      .select(`
        relevance_note,
        alma_evidence:evidence_id (
          id,
          title,
          source_url,
          metadata
        )
      `)
      .eq('article_id', articleId),
  ]);

  return NextResponse.json({
    interventions: interventions?.map((item: any) => ({
      ...item.alma_interventions,
      relevance_note: item.relevance_note,
    })) || [],
    evidence: evidence?.map((item: any) => {
      const normalizedEvidence = normalizeEvidenceItem(item.alma_evidence);
      if (!normalizedEvidence) return null;
      return {
        ...normalizedEvidence,
        relevance_note: item.relevance_note,
      };
    }).filter(Boolean) || [],
  });
}

async function getEvidenceRelatedContent(supabase: any, evidenceId: string) {
  // Fetch all related content for evidence
  const [
    { data: articles },
    { data: author },
    { data: interventionLinks },
  ] = await Promise.all([
    // Related articles
    supabase
      .from('article_related_evidence')
      .select(`
        relevance_note,
        articles:article_id (
          id,
          title,
          slug
        )
      `)
      .eq('evidence_id', evidenceId),

    // Author profile
    supabase
      .from('alma_evidence')
      .select(`
        public_profiles:author_profile_id (
          id,
          first_name,
          last_name,
          slug
        )
      `)
      .eq('id', evidenceId)
      .single(),

    // Find linked interventions first, then resolve other evidence through the link table
    supabase
      .from('alma_intervention_evidence')
      .select('intervention_id')
      .eq('evidence_id', evidenceId),
  ]);

  const interventionIds = Array.from(
    new Set((interventionLinks || []).map((row: { intervention_id: string | null }) => row.intervention_id).filter(Boolean))
  ) as string[];

  let relatedEvidence: any[] = [];
  if (interventionIds.length > 0) {
    const { data: relatedEvidenceLinks } = await supabase
      .from('alma_intervention_evidence')
      .select(`
        evidence_id,
        alma_evidence:evidence_id (
          id,
          title,
          source_url,
          metadata
        )
      `)
      .in('intervention_id', interventionIds)
      .neq('evidence_id', evidenceId)
      .limit(25);

    const dedupedEvidence = new Map<string, any>();
    for (const item of relatedEvidenceLinks || []) {
      const normalizedEvidence = normalizeEvidenceItem(item.alma_evidence);
      if (normalizedEvidence && !dedupedEvidence.has(normalizedEvidence.id)) {
        dedupedEvidence.set(normalizedEvidence.id, normalizedEvidence);
      }
    }
    relatedEvidence = Array.from(dedupedEvidence.values()).slice(0, 5);
  }

  return NextResponse.json({
    articles: articles?.map((item: any) => ({
      ...item.articles,
      relevance_note: item.relevance_note,
    })) || [],
    author: author?.public_profiles ? [{ ...author.public_profiles, role: 'Author' }] : [],
    evidence: relatedEvidence,
  });
}

async function getStoryRelatedContent(supabase: any, storyId: string) {
  // Fetch all related content for a story
  const { data: interventions } = await supabase
    .from('story_related_interventions')
    .select(`
      relevance_note,
      alma_interventions:intervention_id (
        id,
        name
      )
    `)
    .eq('story_id', storyId);

  return NextResponse.json({
    interventions: interventions?.map((item: any) => ({
      ...item.alma_interventions,
      relevance_note: item.relevance_note,
    })) || [],
  });
}

async function getProfileRelatedContent(supabase: any, profileId: string) {
  // Fetch all related content for a profile
  const [
    { data: interventions },
    { data: evidence },
  ] = await Promise.all([
    // Interventions this person is involved with
    supabase
      .from('alma_intervention_profiles')
      .select(`
        role,
        notes,
        alma_interventions:intervention_id (
          id,
          name
        )
      `)
      .eq('public_profile_id', profileId),

    // Evidence authored by this person
    supabase
      .from('alma_evidence')
      .select('id, title, source_url, metadata')
      .eq('author_profile_id', profileId),
  ]);

  return NextResponse.json({
    interventions: interventions?.map((item: any) => ({
      ...item.alma_interventions,
      role: item.role,
      relevance_note: item.notes,
    })) || [],
    evidence: evidence?.map((item: any) => normalizeEvidenceItem(item)).filter(Boolean) || [],
  });
}
