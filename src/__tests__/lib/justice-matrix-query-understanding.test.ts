/**
 * Tests for the Justice Matrix NL query-understanding engine.
 *
 * Scope of this file: the PURE, zero-IO safety floor — planQueryHeuristic +
 * CANONICAL_CATEGORIES + sanitisation guarantees. The LLM path (planQuery) is
 * not exercised here because it depends on a live provider; the contract is
 * that it degrades to exactly this heuristic on any failure.
 *
 * The properties these tests lock are the ones the build spec calls
 * non-negotiable:
 *   - every emitted category is in CANONICAL_CATEGORIES (no fabrication)
 *   - country is 'AU' or null — nothing else ever passes
 *   - the youth surface is scope-only (never seeds a category, which would
 *     starve the ALMA evidence lane)
 *   - the evidence lane gate forces a clean, evidence-eligible filter set
 *   - filters map ONLY to real /search params; year is a soft post-filter
 */

import {
  planQueryHeuristic,
  CANONICAL_CATEGORIES,
  hasNarrowingFilters,
  relaxFilters,
  type QueryPlan,
  type QueryPlanFilters,
} from '@/lib/justice-matrix/query-understanding';

describe('CANONICAL_CATEGORIES', () => {
  it('is the frozen live-corpus census vocabulary', () => {
    expect(CANONICAL_CATEGORIES).toEqual([
      'asylum',
      'refugee',
      'non-refoulement',
      'article-3',
      'immigration',
      'immigration-detention',
      'youth-justice',
      'indigenous-rights',
      'deaths-in-custody',
      'justice-reinvestment',
      'raise-the-age',
      'diversion',
      'age-of-responsibility',
    ]);
  });
});

describe('planQueryHeuristic — shape & invariants', () => {
  const surfaces: Array<'all' | 'refugee' | 'youth'> = ['all', 'refugee', 'youth'];
  const questions = [
    'What cases deal with offshore detention of asylum seekers?',
    'Show me campaigns to raise the age of criminal responsibility',
    'Is there evidence that justice reinvestment reduces incarceration in Australia?',
    'non-refoulement on the high seas',
    'deaths in custody recommendations',
    'children in immigration detention',
    'diversion programs for young people',
    'what does the corpus say about article 3',
    '',
    '   ',
    'totally unrelated gardening question',
    'cases from 2015 to 2019 about pushbacks',
  ];

  it('always produces a well-formed plan with source=heuristic', () => {
    for (const s of surfaces) {
      for (const q of questions) {
        const plan = planQueryHeuristic(q, s);
        expect(plan.source).toBe('heuristic');
        expect(['find-cases', 'find-campaigns', 'find-evidence', 'unknown']).toContain(plan.intent);
        expect(['all', 'refugee', 'youth']).toContain(plan.surface);
        expect(typeof plan.surfaceExplicit).toBe('boolean');
        // queries: at least the original (or a normalised non-empty fallback), capped at 3
        expect(plan.queries.length).toBeGreaterThanOrEqual(1);
        expect(plan.queries.length).toBeLessThanOrEqual(3);
        // dedup
        expect(new Set(plan.queries).size).toBe(plan.queries.length);
      }
    }
  });

  it('NEVER emits a category outside CANONICAL_CATEGORIES', () => {
    for (const s of surfaces) {
      for (const q of questions) {
        const { filters } = planQueryHeuristic(q, s);
        for (const c of filters.cat) {
          expect(CANONICAL_CATEGORIES).toContain(c);
        }
      }
    }
  });

  it('NEVER passes a country other than AU or null', () => {
    for (const s of surfaces) {
      for (const q of questions) {
        const { filters } = planQueryHeuristic(q, s);
        expect([null, 'AU']).toContain(filters.country);
      }
    }
  });

  it('couples intent to type', () => {
    expect(planQueryHeuristic('raise the age campaign', 'all').filters.type).not.toBe('campaign-not-real');
    expect(planQueryHeuristic('campaigns to raise the age', 'all').intent).toBe('find-campaigns');
    expect(planQueryHeuristic('campaigns to raise the age', 'all').filters.type).toBe('campaign');
    expect(planQueryHeuristic('evidence that diversion works', 'all').intent).toBe('find-evidence');
    expect(planQueryHeuristic('evidence that diversion works', 'all').filters.type).toBe('evidence');
  });
});

describe('planQueryHeuristic — surface resolution', () => {
  it('keeps the UI surface when the text does not name the other domain', () => {
    const plan = planQueryHeuristic('what cases are there', 'refugee');
    expect(plan.surface).toBe('refugee');
    expect(plan.surfaceExplicit).toBe(false);
  });

  it('flips to refugee and marks explicit when the text names asylum/refugee', () => {
    const plan = planQueryHeuristic('asylum seeker non-refoulement cases', 'all');
    expect(plan.surface).toBe('refugee');
    expect(plan.surfaceExplicit).toBe(true);
  });

  it('flips to youth and marks explicit when the text names youth justice', () => {
    const plan = planQueryHeuristic('raise the age of criminal responsibility for children', 'all');
    expect(plan.surface).toBe('youth');
    expect(plan.surfaceExplicit).toBe(true);
  });

  it('seeds refugee cats from the surface preset when none were detected', () => {
    // A refugee-surface question with no explicit category keyword still gets
    // the refugee defaultCats so the lens is honoured.
    const plan = planQueryHeuristic('what is the situation at sea', 'refugee');
    expect(plan.surface).toBe('refugee');
    expect(plan.filters.cat.length).toBeGreaterThan(0);
    expect(plan.filters.cat).toEqual(expect.arrayContaining(['refugee', 'asylum', 'non-refoulement']));
  });

  it('NEVER seeds a category for the youth surface (scope-only)', () => {
    // Youth is scope-only by design — a cat filter would drop the ALMA evidence
    // lane in /search (evidenceEligible=false). cat must stay empty here.
    const plan = planQueryHeuristic('keep kids out of the system', 'youth');
    expect(plan.surface).toBe('youth');
    expect(plan.filters.cat).toEqual([]);
    expect(plan.filters.scope).toBe('au');
  });
});

describe('planQueryHeuristic — scope inference', () => {
  it('uses the surface default scope when the surface is applied implicitly', () => {
    expect(planQueryHeuristic('any cases', 'refugee').filters.scope).toBe('global');
    expect(planQueryHeuristic('any cases', 'youth').filters.scope).toBe('au');
  });

  it('reads an explicit Australian cue into scope=au', () => {
    const plan = planQueryHeuristic('youth detention in Australia', 'all');
    expect(plan.filters.scope).toBe('au');
  });
});

describe('planQueryHeuristic — evidence lane gate', () => {
  it('forces an evidence-eligible filter set when intent is find-evidence', () => {
    const plan = planQueryHeuristic('evidence that justice reinvestment reduces detention in Australia', 'youth');
    expect(plan.intent).toBe('find-evidence');
    expect(plan.filters.type).toBe('evidence');
    // The gate must clear everything that would trip /search evidenceEligible.
    expect(plan.filters.cat).toEqual([]);
    expect(plan.filters.outcome).toBeNull();
    expect(plan.filters.strength).toBeNull();
    expect(plan.filters.region).toBeNull();
    expect(plan.filters.country).toBeNull();
    expect(plan.filters.scope).toBe('au');
  });
});

describe('planQueryHeuristic — year extraction (soft post-filter only)', () => {
  it('extracts a year range without inventing a /search param', () => {
    const plan = planQueryHeuristic('cases from 2015 to 2019 about pushbacks', 'all');
    expect(plan.filters.yearFrom).toBe(2015);
    expect(plan.filters.yearTo).toBe(2019);
  });

  it('extracts a single year as both bounds', () => {
    const plan = planQueryHeuristic('what happened in 2014', 'all');
    expect(plan.filters.yearFrom).toBe(2014);
    expect(plan.filters.yearTo).toBe(2014);
  });

  it('leaves year bounds null when no year is present', () => {
    const plan = planQueryHeuristic('offshore detention', 'all');
    expect(plan.filters.yearFrom).toBeNull();
    expect(plan.filters.yearTo).toBeNull();
  });
});

describe('planQueryHeuristic — query expansion', () => {
  it('keeps the original question as the first query', () => {
    const q = 'offshore detention of asylum seekers';
    const plan = planQueryHeuristic(q, 'all');
    expect(plan.queries[0].toLowerCase()).toContain('offshore detention');
  });

  it('falls back to a non-empty query for blank input', () => {
    const plan = planQueryHeuristic('   ', 'refugee');
    expect(plan.queries.length).toBeGreaterThanOrEqual(1);
    for (const query of plan.queries) {
      expect(query.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Relax-and-retry helpers (the fix for planner over-narrowing zeroing /ask).
// ---------------------------------------------------------------------------

const baseFilters = (over: Partial<QueryPlanFilters> = {}): QueryPlanFilters => ({
  type: 'all',
  cat: [],
  outcome: null,
  strength: null,
  region: null,
  country: null,
  scope: 'all',
  yearFrom: null,
  yearTo: null,
  ...over,
});

describe('hasNarrowingFilters', () => {
  it('is false for a clean filter set (nothing to relax)', () => {
    expect(hasNarrowingFilters(baseFilters())).toBe(false);
  });

  it('does NOT count geography/year as narrowing (those survive a relax)', () => {
    expect(hasNarrowingFilters(baseFilters({ scope: 'au', country: 'AU', type: 'case', yearFrom: 2015 }))).toBe(false);
  });

  it('is true when any of cat/outcome/strength/region is set', () => {
    expect(hasNarrowingFilters(baseFilters({ region: 'High Court of Australia' }))).toBe(true);
    expect(hasNarrowingFilters(baseFilters({ outcome: 'adverse' }))).toBe(true);
    expect(hasNarrowingFilters(baseFilters({ strength: 'high' }))).toBe(true);
    expect(hasNarrowingFilters(baseFilters({ cat: ['immigration-detention'] }))).toBe(true);
  });
});

describe('relaxFilters', () => {
  it('clears cat/outcome/strength/region but keeps type/scope/country/year', () => {
    const relaxed = relaxFilters(
      baseFilters({
        type: 'case',
        cat: ['asylum', 'refugee'],
        outcome: 'adverse',
        strength: 'high',
        region: 'High Court of Australia',
        country: 'AU',
        scope: 'au',
        yearFrom: 2004,
        yearTo: 2004,
      }),
    );
    expect(relaxed.cat).toEqual([]);
    expect(relaxed.outcome).toBeNull();
    expect(relaxed.strength).toBeNull();
    expect(relaxed.region).toBeNull();
    // geography + year survive so the retry stays in the right corpus slice
    expect(relaxed.type).toBe('case');
    expect(relaxed.scope).toBe('au');
    expect(relaxed.country).toBe('AU');
    expect(relaxed.yearFrom).toBe(2004);
    // a relaxed set has nothing left to relax
    expect(hasNarrowingFilters(relaxed)).toBe(false);
  });

  it('does not mutate the input', () => {
    const input = baseFilters({ region: 'Australia', cat: ['asylum'] });
    relaxFilters(input);
    expect(input.region).toBe('Australia');
    expect(input.cat).toEqual(['asylum']);
  });
});
