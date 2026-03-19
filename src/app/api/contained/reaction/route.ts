import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/contained/reaction
 * Captures visitor reactions after walking through THE CONTAINED.
 * Saves to community_reflections and optionally tags in GHL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feelings, response, would_nominate, name, email } = body;

    if ((!feelings || feelings.length === 0) && !response) {
      return NextResponse.json(
        { error: 'Please share at least one feeling or a written response.' },
        { status: 400 }
      );
    }

    const service = createServiceClient() as any;

    // Build reflection text from feelings + response
    const parts: string[] = [];
    if (feelings?.length > 0) {
      parts.push(`Feelings: ${feelings.join(', ')}`);
    }
    if (response) {
      parts.push(response.slice(0, 1000));
    }
    if (would_nominate) {
      parts.push(`Would nominate: ${would_nominate}`);
    }

    const reflectionText = parts.join('\n\n');

    // Save to community_reflections
    const { data, error } = await service
      .from('community_reflections')
      .insert({
        name: name || 'Anonymous Visitor',
        reflection: reflectionText,
        is_approved: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Reaction] Failed to save:', error);
      return NextResponse.json({ error: 'Failed to save reaction' }, { status: 500 });
    }

    // If email provided, tag in GHL
    if (email) {
      try {
        const { GHLClient } = await import('@/lib/ghl/client');
        const ghl = new GHLClient();
        if (ghl.isConfigured()) {
          await ghl.upsertContact({
            email,
            name: name || undefined,
            tags: ['contained-visitor', 'contained-2026-launch'],
            source: 'CONTAINED Reaction Form',
          });
        }
      } catch (ghlErr) {
        // Non-blocking — GHL failure shouldn't break the reaction
        console.error('[Reaction] GHL tag failed:', ghlErr);
      }
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
