/**
 * Utility functions for the manual sources scraper.
 * Extracted for testability.
 */

import { createHash } from 'crypto';

/** Generate a content hash for deduplication */
export function contentHash(title: string, sourceUrl: string): string {
  return createHash('sha256')
    .update(`${title}|${sourceUrl}`)
    .digest('hex')
    .substring(0, 16);
}

/** Extract download links from HTML */
export function extractDownloadLinks(
  html: string,
  baseUrl: string,
  extensions: string[] = ['.xlsx', '.xls', '.csv', '.zip']
): Array<{ url: string; label: string }> {
  const links: Array<{ url: string; label: string }> = [];
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const labelRaw = match[2].replace(/<[^>]+>/g, '').trim();
    const lowerHref = href.toLowerCase();
    if (extensions.some((ext) => lowerHref.endsWith(ext))) {
      const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
      links.push({ url: fullUrl, label: labelRaw || fullUrl.split('/').pop() || 'unknown' });
    }
  }
  return links;
}

/** Parse CLI args for source selection and flags */
export function parseArgs(argv: string[]): { source: string; dryRun: boolean } {
  const positionalArgs = argv.slice(2).filter((a) => !a.startsWith('--'));
  const source = positionalArgs[0] || 'all';
  const dryRun = !argv.includes('--apply');
  return { source, dryRun };
}

/** Normalize a funding amount string to a number */
export function parseFundingAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Build a research finding record */
export function buildFinding(
  title: string,
  sourceUrl: string,
  data: Record<string, unknown>,
  source: string
) {
  return {
    finding_type: 'external_source' as const,
    content: {
      title: title.substring(0, 500),
      source,
      hash: contentHash(title, sourceUrl),
      ...data,
    },
    sources: [sourceUrl],
    confidence: 0.85,
    validated: true,
    validation_source: 'manual_sources_scraper',
  };
}

/** Available source configurations */
export const SOURCE_CONFIGS: Record<
  string,
  { label: string; urls: string[]; targetTable: string }
> = {
  'aihw-yj': {
    label: 'AIHW Youth Justice',
    urls: ['https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia/data'],
    targetTable: 'alma_research_findings',
  },
  'aihw-cp': {
    label: 'AIHW Child Protection',
    urls: ['https://www.aihw.gov.au/reports/child-protection/child-protection-australia/data'],
    targetTable: 'alma_research_findings',
  },
  bocsar: {
    label: 'NSW BOCSAR Reoffending',
    urls: [
      'https://bocsar.nsw.gov.au/topic-areas/re-offending.html',
      'https://www.bocsar.nsw.gov.au/Pages/bocsar_datasets/Datasets-.aspx',
    ],
    targetTable: 'alma_research_findings',
  },
  rogs: {
    label: 'Productivity Commission ROGS',
    urls: [
      'https://www.pc.gov.au/ongoing/report-on-government-services/2026/community-services/youth-justice',
    ],
    targetTable: 'alma_research_findings',
  },
  grantconnect: {
    label: 'GrantConnect',
    urls: ['https://data.gov.au/data/api/3/action/package_search?q=grantconnect&rows=20'],
    targetTable: 'justice_funding',
  },
};
