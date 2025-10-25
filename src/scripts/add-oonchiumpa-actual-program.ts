/**
 * Add Oonchiumpa's ACTUAL Program - Alternative Service Response
 * Based on the comprehensive evaluation report from:
 * https://github.com/Acurioustractor/Oonchiumpa/blob/main/Docs/Oonch_report.md
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oonchiumpaProgram = {
  name: 'Oonchiumpa Alternative Service Response',
  organization: 'Oonchiumpa Consultancy & Services',
  location: 'Alice Springs',
  state: 'NT',
  approach: 'Indigenous-led' as const,
  description: 'A comprehensive mentorship program providing culturally responsive support for Aboriginal youth (ages 11-17) identified as at-risk by Operation Luna, the Northern Territory Government multi-agency taskforce. Using a cultural brokerage model, Oonchiumpa connects young people to Aboriginal and mainstream services while providing holistic family support, education re-engagement, mental health services, housing assistance, and cultural connection programs.',
  impact_summary: 'Transformative outcomes for 19 active participants: 72% returned to education (from 95% disengagement), 95% reduction in anti-social behavior (18 out of 19 youth), 68% improvement in mental health outcomes, 90% program retention rate. Partnership with Operation Luna resulted in 40% reduction in night-time youth presence in Alice Springs CBD. Delivered 71 targeted service referrals (32 for girls, 39 for boys) connecting participants to culturally safe health providers, housing services, and educational pathways.',
  success_rate: 77,
  participants_served: 19,
  years_operating: 3,
  contact_phone: null,
  contact_email: null,
  website: 'https://github.com/Acurioustractor/Oonchiumpa',
  is_featured: true,
  indigenous_knowledge: true,
  community_connection_score: 10,
  tags: [
    'mentorship',
    'cultural brokerage',
    'Operation Luna',
    'education re-engagement',
    'mental health',
    'housing support',
    'cultural connection',
    'service navigation',
    'holistic support',
    'anti-social behavior reduction',
    'youth justice',
    'Indigenous-led',
    'community safety',
    'night patrol',
    'family support'
  ],
  founded_year: 2021
};

async function addOonchiumpaActualProgram() {
  console.log('\n🌱 Adding ACTUAL Oonchiumpa Program to Database\n');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Program: Alternative Service Response');
  console.log('Framework: Cultural Brokerage + Operation Luna Partnership');
  console.log('Participants: 19 active (9 male, 10 female, ages 11-17)');
  console.log('Cultural Background: 52% Western Arrernte/Luritja language groups\n');

  // Check if it already exists
  const { data: existing } = await supabase
    .from('community_programs')
    .select('name')
    .eq('organization', 'Oonchiumpa Consultancy & Services');

  if (existing && existing.length > 0) {
    console.log(`⚠️  Warning: ${existing.length} existing program(s) found for Oonchiumpa:`);
    existing.forEach(p => console.log(`   - ${p.name}`));
    console.log('\nSkipping to avoid duplicates.\n');
    return;
  }

  console.log('Adding program...\n');

  const { data, error } = await supabase
    .from('community_programs')
    .insert(oonchiumpaProgram)
    .select()
    .single();

  if (error) {
    console.log(`❌ Error: ${error.message}\n`);
    return;
  }

  console.log('✅ Program Added Successfully!\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Program ID: ${data.id}`);
  console.log(`Name: ${oonchiumpaProgram.name}`);
  console.log(`Organization: ${oonchiumpaProgram.organization}`);
  console.log(`Location: ${oonchiumpaProgram.location}, ${oonchiumpaProgram.state}\n`);

  console.log('📊 Key Outcomes:');
  console.log('   • 72% education re-engagement (from 95% disengagement)');
  console.log('   • 95% reduction in anti-social behavior (18/19 youth)');
  console.log('   • 68% improvement in mental health outcomes');
  console.log('   • 90% program retention rate');
  console.log('   • 40% reduction in CBD night-time youth presence\n');

  console.log('🤝 Service Model:');
  console.log('   • 71 total service referrals');
  console.log('   • 32 referrals for girls');
  console.log('   • 39 referrals for boys');
  console.log('   • Cultural brokerage to Aboriginal and mainstream services\n');

  console.log('🎯 Key Frameworks:');
  console.log('   • Operation Luna Partnership (NT Government taskforce)');
  console.log('   • Cultural Brokerage Model');
  console.log('   • Holistic Family Support');
  console.log('   • Mixed-Methods Evaluation with Community Engagement\n');

  console.log('Next Steps:');
  console.log('   1. Link Kristy Bloomfield as "Program Manager" or "Founder"');
  console.log('   2. Link actual participant stories from Empathy Ledger');
  console.log('   3. Visit http://localhost:3003/community-programs to view\n');
}

addOonchiumpaActualProgram().catch(console.error);
