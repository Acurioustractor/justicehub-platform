import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sendEmail } from '@/lib/email/send';
import { verifyTurnstileToken } from '@/lib/turnstile';

const SITE = 'https://justicehub.com.au';

/**
 * POST /api/contained/reaction
 * Captures visitor reactions after walking through THE CONTAINED.
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
          tags: [
            GHL_TAGS.REACTED,
            GHL_TAGS.CONTAINED,
            GHL_TAGS.JUSTICEHUB,
          ],
          source: 'CONTAINED Reaction Form',
          customFields: {
            contained_feelings: feelings?.join(', ') || '',
          },
        }).catch(err => console.error('[Reaction] GHL tag failed:', err));
      }

      // Send follow-up email — strike while the emotion is fresh
      const visitorName = name || 'there';
      sendEmail({
        to: email,
        subject: 'What you can do with what you just felt',
        preheader: 'Three actions. Five minutes. Real impact.',
        body: `Hey ${visitorName},

Thank you for walking through THE CONTAINED. What you felt in there is real.

${response ? `You said: "${response.slice(0, 200)}"` : ''}

That feeling is exactly why we built this. Now here's what you can do with it.

1. NOMINATE A DECISION MAKER
Know a politician, CEO, or someone who makes decisions about young people? Nominate them. We'll personally invite them to walk through.
→ ${SITE}/contained#nominate

2. WRITE TO YOUR MP
Use our templates — email, SMS, or social. Takes 2 minutes.
→ ${SITE}/contained/act

3. SHARE WHAT YOU FELT
Download stat cards and share templates. Same evidence, every platform.
→ ${SITE}/contained/tour/social

876 community programs exist across Australia that work better than detention and cost a fraction. You've now seen the evidence. Help us make it impossible to ignore.

— The JusticeHub Team`,
      }).catch(err => console.error('[Reaction] Follow-up email failed:', err));
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
