/**
 * Tests for journey-map stage mapping logic
 */

import {
  STAGES,
  STAGE_KEYWORDS,
  classifyToStage,
  classifyItemsToStages,
  formatCurrency,
  type StageKey,
} from '@/app/journey-map/stage-mapper';

describe('Journey Map Stage Mapper', () => {
  describe('STAGES', () => {
    it('should define 7 journey stages', () => {
      expect(STAGES).toHaveLength(7);
    });

    it('should have required fields on each stage', () => {
      for (const stage of STAGES) {
        expect(stage).toHaveProperty('key');
        expect(stage).toHaveProperty('title');
        expect(stage).toHaveProperty('description');
        expect(typeof stage.key).toBe('string');
        expect(typeof stage.title).toBe('string');
        expect(typeof stage.description).toBe('string');
      }
    });

    it('should have unique keys', () => {
      const keys = STAGES.map(s => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe('STAGE_KEYWORDS', () => {
    it('should have keywords for all 7 stages', () => {
      expect(Object.keys(STAGE_KEYWORDS)).toHaveLength(7);
      for (const stage of STAGES) {
        expect(STAGE_KEYWORDS[stage.key]).toBeDefined();
        expect(STAGE_KEYWORDS[stage.key].length).toBeGreaterThan(0);
      }
    });
  });

  describe('classifyToStage', () => {
    it('should match child protection keywords', () => {
      expect(classifyToStage('Child Safety and Family Support Program')).toBe('child_protection');
      expect(classifyToStage('out of home care placement')).toBe('child_protection');
      expect(classifyToStage('kinship care services')).toBe('child_protection');
    });

    it('should match education keywords', () => {
      expect(classifyToStage('School Attendance Program')).toBe('education');
      expect(classifyToStage('Youth Literacy Training')).toBe('education');
    });

    it('should match first contact / diversion keywords', () => {
      expect(classifyToStage('Youth Diversion Program')).toBe('first_contact');
      expect(classifyToStage('Early Intervention Services')).toBe('first_contact');
      expect(classifyToStage('Police caution scheme')).toBe('first_contact');
    });

    it('should match bail and courts keywords', () => {
      expect(classifyToStage('Bail Support Service')).toBe('bail_courts');
      expect(classifyToStage('Legal Aid Queensland')).toBe('bail_courts');
      expect(classifyToStage('Community Justice Group sentencing')).toBe('bail_courts');
    });

    it('should match detention keywords', () => {
      expect(classifyToStage('Cleveland Youth Detention Centre')).toBe('detention');
      expect(classifyToStage('Watch House temporary custody')).toBe('detention');
    });

    it('should match post-detention keywords', () => {
      expect(classifyToStage('Reintegration and Transition Support')).toBe('post_detention');
      expect(classifyToStage('Post-release supervision program')).toBe('post_detention');
      expect(classifyToStage('Probation and parole services')).toBe('post_detention');
    });

    it('should match employment and healing keywords', () => {
      expect(classifyToStage('Employment pathways for youth')).toBe('employment_healing');
      expect(classifyToStage('Cultural healing and wellbeing')).toBe('employment_healing');
      expect(classifyToStage('Elder mentoring program')).toBe('employment_healing');
      expect(classifyToStage('NAIDOC week celebrations')).toBe('employment_healing');
    });

    it('should return null for unmatched text', () => {
      expect(classifyToStage('Random unrelated text about cooking')).toBeNull();
      expect(classifyToStage('')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(classifyToStage('CHILD PROTECTION')).toBe('child_protection');
      expect(classifyToStage('Detention')).toBe('detention');
    });
  });

  describe('classifyItemsToStages', () => {
    it('should group items by stage', () => {
      const items = [
        { id: '1', text: 'Youth Diversion Program' },
        { id: '2', text: 'Bail Support Service' },
        { id: '3', text: 'Youth Diversion Scheme' },
        { id: '4', text: 'Cooking class' },
      ];

      const result = classifyItemsToStages(items, item => item.text);

      expect(result.first_contact).toHaveLength(2);
      expect(result.bail_courts).toHaveLength(1);
      // Unmatched items go nowhere
      expect(result.child_protection).toHaveLength(0);
    });

    it('should return empty arrays for all stages when no items', () => {
      const result = classifyItemsToStages([], () => '');
      for (const stage of STAGES) {
        expect(result[stage.key]).toEqual([]);
      }
    });
  });

  describe('formatCurrency', () => {
    it('should format millions', () => {
      expect(formatCurrency(5_000_000)).toBe('$5.0M');
      expect(formatCurrency(1_500_000)).toBe('$1.5M');
    });

    it('should format thousands', () => {
      expect(formatCurrency(500_000)).toBe('$500K');
      expect(formatCurrency(50_000)).toBe('$50K');
    });

    it('should format small amounts', () => {
      expect(formatCurrency(999)).toBe('$999');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should handle null/undefined', () => {
      expect(formatCurrency(null as unknown as number)).toBe('$0');
      expect(formatCurrency(undefined as unknown as number)).toBe('$0');
    });
  });
});
