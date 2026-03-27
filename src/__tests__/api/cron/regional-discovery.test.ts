/**
 * Tests for Regional Discovery cron mode
 *
 * Tests the core logic: region rotation, search query building,
 * LLM extraction schema validation, deduplication, and DB insertion.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Import the module under test — we extract the logic into a dedicated file
// so it can be unit-tested without Next.js request/response plumbing.
// ---------------------------------------------------------------------------
import {
  REGIONS,
  getTodayRegion,
  buildRegionalSearchQueries,
  RegionalDiscoverySchema,
  buildRegionalExtractionPrompt,
  type RegionalDiscoveryResult,
} from '@/lib/cron/regional-discovery';

// ---------------------------------------------------------------------------
// 1. Region rotation
// ---------------------------------------------------------------------------

describe('getTodayRegion', () => {
  it('returns a valid region object', () => {
    const region = getTodayRegion();
    expect(region).toHaveProperty('slug');
    expect(region).toHaveProperty('state');
    expect(region).toHaveProperty('terms');
    expect(region.terms.length).toBeGreaterThan(0);
  });

  it('rotates through all 6 regions over 6 days', () => {
    const seen = new Set<string>();
    for (let day = 0; day < 6; day++) {
      const region = getTodayRegion(day);
      seen.add(region.slug);
    }
    expect(seen.size).toBe(6);
  });

  it('wraps around after 6 days', () => {
    const day0 = getTodayRegion(0);
    const day6 = getTodayRegion(6);
    expect(day6.slug).toBe(day0.slug);
  });
});

// ---------------------------------------------------------------------------
// 2. REGIONS constant
// ---------------------------------------------------------------------------

describe('REGIONS', () => {
  it('has exactly 6 tour stops', () => {
    expect(REGIONS).toHaveLength(6);
  });

  it('each region has slug, state, and terms', () => {
    for (const r of REGIONS) {
      expect(typeof r.slug).toBe('string');
      expect(typeof r.state).toBe('string');
      expect(Array.isArray(r.terms)).toBe(true);
      expect(r.terms.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('includes all expected slugs', () => {
    const slugs = REGIONS.map((r) => r.slug);
    expect(slugs).toContain('mt-druitt');
    expect(slugs).toContain('adelaide');
    expect(slugs).toContain('perth');
    expect(slugs).toContain('tennant-creek');
    expect(slugs).toContain('townsville');
    expect(slugs).toContain('brisbane');
  });
});

// ---------------------------------------------------------------------------
// 3. Search query building
// ---------------------------------------------------------------------------

describe('buildRegionalSearchQueries', () => {
  const region = REGIONS[0]; // mt-druitt

  it('returns exactly 3 queries', () => {
    const queries = buildRegionalSearchQueries(region);
    expect(queries).toHaveLength(3);
  });

  it('includes region terms in queries', () => {
    const queries = buildRegionalSearchQueries(region);
    // At least one region term should appear in each query
    for (const q of queries) {
      const hasRegionTerm = region.terms.some((t) => q.includes(t));
      expect(hasRegionTerm).toBe(true);
    }
  });

  it('includes state in at least one query', () => {
    const queries = buildRegionalSearchQueries(region);
    const hasState = queries.some((q) => q.includes(region.state));
    expect(hasState).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Zod schema validation
// ---------------------------------------------------------------------------

describe('RegionalDiscoverySchema', () => {
  const validData = {
    programs: [
      {
        name: 'Youth Pathways Program',
        organization: 'Some Community Org',
        type: 'Diversion',
        description: 'A diversion program for at-risk youth in Western Sydney.',
        funding_source: 'NSW Government',
        amount: 500000,
        evidence_notes: 'Reduced reoffending by 30%',
        source_url: 'https://example.com/program',
      },
    ],
    organizations: [
      {
        name: 'Indigenous Youth Services',
        type: 'community_controlled' as const,
        is_indigenous: true,
        city: 'Mt Druitt',
        description: 'Provides culturally grounded services.',
      },
    ],
    media_articles: [
      {
        headline: 'New youth justice program launches in Mt Druitt',
        source: 'Sydney Morning Herald',
        url: 'https://smh.com.au/some-article',
        sentiment: 'solutions_focused' as const,
        organizations_mentioned: ['Indigenous Youth Services'],
        programs_mentioned: ['Youth Pathways Program'],
      },
    ],
  };

  it('validates correct data', () => {
    const result = RegionalDiscoverySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts empty arrays', () => {
    const result = RegionalDiscoverySchema.safeParse({
      programs: [],
      organizations: [],
      media_articles: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts programs without optional fields', () => {
    const result = RegionalDiscoverySchema.safeParse({
      programs: [
        {
          name: 'Basic Program',
          organization: 'Some Org',
          type: 'Education',
          description: 'A basic educational program.',
          source_url: 'https://example.com',
        },
      ],
      organizations: [],
      media_articles: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid organization type', () => {
    const badData = {
      ...validData,
      organizations: [
        {
          name: 'Test Org',
          type: 'invalid_type',
          is_indigenous: false,
        },
      ],
    };
    const result = RegionalDiscoverySchema.safeParse(badData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid sentiment value', () => {
    const badData = {
      ...validData,
      media_articles: [
        {
          headline: 'Test Article',
          source: 'Test Source',
          url: 'https://example.com',
          sentiment: 'very_positive', // invalid
        },
      ],
    };
    const result = RegionalDiscoverySchema.safeParse(badData);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Extraction prompt
// ---------------------------------------------------------------------------

describe('buildRegionalExtractionPrompt', () => {
  it('includes region name and search results', () => {
    const region = REGIONS[0];
    const searchResults = [
      { title: 'Test Article', url: 'https://example.com', description: 'Some description' },
    ];
    const prompt = buildRegionalExtractionPrompt(region, searchResults);

    expect(prompt).toContain(region.terms[0]);
    expect(prompt).toContain(region.state);
    expect(prompt).toContain('Test Article');
    expect(prompt).toContain('https://example.com');
  });

  it('includes JSON schema guidance', () => {
    const region = REGIONS[0];
    const prompt = buildRegionalExtractionPrompt(region, []);
    expect(prompt).toContain('programs');
    expect(prompt).toContain('organizations');
    expect(prompt).toContain('media_articles');
  });
});
