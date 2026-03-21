/**
 * Pure utility functions for Australian government API enrichment.
 *
 * Used by scripts/enrich-from-apis.mjs for:
 * - ABR ABN validation (XML parsing)
 * - ABS SEIFA disadvantage scores
 * - OpenSanctions PEP screening (fuzzy name matching)
 * - JSONB merge construction for Supabase updates
 */

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface AbrParsed {
  status: string;
  entityType: string;
  mainName: string;
  tradingName: string | null;
  state: string;
  postcode: string;
  gst: boolean;
}

export interface AbrValidation {
  abr_validation: {
    status: string;
    entity_type: string;
    state: string;
    postcode: string;
    gst: boolean;
    validated_at: string;
  };
}

export interface SeifaInput {
  irsdScore: number;
  irsdDecile: number;
  lga: string;
  lgaCode: string;
}

export interface SeifaData {
  seifa: {
    irsd_score: number;
    irsd_decile: number;
    lga: string;
    lga_code: string;
    year: number;
  };
}

export interface PepMatch {
  person: string;
  pep_role: string;
  confidence: number;
}

export interface PepScreening {
  pep_screening: {
    matches: PepMatch[];
    screened_at: string;
    pep_count: number;
  };
}

// ────────────────────────────────────────────────────────────────
// ABR XML Parsing
// ────────────────────────────────────────────────────────────────

/**
 * Extract a single XML tag value using regex.
 * Returns null if tag not found.
 */
function xmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 's'));
  return match ? match[1].trim() : null;
}

/**
 * Extract a tag value within a specific parent context.
 */
function xmlTagIn(xml: string, parent: string, tag: string): string | null {
  const parentMatch = xml.match(
    new RegExp(`<${parent}[^>]*>([\\s\\S]*?)</${parent}>`, 's')
  );
  if (!parentMatch) return null;
  return xmlTag(parentMatch[1], tag);
}

/**
 * Parse ABR XML response into structured data.
 * Returns null if the XML is not a valid ABR response.
 */
export function parseAbrXml(xml: string): AbrParsed | null {
  if (!xml || !xml.includes('businessEntity')) return null;

  const status = xmlTagIn(xml, 'entityStatus', 'entityStatusCode');
  if (!status) return null;

  const entityType =
    xmlTagIn(xml, 'entityType', 'entityDescription') || 'Unknown';

  // mainName > organisationName
  const mainName = xmlTagIn(xml, 'mainName', 'organisationName') || 'Unknown';

  // mainTradingName > organisationName (optional)
  const tradingName =
    xmlTagIn(xml, 'mainTradingName', 'organisationName') || null;

  // Physical address
  const state =
    xmlTagIn(xml, 'mainBusinessPhysicalAddress', 'stateCode') || '';
  const postcode =
    xmlTagIn(xml, 'mainBusinessPhysicalAddress', 'postcode') || '';

  // GST: presence of goodsAndServicesTax element with effectiveFrom means registered
  const gst = xml.includes('<goodsAndServicesTax>');

  return { status, entityType, mainName, tradingName, state, postcode, gst };
}

/**
 * Build the JSONB structure for ABR validation data.
 */
export function buildAbrValidation(parsed: AbrParsed): AbrValidation {
  return {
    abr_validation: {
      status: parsed.status,
      entity_type: parsed.entityType,
      state: parsed.state,
      postcode: parsed.postcode,
      gst: parsed.gst,
      validated_at: new Date().toISOString().split('T')[0],
    },
  };
}

// ────────────────────────────────────────────────────────────────
// SEIFA
// ────────────────────────────────────────────────────────────────

/**
 * Build the JSONB structure for SEIFA data.
 */
export function buildSeifaData(input: SeifaInput): SeifaData {
  return {
    seifa: {
      irsd_score: input.irsdScore,
      irsd_decile: input.irsdDecile,
      lga: input.lga,
      lga_code: input.lgaCode,
      year: 2021,
    },
  };
}

/**
 * Extract a postcode from an organization record's acnc_data.
 * Checks multiple locations where postcode might be stored.
 */
export function extractPostcode(org: {
  acnc_data: Record<string, unknown> | null;
}): string | null {
  const data = org.acnc_data;
  if (!data) return null;

  // Check abr_validation.postcode first (most reliable)
  const abrVal = data.abr_validation as Record<string, unknown> | undefined;
  if (abrVal?.postcode && typeof abrVal.postcode === 'string') {
    return abrVal.postcode;
  }

  // Check direct postcode field
  if (data.postcode && typeof data.postcode === 'string') {
    return data.postcode;
  }

  // Try to extract from address string
  if (data.address && typeof data.address === 'string') {
    const match = (data.address as string).match(/\b(\d{4})\b/);
    if (match) return match[1];
  }

  return null;
}

// ────────────────────────────────────────────────────────────────
// Fuzzy Name Matching (for PEP screening)
// ────────────────────────────────────────────────────────────────

/**
 * Normalize a person name for comparison.
 */
function normalizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[,.'"-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Fuzzy match two person names. Returns a confidence score 0-1.
 *
 * Handles:
 * - Case insensitivity
 * - Name order reversal (e.g. "Smith, John" vs "John Smith")
 * - Middle names
 */
export function fuzzyNameMatch(nameA: string, nameB: string): number {
  if (!nameA || !nameB) return 0;

  const tokensA = normalizeName(nameA);
  const tokensB = normalizeName(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // Count matching tokens (order-independent)
  const setB = new Set(tokensB);
  let matches = 0;
  for (const token of tokensA) {
    if (setB.has(token)) matches++;
  }

  // Score: proportion of tokens matched relative to the larger set
  const maxTokens = Math.max(tokensA.length, tokensB.length);
  const minTokens = Math.min(tokensA.length, tokensB.length);

  // If all tokens of the shorter name match, weight more heavily
  const matchRatio = matches / maxTokens;
  const coverageBonus = matches >= minTokens ? 0.1 : 0;

  return Math.min(1.0, matchRatio + coverageBonus);
}

// ────────────────────────────────────────────────────────────────
// PEP Screening
// ────────────────────────────────────────────────────────────────

/**
 * Build the JSONB structure for PEP screening results.
 */
export function buildPepScreening(matches: PepMatch[]): PepScreening {
  return {
    pep_screening: {
      matches,
      screened_at: new Date().toISOString().split('T')[0],
      pep_count: matches.length,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// JSONB Merge
// ────────────────────────────────────────────────────────────────

/**
 * Merge new enrichment data into existing acnc_data JSONB.
 * Equivalent to: COALESCE(acnc_data, '{}'::jsonb) || new_data
 */
export function buildJsonbMerge(
  existing: Record<string, unknown> | null | undefined,
  newData: Record<string, unknown>
): Record<string, unknown> {
  const base = existing ?? {};
  return { ...base, ...newData };
}
