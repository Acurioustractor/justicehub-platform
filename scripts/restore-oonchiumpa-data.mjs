import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// The correct organization ID (the one with team members that we kept)
const ORG_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';

async function restore() {
  console.log('🔄 Restoring Oonchiumpa data to organization:', ORG_ID);
  console.log('');

  // 1. PHOTOS
  console.log('📸 Restoring photos...');
  const photos = [
    {
      title: 'Youth Mentorship & Cultural Healing',
      description: "Oonchiumpa's culturally-led mentorship program connecting young Aboriginal people with culture, education, and healing pathways.",
      photo_url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-mentoring.jpg',
      photo_type: 'hero',
      is_featured: true,
      display_order: 1
    },
    {
      title: 'True Justice: Deep Listening on Country',
      description: 'Law students learning on country through the partnership with ANU, understanding Aboriginal law and justice through lived experience.',
      photo_url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-law.jpg',
      photo_type: 'gallery',
      is_featured: true,
      display_order: 2
    },
    {
      title: 'Atnarpa Homestead On-Country Experience',
      description: 'Eastern Arrernte country at Loves Creek Station - accommodation, cultural tourism, and healing programs.',
      photo_url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-homestead.jpg',
      photo_type: 'gallery',
      is_featured: false,
      display_order: 3
    },
    {
      title: 'Cultural Brokerage & Service Navigation',
      description: 'Connecting Aboriginal young people and families to essential services through 32+ community organization partnerships.',
      photo_url: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-brokerage.jpg',
      photo_type: 'gallery',
      is_featured: false,
      display_order: 4
    }
  ];

  for (const photo of photos) {
    const { error } = await supabase.from('partner_photos').insert({
      organization_id: ORG_ID,
      ...photo
    });
    if (error) console.log('  Error:', error.message);
    else console.log('  ✅', photo.title);
  }

  // 2. VIDEOS
  console.log('\n🎬 Restoring videos...');
  const videos = [
    {
      title: 'True Justice: Deep Listening on Country',
      description: "Oonchiumpa's featured video showcasing their work with Aboriginal young people in Central Australia through cultural healing, deep listening, and on-country programs.",
      video_url: 'https://vimeo.com/1025341290',
      platform: 'vimeo',
      video_type: 'documentary',
      duration_seconds: 1440,
      is_featured: true
    },
    {
      title: 'Atnarpa Homestead - On Country Experience',
      description: 'Young people share their experiences at Atnarpa Station, connecting with country, elders, and traditional knowledge.',
      video_url: 'https://www.youtube.com/watch?v=atnarpa-on-country',
      platform: 'youtube',
      video_type: 'documentary',
      duration_seconds: 720,
      is_featured: true
    },
    {
      title: 'The Importance of Education and Hope',
      description: 'A community member shares the transformative power of education and hope in their journey.',
      video_url: 'https://share.descript.com/view/oaRpFZmFnIZ',
      platform: 'other',
      video_type: 'interview',
      duration_seconds: 120,
      is_featured: false
    },
    {
      title: 'Life on Palm Island: A Timeless Adventure',
      description: 'Stories of community life and cultural connection from Palm Island.',
      video_url: 'https://share.descript.com/view/yP3pzzo4JLU',
      platform: 'other',
      video_type: 'interview',
      duration_seconds: 90,
      is_featured: false
    },
    {
      title: 'Community Kindness: A Helping Hand with a Smile',
      description: 'Heartwarming stories of community support and connection.',
      video_url: 'https://share.descript.com/view/47YVpVof6nN',
      platform: 'other',
      video_type: 'interview',
      duration_seconds: 90,
      is_featured: false
    },
    {
      title: 'The True Meaning of Wealth: Health, Family, and Love',
      description: 'Reflections on what really matters - health, family, and community love.',
      video_url: 'https://share.descript.com/view/SXnp9h3DyDQ',
      platform: 'other',
      video_type: 'interview',
      duration_seconds: 120,
      is_featured: false
    },
    {
      title: 'The Power of Knowing Your Neighbor',
      description: 'Stories about the importance of community connection and knowing your neighbors.',
      video_url: 'https://share.descript.com/view/FJZqnFWOM8U',
      platform: 'other',
      video_type: 'interview',
      duration_seconds: 90,
      is_featured: false
    }
  ];

  for (const video of videos) {
    const { error } = await supabase.from('partner_videos').insert({
      organization_id: ORG_ID,
      ...video
    });
    if (error) console.log('  Error:', error.message);
    else console.log('  ✅', video.title);
  }

  // 3. IMPACT METRICS
  console.log('\n📊 Restoring impact metrics...');
  const metrics = [
    { metric_name: 'Youth Supported', metric_value: '21', is_featured: true },
    { metric_name: 'Retention Rate', metric_value: '90%', is_featured: true },
    { metric_name: 'School Re-engagement', metric_value: '95%', is_featured: true },
    { metric_name: 'Language Groups', metric_value: '7', is_featured: false },
    { metric_name: 'Partner Organizations', metric_value: '32+', is_featured: false },
    { metric_name: 'Years with ANU', metric_value: 'Since 2022', is_featured: false }
  ];

  for (const metric of metrics) {
    const { error } = await supabase.from('partner_impact_metrics').insert({
      organization_id: ORG_ID,
      ...metric
    });
    if (error) console.log('  Error:', error.message);
    else console.log('  ✅', metric.metric_name + ':', metric.metric_value);
  }

  // 4. STORYTELLERS (Check if table exists and add if possible)
  console.log('\n👥 Restoring storytellers...');
  const storytellers = [
    {
      display_name: 'Kristy Bloomfield',
      role_at_org: 'Co-Founder & Director',
      bio_excerpt: 'Kristy Bloomfield is a visionary leader and passionate advocate for Indigenous empowerment and community. She leads Oonchiumpa with deep cultural authority and has built partnerships with over 32 organizations across Central Australia.',
      quote: 'Connection to culture, country, and elders is the foundation of healing.',
      is_featured: true,
      display_order: 1
    },
    {
      display_name: 'Tanya Turner',
      role_at_org: 'Co-Founder & Director',
      bio_excerpt: 'Tanya Turner is a proud Aboriginal woman from Central Australia, whose journey reflects resilience and determination. She brings expertise in Indigenous justice, legal practice, and community development.',
      quote: 'Our young people need to know they are valued - not by the system, but by their own mob.',
      is_featured: true,
      display_order: 2
    },
    {
      display_name: 'Aunty Bev and Uncle Terry',
      role_at_org: 'Cultural Advisors',
      bio_excerpt: "Aunty Bev and Uncle Terry are cherished custodians of Alice Springs' vibrant history, deeply rooted in community resilience and cultural heritage.",
      quote: 'Strong young people come from strong families connected to country.',
      is_featured: true,
      display_order: 3
    },
    {
      display_name: 'Professor Helen Milroy',
      role_at_org: 'True Justice Partner - ANU',
      bio_excerpt: 'Professor Helen Milroy leads the True Justice Initiative partnership with Oonchiumpa, focusing on deep listening and restorative justice approaches since 2022.',
      quote: null,
      is_featured: false,
      display_order: 4
    }
  ];

  for (const storyteller of storytellers) {
    const { error } = await supabase.from('partner_storytellers').insert({
      organization_id: ORG_ID,
      ...storyteller
    });
    if (error) console.log('  Error:', error.message);
    else console.log('  ✅', storyteller.display_name);
  }

  // 5. EXTERNAL LINKS
  console.log('\n🔗 Restoring external links...');
  const links = [
    {
      title: 'Oonchiumpa Website',
      url: 'https://oonchiumpa.com',
      link_type: 'website',
      description: 'Official website',
      display_order: 1
    },
    {
      title: 'ANU True Justice Initiative',
      url: 'https://law.anu.edu.au/research/true-justice',
      link_type: 'research',
      description: 'Academic partnership for deep listening research',
      display_order: 2
    },
    {
      title: 'GitHub Repository',
      url: 'https://github.com/Acurioustractor/Oonchiumpa',
      link_type: 'website',
      description: 'Open-source platform codebase',
      display_order: 3
    }
  ];

  for (const link of links) {
    const { error } = await supabase.from('partner_external_links').insert({
      organization_id: ORG_ID,
      ...link
    });
    if (error) console.log('  Error:', error.message);
    else console.log('  ✅', link.title);
  }

  // 6. Update description
  console.log('\n📝 Updating description...');
  const { error: descError } = await supabase
    .from('organizations')
    .update({
      description: "Oonchiumpa is an Aboriginal community-controlled organisation based in Alice Springs (Mparntwe), Central Australia. Led by Kristy Bloomfield and Tanya Turner, Oonchiumpa works across 7 language groups within a 150km radius of Alice Springs, partnering with 32+ organisations. Core programs include Youth Mentorship & Cultural Healing (95% reduced anti-social behavior, 72% school re-engagement), True Justice: Deep Listening on Country (with ANU since 2022), Atnarpa Homestead On-Country Experiences, and Cultural Brokerage & Service Navigation. Oonchiumpa proves that culture is medicine and that Aboriginal communities know what works for Aboriginal young people.",
      website_url: 'https://oonchiumpa.com'
    })
    .eq('id', ORG_ID);

  if (descError) console.log('  Error:', descError.message);
  else console.log('  ✅ Description updated');

  console.log('\n✅ Restore complete!');

  // Verify
  const { data: org } = await supabase
    .from('organizations')
    .select(`
      name, slug,
      partner_photos(id),
      partner_videos(id),
      partner_impact_metrics(id),
      partner_storytellers(id),
      partner_external_links(id)
    `)
    .eq('id', ORG_ID)
    .single();

  console.log('\n📋 Final count:');
  console.log('   Photos:', org.partner_photos?.length || 0);
  console.log('   Videos:', org.partner_videos?.length || 0);
  console.log('   Metrics:', org.partner_impact_metrics?.length || 0);
  console.log('   Storytellers:', org.partner_storytellers?.length || 0);
  console.log('   External Links:', org.partner_external_links?.length || 0);
}

restore().catch(console.error);
