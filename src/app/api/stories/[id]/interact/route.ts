/**
 * Story Interaction API Endpoint
 * 
 * Handles story interactions like likes, shares, and views.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStorytellerService } from '@/lib/empathy-ledger/storyteller-service';
import { env } from '@/lib/env';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const body = await request.json();
    const { interactionType, storytellerId } = body;

    // Validate interaction type
    if (!['view', 'like', 'share'].includes(interactionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type. Must be: view, like, or share' },
        { status: 400 }
      );
    }

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // Record the interaction
    const result = await storytellerService.recordInteraction(
      storyId,
      interactionType,
      storytellerId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${interactionType} recorded successfully`
    });

  } catch (error: any) {
    console.error('Story interaction error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}