#!/usr/bin/env node
/**
 * ALMA Fix All Data Issues
 * 
 * Comprehensive data repair script that addresses:
 * 1. Evidence linking (94% unlinked)
 * 2. Duplicate removal
 * 3. URL normalization
 * 4. Empty table population
 * 5. Relationship building
 * 
 * Usage:
 *   node alma-fix-all-data-issues.mjs --dry-run
 *   node alma-fix-all-data-issues.mjs --fix
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const [key, ...values] = line.split('=');
          const trimmedKey = key.trim();
          if (!env[trimmedKey]) {
            env[trimmedKey] = values.join('=').trim();
          }
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();

// Validate
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter(key => !env[key]);
if (missing.length > 0) {
  console.error('❌ Missing:', missing.join(', '));
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fixMode = args.includes('--fix');

if (!dryRun && !fixMode) {
  console.log('Usage: node alma-fix-all-data-issues.mjs --dry-run | --fix');
  process.exit(0);
}

console.log('\n🔧 ALMA Fix All Data Issues');
console.log('═'.repeat(60));
console.log(dryRun ? '🧪 DRY RUN MODE' : '⚠️  LIVE FIX MODE');
console.log('');

// Stats tracking
const stats = {
  evidenceLinked: 0,
  duplicatesRemoved: 0,
  urlsNormalized: 0,
  sourcesPopulated: 0,
  contextsCreated: 0,
  outcomesLinked: 0,
};

// ==========================================
// FIX 1: Link Evidence to Interventions
// ==========================================
async function fixEvidenceLinking() {
  console.log('\n📚 FIX 1: Linking Evidence to Interventions');
  console.log('─'.repeat(50));
  
  // Get unlinked evidence
  const { data: evidenceList } = await supabase
    .from('alma_evidence')
    .select('*');
  
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, description, operating_organization, geography, type');
  
  console.log(`   Evidence records: ${evidenceList?.length || 0}`);
  console.log(`   Interventions: ${interventions?.length || 0}`);
  
  const linksToCreate = [];
  
  for (const evidence of evidenceList || []) {
    // Find matching interventions
    const matches = [];
    
    for (const intervention of interventions || []) {
      let score = 0;
      
      // Name similarity
      const evidenceTitle = (evidence.title || '').toLowerCase();
      const intName = (intervention.name || '').toLowerCase();
      const intDesc = (intervention.description || '').toLowerCase();
      
      if (evidenceTitle.includes(intName) || intName.includes(evidenceTitle)) {
        score += 30;
      }
      
      // Keyword matching
      const keywords = [
        'youth', 'justice', 'diversion', 'detention', 'aboriginal', 
        'indigenous', 'prevention', 'program', 'intervention'
      ];
      
      for (const kw of keywords) {
        if (evidenceTitle.includes(kw) && (intName.includes(kw) || intDesc.includes(kw))) {
          score += 10;
        }
      }
      
      // Organization match
      if (evidence.organization && intervention.operating_organization) {
        const org1 = evidence.organization.toLowerCase();
        const org2 = intervention.operating_organization.toLowerCase();
        if (org1.includes(org2) || org2.includes(org1)) {
          score += 25;
        }
      }
      
      // Geography match
      if (evidence.findings && intervention.geography) {
        for (const geo of intervention.geography) {
          if (evidence.findings.toLowerCase().includes(geo.toLowerCase())) {
            score += 15;
          }
        }
      }
      
      // High confidence match
      if (score >= 50) {
        matches.push({ intervention, score });
      }
    }
    
    // Take top 3 matches
    matches.sort((a, b) => b.score - a.score);
    
    for (const match of matches.slice(0, 3)) {
      linksToCreate.push({
        intervention_id: match.intervention.id,
        evidence_id: evidence.id,
        match_score: match.score,
      });
    }
  }
  
  console.log(`   Potential links found: ${linksToCreate.length}`);
  
  if (dryRun) {
    console.log('   Sample links (dry run):');
    for (const link of linksToCreate.slice(0, 5)) {
      const int = interventions.find(i => i.id === link.intervention_id);
      const ev = evidenceList.find(e => e.id === link.evidence_id);
      console.log(`     [${link.match_score}] "${int?.name?.substring(0, 40)}..." ↔ "${ev?.title?.substring(0, 40)}..."`);
    }
  } else {
    // Create links in batches
    const batchSize = 50;
    for (let i = 0; i < linksToCreate.length; i += batchSize) {
      const batch = linksToCreate.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('alma_intervention_evidence')
        .upsert(batch, { onConflict: ['intervention_id', 'evidence_id'] });
      
      if (error) {
        console.log(`   ❌ Batch ${i}: ${error.message}`);
      } else {
        stats.evidenceLinked += batch.length;
        console.log(`   ✅ Batch ${i}: ${batch.length} links created`);
      }
    }
  }
}

// ==========================================
// FIX 2: Remove Duplicate Names
// ==========================================
async function fixDuplicateNames() {
  console.log('\n🧹 FIX 2: Removing Duplicate Names');
  console.log('─'.repeat(50));
  
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, description, website, created_at');
  
  // Group by normalized name
  const nameGroups = {};
  for (const i of interventions || []) {
    const normalizedName = (i.name || '').toLowerCase().trim();
    if (!normalizedName) continue;
    
    if (!nameGroups[normalizedName]) {
      nameGroups[normalizedName] = [];
    }
    nameGroups[normalizedName].push(i);
  }
  
  const duplicates = Object.entries(nameGroups).filter(([k, v]) => v.length > 1);
  console.log(`   Duplicate name groups found: ${duplicates.length}`);
  
  const toDelete = [];
  
  for (const [name, group] of duplicates) {
    // Keep the one with longest description, delete others
    group.sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0));
    const keep = group[0];
    const remove = group.slice(1);
    
    console.log(`   "${name.substring(0, 50)}...": Keeping ${keep.id.substring(0, 8)}, removing ${remove.length}`);
    
    for (const r of remove) {
      toDelete.push(r.id);
    }
  }
  
  console.log(`   Total to delete: ${toDelete.length}`);
  
  if (dryRun) {
    console.log('   (Not deleting in dry run mode)');
  } else if (toDelete.length > 0) {
    // Delete in batches
    for (let i = 0; i < toDelete.length; i += 10) {
      const batch = toDelete.slice(i, i + 10);
      const { error } = await supabase
        .from('alma_interventions')
        .delete()
        .in('id', batch);
      
      if (error) {
        console.log(`   ❌ Delete batch ${i}: ${error.message}`);
      } else {
        stats.duplicatesRemoved += batch.length;
        console.log(`   ✅ Deleted batch ${i}: ${batch.length}`);
      }
    }
  }
}

// ==========================================
// FIX 3: Populate Empty Tables
// ==========================================
async function fixEmptyTables() {
  console.log('\n📋 FIX 3: Populating Empty Tables');
  console.log('─'.repeat(50));
  
  // 3.1 Populate alma_sources
  const defaultSources = [
    { name: 'AIHW Youth Justice', url: 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice', type: 'government', jurisdiction: 'National', priority: 100, cultural_authority: false },
    { name: 'AIHW Youth Detention', url: 'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2024', type: 'government', jurisdiction: 'National', priority: 95, cultural_authority: false },
    { name: 'QLD Youth Justice', url: 'https://www.youthjustice.qld.gov.au/', type: 'government', jurisdiction: 'QLD', priority: 90, cultural_authority: false },
    { name: 'NSW Youth Justice', url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html', type: 'government', jurisdiction: 'NSW', priority: 90, cultural_authority: false },
    { name: 'VIC Youth Justice', url: 'https://www.justice.vic.gov.au/youth-justice', type: 'government', jurisdiction: 'VIC', priority: 90, cultural_authority: false },
    { name: 'WA Youth Justice', url: 'https://www.wa.gov.au/organisation/department-of-justice/youth-justice-services', type: 'government', jurisdiction: 'WA', priority: 85, cultural_authority: false },
    { name: 'SA Youth Justice', url: 'https://www.childprotection.sa.gov.au/youth-justice', type: 'government', jurisdiction: 'SA', priority: 85, cultural_authority: false },
    { name: 'NT Youth Justice', url: 'https://agd.nt.gov.au/', type: 'government', jurisdiction: 'NT', priority: 85, cultural_authority: false },
    { name: 'TAS Youth Justice', url: 'https://www.decyp.tas.gov.au/safe-children/youth-justice-services/', type: 'government', jurisdiction: 'TAS', priority: 85, cultural_authority: false },
    { name: 'ACT Community Services', url: 'https://www.communityservices.act.gov.au/', type: 'government', jurisdiction: 'ACT', priority: 85, cultural_authority: false },
    { name: 'NATSILS', url: 'https://www.natsils.org.au/', type: 'indigenous', jurisdiction: 'National', priority: 100, cultural_authority: true },
    { name: 'SNAICC', url: 'https://www.snaicc.org.au/', type: 'indigenous', jurisdiction: 'National', priority: 95, cultural_authority: true },
    { name: 'ALS NSW/ACT', url: 'https://www.alsnswact.org.au/', type: 'indigenous', jurisdiction: 'NSW/ACT', priority: 90, cultural_authority: true },
    { name: 'VALS', url: 'https://www.vals.org.au/', type: 'indigenous', jurisdiction: 'VIC', priority: 90, cultural_authority: true },
    { name: 'NAAJA', url: 'https://www.naaja.org.au/', type: 'indigenous', jurisdiction: 'NT', priority: 90, cultural_authority: true },
    { name: 'AIC Research', url: 'https://www.aic.gov.au/research', type: 'research', jurisdiction: 'National', priority: 80, cultural_authority: false },
    { name: 'Youth Law Australia', url: 'https://www.youthlaw.asn.au/', type: 'advocacy', jurisdiction: 'National', priority: 75, cultural_authority: false },
  ];
  
  console.log(`   Populating alma_sources with ${defaultSources.length} sources...`);
  
  if (dryRun) {
    console.log('   (Would insert sources in live mode)');
  } else {
    const { data, error } = await supabase
      .from('alma_sources')
      .upsert(defaultSources.map(s => ({
        ...s,
        active: true,
        health_status: 'unknown',
        scrape_count: 0,
        error_count: 0,
        metadata: {}
      })), { onConflict: 'url' });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      stats.sourcesPopulated = defaultSources.length;
      console.log(`   ✅ Populated ${defaultSources.length} sources`);
    }
  }
  
  // 3.2 Create community contexts for major areas
  const contexts = [
    { name: 'Metro Sydney - Western Sydney', context_type: 'Metro suburb', state: 'NSW', population_size: '50,000+', cultural_authority: 'Local Aboriginal Land Councils' },
    { name: 'Metro Melbourne - Northern Suburbs', context_type: 'Metro suburb', state: 'VIC', population_size: '50,000+', cultural_authority: 'Wurundjeri Woi Wurrung Cultural Heritage Aboriginal Corporation' },
    { name: 'Brisbane - South East Queensland', context_type: 'Metro suburb', state: 'QLD', population_size: '50,000+', cultural_authority: 'Turrbal and Jagera Traditional Owners' },
    { name: 'Perth - Metropolitan Area', context_type: 'Metro suburb', state: 'WA', population_size: '50,000+', cultural_authority: 'Whadjuk Noongar Traditional Owners' },
    { name: 'Remote Northern Territory', context_type: 'Remote community', state: 'NT', population_size: '1,000-10,000', cultural_authority: 'Local Community Elders' },
    { name: 'Regional Queensland', context_type: 'Regional area', state: 'QLD', population_size: '10,000-50,000', cultural_authority: 'Regional Aboriginal Community Controlled Health Services' },
  ];
  
  console.log(`   Creating ${contexts.length} community contexts...`);
  
  if (dryRun) {
    console.log('   (Would create contexts in live mode)');
  } else {
    const { data, error } = await supabase
      .from('alma_community_contexts')
      .upsert(contexts.map(c => ({
        ...c,
        consent_level: 'Community Controlled',
        contributors: ['JusticeHub Data Team']
      })), { onConflict: 'name' });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      stats.contextsCreated = contexts.length;
      console.log(`   ✅ Created ${contexts.length} contexts`);
    }
  }
}

// ==========================================
// FIX 4: Normalize URLs
// ==========================================
async function fixUrlNormalization() {
  console.log('\n🔗 FIX 4: Normalizing URLs');
  console.log('─'.repeat(50));
  
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, website, source_documents');
  
  let updated = 0;
  
  for (const i of interventions || []) {
    let needsUpdate = false;
    let website = i.website;
    let sourceDocs = i.source_documents;
    
    // Normalize website URL
    if (website) {
      const normalized = website
        .split('?')[0]
        .replace(/\/$/, '')
        .toLowerCase();
      
      if (normalized !== website) {
        website = normalized;
        needsUpdate = true;
      }
    }
    
    // Normalize source document URLs
    if (sourceDocs && Array.isArray(sourceDocs)) {
      sourceDocs = sourceDocs.map(doc => {
        if (doc.url) {
          return {
            ...doc,
            url: doc.url.split('?')[0].replace(/\/$/, '').toLowerCase()
          };
        }
        return doc;
      });
      needsUpdate = true;
    }
    
    if (needsUpdate && !dryRun) {
      const { error } = await supabase
        .from('alma_interventions')
        .update({ website, source_documents: sourceDocs })
        .eq('id', i.id);
      
      if (!error) {
        updated++;
        stats.urlsNormalized++;
      }
    }
  }
  
  console.log(`   URLs to normalize: ${stats.urlsNormalized}`);
  
  if (dryRun) {
    console.log('   (Would normalize in live mode)');
  } else {
    console.log(`   ✅ Normalized ${updated} records`);
  }
}

// ==========================================
// FIX 5: Create Default Outcomes
// ==========================================
async function fixOutcomes() {
  console.log('\n🎯 FIX 5: Creating Default Outcomes');
  console.log('─'.repeat(50));
  
  const defaultOutcomes = [
    { name: 'Reduced Youth Detention', outcome_type: 'Reduced detention/incarceration', description: 'Decrease in number of young people in detention', time_horizon: 'Medium-term (1-3 years)', beneficiary: 'System/Government' },
    { name: 'Reduced Recidivism', outcome_type: 'Reduced recidivism', description: 'Lower rate of re-offending among program participants', time_horizon: 'Long-term (3+ years)', beneficiary: 'Community' },
    { name: 'Successful Diversion', outcome_type: 'Diversion from justice system', description: 'Young people diverted from court and detention', time_horizon: 'Short-term (6-12 months)', beneficiary: 'Young person' },
    { name: 'School Re-engagement', outcome_type: 'Educational engagement', description: 'Return to education or training', time_horizon: 'Short-term (6-12 months)', beneficiary: 'Young person' },
    { name: 'Employment Outcome', outcome_type: 'Employment/training', description: 'Secured employment or vocational training', time_horizon: 'Medium-term (1-3 years)', beneficiary: 'Young person' },
    { name: 'Family Reconnection', outcome_type: 'Family connection', description: 'Improved family relationships and support', time_horizon: 'Medium-term (1-3 years)', beneficiary: 'Family' },
    { name: 'Cultural Connection', outcome_type: 'Cultural connection', description: 'Stronger connection to culture and community', time_horizon: 'Medium-term (1-3 years)', beneficiary: 'Community' },
    { name: 'Improved Mental Health', outcome_type: 'Mental health/wellbeing', description: 'Better mental health and wellbeing outcomes', time_horizon: 'Short-term (6-12 months)', beneficiary: 'Young person' },
    { name: 'Reduced Substance Use', outcome_type: 'Reduced substance use', description: 'Decrease in alcohol and drug use', time_horizon: 'Medium-term (1-3 years)', beneficiary: 'Young person' },
    { name: 'Community Safety', outcome_type: 'Community safety', description: 'Reduced crime and improved community safety', time_horizon: 'Long-term (3+ years)', beneficiary: 'Community' },
  ];
  
  console.log(`   Creating ${defaultOutcomes.length} default outcomes...`);
  
  if (dryRun) {
    console.log('   (Would create outcomes in live mode)');
  } else {
    const { data, error } = await supabase
      .from('alma_outcomes')
      .upsert(defaultOutcomes, { onConflict: 'name' });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Created ${defaultOutcomes.length} outcomes`);
      
      // Link outcomes to interventions by type
      for (const intervention of await getAllInterventions()) {
        const matchingOutcomes = defaultOutcomes.filter(o => {
          // Simple matching logic
          if (intervention.type === 'Cultural Connection' && o.outcome_type === 'Cultural connection') return true;
          if (intervention.type === 'Education/Employment' && (o.outcome_type === 'Educational engagement' || o.outcome_type === 'Employment/training')) return true;
          if (intervention.type === 'Diversion' && o.outcome_type === 'Diversion from justice system') return true;
          if (intervention.type === 'Prevention' && o.outcome_type === 'Community safety') return true;
          return false;
        });
        
        for (const outcome of matchingOutcomes) {
          const outcomeRecord = await supabase
            .from('alma_outcomes')
            .select('id')
            .eq('name', outcome.name)
            .single();
          
          if (outcomeRecord.data) {
            await supabase
              .from('alma_intervention_outcomes')
              .upsert({
                intervention_id: intervention.id,
                outcome_id: outcomeRecord.data.id
              }, { onConflict: ['intervention_id', 'outcome_id'] });
            
            stats.outcomesLinked++;
          }
        }
      }
      
      console.log(`   ✅ Linked ${stats.outcomesLinked} intervention-outcome pairs`);
    }
  }
}

async function getAllInterventions() {
  const { data } = await supabase.from('alma_interventions').select('id, type');
  return data || [];
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  console.log('\n🚀 Starting comprehensive data fixes...\n');
  
  await fixEvidenceLinking();
  await fixDuplicateNames();
  await fixEmptyTables();
  await fixUrlNormalization();
  await fixOutcomes();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FIX SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Evidence linked:        ${stats.evidenceLinked}`);
  console.log(`Duplicates removed:     ${stats.duplicatesRemoved}`);
  console.log(`URLs normalized:        ${stats.urlsNormalized}`);
  console.log(`Sources populated:      ${stats.sourcesPopulated}`);
  console.log(`Contexts created:       ${stats.contextsCreated}`);
  console.log(`Outcomes linked:        ${stats.outcomesLinked}`);
  console.log('');
  console.log(dryRun ? '🧪 Dry run complete - no changes made' : '✅ All fixes applied!');
  console.log('');
  
  if (dryRun) {
    console.log('To apply fixes, run with --fix flag');
  }
}

main().catch(console.error);
