import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['YJSF_SUPABASE_SERVICE_KEY']!
);

async function setAllArticlesAuthor() {
  console.log('🔍 Finding your profile...');

  // Get the first admin/profile (adjust email if needed)
  const { data: profiles, error: profileError } = await supabase
    .from('public_profiles')
    .select('id, full_name, user_id')
    .limit(10);

  if (profileError || !profiles || profiles.length === 0) {
    console.error('❌ Error finding profiles:', profileError);
    return;
  }

  console.log('\n📋 Available profiles:');
  profiles.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.full_name} (ID: ${p.id})`);
  });

  // Use the first profile
  const defaultProfile = profiles[0];
  console.log(`\n✅ Using profile: ${defaultProfile.full_name} (${defaultProfile.id})`);

  // Get all articles with NULL author_id
  const { data: articlesWithNoAuthor, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, author_id')
    .is('author_id', null);

  if (articlesError) {
    console.error('❌ Error fetching articles:', articlesError);
    return;
  }

  console.log(`\n📝 Found ${articlesWithNoAuthor?.length || 0} articles without an author`);

  if (!articlesWithNoAuthor || articlesWithNoAuthor.length === 0) {
    console.log('✅ All articles already have authors!');
    return;
  }

  // Update all articles to have the default profile as author
  console.log('\n🔄 Updating articles...');
  const { data: updated, error: updateError } = await supabase
    .from('articles')
    .update({ author_id: defaultProfile.id })
    .is('author_id', null)
    .select();

  if (updateError) {
    console.error('❌ Error updating articles:', updateError);
    return;
  }

  console.log(`\n✅ Successfully updated ${updated?.length || 0} articles!`);
  console.log('\n📋 Updated articles:');
  updated?.forEach((article, i) => {
    console.log(`  ${i + 1}. ${article.title}`);
  });
}

setAllArticlesAuthor();
