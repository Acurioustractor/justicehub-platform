import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * JusticeHub AI Assistant - "ALMA Chat"
 *
 * A world-class AI chatbot that knows everything about:
 * - Youth justice programs across Australia (1000+ programs)
 * - Services and support options
 * - People and organizations in the space
 * - Research, evidence, and outcomes data
 * - Historical inquiries and royal commissions
 * - International best practices
 *
 * Uses RAG (Retrieval Augmented Generation) to provide
 * accurate, data-backed responses with links.
 */

// System prompt that embodies JusticeHub's brand voice
const SYSTEM_PROMPT = `You are ALMA, the JusticeHub AI Assistant. You help users navigate Australia's most comprehensive youth justice intelligence system.

## Your Identity
- Name: ALMA (Adaptive Learning & Measurement Architecture)
- Personality: Direct, evidence-based, community-centered
- Voice: Blunt honesty, numbers over narratives, action-oriented

## Brand Voice Rules
- Be DIRECT: "Australia locks up children. Communities have the cure." not "We're working together for change"
- Use NUMBERS from the Current Database Statistics provided in context (e.g., "1000+ programs documented")
- Be ACTION-ORIENTED: "Find help now" not "Learn more"
- NEVER use charity framing or poverty tourism language
- Frame as community ownership, not charity

## Your Knowledge Base
You have access to:
- 1000+ youth justice interventions/programs across Australia
- Services directory with support options
- People profiles (advocates, practitioners, researchers)
- Organizations working in youth justice
- Research evidence and peer-reviewed studies (alma_evidence)
- Historical inquiries, royal commissions, and government reviews
- International best practices from around the world
- Media articles and news coverage

## Response Format
1. Answer the question directly with specific data
2. Provide relevant links to JusticeHub pages
3. Suggest related resources or next steps
4. If you don't know something, say so honestly

## Link Format
When suggesting resources, use this format:
- [Program Name](/intelligence/interventions/[id])
- [Person Name](/people/[slug])
- [Organization](/organizations/[slug])
- [Service](/services/[id])

## Key Statistics to Reference
- Use the real-time statistics from the "Current Database Statistics" section in context
- All 8 Australian states/territories covered
- $1.1M average cost per child per year in detention
- 24x overrepresentation of Indigenous youth
- Always cite actual numbers from the database rather than estimates

## Link Format for New Resources
- [Evidence/Research](/intelligence/evidence/[id])
- [Historical Inquiry](/youth-justice-report/inquiries)
- [International Program](/youth-justice-report/international)

Remember: You are revolutionary infrastructure, not another charity bot.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SearchResult {
  type: 'intervention' | 'service' | 'person' | 'organization' | 'evidence' | 'inquiry' | 'international';
  id: string;
  name: string;
  description?: string;
  url: string;
  relevance: number;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Escape special characters for LIKE/ILIKE queries
 */
function escapeLikePattern(term: string): string {
  return term
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Search across all JusticeHub data sources
 */
async function searchKnowledgeBase(query: string): Promise<SearchResult[]> {
  const supabase = createServiceClient();
  const results: SearchResult[] = [];

  // Sanitize and prepare search terms
  const sanitizedQuery = sanitizeInput(query, { maxLength: 500, allowNewlines: false });
  const searchTerms = sanitizedQuery
    .toLowerCase()
    .split(' ')
    .filter(t => t.length > 2 && t.length < 50) // Limit term length
    .slice(0, 10) // Limit number of terms
    .map(escapeLikePattern);

  // Return empty results if no valid search terms
  if (searchTerms.length === 0) {
    return results;
  }

  // Search interventions/programs
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, name, description, type, metadata')
    .or(searchTerms.map(t => `name.ilike.%${t}%,description.ilike.%${t}%`).join(','))
    .limit(5);

  if (interventions) {
    interventions.forEach(item => {
      results.push({
        type: 'intervention',
        id: item.id,
        name: item.name,
        description: asOptionalString(item.description)?.substring(0, 200),
        url: `/intelligence/interventions/${item.id}`,
        relevance: calculateRelevance(query, item.name, asOptionalString(item.description))
      });
    });
  }

  // Search services
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, service_type')
    .or(searchTerms.map(t => `name.ilike.%${t}%,description.ilike.%${t}%`).join(','))
    .limit(5);

  if (services) {
    services.forEach(item => {
      results.push({
        type: 'service',
        id: item.id,
        name: item.name,
        description: asOptionalString(item.description)?.substring(0, 200),
        url: `/services/${item.id}`,
        relevance: calculateRelevance(query, item.name, asOptionalString(item.description))
      });
    });
  }

  // Search people
  const { data: people } = await supabase
    .from('public_profiles')
    .select('id, slug, full_name, bio, role_tags')
    .or(searchTerms.map(t => `full_name.ilike.%${t}%,bio.ilike.%${t}%`).join(','))
    .limit(5);

  if (people) {
    people.forEach(item => {
      results.push({
        type: 'person',
        id: item.id,
        name: item.full_name,
        description: asOptionalString(item.bio)?.substring(0, 200),
        url: `/people/${item.slug}`,
        relevance: calculateRelevance(query, item.full_name, asOptionalString(item.bio))
      });
    });
  }

  // Search organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, slug, name, description')
    .or(searchTerms.map(t => `name.ilike.%${t}%,description.ilike.%${t}%`).join(','))
    .limit(5);

  if (orgs) {
    orgs.forEach(item => {
      results.push({
        type: 'organization',
        id: item.id,
        name: item.name,
        description: asOptionalString(item.description)?.substring(0, 200),
        url: `/organizations/${item.slug}`,
        relevance: calculateRelevance(query, item.name, asOptionalString(item.description))
      });
    });
  }

  // Search alma_evidence (research papers and studies)
  const { data: evidence } = await supabase
    .from('alma_evidence')
    .select('id, title, findings, source_url')
    .or(searchTerms.map(t => `title.ilike.%${t}%,findings.ilike.%${t}%`).join(','))
    .limit(5);

  if (evidence) {
    evidence.forEach(item => {
      results.push({
        type: 'evidence',
        id: item.id,
        name: item.title,
        description: asOptionalString(item.findings)?.substring(0, 200),
        url: `/intelligence/evidence/${item.id}`,
        relevance: calculateRelevance(query, item.title, asOptionalString(item.findings))
      });
    });
  }

  // Search historical_inquiries
  const { data: inquiries } = await supabase
    .from('historical_inquiries')
    .select('id, title, summary, jurisdiction, year_published')
    .or(searchTerms.map(t => `title.ilike.%${t}%,summary.ilike.%${t}%`).join(','))
    .limit(5);

  if (inquiries) {
    inquiries.forEach(item => {
      results.push({
        type: 'inquiry',
        id: item.id,
        name: `${item.title} (${item.jurisdiction}, ${item.year_published})`,
        description: asOptionalString(item.summary)?.substring(0, 200),
        url: `/youth-justice-report/inquiries`,
        relevance: calculateRelevance(query, item.title, asOptionalString(item.summary))
      });
    });
  }

  // Search international_programs
  const { data: international } = await supabase
    .from('international_programs')
    .select('id, name, country, approach_summary')
    .or(searchTerms.map(t => `name.ilike.%${t}%,approach_summary.ilike.%${t}%,country.ilike.%${t}%`).join(','))
    .limit(5);

  if (international) {
    international.forEach(item => {
      results.push({
        type: 'international',
        id: item.id,
        name: `${item.name} (${item.country})`,
        description: asOptionalString(item.approach_summary)?.substring(0, 200),
        url: `/youth-justice-report/international`,
        relevance: calculateRelevance(query, item.name, asOptionalString(item.approach_summary))
      });
    });
  }

  // Sort by relevance and return top results
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 15);
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(query: string, name: string, description?: string | null): number {
  const q = query.toLowerCase();
  const n = name?.toLowerCase() || '';
  const d = description?.toLowerCase() || '';

  let score = 0;

  // Exact name match
  if (n.includes(q)) score += 10;

  // Word matches in name
  q.split(' ').forEach(word => {
    if (word.length > 2 && n.includes(word)) score += 3;
  });

  // Word matches in description
  q.split(' ').forEach(word => {
    if (word.length > 2 && d.includes(word)) score += 1;
  });

  return score;
}

/**
 * Get current statistics from the database
 */
async function getStats() {
  const supabase = createServiceClient();

  const [
    { count: totalInterventions },
    { count: withOutcomes },
    { count: services },
    { count: people },
    { count: orgs },
    { count: evidence },
    { count: inquiries },
    { count: international }
  ] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).not('evidence_level', 'is', null),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('public_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('historical_inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('international_programs').select('*', { count: 'exact', head: true })
  ]);

  return {
    interventions: totalInterventions || 0,
    withOutcomes: withOutcomes || 0,
    outcomesRate: totalInterventions ? Math.round(((withOutcomes || 0) / totalInterventions) * 100) : 0,
    services: services || 0,
    people: people || 0,
    organizations: orgs || 0,
    evidence: evidence || 0,
    inquiries: inquiries || 0,
    international: international || 0
  };
}

/**
 * Build context from search results for the AI
 */
function buildContext(results: SearchResult[], stats: any): string {
  let context = `## Current Database Statistics
- ${stats.interventions} youth justice programs documented
- ${stats.withOutcomes} programs (${stats.outcomesRate}%) have evidence-level data
- ${stats.services} services in directory
- ${stats.people} people profiles
- ${stats.organizations} organizations
- ${stats.evidence} research papers and studies
- ${stats.inquiries} historical inquiries and royal commissions
- ${stats.international} international best practices

`;

  if (results.length > 0) {
    context += `## Relevant Resources Found\n`;
    results.forEach(r => {
      const typeLabel = {
        intervention: 'Program',
        service: 'Service',
        person: 'Person',
        organization: 'Organization',
        evidence: 'Research',
        inquiry: 'Inquiry/Commission',
        international: 'International Practice'
      }[r.type] || r.type;
      context += `- **${r.name}** (${typeLabel}): ${r.description || 'No description'}\n  Link: ${r.url}\n`;
    });
  }

  return context;
}

/**
 * Generate AI response using available providers
 */
async function generateResponse(
  messages: ChatMessage[],
  context: string
): Promise<string> {
  // Try providers in order of preference
  const providers = [
    { name: 'groq', fn: generateWithGroq },
    { name: 'gemini', fn: generateWithGemini },
    { name: 'anthropic', fn: generateWithAnthropic }
  ];

  for (const provider of providers) {
    try {
      const response = await provider.fn(messages, context);
      if (response) return response;
    } catch (error) {
      // Provider failed, trying next
    }
  }

  // Fallback response if all providers fail
  return `I apologize, but I'm having trouble connecting to my knowledge base right now.

Here are some quick links to help you:
- [Browse all programs](/intelligence/interventions)
- [Find services](/services)
- [Explore the data](/intelligence)

Please try again in a moment, or explore these resources directly.`;
}

async function generateWithGroq(messages: ChatMessage[], context: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('No Groq API key');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

async function generateWithGemini(messages: ChatMessage[], context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key');

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Add system context to first message
  if (contents.length > 0) {
    contents[0].parts[0].text = `${SYSTEM_PROMPT}\n\n${context}\n\nUser: ${contents[0].parts[0].text}`;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

async function generateWithAnthropic(messages: ChatMessage[], context: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No Anthropic API key');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + '\n\n' + context,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, query } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array required' },
        { status: 400 }
      );
    }

    // Validate messages array length
    if (messages.length > 50) {
      return NextResponse.json(
        { error: 'Too many messages' },
        { status: 400 }
      );
    }

    // Validate and sanitize each message
    const validatedMessages: ChatMessage[] = messages
      .filter((m: any) =>
        m &&
        typeof m === 'object' &&
        ['user', 'assistant', 'system'].includes(m.role) &&
        typeof m.content === 'string'
      )
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: sanitizeInput(m.content, { maxLength: 4000 })
      }));

    if (validatedMessages.length === 0) {
      return NextResponse.json(
        { error: 'No valid messages provided' },
        { status: 400 }
      );
    }

    // Get the latest user message for searching
    const latestUserMessage = validatedMessages
      .filter((m: ChatMessage) => m.role === 'user')
      .pop()?.content || (query ? sanitizeInput(String(query), { maxLength: 500 }) : '');

    // Search knowledge base and get stats in parallel
    const [searchResults, stats] = await Promise.all([
      searchKnowledgeBase(latestUserMessage),
      getStats()
    ]);

    // Build context from search results
    const context = buildContext(searchResults, stats);

    // Generate AI response with validated messages
    const response = await generateResponse(validatedMessages, context);

    return NextResponse.json({
      response,
      sources: searchResults.slice(0, 5), // Include top sources for display
      stats
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  const stats = await getStats();
  return NextResponse.json({
    status: 'ok',
    name: 'ALMA Chat',
    description: 'JusticeHub AI Assistant',
    stats
  });
}
