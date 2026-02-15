/**
 * Add Profile Photo
 *
 * Updates a profile's photo_url field
 *
 * Usage:
 *   npm run tsx src/scripts/add-profile-photo.ts <slug> <photo-url>
 *
 * Example:
 *   npm run tsx src/scripts/add-profile-photo.ts tanya-smith "https://..."
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addProfilePhoto(slug: string, photoUrl: string, credit?: string) {
  console.log('\n📸 Adding Profile Photo\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Check if profile exists
  const { data: profile, error: fetchError } = await supabase
    .from('public_profiles')
    .select('id, full_name, slug, photo_url')
    .eq('slug', slug)
    .single();

  if (fetchError || !profile) {
    console.log(`❌ Profile not found: ${slug}\n`);
    console.log('Available profiles:');

    const { data: allProfiles } = await supabase
      .from('public_profiles')
      .select('slug, full_name')
      .order('full_name');

    allProfiles?.forEach((p) => {
      console.log(`   - ${p.slug} (${p.full_name})`);
    });

    return;
  }

  console.log(`Found profile: ${profile.full_name}`);
  console.log(`   Current photo: ${profile.photo_url || 'None'}\n`);

  // Update photo
  const updateData: any = { photo_url: photoUrl };
  if (credit) {
    updateData.photo_credit = credit;
  }

  const { data, error } = await supabase
    .from('public_profiles')
    .update(updateData)
    .eq('slug', slug)
    .select();

  if (error) {
    console.log('❌ Error updating profile:', error.message);
    return;
  }

  console.log('✅ Photo updated successfully!\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Profile Details:');
  console.log(`   Name: ${profile.full_name}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Photo URL: ${photoUrl}`);
  if (credit) {
    console.log(`   Photo Credit: ${credit}`);
  }
  console.log('');
  console.log(`View profile at: /people/${slug}\n`);
}

// Parse command line arguments
const slug = process.argv[2];
const photoUrl = process.argv[3];
const credit = process.argv[4];

if (!slug || !photoUrl) {
  console.log('\n❌ Missing required arguments\n');
  console.log('Usage:');
  console.log('  npm run tsx src/scripts/add-profile-photo.ts <slug> <photo-url> [credit]\n');
  console.log('Example:');
  console.log('  npm run tsx src/scripts/add-profile-photo.ts tanya-smith "https://..." "Photo by John Doe"\n');
  process.exit(1);
}

addProfilePhoto(slug, photoUrl, credit)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
