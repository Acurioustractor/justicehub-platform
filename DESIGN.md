# Design System — JusticeHub

> **Inherits identity from** `act-global-infrastructure/.claude/skills/act-brand-alignment/references/brand-core.md` (LCAA, voice, values). **Visual cluster: Editorial Warmth subfamily** — STAY journal heritage. Intentional visual deviation from parent (Cormorant Garamond + cream + deep purple, not Fraunces + warm white + forest green) because the digital surface extends the physical journal funders and judges already hold. See `act-global-infrastructure/wiki/decisions/act-brand-alignment-map.md`.

## Product Context

- **What this is:** A digital platform that holds community-generated evidence, storytelling, and case-level records for Aboriginal community-controlled organisations supporting young people in contact with the justice system.
- **Who it's for:** ACCOs and their workers; funder/board audiences reviewing evidence; young people and families whose stories are held inside the system.
- **Space/industry:** Youth justice, First Nations community services, philanthropic infrastructure.
- **Project type:** Hybrid. Web app (case/evidence tooling) plus editorial surfaces (funder pitches, public artefacts, the STAY journal series).

## Aesthetic Direction

- **Direction:** Editorial / Warm Institutional. A bookshop voice rather than a SaaS voice.
- **Decoration level:** Intentional. Serif headings at scale, soft shadows, radial dot texture on dark surfaces, one gradient accent reserved for data bars.
- **Mood:** The funder should feel they have opened a carefully made journal, not a deck. Calm, considered, literate. The product is load-bearing; the decoration does not crowd it.
- **Heritage:** Inherits from the STAY journal (Cormorant Garamond display, IM Fell English body, Architects Daughter margin-notes, scrapbook elements). This design system is the web expression of that physical language.

## Typography

- **Display / Hero:** Cormorant Garamond (weight 500, italic available). In use across all `h1`/`h2`/large pullquotes on the Minderoo pitch page.
- **Body:** System sans stack currently. **Recommended upgrade:** Instrument Sans (clean contemporary sans that pairs with Cormorant without competing) or IM Fell English (matches STAY journal body for full visual continuity).
- **UI / Labels:** Same as body, weight 500-600. Kickers use uppercase + tracking-[0.22em–0.35em] + 10-11px + font-semibold.
- **Data / Tables:** Body stack with `tabular-nums`. Stats are rendered in Cormorant Garamond display at 3xl-5xl for editorial weight.
- **Code:** Not used in funder surfaces. JetBrains Mono for internal tooling.
- **Loading:** Google Fonts `<link>` in app layout. Never Adobe Typekit (IP fragility) or local webfont hosting (not needed at this traffic).
- **Scale (Tailwind-native):** `text-sm` (14), `text-base` (16), `text-xl` (20), `text-2xl` (24), `text-3xl` (30), `text-4xl` (36), `text-5xl` (48), `text-6xl` (60), `text-7xl` (72). Use `leading-none` at display sizes, `leading-6`/`leading-7` at body sizes.

## Color

- **Approach:** Balanced. Cream + deep purple + warm gold kicker as the primary trio. One reserved rainbow-gradient accent (gold → coral → lavender) for data bars only.
- **Cream body:** `#f8f1e6` — the default page background. Not white.
- **Surface creams:** `#fff8ef`, `#fffaf3`, `#faf5ec`, `#f3eadb`, `#f5ecdf` — used for stacked cards within cream sections. Each is a +2/+4 tint.
- **Deep purple (hero):** `#4a2560`. Paired with radial gradient `#38184d → #5a2d74`.
- **Deep purple (dark body):** `#3c1d50`. Used for the money section.
- **Text primary:** `#2b2530` — near-black with a warm cast, never pure `#000`.
- **Text body:** `#584b40`, `#5e5145` — warm brown-greys for running prose.
- **Kicker gold:** `#8d6a44` — uppercase label color on cream. `#7d5f3d` / `#6e5a42` for deeper labels.
- **Purple-tinted whites (on dark):** `#eadff2`, `#f1e6f7`, `#e8d7f0`, `#ead7f3`, `#d7c2e3`, `#f3e8f8`, `#f2e7f8`, `#e9dff1` — body copy variants on purple sections.
- **Borders:** `#eadfce` (standard), `#e6d7c1` (deeper), `#e8dcc9` (separator), `#dbc7a9` (emphasis), `#d3b583` (contrast on dark card).
- **Accent gradient (reserved use):** `linear-gradient(to right, #f0c36f, #e98f63, #cfa4ff)`. Only on budget-line progress bars. Never as a button, never as a page background.
- **Shadows:** `0_16px_40px_rgba(49,31,15,0.06)` (card default), `0_16px_45px_rgba(49,31,15,0.07)` (elevated), `0_16px_50px_rgba(49,31,15,0.08)` (hero), `0_10px_30px_rgba(10,3,20,0.18)` (on dark surfaces).
- **Semantic:** Not yet defined. Proposed: success `#3d6f4a`, warning `#a96a1c`, error `#8a2a2a`, info `#4a2560` (primary purple reused).
- **Dark mode:** Not required for funder surfaces. App surfaces use the light system only.

## Spacing

- **Base unit:** 4px (Tailwind default).
- **Density:** Comfortable. Generous vertical rhythm, dense horizontal information density in cards.
- **Section vertical padding:** `py-14 md:py-16 md:py-20` (56–80px).
- **Card padding:** `p-4` (16px) to `p-6` (24px), `p-5` most common.
- **Grid gaps:** `gap-3` (12), `gap-4` (16), `gap-5` (20), `gap-6` (24), `gap-10` (40).
- **Border radius hierarchy:** `rounded-full` (pills, badges), `rounded-[18px]` (small cards), `rounded-2xl`/`rounded-[20px]` (medium cards), `rounded-[22-24px]` (standard cards), `rounded-[26-30px]` (hero cards, outer wrappers). The entire system is notably rounder than a typical SaaS product; that is intentional editorial warmth.

## Layout

- **Approach:** Grid-disciplined at section level, creative card composition within.
- **Grid:** Tailwind `lg:grid-cols-[X_Y]` with fractional ratios (`[1.1fr_0.9fr]`, `[0.88fr_1.12fr]`, etc.) for asymmetric editorial rhythm. Avoid uniform 2-col or 3-col grids on hero sections.
- **Max content width:** `max-w-7xl` (1280px) for all sections except in-card content which uses `max-w-3xl` / `max-w-4xl` for paragraph readability.
- **Section padding X:** `px-6 md:px-10`.
- **Section structure:** Every section has a kicker (uppercase label), an `h2` at `text-5xl` Cormorant, one or two paragraphs, then the dense content block. Never open a section with a data grid directly.

## Motion

- **Approach:** Minimal-functional. No entrance animations, no scroll-driven effects on funder surfaces.
- **Hover state:** Default Tailwind only. Links get underline on hover where they exist; cards do not lift or glow.
- **Transitions:** `transition-colors duration-150` on interactive elements. Never use purple gradients as hover states.
- **Future:** If the STAY journal web companion lands, page-turn micro-motion on spread changes is acceptable. Pitch pages stay static.

## Decoration Vocabulary

- **Radial dot texture:** On dark hero sections only. `radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)` at `40px 40px`. Never on cream.
- **Large soft shadows:** Every raised card.
- **Pill badges:** Stats, ready-now signals, navigation breadcrumbs. `rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]`.
- **Gradient accent bars:** Reserved for progress/budget lines. One usage per page maximum.
- **Not in use yet (see Risks):** Polaroid-style photo frames, library-stamp kickers, index-card metadata blocks, Architects Daughter margin-notes.

## Anti-patterns (never ship)

- Purple or violet gradients as button fill.
- Centered everything with uniform spacing.
- 3-column icon feature grid with colored circles behind the icons.
- Stock-photo-style hero images (use real community portraits under OCAP approval).
- Uniform 8px `rounded` on every element. The hierarchy of radii is part of the voice.
- Em dashes. Use commas, periods, or colons.
- AI vocabulary in any copy: "delve", "crucial", "pivotal", "tapestry", "underscore", "robust", "seamless", "not just X but Y", rule-of-three adjective stacks.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-22 | Initial design system codified | Reverse-engineered from the Minderoo pitch page and STAY journal visual language. Written by `/design-consultation`. |

## Risks available (not yet applied)

These are deliberate departures you could take to sharpen the pitch further. Each has a rationale and a cost.

### Risk 1. Upgrade body typography to match STAY journal

**What:** Replace system-sans body with Instrument Sans (ship) or IM Fell English (bolder commitment to journal voice).
**Why:** Currently the serif display is doing all the editorial work; the body copy is anonymous. IM Fell English closes the visual gap to the printed journal. Instrument Sans is the safer choice.
**Gain:** Visual continuity across the STAY journal, Tractorpedia, and the Minderoo pitch.
**Cost:** IM Fell English reduces reading speed on long body paragraphs; wrong for app surfaces. Instrument Sans is neutral and safe.
**Recommended:** Instrument Sans for app and pitch body; IM Fell English reserved for journal-specific pages.

### Risk 2. Adopt scrapbook vocabulary on portrait and approval panels

**What:** Portraits in Section 2 of the pitch get a polaroid-style frame (rotated 1-2°, caption strip at the bottom). The OCAP approvals panel becomes a library-card treatment (ruled lines, stamp-style date in ink red).
**Why:** Connects the pitch to the physical journal language and separates community imagery from stock-style product screenshots. Makes the consent architecture feel like a real ledger, not a disclaimer.
**Gain:** Memorable, distinctive, board-room safe. Hard to slot into a generic philanthropic deck template.
**Cost:** More hand-tuning per portrait. Polaroid frames require good source imagery; weak photos look worse inside them.
**Recommended:** Apply once you have the Palm Island and MMEIC imagery. Not before.

### Risk 3. Architects Daughter margin annotations for provenance and consent

**What:** Funder side-notes (data sources, OCAP approvals, consent references) move from inline boxes to actual margin-notes in Architects Daughter handwriting font, rendered at 14px, tilted 1°.
**Why:** Matches STAY journal rule 6 exactly. Reads as a human annotation rather than a compliance panel. Puts OCAP authority visually closer to the imagery it governs.
**Gain:** Very high voice cohesion with the rest of the ACT ecosystem. Signals craft.
**Cost:** Architects Daughter is blocked from body text in the STAY journal rules for good reason. If applied sloppily it reads as twee. One-per-page discipline required.
**Recommended:** Start with a single margin-note on the OCAP approvals panel in Section 2 and test for voice.
