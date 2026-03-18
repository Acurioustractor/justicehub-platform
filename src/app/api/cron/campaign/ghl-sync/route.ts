import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

/**
 * GET /api/cron/campaign/ghl-sync
 * Daily cron: syncs high-scoring campaign allies to GHL.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ghl = getGHLClient();
  if (!ghl.isConfigured()) {
    return NextResponse.json({ error: 'GHL not configured' }, { status: 500 });
  }

  const supabase = createServiceClient();
  const stats = { synced: 0, skipped: 0, errors: 0 };

  try {
    // Fetch allies with email, no GHL link, composite_score >= 40
    const { data: entities, error } = await supabase
      .from('campaign_alignment_entities')
      .select('id, name, email, organization, position, composite_score, passion_score, campaign_list')
      .not('email', 'is', null)
      .is('ghl_contact_id', null)
      .gte('composite_score', 40)
      .in('alignment_category', ['ally', 'potential_ally'])
      .order('composite_score', { ascending: false })
      .limit(100);

    if (error) throw error;
    if (!entities || entities.length === 0) {
      return NextResponse.json({ message: 'No new allies to sync', ...stats });
    }

    for (const entity of entities) {
      try {
        const tags = [GHL_TAGS.CONTAINED_LAUNCH, GHL_TAGS.NEWSLETTER];
        if ((entity.passion_score || 0) > 70) {
          tags.push('High Engagement');
        }

        const nameParts = (entity.name || '').split(' ');
        const contactId = await ghl.upsertContact({
          email: entity.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          tags,
          source: 'JusticeHub Campaign Engine',
          customFields: {
            organization: entity.organization || '',
          },
        });

        if (contactId) {
          await supabase
            .from('campaign_alignment_entities')
            .update({ ghl_contact_id: contactId, outreach_status: 'sent' })
            .eq('id', entity.id);
          stats.synced++;
        } else {
          stats.errors++;
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch {
        stats.errors++;
      }
    }

    return NextResponse.json({
      message: `Synced ${stats.synced} allies to GHL`,
      total_candidates: entities.length,
      ...stats,
    });
  } catch (err) {
    console.error('GHL sync cron error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
