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
    recidivism_rate: 8.0,
    recidivism_comparison:
      'Less than 8% return to custody after release; under 8% eventually imprisoned as adults',
    evidence_strength: 'longitudinal_study',
  },
];

async function testInsert() {
  console.log('Testing program insert...\n');

  const { data, error } = await supabase
    .from('international_programs')
    .insert([programs[0]])
    .select()
    .single();

  if (error) {
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success!', data);
  }
}

testInsert();
