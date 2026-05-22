/**
 * Locale config for /intelligence/civic/locale/[slug].
 *
 * Each entry maps a slug to one or more `organizations.city` values found
 * in the DB. Indigenous place names lead where they exist; the colonial
 * name appears in brackets, matching the JusticeHub convention.
 */

export interface LocaleConfig {
  slug: string;
  displayName: string;
  state: string;
  description: string;
  cityKeywords: string[];
  detentionCentreSlug?: string;
}

export const LOCALES: LocaleConfig[] = [
  {
    slug: 'mparntwe',
    displayName: 'Mparntwe (Alice Springs)',
    state: 'NT',
    description:
      'Central Australia. Arrernte country. Home to long-running on-Country diversion programs and to the Alice Springs Youth Detention Centre.',
    cityKeywords: ['Alice Springs', 'ALICE SPRINGS', 'Mparntwe'],
    detentionCentreSlug: 'alice-springs-youth-detention-centre',
  },
  {
    slug: 'mount-isa',
    displayName: 'Mount Isa',
    state: 'QLD',
    description:
      'North-west Queensland mining town. Pita Pita, Kalkadoon, and Indjalandji-Dhidhanu country. Site of community-led mentoring and on-Country camps run by Indigenous founders.',
    cityKeywords: ['Mount Isa'],
  },
  {
    slug: 'palm-island',
    displayName: 'Palm Island',
    state: 'QLD',
    description:
      'Bwgcolman country. Aboriginal community in north Queensland. Hosts community-controlled programs run by Palm Island Community Company (PICC).',
    cityKeywords: ['Palm Island (Palm Island Shire)', 'Palm Island'],
  },
  {
    slug: 'yarrabah',
    displayName: 'Yarrabah',
    state: 'QLD',
    description:
      'Gunggandji country. One of the largest Aboriginal communities in Australia. South of Cairns. Community-controlled youth programs.',
    cityKeywords: ['Yarrabah'],
  },
  {
    slug: 'mackay',
    displayName: 'Mackay',
    state: 'QLD',
    description:
      'Central Queensland coastal city. Yuwibara country. Regional youth justice programs serving Mackay and surrounding districts.',
    cityKeywords: ['Mackay'],
  },
];

export function getLocale(slug: string): LocaleConfig | undefined {
  return LOCALES.find((l) => l.slug === slug);
}
