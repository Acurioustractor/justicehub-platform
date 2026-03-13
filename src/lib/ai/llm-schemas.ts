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
