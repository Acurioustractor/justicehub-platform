#!/usr/bin/env node
/**
 * ALMA Complete Evidence Linking
 * 
 * Links all remaining evidence to interventions
 * Uses multiple matching strategies
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n📚 ALMA Complete Evidence Linking');
console.log('═'.repeat(60));

async function linkAllEvidence() {
  // Get all evidence
  const { data: evidenceList } = await supabase
    .from('alma_evidence')
    .select('*');
  
  // Get all interventions
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, description, operating_organization, geography, type');
  
  console.log(`Evidence records: ${evidenceList?.length || 0}`);
  console.log(`Interventions: ${interventions?.length || 0}\n`);
  
  let linked = 0;
  let skipped = 0;
  
  for (const evidence of evidenceList || []) {
    // Check if already linked
    const { data: existingLinks } = await supabase
      .from('alma_intervention_evidence')
      .select('id')
      .eq('evidence_id', evidence.id);
    
    if (existingLinks && existingLinks.length > 0) {
      skipped++;
      continue;
    }
    
    const matches = [];
    
    for (const intervention of interventions || []) {
      let score = 0;
      const evidenceTitle = (evidence.title || '').toLowerCase();
      const evidenceFindings = (evidence.findings || '').toLowerCase();
      const intName = (intervention.name || '').toLowerCase();
      const intDesc = (intervention.description || '').toLowerCase();
      
      // Title contains intervention name
      if (evidenceTitle.includes(intName) || intName.includes(evidenceTitle)) {
        score += 40;
      }
      
      // Keyword matching
      const keywords = [
        'youth', 'justice', 'diversion', 'detention', 'conferencing',
        'aboriginal', 'indigenous', 'prevention', 'recidivism',
        'court', 'sentencing', 'rehabilitation'
      ];
      
      for (const kw of keywords) {
        if ((evidenceTitle.includes(kw) || evidenceFindings.includes(kw)) &&
            (intName.includes(kw) || intDesc.includes(kw))) {
          score += 5;
        }
      }
      
      // Organization match
      if (evidence.organization && intervention.operating_organization) {
        const org1 = evidence.organization.toLowerCase();
        const org2 = intervention.operating_organization.toLowerCase();
        if (org1.includes(org2) || org2.includes(org1) || 
            org1.split(' ').some(word => org2.includes(word))) {
          score += 30;
        }
      }
      
      // Geography match
      if (evidence.findings && intervention.geography) {
        for (const geo of intervention.geography) {
          if (evidenceFindings.includes(geo.toLowerCase())) {
            score += 10;
          }
        }
      }
      
      // Evidence type matching
      if (evidence.evidence_type === 'Community-led research' && 
          intervention.type === 'Cultural Connection') {
        score += 20;
      }
      
      if (score >= 45) {
        matches.push({ intervention, score });
      }
    }
    
    // Sort and take best match
    matches.sort((a, b) => b.score - a.score);
    
    if (matches.length > 0) {
      const best = matches[0];
      
      const { error } = await supabase
        .from('alma_intervention_evidence')
        .insert({
          intervention_id: best.intervention.id,
          evidence_id: evidence.id
        });
      
      if (!error) {
        linked++;
        console.log(`✅ [${best.score}] "${evidence.title?.substring(0, 40)}..." → "${best.intervention.name?.substring(0, 40)}..."`);
      }
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   Linked: ${linked}`);
  console.log(`   Skipped (already linked): ${skipped}`);
  console.log(`   Total processed: ${evidenceList?.length || 0}`);
}

linkAllEvidence().catch(console.error);
