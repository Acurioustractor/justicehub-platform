/**
 * Tests for Story Linker — EL Story auto-tagging and linking agent
 *
 * TDD Phase 1: Tests define expected behavior for:
 * 1. matchRegion() — region pattern matching from text
 * 2. linkStoryToOrg() — fuzzy org name matching
 * 3. linkStoryToProgram() — fuzzy program name matching
 * 4. runStoryLinker() — end-to-end orchestration
 */

import {
  TOUR_REGIONS,
  matchRegion,
  linkStoryToOrg,
  linkStoryToProgram,
} from '@/lib/cron/story-linker';

// ---------------------------------------------------------------------------
// matchRegion tests
// ---------------------------------------------------------------------------

describe('matchRegion', () => {
  it('matches mt-druitt from "Mount Druitt" text', () => {
    expect(matchRegion('A program in Mount Druitt is helping youth')).toBe('mt-druitt');
  });

  it('matches mt-druitt from "mt druitt" text', () => {
    expect(matchRegion('Community work in mt druitt')).toBe('mt-druitt');
  });

  it('matches mt-druitt from "western sydney" text', () => {
    expect(matchRegion('Western Sydney youth services')).toBe('mt-druitt');
  });

  it('matches mt-druitt from "blacktown" text', () => {
    expect(matchRegion('Blacktown council program')).toBe('mt-druitt');
  });

  it('matches adelaide region', () => {
    expect(matchRegion('Youth justice in Adelaide')).toBe('adelaide');
  });

  it('matches adelaide from "port augusta"', () => {
    expect(matchRegion('Services in Port Augusta')).toBe('adelaide');
  });

  it('matches adelaide from "south australia"', () => {
    expect(matchRegion('South Australia government program')).toBe('adelaide');
  });

  it('matches perth region', () => {
    expect(matchRegion('Perth youth diversion')).toBe('perth');
  });

  it('matches perth from "kimberley"', () => {
    expect(matchRegion('Kimberley community services')).toBe('perth');
  });

  it('matches perth from "western australia"', () => {
    expect(matchRegion('Western Australia detention stats')).toBe('perth');
  });

  it('matches tennant-creek region', () => {
    expect(matchRegion('Tennant Creek youth program')).toBe('tennant-creek');
  });

  it('matches tennant-creek from "alice springs"', () => {
    expect(matchRegion('Alice Springs community')).toBe('tennant-creek');
  });

  it('matches tennant-creek from "central australia"', () => {
    expect(matchRegion('Central Australia outreach')).toBe('tennant-creek');
  });

  it('matches townsville region', () => {
    expect(matchRegion('Townsville youth crime')).toBe('townsville');
  });

  it('matches townsville from "palm island"', () => {
    expect(matchRegion('Palm Island community program')).toBe('townsville');
  });

  it('matches townsville from "cape york"', () => {
    expect(matchRegion('Cape York justice services')).toBe('townsville');
  });

  it('matches brisbane region', () => {
    expect(matchRegion('Brisbane youth services')).toBe('brisbane');
  });

  it('matches brisbane from "logan"', () => {
    expect(matchRegion('Logan community program')).toBe('brisbane');
  });

  it('matches brisbane from "inala"', () => {
    expect(matchRegion('Inala youth hub')).toBe('brisbane');
  });

  it('matches brisbane from "south east queensland"', () => {
    expect(matchRegion('South East Queensland services')).toBe('brisbane');
  });

  it('returns null for no region match', () => {
    expect(matchRegion('This text mentions no specific region')).toBeNull();
  });

  it('returns null for empty text', () => {
    expect(matchRegion('')).toBeNull();
  });

  it('is case insensitive', () => {
    expect(matchRegion('MOUNT DRUITT community')).toBe('mt-druitt');
    expect(matchRegion('BRISBANE youth')).toBe('brisbane');
    expect(matchRegion('tennant creek')).toBe('tennant-creek');
  });

  it('picks first matching region when multiple regions mentioned', () => {
    // TOUR_REGIONS order: mt-druitt, adelaide, perth, tennant-creek, townsville, brisbane
    const result = matchRegion('Brisbane and Adelaide youth programs');
    // Adelaide comes before Brisbane in the TOUR_REGIONS array
    expect(result).toBe('adelaide');
  });

  it('has 6 tour regions defined', () => {
    expect(TOUR_REGIONS).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// linkStoryToOrg tests
// ---------------------------------------------------------------------------

describe('linkStoryToOrg', () => {
  const orgs = [
    { id: 'org-1', name: 'Just Reinvest NSW' },
    { id: 'org-2', name: 'Maranguka Justice Reinvestment' },
    { id: 'org-3', name: 'Youth Off The Streets' },
    { id: 'org-4', name: 'Aboriginal Legal Service' },
  ];

  it('returns matching org ID for exact name match in title', () => {
    const story = { title: 'Just Reinvest NSW launches new program', full_story: null };
    const result = linkStoryToOrg(story, orgs);
    expect(result).toContain('org-1');
  });

  it('returns matching org ID for name found in full_story', () => {
    const story = {
      title: 'Community program update',
      full_story: 'The Maranguka Justice Reinvestment project in Bourke...',
    };
    const result = linkStoryToOrg(story, orgs);
    expect(result).toContain('org-2');
  });

  it('is case insensitive', () => {
    const story = { title: 'YOUTH OFF THE STREETS helps kids', full_story: null };
    const result = linkStoryToOrg(story, orgs);
    expect(result).toContain('org-3');
  });

  it('returns empty array when no org matches', () => {
    const story = { title: 'General youth justice news', full_story: 'Nothing specific mentioned.' };
    const result = linkStoryToOrg(story, orgs);
    expect(result).toEqual([]);
  });

  it('returns multiple matching org IDs', () => {
    const story = {
      title: 'Partnership announced',
      full_story: 'Just Reinvest NSW and Aboriginal Legal Service partner up.',
    };
    const result = linkStoryToOrg(story, orgs);
    expect(result).toContain('org-1');
    expect(result).toContain('org-4');
    expect(result).toHaveLength(2);
  });

  it('handles null full_story', () => {
    const story = { title: 'Aboriginal Legal Service wins case', full_story: null };
    const result = linkStoryToOrg(story, orgs);
    expect(result).toContain('org-4');
  });
});

// ---------------------------------------------------------------------------
// linkStoryToProgram tests
// ---------------------------------------------------------------------------

describe('linkStoryToProgram', () => {
  const programs = [
    { id: 'prog-1', name: 'Maranguka Justice Reinvestment' },
    { id: 'prog-2', name: 'Bourke Community Diversion' },
    { id: 'prog-3', name: 'On Country Program' },
  ];

  it('returns matching program ID for name in title', () => {
    const story = { title: 'On Country Program expands to new region', full_story: null };
    const result = linkStoryToProgram(story, programs);
    expect(result).toContain('prog-3');
  });

  it('returns matching program ID from full_story', () => {
    const story = {
      title: 'New diversion approach',
      full_story: 'The Bourke Community Diversion program has shown results...',
    };
    const result = linkStoryToProgram(story, programs);
    expect(result).toContain('prog-2');
  });

  it('returns empty array when no program matches', () => {
    const story = { title: 'General news', full_story: 'No programs mentioned' };
    const result = linkStoryToProgram(story, programs);
    expect(result).toEqual([]);
  });

  it('handles null full_story', () => {
    const story = { title: 'Maranguka Justice Reinvestment update', full_story: null };
    const result = linkStoryToProgram(story, programs);
    expect(result).toContain('prog-1');
  });
});

// ---------------------------------------------------------------------------
// runStoryLinker integration tests (mocked DB)
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

import { runStoryLinker } from '@/lib/cron/story-linker';
import { createServiceClient } from '@/lib/supabase/service';

describe('runStoryLinker', () => {
  let mockSupabase: any;

  const mockStories = [
    {
      id: 'story-1',
      title: 'Youth program in Mount Druitt transforms lives',
      full_story: 'Just Reinvest NSW has been working in the community...',
      summary: null,
      region_slug: null,
      linked_organization_ids: null,
      linked_intervention_ids: null,
    },
    {
      id: 'story-2',
      title: 'Brisbane diversion success',
      full_story: 'A Logan-based program helps kids stay out of detention...',
      summary: null,
      region_slug: null,
      linked_organization_ids: null,
      linked_intervention_ids: null,
    },
  ];

  const mockOrgs = [
    { id: 'org-1', name: 'Just Reinvest NSW' },
    { id: 'org-2', name: 'Logan Youth Services' },
  ];

  const mockInterventions = [
    { id: 'int-1', name: 'On Country Program' },
  ];

  beforeEach(() => {
    // Build a chainable mock that tracks .from() calls
    const buildChain = (resolveValue: any) => {
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.is = jest.fn().mockReturnValue(chain);
      chain.or = jest.fn().mockReturnValue(chain);
      chain.neq = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue(resolveValue);
      chain.update = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockResolvedValue({ error: null });
      return chain;
    };

    const storiesChain = buildChain({ data: mockStories, error: null });
    const orgsChain = buildChain({ data: mockOrgs, error: null });
    const interventionsChain = buildChain({ data: mockInterventions, error: null });
    const updateChain = buildChain({ error: null });

    mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'alma_stories') return storiesChain;
        if (table === 'organizations') return orgsChain;
        if (table === 'alma_interventions') return interventionsChain;
        return updateChain;
      }),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('returns stats object with processed count', async () => {
    const result = await runStoryLinker();
    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('region_tagged');
    expect(result).toHaveProperty('org_linked');
    expect(result).toHaveProperty('program_linked');
    expect(result).toHaveProperty('skipped');
  });

  it('processes stories and tags regions', async () => {
    const result = await runStoryLinker();
    expect(result.processed).toBe(2);
    expect(result.region_tagged).toBeGreaterThanOrEqual(1);
  });

  it('returns zero stats when no stories need processing', async () => {
    mockSupabase.from = jest.fn(() => {
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.is = jest.fn().mockReturnValue(chain);
      chain.or = jest.fn().mockReturnValue(chain);
      chain.neq = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue({ data: [], error: null });
      return chain;
    });

    const result = await runStoryLinker();
    expect(result.processed).toBe(0);
    expect(result.region_tagged).toBe(0);
  });
});
