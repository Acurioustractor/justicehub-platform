# CONTAINED, GHL Reality Map (Ground 01)

Verified 13 June 2026. Sources: live GHL MCP read-only queries (pipelines + opportunity search, location `agzsSZWgovjwgpcoASWG`) plus the 11-12 June audit exports in `output/ghl-contained-adelaide-audit/`. Read-only throughout. No contact, opportunity, tag, or workflow was written. Every count below either carries a verified source (live MCP or named CSV/JSON) or is marked [UNVERIFIED].

This is the single map a comms-planning agent can answer from: which contacts sit in which pipeline stage, what segment they fall in, what tags they actually carry, and what is broken or drifting.

---

## 1. The two live CONTAINED pipelines (verified live, GHL get-pipelines, 13 June)

Both pipelines exist in location `agzsSZWgovjwgpcoASWG`, created 11 June 2026. Stage IDs below are the live IDs, a downstream agent moving a contact must use these exact IDs.

### Pipeline A, CONTAINED Engagement (`vzatUY4dwN8t63ZoFIpH`)
The MAIN relationship pipeline. **78 open opportunities live** (verified GHL opportunity search, 13 June, matches the post-cleanup ground truth exactly).

| Stage | Stage ID | Live count |
|---|---|---|
| Identified | `e0fdce64-5102-458c-95b5-6ab6629f5296` | 23 |
| Personal outreach | `78090229-0c6b-4d41-abae-78879a5a35c7` | 34 |
| In conversation | `e3aa0ddf-4dac-4fba-a02f-c6afb54cce5d` | 14 |
| Invited to experience | `be9e4be0-69da-4517-af52-370b70f4d2de` | 0 |
| Experienced | `0e001622-b333-4990-b004-da0c655cb892` | 0 |
| Follow-up / debrief | `0825728b-fb20-4c91-a9c3-9c5b69e114e1` | 0 |
| Partner / committed | `92737d7b-7258-45f0-a717-44c45a168b99` | 7 |
| Future city | `2f647634-79c7-49f5-aec0-561b233b1834` | 0 |
| Parked / closed | `bd33b9c4-51c1-4912-97cc-11a50bd78fab` | 0 |

What sits where (from the 12 June triage CSV, which named every Engagement opportunity by stage):
- **Personal outreach (34)** = the SA org wall. Researched service orgs (`role:service`, `org-wall:invited`), most with org-inbox emails (admin@, info@, enquiries@). Examples: KWY (Craig Rigney), Tjindu (Kellie Graves), MYSA (Helena de Anstiss), Uniting Communities (Simon Schrapel), ALRM (Chris Larkin), Operation Flinders, NPY Women's Council, Baptist Care SA, plus named individuals Marie Shaw, Robyn Layton (`role:policy`), Vicki Holmes, Lucy Stronach (Minderoo, `role:funder`). These are outbound, never streamed.
- **Identified (23)** = funder-lane targets + low-signal supporters. Funder targets with "outreach pending": Alan White + Isabella Stanley (StreetSmart), PRF (William Frazer, Jonas Kubitscheck, general inbox), Dusseldorp (Teya, Scarlett Steven), Matthew Cox + Michael Taylor (Bryan), Katie Norman (TFFF), Seana Osbourne (QLD Gives), jim.rebbechi (Ingkerreke), Fiona Maxwell, Eloise Hall. "No movement signal yet": Alice Motion, Shannon Cant, Hayley Passmore, Lucy McGarry, Victoria Palmer, Nicole Dyson, Melbourne Fringe marketing, Alice Benchoam, QLD environment ministerial inbox.
- **In conversation (14)** = inbound hot leads who asked about CONTAINED/the container. Anita Pahor, Irene Portelli, Katherine Hayes (YAC), Lewina Schrale (TAS gov), Loic Fery, Ludmila Andrade, Michael Haji-Ali, Baressa Frazer, Penny Lamaro, Rhian Miller, Rohan Lulham (researcher), Romina Reyftmann, Shannon Lemanski, Sonia Randhawa (media).
- **Partner / committed (7)** = Diagrama x5 (David McGuire, Derek Milliken, Marina Rubio Borrego, Tina Morris, Zita Whalley), Nicole Mekler (Just Reinvest), Hannah March (JRI, the original container requester / venue partner).

Note: the 12 June triage proposed moving the 5 Diagrama + Just Reinvest + Hannah March OUT of Partner/committed (most to Identified/In conversation), but the live pipeline still shows 7 in Partner/committed. Treat Partner/committed as "Diagrama + JRI + Just Reinvest" for now; the triage reclassification is a proposal, not yet applied. [Live=7 verified; triage intent unapplied]

### Pipeline B, CONTAINED Adelaide 2026 (`SxzINmfZMjvqAMPmFCKa`)
The scarce experience / nomination / EOI pipeline. **Only 2 live opportunities, both at Captured, both internal test records** (verified GHL search, 13 June): "Benjamin Knight, EOI" (knightts@gmail.com) and "TEST EOI Flowcheck, EOI" (ben+contained-eoi-test@benjamink.com.au). Both carry the canonical tag set (`project:act-jh`, `source:event:contained`, `experience:eoi`, `place:sa`, `engagement:warm`, `role:partner`). **No real public EOI has landed yet.** This pipeline is effectively empty of genuine demand.

| Stage | Stage ID |
|---|---|
| Captured | `f8d2acd7-8ced-43c7-a485-3950d190bbc9` |
| Needs enrichment | `9b0d68a5-35e6-4885-96bb-17dc9feff1fe` |
| Warm - review | `07942700-ea35-4bc4-b1ba-fa7c84093faa` |
| Personal invite | `d98cb7a7-64ee-44f8-aeff-1bb5e20eda0b` |
| Booking link sent | `bc4251de-61f3-477f-b00e-606368154e1f` |
| Booked | `db5d37e7-35c5-4161-ab5b-780c08ab9af6` |
| Experienced | `acbdf4cd-ba6a-41ac-ac52-2e5508b0c8f6` |
| Activated | `f9365cf1-5cf8-4976-8ee8-96fc52678251` |
| Post-week nurture | `76a5ba5a-aa3d-4919-be1f-ca0c4bad7052` |
| Future city / partner | `7dee91e5-11f3-432c-9e39-0cc41a5c190c` |
| Closed / no contact | `2db54fe2-9051-4411-a0ba-220e31f43dd9` |

Other live pipelines in the same location (do NOT touch for CONTAINED): A Curious Tractor, Empathy Ledger, Goods Buyer/Demand/Supporter, Grants, Harvest Inbox/Membership, Supporters & Donors, The Shop, Universal Inquiry.

---

## 2. The segment taxonomy (from segment-analysis-2026-06-11.json, 272 records)

The audit JSON scored 272 contacts that carried the blanket `project:contained` + `project:contained-adelaide-2026` tags (the pre-cleanup pollution). Each record has a `segment` field, plus boolean flags: `inbound`, `gatePass` (passes the bulk-send eligibility gate), `dnd`, `suppressed`. **A downstream agent reads `segment` to know who is real and who is noise.**

| Segment | Count | gatePass | inbound | What it means |
|---|---|---|---|---|
| `0-network-cold` | 169 | 0 | 0 | Goods/Harvest newsletter + ACT-network contacts who never engaged with CONTAINED. Pure pollution. None pass the gate. |
| `7-warm-public` | 34 | 34 | 34 | Inbound, gate-passing, genuinely warm public. Every one is inbound + eligible. |
| `2-funder` | 34 | 10 | 10 | Funder-role contacts. Only 10 are inbound/eligible; the other 24 are funder-lane targets reached via Goods, not CONTAINED. |
| `8-org-wall` | 28 | 0 | 0 | The SA research org wall. Correctly gated OUT of streams (they are `source:research`, outbound-only by design). |
| `4-service` | 4 | 3 | 3 | Service orgs, mostly inbound. |
| `1-vip-policy-media` | 2 | 0 | 0 | VIP/policy/media flagged, neither inbound. |
| `3-media` | 1 | 1 | 1 | One inbound media contact. |

Totals: **272 scored, 48 gatePass (all 48 also inbound), 0 DND, 0 suppressed.** So the honest streamable-without-review pool from this scored set is 48; everything else is either cold pollution (169 + 28 org-wall + 2 vip = ~199) or funder/role contacts to reach by hand.

**Important nuance:** "gatePass" here means passes the bulk eligibility gate, NOT "should be streamed today." Streams only fire after go/no-go + Ben preview (see §6). The 48 are the candidate pool, not an approved send list.

A second segment vocabulary exists in `segments.csv` (300 rows) and is DIFFERENT from the JSON's: it labels rows "Delivery circle: personal only", "VIPs: personal only", "Public/warm list: only after audit". This is the Notion-judgement layer (who may be contacted, how), not the JSON's machine segment. Do not conflate the two. The CSV's three labels map roughly: Delivery circle -> Engagement Partner/committed + In conversation; VIPs -> funder/policy/media personal-only; Public/warm -> the 0-network-cold + 7-warm-public pool that needs audit before any send.

---

## 3. Tag canon, documented vs live (the central drift story)

### Documented canon (the target, colon style, NEVER underscore)
Per the campaign bible / memory / `contained-ghl-groups-and-tags.md`:
`project:act-jh` + `source:event:contained` (+ `source:event:contained-adelaide` for the experience). Plus `role:*` (partner/funder/supporter/media/service/policy/community-controlled/researcher/gov/storyteller), `place:sa`, `engagement:*` (warm/hot/personal-vip/nurture), `interest:justice-reform`, `interest:container`, `experience:eoi`, and the experience-pipeline namespaces `org-wall:invited|approved|declined`, `greeter:candidate-org|confirmed-org`, `source:research`, `newsletter-stream:contained-adelaide-invite`.

### Live reality (verified from the two EOI test records + the audit exports)
- **The /register + /eoi path emits the canon correctly.** Both Adelaide test opportunities carry exactly `project:act-jh`, `source:event:contained`, `interest:justice-reform`, `engagement:warm`, `place:sa`, `role:*`, `experience:eoi`. The forward path is clean. [Verified live, 13 June]
- **The legacy/imported pool is a tag swamp.** The 272 scored contacts and 300 CSV rows show a thick layer of OLD and foreign tags. Drift categories actually present:
  - **Underscore-free but wrong-namespace blanket tags:** `project:contained` and `project:contained-adelaide-2026` were stamped onto ~272 contacts as blanket pollution. These are the tags the 12 June cleanup strips. The CANON project tag is `project:act-jh` (CONTAINED rides act-jh), with `project:act-cn` / `project:act-ca` used in some records as CONTAINED-core / CONTAINED-Adelaide. So three competing project conventions coexist live: `project:contained*` (pollution, strip), `project:act-cn`/`project:act-ca` (older CONTAINED codes, still on KEEP contacts), `project:act-jh` + `source:event:contained` (true canon).
  - **Pre-colon legacy tags still attached:** `contained-hot-lead`, `contained-original-requester`, `contained-personal-outreach`, `container-request`, `contained`, `goods-hot`, `goods-warm`, `goods-cooling`, `goods-steady`, `audience-funder`, `audience-partner`, `audience-brand`, `interest-membership` (hyphen, not colon), `goods-src-footer`. These predate the colon canon and were never swept.
  - **Cross-project bleed:** most CONTAINED-tagged contacts also carry `project:act-gd` (Goods) and/or `project:act-hv` (Harvest) and full Goods/Harvest comms drips (`comms:goods-newsletter`, `comms:harvest-newsletter`, `comms:funder-drip`, etc.). The CONTAINED tags were sprayed across the existing Goods/Harvest book.
  - **`ring:*` tags** (`ring:15`, `ring:50`, `ring:150`, `ring:vip`) and `cohort:public` appear widely, a relationship-proximity layer from another system, not part of CONTAINED canon but harmless.
  - **`newsletter-stream:*` tags** on VIP/funder rows (`funder-brief`, `media-pack`, `youth-justice-brief`, `daily-adelaide-recap`), these are the stream-eligibility flags; only `newsletter-stream:contained-adelaide-invite` is the CONTAINED-Adelaide invite stream.

**Bottom line for a comms agent:** trust `source:event:contained` + `experience:eoi` as the real-intent signal. Treat bare `project:contained` / `project:contained-adelaide-2026` as noise pending cleanup. Never write an underscore tag.

---

## 4. Custom fields used for CONTAINED

Not separately enumerated in the audit exports, and not queried live in this pass to avoid a large dump. The briefed contract names two CONTAINED-relevant opportunity/contact custom fields: **nominee** and **role** (used by the nomination flow). The nomination data of record lives in the Supabase `campaign_nominations` table, not GHL custom fields; GHL receives the contact + a mirror. [Custom-field IDs UNVERIFIED, a downstream agent that needs them should call `locations_get-custom-fields` with `query_model=opportunity` read-only.]

---

## 5. Suppression / DND state

- **0 DND and 0 suppressed across all 272 scored contacts** (verified, segment JSON). No one in the CONTAINED pool is currently marked do-not-contact in GHL.
- The real suppression is the **eligibility gate**, not DND flags. `source:research` / `org-wall:invited` contacts are deliberately excluded from every bulk send by design (they have not replied). That exclusion is load-bearing and correct, do not "fix" it by adding inbound tags to research contacts who have not actually replied.
- Suppression rules on paper (from the tagging operating system): no automated send if DND true, do-not-contact, missing email, personal-only, needs-consent, or relationship-owner says personal-outreach-only.

---

## 6. The 12 June cleanup, what is decided vs what is applied

The pollution cleanup is a DRY-RUN PROPOSAL (`engagement-cleanup-dryrun-2026-06-12.csv`, 273 rows), annotated by Ben. It has NOT all been applied, the live Engagement pipeline still shows 78, and the live tag state still shows the blanket tags. A downstream agent must read this CSV (the KEEP cohort), never re-derive the cohort from a `project:contained` tag query (that returns the polluted ~272).

- **REMOVE verdict** = strip `project:contained` + `project:contained-adelaide-2026`, delete the auto-created Engagement opportunity. Applies to the 169 cold-network + most funders reachable via Goods + Harvest members. Including explicit "other-lane" funders Ben marked: AMP, Snow (Ashley Machuca, Carolyn Ludovici, Alexandra Lagelee Kean), QIC (Cat Sullivan, Justin Welfare), Red Dust, Pene Curtis, Sally Grimsley-Ballard, Steph Pearson, Kristen Lark, Sarah Williams, Julalikari, Amelia Clifford, Our Community Shed.
- **KEEP verdict** = eligible for Phase D canon. ~94 KEEP rows. Two KEEP families:
  1. **Funder lane (Ben 2026-06-12 "keep as CONTAINED funder lane"):** Alan White, Fiona Maxwell, Eloise Hall, PRF general + Jonas Kubitscheck + William Frazer, Isabella Stanley, Katie Norman, Matthew Cox, Michael Taylor, Scarlett Steven, Seana Osbourne.
  2. **Org-wall + hot-lead + Adelaide-invite + Diagrama:** all `org-wall:invited` service orgs, all the `contained-hot-lead`/`contained-original-requester` inbound contacts, the `newsletter-stream:contained-adelaide-invite` supporters, the Diagrama five, Just Reinvest, JRI.

"Phase D" = the migration that rewrites these KEEP contacts onto the clean canon. Phase D must read the KEEP-cohort CSV, never the tag query (memory note `project_contained_ghl_pollution_cleanup`).

---

## 7. Capture funnel into GHL (the forward path, for completeness)

- `/contained/register` -> POST `/api/ghl/register` -> writes `event_registrations` + GHL contact/opportunity. Turnstile-protected. Emits canon tags.
- `/contained/eoi` -> POST `/api/ghl/register` with `experience:eoi` -> Adelaide 2026 pipeline at Captured (this is what the 2 test records demonstrate).
- `/contained/register-interest` -> POST `/api/ghl/signup` -> `newsletter_subscriptions` + GHL lead.
- `/contained/nominations` -> `campaign_nominations` table + GHL; upvote leaderboard live.
- All three public forms got a 15s timeout + fail-loud fallback on 13 June (commit 6dc96bb9) after a real submission was lost during the 12 June crawl-saturation outage. Vercel WAF rate-limit on DB-heavy paths now guards recurrence.

---

## 8. Open questions a comms plan must resolve before sending

1. **Workflow env vars unconfirmed.** Whether `GHL_PRE_EVENT_WORKFLOW_ID` and `GHL_WORKFLOW_{FUNDER,MEDIA,ORGANIZATION,SUPPORTER,LIVED_EXPERIENCE}` are set in Vercel prod is [UNVERIFIED]. If unset, role-routed automations silently no-op. Verify before relying on any auto-send.
2. **Adelaide pipeline is empty of real demand** (2 test records). Launch is Tuesday 23 June. Either EOIs have not been driven yet, or the EOI form is not yet promoted. A comms plan that assumes a warm Adelaide booking list is wrong.
3. **Cleanup not yet applied.** A tag-based audience pull today returns the polluted ~272, not the honest ~85. Always source the audience from the KEEP CSV or the live pipeline stage, not from `project:contained`.
4. **Partner/committed reclassification** (Diagrama/JRI/Just Reinvest) proposed in triage but not applied, live still shows 7.
