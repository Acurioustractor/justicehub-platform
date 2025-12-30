/**
 * Index clearinghouse documents into Chroma with OpenAI embeddings.
 *
 * Uses:
 *  - FIRECRAWL_API_KEY to fetch markdown from URLs
 *  - OPENAI_API_KEY for embeddings (text-embedding-3-small)
 *
 * Output: Chroma persistent store under data/chroma/clearinghouse
 *
 * Run:
 * NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/index-clearinghouse.ts
 */
import { createClient as createSupabase } from '@supabase/supabase-js';
import { ChromaClient } from 'chromadb';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureOpenAIEmbeddingFunction, OpenAIEmbeddingFunction } from '../lib/chroma/openai-embedding';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHROMA_DIR = process.env.CHROMA_DIR || path.join(process.cwd(), 'data', 'chroma');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
if (!FIRECRAWL_API_KEY) {
  console.error('Missing FIRECRAWL_API_KEY');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createSupabase(SUPABASE_URL, SERVICE_KEY);

async function fetchDocs() {
  const { data, error } = await supabase
    .from('clearinghouse_documents')
    .select('id, title, url, summary, tags, source_system, source_record_id, content, status, sensitivity')
    .eq('status', 'verified')
    .eq('sensitivity', 'public');
  if (error) throw error;
  return data || [];
}

async function fetchWithFirecrawl(url: string): Promise<string> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl failed ${res.status}`);
  }
  const json = await res.json();
  const md = json?.data?.markdown || json?.markdown || '';
  if (!md) throw new Error('No markdown returned');
  return md;
}

function chunkText(text: string, maxLen = 1200): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let buffer = '';
  for (const p of paragraphs) {
    if ((buffer + '\n\n' + p).length > maxLen) {
      if (buffer.trim()) chunks.push(buffer.trim());
      buffer = p;
    } else {
      buffer = buffer ? buffer + '\n\n' + p : p;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks.filter(c => c.length > 40);
}

async function ensureChromaDir() {
  await fs.mkdir(CHROMA_DIR, { recursive: true });
}

async function run() {
  await ensureChromaDir();

  ensureOpenAIEmbeddingFunction();
  const client = new ChromaClient({ path: 'file:' + CHROMA_DIR });
  const embedder = new OpenAIEmbeddingFunction({
    apiKeyEnvVar: 'OPENAI_API_KEY',
    modelName: 'text-embedding-3-small',
  });
  const collection = await client.getOrCreateCollection({ name: 'clearinghouse', embeddingFunction: embedder });

  const docs = await fetchDocs();
  console.log(`Indexing ${docs.length} documents`);

  for (const doc of docs) {
    try {
      const raw = doc.content?.trim()
        || (doc.url ? await fetchWithFirecrawl(doc.url) : '');

      const base = doc.summary ? `${doc.title}\n\n${doc.summary}\n\n${raw}` : `${doc.title}\n\n${raw}`;
      const chunks = chunkText(base);
      if (!chunks.length) {
        console.warn('No chunks for', doc.title);
        continue;
      }

      const ids = chunks.map((_, idx) => `${doc.id}-chunk-${idx}`);
      const metadatas = chunks.map(() => ({
        record_type: 'document',
        record_id: doc.id,
        title: doc.title,
        source_system: doc.source_system,
        source_record_id: doc.source_record_id,
        url: doc.url,
        tags: doc.tags || [],
      }));

      await collection.upsert({ ids, metadatas, documents: chunks });
      console.log(`Indexed ${doc.title} (${chunks.length} chunks)`);
    } catch (err) {
      console.error(`Failed to index ${doc.title}:`, err);
    }
  }

  console.log('Done indexing');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
