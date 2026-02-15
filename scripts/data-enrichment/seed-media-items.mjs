#!/usr/bin/env node
/**
 * Seed Media Items for Gallery
 *
 * Populates the media_item table with realistic content
 * for the JusticeHub gallery showcasing youth justice programs.
 *
 * Usage: node scripts/data-enrichment/seed-media-items.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mediaItems = [
  // Videos - Program Highlights
  {
    title: 'BackTrack Youth Works: Welding Workshop',
    description: 'Young people learning welding skills through hands-on mentorship at BackTrack in Armidale. This program has helped over 1,000 young people find pathways to employment.',
    media_type: 'video',
    media_url: 'https://www.youtube.com/watch?v=backtrack-welding',
    thumbnail_url: '/images/gallery/backtrack-welding-thumb.jpg',
    creator_name: 'BackTrack Communications',
    duration: '4:32',
    views: 3245,
    tags: ['skills-training', 'mentorship', 'employment', 'NSW', 'backtrack'],
    is_featured: true,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'Courtesy of BackTrack Youth Works'
  },
  {
    title: 'Traditional Healing Circles: Alice Springs',
    description: 'Elder Mary leading traditional healing practices with young Aboriginal people. Cultural connection and traditional practices help young people heal and thrive.',
    media_type: 'video',
    media_url: 'https://www.youtube.com/watch?v=healing-circles',
    thumbnail_url: '/images/gallery/healing-circles-thumb.jpg',
    creator_name: 'Central Australian Aboriginal Congress',
    duration: '6:18',
    views: 2891,
    tags: ['indigenous-knowledge', 'cultural-healing', 'NT', 'traditional', 'elders'],
    is_featured: true,
    is_public: true,
    consent_level: 'Community Controlled',
    attribution_text: 'With permission from Central Australian Aboriginal Congress'
  },
  {
    title: 'Maranguka Justice Reinvestment: Community Impact',
    description: 'How the Bourke community took control of justice outcomes. Maranguka has demonstrated significant reductions in youth offending through community-led approaches.',
    media_type: 'video',
    media_url: 'https://www.youtube.com/watch?v=maranguka-impact',
    thumbnail_url: '/images/gallery/maranguka-thumb.jpg',
    creator_name: 'Maranguka Justice Reinvestment',
    duration: '8:45',
    views: 4567,
    tags: ['justice-reinvestment', 'community-led', 'NSW', 'bourke', 'aboriginal'],
    is_featured: true,
    is_public: true,
    consent_level: 'Community Controlled',
    attribution_text: 'Maranguka Justice Reinvestment Project'
  },

  // Photos - Program Documentation
  {
    title: 'Youth-Led Community Mural',
    description: 'Collaborative artwork created by young people in Logan as part of the Youth Collective creative arts program.',
    media_type: 'photo',
    media_url: '/images/gallery/logan-mural-full.jpg',
    thumbnail_url: '/images/gallery/logan-mural-thumb.jpg',
    creator_name: 'Logan Youth Collective',
    views: 1456,
    tags: ['creative-arts', 'community-organizing', 'QLD', 'logan', 'youth-leadership'],
    is_featured: false,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'Logan Youth Collective'
  },
  {
    title: 'Tech Skills Workshop - Coding for Change',
    description: 'Neurodivergent youth learning programming skills in a supportive environment at TechStart Adelaide.',
    media_type: 'photo',
    media_url: '/images/gallery/techstart-workshop-full.jpg',
    thumbnail_url: '/images/gallery/techstart-workshop-thumb.jpg',
    creator_name: 'TechStart Youth',
    views: 892,
    tags: ['technology', 'neurodiversity', 'SA', 'adelaide', 'digital-skills'],
    is_featured: false,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'TechStart Youth Program'
  },
  {
    title: 'On Country Learning Program',
    description: 'Young people connecting with Country through traditional knowledge and practices in Western Australia.',
    media_type: 'photo',
    media_url: '/images/gallery/on-country-wa-full.jpg',
    thumbnail_url: '/images/gallery/on-country-wa-thumb.jpg',
    creator_name: 'Kimberley Aboriginal Law and Culture Centre',
    views: 2103,
    tags: ['on-country', 'cultural-connection', 'WA', 'indigenous', 'traditional-knowledge'],
    is_featured: true,
    is_public: true,
    consent_level: 'Community Controlled',
    attribution_text: 'KALACC - Kimberley Aboriginal Law and Culture Centre'
  },
  {
    title: 'Youth Justice Conference - Melbourne',
    description: 'Young people sharing their experiences and advocating for change at the Victorian Youth Justice Conference.',
    media_type: 'photo',
    media_url: '/images/gallery/vic-conference-full.jpg',
    thumbnail_url: '/images/gallery/vic-conference-thumb.jpg',
    creator_name: 'VACCA',
    views: 1678,
    tags: ['advocacy', 'youth-voice', 'VIC', 'melbourne', 'conference'],
    is_featured: false,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'Victorian Aboriginal Child Care Agency'
  },
  {
    title: 'Community BBQ Celebration',
    description: 'Local organizations coming together to celebrate youth achievements and program milestones.',
    media_type: 'photo',
    media_url: '/images/gallery/community-bbq-full.jpg',
    thumbnail_url: '/images/gallery/community-bbq-thumb.jpg',
    creator_name: 'JusticeHub',
    views: 987,
    tags: ['community-events', 'celebration', 'achievements', 'networking'],
    is_featured: false,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'JusticeHub Community Events'
  },

  // Artwork
  {
    title: 'Healing Journey - Mixed Media',
    description: 'Artwork created by young person in youth justice, depicting their journey from struggle to hope through community support.',
    media_type: 'artwork',
    media_url: '/images/gallery/healing-journey-full.jpg',
    thumbnail_url: '/images/gallery/healing-journey-thumb.jpg',
    creator_name: 'Anonymous Young Artist',
    views: 3421,
    tags: ['artwork', 'healing', 'expression', 'youth-voice', 'mixed-media'],
    is_featured: true,
    is_public: true,
    consent_level: 'Community Informed',
    attribution_text: 'Created through Youth Arts Program'
  },
  {
    title: 'Our Mob - Digital Portrait Series',
    description: 'Digital portraits celebrating young Aboriginal leaders in their communities across Australia.',
    media_type: 'artwork',
    media_url: '/images/gallery/our-mob-series-full.jpg',
    thumbnail_url: '/images/gallery/our-mob-series-thumb.jpg',
    creator_name: 'Indigenous Digital Collective',
    views: 2789,
    tags: ['digital-art', 'indigenous', 'portraits', 'youth-leaders', 'contemporary'],
    is_featured: true,
    is_public: true,
    consent_level: 'Community Controlled',
    attribution_text: 'Indigenous Digital Collective - All rights reserved'
  },
  {
    title: 'Resilience Mural - Darwin',
    description: 'Large-scale mural created by young people in Darwin depicting themes of resilience, culture, and hope.',
    media_type: 'artwork',
    media_url: '/images/gallery/darwin-mural-full.jpg',
    thumbnail_url: '/images/gallery/darwin-mural-thumb.jpg',
    creator_name: 'Darwin Youth Arts Collective',
    views: 1567,
    tags: ['mural', 'public-art', 'NT', 'darwin', 'resilience'],
    is_featured: false,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'Darwin Youth Arts Collective'
  },

  // Audio/Podcast
  {
    title: 'Youth Voices Podcast - Episode 12: My Story',
    description: 'Young person shares their journey through the youth justice system and the programs that helped them turn their life around.',
    media_type: 'audio',
    media_url: '/audio/youth-voices-ep12.mp3',
    thumbnail_url: '/images/gallery/podcast-thumb.jpg',
    creator_name: 'Youth Voices Podcast',
    duration: '24:15',
    views: 4532,
    tags: ['podcast', 'lived-experience', 'personal-story', 'youth-voice'],
    is_featured: true,
    is_public: true,
    consent_level: 'Community Informed',
    attribution_text: 'Youth Voices Podcast - JusticeHub'
  },

  // Documentary/Story
  {
    title: "From Homelessness to Hope: Jayden's Journey",
    description: 'Personal documentary following Jayden through his recovery journey with support from community housing and mental health services.',
    media_type: 'video',
    media_url: 'https://www.youtube.com/watch?v=jaydens-story',
    thumbnail_url: '/images/gallery/jaydens-journey-thumb.jpg',
    creator_name: 'Jayden Williams',
    duration: '12:34',
    views: 5678,
    tags: ['personal-story', 'housing-support', 'mental-health', 'recovery', 'documentary'],
    is_featured: true,
    is_public: true,
    consent_level: 'Community Informed',
    attribution_text: 'Story shared with permission'
  },

  // Program Highlights
  {
    title: 'Orana Haven: Transition Support',
    description: 'How Orana Haven provides transitional accommodation and support for young people leaving detention in regional NSW.',
    media_type: 'video',
    media_url: 'https://www.youtube.com/watch?v=orana-haven',
    thumbnail_url: '/images/gallery/orana-haven-thumb.jpg',
    creator_name: 'Orana Haven',
    duration: '5:47',
    views: 1234,
    tags: ['transition-support', 'accommodation', 'NSW', 'regional', 'reintegration'],
    is_featured: false,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'Orana Haven'
  },
  {
    title: 'Banksia Hill - A Documentary',
    description: 'Documentary examining conditions at Banksia Hill Youth Detention Centre in Western Australia and calls for reform.',
    media_type: 'video',
    media_url: 'https://www.youtube.com/watch?v=banksia-hill-doc',
    thumbnail_url: '/images/gallery/banksia-hill-thumb.jpg',
    creator_name: 'ABC Four Corners',
    duration: '45:00',
    views: 12456,
    tags: ['documentary', 'detention', 'WA', 'reform', 'human-rights'],
    is_featured: true,
    is_public: true,
    consent_level: 'Public',
    attribution_text: 'ABC Four Corners'
  }
];

async function seedMediaItems() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Seeding Media Items for Gallery');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check existing count
  const { count: existingCount } = await supabase
    .from('media_item')
    .select('id', { count: 'exact', head: true });

  console.log(`Currently ${existingCount || 0} media items in database\n`);

  let inserted = 0;
  let skipped = 0;

  for (const item of mediaItems) {
    // Check if already exists
    const { data: exists } = await supabase
      .from('media_item')
      .select('id')
      .eq('title', item.title)
      .single();

    if (exists) {
      console.log(`⏭  Skipped (exists): ${item.title.substring(0, 50)}...`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('media_item')
      .insert(item);

    if (error) {
      console.error(`❌ Failed: ${item.title.substring(0, 50)}...`);
      console.error(`   Error: ${error.message}`);
    } else {
      console.log(`✅ Inserted: ${item.title.substring(0, 50)}...`);
      inserted++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Summary by type
  const typeCount = {};
  for (const item of mediaItems) {
    typeCount[item.media_type] = (typeCount[item.media_type] || 0) + 1;
  }
  console.log('Media by type:');
  for (const [type, count] of Object.entries(typeCount)) {
    console.log(`  ${type}: ${count}`);
  }
}

seedMediaItems().catch(console.error);
