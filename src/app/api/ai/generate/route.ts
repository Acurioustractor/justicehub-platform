/**
 * AI Content Generation API
 *
 * Generates content using ACT's fine-tuned Mistral model (or Claude as fallback)
 * Supports multiple content types: blog, social, email, etc.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      type = 'blog_article',
      project = 'justicehub',
      maxTokens = 500,
      temperature = 0.7
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build context-aware prompt based on type and project
    const systemPrompt = getSystemPrompt(project, type);
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    // Try self-hosted Mistral first (free, unlimited)
    let content = '';
    let model = 'act-mistral';

    try {
      const ollamaResponse = await fetch('http://192.168.0.34:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'act-mistral',
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
      });

      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        content = data.response;
      } else {
        throw new Error('Ollama unavailable');
      }
    } catch (ollamaError) {
      // Fallback to Mistral via Hugging Face (cheap, managed)
      console.log('Ollama unavailable, falling back to Hugging Face...');

      const hfResponse = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              temperature,
              max_new_tokens: maxTokens,
              return_full_text: false,
            },
          }),
        }
      );

      if (!hfResponse.ok) {
        throw new Error('Hugging Face API failed');
      }

      const hfData = await hfResponse.json();
      content = hfData[0]?.generated_text || hfData.generated_text || '';
      model = 'mistral-7b-hf';
    }

    return NextResponse.json({
      content,
      model,
      type,
      project,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * Get system prompt based on project and content type
 */
function getSystemPrompt(project: string, type: string): string {
  const basePrompt = `You are a content writer for A Curious Tractor, a regenerative innovation ecosystem partnering with marginalized communities. Your voice is grounded yet visionary, humble yet confident, warm yet challenging, and poetic yet clear. You use farm metaphors thoughtfully and center community voices.`;

  const projectContext = {
    justicehub: `You're writing for JusticeHub, which supports youth in the justice system through culturally safe services, storytelling, and community programs. Focus on hope, dignity, and community-led solutions.`,
    'empathy-ledger': `You're writing for Empathy Ledger, a storytelling platform that honors community ownership and OCAP® principles. Emphasize consent, data sovereignty, and authentic voices.`,
    'act-farm': `You're writing for ACT Farm, showcasing regenerative agriculture, artist residencies, and conservation. Use farm metaphors naturally and connect to land stewardship.`,
    'the-harvest': `You're writing for The Harvest, a community garden and therapeutic agriculture space. Focus on healing, heritage, and hands-on connection to nature.`,
  };

  const typeGuidance = {
    blog_article: `Write a blog article that starts with a specific community story or example, then explores broader themes. Keep it conversational but thoughtful.`,
    social_media: `Write concise, engaging social media copy. Lead with impact, invite action, stay authentic.`,
    email_campaign: `Write a warm, personal email that respects the reader's time. Clear call-to-action, genuine tone.`,
    grant_proposal: `Write formally but authentically. Focus on community outcomes, measurable impact, and sustainability.`,
  };

  return `${basePrompt}\n\n${projectContext[project as keyof typeof projectContext] || projectContext.justicehub}\n\n${typeGuidance[type as keyof typeof typeGuidance] || typeGuidance.blog_article}`;
}
