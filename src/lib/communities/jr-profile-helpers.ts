/**
 * Pure, dependency-free helpers shared by the Justice Reinvestment admin
 * surfaces: the server page, the create-from-connection API route, and the
 * client JrLocationsPanel. No server-only imports here so the client bundle can
 * use the same slug logic the server writes with.
 */

/** Matches a valid kebab-case slug. */
export const PROFILE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Same slug convention as lib/organizations/claim-service.ts. */
export function slugifyBase(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'organization'
  );
}

/** Drop editorial parentheticals so the name reads as the registered entity. */
export function cleanOrgName(raw: string): string {
  return raw
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip removable legal suffixes for a cleaner, dedupe-friendly slug. */
export function suggestProfileSlug(name: string): string {
  const stripped = cleanOrgName(name)
    .replace(/\b(?:inc|incorporated|ltd|limited|pty)\b/gi, ' ')
    .replace(/^the\s+/i, ' ');
  return slugifyBase(stripped);
}

/**
 * Stable, namespaced tag that links a created organisation back to its curated
 * JR site by `match_name`. Used so no-ABN sites (unincorporated coalitions,
 * government programs, auspiced services) can still flip to a profile account
 * without relying on ABN matching or coincidental slug collisions.
 */
export function jrSiteTag(matchName: string): string {
  return `jr-site:${slugifyBase(matchName)}`;
}

/** Sanitise an ABN to 11 digits, or null when it is not a valid ABN. */
export function sanitizeAbn(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\s/g, '');
  return /^\d{11}$/.test(digits) ? digits : null;
}
