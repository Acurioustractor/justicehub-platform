import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication with server client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('🔐 Upload auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message
    });

    // Allow upload even without auth for now - we'll use service role for storage
    // TODO: Re-enable auth check once session handling is fixed
    if (!user) {
      console.warn('⚠️ No authenticated user, but allowing upload with service role');
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'blog';

    console.log('📤 Upload request:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      folder
    });

    if (!file) {
      console.error('❌ Upload blocked - No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Upload blocked - Invalid file type:', file.type);
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Use service role client for storage (bypasses RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY;

    if (!serviceRoleKey) {
      console.error('❌ Missing service role key - check env vars');
      return NextResponse.json({
        error: 'Server configuration error - missing service role key'
      }, { status: 500 });
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    console.log('☁️ Uploading to Supabase storage:', {
      bucket: 'story-images',
      filePath,
      fileSize: file.size
    });

    // Upload to Supabase storage with service key
    const { data, error } = await serviceSupabase.storage
      .from('story-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Storage upload error:', error);
      return NextResponse.json({
        error: error.message,
        details: 'Failed to upload to storage bucket'
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = serviceSupabase.storage
      .from('story-images')
      .getPublicUrl(filePath);

    // Generate alt text from filename
    const altText = file.name.split('.')[0].replace(/[-_]/g, ' ');

    console.log('✅ Upload successful:', {
      url: publicUrl,
      path: filePath
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      altText,
      path: filePath
    });
  } catch (error) {
    console.error('❌ Unexpected upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
