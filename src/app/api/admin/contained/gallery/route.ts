import { createClient } from '@/lib/supabase/server-lite';
import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

/**
 * GET /api/admin/contained/gallery
 * Returns current gallery images + available images from filesystem
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch current gallery config
    const { data: gallery } = await supabase
      .from('page_gallery')
      .select('images, updated_at')
      .eq('page_slug', 'contained')
      .single();

    // Scan available images from public/images/orgs/
    const available = scanAvailableImages();

    return NextResponse.json({
      images: (gallery?.images as GalleryImage[]) || [],
      available,
      updated_at: gallery?.updated_at,
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/contained/gallery
 * Update gallery images (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { images } = await request.json();

    if (!Array.isArray(images)) {
      return NextResponse.json({ error: 'images must be an array' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('page_gallery')
      .upsert({
        page_slug: 'contained',
        images,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, { onConflict: 'page_slug' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ images: data.images, updated_at: data.updated_at });
  } catch (error) {
    console.error('Gallery update error:', error);
    return NextResponse.json({ error: 'Failed to update gallery' }, { status: 500 });
  }
}

/**
 * Scan public/images/orgs/ for all available images
 */
function scanAvailableImages(): { src: string; org: string; filename: string }[] {
  const results: { src: string; org: string; filename: string }[] = [];
  const orgsDir = join(process.cwd(), 'public', 'images', 'orgs');

  try {
    const orgs = readdirSync(orgsDir);
    for (const org of orgs) {
      const orgPath = join(orgsDir, org);
      if (!statSync(orgPath).isDirectory()) continue;
      scanDir(orgPath, org, `/images/orgs/${org}`, results);
    }
  } catch {
    // Directory might not exist in some environments
  }

  return results;
}

function scanDir(
  dirPath: string,
  org: string,
  urlPrefix: string,
  results: { src: string; org: string; filename: string }[]
) {
  try {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath, org, `${urlPrefix}/${entry}`, results);
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry)) {
        results.push({
          src: `${urlPrefix}/${entry}`,
          org,
          filename: entry,
        });
      }
    }
  } catch {
    // Skip unreadable dirs
  }
}
