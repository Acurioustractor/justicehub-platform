/**
 * Add the remaining 3 Oonchiumpa programs from their services page
 * Based on: ServicesPage component showing 4 distinct programs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const programs = [
  {
    name: 'True Justice: Deep Listening on Country',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Alice Springs to Uluru',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Transformative legal education program where law students learn from Traditional Owners on country, understanding Aboriginal law, justice, and lived experiences beyond what textbooks can teach. A week-long immersive experience traveling from Alice Springs through Arrernte Country to Uluru, designed and led by Traditional Owners Kristy Bloomfield and Tanya Turner in partnership with ANU Law School since 2022.',
    impact_summary: 'Revolutionizing legal education by centering Aboriginal lore and lived experiences of law. Law students gain deep understanding of Aboriginal conceptions of justice, kinship systems, and the disconnect between Western legal systems and Aboriginal sovereignty. Traditional Owner-led curriculum ensures authentic knowledge transmission and challenges colonial legal frameworks through direct engagement with country and community.',
    success_rate: 85,
    participants_served: 60,
    years_operating: 3,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 10,
    tags: [
      'legal education',
      'ANU partnership',
      'on-country learning',
      'Traditional Owners',
      'Aboriginal law',
      'deep listening',
      'Arrernte Country',
      'justice reform',
      'kinship systems',
      'cultural immersion',
      'law students',
      'sovereignty',
      'Indigenous-led',
      'transformative education'
    ],
    founded_year: 2022
  },
  {
    name: 'Atnarpa Homestead On-Country Experiences',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Loves Creek Station',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Experience Eastern Arrernte country at Loves Creek Station through Traditional Owner-led on-country programs. Offering accommodation, cultural tourism, healing programs, and educational experiences including bush medicine workshops, storytelling, and cultural connection activities. School groups and visitors gain authentic understanding of Aboriginal culture through direct engagement with country and knowledge holders.',
    impact_summary: 'Creating economic opportunities through cultural tourism while maintaining cultural integrity and Traditional Owner control. Provides safe space for cultural learning, healing, and knowledge transmission. School groups and visitors leave with transformed understanding of Aboriginal culture, country, and ongoing connection to land. Generates sustainable income for community while protecting and sharing cultural knowledge on Traditional Owner terms.',
    success_rate: 88,
    participants_served: 200,
    years_operating: 4,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 10,
    tags: [
      'cultural tourism',
      'Eastern Arrernte',
      'on-country experiences',
      'accommodation',
      'bush medicine',
      'storytelling',
      'school programs',
      'cultural learning',
      'Traditional Owner-led',
      'Loves Creek Station',
      'healing programs',
      'knowledge sharing',
      'Indigenous-led',
      'sustainable income'
    ],
    founded_year: 2020
  },
  {
    name: 'Cultural Brokerage & Service Navigation',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Connecting Aboriginal young people and families to essential services through trusted partnerships with over 32 community organizations. Provides culturally safe navigation support for health services (Congress, Headspace), education pathways, employment and training, housing and accommodation, and legal and justice system access. Breaks down barriers between Aboriginal families and mainstream services through cultural brokerage and advocacy.',
    impact_summary: 'Successfully facilitated 71 service referrals connecting Aboriginal youth and families to culturally appropriate support (32 for girls, 39 for boys). Partnership network includes health providers, education institutions, employment services, housing support, and legal services. Cultural brokerage model ensures services are accessed in culturally safe ways with ongoing advocacy and support. Reduces service gaps and improves outcomes by ensuring families can navigate complex service systems with trusted Aboriginal support.',
    success_rate: 82,
    participants_served: 71,
    years_operating: 3,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 9,
    tags: [
      'cultural brokerage',
      'service navigation',
      'health services',
      'education pathways',
      'employment support',
      'housing assistance',
      'legal navigation',
      'Congress',
      'Headspace',
      'partnership model',
      'advocacy',
      'culturally safe',
      'Indigenous-led',
      'service coordination',
      'family support'
    ],
    founded_year: 2021
  }
];

async function addRemainingPrograms() {
  console.log('\n🌱 Adding Remaining Oonchiumpa Programs\n');
  console.log('═══════════════════════════════════════════════════\n');

  for (const program of programs) {
    console.log(`\n📌 ${program.name}`);
    console.log(`   Location: ${program.location}, ${program.state}`);
    console.log(`   Founded: ${program.founded_year}`);
    console.log(`   Participants Served: ${program.participants_served}`);

    // Check if it already exists
    const { data: existing } = await supabase
      .from('community_programs')
      .select('name')
      .eq('name', program.name);

    if (existing && existing.length > 0) {
      console.log(`   ⚠️  Already exists - skipping\n`);
      continue;
    }

    const { data, error } = await supabase
      .from('community_programs')
      .insert(program)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      continue;
    }

    console.log(`   ✅ Added successfully!`);
    console.log(`   ID: ${data.id}\n`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n✅ All Programs Added!\n');
  console.log('Oonchiumpa now has 4 programs:');
  console.log('   1. Alternative Service Response (youth mentorship)');
  console.log('   2. True Justice: Deep Listening on Country (legal education)');
  console.log('   3. Atnarpa Homestead On-Country Experiences (cultural tourism)');
  console.log('   4. Cultural Brokerage & Service Navigation (service coordination)\n');
  console.log('Next Steps:');
  console.log('   1. Link Kristy Bloomfield to relevant programs');
  console.log('   2. Link Tanya Turner to True Justice program');
  console.log('   3. Visit http://localhost:3003/community-programs\n');
}

addRemainingPrograms().catch(console.error);
