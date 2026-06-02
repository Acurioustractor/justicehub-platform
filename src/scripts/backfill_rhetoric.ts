import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { tagRhetoric } from '../lib/ai/rhetoric-tagger';

// Load environment from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backfill() {
  console.log('Fetching untagged speeches from civic_hansard...');

  // Fetch up to 500 speeches
  const { data: speeches, error } = await supabase
    .from('civic_hansard')
    .select('id, subject, body_text, topics')
    .limit(500);

  if (error) {
    console.error('Failed to fetch speeches:', error);
    return;
  }

  // Filter untagged
  const untagged = (speeches || []).filter((s) => {
    const topics = s.topics || [];
    return !topics.some((t: string) => t.startsWith('stance:'));
  });

  console.log(`Found ${untagged.length} speeches needing AI categorization.`);

  let processed = 0;
  for (const speech of untagged) {
    try {
      const snippet = (speech.body_text || '').slice(0, 3000);
      const newTags = await tagRhetoric(speech.subject || '', snippet);

      if (newTags.length > 0) {
        const existingTopics = Array.isArray(speech.topics) ? speech.topics : [];
        const mergedTopics = Array.from(new Set([...existingTopics, ...newTags]));

        const { error: updateError } = await supabase
          .from('civic_hansard')
          .update({ topics: mergedTopics, enriched_at: new Date().toISOString() })
          .eq('id', speech.id);

        if (updateError) {
          console.error(`\u274c Error updating ${speech.id}:`, updateError.message);
        } else {
          processed++;
          console.log(`\u2705 Tagged ${speech.id} -> [${newTags.join(', ')}]`);
        }
      } else {
        console.log(`\u26a0\ufe0f No tags returned for ${speech.id}`);
      }
    } catch (err) {
      console.error(`Failed on speech ${speech.id}:`, err);
    }
  }

  console.log(`\nDone! Successfully backfilled ${processed} speeches with AI rhetoric tags.`);
}

backfill();
