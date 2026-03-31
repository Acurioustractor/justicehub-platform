import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * QLD Hansard Cron Scraper
 *
 * Fetches QLD Parliament search results directly (no firecrawl needed in cron —
 * the search page is server-rendered HTML). Parses results for youth justice
 * keywords and inserts into civic_hansard.
 *
 * Schedule: Weekly on Wednesdays at 17:00 UTC
 */

const SEARCH_KEYWORDS = [
  'youth justice',
  'youth detention',
  'raising the age',
  'juvenile justice',
  'watch house',
  'youth crime',
];

const YJ_KEYWORDS = [
  'youth justice', 'youth detention', 'juvenile justice', 'young offender',
  'raising the age', 'age of criminal responsibility',
  'youth crime', 'youth diversion', 'child detention', 'youth bail',
  'children in custody', 'juvenile detention', 'watch house',
];
const YJ_PATTERN = new RegExp(YJ_KEYWORDS.join('|'), 'i');

const MONTHS: Record<string, string> = {
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = MONTHS[match[2].toLowerCase()];
    if (month) return `${match[3]}-${month}-${day}`;
  }
  const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  return null;
}

interface SearchResult {
  title: string;
  url: string;
  date: string;
  speaker: string;
  snippet: string;
}

/**
 * Parse search results HTML from QLD Parliament search page.
 * Tries multiple HTML patterns since the page structure may vary.
 */
function parseSearchHtml(html: string): SearchResult[] {
  if (!html) return [];
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // Strategy 1: Look for links containing 'hansard' in href with surrounding context
  const linkPattern = /<a\s+[^>]*href="([^"]*(?:hansard|Hansard|proceeding|speech)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    let url = match[1].trim();
    const title = stripHtml(match[2]);
    if (!title || title.length < 5) continue;

    if (!url.startsWith('http')) {
      url = `https://www.parliament.qld.gov.au${url}`;
    }
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Get surrounding context for date/speaker extraction
    const contextStart = Math.max(0, match.index - 300);
    const contextEnd = Math.min(html.length, match.index + match[0].length + 500);
    const context = html.slice(contextStart, contextEnd);
    const contextText = stripHtml(context);

    // Extract date
    const dateMatch = contextText.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract speaker
    const speakerMatch = contextText.match(/(?:Hon\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+MP)?)\s*(?:\(|,|\|)/);
    const speaker = speakerMatch ? speakerMatch[1] : '';

    // Extract snippet — text near the link
    const afterText = stripHtml(html.slice(match.index + match[0].length, match.index + match[0].length + 400));
    const snippet = afterText.split('\n')[0]?.trim().slice(0, 500) || '';

    results.push({ title, url, date, speaker, snippet });
  }

  // Strategy 2: If no results from links, try looking for search result containers
  if (results.length === 0) {
    const containerPatterns = [
      /<div[^>]*class="[^"]*(?:search-result|result-item|item)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|$)/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<tr[^>]*>([\s\S]*?)<\/tr>/gi,
    ];

    for (const pattern of containerPatterns) {
      let containerMatch;
      while ((containerMatch = pattern.exec(html)) !== null) {
        const block = containerMatch[1];
        const innerLink = block.match(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!innerLink) continue;

        let url = innerLink[1].trim();
        const title = stripHtml(innerLink[2]);
        if (!title || title.length < 5) continue;

        if (!url.startsWith('http')) {
          url = `https://www.parliament.qld.gov.au${url}`;
        }
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        const blockText = stripHtml(block);
        const dateMatch = blockText.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);

        results.push({
          title,
          url,
          date: dateMatch ? dateMatch[1] : '',
          speaker: '',
          snippet: blockText.slice(0, 500),
        });
      }
      if (results.length > 0) break;
    }
  }

  return results;
}

interface HansardRecord {
  subject: string | null;
  body_text: string;
  speaker_name: string | null;
  speaker_party: string | null;
  speech_type: string;
  sitting_date: string | null;
  source_url: string;
  jurisdiction: string;
  scraped_at: string;
}

function shapeRecord(result: SearchResult): HansardRecord {
  const partyMatch = result.speaker.match(/\(([^)]+)\)/);
  const speakerParty = partyMatch ? partyMatch[1] : null;
  const speakerName = result.speaker.replace(/\s*\([^)]*\)\s*/, '').trim() || null;

  return {
    subject: result.title || null,
    body_text: result.snippet || '',
    speaker_name: speakerName,
    speaker_party: speakerParty,
    speech_type: 'speech',
    sitting_date: parseDateString(result.date),
    source_url: result.url,
    jurisdiction: 'QLD',
    scraped_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const stats = {
    keywords_searched: 0,
    search_results_found: 0,
    yj_relevant: 0,
    new_records: 0,
    inserted: 0,
    skipped_existing: 0,
    errors: 0,
  };

  try {
    // Load existing URLs for dedup
    const { data: existing } = await supabase
      .from('civic_hansard')
      .select('source_url')
      .eq('jurisdiction', 'QLD');
    const existingUrls = new Set((existing || []).map((r: { source_url: string }) => r.source_url));

    const toInsert: HansardRecord[] = [];
    const seenUrls = new Set<string>();

    for (const keyword of SEARCH_KEYWORDS) {
      stats.keywords_searched++;

      const searchUrl = `https://www.parliament.qld.gov.au/Global/Search?index=qps_hansard_index&query=${encodeURIComponent(keyword)}`;

      try {
        const resp = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'JusticeHub-Civic-Scraper/1.0 (research; civic transparency)',
            'Accept': 'text/html',
          },
        });

        if (!resp.ok) {
          console.warn(`[qld-hansard] Search returned ${resp.status} for "${keyword}"`);
          stats.errors++;
          continue;
        }

        const html = await resp.text();
        const results = parseSearchHtml(html);
        stats.search_results_found += results.length;

        // Filter for YJ relevance
        const relevant = results.filter(
          (r) => YJ_PATTERN.test(r.title) || YJ_PATTERN.test(r.snippet)
        );
        stats.yj_relevant += relevant.length;

        for (const result of relevant) {
          if (existingUrls.has(result.url) || seenUrls.has(result.url)) {
            stats.skipped_existing++;
            continue;
          }
          seenUrls.add(result.url);

          const record = shapeRecord(result);
          if (!record.body_text || record.body_text.length < 20) continue;

          toInsert.push(record);
          stats.new_records++;
        }
      } catch (err) {
        console.error(`[qld-hansard] Error searching "${keyword}":`, err instanceof Error ? err.message : String(err));
        stats.errors++;
      }

      // Rate limit between keyword searches
      await sleep(1000);
    }

    // Insert records
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50);
        const { error } = await supabase
          .from('civic_hansard')
          .insert(batch);

        if (error) {
          if (error.message?.includes('duplicate') || error.code === '23505') {
            // Try one by one to skip duplicates
            for (const record of batch) {
              const { error: singleErr } = await supabase
                .from('civic_hansard')
                .insert(record);
              if (!singleErr) {
                stats.inserted++;
              } else if (singleErr.message?.includes('duplicate') || singleErr.code === '23505') {
                stats.skipped_existing++;
              } else {
                stats.errors++;
              }
            }
          } else {
            console.error('[qld-hansard] Batch insert error:', error.message);
            stats.errors += batch.length;
          }
        } else {
          stats.inserted += batch.length;
        }
      }
    }

    console.log(
      `[qld-hansard] Keywords: ${stats.keywords_searched}, Results: ${stats.search_results_found}, ` +
      `Relevant: ${stats.yj_relevant}, New: ${stats.new_records}, Inserted: ${stats.inserted}, ` +
      `Skipped: ${stats.skipped_existing}, Errors: ${stats.errors}`
    );

    return NextResponse.json({
      success: stats.errors === 0,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[qld-hansard] Fatal error:', err);
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
