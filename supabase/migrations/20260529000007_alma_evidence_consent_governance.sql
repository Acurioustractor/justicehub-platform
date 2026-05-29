-- Bidirectional, community-held consent on alma_evidence.
--
-- Move 3 of the Justice Matrix strategy: convert the consent gate from a static
-- classification ACT applied on a community's behalf into the community's own
-- live control, plus an honest record of who classified each row and on whose
-- authority.
--
-- The consent gate stays exactly as it is. Search/RPC allow only
-- ['Public Knowledge Commons','Community Controlled'] and the render layer
-- redacts 'Community Controlled' to title + provenance. Anything else
-- ('Strictly Private', NULL, unrecognised) is unreachable on public surfaces.
-- These columns add governance ON TOP of that gate; they do not weaken it.
--
-- Four columns:
--   * classified_by      — the human or system that applied the consent_level.
--   * classified_at       — when that classification happened.
--   * consent_authority   — who AUTHORISED the classification (the community
--                           body, the agreement, the person who said yes).
--                           This is the sovereignty record: it names whose
--                           call this was.
--   * revocation_token    — a per-row capability secret. Whoever holds the
--                           token for a row can flip it to 'Strictly Private'
--                           via POST /api/justice-matrix/evidence/[id]/revoke,
--                           which removes it from every public surface
--                           instantly (the search/RPC allow-list already
--                           excludes 'Strictly Private', and the render layer
--                           has no unfiltered fallback). The token is never
--                           exposed through any GET; it is delivered to the
--                           holding community out of band so revocation is
--                           theirs, not ACT's.

ALTER TABLE public.alma_evidence
  ADD COLUMN IF NOT EXISTS classified_by text,
  ADD COLUMN IF NOT EXISTS classified_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_authority text,
  -- gen_random_uuid() is in Postgres core from PG13 (this project is PG17).
  -- If a target ever predates that, enable pgcrypto first:
  --   CREATE EXTENSION IF NOT EXISTS pgcrypto;
  ADD COLUMN IF NOT EXISTS revocation_token uuid DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.alma_evidence.classified_by IS
  'Who applied the consent_level on this row (human reviewer or system). Provenance only.';

COMMENT ON COLUMN public.alma_evidence.classified_at IS
  'When the consent_level on this row was applied.';

COMMENT ON COLUMN public.alma_evidence.consent_authority IS
  'Who authorised the classification — the holding community body, agreement, or person whose call this was. The sovereignty record.';

COMMENT ON COLUMN public.alma_evidence.revocation_token IS
  'Per-row capability SECRET. Holder may flip this row to Strictly Private via the revoke endpoint. MUST NOT be exposed in any GET/API read. Delivered out of band to the holding community so revocation is community-held.';

-- Backfill a token for every existing row that predates this column. The
-- DEFAULT only fires for new inserts, so older rows would otherwise sit at
-- NULL and have no revocation capability.
UPDATE public.alma_evidence
  SET revocation_token = gen_random_uuid()
  WHERE revocation_token IS NULL;
