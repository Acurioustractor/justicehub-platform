import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixInvalidAuthors() {
  console.log('🔍 Checking for articles with invalid author_id values...\n');

  // Get all articles
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, author_id');

  if (articlesError) {
    console.error('❌ Error fetching articles:', articlesError);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('✅ No articles found');
    return;
  }

  console.log(`Found ${articles.length} articles`);

  // Check which author_ids are valid
  const authorIds = articles.map(a => a.author_id).filter(Boolean);
  const uniqueAuthorIds = [...new Set(authorIds)];

  console.log(`Checking ${uniqueAuthorIds.length} unique author IDs...\n`);

  const invalidArticles = [];

  for (const authorId of uniqueAuthorIds) {
    if (!authorId) continue;

    const { data: profile } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('id', authorId)
      .single();

    if (!profile) {
      const articlesWithThisAuthor = articles.filter(a => a.author_id === authorId);
      console.log(`❌ Invalid author_id: ${authorId}`);
      console.log(`   Affects ${articlesWithThisAuthor.length} article(s):`);
      articlesWithThisAuthor.forEach(a => {
        console.log(`   - "${a.title}" (ID: ${a.id})`);
        invalidArticles.push(a);
      });
      console.log('');
    }
  }

  if (invalidArticles.length === 0) {
    console.log('✅ All articles have valid author_ids!');
    return;
  }

  console.log(`\n📝 Fixing ${invalidArticles.length} articles...\n`);

  // Set invalid author_ids to NULL
  for (const article of invalidArticles) {
    const { error } = await supabase
      .from('articles')
      .update({ author_id: null })
      .eq('id', article.id);

    if (error) {
      console.error(`❌ Error updating article "${article.title}":`, error);
    } else {
      console.log(`✅ Set author_id to NULL for "${article.title}"`);
    }
  }

  console.log('\n✅ Done! You can now apply the foreign key constraint.');
}

fixInvalidAuthors();
