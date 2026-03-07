import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin';

/**
 * PATCH /api/admin/contained/stories/[id]
 * Admin: update story status (approve/reject)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { supabase } = admin;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be pending, approved, or rejected' },
        { status: 400 }
      );
    }

    const updateData: { status: string; reviewed_at?: string } = { status };
    if (status !== 'pending') {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tour_stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin story PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}
