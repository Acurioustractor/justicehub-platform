#!/usr/bin/env node

/**
 * Sync Empathy Ledger Profiles to JusticeHub
 *
 * This script uses the profile_appearances pattern to link Empathy Ledger
 * profiles to JusticeHub content WITHOUT duplicating profile data.
 *
 * Empathy Ledger remains the source of truth for:
 * - Profile photos (stored in Empathy Ledger infrastructure)
 * - Profile bios
 * - Stories and consent
 * - Cultural protocols
 *
 * JusticeHub only stores:
 * - Links (profile_appearances) showing which profiles appear on which content
 * - Context (role, story excerpt, featured status)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

// Initialize clients
const justiceHubClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const empathyLedgerClient = createClient(
  process.env.EMPATHY_LEDGER_SUPABASE_URL,
  process.env.EMPATHY_LEDGER_SUPABASE_ANON_KEY
);

// Justice-related themes
const JUSTICE_THEMES = [
  'youth-justice',
  'Justice',
  'Justice Reinvestment',
  'indigenous justice reform',
  'preventing justice system involvement',
  'preventive justice',
  'Drug and Alcohol',
  'Homelessness',
  'mental_health',
  'Family',
  'family_healing',
  'youth empowerment',
  'community_safety'
];

/**
 * Check if a story is justice-related
 */
function isJusticeRelated(story) {
  // Has service link (linked to JusticeHub service)
  if (story.service_id) return true;

  // Has justice theme
  if (story.themes?.some(theme =>
    JUSTICE_THEMES.some(jt =>
      theme.toLowerCase().includes(jt.toLowerCase()) ||
      jt.toLowerCase().includes(theme.toLowerCase())
    )
  )) {
    return true;
  }

  return false;
}

/**
 * Sync stories to create profile appearances
 */
async function syncProfileAppearances() {
  console.log('🔄 Starting Empathy Ledger profile sync...\n');

  const stats = {
    storiesProcessed: 0,
    appearancesCreated: 0,
    appearancesUpdated: 0,
    appearancesSkipped: 0,
    errors: []
  };

  try {
    // 1. Fetch all public justice-related stories from Empathy Ledger
    console.log('📖 Fetching public stories from Empathy Ledger...');
    const { data: allStories, error: storiesError } = await empathyLedgerClient
      .from('stories')
      .select('*')
      .eq('is_public', true)
      .eq('privacy_level', 'public')
      .order('created_at', { ascending: false })
      .limit(500);

    if (storiesError) {
      throw new Error(`Failed to fetch stories: ${storiesError.message}`);
    }

    const justiceStories = (allStories || []).filter(isJusticeRelated);
    console.log(`✅ Found ${justiceStories.length} justice-related stories (out of ${allStories.length} total)\n`);

    // 2. Create profile appearances for stories linked to services
    console.log('🔗 Creating profile appearances...');

    for (const story of justiceStories) {
      stats.storiesProcessed++;

      const profileId = story.author_id || story.storyteller_id;
      if (!profileId) {
        stats.appearancesSkipped++;
        continue;
      }

      // Only create appearances for stories linked to services
      if (story.service_id) {
        try {
          // Check if appearance already exists
          const { data: existing } = await justiceHubClient
            .from('profile_appearances')
            .select('id')
            .eq('empathy_ledger_profile_id', profileId)
            .eq('appears_on_type', 'service')
            .eq('appears_on_id', story.service_id)
            .maybeSingle();

          const appearanceData = {
            empathy_ledger_profile_id: profileId,
            appears_on_type: 'service',
            appears_on_id: story.service_id,
            role: 'service_user',
            story_excerpt: story.summary || story.content?.substring(0, 200),
            featured: story.is_featured || false
          };

          if (existing) {
            // Update existing
            const { error: updateError } = await justiceHubClient
              .from('profile_appearances')
              .update({
                story_excerpt: appearanceData.story_excerpt,
                featured: appearanceData.featured,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            if (updateError) {
              stats.errors.push(`Update failed for story ${story.id}: ${updateError.message}`);
            } else {
              stats.appearancesUpdated++;
            }
          } else {
            // Create new
            const { error: insertError } = await justiceHubClient
              .from('profile_appearances')
              .insert(appearanceData);

            if (insertError) {
              stats.errors.push(`Insert failed for story ${story.id}: ${insertError.message}`);
            } else {
              stats.appearancesCreated++;
            }
          }
        } catch (error) {
          stats.errors.push(`Error processing story ${story.id}: ${error.message}`);
        }
      } else {
        stats.appearancesSkipped++;
      }
    }

    // 3. Print summary
    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 Sync Summary');
    console.log('═══════════════════════════════════════════════\n');
    console.log(`✅ Stories processed: ${stats.storiesProcessed}`);
    console.log(`🆕 Appearances created: ${stats.appearancesCreated}`);
    console.log(`🔄 Appearances updated: ${stats.appearancesUpdated}`);
    console.log(`⏭️  Appearances skipped: ${stats.appearancesSkipped}`);
    console.log(`❌ Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════\n');

    // 4. Send Telegram notification if configured
    await sendTelegramNotification(stats);

    return stats;

  } catch (error) {
    console.error('❌ Sync failed:', error);
    await sendTelegramNotification({
      error: error.message,
      failed: true
    });
    throw error;
  }
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(stats) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('⚠️  Telegram credentials not configured - skipping notification');
    return;
  }

  try {
    const message = stats.failed
      ? `❌ *JusticeHub Profile Sync Failed*\n\nError: ${stats.error}`
      : `✅ *JusticeHub Profile Sync Complete*\n\n` +
        `Stories: ${stats.storiesProcessed}\n` +
        `Created: ${stats.appearancesCreated}\n` +
        `Updated: ${stats.appearancesUpdated}\n` +
        `Errors: ${stats.errors?.length || 0}`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );

    if (response.ok) {
      console.log('📱 Telegram notification sent successfully');
    } else {
      const error = await response.json();
      console.error('⚠️  Failed to send Telegram notification:', error.description);
    }
  } catch (error) {
    console.error('⚠️  Telegram notification error:', error.message);
  }
}

// Run sync
syncProfileAppearances()
  .then(() => {
    console.log('✅ Sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });
