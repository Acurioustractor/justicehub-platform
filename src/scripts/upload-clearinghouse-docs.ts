/**
 * Download public clearinghouse document URLs to Supabase Storage and update the record URL.
 *
 * Usage:
 * NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/upload-clearinghouse-docs.ts
 *
 * Env required:
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *
 * Optional:
 *  - CLEARINGHOUSE_STORAGE_BUCKET (default: 'clearinghouse')
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.CLEARINGHOUSE_STORAGE_BUCKET || 'clearinghouse';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error || !data) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createErr) {
      console.error('Failed to create bucket', createErr);
      process.exit(1);
    }
    console.log('Created bucket', BUCKET);
  }
}

async function fetchDocs() {
  const { data, error } = await supabase
    .from('clearinghouse_documents')
    .select('id, title, url, source_system, source_record_id')
    .eq('status', 'verified');

  if (error) {
    throw error;
  }
  return data || [];
}

async function downloadToTemp(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} (${res.status})`);
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  const filename = crypto.randomBytes(8).toString('hex');
  const tmpPath = path.join(process.cwd(), '.tmp', filename);
  await fs.mkdir(path.dirname(tmpPath), { recursive: true });
  await fs.writeFile(tmpPath, buf);
  return { tmpPath, buf };
}

async function run() {
  await ensureBucket();
  const docs = await fetchDocs();
  console.log(`Found ${docs.length} verified documents to mirror`);

  for (const doc of docs) {
    if (!doc.url) {
      console.log(`Skipping ${doc.title} (no url)`);
      continue;
    }
    try {
      const { tmpPath, buf } = await downloadToTemp(doc.url);
      const ext = path.extname(new URL(doc.url).pathname) || '.pdf';
      const objectPath = `docs/${doc.source_system || 'source'}/${doc.source_record_id || crypto.randomBytes(4).toString('hex')}${ext}`;

      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
        upsert: true,
        contentType: ext === '.pdf' ? 'application/pdf' : undefined,
      });
      if (uploadErr) throw uploadErr;

      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
      await supabase
        .from('clearinghouse_documents')
        .update({ url: publicUrl, source_url: doc.url })
        .eq('id', doc.id);

      console.log(`Uploaded ${doc.title} -> ${publicUrl}`);
      await fs.rm(tmpPath, { force: true });
    } catch (err) {
      console.error(`Failed to mirror ${doc.title}:`, err);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
