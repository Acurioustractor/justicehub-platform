-- ============================================================
-- QUANTITATIVE JUSTICE SIGNALS
-- ============================================================
-- This view aggregates multi-modal signals (Evidence, Narrative, Authority)
-- to calculate an "Alpha" score for each intervention.
--
-- Formula (Roughly):
-- Alpha = (Evidence Score * 0.4) + (Narrative Score * 0.3) + (Authority Score * 0.3)

CREATE OR REPLACE VIEW view_intervention_alpha AS
WITH 
-- 1. Evidence Signal (0-10)
evidence_metrics AS (
    SELECT 
        i.id AS intervention_id,
        CASE 
            WHEN i.evidence_level = 'Proven (RCT/quasi-experimental, replicated)' THEN 10
            WHEN i.evidence_level = 'Effective (strong evaluation, positive outcomes)' THEN 8
            WHEN i.evidence_level = 'Indigenous-led (culturally grounded, community authority)' THEN 8 -- Boosted to match Effective
            WHEN i.evidence_level = 'Promising (community-endorsed, emerging evidence)' THEN 6
            WHEN i.evidence_level = 'Untested (theory/pilot stage)' THEN 2
            ELSE 3
        END AS evidence_base_score,
        COUNT(ie.evidence_id) AS evidence_count
    FROM alma_interventions i
    LEFT JOIN alma_intervention_evidence ie ON i.id = ie.intervention_id
    GROUP BY i.id, i.evidence_level
),

-- 2. Narrative Signal (Stories from lived experience)
narrative_metrics AS (
    SELECT 
        i.id AS intervention_id,
        COUNT(srp.story_id) AS story_count
    FROM alma_interventions i
    -- Join via Community Programs link (Hybrid)
    LEFT JOIN community_programs cp ON i.linked_community_program_id = cp.id
    LEFT JOIN story_related_programs srp ON cp.id = srp.program_id
    GROUP BY i.id
),

-- 3. Authority Signal (Who owns it?)
authority_metrics AS (
    SELECT 
        i.id AS intervention_id,
        CASE 
            WHEN i.consent_level = 'Community Controlled' THEN 10
            WHEN i.cultural_authority IS NOT NULL THEN 8
            WHEN i.consent_level = 'Public Knowledge Commons' THEN 6
            ELSE 4
        END AS authority_score
    FROM alma_interventions i
)

SELECT 
    i.id,
    i.name,
    i.type,
    i.evidence_level,
    i.current_funding,
    
    -- Raw signals
    COALESCE(em.evidence_base_score, 0) AS signal_evidence,
    COALESCE(nm.story_count, 0) AS signal_narrative_count,
    COALESCE(am.authority_score, 0) AS signal_authority,
    
    -- Narrative Score (Logarithmic scaling: 1 story=4, 5 stories=8, 10=10)
    LEAST(10, CASE WHEN COALESCE(nm.story_count, 0) > 0 THEN 4 + LN(COALESCE(nm.story_count, 0)) * 2 ELSE 0 END) AS signal_narrative_score,
    
    -- ALPHA CALCULATION
    -- Weighted Average: Evidence (40%), Narrative (30%), Authority (30%)
    ROUND(
        (COALESCE(em.evidence_base_score, 0) * 0.4) +
        (LEAST(10, CASE WHEN COALESCE(nm.story_count, 0) > 0 THEN 4 + LN(COALESCE(nm.story_count, 0)) * 2 ELSE 0 END) * 0.3) +
        (COALESCE(am.authority_score, 0) * 0.3)
    , 1) AS alpha_score,

    -- Market Status (Undervalued?)
    CASE 
        WHEN (COALESCE(em.evidence_base_score, 0) * 0.4 + (COALESCE(am.authority_score, 0) * 0.3)) > 6 
             AND (i.current_funding = 'Unfunded' OR i.current_funding = 'Pilot/seed') 
        THEN 'Undervalued'
        WHEN i.current_funding = 'Established' THEN 'Fair Value'
        WHEN i.current_funding = 'At-risk' THEN 'Distressed'
        ELSE 'Neutral'
    END AS market_status

FROM alma_interventions i
LEFT JOIN evidence_metrics em ON i.id = em.intervention_id
LEFT JOIN narrative_metrics nm ON i.id = nm.intervention_id
LEFT JOIN authority_metrics am ON i.id = am.intervention_id;
