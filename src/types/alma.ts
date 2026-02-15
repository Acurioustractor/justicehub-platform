/**
 * ALMA (Adaptive Learning & Measurement Architecture) TypeScript Types
 *
 * Complete type definitions for ALMA's 4 core entities:
 * - Interventions: Programs and practices addressing youth justice
 * - Community Contexts: Place-based and cultural contexts
 * - Evidence: Research, evaluations, and outcome data
 * - Outcomes: Intended and measured results
 *
 * Also includes governance types (consent ledger, usage log) and portfolio analytics.
 */

// =====================================
// ENUMS & CONSTANTS
// =====================================

export const InterventionTypes = [
  'Prevention',
  'Early Intervention',
  'Diversion',
  'Therapeutic',
  'Wraparound Support',
  'Family Strengthening',
  'Cultural Connection',
  'Education/Employment',
  'Justice Reinvestment',
  'Community-Led',
] as const;

export type InterventionType = typeof InterventionTypes[number];

export const EvidenceLevels = [
  'Promising (community-endorsed, emerging evidence)',
  'Effective (strong evaluation, positive outcomes)',
  'Proven (RCT/quasi-experimental, replicated)',
  'Indigenous-led (culturally grounded, community authority)',
  'Untested (theory/pilot stage)',
] as const;

export type EvidenceLevel = typeof EvidenceLevels[number];

export const ConsentLevels = [
  'Public Knowledge Commons',
  'Community Controlled',
  'Strictly Private',
] as const;

export type ConsentLevel = typeof ConsentLevels[number];

export const PermittedUses = [
  'Query (internal)',
  'Publish (JusticeHub)',
  'Export (reports)',
  'Training (AI)',
  'Commercial',
] as const;

export type PermittedUse = typeof PermittedUses[number];

export const HarmRiskLevels = [
  'Low',
  'Medium',
  'High',
  'Requires cultural review',
] as const;

export type HarmRiskLevel = typeof HarmRiskLevels[number];

export const ImplementationCosts = [
  'Low (<$50k/year)',
  'Medium ($50k-$250k)',
  'High (>$250k)',
  'Unknown',
] as const;

export type ImplementationCost = typeof ImplementationCosts[number];

export const Scalabilities = [
  'Local only',
  'Regional',
  'State-wide',
  'National',
  'Context-dependent',
] as const;

export type Scalability = typeof Scalabilities[number];

export const ReplicationReadinesses = [
  'Not ready (needs more development)',
  'Ready with support (requires adaptation guidance)',
  'Ready (playbook available)',
  'Community authority required',
] as const;

export type ReplicationReadiness = typeof ReplicationReadinesses[number];

export const CurrentFundings = [
  'Unfunded',
  'Pilot/seed',
  'Established',
  'Oversubscribed',
  'At-risk',
] as const;

export type CurrentFunding = typeof CurrentFundings[number];

export const ReviewStatuses = [
  'Draft',
  'Community Review',
  'Approved',
  'Published',
  'Archived',
] as const;

export type ReviewStatus = typeof ReviewStatuses[number];

export const ContextTypes = [
  'First Nations community',
  'Remote community',
  'Regional area',
  'Metro suburb',
  'Cultural community',
  'Care system',
  'Education setting',
] as const;

export type ContextType = typeof ContextTypes[number];

export const PopulationSizes = [
  '<1,000',
  '1,000-10,000',
  '10,000-50,000',
  '50,000+',
  'Unknown',
] as const;

export type PopulationSize = typeof PopulationSizes[number];

export const EvidenceTypes = [
  'RCT (Randomized Control Trial)',
  'Quasi-experimental',
  'Program evaluation',
  'Longitudinal study',
  'Case study',
  'Community-led research',
  'Lived experience',
  'Cultural knowledge',
  'Policy analysis',
] as const;

export type EvidenceType = typeof EvidenceTypes[number];

export const EffectSizes = [
  'Large positive',
  'Moderate positive',
  'Small positive',
  'Null',
  'Mixed',
  'Not measured',
] as const;

export type EffectSize = typeof EffectSizes[number];

export const CulturalSafeties = [
  'Culturally grounded (led by community)',
  'Culturally adapted (with community input)',
  'Culturally neutral',
  'Cultural safety concerns',
  'Unknown',
] as const;

export type CulturalSafety = typeof CulturalSafeties[number];

export const OutcomeTypes = [
  'Reduced detention/incarceration',
  'Reduced recidivism',
  'Diversion from justice system',
  'Educational engagement',
  'Employment/training',
  'Family connection',
  'Cultural connection',
  'Mental health/wellbeing',
  'Reduced substance use',
  'Community safety',
  'System cost reduction',
  'Healing/restoration',
] as const;

export type OutcomeType = typeof OutcomeTypes[number];

export const TimeHorizons = [
  'Immediate (<6 months)',
  'Short-term (6-12 months)',
  'Medium-term (1-3 years)',
  'Long-term (3+ years)',
] as const;

export type TimeHorizon = typeof TimeHorizons[number];

export const Beneficiaries = [
  'Young person',
  'Family',
  'Community',
  'System/Government',
] as const;

export type Beneficiary = typeof Beneficiaries[number];

export const AustralianStates = [
  'VIC',
  'NSW',
  'QLD',
  'SA',
  'WA',
  'TAS',
  'NT',
  'ACT',
] as const;

export type AustralianState = typeof AustralianStates[number];

export const EntityTypes = [
  'intervention',
  'context',
  'evidence',
  'outcome',
] as const;

export type EntityType = typeof EntityTypes[number];

export const UsageActions = [
  'query',
  'view',
  'export',
  'publish',
  'training',
  'commercial',
] as const;

export type UsageAction = typeof UsageActions[number];

// =====================================
// CORE ENTITY TYPES
// =====================================

export interface ALMAIntervention {
  id: string;
  created_at: string;
  updated_at: string;

  // Basic Information
  name: string;
  type: InterventionType;
  description: string;

  // Target Population
  target_cohort: string[];
  geography: string[];

  // Evidence & Authority
  evidence_level?: EvidenceLevel;
  cultural_authority?: string;
  consent_level: ConsentLevel;
  permitted_uses: PermittedUse[];
  contributors: string[];
  source_documents: any[]; // JSONB

  // Risk Assessment
  risks?: string;
  harm_risk_level?: HarmRiskLevel;

  // Implementation Details
  implementation_cost?: ImplementationCost;
  cost_per_young_person?: number;
  scalability?: Scalability;
  replication_readiness?: ReplicationReadiness;

  // Operating Organization
  operating_organization?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  years_operating?: number;
  current_funding?: CurrentFunding;

  // Portfolio Analytics
  portfolio_score?: number;
  evidence_strength_signal?: number;
  community_authority_signal?: number;
  harm_risk_signal?: number;
  implementation_capability_signal?: number;
  option_value_signal?: number;

  // Workflow & Review
  review_status: ReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;

  // Hybrid Linking
  linked_service_id?: string;
  linked_community_program_id?: string;

  // Metadata
  metadata?: Record<string, any>;
}

export interface ALMACommunityContext {
  id: string;
  created_at: string;
  updated_at: string;

  // Basic Information
  name: string;
  context_type: ContextType;

  // Location
  location?: string;
  state?: AustralianState;
  population_size?: PopulationSize;

  // Context Description
  demographics?: string;
  system_factors?: string;
  protective_factors?: string;

  // Governance (ALWAYS REQUIRED)
  cultural_authority: string;
  consent_level: ConsentLevel;
  contributors: string[];

  // Metadata
  metadata?: Record<string, any>;
}

export interface ALMAEvidence {
  id: string;
  created_at: string;
  updated_at: string;

  // Basic Information
  title: string;
  evidence_type: EvidenceType;

  // Study Details
  methodology?: string;
  sample_size?: number;
  timeframe?: string;
  findings: string;
  effect_size?: EffectSize;
  limitations?: string;

  // Cultural Safety
  cultural_safety?: CulturalSafety;

  // Source Information
  author?: string;
  organization?: string;
  publication_date?: string;
  doi?: string;
  source_url?: string;
  source_document_url?: string;

  // Governance
  consent_level: ConsentLevel;
  contributors: string[];

  // Metadata
  metadata?: Record<string, any>;
}

export interface ALMAOutcome {
  id: string;
  created_at: string;
  updated_at: string;

  // Basic Information
  name: string;
  outcome_type: OutcomeType;
  description?: string;

  // Measurement
  measurement_method?: string;
  indicators?: string;
  time_horizon?: TimeHorizon;
  beneficiary?: Beneficiary;

  // Metadata
  metadata?: Record<string, any>;
}

// =====================================
// RELATIONSHIP TYPES
// =====================================

export interface ALMAInterventionOutcome {
  id: string;
  intervention_id: string;
  outcome_id: string;
  created_at: string;
}

export interface ALMAInterventionEvidence {
  id: string;
  intervention_id: string;
  evidence_id: string;
  created_at: string;
}

export interface ALMAInterventionContext {
  id: string;
  intervention_id: string;
  context_id: string;
  created_at: string;
}

export interface ALMAEvidenceOutcome {
  id: string;
  evidence_id: string;
  outcome_id: string;
  created_at: string;
}

// =====================================
// GOVERNANCE TYPES
// =====================================

export interface Contributor {
  name: string;
  organization?: string;
  role?: string;
  contact?: string;
}

export interface ALMAConsentLedger {
  id: string;
  created_at: string;
  updated_at: string;

  // Polymorphic reference
  entity_type: EntityType;
  entity_id: string;

  // Consent Details
  consent_level: ConsentLevel;
  permitted_uses: PermittedUse[];
  cultural_authority?: string;

  // Contributors & Attribution
  contributors: Contributor[];
  attribution_text?: string;

  // Consent Management
  consent_given_by?: string;
  consent_given_at: string;
  consent_expires_at?: string;
  consent_revoked: boolean;
  consent_revoked_at?: string;
  consent_revoked_by?: string;

  // Revenue Sharing
  revenue_share_enabled: boolean;
  revenue_share_percentage?: number;

  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ALMAUsageLog {
  id: string;
  created_at: string;

  // What was accessed
  entity_type: EntityType;
  entity_id: string;

  // How it was used
  action: UsageAction;
  user_id?: string;

  // Context
  query_text?: string;
  destination?: string;

  // Revenue tracking
  revenue_generated?: number;

  // Metadata
  metadata?: Record<string, any>;
}

// =====================================
// PORTFOLIO ANALYTICS TYPES
// =====================================

export interface PortfolioSignals {
  evidence_strength: number;
  community_authority: number;
  harm_risk: number;
  implementation_capability: number;
  option_value: number;
  portfolio_score: number;
}

export interface InterventionScore {
  intervention: ALMAIntervention;
  signals: PortfolioSignals;
  confidence: number;
  recommendations: string[];
  risks: string[];
}

export interface PortfolioConstraints {
  max_untested_allocation: number; // Default: 0.15 (15%)
  min_community_endorsed: number; // Default: 0.80 (80%)
  harm_risk_cap: HarmRiskLevel; // No high-risk without mitigation
}

export interface PortfolioAnalysis {
  underfunded_high_evidence: InterventionScore[];
  promising_but_unproven: InterventionScore[];
  ready_to_scale: InterventionScore[];
  high_risk_flagged: InterventionScore[];
  learning_opportunities: InterventionScore[];
}

// =====================================
// UNIFIED VIEW TYPES
// =====================================

export interface ALMAInterventionUnified extends ALMAIntervention {
  source: 'alma' | 'registered_services';
  outcomes: Array<{
    id: string;
    name: string;
    type: OutcomeType;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    type: EvidenceType;
  }>;
  contexts: Array<{
    id: string;
    name: string;
    type: ContextType;
  }>;
}

// =====================================
// API REQUEST/RESPONSE TYPES
// =====================================

export interface CreateInterventionRequest {
  name: string;
  type: InterventionType;
  description: string;
  target_cohort?: string[];
  geography?: string[];
  evidence_level?: EvidenceLevel;
  cultural_authority?: string;
  consent_level?: ConsentLevel;
  permitted_uses?: PermittedUse[];
  operating_organization?: string;
  contact_email?: string;
  metadata?: Record<string, any>;
}

export interface UpdateInterventionRequest extends Partial<CreateInterventionRequest> {
  id: string;
}

export interface SearchInterventionsRequest {
  query?: string;
  geography?: string[];
  consent_level?: ConsentLevel;
  min_evidence_level?: EvidenceLevel;
  intervention_type?: InterventionType;
  review_status?: ReviewStatus;
  limit?: number;
  offset?: number;
}

export interface SearchInterventionsResponse {
  interventions: ALMAInterventionUnified[];
  total: number;
  limit: number;
  offset: number;
}

export interface PortfolioAnalysisRequest {
  vertical: 'youth_justice';
  constraints?: Partial<PortfolioConstraints>;
  include_draft?: boolean;
}

export interface PortfolioAnalysisResponse {
  analysis: PortfolioAnalysis;
  metadata: {
    total_interventions: number;
    analysis_date: string;
    constraints_applied: PortfolioConstraints;
  };
}

export interface ConsentCheckRequest {
  entity_type: EntityType;
  entity_id: string;
  action: PermittedUse;
}

export interface ConsentCheckResponse {
  allowed: boolean;
  reason?: string;
}

// =====================================
// FORM TYPES
// =====================================

export interface InterventionFormData {
  // Step 1: Basic Information
  name: string;
  type: InterventionType;
  description: string;

  // Step 2: Target & Geography
  target_cohort: string[];
  geography: string[];

  // Step 3: Evidence & Authority
  evidence_level?: EvidenceLevel;
  cultural_authority?: string;

  // Step 4: Implementation
  implementation_cost?: ImplementationCost;
  scalability?: Scalability;
  replication_readiness?: ReplicationReadiness;

  // Step 5: Risk Assessment
  risks?: string;
  harm_risk_level?: HarmRiskLevel;

  // Step 6: Organization
  operating_organization?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  years_operating?: number;
  current_funding?: CurrentFunding;

  // Step 7: Governance
  consent_level: ConsentLevel;
  permitted_uses: PermittedUse[];
  contributors: string[];
}

// =====================================
// HELPER TYPES
// =====================================

export interface GovernanceCheck {
  rule: string;
  passed: boolean;
  reason?: string;
  required_action?: string;
}

export interface GovernanceViolation {
  failed_checks: GovernanceCheck[];
  entity_type: EntityType;
  entity_id: string;
  action: string;
}

// =====================================
// EXPORT ALL
// =====================================

export type {
  ALMAIntervention as Intervention,
  ALMACommunityContext as CommunityContext,
  ALMAEvidence as Evidence,
  ALMAOutcome as Outcome,
};
