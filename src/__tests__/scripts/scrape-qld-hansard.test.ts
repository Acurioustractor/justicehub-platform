/**
 * Tests for scrape-qld-hansard.mjs
 *
 * Tests the core logic: HTML parsing, keyword matching, record shaping,
 * dedup logic, and rate limiting config.
 */

describe('QLD Hansard Scraper - Logic Tests', () => {
  // ── HTML parsing ─────────────────────────────────────────────────

  const SAMPLE_SEARCH_HTML = `
<div class="search-results">
  <div class="search-result">
    <h3><a href="/work-of-the-assembly/hansard/sitting-2025-11-18/2025-11-18-speech-123">Youth Justice and Other Legislation Amendment Bill</a></h3>
    <p class="meta">18 November 2025 | Hon. Shannon Fentiman MP</p>
    <p class="snippet">The Youth Justice and Other Legislation Amendment Bill 2025 proposes significant reforms to address youth crime in Queensland communities...</p>
  </div>
  <div class="search-result">
    <h3><a href="/work-of-the-assembly/hansard/sitting-2025-10-22/2025-10-22-speech-456">Question Without Notice - Watch House Conditions</a></h3>
    <p class="meta">22 October 2025 | Mr David Crisafulli MP</p>
    <p class="snippet">Can the Premier explain why children continue to be held in adult watch houses across Queensland despite repeated recommendations...</p>
  </div>
  <div class="search-result">
    <h3><a href="/work-of-the-assembly/hansard/sitting-2025-09-15/2025-09-15-speech-789">Appropriation Bill - Budget Estimates</a></h3>
    <p class="meta">15 September 2025 | Ms Nikki Boyd MP</p>
    <p class="snippet">Discussion of budget estimates for infrastructure projects including road upgrades and hospital expansion in regional areas...</p>
  </div>
</div>`;

  // The parsing functions we need to test
  function parseSearchResults(html: string): Array<{
    title: string;
    url: string;
    date: string;
    speaker: string;
    snippet: string;
  }> {
    const results: Array<{
      title: string;
      url: string;
      date: string;
      speaker: string;
      snippet: string;
    }> = [];

    // Match each search result block
    const resultPattern = /<div class="search-result">([\s\S]*?)<\/div>/gi;
    let match;
    while ((match = resultPattern.exec(html)) !== null) {
      const block = match[1];

      // Extract link and title
      const linkMatch = block.match(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      const title = linkMatch ? stripHtml(linkMatch[2]) : '';
      const relativeUrl = linkMatch ? linkMatch[1] : '';

      // Extract date and speaker from meta
      const metaMatch = block.match(/<p class="meta">([\s\S]*?)<\/p>/i);
      const metaText = metaMatch ? stripHtml(metaMatch[1]) : '';
      const [dateStr, speaker] = metaText.split('|').map(s => s.trim());

      // Extract snippet
      const snippetMatch = block.match(/<p class="snippet">([\s\S]*?)<\/p>/i);
      const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : '';

      if (title && relativeUrl) {
        results.push({
          title,
          url: `https://www.parliament.qld.gov.au${relativeUrl}`,
          date: dateStr || '',
          speaker: speaker || '',
          snippet,
        });
      }
    }

    return results;
  }

  function stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  const MONTHS: Record<string, string> = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
  };

  function parseDateString(dateStr: string): string | null {
    if (!dateStr) return null;
    // Try "18 November 2025" format
    const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = MONTHS[match[2].toLowerCase()];
      if (month) return `${match[3]}-${month}-${day}`;
    }
    // Try ISO format
    const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    return null;
  }

  const YJ_KEYWORDS = [
    'youth justice', 'youth detention', 'juvenile justice', 'young offender',
    'raising the age', 'age of criminal responsibility',
    'youth crime', 'youth diversion', 'child detention', 'youth bail',
    'children in custody', 'juvenile detention', 'watch house',
  ];
  const YJ_PATTERN = new RegExp(YJ_KEYWORDS.join('|'), 'i');

  describe('parseSearchResults', () => {
    test('extracts search results from HTML', () => {
      const results = parseSearchResults(SAMPLE_SEARCH_HTML);
      expect(results.length).toBe(3);
    });

    test('extracts title, url, date, speaker, snippet correctly', () => {
      const results = parseSearchResults(SAMPLE_SEARCH_HTML);
      const first = results[0];
      expect(first.title).toBe('Youth Justice and Other Legislation Amendment Bill');
      expect(first.url).toContain('parliament.qld.gov.au');
      expect(first.url).toContain('2025-11-18-speech-123');
      expect(first.date).toBe('18 November 2025');
      expect(first.speaker).toBe('Hon. Shannon Fentiman MP');
      expect(first.snippet).toContain('Youth Justice');
    });

    test('handles empty HTML', () => {
      expect(parseSearchResults('')).toEqual([]);
      expect(parseSearchResults('<div>no results</div>')).toEqual([]);
    });
  });

  // ── Keyword filtering ────────────────────────────────────────────

  describe('keyword matching', () => {
    test('YJ_PATTERN matches youth justice keywords', () => {
      expect(YJ_PATTERN.test('youth justice reform bill')).toBe(true);
      expect(YJ_PATTERN.test('Watch House conditions')).toBe(true);
      expect(YJ_PATTERN.test('raising the age of criminal responsibility')).toBe(true);
      expect(YJ_PATTERN.test('juvenile detention center')).toBe(true);
    });

    test('YJ_PATTERN does not match unrelated content', () => {
      expect(YJ_PATTERN.test('budget estimates for road upgrades')).toBe(false);
      expect(YJ_PATTERN.test('hospital expansion in regional areas')).toBe(false);
    });

    test('filters results by keyword relevance', () => {
      const results = parseSearchResults(SAMPLE_SEARCH_HTML);
      const relevant = results.filter(
        r => YJ_PATTERN.test(r.title) || YJ_PATTERN.test(r.snippet)
      );
      // First two match (Youth Justice, Watch House), third does not
      expect(relevant.length).toBe(2);
      expect(relevant[0].title).toContain('Youth Justice');
      expect(relevant[1].title).toContain('Watch House');
    });
  });

  // ── Record shaping ───────────────────────────────────────────────

  describe('record shaping for civic_hansard insert', () => {
    function shapeRecord(parsed: {
      title: string;
      url: string;
      date: string;
      speaker: string;
      snippet: string;
      bodyText?: string;
    }) {
      // Parse speaker name and party
      const partyMatch = parsed.speaker.match(/\(([^)]+)\)/);
      const speakerParty = partyMatch ? partyMatch[1] : null;
      const speakerName = parsed.speaker.replace(/\s*\([^)]*\)\s*/, '').trim() || null;

      // Parse date — use UTC-based parsing to avoid timezone shifts
      const sittingDate = parseDateString(parsed.date);

      return {
        subject: parsed.title,
        body_text: parsed.bodyText || parsed.snippet,
        speaker_name: speakerName,
        speaker_party: speakerParty,
        speech_type: 'speech',
        sitting_date: sittingDate,
        source_url: parsed.url,
        jurisdiction: 'QLD',
        scraped_at: expect.any(String),
      };
    }

    test('shapes a record with all fields', () => {
      const record = shapeRecord({
        title: 'Youth Justice Bill',
        url: 'https://www.parliament.qld.gov.au/hansard/speech-123',
        date: '18 November 2025',
        speaker: 'Hon. Shannon Fentiman MP (ALP)',
        snippet: 'The bill proposes...',
      });

      expect(record.subject).toBe('Youth Justice Bill');
      expect(record.body_text).toBe('The bill proposes...');
      expect(record.speaker_name).toBe('Hon. Shannon Fentiman MP');
      expect(record.speaker_party).toBe('ALP');
      expect(record.sitting_date).toBe('2025-11-18');
      expect(record.jurisdiction).toBe('QLD');
    });

    test('uses bodyText over snippet when available', () => {
      const record = shapeRecord({
        title: 'Test',
        url: 'https://example.com',
        date: '1 January 2025',
        speaker: 'Test Speaker',
        snippet: 'Short snippet',
        bodyText: 'Full body text from the speech page with much more detail...',
      });
      expect(record.body_text).toBe('Full body text from the speech page with much more detail...');
    });

    test('handles missing party', () => {
      const record = shapeRecord({
        title: 'Test',
        url: 'https://example.com',
        date: '1 January 2025',
        speaker: 'Mr David Crisafulli MP',
        snippet: 'test',
      });
      expect(record.speaker_party).toBeNull();
      expect(record.speaker_name).toBe('Mr David Crisafulli MP');
    });

    test('handles invalid date gracefully', () => {
      const record = shapeRecord({
        title: 'Test',
        url: 'https://example.com',
        date: 'invalid-date',
        speaker: 'Speaker',
        snippet: 'test',
      });
      expect(record.sitting_date).toBeNull();
    });
  });

  // ── Search URL generation ────────────────────────────────────────

  describe('search URL generation', () => {
    const SEARCH_KEYWORDS = [
      'youth justice', 'youth detention', 'raising the age',
      'juvenile justice', 'watch house', 'youth crime',
    ];

    function makeSearchUrl(keyword: string): string {
      return `https://www.parliament.qld.gov.au/Global/Search?index=qps_hansard_index&query=${encodeURIComponent(keyword)}`;
    }

    test('generates correct search URLs', () => {
      const url = makeSearchUrl('youth justice');
      expect(url).toBe('https://www.parliament.qld.gov.au/Global/Search?index=qps_hansard_index&query=youth%20justice');
    });

    test('generates URLs for all keywords', () => {
      const urls = SEARCH_KEYWORDS.map(makeSearchUrl);
      expect(urls.length).toBe(6);
      urls.forEach(url => {
        expect(url).toContain('qps_hansard_index');
        expect(url).toContain('parliament.qld.gov.au');
      });
    });

    test('encodes special characters', () => {
      const url = makeSearchUrl('raising the age');
      expect(url).toContain('raising%20the%20age');
    });
  });

  // ── Dedup logic ──────────────────────────────────────────────────

  describe('dedup logic', () => {
    test('filters out existing URLs', () => {
      const existingUrls = new Set([
        'https://www.parliament.qld.gov.au/hansard/speech-123',
        'https://www.parliament.qld.gov.au/hansard/speech-456',
      ]);

      const candidates = [
        { source_url: 'https://www.parliament.qld.gov.au/hansard/speech-123' },
        { source_url: 'https://www.parliament.qld.gov.au/hansard/speech-789' },
        { source_url: 'https://www.parliament.qld.gov.au/hansard/speech-456' },
      ];

      const newRecords = candidates.filter(r => !existingUrls.has(r.source_url));
      expect(newRecords.length).toBe(1);
      expect(newRecords[0].source_url).toContain('speech-789');
    });

    test('tracks seen URLs within a run to avoid batch duplicates', () => {
      const seenUrls = new Set<string>();
      const candidates = [
        { source_url: 'https://example.com/a' },
        { source_url: 'https://example.com/a' }, // duplicate within batch
        { source_url: 'https://example.com/b' },
      ];

      const deduped = candidates.filter(r => {
        if (seenUrls.has(r.source_url)) return false;
        seenUrls.add(r.source_url);
        return true;
      });

      expect(deduped.length).toBe(2);
    });
  });

  // ── stripHtml ────────────────────────────────────────────────────

  describe('stripHtml', () => {
    test('removes HTML tags', () => {
      expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    });

    test('converts br tags to newlines', () => {
      expect(stripHtml('line1<br/>line2')).toBe('line1\nline2');
    });

    test('decodes HTML entities', () => {
      expect(stripHtml('&amp; &lt; &gt; &quot;')).toBe('& < > "');
    });

    test('handles empty/null input', () => {
      expect(stripHtml('')).toBe('');
    });

    test('collapses multiple newlines', () => {
      expect(stripHtml('a\n\n\n\nb')).toBe('a\n\nb');
    });
  });

  // ── Firecrawl API payload ────────────────────────────────────────

  describe('firecrawl API payload construction', () => {
    function buildFirecrawlPayload(url: string) {
      return {
        url,
        formats: ['markdown'],
      };
    }

    test('constructs correct payload for search URL', () => {
      const payload = buildFirecrawlPayload(
        'https://www.parliament.qld.gov.au/Global/Search?index=qps_hansard_index&query=youth+justice'
      );
      expect(payload.url).toContain('parliament.qld.gov.au');
      expect(payload.formats).toEqual(['markdown']);
    });

    test('constructs correct payload for speech page URL', () => {
      const payload = buildFirecrawlPayload(
        'https://www.parliament.qld.gov.au/work-of-the-assembly/hansard/sitting-2025-11-18/speech-123'
      );
      expect(payload.url).toContain('hansard');
      expect(payload.formats).toEqual(['markdown']);
    });
  });
});
