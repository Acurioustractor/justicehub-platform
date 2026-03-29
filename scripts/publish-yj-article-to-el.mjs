#!/usr/bin/env node
/**
 * Publish "Why Australia's Youth Justice System Is Failing" article to Empathy Ledger.
 * Links to JusticeHub org and Contained project.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const el = createClient(
  process.env.EMPATHY_LEDGER_URL,
  process.env.EMPATHY_LEDGER_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const JH_ORG_ID = '0e878fa2-0b44-49b7-86d7-ecf169345582';
const JH_TENANT_ID = 'bf17d0a9-2b12-4e4a-982e-09a8b1952ec6';
const JH_STORYTELLER_ID = '48c32514-5762-4a44-bba5-5a7890b5e69f';
const CONTAINED_PROJECT_ID = '9b90b47c-2a4c-409c-97d5-3718aaf8c30c';

const TITLE = "Why Australia's Youth Justice System Is Failing — And What Community-Led Solutions Are Already Proving Works";

const SUMMARY = `It costs AUD 2,355 per day to detain a child in Brisbane Youth Detention — AUD 859,575 per year — for an 84% reoffending rate. Meanwhile, community-led programs achieve 88% success at AUD 75/day. The evidence is not missing. The political will to act on it is.`;

const CONTENT = `## The Numbers Don't Lie

It costs AUD 2,355 per day to detain a child in Brisbane Youth Detention. That is AUD 859,575 per year, per child.

For that investment, Australia gets an 84% reoffending rate within 12 months.

Eighteen per cent of young people who pass through the detention system graduate with any qualification. The majority leave with fewer skills, weaker family connections, and deeper trauma than when they arrived.

Meanwhile, in Spain, the Diagrama Foundation runs youth justice centres where 84% of young people reintegrate into the community without reoffending — with a return-to-custody rate of just 14% over six years.

In Australia, community-led programs achieve an 88% success rate at AUD 75 per day.

The evidence is not missing. The political will to act on it is.

## The State of Australia's Youth Justice System in 2026

Australia is in the middle of a youth justice crisis — though not the one most media coverage describes.

The crisis is not primarily about rising youth crime. It is about a system that is spending record amounts of public money to produce predictable, documented failure, while proven alternatives are chronically underfunded and invisible.

According to the Australian Institute of Health and Welfare's 2023–24 report, First Nations young people are incarcerated at rates that represent one of the most severe overrepresentations in the developed world.

Indigenous children are detained at 24 times the rate of non-Indigenous children nationally. In NSW, Aboriginal young people now account for 60% of the total youth detention population — despite Aboriginal people comprising just 8% of the young people in the state.

NSW youth detention numbers are up 34% since 2023, driven primarily by a surge in remand — children held before trial, not after conviction.

The Productivity Commission's Report on Government Services 2026 confirms these trends are systemic and persistent, not isolated spikes.

And yet across Australia, state and territory governments have responded not with investment in what works, but with tougher bail laws, lower ages of criminal responsibility, and harsher sentencing for children.

Victoria announced "adult time for violent crime" laws that would allow children as young as 14 to be tried in adult courts. Queensland extended "adult crime, adult time" laws targeting children as young as ten. The Northern Territory lowered the age of criminal responsibility to ten.

The research is unambiguous on what these approaches produce: more incarceration, more reoffending, higher costs, and deeper intergenerational harm.

## What the International Evidence Shows

Diagrama Foundation in Spain is not a theory. It is a working model, at scale, producing documented results that Australian governments have been formally briefed on.

Young people in Diagrama centres maintain weekly contact with their families. They receive personalised education and skills development. Staff are trained in trauma-informed, relational care. The environment is designed to build trust, not eliminate it.

The outcomes are the inverse of Australia's current system:

- 84% reintegrate without reoffending
- Return to custody rate: 14% over six years
- For context: the UK's return-to-custody rate is approximately 30% — itself considered a crisis by UK standards

Diagrama Foundation has been formally advising an Australian Government agency on replicating their model here.

The blueprint exists. The question is whether Australia's political and funding systems will create the conditions for it to scale.

## What Australia Is Already Doing Right — And Not Funding Enough

The international evidence matters. But so does what is already working inside Australia, built by and with communities.

### Groote Eylandt, Northern Territory

In 2021–22, traditional owners on Groote Eylandt established a suite of community-led diversionary initiatives for young people. The result: youth crime on the island fell 95% — from 346 offences recorded in 2018–19 to just 17 offences in 2021–22. The distinct count of offenders fell from 44 to 13.

This is not a pilot. It is documented, verified by NT Police statistics, and cited by Smarter Justice as one of the most compelling examples of community-led justice in Australia's history.

### Maranguka, Bourke NSW

Maranguka is Australia's first operational justice reinvestment program, operating in Bourke under First Nations governance through the Bourke Tribal Council and Just Reinvest NSW. It is built on First Nations self-determination and cultural governance, wrapping holistic community support around families and young people — not just individual offenders.

The model was recognised with a gold award at the 2023 Australian Crime and Violence Prevention Awards.

### BackTrack, Armidale NSW

BackTrack targets young people aged 14–17 who are at high risk of offending. By combining work-ready skills training, community responsibilities, and psychological and educational support, BackTrack halved juvenile crime rates in Armidale over a seven-year period.

The program has since expanded to multiple NSW communities and is cited by UNSW researchers as a replicable, evidence-based model.

### Community Youth Response and Diversion (CYRD), Queensland

The Queensland Department of Youth Justice's CYRD program delivers early intervention and diversion services across Cairns, Townsville, Brisbane, Logan, Ipswich, and the Gold Coast — including Aboriginal and Torres Strait Islander cultural mentoring with trusted adult mentors.

These programs are not marginal experiments. They are proven, documented, and operating right now. What they share is community ownership, cultural grounding, and a design philosophy that treats young people as people — not risks to be managed.

## The Senate Inquiry: A Political Moment That Cannot Be Wasted

In September 2024, the Senate referred an inquiry into Australia's youth justice and incarceration system to the Legal and Constitutional Affairs References Committee. It received 223 submissions and heard from 40 witnesses.

The interim report, tabled on 28 February 2025, described the evidence as "significant and disturbing."

The National Children's Commissioner welcomed the report and called for child justice to be made a national priority.

A new inquiry was referred in the 47th Parliament in October 2025, with states now facing federal scrutiny over whether children's rights are being violated in custody and whether Australia is meeting its international obligations under the UN Convention on the Rights of the Child.

Closing the Gap Target 11 commits Australia to reducing the rate of First Nations young people in detention by at least 30% by 2031. On current trajectories, that target is not being met.

This is not a fringe conversation. It is an active, live, national policy moment — and every week that passes without public engagement is a week the default punitive approach continues by inertia.

## What Contained Is — And Why It Matters Right Now

JusticeHub's Contained installation is a 30-minute, three-room experience designed to close the gap between the evidence and public understanding.

**Room 1: Brisbane Youth Detention** — Every surface designed to eliminate variables that might become hope. AUD 2,355/day. 84% reoffend. 18% graduate.

**Room 2: Diagrama Foundation, Spain** — 73% success rate. EUR 5.64 return for every EUR 1 invested. Weekly family contact. Young people leave with skills, relationships, and a future.

**Room 3: CON|X — The Community Future** — AUD 75/day. 3% reoffend. 88% success rate. Community programs already have the answer. Contained shows you what it looks like when they have the infrastructure, visibility, and funding to scale.

Contained is not a protest. It is not a policy document. It is a public engagement tool — designed to turn attention into understanding, and understanding into action.

Because the evidence has existed for years. What has been missing is a way for more Australians — funders, policy makers, community members, journalists, voters — to engage with it directly, emotionally, and practically.

The campaign launched in March 2026, timed deliberately to the active Senate Inquiry and a moment of genuine national debate about what Australia's youth justice system should look like.

## What You Can Do

The evidence is clear. The alternatives are proven. The political moment is live.

If you are a **funder or philanthropist**, the ROI on community-led youth justice is documented — EUR 5.64 returned per EUR 1 invested in the Diagrama model, and community programs in Australia delivering 88% success at AUD 75/day versus AUD 2,355/day for a system producing 84% reoffending.

If you are a **community organisation**, JusticeHub's CON|X infrastructure is being built to connect your work to national visibility, funding pathways, and policy engagement.

If you are a **policy maker or advocate**, the Senate Inquiry has created a window. The community-led evidence base is deep, documented, and ready to be actioned.

If you are an **engaged Australian** who wants to understand this issue, experience it, and back what works — start at [justicehub.com.au](https://justicehub.com.au).

## The Bottom Line

Australia is spending AUD 1.5 billion per year on a system with a documented 84% failure rate, while community-led programs that achieve 88% success rates at a fraction of the cost remain underfunded and under-visible.

The proof exists. The programs exist. The political moment exists.

What is needed now is the public infrastructure to connect evidence to action at scale.

That is what JusticeHub is building. That is what Contained is for.

---

*JusticeHub is a community-led platform connecting youth justice solutions, stories, and communities across Australia. Learn more at [justicehub.com.au](https://justicehub.com.au) or experience Contained at [justicehub.com.au/contained](https://justicehub.com.au/contained).*`;

const SOURCE_LINKS = [
  'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
  'https://www.abc.net.au/news/2024-03-15/nsw-aboriginal-youth-detention-rates/103592840',
  'https://www.bocsar.nsw.gov.au/Pages/bocsar_pages/Youth-Justice.aspx',
  'https://www.pc.gov.au/ongoing/report-on-government-services/2026',
  'https://theconversation.com/adult-time-for-violent-crime-youth-justice-laws',
  'https://www.bowdenpr.co.uk/diagrama-foundation-australia',
  'https://smarterjustice.org.au/groote-eylandt',
  'https://www.aic.gov.au/publications/special/maranguka-justice-reinvestment',
  'https://www.unsw.edu.au/research/backtrack-youth-justice',
  'https://www.youthjustice.qld.gov.au/programs/cyrd',
  'https://www.justicereforminitiative.org.au/senate-inquiry-youth-justice',
  'https://humanrights.gov.au/our-work/childrens-rights/youth-justice',
  'https://www.sbs.com.au/news/article/youth-justice-senate-inquiry-47th-parliament',
  'https://www.rific.gov.au/closing-the-gap/target-11',
];

async function main() {
  console.log('Publishing article to Empathy Ledger...\n');

  // Check if already exists
  const { data: existing } = await el.from('stories')
    .select('id')
    .ilike('title', '%Youth Justice System Is Failing%')
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('Article already exists:', existing[0].id);
    console.log('Updating...');

    const { error } = await el.from('stories')
      .update({
        content: CONTENT,
        summary: SUMMARY,
        themes: ['contained', 'youth-justice', 'community', 'indigenous', 'policy', 'evidence'],
        source_links: SOURCE_LINKS,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing[0].id);

    if (error) console.error('Update error:', error.message);
    else console.log('Updated successfully');
    return;
  }

  const { data: story, error } = await el.from('stories')
    .insert({
      tenant_id: JH_TENANT_ID,
      organization_id: JH_ORG_ID,
      storyteller_id: JH_STORYTELLER_ID,
      project_id: CONTAINED_PROJECT_ID,
      title: TITLE,
      summary: SUMMARY,
      content: CONTENT,
      story_type: 'advocacy',
      story_category: 'Advocacy',
      themes: ['contained', 'youth-justice', 'community', 'indigenous', 'policy', 'evidence'],
      tags: ['senate-inquiry', 'diagrama', 'community-led', 'funding', 'contained-campaign'],
      is_public: true,
      privacy_level: 'public',
      is_featured: true,
      justicehub_featured: true,
      status: 'published',
      published_at: '2026-03-17T00:00:00.000Z',
      source_links: SOURCE_LINKS,
      syndication_enabled: true,
      social_sharing_enabled: true,
      sharing_enabled: true,
      cultural_sensitivity_level: 'standard',
      language: 'en',
      location_text: 'Australia',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Insert error:', error.message);
    return;
  }

  console.log('Published story ID:', story.id);
  console.log('\nSync chain:');
  console.log('  EL stories → POST /api/empathy-ledger/sync → JH synced_stories');
  console.log('  themes includes "contained" → auto-tagged project_slugs: ["the-contained"]');
  console.log('  /api/contained/stories will include it');
  console.log('\nTo sync now: curl -X POST http://localhost:3004/api/empathy-ledger/sync');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
