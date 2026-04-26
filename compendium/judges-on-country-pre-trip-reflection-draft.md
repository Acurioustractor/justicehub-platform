# Judges on Country — Pre-trip / Post-trip Reflection Instrument (draft)

**Status:** DRAFT — for Oonchiumpa + ANU True Justice partnership review
**Last updated:** 2026-04-25
**Drafted by:** Ben Knight (with Claude-assisted drafting)
**Next step:** Review by Kristy Bloomfield + Tanya Turner (Oonchiumpa) and ANU True Justice methodological lead by **end of May 2026**
**Deployment window:** Distributed to 55 judges/magistrates 4–6 weeks pre-trip (i.e. by mid-July 2026 at the latest)
**Parent plan:** `~/.gstack/projects/Acurioustractor-justicehub-platform/ceo-plans/2026-04-25-minderoo-phase-3-integration.md` (Cherry-pick #6)

## Design principles (locked before drafting the questions)

1. **Voluntary. Non-research-grade. No HREC pathway.** This is reflection capture, not human subjects research. Every question is framed as an invitation, not a data point. Participants can decline any question and still attend the field trip.
2. **Plain language. No jurist jargon. No academic instruments.** Sentences short enough to read on a phone while walking to the car.
3. **Three questions per phase.** Three only. A longer form would not be completed by a Chief Magistrate or a junior judge under workload pressure. Three is the respect margin.
4. **Mirror structure across pre and post.** Same three dimensions, phrased to surface movement. Not identical wording — one surfaces expectation, the other surfaces observation — but the dimensions line up.
5. **No identifying demographics unless opted in.** Name, jurisdiction, specialism are all optional. Anonymous participation is the default.
6. **Open-text over scales.** Five-point Likert scales produce false precision here. Open text yields sharper signal and cannot be extracted into misleading averages.
7. **Withdrawal within 14 days of submission, no reason required.** Every reply carries a one-click withdrawal token.

## Consent statement (plain language)

> You are being invited to share a short written reflection before and after the Judges on Country field trip at Oonchiumpa on 15 September 2026. This is not research. It is a voluntary reflection, held by JusticeHub and Oonchiumpa, that will help us understand what (if anything) changes for the people who come on Country. You can skip any question. You can withdraw your response at any time within 14 days by using the one-click link below. Your response will not be identified unless you choose to be identified. A summary of reflections will be shared after the trip, reviewed by the Oonchiumpa lead and Ben Knight before release; nothing identifying will be published without your explicit consent.

[Button: I agree and want to share a reflection] [Button: No thank you]

## PRE-TRIP INSTRUMENT (distributed 4–6 weeks before 15 September)

### Q1 — Current practice (what you already hold)

*When you think about community-based alternatives to youth detention in your current work, what do you already know is working? What evidence do you see, and from where? If you don't currently encounter much about this, that's useful to say too.*

**Why this question:** Surfaces the baseline. Some judges have rich exposure to community-led work; some have almost none. Both are honest positions. The answer calibrates what kind of shift (if any) the field trip produces.

### Q2 — What you are coming to see (expectation)

*What do you expect to encounter on Country at Oonchiumpa? What would make this a useful use of your day? If you're unsure what to expect, describe what is drawing you here anyway.*

**Why this question:** Captures intention pre-experience. Compared against the post-trip Q2, it lets us see where expectation met, missed, or was rewritten by the day.

### Q3 — The quiet question (self-identified blind spot)

*What do you know you don't know about what happens to young people between the courtroom and the community? What question are you bringing that you hope the day might answer, even partly?*

**Why this question:** Gives participants permission to name uncertainty. The most interesting data often lives here — not in confident positions but in acknowledged gaps.

**Optional identification:**
- Name (optional): _____
- Court / jurisdiction (optional): _____
- Years on the bench (optional): _____

## POST-TRIP INSTRUMENT (distributed exactly 30 days after the field trip)

### Q1 — What shifted (mirror of pre Q1)

*Has anything changed in your understanding of community-based alternatives since the day on Country? If yes, what specifically? If no, please say so — a held position is useful evidence too.*

**Why this question:** Direct mirror. The wording deliberately permits "nothing changed" as a valid answer to protect against social-desirability bias.

### Q2 — Practice implications (mirror of pre Q2)

*If you were to carry one thing from the day into your chambers next week, what would it be? What would make it easier for you to act on that? What would make it harder?*

**Why this question:** Turns reflection toward action without requiring a promise. The "easier / harder" frame surfaces structural barriers — which is where Phase 3 Minderoo conversation can most usefully intervene.

### Q3 — System-level reflection (mirror of pre Q3)

*What does the experience at Oonchiumpa say about the gap between what sentencing officers see in court and what communities are actually doing? If you had thirty seconds to tell a Chief Magistrate about this gap, what would you say?*

**Why this question:** Asks participants to be narrators, not subjects. The thirty-second pitch frame forces precision and yields material that can — with consent — inform peer-judge communication.

**Optional identification (same as pre-trip).** Note: participants who identified pre-trip may choose not to identify post-trip, and vice versa. Not linked.

## Day-of exit capture (optional, at Oonchiumpa, 15 September)

After the activity ends, before judges leave Country, a 60-second voice prompt is offered:

> "If you have a minute, we'd like to record one sentence. What is one thing you will take back to chambers from today?"

- Voluntary. Recorded on a handheld device with consent spoken before recording.
- No transcript published; audio stored in Empathy Ledger under per-respondent consent with opt-in identification.
- Participants can request a copy of their own audio.

This is the most powerful single artefact the day can produce, captured in the moment rather than 30 days later when articulation dulls.

## Fields required in the capture surface (Supabase table `judges_on_country_reflections`)

| column | type | notes |
|---|---|---|
| `id` | uuid | primary key |
| `respondent_token` | text | single-use withdrawal token, not tied to identity |
| `phase` | enum ('pre', 'post', 'exit') | which instrument |
| `q1_response` | text | nullable (participant can skip) |
| `q2_response` | text | nullable |
| `q3_response` | text | nullable |
| `consent_identify_name` | text | optional; null = anonymous |
| `consent_identify_jurisdiction` | text | optional |
| `consent_identify_years_on_bench` | integer | optional |
| `submitted_at` | timestamptz | |
| `withdrawn_at` | timestamptz | null until withdrawal triggered |
| `audio_url` | text | day-of voice capture only; nullable |

Withdrawal flow: user hits one-click link → token matched → `withdrawn_at` set → cascade to Empathy Ledger audio asset → user receives confirmation email with deleted-asset receipt.

## Review gate (before any publication)

No reflection content leaves the Supabase table without sign-off from BOTH:
- **Ben Knight** (JusticeHub lead — accurate representation)
- **Kristy Bloomfield or Tanya Turner** (Oonchiumpa lead — cultural authority, final say on any Country-based content)

The reviewed output is the Phase 3 Minderoo conversion artefact (November 2026).

## Open items for Oonchiumpa + ANU True Justice review

- [ ] Are the three pre-trip questions respectful of what judges will bring into the room? (Oonchiumpa review)
- [ ] Is the "day-of exit capture" culturally appropriate? Who holds the device? Who invites the participant? (Oonchiumpa review)
- [ ] Is the open-text rather than scale approach methodologically sound for the kind of claims we will eventually make? (ANU True Justice review)
- [ ] Does the 14-day withdrawal window align with any ethics norms the ANU True Justice partnership considers relevant? (ANU review)
- [ ] Any wording in the consent statement that needs tightening for legal safety without making it cold? (Ben + ANU review)
- [ ] Chief Magistrate distribution pathway — who in each jurisdiction forwards the survey to participating judges? (Ben to coordinate, May–June)

## Fallback if review surfaces issues

If Oonchiumpa or ANU flag concerns, this draft is revised — not the deadline. The end-July distribution window is firm because pre-trip baseline cannot be collected retroactively. If concerns cannot be resolved by early July, the pre-trip phase is reduced to the day-of exit capture only. Imperfect reflection is recoverable; missed baseline is not.
