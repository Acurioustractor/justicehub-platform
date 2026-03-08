import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin';
import {
  empathyLedgerClient,
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger';

/**
 * PATCH /api/admin/storytellers/[id]/tags
 * Updates channel membership for an Empathy Ledger storyteller.
 * Receives { channels: string[] } (array of channel slugs).
 * Writes to storyteller_channels join table via service role client.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return NextResponse.json(
        { error: 'Empathy Ledger write access not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const { channels } = await request.json();

    if (!Array.isArray(channels)) {
      return NextResponse.json(
        { error: 'channels must be an array of channel slugs' },
        { status: 400 }
      );
    }

    // Get all available channels
    const { data: allChannels } = await empathyLedgerClient
      .from('syndication_channels')
      .select('id, slug')
      .eq('active', true);

    if (!allChannels) {
      return NextResponse.json({ error: 'No channels found' }, { status: 500 });
    }

    const slugToId = new Map(allChannels.map((c) => [c.slug, c.id]));

    // Validate requested slugs
    for (const slug of channels) {
      if (!slugToId.has(slug)) {
        return NextResponse.json(
          { error: `Unknown channel: ${slug}` },
          { status: 400 }
        );
      }
    }

    // Get current memberships for this storyteller
    const { data: currentMemberships } = await empathyLedgerClient
      .from('storyteller_channels')
      .select('id, channel_id, syndication_channels(slug)')
      .eq('storyteller_id', id);

    const currentSlugs = new Set(
      (currentMemberships || []).map(
        (m) =>
          (m.syndication_channels as unknown as { slug: string } | null)?.slug
      )
    );

    const desiredSlugs = new Set(channels);

    // Add missing memberships
    for (const slug of desiredSlugs) {
      if (!currentSlugs.has(slug)) {
        const channelId = slugToId.get(slug);
        if (!channelId) continue;
        const { error } = await empathyLedgerServiceClient
          .from('storyteller_channels')
          .insert({ storyteller_id: id, channel_id: channelId });
        if (error) console.error(`Error adding ${slug}:`, error.message);
      }
    }

    // Remove extra memberships
    for (const m of currentMemberships || []) {
      const slug = (
        m.syndication_channels as unknown as { slug: string } | null
      )?.slug;
      if (slug && !desiredSlugs.has(slug)) {
        const { error } = await empathyLedgerServiceClient
          .from('storyteller_channels')
          .delete()
          .eq('id', m.id);
        if (error) console.error(`Error removing ${slug}:`, error.message);
      }
    }

    return NextResponse.json({ success: true, channels });
  } catch (error) {
    console.error('Error updating storyteller channels:', error);
    return NextResponse.json(
      { error: 'Failed to update channels' },
      { status: 500 }
    );
  }
}
