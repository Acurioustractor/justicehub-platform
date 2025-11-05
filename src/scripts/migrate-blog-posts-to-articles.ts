import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function migrateBlogPostsToArticles() {
  console.log('🔄 Migrating Blog Posts to Articles Table\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 0: Get default author (Benjamin Knight)
  console.log('0️⃣ Getting default author...');
  const { data: defaultAuthor, error: authorError } = await supabase
    .from('authors')
    .select('id, name')
    .eq('name', 'Benjamin Knight')
    .single();

  if (authorError || !defaultAuthor) {
    console.error('❌ Error: Could not find default author "Benjamin Knight"');
    console.error('   Please ensure an author exists in the authors table');
    return;
  }

  console.log(`✅ Using author: ${defaultAuthor.name} (${defaultAuthor.id})\n`);

  // Step 1: Get all blog posts
  console.log('1️⃣ Fetching blog posts...');
  const { data: blogPosts, error: fetchError } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching blog posts:', fetchError.message);
    return;
  }

  if (!blogPosts || blogPosts.length === 0) {
    console.log('✅ No blog posts to migrate.');
    return;
  }

  console.log(`✅ Found ${blogPosts.length} blog posts to migrate\n`);

  // Step 2: Check which ones already exist in articles
  console.log('2️⃣ Checking for existing articles with same slugs...');
  const slugs = blogPosts.map(post => post.slug);
  const { data: existingArticles, error: checkError } = await supabase
    .from('articles')
    .select('slug')
    .in('slug', slugs);

  if (checkError) {
    console.error('❌ Error checking existing articles:', checkError.message);
    return;
  }

  const existingSlugs = new Set(existingArticles?.map(a => a.slug) || []);
  console.log(`   Found ${existingSlugs.size} existing articles with matching slugs\n`);

  // Step 3: Migrate each blog post
  console.log('3️⃣ Migrating blog posts to articles...\n');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of blogPosts) {
    if (existingSlugs.has(post.slug)) {
      console.log(`⏭️  Skipping "${post.title}" - already exists in articles`);
      skipped++;
      continue;
    }

    console.log(`📝 Migrating: "${post.title || '(untitled)'}"`);

    // Skip empty/test posts
    if (!post.title || post.title.toLowerCase() === 'test') {
      console.log(`   ⏭️  Skipping test/empty post`);
      skipped++;
      continue;
    }

    // Map category from blog_posts to articles valid values
    // blog_posts categories: Campaign, Art & Innovation, Systems Change
    // articles categories: seeds, growth, roots, harvest
    let primaryCategory = null;
    if (post.categories && post.categories.length > 0) {
      const blogCategory = post.categories[0].toLowerCase();
      if (blogCategory.includes('campaign') || blogCategory.includes('art')) {
        primaryCategory = 'growth'; // Campaign/Art & Innovation -> growth (active projects)
      } else if (blogCategory.includes('systems')) {
        primaryCategory = 'roots'; // Systems Change -> roots (foundational work)
      }
    }

    // Map blog_posts fields to articles fields
    const articleData = {
      // Direct mappings (common fields)
      id: post.id, // Preserve ID if possible
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image_url: post.featured_image_url,
      author_id: defaultAuthor.id, // Use valid author
      status: post.status,
      published_at: post.published_at,
      view_count: post.view_count || 0,
      reading_time_minutes: post.reading_time_minutes || 1,
      created_at: post.created_at,
      updated_at: post.updated_at,

      // New fields from blog_posts
      featured_image_caption: post.featured_image_caption,
      co_authors: post.co_authors,
      tags: post.tags,
      share_count: post.share_count || 0,
      categories: post.categories, // Keep original categories array

      // Field mappings (renamed)
      seo_title: post.meta_title,
      seo_description: post.meta_description,

      // Derive primary category from categories array
      category: primaryCategory, // Mapped to valid articles category

      // Keep existing articles-only fields as null/default
      is_trending: false,
      location_tags: null,
      metadata: {},
    };

    // Insert into articles table
    const { error: insertError } = await supabase
      .from('articles')
      .insert([articleData]);

    if (insertError) {
      console.error(`   ❌ Error migrating "${post.title}":`, insertError.message);
      console.error('      Details:', insertError.details);
      console.error('      Hint:', insertError.hint);
      errors++;
    } else {
      console.log(`   ✅ Migrated successfully`);
      migrated++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Migration Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✅ Migrated: ${migrated}`);
  console.log(`⏭️  Skipped (already exist): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`\n📊 Total blog posts: ${blogPosts.length}`);

  if (errors === 0 && migrated > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Verify migrated articles in database');
    console.log('   2. Test accessing articles through /stories routes');
    console.log('   3. Copy enhanced blog editor to stories editor');
    console.log('   4. Archive blog_posts table');
  } else if (errors > 0) {
    console.log('\n⚠️  Migration completed with errors.');
    console.log('   Please review the error messages above.');
  } else {
    console.log('\n✅ All blog posts already exist in articles table.');
  }
}

migrateBlogPostsToArticles().catch(console.error);
