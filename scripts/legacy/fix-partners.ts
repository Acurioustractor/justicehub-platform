/**
 * DEPRECATED SCRIPT (legacy quarantine)
 * This file was moved out of active workflows due to deprecated schema assumptions and/or hardcoded credential patterns.
 * Do not use in production runtime paths.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
);

async function fix() {
  console.log('Creating/finding partner organizations...\n');

  // Check if Palm Island Community Company exists, create if not
  let { data: picc } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Palm Island Community Company')
    .single();

  if (!picc) {
    const { data: newPicc, error } = await supabase
      .from('organizations')
      .insert({
        name: 'Palm Island Community Company',
        description: 'Aboriginal community organization supporting youth justice reform in North Queensland',
        location: 'Townsville & Palm Island, QLD',
        type: 'community'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating PICC:', error.message);
    } else {
      picc = newPicc;
      console.log('  ✓ Created: Palm Island Community Company');
    }
  } else {
    console.log('  ✓ Found: Palm Island Community Company');
  }

  // Check if Mounty Yarns exists, create if not
  let { data: mounty } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Mounty Yarns')
    .single();

  if (!mounty) {
    const { data: newMounty, error } = await supabase
      .from('organizations')
      .insert({
        name: 'Mounty Yarns',
        description: 'Community-led storytelling and youth justice reform initiative in Western Sydney',
        location: 'Mount Druitt, NSW',
        type: 'community'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating Mounty Yarns:', error.message);
    } else {
      mounty = newMounty;
      console.log('  ✓ Created: Mounty Yarns');
    }
  } else {
    console.log('  ✓ Found: Mounty Yarns');
  }

  // Oonchiumpa already exists
  const { data: oonchi } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Oonchiumpa')
    .single();

  if (oonchi) {
    console.log('  ✓ Found: Oonchiumpa');
  } else {
    console.log('  ✗ Oonchiumpa not found!');
  }

  // Now update the nodes with correct lead_organization_id
  console.log('\nUpdating nodes...\n');

  if (oonchi) {
    const { error } = await supabase
      .from('justicehub_nodes')
      .update({
        status: 'active',
        lead_organization_id: oonchi.id,
        description: 'Supporting place-based youth justice reform in the Northern Territory, led by Oonchiumpa in Alice Springs.'
      })
      .eq('state_code', 'NT');
    console.log('  NT →', error ? error.message : 'Updated to Oonchiumpa');
  }

  if (picc) {
    const { error } = await supabase
      .from('justicehub_nodes')
      .update({
        status: 'active',
        lead_organization_id: picc.id,
        description: 'Supporting place-based youth justice reform in Queensland, led by Palm Island Community Company.'
      })
      .eq('state_code', 'QLD');
    console.log('  QLD →', error ? error.message : 'Updated to Palm Island Community Company');
  }

  if (mounty) {
    const { error } = await supabase
      .from('justicehub_nodes')
      .update({
        status: 'active',
        lead_organization_id: mounty.id,
        description: 'Supporting place-based youth justice reform in New South Wales, led by Mounty Yarns in Mount Druitt.'
      })
      .eq('state_code', 'NSW');
    console.log('  NSW →', error ? error.message : 'Updated to Mounty Yarns');
  }

  // Update other states to planned (seeking partner)
  const seekingStates = ['VIC', 'SA', 'WA', 'TAS', 'ACT'];
  for (const state of seekingStates) {
    const { error } = await supabase
      .from('justicehub_nodes')
      .update({
        status: 'planned',
        lead_organization_id: null,
        description: 'Seeking community partner to lead place-based youth justice reform in this state.'
      })
      .eq('state_code', state);
    console.log('  ' + state + ' →', error ? error.message : 'Seeking partner');
  }

  // Update NZ
  const { error: nzError } = await supabase
    .from('justicehub_nodes')
    .update({
      status: 'planned',
      lead_organization_id: null,
      description: 'Exploring partnerships for youth justice reform in Aotearoa New Zealand.'
    })
    .eq('country', 'New Zealand');
  console.log('  NZ →', nzError ? nzError.message : 'Exploring partnerships');

  console.log('\n✅ Done! Verifying...\n');

  const { data: nodes } = await supabase
    .from('justicehub_nodes')
    .select('state_code, country, status, lead_organization_id')
    .order('state_code');

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name');

  const orgMap = Object.fromEntries((orgs || []).map(o => [o.id, o.name]));

  console.log('Final state:');
  console.log('='.repeat(50));
  nodes?.forEach(n => {
    const loc = n.state_code || n.country;
    const partner = n.lead_organization_id ? orgMap[n.lead_organization_id] || 'Unknown' : 'None';
    const status = n.status.toUpperCase().padEnd(8);
    console.log(`  ${(loc || '?').padEnd(12)} ${status} → ${partner}`);
  });
}

fix().catch(console.error);
