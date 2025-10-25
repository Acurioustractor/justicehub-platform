import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { encode } from 'blurhash';

// Image size configurations
const SIZES = {
  thumbnail: { width: 400, quality: 80 },
  medium: { width: 1024, quality: 85 },
  large: { width: 1920, quality: 90 },
};

/**
 * Generate blurhash from image buffer
 */
async function generateBlurhash(buffer: Buffer): Promise<string> {
  try {
    const image = sharp(buffer);
    const { data, info } = await image
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch (error) {
    console.error('Error generating blurhash:', error);
    return '';
  }
}

/**
 * Optimize and generate multiple sizes of an image
 */
async function optimizeImage(
  buffer: Buffer,
  basePath: string,
  supabase: any
): Promise<{
  versions: Record<string, string>;
  width: number;
  height: number;
}> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const versions: Record<string, string> = {};

  // Generate optimized versions
  for (const [sizeName, config] of Object.entries(SIZES)) {
    // Skip if original is smaller than target size
    if (metadata.width && metadata.width < config.width) {
      continue;
    }

    const optimized = await image
      .resize(config.width, null, { withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toBuffer();

    const versionPath = basePath.replace(/\.[^.]+$/, `-${sizeName}.webp`);

    const { error } = await supabase.storage
      .from('story-images')
      .upload(versionPath, optimized, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year
        upsert: false,
      });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('story-images')
        .getPublicUrl(versionPath);

      versions[sizeName] = publicUrl;
    }
  }

  return {
    versions,
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const altText = formData.get('altText') as string || '';
    const caption = formData.get('caption') as string || '';
    const tags = formData.get('tags') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${randomStr}-${timestamp}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Create service role client for storage operations
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.YJSF_SUPABASE_SERVICE_KEY!
    );

    // Upload original file
    const { error: uploadError } = await serviceSupabase.storage
      .from('story-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL for original
    const { data: { publicUrl } } = serviceSupabase.storage
      .from('story-images')
      .getPublicUrl(filePath);

    // Generate optimized versions and blurhash in parallel
    const [optimized, blurhash] = await Promise.all([
      optimizeImage(buffer, filePath, serviceSupabase),
      generateBlurhash(buffer),
    ]);

    // Parse tags
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Generate alt text from filename if not provided
    const finalAltText = altText || file.name.split('.')[0].replace(/[-_]/g, ' ');

    // Save to media_library table
    const { data: mediaRecord, error: dbError } = await serviceSupabase
      .from('media_library')
      .insert({
        file_path: filePath,
        file_name: fileName,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        width: optimized.width,
        height: optimized.height,
        alt_text: finalAltText,
        caption: caption || null,
        tags: tagArray,
        folder,
        versions: optimized.versions,
        blurhash,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the upload if DB save fails
      console.warn('Image uploaded but not saved to media library:', dbError.message);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      altText: finalAltText,
      path: filePath,
      id: mediaRecord?.id,
      versions: optimized.versions,
      blurhash,
      width: optimized.width,
      height: optimized.height,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
