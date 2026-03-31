import { NextRequest, NextResponse } from 'next/server';
import { createClient as createELClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const EL_URL = process.env.EMPATHY_LEDGER_URL;
const EL_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY || process.env.EMPATHY_LEDGER_API_KEY;
const JH_ORG_ID = '0e878fa2-3b1a-4b1a-8b1a-1234567890ab'; // JusticeHub org in EL
const JH_PROJECT_ID = process.env.EMPATHY_LEDGER_JH_PROJECT_ID || '2e774118-1234-1234-1234-1234567890ab';

function getELClient() {
  if (!EL_URL || !EL_KEY) throw new Error('Empathy Ledger not configured');
  return createELClient(EL_URL, EL_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/empathy-ledger/media/upload
 *
 * Upload a photo to Empathy Ledger storage and create a media_assets record.
 * Accepts multipart form data with:
 *   - file: the image file
 *   - title: optional title
 *   - galleryId: optional gallery/collection to assign to
 *   - storytellerId: optional storyteller to link
 *   - organizationId: JH org ID (for cross-reference)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check — admin only
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files can be pushed to Empathy Ledger' }, { status: 400 });
    }

    const title = (formData.get('title') as string) || file.name.split('.')[0].replace(/[-_]/g, ' ');
    const galleryId = formData.get('galleryId') as string | null;
    const storytellerId = formData.get('storytellerId') as string | null;

    const el = getELClient();

    // Upload to EL storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${randomStr}-${timestamp}.${ext}`;
    const storagePath = `uploads/justicehub/${fileName}`;

    const { error: uploadError } = await el.storage
      .from('media')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
      });

    if (uploadError) {
      return NextResponse.json({ error: `EL storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = el.storage
      .from('media')
      .getPublicUrl(storagePath);

    // Create media_assets record in EL
    const { data: record, error: dbError } = await el
      .from('media_assets')
      .insert({
        title,
        filename: fileName,
        mime_type: file.type,
        url: publicUrl,
        file_size: file.size,
        collection_id: galleryId || null,
        project_id: JH_PROJECT_ID,
        alt_text: title,
        caption: title,
        location_name: null,
        cultural_tags: ['justicehub-upload'],
      })
      .select('id, title, url, thumbnail_url, created_at')
      .single();

    if (dbError) {
      return NextResponse.json({ error: `EL record creation failed: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        title: record.title,
        url: record.url,
        thumbnail_url: record.thumbnail_url,
        created_at: record.created_at,
        source: 'empathy_ledger',
        storage_path: storagePath,
      },
    });
  } catch (error: any) {
    console.error('EL upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
