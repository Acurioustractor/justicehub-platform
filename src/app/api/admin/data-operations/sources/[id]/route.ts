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

// GET - Get single source with history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch source and recent scrape history in parallel
    const [sourceResult, historyResult] = await Promise.all([
      supabase
        .from('alma_source_registry')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('alma_scrape_history')
        .select('*')
        .eq('source_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (sourceResult.error) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({
      source: sourceResult.data,
      history: historyResult.data || [],
    });
  } catch (error: unknown) {
    console.error('Get source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update source (enable/disable, update settings)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Allowed fields to update
    const allowedFields = [
      'name',
      'source_type',
      'jurisdiction',
      'update_frequency',
      'priority_score',
      'consent_level',
      'organization',
      'metadata',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle special action: reset failure count
    if (body.action === 'reset_failures') {
      updateData.failure_count = 0;
    }

    // Handle special action: trigger scrape (queue for next scrape)
    if (body.action === 'trigger_scrape') {
      updateData.next_scrape_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const serviceClient = getServiceClient();

    const { data, error } = await serviceClient
      .from('alma_source_registry')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update source error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Update source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove source
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await isAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const serviceClient = getServiceClient();

    const { error } = await serviceClient
      .from('alma_source_registry')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete source error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
