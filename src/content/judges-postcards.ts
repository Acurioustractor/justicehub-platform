import rawJudgesPostcardOverrides from '@/content/judges-postcards-overrides.json';

export const JUDGES_POSTCARD_DOMAIN = 'justicehub.com.au';

export const JUDGES_POSTCARD_MEDIA = {
  team: '/images/orgs/oonchiumpa/hero.jpg',
  founders: '/images/orgs/oonchiumpa/founders.jpg',
  boysDrone: '/images/orgs/oonchiumpa/boys-drone.jpg',
  jackquann: '/images/orgs/oonchiumpa/jackquann.jpg',
  nigel: '/images/orgs/oonchiumpa/nigel.jpg',
  laquisha: '/images/orgs/oonchiumpa/laquisha.jpg',
  xavierBed: '/images/orgs/oonchiumpa/xavier-bed.jpg',
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
  storyFounders: {
    path: '/stories/start-here-kristy-and-tanya',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/stories/start-here-kristy-and-tanya`,
    label: 'Read the founders’ story',
    description: 'Kristy and Tanya in their own words — how Oonchiumpa was built.',
  },
  storyJackquannNigel: {
    path: '/stories/jackquann-and-nigel',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/stories/jackquann-and-nigel`,
    label: 'Read Jackquann + Nigel',
    description: 'Both boys, together: programs, school, and what they actually asked for.',
  },
  storyJackquann: {
    path: '/stories/jackquann-detention-not-my-home',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/stories/jackquann-detention-not-my-home`,
    label: 'Read Jackquann’s story',
    description: 'Detention is not home — Jackquann in his own words.',
  },
  storyNigel: {
    path: '/stories/nigel-talking-to-the-judge',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/stories/nigel-talking-to-the-judge`,
    label: 'Read Nigel’s story',
    description: 'What it feels like to stand in front of a judge at 14.',
  },
  storyLaquisha: {
    path: '/stories/laquisha-court-is-scary',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/stories/laquisha-court-is-scary`,
    label: 'Read Laquisha’s story',
    description: 'Court, Darwin, family, and the structure Laquisha named plainly.',
  },
  storyTrust: {
    path: '/stories/fred-campbell-trust-earned',
    displayPath: `${JUDGES_POSTCARD_DOMAIN}/stories/fred-campbell-trust-earned`,
    label: 'Read Fred on Xavier',
    description: 'What trust actually looks like — Fred Campbell on Xavier.',
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
    navTitle: 'Founders',
    front: {
      kind: 'photo',
      kicker: 'Start Here / Founders',
      title: 'Kristy Bloomfield and Tanya Turner',
      quote: '“Our young people are just collateral in a bigger issue. The issue doesn’t sit with them.”',
      attribution: 'Tanya Turner, Co-Director  ·  Eastern Arrernte  ·  former Supreme Court associate',
      imageSrc: JUDGES_POSTCARD_MEDIA.founders,
      imageAlt: 'Kristy Bloomfield and Tanya Turner standing together outdoors',
      accent: '#DC2626',
      imageFilter: 'brightness(0.48)',
      footerLabel: 'Kristy Bloomfield + Tanya Turner  ·  Oonchiumpa',
    },
    back: {
      title: 'Start with the people leading the work',
      subtitle: 'Kristy Bloomfield + Tanya Turner, Oonchiumpa leaders',
      destination: 'storyFounders',
      accent: '#DC2626',
      paragraphs: [
        'Kristy is a Central Arrernte, Eastern Arrernte and Alyawarra Traditional Owner. Her grandfather was Stolen Generations, taken to the Bungalow in Alice Springs. He married her grandmother in a church to stop police taking his own children.',
        'Tanya is an Eastern Arrernte woman who graduated from UWA law school, worked as an associate at the Supreme Court of Victoria, and came home. Together they built Oonchiumpa from cultural authority first, legal knowledge second.',
      ],
      callout: {
        style: 'dark-panel',
        label: 'What judges should know',
        text: '“Aboriginal culturally led programs is working and has worked. The government should let it be.” — Kristy',
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
    navTitle: 'Jackquann + Nigel',
    front: {
      kind: 'photo',
      kicker: 'Jackquann + Nigel',
      title: 'Neither boy asked for punishment',
      quote: '“Programs.”  “Go to school every day.”',
      attribution: 'Asked what would help, neither boy asked for punishment.',
      imageSrc: JUDGES_POSTCARD_MEDIA.boysDrone,
      imageAlt: 'Jackquann and Nigel, 14, on-Country with a drone view at Oonchiumpa',
      accent: '#1E5E4B',
      imageFilter: 'brightness(0.46)',
      footerLabel: 'Jackquann, 14 + Nigel, 14  ·  Oonchiumpa',
    },
    back: {
      title: 'Neither boy asked for punishment',
      subtitle: 'Jackquann + Nigel, Alice Springs',
      destination: 'storyJackquannNigel',
      accent: '#1E5E4B',
      paragraphs: [
        'Both boys live in Alice Springs. Neither has been asked what they need. When asked, Jackquann told politicians one word: “Programs.” Nigel said he wants to be a footy player and knows he needs to go to school every day to get there.',
        'Both have been to detention. Both named family as the thing detention takes away. Oonchiumpa picks them up, takes them to school, and gives them someone to walk with.',
      ],
      callout: {
        style: 'light-panel',
        label: 'What judges should hear',
        text: '“Sometime they feel bored. They got nothing to do at home.” — Nigel, on why young people steal cars',
      },
      action:
        'Scan to open the judges field guide and keep both boys’ voices close when the conversation turns to what actually helps.',
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
        kind: 'storyteller',
        label: 'Nigel EL storyteller record',
        href: '/api/empathy-ledger/profiles?limit=100&include_stories=true',
        note: 'Two Nigel storyteller records are currently visible in EL. Confirm which one should stay attached before editing.',
        recordId: 'f0be3aca-52b8-427d-9aab-73ea4c5b3d27 / 8dab91aa-3a1f-4128-b41d-b89e532be1fa',
      },
      {
        kind: 'story',
        label: 'Oonchiumpa ALMA youth voices',
        href: '/alma/oonchiumpa',
        note: 'Primary source for both boys’ quotes and surrounding youth context.',
      },
      {
        kind: 'admin',
        label: 'EL content manager',
        href: '/admin/empathy-ledger/content',
        note: 'Review storyteller and story records before replacing this combined youth voice card.',
      },
    ],
    provenance: [
      {
        kind: 'quote',
        status: 'editorial',
        label: 'Jackquann + Nigel combined youth quote in ALMA story',
        href: '/alma/oonchiumpa',
        note: 'Both quotes drawn from the longform ALMA page. Neither is a public EL story row yet.',
        excerpt: '“Programs.”  “Go to school every day.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'On-Country photo of Jackquann and Nigel',
        href: '/sites/oonchiumpa',
        note: 'The local Oonchiumpa drone/on-Country portrait used on the postcard front.',
        assetPath: '/images/orgs/oonchiumpa/boys-drone.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.boysDrone,
      },
      {
        kind: 'context',
        status: 'route',
        label: 'Oonchiumpa basecamp route',
        href: '/organizations/oonchiumpa?lens=judiciary',
        note: 'Keep both boys tied to the basecamp route that holds the wider Oonchiumpa story.',
      },
    ],
    publicationPlan: {
      storytellerId: '6a86acf2-1701-41a9-96ef-d3bae49d91b3',
      storytellerName: 'Jackquann + Nigel',
      proposedTitle: 'Programs and Going to School Every Day',
      quoteExcerpt: '“Programs.” “Go to school every day.”',
      summary:
        'Publish the combined Jackquann + Nigel line as a short public EL story so the postcard can link to a first-class storyteller route instead of only the ALMA page. Requires Nigel storyteller disambiguation first.',
      storyType: 'personal_narrative',
      themes: ['judges-on-country', 'oonchiumpa', 'programs', 'school', 'family'],
      sourceHref: '/alma/oonchiumpa',
      destinationHref: '/organizations/oonchiumpa?lens=judiciary',
      blocker:
        'Resolve the duplicate Nigel storyteller records in EL before publishing this combined quote as a public story.',
    },
  },
  {
    id: 'card-3',
    number: '03',
    navTitle: 'Jackquann',
    front: {
      kind: 'photo',
      kicker: 'Jackquann / 14',
      title: '“Detention. That’s not my home.”',
      quote: '“At six o’clock you get locked down. You wait till tomorrow.”',
      attribution: 'Jackquann, 14  ·  Upper Camp, Alice Springs  ·  Oonchiumpa',
      imageSrc: JUDGES_POSTCARD_MEDIA.jackquann,
      imageAlt: 'Portrait of Jackquann, 14, at Oonchiumpa',
      accent: '#A8D8C7',
      imageFilter: 'brightness(0.42)',
      footerLabel: 'Jackquann, 14  ·  Upper Camp, Alice Springs  ·  Oonchiumpa',
    },
    back: {
      title: 'Jackquann did not ask for harsher punishment',
      subtitle: 'Jackquann, 14, lives at Upper Camp with his grandfather',
      destination: 'storyJackquann',
      accent: '#174C3F',
      paragraphs: [
        'Jackquann lives at Upper Camp with his grandfather. He is 14. He has been in the Alice Springs Detention Centre. He described it plainly: “At six o’clock you get locked down. You wait till tomorrow.”',
        'Asked what would stop him getting in trouble, he said “Looking after my family.” Asked what he would tell politicians, he said “Programs.” He wants a job. He wants to start his own family.',
      ],
      callout: {
        style: 'dark-panel',
        label: 'What judges should hear',
        text: 'Family, programs, and practical support are what he named. Not punishment. Not compliance. Not deterrence.',
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
        excerpt: '“Detention. That’s not my home.” “At six o’clock you get locked down. You wait till tomorrow.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'Portrait of Jackquann on postcard front',
        href: '/sites/oonchiumpa',
        note: 'Local Oonchiumpa portrait of Jackquann, cleared for public use on the judges field pack.',
        assetPath: '/images/orgs/oonchiumpa/jackquann.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.jackquann,
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
      kind: 'photo',
      kicker: 'Nigel / 14',
      title: '“When I’m talking to the judge, I feel like I’m panicking.”',
      quote: '“Bad. Like, going away from my family and stuff.”',
      attribution: 'Nigel, 14  ·  Double Camp  ·  Oonchiumpa',
      imageSrc: JUDGES_POSTCARD_MEDIA.nigel,
      imageAlt: 'Portrait of Nigel, 14, at Oonchiumpa',
      accent: '#2D2D2D',
      imageFilter: 'brightness(0.42)',
      footerLabel: 'Nigel, 14  ·  Double Camp  ·  Oonchiumpa',
    },
    back: {
      title: 'Nigel named what detention interrupts',
      subtitle: 'Nigel lives at a station in Double Camp',
      destination: 'storyNigel',
      accent: '#111111',
      paragraphs: [
        'Nigel lives at a station in Double Camp. He is 14. He likes school and wants to be a footy player. He has been to Don Dale in Darwin. He described it as kids fighting every day.',
        'Asked what it feels like being away, he said “Bad. Like, going away from my family and stuff.” In court, talking to the judge, he says he panics. Oonchiumpa picks him up, takes him to school, and gives him consistency. That consistency is the intervention.',
      ],
      callout: {
        style: 'light-panel',
        label: 'What judges should hear',
        text: '“I wanna be a footy player.” “Go to school every day.” He already knows what he needs. The system keeps interrupting it.',
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
        excerpt: '“When I’m talking to the judge, I feel like I’m panicking.” “Bad. Like, going away from my family and stuff.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'Portrait of Nigel on postcard front',
        href: '/sites/oonchiumpa',
        note: 'Local Oonchiumpa portrait of Nigel, cleared for public use on the judges field pack.',
        assetPath: '/images/orgs/oonchiumpa/nigel.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.nigel,
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
      kind: 'photo',
      kicker: 'Laquisha / 16',
      title: '“Court is scary because you don’t know whether you are getting out or not.”',
      quote: '“I don’t like going to Darwin cause I have no family there. Just 12 minute calls.”',
      attribution: 'Laquisha, 16  ·  Alice Springs  ·  Oonchiumpa',
      imageSrc: JUDGES_POSTCARD_MEDIA.laquisha,
      imageAlt: 'Portrait of Laquisha, 16, at Oonchiumpa',
      accent: '#F5D1C8',
      imageFilter: 'brightness(0.44)',
      footerLabel: 'Laquisha, 16  ·  Alice Springs  ·  Oonchiumpa',
    },
    back: {
      title: 'Laquisha named the structure plainly',
      subtitle: 'Laquisha lives with her auntie, 16, goes to St Joseph’s',
      destination: 'storyLaquisha',
      accent: '#C14E33',
      paragraphs: [
        'Laquisha lives with her auntie. She is 16, goes to St Joseph’s. She has been to Darwin youth detention, 1,500km from home. Twelve-minute phone calls. Two-hour waits between calls. No family there. Lockdown at 6:30 every night.',
        'When asked why young people get in trouble, she answered in one word: “Oppression.” She wants her driver’s licence. She wants to travel. Court is scary because you don’t know whether you are getting out or not, and your family is sitting there watching.',
      ],
      callout: {
        style: 'accent-rule',
        label: 'What judges should hear',
        text: '“It would’ve been better hanging around with family instead of sitting in your cell by yourself. Just 12 minute calls.” — Laquisha',
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
        excerpt: '“Court is scary because you don’t know whether you are getting out or not.” “Oppression.”',
      },
      {
        kind: 'image',
        status: 'local',
        label: 'Portrait of Laquisha on postcard front',
        href: '/sites/oonchiumpa',
        note: 'Local Oonchiumpa portrait of Laquisha, cleared for public use on the judges field pack.',
        assetPath: '/images/orgs/oonchiumpa/laquisha.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.laquisha,
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
      proposedTitle: 'Court Is Scary',
      quoteExcerpt: '“Court is scary because you don’t know whether you are getting out or not.”',
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
      kicker: 'Xavier / Trust',
      title: '“He trusts us. We earned that trust.”',
      quote: 'Other services distanced from him when it got hard. Oonchiumpa did not. Xavier now leads Stretch Bed building work.',
      attribution: 'Fred Campbell on Xavier  ·  Oonchiumpa',
      imageSrc: JUDGES_POSTCARD_MEDIA.xavierBed,
      imageAlt: 'Xavier at Oonchiumpa, building Stretch Beds',
      accent: '#1E5E4B',
      imageFilter: 'brightness(0.40)',
      footerLabel: 'Fred Campbell on Xavier  ·  Oonchiumpa',
    },
    back: {
      title: 'What happens when one organisation does not give up',
      subtitle: 'Xavier was one of Oonchiumpa’s first clients',
      destination: 'storyTrust',
      accent: '#1E5E4B',
      paragraphs: [
        'Xavier was one of Oonchiumpa’s first clients. Other service providers did not share his disabilities and distanced from him when the relationship got hard. Oonchiumpa did not.',
        'Fred Campbell says “He trusts us. We earned that trust.” Xavier was released from youth detention at the start of the year and has not been back in trouble. He helped build Stretch Beds from recycled plastic, bought his first pair of shoes with his pay, and ran home to show his family. Fred says he is quite capable of building on his own and sharing that with other kids.',
      ],
      callout: {
        style: 'light-panel',
        label: 'Take this back to chambers',
        text: '1. Watch the Oonchiumpa video  ·  2. Find programs near your own court  ·  3. Share this page with colleagues  ·  4. Explore the CONTAINED campaign  ·  5. Stay connected to Oonchiumpa  ·  6. Support community-based alternatives',
      },
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
        label: 'Xavier building Stretch Beds photo on postcard front',
        href: '/sites/oonchiumpa',
        note: 'Local Oonchiumpa photo of Xavier at work on Stretch Beds, cleared for public use on the judges field pack.',
        assetPath: '/images/orgs/oonchiumpa/xavier-bed.jpg',
        previewSrc: JUDGES_POSTCARD_MEDIA.xavierBed,
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
