# Justice Matrix: UI gap list, design plan, and what the scrape work taught us

**Companion to:** `NJP-OHCHR-matrix-status-brief.md`
**Written:** 28 May 2026
**Frame:** the pipeline now genuinely runs end to end. The next leverage is the human side: the curator who turns raw discoveries into trusted records, and the practitioner who reuses them. This doc maps what is already built, where the gaps are, and a priority order for the UI work, with the scraping lessons folded in at the end.

## What I walked

**Public preview** at `/preview/justice-matrix` (password-gated):
- Five tabs: Overview, Global Map, Cases (98), Campaigns (60), Insights.
- Overview is the OHCHR pitch page: badge, stats (100/60/13/48-favorable), four-capability grid, technical architecture, ten-month timeline. Backed by real data.
- Global Map is a Leaflet world map with colour-coded markers (favorable green, adverse red, pending grey), circles for cases, triangles for campaigns, sized by precedent strength. Working legend.
- Cases tab is a flat unpaginated list of 98 rows. Each card carries jurisdiction chip, year, region, outcome chip, precedent-strength chip, case title, court, strategic issue, category tags, and a "View Source" outbound link.
- Search is one free-text box across citation, jurisdiction and issue, plus a "All Regions" select.
- Visual language is generic dashboard blue gradient. Nothing of the JusticeHub house style (Cormorant Garamond, cream `#f8f1e6`, deep purple hero, warm gold kicker) is present.

**Admin discoveries** at `/admin/justice-matrix/discoveries` (code-read, not screenshot-walked because it requires admin auth):
- 451 lines. State filters by status (`pending` / `approved` / `rejected`) plus item-type and a search box.
- Discoveries render as expandable rows; one-click `approve` / `reject` / `duplicate` actions hit the API.
- The empty-state for the pending tab still says "Run `/ralph-matrix-scan` to discover new items" — a command that does not exist. Code drift versus the real scanner I built.

## The shape of the experience — three audiences

1. **Practitioner.** A lawyer, NGO researcher, or advocate looking for a precedent or campaign playbook they can adapt. They want to find a case, understand it fast, see what was tried elsewhere, and grab the documents.
2. **Curator / reviewer.** The editorial role in the NJP paper. Triages discoveries fast, judges fit, edits metadata, approves into the matrix. Throughput here equals trust.
3. **Scanner author / partner.** Adds and tunes sources, watches health, contributes via the partner portal. Smallest audience, largest leverage.

The current build serves the practitioner thinly, the curator very thinly, and the scanner author not at all (config is code, not UI).

## Gap list, in honest priority order

### Reviewer / curator (the trust machine)
- Empty-state copy references a command that does not exist (`/ralph-matrix-scan`). Replace with a real "Run scan" button or an honest "Scheduled scans run nightly" line.
- No view of the source row alongside the discovery — the reviewer cannot see whose page this came from without leaving.
- No view of the *potential duplicate* alongside the candidate. The DB has `potential_duplicate_id` and `similarity_score`; the UI does not surface them.
- One-click approve passes raw extracted fields straight through. There is no inline edit form, so a typo or a missing year stays in the published record.
- No bulk actions. With the scanner running, the queue will routinely have 20 to 50 items; per-item click is the wrong tempo.
- Provenance is hidden: source, scanner, model, confidence, `discovered_at` all live in `raw_data` jsonb but are not rendered.
- "Reviewed by" defaults to `'admin'` (string literal, not the real user). Audit trail is weak.

### Practitioner (the value delivery)
- Cases tab is an unpaginated wall of 98 rows. It will not scale to 1,000.
- Search is a single free-text field over three columns. The matrix now carries clean category tags (the refugee / asylum domain pass), `outcome`, `precedent_strength`, `featured`, year, country — none of these are filter facets.
- Cards are not clickable to a detail view, even though `selectedCase` state exists in the code. The only outbound is "View Source," so the matrix functions as a redirect, not a destination.
- No case / campaign profile page. The atomic unit of value has no home.
- No "similar cases" link, no "campaigns on this issue" link. Cross-references that would make the matrix a *connection* tool rather than a list are absent.
- No copy-citation button, no export, no permalink to a single case (despite the v2 paper proposing CSV/JSON export).
- The Insights tab exists in nav but I have not seen what it does. (To audit on the next pass.)

### Visual / brand
- The whole preview lives in a dashboard-blue / white aesthetic. JusticeHub's brand is editorial / warm (Cormorant Garamond, cream `#f8f1e6`, deep purple `#4a2560` hero, warm gold `#8d6a44` kicker). The preview was probably built fast before that lock-in. Whole experience needs a design pass.
- No photography. The CLAUDE.md photo rule (real photos only, no AI-photoreal) leaves room for editorial portrait images on case profiles where lawful and consented, but currently there is none.

### Scanner / pipeline ops
- No UI surface for source health. `last_scraped_at`, `last_error`, `total_items_found`, `success_rate` all exist on `justice_matrix_sources`, none are rendered.
- No way to add or edit a source from the UI. Adding a source is currently a SQL `INSERT`.
- No scheduled run. The scanner is invoked by hand. The pattern exists in the repo (Vercel crons for ALMA, civic, data-sufficiency) but there is no `cron/justice-matrix` route.

## UI plan, priority order

**P1. Reviewer queue v2.** The first thing built, because it is the throat through which all trust passes.
- Split layout: list on the left, detail on the right. Click a discovery, the right pane shows the candidate, the source row, the potential duplicate (if any), the `raw_data` extracted blob, and an inline edit form for the fields that will become the published row.
- Action bar in the detail: Approve, Approve with Edits, Reject (with reason), Mark Duplicate (linked to the duplicate id).
- Bulk actions on the list: select N rows, reject with one reason.
- Provenance shown: source name, scanner, model, confidence, discovered-at, with a clickable link to the source URL.
- Replace the `/ralph-matrix-scan` empty-state copy with truth ("Scheduled nightly. Last scan: X. Next scan: Y. Sources: N active, M failing.").
- Reviewer identity from the real auth session, not the string `'admin'`.

**P2. Case profile page** at `/justice-matrix/cases/[id]`. The atomic unit of value.
- Citation, jurisdiction, court, year, outcome, precedent strength, status banner.
- Holding (rendered), strategic issue, key categories as filter chips.
- Source link, related pleadings and documents (placeholder for now), copy-citation button, permalink.
- "Similar cases" panel: same-issue cases (use the categories array and the `idx_cases_fts` index already present), other cases in the same jurisdiction.
- "Linked campaigns" panel: campaigns tagged with overlapping categories.
- Provenance and verification block at the bottom (verified by / when, contributor org, source).

**P3. Faceted search and list view.**
- Use the cleaned category tags as filters (the refugee / asylum domain tag now works as a chip). Add facets for outcome, precedent strength, year range, country.
- Paginate at 20 per page. Show counts under each facet.
- Save and share a filter set via URL query params.
- Apply the same pattern to campaigns.

**P4. House-style design pass.** Apply the JusticeHub aesthetic from DESIGN.md across the preview and admin pages: typography, palette, the warm institutional voice. Run the brand voice rules over the copy (no em dash, no AI-tells, names over abstractions).

**P5. Map enhancements.**
- Marker clustering so 100 to 1,000 markers stay legible.
- Marker layer toggles already exist (cases / campaigns); add a layer toggle for the refugee / asylum domain filter so an OHCHR visitor opens on their corpus.
- Click a marker, open the case or campaign profile in a side sheet.

**P6. Source health and partner-portal stubs.**
- `/admin/justice-matrix/sources`: list with health columns (last scraped, last error, total found, success rate, next due).
- "Run now" button per source (calls the scanner).
- Add-source form (the columns are already in the schema).
- A future partner-contribution route that lets the law-firm / clinic roster the proposal describes submit cases and campaigns directly.

## What the scraping work taught us, in product terms

1. **The matrix was 90 percent scaffolded and 0 percent wired.** Tables, queue, preview, seed data, even a skill spec all existed; the runner connecting sources to the queue did not. The same gap may exist in other parts of this codebase. Assume "spec without runner" as a default risk.

2. **Sources are not uniform. They fall into four scraping classes.** Static HTML (APRRN, gov sites) goes Playwright plus LLM. Search portals (BAILII, CourtListener) need the right URL, not the homepage, then HTML plus LLM. SPA with a clean API (CJEU InfoCuria) takes a direct API adapter, no browser, no LLM. SPA with no API (OHCHR Blazor / SignalR) is effectively unscrapeable without brittle full-browser interaction. So we need **different strategies per source class, dispatched by an adapter field**, not different tools. The scanner now supports this; the next adapters worth building are a generic JSON-API adapter (config-driven so a new API source is a row, not a deploy) and a sitemap / RSS adapter.

3. **The right URL matters more than the scraper.** CourtListener went from zero to 14 cases just by pointing at a refugee-filtered search URL instead of the homepage. Source URLs should be curated query / listing URLs, not domains.

4. **Fetch reliability is per-site whack-a-mole, but converges fast.** networkidle hangs on some, domcontentloaded races on others. Two targeted fixes (domcontentloaded plus a redirect retry) now cover the common cases.

5. **Extraction quality depends on signal in the source.** Rich HTML or an API with subject-matter labels (CJEU's `matCode`) gives clean items. A homepage with no case list gives garbage no matter how good the LLM. Curate inputs.

6. **The strategic position is strong.** The NJP / OHCHR proposal asked for what already runs. The work now is breadth (more sources, more domains) and depth (UI, throughput, trust), not core build.

## Recommended next concrete step

Build the **Reviewer queue v2** (P1) first. It is the throat of the trust machine. Until it exists, scanner improvements add raw items faster than the human side can convert them into trusted records, and the matrix gets less trustworthy as it gets bigger. Designing it well also clarifies what the case / campaign profile (P2) has to support, because the curator and the practitioner read the same record from opposite sides.

If P1 feels too internal as the next visible step, the alternative is P2 (case profile), which is the most user-facing and the most reusable atom. Either is defensible. P1 has higher long-term leverage; P2 has higher short-term shine.
