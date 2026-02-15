/**
 * Setup art_innovation table and add CONTAINED project
 * This combines migration + data insertion in one step
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupArtInnovation() {
  console.log('\n🎨 Setting Up Art & Innovation System\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Step 1: Check if table exists
  console.log('Step 1: Checking if art_innovation table exists...');

  const { data: existingTable, error: checkError } = await supabase
    .from('art_innovation')
    .select('id')
    .limit(1);

  if (checkError && checkError.message.includes('relation "art_innovation" does not exist')) {
    console.log('❌ Table does not exist\n');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('MANUAL STEP REQUIRED:\n');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Run the migration file:');
    console.log('   supabase/migrations/20250122000002_create_art_innovation_table.sql');
    console.log('3. Then run this script again\n');
    console.log('═══════════════════════════════════════════════════\n');
    return { needsMigration: true };
  }

  console.log('✅ Table exists\n');

  // Step 2: Check if CONTAINED already exists
  console.log('Step 2: Checking if CONTAINED project exists...');

  const { data: existing } = await supabase
    .from('art_innovation')
    .select('id, title, slug')
    .eq('slug', 'contained')
    .maybeSingle();

  if (existing) {
    console.log('✅ CONTAINED project already exists\n');
    console.log(`   ID: ${existing.id}`);
    console.log(`   Title: ${existing.title}\n`);
    console.log('View at:');
    console.log('  List: http://localhost:3003/art-innovation');
    console.log(`  Detail: http://localhost:3003/art-innovation/${existing.slug}\n`);
    return { alreadyExists: true, data: existing };
  }

  console.log('⚪ CONTAINED project does not exist yet\n');

  // Step 3: Create CONTAINED project
  console.log('Step 3: Creating CONTAINED project...\n');

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
    featured_image_url: null,
    video_url: null,
    gallery_images: [],
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

  console.log('Attempting insert...\n');

  const response = await supabase
    .from('art_innovation')
    .insert(containedData)
    .select()
    .single();

  console.log('Response received:');
  console.log(`  data: ${response.data ? 'exists' : 'null'}`);
  console.log(`  error: ${response.error ? 'exists' : 'null'}`);
  console.log(`  status: ${response.status}`);
  console.log(`  statusText: ${response.statusText}\n`);

  const { data, error } = response;

  if (error) {
    console.log('❌ Error creating CONTAINED project:');
    console.log(`   Message: ${error.message || 'undefined'}\n`);
    console.log(`   Code: ${error.code || 'undefined'}`);
    console.log(`   Details: ${JSON.stringify(error.details || {}, null, 2)}`);
    console.log(`   Hint: ${error.hint || 'none'}`);
    console.log(`   Full error: ${JSON.stringify(error, null, 2)}\n`);
    return { error };
  }

  console.log('✅ CONTAINED project created successfully!\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Project Details:');
  console.log(`  ID: ${data.id}`);
  console.log(`  Title: ${data.title}`);
  console.log(`  Type: ${data.type}`);
  console.log(`  Slug: ${data.slug}`);
  console.log(`  Featured: ${data.is_featured ? 'Yes' : 'No'}`);
  console.log(`  Creators: ${data.creators.length}`);
  console.log(`  Tags: ${data.tags.length}\n`);
  console.log('View Results:');
  console.log('  List: http://localhost:3003/art-innovation');
  console.log('  Detail: http://localhost:3003/art-innovation/contained\n');
  console.log('═══════════════════════════════════════════════════\n');

  return { success: true, data };
}

setupArtInnovation()
  .then((result) => {
    if (result.success) {
      console.log('🎉 Setup complete! CONTAINED is now in the database.\n');
    }
  })
  .catch(console.error);
