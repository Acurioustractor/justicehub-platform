# Funding Operating System Core

## Purpose

This schema turns JusticeHub from a passive grant directory into a funding operating system that:

1. Finds money across government and philanthropy
2. Maps that money to the real capability of community organizations
3. Tracks public spending and awards against actual outcomes
4. Reports outcomes back to community first
5. Gives agents the data model they need to automate discovery, matching, and reporting

The implementation is in:

- [20260228000001_funding_operating_system_core.sql](../../supabase/migrations/20260228000001_funding_operating_system_core.sql)

## What This Adds

### 1) Canonical funder and program model

- `funding_sources`
- `funding_programs`

These normalize the upstream side of the system:

- government departments
- philanthropic foundations
- pooled funds
- budget lines
- grant programs

This is the layer that shifts the platform from “here are opportunities” to “here is where the money actually sits.”

### 2) Public spending ledger

- `public_spending_transactions`
- `funding_awards`

This is the core accountability layer:

- appropriations
- allocations
- disbursements
- grant payments
- contract payments
- reconciliations

It creates a direct line from a funding program to real money moving to a real organization.

### 3) Organization discovery and readiness

- `organization_capability_profiles`
- `organization_capability_signals`

This inverts the current burden:

- organizations maintain a live capability profile
- funders can discover qualified organizations
- agents can score readiness and explain why an organization is a fit

This is the structural shift away from constant pleading and toward proactive discovery of community capacity.

### 4) Outcome ledger with community validation

- `community_outcome_definitions`
- `funding_outcome_commitments`
- `funding_outcome_updates`
- `community_outcome_validations`

This flips reporting accountability:

- outcomes are defined in community terms
- commitments attach to actual awards
- updates track progress over time
- community members, boards, Elders, participants, and evaluators can validate or contest the record

This prevents the system from becoming a funder-only reporting machine.

### 5) Agent workflow layer

- `funding_agent_workflows`
- `funding_match_recommendations`
- `calculate_funding_match_score(opportunity_id, organization_id)`
- `v_agentic_funding_queue`

This is the operational base for agents to:

- ingest sources
- enrich opportunities
- refresh org profiles
- run matching
- reconcile awards
- generate community reports

The match score is explainable and built from:

- focus-area overlap
- geographic fit
- funding readiness
- delivery confidence
- community trust
- reporting-to-community strength
- eligibility basics like ABN and DGR

### 6) Public accountability view

- `v_funding_award_community_accountability`

This gives the site a public-facing line of sight from:

- source
- program
- award
- tracked spend
- outcome commitments
- outcome updates
- community validations

That is the foundation for tracking government spending against community outcomes.

## Why This Is On-Mission

This schema is directly aligned with the core product outcomes:

1. `Find all opportunities`
   - existing `alma_funding_opportunities` remains the intake layer
   - new `funding_sources` and `funding_programs` become the canonical layer

2. `Help funders find community organizations`
   - `organization_capability_profiles`
   - `organization_capability_signals`
   - `funding_match_recommendations`

3. `Track spending against outcomes`
   - `public_spending_transactions`
   - `funding_awards`
   - `funding_outcome_commitments`
   - `funding_outcome_updates`
   - `community_outcome_validations`

4. `Keep community accountable to itself first, not only to funders`
   - `community_outcome_definitions`
   - `community_outcome_validations`
   - `community_governance_required`
   - `community_reporting_required`

5. `Support agentic workflow`
   - `funding_agent_workflows`
   - `v_agentic_funding_queue`
   - `calculate_funding_match_score`

## What This Does Not Do Yet

This is the schema foundation. It does not yet implement:

- scraper jobs that populate the new tables
- UI for capability profile editing
- automatic match generation into `funding_match_recommendations`
- community-facing dashboards on top of the accountability view
- policy-specific score tuning for different funders

Those are the next product layers, but they now have a stable data model to build on.

## Initial Admin API Surface

The first operational API layer is now in place:

- `POST /api/admin/funding/os/ingest`
  - ingests live `alma_funding_opportunities` into canonical `funding_sources` and `funding_programs`
  - creates a `funding_agent_workflows` record for traceability

- `GET /api/admin/funding/os/matches`
  - lists persisted `funding_match_recommendations`

- `POST /api/admin/funding/os/matches`
  - evaluates live opportunities against `organization_capability_profiles`
  - calls `calculate_funding_match_score`
  - upserts explainable recommendations into `funding_match_recommendations`
  - records a matching workflow in `funding_agent_workflows`

- `POST /api/admin/funding/os/matches/promote`
  - promotes a recommendation into the active pipeline
  - creates or reuses an `alma_funding_applications` record
  - creates or reuses a `funding_awards` placeholder with `award_status='recommended'`
  - updates the recommendation status to `engaged`

- `POST /api/admin/funding/os/matches/status`
  - updates a recommendation status directly from the admin pipeline board
  - supports lightweight progression such as `candidate -> engaged` without forcing a promotion

- `POST /api/admin/funding/os/matches/rescore`
  - re-runs the matching engine for a single recommendation pair
  - refreshes the score without re-running the full batch

- `GET /api/admin/funding/os/capability-profiles`
  - lists capability profiles, optional signals, and linked organization metadata

- `POST /api/admin/funding/os/capability-profiles`
- `PUT /api/admin/funding/os/capability-profiles`
  - creates or updates an `organization_capability_profiles` record
  - optionally replaces `organization_capability_signals` in the same request
  - records an `org_profile_refresh` workflow in `funding_agent_workflows`

- `DELETE /api/admin/funding/os/capability-profiles`
  - deletes a capability profile by `id` or `organizationId`
  - cascades its signals

- `POST /api/admin/funding/os/capability-profiles/seed`
  - seeds baseline capability profiles from existing `organizations` records
  - intended to bootstrap the matcher with real starting data
  - records an `org_profile_refresh` workflow

- `POST /api/admin/funding/os/capability-profiles/basecamps/refresh`
  - refreshes basecamp capability profiles using:
    - `organizations`
    - `organizations_profiles`
    - `public_profiles`
    - `justicehub_nodes`
  - strengthens connector-aware scoring for the most important anchor organizations
  - boosts trust, reporting, governance, and delivery signals using visible people-and-node relationships

- `POST /api/admin/funding/os/bootstrap`
  - runs the initial operating-system bootstrap in order:
    1. capability seed
    2. basecamp connector refresh
    3. funding ingest
    4. matching
  - returns the result of each stage in a single response
  - gives admins one call to turn the current organization and funding data into first-pass recommendations

- `GET /api/admin/funding/os/pipeline`
  - returns a board-oriented pipeline view grouped into:
    1. candidate
    2. engaged
    3. application
    4. award
  - hydrates recommendations with organization, opportunity, application, and award context for operational review

- `GET /api/funding/accountability`
  - exposes the public accountability ledger built on `v_funding_award_community_accountability`
  - returns award, spend, reporting, and community-validation signals for public/community-facing review

- `GET /api/funding/accountability/awards/:fundingAwardId`
  - returns the public evidence trail for one funding award
  - expands the award into linked commitments, all recorded outcome updates, community validations, and tracked public spending transactions

- `GET /api/funding/accountability/commitments/:commitmentId`
  - returns the public evidence trail for one specific outcome commitment
  - keeps the linked award and spending context while narrowing the view to a single promise and its reporting history

- `POST /api/admin/funding/os/outcome-updates`
  - writes a progress, milestone, final, or correction update against a `funding_outcome_commitments` record
  - updates the commitment `current_value` when a new reported value is supplied
  - records a `community_report` workflow for traceability

- `POST /api/admin/funding/os/community-validations`
  - records a community validation against a specific `funding_outcome_updates` record
  - captures validator kind, trust rating, impact rating, and validation status
  - records a `community_report` workflow for traceability

- `GET /api/admin/funding/os/outcome-commitments`
  - lists live outcome commitments with linked organization, award, and outcome definition context
  - hydrates the latest update plus validation count so admins can choose where to report next

- `GET /api/admin/funding/os/outcome-commitments/reference`
  - returns funding award and outcome definition options for commitment setup in the admin UI

- `POST /api/admin/funding/os/outcome-commitments`
- `PUT /api/admin/funding/os/outcome-commitments`
  - creates or updates a `funding_outcome_commitments` record
  - derives the reporting organization from the selected award when needed
  - reuses the existing commitment when the same award/outcome pair already exists

- `GET /api/admin/funding/os/outcome-definitions`
- `POST /api/admin/funding/os/outcome-definitions`
- `PUT /api/admin/funding/os/outcome-definitions`
- `DELETE /api/admin/funding/os/outcome-definitions`
  - manages `community_outcome_definitions` from the admin UI
  - supports listing, create/update, and archive (soft disable) flows

- `GET /api/admin/funding/os/spending`
- `POST /api/admin/funding/os/spending`
- `PUT /api/admin/funding/os/spending`
  - manages `public_spending_transactions` from the admin UI
  - supports listing, create, and update flows for the spending ledger
  - listing supports filtering by status, funding program, organization, source reference, and jurisdiction

- `POST /api/admin/funding/os/spending/status`
  - performs narrow status-only transitions for an existing spending transaction
  - supports faster reconciliation flows without resubmitting the full transaction form

- `GET /api/admin/funding/os/spending/reference`
  - returns funding programs, organizations, and opportunities for transaction entry forms

The `/api/admin/funding/os/*` endpoints are admin-only and use the service role on the server. The public accountability endpoint is read-only and intended for community-facing visibility.
