/**
 * Migrate existing hardcoded programs to the database
 *
 * Usage:
 * DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/migrate-programs-to-database.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.YJSF_SUPABASE_SERVICE_KEY || ''
);

const existingPrograms = [
  {
    name: 'BackTrack Youth Works',
    organization: 'BackTrack',
    location: 'Armidale',
    state: 'NSW',
    approach: 'Community-based',
    description: 'Innovative program combining vocational training, animal therapy, and intensive mentoring for disengaged youth.',
    impact_summary: 'Transforms lives through dogs, welding, and mentorship - 87% never reoffend',
    success_rate: 87,
    participants_served: 300,
    years_operating: 15,
    contact_phone: '02 6772 1234',
    contact_email: 'info@backtrack.org.au',
    website: 'https://backtrack.org.au',
    is_featured: true,
    indigenous_knowledge: false,
    community_connection_score: 95,
    tags: ['Vocational Training', 'Animal Therapy', 'Mentorship', 'Rural NSW'],
    founded_year: 2009
  },
  {
    name: 'Healing Circles Program',
    organization: 'Antakirinja Matu-Yankunytjatjara',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led',
    description: 'Traditional Aboriginal healing practices combined with elder mentorship for young Aboriginal people experiencing trauma.',
    impact_summary: 'Cultural connection and healing through ancient wisdom - 78% report significant trauma recovery',
    success_rate: 78,
    participants_served: 120,
    years_operating: 8,
    contact_phone: '08 8951 4251',
    contact_email: 'healing@amyac.org.au',
    website: 'https://amyac.org.au',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 98,
    tags: ['Cultural Healing', 'Elder Mentorship', 'Trauma Recovery', 'Traditional Knowledge'],
    founded_year: 2016
  },
  {
    name: 'Logan Youth Collective',
    organization: 'Logan Youth Collective',
    location: 'Logan',
    state: 'QLD',
    approach: 'Grassroots',
    description: 'Youth-led organization focused on community organizing, leadership development, and social justice advocacy.',
    impact_summary: 'Young people driving change in their community - 92% pursue higher education or leadership roles',
    success_rate: 92,
    participants_served: 150,
    years_operating: 6,
    contact_phone: '07 3299 5678',
    contact_email: 'info@loganyouth.org.au',
    website: 'https://loganyouth.org.au',
    is_featured: true,
    indigenous_knowledge: false,
    community_connection_score: 90,
    tags: ['Youth Leadership', 'Community Organizing', 'Social Justice', 'Advocacy'],
    founded_year: 2018
  },
  {
    name: 'Creative Futures Collective',
    organization: 'Creative Futures',
    location: 'Melbourne',
    state: 'VIC',
    approach: 'Community-based',
    description: 'Arts-based program supporting young people from foster care and out-of-home care through creative expression.',
    impact_summary: 'Creativity as pathway to stability - 67% achieve independent living and creative careers',
    success_rate: 67,
    participants_served: 85,
    years_operating: 4,
    contact_phone: '03 9555 0987',
    contact_email: 'creative@futures.org.au',
    website: 'https://creativefutures.org.au',
    is_featured: false,
    indigenous_knowledge: false,
    community_connection_score: 85,
    tags: ['Creative Arts', 'Foster Care', 'Independent Living', 'Youth Homelessness'],
    founded_year: 2020
  },
  {
    name: 'Yurrampi Growing Strong',
    organization: 'Tangentyere Council',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led',
    description: 'Strengthening young Aboriginal men through culture, ceremony, and connection to country.',
    impact_summary: 'Building strong Aboriginal men through culture - 85% remain connected to community and culture',
    success_rate: 85,
    participants_served: 200,
    years_operating: 12,
    contact_phone: '08 8951 4466',
    contact_email: 'yurrampi@tangentyere.org.au',
    website: 'https://tangentyere.org.au',
    is_featured: false,
    indigenous_knowledge: true,
    community_connection_score: 97,
    tags: ['Cultural Strength', 'Young Men', 'Connection to Country', 'Ceremony'],
    founded_year: 2012
  },
  {
    name: 'TechStart Youth',
    organization: 'TechStart Youth',
    location: 'Adelaide',
    state: 'SA',
    approach: 'Community-based',
    description: 'Technology education and coding programs designed for neurodivergent and disengaged young people.',
    impact_summary: 'Technology as empowerment tool - 73% gain tech employment or start digital ventures',
    success_rate: 73,
    participants_served: 95,
    years_operating: 3,
    contact_phone: '08 8234 5678',
    contact_email: 'info@techstartyouth.org.au',
    website: 'https://techstartyouth.org.au',
    is_featured: false,
    indigenous_knowledge: false,
    community_connection_score: 80,
    tags: ['Technology', 'Neurodiversity', 'Digital Skills', 'Innovation'],
    founded_year: 2021
  }
];

async function migratePrograms() {
  console.log('\n🔄 MIGRATING PROGRAMS TO DATABASE\n');
  console.log('━'.repeat(60));

  // Check if table exists
  const { error: checkError } = await supabase
    .from('community_programs')
    .select('id')
    .limit(1);

  if (checkError) {
    console.log('\n❌ Error: community_programs table does not exist\n');
    console.log('Please run the migration first:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run: supabase/migrations/create-community-programs-table.sql\n');
    return;
  }

  console.log(`\n📋 Found ${existingPrograms.length} programs to migrate\n`);

  let added = 0;
  let errors = 0;

  for (let i = 0; i < existingPrograms.length; i++) {
    const program = existingPrograms[i];
    console.log(`[${i + 1}/${existingPrograms.length}] ${program.name}...`);

    const { error } = await supabase
      .from('community_programs')
      .insert(program);

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅ Added`);
      added++;
    }
  }

  console.log('\n━'.repeat(60));
  console.log('📊 MIGRATION COMPLETE\n');
  console.log(`✅ Added: ${added}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📚 Total: ${existingPrograms.length}\n`);

  if (added > 0) {
    console.log('🎉 Programs successfully migrated to database!');
    console.log('Next steps:');
    console.log('1. Update pages to read from database');
    console.log('2. Remove hardcoded data from component files\n');
  }
}

migratePrograms().catch(console.error);
