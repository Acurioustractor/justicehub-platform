import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { createClient } from '@supabase/supabase-js';
import { generateProfileLinkSuggestions, saveSuggestions, autoApplyHighConfidenceSuggestions } from '@/lib/auto-linking/engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

interface EmpathyLedgerProfile {
  id: string;
  display_name: string;
  bio: string | null;
  profile_image_url: string | null;
  current_organization: string | null;
  location: string | null;
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

async function logSync(
  profileId: string | null,
  empathyProfileId: string,
  action: string,
  status: string,
  details: any,
  errorMessage?: string
) {
  await supabase.from('profile_sync_log').insert({
    public_profile_id: profileId,
    empathy_ledger_profile_id: empathyProfileId,
    sync_action: action,
    sync_status: status,
    sync_details: details,
    error_message: errorMessage
  });
}

async function syncProfilesFromEmpathyLedger() {
  console.log('🔄 Syncing profiles from Empathy Ledger to JusticeHub...\n');

  try {
    // Get all profiles flagged for JusticeHub
    const { data: empathyProfiles, error: fetchError } = await empathyLedgerClient
      .from('profiles')
      .select('id, display_name, bio, profile_image_url, current_organization, location, justicehub_enabled, justicehub_role, justicehub_featured')
      .eq('justicehub_enabled', true);

    if (fetchError) {
      console.error('❌ Error fetching profiles from Empathy Ledger:', fetchError);
      return;
    }

    console.log(`Found ${empathyProfiles?.length || 0} profiles flagged for JusticeHub\n`);

    if (!empathyProfiles || empathyProfiles.length === 0) {
      console.log('ℹ️  No profiles are currently flagged for JusticeHub display.');
      console.log('💡 To flag a profile in Empathy Ledger, run:');
      console.log('   UPDATE profiles SET justicehub_enabled = true, justicehub_role = \'founder\' WHERE id = \'profile-id\';\n');
      return;
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const profile of empathyProfiles as EmpathyLedgerProfile[]) {
      try {
        // Check if already exists in JusticeHub
        const { data: existing, error: checkError } = await supabase
          .from('public_profiles')
          .select('id, slug')
          .eq('empathy_ledger_profile_id', profile.id)
          .maybeSingle();

        if (checkError) {
          console.error(`❌ Error checking profile ${profile.display_name}:`, checkError);
          failed++;
          await logSync(null, profile.id, 'check', 'failed', { profile }, checkError.message);
          continue;
        }

        const slug = existing?.slug || generateSlug(profile.display_name);

        if (existing) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('public_profiles')
            .update({
              full_name: profile.display_name,
              bio: profile.bio,
              photo_url: profile.profile_image_url,
              current_organization: profile.current_organization,
              location: profile.location,
              role_tags: profile.justicehub_role ? [profile.justicehub_role] : [],
              is_featured: profile.justicehub_featured,
              synced_from_empathy_ledger: true,
              sync_type: 'full',
              last_synced_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`❌ Failed to update: ${profile.display_name}`, updateError);
            failed++;
            await logSync(existing.id, profile.id, 'updated', 'failed', { profile }, updateError.message);
          } else {
            console.log(`✅ Updated: ${profile.display_name} (${profile.justicehub_role || 'no role'})`);
            updated++;
            await logSync(existing.id, profile.id, 'updated', 'success', {
              profile,
              changes: ['bio', 'photo_url', 'role_tags', 'is_featured']
            });

            // Auto-link to organizations
            try {
              const suggestions = await generateProfileLinkSuggestions(existing.id);
              if (suggestions.length > 0) {
                await saveSuggestions(suggestions);
                const applied = await autoApplyHighConfidenceSuggestions(suggestions);
                if (applied > 0) {
                  console.log(`   🔗 Auto-linked to ${applied} organization(s)`);
                }
              }
            } catch (linkError) {
              console.error(`   ⚠️  Auto-linking failed:`, linkError);
            }
          }
        } else {
          // Create new profile
          const { data: newProfile, error: insertError } = await supabase
            .from('public_profiles')
            .insert({
              empathy_ledger_profile_id: profile.id,
              full_name: profile.display_name,
              slug,
              bio: profile.bio,
              photo_url: profile.profile_image_url,
              current_organization: profile.current_organization,
              location: profile.location,
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
            console.error(`❌ Failed to create: ${profile.display_name}`, insertError);
            failed++;
            await logSync(null, profile.id, 'created', 'failed', { profile }, insertError.message);
          } else {
            console.log(`✨ Created: ${profile.display_name} (${profile.justicehub_role || 'no role'})`);
            created++;
            await logSync(newProfile.id, profile.id, 'created', 'success', { profile, slug });

            // Auto-link to organizations
            try {
              const suggestions = await generateProfileLinkSuggestions(newProfile.id);
              if (suggestions.length > 0) {
                await saveSuggestions(suggestions);
                const applied = await autoApplyHighConfidenceSuggestions(suggestions);
                if (applied > 0) {
                  console.log(`   🔗 Auto-linked to ${applied} organization(s)`);
                }
              }
            } catch (linkError) {
              console.error(`   ⚠️  Auto-linking failed:`, linkError);
            }
          }
        }

        // Update justicehub_synced_at in Empathy Ledger
        await empathyLedgerClient
          .from('profiles')
          .update({ justicehub_synced_at: new Date().toISOString() })
          .eq('id', profile.id);

      } catch (error) {
        console.error(`❌ Unexpected error with ${profile.display_name}:`, error);
        failed++;
        await logSync(null, profile.id, 'sync', 'failed', { profile }, String(error));
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`   ✨ Created: ${created}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Total: ${empathyProfiles.length}\n`);

    if (created + updated > 0) {
      console.log('🎉 Sync completed successfully!');
      console.log(`👉 View profiles at: http://localhost:4000/people\n`);
    }

  } catch (error) {
    console.error('💥 Sync failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncProfilesFromEmpathyLedger()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { syncProfilesFromEmpathyLedger };
