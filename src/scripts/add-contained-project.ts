/**
 * Add CONTAINED campaign as the first art/innovation project
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addContainedProject() {
  console.log('\n🎨 Adding CONTAINED to Art & Innovation Database\n');
  console.log('═══════════════════════════════════════════════════\n');

  // First, ensure the table exists by checking for it
  const { data: tables, error: tableError } = await supabase
    .from('art_innovation')
    .select('id')
    .limit(1);

  if (tableError) {
    console.log('❌ art_innovation table does not exist yet');
    console.log('\nPlease run this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log('File: supabase/migrations/20250122000002_create_art_innovation_table.sql\n');
    return;
  }

  console.log('✅ art_innovation table exists\n');

  // Check if CONTAINED already exists
  const { data: existing } = await supabase
    .from('art_innovation')
    .select('id')
    .eq('slug', 'contained')
    .single();

  if (existing) {
    console.log('⚠️  CONTAINED project already exists\n');
    console.log(`   ID: ${existing.id}\n`);
    console.log('View at: http://localhost:3003/art-innovation/contained\n');
    return;
  }

  // Create the CONTAINED project
  const containedData = {
    title: 'CONTAINED - A Curious Tractor',
    slug: 'contained',
    type: 'campaign',
    status: 'published',
    tagline: 'Join the CONTAINED campaign to build a more just and equitable system',
    description: 'CONTAINED is an immersive campaign experience that challenges systemic failures in youth justice. Through interactive installations, compelling stories, and evidence-based advocacy, we create pathways from awareness to action.',
    story: `Revolution doesn't happen in boardrooms. It happens when builders, dreamers, and survivors converge at the intersection of moral urgency and practical possibility.

Following paper trails that lead to kids in cages, transforming data into moral urgency. CONTAINED was built with hands, not just hearts - physically constructing transformation chambers, wiring electronics that make fluorescent despair tangible, embedding technology that bridges experience to action.

Every statistic represents a child whose future hangs in the balance. We can't unknow what we know about what works.`,
    impact: `CONTAINED creates immersive experiences that transform understanding into action. By making the invisible visible and the abstract tangible, we build infrastructure for transformation, not charity for problems.

The campaign bridges evidence to experience, policy to practice, and moral urgency to practical possibility.`,
    featured_image_url: null, // Add when available
    video_url: null, // Add when available
    gallery_images: [], // Add images when available
    creators: [
      {
        name: 'Benjamin Knight',
        role: 'Co-founder, A Curious Tractor - The Insomniac Calculator',
        bio: 'Following paper trails that lead to kids in cages, transforming data into moral urgency. The one who stood in Madrid\'s sunset-colored rooms and felt the weight of Australia\'s failure in his bones.',
        photo_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/benjamin-knight.jpg'
      },
      {
        name: 'Nicholas Marchesi',
        role: 'Co-founder, A Curious Tractor - The Hands That Built Revolution',
        bio: 'Strategic architect who transformed shipping containers into transformation chambers - personally constructing the majority of the rooms, wiring the electronics that make fluorescent despair tangible, embedding technology that bridges experience to action.',
        photo_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/nicholas-marchesi.jpg'
      }
    ],
    year: 2024,
    location: 'Australia',
    tags: [
      'campaign',
      'youth justice',
      'systems change',
      'immersive experience',
      'advocacy',
      'transformation',
      'evidence-based'
    ],
    website_url: '/contained',
    social_links: {},
    organization_id: null,
    program_id: null,
    is_featured: true,
    view_count: 0
  };

  const { data, error } = await supabase
    .from('art_innovation')
    .insert(containedData)
    .select()
    .single();

  if (error) {
    console.log('❌ Error adding CONTAINED project:');
    console.log(`   ${error.message}\n`);
    return;
  }

  console.log('✅ CONTAINED project added successfully!\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Project ID: ${data.id}`);
  console.log(`Title: ${data.title}`);
  console.log(`Type: ${data.type}`);
  console.log(`Slug: ${data.slug}`);
  console.log(`Featured: ${data.is_featured ? 'Yes' : 'No'}`);
  console.log(`Creators: ${data.creators.length}`);
  console.log(`Tags: ${data.tags.length}\n`);
  console.log('View Results:');
  console.log('  List: http://localhost:3003/art-innovation');
  console.log('  Detail: http://localhost:3003/art-innovation/contained\n');
}

addContainedProject().catch(console.error);
