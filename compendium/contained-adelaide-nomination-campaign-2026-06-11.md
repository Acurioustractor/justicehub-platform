# CONTAINED Adelaide: the nomination campaign

Date: 11 June 2026
One question carries the whole campaign: **who needs to walk through this before they make the next decision?**

Room 3 is the engine. Every visitor leaves through a wall that asks the question, a card that captures the answer, and a QR that turns the answer into a record. This document is the campaign plan: what already works, what must be fixed before traffic, the copy kit, and the operational loop that turns a name on a card into a person in the container.

## 1. What exists today (verified in code, 11 June)

**The live path works end to end for capture:**

- Form: justicehub.com.au/contained#nominate (fields: nominee name, title, org, category, reason, optional nominator name and email)
- Writes to: `campaign_nominations` (Supabase), instantly public on the wall at justicehub.com.au/contained/nominations
- If the nominator leaves an email, they are upserted into GHL with `project:act-jh`, `source:event:contained`, `interest:justice-reform`, `role:supporter` plus custom fields `nominated_person` and `nomination_category`
- Admin sees counts and a recent list at /admin/contained, and nominators appear in the unified CRM view at /admin/contained/crm

**What does not exist: any follow-up.** The nominee never becomes a contact or entity record, and nothing groups rows by nominee. Nobody is emailed. No queue shows "Minister X: 14 nominations, status: invited". A richer legacy flow (nominee dedupe, invite emails, an escalation stub that only writes a log line) sits in an orphaned API route that nothing calls, and four downstream systems still read from its empty table.

## 2. Fixes before pushing traffic (P0, half a day of code)

| # | Fix | Why |
|---|-----|-----|
| 1 | Scrub Victoria Square from `src/app/contained/act/act-content.tsx` (all 9 instances; share-template lines 132, 145, 156, 163) and from `src/content/campaign.ts` | These are the share texts the public sends to MPs and media. Site language gate violation that multiplies with every share. |
| 2 | Repoint the four readers of `campaign_alignment_entities` nomination data (social-proof API, day-7 post-experience email, engagement-scoring cron, and the pipeline-followup cron at `src/app/api/cron/campaign/pipeline-followup/route.ts:91`) at `campaign_nominations`, or bridge the tables | Otherwise public counters show zero, automated emails quote stale numbers, and nominators score no engagement during the one week it matters. |
| 3 | Add a team notification on each nomination (or a daily digest) and a nominator confirmation email | The orphaned route has all the templates ready to lift. Capture without acknowledgment leaks goodwill. |
| 4 | Change the wall progress target. 2,500 is hardcoded twice (`nominations-wall.tsx`, `admin/contained/page.tsx`) | A 10-day local campaign against a 2,500 bar reads as failure at any realistic volume. Set 100 for Adelaide week, or replace the bar with a count. |
| 5 | Add server-side spam protection (Turnstile like the register route, plus rate limit) and a moderation flag before wall display | The wall is public and SEO-indexed, inserts are anonymous with no dedupe. One bad actor floods it with named people. |

P1 (do if time): capture nominator state so Adelaide nominators get `place:sa`; fix the `/contained/what-now` "Nominate your city" button that points at the leader wall (city nominations are a different system).

## 3. The campaign in three phases

### Phase 1 · Seed (from the moment the P0 fixes land, to Sunday 21 June)

**Precondition: P0 fixes 1, 3, and 5 ship first** (the site scrub, the notifications, the spam guard and moderation flag). Half a day of code. Until then the wall is unmoderated, unprotected, and instantly public, so no nominate link goes into any send. Once they land, nominations start before the container opens: every personal send carries the nomination ask as its postscript.

- The first contact pack (all 7 audience variants) carries "Nominate someone" as ask #2
- SA org wall outreach (~8 orgs/day) ends with: "and tell us one person you would put through it"
- Ask the delivery circle and VIP list directly: each names 2 to 3 people. Twenty trusted senders naming three people is 60 seeded nominations before opening day
- Triage rule from day one, reused from the booking-windows roster: **Priority A** ministers, MPs, senior public servants, judges, funders, key media · **Priority B** influential delegates, service leaders, university staff · **Priority C** general public, future-tour supporters

Target by 21 June: 50 nominations, every Priority A nominee matched to a relationship owner.

### Phase 2 · Floor (build: Monday 22 + Tuesday 23 · open: Wednesday 24 to Friday 26 June)

The physical and digital systems are the same system. During the two build days the only nomination activity is the build crew seeding the Room 3 wall; every visitor-facing mechanic below runs Wednesday to Friday.

- **Room 3 nomination wall**: cards around the vertical TV asking the question. Visitors write a name, the card goes on the wall, the host photographs the wall each evening
- **Nomination card** (print item, already on the artifact tracker): the question, a write-in line, and the QR to /contained#nominate so the card becomes a record
- **Exit receipt + commitment card**: "Invite someone with power to walk through" is a checkbox with the QR beside it
- **Daily recap email** (after 16 June go/no-go): "the simplest next step is to bring someone with power through the container. Reply to this email and we will find them a slot."
- **Evening triage ritual** (15 minutes, end-of-day sync): new nominations grouped by nominee, Priority A names get a relationship owner and a personal invite the same evening for a Thursday or Friday slot

Target by close: 100 total nominations, 10 Priority A nominees personally invited, 3 walked through.

### Phase 3 · Follow (from Saturday 27 June)

- Every nominee who did not attend gets the post-week brief with: "N people named you as someone who should walk through this. The container has left Adelaide. The evidence stayed." Link to /contained/brief
- Nominations from Perth and Victoria/Melbourne feed the next-city pipeline (Notion page 07) as the demand signal
- Nominators get the recap email: "here is what happened, and here is what the person you named did or has not done yet"

## 4. Copy kit

**The question (everywhere, verbatim):**
> Who needs to walk through this before they make the next decision?

**Nomination card (A5 print):**
> Front: WHO NEEDS TO WALK THROUGH THIS BEFORE THEY MAKE THE NEXT DECISION? · write-in lines for name and why · QR
> Back: Nominations go on the public wall at justicehub.com.au/contained/nominations. We personally invite the decision-makers Adelaide names most. The container moves; the names move with it.

**Email postscript (append to any personal send):**
> P.S. The most useful thing you can do takes one minute: name the person who should walk through this before they make their next decision. justicehub.com.au/contained#nominate

**Social post:**
> A shipping container in Adelaide holds three rooms. A cell. What Spain does instead. What South Australia could do next. You walk through alone, thirty minutes. Then it asks you one question: who needs to walk through this before they make the next decision? Name them: justicehub.com.au/contained#nominate

**Host line at the exit (spoken):**
> Before you go: one name. Who should stand where you just stood, before they decide what happens to the next kid?

**After-walkthrough email (A5 automation):**
> You walked through it. Most people never will. The next best thing is choosing who does: justicehub.com.au/contained#nominate

## 5. The operational loop

```
visitor or supporter nominates
        |
campaign_nominations (Supabase)  -->  public wall (instant)
        |
nominator -> GHL upsert (tags + custom fields)
        |
DAILY: /admin/contained/crm review, group by nominee
        |
Priority A/B -> relationship owner assigned (Notion CRM, Interaction logged)
        |
personal invite, A3 path, never bulk  -->  exact slot offer (Wed-Fri)
        |
attended -> engagement:experienced -> post-week ask
declined/silent -> post-week brief with nomination count
```

Notion owns the relationship and owner. GHL owns the send. Supabase owns the act of nominating. Nothing is double-entered: the daily triage reads Supabase, writes one Interaction per outcome in Notion.

## 6. Gates that bind this campaign

- Nominee names go on a public wall: **moderation before display** for anything defamatory, and never publish a young person's name as nominee or nominator
- VIP nominees are never bulk-emailed; nomination triggers a personal invite from the relationship owner, nothing automated
- The wall, cards, and QR codes carry no site name until council approval
- Tags stay colon-canon; the exact strings (`source:event:contained` vs `source:event:contained-adelaide`) get reconciled at the 16 June go/no-go, not invented per-send
