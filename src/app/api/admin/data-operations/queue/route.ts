import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Helper to check admin status
async function isAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();
  return data?.is_super_admin === true;
}

// Get service client for write operations
function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing service role key');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

// GET - Fetch queue items with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');

    let query = supabase
      .from('alma_discovered_links')
      .select('*', { count: 'exact' });

    // Status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Type filter
    if (type) {
      query = query.eq('predicted_type', type);
    }

    // Order by relevance and age
    query = query
      .order('predicted_relevance', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Queue fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get status distribution
    const { data: statusCounts } = await supabase
      .from('alma_discovered_links')
      .select('status')
      .then(result => {
        const counts: Record<string, number> = {};
        (result.data || []).forEach(item => {
          const status = item.status || 'unknown';
          counts[status] = (counts[status] || 0) + 1;
        });
        return { data: counts };
      });

    // Get type distribution
    const { data: typeCounts } = await supabase
      .from('alma_discovered_links')
      .select('predicted_type')
      .then(result => {
        const counts: Record<string, number> = {};
        (result.data || []).forEach(item => {
          const t = item.predicted_type || 'unknown';
          counts[t] = (counts[t] || 0) + 1;
        });
        return { data: counts };
      });

    return NextResponse.json({
      items: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
      summary: {
        byStatus: statusCounts,
        byType: typeCounts,
      },
    });
  } catch (error: unknown) {
    console.error('Queue API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new links to queue (batch)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { links } = body;

    if (!links || !Array.isArray(links) || links.length === 0) {
      return NextResponse.json({ error: 'Links array is required' }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    // Prepare links for insertion
    const linksToInsert = links.map(link => ({
      url: link.url,
      source_url: link.source_url || null,
      predicted_type: link.type || 'website',
      predicted_relevance: link.relevance || 0.5,
      status: 'pending',
      metadata: link.metadata || {},
    }));

    // Insert with upsert to avoid duplicates
    const { data, error } = await serviceClient
      .from('alma_discovered_links')
      .upsert(linksToInsert, {
        onConflict: 'url',
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      console.error('Queue insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      added: data?.length || 0,
      message: `Added ${data?.length || 0} links to queue`,
    });
  } catch (error: unknown) {
    console.error('Queue POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update queue items (approve, reject, reset)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
    }

    if (!action || !['approve', 'reject', 'reset', 'pending'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use: approve, reject, reset, pending' }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      reset: 'pending',
      pending: 'pending',
    };

    const { data, error } = await serviceClient
      .from('alma_discovered_links')
      .update({
        status: statusMap[action],
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select();

    if (error) {
      console.error('Queue update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: `${action}d ${data?.length || 0} items`,
    });
  } catch (error: unknown) {
    console.error('Queue PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
