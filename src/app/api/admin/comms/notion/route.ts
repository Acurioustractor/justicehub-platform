import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

const NOTION_TOKEN = process.env.JUSTICEHUB_NOTION_TOKEN;
const DB_ID = '7005d0d1-41d3-436c-9f86-526d275c2f10';
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin' ? user : null;
}

function notionHeaders() {
  return {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
  cover?: { external?: { url: string }; file?: { url: string } } | null;
  created_time: string;
  last_edited_time: string;
}

function extractText(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text: string }>; rich_text?: Array<{ plain_text: string }> };
  if (p?.title) return p.title.map((t) => t.plain_text).join('');
  if (p?.rich_text) return p.rich_text.map((t) => t.plain_text).join('');
  return '';
}

function extractSelect(prop: unknown): string {
  const p = prop as { select?: { name: string } };
  return p?.select?.name || '';
}

function extractDate(prop: unknown): string | null {
  const p = prop as { date?: { start: string } };
  return p?.date?.start || null;
}

function extractUrl(prop: unknown): string {
  const p = prop as { url?: string };
  return p?.url || '';
}

function extractMultiSelect(prop: unknown): string[] {
  const p = prop as { multi_select?: Array<{ name: string }> };
  return p?.multi_select?.map((s) => s.name) || [];
}

function extractFiles(prop: unknown): string {
  const p = prop as { files?: Array<{ external?: { url: string }; file?: { url: string } }> };
  const f = p?.files?.[0];
  return f?.external?.url || f?.file?.url || '';
}

function mapPage(page: NotionPage) {
  const props = page.properties;
  return {
    id: page.id,
    title: extractText(props['Content/Communication Name']),
    status: (props['Status'] as { status?: { name: string } })?.status?.name || '',
    targets: extractMultiSelect(props['Target Accounts']),
    sentDate: extractDate(props['Sent date']),
    keyMessage: extractText(props['Key Message/Story']),
    imageUrl: extractFiles(props['Image']) ||
      page.cover?.external?.url || page.cover?.file?.url || '',
    lastEdited: page.last_edited_time,
  };
}

/**
 * GET /api/admin/comms/notion — Query Notion DB for posts
 */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!NOTION_TOKEN) return NextResponse.json({ error: 'Notion token not configured' }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.filter = {
        property: 'Status',
        status: { equals: status },
      };
    }

    const res = await fetch(`${NOTION_API}/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify({
        ...filter,
        sorts: [{ property: 'Sent date', direction: 'descending' }],
        page_size: 100,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Notion query error:', err);
      return NextResponse.json({ error: 'Notion query failed' }, { status: res.status });
    }

    const data = await res.json();
    const posts = (data.results as NotionPage[]).map(mapPage);

    // Compute status counts
    const counts: Record<string, number> = {};
    let missingImage = 0;
    for (const p of posts) {
      const s = p.status || 'No Status';
      counts[s] = (counts[s] || 0) + 1;
      if (!p.imageUrl) missingImage++;
    }

    return NextResponse.json({ posts, counts, missingImage });
  } catch (error) {
    console.error('Notion GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/comms/notion — Update a Notion page (status, date, image)
 */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!NOTION_TOKEN) return NextResponse.json({ error: 'Notion token not configured' }, { status: 500 });

  try {
    const body = await request.json();
    const { pageId, status, sentDate, imageUrl } = body;
    if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 });

    const properties: Record<string, unknown> = {};
    if (status) {
      properties['Status'] = { status: { name: status } };
    }
    if (sentDate) {
      properties['Sent date'] = { date: { start: sentDate } };
    }
    if (imageUrl) {
      properties['Image'] = { files: [{ type: 'external', name: 'image', external: { url: imageUrl } }] };
    }

    const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
      method: 'PATCH',
      headers: notionHeaders(),
      body: JSON.stringify({ properties }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Notion patch error:', err);
      return NextResponse.json({ error: 'Notion update failed' }, { status: res.status });
    }

    const page = await res.json();
    return NextResponse.json({ post: mapPage(page) });
  } catch (error) {
    console.error('Notion PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/**
 * POST /api/admin/comms/notion — Create a new Notion page
 */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!NOTION_TOKEN) return NextResponse.json({ error: 'Notion token not configured' }, { status: 500 });

  try {
    const body = await request.json();
    const { title, content, status, sentDate, imageUrl, targets } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    const properties: Record<string, unknown> = {
      'Content/Communication Name': { title: [{ text: { content: title } }] },
      'Communication Type': { select: { name: 'LinkedIn Post' } },
    };
    if (status) properties['Status'] = { status: { name: status } };
    if (sentDate) properties['Sent date'] = { date: { start: sentDate } };
    if (imageUrl) properties['Image'] = { files: [{ type: 'external', name: 'image', external: { url: imageUrl } }] };
    if (targets?.length) {
      properties['Target Accounts'] = {
        multi_select: targets.map((t: string) => ({ name: t })),
      };
    }

    const children = content ? [{
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content } }],
      },
    }] : [];

    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify({ parent: { database_id: DB_ID }, properties, children }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Notion create error:', err);
      return NextResponse.json({ error: 'Notion create failed' }, { status: res.status });
    }

    const page = await res.json();
    return NextResponse.json({ post: mapPage(page) });
  } catch (error) {
    console.error('Notion POST error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
