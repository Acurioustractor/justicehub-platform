#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function loadEnv(p) {
  const out = {};
  try {
    for (const line of readFileSync(p, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[t.slice(0, eq).trim()] = v;
    }
  } catch {}
  return out;
}
const env = { ...loadEnv(join(__dirname, '..', '.env.local')), ...process.env };
const el = createClient(env.EMPATHY_LEDGER_URL, env.EMPATHY_LEDGER_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const term = process.argv[2] || 'ben';
const { data, error } = await el
  .from('storytellers')
  .select('id, display_name, profile_id, is_active')
  .ilike('display_name', `%${term}%`)
  .limit(20);

if (error) {
  console.error(error);
  process.exit(1);
}
console.log(`Found ${data?.length || 0} matches for "${term}":`);
for (const s of data || []) {
  console.log(`  ${s.id}  ${s.display_name}  (slug: ${s.slug}, tenant: ${s.tenant_id?.slice(0, 8)}…, active: ${s.is_active})`);
}
