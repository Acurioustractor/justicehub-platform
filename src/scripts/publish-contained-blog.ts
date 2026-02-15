import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function publishContainedBlog() {
  console.log('📝 Publishing CONTAINED blog post...\n');

  try {
    // Get Benjamin Knight's profile
    const { data: profile } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('slug', 'benjamin-knight')
      .single();

    if (!profile) {
      console.log('❌ Could not find Benjamin Knight profile');
      return;
    }

    // Read the blog post content
    const content = fs.readFileSync('blog-drafts/contained-launch.md', 'utf-8');

    // Extract title and content (remove the first line which is the title)
    const lines = content.split('\n');
    const title = lines[0].replace(/^# /, '');
    const remainingContent = lines.slice(1).join('\n');

    // Create the blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: title,
        slug: 'building-revolution-in-shipping-containers',
        excerpt: 'CONTAINED is not another awareness campaign with sad statistics on posters. It\'s an immersive experience built from shipping containers - transformation chambers that make the invisible visible and the abstract tangible.',
        content: remainingContent,
        author_id: profile.id,
        status: 'published',
        published_at: new Date().toISOString(),
        tags: [
          'YouthJustice',
          'CONTAINED',
          'SystemsChange',
          'ImmersiveExperience',
          'ACuriousTractor',
          'EvidenceBasedAdvocacy',
          'CommunityPrograms'
        ],
        categories: ['Campaign', 'Art & Innovation', 'Systems Change'],
        meta_title: 'Building Revolution in Shipping Containers: The CONTAINED Campaign',
        meta_description: 'CONTAINED creates immersive experiences that transform understanding into action. By making the invisible visible, we build infrastructure for transformation in youth justice.',
        featured_image_url: null, // We'll add images in next step
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Blog post created!');
    console.log(`   Title: ${post.title}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   URL: /blog/${post.slug}`);

    // Link to CONTAINED art project
    const { data: containedArt } = await supabase
      .from('art_innovation')
      .select('id')
      .eq('slug', 'contained')
      .single();

    if (containedArt) {
      await supabase
        .from('blog_content_links')
        .insert([{
          blog_post_id: post.id,
          link_type: 'art',
          art_id: containedArt.id,
          context: 'Featured Campaign'
        }]);

      console.log('✅ Linked to CONTAINED art project');
    }

    // Link to Nicholas Marchesi if profile exists
    const { data: nicholasProfile } = await supabase
      .from('public_profiles')
      .select('id')
      .ilike('full_name', '%nicholas%marchesi%')
      .single();

    if (nicholasProfile) {
      await supabase
        .from('blog_content_links')
        .insert([{
          blog_post_id: post.id,
          link_type: 'profile',
          profile_id: nicholasProfile.id,
          context: 'Co-founder, A Curious Tractor'
        }]);

      console.log('✅ Linked to Nicholas Marchesi profile');
    }

    // Link to Benjamin Knight (author)
    await supabase
      .from('blog_content_links')
      .insert([{
        blog_post_id: post.id,
        link_type: 'profile',
        profile_id: profile.id,
        context: 'Co-founder, A Curious Tractor'
      }]);

    console.log('✅ Linked to Benjamin Knight profile');

    console.log('\n🎉 CONTAINED blog post published successfully!');
    console.log(`\n🌐 View it at: http://localhost:3003/blog/${post.slug}`);
    console.log(`📊 Admin: http://localhost:3003/admin/blog\n`);

  } catch (error) {
    console.error('❌ Error publishing blog post:', error);
  }
}

publishContainedBlog();
