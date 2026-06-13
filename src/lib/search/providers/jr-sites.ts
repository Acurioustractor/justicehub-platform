/**
 * Justice Reinvestment Sites Search Provider
 *
 * Cross-site search over the curated JR network layer (sites.json +
 * site-research.json). One searchable document per site, so a query for a
 * place, a program, a person, or a metric all resolve to the site that holds
 * them. Reads the committed JSON layer in memory (34 sites) rather than the
 * database, so it is fast and needs no migration. The jr_sites registry table
 * (Phase 3) will replace this source once sites become owned and editable.
 */

import {
  loadJusticeReinvestmentSites,
  loadJrResearchIndex,
  type JrSite,
  type JrResearchRecord,
} from '@/lib/communities/justice-reinvestment';
import type { SearchProvider, SearchResult, JusticeSearchContext } from '../types';

/** A field of a site that a query can match, carried so we can explain the hit. */
interface SearchableField {
  /** Short label shown to explain why a site matched, e.g. "Program". */
  label: string;
  text: string;
}

interface JrSearchDoc {
  site: JrSite;
  research: JrResearchRecord | null;
  fields: SearchableField[];
  outcomeCount: number;
}

let DOCS: JrSearchDoc[] | null = null;

/** Build the in-memory searchable documents once per process. */
function buildDocs(): JrSearchDoc[] {
  const sites = loadJusticeReinvestmentSites();
  const research = loadJrResearchIndex();

  return sites.map((site) => {
    const r = research.get(site.matchName.trim().toLowerCase()) ?? null;
    const fields: SearchableField[] = [
      { label: 'Site', text: site.displayName },
      { label: 'Place', text: [site.town, site.state].filter(Boolean).join(' ') },
      { label: 'Lead organisation', text: site.org },
      { label: 'About', text: r?.oneLine ?? site.blurb ?? '' },
    ];
    for (const p of r?.programs ?? []) fields.push({ label: 'Program', text: p });
    for (const person of r?.people ?? []) fields.push({ label: 'Person', text: `${person.name} ${person.role}` });
    for (const m of r?.impactMetrics ?? []) fields.push({ label: 'Metric', text: `${m.metric} ${m.value}` });
    for (const partner of r?.partners ?? []) fields.push({ label: 'Partner', text: partner });

    const outcomeCount = (r?.impactMetrics ?? []).filter((m) => m.metricClass === 'outcome').length;
    return { site, research: r, fields, outcomeCount };
  });
}

function docs(): JrSearchDoc[] {
  if (!DOCS) DOCS = buildDocs();
  return DOCS;
}

/**
 * Score a site against the query. Site-name and place matches rank highest;
 * a match on a program, person, or metric still surfaces the site, lower.
 */
function scoreDoc(term: string, doc: JrSearchDoc): { score: number; highlights: string[] } {
  const words = term.split(/\s+/).filter(Boolean);
  let score = 0;
  const highlights: string[] = [];

  for (const field of doc.fields) {
    const text = field.text.toLowerCase();
    if (!text) continue;

    let fieldScore = 0;
    if (text === term) fieldScore = 1.0;
    else if (text.startsWith(term)) fieldScore = 0.8;
    else if (text.includes(term)) fieldScore = 0.6;
    else {
      const matched = words.filter((w) => text.includes(w));
      if (matched.length > 0) fieldScore = (matched.length / words.length) * 0.4;
    }
    if (fieldScore === 0) continue;

    // Weight by field kind: identity fields beat secondary fields.
    const weight =
      field.label === 'Site' ? 1 : field.label === 'Place' || field.label === 'Lead organisation' ? 0.85 : 0.6;
    const weighted = fieldScore * weight;
    if (weighted > score) score = weighted;

    if (field.label !== 'Site' && field.label !== 'About' && highlights.length < 3) {
      highlights.push(`${field.label}: ${field.text}`);
    }
  }

  return { score: Math.min(score, 1), highlights };
}

export const jrSitesSearchProvider: SearchProvider = {
  name: 'jr-sites',

  async isAvailable() {
    try {
      return docs().length > 0;
    } catch {
      return false;
    }
  },

  async search(query: string, context?: JusticeSearchContext): Promise<SearchResult[]> {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    const limit = context?.limit ?? 10;
    const stateFilter = context?.state;

    const results: SearchResult[] = [];
    for (const doc of docs()) {
      if (stateFilter && (doc.site.state || '').toUpperCase() !== stateFilter.toUpperCase()) continue;

      const { score, highlights } = scoreDoc(term, doc);
      if (score <= 0) continue;

      const { site, research } = doc;
      results.push({
        id: site.siteSlug,
        type: 'site',
        title: site.displayName,
        description: research?.oneLine ?? site.blurb ?? undefined,
        url: `/communities/justice-reinvestment/${site.siteSlug}`,
        score,
        source: { name: 'justicehub', table: 'site-research.json' },
        metadata: {
          state: site.state || undefined,
          organizationName: site.org || undefined,
          imageUrl: research?.logoUrl ?? site.logoUrl ?? undefined,
          category: research?.dataQuality ?? undefined,
          outcomeCount: doc.outcomeCount,
          programCount: (research?.programs ?? []).length,
          peopleCount: (research?.people ?? []).length,
          town: site.town || undefined,
        },
        highlights,
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  },
};
