import { z } from 'zod';

// Base schemas for common fields
const uuidSchema = z.string().uuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestampSchema = z.string().datetime();
const urlSchema = z.string().url().nullable().optional();
const percentageSchema = z.number().min(0).max(100);
const nonNegativeNumber = z.number().min(0);

// Youth Statistics Schema
export const youthStatisticSchema = z.object({
  id: uuidSchema.optional(),
  date: dateSchema,
  facility_name: z.string().min(1).max(255),
  total_youth: z.number().int().min(0),
  indigenous_youth: z.number().int().min(0),
  indigenous_percentage: percentageSchema,
  average_age: z.number().min(10).max(25).nullable().optional(),
  average_stay_days: z.number().int().min(0).nullable().optional(),
  program_type: z.enum(['detention', 'community', 'diversion', 'other']).nullable().optional(),
  source_url: urlSchema,
  scraped_date: timestampSchema.optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
}).refine(data => data.indigenous_youth <= data.total_youth, {
  message: "Indigenous youth count cannot exceed total youth count",
  path: ["indigenous_youth"],
});

// Budget Allocation Schema
export const budgetAllocationSchema = z.object({
  id: uuidSchema.optional(),
  fiscal_year: z.string().regex(/^\d{4}-\d{2}$/, "Fiscal year must be in YYYY-YY format"),
  department: z.string().min(1).max(255),
  program: z.string().min(1).max(255),
  category: z.string().min(1).max(255),
  amount: z.number().min(0).max(1000000000), // Max 1 billion
  description: z.string().nullable().optional(),
  source_url: urlSchema,
  source_document: z.string().max(255).nullable().optional(),
  scraped_date: timestampSchema.optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

// Court Statistics Schema
export const courtStatisticSchema = z.object({
  id: uuidSchema.optional(),
  court_type: z.enum(['childrens', 'magistrates', 'district', 'supreme']),
  report_period: z.string().min(1).max(50),
  total_defendants: z.number().int().min(0).nullable().optional(),
  indigenous_defendants: z.number().int().min(0).nullable().optional(),
  indigenous_percentage: percentageSchema.nullable().optional(),
  bail_refused_count: z.number().int().min(0).nullable().optional(),
  bail_refused_percentage: percentageSchema.nullable().optional(),
  remanded_custody: z.number().int().min(0).nullable().optional(),
  average_time_to_sentence_days: z.number().int().min(0).nullable().optional(),
  most_common_offence: z.string().max(255).nullable().optional(),
  source_document: z.string().max(255).nullable().optional(),
  source_url: urlSchema,
  scraped_date: timestampSchema.optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
}).refine(data => {
  if (data.total_defendants && data.indigenous_defendants) {
    return data.indigenous_defendants <= data.total_defendants;
  }
  return true;
}, {
  message: "Indigenous defendants cannot exceed total defendants",
  path: ["indigenous_defendants"],
});

// Parliamentary Document Schema
export const parliamentaryDocumentSchema = z.object({
  id: uuidSchema.optional(),
  document_type: z.enum(['hansard', 'report', 'brief', 'question', 'other']),
  title: z.string().min(1).max(500),
  date: dateSchema,
  author: z.string().max(255).nullable().optional(),
  url: z.string().url(),
  content: z.string().nullable().optional(),
  mentions_youth_justice: z.boolean().default(false),
  mentions_spending: z.boolean().default(false),
  mentions_indigenous: z.boolean().default(false),
  scraped_date: timestampSchema.optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

// Cost Comparison Schema
export const costComparisonSchema = z.object({
  id: uuidSchema.optional(),
  category: z.string().min(1).max(255),
  item: z.string().min(1).max(255),
  cost: nonNegativeNumber.max(1000000),
  unit: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  source: z.string().max(255).nullable().optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

// Hidden Cost Schema
export const hiddenCostSchema = z.object({
  id: uuidSchema.optional(),
  location: z.string().min(1).max(255),
  cost_type: z.string().min(1).max(255),
  amount: nonNegativeNumber.max(1000000),
  description: z.string().nullable().optional(),
  calculation_method: z.string().nullable().optional(),
  data_source: z.string().max(255).nullable().optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

// Scraped Content Schema
export const scrapedContentSchema = z.object({
  id: uuidSchema.optional(),
  source: z.string().min(1).max(255),
  url: z.string().url(),
  title: z.string().max(500).nullable().optional(),
  content: z.string().min(1),
  metadata: z.record(z.any()).nullable().optional(),
  scraper_name: z.string().min(1).max(100),
  data_type: z.string().max(50).nullable().optional(),
  scraped_at: timestampSchema.optional(),
  created_at: timestampSchema.optional(),
});

// Family Cost Calculation Schema
export const familyCostCalculationSchema = z.object({
  id: uuidSchema.optional(),
  calculation_date: dateSchema,
  youth_location: z.string().min(1).max(200),
  family_location: z.string().min(1).max(200),
  
  // Travel costs
  distance_km: z.number().min(0).max(5000).nullable().optional(),
  travel_cost_per_trip: nonNegativeNumber.max(10000).nullable().optional(),
  trips_per_month: z.number().int().min(0).max(100).nullable().optional(),
  monthly_travel_cost: nonNegativeNumber.max(50000).nullable().optional(),
  
  // Communication costs
  phone_calls_per_week: z.number().int().min(0).max(100).nullable().optional(),
  call_cost_per_minute: nonNegativeNumber.max(10).nullable().optional(),
  average_call_duration: z.number().int().min(0).max(120).nullable().optional(),
  monthly_phone_cost: nonNegativeNumber.max(5000).nullable().optional(),
  
  // Lost wages
  work_days_missed_per_month: z.number().min(0).max(31).nullable().optional(),
  average_daily_wage: nonNegativeNumber.max(1000).nullable().optional(),
  monthly_lost_wages: nonNegativeNumber.max(20000).nullable().optional(),
  
  // Legal costs
  legal_representation: z.boolean().nullable().optional(),
  legal_cost_estimate: nonNegativeNumber.max(100000).nullable().optional(),
  
  // Totals
  total_monthly_cost: nonNegativeNumber.max(100000).nullable().optional(),
  total_annual_cost: nonNegativeNumber.max(1200000).nullable().optional(),
  
  // Comparison
  official_daily_cost: nonNegativeNumber.default(857),
  family_cost_percentage: percentageSchema.nullable().optional(),
  
  notes: z.string().nullable().optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

// Batch validation schemas
export const youthStatisticsBatchSchema = z.array(youthStatisticSchema);
export const budgetAllocationsBatchSchema = z.array(budgetAllocationSchema);

// Query parameter schemas
export const dateRangeQuerySchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Start date must be before or equal to end date",
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export type inferences
export type YouthStatistic = z.infer<typeof youthStatisticSchema>;
export type BudgetAllocation = z.infer<typeof budgetAllocationSchema>;
export type CourtStatistic = z.infer<typeof courtStatisticSchema>;
export type ParliamentaryDocument = z.infer<typeof parliamentaryDocumentSchema>;
export type CostComparison = z.infer<typeof costComparisonSchema>;
export type HiddenCost = z.infer<typeof hiddenCostSchema>;
export type ScrapedContent = z.infer<typeof scrapedContentSchema>;
export type FamilyCostCalculation = z.infer<typeof familyCostCalculationSchema>;

// Validation helper functions
export function validateYouthStatistic(data: unknown): YouthStatistic {
  return youthStatisticSchema.parse(data);
}

export function validateBudgetAllocation(data: unknown): BudgetAllocation {
  return budgetAllocationSchema.parse(data);
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}