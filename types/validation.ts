import { z } from 'zod';

// Youth Statistics validation
export const youthStatisticSchema = z.object({
  date: z.string().regex(/^d{4}-d{2}-d{2}$/),
  facility_name: z.string().min(1),
  total_youth: z.number().int().min(0),
  indigenous_youth: z.number().int().min(0),
  indigenous_percentage: z.number().min(0).max(100),
  average_age: z.number().nullable().optional(),
  average_stay_days: z.number().nullable().optional(),
  program_type: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
});

// Budget Allocation validation
export const budgetAllocationSchema = z.object({
  fiscal_year: z.string().regex(/^d{4}-d{2}$/),
  department: z.string().min(1),
  program: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().min(0),
  description: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  source_document: z.string().nullable().optional(),
});

// Add more schemas as needed...
