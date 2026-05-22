import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Advocacy Brief PDF generator.
 *
 * Renders /intelligence/civic/print (same data, print-friendly stylesheet) via
 * headless Chrome and returns the PDF stream.
 *
 * Usage: GET /api/intelligence/civic/brief?region=national
 *        GET /api/intelligence/civic/brief?region=QLD
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const region = params.get('region') || 'national';

  const origin = (() => {
    const h = req.headers.get('host');
    if (!h) return 'http://localhost:3014';
    const proto = req.headers.get('x-forwarded-proto') || (h.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${h}`;
  })();

  const printUrl = `${origin}/intelligence/civic/print${region !== 'national' ? `?region=${encodeURIComponent(region)}` : ''}`;

  let browser: any = null;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1400, deviceScaleFactor: 2 });
    await page.emulateMediaType('print');

    const res = await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 45000 });
    if (!res || res.status() >= 400) {
      throw new Error(`Failed to load print page: ${res?.status()}`);
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 9px; color: #57534e; padding: 0 15mm; width: 100%; font-family: monospace;">JusticeHub Civic Intelligence — Advocacy Brief</div>',
      footerTemplate: `<div style="font-size: 9px; color: #57534e; padding: 0 15mm; width: 100%; display: flex; justify-content: space-between; font-family: monospace;">
        <span>justicehub.com.au/intelligence/civic/methodology</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="civic-advocacy-brief-${region}-${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err: any) {
    console.error('PDF brief generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed', detail: err?.message }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
