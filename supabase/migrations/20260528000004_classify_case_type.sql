-- Populate justice_matrix_cases.case_type from the case_citation pattern.
-- Many rows in the corpus aren't court decisions — they're reports, inquiries,
-- legislation, royal commissions — but were stored in the cases table. The
-- column existed but was unset on most rows. The /admin/justice-matrix/health
-- dashboard surfaces this breakdown so a curator can see the actual mix.
--
-- Only touches rows where case_type is null or empty; idempotent.
-- Originally applied 2026-05-28.

UPDATE justice_matrix_cases
SET case_type = CASE
    WHEN case_citation ~* '(royal commission|commission of inquiry|forde inquiry|RCIADIC)' THEN 'inquiry'
    WHEN case_citation ~* '(report|review)' AND case_citation !~* ' v\.? ' AND case_citation !~* '\[' THEN 'report'
    WHEN case_citation ~* '(legislation|act \d{4}|act \(.+\))' AND case_citation !~* ' v\.? ' THEN 'legislation'
    WHEN case_citation ~* '(investigation|coronial)' AND case_citation !~* ' v\.? ' THEN 'investigation'
    WHEN case_citation ~* '(annual|statistics|data analysis|cost analysis)' THEN 'statistics'
    ELSE 'court_decision'
  END,
  updated_at = now()
WHERE case_type IS NULL OR case_type = '';
