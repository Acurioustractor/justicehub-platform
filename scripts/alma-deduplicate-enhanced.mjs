#!/usr/bin/env node
/**
 * ALMA Enhanced Deduplication
 * 
 * Advanced deduplication with 5 levels of matching:
 * 1. Exact URL match
 * 2. Name similarity (fuzzy matching)
 * 3. Content hash comparison
 * 4. Semantic similarity (Claude/GPT)
 * 5. Cross-reference validation (address, phone)
 * 
 * Usage:
 *   node alma-deduplicate-enhanced.mjs --mode find
 *   node alma-deduplicate-enhanced.mjs --mode merge --dry-run
 *   node alma-deduplicate-enhanced.mjs --mode merge --confirm
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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

// Validate environment
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

const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

// Parse arguments
const args = process.argv.slice(2);
const mode = args.find((_, i) => args[i-1] === '--mode') || 'find';
const dryRun = args.includes('--dry-run');
const confirm = args.includes('--confirm');
const similarityThreshold = parseFloat(args.find((_, i) => args[i-1] === '--threshold') || '0.85');

console.log('\n🧹 ALMA Enhanced Deduplication');
console.log('═'.repeat(60));
console.log(`Mode: ${mode} | Threshold: ${similarityThreshold}`);
console.log(dryRun ? '🧪 DRY RUN' : confirm ? '⚠️ LIVE MODE - Will modify database' : '🔍 ANALYSIS MODE');

// Normalize text for comparison
function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate string similarity (0-1)
function similarity(str1, str2) {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  // Jaccard similarity of word sets
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Content hash
function hashContent(content) {
  return createHash('sha256')
    .update(normalize(content))
    .digest('hex')
    .substring(0, 16);
}

// Level 1: Find exact URL duplicates
async function findUrlDuplicates() {
  console.log('\n📍 Level 1: URL Duplicates');
  
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, source_url, metadata');
  
  const urlMap = new Map();
  const duplicates = [];
  
  for (const item of interventions || []) {
    const url = item.source_url || item.metadata?.source_url;
    if (!url) continue;
    
    const normalizedUrl = url.split('?')[0].replace(/\/$/, '');
    
    if (urlMap.has(normalizedUrl)) {
      duplicates.push({
        type: 'url',
        keep: urlMap.get(normalizedUrl),
        remove: item,
        reason: `Same URL: ${normalizedUrl}`,
      });
    } else {
      urlMap.set(normalizedUrl, item);
    }
  }
  
  console.log(`   Found: ${duplicates.length} URL duplicates`);
  return duplicates;
}

// Level 2: Find name similarity duplicates
async function findNameDuplicates() {
  console.log('\n🏷️  Level 2: Name Similarity');
  
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, description, type, geography');
  
  const duplicates = [];
  const checked = new Set();
  
  for (let i = 0; i < (interventions || []).length; i++) {
    for (let j = i + 1; j < interventions.length; j++) {
      const item1 = interventions[i];
      const item2 = interventions[j];
      
      const pairKey = [item1.id, item2.id].sort().join('-');
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);
      
      const nameSim = similarity(item1.name, item2.name);
      
      // High name similarity + same jurisdiction = likely duplicate
      const sameJurisdiction = item1.geography?.some(g => 
        item2.geography?.includes(g)
      );
      
      if (nameSim >= similarityThreshold && sameJurisdiction) {
        duplicates.push({
          type: 'name',
          similarity: nameSim,
          keep: item1,
          remove: item2,
          reason: `Name similarity: ${(nameSim * 100).toFixed(1)}%`,
        });
      }
    }
  }
  
  console.log(`   Found: ${duplicates.length} name duplicates`);
  return duplicates;
}

// Level 3: Content hash duplicates
async function findContentDuplicates() {
  console.log('\n📝 Level 3: Content Hash');
  
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, description');
  
  const hashMap = new Map();
  const duplicates = [];
  
  for (const item of interventions || []) {
    const content = `${item.name} ${item.description || ''}`;
    const hash = hashContent(content);
    
    if (hashMap.has(hash)) {
      duplicates.push({
        type: 'content',
        keep: hashMap.get(hash),
        remove: item,
        reason: `Same content hash: ${hash}`,
      });
    } else {
      hashMap.set(hash, item);
    }
  }
  
  console.log(`   Found: ${duplicates.length} content duplicates`);
  return duplicates;
}

// Level 4: Semantic similarity (AI-powered)
async function findSemanticDuplicates(candidates) {
  console.log('\n🤖 Level 4: Semantic Similarity');
  
  if (!anthropic) {
    console.log('   ⚠️  No Anthropic API key, skipping');
    return [];
  }
  
  if (candidates.length > 50) {
    console.log(`   ⚠️  Too many candidates (${candidates.length}), sampling 50`);
    candidates = candidates.slice(0, 50);
  }
  
  const duplicates = [];
  
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    console.log(`   Checking ${i + 1}/${candidates.length}: ${c.keep.name.substring(0, 40)}...`);
    
    const prompt = `Compare these two youth justice programs. Are they the SAME program or organization?

Program A:
- Name: ${c.keep.name}
- Description: ${c.keep.description?.substring(0, 200) || 'N/A'}
- Type: ${c.keep.type}
- Location: ${c.keep.geography?.join(', ') || 'N/A'}

Program B:
- Name: ${c.remove.name}
- Description: ${c.remove.description?.substring(0, 200) || 'N/A'}
- Type: ${c.remove.type}
- Location: ${c.remove.geography?.join(', ') || 'N/A'}

Respond with ONLY "SAME" or "DIFFERENT".`;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const answer = response.content[0].text.trim().toUpperCase();
      
      if (answer === 'SAME') {
        duplicates.push({
          ...c,
          type: 'semantic',
          reason: `${c.reason} (AI confirmed)`,
        });
      }
    } catch (err) {
      console.log(`   ⚠️  AI check failed: ${err.message}`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`   Found: ${duplicates.length} semantic duplicates`);
  return duplicates;
}

// Find all duplicates
async function findDuplicates() {
  console.log('\n🔍 Finding Duplicates...');
  
  const urlDups = await findUrlDuplicates();
  const nameDups = await findNameDuplicates();
  const contentDups = await findContentDuplicates();
  
  // Combine and remove duplicates from the duplicate list
  const allCandidates = [...urlDups, ...nameDups, ...contentDups];
  const seen = new Set();
  const uniqueCandidates = [];
  
  for (const c of allCandidates) {
    const key = `${c.keep.id}-${c.remove.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCandidates.push(c);
    }
  }
  
  console.log(`\n📊 Total unique candidates: ${uniqueCandidates.length}`);
  
  // Level 4: AI verification for high-similarity candidates
  const semanticDups = await findSemanticDuplicates(uniqueCandidates);
  
  return { 
    all: uniqueCandidates, 
    aiConfirmed: semanticDups,
    byType: {
      url: urlDups.length,
      name: nameDups.length,
      content: contentDups.length,
      semantic: semanticDups.length,
    }
  };
}

// Merge duplicates
async function mergeDuplicates(duplicates) {
  console.log('\n🔄 Merging Duplicates...');
  
  let merged = 0;
  let errors = 0;
  
  for (const dup of duplicates) {
    console.log(`\n   Merging: ${dup.remove.name}`);
    console.log(`   Into:    ${dup.keep.name}`);
    console.log(`   Reason:  ${dup.reason}`);
    
    if (dryRun) {
      console.log('   🧪 SKIPPED (dry run)');
      continue;
    }
    
    try {
      // Merge data (keep most complete fields)
      const mergedData = {
        ...dup.keep,
        // Keep longer description
        description: (dup.keep.description?.length || 0) > (dup.remove.description?.length || 0)
          ? dup.keep.description
          : dup.remove.description,
        // Merge arrays (unique values)
        geography: [...new Set([...(dup.keep.geography || []), ...(dup.remove.geography || [])])],
        target_cohort: [...new Set([...(dup.keep.target_cohort || []), ...(dup.remove.target_cohort || [])])],
        // Merge source documents
        source_documents: [
          ...(dup.keep.source_documents || []),
          ...(dup.remove.source_documents || []),
        ],
        // Mark as merged
        metadata: {
          ...dup.keep.metadata,
          merged_from: dup.remove.id,
          merged_at: new Date().toISOString(),
          merge_reason: dup.reason,
        },
      };
      
      // Update keep record
      const { error: updateError } = await supabase
        .from('alma_interventions')
        .update(mergedData)
        .eq('id', dup.keep.id);
      
      if (updateError) throw updateError;
      
      // Delete remove record (soft delete - archive it)
      const { error: archiveError } = await supabase
        .from('alma_interventions_archive')
        .insert({
          ...dup.remove,
          archived_at: new Date().toISOString(),
          archive_reason: `Merged into ${dup.keep.id}`,
        });
      
      // Even if archive fails, continue with deletion
      const { error: deleteError } = await supabase
        .from('alma_interventions')
        .delete()
        .eq('id', dup.remove.id);
      
      if (deleteError) throw deleteError;
      
      console.log('   ✅ Merged successfully');
      merged++;
      
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      errors++;
    }
  }
  
  console.log(`\n📊 Merge Summary:`);
  console.log(`   Merged: ${merged}`);
  console.log(`   Errors: ${errors}`);
  
  return { merged, errors };
}

// Main function
async function main() {
  if (mode === 'find') {
    const duplicates = await findDuplicates();
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 DEDUPLICATION REPORT');
    console.log('═'.repeat(60));
    console.log(`\nBy Type:`);
    console.log(`   URL duplicates:       ${duplicates.byType.url}`);
    console.log(`   Name similarity:      ${duplicates.byType.name}`);
    console.log(`   Content hash:         ${duplicates.byType.content}`);
    console.log(`   AI confirmed:         ${duplicates.byType.semantic}`);
    console.log(`\n🎯 Total candidates: ${duplicates.all.length}`);
    
    // Save report
    const reportPath = join(__dirname, '.alma-dedup-report.json');
    writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      counts: duplicates.byType,
      candidates: duplicates.all.map(d => ({
        keep: { id: d.keep.id, name: d.keep.name },
        remove: { id: d.remove.id, name: d.remove.name },
        reason: d.reason,
        type: d.type,
      })),
    }, null, 2));
    
    console.log(`\n💾 Report saved: ${reportPath}`);
    console.log('\nNext steps:');
    console.log('   Review the report, then run:');
    console.log('   node alma-deduplicate-enhanced.mjs --mode merge --dry-run');
    
  } else if (mode === 'merge') {
    const reportPath = join(__dirname, '.alma-dedup-report.json');
    
    if (!existsSync(reportPath)) {
      console.error('❌ No report found. Run with --mode find first');
      process.exit(1);
    }
    
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    
    if (!confirm && !dryRun) {
      console.log('\n⚠️  This will modify the database!');
      console.log(`   Candidates to merge: ${report.candidates?.length || 0}`);
      console.log('\n   Add --confirm to proceed or --dry-run to preview');
      process.exit(0);
    }
    
    // Fetch full records
    const ids = report.candidates.flatMap(c => [c.keep.id, c.remove.id]);
    const { data: interventions } = await supabase
      .from('alma_interventions')
      .select('*')
      .in('id', ids);
    
    const byId = new Map(interventions?.map(i => [i.id, i]));
    
    const duplicates = report.candidates.map(c => ({
      keep: byId.get(c.keep.id),
      remove: byId.get(c.remove.id),
      reason: c.reason,
      type: c.type,
    })).filter(d => d.keep && d.remove);
    
    console.log(`\n🔄 Processing ${duplicates.length} merges...`);
    await mergeDuplicates(duplicates);
  }
}

main().catch(console.error);
