/**
 * Zod Schemas for LLM Output Validation
 *
 * All LLM extraction tasks should validate their output through these schemas
 * before writing to the database. This prevents malformed data from propagating.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const OUTCOME_TYPES = [
  'Reduced recidivism',
  'Educational engagement',
  'Community safety',
  'Mental health/wellbeing',
  'Diversion from justice system',
  'Reduced detention/incarceration',
  'Cultural connection',
  'Family connection',
  'Employment/training',
  'Reduced substance use',
  'System cost reduction',
  'Healing/restoration',
] as const;

export const EVIDENCE_TYPES = [
  'Program evaluation',
  'Case study',
  'Policy analysis',
  'Community-led research',
  'Quasi-experimental',
  'RCT (Randomized Control Trial)',
] as const;

// ---------------------------------------------------------------------------
// Outcomes extraction schema
// ---------------------------------------------------------------------------

export const OutcomeSchema = z.object({
  name: z
    .string()
    .min(5, 'Outcome name too short')
    .max(200)
    .refine(
      (val) => {
        const rejects = ['unnamed', 'unknown', 'n/a', 'none', 'tbd', 'outcome 1', 'general'];
        return !rejects.some((r) => val.toLowerCase().includes(r));
      },
      { message: 'Outcome name is generic/placeholder' }
    ),
  outcome_type: z.enum(OUTCOME_TYPES),
  measurement: z
    .string()
    .min(10, 'Measurement description too short')
    .max(500)
    .nullable()
    .optional(),
});

export const OutcomesExtractionResultSchema = z.object({
  idx: z.number().int().positive(),
  outcomes: z.array(OutcomeSchema).default([]),
});

export const OutcomesExtractionResponseSchema = z.object({
  results: z.array(OutcomesExtractionResultSchema),
});

// ---------------------------------------------------------------------------
// Evidence discovery schema
// ---------------------------------------------------------------------------

export const EvidenceItemSchema = z.object({
  title: z.string().min(5).max(500),
  evidence_type: z.enum(EVIDENCE_TYPES).catch('Case study'),
  url: z.string().url(),
  findings: z.string().min(10).max(2000),
  methodology: z.string().max(500).nullable().optional(),
  author: z.string().max(200).nullable().optional(),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .nullable()
    .optional(),
  relevance_score: z.number().min(0).max(1),
});

export const EvidenceDiscoveryResponseSchema = z.object({
  results: z.array(EvidenceItemSchema),
});

// ---------------------------------------------------------------------------
// Intervention classification schema (for batch ingestion)
// ---------------------------------------------------------------------------

export const InterventionClassificationSchema = z.object({
  name: z.string().min(3).max(300),
  type: z.string().min(2).max(100),
  description: z.string().min(20).max(5000).nullable().optional(),
  operating_organization: z.string().max(300).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  evidence_level: z
    .enum(['Strong', 'Moderate', 'Emerging', 'Practice-based', 'Insufficient'])
    .nullable()
    .optional(),
  harm_risk_level: z
    .enum(['Low', 'Medium', 'High', 'Unknown'])
    .nullable()
    .optional(),
});

// ---------------------------------------------------------------------------
// Org website enrichment schema
// ---------------------------------------------------------------------------

export const PROGRAM_TYPES = [
  'Diversion',
  'Therapeutic',
  'Community-Led',
  'Education/Employment',
  'Cultural',
  'Case Management',
  'Family Support',
  'Advocacy',
  'Residential',
  'Other',
] as const;

const ExtractedProgramSchema = z.object({
  name: z.string().min(3).max(300),
  type: z.enum(PROGRAM_TYPES).catch('Other'),
  description: z.string().max(2000).nullable().optional(),
  target_cohort: z.string().max(300).nullable().optional(),
  geography: z.string().max(200).nullable().optional(),
  serves_youth_justice: z.boolean().default(false),
});

export const OrgWebsiteEnrichmentSchema = z.object({
  description: z.string().min(20).max(5000).nullable().optional(),
  services_offered: z.array(z.string().max(200)).default([]),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  sector: z.string().max(100).nullable().optional(),
  sub_sector: z.string().max(100).nullable().optional(),
  programs: z.array(ExtractedProgramSchema).default([]),
  is_indigenous_led: z.boolean().default(false),
  is_community_controlled: z.boolean().default(false),
  target_populations: z.array(z.string().max(200)).default([]),
});

export type OrgWebsiteEnrichment = z.infer<typeof OrgWebsiteEnrichmentSchema>;

// ---------------------------------------------------------------------------
// Government program extraction schema
// ---------------------------------------------------------------------------

export const JURISDICTIONS = [
  'QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Federal',
] as const;

export const PROGRAM_STATUSES = [
  'announced', 'in_progress', 'implemented', 'abandoned',
] as const;

export const GovernmentProgramSchema = z.object({
  name: z.string().min(3).max(300),
  jurisdiction: z.enum(JURISDICTIONS),
  program_type: z.string().max(100).nullable().optional(),
  announced_date: z.string().nullable().optional(), // ISO date or "YYYY-MM-DD"
  budget_amount: z.number().nullable().optional(),
  description: z.string().min(10).max(5000),
  minister: z.string().max(200).nullable().optional(),
  department: z.string().max(300).nullable().optional(),
  target_cohort: z.array(z.string().max(200)).nullable().optional(),
  status: z.enum(PROGRAM_STATUSES).nullable().optional(),
  source_url: z.string().url(),
});

export const GovernmentProgramsResponseSchema = z.object({
  programs: z.array(GovernmentProgramSchema),
});

export type GovernmentProgram = z.infer<typeof GovernmentProgramSchema>;

// ---------------------------------------------------------------------------
// Foundation grant extraction schema
// ---------------------------------------------------------------------------

export const FOUNDATION_GRANT_CONFIDENCE = [
  'high',
  'medium',
  'low',
] as const;

export const FOUNDATION_GRANT_YJ_HINTS = [
  'direct_yj_service',
  'yj_research',
  'yj_advocacy',
  'broader_justice_includes_yj',
  'indigenous_youth_general',
  'not_yj',
] as const;

export const FoundationGrantExtractionItemSchema = z.object({
  grantee_name: z.string().min(2).max(300),
  grant_amount: z.number().nonnegative().nullable().optional(),
  grant_year: z
    .number()
    .int()
    .min(2006)
    .max(new Date().getFullYear() + 1),
  program_name: z.string().max(300).nullable().optional(),
  evidence_text: z.string().min(10).max(1000),
  source_section: z.string().max(200).nullable().optional(),
  confidence: z.enum(FOUNDATION_GRANT_CONFIDENCE).catch('medium'),
  yj_relevance_hint: z.enum(FOUNDATION_GRANT_YJ_HINTS).catch('not_yj'),
});

export const FoundationGrantExtractionResponseSchema = z.object({
  grants: z.array(FoundationGrantExtractionItemSchema).default([]),
});

export type FoundationGrantExtractionItem = z.infer<typeof FoundationGrantExtractionItemSchema>;
export type FoundationGrantExtractionResponse = z.infer<typeof FoundationGrantExtractionResponseSchema>;

export const FoundationGrantYjClassificationSchema = z.object({
  yj_relevant: z.boolean(),
  yj_category: z.enum(FOUNDATION_GRANT_YJ_HINTS),
  yj_confidence: z.coerce.number().min(0).max(1),
  yj_evidence_snippet: z
    .string()
    .min(5)
    .transform((s) => s.slice(0, 300))
    .default('No clear youth justice evidence in grant input.'),
});

export type FoundationGrantYjClassification = z.infer<typeof FoundationGrantYjClassificationSchema>;

// ---------------------------------------------------------------------------
// Media sentiment analysis schema
// ---------------------------------------------------------------------------

export const SENTIMENT_TYPES = [
  'fear_narrative',
  'solutions_focused',
  'neutral',
  'mixed',
] as const;

export const CLAIM_TYPES = [
  'statistic',
  'anecdote',
  'expert_opinion',
  'political_statement',
] as const;

const FramingSchema = z.object({
  punitive_language: z.boolean(),
  community_voice: z.boolean(),
  evidence_cited: z.boolean(),
  political_framing: z.boolean(),
});

const KeyClaimSchema = z.object({
  claim: z.string().min(5).max(500),
  type: z.enum(CLAIM_TYPES),
  verifiable: z.boolean(),
});

export const SentimentAnalysisSchema = z.object({
  sentiment: z.enum(SENTIMENT_TYPES),
  sentiment_score: z.number().min(-1).max(1),
  framing: FramingSchema,
  organizations_mentioned: z.array(z.string().max(300)).default([]),
  programs_mentioned: z.array(z.string().max(300)).default([]),
  key_claims: z.array(KeyClaimSchema).default([]),
});

export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;

// ---------------------------------------------------------------------------
// Justice Matrix discovery (scan-justice-matrix scanner -> justice_matrix_discovered)
// ---------------------------------------------------------------------------

export const JUSTICE_MATRIX_ITEM_TYPES = ['case', 'campaign'] as const;

/**
 * One candidate strategic-litigation case or advocacy campaign extracted from a
 * source page. Maps onto the `extracted_*` columns of justice_matrix_discovered.
 * Fields are permissive (nullable) because source pages vary; the human review
 * queue is the gate, not this schema.
 */
export const JusticeMatrixDiscoveryItemSchema = z.object({
  item_type: z.enum(JUSTICE_MATRIX_ITEM_TYPES),
  title: z.string().min(3),
  jurisdiction: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  categories: z.array(z.string()).default([]),
  summary: z.string().nullable().optional(),
  country_code: z.string().max(8).nullable().optional(),
  item_url: z.string().url().nullable().optional(),
  // Whether this item is within the refugee / asylum protection domain.
  refugee_related: z.boolean().default(false),
  confidence: z.number().min(0).max(1).default(0.5),
  // Deterministic enrichment captured at scan time from the source API (not
  // LLM, not editorial). HUDOC importance -> precedent_strength, conclusion ->
  // outcome; CourtListener citeCount -> precedent_strength, native judges/court.
  // The auto-publish promote maps these onto the case. Optional: adapters that
  // do not have them simply omit them.
  court: z.string().nullable().optional(),
  precedent_strength: z.enum(['high', 'medium', 'low']).nullable().optional(),
  outcome: z.enum(['favorable', 'adverse', 'pending']).nullable().optional(),
  judges: z.array(z.string()).nullable().optional(),
});

export const JusticeMatrixDiscoveryResponseSchema = z.object({
  items: z.array(JusticeMatrixDiscoveryItemSchema).default([]),
});

export type JusticeMatrixDiscoveryItem = z.infer<typeof JusticeMatrixDiscoveryItemSchema>;
export type JusticeMatrixDiscoveryResponse = z.infer<typeof JusticeMatrixDiscoveryResponseSchema>;

// Theme-mapper: assigns canonical themes to a staged discovery from a
// CONTROLLED vocabulary (issue category_tags + domain tags). The schema
// deliberately cannot carry free text — the caller intersects against the
// allowed list again after validation, so a hallucinated theme is dropped,
// never published.
export const JusticeMatrixThemeMapSchema = z.object({
  themes: z.array(z.string().min(2).max(60)).max(8).default([]),
});
export type JusticeMatrixThemeMap = z.infer<typeof JusticeMatrixThemeMapSchema>;

// ---------------------------------------------------------------------------
// Validated parse helper
// ---------------------------------------------------------------------------

/**
 * Parse LLM output and validate against a Zod schema.
 * Returns { success: true, data } or { success: false, errors }.
 */
export function validateLLMOutput<T>(
  raw: unknown,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`
    ),
  };
}
