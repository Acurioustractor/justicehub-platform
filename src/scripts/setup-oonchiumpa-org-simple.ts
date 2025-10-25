/**
 * Setup Oonchiumpa Organization (Simple Version)
 * Works with existing schema
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oonchiumpaOrg = {
  name: 'Oonchiumpa Consultancy & Services',
  slug: 'oonchiumpa',
  type: 'indigenous-org',
  description: 'Oonchiumpa Consultancy & Services is an Aboriginal-owned and led consultancy based in Alice Springs, Northern Territory. Founded by Traditional Owners Kristy Bloomfield and Tanya Turner, Oonchiumpa delivers culturally responsive programs for Aboriginal youth and communities, including youth mentorship, legal education, cultural tourism, and service navigation.',

  verification_status: 'verified',
  is_active: true,

  // Location
  city: 'Alice Springs',
  state: 'NT',
  location: 'Alice Springs, NT',

  // Contact
  website: 'https://github.com/Acurioustractor/Oonchiumpa',
  website_url: 'https://github.com/Acurioustractor/Oonchiumpa',

  // Display
  logo_url: null,
  tags: [
    'Indigenous-led',
    'Aboriginal-owned',
    'Youth justice',
    'Cultural programs',
    'Mentorship',
    'Legal education',
    'Cultural tourism'
  ]
};

async function setupOonchiumpa() {
  console.log('\n🏢 Setting up Oonchiumpa Organization\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Check if exists
  const { data: existing } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', 'oonchiumpa')
    .single();

  let orgId: string;

  if (existing) {
    console.log('✓ Organization already exists');
    console.log(`  ID: ${existing.id}`);
    console.log(`  Name: ${existing.name}\n`);
    orgId = existing.id;
  } else {
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert(oonchiumpaOrg)
      .select()
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Organization created!');
    console.log(`  ID: ${newOrg.id}`);
    console.log(`  Name: ${newOrg.name}\n`);
    orgId = newOrg.id;
  }

  // Get programs
  const { data: programs } = await supabase
    .from('community_programs')
    .select('id, name')
    .eq('organization', 'Oonchiumpa Consultancy & Services');

  console.log(`Found ${programs?.length || 0} programs:\n`);
  programs?.forEach(p => console.log(`  • ${p.name}`));

  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n✅ Setup Complete!\n');
  console.log(`Organization ID: ${orgId}`);
  console.log(`Slug: oonchiumpa`);
  console.log(`Programs: ${programs?.length || 0}\n`);
  console.log('Next: Add organization_id column to programs table');
  console.log('      Then link programs to this organization\n');
}

setupOonchiumpa().catch(console.error);
