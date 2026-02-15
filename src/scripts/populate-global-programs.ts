import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

const programs = [
  {
    name: 'Missouri Model',
    slug: 'missouri-model',
    country: 'United States',
    region: 'north_america',
    program_type: ['custodial_reform'],
    description:
      'Small, therapeutic youth facilities that moved away from prison-like environments to group homes (10-30 youths) emphasizing respect, therapy, education, and family involvement.',
    approach_summary:
      'Therapeutic group homes with emphasis on rehabilitation, education, and family engagement instead of punitive detention.',
    target_population: 'Youth offenders in custody',
    year_established: null,
    recidivism_rate: 8.0,
    recidivism_comparison:
      'Less than 8% return to custody after release; under 8% eventually imprisoned as adults (among the lowest in the nation)',
    evidence_strength: 'longitudinal_study',
    key_outcomes: [
      {
        metric: 'Re-incarceration rate',
        value: '< 8%',
        timeframe: 'After release',
      },
      {
        metric: 'Adult prison rate',
        value: '< 8%',
        timeframe: 'Long-term follow-up',
      },
      {
        metric: 'Education engagement',
        value: '~85%',
        detail: 'Engaged in school or work at release',
      },
      {
        metric: 'High school completion',
        value: '~83%',
        detail: 'Combined diploma/GED or return to school',
      },
    ],
    scale: 'Statewide in Missouri',
    australian_adaptations: [],
    status: 'published',
  },
  {
    name: 'Multisystemic & Functional Family Therapy',
    slug: 'mst-fft',
    country: 'United States',
    region: 'north_america',
    program_type: ['family_therapy', 'community_based'],
    description:
      'Evidence-based family therapies that send trained therapists to work intensively with youth and families in their homes, addressing parenting, peer influence, school issues, and mental health as an alternative to incarceration.',
    approach_summary:
      'Intensive home-based family therapy addressing environmental factors instead of incarceration.',
    target_population: 'High-risk youth and their families',
    year_established: 1980,
    recidivism_rate: null,
    recidivism_comparison:
      "Florida's Redirection Program: 31% lower recidivism for high-risk youth who received MST/FFT vs incarceration",
    evidence_strength: 'rigorous_rct',
    key_outcomes: [
      {
        metric: 'Recidivism reduction',
        value: '31% lower',
        timeframe: 'Florida Redirection Project',
        comparison: 'vs incarceration',
      },
      {
        metric: 'Cost savings',
        value: '$50+ million',
        timeframe: '5 years',
        detail: 'Florida Redirection Program savings',
      },
    ],
    scale: 'Replicated across multiple U.S. states and internationally',
    population_served: null,
    australian_adaptations: [],
    status: 'published',
  },
  {
    name: 'Wraparound Milwaukee',
    slug: 'wraparound-milwaukee',
    country: 'United States',
    region: 'north_america',
    program_type: ['community_based'],
    description:
      'Comprehensive wraparound case management providing individualized services coordinating education, mental health, family support, and other needs for high-risk youth in their community.',
    approach_summary:
      'Wraparound case management coordinating multiple services for youth in community.',
    target_population: 'High-needs justice-involved youth',
    year_established: null,
    recidivism_rate: null,
    recidivism_comparison: '50%+ lower recidivism versus typical justice outcomes',
    evidence_strength: 'evaluation_report',
    key_outcomes: [
      {
        metric: 'Youth served annually',
        value: '1,000+',
      },
      {
        metric: 'Mental health improvement',
        value: 'Significant',
      },
      {
        metric: 'School attendance',
        value: 'Improved',
      },
      {
        metric: 'Recidivism reduction',
        value: '50%+ lower',
        comparison: 'vs typical outcomes',
      },
    ],
    scale: 'Milwaukee County',
    population_served: 1000,
    status: 'published',
  },
  {
    name: 'Roca, Inc.',
    slug: 'roca-inc',
    country: 'United States',
    region: 'north_america',
    program_type: ['community_based', 'mentoring'],
    description:
      'Street outreach combined with cognitive-behavioral therapy and job support for high-violence gang-involved youth aged 16-24. Uses relentless engagement and voluntary long-term participation (up to 4 years).',
    approach_summary:
      'Street outreach + CBT + employment support for gang/high-violence youth.',
    target_population: 'Gang-involved and high-violence youth aged 16-24',
    year_established: null,
    recidivism_rate: 29.0,
    recidivism_comparison:
      'Only 29% incarcerated within 3 years (far below norm for cohort); <20% reoffended violently',
    evidence_strength: 'longitudinal_study',
    key_outcomes: [
      {
        metric: 'Incarceration rate',
        value: '29%',
        timeframe: 'Within 3 years',
        detail: 'Massachusetts participants',
      },
      {
        metric: 'Violent reoffending',
        value: '< 20%',
        detail: 'Among those with prior violent offenses',
      },
      {
        metric: 'Re-arrest rate',
        value: '28%',
        timeframe: 'First 2 years',
        detail: 'Baltimore site (98% had prior arrests)',
      },
    ],
    scale: 'Multiple U.S. cities',
    status: 'published',
  },
  {
    name: 'Juvenile Detention Alternatives Initiative (JDAI)',
    slug: 'jdai',
    country: 'United States',
    region: 'north_america',
    program_type: ['policy_initiative', 'diversion'],
    description:
      'Systemic detention reform initiative helping local systems implement risk screening, alternative detention programs, expedited case processing, and interagency coordination to safely reduce youth detention.',
    approach_summary:
      'System-wide detention reform using alternatives and evidence-based practices.',
    target_population: 'Youth in detention or at risk of detention',
    year_established: 1990,
    recidivism_rate: null,
    recidivism_comparison: 'No increase in youth crime despite reduced detention',
    evidence_strength: 'quasi_experimental',
    key_outcomes: [
      {
        metric: 'Detention population reduction',
        value: '~40%',
        detail: 'Across 300+ counties',
      },
      {
        metric: 'Youth prison commitments',
        value: '>50% reduction',
      },
      {
        metric: 'Public safety',
        value: 'No increase in re-arrest rates',
      },
    ],
    scale: '300+ U.S. counties',
    status: 'published',
  },
  {
    name: 'Youth Conferencing',
    slug: 'youth-conferencing-ni',
    country: 'Northern Ireland',
    region: 'europe',
    program_type: ['restorative_justice', 'diversion'],
    description:
      'Restorative justice conferences bringing together youth offenders, victims, and supporters to address harm and develop rehabilitation plans as either pre-court diversion or post-conviction sentencing.',
    approach_summary:
      'Restorative conferences with victims for accountability and rehabilitation.',
    target_population: 'Youth offenders who admit guilt',
    year_established: 2003,
    recidivism_rate: 54.0,
    recidivism_comparison:
      '54% reoffending for conference orders vs 63% for other sentences; Only 19% for diversionary conferences',
    evidence_strength: 'evaluation_report',
    key_outcomes: [
      {
        metric: 'Victim satisfaction',
        value: '89%',
        detail: 'Preferred conference over court',
      },
      {
        metric: 'Reoffending rate (court-ordered conference)',
        value: '54%',
        comparison: 'vs 63% for traditional sentences',
      },
      {
        metric: 'Reoffending rate (diversionary conference)',
        value: '19%',
      },
    ],
    scale: 'Nationwide in Northern Ireland',
    status: 'published',
  },
  {
    name: 'HALT Program',
    slug: 'halt-netherlands',
    country: 'Netherlands',
    region: 'europe',
    program_type: ['diversion', 'restorative_justice'],
    description:
      'Pre-charge diversion for first-time minor offenses offering apologies, community service, and counseling to keep youth out of court system. Program completed means no criminal record.',
    approach_summary:
      'Restorative diversion for first-time minor offenders with community service and counseling.',
    target_population: 'First-time minor offenders',
    year_established: 1980,
    recidivism_rate: null,
    recidivism_comparison: 'Most participants did not reoffend (rigorous RCT underway)',
    evidence_strength: 'promising_practice',
    key_outcomes: [
      {
        metric: 'Cases handled',
        value: 'Tens of thousands annually',
      },
      {
        metric: 'School outcomes',
        value: 'Positive impact suggested',
      },
      {
        metric: 'Reoffending',
        value: 'Lower rates',
        detail: 'RCT evaluation underway as of 2025',
      },
    ],
    scale: 'Nationwide in Netherlands',
    status: 'published',
  },
  {
    name: 'Police Cautioning (Hong Kong)',
    slug: 'police-caution-hk',
    country: 'Hong Kong',
    region: 'asia_pacific',
    program_type: ['diversion'],
    description:
      "Superintendent's caution scheme that diverts minor first-time juvenile offenders from prosecution, with post-caution police visits and referrals to youth services.",
    approach_summary:
      'Police caution diversion with follow-up support for first-time offenders.',
    target_population: 'First-time juvenile offenders (minor/moderate offenses)',
    year_established: 1960,
    recidivism_rate: 20.0,
    recidivism_comparison: 'Under 20% recidivism within two years (80%+ no re-offense)',
    evidence_strength: 'longitudinal_study',
    key_outcomes: [
      {
        metric: 'Recidivism rate',
        value: '< 20%',
        timeframe: 'Within 2 years',
      },
      {
        metric: 'No re-offense rate',
        value: '80%+',
        timeframe: 'Over past decade',
      },
    ],
    scale: 'Territory-wide',
    status: 'published',
  },
  {
    name: 'Family Group Conferencing',
    slug: 'fgc-new-zealand',
    country: 'New Zealand',
    region: 'australasia',
    program_type: ['restorative_justice', 'diversion'],
    description:
      'Pioneering family-led restorative meetings bringing together youth, family/whānau, victim, and coordinator to collectively devise rehabilitation and restitution plans for almost all youth offenses.',
    approach_summary:
      'Family-led conferences for restorative justice and cultural integration.',
    target_population: 'All youth offenders (except most serious)',
    year_established: 1989,
    recidivism_rate: null,
    recidivism_comparison:
      'Fewer youth offenses overall; inspired similar outcomes in Australia',
    evidence_strength: 'longitudinal_study',
    key_outcomes: [
      {
        metric: 'Youth in institutions',
        value: '>50% reduction',
        timeframe: 'First 10 years',
      },
      {
        metric: 'Youth offense rates',
        value: 'Downward trend',
      },
      {
        metric: 'FGC plan compliance',
        value: 'High',
      },
      {
        metric: 'Court cases',
        value: 'Dramatically reduced',
      },
    ],
    scale: 'Nationwide',
    status: 'published',
  },
  {
    name: 'Maranguka Justice Reinvestment',
    slug: 'maranguka-bourke',
    country: 'Australia',
    region: 'australasia',
    program_type: ['prevention', 'community_based'],
    description:
      'Community-led holistic support initiative in Indigenous community investing in education, driving training, youth mentoring, and family support to address root causes of offending.',
    approach_summary:
      'Community-driven justice reinvestment addressing root causes of youth crime.',
    target_population: 'Aboriginal youth and families in Bourke',
    year_established: 2014,
    recidivism_rate: null,
    recidivism_comparison: '14% drop in youth reoffending rate',
    evidence_strength: 'evaluation_report',
    key_outcomes: [
      {
        metric: 'Top youth offense charges',
        value: '38% reduction',
        timeframe: 'Within 2 years',
      },
      {
        metric: 'Youth reoffending rate',
        value: '14% drop',
      },
      {
        metric: 'Year 12 school retention',
        value: '31% increase',
      },
      {
        metric: 'Cost savings',
        value: 'Millions (KPMG assessment)',
      },
    ],
    scale: 'Bourke, NSW (expanding to other sites)',
    population_served: null,
    australian_adaptations: ['Balata', 'Halls Creek (expanded trials)'],
    status: 'published',
  },
  {
    name: 'NICRO Diversion Programs',
    slug: 'nicro-south-africa',
    country: 'South Africa',
    region: 'africa',
    program_type: ['diversion', 'restorative_justice', 'community_based'],
    description:
      'Comprehensive diversion programs offering life-skills training, community service, victim-offender mediation, and family group conferences as alternatives to formal prosecution under the Child Justice Act.',
    approach_summary:
      'Multi-faceted diversion with life skills, mediation, and family conferences.',
    target_population: 'Youth offenders (all offense levels)',
    year_established: 1990,
    recidivism_rate: 6.7,
    recidivism_comparison:
      'Only 6.7% reoffended in first year, 9.8% by two years (vs 60-70% general rate)',
    evidence_strength: 'evaluation_report',
    key_outcomes: [
      {
        metric: 'Recidivism rate (1 year)',
        value: '6.7%',
      },
      {
        metric: 'Recidivism rate (2 years)',
        value: '9.8%',
      },
      {
        metric: 'Program completion',
        value: '80-91%',
      },
      {
        metric: 'Youth diverted annually',
        value: 'Thousands',
        detail: 'Scaled nationally via Child Justice Act 2008',
      },
    ],
    scale: 'Nationwide',
    status: 'published',
  },
  {
    name: 'Progression Units',
    slug: 'progression-units-brazil',
    country: 'Brazil',
    region: 'latin_america',
    program_type: ['custodial_reform', 'education_vocational'],
    description:
      'Merit-based gradual-release rehabilitative units in custody where youth earn privileges through work, education, and good behavior. Operates on reward and responsibility system preparing for reentry.',
    approach_summary:
      'Merit-based custodial units with intensive education and work programs.',
    target_population: 'Incarcerated youth and young adults',
    year_established: null,
    recidivism_rate: 4.0,
    recidivism_comparison:
      '~4% recidivism in youth Progression Units; <2% in women\'s units (extraordinarily low vs typical rates)',
    evidence_strength: 'evaluation_report',
    key_outcomes: [
      {
        metric: 'Recidivism rate (youth units)',
        value: '~4%',
      },
      {
        metric: 'Recidivism rate (women\'s units)',
        value: '< 2%',
      },
      {
        metric: 'Enrolled in education',
        value: '9,500+',
        detail: 'Paraná custody population',
      },
      {
        metric: 'Enrolled in work programs',
        value: '~14,000',
        detail: 'Industries, agriculture, services',
      },
    ],
    scale: 'Paraná state (expanding as national benchmark)',
    population_served: 23500,
    status: 'published',
  },
];

async function populatePrograms() {
  console.log('📚 Populating global best practice programs...\n');

  for (const program of programs) {
    console.log(`Adding: ${program.name}...`);

    const { data, error } = await supabase
      .from('international_programs')
      .insert([
        {
          ...program,
          key_outcomes: JSON.stringify(program.key_outcomes),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Added: ${data.id}`);
    }
  }

  console.log('\n🎉 All programs added!');

  // Verify count
  const { count } = await supabase
    .from('international_programs')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total programs in database: ${count}`);
}

populatePrograms();
