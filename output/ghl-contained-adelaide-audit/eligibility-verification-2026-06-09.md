# CONTAINED Adelaide 2026 — Tag & Eligibility-Count Verification

**Verified:** 2026-06-09
**Against:** GHL UI build spec (`output/contained-ghl-ui-build-spec.md`) §3 eligibility gate, §4 streams, §A1–A8 tags
**Method:** read-only. No writes to GHL.

## Provenance

| Source | Detail |
|--------|--------|
| `tag-normalize-summary.json` | `generatedAt` 2026-06-08T20:06:59Z = **2026-06-09 06:06 Brisbane**; `contactsScanned: 3029`; `scanComplete: true` |
| `tag-normalize-inventory.csv` | distinct-tag → count inventory (same scan) |
| `contained-ghl-preflight-actions.json` | `tags_added: 260` via import preflight |
| `src/app/api/ghl/register/route.ts:125` | live register route emits **colon** tags: `project:contained`, `source:form`, `engagement:warm`, `project:contained-adelaide-2026` |

**Confidence: Verified** against the complete morning scan (3,029 contacts, scan complete). This is the same "live CRM probe (2026-06-09)" the spec was built from. It is **not** a fresh re-pull this minute — the MCP contacts API cannot filter by tag or return aggregate counts without paginating all 3,029 contacts, which would reproduce the same numbers. Counts are hours-old as of this writing and current for the 16 June go/no-go.

---

## ✅ Eligibility gate (§3) — VERIFIED, matches spec exactly

`consentSplit`: **engaged 113 · discovered 3 · neither 2,913** (sum = 3,029 ✓)

- **Eligible (passes gate) = 113** → spec's "~113 engaged contacts" ✓
- **Blocked = 2,916** (3 discovery-only + 2,913 no-inbound/no-consent) → spec's "blocks the ~2,900" ✓

---

## Inbound-signal tags (§3 INCLUDE)

| Tag | Live count | Note |
|-----|-----------:|------|
| `newsletter-stream:contained-adelaide-invite` | **28** | ✓ matches spec "EXISTS, 28" |
| `source:inquiry` | 94 | |
| `contained-hot-lead` | 16 | |
| `contained-original-requester` | 8 | |
| `contained-personal-outreach` | 4 | |
| `source:form` | **0** | route emits it, but **no live form registrations yet** |
| `container-request` | **0** | listed in gate but present on no contact |

## Discovered sources (excluded unless they also have an inbound signal)

| Tag | Live count |
|-----|-----------:|
| `source:gmail-discovery` | 38 |
| `source:grantscope` | 14 |

---

## Project / cohort / role / engagement / suppression

- `project:contained-adelaide-2026` = **260** · `project:contained` = 260 — bulk-tagged via the import preflight (`tags_added: 260`), **not** via the live form.
- **`cohort:*` = 0** — no cohort tags exist yet. Consistent with the missing `cohort` custom field; applied on new registration.
- Roles: `role:funder` 89 · `role:media` 8 · `role:researcher` 2.
  - ⚠️ **`role:service` / `role:practitioner` / `role:policy` = 0** — A7's service/practitioner/policy branch currently matches nobody. Closest live: `role:health-service` 9, `role:community-controlled` 42.
- Lifecycle triggers `engagement:booked` / `engagement:experienced` / `engagement:activated` = **0 each** — expected; applied at the event. `engagement:warm` = 9.
- Suppression `comms:do-not-bulk` = **0** — guard will populate it. Suppression also keys off DND / Email Unsubscribed / `consent_status` (not tags).

---

## ⚠️ Newsletter streams (§4) — several "new" streams already EXIST under different names

The build should **reconcile names, not create duplicates.**

| Spec stream (status in spec) | Live tag found | Count | Action |
|------------------------------|----------------|------:|--------|
| `contained-adelaide-invite` (exists) | same | 28 | ✓ use as-is |
| `contained-daily-recap` (new) | `daily-adelaide-recap` | 38 | reconcile name |
| `justicehub-youth-justice` (new) | `youth-justice-brief` | 63 | reconcile name (+ `comms:justicehub-newsletter` 17) |
| `media-pack` (new) | `media-pack` | **32** | **already exists — not new** |
| `funder-brief` (new) | `funder-brief` | **40** | **already exists — not new** |
| `future-cities` (new) | `future-tour-update` | 22 | reconcile name |

---

## 🚩 CRITICAL — wrong-direction normalize artifact in this directory

`tag-normalize-actions.csv` (4,255 rename actions across 844 contacts) and `tag-normalize-summary.json` propose renaming **colon → underscore**:

- `project:contained-adelaide-2026` → `project_contained_adelaide_2026`
- `source:inquiry` → `source_inquiry`
- `engagement:warm` → `engagement_warm` … (101 tags total)

This is **backwards** from the locked tag canon (colon is canonical; the live register route emits colon `source:form` at `route.ts:125`). **Applying it would orphan the form's colon tags — the exact PR #38 failure mode.**

Mitigating facts:
- `mode: dry-run` → **not applied, no harm yet.**
- Internally inconsistent: normalizes `project:`/`role:`/`source:`/`engagement:`/`comms:` to underscore but keeps `campaign-stage:`/`newsletter-stream:`/`tier:`/`place:`/`ring:` as colon.

**Recommendation:** do **not** apply `tag-normalize-actions.csv`. Flag at the go/no-go. Any cleanup should run the other direction (→ colon).

**Separator sanity:** 211 distinct tags live; **0 underscore tags present** (✓ confirms spec's "0 underscore"); colon/hyphen split ≈ spec's 164/44.

---

## Bottom line for the 16 June go/no-go

- Eligibility gate verified at **113 eligible / 2,916 blocked** — safe to build streams against.
- Build prerequisites still to stand up (from §0/§1 probe): create `slot_confirmed` + `cohort` custom fields; create the "CONTAINED Adelaide 2026" pipeline.
- Reconcile the 4 mis-named/already-existing streams before building A7 (avoid duplicate streams).
- Do not apply the colon→underscore `tag-normalize` artifact.
