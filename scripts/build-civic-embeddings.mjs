#!/usr/bin/env node
/**
 * Build Civic Intelligence Embeddings
 *
 * Chunks and embeds text from all civic/media/oversight sources into
 * civic_intelligence_chunks for LLM semantic search.
 *
 * Sources:
 *   - civic_hansard (135+ speeches, ~10K chars avg)
 *   - civic_ministerial_statements (640, ~3.6K chars avg)
 *   - civic_charter_commitments (66, short)
 *   - oversight_recommendations (43, short)
 *   - alma_media_articles (584, summary + full_text)
 *   - civic_consultancy_spending (18, short)
 *   - civic_rti_disclosures (17, short)
 *
 * Usage: node scripts/build-civic-embeddings.mjs [--source=hansard] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const CHUNK_SIZE = 1500; // chars per chunk (~375 tokens)
const CHUNK_OVERLAP = 200;
const BATCH_SIZE = 20; // embeddings per API call
const DRY_RUN = process.argv.includes('--dry-run');
const SOURCE_FILTER = process.argv.find(a => a.startsWith('--source='))?.split('=')[1];

// ── Chunking ─────────────────────────────────────────────────

function chunkText(text, maxLen = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text || text.length <= maxLen) return [text || ''];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLen;
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('. ', end);
      if (lastPeriod > start + maxLen * 0.5) end = lastPeriod + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }
  return chunks;
}

// ── Embedding ────────────────────────────────────────────────

async function embedBatch(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} ${err}`);
  }
  const json = await res.json();
  return json.data.map(d => d.embedding);
}

// ── Source extractors ────────────────────────────────────────

const SOURCES = {
  hansard: {
    table: 'civic_hansard',
    query: () => supabase.from('civic_hansard').select('id, subject, body_text, speaker_name, sitting_date, jurisdiction'),
    toText: (row) => `[Hansard Speech] ${row.sitting_date || ''} | ${row.speaker_name || 'Unknown'} | ${row.jurisdiction || 'QLD'}\n${row.subject || ''}\n\n${row.body_text || ''}`,
    toMeta: (row) => ({ speaker: row.speaker_name, date: row.sitting_date, jurisdiction: row.jurisdiction, type: 'hansard' }),
  },
  statements: {
    table: 'civic_ministerial_statements',
    query: () => supabase.from('civic_ministerial_statements').select('id, headline, body_text, minister_name, published_at, jurisdiction'),
    toText: (row) => `[Ministerial Statement] ${row.published_at || ''} | ${row.minister_name || 'Unknown'} | ${row.jurisdiction || 'QLD'}\n${row.headline || ''}\n\n${row.body_text || ''}`,
    toMeta: (row) => ({ speaker: row.minister_name, date: row.published_at, jurisdiction: row.jurisdiction, type: 'statement' }),
  },
  charter: {
    table: 'civic_charter_commitments',
    query: () => supabase.from('civic_charter_commitments').select('id, minister_name, portfolio, commitment_text, status, status_evidence, category'),
    toText: (row) => `[Charter Commitment] ${row.minister_name || ''} | ${row.portfolio || ''}\nCommitment: ${row.commitment_text || ''}\nStatus: ${row.status || 'unknown'}\nEvidence: ${row.status_evidence || 'none'}`,
    toMeta: (row) => ({ speaker: row.minister_name, status: row.status, category: row.category, type: 'charter_commitment' }),
  },
  oversight: {
    table: 'oversight_recommendations',
    query: () => supabase.from('oversight_recommendations').select('id, oversight_body, report_title, recommendation_text, status, severity, jurisdiction, domain'),
    toText: (row) => `[Oversight Recommendation] ${row.oversight_body || ''} | ${row.report_title || ''}\nSeverity: ${row.severity || ''} | Status: ${row.status || ''}\n\n${row.recommendation_text || ''}`,
    toMeta: (row) => ({ body: row.oversight_body, severity: row.severity, status: row.status, jurisdiction: row.jurisdiction, type: 'oversight' }),
  },
  media: {
    table: 'alma_media_articles',
    query: () => supabase.from('alma_media_articles').select('id, headline, summary, full_text, source_name, published_date, sentiment, topics'),
    toText: (row) => {
      const body = row.full_text || row.summary || '';
      return `[Media] ${row.published_date || ''} | ${row.source_name || ''} | Sentiment: ${row.sentiment || ''}\n${row.headline || ''}\n\n${body}`;
    },
    toMeta: (row) => ({ source: row.source_name, sentiment: row.sentiment, topics: row.topics, date: row.published_date, type: 'media' }),
  },
  consultancy: {
    table: 'civic_consultancy_spending',
    query: () => supabase.from('civic_consultancy_spending').select('id, consultant_name, department, amount_dollars, description, financial_year'),
    toText: (row) => `[Consultancy Spending] ${row.financial_year || ''} | ${row.department || ''}\n${row.consultant_name || ''}: $${row.amount_dollars || 0}\n${row.description || ''}`,
    toMeta: (row) => ({ consultant: row.consultant_name, amount: row.amount_dollars, department: row.department, type: 'consultancy' }),
  },
  rti: {
    table: 'civic_rti_disclosures',
    query: () => supabase.from('civic_rti_disclosures').select('id, title, description, department, decision_date, applicant_type, topics, summary'),
    toText: (row) => `[RTI/FOI Disclosure] ${row.decision_date || ''} | ${row.department || ''}\n${row.title || ''}\nApplicant: ${row.applicant_type || ''}\n\n${row.description || ''}\n${row.summary || ''}`,
    toMeta: (row) => ({ department: row.department, applicant: row.applicant_type, topics: row.topics, type: 'rti' }),
  },
};

// ── Main pipeline ────────────────────────────────────────────

async function processSource(name, source) {
  console.log(`\n=== Processing: ${name} (${source.table}) ===`);

  const { data: rows, error } = await source.query();
  if (error) { console.error(`  Error fetching ${name}:`, error.message); return { name, processed: 0, chunks: 0, errors: 1 }; }
  if (!rows?.length) { console.log(`  No rows found`); return { name, processed: 0, chunks: 0, errors: 0 }; }

  console.log(`  Found ${rows.length} rows`);

  // Check which are already embedded
  const { data: existing } = await supabase
    .from('civic_intelligence_chunks')
    .select('source_id')
    .eq('source_table', source.table);
  const existingIds = new Set((existing || []).map(e => e.source_id));

  const newRows = rows.filter(r => !existingIds.has(r.id));
  console.log(`  ${newRows.length} new (${existingIds.size} already embedded)`);

  if (newRows.length === 0) return { name, processed: 0, chunks: 0, errors: 0 };

  let totalChunks = 0;
  let errors = 0;
  const allInserts = [];

  // Build all chunks first
  for (const row of newRows) {
    const text = source.toText(row);
    const meta = source.toMeta(row);
    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].trim().length < 20) continue; // Skip tiny chunks
      allInserts.push({
        source_table: source.table,
        source_id: row.id,
        chunk_index: i,
        chunk_text: chunks[i],
        metadata: meta,
      });
    }
  }

  console.log(`  ${allInserts.length} chunks to embed`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would embed ${allInserts.length} chunks`);
    return { name, processed: newRows.length, chunks: allInserts.length, errors: 0 };
  }

  // Embed in batches
  for (let i = 0; i < allInserts.length; i += BATCH_SIZE) {
    const batch = allInserts.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await embedBatch(batch.map(b => b.chunk_text));

      const rows = batch.map((b, j) => ({
        ...b,
        embedding: JSON.stringify(embeddings[j]),
      }));

      const { error: insertError } = await supabase
        .from('civic_intelligence_chunks')
        .upsert(rows, { onConflict: 'source_table,source_id,chunk_index' });

      if (insertError) {
        console.error(`  Batch ${i / BATCH_SIZE + 1} insert error:`, insertError.message);
        errors++;
      } else {
        totalChunks += batch.length;
      }

      // Rate limit: ~3 batches/sec for text-embedding-3-small
      if (i + BATCH_SIZE < allInserts.length) await new Promise(r => setTimeout(r, 350));
    } catch (err) {
      console.error(`  Batch ${i / BATCH_SIZE + 1} error:`, err.message);
      errors++;
    }

    if ((i / BATCH_SIZE + 1) % 10 === 0) {
      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, allInserts.length)}/${allInserts.length} chunks`);
    }
  }

  console.log(`  Done: ${totalChunks} chunks embedded, ${errors} errors`);
  return { name, processed: newRows.length, chunks: totalChunks, errors };
}

async function main() {
  console.log('=== Civic Intelligence Embeddings Builder ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (SOURCE_FILTER) console.log(`Filter: ${SOURCE_FILTER} only`);
  console.log('');

  if (!OPENAI_KEY && !DRY_RUN) {
    console.error('OPENAI_API_KEY not set');
    process.exit(1);
  }

  const sourcesToRun = SOURCE_FILTER
    ? { [SOURCE_FILTER]: SOURCES[SOURCE_FILTER] }
    : SOURCES;

  if (SOURCE_FILTER && !SOURCES[SOURCE_FILTER]) {
    console.error(`Unknown source: ${SOURCE_FILTER}. Available: ${Object.keys(SOURCES).join(', ')}`);
    process.exit(1);
  }

  const results = [];
  for (const [name, source] of Object.entries(sourcesToRun)) {
    const result = await processSource(name, source);
    results.push(result);
  }

  console.log('\n=== Summary ===');
  console.log('Source            | Rows | Chunks | Errors');
  console.log('-----------------|------|--------|-------');
  let totalChunks = 0, totalErrors = 0;
  for (const r of results) {
    console.log(`${r.name.padEnd(17)}| ${String(r.processed).padEnd(5)}| ${String(r.chunks).padEnd(7)}| ${r.errors}`);
    totalChunks += r.chunks;
    totalErrors += r.errors;
  }
  console.log(`${'TOTAL'.padEnd(17)}|      | ${String(totalChunks).padEnd(7)}| ${totalErrors}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
