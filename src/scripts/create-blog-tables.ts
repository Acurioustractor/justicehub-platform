import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function createBlogTables() {
  console.log('📦 Creating blog system tables...\n');

  try {
    // Create blog_posts table
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS blog_posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          published_at TIMESTAMPTZ,

          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          excerpt TEXT,
          content TEXT NOT NULL,
          featured_image_url TEXT,
          featured_image_caption TEXT,

          author_id UUID,
          co_authors UUID[],

          status TEXT DEFAULT 'draft',
          tags TEXT[],
          categories TEXT[],

          meta_title TEXT,
          meta_description TEXT,

          view_count INTEGER DEFAULT 0,
          share_count INTEGER DEFAULT 0
        );
      `
    });
    console.log('✅ blog_posts table created');

    // Create blog_media table
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS blog_media (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),

          blog_post_id UUID,

          media_type TEXT NOT NULL,
          url TEXT NOT NULL,
          thumbnail_url TEXT,

          title TEXT,
          caption TEXT,
          alt_text TEXT,

          video_provider TEXT,
          video_embed_code TEXT,

          file_size INTEGER,
          mime_type TEXT,

          display_order INTEGER DEFAULT 0
        );
      `
    });
    console.log('✅ blog_media table created');

    // Create blog_content_links table
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS blog_content_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),

          blog_post_id UUID,

          link_type TEXT NOT NULL,

          profile_id UUID,
          program_id UUID,
          service_id UUID,
          art_id UUID,
          story_id UUID,

          context TEXT
        );
      `
    });
    console.log('✅ blog_content_links table created');

    // Create blog_comments table
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS blog_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),

          blog_post_id UUID,
          author_id UUID,

          content TEXT NOT NULL,
          status TEXT DEFAULT 'pending',

          parent_comment_id UUID
        );
      `
    });
    console.log('✅ blog_comments table created');

    // Create indexes
    console.log('\n📑 Creating indexes...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)',
      'CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)',
      'CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id)',
      'CREATE INDEX IF NOT EXISTS idx_blog_media_post ON blog_media(blog_post_id)',
      'CREATE INDEX IF NOT EXISTS idx_blog_content_links_post ON blog_content_links(blog_post_id)',
      'CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(blog_post_id)',
    ];

    for (const index of indexes) {
      await supabase.rpc('exec_sql', { query: index });
    }
    console.log('✅ Indexes created');

    console.log('\n✨ Blog system ready!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

createBlogTables();
