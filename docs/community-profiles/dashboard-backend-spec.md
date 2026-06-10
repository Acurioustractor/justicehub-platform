# Community organisation dashboard: backend architecture spec

**Date:** 2026-06-11
**Status:** spec only. No code, no migrations, no DB writes until the co-design checkpoint and day-shift migration approval below.
**Companions:** `org-profile-spec.md` (profile anatomy + governance), `engagement-model.md` (the five never-rules this spec enforces), `src/app/api/communities/claim/route.ts` (claim entry point, GHL-only today)

> **Correction (2026-06-11, increment 1 shipped):** the "no membership surface"
> premise below was wrong. The DB already had `organization_claims` (claim
> queue, used by `/api/organizations/[id]/claim` and `/api/admin/org-claims`)
> and `organization_members` (portal membership behind `/portal` and the admin
> cockpit). A third table `org_members` belongs to the separate `org_profiles`
> feature and is NOT ours. Increment 1 was adapted onto the existing tables:
> `organization_claims` gained `invite_token`/`invite_expires_at` and the
> `expired` status; `organization_members` gained `editor`/`viewer` roles and
> the `is_org_member()` helper; the open `org_members_basic_access` policy
> (self-insert as owner of any org) was replaced with scoped policies. Section
> 1's table DDL is therefore historical; the live shapes differ. Sections 2-8
> should target `organization_members`/`organization_claims` column names
> (`user_id`, `contact_email`, status `verified` not `approved`).

## What exists today (verified 2026-06-11)

- Auth is Supabase email/password + GitHub OAuth. `profiles.role = 'admin'` gates `/admin` via `requireAdmin()` / `checkAdmin()` in `src/lib/supabase/admin.ts`. There is no non-admin role surface yet.
- `/api/communities/claim` writes a claim to GHL (tag `interest:claim-{org_slug}`) and nothing to Supabase. A human confirms by talking to the organisation. This stays: the claim form remains the relationship trigger, this spec adds what happens after the human says yes.
- `/communities/[slug]` renders from a static `ANCHOR_COMMUNITIES` list, not the DB. Profile data will come from `organizations` (gotchas: `state` not `location_state`, `is_indigenous_org`) plus the tables in the org-profile-spec anatomy.
- Stories come only through the Empathy Ledger v2 client (`src/lib/empathy-ledger/v2-client.ts`, `X-API-Key` auth). Never direct EL Supabase queries.
- Migration conventions: `YYYYMMDDNNNNNN_snake_case.sql`, idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`), RLS enabled per table with named policies.

## 1. Auth and roles

No new auth system. Org members are ordinary Supabase users with rows in `profiles`. Membership lives in a join table:

```sql
CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  invited_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, organization_id)
);
```

Claim approval flow:

1. Contact submits `/api/communities/claim` (unchanged, GHL).
2. Admin reviews in a new `/admin/community-claims` queue backed by `org_claims`:

```sql
CREATE TABLE IF NOT EXISTS org_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  claimant_email text NOT NULL,
  claimant_name text NOT NULL,
  role_in_org text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined','expired')),
  invite_token uuid DEFAULT gen_random_uuid(),
  invite_expires_at timestamptz,
  decided_by uuid REFERENCES profiles(id),
  decided_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

3. Approval is a human act after the confirming conversation (engagement-model step 3). On approve, the system sends an invite email with a single-use token link.
4. The invitee signs up or signs in with the normal Supabase flow, lands on `/dashboard/accept-invite?token=...`, and a server route (service role, after validating the token and matching the signed-in user's email to `claimant_email`) inserts the `org_members` row with role `owner` and marks the claim `approved`-consumed.
5. Owners can invite further members (editor or viewer) through the same token mechanism scoped to their org.

A helper `requireOrgMember(orgId, minRole)` joins `requireAdmin()`'s pattern in `src/lib/supabase/`: get user, look up `org_members`, enforce role ordering viewer < editor < owner. Admins are not implicit org members; staff can stage, never publish (org-profile-spec rule 1).

## 2. Outcome tracking

The community defines what success is. The schema stores their definition as text they wrote, not enum slots shaped like a government KPI.

```sql
CREATE TABLE IF NOT EXISTS org_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  description text,
  how_measured text,          -- the community's own words on method
  baseline text,              -- free text: "12 callouts a month, winter 2024"
  target text,                -- free text, optional; some outcomes have no target
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('public','community','private')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE IF NOT EXISTS org_outcome_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_id uuid NOT NULL REFERENCES org_outcomes(id) ON DELETE CASCADE,
  period text NOT NULL,        -- the org's own period label: "Term 1 2026", "Dry season"
  value_numeric numeric,       -- optional; use when the outcome is counted
  value_text text,             -- optional; use when it is not
  narrative text,              -- what happened, in their words
  recorded_by uuid REFERENCES profiles(id),
  recorded_at timestamptz DEFAULT now()
);
```

Deliberate non-features: no outcome-type taxonomy, no mandatory numeric value, no reporting-period enum. Either value column may be null as long as narrative or the other value is present (CHECK at least one of the three is not null). Visibility maps to the three levels in org-profile-spec rule 2: `public` renders on the profile, `community` renders summarised or by permission, `private` never renders anywhere. Community-verified status (the badge) is awarded against outcomes with entries the community confirms, which is why entries carry `recorded_by` provenance.

## 3. Stories (Empathy Ledger link)

One column, not a sync. Add `el_project_id text` to a small per-org settings table (see section 5) rather than to `organizations` (which has no `source` column and should stay unpolluted). The dashboard story panel calls the v2 client server-side (`getProjects`, `getStories({ project_id })`) and renders counts plus per-story consent state. Story content, transcripts, and media are never copied into the JusticeHub DB; the panel is a live read with short cache. If the EL API is down the panel says so and shows the last-fetched counts from an in-memory or KV cache, never a DB mirror. Consent enforcement stays in EL where it already lives in SQL; JusticeHub displays it, never re-decides it.

## 4. Mentor and support links

The basecamp-and-spokes model (Oonchiumpa in Mparntwe is the first basecamp) and peer support between justice reinvestment sites are rows, not prose:

```sql
CREATE TABLE IF NOT EXISTS mentor_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  related_organization_id uuid REFERENCES organizations(id),
  related_person_name text,    -- when the mentor is a person, not an org
  relationship_type text NOT NULL
    CHECK (relationship_type IN ('mentor','peer','basecamp-spoke')),
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','active','ended')),
  notes text,
  created_at timestamptz DEFAULT now(),
  CHECK (related_organization_id IS NOT NULL OR related_person_name IS NOT NULL)
);
```

A link renders publicly only when `active` and both orgs are org-confirmed. Either side's owner can end a link; proposing one creates it as `proposed` until the other side's owner (or admin, for person links) confirms. This powers the network map view ("sight of each other", engagement-model item 5).

## 5. Profile editing

Org-confirmed profile sections are edited as staged drafts, published only by the org:

```sql
CREATE TABLE IF NOT EXISTS org_profile_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  section_key text NOT NULL,   -- 'identity','programs','outcomes','cost','funding','stories','network'
  draft_content jsonb,         -- staged edit, visible only to org members + admin
  published_content jsonb,     -- what the public page renders
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','community','private')),
  published_by uuid REFERENCES profiles(id),
  published_at timestamptz,
  UNIQUE (organization_id, section_key)
);

CREATE TABLE IF NOT EXISTS org_settings (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id),
  el_project_id text,
  claim_status text NOT NULL DEFAULT 'unclaimed'
    CHECK (claim_status IN ('unclaimed','org-confirmed','community-verified')),
  updated_at timestamptz DEFAULT now()
);
```

Anyone with editor or owner role can write `draft_content`. Publishing (copying draft to published, stamping `published_by`/`published_at`) requires owner or editor and is the org holding the pen. JusticeHub admins can write drafts (staging stubs from public records) but the publish action is RLS-blocked for them; staff can stage, never publish. `/communities/[slug]` moves from the static anchor list to reading `published_content` where `claim_status` is at least org-confirmed, falling back to the honest unclaimed stub.

## 6. Routes

Pages (all behind Supabase auth + org membership):

- `/dashboard` org home: claim status badge, profile completeness, latest outcome entries, EL story counts and consent states, funding view (read from `justice_funding` via `alma_organization_id`, rendered with provenance)
- `/dashboard/outcomes` define outcomes, add entries, set visibility
- `/dashboard/profile` section editor: draft, preview, publish, per-section visibility
- `/dashboard/members` (owner only) invite and manage members
- `/dashboard/accept-invite` token landing

API surface (App Router routes; caller in brackets):

- `GET /api/dashboard/org` org summary [member]
- `GET|POST /api/dashboard/outcomes`, `PATCH /api/dashboard/outcomes/[id]` [editor+ to write, viewer to read]
- `POST /api/dashboard/outcomes/[id]/entries` [editor+]
- `GET|PATCH /api/dashboard/profile/sections/[key]` draft read/write [editor+]
- `POST /api/dashboard/profile/sections/[key]/publish` [owner or editor, never admin]
- `GET /api/dashboard/stories` EL v2 proxy, counts + consent only [member]
- `GET|POST /api/dashboard/mentor-links` [owner to write]
- `POST /api/admin/community-claims/[id]/approve` [admin, sends invite]
- `POST /api/dashboard/invites/accept` [authed user with valid token]

Public reads (`/communities/[slug]`) use the anon client and rely on RLS, never the service role.

## 7. RLS and safety

Every new table gets RLS enabled. Plain language first, SQL shape second. Shared helper:

```sql
CREATE OR REPLACE FUNCTION is_org_member(org uuid, min_role text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.organization_id = org AND m.profile_id = auth.uid()
      AND CASE min_role WHEN 'viewer' THEN m.role IN ('viewer','editor','owner')
                        WHEN 'editor' THEN m.role IN ('editor','owner')
                        ELSE m.role = 'owner' END
  );
$$;
```

- `org_members`: members read their own org's roster; only owners insert/update/delete rows for their org; users may delete their own membership (leave). No public read.
- `org_claims`: no anon access at all; admin-only via `profiles.role = 'admin'` policy; token acceptance goes through a service-role server route that validates token + email match, the only service-role write in the system.
- `org_outcomes`: SELECT public when `visibility = 'public'` and the org is org-confirmed; members read all rows for their org; INSERT/UPDATE require `is_org_member(organization_id,'editor')`. `community` visibility rows are not anon-readable; the public page renders an admin-curated summary only with org publish approval (treat as private at the RLS layer, summarise in `published_content`).
- `org_outcome_entries`: inherit via join to the parent outcome; public read only when parent outcome is public; writes editor+.
- `org_profile_sections`: anon SELECT exposes `published_content` only where `visibility = 'public'` (use a view or column-limited policy so `draft_content` is never anon-readable); members read drafts; editor+ update drafts; the publish UPDATE (setting `published_at`) allowed only for members, explicitly not for admins.
- `mentor_links`: anon SELECT when `status = 'active'`; owners of either linked org write; admin can write person-links.
- `org_settings`: anon SELECT of `claim_status` only; member read; owner write of `el_project_id`.

The five never-rules from engagement-model.md as enforcement points:

1. Never publish without confirmation: publish is an org-member-only RLS action; admin clients physically cannot set `published_at`. Unclaimed stubs render from a separate staged store and say "unclaimed" in the badge.
2. Never deficit framing: a content rule, enforced at review and in the section schema (no fields for offending statistics; cost block compares program spend to detention benchmark, not young people to baselines).
3. Funders never get a back door: no public or partner API route may use the service role to read `org_outcomes`, `org_outcome_entries`, or `org_profile_sections`. The only service-role touchpoint is invite-token acceptance. Add a lint/test that greps dashboard and public routes for `service` client imports.
4. Never extract: `GET /api/dashboard/export` returns the org's own data in full to owners; deletion requests are honoured at row level (hard DELETE policies for owners on their own rows, plus admin runbook for `organizations`-level removal).
5. Government never defines success: `org_outcomes` has no KPI taxonomy and `community-verified` in `org_settings.claim_status` is set only through the community confirmation process, never by a data import.

## 8. Build order

Each increment ships on its own. Day-shift items (migration apply, anything touching live Supabase) need explicit human approval; co-design checkpoints sit with Oonchiumpa before public surfaces change.

1. **Claim approval + org_members + invite flow.** Tables `org_claims`, `org_members`, helper `is_org_member`, admin queue, invite email, `/dashboard/accept-invite`. Everything else depends on it. Human decisions: migration apply (day-shift), invite email copy.
2. **Dashboard shell + profile read.** `/dashboard` home with claim status, org identity, funding view (read-only from existing tables, provenance rendered). No new tables.
3. **Profile sections + publish.** `org_profile_sections`, `org_settings`, `/dashboard/profile`, swap `/communities/[slug]` to DB-backed rendering with the unclaimed badge. Human decisions: co-design checkpoint with Oonchiumpa on section anatomy and default visibilities BEFORE this ships (org-profile-spec build order step 1), migration apply (day-shift).
4. **Outcomes.** `org_outcomes`, `org_outcome_entries`, `/dashboard/outcomes`, public outcome block on the profile. Human decisions: co-design the outcome form language with Oonchiumpa; migration apply (day-shift).
5. **Stories panel.** EL project linking, v2 proxy route, consent-state display. Human decision: confirm EL project mapping per anchor org with the orgs themselves.
6. **Mentor links + network view.** `mentor_links`, proposal/confirm flow, map rendering of basecamp-spoke relationships. Human decision: the first basecamp-spoke rows are named by the network (the late-June co-director conversation), not seeded by us.
