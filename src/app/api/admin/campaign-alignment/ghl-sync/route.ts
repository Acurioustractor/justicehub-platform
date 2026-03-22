import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient } from '@/lib/ghl/client';

// Map GHL tags to outreach status updates
const TAG_TO_STATUS: Record<string, string> = {
  'Partner': 'committed',
  'Wants to Help': 'responded',
  'Reacted': 'contacted',
  'Nominated': 'contacted',
  'Wrote MP': 'contacted',
};

// Status priority — higher number = further along the pipeline
const STATUS_PRIORITY: Record<string, number> = {
  'not_started': 0,
  'identified': 1,
  'pending': 2,
  'nominated': 3,
  'contacted': 4,
  'responded': 5,
  'in_discussion': 6,
  'proposal_sent': 7,
  'meeting_scheduled': 8,
  'committed': 9,
  'active': 10,
  'engaged': 11,
};

/**
 * POST /api/admin/campaign-alignment/ghl-sync
 * Batch sync GHL contact data back to Supabase entities.
 * Pulls tags, last activity, and infers outreach status from GHL state.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const service = createServiceClient();
    const ghl = getGHLClient();

    if (!ghl.isConfigured()) {
      return NextResponse.json({ error: 'GHL not configured' }, { status: 500 });
    }

    // Get all entities that have a GHL contact ID
    const { data: entities, error: fetchError } = await service
      .from('campaign_alignment_entities')
      .select('id, ghl_contact_id, outreach_status, alignment_signals, name')
      .not('ghl_contact_id', 'is', null);

    if (fetchError) throw fetchError;
    if (!entities || entities.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No GHL-linked entities' });
    }

    let synced = 0;
    let advanced = 0;
    const errors: string[] = [];

    // Process in batches of 10 to avoid rate limits
    for (let i = 0; i < entities.length; i += 10) {
      const batch = entities.slice(i, i + 10);

      const results = await Promise.allSettled(
        batch.map(async (entity) => {
          const contact = await ghl.getContact(entity.ghl_contact_id);
          if (!contact) return null;

          const tags: string[] = contact.tags || [];
          const currentStatus = entity.outreach_status || 'pending';
          const currentPriority = STATUS_PRIORITY[currentStatus] ?? 0;

          // Determine best status from GHL tags
          let bestStatus = currentStatus;
          let bestPriority = currentPriority;

          for (const tag of tags) {
            const mappedStatus = TAG_TO_STATUS[tag];
            if (mappedStatus) {
              const mappedPriority = STATUS_PRIORITY[mappedStatus] ?? 0;
              if (mappedPriority > bestPriority) {
                bestStatus = mappedStatus;
                bestPriority = mappedPriority;
              }
            }
          }

          // Check for conversation activity — if GHL has conversations, at least "contacted"
          const conversations = await ghl.getContactConversations(entity.ghl_contact_id);
          if (conversations.length > 0 && bestPriority < (STATUS_PRIORITY['contacted'] ?? 4)) {
            bestStatus = 'contacted';
            bestPriority = STATUS_PRIORITY['contacted'] ?? 4;
          }

          // Check if any inbound messages exist — means they responded
          if (conversations.length > 0) {
            const recentConvo = conversations[0];
            const messages = await ghl.getConversationMessages(recentConvo.id, 5);
            const hasInbound = messages.some((m: any) => m.direction === 'inbound');
            if (hasInbound && bestPriority < (STATUS_PRIORITY['responded'] ?? 5)) {
              bestStatus = 'responded';
              bestPriority = STATUS_PRIORITY['responded'] ?? 5;
            }
          }

          // Build update
          const signals = entity.alignment_signals || {};
          const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          // Store GHL tags in signals for visibility
          signals.ghl_tags = tags;
          signals.ghl_last_sync = new Date().toISOString();
          if (contact.lastActivity) {
            signals.ghl_last_activity = contact.lastActivity;
          }
          updates.alignment_signals = signals;

          // Only advance status, never regress
          const didAdvance = bestPriority > currentPriority;
          if (didAdvance) {
            updates.outreach_status = bestStatus;
          }

          await service
            .from('campaign_alignment_entities')
            .update(updates)
            .eq('id', entity.id);

          return { advanced: didAdvance };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          synced++;
          if (r.value.advanced) advanced++;
        } else if (r.status === 'rejected') {
          errors.push(String(r.reason).slice(0, 100));
        }
      }
    }

    return NextResponse.json({
      synced,
      advanced,
      total: entities.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error('GHL sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
