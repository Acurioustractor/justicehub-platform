/**
 * Cross-Linkage Graph Score Agent
 *
 * Scores every organization by how connected it is in the evidence graph.
 * Score 0-100 based on: ABN, funding records, programs, evidence,
 * media mentions, stories, and cost data.
 *
 * Used by: /api/cron/alma/graph-score
 */

import { createServiceClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrgGraphData {
  has_abn: boolean;
  funding_count: number;
  program_count: number;
  evidence_count: number;
  media_count: number;
  story_count: number;
  has_cost_data: boolean;
}

export interface GraphScoreStats {
  orgs_scored: number;
  avg_score: number;
  max_score: number;
  min_score: number;
  score_distribution: Record<string, number>;
  duration_ms: number;
}

// ---------------------------------------------------------------------------
// Weights (sum = 100)
// ---------------------------------------------------------------------------

const WEIGHTS = {
  abn: 10,
  funding: 20,
  programs: 25,
  evidence: 20,
  media: 10,
  stories: 10,
  cost_data: 5,
} as const;

// ---------------------------------------------------------------------------
// Pure scoring function
// ---------------------------------------------------------------------------

/**
 * Compute a graph connectivity score (0-100) for an organization.
 * Each factor is boolean: present (full weight) or absent (0).
 */
export function computeGraphScore(data: OrgGraphData): number {
  let score = 0;
  if (data.has_abn) score += WEIGHTS.abn;
  if (data.funding_count > 0) score += WEIGHTS.funding;
  if (data.program_count > 0) score += WEIGHTS.programs;
  if (data.evidence_count > 0) score += WEIGHTS.evidence;
  if (data.media_count > 0) score += WEIGHTS.media;
  if (data.story_count > 0) score += WEIGHTS.stories;
  if (data.has_cost_data) score += WEIGHTS.cost_data;
  return score;
}

// ---------------------------------------------------------------------------
// Batch size for DB operations
// ---------------------------------------------------------------------------

const BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export async function runGraphScoring(options?: {
  regionOnly?: boolean;
}): Promise<GraphScoreStats> {
  const start = Date.now();
  const sb = createServiceClient() as any;

  // Track all scores for stats
  const allScores: number[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch a batch of orgs
    let query = (sb as any)
      .from('organizations')
      .select('id, abn')
      .not('name', 'is', null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (options?.regionOnly) {
      // Only score orgs in CONTAINED tour-stop states
      query = query.in('state', ['NSW', 'SA', 'WA', 'NT', 'QLD']);
    }

    const { data: orgs, error: orgError } = await query;

    if (orgError) {
      console.error('[GraphScore] Error fetching orgs:', orgError);
      throw new Error(`Failed to fetch organizations: ${orgError.message}`);
    }

    if (!orgs || orgs.length === 0) {
      hasMore = false;
      break;
    }

    const orgIds = orgs.map((o: any) => o.id);

    // Fetch all linkage counts in parallel for this batch
    const [fundingRes, programsRes, evidenceRes, mediaRes, storiesRes, costRes] =
      await Promise.all([
        // Funding records linked to these orgs
        (sb as any)
          .from('justice_funding')
          .select('alma_organization_id')
          .in('alma_organization_id', orgIds),

        // Programs (interventions) operated by these orgs
        (sb as any)
          .from('alma_interventions')
          .select('operating_organization_id')
          .neq('verification_status', 'ai_generated')
          .in('operating_organization_id', orgIds),

        // Evidence linked via interventions -> orgs
        (sb as any)
          .from('alma_evidence')
          .select('intervention_id, alma_interventions!inner(operating_organization_id)')
          .in('alma_interventions.operating_organization_id', orgIds),

        // Media mentions (organizations_mentioned JSONB array)
        (sb as any)
          .from('alma_media_articles')
          .select('id, organizations_mentioned')
          .not('organizations_mentioned', 'is', null),

        // Stories linked to these orgs
        (sb as any)
          .from('alma_stories')
          .select('organization_id')
          .in('organization_id', orgIds),

        // Programs with cost data
        (sb as any)
          .from('alma_interventions')
          .select('operating_organization_id, cost_per_young_person')
          .neq('verification_status', 'ai_generated')
          .not('cost_per_young_person', 'is', null)
          .in('operating_organization_id', orgIds),
      ]);

    // Build count maps
    const fundingCounts: Record<string, number> = {};
    for (const r of fundingRes.data || []) {
      const oid = r.alma_organization_id;
      if (oid) fundingCounts[oid] = (fundingCounts[oid] || 0) + 1;
    }

    const programCounts: Record<string, number> = {};
    for (const r of programsRes.data || []) {
      const oid = r.operating_organization_id;
      if (oid) programCounts[oid] = (programCounts[oid] || 0) + 1;
    }

    const evidenceCounts: Record<string, number> = {};
    for (const r of evidenceRes.data || []) {
      const oid = r.alma_interventions?.operating_organization_id;
      if (oid) evidenceCounts[oid] = (evidenceCounts[oid] || 0) + 1;
    }

    // Media: need to check organizations_mentioned array for org names
    // This is approximate — we check by org ID in stories but by name in media
    // For now, count any media article that mentions any org in our batch
    const mediaCounts: Record<string, number> = {};
    // Media matching is expensive; skip for batch scoring, use 0
    // Future: build org name -> id index for media matching

    const storyCounts: Record<string, number> = {};
    for (const r of storiesRes.data || []) {
      const oid = r.organization_id;
      if (oid) storyCounts[oid] = (storyCounts[oid] || 0) + 1;
    }

    const costOrgIds = new Set<string>();
    for (const r of costRes.data || []) {
      if (r.operating_organization_id) costOrgIds.add(r.operating_organization_id);
    }

    // Compute scores and build update batch
    const updates: { id: string; graph_score: number }[] = [];

    for (const org of orgs) {
      const data: OrgGraphData = {
        has_abn: !!org.abn,
        funding_count: fundingCounts[org.id] || 0,
        program_count: programCounts[org.id] || 0,
        evidence_count: evidenceCounts[org.id] || 0,
        media_count: mediaCounts[org.id] || 0,
        story_count: storyCounts[org.id] || 0,
        has_cost_data: costOrgIds.has(org.id),
      };

      const score = computeGraphScore(data);
      updates.push({ id: org.id, graph_score: score });
      allScores.push(score);
    }

    // Batch update scores
    for (const { id, graph_score } of updates) {
      const { error: updateError } = await (sb as any)
        .from('organizations')
        .update({ graph_score })
        .eq('id', id);

      if (updateError) {
        console.error(`[GraphScore] Update failed for ${id}:`, updateError);
      }
    }

    console.log(
      `[GraphScore] Scored batch ${offset}-${offset + orgs.length}: avg=${
        Math.round(
          updates.reduce((s, u) => s + u.graph_score, 0) / updates.length
        )
      }`
    );

    offset += BATCH_SIZE;
    if (orgs.length < BATCH_SIZE) hasMore = false;
  }

  // Compute aggregate stats
  const duration_ms = Date.now() - start;
  const avg_score =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10
        ) / 10
      : 0;
  const max_score = allScores.length > 0 ? Math.max(...allScores) : 0;
  const min_score = allScores.length > 0 ? Math.min(...allScores) : 0;

  // Distribution buckets: 0, 1-25, 26-50, 51-75, 76-100
  const distribution: Record<string, number> = {
    '0': 0,
    '1-25': 0,
    '26-50': 0,
    '51-75': 0,
    '76-100': 0,
  };
  for (const s of allScores) {
    if (s === 0) distribution['0']++;
    else if (s <= 25) distribution['1-25']++;
    else if (s <= 50) distribution['26-50']++;
    else if (s <= 75) distribution['51-75']++;
    else distribution['76-100']++;
  }

  const stats: GraphScoreStats = {
    orgs_scored: allScores.length,
    avg_score,
    max_score,
    min_score,
    score_distribution: distribution,
    duration_ms,
  };

  console.log('[GraphScore] Complete:', JSON.stringify(stats));
  return stats;
}
