/**
 * Add organization_id column to community_programs and link Oonchiumpa programs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ORG_ID = 'abdf0f70-f226-4f5f-b21c-2d788bfd3ddb'; // Oonchiumpa

async function addOrgColumn() {
  console.log('\n🔧 Adding organization_id to programs\n');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Step 1: Adding organization_id column...');
  console.log('  (Run this SQL in Supabase Dashboard → SQL Editor)\n');

  const sql = `
-- Add organization_id column to community_programs
ALTER TABLE community_programs
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_community_programs_organization_id
ON community_programs(organization_id);

-- Add service_id column (optional linkage)
ALTER TABLE community_programs
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_programs_service_id
ON community_programs(service_id);
  `.trim();

  console.log(sql);
  console.log('\n═══════════════════════════════════════════════════\n');

  console.log('Step 2: After running the SQL above, run this script again');
  console.log('        It will link all Oonchiumpa programs\n');

  // Check if column exists by trying to select it
  const { data, error } = await supabase
    .from('community_programs')
    .select('id, name, organization_id')
    .limit(1);

  if (error && error.message.includes('organization_id')) {
    console.log('❌ Column does not exist yet - run the SQL above first\n');
    return;
  }

  console.log('✅ Column exists! Linking programs...\n');

  // Link all Oonchiumpa programs
  const { data: programs } = await supabase
    .from('community_programs')
    .select('id, name')
    .eq('organization', 'Oonchiumpa Consultancy & Services');

  if (!programs || programs.length === 0) {
    console.log('No Oonchiumpa programs found\n');
    return;
  }

  console.log(`Found ${programs.length} programs to link:\n`);

  for (const program of programs) {
    const { error: updateError } = await supabase
      .from('community_programs')
      .update({ organization_id: ORG_ID })
      .eq('id', program.id);

    if (updateError) {
      console.log(`  ❌ ${program.name}: ${updateError.message}`);
    } else {
      console.log(`  ✅ ${program.name}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n✅ All programs linked to organization!\n');
  console.log('Next: Create organization detail page at');
  console.log('      /organizations/oonchiumpa\n');
}

addOrgColumn().catch(console.error);
