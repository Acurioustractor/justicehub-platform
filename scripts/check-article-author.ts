import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function checkArticle() {
  const articleId = 'f5080b5c-54e9-44fe-a286-965eae087cc0';

  // Get article details
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, author_id, status')
    .eq('id', articleId)
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    return;
  }

  console.log('\n📄 Article Details:');
  console.log(JSON.stringify(article, null, 2));

  if (article.author_id) {
    // Get author details
    const { data: author } = await supabase
      .from('public_profiles')
      .select('id, name, user_id')
      .eq('id', article.author_id)
      .single();

    console.log('\n👤 Article Author:');
    console.log(JSON.stringify(author, null, 2));
  } else {
    console.log('\n⚠️ Article has NO author_id set!');
  }

  // Get current auth user (you'll need to be logged in)
  console.log('\n💡 To fix this, you need to either:');
  console.log('1. Be logged in as the author (user_id matches)');
  console.log('2. Have admin permissions to bypass RLS');
  console.log('3. Set author_id to your profile ID if it\'s null');
}

checkArticle();
