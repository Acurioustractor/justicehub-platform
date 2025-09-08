/**
 * Stories API Endpoint
 * 
 * Handles story creation, retrieval, and management in the Empathy Ledger database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStorytellerService } from '@/lib/empathy-ledger/storyteller-service';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const organizationId = searchParams.get('organizationId');
    const storytellerId = searchParams.get('storytellerId');
    const storyType = searchParams.get('storyType');
    const visibility = searchParams.get('visibility') || 'public';
    const tags = searchParams.get('tags')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    const result = await storytellerService.getStories({
      project_id: projectId || undefined,
      organization_id: organizationId || undefined,
      storyteller_id: storytellerId || undefined,
      story_type: storyType || undefined,
      visibility: visibility as any,
      tags: tags || undefined,
      limit,
      offset
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stories: result.stories,
      total: result.total,
      limit,
      offset,
      message: 'Stories retrieved successfully'
    });

  } catch (error: any) {
    console.error('Stories API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      storytellerId,
      projectId,
      organizationId,
      storyType,
      visibility,
      tags,
      mediaUrls,
      featuredImageUrl,
      consentVerified
    } = body;

    // Validate required fields
    if (!title || !content || !storytellerId || !projectId || !organizationId) {
      return NextResponse.json(
        { error: 'Title, content, storytellerId, projectId, and organizationId are required' },
        { status: 400 }
      );
    }

    if (!consentVerified) {
      return NextResponse.json(
        { error: 'Consent must be verified before creating stories' },
        { status: 400 }
      );
    }

    // Get Empathy Ledger database credentials
    const empathyLedgerUrl = env.SUPABASE_URL;
    const empathyLedgerKey = env.SUPABASE_ANON_KEY;

    const storytellerService = createStorytellerService(empathyLedgerUrl, empathyLedgerKey);

    // Create story
    const result = await storytellerService.createStory({
      title,
      content,
      storyteller_id: storytellerId,
      project_id: projectId,
      organization_id: organizationId,
      story_type: storyType || 'personal',
      visibility: visibility || 'public',
      tags: tags || [],
      media_urls: mediaUrls,
      featured_image_url: featuredImageUrl,
      consent_verified: consentVerified,
      metadata: {
        created_via: 'justicehub',
        created_at: new Date().toISOString()
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story: result.story,
      message: 'Story created successfully'
    });

  } catch (error: any) {
    console.error('Create story error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}