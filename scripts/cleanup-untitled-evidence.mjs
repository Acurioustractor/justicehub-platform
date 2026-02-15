#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(l => l && !l.startsWith('#') && l.includes('='))
  .reduce((a, l) => { const [k,...v] = l.split('='); a[k.trim()] = v.join('=').trim(); return a; }, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Investigating untitled evidence records...\n');

  // Count untitled
  const { data: untitled, count } = await supabase
    .from('alma_evidence')
    .select('id, title, created_at, evidence_type, consent_level', { count: 'exact' })
    .eq('title', 'Untitled evidence');

  console.log('Untitled evidence count:', count);

  if (untitled && untitled.length > 0) {
    console.log('\nSample untitled records:');
    untitled.slice(0, 5).forEach(r => {
      console.log(`  ID: ${r.id}`);
      console.log(`    Created: ${r.created_at}`);
      console.log(`    Type: ${r.evidence_type}`);
      console.log(`    Consent: ${r.consent_level}`);
      console.log('');
    });
  }

  // Count total
  const { count: total } = await supabase
    .from('alma_evidence')
    .select('*', { count: 'exact', head: true });

  console.log('Total evidence records:', total);
  console.log('Titled records:', total - count);

  // Ask whether to delete
  if (count > 0) {
    console.log('\n⚠️  These untitled records appear to be placeholders.');
    console.log('Run with --delete flag to remove them.');

    if (process.argv.includes('--delete')) {
      console.log('\n🗑️  Deleting untitled evidence records...');
      const { error, count: deleted } = await supabase
        .from('alma_evidence')
        .delete()
        .eq('title', 'Untitled evidence');

      if (error) {
        console.log('Error deleting:', error.message);
      } else {
        console.log(`✅ Deleted ${count} untitled records`);

        // Verify
        const { count: remaining } = await supabase
          .from('alma_evidence')
          .select('*', { count: 'exact', head: true });
        console.log(`📚 Remaining evidence records: ${remaining}`);
      }
    }
  }
}

main().catch(console.error);
