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

// Correct IDs
const PICC_ORG_ID = '11111111-1111-1111-1111-111111111002';
const OONCHIUMPA_ORG_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';
const MOUNTY_ORG_ID = '11111111-1111-1111-1111-111111111003';
const COE_ORG_ID = '11111111-1111-1111-1111-111111111000';

// Duplicate Oonchiumpa to clean up
const DUPLICATE_OONCHIUMPA = '11111111-1111-1111-1111-111111111001';

async function fix() {
  console.log('🔧 Fixing organization data...\n');

  // 1. Delete the duplicate Oonchiumpa entry
  console.log('1. Checking duplicate Oonchiumpa...');
  const { data: dup } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', DUPLICATE_OONCHIUMPA)
    .single();

  if (dup && dup.name === 'Oonchiumpa') {
    const { error: delErr } = await supabase
      .from('organizations')
      .delete()
      .eq('id', DUPLICATE_OONCHIUMPA);
    if (delErr) console.log('   Error deleting duplicate:', delErr.message);
    else console.log('   ✓ Deleted duplicate Oonchiumpa entry');
  } else {
    console.log('   No duplicate found or already different');
  }

  // 2. Update Centre of Excellence with correct partner IDs
  console.log('\n2. Updating Centre of Excellence partner references...');

  const { data: coe } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', COE_ORG_ID)
    .single();

  if (coe?.settings?.partner) {
    const updatedSettings = {
      ...coe.settings,
      partner: {
        ...coe.settings.partner,
        partnerOrganizations: [
          { id: PICC_ORG_ID, name: 'Palm Island Community Company (PICC)', state: 'QLD', role: 'Community Partner' },
          { id: OONCHIUMPA_ORG_ID, name: 'Oonchiumpa', state: 'NT', role: 'Community Partner' },
          { id: MOUNTY_ORG_ID, name: 'Mounty Yarns', state: 'NSW', role: 'Community Partner' },
        ],
      },
    };

    const { error: updateErr } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', COE_ORG_ID);

    if (updateErr) console.log('   Error:', updateErr.message);
    else console.log('   ✓ Centre of Excellence partner references updated');
  }

  // 3. Ensure PICC has settings
  console.log('\n3. Checking PICC settings...');
  const { data: picc } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', PICC_ORG_ID)
    .single();

  const hasPartnerSettings = picc?.settings?.partner;

  if (!hasPartnerSettings) {
    console.log('   PICC missing partner settings, adding...');

    const piccSettings = {
      partner: {
        videos: [],
        goals: [
          { type: 'mission', title: 'Community-Controlled Services', description: '197 staff delivering 16+ essential services on Palm Island', icon: 'building' },
          { type: 'vision', title: 'Data Sovereignty', description: 'Palm Island data belongs to Palm Island', icon: 'database' },
          { type: 'goal', title: 'Youth Pathways Precinct', description: 'Transforming The Station into a regional hub', icon: 'compass' },
          { type: 'value', title: 'Circular Economy', description: 'Turning waste into essential items while training young people', icon: 'refresh-cw' },
        ],
        impact: [
          { name: 'Staff', value: '197', context: 'community members employed', icon: 'users' },
          { name: 'Services', value: '16+', context: 'essential services delivered', icon: 'heart-pulse' },
          { name: 'Site Lease', value: '30 Years', context: 'Station Precinct development', icon: 'calendar' },
        ],
        contacts: [
          { type: 'website', label: 'PICC Website', value: 'https://picc.com.au', primary: true },
          { type: 'website', label: 'Station Site Plan', value: 'https://picc-station-site.vercel.app' },
        ],
        siteLocations: [
          { name: 'Commercial Kitchen Block', description: 'Reactivated kitchen for catering training', type: 'building', status: 'in_progress' },
          { name: 'Goods Workshop', description: 'Manufacturing recycled-plastic bed bases', type: 'building', status: 'planned' },
          { name: 'Train Carriages', description: 'Historical carriages for cultural programs', type: 'building', status: 'in_progress' },
        ],
        linkedStories: [
          { empathyLedgerId: '86238687-772e-4e21-a555-9f2360d2e7ab', title: 'Hull River History', type: 'documentary' },
          { empathyLedgerId: '68bf8048-eafd-4d0c-9d61-4182a4883c85', title: 'Palm Island Storm Stories', type: 'interview' },
        ],
        traditionalOwners: 'Bwgcolman People (Palm Island), Manbarra People (Townsville)',
        interactiveMapUrl: 'https://picc-station-site.vercel.app',
      },
    };

    const { error } = await supabase
      .from('organizations')
      .update({ settings: piccSettings })
      .eq('id', PICC_ORG_ID);

    if (error) console.log('   Error:', error.message);
    else console.log('   ✓ PICC settings added');
  } else {
    console.log('   ✓ PICC already has partner settings');
  }

  // 4. Update QLD node to link to PICC
  console.log('\n4. Linking QLD node to PICC...');
  const { error: qldErr } = await supabase
    .from('justicehub_nodes')
    .update({ lead_organization_id: PICC_ORG_ID })
    .eq('state_code', 'QLD');

  if (qldErr) console.log('   Error:', qldErr.message);
  else console.log('   ✓ QLD node linked to PICC');

  // 5. Verify final state
  console.log('\n' + '═'.repeat(50));
  console.log('VERIFICATION');
  console.log('═'.repeat(50));

  const { data: allOrgs } = await supabase
    .from('organizations')
    .select('id, name, location, settings')
    .in('id', [COE_ORG_ID, PICC_ORG_ID, OONCHIUMPA_ORG_ID, MOUNTY_ORG_ID]);

  allOrgs?.forEach((o) => {
    const p = o.settings?.partner;
    console.log(`\n${o.name}`);
    console.log(`  Location: ${o.location || 'Not set'}`);
    console.log(`  Has partner data: ${p ? 'Yes' : 'No'}`);
    if (p) {
      console.log(`  Goals: ${p.goals?.length || 0}, Impact: ${p.impact?.length || 0}, Sites: ${p.siteLocations?.length || 0}`);
    }
  });

  // Check nodes
  const { data: nodes } = await supabase
    .from('justicehub_nodes')
    .select('name, state_code, lead_organization_id, organizations(name)')
    .in('state_code', ['QLD', 'NSW', 'NT']);

  console.log('\n\nNode Links:');
  nodes?.forEach((n) => {
    console.log(`  ${n.name}: ${(n as any).organizations?.name || 'Not linked'}`);
  });
}

fix().catch(console.error);
