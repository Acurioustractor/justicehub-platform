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
