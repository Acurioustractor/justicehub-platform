import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput, containsXssPatterns } from '@/lib/security';

/**
 * ALMA Bot Chat API
 *
 * POST /api/bot/chat - Send a message and get a response
 *
 * This is the main conversational interface for JusticeHub,
 * powered by ALMA's knowledge base and research capabilities.
 */

// Intent types for routing
type Intent =
  | 'what_works'
  | 'cost_comparison'
  | 'find_intervention'
  | 'explain_alma'
  | 'get_evidence'
  | 'find_service'
  | 'system_stats'
  | 'story_search'
  | 'greeting'
  | 'thanks'
  | 'boundary_individual'
  | 'boundary_legal'
  | 'boundary_prediction'
  | 'unknown';

interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    jurisdiction?: string;
    recentTopics?: string[];
  };
}

interface Card {
  title: string;
  subtitle?: string;
  badge?: string;
  link?: string;
}

interface ChatResponse {
  message: string;
  cards?: Card[];
  followUps?: string[];
  sources?: { title: string; url: string; type: string }[];
  conversationId: string;
  intent?: Intent;
}

// Boundary responses for sacred limits
const BOUNDARY_RESPONSES: Record<string, ChatResponse> = {
  boundary_individual: {
    message: `I can't provide advice about individual cases. ALMA watches systems, not people.

I can help you find:
• Local youth legal services
• Diversion programs in your area
• Support services for families

Would you like me to search for services?`,
    followUps: [
      'Find youth legal services',
      'Show me diversion programs',
      'What support is available for families?',
    ],
    conversationId: '',
  },
  boundary_prediction: {
    message: `I understand you're trying to help, but I can't predict individual behavior - and I'm designed not to.

Here's why prediction systems can be harmful:
• They entrench existing biases
• They label young people unfairly
• They miss the context that matters most

What I CAN help with:
• What research shows reduces reoffending overall
• Programs with strong evidence in your area
• Support services for young people and families`,
    followUps: [
      'What reduces reoffending?',
      'Show me evidence-based programs',
      'Find local support services',
    ],
    conversationId: '',
  },
  boundary_legal: {
    message: `I can't provide legal advice, but I can help you find legal support.

Youth legal services can help with:
• Understanding charges and processes
• Court representation
• Diversion options
• Appeals and reviews

Would you like me to find youth legal services in your area?`,
    followUps: [
      'Find youth legal services',
      'What is diversion?',
      'How does youth court work?',
    ],
    conversationId: '',
  },
};

// Static responses for common intents
const STATIC_RESPONSES: Record<string, Partial<ChatResponse>> = {
  greeting: {
    message: `G'day! I'm ALMA - your guide to Australia's youth justice evidence.

**ALMA** means "soul" in Spanish, and stands for **A**uthentic **L**earning for **M**eaningful **A**ccountability.

I can help you:
• Find what works in youth justice
• Compare detention vs community costs
• Explore evidence-based interventions
• Understand the data

What would you like to know?`,
    followUps: [
      'What works for reducing youth crime?',
      'How much does detention cost?',
      'Show me community programs',
    ],
  },
  thanks: {
    message: `You're welcome! Is there anything else I can help you with?`,
    followUps: [
      'Find more programs',
      'Show me the evidence',
      "That's all, thanks",
    ],
  },
  explain_alma: {
    message: `**ALMA** = **A**uthentic **L**earning for **M**eaningful **A**ccountability

The name also comes from the Spanish/Latin word "alma" meaning "soul" - because true impact measurement must capture the human spirit, not just statistics.

**What ALMA does:**
1. **SEES** - Observes patterns in youth justice systems
2. **CONNECTS** - Links evidence to interventions
3. **TRANSLATES** - Makes research accessible

**What ALMA never does:**
• Profiles individuals
• Predicts behavior
• Ranks communities
• Extracts knowledge without consent

ALMA sharpens perception. Humans make decisions.`,
    followUps: [
      'How does the research work?',
      'What evidence do you have?',
      'Show me the data',
    ],
  },
};

/**
 * Simple intent classification based on keywords
 * In production, this would use an LLM for better accuracy
 */
function classifyIntent(message: string): Intent {
  const lower = message.toLowerCase();

  // Boundary checks first (most important)
  if (
    lower.includes('should this person') ||
    lower.includes('what should happen to') ||
    lower.includes('individual case') ||
    lower.includes('specific person')
  ) {
    return 'boundary_individual';
  }

  if (
    lower.includes('will they reoffend') ||
    lower.includes('predict') ||
    lower.includes('likely to') ||
    lower.includes('risk score')
  ) {
    return 'boundary_prediction';
  }

  if (
    lower.includes('legal advice') ||
    lower.includes('is this legal') ||
    lower.includes('sue') ||
    lower.includes('lawyer')
  ) {
    return 'boundary_legal';
  }

  // Greeting
  if (
    lower.match(/^(hi|hello|hey|g'day|gday|howdy|good morning|good afternoon)/)
  ) {
    return 'greeting';
  }

  // Thanks
  if (lower.match(/^(thanks|thank you|cheers|ta)/)) {
    return 'thanks';
  }

  // Explain ALMA
  if (
    lower.includes('what is alma') ||
    lower.includes('what does alma') ||
    lower.includes('explain alma') ||
    lower.includes('about alma')
  ) {
    return 'explain_alma';
  }

  // Cost comparison
  if (
    lower.includes('cost') ||
    lower.includes('how much') ||
    lower.includes('expensive') ||
    lower.includes('detention vs community') ||
    lower.includes('save money')
  ) {
    return 'cost_comparison';
  }

  // What works
  if (
    lower.includes('what works') ||
    lower.includes('effective') ||
    lower.includes('reduce') ||
    lower.includes('best') ||
    lower.includes('evidence for')
  ) {
    return 'what_works';
  }

  // Find intervention
  if (
    lower.includes('show me') ||
    lower.includes('find') ||
    lower.includes('search') ||
    lower.includes('programs in') ||
    lower.includes('interventions')
  ) {
    return 'find_intervention';
  }

  // Find service
  if (
    lower.includes('service') ||
    lower.includes('support') ||
    lower.includes('help for') ||
    lower.includes('near me')
  ) {
    return 'find_service';
  }

  // Evidence
  if (
    lower.includes('evidence') ||
    lower.includes('research') ||
    lower.includes('study') ||
    lower.includes('data')
  ) {
    return 'get_evidence';
  }

  // Stats
  if (
    lower.includes('stats') ||
    lower.includes('statistics') ||
    lower.includes('numbers') ||
    lower.includes('how many')
  ) {
    return 'system_stats';
  }

  return 'unknown';
}

/**
 * Extract jurisdiction from message
 */
function extractJurisdiction(message: string): string | null {
  const lower = message.toLowerCase();
  const jurisdictions: Record<string, string[]> = {
    NT: ['nt', 'northern territory', 'darwin', 'alice springs'],
    QLD: ['qld', 'queensland', 'brisbane', 'cairns', 'townsville'],
    NSW: ['nsw', 'new south wales', 'sydney', 'newcastle'],
    VIC: ['vic', 'victoria', 'melbourne', 'geelong'],
    WA: ['wa', 'western australia', 'perth', 'broome'],
    SA: ['sa', 'south australia', 'adelaide'],
    TAS: ['tas', 'tasmania', 'hobart'],
    ACT: ['act', 'canberra', 'australian capital'],
  };

  for (const [code, terms] of Object.entries(jurisdictions)) {
    if (terms.some((term) => lower.includes(term))) {
      return code;
    }
  }
  return null;
}

/**
 * Handle cost comparison intent
 */
async function handleCostComparison(): Promise<Partial<ChatResponse>> {
  const detentionCostPerDay = 3320;
  const communityCostPerDay = 150;
  const daysPerYear = 365;

  const detentionAnnual = detentionCostPerDay * daysPerYear;
  const communityAnnual = communityCostPerDay * daysPerYear;
  const saving = detentionAnnual - communityAnnual;

  return {
    message: `**Youth Justice Cost Comparison**

**Daily Costs:**
🔴 Detention: **$${detentionCostPerDay.toLocaleString()}/day**
🟢 Community: **$${communityCostPerDay.toLocaleString()}/day**

**Annual Costs (per young person):**
🔴 Detention: **$${detentionAnnual.toLocaleString()}**
🟢 Community: **$${communityAnnual.toLocaleString()}**

**Potential saving per diversion: $${saving.toLocaleString()}**

This doesn't include the human cost - detention has **84.5% recidivism** vs **20-40%** for community programs.

Every young person diverted from detention to community saves approximately **$${saving.toLocaleString()}** per year.`,
    cards: [
      {
        title: 'Impact Calculator',
        subtitle: 'Explore detailed cost comparisons',
        link: '/intelligence/impact-calculator',
      },
    ],
    followUps: [
      'What programs cost $150/day?',
      'Show me the recidivism data',
      'Why is detention so expensive?',
    ],
  };
}

/**
 * Handle what works / research intent
 */
async function handleWhatWorks(
  supabase: any,
  message: string,
  jurisdiction: string | null
): Promise<Partial<ChatResponse>> {
  // Use the existing research API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/intelligence/research`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          depth: 'quick',
          maxConsentLevel: 'Public Knowledge Commons',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Research API error');
    }

    const result = await response.json();

    if (result.status === 'complete' && result.results) {
      const interventions = result.results.interventions || [];
      const summary = result.results.summary || '';

      if (interventions.length === 0) {
        return {
          message: `I searched the ALMA knowledge base but didn't find specific interventions matching your query.

This could mean:
• The search terms were too specific
• We don't have data for this area yet
• Try broader terms

Would you like to browse all interventions or try a different search?`,
          followUps: [
            'Show all interventions',
            'What works for Indigenous youth?',
            'Show me diversion programs',
          ],
        };
      }

      const topThree = interventions.slice(0, 3);

      return {
        message: `I found **${interventions.length} relevant interventions**.

${summary}

**Top matches:**
${topThree.map((i: any, idx: number) => `${idx + 1}. **${i.name}** - ${i.type} (${i.geography})\n   Evidence: ${i.evidenceLevel || 'Unknown'}`).join('\n\n')}`,
        cards: topThree.map((i: any) => ({
          title: i.name,
          subtitle: `${i.type} • ${i.geography}`,
          badge: i.evidenceLevel,
          link: `/intelligence/interventions/${i.id}`,
        })),
        followUps: [
          `Tell me more about ${topThree[0]?.name}`,
          'What are the evidence gaps?',
          'Compare these interventions',
        ],
      };
    }
  } catch (error) {
    console.error('Research API error:', error);
  }

  // Fallback response
  return {
    message: `I'm having trouble accessing the research system right now.

In the meantime, you can:
• Browse interventions directly
• Use the Research Agent page
• Explore the Impact Calculator`,
    cards: [
      {
        title: 'Research Agent',
        subtitle: 'AI-powered research interface',
        link: '/intelligence/research',
      },
      {
        title: 'Browse Interventions',
        subtitle: 'Explore all programs',
        link: '/intelligence/interventions',
      },
    ],
    followUps: [
      'How much does detention cost?',
      'What is ALMA?',
      'Show me the dashboard',
    ],
  };
}

/**
 * Handle find intervention intent
 */
async function handleFindIntervention(
  supabase: any,
  jurisdiction: string | null
): Promise<Partial<ChatResponse>> {
  let query = supabase
    .from('alma_interventions')
    .select('id, name, type, geography, evidence_level')
    .limit(5);

  if (jurisdiction) {
    query = query.or(`geography.ilike.%${jurisdiction}%,geography.eq.National`);
  }

  const { data: interventions, error } = await query;

  if (error || !interventions?.length) {
    return {
      message: `I couldn't find interventions${jurisdiction ? ` in ${jurisdiction}` : ''}. Let me show you what's available.`,
      cards: [
        {
          title: 'Browse All Interventions',
          subtitle: 'Explore the full database',
          link: '/intelligence/interventions',
        },
      ],
      followUps: [
        'Show me national programs',
        'What works for diversion?',
        'Show me Indigenous-led programs',
      ],
    };
  }

  return {
    message: `Here are ${interventions.length} interventions${jurisdiction ? ` in ${jurisdiction}` : ''}:`,
    cards: interventions.map((i: any) => ({
      title: i.name,
      subtitle: `${i.type} • ${i.geography}`,
      badge: i.evidence_level,
      link: `/intelligence/interventions/${i.id}`,
    })),
    followUps: [
      'Tell me more about the first one',
      'Show me the evidence',
      'Find more programs',
    ],
  };
}

/**
 * Handle system stats intent
 */
async function handleSystemStats(supabase: any): Promise<Partial<ChatResponse>> {
  // Get counts from database
  const [interventionsResult, evidenceResult, outcomesResult] =
    await Promise.all([
      supabase.from('alma_interventions').select('id', { count: 'exact', head: true }),
      supabase.from('alma_evidence').select('id', { count: 'exact', head: true }),
      supabase.from('alma_outcomes').select('id', { count: 'exact', head: true }),
    ]);

  const interventions = interventionsResult.count || 0;
  const evidence = evidenceResult.count || 0;
  const outcomes = outcomesResult.count || 0;

  return {
    message: `**ALMA Knowledge Base Statistics**

📊 **Current Data:**
• **${interventions}** interventions catalogued
• **${evidence}** evidence items linked
• **${outcomes}** outcomes measured

🎯 **Key Findings:**
• Detention costs **$3,320/day** vs Community **$150/day**
• Detention recidivism: **84.5%**
• Community recidivism: **20-40%**
• Indigenous overrepresentation: **24x**

💰 **The Opportunity:**
Every diversion saves **$570,000/year** and reduces reoffending by **50%+**.`,
    cards: [
      {
        title: 'ALMA Dashboard',
        subtitle: 'View full statistics',
        link: '/intelligence/dashboard',
      },
    ],
    followUps: [
      'Show me the interventions',
      'Why is detention so expensive?',
      'What works to reduce recidivism?',
    ],
  };
}

/**
 * Handle unknown intent
 */
function handleUnknown(message: string): Partial<ChatResponse> {
  return {
    message: `I'm not sure I understood that. I can help you with:

• **What works** - Evidence-based interventions
• **Costs** - Detention vs community comparison
• **Programs** - Find specific interventions
• **Evidence** - Research and data
• **Services** - Local support services

Could you rephrase your question, or choose one of the topics above?`,
    followUps: [
      'What works for reducing youth crime?',
      'How much does detention cost?',
      'What is ALMA?',
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message: rawMessage, conversationId } = body;

    if (!rawMessage || typeof rawMessage !== 'string' || rawMessage.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Sanitize message input (limit length, strip dangerous patterns)
    const message = sanitizeInput(rawMessage, { maxLength: 2000 });

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Log potential XSS attempts for security monitoring
    if (containsXssPatterns(rawMessage)) {
      console.warn('Potential XSS attempt in bot chat');
    }

    const supabase = await createClient();
    const newConversationId = conversationId || crypto.randomUUID();

    // Classify intent
    const intent = classifyIntent(message);
    const jurisdiction = extractJurisdiction(message);

    // Check for boundary intents first
    if (intent.startsWith('boundary_')) {
      const response = {
        ...BOUNDARY_RESPONSES[intent],
        conversationId: newConversationId,
        intent,
      };
      return NextResponse.json(response);
    }

    // Check for static responses
    if (STATIC_RESPONSES[intent]) {
      const response: ChatResponse = {
        ...STATIC_RESPONSES[intent],
        conversationId: newConversationId,
        intent,
        message: STATIC_RESPONSES[intent].message || '',
      };
      return NextResponse.json(response);
    }

    // Handle dynamic intents
    let responseData: Partial<ChatResponse>;

    switch (intent) {
      case 'cost_comparison':
        responseData = await handleCostComparison();
        break;

      case 'what_works':
      case 'get_evidence':
        responseData = await handleWhatWorks(supabase, message, jurisdiction);
        break;

      case 'find_intervention':
        responseData = await handleFindIntervention(supabase, jurisdiction);
        break;

      case 'system_stats':
        responseData = await handleSystemStats(supabase);
        break;

      case 'find_service':
        responseData = {
          message: `I can help you find services. For now, please use our Service Finder:`,
          cards: [
            {
              title: 'Service Finder',
              subtitle: 'Search for local services',
              link: '/services',
            },
          ],
          followUps: [
            'What types of services are available?',
            'Show me legal services',
            'Find youth support programs',
          ],
        };
        break;

      default:
        responseData = handleUnknown(message);
    }

    const response: ChatResponse = {
      ...responseData,
      conversationId: newConversationId,
      intent,
      message: responseData.message || '',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Bot chat error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          "I'm having trouble right now. Please try again or visit the ALMA Dashboard directly.",
        cards: [
          {
            title: 'ALMA Dashboard',
            subtitle: 'Access the full system',
            link: '/intelligence/dashboard',
          },
        ],
        conversationId: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'ALMA Bot',
    version: '1.0.0',
    description: 'Conversational interface for JusticeHub youth justice intelligence',
    endpoints: {
      chat: 'POST /api/bot/chat',
    },
    intents: [
      'what_works',
      'cost_comparison',
      'find_intervention',
      'explain_alma',
      'get_evidence',
      'find_service',
      'system_stats',
      'greeting',
    ],
  });
}
