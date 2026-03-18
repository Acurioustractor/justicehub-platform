import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

/**
 * POST /api/contained/tour-stories
 * Submit a community story at a tour stop.
 * Stories are created with status='pending' for admin review.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, tour_stop, story } = body;

    if (!story || typeof story !== 'string' || story.trim().length < 10) {
      return NextResponse.json({ error: 'Story must be at least 10 characters' }, { status: 400 });
    }

    if (!tour_stop || typeof tour_stop !== 'string') {
      return NextResponse.json({ error: 'Tour stop is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tour_stories')
      .insert({
        name: (name && typeof name === 'string') ? name.trim().substring(0, 100) : 'Anonymous',
        tour_stop: tour_stop.trim().substring(0, 100),
        story: story.trim().substring(0, 5000),
        status: 'pending',
        is_public: true,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, message: 'Story submitted for review' }, { status: 201 });
  } catch (error) {
    console.error('Tour story submit error:', error);
    return NextResponse.json({ error: 'Failed to submit story' }, { status: 500 });
  }
}
