import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';
import crypto from 'crypto';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];

/**
 * POST /api/contained/stories/upload-audio
 * Upload a voice recording from the CONTAINED experience page.
 * Requires device enrollment. Stores in JH Supabase storage.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid audio type: ${file.type}. Accepted: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Authenticate via device session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 401 });
    }

    // Verify device session exists
    const service = createServiceClient();
    const { data: session } = await service
      .from('device_sessions')
      .select('id')
      .eq('auth_user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: 'No device session' }, { status: 401 });
    }

    // Determine file extension from MIME type
    const ext = file.type === 'audio/webm' ? 'webm'
      : file.type === 'audio/mp4' ? 'm4a'
      : file.type === 'audio/mpeg' ? 'mp3'
      : 'ogg';

    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `contained/voice-notes/${fileName}`;

    // Upload to JH Supabase storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await service.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Audio upload failed:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = service.storage
      .from('media')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    });
  } catch (err) {
    console.error('Audio upload error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
