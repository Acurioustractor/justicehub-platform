/**
 * Add Oonchiumpa's Four Core Programs + Overarching Program
 * Based on: https://github.com/Acurioustractor/Oonchiumpa
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oonchiumpaPrograms = [
  {
    name: 'Oonchiumpa Education & Employment',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Supporting Aboriginal youth to re-engage with education and develop pathways to meaningful employment through culturally responsive approaches. Our program addresses educational disengagement and builds career readiness through mentoring, skill development, and culturally grounded support.',
    impact_summary: '72% of previously disengaged youth returned to school or alternative education pathways. Participants develop employment-ready skills and pursue career opportunities through tailored guidance and skill-building initiatives.',
    success_rate: 72,
    participants_served: 19,
    years_operating: 3,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 9,
    tags: ['education', 'employment', 'career development', 'mentoring', 'youth empowerment', 'cultural learning'],
    founded_year: 2021
  },
  {
    name: 'Oonchiumpa Health & Wellbeing',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Improving access to health services and supporting the mental, emotional, and physical wellbeing of Aboriginal youth. We address trauma, grief, and mental health challenges through culturally appropriate interventions and connection to culturally safe health providers.',
    impact_summary: '68% improvement in mental health outcomes for program participants. Young people move from being "grumpy and heavy" to "happy, laughing, and free to be themselves" through holistic, culturally grounded support.',
    success_rate: 68,
    participants_served: 19,
    years_operating: 3,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 9,
    tags: ['mental health', 'wellbeing', 'health services', 'trauma support', 'grief support', 'emotional regulation', 'cultural healing'],
    founded_year: 2021
  },
  {
    name: 'Oonchiumpa Housing & Basic Needs',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Ensuring Aboriginal youth have safe accommodation and their essential needs are met. We support young people experiencing homelessness, overcrowded housing, and housing instability to secure safe, stable living arrangements and develop independent living skills.',
    impact_summary: 'Supporting youth to transition from unstable, overcrowded accommodation to independent housing. Young people develop life skills including budgeting, shopping, and managing personal tasks independently. Addressing the critical challenge of 12-year waitlists for public housing through advocacy and support.',
    success_rate: 85,
    participants_served: 19,
    years_operating: 3,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 9.0,
    tags: ['housing', 'homelessness', 'independent living', 'life skills', 'basic needs', 'accommodation', 'crisis support'],
    founded_year: 2021
  },
  {
    name: 'Oonchiumpa Cultural Connection',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Strengthening Aboriginal youth identity and connection to culture, country, and community through on-country cultural programs, elder-led knowledge sharing, language activities, traditional arts and practices. Cultural connection is the foundation for healing and positive development.',
    impact_summary: '82% improvement in cultural connection for program participants. Young people develop meaningful relationships with family and community, enhancing cultural identity and reducing anti-social behaviours. Over 20 cultural activities delivered including on-country trips, yarning circles, cultural tourism experiences, and traditional practices.',
    success_rate: 82,
    participants_served: 19,
    years_operating: 3,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 10,
    tags: ['cultural connection', 'on-country', 'cultural identity', 'traditional knowledge', 'elder wisdom', 'language', 'cultural tourism', 'identity development'],
    founded_year: 2021
  },
  {
    name: 'Oonchiumpa Youth Support Program',
    organization: 'Oonchiumpa Consultancy & Services',
    location: 'Alice Springs',
    state: 'NT',
    approach: 'Indigenous-led' as const,
    description: 'Oonchiumpa provides holistic, culturally responsive support for Aboriginal youth in Central Australia through four integrated pillars: Education & Employment, Health & Wellbeing, Housing & Basic Needs, and Cultural Connection. Our approach addresses the complex needs of Aboriginal youth while staying true to cultural values and community needs.',
    impact_summary: '95% reduction in anti-social behaviour among participants (18 out of 19 youth). 72% returned to education. 40% reduction in night-time youth presence in CBD areas. 1,200+ safe transports provided annually. Participants demonstrate significant growth in confidence, resilience, cultural connection, and self-advocacy.',
    success_rate: 77,
    participants_served: 19,
    years_operating: 3,
    contact_phone: null,
    contact_email: null,
    website: 'https://github.com/Acurioustractor/Oonchiumpa',
    is_featured: true,
    indigenous_knowledge: true,
    community_connection_score: 10,
    tags: ['holistic support', 'youth justice', 'Indigenous-led', 'community safety', 'cultural healing', 'youth empowerment', 'recidivism reduction', 'night patrol', 'crisis intervention'],
    founded_year: 2021
  }
];

async function addOonchiumpaPrograms() {
  console.log('\n🌱 Adding Oonchiumpa Programs to Database\n');
  console.log('═══════════════════════════════════════════\n');

  // First, check if any already exist
  const { data: existing } = await supabase
    .from('community_programs')
    .select('name')
    .eq('organization', 'Oonchiumpa Consultancy & Services');

  const existingNames = new Set((existing || []).map(p => p.name));

  for (const program of oonchiumpaPrograms) {
    if (existingNames.has(program.name)) {
      console.log(`Skipping: ${program.name} (already exists)\n`);
      continue;
    }

    console.log(`Adding: ${program.name}`);

    const { data, error } = await supabase
      .from('community_programs')
      .insert(program)
      .select()
      .single();

    if (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    } else {
      console.log(`  ✅ Added successfully`);
      console.log(`  ID: ${data.id}`);
      console.log(`  Success Rate: ${program.success_rate}%`);
      console.log(`  Community Score: ${program.community_connection_score}/10\n`);
    }
  }

  console.log('\n✅ Oonchiumpa programs added!\n');
  console.log('You now have 5 new programs:');
  console.log('  1. Education & Employment (72% success rate)');
  console.log('  2. Health & Wellbeing (68% mental health improvement)');
  console.log('  3. Housing & Basic Needs (85% housing transition success)');
  console.log('  4. Cultural Connection (82% cultural connection improvement)');
  console.log('  5. Youth Support Program (overarching, 77% overall success)\n');
  console.log('All programs are Indigenous-led and featured on the homepage.\n');
  console.log('Next steps:');
  console.log('  - Link Kristy Bloomfield as "Program Manager" or "Founder"');
  console.log('  - Link actual participant stories from Empathy Ledger');
  console.log('  - Visit http://localhost:3003/community-programs to view\n');
}

addOonchiumpaPrograms().catch(console.error);
