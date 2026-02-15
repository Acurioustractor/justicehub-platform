import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Valid content types and their tables
const CONTENT_TABLES: Record<string, string> = {
  photos: 'partner_photos',
  videos: 'partner_videos',
  metrics: 'partner_impact_metrics',
  storytellers: 'partner_storytellers',
  links: 'partner_external_links',
};

// Check if user is admin
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();
  return data?.is_super_admin === true;
}

// Get service client
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

// POST - Add new content
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
    const { contentType, organizationId, data } = body;

    if (!contentType || !CONTENT_TABLES[contentType]) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const tableName = CONTENT_TABLES[contentType];

    const { data: result, error } = await serviceClient
      .from(tableName)
      .insert({
        organization_id: organizationId,
        ...data,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove content
export async function DELETE(request: NextRequest) {
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
    const contentType = searchParams.get('contentType');
    const id = searchParams.get('id');

    if (!contentType || !CONTENT_TABLES[contentType]) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const tableName = CONTENT_TABLES[contentType];

    const { error } = await serviceClient
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update content (e.g., set featured)
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
    const { contentType, id, data, organizationId, clearFeatured } = body;

    if (!contentType || !CONTENT_TABLES[contentType]) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const tableName = CONTENT_TABLES[contentType];

    // If clearing featured, first unfeatured all for this org
    if (clearFeatured && organizationId) {
      await serviceClient
        .from(tableName)
        .update({ is_featured: false })
        .eq('organization_id', organizationId);
    }

    const { data: result, error } = await serviceClient
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
