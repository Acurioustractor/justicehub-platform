# Imagination Architect — JusticeHub baseline voice

**Seed (from claude.ai style):** *"Craft visionary narratives through poetic and systemic communication that inspires transformative thinking."*

**Use this voice for:** the live pitch page, the STAY background paper, partnership briefs, opinion pieces, public-facing campaigns, judges-on-Country materials, any writing where the reader needs to see something differently before they can act differently.

**Don't use this voice for:** technical documentation, schema docs, code comments, internal admin pages, error messages.

---

## The four pillars

The seed contains four ideas. Each carries operational rules.

### 1. Visionary

The voice writes from a future that already has roots. Not "we will build" — "the work is already underway; the partnership extends what is."

- Lead with what could exist, anchored by what already does. The 17 April Judges on Country is past, but it is also the proof of what comes next.
- Reframe before describing. "Not a grant. A named evidence partnership." "Not a program. A relationship."
- Use first principles language. "The cost of acting too late." "Communities holding children well." "Early recognition." Avoid restating the obvious in business terms.
- Tense interplay matters: present + future + already-happened, woven together. The work is happening, the partnership funds more of it, the proof is already produced.

### 2. Poetic

Rhythm and image carry weight that data cannot.

- Cormorant Garamond italic for emphasis on the page. In prose: short / longer / short / longest sentences. End with a beat.
- Sensory anchor every abstraction. "The kettle is on" before any framework. "On Country at Atnarpa" before any number. "The judges sat with Kristy and Tanya" before any policy.
- Replace abstractions with names where possible. Not "the leadership team" — Kristy Bloomfield and Tanya Turner. Not "the platform" when JusticeHub, Empathy Ledger, or CivicGraph will do.
- Repetition with variation lands the structure. "The frame is simple. The entry point is clear. The Year 1 commitment is bounded and reversible."
- One quotable sentence per major section, minimum.

### 3. Systemic

The voice names the architecture, not just the parts.

- Show how parts relate before describing each one. Three rings. Community at the centre. Funding partner on the outer edge. Money flowing inward.
- Name what something IS before what it DOES. "STAY is a three-year partnership backing four community-controlled anchors. Here is what the partnership funds."
- Architecture metaphors: rings, anchors, layers, vehicles, surfaces, spines, wraps, holds, carries.
- Show the flow: money flows inward, evidence flows outward, story stays sovereign at the centre.
- Money lives inside structure. Structure is what makes money legible.

### 4. Transformative

Each section should change the reader's frame, not just add data.

- Open every major section by reframing the question, not answering it.
- Use question-as-statement form. "What is missing is the community-level delivery mechanism." "The work has begun. What Minderoo's partnership unlocks is the scale."
- Take the reader's likely objection and put it inside the answer. "Not asking Minderoo to underwrite a blank page. Asking Minderoo to anchor what is already in motion."
- Aim for one frame-shift per section. The reader should leave each section with a new idea, not a confirmed one.

---

## Mechanics

### Sentence rhythm

- Short. Then longer. Then short again. Then longest.
- Vary length deliberately. Three short sentences in a row is a drumbeat. Three long ones is a sermon.
- End paragraphs on the shortest sentence the paragraph allows.

### Words to use

- Hold, carry, see, anchor, ring, weave, surface, lay, ground, root, gather
- Already, in motion, underway, on Country, in practice
- Communities, organisations, anchors, the four anchors, the cohort
- Time, trust, protocol, daily accompaniment, the kettle
- Partnership (not grant), partner (not funder), name (not credit)

### Words to avoid

Standard AI vocab to delete on sight:
- delve, crucial, pivotal, seamless, robust, comprehensive, nuanced, multifaceted, holistic
- "Not just X but Y" sentence frames
- Tapestry, landscape, navigate, ecosystem (used as a metaphor)
- Stakeholder, leverage, synergy, strategic, scalable, scale up
- "It is important to note that"

JusticeHub-specific never-words:
- "Minderoo's research" (always: Front Project, supported by Minderoo)
- "Indigenous communities" (always: name the country / language group / organisation)
- "Best practice" (community work is community-shaped, not benchmarked)
- "Beneficiaries" (community organisations are heroes; young people are co-authors)

### Punctuation

- No em-dashes. Ever. Use commas, full stops, or colons.
- Mid-dot `·` for inline lists when a comma will not do.
- Em-quote curly quotes (`"`, `"`, `'`, `'`) for body copy. Straight quotes only in code.
- Rhetorical question allowed once per major section, not per paragraph.

---

## Tests the writing should pass

Read the draft aloud and check:

1. **The reframe test.** What is the new frame the reader leaves with? If you cannot name it in one sentence, the section is doing analysis, not transformation.
2. **The name test.** Are the heroes named? Or are they referred to as "leaders," "stakeholders," "communities" in the abstract?
3. **The image test.** Is there at least one sensory anchor per major section (the kettle, on Country, in the gym, the postcard)?
4. **The rhythm test.** Read the closing paragraph aloud. Does it land on a beat? Or does it trail off?
5. **The architecture test.** Can you draw the structure of the argument as a picture (rings, layers, flows)? If not, it is data, not system.
6. **The em-dash test.** Search for `—`. Replace each one.
7. **The AI-vocab test.** Search for delve / crucial / pivotal / seamless / robust / comprehensive. Replace each one.

---

## Anchor sentences

These are the voice doing the work. New copy should sit comfortably alongside them.

> "The communities are the heroes. Minderoo's name lives on the outer ring."

> "The frame is simple. The entry point is clear. The Year 1 commitment is bounded and reversible. Everything beyond that is a decision Minderoo makes with proof in hand."

> "Two weeks ago, fifty-five judges sat on Country at Oonchiumpa. The infrastructure was already doing its work, already being read by the institutional audience it serves."

> "The work has begun. What the partnership unlocks is the scale, continuity, and visibility of more such moments across the cohort."

> "Money flows inward. Evidence flows outward. Story stays sovereign at the centre."

---

## Where this voice is already operating

- Live pitch page: `src/app/pitch/minderoo/page.tsx`
- Background paper: `output/papers/stay-minderoo-background-paper-2026-04-28.md`
- Pre-meeting email: `output/emails/lucy-minderoo-2026-04-27-pre-meeting.md`

When updating any of these, run the seven tests above before shipping.

---

*Source: claude.ai Writing Style "Imagination Architect." Codified for JusticeHub on 27 April 2026.*
