-- ALMA Signals Documentation Migration
-- Adds comments to legacy "score" columns explaining proper ALMA signals usage
--
-- ALMA SACRED BOUNDARIES:
-- - Uses SIGNALS (direction indicators), not SCORES (rankings)
-- - Never profiles individual youth
-- - Community Authority weighted highest
--
-- This migration adds documentation comments but does not change column names
-- to maintain backward compatibility. UI components should use categorical
-- display (High Impact, Growing Impact, Emerging Impact) instead of numeric scores.

-- Document empathy_score usage in youth_profiles
COMMENT ON COLUMN youth_profiles.empathy_score IS
'DEPRECATED - Legacy Empathy Ledger field.
ALMA SACRED BOUNDARIES: This should be displayed as categorical growth indicator
(High Growth, Growing, Emerging) not as a numeric ranking.
Never use to sort or rank individual youth.
Consider migrating to empathy_growth_level (high/growing/emerging).';

-- Document connection_strength in youth_profiles
COMMENT ON COLUMN youth_profiles.connection_strength IS
'Legacy field tracking connection depth.
ALMA SACRED BOUNDARIES: This measures relationship health, not individual performance.
Should be displayed as qualitative indicator (Strong Connections, Building Connections)
not as numeric ranking against other youth.';

-- Document impact_score in empathy_ledger_entries
COMMENT ON COLUMN empathy_ledger_entries.impact_score IS
'DEPRECATED - Use categorical impact_level instead.
ALMA SACRED BOUNDARIES: Display as categorical signal (High Impact, Growing Impact,
Emerging Impact) not as numeric score. This measures story resonance, not youth worth.
UI components should use scoreToSignal() from lib/alma/impact-signals.ts';

-- Add guidance comment to the youth_profiles table
COMMENT ON TABLE youth_profiles IS
'Youth profile data - ALMA SACRED BOUNDARIES apply:
- No individual risk scoring or prediction
- No comparative rankings between youth
- empathy_score and connection_strength are growth indicators, not rankings
- Privacy controls must be respected (privacy_settings column)
- guardian_contact required for under-18s';

-- Add guidance comment to empathy_ledger_entries table
COMMENT ON TABLE empathy_ledger_entries IS
'Empathy Ledger entries for tracking growth and milestones.
ALMA SACRED BOUNDARIES:
- impact_score should display as categorical signal, not numeric ranking
- Entries belong to individuals, never use for comparative analysis
- privacy_level must be respected in all queries
- verification_status tracks consent, not quality judgment';
