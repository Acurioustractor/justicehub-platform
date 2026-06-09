# CONTAINED Phase D — GHL Go-Live Runbook

**Status:** PREP ONLY. Nothing in this file has been executed.
**Tier:** 3 (live CRM system-of-record writes). **Day-shift, human-in-loop.**
**Gate:** the 16-Jun go/no-go. Do NOT run any step here autonomously or AFK.
**Prepared:** 2026-06-09 (Phase B shipped + merged via PR #44, commit `e8f6e675`).

This runbook makes Phase D push-button: every artifact GHL needs (custom fields,
pipelines, stages, calendar, env vars) is listed with the exact key the shipped
code reads, plus the tag-migration command sequence. The shipped Phase B code
already no-ops cleanly on all of this until the env vars below are set, so
nothing here is load-bearing for the live site today.

---

## ⛔ Do NOT apply the wrong-direction artifact

`output/ghl-contained-adelaide-audit/tag-normalize-*.{json,csv}` proposes renaming
**colon → underscore** (`project:contained → project_contained`, `role:partner →
role_partner`, …) across 844 contacts / 4255 renames. That is the **opposite** of
the canonical contract. It must never be applied. Delete or ignore it.
The canonical namespace is **colon** (`project:act-jh`, `role:partner`, …).

---

## 0. Preconditions

- [ ] 16-Jun go/no-go cleared (Ben).
- [ ] `.env.local` has live `GHL_API_KEY` + `GHL_LOCATION_ID` (location "A Curious Tractor").
- [ ] Standard mode (NOT `/fast`). One operator, watching output.
- [ ] You have read the canonical contract: `src/lib/ghl/client.ts` → `GHL_CANONICAL`, `STATE_TO_PLACE`, `MEMBER_TYPE_TO_ROLE`.

---

## 1. Create GHL custom fields

These are written by the shipped routes via `customFields: { key: value }`. GHL
**silently drops** writes to a field key that does not exist — so create all of
them first or the form data is lost with no error. (Settings → Custom Fields →
Contact. Field key must match exactly; all are single-line text unless noted.)

| Field key | Type | Written by | Value example |
|---|---|---|---|
| `cohort` | Text | `/api/ghl/register` (CONTAINED) | `adelaide-pilot` |
| `newsletter_consent` | Text | `/api/ghl/register` (CONTAINED) | `Yes` / empty |
| `nominated_person` | Text | `/api/projects/the-contained/nominations` | free text |
| `organization` | Text | `/api/contained/connect`, `/api/contained/host` | org name |
| `connect_role` | Text | `/api/contained/connect` | `funder` / `partner` / `media` |
| `connect_message` | Multi-line | `/api/contained/connect` | enquiry body |
| `host_state` | Text | `/api/contained/host` | `SA` |
| `host_venue_type` | Text | `/api/contained/host` | venue descriptor |
| `host_message` | Multi-line | `/api/contained/host` | enquiry body |

Verify with: `mcp__ghl__locations_get-custom-fields` (read-only) after creating.

---

## 2. Create GHL pipelines + stages

Opportunity creation is **gated** on the pipeline env var being set (empty = no
opportunity attempted, no error). Create each pipeline, grab its ID and the "new"
stage ID, and set the env vars in §5.

| Pipeline | Opportunity created by | Pipeline env var | New-stage env var | Opp name pattern |
|---|---|---|---|---|
| **Partner / Host** | `/api/contained/host`, `/api/contained/connect` (partner) | `GHL_PARTNER_PIPELINE_ID` | `GHL_PARTNER_STAGE_NEW` | `Host: <org>` / `Partner: <org or name>` |
| **Funder** | `/api/contained/connect` (funder) | `GHL_FUNDER_PIPELINE_ID` | `GHL_FUNDER_STAGE_NEW` | `Funder: <org or name>` |
| **Steward** (pre-existing) | `/api/ghl/signup` (`is_steward`) | `GHL_STEWARD_PIPELINE_ID` | `GHL_STEWARD_STAGE_NEW` | steward opp |

Notes:
- `connect` (media) creates **no** opportunity — media is contact + tag + routed email only.
- Suggested stages per pipeline: `New → Contacted → Qualified → Won/Lost` (only the *New* stage ID is wired; the rest are for humans to drag).
- Verify with `mcp__ghl__opportunities_get-pipelines` (read-only) after creating.

---

## 3. Create the GHL native booking calendar (RC4)

The "Book your walk-through time" CTA on `/contained/register` step 3 only renders
once its public URL is set.

- [ ] Create a GHL **Calendar** (native, not an embedded form) for CONTAINED walk-through bookings.
- [ ] Copy its public scheduling URL.
- [ ] Set `NEXT_PUBLIC_GHL_CONTAINED_CALENDAR_URL` (§5). This is a **build-time public** var — redeploy after setting.

---

## 4. (Optional) Workflows / automations

Out of Phase B scope; create if/when you want nurture. Nurture workflow IDs are
read from `GHL_NURTURE_WORKFLOWS` / `GHL_WORKFLOW_*` (see `src/lib/ghl/client.ts`).
OCAP guardrail: contacts on `lane:community` must NEVER be auto-enrolled into any
`comms:*` send or automation.

---

## 5. Set Phase D env vars

Add to `.env.local` (local) and Vercel project env (production). Skeleton already
in `.env.example`:

```sh
GHL_PARTNER_PIPELINE_ID=
GHL_PARTNER_STAGE_NEW=
GHL_FUNDER_PIPELINE_ID=
GHL_FUNDER_STAGE_NEW=
NEXT_PUBLIC_GHL_CONTAINED_CALENDAR_URL=
# (Steward pipeline vars GHL_STEWARD_PIPELINE_ID / GHL_STEWARD_STAGE_NEW may already be set.)
# To enable routed enquiry + confirmation emails (connect/host), separately:
# EMAIL_ENABLED=true   (sends go via GHL Conversations API; no Resend key needed)
```

- `NEXT_PUBLIC_*` is build-time → **redeploy** after setting.
- Leaving any pipeline/stage var empty is safe: that opportunity just isn't created.

---

## 6. Migrate the ~260 live CONTAINED contacts (RC3 additive-then-strip)

Script: `scripts/contained-ghl-phase-d-migrate.mjs`. Dry-run is the default and is
read-only. Writes need `CONTAINED_PHASE_D_APPLY=yes-write-live-ghl` + a confirm flag.

**Per-contact plan** (mirrors the shipped `/api/ghl/register` CONTAINED branch):
- ADD if absent: `project:act-jh`, `source:event:contained`, `interest:justice-reform`, `place:sa`, and `engagement:warm` **only if the contact has no `engagement:*`** (RC2 keeps the existing lifecycle tag).
- STRIP (Pass B only): `project:contained`, `project:contained-adelaide-2026`.
- PRESERVE untouched: every `role:*`, `comms:*`, `engagement:*`, `source:*`, `interest:*`, and the flat `contained-hot-lead` / `contained-original-requester` / `contained-personal-outreach` lead-quality markers.
- `role:*` is **never invented**. Contacts with no canonical role are listed under `needsRoleReview` in the plan JSON for a human to set by hand.

**Sequence:**

```sh
# (a) Offline logic check — no network:
node scripts/contained-ghl-phase-d-migrate.mjs --self-test

# (b) Dry-run — reads live GHL read-only, writes the plan JSON, writes NO tags:
node scripts/contained-ghl-phase-d-migrate.mjs
#   → review output/ghl-contained-adelaide-audit/phase-d-migration-plan.json
#   → sanity-check counts (~260 contacts, +place:sa on ~all, needsRoleReview list)

# (c) Pass A — ADDITIVE. Adds canonical tags, strips nothing:
CONTAINED_PHASE_D_APPLY=yes-write-live-ghl \
  node scripts/contained-ghl-phase-d-migrate.mjs --apply --confirm

# (d) VERIFY in the GHL UI: spot-check 5-10 contacts now carry project:act-jh +
#     source:event:contained + place:sa AND still carry project:contained*.
#     Confirm no role:* or comms:* was disturbed.

# (e) Pass B — STRIP. Removes only the two legacy project tags. Refuses to run
#     unless the plan JSON from (b) exists:
CONTAINED_PHASE_D_APPLY=yes-write-live-ghl \
  node scripts/contained-ghl-phase-d-migrate.mjs --strip --confirm-strip
```

The two passes are **separate invocations on purpose** — that gap (Pass A verified
before Pass B) is the additive-then-strip guarantee: no contact is ever without a
project tag.

---

## 7. Post-migration verification

- [ ] `project:contained` and `project:contained-adelaide-2026` return **0** contacts (GHL smart list).
- [ ] `project:act-jh` count rose by the migrated set (~260).
- [ ] `source:event:contained` and `place:sa` present on the migrated set.
- [ ] `engagement:*` distribution unchanged except new `engagement:warm` on previously-engagement-less contacts.
- [ ] `needsRoleReview` contacts triaged: a human set `role:*` on each.
- [ ] Submit one real test registration / connect / host / nominate and confirm tags + custom fields + opportunity land correctly.
- [ ] Calendar CTA renders on `/contained/register` step 3 in production.

---

## Out of scope (left as-is, by decision)

- **Engagement lifecycle layer** (`engagement:*`, `campaign-stage:*`) — RC2, managed by the scoring cron, not migrated.
- **Flat `contained-*` markers** — provenance/lead-quality, preserved.
- **Sends / automations** — separate day-shift step, OCAP guardrail on `lane:community`.
