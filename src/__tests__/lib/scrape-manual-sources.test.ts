/**
 * Tests for scrape-manual-sources utilities
 *
 * Tests the pure functions used by the manual sources scraper:
 * - Content hashing for dedup
 * - HTML link extraction
 * - Source configuration
 * - CLI arg parsing (dry-run vs apply)
 * - Funding record normalization
 * - Finding record building
 */

import {
  contentHash,
  extractDownloadLinks,
  parseArgs,
  parseFundingAmount,
  buildFinding,
  SOURCE_CONFIGS,
} from '@/lib/scraping/manual-sources-utils';

describe('scrape-manual-sources utilities', () => {
  describe('contentHash', () => {
    it('should produce a consistent 16-char hex hash', () => {
      const hash = contentHash('AIHW Youth Justice 2025', 'https://example.com/data.xlsx');
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
      // Same input => same output
      expect(contentHash('AIHW Youth Justice 2025', 'https://example.com/data.xlsx')).toBe(hash);
    });

    it('should produce different hashes for different inputs', () => {
      const h1 = contentHash('Dataset A', 'https://a.com');
      const h2 = contentHash('Dataset B', 'https://b.com');
      expect(h1).not.toBe(h2);
    });

    it('should produce different hashes when only URL differs', () => {
      const h1 = contentHash('Same Title', 'https://a.com');
      const h2 = contentHash('Same Title', 'https://b.com');
      expect(h1).not.toBe(h2);
    });
  });

  describe('extractDownloadLinks', () => {
    it('should extract xlsx links from HTML', () => {
      const html = `
        <div>
          <a href="/data/tables/table-1.xlsx">Table 1: Youth detention</a>
          <a href="/data/tables/table-2.xlsx">Table 2: Community supervision</a>
          <a href="/about">About page</a>
        </div>
      `;
      const links = extractDownloadLinks(html, 'https://www.aihw.gov.au');
      expect(links).toHaveLength(2);
      expect(links[0].url).toBe('https://www.aihw.gov.au/data/tables/table-1.xlsx');
      expect(links[0].label).toBe('Table 1: Youth detention');
      expect(links[1].url).toBe('https://www.aihw.gov.au/data/tables/table-2.xlsx');
    });

    it('should handle absolute URLs in href', () => {
      const html = `<a href="https://cdn.example.com/file.csv">CSV Data</a>`;
      const links = extractDownloadLinks(html, 'https://www.aihw.gov.au');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe('https://cdn.example.com/file.csv');
    });

    it('should extract csv, xls, xlsx, zip extensions', () => {
      const html = `
        <a href="/a.csv">CSV</a>
        <a href="/b.xls">XLS</a>
        <a href="/c.xlsx">XLSX</a>
        <a href="/d.zip">ZIP</a>
        <a href="/e.pdf">PDF</a>
        <a href="/f.html">HTML</a>
      `;
      const links = extractDownloadLinks(html, 'https://example.com');
      expect(links).toHaveLength(4);
      expect(links.map((l) => l.label)).toEqual(['CSV', 'XLS', 'XLSX', 'ZIP']);
    });

    it('should return empty array for HTML with no download links', () => {
      const html = `<p>No downloads here</p>`;
      expect(extractDownloadLinks(html, 'https://example.com')).toEqual([]);
    });

    it('should strip nested HTML from labels', () => {
      const html = `<a href="/data.xlsx"><span class="icon">X</span> <strong>Big Dataset</strong></a>`;
      const links = extractDownloadLinks(html, 'https://example.com');
      expect(links).toHaveLength(1);
      expect(links[0].label).toMatch(/Big Dataset/);
    });

    it('should support custom extensions filter', () => {
      const html = `
        <a href="/a.pdf">PDF</a>
        <a href="/b.csv">CSV</a>
      `;
      const links = extractDownloadLinks(html, 'https://example.com', ['.pdf']);
      expect(links).toHaveLength(1);
      expect(links[0].label).toBe('PDF');
    });
  });

  describe('parseArgs', () => {
    it('should default to "all" source and dry-run mode', () => {
      const result = parseArgs(['node', 'script.mjs']);
      expect(result.source).toBe('all');
      expect(result.dryRun).toBe(true);
    });

    it('should parse a specific source', () => {
      const result = parseArgs(['node', 'script.mjs', 'aihw-yj']);
      expect(result.source).toBe('aihw-yj');
      expect(result.dryRun).toBe(true);
    });

    it('should detect --apply flag', () => {
      const result = parseArgs(['node', 'script.mjs', 'bocsar', '--apply']);
      expect(result.source).toBe('bocsar');
      expect(result.dryRun).toBe(false);
    });

    it('should handle --apply as the only arg after script name', () => {
      const result = parseArgs(['node', 'script.mjs', '--apply']);
      expect(result.source).toBe('all');
      expect(result.dryRun).toBe(false);
    });
  });

  describe('parseFundingAmount', () => {
    it('should parse dollar amounts with commas', () => {
      expect(parseFundingAmount('$1,234,567')).toBe(1234567);
    });

    it('should parse plain numbers', () => {
      expect(parseFundingAmount('50000')).toBe(50000);
    });

    it('should parse amounts with decimal places', () => {
      expect(parseFundingAmount('$1,234.56')).toBe(1234.56);
    });

    it('should return null for empty input', () => {
      expect(parseFundingAmount('')).toBeNull();
    });

    it('should return null for non-numeric input', () => {
      expect(parseFundingAmount('N/A')).toBeNull();
    });
  });

  describe('buildFinding', () => {
    it('should produce a valid finding record', () => {
      const finding = buildFinding(
        'AIHW Youth Detention 2024-25',
        'https://aihw.gov.au/data/table1.xlsx',
        { dataset: 'detention', year: '2024-25', tables_found: ['Table 1', 'Table 2'] },
        'AIHW'
      );

      expect(finding.finding_type).toBe('external_source');
      expect(finding.content.title).toBe('AIHW Youth Detention 2024-25');
      expect(finding.content.source).toBe('AIHW');
      expect(finding.content.hash).toHaveLength(16);
      expect(finding.content.dataset).toBe('detention');
      expect(finding.sources).toEqual(['https://aihw.gov.au/data/table1.xlsx']);
      expect(finding.confidence).toBe(0.85);
      expect(finding.validated).toBe(true);
      expect(finding.validation_source).toBe('manual_sources_scraper');
    });

    it('should truncate title to 500 chars', () => {
      const longTitle = 'A'.repeat(600);
      const finding = buildFinding(longTitle, 'https://example.com', {}, 'test');
      expect((finding.content.title as string).length).toBe(500);
    });
  });

  describe('SOURCE_CONFIGS', () => {
    it('should define all 5 required sources', () => {
      expect(Object.keys(SOURCE_CONFIGS)).toEqual(
        expect.arrayContaining(['aihw-yj', 'aihw-cp', 'bocsar', 'rogs', 'grantconnect'])
      );
      expect(Object.keys(SOURCE_CONFIGS)).toHaveLength(5);
    });

    it('each source should have label, urls, and targetTable', () => {
      for (const [, config] of Object.entries(SOURCE_CONFIGS)) {
        expect(config.label).toBeTruthy();
        expect(config.urls.length).toBeGreaterThan(0);
        expect(config.targetTable).toMatch(/^(alma_research_findings|justice_funding)$/);
      }
    });

    it('grantconnect should target justice_funding', () => {
      expect(SOURCE_CONFIGS.grantconnect.targetTable).toBe('justice_funding');
    });

    it('all others should target alma_research_findings', () => {
      for (const key of ['aihw-yj', 'aihw-cp', 'bocsar', 'rogs']) {
        expect(SOURCE_CONFIGS[key].targetTable).toBe('alma_research_findings');
      }
    });
  });
});
