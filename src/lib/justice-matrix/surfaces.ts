// ---------------------------------------------------------------------------
// Surfaces: two audience lenses over ONE Justice Matrix engine.
//
// A "surface" is a preset of the existing search params (cat + scope) plus
// framing copy. It is NOT a separate database, a new search semantic, or a new
// route family. The engine (justice_matrix_cases / _campaigns / alma_evidence,
// the RPCs, and /api/justice-matrix/search) is untouched.
//
// Surface A (refugee) is the global refugee & asylum strategic-litigation tool.
// Surface B (youth) is the Australian youth-justice clearing house.
//
// Applying a lens: defaultCats/defaultScope become the INITIAL value of the
// existing cats/scope state, which flow through the existing cat/scope params.
// Clearing a lens (clearAll) returns the reader to neutral cross-search over
// the whole corpus. Cats below are verified against the live corpus.
// ---------------------------------------------------------------------------

export type SurfaceKey = 'refugee' | 'youth';

export interface Surface {
  key: SurfaceKey;
  defaultCats: string[];
  defaultScope: 'all' | 'au' | 'global';
  label: string; // short lens name, e.g. "Refugee & Asylum"
  blurb: string; // one-line framing in JH voice, no em dash, no AI-vocab
  exploreHref: string; // canonical entry URL with the preset baked in
}

export const SURFACES: Record<SurfaceKey, Surface> = {
  refugee: {
    key: 'refugee',
    defaultCats: ['refugee', 'asylum', 'non-refoulement'],
    defaultScope: 'global',
    label: 'Refugee & Asylum',
    blurb:
      'Strategic litigation and advocacy protecting people seeking asylum, across courts and borders.',
    exploreHref: '/justice-matrix/explore?surface=refugee',
  },
  youth: {
    key: 'youth',
    defaultCats: ['youth-justice', 'raise-the-age', 'justice-reinvestment'],
    defaultScope: 'au',
    label: 'Youth Justice',
    blurb:
      'Evidence, cases, and campaigns to keep children out of the justice system in Australia.',
    exploreHref: '/justice-matrix/explore?surface=youth',
  },
};

const SURFACE_KEYS = Object.keys(SURFACES) as SurfaceKey[];

// Narrow an untrusted string to a known SurfaceKey, or null.
export function asSurfaceKey(value: string | null | undefined): SurfaceKey | null {
  return value && (SURFACE_KEYS as string[]).includes(value) ? (value as SurfaceKey) : null;
}
