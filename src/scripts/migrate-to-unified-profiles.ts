/**
 * Migrate to Unified Profiles System
 *
 * This script:
 * 1. Creates public_profiles for Benjamin Knight & Nicholas Marchesi
 * 2. Links Benjamin to existing author record
 * 3. Links both to CONTAINED art project
 * 4. Demonstrates the unified profile system
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateToUnifiedProfiles() {
  console.log('\n🔄 Migrating to Unified Profiles System\n');
  console.log('═══════════════════════════════════════════════════\n');

  // ============================================================
  // STEP 1: Create Benjamin Knight's Public Profile
  // ============================================================
  console.log('Step 1: Creating Benjamin Knight public profile...\n');

  const benjaminData = {
    full_name: 'Benjamin Knight',
    slug: 'benjamin-knight',
    bio: 'Following paper trails that lead to kids in cages, transforming data into moral urgency. The one who stood in Madrid\'s sunset-colored rooms and felt the weight of Australia\'s failure in his bones.',
    tagline: 'Co-founder, A Curious Tractor',
    role_tags: ['advocate', 'researcher', 'co-founder', 'writer'],
    photo_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/benjamin-knight.jpg',
    website_url: 'https://justicehub.au',
    is_featured: true,
    is_public: true
  };

  const { data: benjaminProfile, error: benjaminError } = await supabase
    .from('public_profiles')
    .upsert(benjaminData, { onConflict: 'slug' })
    .select()
    .single();

  if (benjaminError) {
    console.log('❌ Error creating Benjamin\'s profile:', benjaminError.message);
    return;
  }

  console.log('✅ Benjamin Knight profile created');
  console.log(`   ID: ${benjaminProfile.id}`);
  console.log(`   Slug: ${benjaminProfile.slug}\n`);

  // ============================================================
  // STEP 2: Link Benjamin to Existing Author Record
  // ============================================================
  console.log('Step 2: Linking Benjamin to author record...\n');

  const { data: authorUpdate, error: authorError } = await supabase
    .from('authors')
    .update({ public_profile_id: benjaminProfile.id })
    .eq('slug', 'benjamin-knight')
    .select();

  if (authorError) {
    console.log('⚠️  Could not link to author record:', authorError.message);
    console.log('   (This is OK if author doesn\'t exist yet)\n');
  } else if (authorUpdate && authorUpdate.length > 0) {
    console.log('✅ Linked to author record');
    console.log(`   Author ID: ${authorUpdate[0].id}\n`);
  } else {
    console.log('ℹ️  No existing author record found (will create later)\n');
  }

  // ============================================================
  // STEP 3: Create Nicholas Marchesi's Public Profile
  // ============================================================
  console.log('Step 3: Creating Nicholas Marchesi public profile...\n');

  const nicholasData = {
    full_name: 'Nicholas Marchesi',
    slug: 'nicholas-marchesi',
    bio: 'Strategic architect who transformed shipping containers into transformation chambers - personally constructing the majority of the rooms, wiring the electronics that make fluorescent despair tangible, embedding technology that bridges experience to action.',
    tagline: 'Co-founder, A Curious Tractor',
    role_tags: ['artist', 'builder', 'co-founder', 'strategist'],
    photo_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/nicholas-marchesi.jpg',
    is_featured: true,
    is_public: true
  };

  const { data: nicholasProfile, error: nicholasError } = await supabase
    .from('public_profiles')
    .upsert(nicholasData, { onConflict: 'slug' })
    .select()
    .single();

  if (nicholasError) {
    console.log('❌ Error creating Nicholas\'s profile:', nicholasError.message);
    return;
  }

  console.log('✅ Nicholas Marchesi profile created');
  console.log(`   ID: ${nicholasProfile.id}`);
  console.log(`   Slug: ${nicholasProfile.slug}\n`);

  // ============================================================
  // STEP 4: Get CONTAINED Art Project
  // ============================================================
  console.log('Step 4: Finding CONTAINED art project...\n');

  const { data: contained, error: containedError } = await supabase
    .from('art_innovation')
    .select('id, title, slug')
    .eq('slug', 'contained')
    .single();

  if (containedError || !contained) {
    console.log('❌ Could not find CONTAINED project:', containedError?.message);
    console.log('   Make sure to run setup-art-innovation.ts first!\n');
    return;
  }

  console.log('✅ Found CONTAINED project');
  console.log(`   ID: ${contained.id}`);
  console.log(`   Title: ${contained.title}\n`);

  // ============================================================
  // STEP 5: Link Benjamin to CONTAINED
  // ============================================================
  console.log('Step 5: Linking Benjamin to CONTAINED...\n');

  const { data: benjaminLink, error: benjaminLinkError } = await supabase
    .from('art_innovation_profiles')
    .upsert({
      art_innovation_id: contained.id,
      public_profile_id: benjaminProfile.id,
      role: 'co-founder',
      role_description: 'The Insomniac Calculator - Following paper trails that lead to kids in cages',
      display_order: 1,
      is_featured: true
    }, { onConflict: 'art_innovation_id,public_profile_id' })
    .select();

  if (benjaminLinkError) {
    console.log('❌ Error linking Benjamin to CONTAINED:', benjaminLinkError.message);
  } else {
    console.log('✅ Benjamin linked to CONTAINED as co-founder\n');
  }

  // ============================================================
  // STEP 6: Link Nicholas to CONTAINED
  // ============================================================
  console.log('Step 6: Linking Nicholas to CONTAINED...\n');

  const { data: nicholasLink, error: nicholasLinkError } = await supabase
    .from('art_innovation_profiles')
    .upsert({
      art_innovation_id: contained.id,
      public_profile_id: nicholasProfile.id,
      role: 'co-founder',
      role_description: 'The Hands That Built Revolution - Strategic architect who physically constructed transformation',
      display_order: 2,
      is_featured: true
    }, { onConflict: 'art_innovation_id,public_profile_id' })
    .select();

  if (nicholasLinkError) {
    console.log('❌ Error linking Nicholas to CONTAINED:', nicholasLinkError.message);
  } else {
    console.log('✅ Nicholas linked to CONTAINED as co-founder\n');
  }

  // ============================================================
  // STEP 7: Verify the Connections
  // ============================================================
  console.log('Step 7: Verifying connections...\n');

  const { data: containedWithProfiles, error: verifyError } = await supabase
    .from('art_innovation')
    .select(`
      id,
      title,
      slug,
      art_innovation_profiles (
        role,
        role_description,
        display_order,
        public_profiles (
          full_name,
          slug,
          tagline,
          photo_url
        )
      )
    `)
    .eq('slug', 'contained')
    .single();

  if (verifyError) {
    console.log('❌ Error verifying connections:', verifyError.message);
    return;
  }

  console.log('✅ Verification Complete!\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('CONTAINED Project with Linked Profiles:\n');
  console.log(`Title: ${containedWithProfiles.title}`);
  console.log(`Slug: ${containedWithProfiles.slug}\n`);
  console.log('Creators:');

  containedWithProfiles.art_innovation_profiles
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .forEach((link: any) => {
      console.log(`  ${link.display_order}. ${link.public_profiles.full_name}`);
      console.log(`     Role: ${link.role}`);
      console.log(`     Description: ${link.role_description}`);
      console.log(`     Photo: ${link.public_profiles.photo_url ? '✅' : '❌'}`);
      console.log(`     Profile URL: /people/${link.public_profiles.slug}\n`);
    });

  console.log('═══════════════════════════════════════════════════\n');
  console.log('🎉 Migration Complete!\n');
  console.log('Next Steps:');
  console.log('  1. Visit /art-innovation/contained to see linked profiles');
  console.log('  2. Create profile pages at /people/[slug]');
  console.log('  3. Add "Related Content" sections\n');

  // ============================================================
  // STEP 8: Summary Statistics
  // ============================================================
  const { count: profileCount } = await supabase
    .from('public_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: linkCount } = await supabase
    .from('art_innovation_profiles')
    .select('*', { count: 'exact', head: true });

  console.log('Database Statistics:');
  console.log(`  Public Profiles: ${profileCount}`);
  console.log(`  Art Project Links: ${linkCount}\n`);
}

migrateToUnifiedProfiles()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
