#!/usr/bin/env node
/**
 * ALMA Data Overlap Checker
 * 
 * Identifies and reports overlaps between data tables
 * Helps maintain data cleanliness and prevent duplication
 * 
 * Usage:
 *   node alma-data-overlap-checker.mjs --full
 *   node alma-data-overlap-checker.mjs --services-interventions
 *   node alma-data-overlap-checker.mjs --urls
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
const fullReport = args.includes('--full');
const checkServicesInterventions = args.includes('--services-interventions') || fullReport;
const checkUrls = args.includes('--urls') || fullReport;
const checkOrphans = args.includes('--orphans') || fullReport;

console.log('\n🔍 ALMA Data Overlap Checker');
console.log('═'.repeat(60));

// Check 1: Services vs Interventions overlap
async function checkServicesInterventionsOverlap() {
  console.log('\n📊 Checking Services ↔ Interventions Overlap');
  
  const { data: interventions, error: intError } = await supabase
    .from('alma_interventions')
    .select('id, name, linked_service_id, website, source_documents');
  
  if (intError) {
    console.log('   ❌ Error:', intError.message);
    return;
  }
  
  const { data: services, error: svcError } = await supabase
    .from('services')
    .select('id, name, website');
  
  if (svcError) {
    console.log('   ❌ Error:', svcError.message);
    return;
  }
  
  // Find by linked_service_id
  const linkedInterventions = interventions.filter(i => i.linked_service_id);
  console.log(`   Interventions with linked_service_id: ${linkedInterventions.length}`);
  
  // Find by name similarity
  const nameMatches = [];
  for (const intervention of interventions) {
    for (const service of services) {
      const intName = (intervention.name || '').toLowerCase();
      const svcName = (service.name || '').toLowerCase();
      
      if (intName === svcName || 
          intName.includes(svcName) || 
          svcName.includes(intName)) {
        if (intName.length > 10 && svcName.length > 10) {
          nameMatches.push({
            intervention: intervention.name,
            service: service.name,
            intervention_id: intervention.id,
            service_id: service.id,
            linked: intervention.linked_service_id === service.id
          });
        }
      }
    }
  }
  
  console.log(`   Potential name matches: ${nameMatches.length}`);
  
  // Find by URL similarity
  const urlMatches = [];
  for (const intervention of interventions) {
    const intUrl = intervention.website || 
                   intervention.source_documents?.[0]?.url || '';
    if (!intUrl) continue;
    
    for (const service of services) {
      const svcUrl = service.website || '';
      if (!svcUrl) continue;
      
      if (intUrl === svcUrl || 
          intUrl.includes(svcUrl) || 
          svcUrl.includes(intUrl)) {
        urlMatches.push({
          intervention: intervention.name,
          service: service.name,
          url: intUrl
        });
      }
    }
  }
  
  console.log(`   Potential URL matches: ${urlMatches.length}`);
  
  // Report
  if (nameMatches.length > 0) {
    console.log('\n   Sample name matches:');
    nameMatches.slice(0, 5).forEach(m => {
      console.log(`     ${m.linked ? '✅' : '⚠️'} "${m.intervention.substring(0, 40)}..." ↔ "${m.service.substring(0, 40)}..."`);
    });
  }
  
  return {
    linked_count: linkedInterventions.length,
    name_matches: nameMatches.length,
    url_matches: urlMatches.length,
    unlinked_potential: nameMatches.filter(m => !m.linked).length
  };
}

// Check 2: URL uniqueness across tables
async function checkUrlUniqueness() {
  console.log('\n🔗 Checking URL Uniqueness');
  
  // Collect all URLs
  const allUrls = new Map(); // url -> [sources]
  
  // From interventions
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, website, source_documents');
  
  for (const i of interventions || []) {
    const urls = [
      i.website,
      ...(i.source_documents || []).map(d => d.url)
    ].filter(Boolean);
    
    for (const url of urls) {
      const normalized = url.split('?')[0].replace(/\/$/, '');
      if (!allUrls.has(normalized)) {
        allUrls.set(normalized, []);
      }
      allUrls.get(normalized).push({
        type: 'intervention',
        id: i.id,
        name: i.name
      });
    }
  }
  
  // From discovered_links
  const { data: links } = await supabase
    .from('alma_discovered_links')
    .select('id, url, status');
  
  for (const l of links || []) {
    if (!l.url) continue;
    const normalized = l.url.split('?')[0].replace(/\/$/, '');
    if (!allUrls.has(normalized)) {
      allUrls.set(normalized, []);
    }
    allUrls.get(normalized).push({
      type: 'discovered_link',
      id: l.id,
      status: l.status
    });
  }
  
  // Find duplicates
  const duplicates = [];
  for (const [url, sources] of allUrls) {
    if (sources.length > 1) {
      duplicates.push({ url, sources });
    }
  }
  
  console.log(`   Total unique URLs: ${allUrls.size}`);
  console.log(`   URLs appearing multiple times: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n   Sample duplicates:');
    duplicates.slice(0, 5).forEach(d => {
      console.log(`     ${d.url.substring(0, 50)}...`);
      d.sources.forEach(s => {
        console.log(`       - ${s.type}: ${s.name || s.status || s.id.substring(0, 8)}`);
      });
    });
  }
  
  return {
    total_urls: allUrls.size,
    duplicates: duplicates.length
  };
}

// Check 3: Orphaned records
async function checkOrphanedRecords() {
  console.log('\n👤 Checking Orphaned Records');
  
  // Interventions with linked_service_id that doesn't exist
  const { data: orphanedLinks } = await supabase
    .from('alma_interventions')
    .select('id, name, linked_service_id')
    .not('linked_service_id', 'is', null);
  
  let orphanedServices = 0;
  for (const i of orphanedLinks || []) {
    const { data: service } = await supabase
      .from('services')
      .select('id')
      .eq('id', i.linked_service_id)
      .single();
    
    if (!service) {
      orphanedServices++;
    }
  }
  
  console.log(`   Interventions with orphaned service links: ${orphanedServices}`);
  
  // Evidence not linked to any intervention
  const { data: unlinkedEvidence } = await supabase
    .from('alma_evidence')
    .select('id, title');
  
  let unlinkedCount = 0;
  for (const e of unlinkedEvidence || []) {
    const { data: links } = await supabase
      .from('alma_intervention_evidence')
      .select('id')
      .eq('evidence_id', e.id);
    
    if (!links || links.length === 0) {
      unlinkedCount++;
    }
  }
  
  console.log(`   Evidence not linked to any intervention: ${unlinkedCount} / ${unlinkedEvidence?.length || 0}`);
  
  // Interventions without evidence
  const { data: interventionsWithoutEvidence } = await supabase
    .from('alma_interventions')
    .select('id');
  
  let noEvidenceCount = 0;
  for (const i of interventionsWithoutEvidence || []) {
    const { data: links } = await supabase
      .from('alma_intervention_evidence')
      .select('id')
      .eq('intervention_id', i.id);
    
    if (!links || links.length === 0) {
      noEvidenceCount++;
    }
  }
  
  console.log(`   Interventions without evidence: ${noEvidenceCount} / ${interventionsWithoutEvidence?.length || 0}`);
  
  return {
    orphaned_service_links: orphanedServices,
    unlinked_evidence: unlinkedCount,
    interventions_without_evidence: noEvidenceCount
  };
}

// Check 4: Data quality summary
async function dataQualitySummary() {
  console.log('\n📈 Data Quality Summary');
  
  // Interventions with missing required fields
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('name, type, description, consent_level, cultural_authority');
  
  const missingName = interventions.filter(i => !i.name).length;
  const missingType = interventions.filter(i => !i.type).length;
  const missingDescription = interventions.filter(i => !i.description || i.description.length < 50).length;
  const missingConsent = interventions.filter(i => !i.consent_level).length;
  const missingCulturalAuth = interventions.filter(i => 
    i.consent_level !== 'Public Knowledge Commons' && !i.cultural_authority
  ).length;
  
  console.log('   Interventions field completeness:');
  console.log(`     Name: ${((1 - missingName/interventions.length) * 100).toFixed(1)}%`);
  console.log(`     Type: ${((1 - missingType/interventions.length) * 100).toFixed(1)}%`);
  console.log(`     Description: ${((1 - missingDescription/interventions.length) * 100).toFixed(1)}%`);
  console.log(`     Consent Level: ${((1 - missingConsent/interventions.length) * 100).toFixed(1)}%`);
  console.log(`     Cultural Authority (when required): ${((1 - missingCulturalAuth/interventions.length) * 100).toFixed(1)}%`);
  
  // Duplicate interventions by name
  const nameCounts = {};
  for (const i of interventions) {
    const name = (i.name || '').toLowerCase().trim();
    if (name) {
      nameCounts[name] = (nameCounts[name] || 0) + 1;
    }
  }
  
  const duplicateNames = Object.entries(nameCounts).filter(([k, v]) => v > 1);
  console.log(`\n   Duplicate intervention names: ${duplicateNames.length}`);
  
  if (duplicateNames.length > 0) {
    console.log('   Sample duplicates:');
    duplicateNames.slice(0, 5).forEach(([name, count]) => {
      console.log(`     "${name.substring(0, 50)}..." appears ${count} times`);
    });
  }
  
  return {
    total_interventions: interventions.length,
    missing_fields: {
      name: missingName,
      type: missingType,
      description: missingDescription,
      consent: missingConsent,
      cultural_authority: missingCulturalAuth
    },
    duplicate_names: duplicateNames.length
  };
}

// Main
async function main() {
  const results = {};
  
  if (checkServicesInterventions) {
    results.services_interventions = await checkServicesInterventionsOverlap();
  }
  
  if (checkUrls) {
    results.urls = await checkUrlUniqueness();
  }
  
  if (checkOrphans) {
    results.orphans = await checkOrphanedRecords();
  }
  
  results.quality = await dataQualitySummary();
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 OVERLAP SUMMARY');
  console.log('═'.repeat(60));
  
  if (results.services_interventions) {
    console.log('\nServices ↔ Interventions:');
    console.log(`  Linked: ${results.services_interventions.linked_count}`);
    console.log(`  Potential name matches: ${results.services_interventions.name_matches}`);
    console.log(`  Potential URL matches: ${results.services_interventions.url_matches}`);
    console.log(`  Unlinked potential: ${results.services_interventions.unlinked_potential}`);
  }
  
  if (results.urls) {
    console.log('\nURL Uniqueness:');
    console.log(`  Total URLs: ${results.urls.total_urls}`);
    console.log(`  Duplicates: ${results.urls.duplicates}`);
  }
  
  if (results.orphans) {
    console.log('\nOrphaned Records:');
    console.log(`  Orphaned service links: ${results.orphans.orphaned_service_links}`);
    console.log(`  Unlinked evidence: ${results.orphans.unlinked_evidence}`);
    console.log(`  Interventions without evidence: ${results.orphans.interventions_without_evidence}`);
  }
  
  console.log('\nData Quality:');
  console.log(`  Total interventions: ${results.quality.total_interventions}`);
  console.log(`  Duplicate names: ${results.quality.duplicate_names}`);
  
  console.log('\n✅ Overlap check complete!');
}

main().catch(console.error);
