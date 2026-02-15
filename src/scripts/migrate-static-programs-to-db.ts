import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

/**
 * This script migrates the static program data from global-insights page
 * into the international_programs database table, merging with existing data
 */

const additionalPrograms = [
  {
    name: 'Spain - Diagrama Foundation',
    slug: 'spain-diagrama-foundation',
    country: 'Spain',
    region: 'europe',
    city_location: 'Madrid',
    program_type: ['custodial_reform', 'education_vocational'],
    description:
      'The Love & Boundaries model achieving exceptional outcomes through therapeutic residential programs combining education, family therapy, and skills training. Operating since 1991 with 40,000+ youth transformed.',
    approach_summary:
      'Therapeutic model combining love, boundaries, education and family engagement',
    target_population: 'High-risk youth in residential programs',
    year_established: 1991,
    recidivism_rate: 13.6,
    recidivism_comparison: '13.6% vs 80-96% in traditional systems',
    evidence_strength: 'evaluation_report',
    key_outcomes: [
      {
        metric: 'Recidivism rate',
        value: '13.6%',
        comparison: 'vs 80-96% traditional',
      },
      {
        metric: 'Program completion',
        value: '98%',
      },
      {
        metric: 'Youth transformed',
        value: '40,000+',
        timeframe: 'Since 1991',
      },
    ],
    population_served: 40000,
    scale: 'Operating across Spain and internationally',
    website_url: 'https://www.diagramaaustralia.org/',
    australian_adaptations: ['Diagrama Australia programs'],
    status: 'published',
  },

  // Update existing FGC program with more detail
  {
    name: 'Family Group Conferencing (Enhanced)',
    slug: 'fgc-new-zealand-enhanced',
    country: 'New Zealand',
    region: 'australasia',
    city_location: 'Wellington',
    program_type: ['restorative_justice', 'diversion'],
    description:
      "New Zealand's youth justice system uses Family Group Conferences (FGC) as the cornerstone approach, bringing together young people, their whānau (family), victims, and support people to develop solutions that address both offending and underlying needs. The system prioritizes diversion, cultural connections, and family-led decision making.",
    approach_summary:
      'Family-led restorative conferences integrating culture and community',
    year_established: 1989,
    key_outcomes: [
      {
        metric: 'Victim Satisfaction',
        value: '86%',
        detail: 'of victims satisfied with restorative justice conference',
      },
      {
        metric: 'Recommendation Rate',
        value: '84%',
        detail: 'would recommend restorative justice to others',
      },
      {
        metric: 'Diversion Success',
        value: 'Majority',
        detail: 'of young offenders diverted from courts and custody',
      },
    ],
    evidence_strength: 'longitudinal_study',
    website_url: 'https://www.orangatamariki.govt.nz/youth-justice/',
    australian_adaptations: [
      'NSW Youth Justice Conferences',
      'Victorian Group Conferencing',
      'QLD Youth Justice Conferencing',
    ],
    collaboration_opportunities:
      'Strong potential for staff exchanges, training partnerships, and adaptation of Māori-led approaches',
    status: 'published',
  },

  {
    name: "Scotland - Children's Hearings System",
    slug: 'scotland-childrens-hearings',
    country: 'Scotland',
    region: 'europe',
    city_location: 'Edinburgh',
    program_type: ['policy_initiative', 'diversion'],
    description:
      "Scotland's Children's Hearings System, established following the Kilbrandon Report (1963), takes an integrated holistic approach where care and justice decisions prioritize the child's best interests. The system treats children who offend and those needing care and protection as equally deserving of support, operating on 'maximum diversion–minimum intervention' principles.",
    approach_summary:
      'Welfare-based panel system treating offending as unmet needs',
    target_population: 'All children under 16 (offending or care needs)',
    year_established: 1971,
    key_outcomes: [
      {
        metric: 'Age of Criminal Responsibility',
        value: '12 years',
        detail: 'Raised from 8 to 12 years in 2019',
      },
      {
        metric: 'Restorative Justice Participation',
        value: '56%',
        detail: 'of those contacted took part (Glasgow evaluation)',
      },
      {
        metric: 'System longevity',
        value: '50+ years',
        detail: 'of continuous operation and refinement',
      },
    ],
    evidence_strength: 'longitudinal_study',
    website_url: 'https://www.chscotland.gov.uk/',
    australian_adaptations: [],
    collaboration_opportunities:
      'Panel-based alternative to youth courts, integration of care and justice systems',
    status: 'published',
  },

  {
    name: 'Nordic Welfare Model',
    slug: 'nordic-welfare-model',
    country: 'Finland',
    region: 'europe',
    city_location: 'Helsinki',
    program_type: ['policy_initiative', 'custodial_reform'],
    description:
      'Finland and other Nordic countries maintain exceptionally low youth custody rates (Finland: only 4 youth in custody nationwide) through comprehensive welfare systems prioritizing education and therapeutic support over detention.',
    approach_summary:
      'Comprehensive welfare approach with minimal use of custody',
    key_outcomes: [
      {
        metric: 'Youth in custody',
        value: '4',
        detail: 'Nationwide in Finland',
      },
      {
        metric: 'Approach',
        value: 'Education & therapy',
        detail: 'Over detention and punishment',
      },
    ],
    evidence_strength: 'longitudinal_study',
    australian_adaptations: [],
    status: 'published',
  },
];

async function migratePrograms() {
  console.log('🔄 Migrating static programs to database...\n');

  for (const program of additionalPrograms) {
    console.log(`Checking: ${program.name}...`);

    // Check if program already exists
    const { data: existing } = await supabase
      .from('international_programs')
      .select('id, name')
      .eq('slug', program.slug)
      .single();

    if (existing) {
      console.log(`  ⏭️  Already exists: ${existing.id}`);
      continue;
    }

    // Insert new program
    const { data, error } = await supabase
      .from('international_programs')
      .insert([program])
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Added: ${data.id}`);
    }
  }

  console.log('\n📊 Summary:');
  const { count } = await supabase
    .from('international_programs')
    .select('*', { count: 'exact', head: true });

  console.log(`Total programs in database: ${count}`);
}

migratePrograms();
