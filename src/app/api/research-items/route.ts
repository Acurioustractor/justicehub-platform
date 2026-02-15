import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const category = searchParams.get('category');
    const jurisdiction = searchParams.get('jurisdiction');
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    const featured = searchParams.get('featured');
    const q = searchParams.get('q'); // search query

    let query = supabase
      .from('research_items')
      .select('*')
      .eq('is_active', true)
      .order('year', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (jurisdiction && jurisdiction !== 'all') {
      query = query.eq('jurisdiction', jurisdiction);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // For search, use ilike on multiple fields
    if (q) {
      query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,organization.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match frontend interface
    const items = data.map((item: any) => ({
      id: item.slug,
      title: item.title,
      authors: item.authors || [],
      organization: item.organization,
      year: item.year,
      category: item.category,
      jurisdiction: item.jurisdiction,
      type: item.type,
      summary: item.summary,
      keyFindings: item.key_findings || [],
      pdfUrl: item.pdf_url,
      externalUrl: item.external_url,
      videoUrl: item.video_url,
      tags: item.tags || [],
      featured: item.is_featured,
    }));

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
