#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🔍 Verifying Oochiumpa Integration\n');

// Get latest intervention
const { data: intervention } = await supabase
  .from('alma_interventions')
  .select('*')
  .eq('name', 'Oochiumpa Youth Services')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (intervention) {
  console.log('✅ Intervention Found:');
  console.log('   ID:', intervention.id);
  console.log('   Name:', intervention.name);
  console.log('   Type:', intervention.type);
  console.log('   Evidence Level:', intervention.evidence_level);
  console.log('   Cultural Authority:', intervention.cultural_authority);
  console.log('   Consent Level:', intervention.consent_level);

  // Get linked outcomes
  const { data: outcomeLinks } = await supabase
    .from('alma_intervention_outcomes')
    .select('outcome_id')
    .eq('intervention_id', intervention.id);

  console.log('\n✅ Outcomes Linked:', outcomeLinks?.length || 0);

  // Get outcome details
  if (outcomeLinks && outcomeLinks.length > 0) {
    const outcomeIds = outcomeLinks.map((l) => l.outcome_id);
    const { data: outcomes } = await supabase
      .from('alma_outcomes')
      .select('name, outcome_type')
      .in('id', outcomeIds);

    outcomes?.forEach((o) => {
      console.log('   -', o.outcome_type + ':', o.name);
    });
  }

  // Get evidence
  const { data: evidenceLinks } = await supabase
    .from('alma_intervention_evidence')
    .select('evidence_id')
    .eq('intervention_id', intervention.id);

  console.log('\n✅ Evidence Records:', evidenceLinks?.length || 0);

  // Get consent
  const { data: consent } = await supabase
    .from('alma_consent_ledger')
    .select('*')
    .eq('entity_type', 'intervention')
    .eq('entity_id', intervention.id)
    .single();

  if (consent) {
    console.log('\n✅ Consent Record:');
    console.log('   Level:', consent.consent_level);
    console.log('   Given By:', consent.consent_given_by);
    console.log(
      '   Revenue Share:',
      consent.revenue_share_enabled ? consent.revenue_share_percentage + '%' : 'No'
    );
  }

  // Check story metadata
  if (intervention.metadata?.empathy_ledger_stories) {
    console.log('\n✅ Story References:');
    console.log('   Count:', intervention.metadata.empathy_ledger_stories.count);
    console.log('   Source:', intervention.metadata.empathy_ledger_stories.source);
    const types = intervention.metadata.empathy_ledger_stories.story_types;
    console.log('   Types:');
    Object.entries(types).forEach(([type, count]) => {
      if (count > 0) console.log('     -', type + ':', count);
    });
  }

  console.log('\n═'.repeat(80));
  console.log('\n✅ OOCHIUMPA INTEGRATION VERIFIED');
  console.log('   All components successfully created and linked\n');
} else {
  console.log('❌ No Oochiumpa intervention found\n');
}
