#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n📊 COMPREHENSIVE ALMA SYSTEM REVIEW\n');
console.log('='.repeat(80));

// ===== 1. OVERALL DATABASE STATS =====
console.log('\n1️⃣  OVERALL DATABASE STATISTICS\n');

const { data: allInterventions, count: totalCount } = await supabase
  .from('alma_interventions')
  .select('*', { count: 'exact' });

console.log(`Total Interventions in Database: ${totalCount}`);

// By consent level
const consentBreakdown = {};
allInterventions.forEach(i => {
  consentBreakdown[i.consent_level] = (consentBreakdown[i.consent_level] || 0) + 1;
});

console.log('\nBy Consent Level:');
Object.entries(consentBreakdown).forEach(([level, count]) => {
  const pct = ((count / totalCount) * 100).toFixed(1);
  console.log(`  ${level}: ${count} (${pct}%)`);
});

// By review status
const statusBreakdown = {};
allInterventions.forEach(i => {
  statusBreakdown[i.review_status] = (statusBreakdown[i.review_status] || 0) + 1;
});

console.log('\nBy Review Status:');
Object.entries(statusBreakdown).forEach(([status, count]) => {
  const pct = ((count / totalCount) * 100).toFixed(1);
  console.log(`  ${status}: ${count} (${pct}%)`);
});

// ===== 2. NT PROGRAMS DETAILED =====
console.log('\n' + '='.repeat(80));
console.log('\n2️⃣  NT PROGRAMS ANALYSIS\n');

const ntPrograms = allInterventions.filter(i => i.geography && i.geography.includes('NT'));

console.log(`Total NT Programs: ${ntPrograms.length}`);

const ntAboriginal = ntPrograms.filter(p => p.consent_level === 'Community Controlled');
const ntGovernment = ntPrograms.filter(p => p.consent_level === 'Public Knowledge Commons');

console.log(`  Aboriginal-led: ${ntAboriginal.length} (${((ntAboriginal.length / ntPrograms.length) * 100).toFixed(1)}%)`);
console.log(`  Government: ${ntGovernment.length} (${((ntGovernment.length / ntPrograms.length) * 100).toFixed(1)}%)`);

// Programs with proven outcomes
const ntWithOutcomes = ntPrograms.filter(p => {
  const metadata = p.metadata || {};
  return metadata.outcomes || metadata.comparison_to_oochiumpa;
});

console.log(`\nPrograms with Outcomes Data: ${ntWithOutcomes.length}`);
ntWithOutcomes.forEach(p => {
  const metadata = p.metadata || {};
  console.log(`  - ${p.name}`);
  if (metadata.outcomes) console.log(`    Outcomes: ${metadata.outcomes}`);
});

// Justice Reinvestment programs
const ntJR = ntPrograms.filter(p => p.type === 'Justice Reinvestment');
console.log(`\nJustice Reinvestment Programs: ${ntJR.length}`);
ntJR.forEach(p => {
  const metadata = p.metadata || {};
  console.log(`  - ${p.name}`);
  if (metadata.funding) console.log(`    Funding: ${metadata.funding}`);
});

// ===== 3. GEOGRAPHIC COVERAGE =====
console.log('\n' + '='.repeat(80));
console.log('\n3️⃣  GEOGRAPHIC COVERAGE\n');

const geographyCount = {};
allInterventions.forEach(i => {
  if (i.geography && Array.isArray(i.geography)) {
    i.geography.forEach(loc => {
      geographyCount[loc] = (geographyCount[loc] || 0) + 1;
    });
  }
});

// Sort by count
const sortedGeo = Object.entries(geographyCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

console.log('Top 15 Locations:');
sortedGeo.forEach(([loc, count]) => {
  console.log(`  ${loc}: ${count} programs`);
});

// ===== 4. EVIDENCE LEVELS =====
console.log('\n' + '='.repeat(80));
console.log('\n4️⃣  EVIDENCE QUALITY\n');

const evidenceBreakdown = {};
allInterventions.forEach(i => {
  evidenceBreakdown[i.evidence_level] = (evidenceBreakdown[i.evidence_level] || 0) + 1;
});

Object.entries(evidenceBreakdown)
  .sort((a, b) => b[1] - a[1])
  .forEach(([level, count]) => {
    const pct = ((count / totalCount) * 100).toFixed(1);
    console.log(`  ${level}: ${count} (${pct}%)`);
  });

// ===== 5. DATA QUALITY METRICS =====
console.log('\n' + '='.repeat(80));
console.log('\n5️⃣  DATA QUALITY METRICS\n');

let hasDescription = 0;
let hasWebsite = 0;
let hasMetadata = 0;
let hasTargetCohort = 0;
let hasSourceAttribution = 0;

allInterventions.forEach(i => {
  if (i.description && i.description.length > 50) hasDescription++;
  if (i.website) hasWebsite++;
  if (i.metadata && Object.keys(i.metadata).length > 0) hasMetadata++;
  if (i.target_cohort && i.target_cohort.length > 0) hasTargetCohort++;
  const metadata = i.metadata || {};
  if (metadata.source) hasSourceAttribution++;
});

console.log('Completeness:');
console.log(`  Description: ${hasDescription}/${totalCount} (${((hasDescription / totalCount) * 100).toFixed(1)}%)`);
console.log(`  Website: ${hasWebsite}/${totalCount} (${((hasWebsite / totalCount) * 100).toFixed(1)}%)`);
console.log(`  Metadata: ${hasMetadata}/${totalCount} (${((hasMetadata / totalCount) * 100).toFixed(1)}%)`);
console.log(`  Target Cohort: ${hasTargetCohort}/${totalCount} (${((hasTargetCohort / totalCount) * 100).toFixed(1)}%)`);
console.log(`  Source Attribution: ${hasSourceAttribution}/${totalCount} (${((hasSourceAttribution / totalCount) * 100).toFixed(1)}%)`);

// ===== 6. SCRAPING WORK REVIEW =====
console.log('\n' + '='.repeat(80));
console.log('\n6️⃣  SCRAPING WORK COMPLETED\n');

// Check for learning system data
const { data: extractionHistory, count: extractionCount } = await supabase
  .from('alma_extraction_history')
  .select('*', { count: 'exact' });

console.log(`Total Extraction Attempts: ${extractionCount || 0}`);

if (extractionHistory && extractionHistory.length > 0) {
  const successfulExtractions = extractionHistory.filter(e => e.extraction_success).length;
  console.log(`Successful Extractions: ${successfulExtractions}`);
  console.log(`Success Rate: ${((successfulExtractions / extractionCount) * 100).toFixed(1)}%`);

  // Document types scraped
  const docTypes = {};
  extractionHistory.forEach(e => {
    docTypes[e.document_type] = (docTypes[e.document_type] || 0) + 1;
  });

  console.log('\nDocument Types Scraped:');
  Object.entries(docTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} documents`);
  });
}

// ===== 7. INTERVENTION TYPES =====
console.log('\n' + '='.repeat(80));
console.log('\n7️⃣  INTERVENTION TYPES\n');

const typeBreakdown = {};
allInterventions.forEach(i => {
  typeBreakdown[i.type] = (typeBreakdown[i.type] || 0) + 1;
});

Object.entries(typeBreakdown)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    const pct = ((count / totalCount) * 100).toFixed(1);
    console.log(`  ${type}: ${count} (${pct}%)`);
  });

// ===== 8. KEY GAPS & OPPORTUNITIES =====
console.log('\n' + '='.repeat(80));
console.log('\n8️⃣  KEY GAPS & OPPORTUNITIES\n');

// Programs without websites
const noWebsite = allInterventions.filter(i => !i.website).length;
console.log(`Programs without website: ${noWebsite}`);

// Aboriginal programs needing enrichment
const aboriginalNeedingWork = allInterventions.filter(i => {
  if (i.consent_level !== 'Community Controlled') return false;
  const metadata = i.metadata || {};
  return !metadata.programs && !metadata.outcomes;
}).length;
console.log(`Aboriginal programs needing enrichment: ${aboriginalNeedingWork}`);

// States/territories with low coverage
console.log('\nStates/Territories Coverage:');
['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].forEach(state => {
  const count = geographyCount[state] || 0;
  const status = count > 20 ? '✅' : count > 10 ? '⚠️' : '❌';
  console.log(`  ${status} ${state}: ${count} programs`);
});

// ===== 9. RECOMMENDATION SUMMARY =====
console.log('\n' + '='.repeat(80));
console.log('\n9️⃣  RECOMMENDATIONS FOR NEXT PHASE\n');

console.log('Priority Areas:');

// Identify states needing work
const lowCoverageStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT'].filter(state =>
  (geographyCount[state] || 0) < 20
);

if (lowCoverageStates.length > 0) {
  console.log(`\n1. Expand to ${lowCoverageStates.join(', ')}`);
  console.log(`   - Current coverage: ${lowCoverageStates.map(s => `${s} (${geographyCount[s] || 0})`).join(', ')}`);
  console.log(`   - Target: 20+ programs per state`);
}

if (aboriginalNeedingWork > 0) {
  console.log(`\n2. Enrich ${aboriginalNeedingWork} Aboriginal programs`);
  console.log('   - Add outcomes data where available');
  console.log('   - Document program components');
  console.log('   - Verify cultural authority details');
}

console.log('\n3. Evidence & Outcome Linkage');
const needsEvidence = allInterventions.filter(i => {
  const metadata = i.metadata || {};
  return !metadata.outcomes && !metadata.evaluation;
}).length;
console.log(`   - ${needsEvidence} programs without outcomes data`);
console.log('   - Link academic research to interventions');
console.log('   - Create evidence records in junction tables');

console.log('\n4. Community Consent & Verification');
const needsConsent = allInterventions.filter(i =>
  i.consent_level === 'Community Controlled' && !i.reviewed_by
).length;
console.log(`   - ${needsConsent} Aboriginal programs need community review`);
console.log('   - Reach out to organizations for verification');
console.log('   - Establish consent records');

console.log('\n' + '='.repeat(80));
console.log('\n✅ Review Complete!\n');
