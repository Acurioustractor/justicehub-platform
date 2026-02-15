/**
 * Search Intent Detection
 *
 * Analyzes search queries to detect user intent and route
 * to appropriate data sources. This enables smart search
 * without requiring 20+ separate tools.
 */

import type { SearchIntent, JusticeSearchContext, SearchResultType } from './types';

// Intent patterns in priority order (most specific first)
// Order matters: we check in this order and return first match
const INTENT_PRIORITY: SearchIntent[] = [
  'find_person',       // Most specific - "who", "contact", explicit person queries
  'find_organization', // Specific org patterns
  'find_research',     // Research-specific keywords
  'find_media',        // Media-specific keywords
  'find_program',      // Broad - catch programs/services last
  'general',           // Fallback
];

const INTENT_PATTERNS: Record<SearchIntent, RegExp[]> = {
  find_person: [
    /who\s+(works|is)/i,
    /contact\s+for/i,
    /find\s+(person|people|staff|team)/i,
    /meet\s+the/i,
    /\bmentor\b/i,          // Word boundary to avoid matching "mentoring program"
    /\belders?\b/i,         // Singular or plural "elder"
    /storyteller/i,
  ],
  find_organization: [
    /\borgani[sz]ations?\b/i,
    /service\s+providers?/i,  // "service provider" not just "service"
    /\bngos?\b/i,             // NGO or NGOs
    /charity/i,
    /\bagenc(y|ies)\b/i,
    /department/i,
    /community\s+org/i,
  ],
  find_research: [
    /\bresearch\b/i,
    /\bevidence\b/i,
    /\bstudy\b/i,
    /\boutcome\s*(s|data)?\b/i,
    /\breport\b/i,
    /evaluation/i,
    /analysis/i,
    /statistics/i,
  ],
  find_media: [
    /\bvideos?\b/i,
    /\bphotos?\b/i,
    /\bimages?\b/i,
    /\bstory\b/i,
    /\bstories\b/i,
    /\bwatch\b/i,
    /\bmedia\b/i,
    /\bgallery\b/i,
  ],
  find_program: [
    /program/i,
    /intervention/i,
    /diversion/i,
    /\bhealing\b/i,
    /therapeutic/i,
    /treatment/i,
    /mentoring\s+program/i,
    /youth\s+service/i,      // Only "youth service", not generic "service"
    /counsell?ing/i,
  ],
  general: [], // Fallback
};

// State detection patterns
const STATE_PATTERNS: Record<string, RegExp[]> = {
  NSW: [/\bnsw\b/i, /new\s+south\s+wales/i, /sydney/i],
  VIC: [/\bvic\b/i, /victoria/i, /melbourne/i],
  QLD: [/\bqld\b/i, /queensland/i, /brisbane/i],
  WA: [/\bwa\b/i, /western\s+australia/i, /perth/i],
  SA: [/\bsa\b/i, /south\s+australia/i, /adelaide/i],
  TAS: [/\btas\b/i, /tasmania/i, /hobart/i],
  ACT: [/\bact\b/i, /canberra/i, /australian\s+capital/i],
  NT: [/\bnt\b/i, /northern\s+territory/i, /darwin/i, /alice\s+springs/i],
  National: [/\bnational\b/i, /australia-?wide/i, /all\s+states/i],
};

// Entity type keywords
const ENTITY_KEYWORDS: Record<SearchResultType, string[]> = {
  intervention: ['program', 'intervention', 'diversion', 'therapeutic'],
  service: ['service', 'support', 'help', 'assistance'],
  person: ['person', 'people', 'staff', 'team', 'contact', 'mentor', 'elder'],
  organization: ['organization', 'organisation', 'provider', 'agency', 'ngo'],
  media: ['video', 'photo', 'image', 'media', 'gallery'],
  story: ['story', 'stories', 'narrative', 'experience', 'journey'],
  research: ['research', 'study', 'evidence', 'data', 'report'],
  news: ['news', 'article', 'press', 'announcement'],
};

/**
 * Detect search intent from query
 * Uses priority order to ensure more specific intents match first
 */
export function detectIntent(query: string): SearchIntent {
  const normalizedQuery = query.toLowerCase().trim();

  // Check intents in priority order (most specific first)
  for (const intent of INTENT_PRIORITY) {
    if (intent === 'general') continue;

    const patterns = INTENT_PATTERNS[intent];
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        return intent;
      }
    }
  }

  return 'general';
}

/**
 * Detect state from query
 */
export function detectState(query: string): string | undefined {
  const normalizedQuery = query.toLowerCase();

  for (const [state, patterns] of Object.entries(STATE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        return state;
      }
    }
  }

  return undefined;
}

/**
 * Detect entity types to search
 */
export function detectEntityTypes(query: string): SearchResultType[] {
  const normalizedQuery = query.toLowerCase();
  const types: SearchResultType[] = [];

  for (const [type, keywords] of Object.entries(ENTITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword)) {
        types.push(type as SearchResultType);
        break;
      }
    }
  }

  return types.length > 0 ? types : ['intervention', 'service', 'organization', 'person'];
}

/**
 * Build search context from query analysis
 */
export function buildSearchContext(query: string): JusticeSearchContext {
  return {
    intent: detectIntent(query),
    state: detectState(query),
    entityTypes: detectEntityTypes(query),
    elderApprovedOnly: /elder\s*approved/i.test(query),
    culturalTags: extractCulturalTags(query),
  };
}

/**
 * Extract cultural tags from query
 */
function extractCulturalTags(query: string): string[] {
  const culturalKeywords = [
    'healing',
    'country',
    'culture',
    'cultural',
    'indigenous',
    'aboriginal',
    'first nations',
    'traditional',
    'ceremony',
    'dreaming',
    'songline',
    'elder',
    'community',
  ];

  const normalizedQuery = query.toLowerCase();
  return culturalKeywords.filter((keyword) => normalizedQuery.includes(keyword));
}

/**
 * Clean query by removing intent/state keywords for better matching
 */
export function cleanQuery(query: string): string {
  let cleaned = query;

  // Remove state references
  for (const patterns of Object.values(STATE_PATTERNS)) {
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
  }

  // Remove common filler words
  cleaned = cleaned
    .replace(/\b(in|at|for|the|a|an|find|search|show|get|list)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || query; // Fall back to original if over-cleaned
}
