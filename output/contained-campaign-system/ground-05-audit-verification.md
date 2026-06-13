# CONTAINED systems audit — adversarial verification

Read-only verification of the route-health and automation claims, traced against the code on 13 June 2026. Nothing here was executed against GHL, Supabase, or Vercel.

## Filename note (provenance correction)

The task names two files: `output/contained-campaign-system/12-route-health-audit.md` and `output/contained-campaign-system/13-automation-audit.md`. **Neither exists** in the repo (searched the whole tree; never committed). The actual as-built systems audits live at:

- `output/contained-campaign-system/ground-03-systems-funnel.md` — the route + cron health audit (the "route-health" content).
- `output/contained-campaign-system/ground-01-ghl-reality.md` — the GHL/automation reality map (the "automation" content).

This verification pass treats those two as the audits under review, since their content is exactly the route-health and automation trace the task describes. The cited 12/13 filenames are wrong; the work itself is in the ground files.

## Verdict

Both ground files are **accurate**. Every WORKS / BROKEN / DORMANT / env-unset claim I could trace holds against the code, with correct `file:line` citations. The audits are unusually disciplined: they pre-mark prod-env-dependent facts as UNVERIFIED rather than asserting them, which is correct since no `.env`/`.env.local` is committed (`git ls-files` shows only `.env.example` + `.env.schema.json`).

## Core user complaint — confirmed and located

"A submission got no reply." The lost submission was a `/contained/register-interest` form post to `POST /api/ghl/signup`. **`src/app/api/ghl/signup/route.ts` contains zero `sendEmail` calls** (verified: `grep -c sendEmail` = 0). That route never imports or calls the email helper at all. So even on a fully healthy request with `EMAIL_ENABLED=true`, a register-interest submitter receives **no confirmation by design**. This is the primary break: the route that lost the 12 June submission is also the one route with no receipt path.

Two compounding factors, both confirmed:
1. The route's only durable record for an anonymous (`user_id` absent, `newsletter:false`) submission is the GHL contact (`signup/route.ts:128-147` writes the profile merge ONLY when `user_id` is supplied; the register-interest form sends no `user_id`). The newsletter upsert at `:151-164` only fires when `newsletter && !communityLane`. So with newsletter off there is no Supabase row.
2. GHL upsert failures are swallowed to `null` inside `client.ts:139-142` (catch returns `null`), so a partial/timed-out GHL call looks like success. During the 12 June crawl-saturation 504, the request never reached GHL and nothing persisted.

Even the routes that DO send a receipt (`/api/ghl/register`, nominations, newsletter, reaction, connect, host) are gated by the global kill switch: `sendEmail()` returns `null` and sends nothing unless `EMAIL_ENABLED === 'true'` AND GHL is configured (`src/lib/email/send.ts:38-47`). `EMAIL_ENABLED` is not present in `.env.example`, and prod state is unreadable from the repo. If it is unset/false in prod, every receipt and every cron email is a silent no-op. UNVERIFIED, plausibly the actual cause if register/nomination receipts are also missing.

## Claim-by-claim verification (ground-03, route + cron audit)

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | All email goes through `sendEmail()`, gated by `EMAIL_ENABLED=true` AND GHL configured | CONFIRMED | `send.ts:38-47` |
| 2 | Email dispatches via GHL Conversations API, not Resend; "via Resend" comments are stale | CONFIRMED | `send.ts:55` calls `ghl.sendEmailToAddress`; stale comments at `register/route.ts:279` and `newsletter/route.ts:128` |
| 3 | Live nomination form posts to `/api/projects/the-contained/nominations`, not `/api/contained/nominations` | CONFIRMED | `nominate-form.tsx:88` |
| 4 | `/api/contained/nominations` is orphaned, writes `campaign_alignment_entities`; live route writes `campaign_nominations` | CONFIRMED | orphan route `from('campaign_alignment_entities')` lines 71/94/109; live route `from('campaign_nominations')` `:293` |
| 5 | `campaign/social-publish` posts to real social accounts (IG, LinkedIn x2, FB, YouTube, Bluesky, Google Business) + mutates Notion | CONFIRMED | `social-publish/route.ts:10-19` PLATFORM_MAP; Notion DB `7005d0d1…` `:6` |
| 6 | `contained/reengagement` cron is DORMANT — exists but absent from vercel.json | CONFIRMED | route dir exists; not in `vercel.json` crons (only post-experience, daily-digest, nurture present) |
| 7 | Workflow + Phase-D pipeline env vars are all `if (id)`-gated; unset silently skips, no data loss | CONFIRMED | `register/route.ts:304-311`; `connect/route.ts:144-154`; `host/route.ts:116-125`; `GHL_PIPELINES` maps to `GHL_*_PIPELINE_ID` at `client.ts:704,707` |
| 8 | Register route: `event_registrations` insert is canonical, 500 on failure | CONFIRMED | `register/route.ts:228-260` |
| 9 | Register route: GHL upsert runs before DB insert; GHL failure swallowed → registrant lands with `ghl_contact_id: null`, no alert | CONFIRMED | upsert `:199-206` precedes insert `:228`; null-swallow `client.ts:139-142`; `ghl_contact_id: ghlContactId` stored `:235` |
| 10 | EOI captures route to Adelaide pipeline (Captured); else Engagement (Identified) | CONFIRMED | `register/route.ts:211-221`; pipeline IDs `client.ts:732-741` match live IDs in ground-01 |
| 11 | `/api/ghl/signup` (register-interest) sends NO receipt, has no Turnstile | CONFIRMED | 0 `sendEmail` in `signup/route.ts`; no `verifyTurnstileToken` import; form has no Turnstile (`register-interest/page.tsx`) |
| 12 | signup writes profile only when `user_id` supplied; register-interest sends no `user_id` → no profile row | CONFIRMED | `signup/route.ts:128-147` (guarded by `if (user_id && ghlContactId)`) |
| 13 | Nomination route: honeypot → fake success, Turnstile, 5/IP/hr rate limit, field/category/reason/email validation, `is_public:false`, 500 on insert error | CONFIRMED | `projects/[slug]/nominations/route.ts:242-244, 247-253, 255-266, 268-291, 293-305, 307/398-401` |
| 14 | Nominator receipt if email; internal team alert to benjamin@act.place on EVERY nomination; nominee never emailed | CONFIRMED | `:354-372` (conditional), `:376-389` (unconditional), comment `:13-14` |
| 15 | Connect route: honeypot `website`, role∈{funder,partner,media}, name+email required, no Turnstile, best-effort `contact_submissions`, gated opportunity, team email + confirmation | CONFIRMED | `connect/route.ts:69-71, 73-78, 97-119, 144-154, 159-186`; no Turnstile import |
| 16 | Host route: honeypot, name+email, no Turnstile, best-effort DB, opportunity gated on `GHL_PARTNER_PIPELINE_ID`, thank-you only, NO team notification | CONFIRMED | `host/route.ts:29-35, 60-85, 116-125, 129-143`; no team `sendEmail` |
| 17 | Reaction route: Turnstile, feeling-or-response required, `community_reflections` insert (`is_approved:false`, email in metadata), 500 on error, GHL only if email + no `comms:`, follow-up email | CONFIRMED | `reaction/route.ts:22-28, 30-35, 54-73, 76-97, 101-128` |
| 18 | Reflections route: `community_reflections` insert with optional `device_session_id`, 500 on error, no GHL, no email | CONFIRMED | `reflections/route.ts:53-67` |
| 19 | Webhook: HMAC-required in prod (500 if `GHL_WEBHOOK_SECRET` unset), `ContactTagUpdate` checks legacy literal `'Newsletter'` not canonical `comms:justicehub-newsletter`, opportunity sync is TODO stub | CONFIRMED | `webhook/route.ts:70-77, 130, 142-148` |
| 20 | Newsletter route: welcome email, workflow gated on `GHL_WELCOME_WORKFLOW_ID`, `newsletter_subscriptions` upsert protected (500), contained sources allow-listed | CONFIRMED | `newsletter/route.ts:12, 120-126, 128-135, 137-145` |
| 21 | Every cron checks `Authorization: Bearer ${CRON_SECRET}`, 401 otherwise (missing secret = silent no-op) | CONFIRMED | post-experience `:20-23`, daily-digest `:19`, reengagement `:14-17`, social-publish `:36-39` (spot-checked, pattern uniform) |
| 22 | post-experience reads `community_reflections`+`campaign_nominations`, sends Day1/7/30, updates `metadata.post_experience_sent` | CONFIRMED | `post-experience/route.ts:34-39, 119-122, 55-217` |
| 23 | daily-digest: ONE team digest to `CONTAINED_DIGEST_TO` (default benjamin@act.place), reads `event_registrations`+`campaign_nominations` | CONFIRMED | `daily-digest/route.ts:7, 28, 48, 99` |
| 24 | pipeline-followup auto-sends follow-up emails (`replyTo` ben@justicehub.com.au), updates `alignment_signals.follow_ups`, marks stale; reads `campaign_alignment_entities` | CONFIRMED | `pipeline-followup/route.ts:92, 129-166` (replyTo `:132`, stale `:161`) |
| 25 | All three main forms got 15s `AbortSignal.timeout` + fail-loud fallback in commit 6dc96bb9; nomination/connect/host/reaction forms did NOT | CONFIRMED | commit 6dc96bb9 touches exactly eoi/register-interest/register; `AbortSignal.timeout(15000)` at register:142, eoi:159, register-interest:56; nominate-form has Turnstile+honeypot but no AbortSignal |
| 26 | middleware matcher covers `/pitch/*` + 3 justice-matrix facet paths, NOT contained capture routes | CONFIRMED | `middleware.ts:46` |

## Claim-by-claim verification (ground-01, GHL reality)

These are GHL-state claims (pipeline IDs, counts, tag canon). The structural/code-side claims verify against the repo; the live GHL counts cannot be re-derived from code (the audit sourced them from live MCP reads + dated CSVs and flagged them as such). What the code confirms:

| Claim | Verdict | Evidence |
|---|---|---|
| CONTAINED Engagement pipeline ID `vzatUY4dwN8t63ZoFIpH`, Identified stage `e0fdce64-…` | CONFIRMED (code matches stated live IDs) | `client.ts:733-736` |
| CONTAINED Adelaide pipeline ID `SxzINmfZMjvqAMPmFCKa`, Captured stage `f8d2acd7-…` | CONFIRMED (code matches) | `client.ts:737-740` |
| `/register` + `/eoi` emit canon (`project:act-jh` + `source:event:contained` + role + place + engagement) | CONFIRMED | `register/route.ts:130-169`; `GHL_CANONICAL` `client.ts:743-767` |
| `campaign/ghl-sync` cron uses LEGACY flat `GHL_TAGS`, not canonical | CONFIRMED in principle | flat tags defined `client.ts:616-665`; ghl-sync imports `GHL_TAGS` (per audit; consistent with the legacy-route note at `client.ts:724-726`) |
| Live opportunity counts (78 Engagement, 2 Adelaide test records, segment totals 272/48-gatePass) | NOT CODE-VERIFIABLE | sourced from live GHL MCP + dated CSVs; audit marks them verified-via-MCP and dates them. Outside repo scope; trusted as stated, not independently re-pulled (read-only constraint + would mutate context) |

## Where the audits are too generous (genuine residual issues)

These are not refutations of the audits; the audits already flag most. Surfacing them as the real holes a fix must close:

1. **register-interest has no receipt path at all** (`signup/route.ts`, 0 `sendEmail`). The audit notes "Email: none" but frames it as a silent-failure risk; it is more fundamental: even a perfectly healthy submission gets no reply. This is the literal cause of "no reply." A fix needs a receipt added to this route, not just durable-first capture.
2. **No durable-first write on signup/connect/host.** All three trust GHL as system-of-record and swallow GHL failures to `null`. The audit calls for a capture-table-before-external-call; that remains unbuilt. Highest cost on signup (the proven loss path).
3. **`EMAIL_ENABLED` prod state is the single highest-leverage unknown** and is not even in `.env.example`. If unset, all receipts on all routes are dead. A fix should confirm it in Vercel prod (Tier-2 read) and document the verified value before any "receipts work now" claim.
4. **Webhook legacy-tag bug** (`webhook/route.ts:130`): `ContactTagUpdate` marks a subscriber inactive when `'Newsletter'` (capital, legacy) is absent, but the canonical grant tag is `comms:justicehub-newsletter`. If this webhook ever fires on a canonical contact, it wrongly deactivates an active subscriber. Live but latent.
5. **nominate-form lacks the 15s abort** the three main forms got. A hung nomination submit has no fail-loud path.

## Provenance

- Code read directly (not grepped-then-asserted) for: `send.ts`, `ghl/register`, `ghl/signup`, `ghl/newsletter`, `ghl/webhook`, `ghl/client.ts`, `projects/[slug]/nominations`, `contained/connect`, `contained/host`, `contained/reaction`, `contained/reflections`, `cron/contained/post-experience`, `cron/contained/reengagement`, `cron/campaign/social-publish`, `vercel.json`, `middleware.ts`, the three form pages, `.env.example`.
- Live GHL/Supabase/Vercel: NOT queried (read-only constraint honored; would also have mutated context permanently). All GHL-count claims in ground-01 are taken as the audit stated them, with their stated dated sources, and explicitly marked NOT-code-verifiable above.
- Commit `6dc96bb9` inspected via `git show --stat`.
