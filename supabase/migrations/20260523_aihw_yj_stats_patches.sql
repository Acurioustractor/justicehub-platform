-- Patches to aihw_youth_justice_stats applied at runtime when ingest-aihw-youth-justice.mjs
-- was first run. The original schema lacked source_format + source_sheet_label which the
-- ingest script needs to track provenance per AIHW supplementary sheet vs PDF fallback.
ALTER TABLE aihw_youth_justice_stats ADD COLUMN IF NOT EXISTS source_format text DEFAULT 'pdf' CHECK (source_format IN ('xlsx', 'pdf'));
ALTER TABLE aihw_youth_justice_stats ADD COLUMN IF NOT EXISTS source_sheet_label text;
