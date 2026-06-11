# CONTAINED Adelaide - Stream Email Bodies (Deliverable #4)

Paste these into the matching GHL email templates (see `contained-ghl-ui-build-spec.md` §4).
House style: no em dashes, no AI vocabulary, names over abstractions, real figures only.
Links: `justicehub.com.au/adelaide` (start), `/remand` (go deeper), `/contained/reaction` (after).
Sign-off: "The JusticeHub team" (no dash). Every send carries an unsubscribe footer.

Figures used are the established campaign numbers (source: `src/content/campaign.ts`): a child in
detention costs about $4,250 a day and $1.55M a year; community programs run near $75 a day.

> **Gates before any send (updated 11 June):** (1) The dollar figures above are NOT cleared: the
> detention cost conflict ($1.33M repo canon vs $1.55M here) is Mission Control conflict 3, and no
> stat sends until source/year/jurisdiction lock. (2) Site language was scrubbed 11 June: the
> formula is "public space in Adelaide, on Kaurna Yarta", no site naming until council confirms.
> (3) `/adelaide` is a live alias of `/contained/adelaide`, so links here work; copy canon is
> `/contained/adelaide`. (4) Email 1 below is SUPERSEDED for the warm invite: template 7 in
> `compendium/contained-adelaide-email-templates.md` is the canon body (conflict 8).

---

## 1. Adelaide Warm Invite
**Enroll tag:** `newsletter-stream:contained-adelaide-invite`
**Subject:** Walk through CONTAINED in Adelaide, 22 to 26 June
**Preheader:** One container. Three rooms. Thirty minutes.

A shipping container is coming to public space in Adelaide, on Kaurna Yarta, from 22 to 26 June, beside the Reintegration Puzzle conference. Walkthroughs run Wednesday 24 to Friday 26; the address goes to everyone booked the moment it is confirmed.

Inside, three rooms. The first shows what remand feels like for a child held before sentence. The second shows the supports that would have kept that child at home, with David McGuire from Diagrama. The third belongs to the organisations already doing the work here, and what they need backed.

It takes thirty minutes. We are hosting booked walkthroughs for people who want the full arc, and open viewing for anyone who wants to drop in.

Book a walkthrough: justicehub.com.au/adelaide

If you want the evidence behind it first, start here: justicehub.com.au/remand

The JusticeHub team

---

## 2. Daily CONTAINED Recap
**Enroll tag:** `newsletter-stream:contained-daily-recap`
**Subject:** CONTAINED, day [N]: what happened
**Preheader:** One thing that moved today.

Today at the container:

What happened: [one line on the day].

A voice: "[one consented quote or journal line]".

From a room: [one object or moment from inside the container].

A local org: [one Adelaide organisation and what they do for young people].

For tomorrow: [one action a reader can take].

If today moved you, the simplest next step is to bring someone with power through the container. Reply to this email and we will find them a slot.

Share what changed for you: justicehub.com.au/contained/reaction

The JusticeHub team

---

## 3. JusticeHub / Youth Justice
**Enroll tag:** `newsletter-stream:justicehub-youth-justice`
**Subject:** The evidence is built. Add yours.
**Preheader:** For the people already doing the work.

CONTAINED puts a number in a room you can walk through. A child in detention costs about $1.55 million a year. A community program that keeps that child at home runs closer to $75 a day.

JusticeHub holds the evidence behind those numbers, and it is open for the people building alternatives to add to it.

You can do three things from here. Contribute an evidence point or outcome from your program. Offer a young-person-safe story, with consent. Tell us what you need funded or changed.

Add a model or send evidence: justicehub.com.au/join

Open the youth remand pathway: justicehub.com.au/remand

The JusticeHub team

---

## 4. Media Pack
**Enroll tag:** `newsletter-stream:media-pack`
**Subject:** A container, a child held before sentence, and the cost
**Preheader:** Vision, access, and contacts for CONTAINED Adelaide.

CONTAINED is a shipping container in public space in Adelaide, on Kaurna Yarta, from 22 to 26 June, beside the Reintegration Puzzle conference. Three rooms take a visitor from what youth remand feels like, to the practice that prevents it, to the organisations already doing the work in South Australia.

The story in one line: a child can be held before sentence, often before conviction, because the support around them is missing. A day of that costs about $4,250. The alternative costs a fraction and keeps the child connected to family, school, and Country.

We can offer a hosted walkthrough, an interview with David McGuire from Diagrama, time with the young people who built the room, and photography inside rooms two and three with consent.

Request a media window or assets: justicehub.com.au/adelaide

The JusticeHub team

---

## 5. Funder / Partner Brief
**Enroll tag:** `newsletter-stream:funder-brief`
**Subject:** The work already exists. The money is late.
**Preheader:** What backing CONTAINED unlocks.

Picture a child who never sees the inside of a cell, because the night they were arrested there was a safe bed, a trusted adult, and a lawyer who picked up the phone.

That is not a wish. It is a budget line we have not moved yet.

CONTAINED makes the choice visible. A container in public space in Adelaide, three rooms, thirty minutes. The first holds the cost of detention, about $1.55 million a year for one child. The second holds the practice that prevents it, drawn from David McGuire and Diagrama. The third holds the South Australian organisations already doing the work and waiting on funding.

The architecture is simple. The reality, the alternative, the people. What it needs is patient money behind the third room, so the organisations that change a child's path can plan past a single grant.

Walk through it, or talk with us about backing it: justicehub.com.au/adelaide

The JusticeHub team

---

## 6. Future Cities
**Enroll tag:** `newsletter-stream:future-cities`
**Subject:** Bring CONTAINED to your city
**Preheader:** After Adelaide, the container moves.

Mount Druitt was the first stop. Adelaide is the second, and the first full public activation. After it, the container moves, and every stop is rebuilt by local young people and local organisations so the rooms speak from that place.

If you want CONTAINED in Perth, Melbourne, or your own community, the work starts with local hosts: the organisations, the young people, and the partners who can carry Room 3.

Tell us where, and who should help convene it: justicehub.com.au/adelaide

The JusticeHub team

---

## Lifecycle emails (referenced by automations A4 and A5)

**Pre-event confirmation** (A4) already exists in `src/content/newsletter-sequences.ts`
(`preEventSequence.emails[0]`), updated this work to carry `/adelaide`, `/remand`, and
`/contained/reaction`. Reuse it; do not rebuild.

**Post-experience activation** (A5) is not yet written. Suggested body:

**Subject:** You walked through. Here is the one thing to do next.
**Preheader:** Turn the feeling into an action.

You have seen what remand does to a child, and what could be built instead. The week is stronger if the feeling becomes one action.

Pick one. Bring someone with power through the container. Share the remand evidence. Back a local organisation. Ask where the money is going.

Share what changed for you: justicehub.com.au/contained/reaction

The JusticeHub team
