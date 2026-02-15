import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profileData?.is_super_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { transcript, storytellerName } = await request.json();

    if (!transcript || transcript.length < 100) {
      return NextResponse.json(
        { error: 'Transcript must be at least 100 characters' },
        { status: 400 }
      );
    }

    // Use Claude to extract quotes, themes, and case studies
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are helping extract powerful quotes from a community storyteller's interview transcript for a story about justice and community expertise.

STORYTELLER: ${storytellerName}

TRANSCRIPT:
${transcript}

Please analyze this transcript and extract:

1. **15-20 Powerful Quotes** - Direct quotes that show:
   - Community expertise and knowledge
   - Systems failures or critiques
   - Specific examples and case studies
   - What's needed for change
   - Personal experience and wisdom

2. **5-7 Key Themes** - Main themes that emerge across the conversation

3. **3-5 Case Studies** - Specific stories or examples they share about:
   - Individual people (anonymize if needed as "a young person" or "a boy")
   - Situations they've handled
   - Outcomes and impact
   - What they learned

IMPORTANT: Extract quotes VERBATIM. Do not clean up or "improve" their language. Use their exact words, dialect, and speaking style.

Return ONLY valid JSON with this exact structure:

{
  "quotes": [
    {
      "text": "exact quote from transcript, word for word",
      "theme": "theme this quote relates to",
      "context": "brief context about what they're discussing",
      "strength": "why this quote is powerful (1-2 sentences)"
    }
  ],
  "themes": [
    {
      "name": "theme name",
      "description": "what this theme is about",
      "quote_examples": ["quote 1 text", "quote 2 text"]
    }
  ],
  "case_studies": [
    {
      "title": "brief descriptive title",
      "description": "what happened in this story",
      "key_points": ["point 1", "point 2", "point 3"],
      "quotes": ["relevant quote from this case study"]
    }
  ]
}

Focus on storyteller's actual words showing:
- Community expertise vs. system failures
- Specific examples over generalizations
- What works vs. what doesn't
- What's actually needed (not what people think can be funded)

Return ONLY the JSON object, no other text.`
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    let extractedData;
    try {
      // Claude sometimes wraps JSON in markdown code blocks, so clean it
      const cleanedText = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content.text);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate structure
    if (!extractedData.quotes || !Array.isArray(extractedData.quotes)) {
      throw new Error('Invalid response structure: missing quotes array');
    }

    return NextResponse.json({
      success: true,
      data: {
        quotes: extractedData.quotes || [],
        themes: extractedData.themes || [],
        case_studies: extractedData.case_studies || []
      },
      stats: {
        quotes_count: extractedData.quotes?.length || 0,
        themes_count: extractedData.themes?.length || 0,
        case_studies_count: extractedData.case_studies?.length || 0,
        transcript_length: transcript.length
      }
    });

  } catch (error: any) {
    console.error('Extract quotes error:', error.message);

    // Provide helpful error messages
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Check your Anthropic account.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to extract quotes from transcript' },
      { status: 500 }
    );
  }
}
