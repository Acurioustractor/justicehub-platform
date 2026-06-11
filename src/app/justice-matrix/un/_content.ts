import path from 'path';
import { readFile } from 'fs/promises';

export const unPackPages = [
  {
    slug: 'status-brief',
    title: 'Justice Matrix: the engine already runs',
    description:
      'Status brief for the NJP / OHCHR Justice Matrix conversation, showing what the paper asks for and what JusticeHub already runs.',
    downloadHref: '/docs/justice-matrix/un/njp-ohchr-matrix-status-brief.md',
  },
  {
    slug: 'ui-plan',
    title: 'Justice Matrix: UI gap list and design plan',
    description:
      'UI gap list, reviewer queue plan, practitioner experience priorities, and scraping lessons from the NJP / OHCHR matrix work.',
    downloadHref: '/docs/justice-matrix/un/njp-ohchr-matrix-ui-plan.md',
  },
] as const;

export const unPackDownloads = [
  {
    label: 'Background paper',
    description: 'Original Justice Matrix background paper for the NJP / OHCHR conversation.',
    href: '/docs/justice-matrix/un/justice-matrix-background-paper.docx',
    format: 'DOCX',
  },
  {
    label: 'Strategic refugee and asylum cases matrix',
    description: 'Source spreadsheet of strategic refugee and asylum cases.',
    href: '/docs/justice-matrix/un/strategic-refugee-asylum-cases-matrix.xlsx',
    format: 'XLSX',
  },
  {
    label: 'Advocacy campaigns matrix',
    description: 'Source spreadsheet of refugee and asylum advocacy campaigns.',
    href: '/docs/justice-matrix/un/advocacy-campaigns-refugees-asylum-seekers-matrix.xlsx',
    format: 'XLSX',
  },
  {
    label: 'Status brief markdown',
    description: 'Raw markdown for the status brief.',
    href: '/docs/justice-matrix/un/njp-ohchr-matrix-status-brief.md',
    format: 'MD',
  },
  {
    label: 'UI plan markdown',
    description: 'Raw markdown for the UI plan.',
    href: '/docs/justice-matrix/un/njp-ohchr-matrix-ui-plan.md',
    format: 'MD',
  },
] as const;

export type UnPackPageSlug = (typeof unPackPages)[number]['slug'];

export function getUnPackPage(slug: string) {
  return unPackPages.find((page) => page.slug === slug);
}

export async function readUnPackMarkdown(slug: UnPackPageSlug) {
  const page = getUnPackPage(slug);
  if (!page) return null;

  return readFile(path.join(process.cwd(), 'public', page.downloadHref.replace(/^\//, '')), 'utf8');
}
