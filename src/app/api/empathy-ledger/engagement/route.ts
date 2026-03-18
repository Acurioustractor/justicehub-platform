import { NextRequest, NextResponse } from 'next/server';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';

/**
 * POST /api/empathy-ledger/engagement
 *
 * Record engagement events directly in the Empathy Ledger database
 * so storytellers can see how their content is used in JusticeHub.
 *
 * Body:
 *   - event_type: profile_viewed | story_clicked | content_shared | profile_synced
 *   - entity_type: storyteller | story | gallery
 *   - entity_id: uuid
 *   - metadata: { source, tile_type, media_asset_id, ... }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return NextResponse.json({ ok: false, reason: 'EMPATHY_LEDGER_NOT_CONFIGURED' });
    }

    const body = await request.json();

    const { event_type, entity_type, entity_id, metadata } = body;

    if (!event_type || !entity_type || !entity_id) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: event_type, entity_type, entity_id' },
        { status: 400 },
      );
    }

    const { error } = await empathyLedgerServiceClient
      .from('engagement_events')
      .insert({
        event_type,
        entity_type,
        entity_id,
        source: 'justicehub',
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      // If engagement_events table doesn't exist, log but don't fail
      if (error.message.includes('does not exist')) {
        console.warn('EL engagement_events table not found — event dropped:', event_type, entity_id);
        return NextResponse.json({ ok: true, dropped: true });
      }
      console.error('EL engagement insert error:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('EL engagement error:', error);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
