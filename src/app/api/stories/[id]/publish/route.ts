/**
 * Story Publish API Endpoint
 * 
 * Handles publishing stories after consent verification.
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

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // Publish the story (includes consent verification)
    const result = await storytellerService.publishStory(storyId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('consent') ? 403 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story: result.story,
      message: 'Story published successfully'
    });

  } catch (error: any) {
    console.error('Publish story error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}