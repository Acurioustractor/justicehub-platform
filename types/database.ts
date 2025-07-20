export type Json =
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
