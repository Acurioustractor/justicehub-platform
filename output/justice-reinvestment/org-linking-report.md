# Justice Reinvestment Org Linking Report

Date: 2026-06-11 · Read-only run against shared Supabase `tednluwflfhxyucgwigh`
Sources: `organizations`, `alma_interventions`, `gs_entities`, `acnc_charities`, `oric_corporations`
Method: name+ABN matching per project rule (link counted only when name match was unambiguous or confirmed by state). No database writes performed.

## Summary

| Outcome | Count | Sites |
|---|---|---|
| Linked (ABN confirmed by name match) | 28 of 34 | all NSW/JRNSW sites, all NT corporations, all QLD sites, SA (Tiraapendi, KNYA), all WA except Carnarvon, ACT (Yeddung Mura), JRNA, Olabud Doogethu |
| No ABN — government body / strategy | 3 | Carnarvon (Gascoyne Development Commission), RR25by25 (ACT Government), National JR Program (Attorney-General's Dept) |
| No ABN — unincorporated / auspiced | 2 | Ceduna JR (unincorporated; gs_entities record without ABN), Justice Reinvestment SA (coalition) |
| Auspiced via parent ABN | 1 | Mampu-Maninjaku / CAYLUS → Tangentyere Council Aboriginal Corporation (ABN 81688672692) |
| Ambiguous site matches | 0 | — |

(28 with ABN + 6 without = 34 sites in `src/data/justice-reinvestment/sites.json`; CAYLUS counted among the 6 without their own ABN, resolved via auspice.)

## Matched (verified name+ABN, all three-way checked where the org appears in multiple registries)

| Site | Org | ABN | ACNC | ORIC ICN | CC flag | Latest revenue (gs) |
|---|---|---|---|---|---|---|
| Bourke (Maranguka) | Maranguka Limited | 82646525135 | Medium, 2020 | — | false | 1,683,464 |
| Moree / Mt Druitt / Nowra / Kempsey | Just Reinvest NSW Inc. | 37751526982 | Large, 2015 | — | false | 3,142,238 |
| Cowra | Cowra Information & Neighbourhood Centre Inc | 37152608106 | Large, 2012 | — | false | 3,468,917 |
| Lajamanu | Kurdiji Aboriginal Corporation | 32494962004 | — | 8941 | true | — |
| Central Australia | Lhere Artepe Aboriginal Corporation RNTBC | 91884217942 | 2012 | 3991 | true | 13,790 |
| Papunya etc. | Ngurratjuta/Pmara Ntjarra Aboriginal Corporation | 79602462309 | 2012 | 414 | true | 50,600 |
| Maningrida | Nja-marleya Cultural Leaders and Justice Group Ltd | 59661706430 | Medium, 2022-08-18 | — | false | 303,810 |
| Groote Eylandt | Anindilyakwa Royalties Aboriginal Corporation | 69806855472 | 2017 | 8394 | true | — |
| Doomadgee | Gunawuna Jungai Limited | 59661831170 | Medium, 2022-08-19 | — | false | 625,000* |
| Cherbourg | Cherbourg Wellbeing Indigenous Corporation | 55414872249 | 2025-09-09 | 9496 | true | — |
| Yarrabah | Gindaja Treatment and Healing Indigenous Corporation | 63659548014 | 2012 | 1025 | true | — |
| Mornington Island | Jika Kangka Gununamanda Limited | 25673816236 | Medium, 2024 | — | false | 625,000* |
| Napranum | Napranum Aboriginal Shire Council (Nanum Wungthim) | 43593215992 | — (council) | — | true | — |
| Port Adelaide | Tiraapendi Wodli Ltd | 53685983831 | 2025-12-03 | — | false | — |
| Murray Bridge (KNYA) | Ngarrindjeri Regional Authority Inc | 50034502372 | 2024-07-01 | — | false | 110,000 |
| Kinchela Boys Home | Kinchela Boys Home Aboriginal Corporation | 57796392152 | Medium, 2014 | 4223 | true | 625,000* |
| Derby | Emama Nguda Aboriginal Corporation | 79796071307 | 2012 | 2127 | true | — |
| Katherine | Savanna Solutions Business Services Pty Ltd | 15642049152 | — (social enterprise) | — | false | — |
| Balga | Ebenezer Aboriginal Corporation | 44535341885 | Medium, 2012 | 7732 | true | 625,000* |
| Perth | Aboriginal Legal Service of Western Australia Limited | 61532930441 | Large, 2012 | — | true | 21,199,791 |
| Newman / Pilbara | Aboriginal Male's Healing Centre SSSFSC Inc. | 53264232140 | Small, 2015 | — | true | 11,273 |
| Perth (coalition) | Social Reinvestment WA Incorporated | 38136101379 | 2024-07-22 | — | false | — |
| Canberra | Yeddung Mura (Good Pathways) Aboriginal Corporation | 79242285117 | 2014 | 8080 | true | — |
| National | Justice Reinvestment Network Australia Limited | 36678640214 | Medium, 2024-06-28 | — | false | 625,000* |
| Halls Creek | Olabud Doogethu Aboriginal Corporation | 47629577245 | — | registered (gs) | true | — |

\* **Data caveat:** `gs_entities.latest_revenue = 625000` recurs across five unrelated entities (Gunawuna Jungai, Jika Kangka, KBHAC, Ebenezer, JRNA). It looks like a charity-size band midpoint, not a reported figure. Treat as banded, not actual.

## Unmatched (no registry entity)

- **Carnarvon JR — Gascoyne Development Commission.** WA state government agency; absent from all three registries. ABN exists in the real ABR but not in our data — would need web sourcing.
- **RR25by25 — ACT Government.** Government strategy, not an entity. Delivery partner Yeddung Mura is matched.
- **National JR Program — Attorney-General's Department.** Commonwealth department; out of registry scope.
- **Ceduna JR.** Unincorporated. `gs_entities` holds a record "Ceduna Justice Reinvestment Initiative" with NULL ABN.
- **Justice Reinvestment SA.** Unincorporated coalition; no ACNC/ABN entity under that name. The incorporated SA-registered peak is JRNA Ltd (ABN 36678640214).
- **CAYLUS (Mampu-Maninjaku).** No own ABN; a program of Tangentyere Council Aboriginal Corporation (ABN 81688672692, ACNC Large, ICN 8280, community-controlled). Linked via auspice.

## Ambiguous / data-quality flags in `organizations` (not site blockers)

1. **Wrong ABN on org row.** `organizations` row "Aboriginal and Torres Strait Islander Wellbeing Services" (id `2847ddd7…`) carries ABN 21132666525, which resolves in ACNC and gs_entities to **Queensland Aboriginal & Torres Strait Islander Child Protection Peak Limited** (QATSICPP). Name mismatch — ABN likely mis-assigned.
2. **Duplicate org rows, same ABN.** "Just Reinvest NSW" (`9de1b435…`) and "Just Reinvest New South Wales (JRNSW)" (`01b85c9d…`) both hold ABN 37751526982. Dedupe candidate; interventions are split across both.
3. **Maranguka duplicates.** "MARANGUKA LIMITED" (`adef8959…`, ABN 82646525135) and ABN-less "Maranguka Justice Reinvestment Project" (`a4a2720d…`) coexist.
4. **Swapped/odd intervention links.** Intervention "Cherbourg Justice Reinvestment Project" is linked to Gindaja (the **Yarrabah** lead); "Groote Eylandt Justice Reinvestment" is linked to "Njamarleya Aboriginal Corporation" (the **Maningrida** lead, itself ABN-less and slightly mis-named vs Nja-marleya Ltd); "Maningrida Justice Reinvestment" is linked to a placeholder org of the same name. These FK links need review.
5. **Bawinanga name variance.** ABN 58572395053: ACNC says "Bawinanga Aboriginal Corporation", gs/ORIC (ICN 29) say "Bawinanga Homelands Aboriginal Corporation". Same ABN, two names across registries — verify before relying on either.
6. **Anindilyakwa Royalties AC state.** Both ACNC and gs record state QLD for ABN 69806855472, but the corporation operates on Groote Eylandt, NT. Registry anomaly, recorded as-is.

## Inter-organisation connections found

- **Just Reinvest NSW hub:** one ABN (37751526982) behind Moree, Mount Druitt, Nowra and Kempsey; partner to Maranguka (Bourke); the DB also links the Cowra JR intervention to JRNSW even though the Commonwealth-funded lead is Cowra Information & Neighbourhood Centre.
- **Twin incorporations:** Gunawuna Jungai Ltd (Doomadgee) and Nja-marleya Ltd (Maningrida) were ACNC-registered one day apart (2022-08-18/19) with near-sequential ABNs — clearly stood up by the same incorporation support process as purpose-built JR vehicles.
- **Spin-outs:** Tiraapendi Wodli Ltd ACNC-registered 2025-12-03 after years hosted by Australian Red Cross Society (the DB still links the Tiraapendi intervention to Red Cross). Olabud Doogethu Aboriginal Corporation now exists separately from its originating auspice, the Shire of Halls Creek.
- **Central Australia cluster:** Lhere Artepe AC + Tangentyere Council AC (CAYLUS auspice) share the Central Australia JR Initiative; Tangentyere also connects the Mampu-Maninjaku site.
- **Dual-registration ring:** ten matched orgs are both ACNC charities and ORIC corporations (cross-keyed by `acnc_charities.oric_icn`): Ebenezer 7732, KBHAC 4223, Gindaja 1025, Ngurratjuta 414, Emama Nguda 2127, Yeddung Mura 8080, Lhere Artepe 3991, Cherbourg Wellbeing 9496, Anindilyakwa Royalties 8394, Tangentyere 8280.
- **Funder-side:** `gs_entities` contains "PRF Justice Reinvestment Portfolio" program entities spanning WA/NSW/NT/QLD/SA — Paul Ramsay Foundation runs a multi-state JR portfolio touching these sites.
- **No board/officer data exists** in any of the four tables (checked information_schema), so `board_links` is empty everywhere — person-level links would need ACNC Responsible People or ORIC officer extracts, which we do not hold.

## Proposed `organizations` updates (NOT applied — review first)

`organizations.abn` exists and is NULL for several matched orgs:

```sql
-- Savanna Solutions (Katherine JR lead)
UPDATE organizations SET abn = '15642049152' WHERE id = '4391bb43-f3b8-4fe3-bd7f-506447cac974' AND abn IS NULL;

-- Tiraapendi Wodli (now incorporated)
UPDATE organizations SET abn = '53685983831' WHERE id = '673d4b2d-8ab7-4ad4-8bb5-d8c07d13ea91' AND abn IS NULL;

-- Njamarleya Aboriginal Corporation row (note: legal name is Nja-marleya Cultural Leaders and Justice Group Ltd; also re-point its intervention link from Groote Eylandt to Maningrida — see flag 4)
UPDATE organizations SET abn = '59661706430' WHERE id = '894c005a-00c6-48ef-85ff-dfad49ed8b68' AND abn IS NULL;
```

Flagged for correction (needs human confirmation, do not run blind):

```sql
-- ABN 21132666525 belongs to QATSICPP, not ATSI Wellbeing Services (flag 1)
-- UPDATE organizations SET abn = NULL WHERE id = '2847ddd7-7c6d-4e0c-ba0a-ac49dd2ef4ff';
```

Intervention FK repairs (flag 4) are a separate, human-reviewed exercise — they change which org "owns" a site on public surfaces.
