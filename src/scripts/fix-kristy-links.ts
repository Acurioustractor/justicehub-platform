/**
 * Fix Kristy Bloomfield's incorrect program linkages
 *
 * Issue: Kristy is linked to multiple programs as a participant,
 * but she's actually a staff member/leader at Oonchiumpa.
 * Her stories are ABOUT program outcomes, not her personal transformation.
 */

import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KRISTY_INCORRECT_LINKS = [
  {
    id: '6f6f4134-1c74-4cb5-bdd8-619c21d18d75',
    program: 'BackTrack Youth Works',
    role: 'mental health outcomes'
  },
  {
    id: '78e0098c-6d48-467c-b3b5-9baa41671caf',
    program: 'Creative Futures Collective',
    role: 'independent living success'
  },
  {
    id: '2aa9b6f8-1bc0-451c-8eb1-c61e173b52dd',
    program: 'Logan Youth Collective',
    role: 'program effectiveness'
  }
];

async function fixKristyLinks() {
  console.log('\n🔧 Fixing Kristy Bloomfield Profile Linkages\n');
  console.log('═══════════════════════════════════════════\n');

  console.log('❌ PROBLEM: Kristy is linked to programs as a "participant"');
  console.log('   but she\'s actually a staff member/leader telling stories');
  console.log('   ABOUT the programs, not sharing her own transformation.\n');

  console.log('🗑️  Deleting incorrect linkages:\n');

  for (const link of KRISTY_INCORRECT_LINKS) {
    console.log(`   Deleting: ${link.program} (${link.role})`);
    console.log(`   Appearance ID: ${link.id}`);

    const { error } = await supabase
      .from('profile_appearances')
      .delete()
      .eq('id', link.id);

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } else {
      console.log(`   ✅ Deleted successfully\n`);
    }
  }

  console.log('\n✅ Fix complete!\n');
  console.log('Kristy Bloomfield should no longer appear on these program pages.');
  console.log('Only actual program participants should be linked.\n');
}

fixKristyLinks().catch(console.error);
