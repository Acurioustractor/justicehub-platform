import { NextRequest, NextResponse } from 'next/server';
import { createSignalEngineClient } from '@/lib/supabase/signal-engine';

/**
 * Signal Events API
 * GET /api/signal-engine/events — List signal events (with content)
 * PATCH /api/signal-engine/events — Update event/content status (approve/reject/dismiss)
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createSignalEngineClient();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status'); // new, composing, queued, published, dismissed
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = supabase
      .from('signal_events')
      .select('*, signal_content(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Events query error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSignalEngineClient();
    const body = await request.json();
    const { event_id, content_id, action } = body as {
      event_id?: string;
      content_id?: string;
      action: 'approve' | 'reject' | 'dismiss' | 'publish';
    };

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    // Update a specific content item
    if (content_id) {
      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
        publish: 'published',
      };
      const newStatus = statusMap[action];
      if (!newStatus) {
        return NextResponse.json({ error: 'Invalid action for content' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      };
      if (action === 'publish') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('signal_content')
        .update(updateData)
        .eq('id', content_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
      }
    }

    // Update an entire event
    if (event_id) {
      if (action === 'dismiss') {
        const { error } = await supabase
          .from('signal_events')
          .update({ status: 'dismissed' })
          .eq('id', event_id);

        if (error) {
          return NextResponse.json({ error: 'Failed to dismiss event' }, { status: 500 });
        }
      } else if (action === 'approve') {
        // Approve all pending content for this event
        const { error: contentError } = await supabase
          .from('signal_content')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .eq('signal_event_id', event_id)
          .eq('status', 'pending');

        if (contentError) {
          return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
        }

        // Mark event as queued for publishing
        const { error: eventError } = await supabase
          .from('signal_events')
          .update({ status: 'queued' })
          .eq('id', event_id);

        if (eventError) {
          return NextResponse.json({ error: 'Failed to update event status' }, { status: 500 });
        }
      } else if (action === 'reject') {
        // Reject all pending content and dismiss event
        await supabase
          .from('signal_content')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
          .eq('signal_event_id', event_id)
          .eq('status', 'pending');

        await supabase
          .from('signal_events')
          .update({ status: 'dismissed' })
          .eq('id', event_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Events PATCH error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
