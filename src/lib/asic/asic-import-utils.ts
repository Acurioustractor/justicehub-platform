/**
 * ASIC Directors Import Utilities
 *
 * Pure functions for parsing ASIC CSV data, normalizing ABNs,
 * building payloads, and detecting board overlaps.
 *
 * Used by: scripts/import-asic-directors.mjs
 * Tested by: src/__tests__/scripts/import-asic-directors.test.ts
 */

// ── Types ──────────────────────────────────────────────────

export interface ParsedCompany {
  abn: string;
  name: string;
  status: string;
  type: string;
}

export interface ParsedOfficer {
  abn: string;
  name: string;
  role: string;
  appointed: string | null;
}

export interface AsicDirectorsPayload {
  asic_directors: {
    officers: Array<{ name: string; role: string; appointed: string | null }>;
    company_status: string;
    company_type: string;
    updated_at: string;
  };
}

export interface BoardOverlap {
  person: string;
  orgs: Array<{ name: string; role: string }>;
  overlap_type: 'board_interlock';
}

// ── ABN normalization ──────────────────────────────────────

export function normalizeABN(raw: unknown): string | null {
  if (raw == null || raw === '') return null;

  const str = String(raw).replace(/\s+/g, '').trim();
  if (str.length === 0) return null;

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(str)) return null;

  return str;
}

// ── CSV row parsers ────────────────────────────────────────

/**
 * Get a field value from a row, trying multiple possible column names.
 * ASIC CSVs sometimes use different casing or underscore vs space.
 */
function getField(row: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key];
  }
  // Try case-insensitive match
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const match = rowKeys.find((k) => k.toLowerCase() === lower);
    if (match && row[match] !== undefined) return row[match];
  }
  return '';
}

export function parseCompanyRow(
  row: Record<string, string>
): ParsedCompany | null {
  const rawABN = getField(row, 'ABN', 'abn');
  const abn = normalizeABN(rawABN);
  if (!abn) return null;

  const name = getField(row, 'Company Name', 'company_name').trim();
  const status = getField(row, 'Company Status', 'company_status').trim();
  const type = getField(row, 'Company Type', 'company_type').trim();

  return { abn, name, status, type };
}

/**
 * Parse an officer/director row from ASIC CSV.
 * Names come as "SURNAME, First Middle" and are converted to "First Middle Surname".
 */
export function parseOfficerRow(
  row: Record<string, string>
): ParsedOfficer | null {
  const rawABN = getField(row, 'ABN', 'abn');
  const abn = normalizeABN(rawABN);
  if (!abn) return null;

  const rawName = getField(row, 'Officer Name', 'officer_name', 'Name').trim();
  if (!rawName) return null;

  // Normalize name: "SURNAME, First" -> "First Surname"
  const name = normalizeName(rawName);
  if (!name) return null;

  const role = getField(row, 'Officer Role', 'officer_role', 'Role').trim() || 'Director';

  // Parse date: DD/MM/YYYY -> YYYY-MM-DD
  const rawDate = getField(row, 'Date Appointed', 'date_appointed', 'Appointment Date');
  const appointed = parseDate(rawDate);

  return { abn, name, role, appointed };
}

function normalizeName(raw: string): string {
  if (!raw) return '';

  // Handle "SURNAME, First Middle" format
  if (raw.includes(',')) {
    const [surname, ...rest] = raw.split(',');
    const first = rest.join(',').trim();
    if (first && surname) {
      // Title-case the surname (SMITH -> Smith)
      const titleSurname = titleCase(surname.trim());
      return `${first} ${titleSurname}`;
    }
  }

  // Already in "First Last" format
  return raw;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null;

  const trimmed = raw.trim();

  // DD/MM/YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  return null;
}

// ── Payload builder ────────────────────────────────────────

export function buildAsicDirectorsPayload(
  officers: ParsedOfficer[],
  company: ParsedCompany
): AsicDirectorsPayload {
  // Deduplicate by name+role
  const seen = new Set<string>();
  const uniqueOfficers: Array<{ name: string; role: string; appointed: string | null }> = [];

  for (const officer of officers) {
    const key = `${officer.name.toLowerCase()}|${officer.role.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueOfficers.push({
      name: officer.name,
      role: officer.role,
      appointed: officer.appointed,
    });
  }

  return {
    asic_directors: {
      officers: uniqueOfficers,
      company_status: company.status,
      company_type: company.type,
      updated_at: new Date().toISOString().split('T')[0],
    },
  };
}

// ── Board overlap detection ────────────────────────────────

export function detectBoardOverlaps(
  orgDirectors: Map<string, { orgName: string; officers: Array<{ name: string; role: string }> }>
): BoardOverlap[] {
  // Build person -> orgs map (case-insensitive)
  const personOrgs = new Map<string, Array<{ orgId: string; orgName: string; role: string; originalName: string }>>();

  for (const [orgId, { orgName, officers }] of orgDirectors) {
    for (const officer of officers) {
      const normalizedName = officer.name.toLowerCase().trim();
      if (!normalizedName) continue;

      if (!personOrgs.has(normalizedName)) {
        personOrgs.set(normalizedName, []);
      }
      personOrgs.get(normalizedName)!.push({
        orgId,
        orgName,
        role: officer.role,
        originalName: officer.name,
      });
    }
  }

  // Find overlaps (2+ orgs)
  const overlaps: BoardOverlap[] = [];

  for (const [, entries] of personOrgs) {
    // Deduplicate by orgId
    const uniqueOrgs = new Map<string, { name: string; role: string }>();
    for (const entry of entries) {
      if (!uniqueOrgs.has(entry.orgId)) {
        uniqueOrgs.set(entry.orgId, { name: entry.orgName, role: entry.role });
      }
    }

    if (uniqueOrgs.size >= 2) {
      // Use the first original name for display
      const displayName = entries[0].originalName;
      overlaps.push({
        person: displayName,
        orgs: Array.from(uniqueOrgs.values()),
        overlap_type: 'board_interlock',
      });
    }
  }

  return overlaps;
}

// ── Dedup / skip logic ─────────────────────────────────────

const SKIP_THRESHOLD_DAYS = 7;

export function shouldSkipImport(acncData: unknown): boolean {
  if (!acncData || typeof acncData !== 'object') return false;

  const data = acncData as Record<string, unknown>;
  if (!data.asic_directors || typeof data.asic_directors !== 'object') return false;

  const asic = data.asic_directors as Record<string, unknown>;
  if (!asic.updated_at || typeof asic.updated_at !== 'string') return false;

  const updatedAt = new Date(asic.updated_at);
  if (isNaN(updatedAt.getTime())) return false;

  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate < SKIP_THRESHOLD_DAYS;
}
