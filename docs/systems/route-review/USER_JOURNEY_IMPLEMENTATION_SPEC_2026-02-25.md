# JusticeHub User Journey Implementation Spec (2026-02-25)

## Goal
Increase conversion from awareness to meaningful action by making the primary user journeys explicit, shorter, and measurable.

Primary outcomes:
- More people find relevant support faster.
- More community organizations start onboarding.
- More funders/government users move from reading intelligence to taking action.

---

## Main Focus Of The Site
JusticeHub is an action platform for youth justice transformation:
1. **Direct support:** connect young people/families to services and community programs.
2. **Community amplification:** make community-led organizations visible, credible, and connected.
3. **Evidence to decisions:** convert data into intelligence that drives policy and funding decisions.
4. **Accountability:** keep outcomes and funding transparent.

Current key route hubs:
- Public entry: `/`, `/about`, `/how-it-works`
- Support discovery: `/services`, `/community-programs`, `/community-map`
- Partnerships: `/for-community-leaders`, `/for-funders`, `/for-government`
- Intelligence: `/intelligence/*`, `/youth-justice-report/*`
- Action capture: `/contact`, `/signup`, `/stories/new`

---

## Current User Journey (As-Is)

### Journey A: Young person / family seeking support
Path today:
1. `/`
2. `/services` or `/community-programs` (user must self-decide)
3. Detail page (`/services/[id]` or `/community-programs/[id]`)
4. `/contact`

Current friction:
- User must choose between services/programs without guided intake.
- High information density before action.
- No persistent "my shortlist" or "next steps."
- Contact flow is generic, not pre-contextualized by journey intent.

### Journey B: Community organization leader
Path today:
1. `/` or direct `/for-community-leaders`
2. Read benefits/basecamps/principles
3. `/contact?source=community&type=partner`

Current friction:
- Messaging is strong, but the "join" path is a single generic form jump.
- No staged onboarding checklist (eligibility, region, needs, timeline).

### Journey C: Funder / government decision maker
Path today:
1. `/for-funders` or `/for-government`
2. `/intelligence/*` and `/transparency`
3. `/contact`

Current friction:
- Rich evidence but weaker direct "next investment action" hooks.
- Limited conversion handoff from intelligence artifacts to real commitments.

---

## Target Journey (To-Be)

### Journey A (Support): reduce time-to-help
Target path:
1. `/` with clear pathway chooser ("I need support now", "I lead a program", "I fund change")
2. `/services` with guided intake panel (need, urgency, location, age range)
3. Shortlisted results + one-click actions (call, website, referral form)
4. `/contact` prefilled with context when escalation is needed

Target UX outcomes:
- User sees first relevant options in under 60 seconds.
- User gets clear "next 3 steps" on list/detail views.
- Escalation path is obvious when no exact match exists.

### Journey B (Community leader): structured onboarding
Target path:
1. `/for-community-leaders`
2. "Start partnership intake" mini-flow (organization type, region, support needed)
3. Suggested next step: profile intake, call booking, or data sharing setup
4. `/contact` pre-populated with intake context

Target UX outcomes:
- Fewer drop-offs between page view and partner inquiry.
- Cleaner handoff data for internal follow-up.

### Journey C (Funders/government): evidence-to-commitment
Target path:
1. `/for-funders` or `/for-government`
2. `/intelligence` (goal-based entry: invest, commission, evaluate)
3. Intervention/program drill-down with "Fund this pathway" or "Request briefing"
4. `/contact` with selected target context attached

Target UX outcomes:
- Higher conversion from intelligence page visits to briefings.
- Clear line from evidence insight to funded action.

---

## Screen-By-Screen Change Map

| Screen | Current | Proposed | Why |
|---|---|---|---|
| `/` | Strong narrative + many CTAs | Add 3-card pathway chooser directly under hero; keep urgency CTA primary | Reduces cognitive load; routes by intent immediately |
| `/services` | Search + filters + directory | Add guided intake panel above search; sticky action rail on cards | Converts browsing into directed matching |
| `/services/[id]` | Detail + related data | Add fixed "Do this now" block: call, site, contact fallback | Increases completion rate of concrete actions |
| `/community-programs` | Program catalog + filters | Mirror guided intake model; add "best fit for" tags | Makes programs legible for non-expert users |
| `/for-community-leaders` | Narrative + join CTA | Add 3-step onboarding widget + expected timeline | Improves trust and submission quality |
| `/for-funders` | Thesis + tiers + CTA | Add "funding readiness" cards linked to interventions/programs | Makes funding decision path tangible |
| `/intelligence` | Rich content and links | Add goal selector: "Where should funds go?", "What works in my state?", "Who to partner with?" | Aligns evidence exploration with decisions |
| `/contact` | Generic form | Read query params (`source`, `type`, `route`, `intent`) and prefill category/subject/body skeleton | Cuts friction and improves triage quality |
| Main nav (`navigation.ts`) | Multi-domain IA | Add persistent "Start Here" top-level item to intent selector | Improves first-time orientation |

---

## Proposed Information Architecture Adjustments

1. Introduce a single "intent router" entry point:
- Route: `/start`
- Options: Support, Partner, Fund/Policy
- Each option links to existing domain pages with query context.

2. Preserve existing deep routes:
- No removal of current route families.
- Focus on better entry and transition points.

3. Add context propagation across routes:
- Query params: `intent`, `source`, `type`, `topic`, `selected_id`
- This powers prefilled forms and analytics attribution.

---

## Implementation Plan

### Phase 1 (Quick wins, 1-2 weeks)
Scope:
- Homepage pathway chooser component.
- Contact prefill logic from query params.
- Sticky "next action" module on `/services` and `/community-programs`.
- Add "Start Here" item in main navigation.

Files:
- `src/app/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/services/page.tsx`
- `src/app/community-programs/page-content.tsx`
- `src/config/navigation.ts`

Definition of done:
- First-click path choices visible above fold on desktop/mobile.
- Contact form pre-fills category and subject for at least 3 journey sources.
- No route integrity regressions (`npm run check:route-links`).

### Phase 2 (Guided journeys, 2-4 weeks)
Scope:
- New `/start` route (intent router).
- Reusable guided intake component for support/program discovery.
- "Shortlist" session state for selected services/programs.

Files:
- `src/app/start/page.tsx` (new)
- `src/components/journey/IntentRouter.tsx` (new)
- `src/components/journey/GuidedIntake.tsx` (new)
- `src/components/journey/ShortlistRail.tsx` (new)
- `src/app/services/page.tsx`
- `src/app/community-programs/page-content.tsx`

Definition of done:
- User can complete support intake in <= 3 steps.
- Shortlist persists during session and is visible on mobile.

### Phase 3 (Decision activation, 3-5 weeks)
Scope:
- Goal-based gateway on `/intelligence`.
- Funding-action hooks on interventions/program pages.
- Stronger handoff from `/for-funders` to selected opportunities.

Files:
- `src/app/intelligence/page.tsx`
- `src/app/intelligence/interventions/page.tsx`
- `src/app/intelligence/programs/[id]/page.tsx`
- `src/app/for-funders/page.tsx`
- `src/app/for-government/page.tsx`

Definition of done:
- At least one direct action CTA appears on all target intelligence pages.
- Action CTA carries selected context into `/contact`.

---

## Measurement Plan (Required)

### Core KPIs
1. `support_journey_start_rate`  
Users who click support pathway / total homepage visits.

2. `support_first_action_rate`  
Users who click call/email/visit from service/program cards / support journey starts.

3. `partner_inquiry_conversion_rate`  
Community leader page visits to contact submissions.

4. `funder_briefing_conversion_rate`  
Funder/intelligence visits to briefing submissions.

5. `median_time_to_first_action`  
Time from landing to first high-intent click (target: -30%).

### Event Taxonomy (minimum)
- `journey_path_selected`
- `guided_intake_submitted`
- `search_filter_applied`
- `service_action_clicked`
- `program_action_clicked`
- `intel_goal_selected`
- `contact_prefill_loaded`
- `contact_form_submitted`

Required event properties:
- `route`, `intent`, `source`, `type`, `entity_id`, `state`, `device`, `timestamp`

---

## Content And Messaging Improvements

1. Keep urgency language for support pathways, but shorten paragraph copy where users need to act.
2. Use clearer expectation setting:
- "Response in 24-48 hours"
- "Best for urgent housing/legal/mental health"
- "Fund-ready opportunity"
3. Keep community-first framing:
- Emphasize community leadership and data sovereignty in partner/funder flows.
4. Add plain-language decision labels:
- "I need help now"
- "I run a community organization"
- "I fund or shape policy"

---

## Risks And Mitigations

1. **Risk:** Added UI complexity across already large pages.  
**Mitigation:** Use reusable journey components with strict props and phased rollout.

2. **Risk:** Query-param context gets inconsistent across routes.  
**Mitigation:** Define shared helper for journey context parsing/serialization.

3. **Risk:** Analytics noise without event standards.  
**Mitigation:** Ship event schema and validation before full rollout.

---

## Immediate Ticket Backlog (ready to create)

1. Homepage pathway chooser with intent query propagation.
2. Contact form prefill and source-aware category defaults.
3. Services page sticky action rail and emergency shortcut panel.
4. Community Programs page "best fit for" labels and action rail.
5. Add `/start` intent router route and nav entry.
6. Intelligence goal-selector block with contact handoff CTA.
7. Add journey event instrumentation with shared payload schema.
8. Add journey KPI dashboard section to reporting workflow.

