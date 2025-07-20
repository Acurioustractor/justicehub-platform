#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

console.log('🔧 Generating TypeScript types from Supabase schema...\n');

// Since we can't use Supabase CLI directly, let's create manual types based on our audit
const databaseTypes = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      youth_statistics: {
        Row: {
          id: string
          date: string
          facility_name: string
          total_youth: number
          indigenous_youth: number
          indigenous_percentage: number
          average_age: number | null
          average_stay_days: number | null
          program_type: string | null
          source_url: string | null
          scraped_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          facility_name: string
          total_youth: number
          indigenous_youth: number
          indigenous_percentage: number
          average_age?: number | null
          average_stay_days?: number | null
          program_type?: string | null
          source_url?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          facility_name?: string
          total_youth?: number
          indigenous_youth?: number
          indigenous_percentage?: number
          average_age?: number | null
          average_stay_days?: number | null
          program_type?: string | null
          source_url?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      budget_allocations: {
        Row: {
          id: string
          fiscal_year: string
          department: string
          program: string
          category: string
          amount: number
          description: string | null
          source_url: string | null
          source_document: string | null
          scraped_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fiscal_year: string
          department: string
          program: string
          category: string
          amount: number
          description?: string | null
          source_url?: string | null
          source_document?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fiscal_year?: string
          department?: string
          program?: string
          category?: string
          amount?: number
          description?: string | null
          source_url?: string | null
          source_document?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      court_statistics: {
        Row: {
          id: string
          court_type: string
          report_period: string
          total_defendants: number | null
          indigenous_defendants: number | null
          indigenous_percentage: number | null
          bail_refused_count: number | null
          bail_refused_percentage: number | null
          remanded_custody: number | null
          average_time_to_sentence_days: number | null
          most_common_offence: string | null
          source_document: string | null
          source_url: string | null
          scraped_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          court_type: string
          report_period: string
          total_defendants?: number | null
          indigenous_defendants?: number | null
          indigenous_percentage?: number | null
          bail_refused_count?: number | null
          bail_refused_percentage?: number | null
          remanded_custody?: number | null
          average_time_to_sentence_days?: number | null
          most_common_offence?: string | null
          source_document?: string | null
          source_url?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          court_type?: string
          report_period?: string
          total_defendants?: number | null
          indigenous_defendants?: number | null
          indigenous_percentage?: number | null
          bail_refused_count?: number | null
          bail_refused_percentage?: number | null
          remanded_custody?: number | null
          average_time_to_sentence_days?: number | null
          most_common_offence?: string | null
          source_document?: string | null
          source_url?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      parliamentary_documents: {
        Row: {
          id: string
          document_type: string
          title: string
          date: string
          author: string | null
          url: string
          content: string | null
          mentions_youth_justice: boolean
          mentions_spending: boolean
          mentions_indigenous: boolean
          scraped_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_type: string
          title: string
          date: string
          author?: string | null
          url: string
          content?: string | null
          mentions_youth_justice?: boolean
          mentions_spending?: boolean
          mentions_indigenous?: boolean
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_type?: string
          title?: string
          date?: string
          author?: string | null
          url?: string
          content?: string | null
          mentions_youth_justice?: boolean
          mentions_spending?: boolean
          mentions_indigenous?: boolean
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      scraped_content: {
        Row: {
          id: string
          source: string
          url: string
          title: string | null
          content: string
          metadata: Json | null
          scraper_name: string
          data_type: string | null
          scraped_at: string
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          url: string
          title?: string | null
          content: string
          metadata?: Json | null
          scraper_name: string
          data_type?: string | null
          scraped_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          url?: string
          title?: string | null
          content?: string
          metadata?: Json | null
          scraper_name?: string
          data_type?: string | null
          scraped_at?: string
          created_at?: string
        }
      }
      cost_comparisons: {
        Row: {
          id: string
          category: string
          item: string
          cost: number
          unit: string | null
          description: string | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          item: string
          cost: number
          unit?: string | null
          description?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          item?: string
          cost?: number
          unit?: string | null
          description?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hidden_costs: {
        Row: {
          id: string
          location: string
          cost_type: string
          amount: number
          description: string | null
          calculation_method: string | null
          data_source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location: string
          cost_type: string
          amount: number
          description?: string | null
          calculation_method?: string | null
          data_source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location?: string
          cost_type?: string
          amount?: number
          description?: string | null
          calculation_method?: string | null
          data_source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for easier imports
export type YouthStatistic = Tables<'youth_statistics'>
export type BudgetAllocation = Tables<'budget_allocations'>
export type CourtStatistic = Tables<'court_statistics'>
export type ParliamentaryDocument = Tables<'parliamentary_documents'>
export type ScrapedContent = Tables<'scraped_content'>
export type CostComparison = Tables<'cost_comparisons'>
export type HiddenCost = Tables<'hidden_costs'>
`;

// Create types directory if it doesn't exist
const typesDir = path.join(process.cwd(), 'types');
try {
  await fs.mkdir(typesDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Write the types file
const typesPath = path.join(typesDir, 'database.ts');
await fs.writeFile(typesPath, databaseTypes);

console.log(`✅ Database types generated at: ${typesPath}`);

// Also create a validation schema using Zod
const validationSchema = `import { z } from 'zod';

// Youth Statistics validation
export const youthStatisticSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
  fiscal_year: z.string().regex(/^\d{4}-\d{2}$/),
  department: z.string().min(1),
  program: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().min(0),
  description: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  source_document: z.string().nullable().optional(),
});

// Add more schemas as needed...
`;

const validationPath = path.join(typesDir, 'validation.ts');
await fs.writeFile(validationPath, validationSchema);

console.log(`✅ Validation schemas generated at: ${validationPath}`);

console.log('\n📝 Next steps:');
console.log('1. Install Zod for validation: npm install zod');
console.log('2. Update imports in your components to use these types');
console.log('3. Apply validation schemas to API endpoints');

process.exit(0);