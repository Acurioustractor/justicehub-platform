/**
 * Program Management Script
 *
 * This script helps you:
 * 1. View all programs and their linked profiles
 * 2. Add new programs
 * 3. Link/unlink profiles to programs
 * 4. Fix incorrect linkages
 */

import { supabase } from '@/lib/supabase';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

interface ProfileAppearance {
  id: string;
  empathy_ledger_profile_id: string;
  appears_on_type: string;
  appears_on_id: string;
  role: string;
  story_excerpt?: string;
  featured: boolean;
}

async function listAllPrograms() {
  console.log('\n📋 ALL COMMUNITY PROGRAMS:\n');

  const { data: programs, error } = await supabase
    .from('community_programs')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const program of programs || []) {
    console.log(`\n${program.is_featured ? '⭐' : '  '} ${program.name}`);
    console.log(`   ID: ${program.id}`);
    console.log(`   Org: ${program.organization}`);
    console.log(`   Location: ${program.location}, ${program.state}`);
    console.log(`   Approach: ${program.approach}`);

    // Get linked profiles
    const { data: appearances } = await supabase
      .from('profile_appearances')
      .select('*')
      .eq('appears_on_type', 'program')
      .eq('appears_on_id', program.id);

    if (appearances && appearances.length > 0) {
      console.log(`   \n   👤 Linked Profiles (${appearances.length}):`);

      for (const appearance of appearances) {
        // Get profile details from Empathy Ledger
        const { data: profile } = await empathyLedgerClient
          .from('profiles')
          .select('display_name, preferred_name')
          .eq('id', appearance.empathy_ledger_profile_id)
          .single();

        const name = profile?.preferred_name || profile?.display_name || 'Unknown';
        console.log(`      - ${name} (${appearance.role})`);
        console.log(`        Profile ID: ${appearance.empathy_ledger_profile_id}`);
        console.log(`        Appearance ID: ${appearance.id}`);
        if (appearance.featured) console.log(`        ⭐ FEATURED`);
      }
    } else {
      console.log(`   👤 No linked profiles yet`);
    }
  }
}

async function listAllProfileAppearances() {
  console.log('\n\n🔗 ALL PROFILE APPEARANCES:\n');

  const { data: appearances, error } = await supabase
    .from('profile_appearances')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!appearances || appearances.length === 0) {
    console.log('No profile appearances found.');
    return;
  }

  for (const appearance of appearances) {
    // Get profile name from Empathy Ledger
    const { data: profile } = await empathyLedgerClient
      .from('profiles')
      .select('display_name, preferred_name')
      .eq('id', appearance.empathy_ledger_profile_id)
      .single();

    const name = profile?.preferred_name || profile?.display_name || 'Unknown';

    // Get linked item name
    let linkedItemName = 'Unknown';
    if (appearance.appears_on_type === 'program') {
      const { data: program } = await supabase
        .from('community_programs')
        .select('name')
        .eq('id', appearance.appears_on_id)
        .single();
      linkedItemName = program?.name || 'Unknown Program';
    } else if (appearance.appears_on_type === 'service') {
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', appearance.appears_on_id)
        .single();
      linkedItemName = service?.name || 'Unknown Service';
    } else if (appearance.appears_on_type === 'article') {
      const { data: article } = await supabase
        .from('articles')
        .select('title')
        .eq('id', appearance.appears_on_id)
        .single();
      linkedItemName = article?.title || 'Unknown Article';
    }

    console.log(`\n${appearance.featured ? '⭐' : '  '} ${name} → ${linkedItemName}`);
    console.log(`   Appearance ID: ${appearance.id}`);
    console.log(`   Profile ID: ${appearance.empathy_ledger_profile_id}`);
    console.log(`   Linked to: ${appearance.appears_on_type} (${appearance.appears_on_id})`);
    console.log(`   Role: ${appearance.role}`);
    if (appearance.story_excerpt) {
      console.log(`   Excerpt: ${appearance.story_excerpt.substring(0, 80)}...`);
    }
  }
}

async function searchProfiles(searchTerm: string) {
  console.log(`\n🔍 Searching Empathy Ledger for: "${searchTerm}"\n`);

  const { data: profiles, error } = await empathyLedgerClient
    .from('profiles')
    .select('id, display_name, preferred_name, bio')
    .or(`display_name.ilike.%${searchTerm}%,preferred_name.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found.');
    return;
  }

  console.log(`Found ${profiles.length} profiles:\n`);
  for (const profile of profiles) {
    const name = profile.preferred_name || profile.display_name;
    console.log(`  ${name}`);
    console.log(`  ID: ${profile.id}`);
    if (profile.bio) {
      console.log(`  Bio: ${profile.bio.substring(0, 100)}...`);
    }
    console.log('');
  }
}

async function deleteProfileAppearance(appearanceId: string) {
  console.log(`\n🗑️  Deleting profile appearance: ${appearanceId}\n`);

  const { error } = await supabase
    .from('profile_appearances')
    .delete()
    .eq('id', appearanceId);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Profile appearance deleted successfully');
  }
}

async function linkProfileToProgram(
  profileId: string,
  programId: string,
  role: string,
  excerpt?: string,
  featured: boolean = false
) {
  console.log(`\n🔗 Linking profile to program...\n`);

  const { data, error } = await supabase
    .from('profile_appearances')
    .insert({
      empathy_ledger_profile_id: profileId,
      appears_on_type: 'program',
      appears_on_id: programId,
      role,
      story_excerpt: excerpt,
      featured
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Profile linked successfully!');
    console.log(`   Appearance ID: ${data.id}`);
  }
}

// Main execution
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];
const arg3 = process.argv[5];
const arg4 = process.argv[6];

async function main() {
  console.log('\n🏢 JusticeHub Program Management Tool\n');
  console.log('═══════════════════════════════════════\n');

  switch (command) {
    case 'list':
      await listAllPrograms();
      break;

    case 'appearances':
      await listAllProfileAppearances();
      break;

    case 'search':
      if (!arg1) {
        console.log('Usage: npm run manage-programs search "Name"');
        break;
      }
      await searchProfiles(arg1);
      break;

    case 'delete':
      if (!arg1) {
        console.log('Usage: npm run manage-programs delete <appearance-id>');
        break;
      }
      await deleteProfileAppearance(arg1);
      break;

    case 'link':
      if (!arg1 || !arg2 || !arg3) {
        console.log('Usage: npm run manage-programs link <profile-id> <program-id> <role> [excerpt] [featured]');
        console.log('Example: npm run manage-programs link abc-123 def-456 "Program Participant" "Changed my life" true');
        break;
      }
      await linkProfileToProgram(arg1, arg2, arg3, arg4, arg5 === 'true');
      break;

    default:
      console.log('Available commands:');
      console.log('');
      console.log('  list          - List all programs and their linked profiles');
      console.log('  appearances   - List all profile appearances');
      console.log('  search <name> - Search for profiles in Empathy Ledger');
      console.log('  delete <id>   - Delete a profile appearance');
      console.log('  link          - Link a profile to a program');
      console.log('');
      console.log('Examples:');
      console.log('  npm run manage-programs list');
      console.log('  npm run manage-programs search "Kirsty"');
      console.log('  npm run manage-programs appearances');
      console.log('  npm run manage-programs delete <appearance-id>');
      break;
  }
}

main().catch(console.error);
