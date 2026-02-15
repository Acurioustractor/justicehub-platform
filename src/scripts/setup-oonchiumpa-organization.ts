/**
 * Setup Oonchiumpa Organization and Link Programs
 * This creates the organization record and links all 4 programs to it
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oonchiumpaOrg = {
  name: 'Oonchiumpa Consultancy & Services',
  slug: 'oonchiumpa',
  type: 'indigenous-org' as const,
  description: 'Oonchiumpa Consultancy & Services is an Aboriginal-owned and led consultancy based in Alice Springs, Northern Territory. Founded by Traditional Owners Kristy Bloomfield and Tanya Turner, Oonchiumpa delivers culturally responsive programs for Aboriginal youth and communities, including youth mentorship, legal education, cultural tourism, and service navigation. The organization operates from a foundation of cultural authority and deep connection to Eastern Arrernte and Luritja Country.',

  verification_status: 'verified' as const,
  is_indigenous_controlled: true,
  verified_at: new Date().toISOString(),
  verified_by: 'JusticeHub Admin',

  // Location
  city: 'Alice Springs',
  state: 'NT' as const,
  service_area: ['Alice Springs', 'Central Australia', 'Northern Territory'],

  // Contact
  website: 'https://github.com/Acurioustractor/Oonchiumpa',

  // Display
  is_active: true,
  tags: [
    'Indigenous-led',
    'Aboriginal-owned',
    'Youth justice',
    'Cultural programs',
    'Mentorship',
    'Legal education',
    'Cultural tourism',
    'Central Australia',
    'Traditional Owners',
    'Arrernte Country'
  ],

  data_source: 'manual'
};

async function setupOonchiumpaOrganization() {
  console.log('\n🏢 Setting up Oonchiumpa Organization\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Step 1: Check if organization already exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', 'oonchiumpa')
    .single();

  let orgId: string;

  if (existingOrg) {
    console.log('✓ Organization already exists');
    console.log(`  ID: ${existingOrg.id}`);
    console.log(`  Name: ${existingOrg.name}\n`);
    orgId = existingOrg.id;
  } else {
    // Create organization
    console.log('Creating organization...');
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert(oonchiumpaOrg)
      .select()
      .single();

    if (orgError) {
      console.error('❌ Error creating organization:', orgError);
      return;
    }

    console.log('✅ Organization created successfully!');
    console.log(`  ID: ${newOrg.id}`);
    console.log(`  Name: ${newOrg.name}`);
    console.log(`  Slug: ${newOrg.slug}\n`);
    orgId = newOrg.id;
  }

  // Step 2: Get all Oonchiumpa programs
  const { data: programs, error: programsError } = await supabase
    .from('community_programs')
    .select('id, name, organization')
    .eq('organization', 'Oonchiumpa Consultancy & Services');

  if (programsError) {
    console.error('❌ Error fetching programs:', programsError);
    return;
  }

  console.log(`Found ${programs?.length || 0} Oonchiumpa programs\n`);

  // Step 3: Link programs to organization
  if (programs && programs.length > 0) {
    console.log('Linking programs to organization...\n');

    for (const program of programs) {
      const { error: updateError } = await supabase
        .from('community_programs')
        .update({ organization_id: orgId })
        .eq('id', program.id);

      if (updateError) {
        console.log(`  ❌ ${program.name}: ${updateError.message}`);
      } else {
        console.log(`  ✅ ${program.name}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n✅ Setup Complete!\n');
  console.log('Organization Details:');
  console.log(`  ID: ${orgId}`);
  console.log(`  Slug: oonchiumpa`);
  console.log(`  Type: Indigenous-led organization`);
  console.log(`  Verification: Verified`);
  console.log(`  Programs Linked: ${programs?.length || 0}\n`);
  console.log('View Organization:');
  console.log(`  http://localhost:3003/organizations/oonchiumpa\n`);
  console.log('Next Steps:');
  console.log('  1. Create organization detail page UI');
  console.log('  2. Update program pages to show parent organization');
  console.log('  3. Link profiles (Kristy Bloomfield, Tanya Turner)');
  console.log('  4. Link stories from Empathy Ledger\n');
}

setupOonchiumpaOrganization().catch(console.error);
