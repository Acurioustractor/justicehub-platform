/**
 * Link Kristy Bloomfield and Tanya Turner to Oonchiumpa programs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KRISTY_ID = 'b59a1f4c-94fd-4805-a2c5-cac0922133e0';
const TANYA_ID = 'dc85700d-f139-46fa-9074-6afee55ea801';

const PROGRAMS = {
  alternative_service: '7d439016-1965-4757-90cf-0cd69257d856',
  true_justice: '3f9f1e85-17dc-4850-9a59-06e83c69a803',
  atnarpa_homestead: '4773a5ba-229f-49d9-8e0e-b95a34353178',
  cultural_brokerage: '2a20ee55-1172-4948-9a50-e60189062c57',
};

const profileLinks = [
  // Kristy Bloomfield - Co-Founder, appears on multiple programs
  {
    profile_id: KRISTY_ID,
    program_id: PROGRAMS.alternative_service,
    role: 'Co-Founder & Program Manager',
    story_excerpt: 'Leading culturally responsive youth mentorship program in Alice Springs',
    featured: true,
  },
  {
    profile_id: KRISTY_ID,
    program_id: PROGRAMS.true_justice,
    role: 'Co-Founder & Lead Facilitator',
    story_excerpt: 'Designed and delivers transformative legal education program with ANU Law School',
    featured: true,
  },
  {
    profile_id: KRISTY_ID,
    program_id: PROGRAMS.atnarpa_homestead,
    role: 'Founder',
    story_excerpt: 'Traditional Owner-led cultural tourism and on-country experiences at Loves Creek Station',
    featured: false,
  },

  // Tanya Turner - Co-Founder of True Justice
  {
    profile_id: TANYA_ID,
    program_id: PROGRAMS.true_justice,
    role: 'Co-Founder & Lead Facilitator',
    story_excerpt: 'Traditional Owner leading transformative legal education for law students on country',
    featured: true,
  },
];

async function linkProfiles() {
  console.log('\n👥 Linking Profiles to Oonchiumpa Programs\n');
  console.log('═══════════════════════════════════════════════════\n');

  for (const link of profileLinks) {
    // Check if link already exists
    const { data: existing } = await supabase
      .from('profile_appearances')
      .select('id')
      .eq('empathy_ledger_profile_id', link.profile_id)
      .eq('appears_on_type', 'program')
      .eq('appears_on_id', link.program_id)
      .single();

    if (existing) {
      console.log(`⚠️  Already linked: ${link.role} to program`);
      continue;
    }

    // Create new link
    const { data, error } = await supabase
      .from('profile_appearances')
      .insert({
        empathy_ledger_profile_id: link.profile_id,
        appears_on_type: 'program',
        appears_on_id: link.program_id,
        role: link.role,
        story_excerpt: link.story_excerpt,
        featured: link.featured,
      })
      .select()
      .single();

    if (error) {
      console.log(`❌ Error linking: ${error.message}`);
    } else {
      console.log(`✅ Linked: ${link.role}`);
      console.log(`   Program: ${link.program_id.substring(0, 8)}...`);
      console.log(`   Featured: ${link.featured ? 'Yes' : 'No'}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('\n✅ Profile Linking Complete!\n');
  console.log('Linked Profiles:');
  console.log('  • Kristy Bloomfield → 3 programs (2 featured)');
  console.log('  • Tanya Turner → 1 program (featured)\n');
  console.log('View Results:');
  console.log('  http://localhost:3003/community-programs/7d439016-1965-4757-90cf-0cd69257d856');
  console.log('  http://localhost:3003/community-programs/3f9f1e85-17dc-4850-9a59-06e83c69a803\n');
}

linkProfiles().catch(console.error);
