-- Remove three placeholder rows from justice_matrix_cases that were auto-
-- approved by an old ralph-research-agent run with fake authoritative_links
-- (404/403). They had been downgraded to verified=false earlier; this migration
-- removes them entirely and reclassifies the originating discoveries as
-- rejected with an audit note so provenance survives.
--
-- Idempotent. Originally applied 2026-05-28.

UPDATE justice_matrix_discovered
SET status = 'rejected',
    approved_case_id = NULL,
    review_notes = COALESCE(review_notes, '') ||
                   ' [Auto-approved into a placeholder case row with a fake authoritative_link.' ||
                   ' Reclassified during health-pass cleanup.]',
    reviewed_by = 'health-pass-cleanup',
    reviewed_at = now(),
    updated_at = now()
WHERE approved_case_id IN (
  'ee104bf0-c4cf-4899-8b39-3eed282f667e',
  '9359f4d9-2aac-4316-9f1d-2e63160476ed',
  '9c5cf000-7177-4deb-b522-85f3bcd1e967'
);

DELETE FROM justice_matrix_cases
WHERE id IN (
  'ee104bf0-c4cf-4899-8b39-3eed282f667e',
  '9359f4d9-2aac-4316-9f1d-2e63160476ed',
  '9c5cf000-7177-4deb-b522-85f3bcd1e967'
)
  AND verified = false;
