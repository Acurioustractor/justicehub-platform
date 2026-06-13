# CONTAINED capture + automation — as-built systems map

Ground-truth trace of every capture route and cron in the CONTAINED funnel, as the code actually runs on 13 June 2026. Read-only: nothing here was executed against GHL, Supabase, or Vercel. Every load-bearing claim cites `file:line`.

## TL;DR for the design phase

- **All email in this system goes through one path and one kill switch.** `sendEmail()` returns null and sends nothing unless `EMAIL_ENABLED=true` AND GHL is configured (`src/lib/email/send.ts:38-47`). It dispatches via the **GHL Conversations API**, not Resend. The "via Resend" comments in `register/route.ts:279` and `newsletter/route.ts:128` are stale and wrong. If `EMAIL_ENABLED` is unset in prod, every receipt and every nurture/digest send is a silent no-op (logged, not surfaced).
- **The live nomination form does NOT hit `/api/contained/nominations`.** It posts to `/api/projects/[slug]/nominations` with slug `the-contained` (`src/app/contained/tour/nominate-form.tsx:88`). `/api/contained/nominations/route.ts` is the orphaned older route writing to `campaign_alignment_entities`; the live route writes to `campaign_nominations`. The daily-digest and engagement-scoring crons correctly read `campaign_nominations`, so they are aligned with the live route, not the orphan.
- **One cron can fire LIVE external posts to real social accounts**: `campaign/social-publish` posts to GHL Social Planner (Instagram, both LinkedIn accounts, Facebook, YouTube, Bluesky, Google Business) and mutates Notion. NEVER trigger it manually. The other crons can send email but only through the `EMAIL_ENABLED` gate.
- **`contained/reengagement` is dormant** — the route exists but is NOT in `vercel.json` crons, so it never runs on schedule.
- **Two env-var families gate behaviour and their prod state is UNVERIFIED from here**: workflow IDs (`GHL_PRE_EVENT_WORKFLOW_ID`, `GHL_WELCOME_WORKFLOW_ID`, `GHL_WORKFLOW_*`) and Phase-D pipeline IDs (`GHL_FUNDER_PIPELINE_ID`, `GHL_PARTNER_PIPELINE_ID`). All are gated with `if (id)` so an unset value silently skips that step. No data is lost when they are unset; the contact still lands with tags. The capture itself never depends on them.

---

## Part 1 — Capture routes (input → validation → DB → GHL → email → failure mode)

### A. `/contained/register` → POST `/api/ghl/register` (`src/app/api/ghl/register/route.ts`)

- **Form**: `src/app/contained/register/page.tsx:124`. Has Turnstile. 15s `AbortSignal.timeout` + fail-loud fallback (`6dc96bb9`, line ~140-160).
- **Validation**: Turnstile verified first (`:51-57`, returns 403 on fail). Email + full_name required (`:93-98`, returns 400). Role whitelisted to `ALLOWED_ROLES` else coerced to `supporter` (`:66-68`). All free text sanitized.
- **DB writes**: `event_registrations` insert (`:228-252`) — this is the **canonical capture row**; if it errors the route returns 500 (`:254-260`). If newsletter opt-in, also `newsletter_subscriptions` upsert (`:263-277`). Optional `member_actions` insert if the email matches a `profiles` row (`:314-331`, non-blocking).
- **GHL**: `upsertContact` with the canonical CONTAINED tag set (`:130-169`) — `project:act-jh` + `source:event:contained` + `interest:justice-reform` + `engagement:warm` + role + `place:*` from state. EOI captures (`experience:eoi` tag) route to the **Adelaide pipeline (Captured)**; everything else to **Engagement (Identified)** (`:211-221`). Opportunity create is `.catch()`-swallowed (non-blocking, `:220`).
- **Email**: pathway-specific receipt — `eoiReceipt` / `supporterReceipt` / `preEventSequence.emails[0]` (`:283-301`), fire-and-forget `.catch()`.
- **Workflow**: `GHL_PRE_EVENT_WORKFLOW_ID` added if set (`:304-311`), `.catch()`-swallowed.
- **Silent-failure risk — MEDIUM.** Capture row is protected (500 on failure, so the form fail-loud fallback fires). BUT the GHL upsert runs **before** the DB insert and any GHL failure is swallowed inside `upsertContact` (returns `null`, `client.ts:139-142`) — a registrant can land in `event_registrations` with `ghl_contact_id: null` and never reach the CRM board, with no alert. Receipt + workflow are best-effort; if `EMAIL_ENABLED` is off the person gets no confirmation and never knows.

### B. `/contained/eoi` → POST `/api/ghl/register` (same route, `experience:eoi` / `engagement:supporter` tags)

- **Form**: `src/app/contained/eoi/eoi-content.tsx:141`. Turnstile + 15s timeout + fail-loud (`6dc96bb9`).
- Same route as A. The `experience:eoi` tag forces the **Adelaide pipeline (Captured)** and the **`eoiReceipt`** (no "you're registered" language, preserving scarcity). `engagement:supporter` forces `supporterReceipt`.
- **Silent-failure risk — MEDIUM** (identical to A; EOI is the scarce path so a lost EOI is higher-cost than a lost general signup).

### C. `/contained/register-interest` → POST `/api/ghl/signup` (`src/app/api/ghl/signup/route.ts`)

- **Form**: `src/app/contained/register-interest/page.tsx:43`. 15s timeout + fail-loud (`6dc96bb9`). **No Turnstile on this form** (signup route has no Turnstile check).
- **Validation**: email required only (`:39-44`). `member_type` (the form's `role`) drives the canonical role tag via `MEMBER_TYPE_TO_ROLE`. `lived_experience` → `lane:community`, automation + newsletter suppressed (OCAP, `:55,70-72,82,117`).
- **DB writes**: this route's primary persistence is `public_profiles.metadata.ghl_contact_id` merge (`:128-147`) **only when `user_id` is supplied**. The register-interest form does NOT send `user_id`, so **no profile row is written for an anonymous interest submission.** Newsletter upsert to `newsletter_subscriptions` happens only if `newsletter && !communityLane` (`:151-164`).
- **GHL**: `upsertContact` with `project:act-jh` (+ `source:event:contained` when `member_type` present) + role + `place:*` + `comms:justicehub-newsletter` on consent (`:57-104`). No pipeline opportunity unless `is_steward` (`:107-114`).
- **Email**: **none.** This route sends no receipt at all.
- **Silent-failure risk — HIGH (this is the form that lost a real submission on 12 June).** For an anonymous interest submission with `newsletter:false`, the ONLY durable record is the GHL contact. If the GHL upsert fails (swallowed to `null`, `client.ts:139-142`) or the whole request 504s before reaching GHL, there is **no Supabase row, no receipt, nothing** — the submission is gone. The 12 June crawl-saturation outage 504'd exactly this kind of request. The 13 June fail-loud fix tells the visitor it was not saved and to email ben@justicehub.com.au, which is the current mitigation, but the route still has no server-side durable-first capture. Design phase should consider writing a row to a capture table BEFORE the GHL call on this route.

### D. `/contained/nominations` (live) → POST `/api/projects/the-contained/nominations` (`src/app/api/projects/[slug]/nominations/route.ts`)

- **Form**: `src/app/contained/tour/nominate-form.tsx:88` (and the wall view `nominations-wall.tsx`). Turnstile + honeypot.
- **Validation**: honeypot first (`:242-244`, returns fake success), Turnstile (`:247-253`), rate limit 5/IP/hour (`:255-266`), required fields nominee_name/category/reason (`:268-273`), category whitelist (`:275-280`), reason ≥10 chars (`:282-287`), email format if present (`:289-291`).
- **DB write**: `campaign_nominations` insert with `is_public: false` (moderation gate — counts tick live, message text publishes only after approve on `/admin/contained/flow`) (`:293-305`). Insert error → 500.
- **GHL**: nominator (if email given) upserted as `role:supporter` + CONTAINED source, surfaced on **Engagement (Identified)** (`:310-341`), fire-and-forget `.catch(console.error)`.
- **Email**: nominator confirmation `nominatorReceipt` if email given (`:354-372`); internal team alert to benjamin@act.place on **every** nomination (`:376-389`). Both fire-and-forget. **Nominee is never emailed** by design (`:13-14`).
- **Silent-failure risk — LOW-MEDIUM.** Nomination row is protected (500 on insert failure). GHL + both emails are best-effort. A nominator providing an email during an outage could be lost from GHL silently, but the nomination row itself survives. Note: `nominate-form.tsx` does NOT carry the 15s timeout fix (only the 3 main forms got `6dc96bb9`), so a hung nomination submit has no abort — verify the design phase wants that added.

### E. `/contained/act` (and `/contained/tour`) → POST `/api/contained/connect` (`src/app/api/contained/connect/route.ts`)

- **Purpose**: a funder/partner/journalist self-identifies (GAP #20).
- **Validation**: honeypot `website` field (`:69-71`), role in {funder,partner,media} (`:73-75`), name+email required (`:76-78`). **No Turnstile.**
- **DB write**: `contact_submissions` insert wrapped in try/catch (`:97-119`) — "best-effort, never fail capture if absent". If the table is missing or insert fails, **the DB record is silently dropped and capture continues via GHL only**.
- **GHL**: role tag + CONTAINED source + `interest:justice-reform` (`:124-141`). Funder/partner get a pipeline opportunity **only if `GHL_FUNDER_PIPELINE_ID` / `GHL_PARTNER_PIPELINE_ID` is set** (`:144-154`); media is tag-only.
- **Email**: team notification to benjamin@act.place with submitter as From (`:159-171`); confirmation to submitter (`:174-186`). Both fire-and-forget.
- **Silent-failure risk — MEDIUM.** The DB insert is deliberately non-fatal, so the ONLY guaranteed record of a funder/partner/media enquiry is the GHL contact (if `upsertContact` succeeds) plus the team email (if `EMAIL_ENABLED`). With `EMAIL_ENABLED` off and a GHL hiccup, a funder enquiry can vanish with a 201 success returned to the browser.

### F. `/contained/act` (host CTA) → POST `/api/contained/host` (`src/app/api/contained/host/route.ts`)

- **Purpose**: venue/festival offers to host the container (GAP #18). Same shape as connect.
- **Validation**: honeypot `website` (`:29-31`), name+email required (`:33-35`). **No Turnstile.**
- **DB write**: `contact_submissions` best-effort try/catch (`:60-85`) — same silent-drop behaviour as connect.
- **GHL**: `role:partner` + CONTAINED source + `place:*` from state (`:90-99`). Opportunity gated on `GHL_PARTNER_PIPELINE_ID` (`:116-125`).
- **Email**: thank-you to submitter, fire-and-forget (`:129-143`). No team notification on this route.
- **Silent-failure risk — MEDIUM.** Same as connect: DB insert non-fatal, GHL is the only durable record, and there is no internal alert, so a host offer that misses GHL is lost with a 201 success.

### G. Experience page → POST `/api/contained/reaction` (`src/app/api/contained/reaction/route.ts`)

- **Purpose**: in-room reaction capture after walking through.
- **Validation**: Turnstile (`:22-28`), at least one feeling or written response (`:30-35`).
- **DB write**: `community_reflections` insert (`is_approved:false`, email stored in `metadata`, `:54-68`). Insert error → 500.
- **GHL**: only if email provided — `role:storyteller` tags, NO `comms:` (in-room reflection is never an auto opt-in, OCAP) (`:76-97`), fire-and-forget.
- **Email**: follow-up "what you can do" if email provided, fire-and-forget (`:101-128`).
- **Silent-failure risk — LOW.** Reflection row is protected. The `metadata.email` here is what the post-experience cron keys off; if email is omitted the person gets no drip (by design).

### H. Experience page → POST `/api/contained/reflections` (`src/app/api/contained/reflections/route.ts`)

- **Purpose**: lighter reflection capture (no email, no GHL).
- **DB write**: `community_reflections` insert with optional `device_session_id` link (`:53-67`). Insert error → 500.
- **No GHL, no email.** Silent-failure risk — LOW.

### Other GHL utility routes

- **`/api/ghl/newsletter`** (`src/app/api/ghl/newsletter/route.ts`): generic newsletter subscribe (canonical `comms:justicehub-newsletter` grant). Sends welcome email (`:128-135`), workflow gated on `GHL_WELCOME_WORKFLOW_ID` (`:137-145`). GET = unsubscribe-by-link, DELETE = unsubscribe-by-API. `newsletter_subscriptions` upsert is protected (500 on failure). Not wired to a `/contained` form directly but is in the allowed-sources list (`contained_launch`, `contained_tour`, etc., `:12`).
- **`/api/ghl/webhook`** (`src/app/api/ghl/webhook/route.ts`): inbound from GHL. HMAC-verified, requires `GHL_WEBHOOK_SECRET` in prod (`:70-77`) else 500. Syncs tag/contact changes back to `event_registrations` + `newsletter_subscriptions`. Opportunity sync is a TODO stub (`:142-148`). **Note**: `ContactTagUpdate` checks for the literal tag `'Newsletter'` (`:130`), but the canonical send-trigger tag is now `comms:justicehub-newsletter` — this webhook branch is checking a legacy tag name and will mark active subscribers inactive incorrectly if it ever fires on a canonical contact. Flag for design.
- **`/api/ghl/trigger-sequence`** (`src/app/api/ghl/trigger-sequence/route.ts`): admin helper to push a contact into a GHL workflow by `workflow_id`. Requires explicit IDs in the POST body; not auto-invoked by any form.

---

## Part 2 — Crons (schedule from vercel.json · what it writes · live-send risk · env dependency)

| Cron | Schedule (UTC, vercel.json line) | Reads | Writes / sends | Live external send? | Env dependency |
|---|---|---|---|---|---|
| `contained/post-experience` | `0 12 * * *` daily (`:128`) | `community_reflections` (metadata.email), `campaign_nominations` | Day-1/7/30 drip emails via `sendEmail` (GHL Conv API); updates `metadata.post_experience_sent` | Email only, gated by `EMAIL_ENABLED` | `CRON_SECRET`, `EMAIL_ENABLED` |
| `contained/daily-digest` | `0 21 * * *` daily (`:132`) | `event_registrations`, `campaign_nominations` | ONE team digest email to `CONTAINED_DIGEST_TO` (default benjamin@act.place) | Email only (internal), gated by `EMAIL_ENABLED` | `CRON_SECRET`, `EMAIL_ENABLED`, `CONTAINED_DIGEST_TO` |
| `contained/nurture` | `0 9 * * *` daily (`:136`) | `public_profiles` (role_tags `contained_*`), `member_actions` | Role-based nurture emails; inserts `member_actions` (`nurture_email`); tags `inactive_7d` in GHL | Email + GHL tag writes | `CRON_SECRET`, `EMAIL_ENABLED` |
| `contained/reengagement` | **NOT SCHEDULED** (absent from vercel.json) | `public_profiles`, `member_actions` | Would tag `inactive_7d` in GHL | **DORMANT — never runs** | n/a |
| `campaign/ghl-sync` | `0 8 * * *` daily (`:104`) | `campaign_alignment_entities` (composite_score≥40) | `upsertContact` to GHL (uses LEGACY flat `GHL_TAGS`: CONTAINED/Newsletter/JusticeHub, NOT canonical); updates `ghl_contact_id`, `outreach_status='sent'` | GHL contact writes (no email) | `CRON_SECRET`, GHL config |
| `campaign/engagement-scoring` | `0 6 * * 1` weekly Mon (`:144`) | `newsletter_subscriptions`, `community_reflections`, `campaign_nominations`, `contact_submissions` | GHL tier tags + custom fields (`Tier: Aware/Engaged/Active/Champion`) | GHL tag/field writes (no email) | `CRON_SECRET`, GHL config |
| `campaign/pipeline-followup` | `0 6 * * 3` weekly Wed (`:140`) | `campaign_alignment_entities` (stale statuses) | **Auto-sends follow-up emails** (replyTo ben@justicehub.com.au); updates `alignment_signals.follow_ups`, marks `stale` | Email to external prospects, gated by `EMAIL_ENABLED` | `CRON_SECRET`, `EMAIL_ENABLED` |
| `campaign/linkedin-monitor` | `0 10 * * 1` weekly Mon (`:108`) | `campaign_tracked_posts` | Read-only report of stale posts (no scrape, no write) | No | `CRON_SECRET` |
| `campaign/social-publish` | `0 21 * * *` daily (`:156`) | Notion DB `7005d0d1…` (Status=Scheduled, Sent date≤today) | **POSTS TO REAL SOCIAL ACCOUNTS** via GHL Social Planner (IG, LinkedIn ×2, FB, YouTube, Bluesky, Google Business); PATCHes Notion to Published | **YES — LIVE PUBLIC POSTS.** NEVER trigger manually. | `CRON_SECRET`, `JUSTICEHUB_NOTION_TOKEN`, `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_USER_ID` |

**Cron auth**: every cron checks `Authorization: Bearer ${CRON_SECRET}` and returns 401 otherwise. So a missing/wrong `CRON_SECRET` makes the whole cron a silent no-op (401), not a data-loss event.

**The two live-send dangers to never trigger in any planning task:**
1. `campaign/social-publish` — publishes to real public social accounts.
2. Any cron that calls `sendEmail` while `EMAIL_ENABLED=true` (post-experience, daily-digest, nurture, pipeline-followup) — these send real email to real people. `daily-digest` is internal-only (lowest blast radius); `pipeline-followup` and `post-experience` and `nurture` send to external contacts.

---

## Part 3 — The 12 June failure mode (documented for hardening)

**What happened**: a bot crawling justice-matrix facet permutations saturated the shared Supabase, producing site-wide 504s (memory: `project_faceted_crawl_trap_incident`). During that window a real `/contained/register-interest` submission hit POST `/api/ghl/signup`, the request hung/504'd, and the submission was **lost with no trace** — because that route writes no durable Supabase row for an anonymous (no `user_id`, newsletter-off) interest submission. The only intended record was the GHL contact, which the timed-out request never reached.

**Why it was silent**: (1) the form's old catch just showed "Something went wrong, try again" with no statement that data was lost; (2) the route persists nothing server-side before the GHL call; (3) GHL failures are swallowed to `null` inside `upsertContact` (`client.ts:139-142`), so even a partial success looks like success.

**Mitigations now in place** (verified):
- `robots.txt` faceted-crawl guard (`public/robots.txt`, 2026-06-10) — base matrix pages crawlable, query-stringed filter views Disallowed.
- App middleware matcher covers `/justice-matrix/cases|campaigns|explore` and `/pitch/*` (`src/middleware.ts:45-46`) — NOT the contained capture routes. The capture-path rate-limit is a Vercel-platform WAF rule (per brief, applied 13 June), not app code, so it is not visible in this repo.
- Forms now abort at 15s and tell the visitor their details were NOT saved, with ben@justicehub.com.au fallback (`6dc96bb9`) — on the 3 main forms only (register, eoi, register-interest). The nomination, connect, host, and reaction forms do NOT have the 15s timeout.

**Residual gap for the design phase**: `/api/ghl/signup` (and the connect/host routes) still have no durable-first write — they trust GHL as the system of record for capture, and GHL failures are swallowed. A genuinely loss-proof funnel would write an immutable capture row to Supabase BEFORE any external call on every capture route, then reconcile to GHL asynchronously.

---

## Open questions this trace could NOT verify (read-only, no prod env access)

- **Workflow + Phase-D pipeline env vars in Vercel prod**: `GHL_PRE_EVENT_WORKFLOW_ID`, `GHL_WELCOME_WORKFLOW_ID`, `GHL_WORKFLOW_{ORGANIZATION,MEDIA,SUPPORTER,FUNDER,LIVED_EXPERIENCE}`, `GHL_FUNDER_PIPELINE_ID`, `GHL_PARTNER_PIPELINE_ID`. All are `if (id)`-gated, so an unset value silently SKIPS that workflow/opportunity step without losing the contact. UNVERIFIED whether any are set. `.env.example` lists `GHL_FUNDER_PIPELINE_ID` / `GHL_PARTNER_PIPELINE_ID` / `GHL_FUNDER_STAGE_NEW` / `GHL_PARTNER_STAGE_NEW` as expected keys but that does not confirm prod values.
- **`EMAIL_ENABLED` in prod**: the single most important runtime gate. If false, no receipts and no cron emails send, silently. UNVERIFIED.
- **`CONTAINED_NOMINEE_AUTO_EMAIL`**: gates whether the orphaned `/api/contained/nominations` route auto-emails nominees (`:189`). The LIVE nomination route never emails nominees regardless. UNVERIFIED but low-risk since the orphan route isn't wired to the live form.
