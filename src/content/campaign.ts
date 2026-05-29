export const campaignMetadata = {
  name: "CONTAINED",
  tagline: "Transform Youth Justice Through Immersive Advocacy",
  launchDate: "2026",
  location: "Mount Druitt gathering, then Tandanya Adelaide launch",
  primaryCta: {
    label: "Nominate a Leader",
    href: "#nominate",
  },
  secondaryCta: {
    label: "Book Your Experience",
    href: "#book",
  },
  counters: {
    baseNominations: 1247,
    goalNominations: 2500,
    goalLabel: "Nominations to secure political attendance",
    slotsPerDay: 24,
  },
  progress: {
    label: "Premier Nominated",
    goal: 100,
    current: 47,
  },
  description:
    "Thirty minutes inside one shipping container, three rooms. The tour starts with a flexible Mount Druitt gathering, then launches publicly in Adelaide with the Brisbane build story, David from Diagrama's practice lens, and local organisations showing what already works.",
};

export const journeyContainers = [
  {
    id: "current-reality",
    step: 1,
    title: "Current Reality",
    headline: "Designed by Young People",
    summary:
      "Young people who supported the build carry the first Room 1 story into a flexible Mount Druitt gathering and then the Adelaide public launch. At every stop, local young people then shape the room from their own place and decide what the public needs to see.",
    stats: [
      { label: "Daily Cost", value: "$4,250" },
      { label: "Annual Cost", value: "$1.55M" },
      { label: "Reoffending", value: "84%" },
      { label: "Education Completion", value: "18%" },
    ],
    duration: "10 minutes locked inside",
    tone: "critical",
  },
  {
    id: "therapeutic-model",
    step: 2,
    title: "What Works",
    headline: "Diagrama Foundation, Spain",
    summary:
      "David from Diagrama helps anchor the practice lens for Room 2. The room is grounded in what we saw inside Diagrama's youth justice centres in Spain: education, therapy, family contact, 1:1 staffing, and a recidivism rate of just 13.6%.",
    stats: [
      { label: "Recidivism", value: "13.6%" },
      { label: "Staff Ratio", value: "1:1" },
      { label: "Social Return", value: "€5.64 per €1" },
      { label: "Family Contact", value: "Weekly" },
    ],
    duration: "10 minutes of possibility",
    tone: "transitional",
  },
  {
    id: "future-vision",
    step: 3,
    title: "The Organisations Already Doing It",
    headline: "Changes Every Stop",
    summary:
      "Room 3 is where local organisations show the programs already working and name what they need funded. Mount Druitt gives the process a small first gathering, Adelaide gives it a public launch during the Reintegration Puzzle Conference, then every stop rebuilds it with local hosts.",
    stats: [
      { label: "Community Programs", value: "$75/day" },
      { label: "Reoffending", value: "3%" },
      { label: "Success Rate", value: "88%" },
      { label: "Orgs on ALMA", value: "1,081" },
    ],
    duration: "10 minutes to see what works",
    tone: "hopeful",
  },
];

export const actionTracks = {
  nomination: {
    id: "nominate",
    title: "Nominate a Decision Maker",
    description: "Create the public pressure that forces participation.",
    items: [
      "State and federal politicians",
      "Justice and youth detention officials",
      "Media directors and editors",
      "Business and philanthropy leaders",
      "Community power brokers",
    ],
    buttonLabel: "Nominate Now",
  },
  booking: {
    id: "book",
    title: "Experience It Yourself",
    description: "Thirty minutes that change how you see youth justice forever.",
    items: [
      "24 slots available daily",
      "Trauma-informed facilitation",
      "Action toolkit takeaway",
      "Join the alumni pressure network",
      "Pay what you can ($0-$50)",
    ],
    buttonLabel: "Book Experience",
  },
};

export type EvidenceHighlight = {
  label: string;
  value: string;
  source?: string;
};

export const evidenceHighlights: EvidenceHighlight[] = [
  {
    label: "Cost per detained youth",
    value: "$1.55M",
    source: "Productivity Commission ROGS 2024-25",
  },
  {
    label: "Detention reoffending",
    value: "84%",
    source: "Queensland Youth Justice Strategy 2023",
  },
  {
    label: "Community reoffending",
    value: "3%",
    source: "Community Accountability Pilot 2024",
  },
  {
    label: "Youth helped for same cost",
    value: "16×",
    source: "Queensland Productivity Commission 2024",
  },
  {
    label: "Youth detained in Finland",
    value: "4",
    source: "Finnish Ministry of Justice 2024",
  },
  {
    label: "Restorative justice success",
    value: "88%",
    source: "Queensland Department of Justice 2024",
  },
  {
    label: "Daily cost of alternatives",
    value: "$75",
    source: "Community Services Benchmark Study 2024",
  },
  {
    label: "Tour stops",
    value: "9",
    source: "CONTAINED Australian Tour — Mount Druitt, Adelaide, Perth, Brisbane, Northern Rivers, Central Australia, Sydney + Canberra, Victoria, Tasmania",
  },
];

// ── Media Config ──────────────────────────────────────────
// Update these URLs as media becomes available.
// Videos: YouTube, Vimeo, or local files in /public/images/contained/
// Images: local files in /public/images/contained/ or Supabase storage URLs

const SUPABASE_MEDIA = 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/media/contained';

export const campaignMedia = {
  heroVideo: {
    url: `${SUPABASE_MEDIA}/cell-video.mp4`,
    thumbnail: `${SUPABASE_MEDIA}/justicehub-hero-landscape.png`,
    title: 'CONTAINED: Australian Tour 2026',
    description: 'One shipping container. Three rooms. Thirty minutes. The reality of youth detention, the therapeutic alternative, and the future we can build.',
  },
  heroImage: `${SUPABASE_MEDIA}/justicehub-hero-landscape.png`,
  brandSquare: `${SUPABASE_MEDIA}/contained-brand-square.png`,
  storyImage: `${SUPABASE_MEDIA}/contained-story.png`,
  containerRoom: `${SUPABASE_MEDIA}/container-room.jpg`,
  cellVideoMov: `${SUPABASE_MEDIA}/cell-video.mov`,
  orgHeros: {
    oonchiumpa: `${SUPABASE_MEDIA}/gallery/oonchiumpa-hero.jpg`,
    bgfit: `${SUPABASE_MEDIA}/gallery/bgfit-hero.jpg`,
  },
  // Local campaign assets
  posterBrand: '/images/contained/poster-brand.png',
  posterTour: '/images/contained/poster-tour.png',
  // chalkQuestion ARCHIVED — too AI-looking (moved to _archived-ai-photorealistic/)
  logoSquare: '/images/contained/logo-contained-square.png',
  logoWhite: '/images/contained/logo-contained-white.png',
  // Curated real EL container room photos (from d0a162d2 media set)
  roomPhotos: [
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631913022_Contained-4.jpg', caption: 'Room 1: Current Reality' },
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631914088_Contained-5.jpg', caption: 'The CONTAINED experience' },
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631915230_Contained-7.jpg', caption: 'Inside the container' },
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631917162_Contained-9.jpg', caption: 'Room 2: What works' },
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631918931_Contained-10.jpg', caption: 'Room 3: What could be' },
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631919844_Contained-11.jpg', caption: 'The installation' },
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631920999_Contained-23.jpg', caption: 'The container' },
    { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773632013813_two_rooms.png', caption: 'Two realities, side by side' },
  ],
  // Gallery images - add as many as needed
  gallery: [] as Array<{
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
  }>,
};

export type TourStopStatus = 'funded' | 'confirmed' | 'planning' | 'tentative' | 'exploring';

export interface TourStop {
  city: string;
  state: string;
  venue: string;
  partner?: string;
  description: string;
  eventSlug: string;
  date: string;
  status: TourStopStatus;
  lat: number;
  lng: number;
  partnerQuote?: string;
}

export const tourStops: TourStop[] = [
  {
    city: 'Mount Druitt',
    state: 'NSW',
    venue: 'Mounty Yarns · Western Sydney small gathering',
    partner: 'Mounty Yarns + Just Reinvest NSW',
    description:
      'A flexible May/June small gathering in Western Sydney before the public launch. Mount Druitt holds the early proof: young people, Mounty Yarns, Just Reinvest relationships, and the first local conversation about how Room 1 and Room 3 should travel.',
    eventSlug: 'contained-mount-druitt-gathering',
    date: 'May-Jun 2026 · small gathering',
    status: 'planning',
    lat: -33.74,
    lng: 150.82,
    partnerQuote: 'Western Sydney build proof and community reflections are the first small gathering.',
  },
  {
    city: 'Adelaide',
    state: 'SA',
    venue: 'Tandanya · Reintegration Puzzle Conference',
    partner: 'Justice Reform Initiative + Tandanya',
    description:
      'The public launch lands at Tandanya at the end of June alongside the Reintegration Puzzle Conference. Brisbane young people who supported the build carry the first Room 1 story. David from Diagrama anchors the Room 2 practice lens. Adelaide organisations use Room 3 to show their programs, evidence, costs, and what they need funded.',
    eventSlug: 'contained-adelaide-tandanya',
    date: 'Late Jun 2026 · public launch',
    status: 'planning',
    lat: -34.93,
    lng: 138.60,
    partnerQuote: 'Talking to Ben about options on Kaurna Yarta for 2026 — Hannah March, JRI',
  },
  {
    city: 'Perth + surrounds',
    state: 'WA',
    venue: 'University of Western Australia + regional drop-in',
    partner: 'UWA + Reconciliation WA + Department of Justice WA',
    description:
      'July/August in Perth and surrounds, with a regional drop-in to Broome or Kalgoorlie. UWA and Reconciliation WA carry the academic and civic spine. The container becomes the public priming layer for the Department of Justice WA delegated-authority pilot communities.',
    eventSlug: 'contained-perth-uwa',
    date: 'Jul-Aug 2026 · Perth + surrounds',
    status: 'planning',
    lat: -31.95,
    lng: 115.86,
    partnerQuote: "We can't wait to have this in Perth!!! — Hayley Passmore, Criminology Lecturer",
  },
  {
    city: 'Brisbane',
    state: 'QLD',
    venue: 'YAC · Youth Advocacy Centre',
    partner: 'YAC + EPIC Pathways',
    description:
      'YAC is hosting. Queensland has the strongest demand signal nationally — a sitting state MP has asked publicly where the container is touring. One month of public weeks, MP days, and university partnerships.',
    eventSlug: 'contained-brisbane',
    date: 'Sep 2026 · Brisbane',
    status: 'planning',
    lat: -27.47,
    lng: 153.03,
    partnerQuote: 'We would love to host this at YAC!!! — Katherine Hayes, YAC',
  },
  {
    city: 'Northern Rivers',
    state: 'NSW',
    venue: 'The Buttery',
    partner: 'The Buttery',
    description:
      'A month in the Northern Rivers in partnership with The Buttery. Therapeutic-community lineage, lived-experience pathways, and a regional public the metro circuit does not reach.',
    eventSlug: 'contained-northern-rivers',
    date: 'Oct 2026 · Northern Rivers',
    status: 'tentative',
    lat: -28.81,
    lng: 153.27,
  },
  {
    city: 'Alice Springs · Central Australia',
    state: 'NT',
    venue: 'Oonchiumpa + Central Australian community spaces',
    partner: 'Oonchiumpa Aboriginal Corporation',
    description:
      'November in Alice Springs and Central Australia. Oonchiumpa runs a 95% diversion rate through Central Arrernte-designed programs. The container, the build, and the public weeks happen on community terms.',
    eventSlug: 'contained-alice-springs-central-australia',
    date: 'Nov 2026 · Central Australia',
    status: 'confirmed',
    lat: -23.70,
    lng: 133.88,
  },
  {
    city: 'Sydney + Canberra',
    state: 'NSW',
    venue: 'Sydney civic venue + Parliament-facing Canberra days',
    partner: 'Uniting + University of Sydney + ACT civic partners',
    description:
      'A flexible December/January NSW and ACT run. Sydney carries the advocacy and research spine through Uniting and the University of Sydney. Canberra gives the same evidence a federal-facing moment with MPs, territory leaders, and the press gallery.',
    eventSlug: 'contained-sydney-canberra',
    date: 'Dec 2026-Jan 2027 · Sydney + Canberra',
    status: 'tentative',
    lat: -34.62,
    lng: 150.15,
    partnerQuote: 'Hoping some NSW MPs come and look — Emma Maiden, Director Advocacy, Uniting',
  },
  {
    city: 'Victoria',
    state: 'VIC',
    venue: 'Melbourne / regional Victoria venue TBC',
    partner: 'St Martins YAC + RMIT + Victorian partners',
    description:
      'February/March 2027 in Victoria. A youth arts collaboration, public access, local Room 3 program partners, and an academic spine through RMIT or aligned Victorian partners.',
    eventSlug: 'contained-victoria',
    date: 'Feb-Mar 2027 · Victoria',
    status: 'tentative',
    lat: -37.81,
    lng: 144.96,
    partnerQuote: 'This needs to be seen in Melbourne. We work with young people — Nadja Kostich, CEO St Martins YAC',
  },
  {
    city: 'Tasmania',
    state: 'TAS',
    venue: 'Hobart / Tasmania venue TBC',
    partner: 'DarkLab + Prevention Not Detention Tasmania',
    description:
      'April 2027 in Tasmania. The tour closes with Prevention Not Detention Tasmania, cultural institution interest, coalition organising, and the year-end public record.',
    eventSlug: 'contained-tasmania',
    date: 'Apr 2027 · Tasmania',
    status: 'tentative',
    lat: -42.88,
    lng: 147.33,
    partnerQuote: 'We will make sure we get as many politicians, public and workers through it — Loic Fery',
  },
];

export const campaignFundraising = {
  goal: 500000,
  currentAmount: 0,
  currency: 'AUD',
  milestones: [
    {
      amount: 20000,
      label: 'Mount Druitt · May-Jun · small gathering',
      description: 'Flexible Western Sydney gathering, young people paid, Mounty Yarns and Just Reinvest relationships held, first local proof captured.',
    },
    {
      amount: 50000,
      label: 'Adelaide · Tandanya · end of June',
      description: 'Public launch alongside the Reintegration Puzzle Conference. Brisbane build story, Diagrama practice lens, Adelaide organisations, documentation, and JusticeHub publishing.',
    },
    {
      amount: 50000,
      label: 'Perth + surrounds · Jul-Aug',
      description: 'UWA + Reconciliation WA + regional drop-in to Broome or Kalgoorlie. The container becomes the public priming layer for the Department of Justice WA delegated-authority pilot.',
    },
    {
      amount: 40000,
      label: 'Brisbane · September',
      description: 'YAC hosts. EPIC Pathways and Queensland MPs in the room.',
    },
    {
      amount: 35000,
      label: 'Northern Rivers · October',
      description: 'The Buttery partnership. Therapeutic-community lineage and a regional public the metro circuit does not reach.',
    },
    {
      amount: 50000,
      label: 'Alice Springs · Central Australia · November',
      description: 'Oonchiumpa-led, cultural authority paid, Central Australian community terms, local program evidence captured.',
    },
    {
      amount: 60000,
      label: 'Sydney + Canberra · Dec-Jan',
      description: 'Sydney advocacy and research spine, then Parliament-facing Canberra days for federal MPs, territory leaders, and the press gallery.',
    },
    {
      amount: 40000,
      label: 'Victoria · Feb-Mar',
      description: 'Victorian youth arts collaboration, public access, academic spine, and local Room 3 program partners.',
    },
    {
      amount: 35000,
      label: 'Tasmania · April',
      description: 'Prevention Not Detention Tasmania coalition, cultural institution interest, and year-end public record.',
    },
    {
      amount: 120000,
      label: 'Tour-wide backbone · 12 months',
      description: 'Travelling lived-experience facilitator core, editorial and documentation, national coordination, year-end bound volume, insurance + admin.',
    },
  ],
};

export interface WorldTourRegion {
  name: string;
  countries: { name: string; partner: string }[];
  description: string;
}

export const worldTour: WorldTourRegion[] = [
  {
    name: 'Europe',
    countries: [
      { name: 'Spain', partner: 'Diagrama Foundation' },
      { name: 'Netherlands', partner: 'Youth Care & Justice System' },
      { name: 'Norway', partner: 'Bastøy Prison & Youth System' },
    ],
    description:
      'The Empathy Ledger World Tour begins in Europe, learning from the systems that have already transformed youth justice.',
  },
  {
    name: 'Africa',
    countries: [
      { name: 'Kenya', partner: 'Youth justice innovation partners' },
      { name: 'South Africa', partner: 'Restorative justice networks' },
    ],
    description:
      'Community-led justice models in Africa offer powerful parallels to Indigenous Australian approaches.',
  },
  {
    name: 'Pacific',
    countries: [
      { name: 'New Zealand', partner: 'Family Group Conference model' },
    ],
    description:
      'Aotearoa\'s family group conferencing model, the original restorative justice innovation, connects directly to what Australia needs.',
  },
];

export type SocialPlatform = 'twitter' | 'instagram' | 'facebook' | 'linkedin';

export interface SocialPost {
  platform: SocialPlatform;
  label: string;
  content: string;
  hashtags: string[];
}

export interface TourSocialKit {
  tourStopSlug: string;
  city: string;
  posts: SocialPost[];
}

const CORE_HASHTAGS = ['#TheContained', '#YouthJustice', '#JusticeHub'];

export const tourSocialKits: TourSocialKit[] = [
  {
    tourStopSlug: 'contained-mount-druitt-gathering',
    city: 'Mount Druitt, NSW',
    posts: [
      {
        platform: 'twitter',
        label: 'Small Gathering',
        content: `THE CONTAINED starts with a small Mount Druitt gathering in May/June.

Young people, Mounty Yarns, Just Reinvest relationships, and Western Sydney build proof help shape what travels next.

Then the public launch lands at Tandanya in Adelaide.`,
        hashtags: [...CORE_HASHTAGS, '#MountDruitt', '#WesternSydney'],
      },
      {
        platform: 'linkedin',
        label: 'Process Signal',
        content: `Before THE CONTAINED launches publicly in Adelaide, the process starts with a smaller Mount Druitt gathering.

That matters. The tour is not a fixed roadshow dropped into communities. It is a flexible process: young people and local organisations help shape what the container carries, what evidence is shown, and what funders are asked to back next.`,
        hashtags: [...CORE_HASHTAGS, '#CommunityLed', '#YouthJustice'],
      },
    ],
  },
  {
    tourStopSlug: 'contained-adelaide-tandanya',
    city: 'Adelaide, SA',
    posts: [
      {
        platform: 'twitter',
        label: 'Announcement',
        content: `THE CONTAINED public launch lands at Tandanya in Adelaide.

One shipping container. Three rooms. Thirty minutes.

Mount Druitt starts the process. Brisbane young people carry the build story. David from Diagrama anchors Room 2. Adelaide organisations show what is already working.`,
        hashtags: [...CORE_HASHTAGS, '#Adelaide', '#Reintegration'],
      },
      {
        platform: 'facebook',
        label: 'Community Post',
        content: `What if decision-makers could feel what youth detention is actually like?

That is the idea behind THE CONTAINED, an immersive shipping container experience publicly launching its Australian tour at Tandanya in Adelaide after a small Mount Druitt gathering.

Three rooms tell the story: detention reality, the therapeutic alternative shaped with David from Diagrama, and the local future held by Adelaide organisations talking about their programs, costs, and support needs.`,
        hashtags: [...CORE_HASHTAGS, '#Adelaide'],
      },
      {
        platform: 'linkedin',
        label: 'Professional',
        content: `The process starts with a small Mount Druitt gathering, then the public tour launches at Tandanya in Adelaide alongside the Reintegration Puzzle Conference.

Brisbane young people who supported the build carry the first room. David from Diagrama anchors the practice lens. Adelaide organisations use Room 3 to show the programs already working and the support they need to grow.`,
        hashtags: [...CORE_HASHTAGS, '#SocialPolicy', '#Evidence', '#Reform'],
      },
    ],
  },
  {
    tourStopSlug: 'contained-brisbane',
    city: 'Brisbane',
    posts: [
      {
        platform: 'twitter',
        label: 'Announcement',
        content: `Brisbane helped build the first CONTAINED story.

Young people who supported the build carry Room 1 into the Australian tour.

The container reaches Queensland in September with YAC, EPIC Pathways, MPs, universities, and community programs in the room.`,
        hashtags: [...CORE_HASHTAGS, '#Brisbane', '#YouthVoice'],
      },
      {
        platform: 'instagram',
        label: 'Build Story',
        content: `The tour process starts in Mount Druitt, launches publicly in Adelaide, and the build story runs through Brisbane.

Young people from Brisbane helped shape the first CONTAINED build. Their work carries into Room 1, then each city rebuilds the room with its own young people and local organisations.

When the container lands in Brisbane in September, YAC and EPIC Pathways bring the Queensland sector into the room.`,
        hashtags: [...CORE_HASHTAGS, '#Brisbane', '#Queensland', '#YouthJustice'],
      },
    ],
  },
  {
    tourStopSlug: 'contained-perth-uwa',
    city: 'Perth',
    posts: [
      {
        platform: 'twitter',
        label: 'Announcement',
        content: `THE CONTAINED is coming to Perth and surrounds.

University of Western Australia. July/August 2026. Academic rigour meets immersive advocacy.`,
        hashtags: [...CORE_HASHTAGS, '#Perth', '#UWA'],
      },
      {
        platform: 'linkedin',
        label: 'Professional',
        content: `THE CONTAINED partners with the University of Western Australia for the Western Australian stop on its Australian tour, July/August 2026.

After Mount Druitt and Adelaide, the tour brings the immersive experience to campus and surrounds, where youth justice researchers, students, and community can walk through three rooms that make the case for change.`,
        hashtags: [...CORE_HASHTAGS, '#UWA', '#Research', '#YouthJustice'],
      },
    ],
  },
  {
    tourStopSlug: 'contained-alice-springs-central-australia',
    city: 'Alice Springs · Central Australia',
    posts: [
      {
        platform: 'twitter',
        label: 'Announcement',
        content: `THE CONTAINED goes to Central Australia.

Alice Springs and Central Australia. November 2026. Community-controlled. Culture-centred.`,
        hashtags: [...CORE_HASHTAGS, '#CentralAustralia', '#NT', '#FirstNations'],
      },
      {
        platform: 'linkedin',
        label: 'Professional',
        content: `THE CONTAINED travels to Alice Springs and Central Australia in November 2026.

A community-controlled activation centring First Nations leadership in youth justice reform. The communities most affected must lead the conversation about alternatives.`,
        hashtags: [...CORE_HASHTAGS, '#FirstNations', '#CommunityLed', '#SelfDetermination'],
      },
    ],
  },
];

export const generalSocialPosts: SocialPost[] = [
  {
    platform: 'twitter',
    label: 'Tour Overview',
    content: `THE CONTAINED: Australian Tour 2026-27.

Mount Druitt small gathering. Adelaide public launch. Nine-stop national arc.

Mount Druitt -> Adelaide -> Perth + surrounds -> Brisbane -> Northern Rivers -> Alice Springs / Central Australia -> Sydney + Canberra -> Victoria -> Tasmania

justicehub.com.au/contained`,
    hashtags: CORE_HASHTAGS,
  },
  {
    platform: 'instagram',
    label: 'Tour Overview',
    content: `THE CONTAINED is going national.

May/June: Mount Druitt small gathering
End of June: Adelaide public launch
July/August: Perth and surrounds
September: Brisbane
October: Northern Rivers
November: Alice Springs / Central Australia
December/January: Sydney + Canberra
February/March 2027: Victoria
April 2027: Tasmania

The route is flexible because the process follows community need, partner readiness, and the funders willing to back each place.`,
    hashtags: [...CORE_HASHTAGS, '#AustralianTour', '#ImmersiveAdvocacy'],
  },
  {
    platform: 'twitter',
    label: 'Stats Hook',
    content: `$1.55 million per child per year on youth detention.
84% reoffend within 2 years.

Community programs: $75/day. 88% success rate.

THE CONTAINED makes you feel these numbers. Australian Tour 2026-27.`,
    hashtags: CORE_HASHTAGS,
  },
  {
    platform: 'twitter',
    label: 'Fundraising',
    content: `$500K funds THE CONTAINED Australian Tour.

$20K -> Mount Druitt small gathering
$50K -> Adelaide public launch at Tandanya
$30K-$60K -> one tour stop
$120K -> tour-wide backbone

Every dollar links the container experience to JusticeHub, the public evidence layer.

justicehub.com.au/contained/tour`,
    hashtags: [...CORE_HASHTAGS, '#FundTheMovement'],
  },
];

export const campaignPages = {
  stories: {
    path: '/contained/stories',
    title: 'Real Stories of Justice',
    description: 'Community voices, evidence, and lived experience from across Australia.',
    navLabel: 'Stories',
  },
  tour: {
    path: '/contained/tour',
    title: 'THE CONTAINED: Australian Tour 2026',
    description: 'One shipping container, three rooms, thirty minutes.',
    navLabel: 'Tour',
  },
  act: {
    path: '/contained/act',
    title: 'Take Action',
    description: 'SMS, email, and social templates to amplify the campaign.',
    navLabel: 'Take Action',
  },
  social: {
    path: '/contained/tour/social',
    title: 'Social Media Kit',
    description: 'Ready-to-post content for every platform and every tour stop.',
    navLabel: 'Social Kit',
  },
};

export const narrativePillars = [
  {
    title: "Truth Through Experience",
    description:
      "Immersive storytelling grounded in lived experience turns statistics into undeniable reality.",
  },
  {
    title: "Evidence-Based Hope",
    description:
      "International models prove therapeutic approaches work. Queensland can invest in what already succeeds.",
  },
  {
    title: "Collective Accountability",
    description:
      "Political change follows public pressure. Every nomination, booking, and story fuels momentum.",
  },
];

// ---------------------------------------------------------------------------
// Launch Gates
// ---------------------------------------------------------------------------
// NEXT_PUBLIC_LAUNCH_STAGE controls which /contained/* pages are publicly
// visible. Each stage is additive — later stages include all earlier pages.
//
// 'preview' — core landing + social kit + act (soft launch)
// 'live'    — everything except deferred pages
// 'full'    — all pages enabled
//
// Default: 'preview' (safest)
// ---------------------------------------------------------------------------

export type LaunchStage = 'preview' | 'live' | 'full';

export const LAUNCH_STAGE: LaunchStage =
  (process.env.NEXT_PUBLIC_LAUNCH_STAGE as LaunchStage) || 'preview';

/** Pages enabled per stage (cumulative — each stage adds to the previous) */
const stagePages: Record<LaunchStage, string[]> = {
  preview: [
    '/contained',
    '/contained/tour',
    '/contained/tour/social',
    '/contained/act',
    '/contained/stories',
    '/contained/about',
    '/contained/content',
    '/contained/share',
    '/contained/canberra',
  ],
  live: [
    '/contained/launch',
    '/contained/experience',
  ],
  full: [
    '/contained/nominations',
    '/contained/vip-dinner',
    '/contained/register',
    '/contained/enroll',
  ],
};

/** All pages enabled at the current launch stage */
function getEnabledPages(stage: LaunchStage): Set<string> {
  const stages: LaunchStage[] = ['preview', 'live', 'full'];
  const idx = stages.indexOf(stage);
  const pages = new Set<string>();
  for (let i = 0; i <= idx; i++) {
    stagePages[stages[i]].forEach(p => pages.add(p));
  }
  return pages;
}

/**
 * Check whether a /contained/* path is enabled at the current launch stage.
 * Dynamic routes like /contained/tour/[slug] are enabled if their parent is.
 */
export function isContainedPageEnabled(pathname: string): boolean {
  const enabled = getEnabledPages(LAUNCH_STAGE);

  // Exact match
  if (enabled.has(pathname)) return true;

  // Dynamic route — check if the parent is enabled (e.g. /contained/tour/foo → /contained/tour)
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const parent = '/' + segments.join('/');
    if (enabled.has(parent)) return true;
  }

  return false;
}
