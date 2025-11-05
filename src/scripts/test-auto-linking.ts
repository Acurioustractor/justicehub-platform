import { generateProfileLinkSuggestions, saveSuggestions, autoApplyHighConfidenceSuggestions } from '@/lib/auto-linking/engine';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function testAutoLinking() {
  console.log('🤖 Testing Auto-Linking Engine\n');

  // Get all synced profiles
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, full_name, slug')
    .eq('synced_from_empathy_ledger', true);

  if (!profiles || profiles.length === 0) {
    console.log('No synced profiles found.');
    return;
  }

  console.log(`Found ${profiles.length} synced profiles. Generating suggestions...\n`);

  let totalSuggestions = 0;
  let totalAutoApplied = 0;

  for (const profile of profiles) {
    console.log(`\n📋 ${profile.full_name} (${profile.slug})`);
    console.log('─'.repeat(60));

    // Generate suggestions
    const suggestions = await generateProfileLinkSuggestions(profile.id);

    if (suggestions.length === 0) {
      console.log('  No suggestions found.');
      continue;
    }

    totalSuggestions += suggestions.length;

    // Group by confidence level
    const highConfidence = suggestions.filter(s => s.confidence >= 0.90);
    const mediumConfidence = suggestions.filter(s => s.confidence >= 0.60 && s.confidence < 0.90);
    const lowConfidence = suggestions.filter(s => s.confidence < 0.60);

    if (highConfidence.length > 0) {
      console.log('\n  ⭐ HIGH CONFIDENCE (Auto-Apply):');
      for (const s of highConfidence) {
        console.log(`    → ${s.targetType} (${s.suggestedRole || 'N/A'}) - ${(s.confidence * 100).toFixed(0)}%`);
        console.log(`      Reason: ${s.reasoning}`);
      }
    }

    if (mediumConfidence.length > 0) {
      console.log('\n  📌 MEDIUM CONFIDENCE (Review Needed):');
      for (const s of mediumConfidence) {
        console.log(`    → ${s.targetType} (${s.suggestedRole || 'N/A'}) - ${(s.confidence * 100).toFixed(0)}%`);
        console.log(`      Reason: ${s.reasoning.substring(0, 80)}...`);
      }
    }

    if (lowConfidence.length > 0) {
      console.log('\n  💭 LOW CONFIDENCE (Related Content):');
      console.log(`    ${lowConfidence.length} potential related items`);
    }

    // Save suggestions to database
    console.log('\n  💾 Saving suggestions...');
    await saveSuggestions(suggestions);

    // Auto-apply high confidence
    const applied = await autoApplyHighConfidenceSuggestions(suggestions);
    totalAutoApplied += applied;

    if (applied > 0) {
      console.log(`  ✅ Auto-applied ${applied} high confidence suggestions`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Profiles analyzed: ${profiles.length}`);
  console.log(`Total suggestions: ${totalSuggestions}`);
  console.log(`Auto-applied: ${totalAutoApplied}`);
  console.log(`Pending review: ${totalSuggestions - totalAutoApplied}`);
  console.log('');
  console.log('View pending suggestions:');
  console.log('  - http://localhost:4000/admin/suggestions');
  console.log('');
}

testAutoLinking()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
