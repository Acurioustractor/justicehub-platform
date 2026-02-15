/**
 * Link Empathy Ledger stories to JusticeHub services
 * This creates profile_appearances records
 */

import { createClient } from '@supabase/supabase-js';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

const justiceHubClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.YJSF_SUPABASE_SERVICE_KEY || ''
);

interface LinkMapping {
  storyId: string;
  storyTitle: string;
  serviceId: string;
  serviceName: string;
  role: string;
  featured?: boolean;
}

// Manual curated mappings based on story content and service type
const MANUAL_LINKS: LinkMapping[] = [
  // Youth Justice Stories
  {
    storyId: 'b342a136-6c99-4ee4-ba2e-3eac00b585b9', // MS: From Disconnected Youth to Future Tourism Entrepreneur
    storyTitle: 'MS: From Disconnected Youth to Future Tourism Entrepreneur',
    serviceId: '897b4cd5-3f15-4307-a60c-0def6391a4ad', // Test Youth Mentoring Service
    serviceName: 'Test Youth Mentoring Service',
    role: 'program participant',
    featured: true
  },
  {
    storyId: '9a0505ee-71d8-463b-b1a8-284563527132', // Operation Luna Success
    storyTitle: 'Operation Luna Success: Dramatic Reduction in Youth Offending',
    serviceId: '053239f0-89e5-4bbe-9df2-54d5c96d05b8', // Court Representation
    serviceName: 'Court Representation',
    role: 'case study',
    featured: true
  },
  {
    storyId: '48e2ad56-c8d5-447e-83dd-83a606920b8e', // M: From Homelessness to Independent Living
    storyTitle: 'M: From Homelessness to Independent Living',
    serviceId: '897b4cd5-3f15-4307-a60c-0def6391a4ad', // Test Youth Mentoring Service
    serviceName: 'Test Youth Mentoring Service',
    role: 'success story',
    featured: true
  },

  // Mental Health
  {
    storyId: '0b2e25f5-b8f2-4ffa-9404-d5f59ec33605', // Mental Health and Wellbeing Improvements
    storyTitle: 'Mental Health and Wellbeing Improvements',
    serviceId: '9cbecf2d-7e3f-4723-a28a-68624c8d6430', // Youth Counseling
    serviceName: 'Youth Counseling',
    role: 'outcome evidence',
    featured: false
  },
  {
    storyId: '3529e610-a7eb-40e8-8662-3a4f6c5266e6', // The Sacred Journey of a Midwife
    storyTitle: 'The Sacred Journey of a Midwife',
    serviceId: '9cbecf2d-7e3f-4723-a28a-68624c8d6430', // Youth Counseling
    serviceName: 'Youth Counseling',
    role: 'service provider perspective',
    featured: false
  },

  // Education & Training
  {
    storyId: 'c6a9b240-4213-41f4-93f7-9b5940380e3b', // The Importance of Education and Hope
    storyTitle: 'The Importance of Education and Hope',
    serviceId: 'da004804-2fa6-42c4-a1c8-8323c6aa635e', // Alternative Education Program
    serviceName: 'Alternative Education Program',
    role: 'inspirational story',
    featured: false
  },

  // Legal Support
  {
    storyId: 'de3f0fae-c4d4-4f19-8197-97a1ab8e56b1', // Building a Healing Path: Uncle Dale's Vision
    storyTitle: "Building a Healing Path: Uncle Dale's Vision for Youth Justice Reform",
    serviceId: '2aeb9a6b-03a5-4ce0-8b24-29c26e3c4ff8', // Legal Advice
    serviceName: 'Legal Advice',
    role: 'cultural perspective',
    featured: true
  },

  // Crisis Intervention
  {
    storyId: 'da40e38d-e2e8-430b-a4a7-fe206ab37754', // Christopher: The Storm Revealed Government Failures
    storyTitle: 'Christopher: The Storm Revealed Government Failures',
    serviceId: 'dba296d2-36e0-482e-8c40-795710a0a505', // Emergency Crisis Support
    serviceName: 'Emergency Crisis Support',
    role: 'community voice',
    featured: false
  },
  {
    storyId: 'f57b9790-ce8c-4378-8ecd-eb7ede6f6bb4', // Margaret Rose Parker
    storyTitle: 'Margaret Rose Parker (75): Justice, DV Support & Storm Response',
    serviceId: 'dba296d2-36e0-482e-8c40-795710a0a505', // Emergency Crisis Support
    serviceName: 'Emergency Crisis Support',
    role: 'elder wisdom',
    featured: true
  },

  // Additional Community & Volunteer Stories - Round 2
  {
    storyId: '490701a9-5bd0-44de-9323-ee47af95d253', // Finding Purpose Through Orange Sky
    storyTitle: 'Finding Purpose Through Orange Sky',
    serviceId: '9cbecf2d-7e3f-4723-a28a-68624c8d6430', // Youth Counseling
    serviceName: 'Youth Counseling',
    role: 'volunteer perspective',
    featured: false
  },
  {
    storyId: 'b1e95758-6524-4400-9892-f958d2360382', // Finding Purpose Through Orange Sky (Margot)
    storyTitle: 'Finding Purpose Through Orange Sky (Margot Scales)',
    serviceId: 'dba296d2-36e0-482e-8c40-795710a0a505', // Emergency Crisis Support
    serviceName: 'Emergency Crisis Support',
    role: 'community support',
    featured: false
  },
  {
    storyId: 'b94b4c5d-3a19-4284-a30d-cdc4d9d2bfc7', // David loves Orange Sky
    storyTitle: 'David loves Orange Sky',
    serviceId: 'dba296d2-36e0-482e-8c40-795710a0a505', // Emergency Crisis Support
    serviceName: 'Emergency Crisis Support',
    role: 'service user',
    featured: false
  },

  // Family Support Stories
  {
    storyId: '47e54add-a032-4c83-9beb-2ffb43089e5e', // The True Meaning of Wealth
    storyTitle: 'The True Meaning of Wealth: Health, Family, and Love',
    serviceId: '9cbecf2d-7e3f-4723-a28a-68624c8d6430', // Youth Counseling
    serviceName: 'Youth Counseling',
    role: 'family values',
    featured: false
  },
  {
    storyId: '88d60807-c513-4879-8a3b-3e89fc9f67f9', // Life in Tennant Creek
    storyTitle: 'Life in Tennant Creek: A Family\'s Story',
    serviceId: 'dba296d2-36e0-482e-8c40-795710a0a505', // Emergency Crisis Support
    serviceName: 'Emergency Crisis Support',
    role: 'housing crisis',
    featured: false
  },
  {
    storyId: '0545406c-f23c-446c-ac16-16c1bf6a090e', // The Power of community in Healing Communities
    storyTitle: 'The Power of community in Healing Communities',
    serviceId: '897b4cd5-3f15-4307-a60c-0def6391a4ad', // Test Youth Mentoring Service
    serviceName: 'Test Youth Mentoring Service',
    role: 'community healing',
    featured: false
  },

  // Indigenous Cultural Stories
  {
    storyId: '82a95969-785e-4adc-9790-796e67433c4b', // Uncle Frank Daniel Landers
    storyTitle: 'Uncle Frank Daniel Landers',
    serviceId: '2aeb9a6b-03a5-4ce0-8b24-29c26e3c4ff8', // Legal Advice
    serviceName: 'Legal Advice',
    role: 'cultural knowledge keeper',
    featured: false
  },
  {
    storyId: 'f7a0d261-2fff-4608-a359-955ebc49e34b', // Henry Doyle's Story
    storyTitle: 'Henry Doyle\'s Story',
    serviceId: '897b4cd5-3f15-4307-a60c-0def6391a4ad', // Test Youth Mentoring Service
    serviceName: 'Test Youth Mentoring Service',
    role: 'community elder',
    featured: false
  },

  // Healthcare & Wellbeing
  {
    storyId: '5bebcbfc-f18f-4bb0-8b69-9b77a97190fe', // Cliff Plummer
    storyTitle: 'Cliff Plummer — Key Story',
    serviceId: '9cbecf2d-7e3f-4723-a28a-68624c8d6430', // Youth Counseling
    serviceName: 'Youth Counseling',
    role: 'health advocacy',
    featured: false
  },
  {
    storyId: 'acacc444-0bda-40e6-999c-a4cf530dcf29', // Tasos
    storyTitle: 'Tasos — Key Story',
    serviceId: 'dba296d2-36e0-482e-8c40-795710a0a505', // Emergency Crisis Support
    serviceName: 'Emergency Crisis Support',
    role: 'lived experience - homelessness',
    featured: false
  }
];

async function linkStoriesToServices() {
  console.log('🔗 Linking Empathy Ledger Stories to JusticeHub Services\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const link of MANUAL_LINKS) {
    console.log(`\n📝 Linking: "${link.storyTitle}"`);
    console.log(`   → Service: "${link.serviceName}"`);
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
          appears_on_type: 'service',
          appears_on_id: link.serviceId,
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
  const { count } = await justiceHubClient
    .from('profile_appearances')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total profile_appearances in database: ${count}\n`);

  console.log('💡 NEXT STEPS:\n');
  console.log('1. Test the service pages to see new profiles');
  console.log('2. Visit http://localhost:3003/services/[service-id]');
  console.log('3. Add more story links as needed');
  console.log('4. Update featured flags for homepage highlights\n');

  return results;
}

linkStoriesToServices()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
