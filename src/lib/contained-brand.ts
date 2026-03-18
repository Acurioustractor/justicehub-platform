/**
 * CONTAINED Campaign — Brand Constants
 * Single source of truth for social media templates and branded outputs.
 * Matches brand-guide.md spec exactly.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const BRAND = {
  black: '#0A0A0A',
  offWhite: '#F5F0E8',
  red: '#DC2626',
  emerald: '#059669',
  gray: {
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
  },
} as const

// ─── Typography (Google Fonts URLs for Satori) ───────────────────────────────

export const FONT_URLS = {
  spaceGrotesk700: 'https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf',
  ibmPlexMono400: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n5ig.ttf',
  ibmPlexMono500: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJ8lc.ttf',
} as const

// ─── Formats ─────────────────────────────────────────────────────────────────

export const FORMATS = {
  square: { width: 1080, height: 1080, label: '1:1 Square' },
  story: { width: 1080, height: 1920, label: '9:16 Story' },
  landscape: { width: 1200, height: 630, label: 'OG / Twitter' },
} as const

export type FormatKey = keyof typeof FORMATS

// ─── Hashtags ────────────────────────────────────────────────────────────────

export const HASHTAGS = {
  primary: ['#CONTAINED', '#YouthJustice', '#JusticeHub'],
  tour: ['#MountDruitt', '#WesternSydney', '#Adelaide', '#Perth', '#TennantCreek'],
  thematic: ['#ImmersiveAdvocacy', '#YouthVoice', '#SelfDetermination', '#JusticeReform'],
} as const

// ─── Stats (canonical, sourced) ──────────────────────────────────────────────

export const STATS: Record<string, {
  value: string
  label: string
  subtext: string
  source: string
  category: 'cost' | 'outcome' | 'inequality' | 'alternative' | 'campaign'
}> = {
  detention_cost: {
    value: '$1.55M',
    label: 'per child per year',
    subtext: 'Australia spends $1.55 million per child per year in youth detention — for an 84% reoffending rate.',
    source: 'Productivity Commission ROGS 2024-25',
    category: 'cost',
  },
  reoffending: {
    value: '84%',
    label: 'reoffend within 2 years',
    subtext: 'After release from youth detention, 84% of young people reoffend within two years. The system creates more crime.',
    source: 'AIHW Youth Justice 2023-24',
    category: 'outcome',
  },
  indigenous: {
    value: '23.1x',
    label: 'Indigenous overrepresentation',
    subtext: 'Indigenous young people are 23.1 times more likely to be in detention than non-Indigenous youth. In the NT, it\'s 28 times.',
    source: 'Productivity Commission ROGS 2024-25',
    category: 'inequality',
  },
  alternatives: {
    value: '$520M',
    label: 'community programs',
    subtext: '$520M on community youth justice vs $1.14B on detention. 939 alternatives catalogued on ALMA.',
    source: 'ROGS 2024-25 + ALMA Database',
    category: 'alternative',
  },
  ratio: {
    value: '$15:$1',
    label: 'punitive vs what works',
    subtext: 'For every $1 spent on community programs that actually work, $15 goes to punitive systems that don\'t.',
    source: 'Calculated from ROGS 2024-25',
    category: 'cost',
  },
  evidence: {
    value: '489',
    label: 'evidence items collected',
    subtext: '489 evidence items, 1,150 measured outcomes. The data is clear — alternatives work. They just aren\'t funded.',
    source: 'ALMA Evidence Database',
    category: 'alternative',
  },
  inequality: {
    value: '68,000,000:1',
    label: 'the funding ratio',
    subtext: 'Top 10 recipients get $74.2B. Bottom 100 get $10,860. That\'s sixty-eight million to one.',
    source: 'JusticeHub Funding Database — $97.9B tracked',
    category: 'inequality',
  },
  detention_vic: {
    value: '$7,304/day',
    label: 'to cage one child in Victoria',
    subtext: 'Victoria pays $2.67M per year to lock up one child. Community supervision costs $101–$601/day.',
    source: 'Productivity Commission ROGS 2024-25',
    category: 'cost',
  },
  community_heroes: {
    value: '$0',
    label: 'government funding',
    subtext: 'Just Reinvest NSW runs 9 evidence-rated programs with zero government funding. They work anyway.',
    source: 'ALMA Program Catalogue + JusticeHub Funding Database',
    category: 'alternative',
  },
  indigenous_gap: {
    value: '10.8%',
    label: 'of funding reaches Indigenous orgs',
    subtext: 'Indigenous organisations receive 10.8% of justice funding. Indigenous youth are 23x overrepresented in detention.',
    source: 'JusticeHub Funding Database + ROGS 2024-25',
    category: 'inequality',
  },
  what_works: {
    value: '876',
    label: 'alternatives catalogued',
    subtext: '876 community-led alternatives. 54.9% evidence-backed. They work. They\'re not funded.',
    source: 'ALMA Evidence Database — JusticeHub',
    category: 'alternative',
  },
  tour_demand: {
    value: '230',
    label: 'people said bring it here',
    subtext: 'Perth. Melbourne. Canberra. Sydney. 230 Australians said bring the container to their city.',
    source: 'CONTAINED Campaign — JusticeHub',
    category: 'campaign',
  },
}

// ─── Font Loaders ────────────────────────────────────────────────────────────

let fontCache: Map<string, ArrayBuffer> = new Map()

export async function loadFont(url: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(url)
  if (cached) return cached
  const res = await fetch(url)
  const buf = await res.arrayBuffer()
  fontCache.set(url, buf)
  return buf
}

export async function loadBrandFonts() {
  const [spaceGrotesk, ibmPlexMono, ibmPlexMonoMedium] = await Promise.all([
    loadFont(FONT_URLS.spaceGrotesk700),
    loadFont(FONT_URLS.ibmPlexMono400),
    loadFont(FONT_URLS.ibmPlexMono500),
  ])
  return [
    { name: 'Space Grotesk', data: spaceGrotesk, weight: 700 as const, style: 'normal' as const },
    { name: 'IBM Plex Mono', data: ibmPlexMono, weight: 400 as const, style: 'normal' as const },
    { name: 'IBM Plex Mono', data: ibmPlexMonoMedium, weight: 500 as const, style: 'normal' as const },
  ]
}
