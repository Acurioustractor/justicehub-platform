import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger-lite';

/**
 * GET /api/admin/storytellers
 * Lists all storytellers from Empathy Ledger (source of truth).
 * Channel membership from storyteller_channels join table.
 * Joins profiles for avatar fallback, derives org name from stories.
 */
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all EL storytellers with profile join for avatar fallback
    const { data: storytellers, error } = await empathyLedgerClient
      .from('storytellers')
      .select(
        'id, display_name, profile_id, bio, is_elder, public_avatar_url, profiles(avatar_url, display_name, full_name)'
      )
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;

    // Get channel memberships for all storytellers
    const { data: channelMemberships } = await empathyLedgerClient
      .from('storyteller_channels')
      .select('storyteller_id, syndication_channels(slug)');

    // Build storyteller_id → channel slugs map
    const channelMap = new Map<string, string[]>();
    if (channelMemberships) {
      for (const cm of channelMemberships) {
        const slug = (cm.syndication_channels as unknown as { slug: string } | null)?.slug;
        if (!slug || !cm.storyteller_id) continue;
        const existing = channelMap.get(cm.storyteller_id) || [];
        if (!existing.includes(slug)) existing.push(slug);
        channelMap.set(cm.storyteller_id, existing);
      }
    }

    // Get org names via stories (storyteller → stories → organization)
    const { data: storyOrgs } = await empathyLedgerClient
      .from('stories')
      .select('storyteller_id, organizations(name)')
      .not('storyteller_id', 'is', null)
      .not('organization_id', 'is', null);

    // Build storyteller_id → org_name map (first org found wins)
    const orgMap = new Map<string, string>();
    if (storyOrgs) {
      for (const s of storyOrgs) {
        if (s.storyteller_id && !orgMap.has(s.storyteller_id)) {
          const org = s.organizations as unknown as { name: string } | null;
          if (org?.name) orgMap.set(s.storyteller_id, org.name);
        }
      }
    }

    const result = (storytellers || []).map((s: any) => {
      const profile = s.profiles as { avatar_url: string | null; display_name: string | null; full_name: string | null } | null;
      return {
        id: s.id,
        display_name: s.display_name || profile?.display_name || profile?.full_name || null,
        avatar_url: s.public_avatar_url || profile?.avatar_url || null,
        bio: s.bio,
        is_elder: s.is_elder,
        channels: channelMap.get(s.id) || [],
        org_name: orgMap.get(s.id) || null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing EL storytellers:', error);
    return NextResponse.json(
      { error: 'Failed to list storytellers' },
      { status: 500 }
    );
  }
}
