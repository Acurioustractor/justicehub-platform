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

async function updateMountyYarnsDetails() {
  console.log('Updating Mounty Yarns details...\n');

  // 1. Update Mounty Yarns organization with comprehensive details
  const mountyDescription = `Mounty Yarns is a youth-led initiative in Mount Druitt, Western Sydney, on Darug Country. Operating through Just Reinvest NSW, Mounty Yarns amplifies lived-experience stories and collective solutions shared by Aboriginal young people to create a safer, fairer future for their community.

"Home. It brings everyone together. We're all from different places, but close. Mount Druitt is home for a lot of us—non-Indigenous people and Indigenous people. It's really diverse." — Isaiah

**The Need:**
Before the space existed, young people didn't have somewhere safe to go. They needed "a safe place where young Black lives can hang around and not be seen as consorting, like criminals or up to no good all the time."

**The Backyard Campus:**
The site is being transformed into a youth-led campus with distinct zones designed by young people themselves:
• Yarning Circle & Fire Pit — The heart of the space for gathering, storytelling, and cultural connection
• Aboriginal Flag — Ownership markers that say "this is a place with cultural governance and pride"
• Workshop Container — Secure storage and program space
• Privacy Screening — Creating safety zones where kids "don't feel judged by anyone"
• Half Court — Basketball for the kids
• Garden — Growing food to cook and feed the community

**Why Youth Must Lead:**
"This is for the kids… without the input, we didn't know what they want. They're showing them that sometimes you can't get everything handed to you… realistically, you're gonna have to do it yourself." — Archie

**From one person to a team of 20 in three years.** Youth ambassadors spoke to funders and politicians who "were blown away by the young people saying something that had never been said before."

Mounty Yarns partners with JusticeHub to demonstrate that community-led, youth-designed approaches create real alternatives to the justice system.`;

  // Update the Mounty Yarns organization
  const { error: mountyError } = await supabase
    .from('organizations')
    .update({
      description: mountyDescription,
      location: 'Mount Druitt, NSW (Darug Country)',
      type: 'community'
    })
    .eq('id', '11111111-1111-1111-1111-111111111003');

  if (mountyError) {
    console.error('Error updating Mounty Yarns org:', mountyError.message);
  } else {
    console.log('✓ Updated Mounty Yarns organization details');
  }

  // 2. Update the NSW node with richer description
  const nswNodeDescription = `Supporting place-based youth justice reform in New South Wales, led by Mounty Yarns in Mount Druitt (Darug Country).

Mounty Yarns is a youth-led initiative amplifying lived-experience stories and collective solutions shared by Aboriginal young people to create a safer, fairer future. Operating through Just Reinvest NSW, they've grown from one person to a team of 20 in three years.

**What They're Building:**
A backyard campus designed by young people themselves — not just an "improvement project" but infrastructure for belonging. Features include:
• Yarning Circle & Fire Pit — The heart of the space for storytelling
• Workshop containers and privacy screening
• Basketball court and community garden
• Aboriginal Flag as an ownership marker

**Their Approach:**
"This is for the kids… without the input, we didn't know what they want." Youth ownership is built through effort and contribution. Funders aren't just paying for outputs — they're paying for a place young people can claim.

**What Success Feels Like:**
"I can express myself, I can be myself around these people… You just don't need to feel judged by anyone." — Polly

"It's almost like a second home. Even a first home for some kids. They can actually come here and just be themselves, express their feelings, or they can just be kids."

Traditional Owners: Darug people`;

  const nswUpdate = await supabase
    .from('justicehub_nodes')
    .update({
      description: nswNodeDescription
    })
    .eq('state_code', 'NSW');

  if (nswUpdate.error) {
    console.error('Error updating NSW node:', nswUpdate.error.message);
  } else {
    console.log('✓ Updated New South Wales node description');
  }

  console.log('\n✅ Mounty Yarns details updated successfully!');

  // Verify the update
  const { data: org } = await supabase
    .from('organizations')
    .select('name, description, location')
    .eq('id', '11111111-1111-1111-1111-111111111003')
    .single();

  console.log('\nVerification:');
  console.log('Organization:', org?.name);
  console.log('Location:', org?.location);
  console.log('Description preview:', org?.description?.substring(0, 150) + '...');
}

updateMountyYarnsDetails().catch(console.error);
