# CONTAINED systems & routes: fix-design

Remediation design for every CONTAINED capture/automation defect, traced to `file:line` against the code on **13 June 2026**. This is a design doc, not a changeset: **nothing here has been applied.** An AFK agent (or Ben) can implement straight from it.

**Hard scope of this document.** Read-only on every external system. No GHL/Supabase/Vercel writes, no tag/contact/opportunity changes, no DB mutations, no sends, no cron triggers. Every fix below is described so a human (or night-shift agent) applies it later. Campaign name is **CONTAINED** throughout.

**Launch is Tuesday 23 June 2026** (Adelaide experience, Kaurna Yarta). Pipeline B (Adelaide booking funnel) is essentially empty; the no-reply bug and the durable-first gap are what cost the campaign its only real inbound on 12 June. Fix those first.

---

## 0. The one-paragraph root cause (read this first)

A real person filled in `/contained/register-interest` on 12 June and heard nothing back. Two things conspired. First, **`/api/ghl/signup` has zero `sendEmail` calls**, by design it never sends a receipt, so even a perfectly healthy submission gets silence (verified: `grep -c sendEmail src/app/api/ghl/signup/route.ts` = 0). Second, **that route persists nothing durable before it calls GHL**, for an anonymous interest submission with newsletter off, the only intended record is the GHL contact, and `upsertContact` swallows every failure to `null` (`src/lib/ghl/client.ts:139-142`). During the 12 June crawl-saturation 504 the request never reached GHL, so the lead vanished with no trace. Sitting on top of both is the global kill switch: **`sendEmail()` returns null and sends nothing unless `EMAIL_ENABLED === 'true'`** (`src/lib/email/send.ts:38-47`), and `EMAIL_ENABLED` is not in `.env.example` and its prod value is unverified. If it is unset in Vercel, every receipt and every cron email is a silent no-op.

So the fix order is: (P0) confirm `EMAIL_ENABLED` + `GHL_*` are set in prod (Ben, Tier 2 read); (P0) add durable-first Supabase capture before any GHL call on signup/connect/host; (P0) add a receipt to `/api/ghl/signup`; then the six structural defects.

---

## 1. Action-tier + shift summary

| # | Defect | File | Tier | Shift |
|---|---|---|---|---|
| ENV | `EMAIL_ENABLED` + `GHL_*` prod verification | Vercel | **Tier 2 read** (Ben) | Day shift |
| A | No durable-first capture on signup/connect/host | 3 routes + 1 migration | Tier 1 code (migration apply = Tier 3) | Night-shift code; migration is day-shift |
| B | `/api/ghl/signup` sends no receipt | `signup/route.ts` | Tier 1 | Night-shift |
| 2 | pipeline-followup reads `campaign_alignment_entities` | `pipeline-followup/route.ts` | Tier 1 (+ decision) | Night-shift code, day-shift decision |
| 3 | reengagement cron absent from `vercel.json` | `vercel.json` | Tier 1 | Night-shift |
| 4 | webhook checks literal `'Newsletter'` | `webhook/route.ts` | Tier 1 | Night-shift |
| 5 | ghl-sync emits legacy flat tags | `ghl-sync/route.ts` | Tier 1 | Night-shift |
| 6 | `upsertContact` runs before DB insert, swallows to null | `signup/connect/host` | Tier 1 (folded into A) | Night-shift |
| 7 | welcome drip 2/3 + pre-event drip have no scheduler | `vercel.json` + GHL workflows | Tier 1 code; GHL workflow = Tier 2 | Night-shift code, day-shift GHL |

**The one rule no fix may break:** never touch `campaign/social-publish` (posts to real public social accounts) and never apply a migration or flip `EMAIL_ENABLED=true` as part of an autonomous run, those are Tier 3 and stay day-shift, human-in-loop.

---

## ENV, Prod env-var verification checklist (Ben, Tier 2 reads in Vercel)

Do this **before** trusting any receipt or cron. These are reads in the Vercel dashboard (Project → Settings → Environment Variables, Production scope). None of them are writes; the only write is the eventual decision to set `EMAIL_ENABLED=true`, which is itself a Tier 2 action you take deliberately, not an AFK step.

| Env var | Why it matters | What "good" looks like | If unset / wrong |
|---|---|---|---|
| `EMAIL_ENABLED` | Master kill switch on ALL email (`send.ts:38`) | `true` (string) | Every receipt + every cron email is a silent no-op. **Most likely single cause of the no-reply.** |
| `GHL_API_KEY` | GHL auth (`client.ts:54`) | present, valid | `isConfigured()` false → no contact writes, no email (GHL is the email transport) |
| `GHL_LOCATION_ID` | GHL location `agzsSZWgovjwgpcoASWG` (`client.ts:55`) | matches the live CONTAINED location | wrong value writes to the wrong sub-account |
| `GHL_WEBHOOK_SECRET` | HMAC gate (`webhook/route.ts:51,70-77`) | present | In prod, **unset returns 500 on every inbound webhook**, GHL→Supabase sync silently dead |
| `CRON_SECRET` | Every cron's bearer check | present, matches Vercel cron header | Missing/wrong = every cron 401s = silent no-op |
| `CONTAINED_DIGEST_TO` | daily-digest recipient | `benjamin@act.place` (its default) or chosen inbox | falls back to default; low risk |
| `GHL_PRE_EVENT_WORKFLOW_ID` | pre-event drip trigger (`register/route.ts:305`) | set if a GHL pre-event workflow exists | unset → pre-event drip never fires (see defect 7) |
| `GHL_WELCOME_WORKFLOW_ID` | welcome drip trigger (`newsletter/route.ts`) | set if a welcome workflow exists | unset → welcome drip 2/3 never fires (see defect 7) |
| `GHL_WORKFLOW_{ORGANIZATION,MEDIA,SUPPORTER,FUNDER,LIVED_EXPERIENCE}` | role nurture (`client.ts:711-717`) | set per role that has a workflow | unset → that role's nurture silently skipped |
| `GHL_FUNDER_PIPELINE_ID` / `GHL_FUNDER_STAGE_NEW` | connect funder opportunity (`client.ts:707`) | set once Phase D funder pipeline exists | unset → funder connect lands as tag-only, no pipeline card |
| `GHL_PARTNER_PIPELINE_ID` / `GHL_PARTNER_STAGE_NEW` | host + partner opportunity (`client.ts:704`) | set once Phase D partner pipeline exists | unset → host/partner lands as tag-only, no pipeline card |

**Action for Ben:** read the eleven values above in Vercel prod, fill the "actual" column, and decide whether to set `EMAIL_ENABLED=true`. If you flip it on, the **next** post-experience / nurture / pipeline-followup cron will send real email to real external people, so flip it on a day you can watch the first sends, not into an overnight backlog.

**Also update `.env.example`** (Tier 1, do this regardless): `EMAIL_ENABLED`, `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_WEBHOOK_SECRET`, `GHL_PRE_EVENT_WORKFLOW_ID`, `GHL_WELCOME_WORKFLOW_ID`, and the five `GHL_WORKFLOW_*` keys are all read in code but absent from `.env.example` (only the four `GHL_*_PIPELINE_ID`/`_STAGE_NEW` and `CRON_SECRET` are listed). A future dev/agent cannot know these gates exist. Add them commented, with a one-line note that `EMAIL_ENABLED` defaults OFF.

---

## DEFECT A (P0), Durable-first Supabase capture before any GHL call

**This is the 12-June-loss root cause.** On `signup`, `connect`, and `host`, the GHL call is the only durable write for the common path, and GHL failures are swallowed to `null` (`client.ts:139-142`). A 504, a GHL outage, or an API error loses the lead with a success response.

### Defect locations
- `src/app/api/ghl/signup/route.ts:128-147`, profile merge is the only Supabase write, and it is gated on `if (user_id && ghlContactId)`. The register-interest form sends **no `user_id`** (`register-interest/page.tsx:43-54`), so an anonymous interest submission with `newsletter:false` writes **nothing** to Supabase. GHL upsert at `:87` runs first; null-swallowed at `client.ts:139-142`.
- `src/app/api/contained/connect/route.ts:97-119`, `contact_submissions` insert is wrapped in try/catch that **logs and continues** ("best-effort, never fail capture if absent"). A failed insert drops the record silently; GHL becomes the only record.
- `src/app/api/contained/host/route.ts:60-85`, identical best-effort try/catch, same silent-drop, and **no team notification** so a lost host offer is invisible.

### The change

**A1. New durable capture table** (one migration, Tier 3 to apply, day-shift). Add a single append-only table that every capture route writes a row to **before** touching GHL. Follow the existing `contact_submissions` shape (`supabase/migrations/20260611000001_create_missing_campaign_capture_tables.sql:457-489`):

```sql
-- supabase/migrations/2026061x000001_create_contained_capture_log.sql
CREATE TABLE IF NOT EXISTS contained_capture_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route         TEXT NOT NULL,              -- 'signup' | 'connect' | 'host'
  email         TEXT NOT NULL,
  name          TEXT,
  role          TEXT,                       -- member_type / connect role / 'host'
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- sanitised form fields
  ghl_contact_id TEXT,                      -- backfilled after the GHL upsert succeeds
  ghl_synced    BOOLEAN NOT NULL DEFAULT FALSE,
  receipt_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contained_capture_email   ON contained_capture_log(email);
CREATE INDEX IF NOT EXISTS idx_contained_capture_unsynced ON contained_capture_log(ghl_synced) WHERE ghl_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_contained_capture_created  ON contained_capture_log(created_at DESC);
ALTER TABLE contained_capture_log ENABLE ROW LEVEL SECURITY;
-- Admin-only read (mirror the contact_submissions admin policy); inserts come via service role.
```

**A2. Rewrite the order on all three routes to: validate → INSERT capture row → GHL → backfill ids on the row.** Pattern (shown for `signup`; `connect`/`host` are the same shape):

```ts
// AFTER validation, BEFORE the `if (ghl.isConfigured())` block:
let captureId: string | null = null;
try {
  const supabase = createServiceClient();
  const { data, error } = await (supabase as any)
    .from('contained_capture_log')
    .insert({
      route: 'signup',
      email,                       // already validated
      name: full_name || null,
      role: member_type || (is_steward ? 'steward' : null),
      payload: { organization, state, source, newsletter, message: sanitizedMessage },
    })
    .select('id')
    .single();
  if (error) throw error;
  captureId = data.id;
} catch (e) {
  // Durable capture is the loss-proof guarantee, if THIS fails, fail loud.
  console.error('[signup] durable capture insert failed:', e);
  return NextResponse.json(
    { error: 'We could not save your details. Please email ben@justicehub.com.au.' },
    { status: 500 }
  );
}
// ... then the existing GHL upsert ...
// AFTER a successful upsert, backfill:
if (captureId && ghlContactId) {
  await (supabase as any)
    .from('contained_capture_log')
    .update({ ghl_contact_id: ghlContactId, ghl_synced: true })
    .eq('id', captureId)
    .then(undefined, (err: unknown) => console.error('[signup] capture backfill failed:', err));
}
```

**Key inversion:** the **capture row** is now the thing that returns 500 on failure (so the form's existing 15s fail-loud fallback fires and tells the person their details were NOT saved). The GHL call stays best-effort: a GHL hiccup leaves an un-synced row that a reconcile sweep can replay, instead of losing the lead. This makes the funnel genuinely loss-proof, which the 12 June incident proved it was not.

**A3. `connect`/`host` adjustment.** They already attempt a `contact_submissions` insert, keep that for the admin inbox, but **also** write the `contained_capture_log` row and make *that* the fail-loud guarantee. Do **not** make `contact_submissions` fail-loud (its insert can legitimately be skipped); make `contained_capture_log` the immutable spine. For `host`, also add the missing team-notification email (it currently has none, a lost host offer is invisible even with email on).

**A4. (optional, recommended) Reconcile sweep.** A tiny cron (or admin button) that reads `contained_capture_log WHERE ghl_synced = FALSE`, retries `upsertContact`, and backfills. Not required to close the loss, but it turns "un-synced row" into "eventually in the CRM" automatically. Schedule it **only** after the routes write the rows, and keep it Tier 1 (it writes to GHL contacts only on rows you already captured, no sends).

### Blast radius + tier
- Route code edits: **Tier 1**, night-shift-safe, no external writes at edit time.
- Migration apply: **Tier 3** (`supabase migration apply`), day-shift, Ben runs it. Until applied, the route code must tolerate the table being absent **only on `connect`/`host`'s `contact_submissions` path**; the new `contained_capture_log` write is the fail-loud spine, so the migration must be applied before the route changes ship, or the routes will 500. **Apply the migration first, then deploy the route changes.**

### Tests
- **Unit / throwaway-contact (no GHL):** POST a body with a bad/unconfigured GHL to a local dev server with a test Supabase, assert a `contained_capture_log` row exists and the response is still 201/200 (capture succeeded, GHL skipped).
- **Loss simulation:** temporarily point `GHL_API_KEY` at an invalid value locally, POST, confirm the row lands with `ghl_synced = false` and the person still gets the durable record (and, once defect B lands, the receipt path is at least attempted).
- **Curl (local only):**
  ```bash
  curl -sS -X POST http://localhost:3014/api/ghl/signup \
    -H 'Content-Type: application/json' \
    -d '{"email":"ben+capture-test@benjamink.com.au","full_name":"Capture Test","member_type":"supporter","newsletter":false}'
  # then verify the row exists (read-only):
  # SELECT id, route, email, ghl_synced, receipt_sent FROM contained_capture_log
  #   WHERE email = 'ben+capture-test@benjamink.com.au' ORDER BY created_at DESC LIMIT 1;
  ```
  Use a `ben+...@benjamink.com.au` plus-address so the test contact is disposable and never pollutes a real segment.

---

## DEFECT B (P0), `/api/ghl/signup` sends no receipt (the no-reply)

### Defect location
`src/app/api/ghl/signup/route.ts`, the entire file. Zero `sendEmail` import, zero call. The register route (`register/route.ts:283-301`) is the working reference: it builds a pathway-specific receipt and fire-and-forgets `sendEmail`.

### The change
Add a receipt send after the durable capture + GHL block, mirroring the register route. Reuse the existing receipt builders in `src/content/contained-receipts.ts`, there is already `supporterReceipt(firstName)`, and the kill-switch in `send.ts` means this is safe even with `EMAIL_ENABLED` off (it just logs and returns null).

1. **Add a `signupReceipt` (or `interestReceipt`) builder** to `src/content/contained-receipts.ts`. Voice = Imagination Architect, zero em-dashes, no AI-vocab. Draft body (links to `/contained/brief`, no raw figures, preserves scarcity by not promising a slot):

   > ```
   > {firstName},
   >
   > Your interest in CONTAINED is in. A real person reads these, not a filter.
   >
   > Here is what happens next. We will be in touch about the way you offered
   > to stand with it: your city, a partnership, funding, or simply staying
   > close to the work.
   >
   > While you wait, two doors you can open today:
   >
   > READ the brief. Three rooms, thirty minutes, and the evidence underneath
   > it: https://justicehub.com.au/contained/brief
   >
   > NOMINATE the person whose decisions touch children's lives. A magistrate,
   > an MP, a CEO. We make the personal invitation:
   > https://justicehub.com.au/contained#nominate
   >
   > You can't unknow what you're about to know.
   >
   > The CONTAINED team at JusticeHub
   > ```
   No numbers in the copy; the figures live behind `/contained/brief` where source/year/jurisdiction are locked. Do not assert "consent confirmed" for anyone. Community-lane (`member_type === 'lived_experience'`) suppresses automation already, send this human-written receipt to them too (a receipt acknowledging their submission is not auto-enrolment into comms:, so it respects OCAP, but **confirm with Ben** whether the lived-experience lane should get any automated email at all; if not, gate the send on `!communityLane`).

2. **Wire it into the route** (after the GHL block, fire-and-forget like register):
   ```ts
   import { sendEmail } from '@/lib/email/send';
   import { signupReceipt } from '@/content/contained-receipts';
   // ...
   const firstName = (full_name || '').split(' ')[0] || 'there';
   const receipt = signupReceipt(firstName);
   sendEmail({
     to: email,
     subject: receipt.subject,
     body: receipt.body,
     preheader: receipt.preheader,
     heroImage: {
       src: 'https://www.justicehub.com.au/images/contained/contained-brand-square.png',
       alt: 'CONTAINED. 3 rooms. 30 minutes. The truth.',
     },
   })
     .then((r) => { if (r && captureId) { /* mark receipt_sent on the capture row */ } })
     .catch((err) => console.error('[signup] receipt email failed:', err));
   ```
   Backfill `receipt_sent = true` on the `contained_capture_log` row when the send returns a result, so the admin can see at a glance who got a receipt and who did not.

### Blast radius + tier
**Tier 1**, night-shift-safe. With `EMAIL_ENABLED` off the send is a no-op (logged). With it on, the registrant gets one confirmation. No external write happens at edit time.

### Test
- With `EMAIL_ENABLED` unset locally, POST and assert the log shows `[email] EMAIL_ENABLED is not true, skipping send`, proves the path is wired and gated.
- With `EMAIL_ENABLED=true` in a **local** dev env pointed at a test GHL location, POST to a `ben+...@benjamink.com.au` address and confirm one email arrives. Never run this against prod GHL as an autonomous step.

---

## DEFECT 2, pipeline-followup reads `campaign_alignment_entities`, not `campaign_nominations`

### Defect location
`src/app/api/cron/campaign/pipeline-followup/route.ts:91-100` queries `campaign_alignment_entities` filtered on `outreach_status IN ('contacted','in_discussion','proposal_sent')`.

### Honest framing (read before "fixing")
The route's own comment (`:88-90`) says this was **deliberate**: "The nominated status was removed from this query — nominations now live in `campaign_nominations`, not `campaign_alignment_entities`, so this pipeline no longer follows them up." So pipeline-followup reading `campaign_alignment_entities` is not, by itself, a bug — that table is the alignment-engine's outreach ledger and is the correct source for *that* follow-up loop. The real issues are two, and they are decisions for Ben, not a mechanical rename:

1. **`campaign_alignment_entities` is the legacy/polluted table.** Ground-01 §6 says a tag-based or table-based pull there returns the polluted ~272, not the honest ~85. This cron will happily auto-send to stale rows in that table. With `EMAIL_ENABLED` on, that is **external email to possibly-cold contacts**, Tier 3 blast radius even though the code is Tier 1.
2. **Nominators in `campaign_nominations` get no follow-up at all.** If the intent is that a nominator who left an email should get a nudge, that is a *new* loop, not a field rename, it would read `campaign_nominations`, not replace the alignment query.

### The change (decision-gated)
- **If the intent is "follow up alignment-engine prospects":** leave the table as-is, but **scope the audience to the KEEP cohort** so it cannot email the polluted rows. Add a guard: only follow up entities that also carry the honest CONTAINED signal (a `source:event:contained` mirror, or a join against the KEEP-cohort list), and cap auto-sends. This is the safer change and is Tier 1 code, but the **audience decision is Ben's** (day-shift).
- **If the intent is "follow up nominators":** that is a separate small cron reading `campaign_nominations WHERE nominator_email IS NOT NULL AND ...`, with its own copy and its own one-send-per-contact cap. Design it only after Ben confirms nominators should be emailed at all (the live nomination route deliberately never emails the nominee, and only sends the nominator a single receipt).

**Do not** blindly swap `from('campaign_alignment_entities')` to `from('campaign_nominations')`, the column shapes differ (`outreach_status`, `alignment_signals` do not exist on `campaign_nominations`), so a blind swap throws at query time, and it would conflate two distinct follow-up purposes.

### Blast radius + tier
Code = **Tier 1**. The audience scoping and the "should nominators be emailed" question are **decisions only Ben can make** (day-shift). Until decided, the safest interim is to **leave pipeline-followup as-is** (it currently follows up alignment rows, which is its documented purpose) and flag the pollution-audience risk for the day Ben turns `EMAIL_ENABLED` on.

### Test
- Read-only: `SELECT count(*) FROM campaign_alignment_entities WHERE outreach_status IN ('contacted','in_discussion','proposal_sent') AND email IS NOT NULL;`, confirm how many rows this cron would email today before deciding.
- After scoping: dry-run the query (no send) and assert the row count matches the KEEP cohort, not ~272.

---

## DEFECT 3, reengagement cron built but absent from `vercel.json`

### Defect location
`src/app/api/cron/contained/reengagement/route.ts` exists and is complete, but `vercel.json` `crons[]` (lines 6-207) does not list it, so it never fires on schedule. Its docstring claims "Runs daily at 10:00 UTC."

### The change
Decide first **whether it should run at all.** It tags `inactive_7d` in GHL and removes it for active members (`reengagement/route.ts:56-60`). The `nurture` cron (`vercel.json:136`, `0 9 * * *`) already tags `inactive_7d` per its ground-02 description, so reengagement may be **redundant** with nurture. Two options:

- **If reengagement is the canonical inactive-tagger and nurture should not do it:** add the cron entry and remove the dup from nurture. Entry (the docstring says 10:00 UTC; nurture is 09:00, so 10:00 avoids overlap):
  ```json
  { "path": "/api/cron/contained/reengagement", "schedule": "0 10 * * *" }
  ```
- **If nurture already covers it:** leave reengagement unscheduled and add a one-line comment in the route file marking it superseded, so the next agent does not "fix" it back on. (Documenting the dormancy as intentional is itself a valid fix.)

### Blast radius + tier
**Tier 1** edit to `vercel.json`. But scheduling it means it **writes GHL tags** on every run (no email, so no inbox blast). Verify it does not double-write `inactive_7d` with nurture before scheduling. The decision (schedule vs document-as-dormant) is a quick day-shift call; the edit is night-shift-safe once decided.

### Test
- Local: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3014/api/cron/contained/reengagement` against a test GHL location, assert it returns `{ members_checked, tagged_inactive, still_active }` and does not error on the `public_profiles` filter `cs '{"contained_"}'`.
- Cross-check against nurture: read both routes and confirm only one writes `inactive_7d` after the change.

---

## DEFECT 4, webhook checks literal `'Newsletter'`, not `comms:justicehub-newsletter`

### Defect location
`src/app/api/ghl/webhook/route.ts:130`, `if (!tags.includes('Newsletter'))` marks `newsletter_subscriptions.is_active = false`. The canonical send-trigger tag is `GHL_CANONICAL.COMMS_JH_NEWSLETTER = 'comms:justicehub-newsletter'` (`client.ts:764`). A canonical contact never carries the literal `'Newsletter'`, so if a `ContactTagUpdate` webhook ever fires for a canonical subscriber, this branch sees the canonical tag, concludes "Newsletter tag is missing," and **incorrectly deactivates a live subscriber.**

### The change
Check the canonical tag (and tolerate the legacy one during the migration window):
```ts
const NEWSLETTER_TAGS = ['comms:justicehub-newsletter', 'Newsletter']; // canonical first, legacy tolerated
const stillSubscribed = NEWSLETTER_TAGS.some((t) => tags.includes(t));
if (!stillSubscribed) {
  await supabase
    .from('newsletter_subscriptions')
    .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
    .eq('ghl_contact_id', contact.id);
}
```
Keeping `'Newsletter'` in the array means a not-yet-migrated legacy contact still deactivates correctly; the canonical check fixes the false-deactivation. Centralise the constant from `GHL_CANONICAL.COMMS_JH_NEWSLETTER` rather than hardcoding the string twice.

### Blast radius + tier
**Tier 1**, night-shift-safe. This is a read-side correction on inbound webhooks; it writes only to `newsletter_subscriptions` (our own table), no external send. Note this branch only fires if `GHL_WEBHOOK_SECRET` is set in prod (otherwise the webhook 500s before reaching it, see ENV checklist), so its real-world impact today is gated on the webhook being live at all.

### Test
- Unit: construct a `ContactTagUpdate` body with `tags: ['project:act-jh','comms:justicehub-newsletter']`, assert the route does **not** deactivate. Then with `tags: ['project:act-jh']`, assert it does.
- Against a test GHL location only: send a signed webhook (HMAC with the test secret) and verify `newsletter_subscriptions.is_active` is untouched for a canonical subscriber.

---

## DEFECT 5, ghl-sync emits legacy flat tags, not the colon canon

### Defect location
`src/app/api/cron/campaign/ghl-sync/route.ts:43`, `const tags = [GHL_TAGS.CONTAINED, GHL_TAGS.NEWSLETTER, GHL_TAGS.JUSTICEHUB]` resolves to the flat strings `'CONTAINED'`, `'Newsletter'`, `'JusticeHub'` (`client.ts:621,626,617`), plus `GHL_TAGS.TIER_CHAMPION = 'Tier: Champion'` (`:674`). The canon is colon-namespaced: `project:act-jh` + `source:event:contained` + `role:*` + `comms:justicehub-newsletter` (`client.ts:743-767`). This cron stamps the legacy pollution tags onto every high-scoring ally it syncs, actively re-creating the swamp the 12 June cleanup is trying to drain (ground-01 §3).

### The change
Swap to canonical tags:
```ts
import { GHL_CANONICAL } from '@/lib/ghl/client';
// ...
const tags: string[] = [
  GHL_CANONICAL.PROJECT_JH,
  GHL_CANONICAL.SOURCE_EVENT_CONTAINED,
  GHL_CANONICAL.INTEREST_JUSTICE_REFORM,
];
// passion_score gate: champion tier. The colon canon has no Tier: tag, the
// weekly engagement-scoring cron owns tier tags. Either drop the tier push here
// (let engagement-scoring assign it) OR keep GHL_TAGS.TIER_CHAMPION as the one
// agreed-legacy tier tag. Prefer dropping it so this cron emits ONLY canon.
```
Also reconsider whether ghl-sync should add a `comms:` tag at all: `GHL_TAGS.NEWSLETTER` here silently opts allies into newsletter sends without captured consent, which violates the comms-consent rule (`comms:` is "granted ONLY with captured consent", `client.ts:763`). **Drop the newsletter tag from this cron** unless the ally explicitly consented, these are alignment-engine prospects, not opt-ins.

**Caveat:** this cron reads `campaign_alignment_entities` (the polluted table) and writes GHL contacts daily (`vercel.json:104-105`). Switching its tags to canon is correct, but the deeper question (should this cron be syncing the polluted table to GHL at all during the cleanup) is the same decision as defect 2, flag it for Ben. The tag fix is safe in isolation; whether the cron should run pre-cleanup is a day-shift call.

### Blast radius + tier
Code = **Tier 1**. But this cron **writes GHL contacts every day**, so a wrong tag value propagates to the live CRM on the next run. The fix itself is correct-by-construction (it makes the cron emit canon), but **verify with Ben** whether to pause this cron until Phase D cleanup completes, so it does not keep writing to the polluted table. Pausing a cron = removing/commenting its `vercel.json` entry = Tier 1 edit, but a behaviour change Ben should sign off.

### Test
- Read-only dry-run: copy the query into a throwaway script, log the candidate `entities` and the tag array that *would* be sent, assert the array is all-colon and contains no `'Newsletter'`/`'CONTAINED'`/`'JusticeHub'` flat strings. Do **not** call `upsertContact`.
- After deploy, watch the next scheduled run's log for `Synced N allies` and spot-check one contact in GHL (read-only) for canon tags.

---

## DEFECT 6, `upsertContact` runs before the DB insert and swallows errors to null

### Defect location
`src/lib/ghl/client.ts:139-142`, the `catch` in `upsertContact` returns `null`, so every failure (network, 4xx, 5xx, timeout) looks identical to "GHL not configured." Combined with GHL-before-DB ordering on `signup` (`:87` before `:128`), `connect` (`:131` after a best-effort DB try), and `host` (`:101` after a best-effort DB try), a swallowed failure means the lead is gone with a success response.

### The change
**Defect 6 is structurally closed by Defect A** (durable-first capture inverts the ordering so the Supabase row is the system of record and GHL is best-effort downstream). Do A first. In addition, make the swallow *observable* without changing the return contract (callers depend on `null` meaning "no id"):

1. **Keep the `null` return** (callers rely on it), but **distinguish "not configured" from "failed."** Today both log differently already (`:78` warn vs `:140` error), which is fine, the real gap is that no *caller* reacts to the failure. With Defect A, the caller now has a `contained_capture_log` row, so a `null` from `upsertContact` simply leaves `ghl_synced = false` on that row instead of losing data. No further client change is strictly required.
2. **(optional) Surface a typed result.** If you want callers to branch on failure vs not-configured, add a thin `upsertContactResult(): { id: string } | { error: 'not_configured' | 'failed' }` wrapper rather than changing `upsertContact`'s signature (which is called in ~a dozen places). Lower priority, A already removes the data-loss.

### Blast radius + tier
**Tier 1**, folded into A. The minimal correct fix is "do A, leave the client return as-is." Changing the client's return type touches every caller and is not worth it for launch.

### Test
- Covered by Defect A's loss-simulation test: invalid `GHL_API_KEY` → `upsertContact` returns null → capture row persists with `ghl_synced = false`, no data lost. That is the behaviour proving 6 is closed.

---

## DEFECT 7, welcome drip 2/3 + pre-event drip have no scheduler

### Defect location
Per ground-02 (L62/64): the welcome drip's emails 2 and 3, and the pre-event drip, are authored but nothing advances them on a schedule. The triggers exist as GHL workflow handoffs (`GHL_WELCOME_WORKFLOW_ID` at newsletter route; `GHL_PRE_EVENT_WORKFLOW_ID` at `register/route.ts:305`), but both are `if (id)`-gated, so if those workflow IDs are unset in prod (see ENV checklist), the drips never fire and there is no fallback scheduler to send 2/3.

### The change: two paths, pick one per drip
**Path 1 (preferred): GHL owns the multi-step drip.** Confirm the GHL workflows exist, capture their IDs, and set `GHL_WELCOME_WORKFLOW_ID` / `GHL_PRE_EVENT_WORKFLOW_ID` in Vercel prod (Tier 2 read-then-set in GHL + Vercel, day-shift). Then the existing `addToWorkflow` handoffs (`register/route.ts:304-311`, newsletter route) drive emails 2/3 inside GHL. No new cron. This is the right home for time-delayed sequences.

**Path 2 (fallback): a Next cron advances the drip.** If you do not want to build the sequences in GHL, add a scheduler cron (like `contained/post-experience`, which already does Day-1/7/30 by reading a `metadata.post_experience_sent` marker). It would:
- read subscribers/registrants whose welcome/pre-event step is due (a `metadata.welcome_step` / `pre_event_step` marker + timestamp),
- send the next email via `sendEmail`,
- advance the marker.
Add its `vercel.json` entry (e.g. `{ "path": "/api/cron/contained/welcome-drip-advance", "schedule": "0 13 * * *" }`). This is more code and re-implements what GHL workflows do natively, so prefer Path 1 unless the GHL workflows do not exist.

### Blast radius + tier
- Path 1: setting workflow IDs is **Tier 2** (GHL workflow exists/edit), day-shift, Ben.
- Path 2: writing the cron is **Tier 1** code; adding it to `vercel.json` is Tier 1; but it **sends real email** on schedule once `EMAIL_ENABLED=true`, so its first live run is a watched day-shift event, not an AFK backlog item.

### Test
- Path 1: in GHL (read-only), confirm the welcome + pre-event workflows have steps 2/3 and a delay between them. After setting the env IDs, register a `ben+...@benjamink.com.au` test contact and watch the workflow enrol it (read-only in GHL).
- Path 2: local `curl` with `CRON_SECRET`, assert it selects only due rows, sends (gated by `EMAIL_ENABLED`), and advances the marker; re-run immediately and assert it sends nothing (idempotent).

---

## APPLY ORDER (loss-proof first, audience-touching last)

Strict order. Each step is independently shippable; do not reorder 1→4 (they close the data loss before anything starts emailing).

1. **ENV verification (Ben, Tier 2 read, day-shift).** Read `EMAIL_ENABLED` + all `GHL_*` in Vercel prod. Fill the actuals. **Do not flip `EMAIL_ENABLED=true` yet**, wait until step 3 lands so a registrant gets a receipt the moment email turns on. Also: add the missing keys to `.env.example` (Tier 1, anytime).
2. **Defect A migration (Ben, Tier 3, day-shift).** Apply `contained_capture_log`. This must precede the route changes in step 3 (the routes write to it as the fail-loud spine).
3. **Defects A (routes) + B (receipt) (night-shift code, Tier 1).** Durable-first capture on signup/connect/host + add the signup receipt + the new `signupReceipt` builder + host team-notification. Ship together, they are the no-reply fix. Defect 6 closes automatically here.
4. **`.env.example` update + Defect 4 (webhook canonical tag) (night-shift, Tier 1).** Cheap correctness fixes, no audience impact.
5. **Defect 5 (ghl-sync canon tags) (night-shift code, Tier 1; pause decision = Ben).** Make the cron emit canon and drop the unconsented newsletter tag. Decide with Ben whether to pause it until Phase D.
6. **Defect 3 (reengagement schedule), decide then act (Ben call, then Tier 1 edit).** Schedule it OR document it as superseded by nurture. Verify no `inactive_7d` double-write.
7. **Defect 2 (pipeline-followup audience), decide then act (Ben call, then Tier 1).** Scope to KEEP cohort OR leave as-is; do not blind-swap the table. This is the highest audience-blast item, so it lands after the loss is closed and only once `EMAIL_ENABLED`'s state is known.
8. **Defect 7 (drips), Path 1 GHL workflows (Ben, day-shift) or Path 2 cron (night-shift code).** Last, because it is the most-deferred sequence and depends on the workflow-ID env decision from step 1.
9. **(optional) Defect A4 reconcile sweep (night-shift, Tier 1).** Once rows are landing, add the un-synced replay.

**The flip that turns the system on:** after steps 2-4 are live, Ben sets `EMAIL_ENABLED=true` in Vercel prod on a day he can watch the first cron sends (post-experience 12:00 UTC, nurture 09:00 UTC, daily-digest 21:00 UTC, pipeline-followup Wed 06:00 UTC). That single Tier 2 action is what makes every receipt and drip real. Never queue it into an overnight run.

---

## What this design deliberately does NOT do

- It does not flip `EMAIL_ENABLED`, apply the migration, write any GHL tag/contact/opportunity, trigger any cron, or send any email. All of that is documented for a human.
- It does not "fix" the `source:research` / org-wall eligibility exclusion (ground-01 §5), that exclusion is load-bearing and correct.
- It does not blind-swap pipeline-followup's table or auto-email nominators, both are decisions, not mechanical renames.
- It uses no campaign figures in copy; the receipt links `/contained/brief` where source/year/jurisdiction are locked, per the figures rule.
- It never re-introduces flat legacy tags; every new tag emitted is colon-canon.
