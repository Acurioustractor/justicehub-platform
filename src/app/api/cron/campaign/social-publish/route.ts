import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NOTION_DB_ID = 'e400e93e-fd9d-4a21-810c-58d67ed9fe97';
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Map Notion "Target Accounts" values to GHL platform account IDs
const PLATFORM_MAP: Record<string, string> = {
  'Instagram':           '69a7414aa633c119dd1abf01_agzsSZWgovjwgpcoASWG_17841400507136270',  // benknightphoto
  'LinkedIn (Personal)': '6924100b28da93f6f63dc4ce_agzsSZWgovjwgpcoASWG_k4-zY7OEBb_profile', // Benjamin Knight
  'LinkedIn (Company)':  '6924100b28da93f6f63dc4ce_agzsSZWgovjwgpcoASWG_89559348_page',       // ACT company
  'Facebook':            '69a741044ae8c033b5f9527b_agzsSZWgovjwgpcoASWG_1013856538477552_page', // Harvest Witta
  'YouTube':             '6924c93ffbc94b7d3a1c02af_agzsSZWgovjwgpcoASWG_UCLUsgd-M8ycbblBsOCDpFiw_profile',
  'Twitter':             '', // Not connected in GHL — skip
  'Bluesky':             '6924cd6dfbc94b814b1fb875_agzsSZWgovjwgpcoASWG_did:plc:whrv2vdxnd6mh36hz7vju3t5_profile',
  'Google Business':     '6924c96189dce54e70c1e753_agzsSZWgovjwgpcoASWG_1327553602091942641',
};

/**
 * GET /api/cron/campaign/social-publish
 *
 * Runs daily at 08:00 UTC. Queries the ACT Communications Dashboard in Notion
 * for posts with Status = "Scheduled" and Sent date = today, then publishes
 * each one to GHL Social Planner.
 *
 * Flow:
 * 1. Query Notion DB for Scheduled posts due today
 * 2. For each post: read content, image, target accounts
 * 3. Map Target Accounts → GHL platform account IDs
 * 4. POST to GHL Social Planner
 * 5. Update Notion status → "Published" + store GHL Post ID
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notionToken = process.env.JUSTICEHUB_NOTION_TOKEN || '';
  const ghlApiKey = process.env.GHL_API_KEY || '';
  const ghlLocationId = process.env.GHL_LOCATION_ID || '';

  if (!notionToken || !ghlApiKey || !ghlLocationId) {
    return NextResponse.json({
      error: 'Missing config',
      notion: !!notionToken,
      ghl: !!ghlApiKey,
    }, { status: 500 });
  }

  const results = { published: 0, skipped: 0, errors: 0, posts: [] as string[] };

  try {
    // 1. Query Notion for "Scheduled" posts with Sent date = today
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const queryRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: 'Status', status: { equals: 'Scheduled' } },
            { property: 'Sent date', date: { on_or_before: today } },
          ],
        },
      }),
    });

    if (!queryRes.ok) {
      const err = await queryRes.text();
      console.error('[social-publish] Notion query failed:', err);
      return NextResponse.json({ error: 'Notion query failed', details: err }, { status: 500 });
    }

    const queryData = await queryRes.json();
    const pages = queryData.results || [];

    if (pages.length === 0) {
      return NextResponse.json({ success: true, message: 'No scheduled posts due today', ...results });
    }

    console.log(`[social-publish] Found ${pages.length} scheduled posts due today`);

    // 2. Process each post
    for (const page of pages) {
      const props = page.properties;
      const pageId = page.id;
      const title = props['Content/Communication Name']?.title?.[0]?.plain_text || 'Untitled';

      try {
        // Extract content
        const keyMessage = props['Key Message/Story']?.rich_text?.[0]?.plain_text || '';
        const notes = props['Notes']?.rich_text?.[0]?.plain_text || '';
        const hashtagMatch = notes.match(/Hashtags?:\s*(.*)/i);
        const hashtags = hashtagMatch ? hashtagMatch[1].trim() : '';
        const summary = hashtags ? `${keyMessage}\n\n${hashtags}` : keyMessage;

        if (!summary) {
          console.log(`[social-publish] Skipping "${title}" — no content`);
          results.skipped++;
          continue;
        }

        // Extract target accounts → GHL platform IDs
        const targetAccounts: string[] = props['Target Accounts']?.multi_select?.map(
          (s: { name: string }) => s.name
        ) || [];
        const platformAccountIds = targetAccounts
          .map(name => PLATFORM_MAP[name])
          .filter(Boolean);

        if (platformAccountIds.length === 0) {
          console.log(`[social-publish] Skipping "${title}" — no valid platform accounts`);
          results.skipped++;
          continue;
        }

        // Extract image
        const mediaUrls: string[] = [];
        const imageFiles = props['Image']?.files || [];
        for (const f of imageFiles) {
          const url = f?.external?.url || f?.file?.url;
          if (url) mediaUrls.push(url);
        }

        // Also check page content blocks for images
        const blocksRes = await fetch(
          `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
          {
            headers: {
              Authorization: `Bearer ${notionToken}`,
              'Notion-Version': '2022-06-28',
            },
          }
        );
        if (blocksRes.ok) {
          const blocks = await blocksRes.json();
          for (const block of blocks.results || []) {
            if (block.type === 'image') {
              const url = block.image?.external?.url || block.image?.file?.url;
              if (url) mediaUrls.push(url);
            }
          }
        }

        // Build GHL post body
        const ghlBody: Record<string, unknown> = {
          summary,
          accountIds: platformAccountIds,
          type: 'post',
          userId: process.env.GHL_USER_ID || '',
        };

        if (mediaUrls.length > 0) {
          ghlBody.media = mediaUrls.map(url => {
            const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
            const mimeMap: Record<string, string> = {
              jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
              gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4',
            };
            return { url, type: mimeMap[ext] || 'image/jpeg' };
          });
        } else {
          // Instagram requires an image — fallback to brand poster
          const hasInstagram = platformAccountIds.some(id => id.includes('17841'));
          if (hasInstagram) {
            ghlBody.media = [{
              url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/contained/poster-tour.png',
              type: 'image/png',
            }];
          } else {
            ghlBody.media = [];
          }
        }

        // 3. POST to GHL Social Planner
        const ghlRes = await fetch(
          `${GHL_API_BASE}/social-media-posting/${ghlLocationId}/posts`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${ghlApiKey}`,
              'Content-Type': 'application/json',
              Version: '2021-07-28',
            },
            body: JSON.stringify(ghlBody),
          }
        );

        if (!ghlRes.ok) {
          const errText = await ghlRes.text();
          console.error(`[social-publish] GHL post failed for "${title}":`, errText);
          results.errors++;
          continue;
        }

        const ghlResult = await ghlRes.json();
        const ghlPostId = ghlResult.id || ghlResult.postId || '';

        // 4. Update Notion: Status → Published, store GHL Post ID
        await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${notionToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            properties: {
              Status: { status: { name: 'Published' } },
              ...(ghlPostId ? { 'GHL Post ID': { rich_text: [{ text: { content: ghlPostId } }] } } : {}),
            },
          }),
        });

        console.log(`[social-publish] Published "${title}" → ${platformAccountIds.length} platforms`);
        results.published++;
        results.posts.push(title);

        // Rate limit between posts
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`[social-publish] Error processing "${title}":`, err);
        results.errors++;
      }
    }

    console.log(`[social-publish] Done. Published: ${results.published}, Skipped: ${results.skipped}, Errors: ${results.errors}`);
    return NextResponse.json({ success: true, ...results });

  } catch (error: any) {
    console.error('[social-publish] Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
