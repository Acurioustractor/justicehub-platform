import {
  getNextStatus,
  STATUS_TO_STAGE,
  STAGE_TO_STATUS,
  OUTREACH_STATUS_OPTIONS,
} from '@/lib/campaign/pipeline-stages';

describe('pipeline-stages', () => {
  describe('getNextStatus', () => {
    it('advances cold statuses to contacted (warm)', () => {
      expect(getNextStatus('not_started')).toBe('contacted');
      expect(getNextStatus('identified')).toBe('contacted');
      expect(getNextStatus('pending')).toBe('contacted');
    });

    it('advances warm statuses to proposal_sent', () => {
      expect(getNextStatus('nominated')).toBe('proposal_sent');
      expect(getNextStatus('contacted')).toBe('proposal_sent');
    });

    it('advances responded to committed (via proposal stage)', () => {
      expect(getNextStatus('responded')).toBe('committed');
    });

    it('advances proposal statuses to committed', () => {
      expect(getNextStatus('in_discussion')).toBe('committed');
      expect(getNextStatus('proposal_sent')).toBe('committed');
    });

    it('advances meeting_scheduled to active (via committed stage)', () => {
      expect(getNextStatus('meeting_scheduled')).toBe('active');
    });

    it('advances committed to active', () => {
      expect(getNextStatus('committed')).toBe('active');
    });

    it('keeps active at active (ceiling)', () => {
      expect(getNextStatus('active')).toBe('active');
      expect(getNextStatus('engaged')).toBe('active');
    });

    it('advances unknown statuses from cold to warm', () => {
      expect(getNextStatus('some_unknown_value')).toBe('contacted');
    });

    it('does not downgrade responded or meeting_scheduled', () => {
      // responded maps to proposal stage, next is committed
      const respondedNext = getNextStatus('responded');
      const respondedStage = STATUS_TO_STAGE[respondedNext];
      expect(respondedStage).toBe('committed');

      // meeting_scheduled maps to committed stage, next is active
      const meetingNext = getNextStatus('meeting_scheduled');
      const meetingStage = STATUS_TO_STAGE[meetingNext];
      expect(meetingStage).toBe('active');
    });
  });

  describe('STATUS_TO_STAGE', () => {
    it('maps all known statuses from stats API', () => {
      // These are the statuses the stats API counts
      expect(STATUS_TO_STAGE['pending']).toBe('cold');
      expect(STATUS_TO_STAGE['contacted']).toBe('warm');
      expect(STATUS_TO_STAGE['responded']).toBe('proposal');
      expect(STATUS_TO_STAGE['meeting_scheduled']).toBe('committed');
      expect(STATUS_TO_STAGE['committed']).toBe('committed');
    });

    it('maps all known statuses from pipeline API', () => {
      expect(STATUS_TO_STAGE['not_started']).toBe('cold');
      expect(STATUS_TO_STAGE['identified']).toBe('cold');
      expect(STATUS_TO_STAGE['nominated']).toBe('warm');
      expect(STATUS_TO_STAGE['in_discussion']).toBe('proposal');
      expect(STATUS_TO_STAGE['proposal_sent']).toBe('proposal');
      expect(STATUS_TO_STAGE['active']).toBe('active');
      expect(STATUS_TO_STAGE['engaged']).toBe('active');
      expect(STATUS_TO_STAGE['stale']).toBe('stale');
      expect(STATUS_TO_STAGE['declined']).toBe('stale');
    });
  });

  describe('STAGE_TO_STATUS', () => {
    it('maps every stage to a canonical status', () => {
      expect(STAGE_TO_STATUS['cold']).toBe('not_started');
      expect(STAGE_TO_STATUS['warm']).toBe('contacted');
      expect(STAGE_TO_STATUS['proposal']).toBe('proposal_sent');
      expect(STAGE_TO_STATUS['committed']).toBe('committed');
      expect(STAGE_TO_STATUS['active']).toBe('active');
      expect(STAGE_TO_STATUS['stale']).toBe('stale');
    });
  });

  describe('OUTREACH_STATUS_OPTIONS', () => {
    it('has all options with value and label', () => {
      for (const opt of OUTREACH_STATUS_OPTIONS) {
        expect(opt.value).toBeTruthy();
        expect(opt.label).toBeTruthy();
        expect(opt.stage).toBeTruthy();
      }
    });

    it('all option values are in STATUS_TO_STAGE', () => {
      for (const opt of OUTREACH_STATUS_OPTIONS) {
        expect(STATUS_TO_STAGE[opt.value]).toBeDefined();
      }
    });
  });
});
