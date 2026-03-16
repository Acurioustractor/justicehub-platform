/**
 * Empathy Ledger v2 API Client
 *
 * Replaces direct Supabase connections with authenticated REST API calls.
 * Uses org-scoped API key for all content access.
 *
 * Env vars:
 *   EMPATHY_LEDGER_V2_URL - Base URL of Empathy Ledger app (e.g. https://empathy-ledger.vercel.app)
 *   EMPATHY_LEDGER_V2_KEY - Org API key (el_org_...)
 */

const V2_URL = process.env.EMPATHY_LEDGER_V2_URL || ''
const V2_KEY = process.env.EMPATHY_LEDGER_V2_KEY || ''

export const isV2Configured = Boolean(V2_URL && V2_KEY)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface V2Storyteller {
  id: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  culturalBackground: string[] | null
  location: string | null
  role: string | null
  isElder: boolean
  isActive: boolean
  storyCount: number
  createdAt: string
}

export interface V2Story {
  id: string
  title: string
  excerpt: string | null
  themes: string[]
  status: string
  publishedAt: string | null
  culturalLevel: string | null
  projectId: string | null
  imageUrl: string | null
  storyteller: {
    id: string
    displayName: string
    avatarUrl: string | null
    culturalBackground: string[] | null
  } | null
  createdAt: string
  detailUrl: string
}

export interface V2StoryDetail extends V2Story {
  content: string | null
  culturalWarnings: string[] | null
  hasTranscript: boolean
  wordCount: number | null
  location: string | null
}

export interface V2Gallery {
  id: string
  title: string
  slug: string | null
  description: string | null
  visibility: string | null
  status: string | null
  coverImage: string | null
  photoCount: number
  mediaAssetCount: number
  organizationId: string | null
  createdAt: string
}

export interface V2Media {
  id: string
  title: string | null
  description: string | null
  filename: string | null
  contentType: string | null
  url: string | null
  thumbnailUrl: string | null
  previewUrl: string | null
  dimensions: { width: number; height: number } | null
  duration: number | null
  fileSize: number | null
  altText: string | null
  culturalTags: string[] | null
  culturalLevel: string | null
  location: string | null
  geoData: { lat: number; lng: number } | null
  projectId: string | null
  galleryId: string | null
  galleryCaption: string | null
  galleryCulturalContext: string | null
  sortOrder: number | null
  createdAt: string
}

export interface V2Transcript {
  id: string
  title: string | null
  content: string | null
  status: string | null
  wordCount: number | null
  projectId: string | null
  hasVideo: boolean
  videoUrl: string | null
  videoPlatform: string | null
  videoThumbnail: string | null
  storyteller: {
    id: string
    displayName: string
    avatarUrl: string | null
  } | null
  createdAt: string
  updatedAt: string | null
}

export interface V2Project {
  id: string
  name: string
  code: string | null
  description: string | null
  location: string | null
  status: string | null
  startDate: string | null
  endDate: string | null
  storytellerCount: number
  storyCount: number
  createdAt: string
}

export interface V2Pagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface V2Response<T> {
  data: T[]
  pagination: V2Pagination
  meta: { keyType: string; scope: string }
}

// ─── Client ──────────────────────────────────────────────────────────────────

async function v2Fetch<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<V2Response<T>> {
  if (!isV2Configured) {
    throw new Error('Empathy Ledger v2 API not configured (EMPATHY_LEDGER_V2_URL / EMPATHY_LEDGER_V2_KEY)')
  }

  const url = new URL(`/api/v2/${endpoint}`, V2_URL)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-Key': V2_KEY,
      'Accept': 'application/json',
    },
    next: { revalidate: 60 } as any, // Next.js fetch extension for ISR caching
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`v2 API error ${res.status}: ${body}`)
  }

  return res.json()
}

// Single-item fetch (e.g. story detail)
async function v2FetchOne<T>(
  endpoint: string
): Promise<T | null> {
  if (!isV2Configured) {
    throw new Error('Empathy Ledger v2 API not configured')
  }

  const url = new URL(`/api/v2/${endpoint}`, V2_URL)

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-Key': V2_KEY,
      'Accept': 'application/json',
    },
    next: { revalidate: 60 } as any,
  })

  if (!res.ok) {
    if (res.status === 404) return null
    const body = await res.text()
    throw new Error(`v2 API error ${res.status}: ${body}`)
  }

  const json = await res.json()
  return json.data ?? json
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getStories(params?: {
  page?: number
  limit?: number
  projectId?: string
  theme?: string
  storytellerId?: string
}): Promise<V2Response<V2Story>> {
  return v2Fetch<V2Story>('stories', params)
}

export async function getStoryDetail(id: string): Promise<V2StoryDetail | null> {
  return v2FetchOne<V2StoryDetail>(`stories/${id}`)
}

export async function getStorytellers(params?: {
  page?: number
  limit?: number
  projectId?: string
}): Promise<V2Response<V2Storyteller>> {
  return v2Fetch<V2Storyteller>('storytellers', params)
}

export async function getGalleries(params?: {
  page?: number
  limit?: number
  projectId?: string
  tag?: string
}): Promise<V2Response<V2Gallery>> {
  return v2Fetch<V2Gallery>('galleries', params)
}

export async function getMedia(params?: {
  page?: number
  limit?: number
  galleryId?: string
  projectId?: string
  type?: string
  storytellerId?: string
}): Promise<V2Response<V2Media>> {
  return v2Fetch<V2Media>('media', params)
}

export async function getTranscripts(params?: {
  page?: number
  limit?: number
  projectId?: string
  storytellerId?: string
  status?: string
}): Promise<V2Response<V2Transcript>> {
  return v2Fetch<V2Transcript>('transcripts', params)
}

export async function getProjects(params?: {
  page?: number
  limit?: number
}): Promise<V2Response<V2Project>> {
  return v2Fetch<V2Project>('projects', params)
}
