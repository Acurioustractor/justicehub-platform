import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

interface EmpathyLedgerProfile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  justicehub_enabled: boolean;
  justicehub_role: string | null;
  justicehub_featured: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userData?.user_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all profiles flagged for JusticeHub from Empathy Ledger
    const { data: empathyProfiles, error: fetchError } = await empathyLedgerClient
      .from('profiles')
      .select('id, display_name, bio, avatar_url, justicehub_enabled, justicehub_role, justicehub_featured')
      .eq('justicehub_enabled', true);

    if (fetchError) {
      console.error('Error fetching profiles from Empathy Ledger:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch profiles from Empathy Ledger' }, { status: 500 });
    }

    if (!empathyProfiles || empathyProfiles.length === 0) {
      return NextResponse.json({
        created: 0,
        updated: 0,
        failed: 0,
        total: 0,
        message: 'No profiles flagged for JusticeHub in Empathy Ledger'
      });
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    // Create service-role client for database operations (bypasses RLS)
    const serviceSupabase = await createAdminClient();

    for (const profile of empathyProfiles as EmpathyLedgerProfile[]) {
      try {
        // Check if already exists in JusticeHub
        const { data: existing, error: checkError } = await serviceSupabase
          .from('public_profiles')
          .select('id, slug')
          .eq('empathy_ledger_profile_id', profile.id)
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking profile ${profile.display_name}:`, checkError);
          failed++;
          await serviceSupabase.from('profile_sync_log').insert({
            empathy_ledger_profile_id: profile.id,
            sync_action: 'check',
            sync_status: 'failed',
            sync_details: { profile },
            error_message: checkError.message
          });
          continue;
        }

        const slug = existing?.slug || generateSlug(profile.display_name);

        if (existing) {
          // Update existing profile
          const { error: updateError } = await serviceSupabase
            .from('public_profiles')
            .update({
              full_name: profile.display_name,
              bio: profile.bio,
              photo_url: profile.avatar_url,
              role_tags: profile.justicehub_role ? [profile.justicehub_role] : [],
              is_featured: profile.justicehub_featured,
              synced_from_empathy_ledger: true,
              sync_type: 'full',
              last_synced_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Failed to update: ${profile.display_name}`, updateError);
            failed++;
            await serviceSupabase.from('profile_sync_log').insert({
              public_profile_id: existing.id,
              empathy_ledger_profile_id: profile.id,
              sync_action: 'updated',
              sync_status: 'failed',
              sync_details: { profile },
              error_message: updateError.message
            });
          } else {
            updated++;
            await serviceSupabase.from('profile_sync_log').insert({
              public_profile_id: existing.id,
              empathy_ledger_profile_id: profile.id,
              sync_action: 'updated',
              sync_status: 'success',
              sync_details: {
                profile,
                changes: ['bio', 'photo_url', 'role_tags', 'is_featured']
              }
            });
          }
        } else {
          // Create new profile
          const { data: newProfile, error: insertError } = await serviceSupabase
            .from('public_profiles')
            .insert({
              empathy_ledger_profile_id: profile.id,
              full_name: profile.display_name,
              slug,
              bio: profile.bio,
              photo_url: profile.avatar_url,
              role_tags: profile.justicehub_role ? [profile.justicehub_role] : [],
              is_featured: profile.justicehub_featured,
              is_public: true,
              synced_from_empathy_ledger: true,
              sync_type: 'full',
              last_synced_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Failed to create: ${profile.display_name}`, insertError);
            failed++;
            await serviceSupabase.from('profile_sync_log').insert({
              empathy_ledger_profile_id: profile.id,
              sync_action: 'created',
              sync_status: 'failed',
              sync_details: { profile },
              error_message: insertError.message
            });
          } else {
            created++;
            await serviceSupabase.from('profile_sync_log').insert({
              public_profile_id: newProfile.id,
              empathy_ledger_profile_id: profile.id,
              sync_action: 'created',
              sync_status: 'success',
              sync_details: { profile, slug }
            });
          }
        }

        // Update justicehub_synced_at in Empathy Ledger
        await empathyLedgerClient
          .from('profiles')
          .update({ justicehub_synced_at: new Date().toISOString() })
          .eq('id', profile.id);

      } catch (error) {
        console.error(`Unexpected error with ${profile.display_name}:`, error);
        failed++;
        await serviceSupabase.from('profile_sync_log').insert({
          empathy_ledger_profile_id: profile.id,
          sync_action: 'sync',
          sync_status: 'failed',
          sync_details: { profile },
          error_message: String(error)
        });
      }
    }

    return NextResponse.json({
      created,
      updated,
      failed,
      total: empathyProfiles.length,
      message: `Sync completed! Created: ${created}, Updated: ${updated}, Failed: ${failed}`
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
