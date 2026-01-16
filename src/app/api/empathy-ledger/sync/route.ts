import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

/**
 * POST /api/empathy-ledger/sync
 *
 * Syncs public stories from Empathy Ledger to JusticeHub's local database.
 * This allows for faster page loads and reduces load on Empathy Ledger.
 *
 * Only syncs stories that meet consent requirements:
 * - is_public = true
 * - privacy_level = 'public'
 *
 * Query params:
 *   - force: if 'true', re-syncs all stories (default: only new/updated)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Get JusticeHub service client
    const supabase = createServiceClient();

    // Get the last sync timestamp from JusticeHub
    let lastSyncAt: string | null = null;
    if (!force) {
      const { data: syncRecord } = await supabase
        .from('sync_metadata')
        .select('last_synced_at')
        .eq('source', 'empathy_ledger_stories')
        .single();

      lastSyncAt = syncRecord?.last_synced_at || null;
    }

    // Fetch public stories from Empathy Ledger (avoiding storytellers join due to RLS)
    let query = empathyLedgerClient
      .from('stories')
      .select(`
        id,
        title,
        summary,
        content,
        story_image_url,
        story_type,
        themes,
        is_featured,
        justicehub_featured,
        cultural_sensitivity_level,
        is_public,
        privacy_level,
        published_at,
        created_at,
        updated_at,
        storyteller_id,
        organization_id
      `)
      .eq('is_public', true)
      .eq('privacy_level', 'public');

    // Only get stories updated since last sync (unless force)
    if (lastSyncAt) {
      query = query.gt('updated_at', lastSyncAt);
    }

    const { data: stories, error: fetchError } = await query
      .order('updated_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error('Error fetching stories from Empathy Ledger:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stories from Empathy Ledger' },
        { status: 500 }
      );
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new stories to sync',
        synced: 0,
        lastSyncAt
      });
    }

    // Map story_type to category labels
    const storyTypeLabels: Record<string, string> = {
      'personal_narrative': 'Personal Story',
      'traditional_knowledge': 'Traditional Knowledge',
      'impact_story': 'Impact Story',
      'community_story': 'Community Story',
      'healing_journey': 'Healing Journey',
      'advocacy': 'Advocacy',
      'cultural_practice': 'Cultural Practice',
    };

    // Prepare stories for upsert to JusticeHub
    const storiesToSync = stories.map(story => ({
      empathy_ledger_id: story.id,
      title: story.title,
      summary: story.summary,
      content: story.content,
      story_image_url: story.story_image_url,
      story_type: story.story_type,
      story_category: story.story_type ? storyTypeLabels[story.story_type] || story.story_type : null,
      themes: story.themes,
      is_featured: story.is_featured || story.justicehub_featured,
      cultural_sensitivity_level: story.cultural_sensitivity_level,
      source: 'empathy_ledger',
      source_published_at: story.published_at,
      synced_at: new Date().toISOString(),
    }));

    // Upsert stories to JusticeHub (using empathy_ledger_id as unique key)
    const { data: syncedStories, error: syncError } = await supabase
      .from('synced_stories')
      .upsert(storiesToSync, {
        onConflict: 'empathy_ledger_id',
        ignoreDuplicates: false
      })
      .select('id');

    if (syncError) {
      // Table might not exist - create it
      if (syncError.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'synced_stories table does not exist. Please run migration.',
          migration_needed: true
        }, { status: 500 });
      }
      console.error('Error syncing stories to JusticeHub:', syncError);
      return NextResponse.json(
        { success: false, error: 'Failed to sync stories to JusticeHub' },
        { status: 500 }
      );
    }

    // Update sync metadata
    const now = new Date().toISOString();
    await supabase
      .from('sync_metadata')
      .upsert({
        source: 'empathy_ledger_stories',
        last_synced_at: now,
        last_sync_count: storiesToSync.length,
        updated_at: now
      }, {
        onConflict: 'source'
      });

    return NextResponse.json({
      success: true,
      message: `Synced ${storiesToSync.length} stories from Empathy Ledger`,
      synced: storiesToSync.length,
      stories: syncedStories,
      syncedAt: now
    });

  } catch (error: unknown) {
    console.error('Empathy Ledger sync error:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync stories';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/empathy-ledger/sync
 *
 * Returns sync status and metadata
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: syncRecord, error } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('source', 'empathy_ledger_stories')
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Failed to get sync status' },
        { status: 500 }
      );
    }

    // Get count of synced stories
    const { count } = await supabase
      .from('synced_stories')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'empathy_ledger');

    return NextResponse.json({
      success: true,
      sync_status: syncRecord || { message: 'No sync has been performed yet' },
      synced_story_count: count || 0
    });

  } catch (error: unknown) {
    console.error('Error getting sync status:', error);
    const message = error instanceof Error ? error.message : 'Failed to get sync status';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
