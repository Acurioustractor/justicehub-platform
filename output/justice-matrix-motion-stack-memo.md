# Justice Matrix — Motion Stack Decision Memo
Date: 2026-06-10
Owner: Ben Knight / ACT
Surfaces: justicehub.com.au/justice-matrix (Next 14.2.35, React 18, framer-motion 12 already installed; no GSAP yet)

## The two jobs

1. **Partner explainer** — a 60 to 90 second video sent to National Justice Project, OHCHR, the justice reinvestment network. It has to read as ACTION infrastructure, not a paper. Rendered once, re-rendered when the data moves.
2. **In-product motion** — the live tool feels alive: issue timelines that draw themselves, count-up stats, the map breathing, doctrine flowing across years.

These are different jobs. The explainer is offline render-from-JSON. The in-product work is browser runtime tied to scroll and state. One tool will not win both, and it should not have to.

## Tool-by-tool

### Remotion (React video)
- **Maturity:** high. v4, used in production by large teams, active weekly releases.
- **Licensing:** source-available. **Free for companies of 3 people or fewer, no revenue cap, commercial use allowed.** Company license needed at 4+ people; combined headcount counts when teams collaborate on rendering. ACT Pty has 2 directors, so it sits inside the free tier today. Watch the combined-headcount clause if a partner team or contractor renders alongside you. Paid tiers run from ~$250/yr/dev with a $1000/yr minimum spend. *Verify entity headcount before any paid purchase.*
- **Data-driven:** best in class. It is just React, so a Remotion composition reads the same case JSON the site reads. Recharts, D3, react-map-gl all drop straight in. Re-render the video when the DB changes by passing new props. This is the decisive advantage for our use case.
- **Learning curve:** low for this team. If you know React you know Remotion. `interpolate(frame, ...)` is the only new idea.
- **Fit:** explainer YES. In-product NO (it renders files, it is not a runtime).

### Motion Canvas
- **Maturity:** medium, genuinely open source (no license worry).
- **Data-driven:** weaker. Imperative, canvas-only API; React component libraries do not transfer, so our case JSON and chart components do not come along for free.
- **Fit:** good for hand-authored explainer animation, poor for render-from-real-data. Skip — Remotion wins the same slot with our data.

### Theatre.js
- **Maturity:** low to medium, pre-1.0 (v0.5), small team, free for commercial use.
- **Data-driven:** it is a timeline/keyframe editor for hand-tuned motion, not a render-from-JSON engine.
- **Fit:** niche 3D / R3F sequencing. Not our job. Skip.

### Rive
- **Maturity:** high for interactive vector animation; state-machine model is excellent for designed micro-interactions.
- **Licensing:** editor free; **runtime/export needs a paid plan from $9/mo.** Animations are hand-built in the Rive editor, not generated from a database.
- **Data-driven:** weak for our case. You author motion by hand; you do not feed it 360 court cases.
- **Fit:** lovely for a logo or an icon set, wrong tool for data storytelling. Skip for now.

### GSAP + ScrollTrigger (in-product scrollytelling)
- **Maturity:** very high, the standard for scroll-driven narrative.
- **Licensing:** **fully free as of April 2025.** Webflow acquired GreenSock and released the whole library including ScrollTrigger, SplitText, MorphSVG and DrawSVG at no cost.
- **Data-driven:** strong. Bind scroll progress to anything in the DOM, including data-bound elements. SplitText plus ScrollTrigger is the doctrine-flowing-over-time pattern.
- **Learning curve:** medium. Timeline thinking is a small new muscle.
- **Fit:** in-product scrollytelling YES (timelines drawing, doctrine flow, map sequencing). Heavier than Framer Motion, so reach for it only where scroll is the driver.

### Framer Motion / Motion (in-product)
- **Maturity:** very high, MIT, already in our package.json (v12).
- **Data-driven:** strong for component-level motion: count-ups (`AnimateNumber`), enter/exit, layout transitions, `useInView`, scroll-linked springs.
- **Learning curve:** lowest. The team already uses it.
- **Fit:** in-product YES for stats, card reveals, simple scroll effects. It is the default; only escalate to GSAP when a sequence outgrows it.

### HeyGen HyperFrames (HTML-to-video)
- **Maturity:** new (2026), Apache 2.0, no per-render fee, agent-native (the `npx skills add heygen-com/hyperframes` skill exists in this repo's world).
- **Data-driven:** medium. You write HTML/CSS/GSAP, headless Chrome captures frames, FFmpeg encodes. Real data can be templated in, but binding 360 typed cases through HTML is fiddlier than passing a JSON prop to a React component.
- **Fit:** a fast, agent-driven path to a rough explainer cut, or a teaser. But for a video that must re-render cleanly from our typed case data and live next to a React codebase, Remotion is the better long-term home. Keep HyperFrames as the quick-teaser option.

## Recommendations — one stack per job

- **Explainer video: Remotion.** It reads our real case JSON, shares the React mental model and component library, re-renders when the data moves, and is free at our entity size. Map scenes via Remotion's MapLibre + Turf.js path (`--gl=angle`). *Confirm 3-or-fewer headcount before any paid tier.*
- **In-product motion: Framer Motion first, GSAP ScrollTrigger where scroll drives the story.** Framer Motion is already installed and free; add GSAP (now free) only for the scroll-sequenced moments (timeline draw, doctrine flow). Two tools, clear division: component motion vs scroll choreography.

## Storyboard — 60 to 90s matrix explainer (Remotion)

| # | Scene | Dur | On screen | Data source |
|---|-------|-----|-----------|-------------|
| 1 | Cold open | 0-10s | Black to cream. Line draws: "360 cases. One question: does this work?" Cormorant display. | static copy |
| 2 | The map fills | 10-25s | Australia outline; case points drop in by jurisdiction, count climbing in the corner. | cases.coords + jurisdiction; live count-up |
| 3 | Time sweep | 25-42s | Year axis scrubs; points recolour by outcome (win/loss/mixed) as the playhead moves across years. | cases.year + cases.outcome |
| 4 | Doctrine flows | 42-58s | A doctrine label travels case to case across the timeline, showing precedent moving through the network. | issue-page timelines / linked cases |
| 5 | Campaign layer | 58-75s | Pull back: 67 campaigns light up over the case field; "evidence becomes action" lands. | campaigns (67) |
| 6 | Close / CTA | 75-90s | Map settles, stats freeze (cases, campaigns, jurisdictions), JusticeHub mark, "Open the Matrix" + URL. | aggregate counts |

Scene 3 is the spine — it is the one beat that makes "infrastructure, not a paper" legible. Build it first as a single-scene proof, then wrap the other five.

## In-product motion — shortlist by effort vs impact

1. **Count-up stat tiles** (Framer Motion `AnimateNumber` + `useInView`). Effort: low. Impact: high. The cheapest way to make the matrix feel alive; ships in an afternoon with a dep already installed.
2. **Issue-timeline self-draw on scroll** (GSAP ScrollTrigger + DrawSVG / SplitText). Effort: medium. Impact: high. Turns a static timeline into a narrative the reader pulls through. This is the signature in-product moment.
3. **Map breathing — points settle / pulse on filter** (Framer Motion layout + react-map-gl transitions). Effort: medium-high. Impact: medium. Satisfying, but gated on map-state plumbing; do it third, after the two above prove the motion language.

## Open items
- Confirm ACT combined headcount (directors + any rendering contractor) stays at 3 or fewer before relying on Remotion's free tier; re-check the license page before any purchase.
- Decide whether the explainer's map style matches the in-product research-tool look or the warm JusticeHub brand. Recommend: research-tool look inside the map, warm brand for the open/close frames.
