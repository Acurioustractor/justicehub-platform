# ABN Duplicate Consolidation — Design Doc

**Status**: Draft (no --apply path yet)
**Owner**: Civic Connectors
**Last updated**: 2026-05-23

## Problem

`organizations` has 95,656 distinct ABNs spread across 101,000+ rows. About 5,344
extra rows live inside 5,319 ABN groups with size > 1. The user's framing
was 5,513 dupes / 42,319 funded orgs / 36,806 distinct funded ABNs — same
shape, different slice. The point stands: many ABNs map to multiple `organizations` rows.

`justice_funding` joins to orgs via ABN string, not FK, so funding analytics
double-count when the same ABN appears as N rows. Hub claims, classifications,
and ALMA interventions pointed at the wrong row of a dup group also fragment
the truth about an organisation.

## Critical finding — not every "duplicate" is a duplicate

Probing the data with a normalised-name signature inside each ABN group:

- **4,908 same-name groups** (~92%) — slug/name variants of the same org.
  Example: ABN 11746358763 has "Youth Advocacy Centre", "Youth Advocacy Centre Inc",
  "Youth Advocacy Centre (YAC)". These are genuine duplicates, safe to merge.
- **583 mixed-name groups** (~11%) — one ABN, many distinct programs.
  Example: ABN 58009666193 (PCYC Queensland) has 14 rows: "Mt Gravatt PCYC",
  "PCYC Hervey Bay", "Dalby YAP", "Doomadgee Youth Support Service",
  "Connect Program", etc. These are **NOT duplicates**. They are the user's
  curated program-level records under a shared parent ABN.

**The dedup script must never auto-merge mixed-name groups.** Doing so would
flatten ALMA interventions and lose the program-level structure the
intervention catalogue depends on.

## The five design questions

### Q1: What is the canonical-org rule?

For same-name groups, score each row and keep the highest:

```
score =
    (has_claim ? 1000 : 0)              // human claim wins everything
  + (has_civic_classification ? 500 : 0)// confirmed sector wins next
  + (has_logo ? 100 : 0)                // enrichment artefacts
  + (has_email ? 50 : 0)
  + (has_history_summary ? 30 : 0)
  + (has_last_synced_at ? 20 : 0)
  + (profile_completeness_score * 10)   // 0.0–9.9
  + (older created_at? +5 : 0)          // tiebreaker, oldest first
```

Reasoning:
- Human edits beat machine enrichment, always.
- Civic classifications (tier-1 confirmations) are the most expensive
  semantic work in the system, so they pull strongly.
- Logo, email, history_summary are the artefacts the LLM-enrichment loop
  pays for in real money. Preserving them matters.
- `profile_completeness_score` is a noisy proxy but useful as a tiebreaker.
- `created_at` last — provenance only matters when everything else is equal.

For mixed-name groups: **the script flags them and exits without merging**.
A separate human review path (admin UI or per-group decision) handles those.

### Q2: How do FK references move safely from duplicate → canonical?

In dependency order, with unique-constraint handling per table:

| Table | Column | Action | Conflict rule |
|---|---|---|---|
| `alma_interventions` | `operating_organization_id` | UPDATE to canonical | No unique constraint on org_id — direct update |
| `civic_org_classifications` | `organization_id` | MERGE rows | Unique per org_id; if canonical already has one, **drop the duplicate row** and audit-log the loss |
| `organization_claims` | `organization_id` | UPDATE to canonical | Multiple claims per org allowed; safe |
| `organizations_profiles` | `organization_id` | MERGE rows | Unique per org_id; if canonical has profile, **merge JSON fields** preferring canonical's non-null values |
| `partner_photos` | `organization_id` | UPDATE to canonical | No unique constraint |
| `partner_videos` | `organization_id` | UPDATE to canonical | No unique constraint |
| `stories` | `organization_id` | UPDATE to canonical | No unique constraint |
| `projects` | `organization_id` | UPDATE to canonical | No unique constraint |
| `organization_members` | `organization_id` | UPDATE to canonical | Compound unique on (user, org) possible — dedup on conflict |
| `org_grants` | `organization_id` | UPDATE to canonical | No unique constraint |
| `media_items` | `organization_ids` (UUID[]) | REWRITE array: replace dup id with canonical id, dedup | Array operation, not row update |

**Not a FK** (these reference orgs by ABN string, not UUID):
- `justice_funding` — joins via ABN. Once dup org rows are archived, the
  `is_active=true` + `archived=false` filter that fronted queries already
  collapse to one row per ABN.
- `alma_evidence` — has only a TEXT column `organization` (free text name),
  not a UUID FK. Untouched.

**Unknown FKs that COULD exist** (probed empty tables, can't confirm cardinality):
- `youth_services`, `enrichment_runs`, `org_enrichment_history`,
  `organization_basecamps`, `basecamp_applications`, `gigs`, `programs`,
  `org_outreach_log`, `alma_outreach_queue`.
- The script must dynamically probe for any column matching
  `/^(organization_id|operating_organization_id|org_id)$/` across the
  public schema before applying. If a table is found with non-zero rows
  pointing at a dup, the script **stops** and reports the missed table.

### Q3: Archive or delete the duplicate row?

**Archive, never delete.** Use the existing `organizations.archived` column
(already true/false in the schema). Set:

```
archived = true
verification_status = 'merged_duplicate'
acnc_data.merge_meta = {
  merged_into: <canonical_uuid>,
  merged_at: <iso_ts>,
  merge_reason: 'abn_dedup',
  fk_migrations: { table: count, ... }
}
slug = '<old-slug>-archived-<short-uuid>'   // free up the slug
```

Why archive:
- Reversible if we get the canonical choice wrong.
- Preserves the row id for any external system that still points at it
  (e.g. a stale link in a Notion doc, a screenshot in a funder email).
- A future FK we missed today fails loudly with a constraint violation
  rather than silently dropping a row.

Querying code that already filters on `archived = false` keeps the
archived rows invisible without code changes.

### Q4: Idempotency / re-runnability

The script is safe to re-run because:

1. Each run scans for ABN groups with > 1 `archived = false` row. Once
   archived, a duplicate no longer counts.
2. Canonical pick is deterministic on a given DB snapshot — same scoring
   on the same data picks the same canonical row.
3. The audit table (see Q5) is keyed on `(merged_org_id, canonical_org_id)`
   so re-merging an already-merged row is a no-op.
4. New duplicates appearing later (e.g. fresh ACNC import) get caught on
   the next run with no manual intervention.

### Q5: Audit trail

Create a dedicated table:

```sql
CREATE TABLE IF NOT EXISTS organization_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merged_org_id uuid NOT NULL UNIQUE,        -- the archived dup
  canonical_org_id uuid NOT NULL,            -- where it points now
  merged_at timestamptz NOT NULL DEFAULT now(),
  merge_reason text NOT NULL,                -- 'abn_dedup'
  abn text,
  merged_org_name text,
  canonical_org_name text,
  fk_migrations jsonb NOT NULL,              -- { alma_interventions: 14, civic_org_classifications: 1, ... }
  dropped_rows jsonb,                        -- rows lost to unique conflicts, captured
  notes text,
  CONSTRAINT no_self_merge CHECK (merged_org_id != canonical_org_id)
);
CREATE INDEX organization_merges_canonical_idx ON organization_merges (canonical_org_id);
CREATE INDEX organization_merges_abn_idx ON organization_merges (abn);
```

The UNIQUE on `merged_org_id` enforces idempotency at the DB level.

A `dropped_rows` column captures any conflict-evicted records (e.g. a
`civic_org_classifications` row that couldn't merge because the canonical
already had one) so we can reconstruct what was lost if a manual override
becomes necessary.

`acnc_data.merge_meta` on the archived row is the second source — kept on
the org itself so a single-row read tells you the full story.

## Out of scope (deliberately)

- **Cross-ABN dedup** (same org, two different ABNs — old ABN vs new ABN
  after a re-registration). Needs name+address matching, not just ABN.
  Separate problem.
- **Mixed-name group resolution**. Needs a human reviewer or an LLM
  classifier deciding which programs belong to which parent. Not v1.
- **Re-pointing `justice_funding` ABN string joins**. Because
  funding doesn't FK to org id, dedup'ing org rows already fixes the
  double-counting in queries that filter `archived = false`. No backfill
  needed.

## Phased rollout

**Phase 1 (this deliverable)**: dry-run script + design doc. No writes.
Operator runs against single ABN to validate canonical pick, then runs
across all to see the scale.

**Phase 2**: `--apply` path gated on a confirmation flag. Adds
`organization_merges` migration. Processes one ABN at a time inside a
transaction; rollback on first conflict. Hardcoded cap of 50 merges per
run while we build confidence.

**Phase 3**: Lift the per-run cap. Add a nightly cron that catches new
dupes. Build admin UI for mixed-name group review.

**Phase 4**: Tackle cross-ABN dedup with name+address signatures.

## Risk register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Auto-merge a mixed-name group | High without filter | Severe — destroys ALMA programs | Same-name signature filter; mixed groups flagged, never merged in v1 |
| Hidden FK table missed | Medium | High — orphaned rows after archive | Schema probe on every run; stop if unknown FK column found pointing at dup |
| Canonical pick is wrong | Medium | Medium — manual fix needed | Archive (not delete) means reversible; audit table records both ids |
| Lost enrichment data on non-canonical | Medium | Medium | Scoring rule biases toward rows with logos/emails/history; `acnc_data.merge_meta` keeps the breadcrumb |
| Race condition during apply | Low (single-runner) | Medium — partial merge | Wrap each ABN group's mutations in a transaction in Phase 2 |
| Civic classification conflict | Common in dups | Low — clean rule | Canonical's classification wins; drop the dup's class row, record in `dropped_rows` |
| Slug uniqueness collision after archive rename | Low | Low — slug becomes `<old>-archived-<uuid8>` | Suffix collisions vanishingly unlikely; add retry-with-fresh-uuid if it happens |

## Success criteria

1. Dry-run script identifies the 4,908 same-name groups and the 583
   mixed-name groups correctly.
2. For each same-name group, produces a canonical pick and a row-level
   migration plan (which FKs would move, which rows would archive).
3. Mixed-name groups print as `FLAG_FOR_REVIEW` with no merge proposal.
4. Sample run on a single ABN matches a human reviewer's intuition for
   which row is the keeper.
5. Phase 2 apply path produces zero orphaned FK rows when run against a
   staging snapshot.

## Open questions (defer to Phase 2)

- Should `organization_claims` UPDATE actually merge claim metadata
  (e.g. role_at_org)? For v1, assume no — each claim is independent.
- Should we re-run `profile_completeness_score` on the canonical after
  merge? Yes, but separate cron — not in the merge transaction.
- Notification policy: do claimants need to know their claim was moved?
  Probably yes for Phase 3, not Phase 2.

