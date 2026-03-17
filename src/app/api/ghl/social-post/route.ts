import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_KEY = process.env.GHL_API_KEY || ''
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || ''
const NOTION_DB_ID = 'e400e93e-fd9d-4a21-810c-58d67ed9fe97'

// GHL Social Planner: Create Post
// POST /social-media-posting/:locationId/posts
interface SocialPost {
  summary: string
  mediaUrls?: string[]
  scheduledAt?: string // ISO-8601, if omitted posts immediately
  platformAccountIds: string[] // GHL social account IDs
  type?: string
}

/**
 * POST /api/ghl/social-post
 *
 * Two modes:
 * 1. Direct: pass { summary, mediaUrls, platformAccountIds, scheduledAt }
 * 2. From Notion: pass { notionPageId } — fetches page data from Notion, extracts content + image
 *
 * Called by:
 * - Campaign Hub "Post to GHL" button
 * - Notion automation webhook when status → "Scheduled"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify auth — accept Bearer token or Notion webhook secret
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.NOTION_WEBHOOK_SECRET || 'contained-2026'
    const isAuthed =
      authHeader === `Bearer ${GHL_API_KEY}` ||
      authHeader === `Bearer ${webhookSecret}` ||
      request.headers.get('x-webhook-secret') === webhookSecret

    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return NextResponse.json({ error: 'GHL not configured' }, { status: 500 })
    }

    const body = await request.json()

    let postData: SocialPost

    if (body.notionPageId) {
      // Mode 2: Fetch from Notion
      const notionToken = process.env.JUSTICEHUB_NOTION_TOKEN || ''
      if (!notionToken) {
        return NextResponse.json({ error: 'NOTION_API_TOKEN not configured' }, { status: 500 })
      }

      const pageData = await fetchNotionPage(notionToken, body.notionPageId)
      postData = notionPageToSocialPost(pageData, body.platformAccountIds)
    } else {
      // Mode 1: Direct post data
      postData = {
        summary: body.summary || body.content || '',
        mediaUrls: body.mediaUrls || [],
        scheduledAt: body.scheduledAt,
        platformAccountIds: body.platformAccountIds || [],
        type: body.type,
      }
    }

    if (!postData.summary) {
      return NextResponse.json({ error: 'No content/summary provided' }, { status: 400 })
    }

    if (!postData.platformAccountIds || postData.platformAccountIds.length === 0) {
      return NextResponse.json({
        error: 'No platformAccountIds provided. Get your GHL social account IDs from /api/ghl/social-accounts',
      }, { status: 400 })
    }

    // Create post in GHL Social Planner
    // GHL requires: summary, accountIds, type, userId
    // media must be array of {url, type} objects (not just URL strings)
    const ghlBody: Record<string, unknown> = {
      summary: postData.summary,
      accountIds: postData.platformAccountIds,
      type: postData.type || 'post',
      userId: body.userId || process.env.GHL_USER_ID || '',
    }

    if (postData.mediaUrls && postData.mediaUrls.length > 0) {
      ghlBody.media = postData.mediaUrls.map(url => {
        const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || ''
        const mimeMap: Record<string, string> = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
          mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
        }
        return { url, type: mimeMap[ext] || 'image/jpeg' }
      })
    } else {
      // Instagram requires an image — use default brand poster as fallback
      const hasInstagram = postData.platformAccountIds.some(id => id.includes('instagram') || id.includes('17841'))
      if (hasInstagram) {
        ghlBody.media = [{
          url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/contained/poster-tour.png',
          type: 'image/png',
        }]
      } else {
        ghlBody.media = []
      }
    }

    if (postData.scheduledAt) {
      ghlBody.scheduleDate = postData.scheduledAt
    }

    const ghlRes = await fetch(
      `${GHL_API_BASE}/social-media-posting/${GHL_LOCATION_ID}/posts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          Version: '2021-07-28',
        },
        body: JSON.stringify(ghlBody),
      }
    )

    if (!ghlRes.ok) {
      const errText = await ghlRes.text()
      console.error('GHL social post error:', errText)
      return NextResponse.json(
        { error: 'GHL post creation failed', details: errText },
        { status: ghlRes.status }
      )
    }

    const result = await ghlRes.json()

    // If from Notion, update the Notion page status to "Published"
    if (body.notionPageId && process.env.JUSTICEHUB_NOTION_TOKEN) {
      await updateNotionStatus(process.env.JUSTICEHUB_NOTION_TOKEN, body.notionPageId, 'Published')
    }

    return NextResponse.json({
      success: true,
      ghlPostId: result.id || result.postId,
      message: postData.scheduledAt ? 'Post scheduled in GHL' : 'Post created in GHL',
    })
  } catch (error) {
    console.error('Social post API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ghl/social-post
 *
 * Returns GHL social account IDs (needed for platformAccountIds)
 */
export async function GET() {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return NextResponse.json({ error: 'GHL not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${GHL_API_BASE}/social-media-posting/${GHL_LOCATION_ID}/accounts`,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: '2021-07-28',
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch GHL social accounts' }, { status: res.status })
    }

    const data = await res.json()
    const accounts = data?.results?.accounts || data?.accounts || []
    return NextResponse.json({
      accounts: accounts.map((a: Record<string, unknown>) => ({
        id: a.id,
        name: a.name,
        platform: a.platform || a.type,
        avatar: a.avatar,
        isExpired: a.isExpired,
      })),
      usage: 'Pass account IDs as platformAccountIds when creating posts',
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ── Notion helpers ──────────────────────────────────────

async function fetchNotionPage(token: string, pageId: string) {
  // Fetch page properties
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    },
  })
  if (!res.ok) throw new Error(`Notion page fetch failed: ${res.status}`)
  const page = await res.json()

  // Fetch page content (blocks) to get image URLs
  const blocksRes = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    }
  )
  const blocks = blocksRes.ok ? await blocksRes.json() : { results: [] }

  return { properties: page.properties, blocks: blocks.results }
}

function notionPageToSocialPost(
  pageData: { properties: Record<string, any>; blocks: any[] },
  platformAccountIds?: string[]
): SocialPost {
  const props = pageData.properties

  // Extract text content from Key Message/Story
  const keyMessage =
    props['Key Message/Story']?.rich_text?.[0]?.plain_text || ''

  // Extract notes for hashtags
  const notes = props['Notes']?.rich_text?.[0]?.plain_text || ''
  const hashtagMatch = notes.match(/Hashtags?:\s*(.*)/i)
  const hashtags = hashtagMatch ? hashtagMatch[1].trim() : ''

  // Build summary = key message + hashtags
  const summary = hashtags ? `${keyMessage}\n\n${hashtags}` : keyMessage

  // Extract image URLs — check Image property first, then content blocks
  const mediaUrls: string[] = []

  // Check Image property (files type)
  const imageFiles = props['Image']?.files || []
  for (const f of imageFiles) {
    const url = f?.external?.url || f?.file?.url
    if (url) mediaUrls.push(url)
  }

  // Then check content blocks for embedded images
  for (const block of pageData.blocks) {
    if (block.type === 'image') {
      const url =
        block.image?.external?.url || block.image?.file?.url
      if (url) mediaUrls.push(url)
    }
  }

  // Extract scheduled date
  const sentDate = props['Sent date']?.date?.start

  return {
    summary,
    mediaUrls,
    scheduledAt: sentDate ? new Date(sentDate).toISOString() : undefined,
    platformAccountIds: platformAccountIds || [],
  }
}

async function updateNotionStatus(token: string, pageId: string, status: string) {
  try {
    await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        properties: {
          Status: { status: { name: status } },
        },
      }),
    })
  } catch (e) {
    console.error('Failed to update Notion status:', e)
  }
}
