#!/usr/bin/env node
/**
 * ALMA Evidence Enrichment Script
 *
 * Fixes "Untitled" evidence items by extracting titles from source URLs
 * or generating descriptive titles from the content.
 *
 * Usage: node scripts/data-enrichment/enrich-alma-evidence.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a title from evidence metadata
 */
function generateTitle(evidence) {
  const parts = [];

  // Use author if available
  if (evidence.author) {
    parts.push(evidence.author);
  }

  // Use organization if available
  if (evidence.organization && !parts.includes(evidence.organization)) {
    parts.push(evidence.organization);
  }

  // Add year if available
  if (evidence.publication_date) {
    const year = new Date(evidence.publication_date).getFullYear();
    if (!isNaN(year)) {
      parts.push(`(${year})`);
    }
  }

  // Use evidence type
  if (evidence.evidence_type) {
    parts.push(`- ${evidence.evidence_type}`);
  }

  // Fallback: extract from findings
  if (parts.length === 0 && evidence.findings) {
    const firstSentence = evidence.findings.split('.')[0];
    if (firstSentence.length <= 100) {
      return firstSentence;
    }
    return firstSentence.substring(0, 97) + '...';
  }

  // Fallback: use source URL domain
  if (parts.length === 0 && evidence.source_url) {
    try {
      const url = new URL(evidence.source_url);
      parts.push(`Evidence from ${url.hostname}`);
    } catch {}
  }

  return parts.join(' ') || `Study #${evidence.id?.substring(0, 8)}`;
}

/**
 * Enrich evidence items with missing titles
 */
async function enrichEvidence() {
  console.log('Fetching evidence items with missing or default titles...\n');

  // Get all evidence
  const { data: evidence, error } = await supabase
    .from('alma_evidence')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching evidence:', error);
    return;
  }

  console.log(`Found ${evidence?.length || 0} total evidence items\n`);

  // Filter items needing enrichment
  const needsEnrichment = evidence?.filter(e =>
    !e.title ||
    e.title === 'Untitled' ||
    e.title === 'Untitled Study' ||
    e.title.startsWith('Study #')
  ) || [];

  console.log(`${needsEnrichment.length} items need title enrichment\n`);

  if (needsEnrichment.length === 0) {
    console.log('All evidence items have proper titles!');
    return;
  }

  // Enrich each item
  let updated = 0;
  let failed = 0;

  for (const item of needsEnrichment) {
    const newTitle = generateTitle(item);

    if (newTitle && newTitle !== item.title) {
      console.log(`Updating: "${item.title || 'null'}" → "${newTitle}"`);

      const { error: updateError } = await supabase
        .from('alma_evidence')
        .update({ title: newTitle })
        .eq('id', item.id);

      if (updateError) {
        console.error(`  Failed: ${updateError.message}`);
        failed++;
      } else {
        updated++;
      }
    }
  }

  console.log(`\n✅ Updated ${updated} evidence titles`);
  if (failed > 0) {
    console.log(`❌ Failed to update ${failed} items`);
  }
}

/**
 * Link evidence to interventions based on matching criteria
 */
async function linkEvidenceToInterventions() {
  console.log('\n\nLinking evidence to interventions...\n');

  // Get interventions
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, type, description, metadata');

  // Get evidence
  const { data: evidence } = await supabase
    .from('alma_evidence')
    .select('id, title, findings, organization');

  if (!interventions || !evidence) {
    console.log('Could not fetch data for linking');
    return;
  }

  // Check existing links
  const { data: existingLinks } = await supabase
    .from('alma_intervention_evidence')
    .select('intervention_id, evidence_id');

  const existingSet = new Set(
    existingLinks?.map(l => `${l.intervention_id}:${l.evidence_id}`) || []
  );

  let linked = 0;

  // Simple matching based on keywords
  for (const intervention of interventions) {
    const keywords = [
      intervention.name?.toLowerCase(),
      intervention.type?.toLowerCase(),
      intervention.metadata?.state?.toLowerCase()
    ].filter(Boolean);

    for (const ev of evidence) {
      const evidenceText = [
        ev.title?.toLowerCase(),
        ev.findings?.toLowerCase(),
        ev.organization?.toLowerCase()
      ].filter(Boolean).join(' ');

      // Check for keyword match
      const hasMatch = keywords.some(kw =>
        kw && evidenceText.includes(kw) && kw.length > 3
      );

      if (hasMatch) {
        const linkKey = `${intervention.id}:${ev.id}`;
        if (!existingSet.has(linkKey)) {
          const { error } = await supabase
            .from('alma_intervention_evidence')
            .insert({
              intervention_id: intervention.id,
              evidence_id: ev.id,
              relevance_score: 0.7,
              created_at: new Date().toISOString()
            });

          if (!error) {
            console.log(`Linked: ${intervention.name} ↔ ${ev.title}`);
            linked++;
            existingSet.add(linkKey);
          }
        }
      }
    }
  }

  console.log(`\n✅ Created ${linked} new evidence-intervention links`);
}

// Run enrichment
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ALMA Evidence Enrichment Script');
  console.log('═══════════════════════════════════════════════════════\n');

  await enrichEvidence();
  await linkEvidenceToInterventions();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Enrichment Complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
