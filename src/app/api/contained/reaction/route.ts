import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_CANONICAL } from '@/lib/ghl/client';
import { sendEmail } from '@/lib/email/send';
import { verifyTurnstileToken } from '@/lib/turnstile';

const SITE = 'https://justicehub.com.au';

/**
 * POST /api/contained/reaction
 * Captures visitor reactions after walking through CONTAINED.
 * - Saves to community_reflections
 * - Tags in GHL with Reacted + CONTAINED
 * - Sends follow-up email with action prompts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feelings, response, would_nominate, name, email, turnstile_token } = body;

    // Verify Turnstile token
    const turnstileValid = await verifyTurnstileToken(turnstile_token);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Bot verification failed. Please try again.' },
        { status: 403 }
      );
    }

    if ((!feelings || feelings.length === 0) && !response) {
      return NextResponse.json(
        { error: 'Please share at least one feeling or a written response.' },
        { status: 400 }
      );
    }

    const service = createServiceClient() as any;

    // Build reflection text from feelings + response
    const parts: string[] = [];
    if (feelings?.length > 0) {
      parts.push(`Feelings: ${feelings.join(', ')}`);
    }
    if (response) {
      parts.push(response.slice(0, 1000));
    }
    if (would_nominate) {
      parts.push(`Would nominate: ${would_nominate}`);
    }

    const reflectionText = parts.join('\n\n');

    // Save to community_reflections (include email in metadata for post-experience drip)
    const { data, error } = await service
      .from('community_reflections')
      .insert({
        name: name || 'Anonymous Visitor',
        reflection: reflectionText,
        is_approved: false,
        metadata: {
          type: 'contained_reaction',
          email: email || null,
          feelings: feelings || [],
          would_nominate: would_nominate || null,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Reaction] Failed to save:', error);
      return NextResponse.json({ error: 'Failed to save reaction' }, { status: 500 });
    }

    // If email provided, tag in GHL and send follow-up
    if (email) {
      // GHL sync with proper tags
      const ghl = getGHLClient();
      if (ghl.isConfigured()) {
        ghl.upsertContact({
          email,
          name: name || undefined,
          // Canonical CONTAINED reflection (R4): identity base + storyteller role.
          // No comms: — an in-experience reflection is never an auto opt-in (OCAP).
          tags: [
            GHL_CANONICAL.PROJECT_JH,
            GHL_CANONICAL.SOURCE_EVENT_CONTAINED,
            GHL_CANONICAL.INTEREST_JUSTICE_REFORM,
            GHL_CANONICAL.ROLE_STORYTELLER,
          ],
          source: 'CONTAINED Reaction Form',
          customFields: {
            contained_feelings: feelings?.join(', ') || '',
            entry_path: 'adelaide_remand',
          },
        }).catch(err => console.error('[Reaction] GHL tag failed:', err));
      }

      // Send follow-up email while the experience is still fresh.
      const visitorName = name || 'there';
      sendEmail({
        to: email,
        subject: 'What you can do with what you just felt',
        preheader: 'Three actions. Five minutes. Real impact.',
        body: `Hey ${visitorName},

Thank you for walking through CONTAINED. What you felt in there is real.

${response ? `You said: "${response.slice(0, 200)}"` : ''}

That feeling is exactly why we built this. Here is what you can do with it.

1. OPEN THE REMAND EVIDENCE
See the law, campaigns, alternatives, funding context, and source links behind the experience.
-> ${SITE}/remand

2. SHARE THE ADELAIDE PATH
Send the public visitor pathway to someone who should walk through or understand what this is becoming.
-> ${SITE}/adelaide

3. COMPARE GLOBAL MODELS
Follow the country reports as the Africa and Europe learning route takes shape.
-> ${SITE}/justice-network/countries

You have now seen the issue in the room. JusticeHub holds the evidence, alternatives, and source links that help people act with care.

The JusticeHub Team`,
      }).catch(err => console.error('[Reaction] Follow-up email failed:', err));
    }

    // Track as member action if user has an account
    if (email) {
      const { data: matchedProfile } = await service
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (matchedProfile?.id) {
        await service.from('member_actions').insert({
          user_id: matchedProfile.id,
          action_type: 'event_registration',
          metadata: { sub_type: 'contained_reaction', feelings: feelings || [] },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
