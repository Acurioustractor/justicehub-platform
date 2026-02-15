import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function enhanceArticlesTable() {
  console.log('🔧 Enhancing Articles Table for Unification\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check current articles table structure
  console.log('1️⃣ Checking current articles table structure...');

  const { data: sampleArticle, error: sampleError } = await supabase
    .from('articles')
    .select('*')
    .limit(1)
    .single();

  if (sampleError && sampleError.code !== 'PGRST116') {
    console.error('❌ Error fetching sample article:', sampleError.message);
    return;
  }

  console.log('✅ Articles table accessible\n');

  if (sampleArticle) {
    const existingFields = Object.keys(sampleArticle);
    console.log('📋 Current fields:', existingFields.join(', '));

    const newFields = ['featured_image_caption', 'co_authors', 'tags', 'share_count', 'categories'];
    const missingFields = newFields.filter(f => !existingFields.includes(f));

    if (missingFields.length > 0) {
      console.log(`\n⚠️  Missing fields: ${missingFields.join(', ')}`);
      console.log('\n🔍 These fields need to be added via SQL migration.');
    } else {
      console.log('\n✅ All required fields already exist!');
    }
  }

  console.log('\n2️⃣ To add the missing columns, run this SQL in Supabase dashboard:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sql = `-- Enhance articles table with blog_posts features
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS featured_image_caption TEXT,
  ADD COLUMN IF NOT EXISTS co_authors UUID[],
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Add helpful comments
COMMENT ON COLUMN articles.featured_image_caption IS 'Caption for the featured image';
COMMENT ON COLUMN articles.co_authors IS 'Array of profile IDs for co-authors (references public_profiles.id)';
COMMENT ON COLUMN articles.tags IS 'Content tags for categorization and filtering';
COMMENT ON COLUMN articles.categories IS 'Content categories (array) - first element becomes primary category';
COMMENT ON COLUMN articles.share_count IS 'Number of times content has been shared on social media';`;

  console.log(sql);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Steps to apply:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your JusticeHub project');
  console.log('   3. Click "SQL Editor" in left sidebar');
  console.log('   4. Click "New Query"');
  console.log('   5. Paste the SQL above');
  console.log('   6. Click "RUN"');
  console.log('\n   Then run: npm run migrate-blog-posts');
}

enhanceArticlesTable().catch(console.error);
