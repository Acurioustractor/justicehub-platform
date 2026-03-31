import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const YJ_KEYWORDS = ['youth', 'juvenile', 'child', 'young offender', 'detention', 'sentencing'];
const YJ_PATTERN = new RegExp(YJ_KEYWORDS.join('|'), 'i');

const FEEDS = [
  {
    url: 'https://www.judgments.fedcourt.gov.au/rss/fca-judgments',
    court: 'Federal Court of Australia',
    jurisdiction: 'federal',
  },
  {
    url: 'https://www.sclqld.org.au/collections/caselaw/caselaw-alerts-rss-feeds',
    court: 'QLD Supreme Court',
    jurisdiction: 'QLD',
  },
];

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function parseRssItems(xml: string): RssItem[] {
  const entries: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    entries.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
    });
  }
  return entries;
}

function isYouthJustice(entry: RssItem): boolean {
  const text = `${entry.title} ${entry.description}`;
  return YJ_PATTERN.test(text);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const stats = { fetched: 0, matched: 0, skipped: 0, inserted: 0, errors: 0 };

  try {
    // Load existing keys for dedup
    const { data: existing } = await supabase
      .from('alma_research_findings')
      .select('validation_source')
      .eq('finding_type', 'court_judgment');
    const existingKeys = new Set((existing || []).map((r) => r.validation_source));

    const toInsert: Array<{
      finding_type: string;
      content: Record<string, unknown>;
      confidence: number;
      validation_source: string;
      sources: string[];
    }> = [];

    for (const feed of FEEDS) {
      let xml: string;
      try {
        const resp = await fetch(feed.url, {
          headers: { 'User-Agent': 'JusticeHub/1.0 (research)' },
        });
        if (!resp.ok) {
          console.error(`[court-judgments] HTTP ${resp.status} from ${feed.court}`);
          stats.errors++;
          continue;
        }
        xml = await resp.text();
      } catch (err) {
        console.error(`[court-judgments] Fetch error for ${feed.court}:`, err);
        stats.errors++;
        continue;
      }

      const items = parseRssItems(xml);
      stats.fetched += items.length;

      for (const item of items) {
        if (!isYouthJustice(item)) continue;
        stats.matched++;

        const dedupKey = `court_judgment:${item.link}`;
        if (existingKeys.has(dedupKey)) {
          stats.skipped++;
          continue;
        }
        existingKeys.add(dedupKey);

        const matchedKeywords = YJ_KEYWORDS.filter((kw) =>
          `${item.title} ${item.description}`.toLowerCase().includes(kw)
        );

        toInsert.push({
          finding_type: 'court_judgment',
          content: {
            title: item.title,
            date: item.pubDate || null,
            court: feed.court,
            jurisdiction: feed.jurisdiction,
            summary: item.description,
            matched_keywords: matchedKeywords,
          },
          confidence: matchedKeywords.length >= 3 ? 0.9 : matchedKeywords.length >= 2 ? 0.8 : 0.7,
          validation_source: dedupKey,
          sources: item.link ? [item.link] : [],
        });
      }
    }

    // Batch insert
    if (toInsert.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const batch = toInsert.slice(i, i + BATCH);
        const { error } = await supabase.from('alma_research_findings').insert(batch);
        if (error) {
          console.error(`[court-judgments] Batch insert error:`, error.message);
          stats.errors += batch.length;
        } else {
          stats.inserted += batch.length;
        }
      }
    }

    console.log(
      `[court-judgments] Fetched: ${stats.fetched}, Matched: ${stats.matched}, ` +
      `Skipped: ${stats.skipped}, Inserted: ${stats.inserted}, Errors: ${stats.errors}`
    );

    return NextResponse.json({
      success: stats.errors === 0,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[court-judgments] Fatal error:', err);
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
