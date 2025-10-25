import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function addForeignKeys() {
  console.log('🔗 Adding foreign key relationships to blog tables...\n');

  try {
    // Add foreign key from blog_posts.author_id to public_profiles.id
    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_posts
        ADD CONSTRAINT blog_posts_author_id_fkey
        FOREIGN KEY (author_id)
        REFERENCES public_profiles(id)
        ON DELETE SET NULL;
      `
    });
    console.log('✅ Added foreign key: blog_posts.author_id -> public_profiles.id');

    // Add foreign key from blog_media.blog_post_id to blog_posts.id
    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_media
        ADD CONSTRAINT blog_media_blog_post_id_fkey
        FOREIGN KEY (blog_post_id)
        REFERENCES blog_posts(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_media.blog_post_id -> blog_posts.id');

    // Add foreign key from blog_content_links.blog_post_id to blog_posts.id
    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_content_links
        ADD CONSTRAINT blog_content_links_blog_post_id_fkey
        FOREIGN KEY (blog_post_id)
        REFERENCES blog_posts(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_content_links.blog_post_id -> blog_posts.id');

    // Add foreign keys for linked content
    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_content_links
        ADD CONSTRAINT blog_content_links_profile_id_fkey
        FOREIGN KEY (profile_id)
        REFERENCES public_profiles(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_content_links.profile_id -> public_profiles.id');

    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_content_links
        ADD CONSTRAINT blog_content_links_program_id_fkey
        FOREIGN KEY (program_id)
        REFERENCES community_programs(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_content_links.program_id -> community_programs.id');

    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_content_links
        ADD CONSTRAINT blog_content_links_service_id_fkey
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_content_links.service_id -> services.id');

    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_content_links
        ADD CONSTRAINT blog_content_links_art_id_fkey
        FOREIGN KEY (art_id)
        REFERENCES art_innovation(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_content_links.art_id -> art_innovation.id');

    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_content_links
        ADD CONSTRAINT blog_content_links_story_id_fkey
        FOREIGN KEY (story_id)
        REFERENCES articles(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_content_links.story_id -> articles.id');

    // Add foreign keys for comments
    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_comments
        ADD CONSTRAINT blog_comments_blog_post_id_fkey
        FOREIGN KEY (blog_post_id)
        REFERENCES blog_posts(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_comments.blog_post_id -> blog_posts.id');

    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_comments
        ADD CONSTRAINT blog_comments_author_id_fkey
        FOREIGN KEY (author_id)
        REFERENCES public_profiles(id)
        ON DELETE SET NULL;
      `
    });
    console.log('✅ Added foreign key: blog_comments.author_id -> public_profiles.id');

    await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE blog_comments
        ADD CONSTRAINT blog_comments_parent_comment_id_fkey
        FOREIGN KEY (parent_comment_id)
        REFERENCES blog_comments(id)
        ON DELETE CASCADE;
      `
    });
    console.log('✅ Added foreign key: blog_comments.parent_comment_id -> blog_comments.id');

    console.log('\n✨ All foreign keys added successfully!');

  } catch (error) {
    console.error('❌ Error adding foreign keys:', error);
  }
}

addForeignKeys();
