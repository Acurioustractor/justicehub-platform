/**
 * Link Empathy Ledger stories to Community Programs
 */

import { createClient } from '@supabase/supabase-js';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

const justiceHubClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.YJSF_SUPABASE_SERVICE_KEY || ''
);

interface ProgramLink {
  storyId: string;
  storyTitle: string;
  programId: string;
  programName: string;
  role: string;
  featured?: boolean;
}

// Curated mappings of stories to community programs
const PROGRAM_LINKS: ProgramLink[] = [
  // Youth transformation stories → Youth Works & Mentorship programs
  {
    storyId: 'b342a136-6c99-4ee4-ba2e-3eac00b585b9', // MS: From Disconnected Youth to Future Tourism Entrepreneur
    storyTitle: 'MS: From Disconnected Youth to Future Tourism Entrepreneur',
    programId: '14602373-546b-4466-8867-8b44f16c649c', // BackTrack Youth Works
    programName: 'BackTrack Youth Works',
    role: 'youth transformation',
    featured: true
  },
  {
    storyId: '48e2ad56-c8d5-447e-83dd-83a606920b8e', // M: From Homelessness to Independent Living
    storyTitle: 'M: From Homelessness to Independent Living',
    programId: '332a545f-c30e-4822-9128-122810a46503', // Creative Futures Collective
    programName: 'Creative Futures Collective',
    role: 'independent living success',
    featured: true
  },

  // Indigenous-led healing stories
  {
    storyId: 'de3f0fae-c4d4-4f19-8197-97a1ab8e56b1', // Uncle Dale's Vision
    storyTitle: "Building a Healing Path: Uncle Dale's Vision for Youth Justice Reform",
    programId: 'eb56a3a3-f6c8-4486-b7ce-0ede99761ddb', // Healing Circles Program
    programName: 'Healing Circles Program',
    role: 'cultural healing vision',
    featured: true
  },
  {
    storyId: '82a95969-785e-4adc-9790-796e67433c4b', // Uncle Frank Daniel Landers
    storyTitle: 'Uncle Frank Daniel Landers',
    programId: 'eb56a3a3-f6c8-4486-b7ce-0ede99761ddb', // Healing Circles Program
    programName: 'Healing Circles Program',
    role: 'elder wisdom',
    featured: false
  },
  {
    storyId: 'f7a0d261-2fff-4608-a359-955ebc49e34b', // Henry Doyle's Story
    storyTitle: 'Henry Doyle\'s Story',
    programId: 'd55d1918-c07f-4ddd-9457-992363fea3c9', // Yurrampi Growing Strong
    programName: 'Yurrampi Growing Strong',
    role: 'community elder',
    featured: false
  },

  // Youth leadership & organizing
  {
    storyId: '9a0505ee-71d8-463b-b1a8-284563527132', // Operation Luna Success
    storyTitle: 'Operation Luna Success: Dramatic Reduction in Youth Offending',
    programId: '3be985c3-565e-463b-8d3a-fd3a074fe5c2', // Logan Youth Collective
    programName: 'Logan Youth Collective',
    role: 'program effectiveness',
    featured: true
  },

  // Community healing & support
  {
    storyId: '0545406c-f23c-446c-ac16-16c1bf6a090e', // The Power of community in Healing Communities
    storyTitle: 'The Power of community in Healing Communities',
    programId: 'eb56a3a3-f6c8-4486-b7ce-0ede99761ddb', // Healing Circles Program
    programName: 'Healing Circles Program',
    role: 'community healing',
    featured: false
  },

  // Volunteer & community service perspectives
  {
    storyId: '490701a9-5bd0-44de-9323-ee47af95d253', // Finding Purpose Through Orange Sky
    storyTitle: 'Finding Purpose Through Orange Sky',
    programId: '14602373-546b-4466-8867-8b44f16c649c', // BackTrack Youth Works
    programName: 'BackTrack Youth Works',
    role: 'volunteer perspective',
    featured: false
  },

  // Mental health & wellbeing
  {
    storyId: '0b2e25f5-b8f2-4ffa-9404-d5f59ec33605', // Mental Health and Wellbeing Improvements
    storyTitle: 'Mental Health and Wellbeing Improvements',
    programId: '14602373-546b-4466-8867-8b44f16c649c', // BackTrack Youth Works
    programName: 'BackTrack Youth Works',
    role: 'mental health outcomes',
    featured: false
  },

  // Creative expression & arts
  {
    storyId: 'c6a9b240-4213-41f4-93f7-9b5940380e3b', // The Importance of Education and Hope
    storyTitle: 'The Importance of Education and Hope',
    programId: '332a545f-c30e-4822-9128-122810a46503', // Creative Futures Collective
    programName: 'Creative Futures Collective',
    role: 'educational values',
    featured: false
  }
];

async function linkStoriesToPrograms() {
  console.log('🔗 Linking Empathy Ledger Stories to Community Programs\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const link of PROGRAM_LINKS) {
    console.log(`\n📝 Linking: "${link.storyTitle}"`);
    console.log(`   → Program: "${link.programName}"`);
    console.log(`   → Role: ${link.role}`);
    console.log(`   → Featured: ${link.featured ? 'YES ⭐' : 'No'}`);

    try {
      // Get the story to extract profile ID and excerpt
      const { data: story } = await empathyLedgerClient
        .from('stories')
        .select('author_id, storyteller_id, summary, content')
        .eq('id', link.storyId)
        .single();

      if (!story) {
        console.log('   ❌ Story not found in Empathy Ledger');
        results.failed++;
        results.errors.push(`Story ${link.storyId} not found`);
        continue;
      }

      const profileId = story.author_id || story.storyteller_id;
      if (!profileId) {
        console.log('   ⚠️  No profile ID found for story');
        results.skipped++;
        continue;
      }

      const excerpt = story.summary || story.content?.substring(0, 200);

      // Create profile appearance
      const { data, error } = await justiceHubClient
        .from('profile_appearances')
        .upsert({
          empathy_ledger_profile_id: profileId,
          appears_on_type: 'program',
          appears_on_id: link.programId,
          role: link.role,
          story_excerpt: excerpt,
          featured: link.featured || false
        }, {
          onConflict: 'empathy_ledger_profile_id,appears_on_type,appears_on_id'
        })
        .select();

      if (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.failed++;
        results.errors.push(`${link.storyTitle}: ${error.message}`);
      } else {
        console.log('   ✅ Successfully linked!');
        results.success++;
      }

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      results.failed++;
      results.errors.push(`${link.storyTitle}: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 RESULTS:\n');
  console.log(`✅ Successfully linked: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS:\n');
    results.errors.forEach(err => console.log(`   - ${err}`));
  }

  // Get updated count
  const { count: totalCount } = await justiceHubClient
    .from('profile_appearances')
    .select('*', { count: 'exact', head: true });

  const { count: programCount } = await justiceHubClient
    .from('profile_appearances')
    .select('*', { count: 'exact', head: true })
    .eq('appears_on_type', 'program');

  console.log(`\n📈 Total profile_appearances in database: ${totalCount}`);
  console.log(`📋 Profile_appearances for programs: ${programCount}\n`);

  console.log('💡 NEXT STEPS:\n');
  console.log('1. Test the program pages to see new participant stories');
  console.log('2. Visit http://localhost:3003/community-programs/[program-id]');
  console.log('3. Homepage should show featured stories from both services & programs\n');

  return results;
}

linkStoriesToPrograms()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
