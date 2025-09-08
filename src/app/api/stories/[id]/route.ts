/**
 * Story Detail API Endpoint
 * 
 * Handles individual story operations including viewing, updating, and interactions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStorytellerService } from '@/lib/empathy-ledger/storyteller-service';
import { env } from '@/lib/env';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const { searchParams } = new URL(request.url);
    const recordView = searchParams.get('recordView') === 'true';
    const viewerId = searchParams.get('viewerId');

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // Get story details
    const result = await storytellerService.getStory(storyId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Story not found' ? 404 : 500 }
      );
    }

    // Record view if requested
    if (recordView) {
      await storytellerService.recordInteraction(
        storyId, 
        'view', 
        viewerId || undefined
      );
    }

    return NextResponse.json({
      success: true,
      story: result.story,
      message: 'Story retrieved successfully'
    });

  } catch (error: any) {
    console.error('Story detail API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const body = await request.json();
    const {
      title,
      content,
      storyType,
      visibility,
      tags,
      mediaUrls,
      featuredImageUrl,
      status
    } = body;

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // Prepare updates
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (storyType !== undefined) updates.story_type = storyType;
    if (visibility !== undefined) updates.visibility = visibility;
    if (tags !== undefined) updates.tags = tags;
    if (mediaUrls !== undefined) updates.media_urls = mediaUrls;
    if (featuredImageUrl !== undefined) updates.featured_image_url = featuredImageUrl;
    if (status !== undefined) updates.status = status;

    // Update story
    const result = await storytellerService.updateStory(storyId, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story: result.story,
      message: 'Story updated successfully'
    });

  } catch (error: any) {
    console.error('Update story error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // Instead of deleting, archive the story
    const result = await storytellerService.updateStory(storyId, {
      status: 'archived'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Story archived successfully'
    });

  } catch (error: any) {
    console.error('Archive story error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}