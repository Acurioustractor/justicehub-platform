/**
 * Printable brief — server-rendered PDF of the From Programs to Practice page.
 *
 * Uses Puppeteer (already in stack) to print the page as A4. If Puppeteer
 * cannot launch in the host environment (sandboxed serverless, etc.) we fall
 * back to a plain-text response with a TODO header so download links never 500.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOCUS_TOPICS = ['youth-justice', 'child-protection', 'indigenous', 'diversion'];

interface AlmaRow {
  id: string;
  name: string | null;
  evidence_level: string | null;
  cultural_authority: string | null;
  target_cohort: string | null;
  geography: string | null;
  description: string | null;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderHtml(rows: AlmaRow[]): string {
  const tableRows = rows
    .map(
      (r) => `<tr>
        <td>
          <strong>${esc(r.name)}</strong>
          ${r.geography ? `<div class="meta">${esc(r.geography)}</div>` : ''}
        </td>
        <td>${esc(r.evidence_level)}</td>
        <td>${esc(r.cultural_authority)}</td>
        <td>${esc(r.target_cohort)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>From Programs to Practice — JusticeHub Field Briefing</title>
<style>
  @page { size: A4; margin: 18mm 15mm; }
  body { font-family: -apple-system, system-ui, sans-serif; color: #121212; }
  h1 { font-weight: 900; text-transform: uppercase; letter-spacing: -1px; font-size: 36pt; margin: 0; line-height: 1.0; }
  h2 { font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 16pt; margin-top: 28pt; }
  .kicker { font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #d02020; font-size: 10pt; margin-bottom: 8pt; }
  .lead { font-size: 12pt; line-height: 1.5; max-width: 600pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 12pt; font-size: 9pt; }
  th { background: #121212; color: white; padding: 6pt 8pt; text-align: left; text-transform: uppercase; letter-spacing: 1px; font-size: 8pt; }
  td { border: 1pt solid #121212; padding: 6pt 8pt; vertical-align: top; }
  .meta { color: #555; font-size: 8pt; margin-top: 2pt; }
  .footer { margin-top: 24pt; font-size: 9pt; color: #555; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
</style></head><body>
  <div class="kicker">JusticeHub Field Briefing · Reintegration 2026</div>
  <h1>From Programs to Practice</h1>
  <p class="lead">Programs do not save kids. Practice does. This briefing pulls together what the Australian Living Map of Alternatives (ALMA) tells us about the community-led work shifting outcomes for young people across so-called Australia, and the tools JusticeHub is releasing so practitioners can do the work.</p>

  <h2>The evidence — ${rows.length} interventions</h2>
  <table>
    <thead><tr><th>Intervention</th><th>Evidence</th><th>Cultural authority</th><th>Cohort</th></tr></thead>
    <tbody>${tableRows || '<tr><td colspan="4">No interventions returned.</td></tr>'}</tbody>
  </table>

  <h2>JusticeHub Practice — beta open</h2>
  <p class="lead">The Atlas tells you what works. Practice helps you do it. The new layer is a reflex-loop tool for community-led organisations: hold cases without losing them, record outcomes without writing twice, and brief funders without rewriting your week into a grant report.</p>

  <div class="footer">justicehub.org.au/from-programs-to-practice · Reintegration Conference week of 22 June 2026</div>
</body></html>`;
}

async function loadRows(): Promise<AlmaRow[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('alma_interventions')
    .select('id, name, evidence_level, cultural_authority, target_cohort, geography, description')
    .neq('verification_status', 'ai_generated')
    .overlaps('topics', FOCUS_TOPICS)
    .order('portfolio_score', { ascending: false, nullsFirst: false })
    .limit(120);
  if (error) {
    console.error('[from-programs-to-practice/pdf] alma query failed:', error.message);
    return [];
  }
  return (data as AlmaRow[]) ?? [];
}

export async function GET() {
  const rows = await loadRows();
  const html = renderHtml(rows);

  try {
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
        margin: { top: '18mm', bottom: '18mm', left: '15mm', right: '15mm' },
      });
      const body = Buffer.from(pdf) as unknown as BodyInit;
      return new NextResponse(body, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition':
            'attachment; filename="from-programs-to-practice.pdf"',
          'cache-control': 'no-store',
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.warn('[from-programs-to-practice/pdf] puppeteer unavailable, returning HTML:', err);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-pdf-fallback': 'puppeteer-unavailable',
      },
    });
  }
}
