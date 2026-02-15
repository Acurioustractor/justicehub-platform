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

// Fixed UUID for Centre of Excellence
const COE_ORG_ID = '11111111-1111-1111-1111-111111111000';

// Key people profile IDs (from coe_key_people)
const KEY_PEOPLE = {
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

// Empathy Ledger references (stories from partner orgs)
const LINKED_STORIES = {
  hull_river: '86238687-772e-4e21-a555-9f2360d2e7ab',
  palm_island_storm: '68bf8048-eafd-4d0c-9d61-4182a4883c85',
  cyclone_kirrily: 'd6e6e97e-0a85-49b3-92e9-f0d2d65a43bc',
};

async function createCentreOfExcellence() {
  console.log('🏛️  Creating Centre of Excellence organization profile...\n');

  // ============================================
  // 1. Create the Organization
  // ============================================
  const coeDescription = `The Centre of Excellence in Youth Justice Reform is the national coordinating body for JusticeHub - bringing together researchers, practitioners, Indigenous leaders, and young people with lived experience to transform how Australia responds to youth in crisis.

**Our Purpose:**
We exist to end the over-incarceration of children, particularly Aboriginal and Torres Strait Islander young people. Through research, advocacy, and community-led innovation, we're building a future where support replaces punishment.

**What We Do:**
• **Research & Evidence**: Curating 67+ international best-practice programs, tracking what works globally
• **Community Partnerships**: Supporting community-controlled organizations (PICC, Oonchiumpa, Mounty Yarns) to lead local transformation
• **Policy Translation**: Converting lived experience and community wisdom into policy recommendations
• **Storytelling**: Amplifying youth voices through Empathy Ledger - because stories change minds

**Our Network:**
The Centre coordinates JusticeHub nodes across every state and territory, connecting local action to national change. We're not just documenting the problem - we're demonstrating solutions.

"If one child is one too many, then 600+ children in detention on any given night is a national emergency we can no longer ignore."`;

  const coeOrg = {
    id: COE_ORG_ID,
    name: 'Centre of Excellence in Youth Justice Reform',
    slug: 'centre-of-excellence',
    type: 'nonprofit',
    description: coeDescription,
    location: 'National (Coordinating from Brisbane, QLD)',
    website: 'https://justicehub.org.au',
    email: 'hello@justicehub.org.au',
    verification_status: 'verified',
    is_active: true,
    tags: ['youth-justice', 'research', 'advocacy', 'indigenous-led', 'community-controlled', 'policy'],
    settings: {
      partner: {
        // Videos
        videos: [
          {
            title: 'JusticeHub Launch 2026',
            description: 'The national launch of JusticeHub - a platform for youth justice transformation',
            url: 'https://justicehub.org.au/launch',
            type: 'event',
            featured: true,
          },
        ],

        // Mission, Vision, Values
        goals: [
          {
            type: 'mission',
            title: 'End Over-Incarceration',
            description: 'Working to end the over-incarceration of children in Australia, with a particular focus on Aboriginal and Torres Strait Islander young people who are 17x more likely to be detained.',
            icon: 'shield-off',
          },
          {
            type: 'vision',
            title: 'Community-Led Solutions',
            description: 'A future where communities design and deliver the support their young people need - where cultural strength is recognized as protective, not deficient.',
            icon: 'users',
          },
          {
            type: 'value',
            title: 'Nothing About Us Without Us',
            description: 'Young people with lived experience and Aboriginal community-controlled organizations lead our work. Research serves community, not the other way around.',
            icon: 'heart-handshake',
          },
          {
            type: 'value',
            title: 'Evidence + Wisdom',
            description: 'Combining rigorous research with cultural knowledge and lived experience. The best evidence includes the voices that have been systematically excluded.',
            icon: 'book-open',
          },
          {
            type: 'principle',
            title: 'Radical Transparency',
            description: 'Publishing our data, methods, and learnings openly. If the system hides in shadows, we shine light.',
            icon: 'sun',
          },
        ],

        // Impact Metrics
        impact: [
          { name: 'International Programs Documented', value: '67+', context: 'best practice models researched', icon: 'globe' },
          { name: 'Community Partners', value: '3', context: 'Aboriginal community-controlled organizations', icon: 'handshake' },
          { name: 'JusticeHub Nodes', value: '9', context: 'state/territory networks forming', icon: 'network' },
          { name: 'Key People', value: '10', context: 'researchers, practitioners, lived experience', icon: 'users' },
          { name: 'Stories Collected', value: '200+', context: 'in Empathy Ledger platform', icon: 'book' },
          { name: 'Youth Detention Target', value: 'Zero', context: 'children in adult-style detention', icon: 'target' },
        ],

        // Contacts
        contacts: [
          { type: 'website', label: 'JusticeHub Platform', value: 'https://justicehub.org.au', primary: true },
          { type: 'email', label: 'General Inquiries', value: 'hello@justicehub.org.au' },
          { type: 'website', label: 'Empathy Ledger', value: 'https://empathyledger.org' },
          { type: 'website', label: 'A Curious Tractor', value: 'https://act.place' },
        ],

        // Key People (references to coe_key_people profiles)
        keyPeople: [
          { profileId: KEY_PEOPLE.benjamin_knight, name: 'Benjamin Knight', role: 'Co-Founder & Research Director', expertise: 'Youth Justice Research', featured: true },
          { profileId: KEY_PEOPLE.nick_marchesi, name: 'Nicholas Marchesi', role: 'Co-Founder & Creative Director', expertise: 'Immersive Experience Design', featured: true },
          { profileId: KEY_PEOPLE.patricia_miller, name: 'Patricia Ann Miller', role: 'Indigenous Advisory Lead', expertise: 'Indigenous Youth Advocacy', featured: true },
          { profileId: KEY_PEOPLE.uncle_dale, name: 'Uncle Dale', role: 'Elder & Cultural Advisor', expertise: 'Cultural Governance', featured: true },
          { profileId: KEY_PEOPLE.kristy_bloomfield, name: 'Kristy Bloomfield', role: 'Program Development Lead', expertise: 'Youth Program Design', featured: true },
          { profileId: KEY_PEOPLE.tanya_turner, name: 'Tanya Turner', role: 'Community Partnerships Director', expertise: 'Community Engagement' },
          { profileId: KEY_PEOPLE.olga_havnen, name: 'Olga Havnen', role: 'Policy Advisor', expertise: 'Indigenous Policy' },
          { profileId: KEY_PEOPLE.kate_bjur, name: 'Kate Bjur', role: 'Practice Lead', expertise: 'Evidence-Based Practice' },
          { profileId: KEY_PEOPLE.brodie_germaine, name: 'Brodie Germaine', role: 'Youth Voice Coordinator', expertise: 'Lived Experience Advocacy' },
          { profileId: KEY_PEOPLE.chelsea_rolfe, name: 'Chelsea Rolfe', role: 'Communications Lead', expertise: 'Strategic Communications' },
        ],

        // Linked Stories (from Empathy Ledger)
        linkedStories: [
          { empathyLedgerId: LINKED_STORIES.hull_river, title: 'Hull River History', type: 'documentary', partner: 'PICC' },
          { empathyLedgerId: LINKED_STORIES.palm_island_storm, title: 'Palm Island Storm Stories', type: 'interview', partner: 'PICC' },
          { empathyLedgerId: LINKED_STORIES.cyclone_kirrily, title: 'Cyclone Kirrily Recovery', type: 'documentary', partner: 'PICC' },
        ],

        // Partner Organizations
        partnerOrganizations: [
          { id: '11111111-1111-1111-1111-111111111001', name: 'Palm Island Community Company (PICC)', state: 'QLD', role: 'Community Partner' },
          { id: '5f038d59-9bf2-439b-b018-249790dfb41b', name: 'Oonchiumpa', state: 'NT', role: 'Community Partner' },
          { id: '11111111-1111-1111-1111-111111111003', name: 'Mounty Yarns', state: 'NSW', role: 'Community Partner' },
        ],

        // Outcomes Framework
        outcomes: {
          shortTerm: [
            { outcome: 'Increased awareness of youth justice crisis', indicator: 'Media coverage, website traffic', status: 'achieved' },
            { outcome: 'Community partnerships established', indicator: '3 Aboriginal community-controlled partners', status: 'achieved' },
            { outcome: 'International best practices documented', indicator: '67+ programs researched', status: 'achieved' },
          ],
          mediumTerm: [
            { outcome: 'JusticeHub nodes active in all states', indicator: '9 state/territory networks', status: 'in_progress' },
            { outcome: 'Policy recommendations adopted', indicator: 'State government engagement', status: 'in_progress' },
            { outcome: 'Youth voices amplified in policy', indicator: 'Lived experience in submissions', status: 'in_progress' },
          ],
          longTerm: [
            { outcome: 'Reduction in youth detention rates', indicator: 'AIHW detention data', status: 'target' },
            { outcome: 'Increased community-controlled alternatives', indicator: 'Funding to ACCOs', status: 'target' },
            { outcome: 'Raise the age to 14 nationally', indicator: 'Legislative change', status: 'target' },
            { outcome: 'Close youth prisons', indicator: 'Facility closures, therapeutic alternatives', status: 'target' },
          ],
        },

        // Theory of Change
        theoryOfChange: {
          problem: 'Australia locks up more children than comparable nations, with Aboriginal children 17x over-represented. Youth detention causes harm and increases reoffending.',
          approach: 'By connecting community-led solutions with evidence, amplifying lived experience through storytelling, and coordinating national advocacy, we can shift policy and practice.',
          change: 'When communities control the response to their young people, when culture is recognized as protective, and when we invest in support not punishment - young people thrive.',
        },

        // Research Focus Areas
        researchAreas: [
          { name: 'Raise the Age', description: 'Evidence for increasing minimum age of criminal responsibility to 14' },
          { name: 'Alternatives to Detention', description: 'What works: therapeutic models, community supervision, on-country programs' },
          { name: 'First Nations Leadership', description: 'Self-determination in youth justice - community-controlled solutions' },
          { name: 'Lived Experience', description: 'Centering the voices of young people who have been through the system' },
          { name: 'International Comparison', description: 'Learning from global best practice - Missouri Model, Scandinavian approaches' },
        ],

        // Quotes
        quotes: [
          { text: 'If one child is one too many, then 600+ children in detention on any given night is a national emergency.', author: 'Centre of Excellence' },
          { text: 'The best evidence includes the voices that have been systematically excluded.', author: 'Research Principle' },
          { text: 'We\'re not just documenting the problem - we\'re demonstrating solutions.', author: 'Strategic Vision' },
        ],
      },
    },
  };

  // Upsert the organization
  const { error: orgErr } = await supabase
    .from('organizations')
    .upsert(coeOrg, { onConflict: 'id' });

  if (orgErr) {
    console.error('Error creating CoE org:', orgErr.message);
  } else {
    console.log('✓ Centre of Excellence organization created');
  }

  // ============================================
  // 2. Create/Update National Node
  // ============================================
  console.log('\n🌏 Linking to national JusticeHub node...');

  // First check if national node exists
  const { data: existingNode } = await supabase
    .from('justicehub_nodes')
    .select('*')
    .eq('node_type', 'national')
    .single();

  if (existingNode) {
    // Update existing
    const { error: nodeErr } = await supabase
      .from('justicehub_nodes')
      .update({
        lead_organization_id: COE_ORG_ID,
        description: `The national coordinating node for JusticeHub, led by the Centre of Excellence in Youth Justice Reform. Connecting state and territory networks to share evidence, stories, and strategies for ending youth over-incarceration.

Key Functions:
• Coordinate national research and evidence sharing
• Support community-controlled partner organizations
• Advocate for policy reform at federal level
• Amplify youth voices through Empathy Ledger platform
• Connect Australian practice with international best practice`,
        website_url: 'https://justicehub.org.au',
        contact_email: 'hello@justicehub.org.au',
        status: 'active',
      })
      .eq('id', existingNode.id);

    if (nodeErr) console.error('Error updating national node:', nodeErr.message);
    else console.log('✓ National node updated with Centre of Excellence');
  } else {
    // Create national node
    const { error: nodeErr } = await supabase
      .from('justicehub_nodes')
      .insert({
        name: 'JusticeHub National',
        node_type: 'national',
        country: 'Australia',
        lead_organization_id: COE_ORG_ID,
        description: `The national coordinating node for JusticeHub, led by the Centre of Excellence in Youth Justice Reform.`,
        website_url: 'https://justicehub.org.au',
        contact_email: 'hello@justicehub.org.au',
        status: 'active',
        latitude: -27.4698,
        longitude: 153.0251,
      });

    if (nodeErr) console.error('Error creating national node:', nodeErr.message);
    else console.log('✓ National node created with Centre of Excellence');
  }

  // ============================================
  // 3. Verify & Summary
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ Centre of Excellence setup complete!');
  console.log('='.repeat(60));

  // Get summary
  const { data: org } = await supabase
    .from('organizations')
    .select('name, settings')
    .eq('id', COE_ORG_ID)
    .single();

  const partner = org?.settings?.partner;
  console.log('\nCentre of Excellence Summary:');
  console.log(`  Name: ${org?.name}`);
  console.log(`  Goals: ${partner?.goals?.length || 0}`);
  console.log(`  Impact Metrics: ${partner?.impact?.length || 0}`);
  console.log(`  Key People: ${partner?.keyPeople?.length || 0}`);
  console.log(`  Contacts: ${partner?.contacts?.length || 0}`);
  console.log(`  Linked Stories: ${partner?.linkedStories?.length || 0}`);
  console.log(`  Partner Orgs: ${partner?.partnerOrganizations?.length || 0}`);
  console.log(`  Research Areas: ${partner?.researchAreas?.length || 0}`);
  console.log(`  Outcomes: ${(partner?.outcomes?.shortTerm?.length || 0) + (partner?.outcomes?.mediumTerm?.length || 0) + (partner?.outcomes?.longTerm?.length || 0)}`);

  // Get all nodes
  const { data: nodes } = await supabase
    .from('justicehub_nodes')
    .select('name, state_code, node_type, status, lead_organization_id')
    .order('name');

  console.log('\n\nJusticeHub Network:');
  nodes?.forEach(n => {
    const isCoE = n.lead_organization_id === COE_ORG_ID;
    console.log(`  ${n.name} [${n.status}]${isCoE ? ' ← Centre of Excellence' : ''}`);
  });
}

createCentreOfExcellence().catch(console.error);
