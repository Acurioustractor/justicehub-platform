/**
 * Intent Detector Tests
 */

// Jest test suite
import {
  detectIntent,
  detectState,
  detectEntityTypes,
  buildSearchContext,
  cleanQuery,
} from '../intent-detector';

describe('detectIntent', () => {
  it('detects program/intervention searches', () => {
    expect(detectIntent('healing programs')).toBe('find_program');
    expect(detectIntent('diversion services')).toBe('find_program');
    expect(detectIntent('therapeutic interventions')).toBe('find_program');
    expect(detectIntent('youth mentoring program')).toBe('find_program');
  });

  it('detects person searches', () => {
    expect(detectIntent('who works at Oonchiumpa')).toBe('find_person');
    expect(detectIntent('contact for programs')).toBe('find_person');
    expect(detectIntent('find mentor in NSW')).toBe('find_person');
    expect(detectIntent('meet the elders')).toBe('find_person');
  });

  it('detects organization searches', () => {
    expect(detectIntent('organizations in NSW')).toBe('find_organization');
    expect(detectIntent('service providers in QLD')).toBe('find_organization');
    expect(detectIntent('community organisations')).toBe('find_organization');
    expect(detectIntent('list all NGOs')).toBe('find_organization');
  });

  it('detects media searches', () => {
    expect(detectIntent('videos about community')).toBe('find_media');
    expect(detectIntent('photos of events')).toBe('find_media');
    expect(detectIntent('watch stories')).toBe('find_media');
    expect(detectIntent('media gallery')).toBe('find_media');
  });

  it('detects research searches', () => {
    expect(detectIntent('research on youth justice')).toBe('find_research');
    expect(detectIntent('evidence base')).toBe('find_research');
    expect(detectIntent('outcome data')).toBe('find_research');
    expect(detectIntent('evaluation report')).toBe('find_research');
  });

  it('returns general for ambiguous queries', () => {
    expect(detectIntent('justice')).toBe('general');
    expect(detectIntent('help')).toBe('general');
    expect(detectIntent('123')).toBe('general');
  });
});

describe('detectState', () => {
  it('detects Australian state abbreviations', () => {
    expect(detectState('programs in NSW')).toBe('NSW');
    expect(detectState('VIC services')).toBe('VIC');
    expect(detectState('QLD youth')).toBe('QLD');
    expect(detectState('WA healing')).toBe('WA');
    expect(detectState('SA programs')).toBe('SA');
    expect(detectState('TAS services')).toBe('TAS');
    expect(detectState('ACT youth')).toBe('ACT');
    expect(detectState('NT healing')).toBe('NT');
  });

  it('detects state names', () => {
    expect(detectState('New South Wales')).toBe('NSW');
    expect(detectState('Victoria programs')).toBe('VIC');
    expect(detectState('Queensland')).toBe('QLD');
    expect(detectState('Northern Territory')).toBe('NT');
  });

  it('detects capital cities', () => {
    expect(detectState('Sydney services')).toBe('NSW');
    expect(detectState('Melbourne programs')).toBe('VIC');
    expect(detectState('Brisbane youth')).toBe('QLD');
    expect(detectState('Darwin healing')).toBe('NT');
    expect(detectState('Alice Springs')).toBe('NT');
  });

  it('detects national scope', () => {
    expect(detectState('national programs')).toBe('National');
    expect(detectState('australia-wide')).toBe('National');
  });

  it('returns undefined for no state', () => {
    expect(detectState('healing programs')).toBeUndefined();
    expect(detectState('youth services')).toBeUndefined();
  });
});

describe('detectEntityTypes', () => {
  it('detects intervention keywords', () => {
    const types = detectEntityTypes('therapeutic program');
    expect(types).toContain('intervention');
  });

  it('detects service keywords', () => {
    const types = detectEntityTypes('support services');
    expect(types).toContain('service');
  });

  it('detects person keywords', () => {
    const types = detectEntityTypes('mentor team');
    expect(types).toContain('person');
  });

  it('detects organization keywords', () => {
    const types = detectEntityTypes('community organisation');
    expect(types).toContain('organization');
  });

  it('detects media keywords', () => {
    const types = detectEntityTypes('video gallery');
    expect(types).toContain('media');
  });

  it('returns default types for generic query', () => {
    const types = detectEntityTypes('justice');
    expect(types).toEqual(['intervention', 'service', 'organization', 'person']);
  });
});

describe('buildSearchContext', () => {
  it('builds complete context from query', () => {
    const context = buildSearchContext('healing programs in NSW');

    expect(context.intent).toBe('find_program');
    expect(context.state).toBe('NSW');
    expect(context.entityTypes).toContain('intervention');
    expect(context.culturalTags).toContain('healing');
  });

  it('detects elder approved preference', () => {
    const context = buildSearchContext('elder approved content');
    expect(context.elderApprovedOnly).toBe(true);
  });

  it('extracts cultural tags', () => {
    const context = buildSearchContext('cultural healing on country');
    expect(context.culturalTags).toContain('cultural');
    expect(context.culturalTags).toContain('healing');
    expect(context.culturalTags).toContain('country');
  });
});

describe('cleanQuery', () => {
  it('removes state references', () => {
    const cleaned = cleanQuery('programs in NSW');
    expect(cleaned).not.toContain('NSW');
    expect(cleaned).toContain('program');
  });

  it('removes filler words', () => {
    const cleaned = cleanQuery('find the best programs for youth');
    expect(cleaned).not.toContain('find');
    expect(cleaned).not.toContain('the');
    expect(cleaned).toContain('best');
    expect(cleaned).toContain('programs');
    expect(cleaned).toContain('youth');
  });

  it('handles empty result by returning original', () => {
    const cleaned = cleanQuery('in');
    // Should return something, not empty
    expect(cleaned.length).toBeGreaterThan(0);
  });
});
