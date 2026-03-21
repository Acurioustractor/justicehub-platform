import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/benknight/Code/JusticeHub/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('## Verifying Linkage Issues\n');

// Check sample interventions
const { data: sampleInterventions } = await supabase
  .from('alma_interventions')
  .select('id, name, organization_id, operating_organization')
  .limit(10);

console.log('Sample interventions:');
console.table(sampleInterventions);

// Check if organization_id column exists and has data
const { data: linkedInterventions, error } = await supabase
  .from('alma_interventions')
  .select('id, name, organization_id')
  .not('organization_id', 'is', null)
  .limit(5);

if (error) {
  console.error('Error querying interventions:', error);
} else {
  console.log(`\nLinked interventions found: ${linkedInterventions?.length || 0}`);
  console.table(linkedInterventions);
}

// Check evidence
const { data: sampleEvidence } = await supabase
  .from('alma_evidence')
  .select('id, title, intervention_id')
  .limit(10);

console.log('\nSample evidence:');
console.table(sampleEvidence);
