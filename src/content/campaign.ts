export const campaignMetadata = {
  name: "CONTAINED",
  tagline: "Transform Youth Justice Through Immersive Advocacy",
  launchDate: "2026",
  location: "Starting in Western Sydney",
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
    "Thirty minutes inside one shipping container, three rooms. The reality of youth detention, the evidence for change, and the community-led alternatives already doing the work.",
};

export const journeyContainers = [
  {
    id: "current-reality",
    step: 1,
    title: "Current Reality",
    headline: "Designed by Young People",
    summary:
      "At every tour stop, young people from the local community design this room. They are the experts. They know what detention feels like. They decide what the public needs to see.",
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
      "We visited Diagrama's youth justice centres in Spain. Kids get education, therapy, and connection instead of concrete walls. 1:1 staffing, family visits every week, and a recidivism rate of just 13.6%. This room recreates what we saw there.",
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
      "This container celebrates the grassroots organisations and the people doing the work. Indigenous-led and community orgs that aren't being valued, reported on, or funded the way they should be. At each tour stop, the local host organisation fills this space with their story.",
    stats: [
      { label: "Community Programs", value: "$75/day" },
      { label: "Reoffending", value: "3%" },
      { label: "Success Rate", value: "88%" },
      { label: "Orgs on ALMA", value: "527" },
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
    label: "Mount Druitt launch window",
    value: "45 days",
    source: "CONTAINED Campaign Operations Plan",
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

export type TourStopStatus = 'confirmed' | 'planning' | 'tentative' | 'exploring';

export interface TourStop {
  city: string;
  state: string;
  venue: string;
  partner: string;
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
    venue: 'Mounty Yarns',
    partner: 'Mounty Yarns',
    description:
      'First stop, Western Sydney. The CONTAINED experience debuts at Mounty Yarns, a youth-led storytelling space in the heart of Mount Druitt.',
    eventSlug: 'contained-mount-druitt-launch',
    date: 'April 2026',
    status: 'planning',
    lat: -33.74,
    lng: 150.82,
    partnerQuote: 'Young people telling their own stories is the most powerful advocacy there is.',
  },
  {
    city: 'Adelaide',
    state: 'SA',
    venue: 'Adelaide Convention Centre',
    partner: 'Reintegration Conference + Justice Reform Initiative',
    description:
      'Bringing the container to the national Reintegration Conference. Policymakers, practitioners, and people with lived experience together.',
    eventSlug: 'contained-adelaide-reintegration',
    date: 'May 2026',
    status: 'confirmed',
    lat: -34.93,
    lng: 138.60,
    partnerQuote: 'The conference that could change the national conversation on youth justice.',
  },
  {
    city: 'Perth',
    state: 'WA',
    venue: 'University of Western Australia',
    partner: 'UWA School of Social Sciences',
    description:
      'Academic partnership exploring therapeutic alternatives to detention with WA\'s leading youth justice researchers.',
    eventSlug: 'contained-perth-uwa',
    date: 'May 2026',
    status: 'exploring',
    lat: -31.95,
    lng: 115.86,
  },
  {
    city: 'Tennant Creek',
    state: 'NT',
    venue: 'Community Space',
    partner: 'Indigenous community engagement',
    description:
      'Community-controlled engagement with First Nations families and leaders in the heart of the NT.',
    eventSlug: 'contained-tennant-creek',
    date: 'June 2026',
    status: 'exploring',
    lat: -19.65,
    lng: 134.19,
  },
];

export const campaignFundraising = {
  goal: 100000,
  currentAmount: 0,
  currency: 'AUD',
  milestones: [
    {
      amount: 25000,
      label: 'Container Build',
      description: 'Custom-build the one shipping container, three rooms with immersive installations',
    },
    {
      amount: 50000,
      label: 'Adelaide + Perth',
      description: 'Transport, logistics, and partner activation for confirmed tour stops',
    },
    {
      amount: 75000,
      label: 'Tennant Creek',
      description: 'Community-controlled engagement and cultural safety for NT activation',
    },
    {
      amount: 100000,
      label: 'Full Tour + Documentation',
      description: 'Complete Australian tour with professional documentation and evaluation',
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
    tourStopSlug: 'contained-mount-druitt-launch',
    city: 'Mount Druitt',
    posts: [
      {
        platform: 'twitter',
        label: 'Announcement',
        content: `THE CONTAINED launches in Western Sydney.

One shipping container, three rooms. Thirty minutes inside youth detention reality, then the alternative.

April 25, Mounty Yarns, Mount Druitt.

This is what $1.55M per child per year looks like. And what we could do instead.`,
        hashtags: [...CORE_HASHTAGS, '#MountDruitt', '#WesternSydney'],
      },
      {
        platform: 'instagram',
        label: 'Launch Post',
        content: `Three rooms. Three realities. Thirty minutes that change how you see youth justice.

THE CONTAINED launches April 25 at Mounty Yarns in Mount Druitt, a youth-led storytelling space in the heart of Western Sydney.

Container 1: The reality of youth detention. $4,250/day. 84% reoffending.
Container 2: The therapeutic alternative. Spain's Diagrama model. 73% success.
Container 3: Australia's future. Community-led. Culture-centred. Evidence-based.

This isn't a lecture. It's an experience.

Link in bio to register.`,
        hashtags: [...CORE_HASHTAGS, '#MountDruitt', '#MountyYarns', '#ImmersiveAdvocacy', '#YouthVoice'],
      },
      {
        platform: 'facebook',
        label: 'Community Post',
        content: `What if decision-makers could FEEL what youth detention is actually like?

That's the idea behind THE CONTAINED, an immersive shipping container experience launching April 25 at Mounty Yarns in Mount Druitt.

Three rooms tell three stories:
→ The current reality of youth detention in Australia
→ A therapeutic alternative that actually works (Spain's Diagrama model, 73% success rate)
→ A future we can build together

Australia spends $1.55 million per child per year on detention. 84% reoffend. Community programs cost a fraction and deliver lasting change.

Come experience it. Bring someone who needs to see it.

Register: justicehub.com.au/events/contained-mount-druitt-launch`,
        hashtags: [...CORE_HASHTAGS, '#MountDruitt'],
      },
      {
        platform: 'linkedin',
        label: 'Professional',
        content: `Australia spends $1.55M per child per year on youth detention. The reoffending rate is 84%.

Meanwhile, therapeutic models like Spain's Diagrama Foundation achieve 73% success rates at a fraction of the cost.

THE CONTAINED is an immersive experience that puts these numbers into physical reality. One shipping container, three rooms, each telling a different part of Australia's youth justice story.

Launching April 25 at Mounty Yarns in Mount Druitt, Western Sydney. Touring nationally in 2026.

If you work in youth justice, social policy, philanthropy, or community services, this is worth thirty minutes of your time.`,
        hashtags: [...CORE_HASHTAGS, '#SocialPolicy', '#Evidence', '#Reform'],
      },
    ],
  },
  {
    tourStopSlug: 'contained-adelaide-reintegration',
    city: 'Adelaide',
    posts: [
      {
        platform: 'twitter',
        label: 'Announcement',
        content: `THE CONTAINED is coming to Adelaide.

At the national Reintegration Conference. Policymakers, practitioners, and people with lived experience walking through the same three rooms.

June 15, Adelaide Convention Centre.

The evidence is overwhelming. Time to act on it.`,
        hashtags: [...CORE_HASHTAGS, '#Adelaide', '#Reintegration'],
      },
      {
        platform: 'instagram',
        label: 'Conference Post',
        content: `Adelaide. June 15. The Reintegration Conference.

THE CONTAINED brings its one shipping container, three rooms to the national stage, where the people who make policy meet the people who live with its consequences.

Policymakers. Practitioners. People with lived experience. Same containers. Same thirty minutes. Same unavoidable truth.

Youth detention costs $1.55M per child. It fails 84% of the time. The alternative exists. It works. It costs less.

This is the conference that could change the conversation.`,
        hashtags: [...CORE_HASHTAGS, '#Adelaide', '#Reintegration', '#JusticeReform', '#PolicyChange'],
      },
      {
        platform: 'facebook',
        label: 'Community Post',
        content: `THE CONTAINED is heading to Adelaide for the national Reintegration Conference on June 15.

This is where the conversation gets real. Policymakers, researchers, practitioners, and people with lived experience all walking through the same three rooms that make the case for changing how Australia does youth justice.

After the Mount Druitt launch, the tour continues building momentum. Adelaide brings the Justice Reform Initiative and the national reintegration community together.

The evidence is clear. Community-led alternatives work better, cost less, and keep young people connected to family and culture.

Register now: justicehub.com.au/events/contained-adelaide-reintegration`,
        hashtags: [...CORE_HASHTAGS, '#Adelaide', '#SouthAustralia'],
      },
      {
        platform: 'linkedin',
        label: 'Professional',
        content: `THE CONTAINED arrives at the national Reintegration Conference in Adelaide, June 15.

An immersive shipping container experience making the evidence-based case for therapeutic youth justice, now touring nationally after launching in Western Sydney.

For conference delegates: this is thirty minutes that reframes the entire conversation about youth detention, reoffending, and community alternatives.

Partnering with the Justice Reform Initiative to bring policymakers face-to-face with the evidence.`,
        hashtags: [...CORE_HASHTAGS, '#Reintegration', '#JusticeReform', '#Evidence'],
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
        content: `THE CONTAINED is coming to Perth.

University of Western Australia. August 2026. Academic rigour meets immersive advocacy.

Researchers, students, and community, experiencing the evidence together.`,
        hashtags: [...CORE_HASHTAGS, '#Perth', '#UWA'],
      },
      {
        platform: 'instagram',
        label: 'Campus Post',
        content: `Perth. August. University of Western Australia.

THE CONTAINED brings its immersive shipping container experience to campus, where WA's leading youth justice researchers, students, and community members can experience the evidence firsthand.

This is what happens when academic rigour meets advocacy. When data becomes physical. When the people studying the system walk through what it actually feels like.

More details coming soon.`,
        hashtags: [...CORE_HASHTAGS, '#Perth', '#UWA', '#Research', '#WesternAustralia'],
      },
      {
        platform: 'facebook',
        label: 'Community Post',
        content: `THE CONTAINED is heading to Perth in August, partnering with the University of Western Australia.

The third stop on the national tour brings the immersive experience to campus, where youth justice researchers, social work students, and the broader Perth community can walk through three rooms that make the case for change.

WA has its own youth justice challenges. THE CONTAINED connects the national evidence with local action.

Stay tuned for dates and registration.`,
        hashtags: [...CORE_HASHTAGS, '#Perth', '#WesternAustralia'],
      },
      {
        platform: 'linkedin',
        label: 'Professional',
        content: `THE CONTAINED partners with the University of Western Australia for the third stop on its national tour, August 2026.

An academic partnership exploring therapeutic alternatives to youth detention, bringing researchers, students, and community together through immersive experience.

The tour continues building the national evidence base for what works in youth justice.`,
        hashtags: [...CORE_HASHTAGS, '#UWA', '#Research', '#YouthJustice'],
      },
    ],
  },
  {
    tourStopSlug: 'contained-tennant-creek',
    city: 'Tennant Creek',
    posts: [
      {
        platform: 'twitter',
        label: 'Announcement',
        content: `THE CONTAINED goes to the heart of the NT.

Tennant Creek. September 2026. Community-controlled. Culture-centred.

First Nations families and leaders shaping the conversation about youth justice alternatives.`,
        hashtags: [...CORE_HASHTAGS, '#TennantCreek', '#NT', '#FirstNations'],
      },
      {
        platform: 'instagram',
        label: 'Community Post',
        content: `Tennant Creek. September. The heart of the Northern Territory.

THE CONTAINED's final Australian tour stop is community-controlled from the ground up. First Nations families and leaders shaping how the experience arrives, who it speaks to, and what comes next.

This isn't about bringing something to a community. It's about a community using a tool for their own advocacy.

Indigenous young people are 23x overrepresented in detention. The communities most affected deserve the biggest say in what replaces it.`,
        hashtags: [...CORE_HASHTAGS, '#TennantCreek', '#FirstNations', '#CommunityLed', '#NorthernTerritory'],
      },
      {
        platform: 'facebook',
        label: 'Community Post',
        content: `The final stop on THE CONTAINED Australian Tour: Tennant Creek, Northern Territory. September 2026.

This one is different. Community-controlled from the start. First Nations families and leaders deciding how the immersive experience works in their community.

Indigenous young people are 23x overrepresented in youth detention nationally. The communities most affected by this system deserve the loudest voice in changing it.

THE CONTAINED in Tennant Creek centres culture, community authority, and self-determination. Because the best youth justice alternatives already exist in community. They just need to be resourced.`,
        hashtags: [...CORE_HASHTAGS, '#TennantCreek', '#FirstNations', '#SelfDetermination'],
      },
      {
        platform: 'linkedin',
        label: 'Professional',
        content: `THE CONTAINED's national tour concludes in Tennant Creek, NT. September 2026.

A community-controlled activation centring First Nations leadership in youth justice reform. Indigenous young people are 23x overrepresented in detention. The communities most affected must lead the conversation about alternatives.

This stop demonstrates what community-controlled advocacy looks like in practice: cultural safety, self-determination, and local authority over how the evidence is presented and acted upon.`,
        hashtags: [...CORE_HASHTAGS, '#FirstNations', '#CommunityLed', '#SelfDetermination'],
      },
    ],
  },
];

export const generalSocialPosts: SocialPost[] = [
  {
    platform: 'twitter',
    label: 'Tour Overview',
    content: `THE CONTAINED: Australian Tour 2026.

Five cities. One shipping container, three rooms. One mission.

Mount Druitt → Adelaide → Perth → Tennant Creek → Brisbane

Thirty minutes inside youth detention reality, and the alternative that already works.

justicehub.com.au/contained/tour`,
    hashtags: CORE_HASHTAGS,
  },
  {
    platform: 'instagram',
    label: 'Tour Overview',
    content: `THE CONTAINED is going national.

Five cities across Australia in 2026. One shipping container, three rooms that make the case for transforming youth justice.

🔴 Mount Druitt, April 25 (Confirmed)
🔴 Adelaide, June 15 (Confirmed)
🟡 Perth, August (Planning)
🟡 Tennant Creek, September (Planning)

$1.55M per child per year on detention. 84% reoffend.
$75/day for community alternatives. 88% success rate.

The numbers are clear. The containers make you feel them.

Link in bio to register and follow the tour.`,
    hashtags: [...CORE_HASHTAGS, '#AustralianTour', '#ImmersiveAdvocacy'],
  },
  {
    platform: 'twitter',
    label: 'Stats Hook',
    content: `$1.55 million per child per year on youth detention.
84% reoffend within 2 years.

Community programs: $75/day. 88% success rate.

THE CONTAINED makes you feel these numbers. Australian Tour 2026.`,
    hashtags: CORE_HASHTAGS,
  },
  {
    platform: 'twitter',
    label: 'Fundraising',
    content: `$100K to tour THE CONTAINED across Australia.

$25K → Build the containers
$50K → Adelaide + Perth
$75K → Tennant Creek
$100K → Full tour + documentation

Every dollar builds the case for change.

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
