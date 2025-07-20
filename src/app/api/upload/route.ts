import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { uploadToS3, validateFile } from '@/lib/s3';
import type { FileUploadRequest, FileUploadResponse } from '@/types/api';

export const runtime = 'nodejs';
export const maxDuration = 60; // Maximum allowed duration for the function
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uploadType = formData.get('type') as string || 'story_media';
    const folder = formData.get('folder') as string || uploadType;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file.size, file.type, uploadType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const result = await uploadToS3(
      buffer,
      file.name,
      file.type,
      folder
    );

    // Return upload result
    const response: FileUploadResponse = {
      url: result.cdnUrl || result.url,
      key: result.key,
      size: file.size,
      type: file.type,
      name: file.name,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Support for signed URL generation (for private files)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'No key provided' }, { status: 400 });
    }

    // For now, we're using public-read ACL, so just return the public URL
    // In the future, you might want to implement signed URLs for private content
    const cdnDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_S3_REGION || process.env.AWS_REGION;

    const url = cdnDomain
      ? `https://${cdnDomain}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Get URL error:', error);
    return NextResponse.json(
      { error: 'Failed to get file URL' },
      { status: 500 }
    );
  }
}