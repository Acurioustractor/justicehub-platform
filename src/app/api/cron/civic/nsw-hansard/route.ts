import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const API_BASE = 'https://api.parliament.nsw.gov.au/api/hansard/search';

const YJ_KEYWORDS_RE = /youth justice|juvenile|detention|bail|raising the age|child protection|custody|remand|incarceration|first nations|aboriginal|indigenous|young people|young offender/i;

// Cron runs weekly — look back 30 days to catch anything missed
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface SittingEvent {
  Chamber?: string;
  chamber?: string;
  TocDocId?: string;
  tocDocId?: string;
  PdfDocId?: string;
  pdfDocId?: string;
}

interface SittingDate {
  Date?: string;
  date?: string;
  SittingDate?: string;
  Events?: SittingEvent[];
  events?: SittingEvent[];
  // Legacy flat format
  TocDocId?: string;
  tocDocId?: string;
}

interface TocTopic {
  fragmentId: string;
  title: string;
}

interface HansardRecord {
  subject: string;
  body_text: string;
  speaker_name: string | null;
  speaker_party: string | null;
  speech_type: string;
  sitting_date: string;
  source_url: string;
  jurisdiction: string;
  scraped_at: string;
}

/**
 * Fetch sitting dates for a given year from the NSW Parliament API.
 */
async function fetchSittingDates(year: number): Promise<SittingDate[]> {
  const url = `${API_BASE}/year/${year}`;
  try {
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch the table of contents XML for a sitting day.
 */
async function fetchToc(tocDocId: string): Promise<string | null> {
  const url = `${API_BASE}/daily/tableofcontents/${tocDocId}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

/**
 * Fetch a single speech fragment by its ID.
 */
async function fetchFragment(fragmentId: string): Promise<string | null> {
  const url = `${API_BASE}/daily/fragment/${fragmentId}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

/**
 * Parse TOC XML to find topics matching youth justice keywords.
 * Uses regex-based extraction since the XML structure is simple.
 */
function parseTocForYjTopics(xml: string): TocTopic[] {
  if (!xml) return [];
  const results: TocTopic[] = [];
  const seen = new Set<string>();

  // Match items/fragments in the TOC XML
  const itemPattern = /<(Item|Fragment|TocItem)[^>]*>[\s\S]*?<\/\1>/gi;
  const items = xml.match(itemPattern) || [];

  for (const item of items) {
    // Extract title/heading
    const titleMatch = item.match(/<(Title|Heading|Subject|Name)>([\s\S]*?)<\/\1>/i);
    const title = titleMatch ? stripHtml(titleMatch[2]) : '';

    // Extract fragment ID
    const idMatch = item.match(/<(FragmentId|Id|Uid|FragId)>([\s\S]*?)<\/\1>/i)
      || item.match(/(?:FragmentId|Id|Uid)=["']([^"']+)["']/i);
    const fragmentId = idMatch ? (idMatch[2] || idMatch[1]) : null;

    if (!fragmentId || !title || seen.has(fragmentId)) continue;

    if (YJ_KEYWORDS_RE.test(title)) {
      seen.add(fragmentId);
      results.push({ fragmentId, title });
    }
  }

  // Fallback: try matching fragment IDs from attributes with nearby keyword text
  if (results.length === 0) {
    const genericPattern = /<[^>]*(?:id|uid|fragmentid)=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = genericPattern.exec(xml)) !== null) {
      const id = match[1];
      if (seen.has(id)) continue;
      const surroundingText = xml.slice(match.index, match.index + 500);
      const textContent = stripHtml(surroundingText);
      if (YJ_KEYWORDS_RE.test(textContent)) {
        seen.add(id);
        results.push({ fragmentId: id, title: textContent.slice(0, 200) });
      }
    }
  }

  return results;
}

/**
 * Parse a fragment XML to extract speaker and body text.
 */
function parseFragment(xml: string, tocTitle: string, sittingDate: string): Omit<HansardRecord, 'source_url'> | null {
  if (!xml) return null;

  // Extract speaker
  const speakerMatch = xml.match(/<(Speaker|SpeakerName|Member)>([\s\S]*?)<\/\1>/i)
    || xml.match(/<[^>]*speaker=["']([^"']+)["']/i);
  const speakerName = speakerMatch
    ? stripHtml(speakerMatch[2] || speakerMatch[1])
    : null;

  // Extract body/text content
  const bodyMatch = xml.match(/<(Body|Content|Text|Html|HtmlBody)>([\s\S]*?)<\/\1>/i);
  const bodyHtml = bodyMatch ? bodyMatch[2] : '';
  const bodyText = stripHtml(bodyHtml);

  // Fallback: extract all text if body tag not found
  const finalBody = bodyText.length > 50
    ? bodyText
    : stripHtml(xml.replace(/<\?xml[^>]*>/g, ''));

  if (!finalBody || finalBody.length < 50) return null;

  // Verify content relevance
  if (!YJ_KEYWORDS_RE.test(finalBody) && !YJ_KEYWORDS_RE.test(tocTitle)) return null;

  // Extract chamber/house
  const houseMatch = xml.match(/<(House|Chamber)>([\s\S]*?)<\/\1>/i);
  const houseRaw = houseMatch ? houseMatch[2].toLowerCase() : '';
  const house = houseRaw.includes('council') ? 'legislative_council' : 'legislative_assembly';

  return {
    subject: tocTitle,
    body_text: finalBody.slice(0, 50000),
    speaker_name: speakerName,
    speaker_party: null,
    speech_type: house, // legislative_assembly or legislative_council
    sitting_date: sittingDate,
    jurisdiction: 'NSW',
    scraped_at: new Date().toISOString(),
  };
}

function buildSourceUrl(tocDocId: string, fragmentId: string): string {
  return `https://www.parliament.nsw.gov.au/Hansard/Pages/HansardResult.aspx#/docid/${tocDocId}/fragment/${fragmentId}`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const stats = {
    dates_checked: 0,
    tocs_fetched: 0,
    topics_matched: 0,
    fragments_fetched: 0,
    new_records: 0,
    inserted: 0,
    errors: 0,
  };

  try {
    // Load existing URLs for dedup
    const { data: existing } = await supabase
      .from('civic_hansard')
      .select('source_url')
      .eq('jurisdiction', 'NSW');
    const existingUrls = new Set((existing || []).map((r) => r.source_url));

    // Calculate date cutoff
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_BACK);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    // Fetch sitting dates for current year (and previous year if within lookback)
    const currentYear = new Date().getFullYear();
    const years = [currentYear];
    if (cutoffDate.getFullYear() < currentYear) {
      years.push(cutoffDate.getFullYear());
    }

    let allSittings: SittingDate[] = [];
    for (const year of years) {
      const sittings = await fetchSittingDates(year);
      allSittings.push(...sittings);
      await sleep(500);
    }

    // Flatten sittings: each has an Events array with per-chamber entries
    interface FlatEvent { date: string; chamber: string; tocDocId: string; }
    const allEvents: FlatEvent[] = [];
    for (const sitting of allSittings) {
      const sittingDate = (sitting.date || sitting.Date || sitting.SittingDate || '').split('T')[0];
      if (sittingDate < cutoffStr) continue;

      const events = sitting.Events || sitting.events || [];
      if (events.length > 0) {
        for (const evt of events) {
          const tocId = evt.TocDocId || evt.tocDocId;
          if (tocId) {
            allEvents.push({ date: sittingDate, chamber: evt.Chamber || evt.chamber || 'Unknown', tocDocId: tocId });
          }
        }
      } else {
        // Fallback: TocDocId at top level (older format)
        const tocId = sitting.TocDocId || sitting.tocDocId;
        if (tocId) {
          allEvents.push({ date: sittingDate, chamber: 'Unknown', tocDocId: tocId });
        }
      }
    }

    console.log(`[nsw-hansard] Processing ${allEvents.length} chamber-sessions within last ${DAYS_BACK} days`);

    const toInsert: HansardRecord[] = [];
    const seenUrls = new Set<string>();

    for (const event of allEvents) {
      const { tocDocId, date: sittingDate } = event;

      stats.dates_checked++;

      // Fetch TOC
      await sleep(500);
      const tocXml = await fetchToc(tocDocId);
      if (!tocXml) continue;
      stats.tocs_fetched++;

      // Parse TOC for youth justice topics
      const yjTopics = parseTocForYjTopics(tocXml);
      if (yjTopics.length === 0) continue;
      stats.topics_matched += yjTopics.length;

      // Fetch each matching fragment
      for (const topic of yjTopics) {
        const sourceUrl = buildSourceUrl(tocDocId, topic.fragmentId);

        if (existingUrls.has(sourceUrl) || seenUrls.has(sourceUrl)) continue;

        await sleep(500);
        const fragmentXml = await fetchFragment(topic.fragmentId);
        stats.fragments_fetched++;

        if (!fragmentXml) continue;

        const record = parseFragment(fragmentXml, topic.title, sittingDate);
        if (!record) continue;

        const fullRecord: HansardRecord = { ...record, source_url: sourceUrl };
        seenUrls.add(sourceUrl);
        toInsert.push(fullRecord);
        stats.new_records++;
      }
    }

    // Batch upsert
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50);
        const { error } = await supabase
          .from('civic_hansard')
          .insert(batch);
        if (error) {
          console.error('[nsw-hansard] Batch upsert error:', error.message);
          stats.errors += batch.length;
        } else {
          stats.inserted += batch.length;
        }
      }
    }

    console.log(
      `[nsw-hansard] Dates: ${stats.dates_checked}, TOCs: ${stats.tocs_fetched}, ` +
      `Topics: ${stats.topics_matched}, Fragments: ${stats.fragments_fetched}, ` +
      `New: ${stats.new_records}, Inserted: ${stats.inserted}, Errors: ${stats.errors}`
    );

    return NextResponse.json({
      success: stats.errors === 0,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[nsw-hansard] Fatal error:', err);
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
