import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// IDs from the duplicate search
const KEEP_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';  // Has 3 team members
const DELETE_IDS = [
  '00e4002a-0c8a-4388-b36a-8b4fa2c51582',  // No team members
  '11111111-1111-1111-1111-111111111001'   // Has slug but no team members
];
const SLUG_TO_TRANSFER = 'oonchiumpa';

async function cleanup() {
  console.log('🧹 Cleaning up duplicate Oonchiumpa organizations\n');

  // Step 1: Update the kept organization with the slug
  console.log('1️⃣  Transferring slug "' + SLUG_TO_TRANSFER + '" to kept organization...');
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ slug: SLUG_TO_TRANSFER })
    .eq('id', KEEP_ID);

  if (updateError) {
    console.error('   ❌ Failed to update slug:', updateError.message);
    return;
  }
  console.log('   ✅ Slug transferred');

  // Step 2: Delete the duplicates
  console.log('\n2️⃣  Deleting duplicate organizations...');
  for (const id of DELETE_IDS) {
    // First check for related data
    const { data: photos } = await supabase
      .from('partner_photos')
      .select('id')
      .eq('organization_id', id);

    if (photos && photos.length > 0) {
      console.log('   Deleting ' + photos.length + ' photos for ' + id.substring(0, 8) + '...');
      await supabase.from('partner_photos').delete().eq('organization_id', id);
    }

    const { data: videos } = await supabase
      .from('partner_videos')
      .select('id')
      .eq('organization_id', id);

    if (videos && videos.length > 0) {
      console.log('   Deleting ' + videos.length + ' videos for ' + id.substring(0, 8) + '...');
      await supabase.from('partner_videos').delete().eq('organization_id', id);
    }

    const { data: metrics } = await supabase
      .from('partner_impact_metrics')
      .select('id')
      .eq('organization_id', id);

    if (metrics && metrics.length > 0) {
      console.log('   Deleting ' + metrics.length + ' metrics for ' + id.substring(0, 8) + '...');
      await supabase.from('partner_impact_metrics').delete().eq('organization_id', id);
    }

    // Delete the organization
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('   ❌ Failed to delete ' + id.substring(0, 8) + ':', deleteError.message);
    } else {
      console.log('   ✅ Deleted organization ' + id.substring(0, 8) + '...');
    }
  }

  console.log('\n✅ Cleanup complete!');

  // Verify
  const { data: remaining } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .ilike('name', '%oonchiumpa%');

  console.log('\n📋 Remaining Oonchiumpa organizations:');
  remaining.forEach(org => {
    console.log('   - ' + org.name + ' (slug: ' + org.slug + ')');
  });
}

cleanup().catch(console.error);
