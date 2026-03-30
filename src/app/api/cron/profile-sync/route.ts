import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const JH_ORG_ID = '0e878fa2-0b44-49b7-86d7-ecf169345582';
const BASECAMPS_PROJECT_ID = '591373ed-9a6b-45e3-868b-8dfb13787d48';

/**
 * GET /api/cron/profile-sync
 *
 * Bidirectional sync between EL storytellers and JH public_profiles.
 *
 * EL→JH: Mirror storytellers to public_profiles (EL is source of truth)
 * JH→EL: Push back any profiles edited in JH since last sync
 *
 * Query params:
 *   - direction: 'pull' (EL→JH), 'push' (JH→EL), 'both' (default)
 *   - dry: 'true' for dry run
 */
export async function GET(request: NextRequest) {
  // Auth: Vercel cron header or Bearer token
  const isVercelCron = request.headers.get('x-vercel-cron');
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const isAuthed = isVercelCron || token === process.env.CRON_SECRET || token === process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
    return NextResponse.json({ error: 'EL not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get('direction') || 'both';
  const isDry = searchParams.get('dry') === 'true';

  const supabase = createServiceClient();
  const el = empathyLedgerServiceClient;

  const results: {
    pulled: { created: number; updated: number; skipped: number };
    pushed: { updated: number; created: number; skipped: number };
    errors: string[];
  } = {
    pulled: { created: 0, updated: 0, skipped: 0 },
    pushed: { updated: 0, created: 0, skipped: 0 },
    errors: [],
  };

  // ── PULL: EL → JH ────────────────────────────────────────

  if (direction === 'pull' || direction === 'both') {
    try {
      // Fetch all active storytellers from EL
      const { data: storytellers, error: stErr } = await el
        .from('storytellers')
        .select('id, display_name, bio, public_avatar_url, location, is_active, is_featured, profile_id, cultural_background')
        .eq('is_active', true);

      if (stErr) throw new Error(`EL storytellers query: ${stErr.message}`);

      // Get existing JH profiles with EL links
      const { data: existingProfiles } = await supabase
        .from('public_profiles')
        .select('id, empathy_ledger_profile_id, full_name, updated_at, last_synced_at');

      const elLinkedMap = new Map(
        (existingProfiles || [])
          .filter((p: any) => p.empathy_ledger_profile_id)
          .map((p: any) => [p.empathy_ledger_profile_id, p])
      );

      for (const st of storytellers || []) {
        const existingProfile = elLinkedMap.get(st.profile_id) || elLinkedMap.get(st.id);

        if (existingProfile) {
          // Update if EL data is different
          const needsUpdate =
            existingProfile.full_name !== st.display_name;

          if (needsUpdate && !isDry) {
            await supabase
              .from('public_profiles')
              .update({
                full_name: st.display_name,
                bio: st.bio || undefined,
                photo_url: st.public_avatar_url || undefined,
                location: st.location || undefined,
                is_featured: st.is_featured || undefined,
                last_synced_at: new Date().toISOString(),
              })
              .eq('id', existingProfile.id);
            results.pulled.updated++;
          } else if (needsUpdate) {
            results.pulled.updated++;
          } else {
            results.pulled.skipped++;
          }
        } else {
          // Create new JH profile from EL storyteller
          const slug = st.display_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          if (!isDry) {
            const { error: insertErr } = await (supabase as any)
              .from('public_profiles')
              .insert({
                full_name: st.display_name,
                slug: `${slug}-${st.id.substring(0, 6)}`,
                bio: st.bio,
                photo_url: st.public_avatar_url,
                location: st.location,
                is_public: true,
                is_featured: st.is_featured || false,
                empathy_ledger_profile_id: st.profile_id || st.id,
                synced_from_empathy_ledger: true,
                last_synced_at: new Date().toISOString(),
                role_tags: ['community-storyteller'],
              });

            if (insertErr) {
              results.errors.push(`Create ${st.display_name}: ${insertErr.message}`);
            } else {
              results.pulled.created++;
            }
          } else {
            results.pulled.created++;
          }
        }
      }
    } catch (err: any) {
      results.errors.push(`Pull error: ${err.message}`);
    }
  }

  // ── PUSH: JH → EL ────────────────────────────────────────

  if (direction === 'push' || direction === 'both') {
    try {
      // Find JH profiles edited since last sync
      const { data: editedProfiles } = await supabase
        .from('public_profiles')
        .select('id, full_name, bio, photo_url, location, empathy_ledger_profile_id, updated_at, last_synced_at')
        .not('empathy_ledger_profile_id', 'is', null);

      for (const profile of editedProfiles || []) {
        // Skip if not edited since last sync
        if (profile.last_synced_at && profile.updated_at &&
            new Date(profile.updated_at) <= new Date(profile.last_synced_at)) {
          results.pushed.skipped++;
          continue;
        }

        if (!isDry) {
          // Find the storyteller in EL by profile_id
          const { data: stData } = await el
            .from('storytellers')
            .select('id')
            .eq('profile_id', profile.empathy_ledger_profile_id)
            .single();

          if (stData) {
            // Update EL storyteller
            await el
              .from('storytellers')
              .update({
                display_name: profile.full_name,
                bio: profile.bio,
                public_avatar_url: profile.photo_url,
                location: profile.location,
              })
              .eq('id', stData.id);

            // Mark as synced in JH
            await supabase
              .from('public_profiles')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('id', profile.id);

            results.pushed.updated++;
          } else {
            results.pushed.skipped++;
          }
        } else {
          results.pushed.updated++;
        }
      }
    } catch (err: any) {
      results.errors.push(`Push error: ${err.message}`);
    }
  }

  return NextResponse.json({
    success: results.errors.length === 0,
    direction,
    isDry,
    results,
    timestamp: new Date().toISOString(),
  });
}
