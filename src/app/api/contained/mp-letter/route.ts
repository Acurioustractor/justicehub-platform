import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';

const SITE = 'https://justicehub.com.au';

// Pre-written letter templates for different audiences
const LETTER_TEMPLATES: Record<string, { subject: string; body: string }> = {
  email: {
    subject: 'Youth detention is not working — here is the evidence',
    body: `Dear {{mp_name}},

I am writing to you as a constituent in {{electorate}} about youth justice policy in Australia.

I recently walked through THE CONTAINED — a travelling exhibition that presents verified evidence on youth detention outcomes in Australia. The data is confronting:

- $4,250 per day to detain one child
- 85% reoffending rate within 12 months of release
- First Nations children are 17x more likely to be detained

Meanwhile, 981 verified community programs exist across Australia that achieve dramatically better outcomes at a fraction of the cost. Programs like Diagrama's therapeutic approach see reoffending rates below 14%.

This is not an ideological argument. It is an economic and evidence-based one.

I am asking you to:
1. Review the evidence at justicehub.com.au/intelligence/interventions
2. Walk through THE CONTAINED when it arrives in our region
3. Support investment in evidence-backed community alternatives

I would welcome the opportunity to discuss this further.

Sincerely,
{{sender_name}}
{{sender_location}}`,
  },
  sms: {
    subject: 'SMS to MP',
    body: `Hi {{mp_name}}, I'm a constituent writing about youth justice. Australia spends $4,250/day to detain one child with 85% reoffending. 981 community programs work better at a fraction of the cost. I'd love you to see the evidence: justicehub.com.au/contained — {{sender_name}}`,
  },
  social: {
    subject: 'Social Media Post',
    body: `.@{{mp_handle}} Did you know Australia spends $4,250/day to detain one child — with 85% reoffending?

981 community programs work better. For less.

I just walked through @JusticeHubAU's THE CONTAINED. The evidence is impossible to ignore.

Will you look at it? justicehub.com.au/contained`,
  },
};

/**
 * GET /api/contained/mp-letter
 * Returns available templates and current social proof stats
 */
export async function GET() {
  try {
    const supabase = createServiceClient() as any;

    // Get total letters sent (from metadata)
    const { count: totalLetters } = await supabase
      .from('community_reflections')
      .select('id', { count: 'exact', head: true })
      .eq('metadata->>type', 'mp_letter');

    // Get unique MPs contacted
    const { data: uniqueMPs } = await supabase
      .from('community_reflections')
      .select('metadata->>mp_name')
      .eq('metadata->>type', 'mp_letter')
      .not('metadata->mp_name', 'is', null);

    const uniqueMPCount = new Set(
      (uniqueMPs || []).map((r: any) => r.mp_name?.toLowerCase())
    ).size;

    return NextResponse.json({
      templates: Object.keys(LETTER_TEMPLATES),
      social_proof: {
        total_letters_sent: totalLetters || 0,
        unique_mps_contacted: uniqueMPCount,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/contained/mp-letter
 *
 * Records when someone sends a letter to their MP.
 * - Tracks letter sends with social proof counter
 * - Tags sender in GHL
 * - Sends confirmation + escalates at thresholds
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      template_type,
      mp_name,
      electorate,
      sender_name,
      sender_email,
      sender_location,
      custom_message,
    } = body;

    if (!sender_email || !sender_name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const email = sanitizeEmail(sender_email);
    if (!email) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const sanitizedName = sanitizeInput(String(sender_name), { maxLength: 200, allowNewlines: false });
    const sanitizedMPName = mp_name ? sanitizeInput(String(mp_name), { maxLength: 200, allowNewlines: false }) : null;
    const sanitizedElectorate = electorate ? sanitizeInput(String(electorate), { maxLength: 200, allowNewlines: false }) : null;
    const sanitizedLocation = sender_location ? sanitizeInput(String(sender_location), { maxLength: 200, allowNewlines: false }) : null;
    const templateType = LETTER_TEMPLATES[template_type] ? template_type : 'email';

    const supabase = createServiceClient() as any;

    // Get the template and fill in variables
    const template = LETTER_TEMPLATES[templateType];
    const filledBody = template.body
      .replace(/\{\{mp_name\}\}/g, sanitizedMPName || 'Member')
      .replace(/\{\{electorate\}\}/g, sanitizedElectorate || 'your electorate')
      .replace(/\{\{sender_name\}\}/g, sanitizedName)
      .replace(/\{\{sender_location\}\}/g, sanitizedLocation || '')
      .replace(/\{\{mp_handle\}\}/g, '');

    // Record the letter send
    const { data, error } = await supabase
      .from('community_reflections')
      .insert({
        name: sanitizedName,
        reflection: custom_message || filledBody,
        is_approved: false,
        metadata: {
          type: 'mp_letter',
          template_type: templateType,
          mp_name: sanitizedMPName,
          electorate: sanitizedElectorate,
          email,
          sent_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[MP Letter] Save error:', error);
      return NextResponse.json({ error: 'Failed to record letter' }, { status: 500 });
    }

    // Get social proof: how many letters sent to this MP
    let mpLetterCount = 1;
    if (sanitizedMPName) {
      const { count } = await supabase
        .from('community_reflections')
        .select('id', { count: 'exact', head: true })
        .eq('metadata->>type', 'mp_letter')
        .ilike('metadata->>mp_name', sanitizedMPName);
      mpLetterCount = count || 1;
    }

    // Get total letters sent
    const { count: totalLetters } = await supabase
      .from('community_reflections')
      .select('id', { count: 'exact', head: true })
      .eq('metadata->>type', 'mp_letter');

    // Tag in GHL
    const ghl = getGHLClient();
    if (ghl.isConfigured()) {
      ghl.upsertContact({
        email,
        name: sanitizedName,
        tags: [GHL_TAGS.WROTE_MP, GHL_TAGS.CONTAINED, GHL_TAGS.JUSTICEHUB],
        source: 'JusticeHub MP Letter Tool',
        customFields: {
          mp_contacted: sanitizedMPName || 'Unknown',
          electorate: sanitizedElectorate || '',
          letters_sent: String(mpLetterCount),
        },
      }).catch(err => console.error('[MP Letter] GHL sync error:', err));
    }

    // Send confirmation email
    sendEmail({
      to: email,
      subject: `Your letter has been sent${sanitizedMPName ? ` — ${sanitizedMPName} will hear from ${mpLetterCount} ${mpLetterCount === 1 ? 'person' : 'people'}` : ''}`,
      preheader: 'Every letter counts. Here\'s what happens next.',
      body: `Hey ${sanitizedName},

You did it. Your voice is now part of the record.

${sanitizedMPName ? `You contacted ${sanitizedMPName}${sanitizedElectorate ? ` (${sanitizedElectorate})` : ''}. ${mpLetterCount > 1 ? `${mpLetterCount} people have now contacted this MP through JusticeHub. The pressure is building.` : 'You\'re the first person to contact this MP through JusticeHub. Others will follow.'}` : ''}

${totalLetters && totalLetters > 10 ? `Across Australia, ${totalLetters} letters have been sent to decision makers through this tool.` : ''}

WHAT HAPPENS NEXT

Your letter joins a growing body of constituent pressure. MPs track incoming correspondence by topic. When youth justice letters start stacking up, staffers notice.

WANT TO DO MORE?

→ Nominate a decision maker for THE CONTAINED: ${SITE}/contained#nominate
→ Share the evidence on social: ${SITE}/contained/tour/social
→ Forward this to someone who cares: ${SITE}/contained

Every letter. Every nomination. Every share. It adds up.

— The JusticeHub Team`,
    }).catch(err => console.error('[MP Letter] Confirmation email failed:', err));

    // Escalation: log when an MP gets 5+ letters
    if (mpLetterCount >= 5 && mpLetterCount % 5 === 0) {
      console.log(`[ESCALATION] MP ${sanitizedMPName} has received ${mpLetterCount} letters — needs follow-up from Ben`);
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      template: filledBody,
      social_proof: {
        mp_letter_count: mpLetterCount,
        total_letters: totalLetters || 0,
      },
    });
  } catch (error: any) {
    console.error('[MP Letter] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
