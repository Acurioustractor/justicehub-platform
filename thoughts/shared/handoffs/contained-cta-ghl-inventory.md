# CONTAINED CTA → GoHighLevel (GHL) Inventory

Read-only audit of every actionable CTA / form under `src/app/contained/**` and how each wires into the GHL CRM. Generated 2026-06-09. No code was changed.

**Scope:** `src/app/contained/**`, `src/app/api/ghl/**` (6 routes), `src/lib/ghl/client.ts`, `src/content/newsletter-sequences.ts`. Non-GHL POST handlers (`/api/contact`, `/api/contained/*`, `/api/projects/[slug]/*`, `/api/enrollment/*`) were traced to determine whether they reach GHL.

**Status legend:** WIRED = lands in GHL with correct colon-canon tags · PARTIAL = lands in GHL but with legacy/underscore tags or missing fields · GAP = should be in CRM but isn't (no GHL call, dead link, or mailto-only) · N/A = intentionally local (passcode gate, read-only data fetch).

---

## (a) Summary table — all CONTAINED CTAs / forms

Grouped by funnel stage: awareness → register/book → experience (inside-container) → activate → host/fund.

| # | Page path | CTA label / user intent | Destination (route / link) | GHL tags emitted (exact) | GHL custom fields | Supabase tables | Status |
|---|-----------|------------------------|----------------------------|--------------------------|-------------------|-----------------|--------|
| **REGISTER / BOOK** |
| 1 | `src/app/contained/register/page.tsx` | "Register / Book the experience" (cohort-aware event registration) | `POST /api/ghl/register` (CONTAINED branch) | `Event`, `JusticeHub`, `cohort:<x>` (from page), `project:contained`, `source:form`, `engagement:warm`, optional `project:contained-adelaide-2026`, `state:<x>`, `role:<x>`, `newsletter-stream:contained-adelaide-invite` | `organization`, `role`, `how_heard`, `event_slug` | `event_registrations`, `newsletter_subscriptions` (if opt-in), `member_actions` (if account) | **WIRED** |
| 2 | `src/app/contained/adelaide/page.tsx` | "Book a conference walkthrough" / "Book or request a walkthrough" / 6 cohort pathway cards | `Link → /contained/register?stop=adelaide&cohort=<x>` (no own backend — routes into #1) | (inherits #1) | (inherits #1) | (inherits #1) | **WIRED** (via redirect) |
| 3 | `src/app/contained/tour/[slug]/stop-content.tsx` (closing CTAs) | "Book / register" per tour stop | `Link → /contained/register?stop=<slug>` (routes into #1) | (inherits #1) | (inherits #1) | (inherits #1) | **WIRED** (via redirect) |
| 4 | `src/app/contained/register-interest/page.tsx` | "Register interest" (early-interest lead, pre-event) | `POST /api/ghl/signup` (`source:'register-interest'`, `member_type=role`) | `project:act-jh`, `source:event:contained`, `role:<mapped>` (+ `lane:community` if lived_experience), optional `place:<state>`, `comms:justicehub-newsletter` (if opt-in) **PLUS raw customTags** `register-interest`, `contained`, `contained_<role>` (underscore, passed from page line ~57) | `preferred_name`, `organization`, `signup_type`, `member_type`, `state`, `newsletter_consent` | `newsletter_subscriptions` (if opt-in) | **PARTIAL** — lands, but mixes `project:act-jh` (not `project:contained`) and injects 3 underscore tags (`contained`, `contained_<role>`) that conflict with colon canon |
| 5 | `src/app/contained/join/page.tsx` | "Create account / Join the hub" (member signup, role + state) | `POST /api/ghl/signup` (after Supabase auth) | Same canonical set as #4: `project:act-jh`, `source:event:contained` (if member_type), `role:<mapped>`, optional `tier:steward`, `place:<state>`, `lane:community`, `comms:justicehub-newsletter` | `preferred_name`, `organization`, `signup_type`, `member_type`, `state`, `steward_*`, `newsletter_consent` | `public_profiles` (ghl id), `newsletter_subscriptions` (if opt-in); Steward → GHL opportunity in Steward pipeline | **WIRED** (canonical signup path; note `project:act-jh` not `project:contained`) |
| 6 | `src/app/contained/enroll/page.tsx` + `src/app/contained/about/page.tsx` + `how-it-works/page.tsx` "Enroll" links | Device enrollment via code (on-site kiosk auth) | `POST /api/enrollment/validate` then `/api/enrollment/enroll` | **NONE / not wired to GHL** | none | `enrollment_codes`, `device_sessions` | **GAP** (by design — anonymous on-device session, no contact captured; flag only if enrolled visitors should enter CRM) |
| **EXPERIENCE (inside-container, Room 3 / post-walk)** |
| 7 | `src/app/contained/reaction/page.tsx` | "What changed for you?" — feelings + written reflection, optional name/email | `POST /api/contained/reaction` | (only if email given) `Reacted`, `CONTAINED`, `JusticeHub`, `contained_adelaide`, `public_visitor`, `youth_remand`, `country_reports` — **all legacy GHL_TAGS (underscore/PascalCase)** | (none set by reaction route) | `community_reflections`, `member_actions` (if account) | **PARTIAL** — reaches GHL only when email provided, and uses legacy underscore/PascalCase tags, not colon canon |
| 8 | `src/app/contained/experience/experience-content.tsx` (reflection widget) | "Share a reflection" (in-experience) | `POST /api/contained/reflections` | **NONE** | none | `community_reflections`, `device_sessions` | **GAP** (no GHL; anonymous device session) |
| 9 | `src/app/contained/experience/experience-content.tsx` (story widget) | "Submit your story" (in-experience) | `POST /api/contained/stories/submit` | **NONE** (Supabase `stories` row tagged `['CONTAINED','VISITOR_STORY']` only — not GHL) | none | `stories`, `device_sessions` | **GAP** (no GHL contact) |
| 10 | `src/app/contained/experience/experience-content.tsx` (enrollment recommender) | "Recommend an alternative for me" | `POST /api/enrollment/recommend` | **NONE** | none | `visitor_recommendations`, `device_sessions` | **N/A** (recommendation engine, not a contact-capture CTA) |
| **ACTIVATE (share / nominate / help)** |
| 11 | `src/app/contained/share/story-form.tsx` (rendered by `share/page.tsx`) | "Share your story" (tour story submission) | `POST /api/projects/the-contained/tour-stories` (dynamic `[slug]` route) | (only if email given) `Reacted`, `CONTAINED`, `JusticeHub` — **legacy GHL_TAGS** | none | `tour_stories` | **PARTIAL** — GHL only on email, legacy underscore/PascalCase tags |
| 12 | `src/app/contained/tour/[slug]/stop-content.tsx` (story form) | "Share what this stop meant" | `POST /api/contained/tour-stories` | **NONE** (route has no GHL import) | none | `tour_stories` | **GAP** (story captured locally, contact never reaches CRM) |
| 13 | `src/app/contained/help/page.tsx` | "How do you want to help?" (multi-select + name/email) | `POST /api/contact` (`category:'contained-help'`) | `project:act-jh`, `source:website`, `role:supporter`, `source:event:contained` | `organization`, `contact_category`, `help_options` | `contact_submissions`, `org_action_items` | **PARTIAL** — lands canonically, but uses `project:act-jh` not `project:contained` (cross-route inconsistency) |
| 14 | `src/app/contained/canberra/canberra-content.tsx` | "Use your voice in Canberra" (voice-actions + door/venue offer) | `POST /api/contact` (`category:'contained-help'`) | Same as #13: `project:act-jh`, `source:website`, `role:supporter`, `source:event:contained` | `organization`, `contact_category`, `help_options` | `contact_submissions`, `org_action_items` | **PARTIAL** — same `project:act-jh` vs `project:contained` mismatch |
| 15 | `src/app/contained/tour/tour-content.tsx` (footer newsletter form) | "Get tour updates" (email signup) | `POST /api/ghl/newsletter` (`source` from form) | `source:website`, `project:act-jh`, `role:supporter`, `comms:justicehub-newsletter` (+ tier/role from subscription_type) | `organization`, `subscription_type`, `newsletter_consent` | `newsletter_subscriptions` | **PARTIAL** — canonical newsletter wiring but `project:act-jh`, no CONTAINED/`source:event:contained` tag despite contained context |
| 16 | `src/app/contained/act/act-content.tsx` "Nominate a Leader" | Nominate a decision-maker to walk through | `Link → /contained#nominate` → **empty `<section id="nominate" />`** in `tour-content.tsx` (line 861). No form renders there. | (intended `Nominated`,`CONTAINED`,`JusticeHub` exist in `/api/projects/[slug]/nominations` POST but **no UI posts to it**) | n/a | n/a | **GAP** — dead anchor; nomination intent never captured. Backend exists; no front-end form wired |
| 17 | `src/app/contained/reaction/page.tsx` + `nominations/nominations-wall.tsx` | "See nominations" / `/contained/nominations` | `GET /api/projects/the-contained/nominations` (read-only wall) | n/a (GET only) | n/a | reads `campaign_nominations` | **N/A** (display only; the POST path that would tag `Nominated` has no rendered form — see #16) |
| **HOST / FUND** |
| 18 | `src/app/contained/act/act-content.tsx` "Back the Tour" | Add name to build public pressure | `Link → /contained#back-this-tour` (anchor) | **NONE / not wired to GHL** | n/a | n/a | **GAP** (anchor scroll; no backer-capture form found in contained scope) |
| 19 | `src/app/contained/act/act-content.tsx` + `tour/tour-content.tsx` "Donate" / "Back This" | Fund the tour / infrastructure | `Link → /back-this` and `${SITE_URL}/back-this` (OUTSIDE contained scope) | unknown — `/back-this` not in scope | n/a | n/a | **OUT OF SCOPE** (donation funnel lives at `/back-this`; verify separately) |
| 20 | `src/app/contained/act/act-content.tsx` (share templates) | "Email a partner / funder / media" (prefilled templates) | `mailto:?subject=…&body=…` (client opens mail app); funder/media templates route replies to `benjamin@act.place` | **NONE / not wired to GHL** | n/a | n/a | **GAP** — high-value funder/partner outreach with zero CRM capture (mailto only) |
| 21 | `src/app/contained/tour/tour-content.tsx` "Host the Container" card | Offer to host a stop | static card / no actionable backend CTA found (text only) | **NONE** | n/a | n/a | **GAP** — hosting interest (momentum page lists 8+ host offers) has no capture form |
| 22 | `src/app/contained/tour/social/social-kit-content.tsx` | Download share cards / copy social posts | `GET /api/contained/share-card?stat=<k>` (image) + clipboard copy | **NONE** | n/a | n/a | **N/A** (asset download / share enablement, not a lead) |
| **GATED / NON-CTA (listed for completeness, not CRM-relevant)** |
| 23 | `src/app/contained/momentum/page.tsx`, `community/page.tsx` | Passcode gate | client-side `if (input === PASSCODE)` | **NONE** | n/a | n/a | **N/A** (local auth gate) |
| 24 | `src/app/contained/vip-dinner/page.tsx` | (legacy) | `redirect('/contained')` — no form | **NONE** | n/a | n/a | **N/A** (pure redirect; no VIP-dinner RSVP form exists) |

---

## (b) GHL routes — tag / field contract summary

Constants live in `src/lib/ghl/client.ts`. **Two parallel tag vocabularies coexist:**
- **`GHL_CANONICAL`** (colon canon, lines 655–700): `project:act-jh`, `source:website`, `source:event:contained`, `role:*`, `tier:curious|steward`, `comms:justicehub-newsletter`, `lane:community`. State → `STATE_TO_PLACE` = `place:<x>`. `MEMBER_TYPE_TO_ROLE` maps signup member_type → `role:*`.
- **`GHL_TAGS`** (legacy underscore/PascalCase, lines 550–610): `CONTAINED`, `contained_adelaide`, `public_visitor`, `youth_remand`, `Reacted`, `Nominated`, `JusticeHub`, `Event`, `Newsletter`, etc. `STATE_TO_TAG` = `state_<x>`.

| Route | Method | Tags emitted | Custom fields | Supabase | Notes |
|-------|--------|--------------|---------------|----------|-------|
| `/api/ghl/register` | POST | **CONTAINED branch (event name contains "CONTAINED"):** `Event`, `JusticeHub` + customTags + **colon** `project:contained`, `source:form`, `engagement:warm`, opt `project:contained-adelaide-2026`, `state:<x>`, `role:<x>` (own ROLE_COLON map), `newsletter-stream:contained-adelaide-invite`. **Non-CONTAINED branch:** legacy `STATE_TO_TAG`, `Newsletter`, `Researcher`, etc. | `organization`, `role`, `how_heard`, `event_slug` | `event_registrations`, `newsletter_subscriptions`, `member_actions` | Turnstile-gated. **This is the only route emitting `project:contained` / `source:form` / `engagement:warm`** (the prompt's canonical strings). Cohort arrives via customTags from page. |
| `/api/ghl/signup` | POST | `project:act-jh` (always) + opt `tier:steward`, `source:event:contained` (if member_type), `role:*` (via MEMBER_TYPE_TO_ROLE), `lane:community` (lived_experience — also **suppresses** newsletter+workflow, OCAP), `place:<state>`, `comms:justicehub-newsletter` (opt-in, non-community) | `preferred_name`, `organization`, `signup_type`, `member_type`, `state`, `steward_*`, `newsletter_consent` | `public_profiles`, `newsletter_subscriptions`; Steward pipeline opportunity | OCAP guardrail honored. Emits `project:act-jh` even on CONTAINED-origin signups (#4, #5). |
| `/api/ghl/newsletter` | POST | `source:website`, `project:act-jh`, `role:supporter`, `comms:justicehub-newsletter` + opt `tier:steward`/`role:researcher` + validated customTags (regex `^[\w\s-]+$`, max 5 — **rejects colons**, so `project:contained` passed here would be dropped) | `organization`, `subscription_type`, `newsletter_consent` | `newsletter_subscriptions` | Also sends Resend welcome email + optional `GHL_WELCOME_WORKFLOW_ID`. DELETE removes `comms:justicehub-newsletter`. |
| `/api/ghl/trigger-sequence` | POST | none (workflow trigger only) | none | none | Validates `sequence_id` against `allSequences` from `newsletter-sequences.ts`, calls `ghl.addToWorkflow(contact_id, workflow_id)`. Admin/internal. |
| `/api/ghl/webhook` | POST | n/a (inbound) | n/a | (writes per payload) | HMAC-SHA256 signature verify (`GHL_WEBHOOK_SECRET`). Receives contact/tag/opportunity updates FROM GHL. Not a CTA. |
| `/api/ghl/social-post` | POST | n/a | n/a | n/a (Notion) | Posts to GHL Social Planner; Bearer/`x-webhook-secret` auth. Triggered by Campaign Hub button + Notion automation. Not a contact CTA. |

**Newsletter sequences** (`src/content/newsletter-sequences.ts`): `welcomeSequence` (used by `/newsletter`), `preEventSequence` (used by `/register` confirmation email), plus `allSequences` map referenced by `/trigger-sequence`.

---

## (c) GAPS & inconsistencies

### Tag-canon inconsistencies (same campaign, different `project:` value)
1. **`project:` is split three ways across CONTAINED CTAs:**
   - `/api/ghl/register` (CONTAINED branch) → `project:contained` ✅ (matches live CRM canon)
   - `/api/ghl/signup`, `/api/ghl/newsletter`, `/api/contact` → `project:act-jh` ❌ (same person, different project tag)
   - So a visitor who **registers** (#1) gets `project:contained`, but the same visitor who **signs up / asks for help / subscribes** (#4,#5,#13,#14,#15) gets `project:act-jh`. CRM segmentation by "all CONTAINED contacts" will miss the signup/help/newsletter cohort unless they ALSO registered.
2. **`register-interest` (#4) injects underscore tags** `contained`, `contained_<role>` via customTags into `/api/ghl/signup`, polluting the colon canon (live CRM is 100% colon/hyphen). It also rides `/api/ghl/signup` so gets `project:act-jh`, not `project:contained`.
3. **Reaction (#7) and tour-stories (#11) use legacy `GHL_TAGS`** (`Reacted`, `CONTAINED`, `contained_adelaide`, `public_visitor`, `youth_remand`, PascalCase/underscore) — none colon-canon. These predate the colon migration applied to `/register`.
4. **`source:event:contained`** (double-colon, from `GHL_CANONICAL.SOURCE_EVENT_CONTAINED`) vs **`source:form`** (from `/register`) — two different `source:` conventions for the same campaign.

### True GAPS — intent that should be in CRM but isn't captured
5. **Nominate a Leader (#16) — dead anchor.** `/contained/act` "Nominate a Leader" links to `/contained#nominate`, which resolves to an empty `<section id="nominate" />` (tour-content.tsx:861). A working backend exists (`/api/projects/[slug]/nominations` POST → tags `Nominated, CONTAINED, JusticeHub`) but **no rendered form posts to it.** Nomination intent is lost. **(Single biggest gap — a primary campaign CTA with a backend that nothing calls.)**
6. **Funder / partner / media outreach (#20) is mailto-only.** The highest-value contacts (funders responding to a $20K–$500K ask, replies to `benjamin@act.place`) generate **zero CRM records** — no contact, no tag, no opportunity.
7. **Host the Container (#21) / Back the Tour (#18)** — hosting and backer intent (momentum page cites "8+ cities" of host offers, 5 hosting offers) has **no capture form** in contained scope; both are anchor links / static cards.
8. **In-experience reflection & story widgets (#8, #9, #12)** capture rich first-party content to Supabase but **never create a GHL contact** even when a name is attached — visitors who engaged most deeply inside the container don't enter the nurture funnel.
9. **Enrollment (#6)** is anonymous-by-design (device session) — acceptable, but worth a product decision on whether on-site enrolled visitors should be offered CRM opt-in.

### Cross-scope note
10. **Donate (#19)** routes to `/back-this` (outside `src/app/contained/**`). Whether donations land in GHL must be verified in the `/back-this` + `/api/campaign/*` code, not audited here.
