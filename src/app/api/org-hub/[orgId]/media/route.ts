import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('media_items')
      .select('id, file_url, file_type, title, description, alt_text, thumbnail_url, consent_verified, community_approved, manual_tags, capture_date, created_at')
      .contains('organization_ids', [orgId])
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo)
      return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${randomStr}-${timestamp}.${ext}`;
    const bucket = isImage ? 'photos' : 'videos';
    const filePath = `orgs/${orgId}/${fileName}`;

    const serviceClient = createServiceClient();

    const { error: uploadError } = await serviceClient.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
      });

    if (uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: { publicUrl } } = serviceClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Create media_items record
    const { data: record, error: dbError } = await serviceClient
      .from('media_items')
      .insert({
        file_url: publicUrl,
        file_type: isImage ? 'photo' : 'video',
        title: file.name.split('.')[0].replace(/[-_]/g, ' '),
        organization_ids: [orgId],
        consent_verified: true,
        community_approved: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('media_items')
      .update(updates)
      .eq('id', id)
      .contains('organization_ids', [orgId])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('media_items')
      .delete()
      .eq('id', id)
      .contains('organization_ids', [orgId]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
