import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';

/**
 * POST /api/empathy-ledger/profiles/push
 *
 * Push a JusticeHub profile edit back to Empathy Ledger.
 * Called when a user edits their profile on JH.
 *
 * Body: { profileId, elProfileId, updates: { display_name, bio, public_avatar_url, location } }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated and owns this profile (or is admin)
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, elProfileId, updates } = body;

    if (!profileId || !elProfileId || !updates) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Verify the user owns this profile or is admin
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from('public_profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = profile.user_id === user.id;
    const isAdmin = adminCheck?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to edit this profile' }, { status: 403 });
    }

    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return NextResponse.json({ error: 'EL not configured', synced: false });
    }

    // Find storyteller by profile_id in EL
    const { data: storyteller } = await empathyLedgerServiceClient
      .from('storytellers')
      .select('id')
      .eq('profile_id', elProfileId)
      .single();

    if (!storyteller) {
      // Try matching by storyteller ID directly
      const { data: stDirect } = await empathyLedgerServiceClient
        .from('storytellers')
        .select('id')
        .eq('id', elProfileId)
        .single();

      if (!stDirect) {
        return NextResponse.json({ error: 'EL storyteller not found', synced: false });
      }

      // Update storyteller directly
      await empathyLedgerServiceClient
        .from('storytellers')
        .update({
          display_name: updates.display_name,
          bio: updates.bio,
          public_avatar_url: updates.public_avatar_url,
          location: updates.location,
        })
        .eq('id', stDirect.id);
    } else {
      // Update via storyteller linked to profile
      await empathyLedgerServiceClient
        .from('storytellers')
        .update({
          display_name: updates.display_name,
          bio: updates.bio,
          public_avatar_url: updates.public_avatar_url,
          location: updates.location,
        })
        .eq('id', storyteller.id);
    }

    // Mark JH profile as synced
    await supabase
      .from('public_profiles')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', profileId);

    return NextResponse.json({ synced: true });
  } catch (err: any) {
    console.error('EL profile push error:', err);
    return NextResponse.json({ error: err.message, synced: false }, { status: 500 });
  }
}
