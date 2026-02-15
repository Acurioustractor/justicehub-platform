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

// Organization IDs
const COE_ORG_ID = '11111111-1111-1111-1111-111111111000';
const PICC_ORG_ID = '11111111-1111-1111-1111-111111111002';
const OONCHIUMPA_ORG_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';
const MOUNTY_ORG_ID = '11111111-1111-1111-1111-111111111003';

// Node IDs (from database)
const NODE_IDS = {
  QLD: 'a6ab20d5-25ef-46ac-adec-af0894d141fd',
  NT: 'aa52da7f-1b12-4c75-baa7-5b2ab4bb37ba',
  NSW: '5b3f11cb-7a66-42ea-8ae9-16c7cbd88aa4',
};

// Current coe_key_people profile IDs
const PROFILE_IDS = {
  benjamin_knight: 'a0eed8bd-28d4-4c95-b203-a17fc7fc897d',
  nick_marchesi: 'b6a03d0a-ccab-48d8-8c1a-dcd376dfeb05',
  patricia_miller: '09e8287e-ca08-4590-baf6-3a742210ee54',
  uncle_dale: '2805f2e2-85d4-4935-980a-66cfe9e9b18c',
  kristy_bloomfield: 'e8df7dd8-96bc-46bc-991e-9febc9162cd9',
  tanya_turner: '461c93c1-1324-46c4-9b10-003c27f9ad1c',
  olga_havnen: '3b00e396-9552-40fd-a29d-fb5854f34f2f',
  kate_bjur: '0b68c779-f4a9-4af4-8f83-aa1122200351',
  brodie_germaine: '40ed5cbd-e612-42f0-a68c-b1e80201e281',
  chelsea_rolfe: 'e710fb6b-3c94-4aec-a070-9da3f1e282d4',
};

/*
THE NEW STRUCTURE:

Centre of Excellence = National umbrella coordinating body
- Supports all place-based nodes
- Provides research, evidence, connections
- Coordinates national advocacy

Nodes = Place-based work led by community-controlled orgs:
- QLD Node → Led by PICC (Palm Island & Townsville)
- NT Node → Led by Oonchiumpa (Alice Springs/Mparntwe)
- NSW Node → Led by Mounty Yarns (Mount Druitt)

Key People should be organized by WHERE THEY WORK:

CENTRE OF EXCELLENCE (National Coordination):
- Benjamin Knight - Research Director, A Curious Tractor
- Nicholas Marchesi - Creative Director, A Curious Tractor

NT NODE (Oonchiumpa):
- Kristy Bloomfield - CEO, Oonchiumpa
- Tanya Turner - Director, Oonchiumpa

QLD NODE (PICC):
- Patricia Ann Miller - Community Elder, Palm Island
- Uncle Dale - Elder & Cultural Advisor, Palm Island
- Brodie Germaine - Lived Experience, Palm Island
- Chelsea Rolfe - Communications, Palm Island

INTERNATIONAL PARTNERS:
- Kate Bjur - Executive Director, Diagrama (Spain)
- Olga Havnen - Policy Advisor (National, Independent)
*/

async function reorganize() {
  console.log('🔧 Reorganizing Centre of Excellence structure...\n');
  console.log('New Model: CoE as umbrella supporting place-based nodes\n');

  // ============================================
  // 1. Update profile locations and organizations
  // ============================================
  console.log('1. Updating profile locations and organizations...\n');

  const profileUpdates = [
    // Centre of Excellence (National)
    { id: PROFILE_IDS.benjamin_knight, current_organization: 'A Curious Tractor / Centre of Excellence', location: 'Brisbane, QLD (National)' },
    { id: PROFILE_IDS.nick_marchesi, current_organization: 'A Curious Tractor / Centre of Excellence', location: 'Brisbane, QLD (National)' },

    // NT - Oonchiumpa
    { id: PROFILE_IDS.kristy_bloomfield, current_organization: 'Oonchiumpa', location: 'Alice Springs (Mparntwe), NT' },
    { id: PROFILE_IDS.tanya_turner, current_organization: 'Oonchiumpa', location: 'Alice Springs (Mparntwe), NT' },

    // QLD - PICC / Palm Island
    { id: PROFILE_IDS.patricia_miller, current_organization: 'Palm Island Community Company', location: 'Palm Island, QLD' },
    { id: PROFILE_IDS.uncle_dale, current_organization: 'Palm Island Community Company', location: 'Palm Island, QLD' },
    { id: PROFILE_IDS.brodie_germaine, current_organization: 'Palm Island Community Company', location: 'Palm Island, QLD' },
    { id: PROFILE_IDS.chelsea_rolfe, current_organization: 'Palm Island Community Company', location: 'Palm Island, QLD' },

    // International/National Partners
    { id: PROFILE_IDS.kate_bjur, current_organization: 'Diagrama Foundation', location: 'Spain (International Partner)' },
    { id: PROFILE_IDS.olga_havnen, current_organization: 'Independent Policy Advisor', location: 'Darwin, NT (National)' },
  ];

  for (const update of profileUpdates) {
    const { error } = await supabase
      .from('public_profiles')
      .update({ current_organization: update.current_organization, location: update.location })
      .eq('id', update.id);

    if (error) {
      console.log(`   ✗ Error updating ${update.id}: ${error.message}`);
    } else {
      console.log(`   ✓ Updated: ${update.current_organization} - ${update.location}`);
    }
  }

  // ============================================
  // 2. Update coe_key_people with correct roles
  // ============================================
  console.log('\n2. Updating coe_key_people roles and expertise...\n');

  const coeUpdates = [
    // National Coordination (Centre of Excellence core team)
    { profile_id: PROFILE_IDS.benjamin_knight, role_title: 'Research Director', expertise_area: 'Youth Justice Research & Policy', display_order: 1 },
    { profile_id: PROFILE_IDS.nick_marchesi, role_title: 'Creative Director', expertise_area: 'Immersive Experience Design', display_order: 2 },

    // NT Node Leaders
    { profile_id: PROFILE_IDS.kristy_bloomfield, role_title: 'NT Node Lead - CEO Oonchiumpa', expertise_area: 'Aboriginal Youth Mentorship', display_order: 3 },
    { profile_id: PROFILE_IDS.tanya_turner, role_title: 'NT Node - Director Oonchiumpa', expertise_area: 'Community Engagement & True Justice', display_order: 4 },

    // QLD Node Leaders
    { profile_id: PROFILE_IDS.patricia_miller, role_title: 'QLD Node - Community Elder', expertise_area: 'Indigenous Youth Advocacy', display_order: 5 },
    { profile_id: PROFILE_IDS.uncle_dale, role_title: 'QLD Node - Cultural Advisor', expertise_area: 'Cultural Governance', display_order: 6 },

    // Lived Experience & Community Voice
    { profile_id: PROFILE_IDS.brodie_germaine, role_title: 'QLD Node - Youth Voice', expertise_area: 'Lived Experience Advocacy', display_order: 7 },
    { profile_id: PROFILE_IDS.chelsea_rolfe, role_title: 'QLD Node - Communications', expertise_area: 'Community Communications', display_order: 8 },

    // International & National Partners
    { profile_id: PROFILE_IDS.kate_bjur, role_title: 'International Partner - Diagrama', expertise_area: 'European Therapeutic Models', display_order: 9 },
    { profile_id: PROFILE_IDS.olga_havnen, role_title: 'National Policy Advisor', expertise_area: 'Indigenous Policy & Advocacy', display_order: 10 },
  ];

  for (const update of coeUpdates) {
    const { error } = await supabase
      .from('coe_key_people')
      .update({
        role_title: update.role_title,
        expertise_area: update.expertise_area,
        display_order: update.display_order,
      })
      .eq('profile_id', update.profile_id);

    if (error) {
      console.log(`   ✗ Error: ${error.message}`);
    } else {
      console.log(`   ✓ ${update.role_title}`);
    }
  }

  // ============================================
  // 3. Update Centre of Excellence organization settings
  // ============================================
  console.log('\n3. Updating Centre of Excellence organization structure...\n');

  const { data: coe } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', COE_ORG_ID)
    .single();

  if (coe?.settings) {
    const updatedSettings = {
      ...coe.settings,
      partner: {
        ...coe.settings.partner,

        // Updated structure: CoE as umbrella supporting nodes
        structure: {
          type: 'umbrella',
          description: 'Centre of Excellence is the national coordinating body that supports place-based JusticeHub nodes led by Aboriginal community-controlled organizations.',
          coreTeam: [
            { profileId: PROFILE_IDS.benjamin_knight, name: 'Benjamin Knight', role: 'Research Director', place: 'National' },
            { profileId: PROFILE_IDS.nick_marchesi, name: 'Nicholas Marchesi', role: 'Creative Director', place: 'National' },
          ],
          nodes: [
            {
              state: 'QLD',
              nodeId: NODE_IDS.QLD,
              leadOrg: 'Palm Island Community Company (PICC)',
              leadOrgId: PICC_ORG_ID,
              location: 'Palm Island & Townsville',
              traditionalOwners: 'Bwgcolman & Manbarra People',
              keyPeople: [
                { profileId: PROFILE_IDS.patricia_miller, name: 'Patricia Ann Miller', role: 'Community Elder' },
                { profileId: PROFILE_IDS.uncle_dale, name: 'Uncle Dale', role: 'Cultural Advisor' },
                { profileId: PROFILE_IDS.brodie_germaine, name: 'Brodie Germaine', role: 'Youth Voice' },
                { profileId: PROFILE_IDS.chelsea_rolfe, name: 'Chelsea Rolfe', role: 'Communications' },
              ],
            },
            {
              state: 'NT',
              nodeId: NODE_IDS.NT,
              leadOrg: 'Oonchiumpa',
              leadOrgId: OONCHIUMPA_ORG_ID,
              location: 'Alice Springs (Mparntwe)',
              traditionalOwners: 'Arrernte People',
              keyPeople: [
                { profileId: PROFILE_IDS.kristy_bloomfield, name: 'Kristy Bloomfield', role: 'CEO' },
                { profileId: PROFILE_IDS.tanya_turner, name: 'Tanya Turner', role: 'Director' },
              ],
            },
            {
              state: 'NSW',
              nodeId: NODE_IDS.NSW,
              leadOrg: 'Mounty Yarns / Just Reinvest NSW',
              leadOrgId: MOUNTY_ORG_ID,
              location: 'Mount Druitt',
              traditionalOwners: 'Darug People',
              keyPeople: [], // Youth ambassadors - to be added
            },
          ],
          internationalPartners: [
            { profileId: PROFILE_IDS.kate_bjur, name: 'Kate Bjur', role: 'Diagrama Foundation', country: 'Spain' },
          ],
          nationalAdvisors: [
            { profileId: PROFILE_IDS.olga_havnen, name: 'Olga Havnen', role: 'Policy Advisor' },
          ],
        },

        // Update key people to reflect structure
        keyPeople: [
          // Core Team (National)
          { profileId: PROFILE_IDS.benjamin_knight, name: 'Benjamin Knight', role: 'Research Director', node: 'National', featured: true },
          { profileId: PROFILE_IDS.nick_marchesi, name: 'Nicholas Marchesi', role: 'Creative Director', node: 'National', featured: true },
          // NT Node
          { profileId: PROFILE_IDS.kristy_bloomfield, name: 'Kristy Bloomfield', role: 'CEO, Oonchiumpa', node: 'NT', featured: true },
          { profileId: PROFILE_IDS.tanya_turner, name: 'Tanya Turner', role: 'Director, Oonchiumpa', node: 'NT', featured: true },
          // QLD Node
          { profileId: PROFILE_IDS.patricia_miller, name: 'Patricia Ann Miller', role: 'Community Elder', node: 'QLD', featured: true },
          { profileId: PROFILE_IDS.uncle_dale, name: 'Uncle Dale', role: 'Cultural Advisor', node: 'QLD', featured: true },
          { profileId: PROFILE_IDS.brodie_germaine, name: 'Brodie Germaine', role: 'Youth Voice', node: 'QLD' },
          { profileId: PROFILE_IDS.chelsea_rolfe, name: 'Chelsea Rolfe', role: 'Communications', node: 'QLD' },
          // International
          { profileId: PROFILE_IDS.kate_bjur, name: 'Kate Bjur', role: 'Diagrama Foundation', node: 'International' },
          { profileId: PROFILE_IDS.olga_havnen, name: 'Olga Havnen', role: 'Policy Advisor', node: 'National' },
        ],
      },
    };

    const { error } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', COE_ORG_ID);

    if (error) {
      console.log(`   ✗ Error updating CoE settings: ${error.message}`);
    } else {
      console.log('   ✓ Centre of Excellence structure updated');
    }
  }

  // ============================================
  // 4. Update partner organization settings with their key people
  // ============================================
  console.log('\n4. Updating partner organization key people...\n');

  // Update Oonchiumpa
  const { data: oonchiumpa } = await supabase.from('organizations').select('settings').eq('id', OONCHIUMPA_ORG_ID).single();
  if (oonchiumpa?.settings) {
    const updatedOonchiumpa = {
      ...oonchiumpa.settings,
      partner: {
        ...oonchiumpa.settings.partner,
        keyPeople: [
          { profileId: PROFILE_IDS.kristy_bloomfield, name: 'Kristy Bloomfield', role: 'CEO & Co-Founder', featured: true },
          { profileId: PROFILE_IDS.tanya_turner, name: 'Tanya Turner', role: 'Director & Co-Founder', featured: true },
        ],
        leadership: {
          ceo: { profileId: PROFILE_IDS.kristy_bloomfield, name: 'Kristy Bloomfield', background: 'Arrernte woman' },
          director: { profileId: PROFILE_IDS.tanya_turner, name: 'Tanya Turner', background: 'Warlpiri, Luritja and Arrernte woman' },
        },
      },
    };
    await supabase.from('organizations').update({ settings: updatedOonchiumpa }).eq('id', OONCHIUMPA_ORG_ID);
    console.log('   ✓ Oonchiumpa key people updated');
  }

  // Update PICC
  const { data: picc } = await supabase.from('organizations').select('settings').eq('id', PICC_ORG_ID).single();
  if (picc?.settings) {
    const updatedPicc = {
      ...picc.settings,
      partner: {
        ...picc.settings.partner,
        keyPeople: [
          { profileId: PROFILE_IDS.patricia_miller, name: 'Patricia Ann Miller', role: 'Community Elder', featured: true },
          { profileId: PROFILE_IDS.uncle_dale, name: 'Uncle Dale', role: 'Elder & Cultural Advisor', featured: true },
          { profileId: PROFILE_IDS.brodie_germaine, name: 'Brodie Germaine', role: 'Youth Voice Coordinator' },
          { profileId: PROFILE_IDS.chelsea_rolfe, name: 'Chelsea Rolfe', role: 'Communications Lead' },
        ],
      },
    };
    await supabase.from('organizations').update({ settings: updatedPicc }).eq('id', PICC_ORG_ID);
    console.log('   ✓ PICC key people updated');
  }

  // ============================================
  // 5. Summary
  // ============================================
  console.log('\n' + '═'.repeat(60));
  console.log('✅ REORGANIZATION COMPLETE');
  console.log('═'.repeat(60));

  console.log('\nNew Structure:');
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│  CENTRE OF EXCELLENCE (National Umbrella)                   │
│  Research Director: Benjamin Knight                         │
│  Creative Director: Nicholas Marchesi                       │
│  Policy Advisor: Olga Havnen                                │
│  International: Kate Bjur (Diagrama, Spain)                 │
└─────────────────────────────────────────────────────────────┘
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
      ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  QLD NODE     │   │  NT NODE      │   │  NSW NODE     │
│  (PICC)       │   │  (Oonchiumpa) │   │  (Mounty)     │
│               │   │               │   │               │
│ Palm Island   │   │ Alice Springs │   │ Mount Druitt  │
│ & Townsville  │   │ (Mparntwe)    │   │ (Darug)       │
│               │   │               │   │               │
│ Patricia Ann  │   │ Kristy        │   │ Youth         │
│ Uncle Dale    │   │ Bloomfield    │   │ Ambassadors   │
│ Brodie        │   │ Tanya Turner  │   │               │
│ Chelsea       │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
`);

  // Verify
  const { data: people } = await supabase
    .from('coe_key_people')
    .select('role_title, expertise_area, display_order')
    .order('display_order');

  console.log('\nKey People (updated roles):');
  people?.forEach((p) => {
    console.log(`  ${p.display_order}. ${p.role_title} - ${p.expertise_area}`);
  });
}

reorganize().catch(console.error);
