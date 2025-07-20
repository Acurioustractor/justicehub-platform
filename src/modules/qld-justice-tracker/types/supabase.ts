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
      budget_allocations: {
        Row: {
          id: string
          fiscal_year: string
          department: string | null
          program: string
          category: string | null
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
          department?: string | null
          program: string
          category?: string | null
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
          department?: string | null
          program?: string
          category?: string | null
          amount?: number
          description?: string | null
          source_url?: string | null
          source_document?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      expenditures: {
        Row: {
          id: string
          allocation_id: string | null
          date: string
          amount: number
          facility_name: string | null
          program_type: string | null
          daily_cost: number | null
          youth_count: number | null
          indigenous_youth_count: number | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          allocation_id?: string | null
          date: string
          amount: number
          facility_name?: string | null
          program_type?: string | null
          daily_cost?: number | null
          youth_count?: number | null
          indigenous_youth_count?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          allocation_id?: string | null
          date?: string
          amount?: number
          facility_name?: string | null
          program_type?: string | null
          daily_cost?: number | null
          youth_count?: number | null
          indigenous_youth_count?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      youth_statistics: {
        Row: {
          id: string
          date: string
          facility_name: string | null
          total_youth: number
          indigenous_youth: number | null
          indigenous_percentage: number | null
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
          facility_name?: string | null
          total_youth: number
          indigenous_youth?: number | null
          indigenous_percentage?: number | null
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
          facility_name?: string | null
          total_youth?: number
          indigenous_youth?: number | null
          indigenous_percentage?: number | null
          average_age?: number | null
          average_stay_days?: number | null
          program_type?: string | null
          source_url?: string | null
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      parliamentary_documents: {
        Row: {
          id: string
          document_type: string | null
          title: string
          date: string | null
          author: string | null
          url: string | null
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
          document_type?: string | null
          title: string
          date?: string | null
          author?: string | null
          url?: string | null
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
          document_type?: string | null
          title?: string
          date?: string | null
          author?: string | null
          url?: string | null
          content?: string | null
          mentions_youth_justice?: boolean
          mentions_spending?: boolean
          mentions_indigenous?: boolean
          scraped_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      cost_comparisons: {
        Row: {
          id: string
          date: string
          detention_daily_cost: number
          community_daily_cost: number
          cost_ratio: number | null
          detention_spending_percentage: number | null
          community_spending_percentage: number | null
          total_budget: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          detention_daily_cost: number
          community_daily_cost: number
          cost_ratio?: number | null
          detention_spending_percentage?: number | null
          community_spending_percentage?: number | null
          total_budget?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          detention_daily_cost?: number
          community_daily_cost?: number
          cost_ratio?: number | null
          detention_spending_percentage?: number | null
          community_spending_percentage?: number | null
          total_budget?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hidden_costs: {
        Row: {
          id: string
          cost_category: string
          stakeholder_type: string | null
          description: string | null
          amount_per_instance: number | null
          frequency: string | null
          annual_estimate: number | null
          source: string | null
          notes: string | null
          created_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          cost_category: string
          stakeholder_type?: string | null
          description?: string | null
          amount_per_instance?: number | null
          frequency?: string | null
          annual_estimate?: number | null
          source?: string | null
          notes?: string | null
          created_date?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cost_category?: string
          stakeholder_type?: string | null
          description?: string | null
          amount_per_instance?: number | null
          frequency?: string | null
          annual_estimate?: number | null
          source?: string | null
          notes?: string | null
          created_date?: string
          updated_at?: string
        }
      }
      family_cost_calculations: {
        Row: {
          id: string
          calculation_date: string
          youth_location: string
          family_location: string
          distance_km: number | null
          travel_cost_per_trip: number | null
          trips_per_month: number | null
          monthly_travel_cost: number | null
          phone_calls_per_week: number | null
          call_cost_per_minute: number | null
          average_call_duration: number | null
          monthly_phone_cost: number | null
          work_days_missed_per_month: number | null
          average_daily_wage: number | null
          monthly_lost_wages: number | null
          legal_representation: boolean | null
          legal_cost_estimate: number | null
          total_monthly_cost: number | null
          total_annual_cost: number | null
          official_daily_cost: number
          family_cost_percentage: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          calculation_date: string
          youth_location: string
          family_location: string
          distance_km?: number | null
          travel_cost_per_trip?: number | null
          trips_per_month?: number | null
          monthly_travel_cost?: number | null
          phone_calls_per_week?: number | null
          call_cost_per_minute?: number | null
          average_call_duration?: number | null
          monthly_phone_cost?: number | null
          work_days_missed_per_month?: number | null
          average_daily_wage?: number | null
          monthly_lost_wages?: number | null
          legal_representation?: boolean | null
          legal_cost_estimate?: number | null
          total_monthly_cost?: number | null
          total_annual_cost?: number | null
          official_daily_cost?: number
          family_cost_percentage?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          calculation_date?: string
          youth_location?: string
          family_location?: string
          distance_km?: number | null
          travel_cost_per_trip?: number | null
          trips_per_month?: number | null
          monthly_travel_cost?: number | null
          phone_calls_per_week?: number | null
          call_cost_per_minute?: number | null
          average_call_duration?: number | null
          monthly_phone_cost?: number | null
          work_days_missed_per_month?: number | null
          average_daily_wage?: number | null
          monthly_lost_wages?: number | null
          legal_representation?: boolean | null
          legal_cost_estimate?: number | null
          total_monthly_cost?: number | null
          total_annual_cost?: number | null
          official_daily_cost?: number
          family_cost_percentage?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media_citations: {
        Row: {
          id: string
          publication: string
          article_title: string
          article_url: string | null
          publication_date: string
          author: string | null
          citation_type: string | null
          quoted_text: string | null
          reach_estimate: number | null
          sentiment: string | null
          notes: string | null
          created_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          publication: string
          article_title: string
          article_url?: string | null
          publication_date: string
          author?: string | null
          citation_type?: string | null
          quoted_text?: string | null
          reach_estimate?: number | null
          sentiment?: string | null
          notes?: string | null
          created_date?: string
          updated_at?: string
        }
        Update: {
          id?: string
          publication?: string
          article_title?: string
          article_url?: string | null
          publication_date?: string
          author?: string | null
          citation_type?: string | null
          quoted_text?: string | null
          reach_estimate?: number | null
          sentiment?: string | null
          notes?: string | null
          created_date?: string
          updated_at?: string
        }
      }
      policy_changes: {
        Row: {
          id: string
          title: string
          description: string | null
          change_type: string | null
          date_announced: string | null
          date_implemented: string | null
          department: string | null
          impact_estimate: string | null
          our_contribution: string | null
          supporting_documents: Json | null
          verified: boolean
          created_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          change_type?: string | null
          date_announced?: string | null
          date_implemented?: string | null
          department?: string | null
          impact_estimate?: string | null
          our_contribution?: string | null
          supporting_documents?: Json | null
          verified?: boolean
          created_date?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          change_type?: string | null
          date_announced?: string | null
          date_implemented?: string | null
          department?: string | null
          impact_estimate?: string | null
          our_contribution?: string | null
          supporting_documents?: Json | null
          verified?: boolean
          created_date?: string
          updated_at?: string
        }
      }
      impact_metrics: {
        Row: {
          id: string
          metric_date: string
          metric_type: string
          value: number
          details: string | null
          created_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          metric_date: string
          metric_type: string
          value: number
          details?: string | null
          created_date?: string
          updated_at?: string
        }
        Update: {
          id?: string
          metric_date?: string
          metric_type?: string
          value?: number
          details?: string | null
          created_date?: string
          updated_at?: string
        }
      }
      rti_requests: {
        Row: {
          id: string
          request_date: string
          department: string
          subject: string
          request_text: string
          response_date: string | null
          response_summary: string | null
          documents_received: number | null
          status: string | null
          reference_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_date: string
          department: string
          subject: string
          request_text: string
          response_date?: string | null
          response_summary?: string | null
          documents_received?: number | null
          status?: string | null
          reference_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_date?: string
          department?: string
          subject?: string
          request_text?: string
          response_date?: string | null
          response_summary?: string | null
          documents_received?: number | null
          status?: string | null
          reference_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          report_date: string
          report_type: string | null
          title: string
          summary: string | null
          key_findings: string | null
          recommendations: string | null
          file_path: string | null
          sent_to: string | null
          created_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_date: string
          report_type?: string | null
          title: string
          summary?: string | null
          key_findings?: string | null
          recommendations?: string | null
          file_path?: string | null
          sent_to?: string | null
          created_date?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_date?: string
          report_type?: string | null
          title?: string
          summary?: string | null
          key_findings?: string | null
          recommendations?: string | null
          file_path?: string | null
          sent_to?: string | null
          created_date?: string
          updated_at?: string
        }
      }
    }
  }
}