import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
);

async function updateOonchiumpaDetails() {
  console.log('Updating Oonchiumpa details...\n');

  // 1. Update Oonchiumpa organization with comprehensive details
  const oonchiumpaDescription = `Oonchiumpa is an Aboriginal community-controlled organisation based in Alice Springs (Mparntwe), Central Australia. Led by Kristy Bloomfield and Tanya Turner, Oonchiumpa works across 7 language groups within a 150km radius of Alice Springs, partnering with 32+ organisations to support Aboriginal families and young people.

Key Programs:

**Youth Mentorship & Cultural Healing**
Supporting 21 young people with 90% retention rate and 95% school re-engagement through cultural mentorship, on-country experiences, basketball programs, and youth leadership development.

**True Justice: Deep Listening on Country**
In partnership with ANU since 2022, Oonchiumpa runs restorative justice and cultural healing programs including deep listening circles, cultural authority recognition, trauma-informed justice support, and community healing sessions.

**Atnarpa Homestead On-Country Experiences**
Cultural camps at Atnarpa Station providing traditional knowledge transmission, bush tucker and medicine programs, and intergenerational connection through on-country learning.

**Cultural Brokerage & Service Navigation**
Coordinating services across Central Australia with cultural interpretation, community advocacy, and partnership facilitation - helping families navigate complex systems while maintaining cultural protocols.

Oonchiumpa is partnering with JusticeHub to support place-based youth justice reform in the Northern Territory, demonstrating that community-controlled, culture-based approaches deliver better outcomes than mainstream interventions.`;

  // First find Oonchiumpa org
  const { data: oonchiOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Oonchiumpa')
    .single();

  if (oonchiOrg) {
    const oonchiumpaUpdate = await supabase
      .from('organizations')
      .update({
        description: oonchiumpaDescription,
        location: 'Alice Springs (Mparntwe), NT',
        website: 'https://oonchiumpa.com',
        type: 'community'
      })
      .eq('id', oonchiOrg.id);

    if (oonchiumpaUpdate.error) {
      console.error('Error updating Oonchiumpa org:', oonchiumpaUpdate.error.message);
    } else {
      console.log('✓ Updated Oonchiumpa organization details');
    }
  } else {
    console.log('✗ Oonchiumpa organization not found - creating...');
    const { error } = await supabase
      .from('organizations')
      .insert({
        name: 'Oonchiumpa',
        description: oonchiumpaDescription,
        location: 'Alice Springs (Mparntwe), NT',
        website: 'https://oonchiumpa.com',
        type: 'community'
      });

    if (error) {
      console.error('Error creating Oonchiumpa:', error.message);
    } else {
      console.log('✓ Created Oonchiumpa organization');
    }
  }

  // 2. Update the NT node with richer description
  const ntNodeDescription = `Supporting place-based youth justice reform in the Northern Territory, led by Oonchiumpa in Alice Springs (Mparntwe).

Oonchiumpa is an Aboriginal community-controlled organisation led by Kristy Bloomfield and Tanya Turner, working across 7 language groups within a 150km radius of Alice Springs. With 32+ partner organisations, they demonstrate that culture-based, community-controlled approaches deliver better outcomes for young people.

**Key Programs:**
• Youth Mentorship - Supporting 21 young people with 90% retention and 95% school re-engagement
• True Justice - Deep listening on country in partnership with ANU since 2022
• Atnarpa Homestead - On-country cultural camps for intergenerational healing
• Cultural Brokerage - Helping families navigate systems while maintaining cultural protocols

Oonchiumpa's approach: Community-led, trauma-informed, strengths-based evaluation that respects cultural sovereignty and focuses on holistic wellbeing - physical, emotional, social, spiritual, and cultural health.

Traditional Owners: Arrernte people`;

  const ntUpdate = await supabase
    .from('justicehub_nodes')
    .update({
      description: ntNodeDescription
    })
    .eq('state_code', 'NT');

  if (ntUpdate.error) {
    console.error('Error updating NT node:', ntUpdate.error.message);
  } else {
    console.log('✓ Updated Northern Territory node description');
  }

  console.log('\n✅ Oonchiumpa details updated successfully!');

  // Verify the update
  const { data: org } = await supabase
    .from('organizations')
    .select('name, description, location, website')
    .eq('name', 'Oonchiumpa')
    .single();

  console.log('\nVerification:');
  console.log('Organization:', org?.name);
  console.log('Location:', org?.location);
  console.log('Website:', org?.website);
  console.log('Description preview:', org?.description?.substring(0, 150) + '...');
}

updateOonchiumpaDetails().catch(console.error);
