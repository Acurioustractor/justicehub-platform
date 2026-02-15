#!/usr/bin/env node
/**
 * ALMA Status Report - Generate summary of extracted data
 */

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

async function main() {
  // Get counts
  const { count: interventionCount } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true });

  const { count: linkCount } = await supabase
    .from('alma_discovered_links')
    .select('*', { count: 'exact', head: true });

  const { count: pendingCount } = await supabase
    .from('alma_discovered_links')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: fundingCount } = await supabase
    .from('alma_funding_data')
    .select('*', { count: 'exact', head: true });

  // Get intervention types
  const { data: types } = await supabase.from('alma_interventions').select('type');
  const typeCounts = {};
  for (const t of types || []) {
    typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
  }

  // Get jurisdictions
  const { data: geos } = await supabase.from('alma_interventions').select('geography');
  const geoCounts = {};
  for (const g of geos || []) {
    for (const j of g.geography || []) {
      geoCounts[j] = (geoCounts[j] || 0) + 1;
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║           ALMA DATABASE STATUS REPORT                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  console.log('\n📊 OVERALL METRICS:');
  console.log(`   Total interventions: ${interventionCount}`);
  console.log(`   Funding records: ${fundingCount}`);
  console.log(`   Total discovered links: ${linkCount}`);
  console.log(`   Pending links to process: ${pendingCount}`);

  console.log('\n📋 INTERVENTIONS BY TYPE:');
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type || 'Unknown'}: ${count}`);
    });

  console.log('\n🗺️ INTERVENTIONS BY JURISDICTION:');
  Object.entries(geoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([geo, count]) => {
      console.log(`   ${geo}: ${count}`);
    });

  console.log('\n💰 FUNDING SUMMARY:');
  console.log('   National expenditure: $1.5 billion (2023-24)');
  console.log('   Detention: 65.5% ($982.5M)');
  console.log('   Community: 34.5% ($517.5M)');
  console.log('   Detention cost: $3,320/day');
  console.log('   Community cost: ~$150/day (estimated)');
  console.log('   Potential savings: $3,170/day per young person diverted');

  console.log('\n📈 KEY INSIGHTS:');
  console.log('   • 65.4% of supervised youth had child protection interaction');
  console.log('   • Housing insecurity linked to recidivism');
  console.log('   • Youth justice smallest community services expenditure');
  console.log('   • Diversion to community programs = 95% cost reduction');

  console.log('\n✅ Status report complete!');
}

main().catch(console.error);
