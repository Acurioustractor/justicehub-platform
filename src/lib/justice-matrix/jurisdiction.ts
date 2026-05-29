/**
 * Bucket a free-text Justice Matrix jurisdiction / region string into a stable
 * region (+ optional sub-region) for the explore "Jurisdiction" browser and
 * facet rail. Jurisdictions are unstructured text ("New South Wales, Australia",
 * "European Court of Human Rights", "9th Cir.", "United Kingdom Upper Tribunal
 * (Immigration and Asylum Chamber)"), so this is heuristic, not a geocoder.
 *
 * Pure + side-effect free → safe to unit test and to run on the client.
 */

export interface JurisdictionBucket {
  /** Top-level region, e.g. 'Australia', 'United States', 'Europe'. */
  region: string;
  /** Optional sub-region, e.g. a state or circuit; null when not applicable. */
  sub: string | null;
}

// Australian states/territories. Order matters: more specific patterns first so
// "South Australia, Australia" resolves to the state, not 'National'.
const AU_STATES: Array<[RegExp, string]> = [
  [/new south wales|\bnsw\b/i, 'New South Wales'],
  [/\bvictoria\b|\bvic\b/i, 'Victoria'],
  [/queensland|\bqld\b/i, 'Queensland'],
  [/western australia|\bwa\b/i, 'Western Australia'],
  [/south australia|\bsa\b/i, 'South Australia'],
  [/tasmania|\btas\b/i, 'Tasmania'],
  [/northern territory|\bnt\b/i, 'Northern Territory'],
  [/australian capital territory|\bact\b/i, 'ACT'],
];

// Display order for regions in the browser (everything else trails alphabetically).
export const REGION_ORDER = [
  'Australia',
  'United States',
  'United Kingdom',
  'Europe',
  'Canada',
  'New Zealand',
  'South Africa',
  'International bodies',
  'Other',
];

export function bucketJurisdiction(raw: string | null | undefined): JurisdictionBucket {
  const t = (raw ?? '').trim();
  if (!t) return { region: 'Other', sub: null };

  // Australia (incl. states + High Court). Check before generic country matches.
  if (/australia/i.test(t)) {
    for (const [re, name] of AU_STATES) if (re.test(t)) return { region: 'Australia', sub: name };
    return { region: 'Australia', sub: 'National' };
  }

  // United States — capture circuit / district when present.
  if (/united states|\bu\.?s\.?a?\b|montana|\bcir\.?\b|circuit|d\.d\.c/i.test(t)) {
    const circuit = t.match(/(\d+)\s*(?:st|nd|rd|th)?\s*cir/i);
    if (circuit) return { region: 'United States', sub: `${circuit[1]}th Circuit` };
    if (/d\.d\.c/i.test(t)) return { region: 'United States', sub: 'D.D.C.' };
    return { region: 'United States', sub: null };
  }

  // United Kingdom (incl. its immigration/asylum tribunals).
  if (/united kingdom|\buk\b|upper tribunal|\bengland\b|britain/i.test(t)) {
    return { region: 'United Kingdom', sub: null };
  }

  // Europe — regional courts + European nation-state cases.
  if (/european court of human rights|\bechr\b|european union|\bcjeu\b|\beu\b/i.test(t)) {
    if (/european union|\bcjeu\b/i.test(t)) return { region: 'Europe', sub: 'EU / CJEU' };
    return { region: 'Europe', sub: 'ECtHR' };
  }
  if (/malta|macedonia|hungary|\bitaly\b|france|douai|moldova|greece|belgium|romania|ukraine|slovenia|austria/i.test(t)) {
    return { region: 'Europe', sub: t };
  }

  if (/south africa/i.test(t)) return { region: 'South Africa', sub: null };
  if (/\bcanada\b/i.test(t)) return { region: 'Canada', sub: null };
  if (/new zealand/i.test(t)) return { region: 'New Zealand', sub: null };
  if (/united nations|\bun\b/i.test(t)) return { region: 'International bodies', sub: 'United Nations' };

  return { region: 'Other', sub: t };
}

/** Sort comparator for region names using REGION_ORDER, then alphabetical. */
export function compareRegions(a: string, b: string): number {
  const ia = REGION_ORDER.indexOf(a);
  const ib = REGION_ORDER.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
}
