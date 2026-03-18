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

const SITE = 'https://justicehub.org.au';

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
// 3. MONTHLY EVIDENCE DIGEST - triggered by cron
// ============================================================
export const monthlyDigestTemplate: EmailSequence = {
  id: 'monthly-digest',
  name: 'Monthly Evidence Digest',
  trigger: 'cron_monthly',
  emails: [
    {
      id: 'digest',
      subject: 'JusticeHub Monthly: New evidence, new stories, new momentum',
      preheader: 'What the movement achieved this month.',
      delayDays: 0,
      body: `JUSTICEHUB MONTHLY DIGEST

NEW EVIDENCE DISCOVERED
ALMA's discovery agent found new evidence items this month. The database now contains {{evidence_count}} evidence items across {{intervention_count}} interventions.

Browse new evidence: ${SITE}/intelligence/interventions

NEW STORIES
{{new_stories_count}} new stories published from community voices across Australia.

Read them: ${SITE}/contained/stories

CAMPAIGN PROGRESS
- {{nomination_count}} leaders nominated for THE CONTAINED
- {{backer_count}} backers supporting the tour
- Tour stops: Mount Druitt → Adelaide → Perth → Tennant Creek

TAKE ACTION
The most powerful thing you can do today: nominate one decision-maker.
→ ${SITE}/contained#nominate

— The JusticeHub Team`,
    },
  ],
};

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

// All sequences indexed by ID
export const allSequences: Record<string, EmailSequence> = {
  welcome: welcomeSequence,
  'pre-event': preEventSequence,
  'monthly-digest': monthlyDigestTemplate,
  'campaign-launch': launchEmail,
};
