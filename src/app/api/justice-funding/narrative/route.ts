import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callLLM } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FundingNarrativeResponse = {
  headline: string;
  narrative: string;
  key_finding: string;
  accountability_score: string;
  gaps: string[];
  questions: string[];
};

/**
 * GET /api/justice-funding/narrative?org=<uuid>
 *
 * Generates a gap narrative for an organisation:
 * "This org received $X over Y years. They run Z interventions.
 *  The outcomes show... but the community says the unmet need is..."
 */
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org');
  if (!orgId) {
    return NextResponse.json({ error: 'org parameter required' }, { status: 400 });
  }

  try {
    // Fetch org profile data
    const { data: profileData, error: profileError } = await supabase.rpc(
      'justice_funding_org_profile',
      { p_org_id: orgId }
    );
    if (profileError || !profileData) {
      return NextResponse.json({ error: profileError?.message || 'Not found' }, { status: 404 });
    }

    const profile = profileData?.justice_funding_org_profile || profileData;
    if (!profile?.organization) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    }

    // Fetch community voices
    const { data: voices } = await supabase.rpc('community_voices_for_org', { p_org_id: orgId });

    // Build context for the narrative
    const org = profile.organization;
    const funding = profile.funding;
    const interventions = profile.interventions || [];
    const outcomes = interventions.flatMap(
      (i: { outcomes: Array<{ type: string; description: string }> | null }) =>
        (i.outcomes || []).map((o: { type: string; description: string }) => `${o.type}: ${o.description}`)
    );
    const communityVoices = voices || [];

    const prompt = `You are a civic accountability analyst. Generate a concise, powerful narrative about this organisation's role in the justice system.

ORGANISATION: ${org.name}
LOCATION: ${org.city || 'QLD'}, ${org.state || 'QLD'}
INDIGENOUS-LED: ${profile.is_indigenous ? 'Yes' : 'No'}

FUNDING (13-year record):
- Total received: $${(funding.total_dollars || 0).toLocaleString()}
- Grants: ${funding.grant_count}
- Years funded: ${funding.years_funded}
- Sectors: ${(funding.by_sector || []).map((s: { sector: string; dollars: number }) => `${s.sector}: $${s.dollars?.toLocaleString()}`).join(', ')}

INTERVENTIONS (${interventions.length}):
${interventions.map((i: { name: string; type: string; evidence_level: string; portfolio_score: number }) =>
  `- ${i.name} (${i.type}, ${i.evidence_level}, score: ${(i.portfolio_score * 100).toFixed(0)}/100)`
).join('\n')}

DOCUMENTED OUTCOMES (${outcomes.length}):
${outcomes.slice(0, 10).join('\n')}

COMMUNITY VOICES (${communityVoices.length}):
${communityVoices.slice(0, 5).map((v: { what_is_needed: string; what_is_working?: string; what_is_harmful?: string }) =>
  `- Needed: ${v.what_is_needed}${v.what_is_working ? ` | Working: ${v.what_is_working}` : ''}${v.what_is_harmful ? ` | Harmful: ${v.what_is_harmful}` : ''}`
).join('\n') || '(No community voices recorded yet)'}

Generate a JSON response with:
{
  "headline": "One powerful sentence summarizing the story (max 15 words)",
  "narrative": "2-3 paragraph narrative connecting money, service delivery, outcomes, and community voice. Be specific with numbers. Highlight gaps between spending and outcomes. If Indigenous-led, note the significance. If community voices exist, weave them in. If no outcomes documented, flag this as an accountability gap.",
  "key_finding": "The single most important finding (1 sentence)",
  "accountability_score": "A/B/C/D/F rating based on: evidence of outcomes relative to funding received",
  "gaps": ["List of 2-4 specific gaps identified"],
  "questions": ["2-3 questions the community should be asking about this org's funding"]
}`;

    const raw = await callLLM(prompt, {
      jsonMode: true,
      systemPrompt: 'You are a civic data analyst. Output valid JSON only. Be factual, specific, and community-focused.',
      maxTokens: 1500,
    });

    const narrative = parseJSON<FundingNarrativeResponse>(raw);

    return NextResponse.json({
      org_id: orgId,
      org_name: org.name,
      generated_at: new Date().toISOString(),
      ...narrative,
    });
  } catch (err) {
    console.error('Narrative generation failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate narrative', detail: String(err) },
      { status: 500 }
    );
  }
}
