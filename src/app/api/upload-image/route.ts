import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Security constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const ALLOWED_FOLDERS = ['blog', 'stories', 'profiles', 'organizations'];

export async function POST(request: NextRequest) {
  try {
    // Check authentication with server client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // SECURITY: Require authentication for all uploads
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Upload rejected - authentication required');
      }
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'blog';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // SECURITY: Validate folder to prevent path traversal
    if (!ALLOWED_FOLDERS.includes(folder) || folder.includes('..') || folder.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid upload folder' },
        { status: 400 }
      );
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // SECURITY: Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    // SECURITY: Validate file extension matches MIME type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file extension' },
        { status: 400 }
      );
    }

    // Create unique filename with user ID prefix for traceability
    const fileName = `${user.id.substring(0, 8)}-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Use service role client for storage (bypasses RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY;

    if (!serviceRoleKey) {
      console.error('Upload failed: missing service role key');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Upload to Supabase storage with service key
    const { data, error } = await serviceSupabase.storage
      .from('story-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload failed:', error.message);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = serviceSupabase.storage
      .from('story-images')
      .getPublicUrl(filePath);

    // Generate alt text from filename (sanitize special chars)
    const altText = file.name
      .split('.')[0]
      .replace(/[-_]/g, ' ')
      .replace(/[<>]/g, '');

    return NextResponse.json({
      success: true,
      url: publicUrl,
      altText,
      path: filePath
    });
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
