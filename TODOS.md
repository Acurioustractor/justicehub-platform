# TODOS

Running ledger of work deferred from planning sessions. Each item has: what, why, effort (human / CC+gstack), priority, blocked-on (if any).

## From 2026-04-25 CEO plan — Minderoo Phase 3 Integration

These seven items were surfaced during the SELECTIVE EXPANSION cherry-pick ceremony for the Minderoo Phase 3 partnership pitch and deferred from Round 1 scope. Parent plan: `~/.gstack/projects/Acurioustractor-justicehub-platform/ceo-plans/2026-04-25-minderoo-phase-3-integration.md`.

### 1. Six-year arc / Phase 4 roadmap document

**What:** Narrative document mapping years 4–6 of the Minderoo partnership. Where does the proof go? How does the "next room" of funders (Paul Ramsay, Ian Potter, Myer) step in? What does the community-owned evidence library look like when Minderoo's three-year tranche ends?

**Why:** Partnership reframe implicitly commits to a six-year arc. Currently only years 1–3 are scoped. If Minderoo commits to the frame, the Phase 4 roadmap is the next document they'll ask for.

**Effort:** human ~1 week / CC+gstack ~1 day
**Priority:** P2 — not needed for May 15 conversation, needed for Nov 2026 conversion
**Blocked-on:** Lucy Stronach confirms partnership reframe

### 2. Interactive theory-of-change SVG with sourced hover states

**What:** Current theory-of-change block in `/pitch/minderoo` is a static four-card grid. Upgrade to an interactive SVG where hovering over each CoLI recommendation reveals the source citation (CoLI 2024 p.ii, p.25), and hovering over each JusticeHub implementation reveals live metrics from ALMA.

**Why:** Minderoo board-level reviewers will ask "where did this claim come from?" An interactive diagram answers the question inside the diagram.

**Effort:** human ~3 days / CC+gstack ~4 hours
**Priority:** P3 — nice-to-have, not load-bearing
**Blocked-on:** Nothing

### 3. Per-funder pitch CMS

**What:** Extract the 20+ inline const arrays from `/pitch/minderoo/page.tsx` into a structured content system. `/pitch/[funder-slug]` becomes a template; funder-specific content lives in markdown or Supabase.

**Why:** Every new funder pitch is bespoke code copying. Three more pitches and the pattern becomes painful. Sooner done sooner cheap.

**Effort:** human ~1 week / CC+gstack ~1 day
**Priority:** P2 — becomes P1 when the fifth funder conversation starts
**Blocked-on:** Confirm we're doing more funder pitches in this shape. If the pattern changes post-Minderoo, rebuilding on the old shape is waste.

### 4. QR cohort personalisation on postcards

**What:** Each Judges on Country postcard deck distributed at a specific field trip gets QR codes that land on a dynamic page personalised to that cohort — trip date, participating judges (with consent), cohort-specific reflections.

**Why:** Current postcard QRs all go to the same generic landing. Personalised QRs turn each deck into a souvenir of a specific day, which deepens the memory-object function of the postcard.

**Effort:** human ~4 days / CC+gstack ~6 hours
**Priority:** P3 — v1 postcards can ship without this
**Blocked-on:** Nothing; can land post-Sep 15

### 5. Printable proof passport for THE CONTAINED tour attendees

**What:** A4 printable "proof passport" that tour attendees carry through each of the three rooms in THE CONTAINED, stamped at each stop, ending with a personalised action pathway.

**Why:** Current tour gives attendees a one-way experience. A passport turns it into a journey they own and take home. Proven device in museum/exhibition design.

**Effort:** human ~1 week / CC+gstack ~1 day
**Priority:** P3 — nice-to-have for tour
**Blocked-on:** Tour operational pattern stabilises (after Mt Druitt Apr, Adelaide May)

### 6. Pitch-scroll analytics

**What:** Instrument `/pitch/minderoo` with scroll depth + dwell time tracking (internal use only, with consent). Understand where funders engage, where they drop off, what the deck's actual shape is when read.

**Why:** The pitch is 1,229 lines. Knowing whether Lucy Stronach or a Minderoo board member actually reaches the Three Circles section is legitimate intelligence.

**Effort:** human ~3 days / CC+gstack ~4 hours
**Priority:** P3 — genuinely useful but ethically nuanced; only do if you're comfortable with funder-reader analytics
**Blocked-on:** Ethics / comfort call on tracking funder engagement

### 7. Board-member preview video (5-min Oonchiumpa lead briefing)

**What:** Short video (5–7 min) featuring Kristy Bloomfield and Tanya Turner introducing themselves, the work, and why the pitch reads the way it does. Embedded in the pitch page or sent as a pre-briefing to Minderoo board members.

**Why:** Board members don't read 1,229-line pitches. They watch. A 5-min video with the community lead's own voice makes the page human at a glance.

**Effort:** human ~2 weeks (production + consent) / CC+gstack minimal (mostly human work)
**Priority:** P2 if Minderoo board-level review becomes the decision gate
**Blocked-on:** Consent conversation with Kristy + Tanya; filming window with them
