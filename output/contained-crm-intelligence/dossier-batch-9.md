# CONTAINED CRM Dossiers, Batch 9 (roster indices 64-71)

> Deep per-contact intelligence for 8 South Australian service / policy organisations sitting in the **CONTAINED Engagement** pipeline at **Personal outreach**. These are the Room 3 wall orgs. Built 2026-06-13. READ-ONLY: nothing was sent, tagged, moved, or triggered. Every recommendation is documented for Ben to action as his Tier-3 call.
>
> **Source basis:** GHL location `agzsSZWgovjwgpcoASWG`, read 13 June via conversations-search + get-messages + get-contact. Segment intelligence built on `output/contained-campaign-system/10-segment-informedness-matrix.md` Row A3 (the SA org wall). Primary outreach asset is B2 in `output/contained-campaign-system/22-comms-drafts.md` (SA org / partner nurture, the Room 3 wall-consent email).

---

## Batch-level finding (applies to all 8)

The GHL history for every contact in this slice is **identical in shape and confirms NO real outreach has happened yet**:

- Each has exactly one "conversation" record, but the only content is two auto-generated opportunity-activity log lines: `Opportunity created` (11 June, Identified) and `Opportunity updated` (12 June, stage moved Identified → Personal outreach). No human-authored email or SMS exists. No inbound. The `TYPE_NO_SHOW` / `TYPE_PHONE` conversation type is a GHL artefact of importing a contact with a phone number, **not** an actual phone call.
- `source: "org-wall import 2026-06-11"`, `createdBy.source: INTEGRATION / OAUTH`. These were programmatically researched and bulk-loaded on 11 June, never inbound, never warm.
- `customFields: []` empty on every record. No enrichment beyond name, company, website, and the role tag.

**Interpretation:** the "Personal outreach" stage label is aspirational. The stage was machine-advanced on 12 June; no personal message was actually sent. This is even earlier than the matrix's "outbound underway" framing, outreach is **queued, not in-flight**. So for the whole slice the practical truth is: **cold, researched, never contacted; wall consent is 100% outstanding.** With doors opening Tuesday 23 June and the Room 3 wall built at the start of that week, the window to get an explicit yes/no is roughly **by Thursday 18 June**.

**Tag hazard noted (documented, not applied):** every one carries the blanket `project:contained` + `project:contained-adelaide-2026` pollution tags. Per MEMORY + the matrix, audience for any send must come from the live pipeline stage or the KEEP CSV, never a `project:contained` tag query. Keep `source:research` + `org-wall:invited` (they are outbound-only by design; do NOT add inbound/eligible tags that would drop them into a bulk pool).

**Routing rule that governs this slice:** the Indigenous-led / community-controlled orgs here (SAACCON, ADAC, AFSS, and arguably NPY Women's Council) must be routed through a named relationship, never a cold org-inbox blast. Several addresses are generic inboxes (`enquiries@`, `contact@`, `admin@`, `info@`), so the realistic path to a consent decision is a **phone call to a named human**, with the B2 email as the leave-behind, not the opener.

---

## 64. NPY Women's Council
**Contact ID:** `2XMWLQIGJbVMVZ3j21hM` · **Opp:** `vqsLkVJn7O6Km6cbst38` · enquiries@npywc.org.au · +61 8 8958 2345

**Identity.** Ngaanyatjarra Pitjantjatjara Yankunytjatjara Women's Council, a major Aboriginal women's organisation serving the cross-border tri-state region (SA / WA / NT) around the APY Lands. Runs youth, domestic and family violence, disability, and child wellbeing programs across remote communities. Phone number is the Alice Springs (Mparntwe) office. This is one of the most significant Aboriginal-controlled organisations in the central desert and a heavyweight on youth wellbeing for the communities most over-represented in SA/NT youth detention. Tagged `role:service`, but functionally a community-controlled anchor org.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opportunity auto-created then stage-moved to Personal outreach 12 June. No email or call has actually gone out. Generic `enquiries@` inbox only, no named human in the record.

**Motivation / hook.** NPYWC's leverage is moral and representational: the young people CONTAINED is built to protect are disproportionately from their communities. The hook is not "come witness" first, it is **"your women's leadership belongs in Room 3, on your terms, with your sign-off."** They will (rightly) be wary of being a logo on someone else's wall. Lead with control and consent.

**Strategic value.** High. A community-controlled central-desert org on the Room 3 wall gives the SA experience cultural authority it cannot manufacture. Also a future-tour bridge to Mparntwe (one of the named tour stops). But the relationship risk of getting this wrong (extractive framing, cold inbox) is also high, so it is high-value-handle-with-care, not high-volume.

**Next action.** Phone the Alice Springs office to reach a named program lead (do NOT email `enquiries@` cold). Use the **B2 SA-org/partner** frame verbally: "for you, not about you; your work belongs on the Room 3 wall; nothing prints without your sign-off." Offer to set up the wall card directly with a named contact. Timing: this week, by Thu 18 Jun, before the wall build. If no named human surfaces by phone, treat as a hold rather than send a cold consent ask to a generic inbox. Channel: phone first, B2 email as follow-up leave-behind.

---

## 65. Pauline Connelly, Centacare Catholic Family Services
**Contact ID:** `WfDwFyFBhavmjfSR4nh8` · **Opp:** `B70ChTSgkpjPvoeCVZn7` · no email on record · phone on record

**Identity.** Pauline Connelly is named as a contact at Centacare Catholic Family Services (the social-services arm of the Catholic Archdiocese of Adelaide). Centacare is one of SA's largest community-services providers: family services, homelessness, youth and disability support, refugee and migrant services. A mainstream service org whose practitioners sit close to young people in and around the justice system. `role:service`. [unverified] which Centacare program Pauline sits in, the record has no custom fields and no email.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opp created then stage-moved 12 June. **No email address on the record** and no message ever sent. The only "history" is the auto opportunity log.

**Motivation / hook.** A large faith-based provider responds to mission alignment and to being recognised as already doing the work. Hook: Room 3 names SA organisations already doing the work, and Centacare belongs there, with sign-off. Secondary hook: walk a budget/caseload decision-maker through.

**Strategic value.** Medium. Adds mainstream-provider breadth to the wall and a sizeable practitioner base who could attend. Not an anchor, but credible volume and an Adelaide-establishment name.

**Next action.** **First action is to find a working email or named direct line for Pauline** (the record has neither), then send the **B2 SA-org/partner** email one-to-one. Given no contact channel is on file, a phone call to Centacare reception asking for Pauline (or the relevant youth/family services manager) is the realistic path. Timing: by Thu 18 Jun. Channel: phone to obtain contact details, then B2 email.

---

## 66. Robyn Layton, Justice Reinvestment SA
**Contact ID:** `Zh2yXy23N1XI8jaHO3Kz` · **Opp:** `eGucrCXkeEaMmIZ5GSpt` · no email on record · website justicereinvestmentsa.org

**Identity.** The Hon. Robyn Layton AO KC, former Justice of the Supreme Court of South Australia, a senior figure in SA justice and human-rights circles, associated here with **Justice Reinvestment SA**. Tagged `role:policy` (correctly, the matrix flags Marie Shaw + Robyn Layton as policy individuals who should NOT be treated as generic wall orgs). This is the single highest-status individual in the slice: a former judge who is a public advocate for justice reinvestment is exactly the kind of decision-shaping witness CONTAINED is built to move, and a credibility multiplier for the whole SA effort.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opp created (Identified) 11 June, stage-moved to Personal outreach 12 June 06:38. No email on record, no message sent. Empty custom fields.

**Motivation / hook.** She does not need persuading on the thesis, she has argued it from the bench and in public life. Her motivation is leverage: a personal witness experience plus a quiet introduction to the SA justice-reinvestment network is worth more than a wall card. Hook: **"You have made this argument for years. Here is thirty minutes that makes other people feel it."** Treat as a senior-witness / influence relationship, not a service-org consent ask.

**Strategic value.** Anchor-adjacent. A former Supreme Court judge walking through CONTAINED, and willing to say so, is a marquee credibility asset for SA media, funders, and the policy lane. She also bridges to the SA justice-reinvestment ecosystem that underpins the campaign's funding logic.

**Next action.** This is NOT a B2 wall-consent send. It is a **personal, senior invitation from Ben** (closer to the Template-2 funder/VIP register than the service-org email), inviting her to walk through privately and asking whether she would be open to being named as a witness and to a JR-SA network conversation. Find a direct email or a warm introducer first (the record has neither, and a cold `enquiries@`-style approach to a former judge would undersell it). Timing: this week, ideally a private slot offer. Channel: personal email or warm intro, never a generic inbox or bulk stream. Documented tag note: keep `role:policy`; do not treat as a Room 3 service-wall org.

---

## 67. SAACCON
**Contact ID:** `Nc8SDIk3yXpYOsxFwqmQ` · **Opp:** `4ZoxWkbiu7KVyyzU2Cry` · contact@saaccon.org.au · +61 8 8261 5503

**Identity.** South Australian Aboriginal Community Controlled Organisation Network, the SA peak body for Aboriginal community-controlled organisations. Tagged `role:partner` (the only `role:partner` in this slice, and correctly so, a peak body is a partner-tier relationship, not a single service org). As the network that represents the very ACCOs CONTAINED wants on the Room 3 wall, SAACCON is a force-multiplier: one warm relationship here can carry credibility and consent across many member orgs.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opp created then stage-moved 12 June. Generic `contact@` inbox; no named human; no message sent.

**Motivation / hook.** A peak body's motivation is collective benefit and protocol. They will care whether the Room 3 wall represents Aboriginal-controlled work properly and with consent, and whether CONTAINED is extractive or genuinely community-led. Hook: **"You are the network that should help shape how Aboriginal-controlled work is shown in Room 3, not just be listed in it."** Frame as co-design and protocol, not a logo grab.

**Strategic value.** High, arguably the strategic key of this slice. SAACCON can vouch for the wall to its members, accelerating consent for the other ACCOs (ADAC, AFSS, KWY, Tjindu, ALRM, Iwiri, Tiraapendi Wodli) and giving Room 3 cultural legitimacy. Worth a personal, senior touch and possibly a meeting rather than an email.

**Next action.** Phone to reach a named SAACCON contact, then propose a short conversation (not just a consent form) about how Aboriginal-controlled work is represented in Room 3, and whether SAACCON will help shape and endorse it. Use the **B2 SA-org/partner** language but elevate it to a partner-level co-design ask. Timing: this week, urgent, because a SAACCON yes de-risks the rest of the ACCO wall consents before the build. Channel: phone first, then a personal email; never a bulk stream.

---

## 68. Scott Wilson, Aboriginal Drug and Alcohol Council SA (ADAC)
**Contact ID:** `yTzGHQJLaTuzN218hywq` · **Opp:** `jcHlyqiJQCmrIO9e3FsL` · adac@adac.org.au · +61 8 8351 9031

**Identity.** Aboriginal Drug and Alcohol Council (SA). Scott Wilson is the long-serving CEO/Deputy CEO figure associated with ADAC and a nationally recognised Aboriginal AOD and health leader (he has held national advisory roles). ADAC is an Aboriginal community-controlled org working at the intersection of AOD, health, and justice, directly upstream of youth justice contact. `role:service`, functionally community-controlled.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opp created 11 June 07:10, stage-moved to Personal outreach 12 June 06:38. Generic `adac@` inbox; no message sent.

**Motivation / hook.** Scott Wilson is an evidence-and-systems leader, he will engage with the "the cure already exists" framing and with CONTAINED as a tool to move decision-makers upstream of detention. Hook: **"Room 3 names the SA organisations already doing the work, ADAC is one of them, on your terms and your sign-off."** The AOD-to-justice pipeline is his territory; CONTAINED makes it visible to people with budgets.

**Strategic value.** Medium-high. A named, nationally credible Aboriginal AOD leader on the wall adds authority and a health-justice link the wall otherwise lacks. Scott personally is a potential influential witness, not just an org logo.

**Next action.** Phone ADAC and ask for Scott Wilson directly (or his EA), use the **B2 SA-org/partner** frame: walk-through invite + wall card with his sign-off. Because he is a named, senior, community-controlled leader, route through a person, not the `adac@` inbox. Timing: by Thu 18 Jun. Channel: phone first, B2 email follow-up.

---

## 69. Shane Maddocks, ac.care
**Contact ID:** `qu2OFMP83WAOmOmF2K1K` · **Opp:** `8bvw5WBd9nJ2KQIzaEHQ` · no email on record · +61 8 8724 5400

**Identity.** ac.care (AC Care) is a regional South Australian community-services organisation operating across the Limestone Coast, Murraylands, and Riverland, homelessness, foster care, family services, and youth support. The phone number on file (08 8724 ...) is the Mount Gambier / south-east region. Shane Maddocks is the named contact. `role:service`. A regional-SA provider, which gives the wall reach beyond metro Adelaide. [unverified] Shane's exact role; no custom fields.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opp created then stage-moved 12 June. **No email on record.** No message sent.

**Motivation / hook.** Regional providers respond to being seen, metro campaigns routinely overlook them. Hook: Room 3 is statewide, not just Adelaide, and regional SA youth services belong on it. Secondary: bring a regional caseload/budget decision-maker through, or send a story for the wall if travel is hard.

**Strategic value.** Medium. Adds regional-SA breadth and a non-metro voice to the wall. Less central than the ACCOs or the peak body, but valuable for showing the wall represents the whole state.

**Next action.** **Obtain an email / named line first** (record has none), then send the **B2 SA-org/partner** email one-to-one to Shane. Realistically: phone the Mount Gambier office, ask for Shane Maddocks or the youth services lead, get a direct contact, then send B2. Acknowledge the distance and offer a remote way to contribute a wall card if attending Adelaide is impractical. Timing: by Thu 18 Jun. Channel: phone to get details, then B2 email.

---

## 70. Sharron Williams, Aboriginal Family Support Services (AFSS)
**Contact ID:** `qgygUoklMSwZWmownb8N` · **Opp:** `Q51ipt9SpdcNArqvqEjB` · afss@afss.com.au · +61 8 8205 1500

**Identity.** Aboriginal Family Support Services, a long-established SA Aboriginal community-controlled organisation focused on child protection, family support, foster/kinship care, and keeping Aboriginal children connected to family and culture, directly in the youth-justice and out-of-home-care space. Sharron Williams is a senior, well-known AFSS leader (CEO-level figure). `role:service`, community-controlled.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opp created 11 June, stage-moved to Personal outreach 12 June. Generic `afss@` inbox; no message sent.

**Motivation / hook.** AFSS's whole purpose is keeping Aboriginal kids out of harmful systems and connected to family, which is the upstream logic CONTAINED dramatises. Sharron will care about consent, cultural framing, and whether the wall honours community-controlled work. Hook: **"Room 3 shows SA organisations already keeping kids safe and connected, AFSS belongs there, with your sign-off, nothing prints without it."**

**Strategic value.** High. A senior, named, community-controlled child-protection leader on the wall is one of the strongest possible Room 3 entries, and Sharron personally is a credible witness and potential advocate. Pairs naturally with the SAACCON relationship (peak body + flagship member).

**Next action.** Route through a named person, ideally reach Sharron Williams or her office by phone rather than the `afss@` inbox, using the **B2 SA-org/partner** frame. If SAACCON (contact 67) engages first, a SAACCON-warmed introduction to AFSS would land better than a cold approach. Timing: by Thu 18 Jun. Channel: phone first (warm intro via SAACCON if available), B2 email follow-up.

---

## 71. Simon Schrapel, Uniting Communities
**Contact ID:** `OsA7qmTT0k3HGpP1gY6p` · **Opp:** `lY2uWG9RLayOFISYk8jU` · enquiries@unitingcommunities.org · +61 1800 615 677

**Identity.** Simon Schrapel AM, long-serving and prominent leader of **Uniting Communities** (one of SA's largest not-for-profit community-services organisations: youth, homelessness, mental health, disability, family services). Simon is an influential, publicly recognised SA social-services leader and advocate, well networked across government, philanthropy, and the sector. `role:service`, but functionally a sector-leader relationship. Website on record: unitingcommunities.org.

**History.** No prior CONTAINED contact. Org-wall import 11 June; opp created 11 June 03:58 / 07:10, stage-moved to Personal outreach 12 June. Only the generic `enquiries@` inbox and the 1800 line on record; no message sent; empty custom fields.

**Motivation / hook.** Simon Schrapel is a systems-and-advocacy leader who carries weight with SA decision-makers and media. His motivation is reform impact and being part of a credible state-level moment. Hook: **"for you, not about you"** plus the bigger-than-a-wall-card invitation, walk through, lend your name, and help the people above you in the decision chain feel what your practitioners already know. Treat closer to a sector-leader / influencer touch than a routine service-org consent ask.

**Strategic value.** High. A Uniting Communities endorsement and a Simon Schrapel walk-through bring mainstream-sector heft, media credibility, and government reach, complementing the ACCO authority elsewhere on the wall. One of the most valuable individuals in the slice for SA establishment credibility.

**Next action.** Reach Simon directly (via his office / a warm introducer), NOT the `enquiries@` inbox. Send a **personal, elevated version of the B2 SA-org/partner** email: wall card with his sign-off plus a personal walk-through invitation, framed for a sector leader. If a warm introducer exists in the ACT/JH network, use it. Timing: this week, by Thu 18 Jun. Channel: personal email / warm intro, never a generic inbox or bulk stream.

---

## Slice summary for the launch plan

- **All 8 are genuinely cold**, researched and loaded 11 June, stage-advanced 12 June, but **zero real messages sent**. "Personal outreach" overstates reality. Wall consent is fully outstanding with ~5 days of working window before the build.
- **The strategic key is SAACCON (67):** a peak-body yes can warm and accelerate consent for the ACCOs in this slice (ADAC 68, AFSS 70, NPY 64) and across the wider Room 3 wall.
- **Two are policy/sector heavyweights to elevate above the wall-consent template:** Robyn Layton (66, former Supreme Court judge, senior witness) and Simon Schrapel (71, Uniting Communities leader). Both warrant personal VIP-style invitations, not the standard B2 service email.
- **Three records lack any contact channel** (Pauline Connelly 65, Robyn Layton 66, Shane Maddocks 69 have no email; several others only have generic inboxes). The first action for those is to get a named human / direct line by phone, because a cold generic-inbox consent ask will not close in time.
- **Routing discipline:** the Aboriginal community-controlled orgs (SAACCON, ADAC, AFSS, NPY) go through named relationships, never cold blasts, per the matrix and brand protocol. Phone-first, B2 email as the leave-behind.
- **Do NOT** add inbound/eligible tags or enrol any of these in a bulk stream; they are `source:research` outbound-only by design. Audience pulls must come from the pipeline stage or KEEP CSV, never a `project:contained` tag query.
