/**
 * Evidence Export — one-click funder bundle.
 *
 * Pulls four streams into a single export:
 *   1. Cases worked      — from Practice surface reflex tasks (when shipped)
 *   2. Outcomes recorded — from Practice surface (lanes + outcomes)
 *   3. Consented stories — from Empathy Ledger via consent verification
 *   4. ALMA evidence     — from local alma_interventions for the program category
 *
 * Returns BOTH a JSON manifest and a Puppeteer-rendered PDF. The JSON is the
 * canonical record; the PDF is the polished artefact a funder reads.
 *
 * Design rule (per FY27 launch ops plan): never let a sibling-product outage
 * break this export. If Empathy Ledger consent verification fails, the bundle
 * omits private stories and flags the gap in the manifest rather than 500ing.
 */

import { empathyLedgerClient } from './empathy-ledger-client';
import type { ReflexLoop } from './reflex/types';

export interface EvidenceExportInput {
  /** Org whose evidence we are bundling. */
  organizationId: string;
  organizationName: string;
  organizationAbn?: string | null;
  /** Funder we are briefing — used in the cover page. */
  funderName?: string | null;
  /** Program category (e.g. 'youth-justice', 'child-protection') — drives ALMA filter. */
  programCategory: string;
  /** Reflex loops we want to surface (already filtered by the caller). */
  cases: ReflexLoop[];
  /** Outcomes recorded against those loops. */
  outcomes: Array<{
    caseId: string;
    label: string;
    recordedAt: string;
    evidenceRef?: string | null;
  }>;
  /** Story tokens (Empathy Ledger) — we verify consent before including each. */
  storyConsentTokens: string[];
  /** ALMA interventions tagged for this category. */
  almaInterventions: Array<{
    id: string;
    name: string;
    evidenceLevel: string | null;
    culturalAuthority: string | null;
    targetCohort: string | null;
    summary: string | null;
  }>;
  /** Optional cover note. */
  coverNote?: string;
}

export interface EvidenceExportManifest {
  generatedAt: string;
  organization: { id: string; name: string; abn: string | null };
  funder: string | null;
  programCategory: string;
  caseCount: number;
  outcomeCount: number;
  storyCount: number;
  almaInterventionCount: number;
  consentSkipped: number;
  consentDegraded: boolean;
  coverNote: string;
  cases: ReflexLoop[];
  outcomes: EvidenceExportInput['outcomes'];
  stories: Array<{ subjectId: string | null; consentLevel: string | null }>;
  almaInterventions: EvidenceExportInput['almaInterventions'];
}

export interface EvidenceExportResult {
  manifest: EvidenceExportManifest;
  /** JSON bytes (UTF-8 encoded manifest). */
  json: Buffer;
  /** PDF bytes — null when the PDF renderer is unavailable in this environment. */
  pdf: Buffer | null;
  /** Suggested filename root (no extension). */
  filenameRoot: string;
}

async function verifyStoryConsents(tokens: string[]): Promise<{
  stories: Array<{ subjectId: string | null; consentLevel: string | null }>;
  skipped: number;
  degraded: boolean;
}> {
  if (!tokens.length) return { stories: [], skipped: 0, degraded: false };

  const results = await Promise.all(tokens.map((t) => empathyLedgerClient.verifyConsent(t)));
  let skipped = 0;
  let degraded = false;
  const stories = results
    .map((r) => {
      if (r.degraded) degraded = true;
      if (!r.ok || !r.consentGranted) {
        skipped += 1;
        return null;
      }
      return {
        subjectId: r.subjectId ?? null,
        consentLevel: r.consentLevel ?? 'unknown',
      };
    })
    .filter(Boolean) as Array<{ subjectId: string | null; consentLevel: string | null }>;

  return { stories, skipped, degraded };
}

function renderHtml(manifest: EvidenceExportManifest): string {
  const esc = (s: unknown) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const caseRows = manifest.cases
    .map(
      (loop) => `<tr>
        <td>${esc(loop.task.title)}</td>
        <td>${esc(loop.task.status)}</td>
        <td>${esc(loop.task.priority)}</td>
        <td>${esc(loop.task.updatedAt)}</td>
        <td>${esc(loop.outcome?.label ?? '')}</td>
      </tr>`
    )
    .join('');

  const outcomeRows = manifest.outcomes
    .map(
      (o) => `<tr>
        <td>${esc(o.label)}</td>
        <td>${esc(o.recordedAt)}</td>
        <td>${esc(o.evidenceRef ?? '')}</td>
      </tr>`
    )
    .join('');

  const almaRows = manifest.almaInterventions
    .map(
      (i) => `<tr>
        <td>${esc(i.name)}</td>
        <td>${esc(i.evidenceLevel)}</td>
        <td>${esc(i.culturalAuthority)}</td>
        <td>${esc(i.targetCohort)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Evidence Bundle — ${esc(manifest.organization.name)}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; color: #121212; padding: 32px; }
  h1 { font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 4px solid #121212; padding-bottom: 8px; }
  h2 { font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 32px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  th, td { border: 1px solid #121212; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #F0F0F0; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
  .meta { font-size: 12px; color: #444; }
  .note { background: #F0F0F0; padding: 12px; border: 1px solid #121212; margin-top: 16px; }
</style></head><body>
  <h1>Evidence Bundle</h1>
  <div class="meta">
    Organisation: <strong>${esc(manifest.organization.name)}</strong>${
    manifest.organization.abn ? ` (ABN ${esc(manifest.organization.abn)})` : ''
  }<br/>
    Funder: <strong>${esc(manifest.funder ?? 'Not specified')}</strong><br/>
    Program category: <strong>${esc(manifest.programCategory)}</strong><br/>
    Generated: ${esc(manifest.generatedAt)}
  </div>
  ${manifest.coverNote ? `<div class="note">${esc(manifest.coverNote)}</div>` : ''}

  <h2>Cases worked (${manifest.caseCount})</h2>
  <table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Updated</th><th>Outcome</th></tr></thead>
    <tbody>${caseRows || '<tr><td colspan="5">No cases in window.</td></tr>'}</tbody></table>

  <h2>Outcomes recorded (${manifest.outcomeCount})</h2>
  <table><thead><tr><th>Label</th><th>Recorded</th><th>Evidence ref</th></tr></thead>
    <tbody>${outcomeRows || '<tr><td colspan="3">No outcomes recorded.</td></tr>'}</tbody></table>

  <h2>Consented stories (${manifest.storyCount})</h2>
  <div class="meta">
    ${manifest.consentSkipped > 0 ? `${manifest.consentSkipped} story request(s) skipped — consent not granted or unverifiable.` : 'All requested stories had verified consent.'}
    ${manifest.consentDegraded ? ' Consent verification service degraded; bundle is intentionally conservative.' : ''}
  </div>

  <h2>Australian Living Map of Alternatives (ALMA) evidence — ${esc(manifest.programCategory)} (${manifest.almaInterventionCount})</h2>
  <table><thead><tr><th>Intervention</th><th>Evidence level</th><th>Cultural authority</th><th>Target cohort</th></tr></thead>
    <tbody>${almaRows || '<tr><td colspan="4">No ALMA interventions in this category.</td></tr>'}</tbody></table>
</body></html>`;
}

async function renderPdf(html: string): Promise<Buffer | null> {
  try {
    // Dynamic import so server-only build doesn't pull Puppeteer everywhere.
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (err) {
    // Puppeteer may not be runnable in the host env (lambda, CI, etc.).
    console.warn('[evidence-export] PDF renderer unavailable:', err);
    return null;
  }
}

export async function buildEvidenceExport(
  input: EvidenceExportInput
): Promise<EvidenceExportResult> {
  const consent = await verifyStoryConsents(input.storyConsentTokens);

  const manifest: EvidenceExportManifest = {
    generatedAt: new Date().toISOString(),
    organization: {
      id: input.organizationId,
      name: input.organizationName,
      abn: input.organizationAbn ?? null,
    },
    funder: input.funderName ?? null,
    programCategory: input.programCategory,
    caseCount: input.cases.length,
    outcomeCount: input.outcomes.length,
    storyCount: consent.stories.length,
    almaInterventionCount: input.almaInterventions.length,
    consentSkipped: consent.skipped,
    consentDegraded: consent.degraded,
    coverNote: input.coverNote ?? '',
    cases: input.cases,
    outcomes: input.outcomes,
    stories: consent.stories,
    almaInterventions: input.almaInterventions,
  };

  const json = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
  const html = renderHtml(manifest);
  const pdf = await renderPdf(html);

  const safeName = input.organizationName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const filenameRoot = `evidence-${safeName}-${input.programCategory}-${manifest.generatedAt.slice(0, 10)}`;

  return { manifest, json, pdf, filenameRoot };
}
