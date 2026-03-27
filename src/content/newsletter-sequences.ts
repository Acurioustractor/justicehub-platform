/**
 * Newsletter sequence content for GHL automation.
 *
 * Each sequence is an array of emails with delay and content.
 * GHL workflows handle the actual sending/scheduling. We provide
 * content and trigger the workflow via API.
 */

export interface SequenceEmail {
  id: string;
  subject: string;
  preheader: string;
  delayDays: number;
  body: string; // HTML-safe plain text (GHL handles final formatting)
}

export interface EmailSequence {
  id: string;
  name: string;
  trigger: string;
  emails: SequenceEmail[];
}

const SITE = 'https://justicehub.com.au';

// ============================================================
// 1. WELCOME SEQUENCE - triggered on newsletter signup
// ============================================================
export const welcomeSequence: EmailSequence = {
  id: 'welcome',
  name: 'Welcome Sequence',
  trigger: 'newsletter_signup',
  emails: [
    {
      id: 'welcome-1',
      subject: "Here's what we're building, and why it matters",
      preheader: 'Australia spends $26B on punishment. We have 939 proven alternatives.',
      delayDays: 0,
      body: `Welcome to JusticeHub.

You've joined a movement to transform how Australia does justice, especially for young people.

Here's what you need to know:

$26.4 BILLION per year goes to police, prisons, and detention.
$1.55 MILLION per child per year in youth detention, with 84% reoffending within 2 years.
939 PROVEN community alternatives exist. They cost a fraction and actually work.

We built ALMA (Authentic Learning for Meaningful Accountability), the largest database of what works in youth justice in Australia. 527 organisations. 489 evidence items. 1,150 measured outcomes.

And now we're taking this evidence on the road.

THE CONTAINED is a shipping container touring Australia in 2026. Three rooms. Thirty minutes. The reality, the alternative, and the solution.

See the tour: ${SITE}/contained

Talk soon.
— The JusticeHub Team`,
    },
    {
      id: 'welcome-2',
      subject: 'The evidence is overwhelming. Here it is',
      preheader: '489 evidence items, 1,150 outcomes. What the data actually says.',
      delayDays: 3,
      body: `The debate about youth justice isn't really a debate.

The evidence is overwhelming. Community-based programs work. Detention doesn't.

Here's what ALMA has found:

489 evidence items from peer-reviewed research, government evaluations, and community reports.
482 evidence items across 939 catalogued interventions.
Programs costing $75/day vs detention at $4,250/day.
Reoffending drops from 84% (detention) to as low as 3% (best community programs).

These aren't theoretical. These are real programs, run by real organisations, in real Australian communities.

Explore the evidence: ${SITE}/intelligence/interventions

One story that captures this. Read it here: ${SITE}/contained/stories

The data is clear. The question is whether decision-makers will act on it.

— The JusticeHub Team`,
    },
    {
      id: 'welcome-3',
      subject: "Here's what you can do right now",
      preheader: '5 actions you can take in the next 10 minutes.',
      delayDays: 7,
      body: `You've seen the numbers. You've read the evidence.

Now here's how you can help:

1. NOMINATE A LEADER
Know a politician, CEO, or decision-maker? Nominate them to experience THE CONTAINED.
→ ${SITE}/contained#nominate

2. SHARE THE STATS
Download shareable stat cards, optimised for Instagram, Facebook, and LinkedIn.
→ ${SITE}/contained/tour/social

3. READ AND SHARE THE STORIES
Real voices from the communities doing this work.
→ ${SITE}/contained/stories

4. WRITE TO YOUR MP
Use our pre-written templates for email, SMS, or social.
→ ${SITE}/contained/act

5. BACK THE TOUR
Every dollar funds infrastructure for the movement.
→ ${SITE}/back-this

Every action builds momentum. Decision-makers are watching.

— The JusticeHub Team`,
    },
  ],
};

// ============================================================
// 2. PRE-EVENT DRIP - triggered on event registration
// ============================================================
export const preEventSequence: EmailSequence = {
  id: 'pre-event',
  name: 'Pre-Event Drip',
  trigger: 'event_registration',
  emails: [
    {
      id: 'event-confirm',
      subject: "You're registered! Here's what to expect",
      preheader: 'Your CONTAINED experience is confirmed.',
      delayDays: 0,
      body: `You're in.

Your registration for THE CONTAINED is confirmed.

WHAT TO EXPECT:
- 30 minutes inside a shipping container
- Three rooms: the reality, the therapeutic alternative, the community solution
- Evidence-based briefing materials on arrival
- Action cards to take with you

WHAT TO BRING:
- An open mind
- A friend or colleague (share this link: ${SITE}/events)
- Your phone for photos and sharing

This isn't a lecture. It's an experience designed to make you feel what the data shows.

We'll send you more details as the date approaches.

— The JusticeHub Team`,
    },
    {
      id: 'event-story',
      subject: 'Before you arrive, read this story',
      preheader: 'The voice behind the numbers.',
      delayDays: -3, // 3 days BEFORE event
      body: `In a few days, you'll step inside THE CONTAINED.

Before you do, we want you to meet someone.

Read the stories of the people at the heart of this movement: Elders, young people, community workers who are building alternatives to detention every day.

Read their stories: ${SITE}/contained/stories

These are the voices you'll carry with you into the container.

The experience is more powerful when you arrive knowing who you're fighting for.

See you soon.

— The JusticeHub Team`,
    },
    {
      id: 'event-dayof',
      subject: 'Today is the day! Your CONTAINED experience',
      preheader: 'Arrival info and what to know.',
      delayDays: 0, // Day of event (GHL handles actual scheduling)
      body: `Today's the day.

ARRIVAL:
- Please arrive 10 minutes early
- Check in at the registration desk
- You'll receive a briefing card before entry

DURING:
- The experience is 30 minutes
- Photography is welcomed in rooms 2 and 3
- If you need to step out at any time, that's okay

AFTER:
- Share your reaction: we'll have QR codes for instant feedback
- Tag @JusticeHubAU and use #TheContained
- Download shareable stat cards: ${SITE}/contained/tour/social

Every person who walks through this container strengthens the case for change.

See you there.

— The JusticeHub Team`,
    },
  ],
};

// ============================================================
// 3. WEEKLY PULSE DIGEST - powered by AI-generated pulse briefings
// ============================================================
export const weeklyPulseTemplate: EmailSequence = {
  id: 'weekly-pulse',
  name: 'Weekly Pulse Digest',
  trigger: 'cron_weekly',
  emails: [
    {
      id: 'pulse-digest',
      subject: 'JusticeHub Weekly Pulse',
      preheader: 'This week in youth justice — programs, funding, media, and policy.',
      delayDays: 0,
      body: `This email is AI-generated from the latest pulse_reports briefing.
The pulse cron (/api/cron/pulse/weekly) generates the actual content.
This template is kept as a fallback reference only.

WHAT HAPPENED THIS WEEK
— AI-generated briefing from ALMA + CivicScope data —

EXPLORE MORE
Intelligence dashboard: ${SITE}/pulse
Evidence library: ${SITE}/intelligence/interventions
Funding tracker: ${SITE}/transparency

— The JusticeHub Team`,
    },
  ],
};

/** @deprecated Use weeklyPulseTemplate — monthly digest replaced by weekly pulse */
export const monthlyDigestTemplate = weeklyPulseTemplate;

// ============================================================
// 4. CAMPAIGN LAUNCH - triggered on campaign_launch
// ============================================================
export const launchEmail: EmailSequence = {
  id: 'campaign-launch',
  name: 'CONTAINED Campaign Launch',
  trigger: 'campaign_launch',
  emails: [
    {
      id: 'launch-announce',
      subject: 'This is CONTAINED',
      preheader: 'One shipping container. Three rooms. Thirty minutes.',
      delayDays: 0,
      body: `One shipping container. Three rooms. Thirty minutes.

THE CONTAINED is an immersive experience that puts Australia's youth justice crisis into physical reality. You walk through it. You feel it. You can never unsee it.

THREE ROOMS

Room 1: CURRENT REALITY
Designed by young people who know what detention feels like. They are the experts.
$4,250/day. $1.55M/year per child. 84% reoffend within two years.

Room 2: THE THERAPEUTIC ALTERNATIVE
Spain's Diagrama Foundation: 1:1 staffing, weekly family engagement, therapeutic care.
73% success rate. €5.64 returned for every €1 invested.

Room 3: THE ORGANISATIONS ALREADY DOING IT
At each tour stop, a local community organisation fills this space with their story.
$75/day. 88% success. Community-led. Culture-centred. Evidence-based.

THE NUMBERS

$1.55M — annual cost per detained child (Productivity Commission ROGS)
84% — detention reoffending rate (QLD Youth Justice Strategy)
$75/day — cost of community alternatives (Community Services Benchmark)
23x — Indigenous overrepresentation in youth detention
88% — restorative justice success rate (QLD Dept of Justice)

AUSTRALIAN TOUR 2026

Mount Druitt, NSW — April 2026 (Mounty Yarns)
Adelaide, SA — May 2026 (Reintegration Conference)
Perth, WA — August 2026 (University of Western Australia)
Tennant Creek, NT — September 2026 (Community-controlled)

THREE THINGS YOU CAN DO RIGHT NOW

1. NOMINATE A DECISION MAKER
Politicians, CEOs, editors, community leaders. Create the public pressure that forces participation.
→ ${SITE}/contained#nominate

2. BOOK YOUR EXPERIENCE
24 slots daily. Trauma-informed facilitation. Pay what you can ($0-$50).
→ ${SITE}/contained/tour

3. SHARE THE EVIDENCE
Download stat cards and social templates. Same message, every platform.
→ ${SITE}/contained/tour/social

The evidence is overwhelming. Community-led alternatives work better, cost less, and keep young people connected to family and culture.

THE CONTAINED makes you feel it. Your action makes it impossible to ignore.

— The JusticeHub Team`,
    },
  ],
};

// ============================================================
// 5. MEMBER NURTURE SEQUENCES - triggered on CONTAINED signup by role
// Each role gets a 5-email drip over 14 days
// ============================================================

export const organizationNurture: EmailSequence = {
  id: 'nurture-organization',
  name: 'Organization Member Nurture',
  trigger: 'contained_organization',
  emails: [
    {
      id: 'org-1-welcome',
      subject: 'Your organisation hub is ready',
      preheader: 'Funding data, evidence library, and network connections — all in one place.',
      delayDays: 0,
      body: `Welcome to the CONTAINED network.

Your organisation now has a dedicated hub on JusticeHub with funding data, evidence library access, and direct connections to other organisations doing this work across Australia.

LOG IN TO YOUR HUB
${SITE}/hub

What you'll find:
- Your funding profile — every grant, contract, and government allocation we've tracked
- Evidence library — 1,081 verified interventions with cost data
- Network connections — organisations in your state and beyond

If you haven't claimed your organisation yet, you can search for it and link it to your account from your dashboard.

— The CONTAINED Network`,
    },
    {
      id: 'org-2-funding',
      subject: 'Your funding landscape at a glance',
      preheader: 'We track $114.9B in justice funding. Here\'s what matters for your org.',
      delayDays: 2,
      body: `We've mapped $114.9 billion in justice funding across Australia — 148,386 records from federal, state, and local sources.

Your hub shows:
- Funding flowing to organisations in your state
- Which government programs are active
- Where the gaps are (and where new money is likely to land)

EXPLORE YOUR FUNDING LANDSCAPE
${SITE}/hub

This data updates daily as our scrapers pull from AusTender, state budgets, NIAA, and grant portals.

If something looks wrong or missing, let us know — we're building this with you, not just for you.

— The CONTAINED Network`,
    },
    {
      id: 'org-3-network',
      subject: 'Three organisations in your state joined this week',
      preheader: 'The network is growing. Here\'s who\'s nearby.',
      delayDays: 5,
      body: `The CONTAINED network is growing — new organisations are joining every week.

Your Network Activity feed shows:
- New members in your state
- Organisations that have claimed their hub
- Media coverage of programs near you

CHECK YOUR NETWORK ACTIVITY
${SITE}/hub

The stronger this network gets, the harder it becomes to ignore. Every organisation that joins adds weight to the evidence that community alternatives work.

— The CONTAINED Network`,
    },
    {
      id: 'org-4-evidence',
      subject: 'Add your evidence to the library',
      preheader: 'Your program outcomes help every organisation in the network.',
      delayDays: 9,
      body: `The ALMA evidence library now has 1,081 verified interventions — but we know there's more.

If your organisation runs programs with outcome data, evaluation reports, or even anecdotal evidence of what's working, we want to include it.

WHY THIS MATTERS
Every evidence entry strengthens the case for community alternatives. Funders use this data. Media references it. Policy makers can't ignore it when it's comprehensive.

Your hub has tools to contribute evidence directly. Or just reply to this email and we'll help you get it in.

— The CONTAINED Network`,
    },
    {
      id: 'org-5-impact',
      subject: 'Your network this fortnight',
      preheader: 'What happened in the CONTAINED network since you joined.',
      delayDays: 14,
      body: `Here's what happened in the CONTAINED network over the past two weeks:

YOUR IMPACT DASHBOARD
${SITE}/hub

Your dashboard tracks every action — stories read, pages shared, events registered for. Small actions compound into visible momentum.

WHAT'S NEXT
- The CONTAINED tour is hitting cities across Australia in 2026
- New funding data drops daily
- The evidence library keeps growing

Keep showing up. This network works because organisations like yours are in it.

— The CONTAINED Network`,
    },
  ],
};

export const mediaNurture: EmailSequence = {
  id: 'nurture-media',
  name: 'Media Member Nurture',
  trigger: 'contained_media',
  emails: [
    {
      id: 'media-1-welcome',
      subject: 'Your media hub is live — data briefings, story leads, evidence',
      preheader: 'Everything you need to cover youth justice accurately.',
      delayDays: 0,
      body: `Welcome to the CONTAINED media hub.

You now have access to:
- Live media coverage tracking — every article, every outlet, sentiment analysis
- Data briefings — verified stats, not press releases
- Evidence library — 1,081 interventions with cost data and outcomes
- Source contacts — organisations doing the work on the ground

LOG IN TO YOUR MEDIA HUB
${SITE}/hub/media

We built this because youth justice coverage is often reactive — incident-driven, not evidence-driven. Your hub gives you the data to write stories that move the needle.

— The CONTAINED Network`,
    },
    {
      id: 'media-2-briefing',
      subject: 'Data briefing: the numbers behind youth detention',
      preheader: '$1.55M per child per year. 84% reoffend. The data is clear.',
      delayDays: 2,
      body: `Here are the numbers your editor will want to see:

$1.55M — annual cost per detained child (Productivity Commission ROGS 2024)
$75/day — cost of community alternatives (Community Services Benchmark)
84% — detention reoffending rate (QLD Youth Justice Strategy)
88% — restorative justice success rate (QLD Dept of Justice)
23x — Indigenous overrepresentation in youth detention

Every number is sourced and verified. Your media hub has the full evidence library with citations.

BROWSE THE EVIDENCE
${SITE}/hub/media

Need a specific data point? Reply to this email — we'll pull it from the library for you.

— The CONTAINED Network`,
    },
    {
      id: 'media-3-regional',
      subject: 'Media coverage in your state this week',
      preheader: 'What other outlets are covering — and the angles they\'re missing.',
      delayDays: 5,
      body: `Your media hub tracks coverage across every state. Here's why that matters:

COVERAGE GAPS = STORY OPPORTUNITIES
We track 377+ media articles on youth justice. The hub shows you:
- What's being covered in your state
- Sentiment trends (is coverage getting more positive or negative?)
- Which organisations are being quoted vs which are doing the real work

CHECK YOUR REGIONAL FEED
${SITE}/hub/media

The best youth justice stories aren't about incidents. They're about the 1,081 programs quietly proving that alternatives work — for a fraction of the cost.

— The CONTAINED Network`,
    },
    {
      id: 'media-4-tour',
      subject: 'Press access: THE CONTAINED tour',
      preheader: 'One shipping container. Three rooms. Press passes available.',
      delayDays: 9,
      body: `THE CONTAINED is an immersive experience touring Australia in 2026. Three rooms inside a shipping container — current reality, the therapeutic alternative, and the local organisations already doing it.

AS A MEDIA MEMBER, YOU GET:
- Priority press passes at each tour stop
- Pre-event briefing packs with local data
- Direct contact with featured organisations
- Photo/video access (trauma-informed protocols apply)

TOUR DATES
Mount Druitt (April), Adelaide (May), Perth (August), Tennant Creek (September)

Your media hub will have press kits available before each stop. We'll email you when your state's kit is ready.

— The CONTAINED Network`,
    },
    {
      id: 'media-5-impact',
      subject: 'Your media hub this fortnight',
      preheader: 'New coverage, new evidence, new story leads.',
      delayDays: 14,
      body: `Here's what's new in your media hub:

CHECK YOUR DASHBOARD
${SITE}/hub/media

The CONTAINED network is growing — more organisations joining, more evidence being contributed, more coverage being tracked. The story keeps getting stronger.

Bookmark your hub. When the next youth justice story breaks, you'll have verified data in seconds instead of hours.

— The CONTAINED Network`,
    },
  ],
};

export const supporterNurture: EmailSequence = {
  id: 'nurture-supporter',
  name: 'Supporter Member Nurture',
  trigger: 'contained_supporter',
  emails: [
    {
      id: 'supporter-1-welcome',
      subject: 'You\'re in — here\'s how to make your support count',
      preheader: 'Three things you can do right now that actually matter.',
      delayDays: 0,
      body: `Welcome to the CONTAINED network.

You joined because you care about youth justice. Here's how to turn that into action:

1. WRITE TO YOUR MP (2 minutes)
Your hub has a pre-written letter template personalised to your state. One click to customise, one click to send.
${SITE}/hub/supporter

2. SHARE THE EVIDENCE (30 seconds)
Download stat cards designed for social media. Same message, every platform.

3. ATTEND A TOUR STOP
THE CONTAINED is touring Australia in 2026. Find the stop nearest you.

LOG IN TO YOUR HUB
${SITE}/hub/supporter

— The CONTAINED Network`,
    },
    {
      id: 'supporter-2-mp-letter',
      subject: 'Your MP needs to hear from you',
      preheader: 'A 2-minute letter that politicians actually read.',
      delayDays: 2,
      body: `Politicians count constituent letters. Not tweets, not petitions — actual letters from real people in their electorate.

Your hub has an MP letter tool that:
- Identifies your local MP
- Provides a customisable template with verified data
- Tracks when you've sent it (your Impact dashboard shows your actions)

WRITE YOUR LETTER
${SITE}/hub/supporter

Every letter sent through the network gets counted. We're building visible pressure — and you're part of it.

— The CONTAINED Network`,
    },
    {
      id: 'supporter-3-tour',
      subject: 'A tour stop is coming to your state',
      preheader: 'THE CONTAINED — 30 minutes that change how you see youth justice.',
      delayDays: 5,
      body: `THE CONTAINED is an immersive experience inside a shipping container. Three rooms. Thirty minutes. You walk through Australia's youth justice crisis — and you meet the organisations fixing it.

TOUR STOPS 2026
Mount Druitt, NSW — April (Mounty Yarns)
Adelaide, SA — May (Reintegration Conference)
Perth, WA — August (University of Western Australia)
Tennant Creek, NT — September (Community-controlled)

24 slots daily. Pay what you can ($0-$50).

Your hub shows tour details and lets you register interest for your nearest stop.

${SITE}/hub/supporter

— The CONTAINED Network`,
    },
    {
      id: 'supporter-4-social',
      subject: 'The numbers are impossible to argue with',
      preheader: 'Share one stat card today. That\'s all it takes.',
      delayDays: 9,
      body: `Here's the thing about youth justice reform — the evidence isn't contested. Everyone agrees detention doesn't work. The problem is visibility.

YOUR SHARE TOOLKIT
Your hub has downloadable stat cards with verified data:
- Cost comparison: $1.55M detention vs $27K community alternative
- Reoffending rates: 84% detention vs 12% restorative justice
- Indigenous overrepresentation: 23x

Each card is designed for social media. Pick one, share it, done.

${SITE}/hub/supporter

When enough people share the same verified data, it becomes impossible to ignore.

— The CONTAINED Network`,
    },
    {
      id: 'supporter-5-impact',
      subject: 'Your impact so far',
      preheader: 'Here\'s what the network achieved this fortnight.',
      delayDays: 14,
      body: `You've been part of the CONTAINED network for two weeks. Here's what's happening:

YOUR IMPACT DASHBOARD
${SITE}/hub/supporter

Your dashboard tracks every action — MP letters sent, pages shared, events registered for. The network's collective impact is growing.

KEEP GOING
The most effective supporters do one small thing each week. Write a letter. Share a stat card. Tell one person about THE CONTAINED.

Consistency beats intensity. Thank you for being here.

— The CONTAINED Network`,
    },
  ],
};

export const funderNurture: EmailSequence = {
  id: 'nurture-funder',
  name: 'Funder Member Nurture',
  trigger: 'contained_funder',
  emails: [
    {
      id: 'funder-1-welcome',
      subject: 'Your funder hub — evidence-backed investment opportunities',
      preheader: 'Cost-benefit data, proven interventions, and funding gap analysis.',
      delayDays: 0,
      body: `Welcome to the CONTAINED funder hub.

We built this because funders tell us the same thing: the evidence exists, but it's scattered across dozens of sources. Your hub brings it together:

- Funding landscape — $114.9B tracked across 148,386 records
- Proven interventions — 4 with RCT evidence, 32 with strong evaluations
- Funding gaps by state — where money is needed vs where it's going
- Indigenous-led programs — 646 organisations, 23 Indigenous-led interventions

LOG IN TO YOUR FUNDER HUB
${SITE}/hub/funder

Every data point is sourced and verified. No advocacy — just evidence.

— The CONTAINED Network`,
    },
    {
      id: 'funder-2-cost-benefit',
      subject: 'The cost-benefit case for community alternatives',
      preheader: '$1.55M vs $27K. The economics are unambiguous.',
      delayDays: 2,
      body: `The economic case for community alternatives is one of the clearest in social policy:

DETENTION
$1.55M/year per child (Productivity Commission ROGS 2024)
84% reoffend within 2 years
Median stay: 3.3 months at $4,250/day

COMMUNITY ALTERNATIVES
Median cost: $170K/year (ALMA database, 824 programs with cost data)
88% success rate for restorative justice programs
€5.64 returned for every €1 invested (Diagrama Foundation, Spain)

Your funder hub has the full cost-benefit dataset — filterable by state, evidence level, and program type.

EXPLORE THE DATA
${SITE}/hub/funder

— The CONTAINED Network`,
    },
    {
      id: 'funder-3-proven',
      subject: 'Four interventions with RCT-level evidence',
      preheader: 'The gold standard — replicated, evaluated, proven.',
      delayDays: 5,
      body: `Out of 1,081 interventions in the ALMA database, 4 have the highest evidence level: Proven (RCT/quasi-experimental, replicated).

Another 32 are rated Effective (strong evaluation, positive outcomes).

Your funder hub shows:
- Evidence level for every intervention
- Operating organisation and location
- Cost data where available
- Links to evaluation reports

BROWSE PROVEN INTERVENTIONS
${SITE}/hub/funder

We're not here to tell you what to fund. We're here to make sure you have the evidence to decide.

— The CONTAINED Network`,
    },
    {
      id: 'funder-4-indigenous',
      subject: 'Indigenous-led programs — the evidence and the opportunity',
      preheader: '646 Indigenous organisations. 23 Indigenous-led interventions. Real outcomes.',
      delayDays: 9,
      body: `Indigenous young people are 23x overrepresented in youth detention. The organisations closest to this reality are Indigenous-led — and they're producing results.

YOUR FUNDER HUB SHOWS:
- 646 Indigenous organisations in the JusticeHub database
- 23 interventions rated as Indigenous-led (culturally grounded, community authority)
- Funding flows to Indigenous organisations vs mainstream providers

THE OPPORTUNITY
Many Indigenous-led programs operate on minimal funding. Small investments create outsized impact when they go to organisations with deep community trust and cultural authority.

EXPLORE INDIGENOUS-LED PROGRAMS
${SITE}/hub/funder

— The CONTAINED Network`,
    },
    {
      id: 'funder-5-impact',
      subject: 'Your funder hub this fortnight',
      preheader: 'New data, new evidence, new opportunities.',
      delayDays: 14,
      body: `Here's what's new in the CONTAINED funder hub:

YOUR DASHBOARD
${SITE}/hub/funder

The funding landscape updates daily. New evidence is contributed by organisations in the network. The picture keeps getting clearer.

We're building this platform so that every dollar spent on youth justice has the best possible evidence behind it. Your engagement helps — every data point explored and shared builds the case for smarter investment.

— The CONTAINED Network`,
    },
  ],
};

export const livedExperienceNurture: EmailSequence = {
  id: 'nurture-lived-experience',
  name: 'Lived Experience Member Nurture',
  trigger: 'contained_lived_experience',
  emails: [
    {
      id: 'le-1-welcome',
      subject: 'Welcome — your voice matters here',
      preheader: 'This space was built with people like you. It belongs to you.',
      delayDays: 0,
      body: `Welcome.

This hub was built with input from young people with lived experience of the youth justice system. It belongs to you as much as anyone.

What you'll find:
- Peer connections — other people who understand
- Youth programs — services and support near you
- Community stories — voices like yours, shared on their own terms

LOG IN TO YOUR HUB
${SITE}/hub/lived-experience

You control your visibility. Your profile is private by default — you choose if and when to make it visible to peers.

Nothing here happens without your consent. Nothing gets shared without your say-so.

— The CONTAINED Network`,
    },
    {
      id: 'le-2-peers',
      subject: 'You\'re not the only one',
      preheader: 'Other people with lived experience are in this network too.',
      delayDays: 3,
      body: `One of the hardest things about lived experience is feeling like you're the only one. You're not.

YOUR PEER NETWORK
Your hub shows other members with lived experience who've chosen to be visible. You can see who's in your state and connect on your own terms.

${SITE}/hub/lived-experience

You don't have to be visible yourself. But knowing others are here — that matters.

If you ever want to talk to someone, the organisations in this network have support workers who get it. Your hub lists programs near you.

— The CONTAINED Network`,
    },
    {
      id: 'le-3-programs',
      subject: 'Programs and support near you',
      preheader: 'Services run by people who understand — not just professionals.',
      delayDays: 6,
      body: `Your hub includes a program finder with services across Australia. These aren't random referrals — they're organisations in the CONTAINED network that work directly with young people.

FIND PROGRAMS
${SITE}/hub/lived-experience

Many of these programs are run by people with their own lived experience. They're not just service providers — they're community.

If you need something specific that's not listed, reply to this email. We'll try to connect you.

— The CONTAINED Network`,
    },
    {
      id: 'le-4-story',
      subject: 'Your story is yours to tell (or not)',
      preheader: 'If you want to share, we\'ll make sure it\'s done right.',
      delayDays: 10,
      body: `Some people with lived experience want to share their story. Some don't. Both are completely valid.

If you ever want to:
- THE CONTAINED tour features lived experience voices in Room 1
- The ALMA evidence library includes community stories
- Media members in the network are looking for authentic voices (on your terms)

Every story shared through the network goes through trauma-informed protocols. You see it before anyone else does. You can change your mind at any point.

Your hub has community stories from other people who chose to share. Reading them might help you decide.

${SITE}/hub/lived-experience

No pressure. Ever.

— The CONTAINED Network`,
    },
    {
      id: 'le-5-check-in',
      subject: 'Checking in',
      preheader: 'Just making sure you\'re good.',
      delayDays: 14,
      body: `Hey.

Just checking in. Your hub is there whenever you need it:
${SITE}/hub/lived-experience

If something isn't working, or you need support, or you just want to talk to someone — reply to this email.

You being here matters more than you know. The whole point of this campaign is that the people closest to the problem should have the most say in the solution. That's you.

— The CONTAINED Network`,
    },
  ],
};

// All sequences indexed by ID
export const allSequences: Record<string, EmailSequence> = {
  welcome: welcomeSequence,
  'pre-event': preEventSequence,
  'weekly-pulse': weeklyPulseTemplate,
  'monthly-digest': monthlyDigestTemplate, // deprecated alias
  'campaign-launch': launchEmail,
  'nurture-organization': organizationNurture,
  'nurture-media': mediaNurture,
  'nurture-supporter': supporterNurture,
  'nurture-funder': funderNurture,
  'nurture-lived-experience': livedExperienceNurture,
};
