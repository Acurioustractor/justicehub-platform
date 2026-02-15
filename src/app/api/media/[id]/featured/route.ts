import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/media/[id]/featured
 * Toggle featured status for a photo or video
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { table, is_featured } = await request.json();

    // Validate table name
    if (!['partner_photos', 'partner_videos'].includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    // Update the record
    const { error } = await supabase
      .from(table)
      .update({ is_featured })
      .eq('id', id);

    if (error) {
      console.error('Error updating featured status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_featured });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    );
  }
}
