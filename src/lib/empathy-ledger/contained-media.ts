/**
 * Contained campaign media — curated allowlist served via Empathy Ledger v2 API.
 *
 * Why this file exists:
 *   The /contained pages (one-pager, tour, experience) need to render specific
 *   campaign photos. The canonical source is Empathy Ledger v2 (org-scoped API
 *   key in env). However, EL's photo-manager UI tags photos to a "project"
 *   layer (39 photos under CONTAINED) that is NOT yet exposed on the public
 *   v2 media response — `media.projectId` is null even for project-tagged
 *   photos. Pending v2 API extension, we curate the canonical IDs here and
 *   fetch via storytellerId, then filter.
 *
 *   When v2 exposes project membership, replace getMedia({ storytellerId })
 *   with getMedia({ projectId: CONTAINED_PROJECT_ID }) and drop the allowlist.
 */

import { getMedia, type V2Media } from './v2-client'

// Storyteller account that owns the Contained installation photo set in EL.
// Verified 2026-05-05 via /api/v2/media?storytellerId=...
const CONTAINED_STORYTELLER_ID = 'd0a162d2-282e-4653-9d12-aa934c9dfa4e'

// EL v2 project id for CONTAINED. Kept for the day project filtering works.
export const CONTAINED_PROJECT_ID = '9b90b47c-2a4c-409c-97d5-3718aaf8c30c'

// Curated allowlist of EL v2 media IDs. Add more as you tag them in EL admin
// and confirm the id via /api/v2/media?storytellerId=...
export const CONTAINED_MEDIA = {
  twoRooms: '2f8fd4c9-e8cd-4830-891c-68ddab277130',
  logoSquare: '549eb30e-bfb5-4bb3-b8d8-acafaba91cce',
  storyImage: '2130b39d-5bf3-4e2e-a2ff-e7e4066e8c3e',
  brandSquare: 'efb5bc95-8d9b-43cd-bc2e-7fb66354da36',
} as const

export type ContainedMediaKey = keyof typeof CONTAINED_MEDIA

const ALL_IDS = new Set<string>(Object.values(CONTAINED_MEDIA))

let cache: { fetchedAt: number; byId: Map<string, V2Media> } | null = null
const TTL_MS = 60_000

async function loadAll(): Promise<Map<string, V2Media>> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache.byId

  const res = await getMedia({ storytellerId: CONTAINED_STORYTELLER_ID, limit: 200 })
  const byId = new Map<string, V2Media>()
  for (const m of res.data) {
    if (ALL_IDS.has(m.id)) byId.set(m.id, m)
  }
  cache = { fetchedAt: Date.now(), byId }
  return byId
}

export async function getContainedMedia(key: ContainedMediaKey): Promise<V2Media | null> {
  const byId = await loadAll()
  return byId.get(CONTAINED_MEDIA[key]) ?? null
}

export async function getAllContainedMedia(): Promise<Record<ContainedMediaKey, V2Media | null>> {
  const byId = await loadAll()
  const out = {} as Record<ContainedMediaKey, V2Media | null>
  for (const k of Object.keys(CONTAINED_MEDIA) as ContainedMediaKey[]) {
    out[k] = byId.get(CONTAINED_MEDIA[k]) ?? null
  }
  return out
}

export async function getContainedMediaUrl(key: ContainedMediaKey): Promise<string | null> {
  const m = await getContainedMedia(key)
  return m?.url ?? null
}
