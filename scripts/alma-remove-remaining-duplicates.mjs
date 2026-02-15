#!/usr/bin/env node
/**
 * ALMA Remove Remaining Duplicates
 * 
 * Removes duplicate interventions by name similarity
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

console.log('\n🧹 ALMA Remove Remaining Duplicates');
console.log('═'.repeat(60));

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(str1, str2) {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  const words1 = new Set(s1.split(' ').filter(w => w.length > 3));
  const words2 = new Set(s2.split(' ').filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0.0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

async function removeDuplicates() {
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, description, website, created_at, type');
  
  console.log(`Total interventions: ${interventions?.length}\n`);
  
  // Group by exact name
  const exactGroups = {};
  for (const i of interventions || []) {
    const normalized = normalizeName(i.name);
    if (!normalized) continue;
    
    if (!exactGroups[normalized]) {
      exactGroups[normalized] = [];
    }
    exactGroups[normalized].push(i);
  }
  
  // Find exact duplicates
  const exactDuplicates = Object.entries(exactGroups).filter(([k, v]) => v.length > 1);
  console.log(`Exact name duplicates: ${exactDuplicates.length}`);
  
  // Find fuzzy duplicates (similar names)
  const fuzzyDuplicates = [];
  const checked = new Set();
  
  for (const i of interventions || []) {
    for (const j of interventions || []) {
      if (i.id === j.id) continue;
      
      const pairKey = [i.id, j.id].sort().join('-');
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);
      
      const sim = similarity(i.name, j.name);
      if (sim >= 0.7) {
        fuzzyDuplicates.push({
          keep: i.description?.length > j.description?.length ? i : j,
          remove: i.description?.length > j.description?.length ? j : i,
          similarity: sim,
          name1: i.name,
          name2: j.name
        });
      }
    }
  }
  
  console.log(`Fuzzy duplicates (70%+ similarity): ${fuzzyDuplicates.length}\n`);
  
  // Combine duplicates
  const allDuplicates = [
    ...exactDuplicates.map(([name, group]) => ({
      type: 'exact',
      name,
      group
    })),
    ...fuzzyDuplicates.map(d => ({
      type: 'fuzzy',
      similarity: d.similarity,
      keep: d.keep,
      remove: d.remove
    }))
  ];
  
  if (allDuplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }
  
  console.log('Duplicates to remove:\n');
  
  const toDelete = [];
  
  for (const dup of allDuplicates.slice(0, 20)) {
    if (dup.type === 'exact') {
      const group = dup.group;
      console.log(`Exact: "${dup.name.substring(0, 50)}..." (${group.length} copies)`);
      
      // Keep the one with longest description
      group.sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0));
      console.log(`  Keeping: ${group[0].id.substring(0, 8)} (${group[0].description?.length || 0} chars)`);
      
      for (let i = 1; i < group.length; i++) {
        console.log(`  Removing: ${group[i].id.substring(0, 8)}`);
        toDelete.push(group[i].id);
      }
    } else {
      console.log(`Fuzzy (${(dup.similarity * 100).toFixed(0)}%):`);
      console.log(`  Keep: "${dup.keep.name?.substring(0, 50)}..."`);
      console.log(`  Remove: "${dup.remove.name?.substring(0, 50)}..."`);
      toDelete.push(dup.remove.id);
    }
    console.log('');
  }
  
  console.log(`Total to delete: ${toDelete.length}\n`);
  
  if (toDelete.length === 0) {
    console.log('✅ Nothing to delete');
    return;
  }
  
  // Delete duplicates
  console.log('Deleting duplicates...\n');
  
  let deleted = 0;
  let failed = 0;
  
  for (const id of toDelete) {
    const { error } = await supabase
      .from('alma_interventions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.log(`❌ Failed to delete ${id.substring(0, 8)}: ${error.message}`);
      failed++;
    } else {
      deleted++;
      process.stdout.write(`✅ Deleted: ${id.substring(0, 8)}\r`);
    }
  }
  
  console.log(`\n\n📊 Results:`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${toDelete.length}`);
}

removeDuplicates().catch(console.error);
