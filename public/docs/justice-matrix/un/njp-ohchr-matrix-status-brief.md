# Justice Matrix: the engine already runs

**For:** the NJP / OHCHR (Bangkok) Justice Matrix conversation
**Prepared:** 28 May 2026
**Companion doc:** `NJP-OHCHR-matrix-ui-plan.md` (gap list, UI plan, scraping lessons)
**One line:** The background paper proposes building a Global Strategic Litigation and Advocacy Clearing House over ten months. JusticeHub already runs one. The work in front of us is content and curation, not construction.

## What the proposal asks for, and where it already lives

The October 2025 background paper describes a clearing house that maps, classifies, and connects strategic litigation and advocacy campaigns across jurisdictions, fed by an AI search stream and partner contributions, kept current through a light editorial workflow. That system exists today inside JusticeHub. It was built in January 2026 and has been running and growing since.

| Proposal (Oct 2025) | Live in JusticeHub today | State |
|---|---|---|
| Strategic Cases Matrix (Annex A) | `justice_matrix_cases` + faceted API | 100 cases |
| Advocacy Campaigns Matrix (Annex B) | `justice_matrix_campaigns` + API | 60 campaigns |
| AI search stream (scheduled crawls of courts, NGOs, media) | `justice_matrix_sources` + scrape logs | 40 sources configured |
| Editorial workflow: ingest, triage, normalise, publish | `/admin/justice-matrix/discoveries` review queue | 19 items pending review |
| Public site, faceted search, case and campaign profiles, CSV/JSON export | `/preview/justice-matrix` | Built, password-gated preview |
| Multi-stakeholder curation | Admin console + partner contribution source field | Built |

The public preview already carries the proposal's own framing: an OHCHR partnership header, the jurisdictions named in the paper (US, UK, Canada, Australia, SE Asia, Pacific), the four capabilities (Analyse and Compare, Reusable Playbooks, Coordinate Campaigns, Track Impact), the three-part architecture (AI Content Streams, Partner Contributions, Data Platform), and the paper's Month 0 to Month 10 timeline.

## The refugee and asylum content was already in

The two spreadsheets annexed to the paper hold 12 strategic cases and 10 advocacy campaigns. Every one of those 22 rows was already seeded in the live database. A seeding pass on 28 May 2026 confirmed this: an attempt to add the two cases that looked missing (N.S. v SSHD and Ilias and Ahmed v Hungary) found both already present under slightly different citation strings, so the two stub rows that pass created were removed. The annexes (AAA v SSHD on Rwanda, M.S.S. v Belgium and Greece, Hirsi Jamaa, Sale, Singh, Ruta, Lawyers for Human Rights, Plaintiff M70, and all ten campaigns from #KidsOffNauru through the Safe Third Country Agreement work) are all in the matrix today.

## The refugee corpus now filters as one set

The refugee and asylum entries had been tagged by sub-topic (pushbacks, non-refoulement, offshore processing, Dublin transfers) rather than under a single domain label, so a visitor could not pull the whole refugee corpus in one click. That has been fixed. On 28 May 2026 a domain-tagging pass added `refugee` and `asylum` labels to every refugee and asylum entry while keeping their sub-topic tags. The matrix now answers a single-click filter:

- 13 strategic cases tagged refugee or asylum (UK, EU and CJEU, ECtHR, US, Canada, South Africa, Malta, Australia)
- 11 advocacy campaigns tagged refugee or asylum (Australia, UK, US, Canada, Malaysia, pan-European and global)

Australian youth justice entries that mention detention were deliberately left out of the refugee tag so the two corpora stay distinct.

## What the ten-month plan collapses to

Because the infrastructure is live and already discovering and triaging items on its own, the proposal's timeline becomes a short list rather than a programme:

1. Tag the existing refugee and asylum corpus under a shared domain label. Done 28 May 2026.
2. Point refugee-specific sources into the existing scrape pipeline. Done 28 May 2026. Added as active weekly sources: UNHCR Refworld (global), the European Database of Asylum Law / EDAL (Europe), CJEU Curia (the EU asylum acquis), BAILII (UK and Ireland), AustLII (Australia), CourtListener (US federal courts), and the Asia Pacific Refugee Rights Network / APRRN (the SE Asia regional focus, Bangkok secretariat). With the already-configured ECtHR HUDOC and OHCHR UN Treaty Bodies database, every primary source named in the proposal is now live in the pipeline.
3. Re-skin the public view for the OHCHR audience and open the partner contribution portal to the pilot roster.

The honest headline for the conversation: when NJP or OHCHR ask whether this can be built, the answer is that it already runs, it already holds their cases and campaigns, and it is already pulling in new material every week.

---

### Provenance

- Case and campaign counts queried directly from Supabase project `tednluwflfhxyucgwigh`, tables `justice_matrix_cases`, `justice_matrix_campaigns`, `justice_matrix_sources`, `justice_matrix_discovered`, on 28 May 2026.
- Final counts after the pass: 98 cases, 60 campaigns. 13 cases and 11 campaigns now carry the `refugee` and `asylum` domain tags.
- Domain-tagging pass 28 May 2026: appended `refugee` and `asylum` to the categories array of refugee and asylum entries, deduped, sub-topic tags preserved. Two stub rows created during the seeding attempt (variant citations of N.S. v SSHD and Ilias and Ahmed) were deleted once identified as duplicates of existing canonical rows; no `njp_matrix_paper` rows remain.
- Source material: `Justice_Matrix_Background_Paper 1.docx`, `Strategic_refugee_asylum_cases___matrix.xlsx`, `Advocacy_campaigns_for_refugees_asylum_seekers___matrix.xlsx`.
- Scanner: the discover-and-extract step (active sources to fetch to LLM extract to review queue) was specced but never built. Implemented 28 May 2026 as `scripts/scan-justice-matrix.ts` (Playwright fetch, Anthropic extraction, Zod-validated against `JusticeMatrixDiscoveryResponseSchema` in `src/lib/ai/llm-schemas.ts`, dedupe, stage to `justice_matrix_discovered` as pending). It stages for human review only; nothing publishes to the live matrix without an admin approving it. Runs so far: APRRN staged 4 refugee advocacy items; a sweep of all seven court databases staged 9 case candidates (HUDOC 2, AustLII 3, Inter-American Court 4). All seven now fetch cleanly after two fetch-engine fixes (domcontentloaded instead of networkidle for AustLII; a redirect retry for BAILII). Portal-URL refinement 28 May 2026: the four court portals were repointed from their homepages to refugee-filtered listings. CourtListener (asylum opinion search) and BAILII (UK Upper Tribunal Immigration and Asylum Chamber, current year) now yield results and staged 5 case candidates each. CJEU Curia and the OHCHR UN Treaty Bodies database are JavaScript search applications that render results client-side from an API, so a plain fetch cannot reach them; they need either in-scanner form interaction or direct API integration, which is the next build step. EU and ECtHR asylum jurisprudence is meanwhile covered by HUDOC and EDAL. Review queue at `/admin/justice-matrix/discoveries`.
- Feature code: `src/app/preview/justice-matrix/`, `src/app/admin/justice-matrix/`, `src/app/api/justice-matrix/`, migrations `supabase/migrations/20260122_justice_matrix.sql` and `20260123000002_justice_matrix_sources.sql`.
