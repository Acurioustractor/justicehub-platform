/**
 * Script to update JusticeHub nodes with correct community partners
 * Run with: npx ts-node scripts/update-nodes-partners.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Updating JusticeHub nodes with correct community partners...\n');

  // Define the correct partner data
  const partners = [
    {
      id: '11111111-1111-1111-1111-111111111001',
      name: 'Oonchiumpa',
      slug: 'oonchiumpa',
      type: 'community_organization',
      city: 'Alice Springs',
      state: 'NT',
      country: 'Australia',
      description: 'Aboriginal community organization supporting youth justice reform in the Northern Territory through cultural programs and community-led initiatives.',
    },
    {
      id: '11111111-1111-1111-1111-111111111002',
      name: 'Palm Island Community Company',
      slug: 'palm-island-community-company',
      type: 'community_organization',
      city: 'Townsville',
      state: 'QLD',
      country: 'Australia',
      description: 'Community-controlled organization serving Palm Island and Townsville, delivering youth programs and advocacy for justice reform.',
    },
    {
      id: '11111111-1111-1111-1111-111111111003',
      name: 'Mounty Yarns',
      slug: 'mounty-yarns',
      type: 'community_organization',
      city: 'Mount Druitt',
      state: 'NSW',
      country: 'Australia',
      description: 'Community storytelling and youth support organization based in Mount Druitt, Western Sydney.',
    },
  ];

  // Upsert organizations
  console.log('1. Creating/updating partner organizations...');
  for (const partner of partners) {
    const { error } = await supabase
      .from('organizations')
      .upsert(partner, { onConflict: 'id' });

    if (error) {
      console.error(`  Error upserting ${partner.name}:`, error.message);
    } else {
      console.log(`  ✓ ${partner.name} (${partner.city}, ${partner.state})`);
    }
  }

  // Update active nodes
  console.log('\n2. Updating active nodes...');

  // NT - Oonchiumpa
  const { error: ntError } = await supabase
    .from('justicehub_nodes')
    .update({
      name: 'JusticeHub Northern Territory',
      description: 'Led by Oonchiumpa in Alice Springs, supporting youth justice reform through cultural programs, community advocacy, and place-based solutions for young people in the NT.',
      status: 'active',
      latitude: -23.6980,
      longitude: 133.8807,
      lead_organization_id: '11111111-1111-1111-1111-111111111001',
    })
    .eq('state_code', 'NT');

  if (ntError) {
    console.error('  Error updating NT:', ntError.message);
  } else {
    console.log('  ✓ NT → Oonchiumpa (Alice Springs) - ACTIVE');
  }

  // QLD - Palm Island Community Company
  const { error: qldError } = await supabase
    .from('justicehub_nodes')
    .update({
      name: 'JusticeHub Queensland',
      description: 'Led by Palm Island Community Company, connecting Townsville and Palm Island communities with youth justice programs, cultural healing, and advocacy for systemic change.',
      status: 'active',
      latitude: -19.2590,
      longitude: 146.8169,
      lead_organization_id: '11111111-1111-1111-1111-111111111002',
    })
    .eq('state_code', 'QLD');

  if (qldError) {
    console.error('  Error updating QLD:', qldError.message);
  } else {
    console.log('  ✓ QLD → Palm Island Community Company (Townsville) - ACTIVE');
  }

  // NSW - Mounty Yarns
  const { error: nswError } = await supabase
    .from('justicehub_nodes')
    .update({
      name: 'JusticeHub New South Wales',
      description: 'Led by Mounty Yarns in Mount Druitt, amplifying community voices and supporting young people through storytelling, advocacy, and connection to services in Western Sydney.',
      status: 'active',
      latitude: -33.7448,
      longitude: 150.8187,
      lead_organization_id: '11111111-1111-1111-1111-111111111003',
    })
    .eq('state_code', 'NSW');

  if (nswError) {
    console.error('  Error updating NSW:', nswError.message);
  } else {
    console.log('  ✓ NSW → Mounty Yarns (Mount Druitt) - ACTIVE');
  }

  // Update seeking partner nodes
  console.log('\n3. Updating nodes seeking partners...');

  const seekingStates = [
    { code: 'VIC', name: 'Victoria' },
    { code: 'SA', name: 'South Australia' },
    { code: 'WA', name: 'Western Australia' },
    { code: 'TAS', name: 'Tasmania' },
    { code: 'ACT', name: 'the ACT' },
  ];

  for (const state of seekingStates) {
    const { error } = await supabase
      .from('justicehub_nodes')
      .update({
        description: `Seeking community partner to lead youth justice reform work in ${state.name}. Interested organizations welcome to connect.`,
        status: 'planned',
        lead_organization_id: null,
      })
      .eq('state_code', state.code);

    if (error) {
      console.error(`  Error updating ${state.code}:`, error.message);
    } else {
      console.log(`  ✓ ${state.code} → Seeking partner`);
    }
  }

  // Update NZ
  const { error: nzError } = await supabase
    .from('justicehub_nodes')
    .update({
      description: 'Exploring partnerships with Māori and community organizations in Aotearoa New Zealand to share learnings and support youth justice reform.',
      status: 'planned',
    })
    .eq('country', 'New Zealand');

  if (nzError) {
    console.error('  Error updating NZ:', nzError.message);
  } else {
    console.log('  ✓ NZ → Exploring partnerships');
  }

  console.log('\n✅ Done! Refresh the page to see updated nodes.');
}

main().catch(console.error);
