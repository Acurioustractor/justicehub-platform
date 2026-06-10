/**
 * Server-only story loader for community action-profiles.
 *
 * Stories come from Empathy Ledger and only from Empathy Ledger. This module
 * uses the v2 REST client (src/lib/empathy-ledger/v2-client.ts) exclusively.
 * Direct Empathy Ledger Supabase queries are forbidden.
 *
 * Consent lives upstream: the v2 API only returns stories the community has
 * published. This loader never widens that. It asks for published stories
 * scoped to an anchor's Empathy Ledger project and returns at most four.
 *
 * Contract:
 *  - An anchor surfaces stories only when it carries `empathyLedgerProjectId`.
 *  - If the env (EMPATHY_LEDGER_V2_KEY / _URL) is unset, the API is not
 *    configured, or the fetch fails, this returns [] and the profile renders
 *    the standing consent-tier frame instead.
 *  - Real photos only: an image is carried through only when the v2 API returns
 *    one with the story. No placeholder or generated imagery is ever added here.
 */

import type { AnchorCommunity } from './anchors';
import { getStories, isV2Configured } from '@/lib/empathy-ledger/v2-client';

export interface CommunityStory {
  id: string;
  title: string;
  excerpt: string | null;
  storytellerName: string | null;
  /** Outbound link to the story page on Empathy Ledger. No embedding. */
  detailUrl: string;
  /** Real photo URL from Empathy Ledger, or null. Never a placeholder. */
  imageUrl: string | null;
}

const MAX_STORIES = 4;

/**
 * Fetch up to four published stories for an anchor community from Empathy
 * Ledger. Returns [] when no project is set, the API is unconfigured, or the
 * fetch fails. Never throws.
 */
export async function loadCommunityStories(
  anchor: AnchorCommunity
): Promise<CommunityStory[]> {
  if (!anchor.empathyLedgerProjectId) return [];
  if (!isV2Configured) return [];

  try {
    const res = await getStories({
      projectId: anchor.empathyLedgerProjectId,
      limit: MAX_STORIES,
    });

    return (res.data || [])
      .filter((s) => s.status === 'published')
      .slice(0, MAX_STORIES)
      .map((s) => ({
        id: s.id,
        title: s.title,
        excerpt: s.excerpt,
        storytellerName: s.storyteller?.displayName ?? null,
        detailUrl: s.detailUrl,
        imageUrl: s.imageUrl,
      }));
  } catch (e) {
    console.error('community stories: Empathy Ledger fetch failed', e);
    return [];
  }
}
