import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

interface EmpathyTranscript {
  id: string;
  storyteller_id: string;
  title: string | null;
  transcript_content: string | null;
  recording_date: string | null;
  video_url: string | null;
  audio_url: string | null;
  status: string | null;
  cultural_sensitivity: string | null;
  themes: any;
  created_at: string;
}

function generateSlug(title: string, id: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Add short ID to ensure uniqueness
  return `${baseSlug}-${id.slice(0, 8)}`;
}

async function syncTranscripts() {
  console.log('🎙️  Syncing transcripts from Empathy Ledger...\n');

  // Get all profiles that are synced to JusticeHub
  const { data: jhProfiles } = await supabase
    .from('public_profiles')
    .select('id, empathy_ledger_profile_id, full_name')
    .not('empathy_ledger_profile_id', 'is', null);

  if (!jhProfiles || jhProfiles.length === 0) {
    console.log('No synced profiles found.');
    return;
  }

  const profileMap = new Map(
    jhProfiles.map(p => [p.empathy_ledger_profile_id!, p])
  );

  console.log(`Found ${jhProfiles.length} synced profiles\n`);

  let created = 0;
  let updated = 0;
  let linked = 0;
  let skipped = 0;

  // Get all transcripts for synced profiles
  const empathyProfileIds = Array.from(profileMap.keys());

  for (const empathyProfileId of empathyProfileIds) {
    const jhProfile = profileMap.get(empathyProfileId)!;

    const { data: transcripts, error } = await empathyLedgerClient
      .from('transcripts')
      .select('*')
      .eq('storyteller_id', empathyProfileId);

    if (error || !transcripts || transcripts.length === 0) {
      continue;
    }

    console.log(`\n👤 ${jhProfile.full_name}: ${transcripts.length} transcript(s)`);

    for (const transcript of transcripts as EmpathyTranscript[]) {
      const title = transcript.title || `Transcript for ${jhProfile.full_name}`;
      const slug = generateSlug(title, transcript.id);

      // Check if already synced
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id, slug')
        .eq('empathy_ledger_transcript_id', transcript.id)
        .single();

      if (existing) {
        console.log(`   ✓ Already synced: ${title}`);
        skipped++;
        continue;
      }

      // Create as blog post
      const { data: newPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          content: transcript.transcript_content || '',
          excerpt: `Transcript of interview with ${jhProfile.full_name}`,
          status: transcript.status === 'completed' ? 'published' : 'draft',
          published_at: transcript.status === 'completed' ? transcript.created_at : null,
          empathy_ledger_transcript_id: transcript.id,
          synced_from_empathy_ledger: true,
          video_url: transcript.video_url,
          audio_url: transcript.audio_url,
          cultural_sensitivity_flag: transcript.cultural_sensitivity === 'high',
          tags: transcript.themes || [],
          created_at: transcript.created_at
        })
        .select()
        .single();

      if (insertError) {
        console.log(`   ❌ Failed to create: ${title}`, insertError.message);
        continue;
      }

      console.log(`   ✨ Created: ${title} (${newPost.status})`);
      created++;

      // Link to profile using blog_posts_profiles
      const { error: linkError } = await supabase
        .from('blog_posts_profiles')
        .insert({
          blog_post_id: newPost.id,
          public_profile_id: jhProfile.id,
          role: 'subject', // The person being interviewed
          is_featured: true
        });

      if (!linkError) {
        console.log(`      🔗 Linked to ${jhProfile.full_name}`);
        linked++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(60));
  console.log(`✨ Created: ${created}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`🔗 Linked: ${linked}`);
  console.log(`⏭️  Skipped (already synced): ${skipped}`);
}

syncTranscripts()
  .then(() => {
    console.log('\n✅ Transcript sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
