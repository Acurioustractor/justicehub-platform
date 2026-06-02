import { civicScopeClient } from '@/lib/civic-scope-client';
import { empathyLedgerClient } from '@/lib/empathy-ledger-client';
import { buildEvidenceExport } from '@/lib/evidence-export';
import { createTask } from '@/lib/reflex';
import { resetResilientFetch } from '@/lib/clients/http-resilient';

describe('sibling-product SDK clients — smoke', () => {
  beforeEach(() => {
    resetResilientFetch();
    delete process.env.CIVIC_SCOPE_API_URL;
    delete process.env.CIVIC_SCOPE_API_KEY;
    delete process.env.EMPATHY_LEDGER_ACCOUNTABILITY_URL;
    delete process.env.EMPATHY_LEDGER_URL;
    delete process.env.EL_ACCOUNTABILITY_TOKEN;
    delete process.env.EMPATHY_LEDGER_SERVICE_KEY;
  });

  it('civicScopeClient returns stub data when no env configured', async () => {
    const opportunities = await civicScopeClient.getOpportunitiesForOrg('12345678901');
    expect(Array.isArray(opportunities)).toBe(true);
    expect(opportunities[0]?.source).toBe('stub');

    const funding = await civicScopeClient.getFundingForLGA('NSW001');
    expect(funding.source).toBe('stub');

    const entity = await civicScopeClient.getEntityProfile('12345678901');
    expect(entity.source).toBe('stub');
  });

  it('empathyLedgerClient degrades gracefully when no env configured', async () => {
    const event = await empathyLedgerClient.logEvent({
      product: 'justicehub-atlas',
      eventType: 'export_generated',
      actorId: 'ben@act.au',
    });
    expect(event.ok).toBe(false);
    expect(event.degraded).toBe(true);

    const consent = await empathyLedgerClient.verifyConsent('token-x');
    expect(consent.consentGranted).toBe(false); // fail closed
    expect(consent.degraded).toBe(true);

    const aiRun = await empathyLedgerClient.logAiRun({
      product: 'justicehub-atlas',
      runId: 'r1',
      model: 'claude-opus-4-7',
      promptHash: 'abc',
      startedAt: new Date().toISOString(),
    });
    expect(aiRun.degraded).toBe(true);
  });

  it('buildEvidenceExport produces a manifest + JSON bytes even when stubs are in play', async () => {
    const loop = createTask({
      source: 'practice',
      title: 'Mental health referral — Boorloo (Perth)',
      organizationId: 'walumarra',
      priority: 'high',
    });

    const result = await buildEvidenceExport({
      organizationId: 'walumarra',
      organizationName: 'Walumarra',
      organizationAbn: '53658668627',
      funderName: 'Snow Foundation',
      programCategory: 'youth-justice',
      cases: [loop],
      outcomes: [
        {
          caseId: loop.task.id,
          label: 'Referral accepted',
          recordedAt: new Date().toISOString(),
        },
      ],
      storyConsentTokens: ['token-1', 'token-2'],
      almaInterventions: [
        {
          id: 'alma-1',
          name: 'Olabud Doogethu',
          evidenceLevel: 'Promising',
          culturalAuthority: 'Yamatji Marlpa Aboriginal Corporation',
          targetCohort: '10-17',
          summary: 'Justice reinvestment in Halls Creek.',
        },
      ],
      coverNote: 'Bundle for Snow Foundation reporting.',
    });

    expect(result.manifest.caseCount).toBe(1);
    expect(result.manifest.outcomeCount).toBe(1);
    expect(result.manifest.almaInterventionCount).toBe(1);
    expect(result.manifest.consentDegraded).toBe(true); // EL unset → degraded
    expect(result.manifest.storyCount).toBe(0); // fail-closed when degraded
    expect(result.json.length).toBeGreaterThan(0);
    expect(result.filenameRoot).toMatch(/^evidence-walumarra-youth-justice-/);
    // PDF may be null if Puppeteer can't launch in CI — that's fine.
  });
});
