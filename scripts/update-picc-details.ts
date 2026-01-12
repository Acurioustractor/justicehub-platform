import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
);

async function updatePICCDetails() {
  console.log('Updating Palm Island Community Company details...\n');

  // 1. Update PICC organization with comprehensive details
  const piccDescription = `Palm Island Community Company (PICC) is a community-controlled organisation with 197 staff across 16+ services, achieving full community control in 2021. Led by CEO Wayne Connolly and the Board, PICC represents Palm Island community's successful transition to self-determination.

PICC provides comprehensive services including health, family support, community services, and cultural programs. Their leadership in Indigenous community control makes them a model for other communities across Australia.

Key initiatives include:
• Indigenous Data Sovereignty - Community-controlled storytelling and reporting
• The PICC Station Precinct - A 30-year lease site in Townsville being transformed into a regional hub for youth justice, circular economy manufacturing, and training pathways
• Hull River History Project - Documenting connection to traditional lands and elder knowledge
• Storm Response 2024 - Community-led disaster response demonstrating effective self-determination

PICC is partnering with JusticeHub to support place-based youth justice reform in Queensland, focusing on diversionary programs, cultural connection, and real alternatives to detention.`;

  const piccUpdate = await supabase
    .from('organizations')
    .update({
      description: piccDescription,
      location: 'Palm Island & Townsville, QLD',
      website: 'https://www.palmisland.qld.gov.au/picc',
      type: 'community'
    })
    .eq('name', 'Palm Island Community Company');

  if (piccUpdate.error) {
    console.error('Error updating PICC:', piccUpdate.error.message);
  } else {
    console.log('✓ Updated Palm Island Community Company organization details');
  }

  // 2. Update the Queensland node with richer description
  const qldNodeDescription = `Supporting place-based youth justice reform in Queensland, led by Palm Island Community Company (PICC).

PICC is a community-controlled organisation with 197 staff across 16+ services serving Palm Island and the Townsville region. Their 30-year lease of the PICC Station Precinct in Townsville is being transformed into a regional hub combining:

• Youth Justice Pathways - Diversionary programs in partnership with Diagrama, offering real alternatives to detention through cultural connection, land-based learning, and skills training
• Circular Economy Manufacturing - GOODS Workshop producing recycled-plastic bed bases and refurbishing appliances
• Training & Accommodation - Commercial kitchen reactivation, hospitality training, and short-stay accommodation

The vision: Young people from Palm Island and the region can access transformative programs that connect them to culture, land, and meaningful futures - reducing re-offending through healing rather than punishment.

Traditional Owners: Manbarra people`;

  const qldUpdate = await supabase
    .from('justicehub_nodes')
    .update({
      description: qldNodeDescription
    })
    .eq('state_code', 'QLD');

  if (qldUpdate.error) {
    console.error('Error updating QLD node:', qldUpdate.error.message);
  } else {
    console.log('✓ Updated Queensland node description');
  }

  console.log('\n✅ PICC details updated successfully!');

  // Verify the update
  const { data: org } = await supabase
    .from('organizations')
    .select('name, description, location')
    .eq('name', 'Palm Island Community Company')
    .single();

  console.log('\nVerification:');
  console.log('Organization:', org?.name);
  console.log('Location:', org?.location);
  console.log('Description preview:', org?.description?.substring(0, 150) + '...');
}

updatePICCDetails().catch(console.error);
