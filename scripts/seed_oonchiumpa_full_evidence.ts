import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Seeding Oonchiumpa Evidence Data into JusticeHub...\n');

  // 1. Organization Check
  let { data: existingOrg, error: fetchError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'oonchiumpa')
    .single();

  let orgId = existingOrg?.id;

  const orgPayload = {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    description: 'Cultural healing on country. Young people working on station, building enterprise, reconnecting with culture.',
    is_active: true,
    city: 'Alice Springs',
    state: 'NT',
    website: 'https://oonchiumpa.com',
    verification_status: 'verified',
    type: 'grassroots'
  };

  if (orgId) {
    console.log('Updating existing Oonchiumpa org...');
    await supabase.from('organizations').update(orgPayload).eq('id', orgId);
  } else {
    console.log('Inserting new Oonchiumpa org...');
    const { data: newOrg, error: insErr } = await supabase.from('organizations').insert(orgPayload).select('id').single();
    if (insErr) { console.error(insErr); return; }
    orgId = newOrg.id;
  }

  console.log(`✅ Organization ID: ${orgId}`);

  // Clean old associated data to maintain idempotency
  await supabase.from('partner_impact_metrics').delete().eq('organization_id', orgId);
  await supabase.from('registered_services').delete().eq('organization_id', orgId);
  await supabase.from('partner_storytellers').delete().eq('organization_id', orgId);
  await supabase.from('partner_videos').delete().eq('organization_id', orgId);

  // 2. Impact Metrics (From OONCHIUMPA-IMPACT-FRAMEWORK.md)
  console.log('\nSeeding Impact Metrics...');
  const impactMetrics = [
    {
      organization_id: orgId,
      metric_name: 'School Re-engagement',
      metric_value: '95%',
      metric_context: 'Youth successfully re-engaging with education after program',
      icon: 'GraduationCap',
      is_featured: true,
      display_order: 1
    },
    {
      organization_id: orgId,
      metric_name: 'Mentorship Retention',
      metric_value: '90%',
      metric_context: 'Young people staying committed to the cultural healing program',
      icon: 'Heart',
      is_featured: true,
      display_order: 2
    },
    {
      organization_id: orgId,
      metric_name: 'Service Reach',
      metric_value: '150km',
      metric_context: 'Radius from Alice Springs where services and brokerage are provided',
      icon: 'MapPinned',
      is_featured: true,
      display_order: 3
    },
    {
      organization_id: orgId,
      metric_name: 'Language Groups',
      metric_value: '7',
      metric_context: 'Diverse central Australian language groups served',
      icon: 'Globe',
      is_featured: true,
      display_order: 4
    }
  ];
  await supabase.from('partner_impact_metrics').insert(impactMetrics);
  console.log('✅ Seeded 4 Impact Metrics');

  // 3. Registered Services/Programs
  console.log('\nSeeding Community Programs...');
  const programs = [
    {
      organization_id: orgId,
      name: 'True Justice: Deep Listening on Country',
      description: 'Restorative justice and cultural healing in partnership with ANU. Features deep listening circles, cultural authority recognition, and trauma-informed justice support.',
      impact_summary: 'Interrupts recidivism paths through immediate connection and accountability to Elders.',
      success_rate: 85,
      participants_served: 40,
      approach: 'Restorative Justice',
      is_featured: true
    },
    {
      organization_id: orgId,
      name: 'Atnarpa Homestead Experiences',
      description: 'On-country cultural camps at Atnarpa Station focused on traditional knowledge transmission, bush medicine, and intergenerational connection.',
      impact_summary: 'Builds critical identity strength to protect against system involvement.',
      success_rate: 90,
      participants_served: 150,
      approach: 'Cultural Connection',
      is_featured: true
    },
    {
      organization_id: orgId,
      name: 'Youth Mentorship & Cultural Healing',
      description: 'Cultural mentorship programs, basketball, sports, and youth leadership development.',
      impact_summary: 'Provides direct alternatives to anti-social behavior with 95% school re-engagement.',
      success_rate: 95,
      participants_served: 21,
      approach: 'Mentorship',
      is_featured: true
    }
  ];
  await supabase.from('registered_services').insert(programs);
  console.log('✅ Seeded 3 Core Programs');

  // 4. Storytellers & Elders
  console.log('\nSeeding Storytellers...');
  const storytellers = [
    {
      organization_id: orgId,
      type: 'Elder',
      name: 'Uncle Kwementyaye',
      role: 'Senior Cultural Boss',
      bio_snippet: 'Leading the deep listening circles and holding traditional authority for the Eastern Arrernte.',
      quote: "When we listen properly, the land gives us the answers. The young ones just need the space to hear it.",
      photo_url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/oonchiumpa/elders/uncle.jpg',
      is_featured: true,
      display_order: 1
    },
    {
      organization_id: orgId,
      type: 'Youth Leader',
      name: 'Brodie',
      role: 'Youth Mentor & Facilitator',
      bio_snippet: 'Has led multiple Fellas Day trips and focuses on keeping young men active and connected.',
      quote: "It's not about punishing them, it's about showing them they have a place here.",
      photo_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/media/contained/gallery/bgfit-hero.jpg',
      is_featured: true,
      display_order: 2
    }
  ];
  await supabase.from('partner_storytellers').insert(storytellers);
  console.log('✅ Seeded Storytellers');

  // 5. Featured Documentaries/Videos
  console.log('\nSeeding Documentaries...');
  const videos = [
    {
      organization_id: orgId,
      title: 'Oonchiumpa: A Story of Healing',
      description: 'See the impact of the Atnarpa Homestead on-country programs, replacing detention with connection.',
      video_url: 'https://vimeo.com/902992336', // placeholder
      thumbnail_url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/oonchiumpa/hero-hero-main.jpg',
      is_featured: true,
      is_public: true
    }
  ];
  await supabase.from('partner_videos').insert(videos);
  console.log('✅ Seeded Media\n');

  console.log('🎉 Oonchiumpa Basecamp Evidence successfully seeded into JusticeHub.');
}

main().catch(console.error);
