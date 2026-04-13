import rawJudgesPostcardOverrides from '@/content/judges-postcards-overrides.json';

export const JUDGES_POSTCARD_DOMAIN = 'justicehub.com.au';

export const JUDGES_POSTCARD_MEDIA = {
  team: '/images/orgs/oonchiumpa/hero.jpg',
  mentoring: '/images/orgs/oonchiumpa/mentoring.jpg',
  kristy: '/images/orgs/oonchiumpa/team/kristy.jpg',
  tanya: '/images/orgs/oonchiumpa/team/tanya.jpg',
  country: '/images/orgs/oonchiumpa/homestead.jpg',
} as const;

export const JUDGES_POSTCARD_VOD_URL = 'https://share.descript.com/view/1A29kyrHglp';

export const JUDGES_POSTCARD_DESTINATIONS = {
  judges: {
    path: '/judges-on-country',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country`,
    label: 'Judges field guide',
    description: 'Open the trip route, video, local search, and follow-through prompts.',
  },
  vod: {
    path: JUDGES_POSTCARD_VOD_URL,
    displayPath: 'share.descript.com/view/1A29kyrHglp',
    label: 'Watch the video',
    description: 'Watch the Oonchiumpa story featuring the founders, youth workers, and young people from the postcards.',
  },
  oonchiumpa: {
    path: '/organizations/oonchiumpa?lens=judiciary',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/organizations/oonchiumpa`,
    label: 'Oonchiumpa basecamp',
    description: 'Open the founders, the core basecamp context, and the local route.',
  },
  site: {
    path: '/sites/oonchiumpa',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/sites/oonchiumpa`,
    label: 'Atnarpa site page',
    description: 'Open the on-Country site route, gallery, and place-based program overview.',
  },
  alma: {
    path: '/alma/oonchiumpa',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/alma/oonchiumpa`,
    label: 'Oonchiumpa story page',
    description: 'Read the longer Oonchiumpa story and the consented youth voices behind the trip.',
  },
  aliceSprings: {
    path: '/judges-on-country/alice-springs',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country/alice-springs`,
    label: 'Alice Springs local context',
    description: 'Open the Mparntwe snapshot, postcode 0870 funding picture, and the routes back into JusticeHub.',
  },
  civic: {
    path: '/intelligence/civic',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/intelligence/civic`,
    label: 'CivicScope',
    description: 'Trace what government said, what oversight recommended, and what still has not changed.',
  },
  search: {
    path: '/judges-on-country#search',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country#search`,
    label: 'Local program search',
    description: 'Search by place, state, or practice type after the trip.',
  },
  connect: {
    path: '/judges-on-country#connect',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country#connect`,
    label: 'Take back to chambers',
    description: 'Use the field kit, JusticeHub, ALMA, and CivicScope after the visit.',
  },
} as const;

export type JudgesPostcardDestinationKey = keyof typeof JUDGES_POSTCARD_DESTINATIONS;
export type JudgesPostcardSourceKind =
  | 'admin'
  | 'storyteller'
  | 'story'
  | 'media'
  | 'route'
  | 'api';

export type JudgesPostcardSource = {
  kind: JudgesPostcardSourceKind;
  label: string;
  href: string;
  note: string;
  recordId?: string;
};

export type JudgesPostcardProvenanceKind = 'quote' | 'image' | 'context';
export type JudgesPostcardProvenanceStatus = 'editorial' | 'local' | 'el' | 'route';

export type JudgesPostcardProvenance = {
  kind: JudgesPostcardProvenanceKind;
  status: JudgesPostcardProvenanceStatus;
  label: string;
  href: string;
  note: string;
  excerpt?: string;
  assetPath?: string;
  previewSrc?: string;
};

export type JudgesPostcardPublicationPlan = {
  storytellerId: string;
  storytellerName: string;
  proposedTitle: string;
  quoteExcerpt: string;
  summary: string;
  storyType: string;
  themes: string[];
  sourceHref: string;
  destinationHref: string;
  blocker?: string;
};

type PhotoFront = {
  kind: 'photo';
  kicker: string;
  title: string;
  quote?: string;
  attribution?: string;
  imageSrc: string;
  imageAlt: string;
  accent?: string;
  imageFilter?: string;
  footerLabel: string;
};

type VoiceFront = {
  kind: 'voice';
  kicker: string;
  name: string;
  age: string;
  quote: string;
  supporting: string;
  accent?: string;
  background?: string;
  footerLabel: string;
};

type Callout =
  | {
      style: 'dark-panel' | 'light-panel' | 'accent-rule';
      label?: string;
      text: string;
    }
  | undefined;

type ActionItem = {
  number: string;
  title: string;
  path: string;
};

type Back = {
  title: string;
  subtitle?: string;
  destination: JudgesPostcardDestinationKey;
  accent?: string;
  paragraphs: string[];
  callout?: Callout;
  action?: string;
  actionList?: ActionItem[];
};

export type JudgesPostcardCard = {
  id: string;
  number: string;
  navTitle: string;
  front: PhotoFront | VoiceFront;
  back: Back;
  sourceStack: JudgesPostcardSource[];
  provenance: JudgesPostcardProvenance[];
  publicationPlan?: JudgesPostcardPublicationPlan;
};

export type JudgesPostcardCardOverride = {
  navTitle?: string;
  front?: Partial<JudgesPostcardCard['front']>;
  back?: Partial<JudgesPostcardCard['back']>;
  sourceStack?: JudgesPostcardSource[];
  provenance?: JudgesPostcardProvenance[];
  publicationPlan?: JudgesPostcardPublicationPlan | null;
};

export type JudgesPostcardOverridesDocument = {
  cards: Record<string, JudgesPostcardCardOverride>;
};

export const JUDGES_POSTCARD_PRINT_SETUP = [
  'Print double-sided on A6 landscape card stock or trim from A4 sheets.',
  'Keep scaling at 100% so the QR blocks remain easy to scan.',
  'Review each card front and back before printing so the route family stays coherent.',
] as const;

export const JUDGES_POSTCARD_TRIP_USE = [
  'Watch the video first — it introduces the founders and young people you will meet on the cards.',
  'Start with Kristy and Tanya, then keep the youth voice cards in hand during the site walk.',
  'Use the Atnarpa, Oonchiumpa, and Alice Springs routes when place, family, accountability, or cultural authority come up.',
  'End with the trust card and the chambers route so the visit changes what happens next.',
] as const;

export const JUDGES_POSTCARD_SOURCE_WORKFLOW: JudgesPostcardSource[] = [
  {
    kind: 'admin',
    label: 'Empathy Ledger content manager',
    href: '/admin/empathy-ledger/content',
    note: 'Review storytellers, stories, galleries, and media before changing any quote or image pairing.',
  },
  {
    kind: 'api',
    label: 'EL profiles API',
    href: '/api/empathy-ledger/profiles?limit=100&include_stories=true',
    note: 'Check the storyteller records that JusticeHub currently sees from Empathy Ledger.',
  },
  {
    kind: 'api',
    label: 'EL stories API',
    href: '/api/empathy-ledger/stories?limit=50',
    note: 'Check the currently syndicated public stories and storyteller links.',
  },
  {
    kind: 'media',
    label: 'Oonchiumpa media sync',
    href: '/api/sync/empathy-ledger?organization=oonchiumpa&limit=24',
    note: 'Inspect the current Oonchiumpa media feed before swapping contextual photos.',
  },
] as const;

const BASE_JUDGES_POSTCARD_CARDS: JudgesPostcardCard[] = [
  {
    id: 'card-1',
    number: '01',
    navTitle: 'Start Here',
    front: {
      kind: 'photo',
      kicker: 'Start Here',
      title: 'Kristy Bloomfield and Tanya Turner',
      quote: '“Connection to culture, country, and elders is the foundation of healing.”',
      attribution: 'Kristy Bloomfield  |  Co-Founder & Director',
      imageSrc: JUDGES_POSTCARD_MEDIA.team,
      imageAlt: 'Kristy Bloomfield and Tanya Turner standing together outdoors',
      accent: '#DC2626',
      imageFilter: 'brightness(0.48)',
      footerLabel: 'Real Oonchiumpa photo  |  Start Here',
    },
    back: {
      title: 'Start with the people leading the work',
      subtitle: 'Kristy Bloomfield and Tanya Turner, Oonchiumpa',
      destination: 'judges',
      accent: '#DC2626',
      paragraphs: [
        'Oonchiumpa is a 100% Aboriginal community-controlled organisation working across Central Australia. The trip should begin with the people holding cultural authority, family connection, and responsibility to act for their own young people.',
        'This is the card that sets the frame: community-led practice first, then the wider evidence and route system around it.',
      ],
      callout: {
        style: 'dark-panel',
        label: 'Why this card comes first',
        text: 'Before the statistics, before CivicScope, before the search, judges should meet the people leading the work.',
      },
      actionList: [
        {
          number: '1',
          title: 'Watch the Oonchiumpa video',
          path: JUDGES_POSTCARD_VOD_URL,
        },
        {
          number: '2',
          title: 'Open the judges field guide',
          path: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country`,
        },
      ],
    },
    sourceStack: [
      {
        kind: 'storyteller',
        label: 'Kristy Bloomfield person page',
        href: '/people/kristy-bloomfield',
        note: 'Public person route synced from the EL storyteller record.',
        recordId: 'b59a1f4c-94fd-4805-a2c5-cac0922133e0',
      },
      {
        kind: 'storyteller',
        label: 'Tanya Turner person page',
        href: '/people/tanya-turner',
        note: 'Public person route synced from the EL storyteller record.',
        recordId: 'dc85700d-f139-46fa-9074-6afee55ea801',
      },
      {
        kind: 'story',
        label: 'Bringing Kids Back to Country',
        href: '/api/empathy-ledger/stories?limit=20&storyteller_id=b59a1f4c-94fd-4805-a2c5-cac0922133e0',
        note: 'Current EL story feed for Kristy Bloomfield; use it to review the live syndicated story title and record.',
        recordId: 'storyteller:b59a1f4c-94fd-4805-a2c5-cac0922133e0',
      },
      {
        kind: 'admin',
        label: 'Review in Empathy Ledger',
        href: '/admin/empathy-ledger/content',
        note: 'Check storyteller and media records before replacing the opening quote or photo.',
      },
    ],
    provenance: [
      {
        kind: 'quote',
        status: 'editorial',
        label: 'Founders framing on JusticeHub',
        href: '/organizations/oonchiumpa?lens=judiciary',
        note: 'The opening quote line is still a JusticeHub editorial framing line, not a syndicated EL public quote card.',
        excerpt: '“Connection to culture, country, and elders is the foundation of healing.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'Local founders photo used on postcard front',
        href: '/organizations/oonchiumpa?lens=judiciary',
        note: 'The postcard front uses the local Oonchiumpa team image stored in JusticeHub.',
        assetPath: '/images/orgs/oonchiumpa/hero.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.team,
      },
      {
        kind: 'context',
        status: 'route',
        label: 'Judges field guide route',
        href: '/judges-on-country',
        note: 'This card opens the trip frame and points the reader into the wider judges-on-Country route.',
      },
    ],
  },
  {
    id: 'card-2',
    number: '02',
    navTitle: 'Tanya',
    front: {
      kind: 'photo',
      kicker: 'Tanya',
      title: '“Our young people need to know they are valued.”',
      quote: '“Not by the system, but by their own mob.”',
      attribution: 'Tanya Turner  |  Co-Founder & Director',
      imageSrc: JUDGES_POSTCARD_MEDIA.tanya,
      imageAlt: 'Portrait of Tanya Turner from Oonchiumpa',
      accent: '#059669',
      imageFilter: 'brightness(0.46)',
      footerLabel: 'Real Oonchiumpa photo  |  Tanya',
    },
    back: {
      title: 'Tanya brings legal practice home',
      destination: 'oonchiumpa',
      accent: '#059669',
      paragraphs: [
        'Tanya Turner is an Eastern Arrernte woman who graduated from UWA law school, worked as an associate at the Supreme Court of Victoria, and came home to build Oonchiumpa with community wisdom at the centre.',
        'For judges, this matters because legal literacy and cultural authority are not competing things here. They are working together in one field of practice.',
      ],
      callout: {
        style: 'accent-rule',
        text: 'Keep this route close when the conversation turns to what culturally grounded legal leadership actually looks like in community.',
      },
      action:
        'Scan to open the Oonchiumpa profile and keep the founders’ context close to the trip.',
    },
    sourceStack: [
      {
        kind: 'storyteller',
        label: 'Tanya Turner person page',
        href: '/people/tanya-turner',
        note: 'Public person route synced from the EL storyteller record.',
        recordId: 'dc85700d-f139-46fa-9074-6afee55ea801',
      },
      {
        kind: 'story',
        label: 'Oonchiumpa ALMA story',
        href: '/alma/oonchiumpa',
        note: 'Cross-check legal and cultural leadership language against the longform story.',
      },
      {
        kind: 'route',
        label: 'Oonchiumpa founders route',
        href: '/organizations/oonchiumpa?lens=judiciary',
        note: 'Keep Tanya inside the wider founders and basecamp context.',
      },
      {
        kind: 'admin',
        label: 'Review EL content',
        href: '/admin/empathy-ledger/content',
        note: 'Confirm portrait and source context before changing Tanya’s card.',
      },
    ],
    provenance: [
      {
        kind: 'quote',
        status: 'editorial',
        label: 'Tanya founders framing on JusticeHub',
        href: '/organizations/oonchiumpa?lens=judiciary',
        note: 'This Tanya line is currently held as a curated JusticeHub framing line rather than a public EL story quote.',
        excerpt: '“Our young people need to know they are valued.” “Not by the system, but by their own mob.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'Local Tanya portrait used on postcard front',
        href: '/people/tanya-turner',
        note: 'The postcard front uses the local Tanya portrait stored in JusticeHub, not the EL avatar derivative.',
        assetPath: '/images/orgs/oonchiumpa/team/tanya.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.tanya,
      },
      {
        kind: 'context',
        status: 'route',
        label: 'Oonchiumpa founders route',
        href: '/organizations/oonchiumpa?lens=judiciary',
        note: 'Keep Tanya’s card tied to the founders/basecamp route until a public EL story exists for this line.',
      },
    ],
    publicationPlan: {
      storytellerId: 'dc85700d-f139-46fa-9074-6afee55ea801',
      storytellerName: 'Tanya Turner',
      proposedTitle: 'Young People Need to Be Valued by Their Own Mob',
      quoteExcerpt: '“Our young people need to know they are valued. Not by the system, but by their own mob.”',
      summary:
        'Publish Tanya’s founders framing as a short public EL story so the postcard can point to a first-class storyteller record instead of a JusticeHub editorial route.',
      storyType: 'community_story',
      themes: ['judges-on-country', 'oonchiumpa', 'community-led-practice', 'cultural-authority'],
      sourceHref: '/organizations/oonchiumpa?lens=judiciary',
      destinationHref: '/organizations/oonchiumpa?lens=judiciary',
    },
  },
  {
    id: 'card-3',
    number: '03',
    navTitle: 'Jackquann',
    front: {
      kind: 'photo',
      kicker: 'Jackquann',
      title: '“Programs.”',
      quote: '“Looking after my family.”',
      attribution: 'Jackquann, 14  |  youth voice used with permission',
      imageSrc: JUDGES_POSTCARD_MEDIA.mentoring,
      imageAlt: 'Young people participating in mentoring and activity at Oonchiumpa',
      accent: '#059669',
      imageFilter: 'brightness(0.34)',
      footerLabel: 'Real Oonchiumpa photo  |  Jackquann',
    },
    back: {
      title: 'Jackquann did not ask for harsher punishment',
      subtitle: 'Mentoring photo shown here is contextual, not a portrait of Jackquann',
      destination: 'site',
      accent: '#059669',
      paragraphs: [
        'Jackquann, 14, told Oonchiumpa that detention is “At six o’clock you get locked down. You wait till tomorrow.” Asked what would stop him getting in trouble, he said “Looking after my family.” Asked what he would tell politicians, he said “Programs.”',
      ],
      callout: {
        style: 'dark-panel',
        label: 'What to listen for',
        text: 'Family, programs, and practical support are what he named. This is what judges should be listening for on the trip.',
      },
      action: 'Open the Atnarpa site page to keep place and practice in the frame.',
    },
    sourceStack: [
      {
        kind: 'storyteller',
        label: 'Jackquann EL storyteller record',
        href: '/api/empathy-ledger/profiles?limit=100&include_stories=true',
        note: 'Current EL storyteller visible to JusticeHub for Jackquann.',
        recordId: '6a86acf2-1701-41a9-96ef-d3bae49d91b3',
      },
      {
        kind: 'story',
        label: 'Oonchiumpa ALMA youth voices',
        href: '/alma/oonchiumpa',
        note: 'Primary source for Jackquann’s quote and surrounding youth context.',
      },
      {
        kind: 'media',
        label: 'Oonchiumpa media sync',
        href: '/api/sync/empathy-ledger?organization=oonchiumpa&limit=24',
        note: 'Use this before swapping the contextual mentoring photo.',
      },
      {
        kind: 'route',
        label: 'Atnarpa site page',
        href: '/sites/oonchiumpa',
        note: 'Public place-based route for the on-Country and mentoring context.',
      },
    ],
    provenance: [
      {
        kind: 'quote',
        status: 'editorial',
        label: 'Jackquann youth quote in Oonchiumpa ALMA story',
        href: '/alma/oonchiumpa',
        note: 'This quote is drawn from the longform ALMA page and is not yet a public EL story row.',
        excerpt: '“Programs.” “Looking after my family.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'Contextual mentoring photo on postcard front',
        href: '/sites/oonchiumpa',
        note: 'This is a local Oonchiumpa contextual image, not a portrait of Jackquann.',
        assetPath: '/images/orgs/oonchiumpa/mentoring.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.mentoring,
      },
      {
        kind: 'context',
        status: 'route',
        label: 'Atnarpa site route',
        href: '/sites/oonchiumpa',
        note: 'This card should be read with the site route because the quote is about practical support in place.',
      },
    ],
    publicationPlan: {
      storytellerId: '6a86acf2-1701-41a9-96ef-d3bae49d91b3',
      storytellerName: 'Jackquann',
      proposedTitle: 'Programs and Looking After My Family',
      quoteExcerpt: '“Programs.” “Looking after my family.”',
      summary:
        'Publish Jackquann’s line as a short public EL story so the postcard can link the quote directly to his storyteller record rather than only to the ALMA page.',
      storyType: 'personal_narrative',
      themes: ['judges-on-country', 'oonchiumpa', 'family', 'programs', 'support'],
      sourceHref: '/alma/oonchiumpa',
      destinationHref: '/sites/oonchiumpa',
    },
  },
  {
    id: 'card-4',
    number: '04',
    navTitle: 'Nigel',
    front: {
      kind: 'voice',
      kicker: 'Nigel',
      name: 'Nigel',
      age: '14',
      quote: '“Bad. Like, going away from my family and stuff.”',
      supporting:
        'Lives at a station in Double Camp. Wants to be a footy player. Oonchiumpa picks him up, takes him to school, and gives him someone to walk with.',
      accent: '#059669',
      background: '#0A0A0A',
      footerLabel: 'Nigel  |  consented story line',
    },
    back: {
      title: 'Nigel named what detention interrupts',
      destination: 'alma',
      accent: '#059669',
      paragraphs: [
        'Nigel, 14, likes school and wants to be a footy player. He knows he needs to “go to school every day” to get there. What he described as harmful was not just custody itself, but being taken away from family and home.',
      ],
      callout: {
        style: 'light-panel',
        label: 'What youth justice should protect',
        text: 'Family, school, movement, and a consistent adult are already visible here. Oonchiumpa’s consistency is the intervention.',
      },
      action:
        'Use this card when the conversation needs to come back to family, schooling, and what support actually looks like in practice.',
    },
    sourceStack: [
      {
        kind: 'storyteller',
        label: 'Nigel EL storyteller record',
        href: '/api/empathy-ledger/profiles?limit=100&include_stories=true',
        note: 'Two Nigel storyteller records are currently visible in EL. Confirm which one should stay attached to this card before editing.',
        recordId: 'f0be3aca-52b8-427d-9aab-73ea4c5b3d27 / 8dab91aa-3a1f-4128-b41d-b89e532be1fa',
      },
      {
        kind: 'story',
        label: 'Nigel in ALMA story',
        href: '/alma/oonchiumpa',
        note: 'Primary source for Nigel’s quote, family context, and schooling thread.',
      },
      {
        kind: 'admin',
        label: 'EL content manager',
        href: '/admin/empathy-ledger/content',
        note: 'Review related storyteller and story records if this youth voice card changes.',
      },
    ],
    provenance: [
      {
        kind: 'quote',
        status: 'editorial',
        label: 'Nigel youth quote in Oonchiumpa ALMA story',
        href: '/alma/oonchiumpa',
        note: 'This quote is still sourced from the ALMA longform page rather than a public EL story.',
        excerpt: '“Bad. Like, going away from my family and stuff.”',
      },
      {
        kind: 'context',
        status: 'route',
        label: 'ALMA longform route',
        href: '/alma/oonchiumpa',
        note: 'Nigel’s schooling, family, and support context is currently held in the ALMA route.',
      },
    ],
    publicationPlan: {
      storytellerId: 'f0be3aca-52b8-427d-9aab-73ea4c5b3d27',
      storytellerName: 'Nigel',
      proposedTitle: 'Going Away From My Family',
      quoteExcerpt: '“Bad. Like, going away from my family and stuff.”',
      summary:
        'Nigel’s quote should become a public EL story, but the duplicate Nigel storyteller record needs resolving first so the postcard does not point to the wrong person.',
      storyType: 'personal_narrative',
      themes: ['judges-on-country', 'oonchiumpa', 'family', 'school', 'consistency'],
      sourceHref: '/alma/oonchiumpa',
      destinationHref: '/alma/oonchiumpa',
      blocker:
        'Resolve the duplicate Nigel storyteller records in EL before publishing this quote as a public story.',
    },
  },
  {
    id: 'card-5',
    number: '05',
    navTitle: 'Laquisha',
    front: {
      kind: 'voice',
      kicker: 'Laquisha',
      name: 'Laquisha',
      age: '16',
      quote: '“I don’t like going to Darwin cause I have no family there.”',
      supporting:
        'Lives with her auntie. Wants her driver’s licence and wants to travel. Asked why young people get in trouble, she answered with one word: “Oppression.”',
      accent: '#DC2626',
      background: '#141414',
      footerLabel: 'Laquisha  |  consented story line',
    },
    back: {
      title: 'Laquisha named the structure plainly',
      destination: 'aliceSprings',
      accent: '#DC2626',
      paragraphs: [
        'Laquisha, 16, described being sent to Darwin youth detention 1,500km from home. Twelve-minute phone calls. Two-hour waits between calls. No family there.',
        'When she was asked why young people get in trouble, she answered in one word: “Oppression.”',
      ],
      callout: {
        style: 'accent-rule',
        text: 'Take this card into the Alice Springs context page to trace Oonchiumpa, postcode 0870, and the local conditions that keep removal from family in motion.',
      },
      action:
        'Open the Alice Springs context page to hold story, place, and system reality in the same frame.',
    },
    sourceStack: [
      {
        kind: 'storyteller',
        label: 'Laquisha EL storyteller record',
        href: '/api/empathy-ledger/profiles?limit=100&include_stories=true',
        note: 'Current EL storyteller visible to JusticeHub for Laquisha.',
        recordId: '7a0cd28a-ad12-4f70-b900-d869b42c9f88',
      },
      {
        kind: 'story',
        label: 'Laquisha in ALMA story',
        href: '/alma/oonchiumpa',
        note: 'Primary source for the distance/removal quote and consented youth context.',
      },
      {
        kind: 'admin',
        label: 'EL content manager',
        href: '/admin/empathy-ledger/content',
        note: 'Review storyteller and story records before changing this card’s quote or emphasis.',
      },
      {
        kind: 'route',
        label: 'Alice Springs context route',
        href: '/judges-on-country/alice-springs',
        note: 'System-facing route that keeps story, place, and local conditions together.',
      },
    ],
    provenance: [
      {
        kind: 'quote',
        status: 'editorial',
        label: 'Laquisha youth quote in Oonchiumpa ALMA story',
        href: '/alma/oonchiumpa',
        note: 'This quote is still anchored to the ALMA story rather than a public EL story record.',
        excerpt: '“I don’t like going to Darwin cause I have no family there.” “Oppression.”',
      },
      {
        kind: 'context',
        status: 'route',
        label: 'Alice Springs local context route',
        href: '/judges-on-country/alice-springs',
        note: 'This card deliberately routes into the Alice Springs context page so story and system context stay together.',
      },
    ],
    publicationPlan: {
      storytellerId: '7a0cd28a-ad12-4f70-b900-d869b42c9f88',
      storytellerName: 'Laquisha',
      proposedTitle: 'No Family There',
      quoteExcerpt: '“I don’t like going to Darwin cause I have no family there.”',
      summary:
        'Publish Laquisha’s distance/removal line as a public EL story so the postcard can move from ALMA-only sourcing to a first-class storyteller route.',
      storyType: 'personal_narrative',
      themes: ['judges-on-country', 'oonchiumpa', 'distance-from-home', 'detention', 'oppression'],
      sourceHref: '/alma/oonchiumpa',
      destinationHref: '/judges-on-country/alice-springs',
    },
  },
  {
    id: 'card-6',
    number: '06',
    navTitle: 'Trust',
    front: {
      kind: 'photo',
      kicker: 'Trust',
      title: '“He trusts us. We earned that trust.”',
      quote: '“He was so proud… He’s quite capable of building that on his own.”',
      attribution: 'Fred Campbell on Xavier',
      imageSrc: JUDGES_POSTCARD_MEDIA.country,
      imageAlt: 'On-country gathering at Atnarpa with the MacDonnell Ranges in view',
      accent: '#059669',
      imageFilter: 'brightness(0.36)',
      footerLabel: 'Real Oonchiumpa photo  |  Trust',
    },
    back: {
      title: 'What is next for youth justice and Oonchiumpa',
      destination: 'connect',
      accent: '#059669',
      paragraphs: [
        'Fred Campbell told the Oonchiumpa story page about Xavier, one of the organisation’s first clients. Other services “distanced” from him when the relationship got hard. Oonchiumpa did not.',
        'Xavier later led Stretch Bed building work and showed he was capable, proud, and ready to teach other kids. The point of this final card is what happens next: trust, responsibility, family, and real tasks have to change the work after the visit as well.',
      ],
      actionList: [
        {
          number: '1',
          title: 'Watch the Oonchiumpa video',
          path: JUDGES_POSTCARD_VOD_URL,
        },
        {
          number: '2',
          title: 'Return to the judges field guide',
          path: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country`,
        },
        {
          number: '3',
          title: 'Open the Oonchiumpa basecamp profile',
          path: `${JUDGES_POSTCARD_DOMAIN}/organizations/oonchiumpa`,
        },
        {
          number: '4',
          title: 'Read the longer Oonchiumpa story',
          path: `${JUDGES_POSTCARD_DOMAIN}/alma/oonchiumpa`,
        },
        {
          number: '5',
          title: 'Open the Alice Springs local context page',
          path: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country/alice-springs`,
        },
        {
          number: '6',
          title: 'Search alternatives near your own court',
          path: `${JUDGES_POSTCARD_DOMAIN}/judges-on-country#search`,
        },
      ],
    },
    sourceStack: [
      {
        kind: 'storyteller',
        label: 'Fred Campbell EL storyteller record',
        href: '/api/empathy-ledger/profiles?limit=100&include_stories=true',
        note: 'Current EL storyteller visible to JusticeHub for Fred Campbell.',
        recordId: '4b35b1af-9815-4b66-89ed-84ac0f5b3a2b',
      },
      {
        kind: 'story',
        label: 'Xavier trust story in ALMA',
        href: '/alma/oonchiumpa',
        note: 'Primary source for Fred Campbell’s trust framing and Xavier’s follow-through story.',
      },
      {
        kind: 'admin',
        label: 'EL content manager',
        href: '/admin/empathy-ledger/content',
        note: 'Review supporting story and media before changing the trust card close.',
      },
      {
        kind: 'route',
        label: 'Take back to chambers',
        href: '/judges-on-country#connect',
        note: 'Public route for what chambers should do after the visit.',
      },
    ],
    provenance: [
      {
        kind: 'quote',
        status: 'editorial',
        label: 'Fred Campbell and Xavier thread in Oonchiumpa ALMA story',
        href: '/alma/oonchiumpa',
        note: 'The closing trust line is currently sourced from the ALMA story rather than a public EL story record.',
        excerpt: '“He trusts us. We earned that trust.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'Local Country photo used on postcard front',
        href: '/sites/oonchiumpa',
        note: 'The closing card uses the local Atnarpa/Country photo stored in JusticeHub.',
        assetPath: '/images/orgs/oonchiumpa/homestead.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.country,
      },
      {
        kind: 'context',
        status: 'route',
        label: 'Take back to chambers route',
        href: '/judges-on-country#connect',
        note: 'This card closes on the follow-through route for chambers, search, and next actions.',
      },
    ],
    publicationPlan: {
      storytellerId: '4b35b1af-9815-4b66-89ed-84ac0f5b3a2b',
      storytellerName: 'Fred Campbell',
      proposedTitle: 'We Earned That Trust',
      quoteExcerpt: '“He trusts us. We earned that trust.”',
      summary:
        'Publish Fred Campbell’s trust framing as a short public EL story so the closing card can point to a public storyteller narrative instead of only the ALMA route.',
      storyType: 'impact_story',
      themes: ['judges-on-country', 'oonchiumpa', 'trust', 'follow-through', 'responsibility'],
      sourceHref: '/alma/oonchiumpa',
      destinationHref: '/judges-on-country#connect',
    },
  },
];

function applyCardOverride(
  card: JudgesPostcardCard,
  override?: JudgesPostcardCardOverride
): JudgesPostcardCard {
  if (!override) {
    return card;
  }

  return {
    ...card,
    ...override,
    front: override.front ? ({ ...card.front, ...override.front } as JudgesPostcardCard['front']) : card.front,
    back: override.back ? ({ ...card.back, ...override.back } as JudgesPostcardCard['back']) : card.back,
    sourceStack: override.sourceStack ?? card.sourceStack,
    provenance: override.provenance ?? card.provenance,
    publicationPlan:
      override.publicationPlan === null ? undefined : override.publicationPlan ?? card.publicationPlan,
  };
}

export const JUDGES_POSTCARD_OVERRIDES =
  rawJudgesPostcardOverrides as JudgesPostcardOverridesDocument;

export const JUDGES_POSTCARD_CARDS: JudgesPostcardCard[] = BASE_JUDGES_POSTCARD_CARDS.map((card) =>
  applyCardOverride(card, JUDGES_POSTCARD_OVERRIDES.cards[card.id])
);
