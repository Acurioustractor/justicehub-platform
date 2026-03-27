/**
 * Regional Discovery — Core logic for the regional discovery cron mode.
 *
 * Rotates through CONTAINED tour-stop regions daily, searching for
 * local youth justice programs, organisations, and media articles.
 *
 * Extracted from the route handler for testability.
 */

import { z } from 'zod';
import type { SearchResult } from '@/lib/scraping/web-search';

// ---------------------------------------------------------------------------
// Region definitions (6 CONTAINED tour stops)
// ---------------------------------------------------------------------------

export interface Region {
  slug: string;
  state: string;
  terms: string[];
}

export const REGIONS: Region[] = [
  { slug: 'mt-druitt', state: 'NSW', terms: ['Mt Druitt', 'Blacktown', 'Western Sydney'] },
  { slug: 'adelaide', state: 'SA', terms: ['Adelaide', 'South Australia', 'Port Augusta'] },
  { slug: 'perth', state: 'WA', terms: ['Perth', 'Banksia Hill', 'Kimberley', 'Pilbara'] },
  { slug: 'tennant-creek', state: 'NT', terms: ['Tennant Creek', 'Alice Springs', 'Central Australia'] },
  { slug: 'townsville', state: 'QLD', terms: ['Townsville', 'Cairns', 'Palm Island', 'Cape York'] },
  { slug: 'brisbane', state: 'QLD', terms: ['Brisbane', 'Logan', 'Ipswich', 'Gold Coast'] },
];

// ---------------------------------------------------------------------------
// Region rotation
// ---------------------------------------------------------------------------

/**
 * Pick today's region by rotating through the 6 tour stops.
 * Optionally pass a day number for deterministic testing.
 */
export function getTodayRegion(dayOfYear?: number): Region {
  const day = dayOfYear ?? getDayOfYear();
  return REGIONS[day % REGIONS.length];
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Search query building
// ---------------------------------------------------------------------------

/**
 * Build 3 search queries for a given region. Stays within Serper quota.
 */
export function buildRegionalSearchQueries(region: Region): string[] {
  const primary = region.terms[0];
  return [
    `${primary} youth justice programs 2025 2026`,
    `${primary} Aboriginal community programs justice`,
    `${region.state} government grants youth services ${primary}`,
  ];
}

// ---------------------------------------------------------------------------
// Zod schema for LLM extraction
// ---------------------------------------------------------------------------

export const RegionalDiscoverySchema = z.object({
  programs: z.array(
    z.object({
      name: z.string(),
      organization: z.string(),
      type: z.string(),
      description: z.string(),
      funding_source: z.string().optional(),
      amount: z.number().optional(),
      evidence_notes: z.string().optional(),
      source_url: z.string(),
    })
  ),
  organizations: z.array(
    z.object({
      name: z.string(),
      type: z.enum([
        'community_controlled',
        'community_adjacent',
        'intermediary',
        'government',
        'university',
        'peak_body',
      ]),
      is_indigenous: z.boolean(),
      city: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  media_articles: z.array(
    z.object({
      headline: z.string(),
      source: z.string(),
      url: z.string(),
      sentiment: z
        .enum(['fear_narrative', 'solutions_focused', 'neutral', 'mixed'])
        .optional(),
      organizations_mentioned: z.array(z.string()).optional(),
      programs_mentioned: z.array(z.string()).optional(),
    })
  ),
});

export type RegionalDiscoveryResult = z.infer<typeof RegionalDiscoverySchema>;

// ---------------------------------------------------------------------------
// LLM prompt
// ---------------------------------------------------------------------------

/**
 * Build the extraction prompt for the LLM given a region and raw search results.
 */
export function buildRegionalExtractionPrompt(
  region: Region,
  searchResults: SearchResult[]
): string {
  const resultsText = searchResults
    .slice(0, 10)
    .map(
      (r, i) =>
        `${i + 1}. "${r.title}" — ${r.url}\n   ${r.description || ''}`
    )
    .join('\n');

  return `You are an Australian youth justice researcher focused on ${region.terms.join(', ')} (${region.state}).

Analyze these search results and extract any youth justice programs, organisations, and media articles relevant to this region.

Search results:
${resultsText}

Extract into this JSON structure:
{
  "programs": [
    {
      "name": "Program name",
      "organization": "Operating org name",
      "type": "Program type (e.g. Diversion, Therapeutic, Community-Led, Education/Employment, Cultural, Case Management, Family Support, Advocacy, Residential, Other)",
      "description": "Brief description (1-3 sentences)",
      "funding_source": "Funding source if mentioned (optional)",
      "amount": 123456 (funding amount as number, optional),
      "evidence_notes": "Any evidence/outcomes mentioned (optional)",
      "source_url": "URL where this was found"
    }
  ],
  "organizations": [
    {
      "name": "Organisation name",
      "type": "community_controlled | community_adjacent | intermediary | government | university | peak_body",
      "is_indigenous": true/false,
      "city": "City/town (optional)",
      "description": "Brief description (optional)"
    }
  ],
  "media_articles": [
    {
      "headline": "Article headline",
      "source": "Publication name",
      "url": "Article URL",
      "sentiment": "fear_narrative | solutions_focused | neutral | mixed (optional)",
      "organizations_mentioned": ["org names"] (optional),
      "programs_mentioned": ["program names"] (optional)
    }
  ]
}

Rules:
- Only include items genuinely related to youth justice, youth services, or Aboriginal community programs in the ${region.terms[0]} / ${region.state} region.
- Skip generic directories, unrelated content, or national-level pages without regional specifics.
- For organisations, set is_indigenous=true only if clearly Aboriginal/Torres Strait Islander community-controlled or led.
- Return empty arrays if no relevant items found — do not fabricate.
- Return ONLY the JSON object, no other text.`;
}
