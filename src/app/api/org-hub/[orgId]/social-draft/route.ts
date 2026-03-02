import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    const body = await request.json();
    const { sourceType, sourceId, tone } = body;

    // Fetch org name
    const { data: org } = await supabase
      .from('organizations')
      .select('name, description')
      .eq('id', orgId)
      .single();

    const sb = supabase as any;
    let sourceData = '';

    if (sourceType === 'session') {
      const { data: session } = await sb
        .from('org_sessions')
        .select('*')
        .eq('id', sourceId)
        .single();
      if (session) {
        sourceData = `Session: ${session.program_name} (${session.session_type})
Date: ${session.session_date}
Location: ${session.location || 'N/A'}
Participants: ${session.participant_count}
Elder present: ${session.elder_present ? 'Yes' : 'No'}
Duration: ${session.duration_hours || 'N/A'} hours
Outcome: ${session.outcome_summary || 'N/A'}`;
      }
    } else if (sourceType === 'milestone') {
      const { data: milestone } = await sb
        .from('org_milestones')
        .select('*')
        .eq('id', sourceId)
        .single();
      if (milestone) {
        sourceData = `Milestone: ${milestone.milestone_type}
Date: ${milestone.milestone_date}
Description: ${milestone.description}
Evidence: ${milestone.evidence || 'N/A'}`;
      }
    } else if (sourceType === 'story') {
      const { data: story } = await supabase
        .from('articles')
        .select('title, excerpt, content')
        .eq('id', sourceId)
        .single();
      if (story) {
        sourceData = `Story: ${story.title}
Excerpt: ${story.excerpt || ''}
Content: ${(story.content || '').substring(0, 500)}`;
      }
    } else if (sourceType === 'custom') {
      sourceData = body.customContent || '';
    }

    if (!sourceData) {
      return NextResponse.json({ error: 'No source data found' }, { status: 400 });
    }

    const toneGuide = tone === 'formal' ? 'professional and formal' :
      tone === 'youth' ? 'energetic and youth-friendly with slang' :
      'warm, authentic, and community-focused';

    const prompt = `You are a social media content creator for ${org?.name || 'a grassroots Indigenous community organisation'} in Australia.

Organisation: ${org?.name}
${org?.description ? `About: ${org.description}` : ''}

SOURCE MATERIAL:
${sourceData}

Create 3 social media post variants:

1. **Instagram** — Visual storytelling, 2-3 paragraphs, relevant hashtags. Tone: ${toneGuide}
2. **Facebook** — Community update style, slightly longer. Include a call to action.
3. **WhatsApp** — Short, personal message suitable for community group. Emoji-friendly.

Guidelines:
- Never identify individual participants by name
- Celebrate community achievement without being patronising
- Use strengths-based language
- Include relevant hashtags for Instagram only
- Keep WhatsApp under 100 words`;

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const draft = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ success: true, draft, sourceType });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
