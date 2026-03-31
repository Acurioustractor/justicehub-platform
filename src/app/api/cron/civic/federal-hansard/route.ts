import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const API_BASE = 'https://www.openaustralia.org.au/api';

const YJ_KEYWORDS = [
  'youth justice', 'youth detention', 'juvenile justice', 'young offender',
  'raising the age', 'age of criminal responsibility', 'Don Dale', 'Banksia Hill',
  'youth crime', 'youth diversion', 'child detention', 'youth bail',
  'children in custody', 'juvenile detention',
];

const YJ_PATTERN = new RegExp(YJ_KEYWORDS.join('|'), 'i');

// Default lookback for cron — shorter than the CLI script
const DAYS_BACK = 30;

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#8212;/g, '\u2014').replace(/&#8211;/g, '\u2013')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function getSittingDates(daysBack: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    // Parliament typically sits Mon-Thu
    if (dow >= 1 && dow <= 4) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

interface DebateEntry {
  entry?: { body?: string };
  subs?: Array<{
    excerpt?: string;
    body?: string;
    gid?: string;
    epobject_id?: string;
    listurl?: string;
    hdate?: string;
    speaker?: {
      full_name?: string;
      name?: string;
      party?: string;
    };
  }>;
}

async function fetchDebates(apiKey: string, type: string, date: string): Promise<DebateEntry[]> {
  const url = `${API_BASE}/getDebates?key=${apiKey}&type=${type}&date=${date}&output=js`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      // OpenAustralia API returns 500s intermittently
      if (resp.status >= 500) {
        console.warn(`[federal-hansard] API returned ${resp.status} for ${type} on ${date} — skipping`);
      }
      return [];
    }
    const data = await resp.json();
    if (data.error) return [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

interface HansardRecord {
  subject: string;
  body_text: string;
  speaker_name: string | null;
  party: string | null;
  sitting_date: string;
  house: string;
  source_url: string;
  jurisdiction: string;
  scraped_at: string;
}

function extractSpeeches(debates: DebateEntry[], date: string, house: string): HansardRecord[] {
  const speeches: HansardRecord[] = [];
  for (const debate of debates) {
    const heading = debate.entry?.body || '';
    const subs = debate.subs || [];
    for (const sub of subs) {
      const text = stripHtml(sub.excerpt || sub.body || '');
      if (!text || text.length < 50) continue;
      if (!YJ_PATTERN.test(text) && !YJ_PATTERN.test(heading)) continue;

      const gid = sub.gid || sub.epobject_id;
      const sourceUrl = sub.listurl
        ? `https://www.openaustralia.org.au${sub.listurl}`
        : `https://www.openaustralia.org.au/${house === 'senate' ? 'senate' : 'debates'}/?id=${gid}`;

      speeches.push({
        subject: stripHtml(heading) || stripHtml(sub.body?.match(/<strong>(.*?)<\/strong>/)?.[1] || ''),
        body_text: text,
        speaker_name: sub.speaker?.full_name || sub.speaker?.name || null,
        party: sub.speaker?.party || null,
        sitting_date: sub.hdate || date,
        house,
        source_url: sourceUrl,
        jurisdiction: 'federal',
        scraped_at: new Date().toISOString(),
      });
    }
  }
  return speeches;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAUSTRALIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'OPENAUSTRALIA_API_KEY not configured' },
      { status: 500 }
    );
  }

  const supabase = createServiceClient();
  const stats = { dates_checked: 0, fetched: 0, matched: 0, new_records: 0, inserted: 0, errors: 0, api_failures: 0 };

  try {
    // Load existing URLs for dedup
    const { data: existing } = await supabase
      .from('civic_hansard')
      .select('source_url')
      .eq('jurisdiction', 'federal');
    const existingUrls = new Set((existing || []).map((r) => r.source_url));

    const dates = getSittingDates(DAYS_BACK);
    const toInsert: HansardRecord[] = [];
    const seenUrls = new Set<string>();

    for (const date of dates) {
      stats.dates_checked++;

      for (const type of ['senate', 'representatives'] as const) {
        const debates = await fetchDebates(apiKey, type, date);
        if (debates.length === 0) continue;
        stats.fetched += debates.length;

        const house = type === 'senate' ? 'senate' : 'reps';
        const speeches = extractSpeeches(debates, date, house);
        stats.matched += speeches.length;

        for (const speech of speeches) {
          if (!speech.source_url || existingUrls.has(speech.source_url) || seenUrls.has(speech.source_url)) {
            continue;
          }
          seenUrls.add(speech.source_url);
          toInsert.push(speech);
          stats.new_records++;
        }

        // Rate limit — 500ms between API calls
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Batch upsert
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50);
        const { error } = await supabase
          .from('civic_hansard')
          .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true });
        if (error) {
          console.error('[federal-hansard] Batch upsert error:', error.message);
          stats.errors += batch.length;
        } else {
          stats.inserted += batch.length;
        }
      }
    }

    console.log(
      `[federal-hansard] Dates: ${stats.dates_checked}, Fetched: ${stats.fetched}, ` +
      `Matched: ${stats.matched}, New: ${stats.new_records}, Inserted: ${stats.inserted}, ` +
      `Errors: ${stats.errors}`
    );

    return NextResponse.json({
      success: stats.errors === 0,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[federal-hansard] Fatal error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        stats,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
