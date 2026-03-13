import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';

/**
 * GET /api/admin/art-innovation/[id]
 * Fetch a single art_innovation project by ID. Admin only.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { supabase } = admin;

    const { data, error } = await supabase
      .from('art_innovation')
      .select('id, title, slug, type, description')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin art-innovation GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}
