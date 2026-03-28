/**
 * Story Linker — EL Story auto-tagging and linking agent
 *
 * Auto-tags Empathy Ledger stories with CONTAINED tour-stop regions
 * and links them to relevant organizations and programs (interventions).
 *
 * Used by: /api/cron/alma/story-linker
 */

import { createServiceClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Tour-stop region definitions
// ---------------------------------------------------------------------------

export interface TourRegion {
  slug: string;
  patterns: string[];
}

export const TOUR_REGIONS: TourRegion[] = [
  { slug: 'mt-druitt', patterns: ['mount druitt', 'mt druitt', 'blacktown', 'western sydney'] },
  { slug: 'adelaide', patterns: ['adelaide', 'south australia', 'port augusta'] },
  { slug: 'perth', patterns: ['perth', 'western australia', 'kimberley', 'pilbara'] },
  { slug: 'tennant-creek', patterns: ['tennant creek', 'central australia', 'alice springs'] },
  { slug: 'townsville', patterns: ['townsville', 'north queensland', 'palm island', 'cape york'] },
  { slug: 'brisbane', patterns: ['brisbane', 'logan', 'ipswich', 'inala', 'south east queensland'] },
];

// ---------------------------------------------------------------------------
// Region matching
// ---------------------------------------------------------------------------

/**
 * Match text against tour-stop region patterns.
 * Returns the slug of the first matching region, or null if no match.
 * Case insensitive. Iterates TOUR_REGIONS in order, so first match wins.
 */
export function matchRegion(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const region of TOUR_REGIONS) {
    for (const pattern of region.patterns) {
      if (lower.includes(pattern)) {
        return region.slug;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Org linking
// ---------------------------------------------------------------------------

interface StoryText {
  title: string;
  full_story: string | null;
}

interface OrgRecord {
  id: string;
  name: string;
}

/**
 * Match story content against a list of organizations.
 * Returns array of matched org IDs. Case insensitive substring match.
 */
export function linkStoryToOrg(story: StoryText, orgs: OrgRecord[]): string[] {
  const searchText = [story.title, story.full_story || ''].join(' ').toLowerCase();
  const matched: string[] = [];

  for (const org of orgs) {
    if (org.name && searchText.includes(org.name.toLowerCase())) {
      matched.push(org.id);
    }
  }

  return matched;
}

// ---------------------------------------------------------------------------
// Program (intervention) linking
// ---------------------------------------------------------------------------

interface ProgramRecord {
  id: string;
  name: string;
}

/**
 * Match story content against a list of programs/interventions.
 * Returns array of matched program IDs. Case insensitive substring match.
 */
export function linkStoryToProgram(story: StoryText, programs: ProgramRecord[]): string[] {
  const searchText = [story.title, story.full_story || ''].join(' ').toLowerCase();
  const matched: string[] = [];

  for (const program of programs) {
    if (program.name && searchText.includes(program.name.toLowerCase())) {
      matched.push(program.id);
    }
  }

  return matched;
}

// ---------------------------------------------------------------------------
// Stats type
// ---------------------------------------------------------------------------

export interface StoryLinkerStats {
  processed: number;
  region_tagged: number;
  org_linked: number;
  program_linked: number;
  skipped: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

/**
 * Run the story linker agent.
 * Fetches unlinked alma_stories, matches regions, orgs, and programs,
 * then updates records in the database.
 */
export async function runStoryLinker(batchSize = 50): Promise<StoryLinkerStats> {
  const sb = createServiceClient() as any;

  const stats: StoryLinkerStats = {
    processed: 0,
    region_tagged: 0,
    org_linked: 0,
    program_linked: 0,
    skipped: 0,
    errors: 0,
  };

  // 1. Fetch stories that need processing (no region_slug AND no linked IDs)
  const { data: stories, error: fetchError } = await (sb as any)
    .from('alma_stories')
    .select('id, title, full_story, summary, region_slug, linked_organization_ids, linked_intervention_ids')
    .or('region_slug.is.null,linked_organization_ids.is.null,linked_intervention_ids.is.null')
    .limit(batchSize);

  if (fetchError) {
    console.error('[StoryLinker] Fetch error:', fetchError);
    throw new Error(`Failed to fetch stories: ${fetchError.message}`);
  }

  if (!stories?.length) {
    console.log('[StoryLinker] No stories need processing');
    return stats;
  }

  // 2. Fetch reference data for matching
  const { data: orgs } = await (sb as any)
    .from('organizations')
    .select('id, name')
    .neq('name', '')
    .limit(5000);

  const { data: interventions } = await (sb as any)
    .from('alma_interventions')
    .select('id, name')
    .neq('verification_status', 'ai_generated')
    .limit(2000);

  const orgList: OrgRecord[] = orgs || [];
  const programList: ProgramRecord[] = interventions || [];

  console.log(`[StoryLinker] Processing ${stories.length} stories against ${orgList.length} orgs, ${programList.length} programs`);

  // 3. Process each story
  for (const story of stories) {
    try {
      const textToSearch = [story.title, story.full_story, story.summary]
        .filter(Boolean)
        .join(' ');

      if (!textToSearch.trim()) {
        stats.skipped++;
        continue;
      }

      // Match region
      const regionSlug = matchRegion(textToSearch);

      // Match orgs and programs
      const storyText: StoryText = { title: story.title || '', full_story: story.full_story };
      const matchedOrgIds = linkStoryToOrg(storyText, orgList);
      const matchedProgramIds = linkStoryToProgram(storyText, programList);

      // Build update payload (only update fields that were null)
      const update: Record<string, unknown> = {};

      if (story.region_slug === null && regionSlug) {
        update.region_slug = regionSlug;
        stats.region_tagged++;
      }

      if (story.linked_organization_ids === null) {
        update.linked_organization_ids = matchedOrgIds;
        if (matchedOrgIds.length > 0) stats.org_linked++;
      }

      if (story.linked_intervention_ids === null) {
        update.linked_intervention_ids = matchedProgramIds;
        if (matchedProgramIds.length > 0) stats.program_linked++;
      }

      if (Object.keys(update).length > 0) {
        const { error: updateError } = await (sb as any)
          .from('alma_stories')
          .update(update)
          .eq('id', story.id);

        if (updateError) {
          console.error(`[StoryLinker] Update failed for story ${story.id}:`, updateError);
          stats.errors++;
          continue;
        }
      }

      stats.processed++;

      if (regionSlug || matchedOrgIds.length || matchedProgramIds.length) {
        console.log(
          `[StoryLinker] Story "${story.title?.slice(0, 50)}..." → region=${regionSlug || 'none'}, orgs=${matchedOrgIds.length}, programs=${matchedProgramIds.length}`
        );
      }
    } catch (err) {
      stats.errors++;
      console.error(
        `[StoryLinker] Error processing story ${story.id}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log(`[StoryLinker] Done: ${JSON.stringify(stats)}`);
  return stats;
}
