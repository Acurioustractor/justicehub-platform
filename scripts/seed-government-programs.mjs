#!/usr/bin/env node
/**
 * ALMA Government Programs - Test Data Seeder
 * Creates realistic government program announcements to test sentiment correlation
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const envFile = readFileSync(join(root, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
    .map(([key, ...values]) => [key, values.join('=')])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Government programs - mix of community-led and punitive approaches
const PROGRAMS = [
  {
    name: 'Queensland Youth Detention Center Expansion',
    jurisdiction: 'QLD',
    program_type: 'detention',
    announced_date: '2025-12-10',
    implementation_date: '2026-06-01',
    status: 'announced',
    budget_amount: 80000000,
    description: '$80M expansion of youth detention facilities in Queensland, adding 100 new beds',
    official_url: 'https://example.com/qld-detention-expansion',
    community_led: false,
    cultural_authority: false,
    consent_level: 'Public Knowledge Commons',
  },
  {
    name: 'NT On Country Cultural Programs',
    jurisdiction: 'NT',
    program_type: 'cultural',
    announced_date: '2025-12-15',
    implementation_date: '2026-03-01',
    status: 'in_progress',
    budget_amount: 5000000,
    description: 'Community-led cultural immersion programs for young people at risk of offending',
    official_url: 'https://example.com/nt-cultural-programs',
    community_led: true,
    cultural_authority: true,
    consent_level: 'Community Controlled',
  },
  {
    name: 'NSW Bail Reform - Stricter Conditions',
    jurisdiction: 'NSW',
    program_type: 'law_reform',
    announced_date: '2025-12-20',
    implementation_date: '2026-02-01',
    status: 'announced',
    budget_amount: null,
    description: 'Legislative changes to make bail conditions stricter for youth offenders',
    official_url: 'https://example.com/nsw-bail-reform',
    community_led: false,
    cultural_authority: false,
    consent_level: 'Public Knowledge Commons',
  },
  {
    name: 'Bourke Maranguka Justice Reinvestment Expansion',
    jurisdiction: 'NSW',
    program_type: 'justice_reinvestment',
    announced_date: '2025-12-05',
    implementation_date: '2026-01-15',
    status: 'implemented',
    budget_amount: 3500000,
    description: 'Expansion of award-winning community-led justice reinvestment program',
    official_url: 'https://example.com/maranguka-expansion',
    community_led: true,
    cultural_authority: true,
    consent_level: 'Community Controlled',
  },
  {
    name: 'Victoria Youth Detention Review',
    jurisdiction: 'VIC',
    program_type: 'review',
    announced_date: '2025-12-18',
    implementation_date: null,
    status: 'in_progress',
    budget_amount: 500000,
    description: 'Independent review of youth detention conditions and alternatives',
    official_url: 'https://example.com/vic-detention-review',
    community_led: false,
    cultural_authority: false,
    consent_level: 'Public Knowledge Commons',
  },
  {
    name: 'WA Aboriginal Youth Healing Program',
    jurisdiction: 'WA',
    program_type: 'therapeutic',
    announced_date: '2025-11-25',
    implementation_date: '2026-02-01',
    status: 'in_progress',
    budget_amount: 4200000,
    description: 'Aboriginal-controlled therapeutic program focused on trauma and cultural healing',
    official_url: 'https://example.com/wa-healing-program',
    community_led: true,
    cultural_authority: true,
    consent_level: 'Community Controlled',
  },
];

async function seedPrograms() {
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║      ALMA Government Programs - Test Data Seeder         ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`📊 Creating government program announcements`);
  console.log(`📅 Programs: ${PROGRAMS.length}`);
  console.log(`🏛️  Community-led: ${PROGRAMS.filter(p => p.community_led).length}`);
  console.log(`🔒 Government-led: ${PROGRAMS.filter(p => !p.community_led).length}`);
  console.log(``);

  const { data, error } = await supabase
    .from('alma_government_programs')
    .insert(PROGRAMS)
    .select();

  if (error) {
    console.log(`❌ Error inserting programs: ${error.message}`);
    return;
  }

  console.log(`✅ Inserted ${data.length} programs\n`);

  // Display summary
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  PROGRAMS SUMMARY                                         ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(``);

  data.forEach(program => {
    const icon = program.community_led ? '🌱' : '🏛️';
    const type = program.community_led ? 'Community-Led' : 'Government-Led';
    console.log(`${icon} ${program.name}`);
    console.log(`   Type: ${type} | ${program.jurisdiction} | ${program.program_type}`);
    console.log(`   Announced: ${program.announced_date}`);
    if (program.budget_amount) {
      console.log(`   Budget: $${(program.budget_amount / 1000000).toFixed(1)}M`);
    }
    console.log(``);
  });

  console.log(`📊 Next steps:`);
  console.log(`   1. Refresh views: node scripts/refresh-sentiment-views.mjs`);
  console.log(`   2. Generate report: node scripts/generate-sentiment-report.mjs > report.md`);
  console.log(`   3. View correlation: alma_sentiment_program_correlation view`);
  console.log(``);
  console.log(`✅ Government programs seeded successfully!`);
}

// Run seeder
seedPrograms().catch(err => {
  console.error('❌ Seeding failed:', err);
  console.error(err.stack);
  process.exit(1);
});
