import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

/**
 * Engagement tiers:
 * - Aware (1-2 points): Signed up for newsletter or visited
 * - Engaged (3-5 points): Reacted, nominated, or wrote to MP
 * - Active (6-9 points): Multiple actions across categories
 * - Champion (10+ points): Sustained engagement across all channels
 */
const ENGAGEMENT_TIERS = {
  aware: { min: 1, max: 2, tag: GHL_TAGS.TIER_AWARE },
  engaged: { min: 3, max: 5, tag: GHL_TAGS.TIER_ENGAGED },
  active: { min: 6, max: 9, tag: GHL_TAGS.TIER_ACTIVE },
  champion: { min: 10, max: Infinity, tag: GHL_TAGS.TIER_CHAMPION },
} as const;

type TierName = keyof typeof ENGAGEMENT_TIERS;

// Scoring weights for different actions
const ACTION_SCORES: Record<string, number> = {
  newsletter_signup: 1,
  event_registration: 2,
  contained_reaction: 3,
  nomination_made: 3,
  mp_letter_sent: 4,
  help_form_submitted: 2,
  contact_form_submitted: 1,
  multiple_nominations: 2, // bonus for 2+ nominations
  multiple_mp_letters: 2,  // bonus for 2+ letters
};

/**
 * GET /api/cron/campaign/engagement-scoring
 *
 * Weekly cron that:
 * 1. Scores all contacts by their engagement across the platform
 * 2. Updates GHL tags with engagement tier
 * 3. Updates custom fields with score + breakdown
 *
 * Runs weekly on Mondays at 06:00 UTC.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient() as any;
    const results = {
      contacts_scored: 0,
      ghl_updated: 0,
      tier_distribution: { aware: 0, engaged: 0, active: 0, champion: 0 },
      errors: 0,
    };

    // 1. Get all newsletter subscribers (base of engagement)
    const { data: subscribers } = await supabase
      .from('newsletter_subscriptions')
      .select('email, full_name, subscribed_at, metadata')
      .eq('is_active', true);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers to score', ...results });
    }

    // 2. Get all reaction emails
    const { data: reactions } = await supabase
      .from('community_reflections')
      .select('metadata->>email, metadata->>type')
      .not('metadata->email', 'is', null);

    // 3. Get nomination activity
    const { data: nominations } = await supabase
      .from('campaign_alignment_entities')
      .select('alignment_signals')
      .eq('outreach_status', 'nominated');

    // Build email→actions map
    const emailActions: Record<string, Set<string>> = {};

    // Score newsletter signups
    for (const sub of subscribers) {
      if (!emailActions[sub.email]) emailActions[sub.email] = new Set();
      emailActions[sub.email].add('newsletter_signup');

      // Check welcome email engagement
      const welcomeSent = sub.metadata?.welcome_emails_sent || [];
      if (welcomeSent.length >= 2) {
        emailActions[sub.email].add('event_registration'); // Engaged with drip = extra point
      }
    }

    // Score reactions
    for (const reaction of (reactions || [])) {
      const email = reaction.email;
      if (!email) continue;
      if (!emailActions[email]) emailActions[email] = new Set();

      const type = reaction.type;
      if (type === 'contained_reaction') {
        emailActions[email].add('contained_reaction');
      } else if (type === 'mp_letter') {
        emailActions[email].add('mp_letter_sent');
        // Check for multiples
        const existing = emailActions[email];
        if (existing.has('mp_letter_sent')) {
          emailActions[email].add('multiple_mp_letters');
        }
      }
    }

    // Score nominations (from nominators stored in alignment_signals)
    for (const nom of (nominations || [])) {
      const nominators = nom.alignment_signals?.nominators || [];
      for (const nominator of nominators) {
        const email = nominator.email;
        if (!email) continue;
        if (!emailActions[email]) emailActions[email] = new Set();
        emailActions[email].add('nomination_made');
      }
    }

    // 4. Get contact form submissions
    const { data: contacts } = await supabase
      .from('contact_submissions')
      .select('email, category')
      .limit(1000);

    for (const contact of (contacts || [])) {
      if (!contact.email) continue;
      if (!emailActions[contact.email]) emailActions[contact.email] = new Set();

      if (contact.category === 'contained-help') {
        emailActions[contact.email].add('help_form_submitted');
      } else {
        emailActions[contact.email].add('contact_form_submitted');
      }
    }

    // 5. Calculate scores and update GHL
    const ghl = getGHLClient();
    const ghlConfigured = ghl.isConfigured();

    for (const [email, actions] of Object.entries(emailActions)) {
      let score = 0;
      const breakdown: string[] = [];

      for (const action of actions) {
        const points = ACTION_SCORES[action] || 0;
        score += points;
        breakdown.push(`${action}(+${points})`);
      }

      // Determine tier
      let tier: TierName = 'aware';
      for (const [name, config] of Object.entries(ENGAGEMENT_TIERS)) {
        if (score >= config.min && score <= config.max) {
          tier = name as TierName;
          break;
        }
      }

      results.tier_distribution[tier]++;
      results.contacts_scored++;

      // Update GHL with engagement tier
      if (ghlConfigured) {
        try {
          const tierConfig = ENGAGEMENT_TIERS[tier];
          // Remove old tier tags, add new one
          const allTierTags = Object.values(ENGAGEMENT_TIERS).map(t => t.tag);
          const existing = await ghl.findContactByEmail(email);

          if (existing) {
            // Remove old tier tags
            await ghl.removeTags(existing.id, allTierTags);
            // Add current tier tag
            await ghl.addTags(existing.id, [tierConfig.tag]);
            // Update custom fields with score
            await ghl.updateContact(existing.id, {
              customFields: {
                engagement_score: String(score),
                engagement_tier: tier,
                engagement_actions: breakdown.join(', '),
                engagement_scored_at: new Date().toISOString(),
              },
            });
            results.ghl_updated++;
          }
        } catch (err) {
          console.error(`[Engagement] GHL update failed for ${email}:`, err);
          results.errors++;
        }
      }
    }

    console.log(`[Engagement scoring] Scored: ${results.contacts_scored}, GHL: ${results.ghl_updated}, Tiers: ${JSON.stringify(results.tier_distribution)}`);

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('[Engagement scoring] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
