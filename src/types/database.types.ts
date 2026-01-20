export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      _act_migrations: {
        Row: {
          applied_at: string | null
          checksum: string
          filename: string
          id: number
        }
        Insert: {
          applied_at?: string | null
          checksum: string
          filename: string
          id?: number
        }
        Update: {
          applied_at?: string | null
          checksum?: string
          filename?: string
          id?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_type: string
          id: string
          message: string
          metadata: Json | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          id?: string
          message: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_registry: {
        Row: {
          agent_id: string
          avg_response_time_ms: number | null
          capabilities: Json | null
          config: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          endpoint: string
          endpoint_type: string | null
          health_status: string | null
          last_health_check: string | null
          model: string | null
          name: string
          owner: string | null
          success_rate: number | null
          tags: Json | null
          team: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          avg_response_time_ms?: number | null
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          endpoint: string
          endpoint_type?: string | null
          health_status?: string | null
          last_health_check?: string | null
          model?: string | null
          name: string
          owner?: string | null
          success_rate?: number | null
          tags?: Json | null
          team?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          avg_response_time_ms?: number | null
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          endpoint?: string
          endpoint_type?: string | null
          health_status?: string | null
          last_health_check?: string | null
          model?: string | null
          name?: string
          owner?: string | null
          success_rate?: number | null
          tags?: Json | null
          team?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_requests: {
        Row: {
          action: string
          confidence: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          params: Json | null
          request_id: string
          response_data: Json | null
          source_agent: string
          sources: Json | null
          status: string | null
          target_agent: string
        }
        Insert: {
          action: string
          confidence?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          params?: Json | null
          request_id: string
          response_data?: Json | null
          source_agent: string
          sources?: Json | null
          status?: string | null
          target_agent: string
        }
        Update: {
          action?: string
          confidence?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          params?: Json | null
          request_id?: string
          response_data?: Json | null
          source_agent?: string
          sources?: Json | null
          status?: string | null
          target_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_requests_source_agent_fkey"
            columns: ["source_agent"]
            isOneToOne: false
            referencedRelation: "agent_health_dashboard"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_requests_source_agent_fkey"
            columns: ["source_agent"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_requests_target_agent_fkey"
            columns: ["target_agent"]
            isOneToOne: false
            referencedRelation: "agent_health_dashboard"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_requests_target_agent_fkey"
            columns: ["target_agent"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["agent_id"]
          },
        ]
      }
      ai_content_verifications: {
        Row: {
          brand_voice_score: number | null
          community_voice_score: number | null
          content_id: string | null
          content_type: string
          created_at: string | null
          cultural_safety_score: number | null
          elder_notes: string | null
          elder_reviewed_at: string | null
          elder_reviewed_by: string | null
          factual_accuracy_score: number | null
          final_content: string | null
          generated_content: string
          human_notes: string | null
          id: string
          improvement_suggestions: string[] | null
          issues_found: string[] | null
          overall_quality_score: number | null
          project_slug: string | null
          requires_elder_review: boolean | null
          status: string
          training_added_at: string | null
          used_for_training: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          brand_voice_score?: number | null
          community_voice_score?: number | null
          content_id?: string | null
          content_type: string
          created_at?: string | null
          cultural_safety_score?: number | null
          elder_notes?: string | null
          elder_reviewed_at?: string | null
          elder_reviewed_by?: string | null
          factual_accuracy_score?: number | null
          final_content?: string | null
          generated_content: string
          human_notes?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          issues_found?: string[] | null
          overall_quality_score?: number | null
          project_slug?: string | null
          requires_elder_review?: boolean | null
          status: string
          training_added_at?: string | null
          used_for_training?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          brand_voice_score?: number | null
          community_voice_score?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          cultural_safety_score?: number | null
          elder_notes?: string | null
          elder_reviewed_at?: string | null
          elder_reviewed_by?: string | null
          factual_accuracy_score?: number | null
          final_content?: string | null
          generated_content?: string
          human_notes?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          issues_found?: string[] | null
          overall_quality_score?: number | null
          project_slug?: string | null
          requires_elder_review?: boolean | null
          status?: string
          training_added_at?: string | null
          used_for_training?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      ai_discoveries: {
        Row: {
          confidence_score: number | null
          context_after: string | null
          context_before: string | null
          discovered_at: string | null
          discovery_type: string
          extracted_text: string
          human_verified: boolean | null
          id: string
          storyteller_id: string | null
          transcript_id: string | null
          updated_at: string | null
          verification_notes: string | null
        }
        Insert: {
          confidence_score?: number | null
          context_after?: string | null
          context_before?: string | null
          discovered_at?: string | null
          discovery_type: string
          extracted_text: string
          human_verified?: boolean | null
          id?: string
          storyteller_id?: string | null
          transcript_id?: string | null
          updated_at?: string | null
          verification_notes?: string | null
        }
        Update: {
          confidence_score?: number | null
          context_after?: string | null
          context_before?: string | null
          discovered_at?: string | null
          discovery_type?: string
          extracted_text?: string
          human_verified?: boolean | null
          id?: string
          storyteller_id?: string | null
          transcript_id?: string | null
          updated_at?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_discoveries_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_discoveries_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_community_contexts: {
        Row: {
          consent_level: string
          context_type: string
          contributors: string[] | null
          created_at: string | null
          cultural_authority: string
          demographics: string | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          population_size: string | null
          protective_factors: string | null
          search_vector: unknown
          state: string | null
          system_factors: string | null
          updated_at: string | null
        }
        Insert: {
          consent_level?: string
          context_type: string
          contributors?: string[] | null
          created_at?: string | null
          cultural_authority: string
          demographics?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          population_size?: string | null
          protective_factors?: string | null
          search_vector?: unknown
          state?: string | null
          system_factors?: string | null
          updated_at?: string | null
        }
        Update: {
          consent_level?: string
          context_type?: string
          contributors?: string[] | null
          created_at?: string | null
          cultural_authority?: string
          demographics?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          population_size?: string | null
          protective_factors?: string | null
          search_vector?: unknown
          state?: string | null
          system_factors?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alma_consent_ledger: {
        Row: {
          attribution_text: string | null
          consent_expires_at: string | null
          consent_given_at: string | null
          consent_given_by: string | null
          consent_level: string
          consent_revoked: boolean | null
          consent_revoked_at: string | null
          consent_revoked_by: string | null
          contributors: Json | null
          created_at: string | null
          cultural_authority: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          notes: string | null
          permitted_uses: string[] | null
          revenue_share_enabled: boolean | null
          revenue_share_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          attribution_text?: string | null
          consent_expires_at?: string | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          consent_level: string
          consent_revoked?: boolean | null
          consent_revoked_at?: string | null
          consent_revoked_by?: string | null
          contributors?: Json | null
          created_at?: string | null
          cultural_authority?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          permitted_uses?: string[] | null
          revenue_share_enabled?: boolean | null
          revenue_share_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          attribution_text?: string | null
          consent_expires_at?: string | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          consent_level?: string
          consent_revoked?: boolean | null
          consent_revoked_at?: string | null
          consent_revoked_by?: string | null
          contributors?: Json | null
          created_at?: string | null
          cultural_authority?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          permitted_uses?: string[] | null
          revenue_share_enabled?: boolean | null
          revenue_share_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alma_content_entities: {
        Row: {
          content_end_pos: number | null
          content_start_pos: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          extracted_at: string | null
          extraction_confidence: number | null
          extraction_method: string | null
          id: string
          matched_text: string | null
          raw_content_id: string
        }
        Insert: {
          content_end_pos?: number | null
          content_start_pos?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          extracted_at?: string | null
          extraction_confidence?: number | null
          extraction_method?: string | null
          id?: string
          matched_text?: string | null
          raw_content_id: string
        }
        Update: {
          content_end_pos?: number | null
          content_start_pos?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          extracted_at?: string | null
          extraction_confidence?: number | null
          extraction_method?: string | null
          id?: string
          matched_text?: string | null
          raw_content_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alma_content_entities_raw_content_id_fkey"
            columns: ["raw_content_id"]
            isOneToOne: false
            referencedRelation: "alma_raw_content"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_coverage_metrics: {
        Row: {
          calculated_at: string | null
          coverage_score: number | null
          dimension_type: string | null
          dimension_value: string
          evidence_count: number | null
          id: string
          intervention_count: number | null
          last_update: string | null
          metadata: Json | null
          priority_rank: number | null
          recommended_sources: string[] | null
          source_count: number | null
          update_frequency_avg: number | null
        }
        Insert: {
          calculated_at?: string | null
          coverage_score?: number | null
          dimension_type?: string | null
          dimension_value: string
          evidence_count?: number | null
          id?: string
          intervention_count?: number | null
          last_update?: string | null
          metadata?: Json | null
          priority_rank?: number | null
          recommended_sources?: string[] | null
          source_count?: number | null
          update_frequency_avg?: number | null
        }
        Update: {
          calculated_at?: string | null
          coverage_score?: number | null
          dimension_type?: string | null
          dimension_value?: string
          evidence_count?: number | null
          id?: string
          intervention_count?: number | null
          last_update?: string | null
          metadata?: Json | null
          priority_rank?: number | null
          recommended_sources?: string[] | null
          source_count?: number | null
          update_frequency_avg?: number | null
        }
        Relationships: []
      }
      alma_discovered_links: {
        Row: {
          added_to_registry: boolean | null
          created_at: string | null
          discovered_from: string
          error_message: string | null
          id: string
          jurisdiction_hint: string | null
          metadata: Json | null
          predicted_relevance: number | null
          predicted_type: string | null
          priority: number | null
          rejection_reason: string | null
          relevance_category: string | null
          scraped_at: string | null
          status: string | null
          title: string | null
          url: string
        }
        Insert: {
          added_to_registry?: boolean | null
          created_at?: string | null
          discovered_from: string
          error_message?: string | null
          id?: string
          jurisdiction_hint?: string | null
          metadata?: Json | null
          predicted_relevance?: number | null
          predicted_type?: string | null
          priority?: number | null
          rejection_reason?: string | null
          relevance_category?: string | null
          scraped_at?: string | null
          status?: string | null
          title?: string | null
          url: string
        }
        Update: {
          added_to_registry?: boolean | null
          created_at?: string | null
          discovered_from?: string
          error_message?: string | null
          id?: string
          jurisdiction_hint?: string | null
          metadata?: Json | null
          predicted_relevance?: number | null
          predicted_type?: string | null
          priority?: number | null
          rejection_reason?: string | null
          relevance_category?: string | null
          scraped_at?: string | null
          status?: string | null
          title?: string | null
          url?: string
        }
        Relationships: []
      }
      alma_embeddings: {
        Row: {
          created_at: string | null
          embedding_data: Json
          embedding_dimensions: number
          embedding_model: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          source_text: string
          source_text_hash: string
        }
        Insert: {
          created_at?: string | null
          embedding_data: Json
          embedding_dimensions?: number
          embedding_model?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          source_text: string
          source_text_hash: string
        }
        Update: {
          created_at?: string | null
          embedding_data?: Json
          embedding_dimensions?: number
          embedding_model?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          source_text?: string
          source_text_hash?: string
        }
        Relationships: []
      }
      alma_entity_sources: {
        Row: {
          citation_context: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          page_numbers: string | null
          quote: string | null
          section_reference: string | null
          source_document_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          citation_context?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          page_numbers?: string | null
          quote?: string | null
          section_reference?: string | null
          source_document_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          citation_context?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          page_numbers?: string | null
          quote?: string | null
          section_reference?: string | null
          source_document_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_entity_sources_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "alma_source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_entity_tags: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
          tagged_by: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
          tagged_by?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
          tagged_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "alma_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_evidence: {
        Row: {
          author: string | null
          author_profile_id: string | null
          consent_level: string
          contributors: string[] | null
          created_at: string | null
          cultural_safety: string | null
          doi: string | null
          effect_size: string | null
          evidence_type: string
          findings: string
          id: string
          limitations: string | null
          metadata: Json | null
          methodology: string | null
          organization: string | null
          publication_date: string | null
          sample_size: number | null
          search_vector: unknown
          source_document_url: string | null
          source_url: string | null
          timeframe: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          author_profile_id?: string | null
          consent_level?: string
          contributors?: string[] | null
          created_at?: string | null
          cultural_safety?: string | null
          doi?: string | null
          effect_size?: string | null
          evidence_type: string
          findings: string
          id?: string
          limitations?: string | null
          metadata?: Json | null
          methodology?: string | null
          organization?: string | null
          publication_date?: string | null
          sample_size?: number | null
          search_vector?: unknown
          source_document_url?: string | null
          source_url?: string | null
          timeframe?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          author_profile_id?: string | null
          consent_level?: string
          contributors?: string[] | null
          created_at?: string | null
          cultural_safety?: string | null
          doi?: string | null
          effect_size?: string | null
          evidence_type?: string
          findings?: string
          id?: string
          limitations?: string | null
          metadata?: Json | null
          methodology?: string | null
          organization?: string | null
          publication_date?: string | null
          sample_size?: number | null
          search_vector?: unknown
          source_document_url?: string | null
          source_url?: string | null
          timeframe?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_evidence_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_evidence_outcomes: {
        Row: {
          created_at: string | null
          evidence_id: string
          id: string
          outcome_id: string
        }
        Insert: {
          created_at?: string | null
          evidence_id: string
          id?: string
          outcome_id: string
        }
        Update: {
          created_at?: string | null
          evidence_id?: string
          id?: string
          outcome_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alma_evidence_outcomes_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "alma_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_evidence_outcomes_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "alma_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_external_source_cache: {
        Row: {
          author: string | null
          content_hash: string | null
          expires_at: string | null
          fetched_at: string | null
          id: string
          parsed_content: Json | null
          publication_date: string | null
          source_type: string | null
          title: string | null
          url: string
        }
        Insert: {
          author?: string | null
          content_hash?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          parsed_content?: Json | null
          publication_date?: string | null
          source_type?: string | null
          title?: string | null
          url: string
        }
        Update: {
          author?: string | null
          content_hash?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          parsed_content?: Json | null
          publication_date?: string | null
          source_type?: string | null
          title?: string | null
          url?: string
        }
        Relationships: []
      }
      alma_extraction_patterns: {
        Row: {
          avg_entities: number | null
          created_at: string | null
          extraction_prompt: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          metadata: Json | null
          pattern_name: string
          pattern_version: number | null
          source_type: string
          success_rate: number | null
          successful_extractions: number | null
          superseded_by: string | null
          times_used: number | null
          total_entities_extracted: number | null
          updated_at: string | null
        }
        Insert: {
          avg_entities?: number | null
          created_at?: string | null
          extraction_prompt: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          pattern_name: string
          pattern_version?: number | null
          source_type: string
          success_rate?: number | null
          successful_extractions?: number | null
          superseded_by?: string | null
          times_used?: number | null
          total_entities_extracted?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_entities?: number | null
          created_at?: string | null
          extraction_prompt?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          pattern_name?: string
          pattern_version?: number | null
          source_type?: string
          success_rate?: number | null
          successful_extractions?: number | null
          superseded_by?: string | null
          times_used?: number | null
          total_entities_extracted?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_extraction_patterns_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "alma_extraction_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_funding_applications: {
        Row: {
          amount_awarded: number | null
          amount_requested: number | null
          created_at: string | null
          id: string
          internal_match_score: number | null
          notes: string | null
          opportunity_id: string
          organization_id: string | null
          outcome_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          amount_awarded?: number | null
          amount_requested?: number | null
          created_at?: string | null
          id?: string
          internal_match_score?: number | null
          notes?: string | null
          opportunity_id: string
          organization_id?: string | null
          outcome_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_awarded?: number | null
          amount_requested?: number | null
          created_at?: string | null
          id?: string
          internal_match_score?: number | null
          notes?: string | null
          opportunity_id?: string
          organization_id?: string | null
          outcome_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_funding_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "alma_funding_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_funding_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_funding_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_funding_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_funding_data: {
        Row: {
          community_expenditure: number | null
          completion_rate: number | null
          cost_per_day_community: number | null
          cost_per_day_detention: number | null
          cost_per_participant: number | null
          created_at: string | null
          detention_expenditure: number | null
          diversion_expenditure: number | null
          id: string
          indigenous_percentage: number | null
          jurisdiction: string | null
          metadata: Json | null
          prevention_expenditure: number | null
          raw_data: Json | null
          recidivism_rate: number | null
          report_year: string
          source_name: string
          source_type: string | null
          source_url: string
          total_expenditure: number | null
          updated_at: string | null
          young_people_detained: number | null
          young_people_supervised: number | null
        }
        Insert: {
          community_expenditure?: number | null
          completion_rate?: number | null
          cost_per_day_community?: number | null
          cost_per_day_detention?: number | null
          cost_per_participant?: number | null
          created_at?: string | null
          detention_expenditure?: number | null
          diversion_expenditure?: number | null
          id?: string
          indigenous_percentage?: number | null
          jurisdiction?: string | null
          metadata?: Json | null
          prevention_expenditure?: number | null
          raw_data?: Json | null
          recidivism_rate?: number | null
          report_year: string
          source_name: string
          source_type?: string | null
          source_url: string
          total_expenditure?: number | null
          updated_at?: string | null
          young_people_detained?: number | null
          young_people_supervised?: number | null
        }
        Update: {
          community_expenditure?: number | null
          completion_rate?: number | null
          cost_per_day_community?: number | null
          cost_per_day_detention?: number | null
          cost_per_participant?: number | null
          created_at?: string | null
          detention_expenditure?: number | null
          diversion_expenditure?: number | null
          id?: string
          indigenous_percentage?: number | null
          jurisdiction?: string | null
          metadata?: Json | null
          prevention_expenditure?: number | null
          raw_data?: Json | null
          recidivism_rate?: number | null
          report_year?: string
          source_name?: string
          source_type?: string | null
          source_url?: string
          total_expenditure?: number | null
          updated_at?: string | null
          young_people_detained?: number | null
          young_people_supervised?: number | null
        }
        Relationships: []
      }
      alma_funding_opportunities: {
        Row: {
          application_url: string | null
          category: string | null
          created_at: string | null
          deadline: string | null
          decision_date: string | null
          description: string | null
          eligibility_criteria: Json | null
          eligible_org_types: string[] | null
          focus_areas: string[] | null
          funder_name: string
          funding_duration: string | null
          guidelines_url: string | null
          id: string
          is_national: boolean | null
          jurisdictions: string[] | null
          keywords: string[] | null
          max_grant_amount: number | null
          min_grant_amount: number | null
          name: string
          opens_at: string | null
          raw_data: Json | null
          regions: string[] | null
          relevance_score: number | null
          requires_abn: boolean | null
          requires_deductible_gift_recipient: boolean | null
          scrape_source: string | null
          scraped_at: string | null
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string
          total_pool_amount: number | null
          updated_at: string | null
        }
        Insert: {
          application_url?: string | null
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          decision_date?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          eligible_org_types?: string[] | null
          focus_areas?: string[] | null
          funder_name: string
          funding_duration?: string | null
          guidelines_url?: string | null
          id?: string
          is_national?: boolean | null
          jurisdictions?: string[] | null
          keywords?: string[] | null
          max_grant_amount?: number | null
          min_grant_amount?: number | null
          name: string
          opens_at?: string | null
          raw_data?: Json | null
          regions?: string[] | null
          relevance_score?: number | null
          requires_abn?: boolean | null
          requires_deductible_gift_recipient?: boolean | null
          scrape_source?: string | null
          scraped_at?: string | null
          source_id?: string | null
          source_type: string
          source_url?: string | null
          status?: string
          total_pool_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          application_url?: string | null
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          decision_date?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          eligible_org_types?: string[] | null
          focus_areas?: string[] | null
          funder_name?: string
          funding_duration?: string | null
          guidelines_url?: string | null
          id?: string
          is_national?: boolean | null
          jurisdictions?: string[] | null
          keywords?: string[] | null
          max_grant_amount?: number | null
          min_grant_amount?: number | null
          name?: string
          opens_at?: string | null
          raw_data?: Json | null
          regions?: string[] | null
          relevance_score?: number | null
          requires_abn?: boolean | null
          requires_deductible_gift_recipient?: boolean | null
          scrape_source?: string | null
          scraped_at?: string | null
          source_id?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          total_pool_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alma_government_programs: {
        Row: {
          announced_date: string | null
          budget_amount: number | null
          budget_currency: string | null
          community_led: boolean | null
          consent_level: string | null
          created_at: string | null
          cultural_authority: boolean | null
          description: string | null
          id: string
          implementation_date: string | null
          jurisdiction: string | null
          name: string
          official_url: string | null
          program_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          announced_date?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          community_led?: boolean | null
          consent_level?: string | null
          created_at?: string | null
          cultural_authority?: boolean | null
          description?: string | null
          id?: string
          implementation_date?: string | null
          jurisdiction?: string | null
          name: string
          official_url?: string | null
          program_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          announced_date?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          community_led?: boolean | null
          consent_level?: string | null
          created_at?: string | null
          cultural_authority?: boolean | null
          description?: string | null
          id?: string
          implementation_date?: string | null
          jurisdiction?: string | null
          name?: string
          official_url?: string | null
          program_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alma_ingestion_jobs: {
        Row: {
          category: string | null
          completed_at: string | null
          consent_level: string | null
          created_at: string | null
          cultural_authority: boolean | null
          documents_found: number | null
          entities_created: number | null
          error: string | null
          id: string
          metadata: Json | null
          source_type: string
          source_url: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          consent_level?: string | null
          created_at?: string | null
          cultural_authority?: boolean | null
          documents_found?: number | null
          entities_created?: number | null
          error?: string | null
          id?: string
          metadata?: Json | null
          source_type: string
          source_url: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          consent_level?: string | null
          created_at?: string | null
          cultural_authority?: boolean | null
          documents_found?: number | null
          entities_created?: number | null
          error?: string | null
          id?: string
          metadata?: Json | null
          source_type?: string
          source_url?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      alma_intervention_contexts: {
        Row: {
          context_id: string
          created_at: string | null
          id: string
          intervention_id: string
        }
        Insert: {
          context_id: string
          created_at?: string | null
          id?: string
          intervention_id: string
        }
        Update: {
          context_id?: string
          created_at?: string | null
          id?: string
          intervention_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alma_intervention_contexts_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "alma_community_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_intervention_contexts_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_intervention_evidence: {
        Row: {
          created_at: string | null
          evidence_id: string
          id: string
          intervention_id: string
        }
        Insert: {
          created_at?: string | null
          evidence_id: string
          id?: string
          intervention_id: string
        }
        Update: {
          created_at?: string | null
          evidence_id?: string
          id?: string
          intervention_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alma_intervention_evidence_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "alma_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_intervention_evidence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_intervention_funding: {
        Row: {
          annual_budget: number | null
          comparison_to_detention: number | null
          confidence_level: string | null
          cost_benefit_ratio: number | null
          cost_per_participant: number | null
          cost_per_successful_outcome: number | null
          created_at: string | null
          data_source: string | null
          data_year: number | null
          funding_amount: number | null
          funding_data_id: string | null
          funding_period_end: string | null
          funding_period_start: string | null
          funding_source: string | null
          funding_type: string | null
          id: string
          intervention_id: string
          notes: string | null
          participants_per_year: number | null
          updated_at: string | null
        }
        Insert: {
          annual_budget?: number | null
          comparison_to_detention?: number | null
          confidence_level?: string | null
          cost_benefit_ratio?: number | null
          cost_per_participant?: number | null
          cost_per_successful_outcome?: number | null
          created_at?: string | null
          data_source?: string | null
          data_year?: number | null
          funding_amount?: number | null
          funding_data_id?: string | null
          funding_period_end?: string | null
          funding_period_start?: string | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          intervention_id: string
          notes?: string | null
          participants_per_year?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_budget?: number | null
          comparison_to_detention?: number | null
          confidence_level?: string | null
          cost_benefit_ratio?: number | null
          cost_per_participant?: number | null
          cost_per_successful_outcome?: number | null
          created_at?: string | null
          data_source?: string | null
          data_year?: number | null
          funding_amount?: number | null
          funding_data_id?: string | null
          funding_period_end?: string | null
          funding_period_start?: string | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          intervention_id?: string
          notes?: string | null
          participants_per_year?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_intervention_funding_funding_data_id_fkey"
            columns: ["funding_data_id"]
            isOneToOne: false
            referencedRelation: "alma_funding_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_intervention_funding_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_intervention_outcomes: {
        Row: {
          created_at: string | null
          id: string
          intervention_id: string
          outcome_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intervention_id: string
          outcome_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intervention_id?: string
          outcome_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alma_intervention_outcomes_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_intervention_outcomes_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "alma_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_intervention_profiles: {
        Row: {
          created_at: string | null
          ended_date: string | null
          id: string
          intervention_id: string
          notes: string | null
          public_profile_id: string
          role: string
          started_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ended_date?: string | null
          id?: string
          intervention_id: string
          notes?: string | null
          public_profile_id: string
          role: string
          started_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ended_date?: string | null
          id?: string
          intervention_id?: string
          notes?: string | null
          public_profile_id?: string
          role?: string
          started_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_intervention_profiles_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_intervention_profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_interventions: {
        Row: {
          community_authority_signal: number | null
          consent_level: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contributors: string[] | null
          cost_per_young_person: number | null
          created_at: string | null
          cultural_authority: string | null
          current_funding: string | null
          description: string
          evidence_level: string | null
          evidence_strength_signal: number | null
          geography: string[] | null
          harm_risk_level: string | null
          harm_risk_signal: number | null
          id: string
          implementation_capability_signal: number | null
          implementation_cost: string | null
          latitude: number | null
          linked_community_program_id: string | null
          linked_service_id: string | null
          location_type: string | null
          longitude: number | null
          metadata: Json | null
          name: string
          operating_organization: string | null
          operating_organization_id: string | null
          option_value_signal: number | null
          permitted_uses: string[] | null
          portfolio_score: number | null
          replication_readiness: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          risks: string | null
          scalability: string | null
          search_vector: unknown
          service_area_km: number | null
          source_documents: Json | null
          target_cohort: string[] | null
          type: string
          updated_at: string | null
          website: string | null
          years_operating: number | null
        }
        Insert: {
          community_authority_signal?: number | null
          consent_level?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contributors?: string[] | null
          cost_per_young_person?: number | null
          created_at?: string | null
          cultural_authority?: string | null
          current_funding?: string | null
          description: string
          evidence_level?: string | null
          evidence_strength_signal?: number | null
          geography?: string[] | null
          harm_risk_level?: string | null
          harm_risk_signal?: number | null
          id?: string
          implementation_capability_signal?: number | null
          implementation_cost?: string | null
          latitude?: number | null
          linked_community_program_id?: string | null
          linked_service_id?: string | null
          location_type?: string | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          operating_organization?: string | null
          operating_organization_id?: string | null
          option_value_signal?: number | null
          permitted_uses?: string[] | null
          portfolio_score?: number | null
          replication_readiness?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risks?: string | null
          scalability?: string | null
          search_vector?: unknown
          service_area_km?: number | null
          source_documents?: Json | null
          target_cohort?: string[] | null
          type: string
          updated_at?: string | null
          website?: string | null
          years_operating?: number | null
        }
        Update: {
          community_authority_signal?: number | null
          consent_level?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contributors?: string[] | null
          cost_per_young_person?: number | null
          created_at?: string | null
          cultural_authority?: string | null
          current_funding?: string | null
          description?: string
          evidence_level?: string | null
          evidence_strength_signal?: number | null
          geography?: string[] | null
          harm_risk_level?: string | null
          harm_risk_signal?: number | null
          id?: string
          implementation_capability_signal?: number | null
          implementation_cost?: string | null
          latitude?: number | null
          linked_community_program_id?: string | null
          linked_service_id?: string | null
          location_type?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          operating_organization?: string | null
          operating_organization_id?: string | null
          option_value_signal?: number | null
          permitted_uses?: string[] | null
          portfolio_score?: number | null
          replication_readiness?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risks?: string | null
          scalability?: string | null
          search_vector?: unknown
          service_area_km?: number | null
          source_documents?: Json | null
          target_cohort?: string[] | null
          type?: string
          updated_at?: string | null
          website?: string | null
          years_operating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_interventions_linked_community_program_id_fkey"
            columns: ["linked_community_program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_interventions_linked_service_id_fkey"
            columns: ["linked_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_interventions_linked_service_id_fkey"
            columns: ["linked_service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_interventions_operating_organization_id_fkey"
            columns: ["operating_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_interventions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_locations: {
        Row: {
          id: string
          indigenous_population_pct: number | null
          latitude: number | null
          lga_name: string | null
          location_type: string | null
          longitude: number | null
          name: string
          postcode: string | null
          sa3_name: string | null
          state: string
          traditional_country: string | null
        }
        Insert: {
          id?: string
          indigenous_population_pct?: number | null
          latitude?: number | null
          lga_name?: string | null
          location_type?: string | null
          longitude?: number | null
          name: string
          postcode?: string | null
          sa3_name?: string | null
          state: string
          traditional_country?: string | null
        }
        Update: {
          id?: string
          indigenous_population_pct?: number | null
          latitude?: number | null
          lga_name?: string | null
          location_type?: string | null
          longitude?: number | null
          name?: string
          postcode?: string | null
          sa3_name?: string | null
          state?: string
          traditional_country?: string | null
        }
        Relationships: []
      }
      alma_media_articles: {
        Row: {
          community_mentions: Json | null
          confidence: number | null
          created_at: string | null
          full_text: string | null
          government_mentions: Json | null
          headline: string
          id: string
          intervention_mentions: string[] | null
          job_id: string | null
          key_quotes: string[] | null
          published_date: string | null
          sentiment: string | null
          sentiment_score: number | null
          source_name: string | null
          summary: string | null
          topics: string[] | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          community_mentions?: Json | null
          confidence?: number | null
          created_at?: string | null
          full_text?: string | null
          government_mentions?: Json | null
          headline: string
          id?: string
          intervention_mentions?: string[] | null
          job_id?: string | null
          key_quotes?: string[] | null
          published_date?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          summary?: string | null
          topics?: string[] | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          community_mentions?: Json | null
          confidence?: number | null
          created_at?: string | null
          full_text?: string | null
          government_mentions?: Json | null
          headline?: string
          id?: string
          intervention_mentions?: string[] | null
          job_id?: string | null
          key_quotes?: string[] | null
          published_date?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          summary?: string | null
          topics?: string[] | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_media_articles_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "alma_ingestion_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_metrics_history: {
        Row: {
          id: string
          intervention_type: string | null
          jurisdiction: string | null
          metadata: Json | null
          metric_category: string
          metric_name: string
          recorded_at: string | null
          source_type: string | null
          value_count: number | null
          value_numeric: number | null
          value_percentage: number | null
        }
        Insert: {
          id?: string
          intervention_type?: string | null
          jurisdiction?: string | null
          metadata?: Json | null
          metric_category: string
          metric_name: string
          recorded_at?: string | null
          source_type?: string | null
          value_count?: number | null
          value_numeric?: number | null
          value_percentage?: number | null
        }
        Update: {
          id?: string
          intervention_type?: string | null
          jurisdiction?: string | null
          metadata?: Json | null
          metric_category?: string
          metric_name?: string
          recorded_at?: string | null
          source_type?: string | null
          value_count?: number | null
          value_numeric?: number | null
          value_percentage?: number | null
        }
        Relationships: []
      }
      alma_outcomes: {
        Row: {
          beneficiary: string | null
          created_at: string | null
          description: string | null
          id: string
          indicators: string | null
          measurement_method: string | null
          metadata: Json | null
          name: string
          outcome_type: string
          search_vector: unknown
          time_horizon: string | null
          updated_at: string | null
        }
        Insert: {
          beneficiary?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          indicators?: string | null
          measurement_method?: string | null
          metadata?: Json | null
          name: string
          outcome_type: string
          search_vector?: unknown
          time_horizon?: string | null
          updated_at?: string | null
        }
        Update: {
          beneficiary?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          indicators?: string | null
          measurement_method?: string | null
          metadata?: Json | null
          name?: string
          outcome_type?: string
          search_vector?: unknown
          time_horizon?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alma_program_interventions: {
        Row: {
          created_at: string | null
          id: string
          intervention_id: string | null
          notes: string | null
          program_id: string | null
          relationship: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intervention_id?: string | null
          notes?: string | null
          program_id?: string | null
          relationship?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intervention_id?: string | null
          notes?: string | null
          program_id?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_program_interventions_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_program_interventions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "alma_government_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_program_interventions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "alma_sentiment_program_correlation"
            referencedColumns: ["program_id"]
          },
        ]
      }
      alma_raw_content: {
        Row: {
          content_hash: string
          content_length: number | null
          created_at: string | null
          evidence_extracted: number | null
          extracted_at: string | null
          extraction_method: string | null
          file_hash: string | null
          file_mime_type: string | null
          file_path: string | null
          file_size_bytes: number | null
          funding_data_extracted: number | null
          id: string
          interventions_extracted: number | null
          language: string | null
          last_processed_at: string | null
          page_count: number | null
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          raw_content: string
          relevance_score: number | null
          search_vector: unknown
          source_type: string | null
          source_url: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          content_hash: string
          content_length?: number | null
          created_at?: string | null
          evidence_extracted?: number | null
          extracted_at?: string | null
          extraction_method?: string | null
          file_hash?: string | null
          file_mime_type?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          funding_data_extracted?: number | null
          id?: string
          interventions_extracted?: number | null
          language?: string | null
          last_processed_at?: string | null
          page_count?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          raw_content: string
          relevance_score?: number | null
          search_vector?: unknown
          source_type?: string | null
          source_url: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          content_hash?: string
          content_length?: number | null
          created_at?: string | null
          evidence_extracted?: number | null
          extracted_at?: string | null
          extraction_method?: string | null
          file_hash?: string | null
          file_mime_type?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          funding_data_extracted?: number | null
          id?: string
          interventions_extracted?: number | null
          language?: string | null
          last_processed_at?: string | null
          page_count?: number | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          raw_content?: string
          relevance_score?: number | null
          search_vector?: unknown
          source_type?: string | null
          source_url?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      alma_report_deliveries: {
        Row: {
          created_at: string | null
          delivery_method: string
          error_message: string | null
          id: string
          opened_at: string | null
          recipient_email: string | null
          recipient_user_id: string | null
          report_id: string
          sent_at: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_method: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string | null
          recipient_user_id?: string | null
          report_id: string
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_method?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string | null
          recipient_user_id?: string | null
          report_id?: string
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_report_deliveries_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "alma_weekly_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_report_deliveries_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "v_latest_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_report_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "alma_report_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_report_subscriptions: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          delivery_method: string
          email: string | null
          frequency: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          report_types: string[] | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          delivery_method?: string
          email?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          report_types?: string[] | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          delivery_method?: string
          email?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          report_types?: string[] | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_report_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_research_findings: {
        Row: {
          applied: boolean | null
          applied_at: string | null
          confidence: number | null
          content: Json
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          finding_type: string
          id: string
          session_id: string | null
          sources: string[] | null
          validated: boolean | null
          validation_source: string | null
        }
        Insert: {
          applied?: boolean | null
          applied_at?: string | null
          confidence?: number | null
          content: Json
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          finding_type: string
          id?: string
          session_id?: string | null
          sources?: string[] | null
          validated?: boolean | null
          validation_source?: string | null
        }
        Update: {
          applied?: boolean | null
          applied_at?: string | null
          confidence?: number | null
          content?: Json
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          finding_type?: string
          id?: string
          session_id?: string | null
          sources?: string[] | null
          validated?: boolean | null
          validation_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_research_findings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "alma_research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_research_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          depth: string | null
          error_message: string | null
          id: string
          max_consent_level: string | null
          plan: Json | null
          query: string
          results: Json | null
          retry_count: number | null
          scratchpad: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          depth?: string | null
          error_message?: string | null
          id?: string
          max_consent_level?: string | null
          plan?: Json | null
          query: string
          results?: Json | null
          retry_count?: number | null
          scratchpad?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          depth?: string | null
          error_message?: string | null
          id?: string
          max_consent_level?: string | null
          plan?: Json | null
          query?: string
          results?: Json | null
          retry_count?: number | null
          scratchpad?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      alma_research_tool_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          session_id: string | null
          success: boolean | null
          tool_input: Json | null
          tool_name: string
          tool_output: Json | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          session_id?: string | null
          success?: boolean | null
          tool_input?: Json | null
          tool_name: string
          tool_output?: Json | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          session_id?: string | null
          success?: boolean | null
          tool_input?: Json | null
          tool_name?: string
          tool_output?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_research_tool_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "alma_research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_scrape_history: {
        Row: {
          completed_at: string | null
          content_length: number | null
          created_at: string | null
          duration_seconds: number | null
          entities_found: number | null
          entities_inserted: number | null
          error_message: string | null
          extracted_data: Json | null
          id: string
          links_discovered: string[] | null
          metadata: Json | null
          novelty_score: number | null
          pattern_id: string | null
          quality_score: number | null
          relevance_score: number | null
          source_id: string | null
          source_url: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          content_length?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          entities_found?: number | null
          entities_inserted?: number | null
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          links_discovered?: string[] | null
          metadata?: Json | null
          novelty_score?: number | null
          pattern_id?: string | null
          quality_score?: number | null
          relevance_score?: number | null
          source_id?: string | null
          source_url: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          content_length?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          entities_found?: number | null
          entities_inserted?: number | null
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          links_discovered?: string[] | null
          metadata?: Json | null
          novelty_score?: number | null
          pattern_id?: string | null
          quality_score?: number | null
          relevance_score?: number | null
          source_id?: string | null
          source_url?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_scrape_history_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "alma_extraction_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alma_scrape_history_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "alma_source_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_source_documents: {
        Row: {
          abstract: string | null
          author: string | null
          authority_level: string | null
          citation_count: number | null
          created_at: string | null
          document_type: string
          downloaded_at: string | null
          file_hash: string | null
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          is_accessible: boolean | null
          jurisdiction: string | null
          key_findings: Json | null
          last_verified_at: string | null
          mime_type: string | null
          page_count: number | null
          publication_date: string | null
          report_period: string | null
          scope: string | null
          search_vector: unknown
          source_organization: string | null
          source_url: string
          title: string
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          abstract?: string | null
          author?: string | null
          authority_level?: string | null
          citation_count?: number | null
          created_at?: string | null
          document_type: string
          downloaded_at?: string | null
          file_hash?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          is_accessible?: boolean | null
          jurisdiction?: string | null
          key_findings?: Json | null
          last_verified_at?: string | null
          mime_type?: string | null
          page_count?: number | null
          publication_date?: string | null
          report_period?: string | null
          scope?: string | null
          search_vector?: unknown
          source_organization?: string | null
          source_url: string
          title: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          abstract?: string | null
          author?: string | null
          authority_level?: string | null
          citation_count?: number | null
          created_at?: string | null
          document_type?: string
          downloaded_at?: string | null
          file_hash?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          is_accessible?: boolean | null
          jurisdiction?: string | null
          key_findings?: Json | null
          last_verified_at?: string | null
          mime_type?: string | null
          page_count?: number | null
          publication_date?: string | null
          report_period?: string | null
          scope?: string | null
          search_vector?: unknown
          source_organization?: string | null
          source_url?: string
          title?: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alma_source_registry: {
        Row: {
          avg_entities_per_scrape: number | null
          child_links: string[] | null
          consent_level: string | null
          created_at: string | null
          cultural_authority: boolean | null
          discovered_at: string | null
          discovered_from: string | null
          failure_count: number | null
          id: string
          jurisdiction: string | null
          last_scraped_at: string | null
          metadata: Json | null
          name: string
          next_scrape_at: string | null
          organization: string | null
          priority_score: number | null
          quality_score: number | null
          scrape_count: number | null
          source_type: string | null
          success_count: number | null
          success_rate: number | null
          total_entities_extracted: number | null
          update_frequency: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          avg_entities_per_scrape?: number | null
          child_links?: string[] | null
          consent_level?: string | null
          created_at?: string | null
          cultural_authority?: boolean | null
          discovered_at?: string | null
          discovered_from?: string | null
          failure_count?: number | null
          id?: string
          jurisdiction?: string | null
          last_scraped_at?: string | null
          metadata?: Json | null
          name: string
          next_scrape_at?: string | null
          organization?: string | null
          priority_score?: number | null
          quality_score?: number | null
          scrape_count?: number | null
          source_type?: string | null
          success_count?: number | null
          success_rate?: number | null
          total_entities_extracted?: number | null
          update_frequency?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          avg_entities_per_scrape?: number | null
          child_links?: string[] | null
          consent_level?: string | null
          created_at?: string | null
          cultural_authority?: boolean | null
          discovered_at?: string | null
          discovered_from?: string | null
          failure_count?: number | null
          id?: string
          jurisdiction?: string | null
          last_scraped_at?: string | null
          metadata?: Json | null
          name?: string
          next_scrape_at?: string | null
          organization?: string | null
          priority_score?: number | null
          quality_score?: number | null
          scrape_count?: number | null
          source_type?: string | null
          success_count?: number | null
          success_rate?: number | null
          total_entities_extracted?: number | null
          update_frequency?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      alma_tags: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          parent_id: string | null
          slug: string
          usage_count: number | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_tags_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "alma_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_usage_log: {
        Row: {
          action: string
          created_at: string | null
          destination: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          query_text: string | null
          revenue_generated: number | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          destination?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          query_text?: string | null
          revenue_generated?: number | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          destination?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          query_text?: string | null
          revenue_generated?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alma_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alma_weekly_reports: {
        Row: {
          alerts: string[] | null
          created_at: string | null
          data_sources_used: string[] | null
          executive_summary: string | null
          funding_section: Json | null
          generated_at: string | null
          generation_duration_ms: number | null
          highlights: string[] | null
          id: string
          media_section: Json | null
          organization_id: string | null
          published_at: string | null
          recommended_actions: string[] | null
          report_type: string
          research_section: Json | null
          sector_section: Json | null
          stats_snapshot: Json | null
          status: string
          title: string
          updated_at: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          alerts?: string[] | null
          created_at?: string | null
          data_sources_used?: string[] | null
          executive_summary?: string | null
          funding_section?: Json | null
          generated_at?: string | null
          generation_duration_ms?: number | null
          highlights?: string[] | null
          id?: string
          media_section?: Json | null
          organization_id?: string | null
          published_at?: string | null
          recommended_actions?: string[] | null
          report_type: string
          research_section?: Json | null
          sector_section?: Json | null
          stats_snapshot?: Json | null
          status?: string
          title: string
          updated_at?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          alerts?: string[] | null
          created_at?: string | null
          data_sources_used?: string[] | null
          executive_summary?: string | null
          funding_section?: Json | null
          generated_at?: string | null
          generation_duration_ms?: number | null
          highlights?: string[] | null
          id?: string
          media_section?: Json | null
          organization_id?: string | null
          published_at?: string | null
          recommended_actions?: string[] | null
          report_type?: string
          research_section?: Json | null
          sector_section?: Json | null
          stats_snapshot?: Json | null
          status?: string
          title?: string
          updated_at?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "alma_weekly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_jobs: {
        Row: {
          attempts: number
          created_at: string
          finished_at: string | null
          id: string
          last_error: string | null
          priority: number | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["analysis_job_status_enum"]
          storyteller_id: string
          transcript_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          priority?: number | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_job_status_enum"]
          storyteller_id: string
          transcript_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          priority?: number | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_job_status_enum"]
          storyteller_id?: string
          transcript_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_jobs_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          createdAt: string
          email: string | null
          id: number
          lastSignedIn: string
          loginMethod: string | null
          name: string | null
          openId: string
          role: Database["public"]["Enums"]["user_role"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email?: string | null
          id?: number
          lastSignedIn?: string
          loginMethod?: string | null
          name?: string | null
          openId: string
          role?: Database["public"]["Enums"]["user_role"]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string | null
          id?: number
          lastSignedIn?: string
          loginMethod?: string | null
          name?: string | null
          openId?: string
          role?: Database["public"]["Enums"]["user_role"]
          updatedAt?: string
        }
        Relationships: []
      }
      art_innovation: {
        Row: {
          created_at: string | null
          creators: Json | null
          description: string
          featured_image_url: string | null
          gallery_images: Json | null
          id: string
          impact: string | null
          is_featured: boolean | null
          location: string | null
          organization_id: string | null
          program_id: string | null
          search_vector: unknown
          slug: string
          social_links: Json | null
          status: string
          story: string | null
          tagline: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          creators?: Json | null
          description: string
          featured_image_url?: string | null
          gallery_images?: Json | null
          id?: string
          impact?: string | null
          is_featured?: boolean | null
          location?: string | null
          organization_id?: string | null
          program_id?: string | null
          search_vector?: unknown
          slug: string
          social_links?: Json | null
          status?: string
          story?: string | null
          tagline?: string | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          creators?: Json | null
          description?: string
          featured_image_url?: string | null
          gallery_images?: Json | null
          id?: string
          impact?: string | null
          is_featured?: boolean | null
          location?: string | null
          organization_id?: string | null
          program_id?: string | null
          search_vector?: unknown
          slug?: string
          social_links?: Json | null
          status?: string
          story?: string | null
          tagline?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "art_innovation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_innovation_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
        ]
      }
      art_innovation_profiles: {
        Row: {
          art_innovation_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          public_profile_id: string | null
          role: string
          role_description: string | null
        }
        Insert: {
          art_innovation_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          public_profile_id?: string | null
          role: string
          role_description?: string | null
        }
        Update: {
          art_innovation_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          public_profile_id?: string | null
          role?: string
          role_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "art_innovation_profiles_art_innovation_id_fkey"
            columns: ["art_innovation_id"]
            isOneToOne: false
            referencedRelation: "art_innovation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_innovation_profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_locations: {
        Row: {
          article_id: string | null
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          location_city: string | null
          location_country: string | null
          location_name: string
          location_state: string | null
          longitude: number | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_name: string
          location_state?: string | null
          longitude?: number | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_name?: string
          location_state?: string | null
          longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_locations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_art: {
        Row: {
          art_innovation_id: string | null
          article_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          relevance_note: string | null
        }
        Insert: {
          art_innovation_id?: string | null
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
        }
        Update: {
          art_innovation_id?: string | null
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_art_art_innovation_id_fkey"
            columns: ["art_innovation_id"]
            isOneToOne: false
            referencedRelation: "art_innovation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_art_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_articles: {
        Row: {
          article_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          related_article_id: string | null
          relationship_type: string | null
          relevance_note: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          related_article_id?: string | null
          relationship_type?: string | null
          relevance_note?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          related_article_id?: string | null
          relationship_type?: string | null
          relevance_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_articles_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_evidence: {
        Row: {
          article_id: string
          created_at: string | null
          evidence_id: string
          id: string
          relevance_note: string | null
          updated_at: string | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          evidence_id: string
          id?: string
          relevance_note?: string | null
          updated_at?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          evidence_id?: string
          id?: string
          relevance_note?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_evidence_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_evidence_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "alma_evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_interventions: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          intervention_id: string
          relevance_note: string | null
          updated_at: string | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          intervention_id: string
          relevance_note?: string | null
          updated_at?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          intervention_id?: string
          relevance_note?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_interventions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_interventions_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_programs: {
        Row: {
          article_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          program_id: string | null
          relevance_note: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          program_id?: string | null
          relevance_note?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          program_id?: string | null
          relevance_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_programs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related_services: {
        Row: {
          article_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          relevance_note: string | null
          service_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
          service_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_services_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string | null
          created_at: string | null
          id: string
          tag: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          tag: string
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          categories: string[] | null
          category: string | null
          co_authors: string[] | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_caption: string | null
          featured_image_url: string | null
          id: string
          is_trending: boolean | null
          location_tags: string[] | null
          metadata: Json | null
          published_at: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          share_count: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          categories?: string[] | null
          category?: string | null
          co_authors?: string[] | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_caption?: string | null
          featured_image_url?: string | null
          id?: string
          is_trending?: boolean | null
          location_tags?: string[] | null
          metadata?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          share_count?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          categories?: string[] | null
          category?: string | null
          co_authors?: string[] | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_caption?: string | null
          featured_image_url?: string | null
          id?: string
          is_trending?: boolean | null
          location_tags?: string[] | null
          metadata?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          share_count?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          action_category: string | null
          created_at: string | null
          gdpr_relevant: boolean | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          requires_notification: boolean | null
          resource_id: string | null
          resource_type: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          action_category?: string | null
          created_at?: string | null
          gdpr_relevant?: boolean | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          requires_notification?: boolean | null
          resource_id?: string | null
          resource_type: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          action_category?: string | null
          created_at?: string | null
          gdpr_relevant?: boolean | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          requires_notification?: boolean | null
          resource_id?: string | null
          resource_type?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      australian_frameworks: {
        Row: {
          challenges: string[] | null
          color: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          key_features: string[] | null
          latitude: number | null
          longitude: number | null
          name: string
          outcomes: Json | null
          overview: string
          resources: Json | null
          slug: string
          state: string
          strengths: string[] | null
          tagline: string
          updated_at: string | null
        }
        Insert: {
          challenges?: string[] | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key_features?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name: string
          outcomes?: Json | null
          overview: string
          resources?: Json | null
          slug: string
          state: string
          strengths?: string[] | null
          tagline: string
          updated_at?: string | null
        }
        Update: {
          challenges?: string[] | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key_features?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          outcomes?: Json | null
          overview?: string
          resources?: Json | null
          slug?: string
          state?: string
          strengths?: string[] | null
          tagline?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          photo_url: string | null
          public_profile_id: string | null
          role: string | null
          slug: string
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          public_profile_id?: string | null
          role?: string | null
          slug: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          public_profile_id?: string | null
          role?: string | null
          slug?: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          data_sources: Json | null
          description: string
          detailed_analysis: Json | null
          evidence_data: Json | null
          expected_impact: Json | null
          expires_at: string | null
          generated_by: string
          generation_timestamp: string
          id: string
          implementation_complexity: string | null
          implementation_notes: string | null
          implemented_at: string | null
          insight_category: string
          insight_type: string
          model_version: string | null
          priority_level: string
          recommended_actions: Json | null
          relevant_communities: Json | null
          relevant_projects: Json | null
          status: string | null
          target_audience: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          data_sources?: Json | null
          description: string
          detailed_analysis?: Json | null
          evidence_data?: Json | null
          expected_impact?: Json | null
          expires_at?: string | null
          generated_by: string
          generation_timestamp: string
          id?: string
          implementation_complexity?: string | null
          implementation_notes?: string | null
          implemented_at?: string | null
          insight_category: string
          insight_type: string
          model_version?: string | null
          priority_level?: string
          recommended_actions?: Json | null
          relevant_communities?: Json | null
          relevant_projects?: Json | null
          status?: string | null
          target_audience?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          data_sources?: Json | null
          description?: string
          detailed_analysis?: Json | null
          evidence_data?: Json | null
          expected_impact?: Json | null
          expires_at?: string | null
          generated_by?: string
          generation_timestamp?: string
          id?: string
          implementation_complexity?: string | null
          implementation_notes?: string | null
          implemented_at?: string | null
          insight_category?: string
          insight_type?: string
          model_version?: string | null
          priority_level?: string
          recommended_actions?: Json | null
          relevant_communities?: Json | null
          relevant_projects?: Json | null
          status?: string | null
          target_audience?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          backup_timestamp: string | null
          checksum: string | null
          created_by: string | null
          data_types: string[] | null
          description: string | null
          id: string
          is_completed: boolean | null
          metadata: Json | null
          size_bytes: number | null
          version: string | null
        }
        Insert: {
          backup_timestamp?: string | null
          checksum?: string | null
          created_by?: string | null
          data_types?: string[] | null
          description?: string | null
          id: string
          is_completed?: boolean | null
          metadata?: Json | null
          size_bytes?: number | null
          version?: string | null
        }
        Update: {
          backup_timestamp?: string | null
          checksum?: string | null
          created_by?: string | null
          data_types?: string[] | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          metadata?: Json | null
          size_bytes?: number | null
          version?: string | null
        }
        Relationships: []
      }
      best_practices: {
        Row: {
          australian_implementation: string | null
          category: string
          challenges: string | null
          created_at: string | null
          description: string
          example_programs: string[] | null
          id: string
          recommendations: string | null
          slug: string
          supporting_research: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          australian_implementation?: string | null
          category: string
          challenges?: string | null
          created_at?: string | null
          description: string
          example_programs?: string[] | null
          id?: string
          recommendations?: string | null
          slug: string
          supporting_research?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          australian_implementation?: string | null
          category?: string
          challenges?: string | null
          created_at?: string | null
          description?: string
          example_programs?: string[] | null
          id?: string
          recommendations?: string | null
          slug?: string
          supporting_research?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_coupons: {
        Row: {
          active: boolean | null
          amount_off: number | null
          code: string
          created_at: string | null
          currency: string | null
          duration: string | null
          duration_in_months: number | null
          id: number
          max_redemptions: number | null
          metadata: Json | null
          percent_off: number | null
          redeem_by: string | null
          tenant_id: string
        }
        Insert: {
          active?: boolean | null
          amount_off?: number | null
          code: string
          created_at?: string | null
          currency?: string | null
          duration?: string | null
          duration_in_months?: number | null
          id?: number
          max_redemptions?: number | null
          metadata?: Json | null
          percent_off?: number | null
          redeem_by?: string | null
          tenant_id: string
        }
        Update: {
          active?: boolean | null
          amount_off?: number | null
          code?: string
          created_at?: string | null
          currency?: string | null
          duration?: string | null
          duration_in_months?: number | null
          id?: number
          max_redemptions?: number | null
          metadata?: Json | null
          percent_off?: number | null
          redeem_by?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          default_payment_brand: string | null
          default_payment_last4: string | null
          email: string | null
          id: number
          metadata: Json | null
          name: string | null
          shipping_address: Json | null
          stripe_customer_id: string | null
          tenant_id: string
          updated_at: string | null
          xero_contact_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          default_payment_brand?: string | null
          default_payment_last4?: string | null
          email?: string | null
          id?: number
          metadata?: Json | null
          name?: string | null
          shipping_address?: Json | null
          stripe_customer_id?: string | null
          tenant_id: string
          updated_at?: string | null
          xero_contact_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          default_payment_brand?: string | null
          default_payment_last4?: string | null
          email?: string | null
          id?: number
          metadata?: Json | null
          name?: string | null
          shipping_address?: Json | null
          stripe_customer_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          xero_contact_id?: string | null
        }
        Relationships: []
      }
      billing_invoice_lines: {
        Row: {
          amount: number | null
          description: string | null
          id: number
          invoice_id: number | null
          metadata: Json | null
          price_id: number | null
          product_id: number | null
          quantity: number | null
          tax_rate: number | null
          unit_amount: number | null
        }
        Insert: {
          amount?: number | null
          description?: string | null
          id?: number
          invoice_id?: number | null
          metadata?: Json | null
          price_id?: number | null
          product_id?: number | null
          quantity?: number | null
          tax_rate?: number | null
          unit_amount?: number | null
        }
        Update: {
          amount?: number | null
          description?: string | null
          id?: number
          invoice_id?: number | null
          metadata?: Json | null
          price_id?: number | null
          product_id?: number | null
          quantity?: number | null
          tax_rate?: number | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoice_lines_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "billing_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_id: number | null
          due_date: string | null
          id: number
          invoice_number: string | null
          issued_at: string | null
          metadata: Json | null
          pdf_url: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: number | null
          subtotal: number | null
          tax_total: number | null
          tenant_id: string
          total: number | null
          updated_at: string | null
          xero_invoice_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_id?: number | null
          due_date?: string | null
          id?: number
          invoice_number?: string | null
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: number | null
          subtotal?: number | null
          tax_total?: number | null
          tenant_id: string
          total?: number | null
          updated_at?: string | null
          xero_invoice_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_id?: number | null
          due_date?: string | null
          id?: number
          invoice_number?: string | null
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: number | null
          subtotal?: number | null
          tax_total?: number | null
          tenant_id?: string
          total?: number | null
          updated_at?: string | null
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount: number
          created_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: number
          invoice_id: number | null
          metadata: Json | null
          paid_at: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: number
          invoice_id?: number | null
          metadata?: Json | null
          paid_at?: string | null
          status: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: number
          invoice_id?: number | null
          metadata?: Json | null
          paid_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_prices: {
        Row: {
          active: boolean | null
          billing_period: string
          created_at: string | null
          currency: string
          id: number
          metadata: Json | null
          product_id: number | null
          stripe_price_id: string | null
          trial_days: number | null
          unit_amount: number
          updated_at: string | null
          usage_type: string | null
        }
        Insert: {
          active?: boolean | null
          billing_period: string
          created_at?: string | null
          currency: string
          id?: number
          metadata?: Json | null
          product_id?: number | null
          stripe_price_id?: string | null
          trial_days?: number | null
          unit_amount: number
          updated_at?: string | null
          usage_type?: string | null
        }
        Update: {
          active?: boolean | null
          billing_period?: string
          created_at?: string | null
          currency?: string
          id?: number
          metadata?: Json | null
          product_id?: number | null
          stripe_price_id?: string | null
          trial_days?: number | null
          unit_amount?: number
          updated_at?: string | null
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_products: {
        Row: {
          accounting_account_code: string | null
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          metadata: Json | null
          name: string
          tenant_id: string
          updated_at: string | null
          xero_item_code: string | null
        }
        Insert: {
          accounting_account_code?: string | null
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
          name: string
          tenant_id: string
          updated_at?: string | null
          xero_item_code?: string | null
        }
        Update: {
          accounting_account_code?: string | null
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
          xero_item_code?: string | null
        }
        Relationships: []
      }
      billing_subscription_items: {
        Row: {
          created_at: string | null
          id: number
          metadata: Json | null
          price_id: number | null
          quantity: number | null
          subscription_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          metadata?: Json | null
          price_id?: number | null
          quantity?: number | null
          subscription_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          metadata?: Json | null
          price_id?: number | null
          quantity?: number | null
          subscription_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscription_items_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "billing_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_id: number | null
          id: number
          metadata: Json | null
          status: string
          stripe_subscription_id: string | null
          tenant_id: string
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: number | null
          id?: number
          metadata?: Json | null
          status: string
          stripe_subscription_id?: string | null
          tenant_id: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: number | null
          id?: number
          metadata?: Json | null
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_tax_rates: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: number
          inclusive: boolean | null
          jurisdiction: string | null
          name: string
          percentage: number
          stripe_tax_rate_id: string | null
          tenant_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          inclusive?: boolean | null
          jurisdiction?: string | null
          name: string
          percentage: number
          stripe_tax_rate_id?: string | null
          tenant_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          inclusive?: boolean | null
          jurisdiction?: string | null
          name?: string
          percentage?: number
          stripe_tax_rate_id?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      billing_tax_settings: {
        Row: {
          country: string | null
          default_tax_rate_id: number | null
          metadata: Json | null
          region: string | null
          tax_behavior: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          default_tax_rate_id?: number | null
          metadata?: Json | null
          region?: string | null
          tax_behavior?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          default_tax_rate_id?: number | null
          metadata?: Json | null
          region?: string | null
          tax_behavior?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_tax_settings_default_tax_rate_id_fkey"
            columns: ["default_tax_rate_id"]
            isOneToOne: false
            referencedRelation: "billing_tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_events: {
        Row: {
          error_message: string | null
          event_type: string
          id: number
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string | null
          status: string | null
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: number
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string | null
          status?: string | null
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: number
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_id: string | null
          blog_post_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          status: string | null
        }
        Insert: {
          author_id?: string | null
          blog_post_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          status?: string | null
        }
        Update: {
          author_id?: string | null
          blog_post_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_content_links: {
        Row: {
          art_id: string | null
          blog_post_id: string | null
          context: string | null
          created_at: string | null
          id: string
          link_type: string
          profile_id: string | null
          program_id: string | null
          service_id: string | null
          story_id: string | null
        }
        Insert: {
          art_id?: string | null
          blog_post_id?: string | null
          context?: string | null
          created_at?: string | null
          id?: string
          link_type: string
          profile_id?: string | null
          program_id?: string | null
          service_id?: string | null
          story_id?: string | null
        }
        Update: {
          art_id?: string | null
          blog_post_id?: string | null
          context?: string | null
          created_at?: string | null
          id?: string
          link_type?: string
          profile_id?: string | null
          program_id?: string | null
          service_id?: string | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_content_links_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "art_innovation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_content_links_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_content_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_content_links_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_content_links_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_content_links_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_content_links_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_media: {
        Row: {
          alt_text: string | null
          blog_post_id: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          file_size: number | null
          id: string
          media_type: string
          mime_type: string | null
          thumbnail_url: string | null
          title: string | null
          url: string
          video_embed_code: string | null
          video_provider: string | null
        }
        Insert: {
          alt_text?: string | null
          blog_post_id?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          media_type: string
          mime_type?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url: string
          video_embed_code?: string | null
          video_provider?: string | null
        }
        Update: {
          alt_text?: string | null
          blog_post_id?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          media_type?: string
          mime_type?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          video_embed_code?: string | null
          video_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_media_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          audio_url: string | null
          author_id: string | null
          categories: string[] | null
          co_authors: string[] | null
          content: string
          created_at: string | null
          cultural_sensitivity_flag: boolean | null
          empathy_ledger_story_id: string | null
          empathy_ledger_transcript_id: string | null
          excerpt: string | null
          featured_image_caption: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          share_count: number | null
          slug: string
          status: string | null
          synced_from_empathy_ledger: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          audio_url?: string | null
          author_id?: string | null
          categories?: string[] | null
          co_authors?: string[] | null
          content: string
          created_at?: string | null
          cultural_sensitivity_flag?: boolean | null
          empathy_ledger_story_id?: string | null
          empathy_ledger_transcript_id?: string | null
          excerpt?: string | null
          featured_image_caption?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          share_count?: number | null
          slug: string
          status?: string | null
          synced_from_empathy_ledger?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          audio_url?: string | null
          author_id?: string | null
          categories?: string[] | null
          co_authors?: string[] | null
          content?: string
          created_at?: string | null
          cultural_sensitivity_flag?: boolean | null
          empathy_ledger_story_id?: string | null
          empathy_ledger_transcript_id?: string | null
          excerpt?: string | null
          featured_image_caption?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          share_count?: number | null
          slug?: string
          status?: string | null
          synced_from_empathy_ledger?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts_profiles: {
        Row: {
          blog_post_id: string
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          public_profile_id: string
          role: string | null
        }
        Insert: {
          blog_post_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          public_profile_id: string
          role?: string | null
        }
        Update: {
          blog_post_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          public_profile_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_profiles_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookkeeping_project_links: {
        Row: {
          allocation: number | null
          created_at: string | null
          id: number
          note: string | null
          project_id: string
          tenant_id: string
          transaction_id: number
        }
        Insert: {
          allocation?: number | null
          created_at?: string | null
          id?: number
          note?: string | null
          project_id: string
          tenant_id: string
          transaction_id: number
        }
        Update: {
          allocation?: number | null
          created_at?: string | null
          id?: number
          note?: string | null
          project_id?: string
          tenant_id?: string
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookkeeping_project_links_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "bookkeeping_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookkeeping_receipts: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: number
          raw: Json | null
          receipt_date: string | null
          receipt_id: string | null
          status: string | null
          tenant_id: string
          url: string | null
          vendor: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          raw?: Json | null
          receipt_date?: string | null
          receipt_id?: string | null
          status?: string | null
          tenant_id: string
          url?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          raw?: Json | null
          receipt_date?: string | null
          receipt_id?: string | null
          status?: string | null
          tenant_id?: string
          url?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      bookkeeping_rules: {
        Row: {
          account_code: string | null
          category: string
          created_at: string | null
          id: number
          pattern: string
          priority: number | null
          tenant_id: string
        }
        Insert: {
          account_code?: string | null
          category: string
          created_at?: string | null
          id?: number
          pattern: string
          priority?: number | null
          tenant_id: string
        }
        Update: {
          account_code?: string | null
          category?: string
          created_at?: string | null
          id?: number
          pattern?: string
          priority?: number | null
          tenant_id?: string
        }
        Relationships: []
      }
      bookkeeping_sync_state: {
        Row: {
          last_page: number | null
          last_synced_at: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          last_page?: number | null
          last_synced_at?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          last_page?: number | null
          last_synced_at?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookkeeping_transactions: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number
          category: string | null
          category_confidence: number | null
          contact_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          direction: string | null
          id: number
          raw: Json | null
          tenant_id: string
          txn_date: string
          updated_at: string | null
          xero_id: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          amount: number
          category?: string | null
          category_confidence?: number | null
          contact_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          direction?: string | null
          id?: number
          raw?: Json | null
          tenant_id: string
          txn_date: string
          updated_at?: string | null
          xero_id?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          amount?: number
          category?: string | null
          category_confidence?: number | null
          contact_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          direction?: string | null
          id?: number
          raw?: Json | null
          tenant_id?: string
          txn_date?: string
          updated_at?: string | null
          xero_id?: string | null
        }
        Relationships: []
      }
      brand_tests: {
        Row: {
          author_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          hypothesis: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          target_audience: string | null
          test_type: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          hypothesis?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          target_audience?: string | null
          test_type?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          hypothesis?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          target_audience?: string | null
          test_type?: string
        }
        Relationships: []
      }
      business_agent_queries: {
        Row: {
          actions: string[] | null
          confidence: number | null
          created_at: string | null
          id: string
          intent: Json | null
          query: string
          response: Json
          sources: string[] | null
          user_feedback: string | null
        }
        Insert: {
          actions?: string[] | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          intent?: Json | null
          query: string
          response?: Json
          sources?: string[] | null
          user_feedback?: string | null
        }
        Update: {
          actions?: string[] | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          intent?: Json | null
          query?: string
          response?: Json
          sources?: string[] | null
          user_feedback?: string | null
        }
        Relationships: []
      }
      business_alerts: {
        Row: {
          action_required: string | null
          alert_type: string
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          metadata: Json | null
          priority: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_required?: string | null
          alert_type: string
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_required?: string | null
          alert_type?: string
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["business_category"]
          createdAt: string
          description: string
          email: string | null
          facebook: string | null
          id: number
          imageUrl: string | null
          instagram: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["business_status"]
          submittedBy: string | null
          submitterEmail: string
          updatedAt: string
          userId: number | null
          userOpenId: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["business_category"]
          createdAt?: string
          description: string
          email?: string | null
          facebook?: string | null
          id?: number
          imageUrl?: string | null
          instagram?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          submittedBy?: string | null
          submitterEmail: string
          updatedAt?: string
          userId?: number | null
          userOpenId?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["business_category"]
          createdAt?: string
          description?: string
          email?: string | null
          facebook?: string | null
          id?: number
          imageUrl?: string | null
          instagram?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          submittedBy?: string | null
          submitterEmail?: string
          updatedAt?: string
          userId?: number | null
          userOpenId?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ce_activities: {
        Row: {
          activity_type: string
          event_timestamp: string | null
          id: string
          message: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          event_timestamp?: string | null
          id?: string
          message: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          event_timestamp?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ce_backups: {
        Row: {
          backup_timestamp: string | null
          checksum: string | null
          created_by: string | null
          data_types: string[] | null
          description: string | null
          id: string
          is_completed: boolean | null
          metadata: Json | null
          size_bytes: number | null
          version: string | null
        }
        Insert: {
          backup_timestamp?: string | null
          checksum?: string | null
          created_by?: string | null
          data_types?: string[] | null
          description?: string | null
          id: string
          is_completed?: boolean | null
          metadata?: Json | null
          size_bytes?: number | null
          version?: string | null
        }
        Update: {
          backup_timestamp?: string | null
          checksum?: string | null
          created_by?: string | null
          data_types?: string[] | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          metadata?: Json | null
          size_bytes?: number | null
          version?: string | null
        }
        Relationships: []
      }
      ce_brand_analyses: {
        Row: {
          analysis_date: string | null
          analyst_id: string | null
          authenticity_score: number | null
          brand_values_demonstrated: Json | null
          community_impact: number | null
          content_id: string | null
          emotional_resonance: number | null
          id: string
          overall_score: number | null
        }
        Insert: {
          analysis_date?: string | null
          analyst_id?: string | null
          authenticity_score?: number | null
          brand_values_demonstrated?: Json | null
          community_impact?: number | null
          content_id?: string | null
          emotional_resonance?: number | null
          id?: string
          overall_score?: number | null
        }
        Update: {
          analysis_date?: string | null
          analyst_id?: string | null
          authenticity_score?: number | null
          brand_values_demonstrated?: Json | null
          community_impact?: number | null
          content_id?: string | null
          emotional_resonance?: number | null
          id?: string
          overall_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ce_brand_analyses_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ce_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      ce_brand_tests: {
        Row: {
          author_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          hypothesis: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          target_audience: string | null
          test_type: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          hypothesis?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          target_audience?: string | null
          test_type?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          hypothesis?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          target_audience?: string | null
          test_type?: string
        }
        Relationships: []
      }
      ce_media_assets: {
        Row: {
          category: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          metadata: Json | null
          mime_type: string | null
          tags: string[] | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      ce_metrics: {
        Row: {
          brand_score: number | null
          brand_tests_active: number | null
          content_items: number | null
          created_at: string | null
          id: string
          last_updated: string | null
          stories_analyzed: number | null
          user_id: string | null
        }
        Insert: {
          brand_score?: number | null
          brand_tests_active?: number | null
          content_items?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          stories_analyzed?: number | null
          user_id?: string | null
        }
        Update: {
          brand_score?: number | null
          brand_tests_active?: number | null
          content_items?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          stories_analyzed?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ce_saved_searches: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          last_used: string | null
          name: string
          query: string
          use_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id: string
          last_used?: string | null
          name: string
          query: string
          use_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_used?: string | null
          name?: string
          query?: string
          use_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ce_search_history: {
        Row: {
          filters: Json | null
          id: string
          query: string
          results_count: number | null
          search_timestamp: string | null
          user_id: string | null
        }
        Insert: {
          filters?: Json | null
          id?: string
          query: string
          results_count?: number | null
          search_timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number | null
          search_timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ce_stories: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          date_recorded: string | null
          id: string
          impact_level: string | null
          is_published: boolean | null
          location: string | null
          participant_age: number | null
          participant_name: string
          summary: string | null
          tags: string[] | null
          themes: string[] | null
          title: string
          transcript_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          date_recorded?: string | null
          id?: string
          impact_level?: string | null
          is_published?: boolean | null
          location?: string | null
          participant_age?: number | null
          participant_name: string
          summary?: string | null
          tags?: string[] | null
          themes?: string[] | null
          title: string
          transcript_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          date_recorded?: string | null
          id?: string
          impact_level?: string | null
          is_published?: boolean | null
          location?: string | null
          participant_age?: number | null
          participant_name?: string
          summary?: string | null
          tags?: string[] | null
          themes?: string[] | null
          title?: string
          transcript_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ce_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string
          permissions: string[] | null
          updated_at: string | null
          user_role: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash: string
          permissions?: string[] | null
          updated_at?: string | null
          user_role?: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string
          permissions?: string[] | null
          updated_at?: string | null
          user_role?: string
          username?: string
        }
        Relationships: []
      }
      clearinghouse_documents: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          format: string | null
          id: string
          source_record_id: string | null
          source_system: string
          source_url: string | null
          status: string | null
          submitted_by: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: string
          source_record_id?: string | null
          source_system: string
          source_url?: string | null
          status?: string | null
          submitted_by?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: string
          source_record_id?: string | null
          source_system?: string
          source_url?: string | null
          status?: string | null
          submitted_by?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      cms_content_blocks: {
        Row: {
          block_type: string
          category: string | null
          created_at: string | null
          default_content: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string | null
          schema: Json | null
          updated_at: string | null
        }
        Insert: {
          block_type: string
          category?: string | null
          created_at?: string | null
          default_content?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id?: string | null
          schema?: Json | null
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          category?: string | null
          created_at?: string | null
          default_content?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          schema?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "cms_content_blocks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          category: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          project_id: string | null
          tags: string[] | null
          updated_at: string | null
          url: string
          usage: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          url: string
          usage?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          url?: string
          usage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "cms_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          id: string
          meta_data: Json | null
          page_type: string | null
          project_id: string | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          meta_data?: Json | null
          page_type?: string | null
          project_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          meta_data?: Json | null
          page_type?: string | null
          project_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "cms_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      coe_key_people: {
        Row: {
          bio_override: string | null
          created_at: string | null
          display_order: number | null
          expertise_area: string | null
          id: string
          is_active: boolean | null
          profile_id: string
          role: string
          role_description: string | null
          role_title: string
        }
        Insert: {
          bio_override?: string | null
          created_at?: string | null
          display_order?: number | null
          expertise_area?: string | null
          id?: string
          is_active?: boolean | null
          profile_id: string
          role: string
          role_description?: string | null
          role_title: string
        }
        Update: {
          bio_override?: string | null
          created_at?: string | null
          display_order?: number | null
          expertise_area?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string
          role?: string
          role_description?: string | null
          role_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coe_key_people_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_media: {
        Row: {
          caption: string | null
          collection_id: string
          created_at: string | null
          featured_in_collection: boolean | null
          media_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          collection_id: string
          created_at?: string | null
          featured_in_collection?: boolean | null
          media_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          collection_id?: string
          created_at?: string | null
          featured_in_collection?: boolean | null
          media_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_media_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "media_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "public_media_with_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      community_connections: {
        Row: {
          connected_entity: string | null
          connection_strength:
            | Database["public"]["Enums"]["connection_strength_enum"]
            | null
          connection_type: Database["public"]["Enums"]["connection_type_enum"]
          created_at: string | null
          cultural_significance: number | null
          evidence_quote: string | null
          geographic_scope: string | null
          id: string
          influence_potential: number | null
          interaction_frequency: string | null
          knowledge_exchange_value: number | null
          mutual_benefit_description: string | null
          relationship_duration: string | null
          relationship_nature: string | null
          resource_access_value: number | null
          storyteller_id: string | null
          traditional_protocol_involved: boolean | null
          updated_at: string | null
        }
        Insert: {
          connected_entity?: string | null
          connection_strength?:
            | Database["public"]["Enums"]["connection_strength_enum"]
            | null
          connection_type: Database["public"]["Enums"]["connection_type_enum"]
          created_at?: string | null
          cultural_significance?: number | null
          evidence_quote?: string | null
          geographic_scope?: string | null
          id?: string
          influence_potential?: number | null
          interaction_frequency?: string | null
          knowledge_exchange_value?: number | null
          mutual_benefit_description?: string | null
          relationship_duration?: string | null
          relationship_nature?: string | null
          resource_access_value?: number | null
          storyteller_id?: string | null
          traditional_protocol_involved?: boolean | null
          updated_at?: string | null
        }
        Update: {
          connected_entity?: string | null
          connection_strength?:
            | Database["public"]["Enums"]["connection_strength_enum"]
            | null
          connection_type?: Database["public"]["Enums"]["connection_type_enum"]
          created_at?: string | null
          cultural_significance?: number | null
          evidence_quote?: string | null
          geographic_scope?: string | null
          id?: string
          influence_potential?: number | null
          interaction_frequency?: string | null
          knowledge_exchange_value?: number | null
          mutual_benefit_description?: string | null
          relationship_duration?: string | null
          relationship_nature?: string | null
          resource_access_value?: number | null
          storyteller_id?: string | null
          traditional_protocol_involved?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_connections_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          anonymized: boolean | null
          business_value: Json | null
          community_id: string | null
          consent_level: string | null
          conversion_funnel_stage: string | null
          created_at: string | null
          data_retention_policy: string | null
          device_data: Json | null
          engagement_score: number | null
          event_category: string
          event_metadata: Json | null
          event_name: string
          event_properties: Json | null
          event_timestamp: string | null
          event_type: string
          geographic_data: Json | null
          id: string
          ip_address: unknown
          outcome_id: string | null
          project_id: string | null
          referrer_data: Json | null
          session_id: string | null
          session_start_time: string | null
          story_id: string | null
          time_on_page: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anonymized?: boolean | null
          business_value?: Json | null
          community_id?: string | null
          consent_level?: string | null
          conversion_funnel_stage?: string | null
          created_at?: string | null
          data_retention_policy?: string | null
          device_data?: Json | null
          engagement_score?: number | null
          event_category: string
          event_metadata?: Json | null
          event_name: string
          event_properties?: Json | null
          event_timestamp?: string | null
          event_type: string
          geographic_data?: Json | null
          id?: string
          ip_address?: unknown
          outcome_id?: string | null
          project_id?: string | null
          referrer_data?: Json | null
          session_id?: string | null
          session_start_time?: string | null
          story_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anonymized?: boolean | null
          business_value?: Json | null
          community_id?: string | null
          consent_level?: string | null
          conversion_funnel_stage?: string | null
          created_at?: string | null
          data_retention_policy?: string | null
          device_data?: Json | null
          engagement_score?: number | null
          event_category?: string
          event_metadata?: Json | null
          event_name?: string
          event_properties?: Json | null
          event_timestamp?: string | null
          event_type?: string
          geographic_data?: Json | null
          id?: string
          ip_address?: unknown
          outcome_id?: string | null
          project_id?: string | null
          referrer_data?: Json | null
          session_id?: string | null
          session_start_time?: string | null
          story_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_events_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "project_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "community_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      community_feedback: {
        Row: {
          action_taken: string | null
          anonymous: boolean | null
          category: string | null
          content_id: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          feedback_text: string
          feedback_type: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string | null
          status: string | null
          submitted_by: string | null
          submitter_email: string | null
          submitter_name: string | null
        }
        Insert: {
          action_taken?: string | null
          anonymous?: boolean | null
          category?: string | null
          content_id?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          feedback_text: string
          feedback_type: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string | null
          submitted_by?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
        }
        Update: {
          action_taken?: string | null
          anonymous?: boolean | null
          category?: string | null
          content_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          feedback_text?: string
          feedback_type?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string | null
          submitted_by?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
        }
        Relationships: []
      }
      community_health_metrics: {
        Row: {
          active_projects: number | null
          active_users_daily: number | null
          active_users_monthly: number | null
          active_users_weekly: number | null
          calculated_at: string | null
          calculation_method: string | null
          community_id: string | null
          community_interactions: number | null
          community_value_generated: number | null
          completed_projects: number | null
          content_quality_average: number | null
          created_at: string | null
          cross_community_collaborations: number | null
          cultural_knowledge_preserved: number | null
          data_completeness_score: number | null
          diversity_index: number | null
          id: string
          inclusion_score: number | null
          innovation_rate: number | null
          metric_date: string
          metric_period: string
          new_collaborations: number | null
          new_user_registrations: number | null
          outcomes_reported: number | null
          platform_reliability_score: number | null
          project_updates_posted: number | null
          stories_published: number | null
          sustainability_index: number | null
          total_beneficiaries: number | null
          user_retention_rate: number | null
          user_satisfaction_score: number | null
          verified_outcomes: number | null
        }
        Insert: {
          active_projects?: number | null
          active_users_daily?: number | null
          active_users_monthly?: number | null
          active_users_weekly?: number | null
          calculated_at?: string | null
          calculation_method?: string | null
          community_id?: string | null
          community_interactions?: number | null
          community_value_generated?: number | null
          completed_projects?: number | null
          content_quality_average?: number | null
          created_at?: string | null
          cross_community_collaborations?: number | null
          cultural_knowledge_preserved?: number | null
          data_completeness_score?: number | null
          diversity_index?: number | null
          id?: string
          inclusion_score?: number | null
          innovation_rate?: number | null
          metric_date: string
          metric_period: string
          new_collaborations?: number | null
          new_user_registrations?: number | null
          outcomes_reported?: number | null
          platform_reliability_score?: number | null
          project_updates_posted?: number | null
          stories_published?: number | null
          sustainability_index?: number | null
          total_beneficiaries?: number | null
          user_retention_rate?: number | null
          user_satisfaction_score?: number | null
          verified_outcomes?: number | null
        }
        Update: {
          active_projects?: number | null
          active_users_daily?: number | null
          active_users_monthly?: number | null
          active_users_weekly?: number | null
          calculated_at?: string | null
          calculation_method?: string | null
          community_id?: string | null
          community_interactions?: number | null
          community_value_generated?: number | null
          completed_projects?: number | null
          content_quality_average?: number | null
          created_at?: string | null
          cross_community_collaborations?: number | null
          cultural_knowledge_preserved?: number | null
          data_completeness_score?: number | null
          diversity_index?: number | null
          id?: string
          inclusion_score?: number | null
          innovation_rate?: number | null
          metric_date?: string
          metric_period?: string
          new_collaborations?: number | null
          new_user_registrations?: number | null
          outcomes_reported?: number | null
          platform_reliability_score?: number | null
          project_updates_posted?: number | null
          stories_published?: number | null
          sustainability_index?: number | null
          total_beneficiaries?: number | null
          user_retention_rate?: number | null
          user_satisfaction_score?: number | null
          verified_outcomes?: number | null
        }
        Relationships: []
      }
      community_inquiries: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string
          follow_up_consent: boolean | null
          how_heard: string | null
          id: string
          inquiry_type: string
          location: string | null
          message: string
          name: string
          organization: string | null
          response_sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email: string
          follow_up_consent?: boolean | null
          how_heard?: string | null
          id?: string
          inquiry_type: string
          location?: string | null
          message: string
          name: string
          organization?: string | null
          response_sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string
          follow_up_consent?: boolean | null
          how_heard?: string | null
          id?: string
          inquiry_type?: string
          location?: string | null
          message?: string
          name?: string
          organization?: string | null
          response_sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      compliance_tracking: {
        Row: {
          compliance_type: string
          created_at: string | null
          details: Json | null
          due_date: string | null
          id: string
          next_actions: string[] | null
          status: string
          updated_at: string | null
        }
        Insert: {
          compliance_type: string
          created_at?: string | null
          details?: Json | null
          due_date?: string | null
          id?: string
          next_actions?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          compliance_type?: string
          created_at?: string | null
          details?: Json | null
          due_date?: string | null
          id?: string
          next_actions?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consent_management: {
        Row: {
          ai_analysis_consent: boolean | null
          attribution_requirements: string | null
          benefit_sharing_preferences: Json | null
          community_consultation: boolean | null
          consent_date: string
          consent_granted: boolean
          consent_scope: Json
          consent_type: Database["public"]["Enums"]["consent_type_enum"]
          created_at: string | null
          elder_consultation: boolean | null
          expiry_date: string | null
          id: string
          ownership_assertion: string | null
          quote_extraction_consent: boolean | null
          renewal_required: boolean | null
          sharing_consent_level:
            | Database["public"]["Enums"]["sharing_consent_enum"]
            | null
          storyteller_id: string | null
          theme_analysis_consent: boolean | null
          traditional_protocols_followed: boolean | null
          updated_at: string | null
          withdrawal_instructions: string | null
        }
        Insert: {
          ai_analysis_consent?: boolean | null
          attribution_requirements?: string | null
          benefit_sharing_preferences?: Json | null
          community_consultation?: boolean | null
          consent_date: string
          consent_granted: boolean
          consent_scope: Json
          consent_type: Database["public"]["Enums"]["consent_type_enum"]
          created_at?: string | null
          elder_consultation?: boolean | null
          expiry_date?: string | null
          id?: string
          ownership_assertion?: string | null
          quote_extraction_consent?: boolean | null
          renewal_required?: boolean | null
          sharing_consent_level?:
            | Database["public"]["Enums"]["sharing_consent_enum"]
            | null
          storyteller_id?: string | null
          theme_analysis_consent?: boolean | null
          traditional_protocols_followed?: boolean | null
          updated_at?: string | null
          withdrawal_instructions?: string | null
        }
        Update: {
          ai_analysis_consent?: boolean | null
          attribution_requirements?: string | null
          benefit_sharing_preferences?: Json | null
          community_consultation?: boolean | null
          consent_date?: string
          consent_granted?: boolean
          consent_scope?: Json
          consent_type?: Database["public"]["Enums"]["consent_type_enum"]
          created_at?: string | null
          elder_consultation?: boolean | null
          expiry_date?: string | null
          id?: string
          ownership_assertion?: string | null
          quote_extraction_consent?: boolean | null
          renewal_required?: boolean | null
          sharing_consent_level?:
            | Database["public"]["Enums"]["sharing_consent_enum"]
            | null
          storyteller_id?: string | null
          theme_analysis_consent?: boolean | null
          traditional_protocols_followed?: boolean | null
          updated_at?: string | null
          withdrawal_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_management_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_context: string | null
          consent_given: boolean
          consent_level: string | null
          consent_method: string | null
          consent_type: string
          created_at: string | null
          cultural_notes: string | null
          cultural_protocols_followed: boolean | null
          expiry_date: string | null
          id: string
          legal_basis: string | null
          permissions: Json | null
          recorded_by: string | null
          restrictions: string[] | null
          status: string | null
          storyteller_id: string
          updated_at: string | null
          withdrawal_date: string | null
          withdrawal_reason: string | null
          witnessed_by: string | null
        }
        Insert: {
          consent_context?: string | null
          consent_given: boolean
          consent_level?: string | null
          consent_method?: string | null
          consent_type: string
          created_at?: string | null
          cultural_notes?: string | null
          cultural_protocols_followed?: boolean | null
          expiry_date?: string | null
          id?: string
          legal_basis?: string | null
          permissions?: Json | null
          recorded_by?: string | null
          restrictions?: string[] | null
          status?: string | null
          storyteller_id: string
          updated_at?: string | null
          withdrawal_date?: string | null
          withdrawal_reason?: string | null
          witnessed_by?: string | null
        }
        Update: {
          consent_context?: string | null
          consent_given?: boolean
          consent_level?: string | null
          consent_method?: string | null
          consent_type?: string
          created_at?: string | null
          cultural_notes?: string | null
          cultural_protocols_followed?: boolean | null
          expiry_date?: string | null
          id?: string
          legal_basis?: string | null
          permissions?: Json | null
          recorded_by?: string | null
          restrictions?: string[] | null
          status?: string | null
          storyteller_id?: string
          updated_at?: string | null
          withdrawal_date?: string | null
          withdrawal_reason?: string | null
          witnessed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_witnessed_by_fkey"
            columns: ["witnessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_cadence_metrics: {
        Row: {
          active_sources: string[] | null
          contact_id: string
          days_since_last: number | null
          last_interaction: string | null
          total_touchpoints: number | null
          touchpoints_last_30: number | null
          touchpoints_last_7: number | null
          touchpoints_last_90: number | null
          updated_at: string | null
        }
        Insert: {
          active_sources?: string[] | null
          contact_id: string
          days_since_last?: number | null
          last_interaction?: string | null
          total_touchpoints?: number | null
          touchpoints_last_30?: number | null
          touchpoints_last_7?: number | null
          touchpoints_last_90?: number | null
          updated_at?: string | null
        }
        Update: {
          active_sources?: string[] | null
          contact_id?: string
          days_since_last?: number | null
          last_interaction?: string | null
          total_touchpoints?: number | null
          touchpoints_last_30?: number | null
          touchpoints_last_7?: number | null
          touchpoints_last_90?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_communications: {
        Row: {
          action_items: string[] | null
          comm_type: string
          created_at: string
          direction: string
          full_content: string | null
          ghl_contact_id: string
          id: string
          metadata: Json | null
          occurred_at: string
          sentiment_score: number | null
          source: string
          source_id: string | null
          subject: string | null
          summary: string | null
          topics: string[] | null
        }
        Insert: {
          action_items?: string[] | null
          comm_type: string
          created_at?: string
          direction: string
          full_content?: string | null
          ghl_contact_id: string
          id?: string
          metadata?: Json | null
          occurred_at: string
          sentiment_score?: number | null
          source: string
          source_id?: string | null
          subject?: string | null
          summary?: string | null
          topics?: string[] | null
        }
        Update: {
          action_items?: string[] | null
          comm_type?: string
          created_at?: string
          direction?: string
          full_content?: string | null
          ghl_contact_id?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          sentiment_score?: number | null
          source?: string
          source_id?: string | null
          subject?: string | null
          summary?: string | null
          topics?: string[] | null
        }
        Relationships: []
      }
      contact_edges: {
        Row: {
          contact_a_id: number
          contact_b_id: number
          created_at: string
          id: number
          relationship_type: string
          strength: number
          updated_at: string
        }
        Insert: {
          contact_a_id: number
          contact_b_id: number
          created_at?: string
          id?: number
          relationship_type: string
          strength?: number
          updated_at?: string
        }
        Update: {
          contact_a_id?: number
          contact_b_id?: number
          created_at?: string
          id?: number
          relationship_type?: string
          strength?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_enrichments: {
        Row: {
          collaboration_potential: number | null
          contact_id: string
          created_at: string | null
          email_suggestions: string[] | null
          enrichment: Json | null
          id: string
          mode: string | null
          outreach_strategy: Json | null
          project_alignment: string[] | null
          reasoning: string | null
          risk_factors: string[] | null
          value_proposition: string | null
        }
        Insert: {
          collaboration_potential?: number | null
          contact_id: string
          created_at?: string | null
          email_suggestions?: string[] | null
          enrichment?: Json | null
          id?: string
          mode?: string | null
          outreach_strategy?: Json | null
          project_alignment?: string[] | null
          reasoning?: string | null
          risk_factors?: string[] | null
          value_proposition?: string | null
        }
        Update: {
          collaboration_potential?: number | null
          contact_id?: string
          created_at?: string | null
          email_suggestions?: string[] | null
          enrichment?: Json | null
          id?: string
          mode?: string | null
          outreach_strategy?: Json | null
          project_alignment?: string[] | null
          reasoning?: string | null
          risk_factors?: string[] | null
          value_proposition?: string | null
        }
        Relationships: []
      }
      contact_intelligence: {
        Row: {
          collaboration_score: number | null
          contact_id: string
          created_at: string | null
          id: string
          influence_score: number | null
          intelligence: Json | null
          interaction_count: number | null
          last_interaction: string | null
          project_matches: number | null
          response_rate: number | null
          updated_at: string | null
        }
        Insert: {
          collaboration_score?: number | null
          contact_id: string
          created_at?: string | null
          id?: string
          influence_score?: number | null
          intelligence?: Json | null
          interaction_count?: number | null
          last_interaction?: string | null
          project_matches?: number | null
          response_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          collaboration_score?: number | null
          contact_id?: string
          created_at?: string | null
          id?: string
          influence_score?: number | null
          intelligence?: Json | null
          interaction_count?: number | null
          last_interaction?: string | null
          project_matches?: number | null
          response_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_intelligence_insights: {
        Row: {
          contact_id: string
          created_at: string
          current_company: string | null
          current_role: string | null
          enriched_at: string
          headline: string | null
          highlights: Json | null
          id: string
          last_post_published_at: string | null
          last_post_title: string | null
          last_post_url: string | null
          source: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          current_company?: string | null
          current_role?: string | null
          enriched_at?: string
          headline?: string | null
          highlights?: Json | null
          id?: string
          last_post_published_at?: string | null
          last_post_title?: string | null
          last_post_url?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          current_company?: string | null
          current_role?: string | null
          enriched_at?: string
          headline?: string | null
          highlights?: Json | null
          id?: string
          last_post_published_at?: string | null
          last_post_title?: string | null
          last_post_url?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_intelligence_scores: {
        Row: {
          accessibility_score: number | null
          alignment_score: number | null
          calculation_method: string | null
          composite_score: number | null
          confidence_level: number | null
          engagement_readiness: number | null
          id: string
          influence_score: number | null
          last_calculated: string | null
          person_id: string
          response_likelihood: number | null
          strategic_value_score: number | null
          timing_score: number | null
        }
        Insert: {
          accessibility_score?: number | null
          alignment_score?: number | null
          calculation_method?: string | null
          composite_score?: number | null
          confidence_level?: number | null
          engagement_readiness?: number | null
          id?: string
          influence_score?: number | null
          last_calculated?: string | null
          person_id: string
          response_likelihood?: number | null
          strategic_value_score?: number | null
          timing_score?: number | null
        }
        Update: {
          accessibility_score?: number | null
          alignment_score?: number | null
          calculation_method?: string | null
          composite_score?: number | null
          confidence_level?: number | null
          engagement_readiness?: number | null
          id?: string
          influence_score?: number | null
          last_calculated?: string | null
          person_id?: string
          response_likelihood?: number | null
          strategic_value_score?: number | null
          timing_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_intelligence_scores_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "contact_intelligence_scores_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "contact_intelligence_scores_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "contact_intelligence_scores_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "contact_intelligence_scores_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      contact_interactions: {
        Row: {
          contact_id: string
          created_at: string | null
          description: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          interaction_date: string | null
          interaction_type: string
          metadata: Json | null
          outcome: string | null
          sentiment: string | null
          subject: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          description?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_date?: string | null
          interaction_type: string
          metadata?: Json | null
          outcome?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          description?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_date?: string | null
          interaction_type?: string
          metadata?: Json | null
          outcome?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      contact_invites: {
        Row: {
          contact_id: number
          created_at: string
          id: number
          invited_at: string
          notes: string | null
          opportunity_id: number
          response_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_id: number
          created_at?: string
          id?: number
          invited_at?: string
          notes?: string | null
          opportunity_id: number
          response_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_id?: number
          created_at?: string
          id?: number
          invited_at?: string
          notes?: string | null
          opportunity_id?: number
          response_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_invites_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_review_decisions: {
        Row: {
          approved_tags: string[] | null
          created_at: string | null
          decision: string
          domain: string | null
          email: string
          ghl_contact_id: string | null
          id: string
          name: string | null
          normalized_email: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_context: Json | null
          suggested_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          approved_tags?: string[] | null
          created_at?: string | null
          decision?: string
          domain?: string | null
          email: string
          ghl_contact_id?: string | null
          id?: string
          name?: string | null
          normalized_email?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_context?: Json | null
          suggested_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          approved_tags?: string[] | null
          created_at?: string | null
          decision?: string
          domain?: string | null
          email?: string
          ghl_contact_id?: string | null
          id?: string
          name?: string | null
          normalized_email?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_context?: Json | null
          suggested_tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_support_preferences: {
        Row: {
          contact_id: string
          created_at: string | null
          notes: string | null
          pinned_rank: number | null
          project_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          notes?: string | null
          pinned_rank?: number | null
          project_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          notes?: string | null
          pinned_rank?: number | null
          project_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_support_recommendations: {
        Row: {
          contact_id: string
          created_at: string | null
          last_generated: string | null
          pinned_count: number | null
          recommendations: Json | null
          total_recommendations: number | null
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          last_generated?: string | null
          pinned_count?: number | null
          recommendations?: Json | null
          total_recommendations?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          last_generated?: string | null
          pinned_count?: number | null
          recommendations?: Json | null
          total_recommendations?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_link_suggestions: {
        Row: {
          applied_at: string | null
          auto_applied: boolean | null
          confidence: number | null
          created_at: string | null
          evidence: Json | null
          id: string
          reasoning: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string
          source_type: string
          status: string | null
          suggested_role: string | null
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          auto_applied?: boolean | null
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          reasoning: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id: string
          source_type: string
          status?: string | null
          suggested_role?: string | null
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          auto_applied?: boolean | null
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          reasoning?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string
          source_type?: string
          status?: string | null
          suggested_role?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_link_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          context_summary: string | null
          created_at: string
          entities_mentioned: Json | null
          expires_at: string | null
          history: Json | null
          id: string
          intent_detected: string | null
          interface: string
          session_id: string
          site: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context_summary?: string | null
          created_at?: string
          entities_mentioned?: Json | null
          expires_at?: string | null
          history?: Json | null
          id?: string
          intent_detected?: string | null
          interface: string
          session_id: string
          site?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context_summary?: string | null
          created_at?: string
          entities_mentioned?: Json | null
          expires_at?: string | null
          history?: Json | null
          id?: string
          intent_detected?: string | null
          interface?: string
          session_id?: string
          site?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cultural_protocols: {
        Row: {
          created_at: string | null
          cultural_nation: string | null
          elder_consent: Json | null
          elder_reviewer_id: string | null
          elder_status: boolean | null
          empathy_ledger_user_id: string | null
          ghl_contact_id: string | null
          id: string
          ocap_access: string | null
          ocap_control: string | null
          ocap_ownership: string | null
          ocap_possession: string | null
          requires_elder_review: boolean | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          sacred_knowledge_notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cultural_nation?: string | null
          elder_consent?: Json | null
          elder_reviewer_id?: string | null
          elder_status?: boolean | null
          empathy_ledger_user_id?: string | null
          ghl_contact_id?: string | null
          id?: string
          ocap_access?: string | null
          ocap_control?: string | null
          ocap_ownership?: string | null
          ocap_possession?: string | null
          requires_elder_review?: boolean | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          sacred_knowledge_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cultural_nation?: string | null
          elder_consent?: Json | null
          elder_reviewer_id?: string | null
          elder_status?: boolean | null
          empathy_ledger_user_id?: string | null
          ghl_contact_id?: string | null
          id?: string
          ocap_access?: string | null
          ocap_control?: string | null
          ocap_ownership?: string | null
          ocap_possession?: string | null
          requires_elder_review?: boolean | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          sacred_knowledge_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cultural_protocols_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "ghl_contacts"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "cultural_protocols_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_with_protocols"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "cultural_protocols_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_donor_summary"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "cultural_protocols_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_volunteer_summary"
            referencedColumns: ["ghl_id"]
          },
        ]
      }
      data_quality_audit: {
        Row: {
          created_at: string | null
          id: string
          quality_check_type: string
          quality_score_after: number | null
          quality_score_before: number | null
          record_id: string
          table_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          quality_check_type?: string
          quality_score_after?: number | null
          quality_score_before?: number | null
          record_id: string
          table_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          quality_check_type?: string
          quality_score_after?: number | null
          quality_score_before?: number | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      data_quality_metrics: {
        Row: {
          accuracy_score: number | null
          analysis_date: string
          analysis_run_id: string | null
          complete_records: number
          consistency_score: number | null
          created_at: string | null
          data_freshness_score: number | null
          duplicate_records: number
          field_completeness: Json | null
          id: string
          incomplete_records: number
          invalid_records: number
          quality_issues: Json | null
          quality_score: number | null
          quality_threshold_met: boolean | null
          table_name: string
          total_records: number
        }
        Insert: {
          accuracy_score?: number | null
          analysis_date: string
          analysis_run_id?: string | null
          complete_records?: number
          consistency_score?: number | null
          created_at?: string | null
          data_freshness_score?: number | null
          duplicate_records?: number
          field_completeness?: Json | null
          id?: string
          incomplete_records?: number
          invalid_records?: number
          quality_issues?: Json | null
          quality_score?: number | null
          quality_threshold_met?: boolean | null
          table_name: string
          total_records?: number
        }
        Update: {
          accuracy_score?: number | null
          analysis_date?: string
          analysis_run_id?: string | null
          complete_records?: number
          consistency_score?: number | null
          created_at?: string | null
          data_freshness_score?: number | null
          duplicate_records?: number
          field_completeness?: Json | null
          id?: string
          incomplete_records?: number
          invalid_records?: number
          quality_issues?: Json | null
          quality_score?: number | null
          quality_threshold_met?: boolean | null
          table_name?: string
          total_records?: number
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          active: boolean | null
          api_endpoint: string | null
          base_url: string
          created_at: string | null
          discovery_patterns: Json | null
          id: string
          last_error_message: string | null
          last_successful_scrape: string | null
          max_concurrent_requests: number | null
          name: string
          rate_limit_ms: number | null
          reliability_score: number | null
          respect_robots_txt: boolean | null
          scraping_config: Json
          type: string
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          api_endpoint?: string | null
          base_url: string
          created_at?: string | null
          discovery_patterns?: Json | null
          id?: string
          last_error_message?: string | null
          last_successful_scrape?: string | null
          max_concurrent_requests?: number | null
          name: string
          rate_limit_ms?: number | null
          reliability_score?: number | null
          respect_robots_txt?: boolean | null
          scraping_config?: Json
          type: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          api_endpoint?: string | null
          base_url?: string
          created_at?: string | null
          discovery_patterns?: Json | null
          id?: string
          last_error_message?: string | null
          last_successful_scrape?: string | null
          max_concurrent_requests?: number | null
          name?: string
          rate_limit_ms?: number | null
          reliability_score?: number | null
          respect_robots_txt?: boolean | null
          scraping_config?: Json
          type?: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      decision_outcomes: {
        Row: {
          actual_impact: number | null
          decision_id: string
          id: string
          lessons_learned: string | null
          outcome_rating: number
          recorded_at: string
          success_metrics: Json | null
        }
        Insert: {
          actual_impact?: number | null
          decision_id: string
          id?: string
          lessons_learned?: string | null
          outcome_rating: number
          recorded_at?: string
          success_metrics?: Json | null
        }
        Update: {
          actual_impact?: number | null
          decision_id?: string
          id?: string
          lessons_learned?: string | null
          outcome_rating?: number
          recorded_at?: string
          success_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_outcomes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          ai_recommendation: string | null
          category: string
          confidence_score: number | null
          context: Json | null
          created_at: string
          data_sources: string[] | null
          decision_made: string | null
          description: string
          due_date: string | null
          financial_impact: number | null
          id: string
          lessons_learned: string | null
          outcome_rating: number | null
          priority: string
          related_decisions: string[] | null
          skill_pods_consulted: string[] | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_recommendation?: string | null
          category?: string
          confidence_score?: number | null
          context?: Json | null
          created_at?: string
          data_sources?: string[] | null
          decision_made?: string | null
          description: string
          due_date?: string | null
          financial_impact?: number | null
          id?: string
          lessons_learned?: string | null
          outcome_rating?: number | null
          priority?: string
          related_decisions?: string[] | null
          skill_pods_consulted?: string[] | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_recommendation?: string | null
          category?: string
          confidence_score?: number | null
          context?: Json | null
          created_at?: string
          data_sources?: string[] | null
          decision_made?: string | null
          description?: string
          due_date?: string | null
          financial_impact?: number | null
          id?: string
          lessons_learned?: string | null
          outcome_rating?: number | null
          priority?: string
          related_decisions?: string[] | null
          skill_pods_consulted?: string[] | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      discovered_subscriptions: {
        Row: {
          account_email: string | null
          amount: number | null
          annual_cost_cached: number | null
          cancel_reason: string | null
          completed_at: string | null
          confidence: number | null
          confirmed_at: string | null
          contacted_at: string | null
          created_at: string | null
          currency: string | null
          first_detected: string | null
          frequency: string | null
          gmail_message_id: string | null
          id: string
          last_scanned: string | null
          metadata: Json | null
          migration_notes: string | null
          migration_priority: number | null
          migration_status: string | null
          notes: string | null
          notion_page_id: string | null
          signals: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          vendor: string
          vendor_contact_email: string | null
          vendor_contact_source: string | null
          xero_contact_id: string | null
        }
        Insert: {
          account_email?: string | null
          amount?: number | null
          annual_cost_cached?: number | null
          cancel_reason?: string | null
          completed_at?: string | null
          confidence?: number | null
          confirmed_at?: string | null
          contacted_at?: string | null
          created_at?: string | null
          currency?: string | null
          first_detected?: string | null
          frequency?: string | null
          gmail_message_id?: string | null
          id?: string
          last_scanned?: string | null
          metadata?: Json | null
          migration_notes?: string | null
          migration_priority?: number | null
          migration_status?: string | null
          notes?: string | null
          notion_page_id?: string | null
          signals?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          vendor: string
          vendor_contact_email?: string | null
          vendor_contact_source?: string | null
          xero_contact_id?: string | null
        }
        Update: {
          account_email?: string | null
          amount?: number | null
          annual_cost_cached?: number | null
          cancel_reason?: string | null
          completed_at?: string | null
          confidence?: number | null
          confirmed_at?: string | null
          contacted_at?: string | null
          created_at?: string | null
          currency?: string | null
          first_detected?: string | null
          frequency?: string | null
          gmail_message_id?: string | null
          id?: string
          last_scanned?: string | null
          metadata?: Json | null
          migration_notes?: string | null
          migration_priority?: number | null
          migration_status?: string | null
          notes?: string | null
          notion_page_id?: string | null
          signals?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          vendor?: string
          vendor_contact_email?: string | null
          vendor_contact_source?: string | null
          xero_contact_id?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          donation_date: string
          donation_method: string | null
          frequency: string | null
          ghl_contact_id: string | null
          ghl_opportunity_id: string | null
          id: string
          project: string | null
          receipt_sent: boolean | null
          receipt_sent_at: string | null
          stripe_customer_id: string | null
          stripe_payment_id: string | null
          synced_to_ghl: boolean | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          donation_date: string
          donation_method?: string | null
          frequency?: string | null
          ghl_contact_id?: string | null
          ghl_opportunity_id?: string | null
          id?: string
          project?: string | null
          receipt_sent?: boolean | null
          receipt_sent_at?: string | null
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          synced_to_ghl?: boolean | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          donation_date?: string
          donation_method?: string | null
          frequency?: string | null
          ghl_contact_id?: string | null
          ghl_opportunity_id?: string | null
          id?: string
          project?: string | null
          receipt_sent?: boolean | null
          receipt_sent_at?: string | null
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          synced_to_ghl?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "ghl_contacts"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "donations_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_with_protocols"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "donations_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_donor_summary"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "donations_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_volunteer_summary"
            referencedColumns: ["ghl_id"]
          },
        ]
      }
      elder_review_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          communities_involved: string[] | null
          content: string
          content_type: string
          created_at: string | null
          cultural_topics: string[] | null
          id: string
          priority: number | null
          project_slug: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sensitivity_level: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          suggested_changes: string | null
          verification_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          communities_involved?: string[] | null
          content: string
          content_type: string
          created_at?: string | null
          cultural_topics?: string[] | null
          id?: string
          priority?: number | null
          project_slug?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitivity_level?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          suggested_changes?: string | null
          verification_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          communities_involved?: string[] | null
          content?: string
          content_type?: string
          created_at?: string | null
          cultural_topics?: string[] | null
          id?: string
          priority?: number | null
          project_slug?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitivity_level?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          suggested_changes?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elder_review_queue_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "ai_content_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elder_review_queue_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "training_ready_content"
            referencedColumns: ["id"]
          },
        ]
      }
      email_financial_documents: {
        Row: {
          account_email: string
          amount: number | null
          cancellation_date: string | null
          cancellation_reason: string | null
          category: string | null
          confidence: number | null
          consolidation_notes: string | null
          consolidation_status: string | null
          created_at: string | null
          currency: string | null
          data_quality_score: number | null
          document_type: string
          extraction_method: string | null
          from_email: string | null
          gmail_message_id: string
          id: string
          is_subscription: boolean | null
          last_payment_date: string | null
          last_renewal_reminder_date: string | null
          next_payment_date: string | null
          payment_day_of_month: number | null
          payment_pattern_confidence: number | null
          processed_by: string | null
          raw_extraction: Json | null
          reconciliation_confidence: number | null
          reconciliation_date: string | null
          reconciliation_notes: string | null
          reconciliation_status: string | null
          renewal_reminder_sent: boolean | null
          subject: string | null
          subscription_frequency: string | null
          subscription_id: string | null
          subscription_status: string | null
          tags: Json | null
          target_account_email: string | null
          tenant_id: string
          transaction_date: string | null
          updated_at: string | null
          usage_last_checked_date: string | null
          usage_status: string | null
          vendor: string
          vendor_contact_email: string | null
          xero_contact_id: string | null
          xero_transaction_id: string | null
        }
        Insert: {
          account_email: string
          amount?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          category?: string | null
          confidence?: number | null
          consolidation_notes?: string | null
          consolidation_status?: string | null
          created_at?: string | null
          currency?: string | null
          data_quality_score?: number | null
          document_type: string
          extraction_method?: string | null
          from_email?: string | null
          gmail_message_id: string
          id?: string
          is_subscription?: boolean | null
          last_payment_date?: string | null
          last_renewal_reminder_date?: string | null
          next_payment_date?: string | null
          payment_day_of_month?: number | null
          payment_pattern_confidence?: number | null
          processed_by?: string | null
          raw_extraction?: Json | null
          reconciliation_confidence?: number | null
          reconciliation_date?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string | null
          renewal_reminder_sent?: boolean | null
          subject?: string | null
          subscription_frequency?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          tags?: Json | null
          target_account_email?: string | null
          tenant_id: string
          transaction_date?: string | null
          updated_at?: string | null
          usage_last_checked_date?: string | null
          usage_status?: string | null
          vendor: string
          vendor_contact_email?: string | null
          xero_contact_id?: string | null
          xero_transaction_id?: string | null
        }
        Update: {
          account_email?: string
          amount?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          category?: string | null
          confidence?: number | null
          consolidation_notes?: string | null
          consolidation_status?: string | null
          created_at?: string | null
          currency?: string | null
          data_quality_score?: number | null
          document_type?: string
          extraction_method?: string | null
          from_email?: string | null
          gmail_message_id?: string
          id?: string
          is_subscription?: boolean | null
          last_payment_date?: string | null
          last_renewal_reminder_date?: string | null
          next_payment_date?: string | null
          payment_day_of_month?: number | null
          payment_pattern_confidence?: number | null
          processed_by?: string | null
          raw_extraction?: Json | null
          reconciliation_confidence?: number | null
          reconciliation_date?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string | null
          renewal_reminder_sent?: boolean | null
          subject?: string | null
          subscription_frequency?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          tags?: Json | null
          target_account_email?: string | null
          tenant_id?: string
          transaction_date?: string | null
          updated_at?: string | null
          usage_last_checked_date?: string | null
          usage_status?: string | null
          vendor?: string
          vendor_contact_email?: string | null
          xero_contact_id?: string | null
          xero_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_financial_documents_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "discovered_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_reviews: {
        Row: {
          ai_generated: Json
          confidence: number | null
          created_at: string | null
          enrichment_type: string
          id: string
          original_data: Json | null
          project_slug: string
          project_title: string | null
          reasoning: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          ai_generated: Json
          confidence?: number | null
          created_at?: string | null
          enrichment_type: string
          id?: string
          original_data?: Json | null
          project_slug: string
          project_title?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: Json
          confidence?: number | null
          created_at?: string | null
          enrichment_type?: string
          id?: string
          original_data?: Json | null
          project_slug?: string
          project_title?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      entities: {
        Row: {
          company: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          primary_email: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          primary_email?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          primary_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entity_mappings: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          metadata: Json | null
          source_id: string
          source_system: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          metadata?: Json | null
          source_id: string
          source_system: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata?: Json | null
          source_id?: string
          source_system?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_mappings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_relationships: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          last_interaction: string | null
          metadata: Json | null
          related_entity_id: string
          related_entity_type: string
          relationship_type: string | null
          strength_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          last_interaction?: string | null
          metadata?: Json | null
          related_entity_id: string
          related_entity_type: string
          relationship_type?: string | null
          strength_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_interaction?: string | null
          metadata?: Json | null
          related_entity_id?: string
          related_entity_type?: string
          relationship_type?: string | null
          strength_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          accessibility_needs: string | null
          created_at: string | null
          dietary_requirements: string | null
          email: string
          event_id: string
          full_name: string
          ghl_contact_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          organization: string | null
          phone: string | null
          plus_one: boolean | null
          registration_status: string | null
          updated_at: string | null
        }
        Insert: {
          accessibility_needs?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          email: string
          event_id: string
          full_name: string
          ghl_contact_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization?: string | null
          phone?: string | null
          plus_one?: boolean | null
          registration_status?: string | null
          updated_at?: string | null
        }
        Update: {
          accessibility_needs?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          email?: string
          event_id?: string
          full_name?: string
          ghl_contact_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization?: string | null
          phone?: string | null
          plus_one?: boolean | null
          registration_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_date: string | null
          event_type: string | null
          gallery_urls: string[] | null
          ghl_event_id: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_public: boolean | null
          latitude: number | null
          location_address: string | null
          location_name: string | null
          location_state: string | null
          longitude: number | null
          max_attendees: number | null
          node_id: string | null
          registration_url: string | null
          slug: string | null
          start_date: string
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          gallery_urls?: string[] | null
          ghl_event_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          location_state?: string | null
          longitude?: number | null
          max_attendees?: number | null
          node_id?: string | null
          registration_url?: string | null
          slug?: string | null
          start_date: string
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          gallery_urls?: string[] | null
          ghl_event_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          location_state?: string | null
          longitude?: number | null
          max_attendees?: number | null
          node_id?: string | null
          registration_url?: string | null
          slug?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "justicehub_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      events_old_backup: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          contactEmail: string
          createdAt: string
          date: string
          description: string
          id: number
          location: string
          status: Database["public"]["Enums"]["event_status"]
          submittedBy: string | null
          time: string
          title: string
          updatedAt: string
        }
        Insert: {
          category: Database["public"]["Enums"]["event_category"]
          contactEmail: string
          createdAt?: string
          date: string
          description: string
          id?: number
          location: string
          status?: Database["public"]["Enums"]["event_status"]
          submittedBy?: string | null
          time: string
          title: string
          updatedAt?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          contactEmail?: string
          createdAt?: string
          date?: string
          description?: string
          id?: number
          location?: string
          status?: Database["public"]["Enums"]["event_status"]
          submittedBy?: string | null
          time?: string
          title?: string
          updatedAt?: string
        }
        Relationships: []
      }
      exa_api_usage: {
        Row: {
          company_requests: number | null
          created_at: string
          estimated_cost_usd: number | null
          failed_requests: number
          free_tier_exceeded: boolean | null
          free_tier_limit: number
          free_tier_remaining: number
          id: string
          linkedin_requests: number | null
          media_requests: number | null
          network_discovery_requests: number | null
          period_month: string
          successful_requests: number
          total_requests: number
          updated_at: string
        }
        Insert: {
          company_requests?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          failed_requests?: number
          free_tier_exceeded?: boolean | null
          free_tier_limit?: number
          free_tier_remaining?: number
          id?: string
          linkedin_requests?: number | null
          media_requests?: number | null
          network_discovery_requests?: number | null
          period_month: string
          successful_requests?: number
          total_requests?: number
          updated_at?: string
        }
        Update: {
          company_requests?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          failed_requests?: number
          free_tier_exceeded?: boolean | null
          free_tier_limit?: number
          free_tier_remaining?: number
          id?: string
          linkedin_requests?: number | null
          media_requests?: number | null
          network_discovery_requests?: number | null
          period_month?: string
          successful_requests?: number
          total_requests?: number
          updated_at?: string
        }
        Relationships: []
      }
      exa_company_intelligence: {
        Row: {
          company_name: string
          company_size: string | null
          confidence_score: number | null
          created_at: string
          description: string | null
          enriched_at: string
          exa_raw_data: Json | null
          founded_year: number | null
          funding_info: Json | null
          headquarters_location: string | null
          id: string
          industry: string | null
          leadership: Json | null
          linkedin_company_url: string | null
          recent_news: Json | null
          twitter_handle: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          enriched_at?: string
          exa_raw_data?: Json | null
          founded_year?: number | null
          funding_info?: Json | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          leadership?: Json | null
          linkedin_company_url?: string | null
          recent_news?: Json | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          enriched_at?: string
          exa_raw_data?: Json | null
          founded_year?: number | null
          funding_info?: Json | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          leadership?: Json | null
          linkedin_company_url?: string | null
          recent_news?: Json | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      exa_enrichment_queue: {
        Row: {
          campaign_id: string | null
          campaign_type: string | null
          completed_at: string | null
          created_at: string
          enrich_company: boolean | null
          enrich_linkedin: boolean | null
          enrich_media: boolean | null
          enrich_network: boolean | null
          error_message: string | null
          estimated_cost_requests: number | null
          exa_requests_used: number | null
          id: string
          person_id: string
          priority: number
          queued_at: string
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string
          enrich_company?: boolean | null
          enrich_linkedin?: boolean | null
          enrich_media?: boolean | null
          enrich_network?: boolean | null
          error_message?: string | null
          estimated_cost_requests?: number | null
          exa_requests_used?: number | null
          id?: string
          person_id: string
          priority?: number
          queued_at?: string
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string
          enrich_company?: boolean | null
          enrich_linkedin?: boolean | null
          enrich_media?: boolean | null
          enrich_network?: boolean | null
          error_message?: string | null
          estimated_cost_requests?: number | null
          exa_requests_used?: number | null
          id?: string
          person_id?: string
          priority?: number
          queued_at?: string
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exa_enrichment_queue_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_enrichment_queue_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_enrichment_queue_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_enrichment_queue_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_enrichment_queue_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      exa_linkedin_profiles: {
        Row: {
          confidence_score: number | null
          created_at: string
          current_company: string | null
          current_position: string | null
          education: Json | null
          enriched_at: string
          exa_raw_data: Json | null
          experience: Json | null
          headline: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          person_id: string
          skills: string[] | null
          source_url: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          enriched_at?: string
          exa_raw_data?: Json | null
          experience?: Json | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          person_id: string
          skills?: string[] | null
          source_url?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          enriched_at?: string
          exa_raw_data?: Json | null
          experience?: Json | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          person_id?: string
          skills?: string[] | null
          source_url?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exa_linkedin_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_linkedin_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_linkedin_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_linkedin_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_linkedin_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      exa_media_mentions: {
        Row: {
          created_at: string
          discovered_at: string
          excerpt: string | null
          full_text: string | null
          id: string
          mention_type: string | null
          person_id: string
          published_date: string | null
          relevance_score: number | null
          sentiment: string | null
          source_domain: string | null
          title: string
          topics: string[] | null
          url: string
        }
        Insert: {
          created_at?: string
          discovered_at?: string
          excerpt?: string | null
          full_text?: string | null
          id?: string
          mention_type?: string | null
          person_id: string
          published_date?: string | null
          relevance_score?: number | null
          sentiment?: string | null
          source_domain?: string | null
          title: string
          topics?: string[] | null
          url: string
        }
        Update: {
          created_at?: string
          discovered_at?: string
          excerpt?: string | null
          full_text?: string | null
          id?: string
          mention_type?: string | null
          person_id?: string
          published_date?: string | null
          relevance_score?: number | null
          sentiment?: string | null
          source_domain?: string | null
          title?: string
          topics?: string[] | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "exa_media_mentions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_media_mentions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_media_mentions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_media_mentions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "exa_media_mentions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      facility_partnerships: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          facility_id: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          participants_served: number | null
          partner_type: string
          partnership_type: string
          program_id: string | null
          service_id: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          participants_served?: number | null
          partner_type: string
          partnership_type: string
          program_id?: string | null
          service_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          facility_id?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          participants_served?: number | null
          partner_type?: string
          partnership_type?: string
          program_id?: string | null
          service_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_partnerships_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "v_facilities_with_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_partnerships_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "youth_detention_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_partnerships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_partnerships_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_partnerships_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_partnerships_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_statistics: {
        Row: {
          age_10_13_count: number | null
          age_14_15_count: number | null
          age_16_17_count: number | null
          assaults_count: number | null
          average_daily_population: number | null
          created_at: string | null
          data_source: string | null
          education_participation_percentage: number | null
          escapes_count: number | null
          facility_id: string | null
          female_percentage: number | null
          id: string
          incidents_count: number | null
          indigenous_percentage: number | null
          peak_population: number | null
          period_end: string
          period_start: string
          program_completion_count: number | null
          remand_percentage: number | null
          reporting_period: string | null
          self_harm_count: number | null
          source_url: string | null
          total_admissions: number | null
          total_releases: number | null
        }
        Insert: {
          age_10_13_count?: number | null
          age_14_15_count?: number | null
          age_16_17_count?: number | null
          assaults_count?: number | null
          average_daily_population?: number | null
          created_at?: string | null
          data_source?: string | null
          education_participation_percentage?: number | null
          escapes_count?: number | null
          facility_id?: string | null
          female_percentage?: number | null
          id?: string
          incidents_count?: number | null
          indigenous_percentage?: number | null
          peak_population?: number | null
          period_end: string
          period_start: string
          program_completion_count?: number | null
          remand_percentage?: number | null
          reporting_period?: string | null
          self_harm_count?: number | null
          source_url?: string | null
          total_admissions?: number | null
          total_releases?: number | null
        }
        Update: {
          age_10_13_count?: number | null
          age_14_15_count?: number | null
          age_16_17_count?: number | null
          assaults_count?: number | null
          average_daily_population?: number | null
          created_at?: string | null
          data_source?: string | null
          education_participation_percentage?: number | null
          escapes_count?: number | null
          facility_id?: string | null
          female_percentage?: number | null
          id?: string
          incidents_count?: number | null
          indigenous_percentage?: number | null
          peak_population?: number | null
          period_end?: string
          period_start?: string
          program_completion_count?: number | null
          remand_percentage?: number | null
          reporting_period?: string | null
          self_harm_count?: number | null
          source_url?: string | null
          total_admissions?: number | null
          total_releases?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_statistics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "v_facilities_with_partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_statistics_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "youth_detention_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      fellows: {
        Row: {
          additional_data: Json | null
          areas_of_expertise: string[] | null
          bio: string | null
          city: string | null
          cohort_year: number | null
          country: string | null
          created_at: string | null
          email: string | null
          fellow_status: string | null
          fellowship_goals: Json | null
          full_name: string
          id: number
          impact_areas: string[] | null
          linkedin_url: string | null
          organization: string | null
          role_title: string | null
          state: string | null
          website_url: string | null
        }
        Insert: {
          additional_data?: Json | null
          areas_of_expertise?: string[] | null
          bio?: string | null
          city?: string | null
          cohort_year?: number | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          fellow_status?: string | null
          fellowship_goals?: Json | null
          full_name: string
          id?: number
          impact_areas?: string[] | null
          linkedin_url?: string | null
          organization?: string | null
          role_title?: string | null
          state?: string | null
          website_url?: string | null
        }
        Update: {
          additional_data?: Json | null
          areas_of_expertise?: string[] | null
          bio?: string | null
          city?: string | null
          cohort_year?: number | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          fellow_status?: string | null
          fellowship_goals?: Json | null
          full_name?: string
          id?: number
          impact_areas?: string[] | null
          linkedin_url?: string | null
          organization?: string | null
          role_title?: string | null
          state?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      financial_project_summaries: {
        Row: {
          concentration_risk: boolean | null
          last_updated: string | null
          notion_project_id: string | null
          project_id: string
          project_name: string | null
          runway_days: number | null
          top_funders: Json | null
          total_actual: number | null
          total_potential: number | null
        }
        Insert: {
          concentration_risk?: boolean | null
          last_updated?: string | null
          notion_project_id?: string | null
          project_id: string
          project_name?: string | null
          runway_days?: number | null
          top_funders?: Json | null
          total_actual?: number | null
          total_potential?: number | null
        }
        Update: {
          concentration_risk?: boolean | null
          last_updated?: string | null
          notion_project_id?: string | null
          project_id?: string
          project_name?: string | null
          runway_days?: number | null
          top_funders?: Json | null
          total_actual?: number | null
          total_potential?: number | null
        }
        Relationships: []
      }
      financial_summary: {
        Row: {
          community_percentage: number
          community_share: number
          created_at: string
          expenses: number
          id: string
          income: number
          net_available_for_communities: number
          net_income: number
          operating_expenses: number
          reported_at: string
          total_revenue: number
          transaction_count: number
        }
        Insert: {
          community_percentage?: number
          community_share?: number
          created_at?: string
          expenses?: number
          id?: string
          income?: number
          net_available_for_communities?: number
          net_income?: number
          operating_expenses?: number
          reported_at?: string
          total_revenue?: number
          transaction_count?: number
        }
        Update: {
          community_percentage?: number
          community_share?: number
          created_at?: string
          expenses?: number
          id?: string
          income?: number
          net_available_for_communities?: number
          net_income?: number
          operating_expenses?: number
          reported_at?: string
          total_revenue?: number
          transaction_count?: number
        }
        Relationships: []
      }
      ghl_contacts: {
        Row: {
          company_name: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          engagement_status: string | null
          first_contact_date: string | null
          first_name: string | null
          full_name: string | null
          ghl_created_at: string | null
          ghl_id: string
          ghl_location_id: string
          ghl_updated_at: string | null
          id: string
          last_contact_date: string | null
          last_name: string | null
          last_synced_at: string | null
          phone: string | null
          projects: string[] | null
          sync_error: string | null
          sync_status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          engagement_status?: string | null
          first_contact_date?: string | null
          first_name?: string | null
          full_name?: string | null
          ghl_created_at?: string | null
          ghl_id: string
          ghl_location_id: string
          ghl_updated_at?: string | null
          id?: string
          last_contact_date?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          phone?: string | null
          projects?: string[] | null
          sync_error?: string | null
          sync_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          engagement_status?: string | null
          first_contact_date?: string | null
          first_name?: string | null
          full_name?: string | null
          ghl_created_at?: string | null
          ghl_id?: string
          ghl_location_id?: string
          ghl_updated_at?: string | null
          id?: string
          last_contact_date?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          phone?: string | null
          projects?: string[] | null
          sync_error?: string | null
          sync_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ghl_engagement_metrics: {
        Row: {
          act_energy_percent: number | null
          contact_id: string | null
          created_at: string | null
          current_stage: string | null
          engagement_count: number | null
          ghl_contact_id: string | null
          id: string
          last_engagement: string | null
          obsolescence_achieved: boolean | null
          person_id: string | null
          pipeline_type: string | null
          project_match_id: string | null
          trajectory_to_orbit: string | null
          updated_at: string | null
        }
        Insert: {
          act_energy_percent?: number | null
          contact_id?: string | null
          created_at?: string | null
          current_stage?: string | null
          engagement_count?: number | null
          ghl_contact_id?: string | null
          id?: string
          last_engagement?: string | null
          obsolescence_achieved?: boolean | null
          person_id?: string | null
          pipeline_type?: string | null
          project_match_id?: string | null
          trajectory_to_orbit?: string | null
          updated_at?: string | null
        }
        Update: {
          act_energy_percent?: number | null
          contact_id?: string | null
          created_at?: string | null
          current_stage?: string | null
          engagement_count?: number | null
          ghl_contact_id?: string | null
          id?: string
          last_engagement?: string | null
          obsolescence_achieved?: boolean | null
          person_id?: string | null
          pipeline_type?: string | null
          project_match_id?: string | null
          trajectory_to_orbit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghl_engagement_metrics_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ghl_engagement_metrics_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["linkedin_contact_id"]
          },
          {
            foreignKeyName: "ghl_engagement_metrics_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "ghl_engagement_metrics_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "ghl_engagement_metrics_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "ghl_engagement_metrics_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "ghl_engagement_metrics_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      ghl_opportunities: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          custom_fields: Json | null
          ghl_contact_id: string | null
          ghl_created_at: string | null
          ghl_id: string
          ghl_pipeline_id: string
          ghl_stage_id: string
          ghl_updated_at: string | null
          id: string
          last_synced_at: string | null
          monetary_value: number | null
          name: string
          pipeline_name: string | null
          stage_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          ghl_contact_id?: string | null
          ghl_created_at?: string | null
          ghl_id: string
          ghl_pipeline_id: string
          ghl_stage_id: string
          ghl_updated_at?: string | null
          id?: string
          last_synced_at?: string | null
          monetary_value?: number | null
          name: string
          pipeline_name?: string | null
          stage_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          ghl_contact_id?: string | null
          ghl_created_at?: string | null
          ghl_id?: string
          ghl_pipeline_id?: string
          ghl_stage_id?: string
          ghl_updated_at?: string | null
          id?: string
          last_synced_at?: string | null
          monetary_value?: number | null
          name?: string
          pipeline_name?: string | null
          stage_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghl_opportunities_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "ghl_contacts"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "ghl_opportunities_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_with_protocols"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "ghl_opportunities_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_donor_summary"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "ghl_opportunities_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_volunteer_summary"
            referencedColumns: ["ghl_id"]
          },
        ]
      }
      ghl_pipelines: {
        Row: {
          created_at: string | null
          ghl_id: string
          ghl_location_id: string
          id: string
          last_synced_at: string | null
          name: string
          stages: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ghl_id: string
          ghl_location_id: string
          id?: string
          last_synced_at?: string | null
          name: string
          stages?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ghl_id?: string
          ghl_location_id?: string
          id?: string
          last_synced_at?: string | null
          name?: string
          stages?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ghl_sync_log: {
        Row: {
          completed_at: string | null
          direction: string
          duration_ms: number | null
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          operation: string
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_skipped: number | null
          records_updated: number | null
          started_at: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          direction: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          records_updated?: number | null
          started_at?: string | null
          status: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          direction?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      ghl_tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          ghl_location_id: string
          id: string
          last_synced_at: string | null
          name: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          ghl_location_id: string
          id?: string
          last_synced_at?: string | null
          name: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          ghl_location_id?: string
          id?: string
          last_synced_at?: string | null
          name?: string
        }
        Relationships: []
      }
      gmail_auth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expiry_date: number | null
          id: string
          refresh_token: string | null
          scope: string | null
          updated_at: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expiry_date?: number | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expiry_date?: number | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gmail_contacts: {
        Row: {
          created_at: string | null
          discovered_at: string | null
          domain: string | null
          email: string
          id: string
          last_interaction: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discovered_at?: string | null
          domain?: string | null
          email: string
          id?: string
          last_interaction?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discovered_at?: string | null
          domain?: string | null
          email?: string
          id?: string
          last_interaction?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gmail_messages: {
        Row: {
          attachment_count: number | null
          attachment_names: string[] | null
          attachment_total_size: number | null
          bcc_emails: string[] | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          created_at: string | null
          from_email: string | null
          from_name: string | null
          gmail_id: string
          has_attachments: boolean | null
          id: string
          importance: string | null
          is_archived: boolean | null
          is_read: boolean | null
          is_spam: boolean | null
          is_starred: boolean | null
          is_trashed: boolean | null
          keywords: string[] | null
          labels: string[] | null
          received_date: string | null
          sent_date: string | null
          snippet: string | null
          subject: string | null
          synced_at: string | null
          thread_id: string
          to_emails: string[] | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          attachment_count?: number | null
          attachment_names?: string[] | null
          attachment_total_size?: number | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          gmail_id: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          is_archived?: boolean | null
          is_read?: boolean | null
          is_spam?: boolean | null
          is_starred?: boolean | null
          is_trashed?: boolean | null
          keywords?: string[] | null
          labels?: string[] | null
          received_date?: string | null
          sent_date?: string | null
          snippet?: string | null
          subject?: string | null
          synced_at?: string | null
          thread_id: string
          to_emails?: string[] | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          attachment_count?: number | null
          attachment_names?: string[] | null
          attachment_total_size?: number | null
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          gmail_id?: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          is_archived?: boolean | null
          is_read?: boolean | null
          is_spam?: boolean | null
          is_starred?: boolean | null
          is_trashed?: boolean | null
          keywords?: string[] | null
          labels?: string[] | null
          received_date?: string | null
          sent_date?: string | null
          snippet?: string | null
          subject?: string | null
          synced_at?: string | null
          thread_id?: string
          to_emails?: string[] | null
          updated_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      gmail_sync_state: {
        Row: {
          account_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          items_extracted: number | null
          items_found: number | null
          last_history_id: string | null
          last_sync_at: string | null
          next_sync_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_extracted?: number | null
          items_found?: number | null
          last_history_id?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_extracted?: number | null
          items_found?: number | null
          last_history_id?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gmail_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "gmail_auth_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_sync_status: {
        Row: {
          created_at: string | null
          error_count: number | null
          error_message: string | null
          id: string
          last_error: string | null
          last_sync: string | null
          next_sync: string | null
          sync_duration_ms: number | null
          sync_status: string | null
          synced_messages: number | null
          total_messages: number | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_error?: string | null
          last_sync?: string | null
          next_sync?: string | null
          sync_duration_ms?: number | null
          sync_status?: string | null
          synced_messages?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_error?: string | null
          last_sync?: string | null
          next_sync?: string | null
          sync_duration_ms?: number | null
          sync_status?: string | null
          synced_messages?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      grant_opportunities: {
        Row: {
          amount_max: number | null
          amount_min: number | null
          application_status: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          relevance_score: number | null
          requirements: string | null
          source: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          amount_max?: number | null
          amount_min?: number | null
          application_status?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          relevance_score?: number | null
          requirements?: string | null
          source: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          amount_max?: number | null
          amount_min?: number | null
          application_status?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          relevance_score?: number | null
          requirements?: string | null
          source?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      historical_inquiries: {
        Row: {
          created_at: string | null
          id: string
          implementation_status: string | null
          inquiry_type: string | null
          jurisdiction: string | null
          key_findings: Json | null
          pdf_url: string | null
          recommendations_count: number | null
          related_intervention_ids: string[] | null
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string | null
          year_published: number | null
          year_started: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          implementation_status?: string | null
          inquiry_type?: string | null
          jurisdiction?: string | null
          key_findings?: Json | null
          pdf_url?: string | null
          recommendations_count?: number | null
          related_intervention_ids?: string[] | null
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          year_published?: number | null
          year_started?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          implementation_status?: string | null
          inquiry_type?: string | null
          jurisdiction?: string | null
          key_findings?: Json | null
          pdf_url?: string | null
          recommendations_count?: number | null
          related_intervention_ids?: string[] | null
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          year_published?: number | null
          year_started?: number | null
        }
        Relationships: []
      }
      ignored_email_patterns: {
        Row: {
          created_at: string | null
          id: string
          pattern: string
          pattern_type: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pattern: string
          pattern_type: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pattern?: string
          pattern_type?: string
          reason?: string | null
        }
        Relationships: []
      }
      impact_evidence: {
        Row: {
          behavior_changes_described: string | null
          created_at: string | null
          duration_of_impact: string | null
          evidence_strength:
            | Database["public"]["Enums"]["evidence_strength_enum"]
            | null
          external_validation: boolean | null
          id: string
          impact_scope: Database["public"]["Enums"]["impact_scope_enum"]
          impact_type: Database["public"]["Enums"]["impact_type_enum"]
          measurable_outcomes: Json | null
          outcome_description: string | null
          people_affected: number | null
          replication_potential: number | null
          scaling_opportunities: string | null
          story_evidence: string | null
          storyteller_id: string | null
          sustainability_indicators: Json | null
          testimonial_quotes: string[] | null
          updated_at: string | null
          verification_method: string | null
        }
        Insert: {
          behavior_changes_described?: string | null
          created_at?: string | null
          duration_of_impact?: string | null
          evidence_strength?:
            | Database["public"]["Enums"]["evidence_strength_enum"]
            | null
          external_validation?: boolean | null
          id?: string
          impact_scope: Database["public"]["Enums"]["impact_scope_enum"]
          impact_type: Database["public"]["Enums"]["impact_type_enum"]
          measurable_outcomes?: Json | null
          outcome_description?: string | null
          people_affected?: number | null
          replication_potential?: number | null
          scaling_opportunities?: string | null
          story_evidence?: string | null
          storyteller_id?: string | null
          sustainability_indicators?: Json | null
          testimonial_quotes?: string[] | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Update: {
          behavior_changes_described?: string | null
          created_at?: string | null
          duration_of_impact?: string | null
          evidence_strength?:
            | Database["public"]["Enums"]["evidence_strength_enum"]
            | null
          external_validation?: boolean | null
          id?: string
          impact_scope?: Database["public"]["Enums"]["impact_scope_enum"]
          impact_type?: Database["public"]["Enums"]["impact_type_enum"]
          measurable_outcomes?: Json | null
          outcome_description?: string | null
          people_affected?: number | null
          replication_potential?: number | null
          scaling_opportunities?: string | null
          story_evidence?: string | null
          storyteller_id?: string | null
          sustainability_indicators?: Json | null
          testimonial_quotes?: string[] | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_evidence_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_stories: {
        Row: {
          amplification_consent: boolean | null
          beneficiaries_mentioned: string[] | null
          created_at: string | null
          id: string
          impact_description: string
          outcome_quotes: string[] | null
          related_story: string | null
          scale_indicators: string[] | null
          story_source: string | null
          story_title: string
          storyteller_id: string | null
          timeframe_mentioned: string | null
          updated_at: string | null
          visibility_level: string | null
        }
        Insert: {
          amplification_consent?: boolean | null
          beneficiaries_mentioned?: string[] | null
          created_at?: string | null
          id?: string
          impact_description: string
          outcome_quotes?: string[] | null
          related_story?: string | null
          scale_indicators?: string[] | null
          story_source?: string | null
          story_title: string
          storyteller_id?: string | null
          timeframe_mentioned?: string | null
          updated_at?: string | null
          visibility_level?: string | null
        }
        Update: {
          amplification_consent?: boolean | null
          beneficiaries_mentioned?: string[] | null
          created_at?: string | null
          id?: string
          impact_description?: string
          outcome_quotes?: string[] | null
          related_story?: string | null
          scale_indicators?: string[] | null
          story_source?: string | null
          story_title?: string
          storyteller_id?: string | null
          timeframe_mentioned?: string | null
          updated_at?: string | null
          visibility_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_stories_story_source_fkey"
            columns: ["story_source"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_stories_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_briefings: {
        Row: {
          created_by: string | null
          generated_at: string
          highlights: Json | null
          id: string
          metadata: Json | null
          metrics: Json | null
          summary: string
        }
        Insert: {
          created_by?: string | null
          generated_at?: string
          highlights?: Json | null
          id?: string
          metadata?: Json | null
          metrics?: Json | null
          summary: string
        }
        Update: {
          created_by?: string | null
          generated_at?: string
          highlights?: Json | null
          id?: string
          metadata?: Json | null
          metrics?: Json | null
          summary?: string
        }
        Relationships: []
      }
      intelligence_geo_alerts: {
        Row: {
          id: string
          metadata: Json | null
          projects: Json | null
          recommendation: string | null
          region: string
          severity: string | null
          stage: string | null
          triggered_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          projects?: Json | null
          recommendation?: string | null
          region: string
          severity?: string | null
          stage?: string | null
          triggered_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          projects?: Json | null
          recommendation?: string | null
          region?: string
          severity?: string | null
          stage?: string | null
          triggered_at?: string
        }
        Relationships: []
      }
      intelligence_refusals: {
        Row: {
          agent: string
          created_at: string
          id: string
          metadata: Json | null
          prompt: string
          reason: string
        }
        Insert: {
          agent: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt: string
          reason: string
        }
        Update: {
          agent?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt?: string
          reason?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          contact_id: number
          created_at: string
          id: number
          interaction_date: string
          interaction_type: string
          notes: string | null
          quality_score: number | null
          updated_at: string
        }
        Insert: {
          contact_id: number
          created_at?: string
          id?: number
          interaction_date?: string
          interaction_type: string
          notes?: string | null
          quality_score?: number | null
          updated_at?: string
        }
        Update: {
          contact_id?: number
          created_at?: string
          id?: number
          interaction_date?: string
          interaction_type?: string
          notes?: string | null
          quality_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      international_invitations: {
        Row: {
          created_at: string | null
          hosting_organization: string | null
          id: string
          invitation_date: string | null
          invitation_status: string | null
          invitee_email: string | null
          invitee_name: string
          invitee_role: string | null
          program_id: string | null
          proposed_dates: string | null
          updated_at: string | null
          visit_completed: boolean | null
          visit_purpose: string | null
          visit_report: string | null
        }
        Insert: {
          created_at?: string | null
          hosting_organization?: string | null
          id?: string
          invitation_date?: string | null
          invitation_status?: string | null
          invitee_email?: string | null
          invitee_name: string
          invitee_role?: string | null
          program_id?: string | null
          proposed_dates?: string | null
          updated_at?: string | null
          visit_completed?: boolean | null
          visit_purpose?: string | null
          visit_report?: string | null
        }
        Update: {
          created_at?: string | null
          hosting_organization?: string | null
          id?: string
          invitation_date?: string | null
          invitation_status?: string | null
          invitee_email?: string | null
          invitee_name?: string
          invitee_role?: string | null
          program_id?: string | null
          proposed_dates?: string | null
          updated_at?: string | null
          visit_completed?: boolean | null
          visit_purpose?: string | null
          visit_report?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "international_invitations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "international_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      international_programs: {
        Row: {
          approach_summary: string
          australian_adaptations: string[] | null
          city_location: string | null
          collaboration_opportunities: string | null
          contact_email: string | null
          cost_benefit_ratio: string | null
          country: string
          created_at: string | null
          created_by: string | null
          description: string
          documents: Json | null
          evidence_strength:
            | Database["public"]["Enums"]["evidence_strength"]
            | null
          featured_image_url: string | null
          id: string
          key_outcomes: Json | null
          name: string
          population_served: number | null
          program_type: Database["public"]["Enums"]["program_type"][]
          recidivism_comparison: string | null
          recidivism_rate: number | null
          region: Database["public"]["Enums"]["global_region"]
          related_program_ids: string[] | null
          related_story_ids: string[] | null
          research_citations: Json | null
          scale: string | null
          slug: string
          status: string | null
          target_population: string | null
          updated_at: string | null
          visit_date: string | null
          visit_notes: string | null
          visit_status: string | null
          website_url: string | null
          year_established: number | null
        }
        Insert: {
          approach_summary: string
          australian_adaptations?: string[] | null
          city_location?: string | null
          collaboration_opportunities?: string | null
          contact_email?: string | null
          cost_benefit_ratio?: string | null
          country: string
          created_at?: string | null
          created_by?: string | null
          description: string
          documents?: Json | null
          evidence_strength?:
            | Database["public"]["Enums"]["evidence_strength"]
            | null
          featured_image_url?: string | null
          id?: string
          key_outcomes?: Json | null
          name: string
          population_served?: number | null
          program_type?: Database["public"]["Enums"]["program_type"][]
          recidivism_comparison?: string | null
          recidivism_rate?: number | null
          region: Database["public"]["Enums"]["global_region"]
          related_program_ids?: string[] | null
          related_story_ids?: string[] | null
          research_citations?: Json | null
          scale?: string | null
          slug: string
          status?: string | null
          target_population?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_notes?: string | null
          visit_status?: string | null
          website_url?: string | null
          year_established?: number | null
        }
        Update: {
          approach_summary?: string
          australian_adaptations?: string[] | null
          city_location?: string | null
          collaboration_opportunities?: string | null
          contact_email?: string | null
          cost_benefit_ratio?: string | null
          country?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          documents?: Json | null
          evidence_strength?:
            | Database["public"]["Enums"]["evidence_strength"]
            | null
          featured_image_url?: string | null
          id?: string
          key_outcomes?: Json | null
          name?: string
          population_served?: number | null
          program_type?: Database["public"]["Enums"]["program_type"][]
          recidivism_comparison?: string | null
          recidivism_rate?: number | null
          region?: Database["public"]["Enums"]["global_region"]
          related_program_ids?: string[] | null
          related_story_ids?: string[] | null
          research_citations?: Json | null
          scale?: string | null
          slug?: string
          status?: string | null
          target_population?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_notes?: string | null
          visit_status?: string | null
          website_url?: string | null
          year_established?: number | null
        }
        Relationships: []
      }
      justicehub_nodes: {
        Row: {
          contact_email: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          lead_organization_id: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          node_type: string | null
          state_code: string | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          lead_organization_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          node_type?: string | null
          state_code?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          lead_organization_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          node_type?: string | null
          state_code?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          confidence: number | null
          content: string
          created_at: string
          embedding: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          source_id: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          content: string
          created_at?: string
          embedding?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          source_id?: string | null
          source_type: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          content?: string
          created_at?: string
          embedding?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          source_id?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_extraction_queue: {
        Row: {
          confidence_score: number | null
          content_embedding: string | null
          created_at: string | null
          extracted_at: string | null
          extracted_knowledge: string | null
          extraction_model: string | null
          extraction_prompt: string | null
          id: string
          priority: number | null
          raw_content: string
          raw_title: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string
          source_metadata: Json | null
          source_type: string
          source_url: string | null
          status: string | null
          suggested_domains: string[] | null
          suggested_excerpt: string | null
          suggested_parent_ids: Json | null
          suggested_projects: string[] | null
          suggested_tags: string[] | null
          suggested_title: string | null
          suggested_type: string | null
          thread_id: string | null
          wiki_page_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          content_embedding?: string | null
          created_at?: string | null
          extracted_at?: string | null
          extracted_knowledge?: string | null
          extraction_model?: string | null
          extraction_prompt?: string | null
          id?: string
          priority?: number | null
          raw_content: string
          raw_title?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id: string
          source_metadata?: Json | null
          source_type: string
          source_url?: string | null
          status?: string | null
          suggested_domains?: string[] | null
          suggested_excerpt?: string | null
          suggested_parent_ids?: Json | null
          suggested_projects?: string[] | null
          suggested_tags?: string[] | null
          suggested_title?: string | null
          suggested_type?: string | null
          thread_id?: string | null
          wiki_page_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          content_embedding?: string | null
          created_at?: string | null
          extracted_at?: string | null
          extracted_knowledge?: string | null
          extraction_model?: string | null
          extraction_prompt?: string | null
          id?: string
          priority?: number | null
          raw_content?: string
          raw_title?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string
          source_metadata?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string | null
          suggested_domains?: string[] | null
          suggested_excerpt?: string | null
          suggested_parent_ids?: Json | null
          suggested_projects?: string[] | null
          suggested_tags?: string[] | null
          suggested_title?: string | null
          suggested_type?: string | null
          thread_id?: string | null
          wiki_page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_extraction_queue_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_extraction_queue_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_extraction_queue_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_source_sync: {
        Row: {
          config: Json | null
          consecutive_errors: number | null
          created_at: string | null
          enabled: boolean | null
          filters: Json | null
          id: string
          items_extracted_last_sync: number | null
          items_scanned_last_sync: number | null
          last_error: string | null
          last_error_at: string | null
          last_sync_at: string | null
          last_sync_cursor: string | null
          last_sync_duration_ms: number | null
          next_sync_due: string | null
          source_type: string
          status: string | null
          sync_frequency_hours: number | null
          total_items_approved: number | null
          total_items_extracted: number | null
          total_items_rejected: number | null
          total_items_scanned: number | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          consecutive_errors?: number | null
          created_at?: string | null
          enabled?: boolean | null
          filters?: Json | null
          id?: string
          items_extracted_last_sync?: number | null
          items_scanned_last_sync?: number | null
          last_error?: string | null
          last_error_at?: string | null
          last_sync_at?: string | null
          last_sync_cursor?: string | null
          last_sync_duration_ms?: number | null
          next_sync_due?: string | null
          source_type: string
          status?: string | null
          sync_frequency_hours?: number | null
          total_items_approved?: number | null
          total_items_extracted?: number | null
          total_items_rejected?: number | null
          total_items_scanned?: number | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          consecutive_errors?: number | null
          created_at?: string | null
          enabled?: boolean | null
          filters?: Json | null
          id?: string
          items_extracted_last_sync?: number | null
          items_scanned_last_sync?: number | null
          last_error?: string | null
          last_error_at?: string | null
          last_sync_at?: string | null
          last_sync_cursor?: string | null
          last_sync_duration_ms?: number | null
          next_sync_due?: string | null
          source_type?: string
          status?: string | null
          sync_frequency_hours?: number | null
          total_items_approved?: number | null
          total_items_extracted?: number | null
          total_items_rejected?: number | null
          total_items_scanned?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          author: string | null
          authority_level: number
          conflicts_with: string[] | null
          context: string | null
          created_at: string | null
          id: string
          knowledge_id: string
          limitations: string | null
          organization: string | null
          projects: string[] | null
          source_date: string | null
          source_name: string
          source_type: string
          source_url: string | null
          superseded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          author?: string | null
          authority_level: number
          conflicts_with?: string[] | null
          context?: string | null
          created_at?: string | null
          id?: string
          knowledge_id: string
          limitations?: string | null
          organization?: string | null
          projects?: string[] | null
          source_date?: string | null
          source_name: string
          source_type: string
          source_url?: string | null
          superseded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          author?: string | null
          authority_level?: number
          conflicts_with?: string[] | null
          context?: string | null
          created_at?: string | null
          id?: string
          knowledge_id?: string
          limitations?: string | null
          organization?: string | null
          projects?: string[] | null
          source_date?: string | null
          source_name?: string
          source_type?: string
          source_url?: string | null
          superseded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_versions: {
        Row: {
          active_from: string | null
          active_until: string | null
          approved_by: string | null
          changed_by: string | null
          changed_from: string | null
          content: string
          content_type: string
          created_at: string | null
          domains: string[] | null
          id: string
          knowledge_id: string
          projects: string[] | null
          reason_for_change: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
          version: number
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          approved_by?: string | null
          changed_by?: string | null
          changed_from?: string | null
          content: string
          content_type: string
          created_at?: string | null
          domains?: string[] | null
          id?: string
          knowledge_id: string
          projects?: string[] | null
          reason_for_change: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version: number
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          approved_by?: string | null
          changed_by?: string | null
          changed_from?: string | null
          content?: string
          content_type?: string
          created_at?: string | null
          domains?: string[] | null
          id?: string
          knowledge_id?: string
          projects?: string[] | null
          reason_for_change?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      learned_thresholds: {
        Row: {
          confidence: number
          created_at: string | null
          id: string
          last_learned_at: string | null
          learning_data: Json | null
          prior_strength: number
          prior_value: number
          sample_size: number
          segment: string
          threshold_type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          confidence?: number
          created_at?: string | null
          id?: string
          last_learned_at?: string | null
          learning_data?: Json | null
          prior_strength?: number
          prior_value: number
          sample_size?: number
          segment?: string
          threshold_type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          confidence?: number
          created_at?: string | null
          id?: string
          last_learned_at?: string | null
          learning_data?: Json | null
          prior_strength?: number
          prior_value?: number
          sample_size?: number
          segment?: string
          threshold_type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      linkedin_contacts: {
        Row: {
          alignment_tags: string[] | null
          bio: string | null
          connected_date: string | null
          current_company: string | null
          current_position: string | null
          data_source: string | null
          email_address: string | null
          engagement_frequency: string | null
          exa_confidence_score: number | null
          exa_enriched: boolean | null
          exa_last_enriched: string | null
          first_name: string
          full_name: string | null
          gmail_contact_id: string | null
          id: string
          imported_at: string | null
          industries: string[] | null
          influence_level: string | null
          interaction_count: number | null
          last_interaction: string | null
          last_name: string
          linkedin_url: string | null
          location: string | null
          network_reach: number | null
          notion_person_id: string | null
          person_id: string | null
          raw_data: Json | null
          relationship_score: number | null
          skills_extracted: string[] | null
          strategic_value: string | null
          updated_at: string | null
        }
        Insert: {
          alignment_tags?: string[] | null
          bio?: string | null
          connected_date?: string | null
          current_company?: string | null
          current_position?: string | null
          data_source?: string | null
          email_address?: string | null
          engagement_frequency?: string | null
          exa_confidence_score?: number | null
          exa_enriched?: boolean | null
          exa_last_enriched?: string | null
          first_name: string
          full_name?: string | null
          gmail_contact_id?: string | null
          id?: string
          imported_at?: string | null
          industries?: string[] | null
          influence_level?: string | null
          interaction_count?: number | null
          last_interaction?: string | null
          last_name: string
          linkedin_url?: string | null
          location?: string | null
          network_reach?: number | null
          notion_person_id?: string | null
          person_id?: string | null
          raw_data?: Json | null
          relationship_score?: number | null
          skills_extracted?: string[] | null
          strategic_value?: string | null
          updated_at?: string | null
        }
        Update: {
          alignment_tags?: string[] | null
          bio?: string | null
          connected_date?: string | null
          current_company?: string | null
          current_position?: string | null
          data_source?: string | null
          email_address?: string | null
          engagement_frequency?: string | null
          exa_confidence_score?: number | null
          exa_enriched?: boolean | null
          exa_last_enriched?: string | null
          first_name?: string
          full_name?: string | null
          gmail_contact_id?: string | null
          id?: string
          imported_at?: string | null
          industries?: string[] | null
          influence_level?: string | null
          interaction_count?: number | null
          last_interaction?: string | null
          last_name?: string
          linkedin_url?: string | null
          location?: string | null
          network_reach?: number | null
          notion_person_id?: string | null
          person_id?: string | null
          raw_data?: Json | null
          relationship_score?: number | null
          skills_extracted?: string[] | null
          strategic_value?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_linkedin_contacts_person"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "fk_linkedin_contacts_person"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "fk_linkedin_contacts_person"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "fk_linkedin_contacts_person"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "fk_linkedin_contacts_person"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      linkedin_imports: {
        Row: {
          hash: string
          id: number
          imported_at: string | null
          owner: string
          payload: Json
          type: string
        }
        Insert: {
          hash: string
          id?: number
          imported_at?: string | null
          owner: string
          payload: Json
          type: string
        }
        Update: {
          hash?: string
          id?: number
          imported_at?: string | null
          owner?: string
          payload?: Json
          type?: string
        }
        Relationships: []
      }
      linkedin_project_connections: {
        Row: {
          connection_type: string | null
          contact_id: string | null
          contact_status: string | null
          created_at: string | null
          id: string
          notion_project_id: string | null
          potential_role: string | null
          project_name: string
          recommended_action: string | null
          relevance_score: number | null
          updated_at: string | null
        }
        Insert: {
          connection_type?: string | null
          contact_id?: string | null
          contact_status?: string | null
          created_at?: string | null
          id?: string
          notion_project_id?: string | null
          potential_role?: string | null
          project_name: string
          recommended_action?: string | null
          relevance_score?: number | null
          updated_at?: string | null
        }
        Update: {
          connection_type?: string | null
          contact_id?: string | null
          contact_status?: string | null
          created_at?: string | null
          id?: string
          notion_project_id?: string | null
          potential_role?: string | null
          project_name?: string
          recommended_action?: string | null
          relevance_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_project_connections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_project_connections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["linkedin_contact_id"]
          },
        ]
      }
      locations: {
        Row: {
          city: string | null
          coordinates: Json | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          state_province: string | null
        }
        Insert: {
          city?: string | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          state_province?: string | null
        }
        Update: {
          city?: string | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          state_province?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          category: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          metadata: Json | null
          mime_type: string | null
          tags: string[] | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      media_collections: {
        Row: {
          cover_image_id: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          name: string
          organization_id: string | null
          project_id: string | null
          public_visible: boolean | null
          settings: Json | null
          sort_order: number | null
          story_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          cover_image_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          name: string
          organization_id?: string | null
          project_id?: string | null
          public_visible?: boolean | null
          settings?: Json | null
          sort_order?: number | null
          story_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          cover_image_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          name?: string
          organization_id?: string | null
          project_id?: string | null
          public_visible?: boolean | null
          settings?: Json | null
          sort_order?: number | null
          story_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      media_files: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          file_hash: string | null
          file_size_bytes: number
          filename: string
          id: string
          media_type: string | null
          mime_type: string
          organization_id: string | null
          original_filename: string
          processing_status: string | null
          public_url: string | null
          storage_bucket: string
          storage_path: string
          story_id: string | null
          storyteller_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          uploaded_by: string | null
          visibility: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_hash?: string | null
          file_size_bytes: number
          filename: string
          id?: string
          media_type?: string | null
          mime_type: string
          organization_id?: string | null
          original_filename: string
          processing_status?: string | null
          public_url?: string | null
          storage_bucket: string
          storage_path: string
          story_id?: string | null
          storyteller_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          visibility?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_hash?: string | null
          file_size_bytes?: number
          filename?: string
          id?: string
          media_type?: string | null
          mime_type?: string
          organization_id?: string | null
          original_filename?: string
          processing_status?: string | null
          public_url?: string | null
          storage_bucket?: string
          storage_path?: string
          story_id?: string | null
          storyteller_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_item: {
        Row: {
          attribution_text: string | null
          consent_level: string | null
          created_at: string | null
          creator_name: string | null
          creator_profile_id: string | null
          description: string | null
          duration: string | null
          file_size_bytes: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          media_type: string
          media_url: string
          mime_type: string | null
          organization_id: string | null
          organization_name: string | null
          program_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          attribution_text?: string | null
          consent_level?: string | null
          created_at?: string | null
          creator_name?: string | null
          creator_profile_id?: string | null
          description?: string | null
          duration?: string | null
          file_size_bytes?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_type: string
          media_url: string
          mime_type?: string | null
          organization_id?: string | null
          organization_name?: string | null
          program_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          attribution_text?: string | null
          consent_level?: string | null
          created_at?: string | null
          creator_name?: string | null
          creator_profile_id?: string | null
          description?: string | null
          duration?: string | null
          file_size_bytes?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_type?: string
          media_url?: string
          mime_type?: string | null
          organization_id?: string | null
          organization_name?: string | null
          program_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      media_items: {
        Row: {
          ai_confidence: number | null
          ai_processed: boolean | null
          ai_tags: string[] | null
          alt_text: string | null
          attribution_required: boolean | null
          blurhash: string | null
          caption: string | null
          capture_date: string | null
          community_approved: boolean | null
          compressed_url: string | null
          consent_verified: boolean | null
          created_at: string | null
          created_by: string | null
          credit: string | null
          description: string | null
          dimensions: Json | null
          emotional_tone: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          impact_themes: string[] | null
          is_hero_image: boolean | null
          location_data: Json | null
          manual_tags: string[] | null
          organization_ids: string[] | null
          photographer: string | null
          processed: boolean | null
          project_ids: string[] | null
          project_slugs: string[] | null
          source: string | null
          source_id: string | null
          story_ids: string[] | null
          storyteller_ids: string[] | null
          thumbnail_url: string | null
          timeline_entry_id: string | null
          title: string | null
          updated_at: string | null
          usage_rights: string | null
          year_in_review_year: number | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_processed?: boolean | null
          ai_tags?: string[] | null
          alt_text?: string | null
          attribution_required?: boolean | null
          blurhash?: string | null
          caption?: string | null
          capture_date?: string | null
          community_approved?: boolean | null
          compressed_url?: string | null
          consent_verified?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credit?: string | null
          description?: string | null
          dimensions?: Json | null
          emotional_tone?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          impact_themes?: string[] | null
          is_hero_image?: boolean | null
          location_data?: Json | null
          manual_tags?: string[] | null
          organization_ids?: string[] | null
          photographer?: string | null
          processed?: boolean | null
          project_ids?: string[] | null
          project_slugs?: string[] | null
          source?: string | null
          source_id?: string | null
          story_ids?: string[] | null
          storyteller_ids?: string[] | null
          thumbnail_url?: string | null
          timeline_entry_id?: string | null
          title?: string | null
          updated_at?: string | null
          usage_rights?: string | null
          year_in_review_year?: number | null
        }
        Update: {
          ai_confidence?: number | null
          ai_processed?: boolean | null
          ai_tags?: string[] | null
          alt_text?: string | null
          attribution_required?: boolean | null
          blurhash?: string | null
          caption?: string | null
          capture_date?: string | null
          community_approved?: boolean | null
          compressed_url?: string | null
          consent_verified?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credit?: string | null
          description?: string | null
          dimensions?: Json | null
          emotional_tone?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          impact_themes?: string[] | null
          is_hero_image?: boolean | null
          location_data?: Json | null
          manual_tags?: string[] | null
          organization_ids?: string[] | null
          photographer?: string | null
          processed?: boolean | null
          project_ids?: string[] | null
          project_slugs?: string[] | null
          source?: string | null
          source_id?: string | null
          story_ids?: string[] | null
          storyteller_ids?: string[] | null
          thumbnail_url?: string | null
          timeline_entry_id?: string | null
          title?: string | null
          updated_at?: string | null
          usage_rights?: string | null
          year_in_review_year?: number | null
        }
        Relationships: []
      }
      media_library: {
        Row: {
          alt_text: string | null
          blurhash: string | null
          caption: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          folder: string | null
          height: number | null
          id: string
          last_used_at: string | null
          mime_type: string
          original_name: string | null
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string | null
          used_in_posts: number | null
          versions: Json | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          blurhash?: string | null
          caption?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          folder?: string | null
          height?: number | null
          id?: string
          last_used_at?: string | null
          mime_type: string
          original_name?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          used_in_posts?: number | null
          versions?: Json | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          blurhash?: string | null
          caption?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          folder?: string | null
          height?: number | null
          id?: string
          last_used_at?: string | null
          mime_type?: string
          original_name?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          used_in_posts?: number | null
          versions?: Json | null
          width?: number | null
        }
        Relationships: []
      }
      media_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          media_id: string | null
          result_data: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          media_id?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          media_id?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_processing_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_processing_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "public_media_with_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      media_usage: {
        Row: {
          created_at: string | null
          id: string
          media_id: string | null
          usage_context: string | null
          used_in_id: string | null
          used_in_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id?: string | null
          usage_context?: string | null
          used_in_id?: string | null
          used_in_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string | null
          usage_context?: string | null
          used_in_id?: string | null
          used_in_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_usage_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_usage_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "public_media_with_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          portrait_id: string
          read: boolean
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          portrait_id: string
          read?: boolean
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          portrait_id?: string
          read?: boolean
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_portrait_id_fkey"
            columns: ["portrait_id"]
            isOneToOne: false
            referencedRelation: "portraits"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          brand_score: number | null
          brand_tests_active: number | null
          content_items: number | null
          created_at: string | null
          id: string
          last_updated: string | null
          stories_analyzed: number | null
          user_id: string | null
        }
        Insert: {
          brand_score?: number | null
          brand_tests_active?: number | null
          content_items?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          stories_analyzed?: number | null
          user_id?: string | null
        }
        Update: {
          brand_score?: number | null
          brand_tests_active?: number | null
          content_items?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          stories_analyzed?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      migration_email_templates: {
        Row: {
          body_template: string
          created_at: string | null
          id: string
          is_default: boolean | null
          subject_template: string
          template_name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          body_template: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          subject_template: string
          template_name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          body_template?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          subject_template?: string
          template_name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      migration_rate_limits: {
        Row: {
          created_at: string | null
          daily_limit: number | null
          date: string
          emails_queued: number | null
          emails_sent: number | null
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_limit?: number | null
          date?: string
          emails_queued?: number | null
          emails_sent?: number | null
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_limit?: number | null
          date?: string
          emails_queued?: number | null
          emails_sent?: number | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          metadata: Json | null
          name: string | null
          status: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          full_name: string | null
          ghl_contact_id: string | null
          id: string
          is_active: boolean | null
          organization: string | null
          source: string | null
          subscribed_at: string | null
          subscription_type: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          full_name?: string | null
          ghl_contact_id?: string | null
          id?: string
          is_active?: boolean | null
          organization?: string | null
          source?: string | null
          subscribed_at?: string | null
          subscription_type?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          ghl_contact_id?: string | null
          id?: string
          is_active?: boolean | null
          organization?: string | null
          source?: string | null
          subscribed_at?: string | null
          subscription_type?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      normalized_documents: {
        Row: {
          content: string
          created_at: string | null
          id: string
          source_id: string | null
          source_type: string
          title: string | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          title?: string | null
        }
        Relationships: []
      }
      normalized_stories: {
        Row: {
          content: string
          created_at: string | null
          id: string
          source_id: string | null
          title: string
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          source_id?: string | null
          title?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          source_id?: string | null
          title?: string
        }
        Relationships: []
      }
      normalized_storytellers: {
        Row: {
          bio: string | null
          created_at: string | null
          full_name: string
          id: string
          source_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          source_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          source_id?: string | null
        }
        Relationships: []
      }
      notion_opportunities: {
        Row: {
          amount: number | null
          close_date: string | null
          created_at: string | null
          data: Json
          id: string
          last_synced: string | null
          metadata: Json | null
          name: string | null
          notion_id: string | null
          probability: number | null
          stage: string | null
          sync_version: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          close_date?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          last_synced?: string | null
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          probability?: number | null
          stage?: string | null
          sync_version?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          close_date?: string | null
          created_at?: string | null
          data?: Json
          id?: string
          last_synced?: string | null
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          probability?: number | null
          stage?: string | null
          sync_version?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notion_organization_people: {
        Row: {
          created_at: string | null
          id: string
          notion_organizations_id: string | null
          notion_people_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notion_organizations_id?: string | null
          notion_people_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notion_organizations_id?: string | null
          notion_people_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notion_organization_people_notion_organizations_id_fkey"
            columns: ["notion_organizations_id"]
            isOneToOne: false
            referencedRelation: "notion_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notion_organization_people_notion_people_id_fkey"
            columns: ["notion_people_id"]
            isOneToOne: false
            referencedRelation: "notion_people"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_organizations: {
        Row: {
          created_at: string | null
          data: Json
          description: string | null
          id: string
          industry: string | null
          last_synced: string | null
          metadata: Json | null
          name: string | null
          notion_id: string | null
          sync_version: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          description?: string | null
          id?: string
          industry?: string | null
          last_synced?: string | null
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          sync_version?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          description?: string | null
          id?: string
          industry?: string | null
          last_synced?: string | null
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          sync_version?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notion_people: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string | null
          notion_id: string | null
          organization: string | null
          role: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          organization?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          organization?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notion_project_organizations: {
        Row: {
          created_at: string | null
          id: string
          notion_organizations_id: string | null
          notion_project_id: string | null
          relationship: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notion_organizations_id?: string | null
          notion_project_id?: string | null
          relationship?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notion_organizations_id?: string | null
          notion_project_id?: string | null
          relationship?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notion_project_organizations_notion_organizations_id_fkey"
            columns: ["notion_organizations_id"]
            isOneToOne: false
            referencedRelation: "notion_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notion_project_organizations_notion_project_id_fkey"
            columns: ["notion_project_id"]
            isOneToOne: false
            referencedRelation: "notion_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_project_people: {
        Row: {
          created_at: string | null
          id: string
          notion_people_id: string | null
          notion_project_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notion_people_id?: string | null
          notion_project_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notion_people_id?: string | null
          notion_project_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notion_project_people_notion_people_id_fkey"
            columns: ["notion_people_id"]
            isOneToOne: false
            referencedRelation: "notion_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notion_project_people_notion_project_id_fkey"
            columns: ["notion_project_id"]
            isOneToOne: false
            referencedRelation: "notion_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_projects: {
        Row: {
          actual_cost: number | null
          assignee: string | null
          budget: number | null
          created_at: string | null
          data: Json
          description: string | null
          end_date: string | null
          id: string
          last_synced: string | null
          metadata: Json | null
          name: string | null
          notion_id: string | null
          priority: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          sync_version: number | null
          tags: string[] | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          assignee?: string | null
          budget?: number | null
          created_at?: string | null
          data?: Json
          description?: string | null
          end_date?: string | null
          id?: string
          last_synced?: string | null
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          sync_version?: number | null
          tags?: string[] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          assignee?: string | null
          budget?: number | null
          created_at?: string | null
          data?: Json
          description?: string | null
          end_date?: string | null
          id?: string
          last_synced?: string | null
          metadata?: Json | null
          name?: string | null
          notion_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          sync_version?: number | null
          tags?: string[] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notion_projects_cache: {
        Row: {
          alma_intervention_id: string | null
          created_at: string | null
          description: string | null
          last_synced_at: string | null
          location: string | null
          notion_project_id: string
          project_name: string
          project_source: string | null
          raw_data: Json | null
          required_expertise: string[] | null
          status: string | null
          tags: string[] | null
        }
        Insert: {
          alma_intervention_id?: string | null
          created_at?: string | null
          description?: string | null
          last_synced_at?: string | null
          location?: string | null
          notion_project_id: string
          project_name: string
          project_source?: string | null
          raw_data?: Json | null
          required_expertise?: string[] | null
          status?: string | null
          tags?: string[] | null
        }
        Update: {
          alma_intervention_id?: string | null
          created_at?: string | null
          description?: string | null
          last_synced_at?: string | null
          location?: string | null
          notion_project_id?: string
          project_name?: string
          project_source?: string | null
          raw_data?: Json | null
          required_expertise?: string[] | null
          status?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          alignment_score: number | null
          archived: boolean | null
          brief: string
          brief_embedding: string | null
          created_at: string
          deadline: string | null
          id: number
          region_tags: string[] | null
          role_tags: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alignment_score?: number | null
          archived?: boolean | null
          brief: string
          brief_embedding?: string | null
          created_at?: string
          deadline?: string | null
          id?: number
          region_tags?: string[] | null
          role_tags?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alignment_score?: number | null
          archived?: boolean | null
          brief?: string
          brief_embedding?: string | null
          created_at?: string
          deadline?: string | null
          id?: number
          region_tags?: string[] | null
          role_tags?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_connections: {
        Row: {
          created_at: string | null
          id: string
          mentioned_in_story: string | null
          mentioned_in_transcript: string | null
          organization_id: string | null
          relationship_context: string | null
          relationship_type: string
          storyteller_id: string | null
          updated_at: string | null
          verification_source: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_in_story?: string | null
          mentioned_in_transcript?: string | null
          organization_id?: string | null
          relationship_context?: string | null
          relationship_type: string
          storyteller_id?: string | null
          updated_at?: string | null
          verification_source?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_in_story?: string | null
          mentioned_in_transcript?: string | null
          organization_id?: string | null
          relationship_context?: string | null
          relationship_type?: string
          storyteller_id?: string | null
          updated_at?: string | null
          verification_source?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_connections_mentioned_in_transcript_fkey"
            columns: ["mentioned_in_transcript"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_connections_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_enrichment: {
        Row: {
          active: boolean | null
          confidence_score: number
          created_at: string | null
          data: Json
          enrichment_type: string
          id: string
          organization_id: string | null
          source_metadata: Json | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          validation_status: string | null
        }
        Insert: {
          active?: boolean | null
          confidence_score: number
          created_at?: string | null
          data: Json
          enrichment_type: string
          id?: string
          organization_id?: string | null
          source_metadata?: Json | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
        }
        Update: {
          active?: boolean | null
          confidence_score?: number
          created_at?: string | null
          data?: Json
          enrichment_type?: string
          id?: string
          organization_id?: string | null
          source_metadata?: Json | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_enrichment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          joined_at: string | null
          last_active_at: string | null
          organization_id: string
          permissions: string[] | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          last_active_at?: string | null
          organization_id: string
          permissions?: string[] | null
          role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          last_active_at?: string | null
          organization_id?: string
          permissions?: string[] | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sync_log: {
        Row: {
          empathy_ledger_org_id: string | null
          error_message: string | null
          id: string
          organization_id: string | null
          sync_action: string
          sync_details: Json | null
          sync_status: string
          synced_at: string | null
        }
        Insert: {
          empathy_ledger_org_id?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          sync_action: string
          sync_details?: Json | null
          sync_status: string
          synced_at?: string | null
        }
        Update: {
          empathy_ledger_org_id?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          sync_action?: string
          sync_details?: Json | null
          sync_status?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived: boolean
          city: string | null
          collaboration_areas: string[] | null
          contact_email: string | null
          created_at: string | null
          description: string | null
          email: string | null
          empathy_ledger_org_id: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          latitude: number | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          postcode: string | null
          settings: Json | null
          slug: string | null
          state: string | null
          street_address: string | null
          suburb: string | null
          synced_from_empathy_ledger: boolean | null
          tags: string[] | null
          type: string | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          archived?: boolean
          city?: string | null
          collaboration_areas?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          empathy_ledger_org_id?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          postcode?: string | null
          settings?: Json | null
          slug?: string | null
          state?: string | null
          street_address?: string | null
          suburb?: string | null
          synced_from_empathy_ledger?: boolean | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          archived?: boolean
          city?: string | null
          collaboration_areas?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          empathy_ledger_org_id?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postcode?: string | null
          settings?: Json | null
          slug?: string | null
          state?: string | null
          street_address?: string | null
          suburb?: string | null
          synced_from_empathy_ledger?: boolean | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      organizations_profiles: {
        Row: {
          created_at: string | null
          display_order: number | null
          end_date: string | null
          id: string
          is_current: boolean | null
          is_featured: boolean | null
          organization_id: string
          public_profile_id: string
          role: string | null
          role_description: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          is_featured?: boolean | null
          organization_id: string
          public_profile_id: string
          role?: string | null
          role_description?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          is_featured?: boolean | null
          organization_id?: string
          public_profile_id?: string
          role?: string | null
          role_description?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_strategies: {
        Row: {
          best_topics: string[] | null
          contact_id: string
          created_at: string | null
          email_template: string | null
          follow_up_sequence: string[] | null
          id: string
          mutual_connections: Json | null
          recommended_approach: string | null
          strategy: Json
          success_probability: number | null
          timing: string | null
          updated_at: string | null
          value_proposition: string | null
        }
        Insert: {
          best_topics?: string[] | null
          contact_id: string
          created_at?: string | null
          email_template?: string | null
          follow_up_sequence?: string[] | null
          id?: string
          mutual_connections?: Json | null
          recommended_approach?: string | null
          strategy?: Json
          success_probability?: number | null
          timing?: string | null
          updated_at?: string | null
          value_proposition?: string | null
        }
        Update: {
          best_topics?: string[] | null
          contact_id?: string
          created_at?: string | null
          email_template?: string | null
          follow_up_sequence?: string[] | null
          id?: string
          mutual_connections?: Json | null
          recommended_approach?: string | null
          strategy?: Json
          success_probability?: number | null
          timing?: string | null
          updated_at?: string | null
          value_proposition?: string | null
        }
        Relationships: []
      }
      outreach_tasks: {
        Row: {
          ai_brief: Json | null
          completed_at: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          draft_message: string | null
          id: string
          message_metadata: Json | null
          owner: string | null
          priority: string | null
          project_id: string | null
          project_name: string | null
          recommended_channel: string | null
          response_notes: string | null
          response_status: string | null
          scheduled_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_brief?: Json | null
          completed_at?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          draft_message?: string | null
          id?: string
          message_metadata?: Json | null
          owner?: string | null
          priority?: string | null
          project_id?: string | null
          project_name?: string | null
          recommended_channel?: string | null
          response_notes?: string | null
          response_status?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_brief?: Json | null
          completed_at?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          draft_message?: string | null
          id?: string
          message_metadata?: Json | null
          owner?: string | null
          priority?: string | null
          project_id?: string | null
          project_name?: string | null
          recommended_channel?: string | null
          response_notes?: string | null
          response_status?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          meta_description: string | null
          metadata: Json | null
          published: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          meta_description?: string | null
          metadata?: Json | null
          published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          meta_description?: string | null
          metadata?: Json | null
          published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_contacts: {
        Row: {
          contact_type: string
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_primary: boolean | null
          label: string
          organization_id: string
          value: string
        }
        Insert: {
          contact_type: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_primary?: boolean | null
          label: string
          organization_id: string
          value: string
        }
        Update: {
          contact_type?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string
          organization_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_external_links: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          link_type: string
          organization_id: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          link_type: string
          organization_id: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          link_type?: string
          organization_id?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_external_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_goals: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          goal_type: string
          icon: string | null
          id: string
          is_featured: boolean | null
          organization_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          goal_type: string
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          organization_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          goal_type?: string
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_impact_metrics: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_featured: boolean | null
          metric_context: string | null
          metric_name: string
          metric_value: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          metric_context?: string | null
          metric_name: string
          metric_value: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          metric_context?: string | null
          metric_name?: string
          metric_value?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_impact_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_photos: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          location_name: string | null
          metadata: Json | null
          node_id: string | null
          organization_id: string
          photo_type: string | null
          photo_url: string
          photographer: string | null
          taken_at: string | null
          thumbnail_url: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          location_name?: string | null
          metadata?: Json | null
          node_id?: string | null
          organization_id: string
          photo_type?: string | null
          photo_url: string
          photographer?: string | null
          taken_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          location_name?: string | null
          metadata?: Json | null
          node_id?: string | null
          organization_id?: string
          photo_type?: string | null
          photo_url?: string
          photographer?: string | null
          taken_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_photos_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "justicehub_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_site_locations: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          interactive_map_url: string | null
          location_type: string | null
          name: string
          organization_id: string
          photo_url: string | null
          status: string | null
          x_percent: number | null
          y_percent: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          interactive_map_url?: string | null
          location_type?: string | null
          name: string
          organization_id: string
          photo_url?: string | null
          status?: string | null
          x_percent?: number | null
          y_percent?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          interactive_map_url?: string | null
          location_type?: string | null
          name?: string
          organization_id?: string
          photo_url?: string | null
          status?: string | null
          x_percent?: number | null
          y_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_site_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_stories: {
        Row: {
          consent_level: string | null
          display_order: number | null
          empathy_ledger_story_id: string | null
          excerpt: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          linked_at: string | null
          node_id: string | null
          organization_id: string
          quote: string | null
          story_type: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          consent_level?: string | null
          display_order?: number | null
          empathy_ledger_story_id?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          linked_at?: string | null
          node_id?: string | null
          organization_id: string
          quote?: string | null
          story_type?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          consent_level?: string | null
          display_order?: number | null
          empathy_ledger_story_id?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          linked_at?: string | null
          node_id?: string | null
          organization_id?: string
          quote?: string | null
          story_type?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_stories_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "justicehub_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_stories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_storytellers: {
        Row: {
          avatar_url: string | null
          bio_excerpt: string | null
          consent_level: string | null
          display_name: string
          display_order: number | null
          empathy_ledger_profile_id: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          linked_at: string | null
          node_id: string | null
          organization_id: string
          quote: string | null
          role: string | null
          role_at_org: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio_excerpt?: string | null
          consent_level?: string | null
          display_name: string
          display_order?: number | null
          empathy_ledger_profile_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          linked_at?: string | null
          node_id?: string | null
          organization_id: string
          quote?: string | null
          role?: string | null
          role_at_org?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio_excerpt?: string | null
          consent_level?: string | null
          display_name?: string
          display_order?: number | null
          empathy_ledger_profile_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          linked_at?: string | null
          node_id?: string | null
          organization_id?: string
          quote?: string | null
          role?: string | null
          role_at_org?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_storytellers_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "justicehub_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_storytellers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          node_id: string | null
          organization_id: string
          platform: string | null
          published_at: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_id: string | null
          video_placement: string | null
          video_type: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          node_id?: string | null
          organization_id: string
          platform?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_id?: string | null
          video_placement?: string | null
          video_type?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          node_id?: string | null
          organization_id?: string
          platform?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_id?: string | null
          video_placement?: string | null
          video_type?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_videos_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "justicehub_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_videos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          category: string | null
          collaboration_focus: string | null
          created_at: string | null
          description: string | null
          empathy_ledger_org_id: string | null
          featured: boolean | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          partnership_since: string | null
          public_visible: boolean | null
          relationship_strength: string | null
          type: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          category?: string | null
          collaboration_focus?: string | null
          created_at?: string | null
          description?: string | null
          empathy_ledger_org_id?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          partnership_since?: string | null
          public_visible?: boolean | null
          relationship_strength?: string | null
          type: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string | null
          collaboration_focus?: string | null
          created_at?: string | null
          description?: string | null
          empathy_ledger_org_id?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          partnership_since?: string | null
          public_visible?: boolean | null
          relationship_strength?: string | null
          type?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      person_identity_map: {
        Row: {
          alignment_tags: string[] | null
          collaboration_potential: number | null
          contact_data: Json | null
          created_at: string | null
          current_company: string | null
          current_position: string | null
          data_quality_score: number | null
          data_source: string | null
          data_sources: string[] | null
          discovered_via: string | null
          email: string | null
          engagement_priority: string | null
          exa_enriched: boolean | null
          exa_enriched_at: string | null
          exa_enrichment_confidence: number | null
          exa_last_refresh_at: string | null
          exa_refresh_needed: boolean | null
          external_ids: Json | null
          full_name: string | null
          funding_capacity: string | null
          ghl_contact_id: string | null
          gmail_id: string | null
          government_influence: number | null
          indigenous_affiliation: boolean | null
          last_communication_at: string | null
          last_verified_at: string | null
          linkedin_contact_id: string | null
          needs_cleanup: boolean | null
          notion_id: string | null
          notion_person_id: string | null
          person_id: string
          sector: string | null
          tags: string[] | null
          total_emails_received: number | null
          total_emails_sent: number | null
          updated_at: string | null
          youth_justice_relevance_score: number | null
        }
        Insert: {
          alignment_tags?: string[] | null
          collaboration_potential?: number | null
          contact_data?: Json | null
          created_at?: string | null
          current_company?: string | null
          current_position?: string | null
          data_quality_score?: number | null
          data_source?: string | null
          data_sources?: string[] | null
          discovered_via?: string | null
          email?: string | null
          engagement_priority?: string | null
          exa_enriched?: boolean | null
          exa_enriched_at?: string | null
          exa_enrichment_confidence?: number | null
          exa_last_refresh_at?: string | null
          exa_refresh_needed?: boolean | null
          external_ids?: Json | null
          full_name?: string | null
          funding_capacity?: string | null
          ghl_contact_id?: string | null
          gmail_id?: string | null
          government_influence?: number | null
          indigenous_affiliation?: boolean | null
          last_communication_at?: string | null
          last_verified_at?: string | null
          linkedin_contact_id?: string | null
          needs_cleanup?: boolean | null
          notion_id?: string | null
          notion_person_id?: string | null
          person_id?: string
          sector?: string | null
          tags?: string[] | null
          total_emails_received?: number | null
          total_emails_sent?: number | null
          updated_at?: string | null
          youth_justice_relevance_score?: number | null
        }
        Update: {
          alignment_tags?: string[] | null
          collaboration_potential?: number | null
          contact_data?: Json | null
          created_at?: string | null
          current_company?: string | null
          current_position?: string | null
          data_quality_score?: number | null
          data_source?: string | null
          data_sources?: string[] | null
          discovered_via?: string | null
          email?: string | null
          engagement_priority?: string | null
          exa_enriched?: boolean | null
          exa_enriched_at?: string | null
          exa_enrichment_confidence?: number | null
          exa_last_refresh_at?: string | null
          exa_refresh_needed?: boolean | null
          external_ids?: Json | null
          full_name?: string | null
          funding_capacity?: string | null
          ghl_contact_id?: string | null
          gmail_id?: string | null
          government_influence?: number | null
          indigenous_affiliation?: boolean | null
          last_communication_at?: string | null
          last_verified_at?: string | null
          linkedin_contact_id?: string | null
          needs_cleanup?: boolean | null
          notion_id?: string | null
          notion_person_id?: string | null
          person_id?: string
          sector?: string | null
          tags?: string[] | null
          total_emails_received?: number | null
          total_emails_sent?: number | null
          updated_at?: string | null
          youth_justice_relevance_score?: number | null
        }
        Relationships: []
      }
      photo_album_photos: {
        Row: {
          added_at: string | null
          album_id: string
          id: string
          photo_id: string
          sort_order: number | null
        }
        Insert: {
          added_at?: string | null
          album_id: string
          id?: string
          photo_id: string
          sort_order?: number | null
        }
        Update: {
          added_at?: string | null
          album_id?: string
          id?: string
          photo_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_album_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_album_photos_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_album_shares: {
        Row: {
          access_count: number | null
          album_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed: string | null
          recipient_info: Json | null
          share_method: string
          share_url: string | null
        }
        Insert: {
          access_count?: number | null
          album_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          recipient_info?: Json | null
          share_method: string
          share_url?: string | null
        }
        Update: {
          access_count?: number | null
          album_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          recipient_info?: Json | null
          share_method?: string
          share_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_album_shares_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_albums: {
        Row: {
          cover_photo_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_shareable: boolean | null
          metadata: Json | null
          slug: string
          storyteller_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_photo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_shareable?: boolean | null
          metadata?: Json | null
          slug: string
          storyteller_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_photo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_shareable?: boolean | null
          metadata?: Json | null
          slug?: string
          storyteller_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_albums_cover_photo_id_fkey"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_albums_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_storyteller_tags: {
        Row: {
          confidence: number | null
          created_at: string | null
          detection_method: string | null
          face_coordinates: Json | null
          id: string
          photo_id: string
          storyteller_id: string
          tagged_by: string | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          detection_method?: string | null
          face_coordinates?: Json | null
          id?: string
          photo_id: string
          storyteller_id: string
          tagged_by?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          detection_method?: string | null
          face_coordinates?: Json | null
          id?: string
          photo_id?: string
          storyteller_id?: string
          tagged_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_storyteller_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_storyteller_tags_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string | null
          dimensions: Json | null
          file_size: number
          filename: string
          id: string
          metadata: Json | null
          updated_at: string | null
          upload_date: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          file_size: number
          filename: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          file_size?: number
          filename?: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          url?: string
        }
        Relationships: []
      }
      platform_collection_media: {
        Row: {
          auto_added: boolean | null
          auto_score: number | null
          caption: string | null
          collection_id: string
          created_at: string | null
          featured_in_collection: boolean | null
          media_id: string
          sort_order: number | null
        }
        Insert: {
          auto_added?: boolean | null
          auto_score?: number | null
          caption?: string | null
          collection_id: string
          created_at?: string | null
          featured_in_collection?: boolean | null
          media_id: string
          sort_order?: number | null
        }
        Update: {
          auto_added?: boolean | null
          auto_score?: number | null
          caption?: string | null
          collection_id?: string
          created_at?: string | null
          featured_in_collection?: boolean | null
          media_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_collection_media_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "platform_media_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_collection_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "platform_media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_collection_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "platform_public_media_with_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_media_collections: {
        Row: {
          auto_generated: boolean | null
          auto_refresh: boolean | null
          cover_image_id: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          generation_criteria: Json | null
          id: string
          name: string
          platform_organization_id: string | null
          project_id: string | null
          public_visible: boolean | null
          settings: Json | null
          sort_order: number | null
          story_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          auto_generated?: boolean | null
          auto_refresh?: boolean | null
          cover_image_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          generation_criteria?: Json | null
          id?: string
          name: string
          platform_organization_id?: string | null
          project_id?: string | null
          public_visible?: boolean | null
          settings?: Json | null
          sort_order?: number | null
          story_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_generated?: boolean | null
          auto_refresh?: boolean | null
          cover_image_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          generation_criteria?: Json | null
          id?: string
          name?: string
          platform_organization_id?: string | null
          project_id?: string | null
          public_visible?: boolean | null
          settings?: Json | null
          sort_order?: number | null
          story_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_media_collections_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "platform_media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_collections_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "platform_public_media_with_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_collections_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organization_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_collections_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_media_items: {
        Row: {
          ai_confidence: number | null
          ai_processed: boolean | null
          ai_tags: string[] | null
          attribution_required: boolean | null
          bucket_name: string | null
          capture_date: string | null
          community_approved: boolean | null
          consent_verified: boolean | null
          content_category: string | null
          content_subcategory: string | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          emotional_tone: string | null
          empathy_ledger_media_id: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          impact_themes: string[] | null
          location_data: Json | null
          manual_tags: string[] | null
          mime_type: string | null
          original_filename: string | null
          photographer: string | null
          platform_organization_id: string | null
          processed: boolean | null
          project_ids: string[] | null
          storage_path: string
          story_ids: string[] | null
          storyteller_ids: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          usage_rights: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_processed?: boolean | null
          ai_tags?: string[] | null
          attribution_required?: boolean | null
          bucket_name?: string | null
          capture_date?: string | null
          community_approved?: boolean | null
          consent_verified?: boolean | null
          content_category?: string | null
          content_subcategory?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          emotional_tone?: string | null
          empathy_ledger_media_id?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          impact_themes?: string[] | null
          location_data?: Json | null
          manual_tags?: string[] | null
          mime_type?: string | null
          original_filename?: string | null
          photographer?: string | null
          platform_organization_id?: string | null
          processed?: boolean | null
          project_ids?: string[] | null
          storage_path: string
          story_ids?: string[] | null
          storyteller_ids?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          usage_rights?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_processed?: boolean | null
          ai_tags?: string[] | null
          attribution_required?: boolean | null
          bucket_name?: string | null
          capture_date?: string | null
          community_approved?: boolean | null
          consent_verified?: boolean | null
          content_category?: string | null
          content_subcategory?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          emotional_tone?: string | null
          empathy_ledger_media_id?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          impact_themes?: string[] | null
          location_data?: Json | null
          manual_tags?: string[] | null
          mime_type?: string | null
          original_filename?: string | null
          photographer?: string | null
          platform_organization_id?: string | null
          processed?: boolean | null
          project_ids?: string[] | null
          storage_path?: string
          story_ids?: string[] | null
          storyteller_ids?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          usage_rights?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_media_items_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organization_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_items_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_media_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          media_id: string | null
          platform_organization_id: string | null
          processing_duration_ms: number | null
          result_data: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          media_id?: string | null
          platform_organization_id?: string | null
          processing_duration_ms?: number | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          media_id?: string | null
          platform_organization_id?: string | null
          processing_duration_ms?: number | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_media_processing_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "platform_media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_processing_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "platform_public_media_with_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_processing_jobs_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organization_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_processing_jobs_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_media_usage: {
        Row: {
          created_at: string | null
          download_count: number | null
          id: string
          media_id: string | null
          platform_organization_id: string | null
          share_count: number | null
          usage_context: string | null
          used_in_id: string | null
          used_in_type: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          id?: string
          media_id?: string | null
          platform_organization_id?: string | null
          share_count?: number | null
          usage_context?: string | null
          used_in_id?: string | null
          used_in_type: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          id?: string
          media_id?: string | null
          platform_organization_id?: string | null
          share_count?: number | null
          usage_context?: string | null
          used_in_id?: string | null
          used_in_type?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_media_usage_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "platform_media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_usage_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "platform_public_media_with_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_usage_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organization_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_usage_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_organizations: {
        Row: {
          api_calls_this_month: number | null
          billing_email: string | null
          created_at: string | null
          domain: string | null
          first_upload_at: string | null
          id: string
          last_activity_at: string | null
          name: string
          primary_contact_email: string | null
          slug: string
          storage_prefix: string
          storage_quota_gb: number | null
          storage_used_gb: number | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          api_calls_this_month?: number | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          first_upload_at?: string | null
          id?: string
          last_activity_at?: string | null
          name: string
          primary_contact_email?: string | null
          slug: string
          storage_prefix: string
          storage_quota_gb?: number | null
          storage_used_gb?: number | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          api_calls_this_month?: number | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          first_upload_at?: string | null
          id?: string
          last_activity_at?: string | null
          name?: string
          primary_contact_email?: string | null
          slug?: string
          storage_prefix?: string
          storage_quota_gb?: number | null
          storage_used_gb?: number | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pmpp_knowledge: {
        Row: {
          content: string
          context: string | null
          created_at: string | null
          domains: string[] | null
          id: string
          last_reviewed_at: string | null
          parent_method_id: string | null
          parent_practice_id: string | null
          parent_principle_id: string | null
          projects: string[] | null
          requires_approval_from: string[] | null
          review_frequency_days: number | null
          status: string | null
          tags: string[] | null
          title: string
          type: string
          update_authority: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          context?: string | null
          created_at?: string | null
          domains?: string[] | null
          id?: string
          last_reviewed_at?: string | null
          parent_method_id?: string | null
          parent_practice_id?: string | null
          parent_principle_id?: string | null
          projects?: string[] | null
          requires_approval_from?: string[] | null
          review_frequency_days?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          type: string
          update_authority?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          context?: string | null
          created_at?: string | null
          domains?: string[] | null
          id?: string
          last_reviewed_at?: string | null
          parent_method_id?: string | null
          parent_practice_id?: string | null
          parent_principle_id?: string | null
          projects?: string[] | null
          requires_approval_from?: string[] | null
          review_frequency_days?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          update_authority?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pmpp_knowledge_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "knowledge_review_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmpp_knowledge_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "pmpp_knowledge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmpp_knowledge_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "knowledge_review_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmpp_knowledge_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "pmpp_knowledge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmpp_knowledge_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "knowledge_review_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pmpp_knowledge_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "pmpp_knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      portraits: {
        Row: {
          access_code: string
          clicks: number
          created_at: string
          id: string
          image_url: string
          name: string | null
          offset_x: number
          offset_y: number
          rotation: number
          storyteller_id: string
          updated_at: string
          views: number
          visible: boolean
        }
        Insert: {
          access_code?: string
          clicks?: number
          created_at?: string
          id?: string
          image_url: string
          name?: string | null
          offset_x?: number
          offset_y?: number
          rotation?: number
          storyteller_id: string
          updated_at?: string
          views?: number
          visible?: boolean
        }
        Update: {
          access_code?: string
          clicks?: number
          created_at?: string
          id?: string
          image_url?: string
          name?: string | null
          offset_x?: number
          offset_y?: number
          rotation?: number
          storyteller_id?: string
          updated_at?: string
          views?: number
          visible?: boolean
        }
        Relationships: []
      }
      privacy_audit_log: {
        Row: {
          actor: string | null
          body: Json | null
          id: number
          ip: string | null
          method: string | null
          occurred_at: string | null
          path: string | null
          query: Json | null
          resource: string | null
          status: number | null
          tenant_id: string | null
        }
        Insert: {
          actor?: string | null
          body?: Json | null
          id?: number
          ip?: string | null
          method?: string | null
          occurred_at?: string | null
          path?: string | null
          query?: Json | null
          resource?: string | null
          status?: number | null
          tenant_id?: string | null
        }
        Update: {
          actor?: string | null
          body?: Json | null
          id?: number
          ip?: string | null
          method?: string | null
          occurred_at?: string | null
          path?: string | null
          query?: Json | null
          resource?: string | null
          status?: number | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      privacy_dsr_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: number
          notes: string | null
          status: string
          subject_identifier: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          status?: string
          subject_identifier: string
          tenant_id?: string | null
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          status?: string
          subject_identifier?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          analytics_consent: boolean | null
          consent_expires_at: string | null
          consent_version: number | null
          data_sharing_consent: boolean | null
          email_processing_consent: boolean | null
          policy_ref: string | null
          retention_days: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          analytics_consent?: boolean | null
          consent_expires_at?: string | null
          consent_version?: number | null
          data_sharing_consent?: boolean | null
          email_processing_consent?: boolean | null
          policy_ref?: string | null
          retention_days?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          analytics_consent?: boolean | null
          consent_expires_at?: string | null
          consent_version?: number | null
          data_sharing_consent?: boolean | null
          email_processing_consent?: boolean | null
          policy_ref?: string | null
          retention_days?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          current_step: string | null
          estimated_completion: string | null
          progress_percentage: number | null
          status: string | null
          transcript_id: string | null
        }
        Insert: {
          current_step?: string | null
          estimated_completion?: string | null
          progress_percentage?: number | null
          status?: string | null
          transcript_id?: string | null
        }
        Update: {
          current_step?: string | null
          estimated_completion?: string | null
          progress_percentage?: number | null
          status?: string | null
          transcript_id?: string | null
        }
        Relationships: []
      }
      profile_appearances: {
        Row: {
          appears_on_id: string
          appears_on_type: string
          created_at: string | null
          empathy_ledger_profile_id: string
          featured: boolean | null
          id: string
          public_profile_id: string | null
          role: string | null
          story_excerpt: string | null
          updated_at: string | null
        }
        Insert: {
          appears_on_id: string
          appears_on_type: string
          created_at?: string | null
          empathy_ledger_profile_id: string
          featured?: boolean | null
          id?: string
          public_profile_id?: string | null
          role?: string | null
          story_excerpt?: string | null
          updated_at?: string | null
        }
        Update: {
          appears_on_id?: string
          appears_on_type?: string
          created_at?: string | null
          empathy_ledger_profile_id?: string
          featured?: boolean | null
          id?: string
          public_profile_id?: string | null
          role?: string | null
          story_excerpt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_appearances_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_sync_log: {
        Row: {
          empathy_ledger_profile_id: string | null
          error_message: string | null
          id: string
          public_profile_id: string | null
          sync_action: string
          sync_details: Json | null
          sync_status: string
          synced_at: string | null
        }
        Insert: {
          empathy_ledger_profile_id?: string | null
          error_message?: string | null
          id?: string
          public_profile_id?: string | null
          sync_action: string
          sync_details?: Json | null
          sync_status: string
          synced_at?: string | null
        }
        Update: {
          empathy_ledger_profile_id?: string | null
          error_message?: string | null
          id?: string
          public_profile_id?: string | null
          sync_action?: string
          sync_details?: Json | null
          sync_status?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_sync_log_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          language_preference: string | null
          notification_preferences: Json | null
          permissions: string[] | null
          primary_organization_id: string | null
          privacy_preferences: Json | null
          role: string | null
          terms_accepted_at: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
          language_preference?: string | null
          notification_preferences?: Json | null
          permissions?: string[] | null
          primary_organization_id?: string | null
          privacy_preferences?: Json | null
          role?: string | null
          terms_accepted_at?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          language_preference?: string | null
          notification_preferences?: Json | null
          permissions?: string[] | null
          primary_organization_id?: string | null
          privacy_preferences?: Json | null
          role?: string | null
          terms_accepted_at?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_organization_id_fkey"
            columns: ["primary_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      program_outcomes: {
        Row: {
          comparison_value: string | null
          created_at: string | null
          id: string
          metric_name: string
          notes: string | null
          outcome_type: string
          program_id: string | null
          sample_size: number | null
          source: string | null
          source_year: number | null
          timeframe: string | null
          value: string
        }
        Insert: {
          comparison_value?: string | null
          created_at?: string | null
          id?: string
          metric_name: string
          notes?: string | null
          outcome_type: string
          program_id?: string | null
          sample_size?: number | null
          source?: string | null
          source_year?: number | null
          timeframe?: string | null
          value: string
        }
        Update: {
          comparison_value?: string | null
          created_at?: string | null
          id?: string
          metric_name?: string
          notes?: string | null
          outcome_type?: string
          program_id?: string | null
          sample_size?: number | null
          source?: string | null
          source_year?: number | null
          timeframe?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_outcomes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "international_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_visits: {
        Row: {
          created_at: string | null
          documents: Json | null
          follow_up_actions: string | null
          id: string
          organizations: string[] | null
          outcomes: string | null
          participants: string[] | null
          photos: Json | null
          program_id: string | null
          purpose: string | null
          updated_at: string | null
          visit_date: string
          visit_type: string
        }
        Insert: {
          created_at?: string | null
          documents?: Json | null
          follow_up_actions?: string | null
          id?: string
          organizations?: string[] | null
          outcomes?: string | null
          participants?: string[] | null
          photos?: Json | null
          program_id?: string | null
          purpose?: string | null
          updated_at?: string | null
          visit_date: string
          visit_type: string
        }
        Update: {
          created_at?: string | null
          documents?: Json | null
          follow_up_actions?: string | null
          id?: string
          organizations?: string[] | null
          outcomes?: string | null
          participants?: string[] | null
          photos?: Json | null
          program_id?: string | null
          purpose?: string | null
          updated_at?: string | null
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_visits_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "international_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activity_summary: {
        Row: {
          calendar_meeting_count: number | null
          calendar_meeting_minutes: number | null
          gmail_recent_contacts: Json | null
          gmail_thread_count: number | null
          last_calendar_activity: string | null
          last_gmail_activity: string | null
          last_notation_activity: string | null
          last_synced: string | null
          notion_edit_count: number | null
          notion_edit_minutes: number | null
          project_id: string
        }
        Insert: {
          calendar_meeting_count?: number | null
          calendar_meeting_minutes?: number | null
          gmail_recent_contacts?: Json | null
          gmail_thread_count?: number | null
          last_calendar_activity?: string | null
          last_gmail_activity?: string | null
          last_notation_activity?: string | null
          last_synced?: string | null
          notion_edit_count?: number | null
          notion_edit_minutes?: number | null
          project_id: string
        }
        Update: {
          calendar_meeting_count?: number | null
          calendar_meeting_minutes?: number | null
          gmail_recent_contacts?: Json | null
          gmail_thread_count?: number | null
          last_calendar_activity?: string | null
          last_gmail_activity?: string | null
          last_notation_activity?: string | null
          last_synced?: string | null
          notion_edit_count?: number | null
          notion_edit_minutes?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_summary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_activity_summary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contact_alignment: {
        Row: {
          alignment_score: number
          confidence: number | null
          contact_context: Json | null
          contact_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          outreach_recommendation: Json | null
          project_context: Json | null
          project_id: string
          shared_themes: string[] | null
          updated_at: string | null
        }
        Insert: {
          alignment_score?: number
          confidence?: number | null
          contact_context?: Json | null
          contact_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          outreach_recommendation?: Json | null
          project_context?: Json | null
          project_id: string
          shared_themes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alignment_score?: number
          confidence?: number | null
          contact_context?: Json | null
          contact_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          outreach_recommendation?: Json | null
          project_context?: Json | null
          project_id?: string
          shared_themes?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_contact_matches: {
        Row: {
          alignment_score: number | null
          alma_intervention_id: string | null
          alma_signal_boost: number | null
          contact_id: string | null
          created_at: string | null
          engagement_status: string | null
          id: string
          match_reason: string | null
          matched_keywords: string[] | null
          person_id: string | null
          project_name: string
          project_notion_id: string
          project_source: string
          updated_at: string | null
        }
        Insert: {
          alignment_score?: number | null
          alma_intervention_id?: string | null
          alma_signal_boost?: number | null
          contact_id?: string | null
          created_at?: string | null
          engagement_status?: string | null
          id?: string
          match_reason?: string | null
          matched_keywords?: string[] | null
          person_id?: string | null
          project_name: string
          project_notion_id: string
          project_source: string
          updated_at?: string | null
        }
        Update: {
          alignment_score?: number | null
          alma_intervention_id?: string | null
          alma_signal_boost?: number | null
          contact_id?: string | null
          created_at?: string | null
          engagement_status?: string | null
          id?: string
          match_reason?: string | null
          matched_keywords?: string[] | null
          person_id?: string | null
          project_name?: string
          project_notion_id?: string
          project_source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contact_matches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contact_matches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["linkedin_contact_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      project_contributions: {
        Row: {
          attribution_preferences: Json | null
          contribution_description: string | null
          contribution_end_date: string | null
          contribution_start_date: string | null
          contribution_type: string
          contribution_value: Json | null
          contributor_id: string | null
          contributor_type: string
          created_at: string | null
          expertise_areas: Json | null
          id: string
          impact_description: string | null
          linked_outcomes: Json | null
          project_id: string
          public_recognition: boolean | null
          skills_contributed: Json | null
        }
        Insert: {
          attribution_preferences?: Json | null
          contribution_description?: string | null
          contribution_end_date?: string | null
          contribution_start_date?: string | null
          contribution_type: string
          contribution_value?: Json | null
          contributor_id?: string | null
          contributor_type: string
          created_at?: string | null
          expertise_areas?: Json | null
          id?: string
          impact_description?: string | null
          linked_outcomes?: Json | null
          project_id: string
          public_recognition?: boolean | null
          skills_contributed?: Json | null
        }
        Update: {
          attribution_preferences?: Json | null
          contribution_description?: string | null
          contribution_end_date?: string | null
          contribution_start_date?: string | null
          contribution_type?: string
          contribution_value?: Json | null
          contributor_id?: string | null
          contributor_type?: string
          created_at?: string | null
          expertise_areas?: Json | null
          id?: string
          impact_description?: string | null
          linked_outcomes?: Json | null
          project_id?: string
          public_recognition?: boolean | null
          skills_contributed?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_health_analysis: {
        Row: {
          analysis_date: string | null
          created_at: string | null
          health_score: number
          id: string
          metadata: Json | null
          opportunities: string[] | null
          project_id: string
          recommendations: string[] | null
          risks: string[] | null
        }
        Insert: {
          analysis_date?: string | null
          created_at?: string | null
          health_score: number
          id?: string
          metadata?: Json | null
          opportunities?: string[] | null
          project_id: string
          recommendations?: string[] | null
          risks?: string[] | null
        }
        Update: {
          analysis_date?: string | null
          created_at?: string | null
          health_score?: number
          id?: string
          metadata?: Json | null
          opportunities?: string[] | null
          project_id?: string
          recommendations?: string[] | null
          risks?: string[] | null
        }
        Relationships: []
      }
      project_health_history: {
        Row: {
          critical_factors: string[] | null
          health_score: number | null
          id: string
          notes: string | null
          notion_project_id: string | null
          project_id: string | null
          raw_payload: Json | null
          recorded_at: string | null
          status: string | null
          urgency_score: number | null
        }
        Insert: {
          critical_factors?: string[] | null
          health_score?: number | null
          id?: string
          notes?: string | null
          notion_project_id?: string | null
          project_id?: string | null
          raw_payload?: Json | null
          recorded_at?: string | null
          status?: string | null
          urgency_score?: number | null
        }
        Update: {
          critical_factors?: string[] | null
          health_score?: number | null
          id?: string
          notes?: string | null
          notion_project_id?: string | null
          project_id?: string | null
          raw_payload?: Json | null
          recorded_at?: string | null
          status?: string | null
          urgency_score?: number | null
        }
        Relationships: []
      }
      project_intelligence: {
        Row: {
          communities: string[] | null
          created_at: string | null
          embedding: number[] | null
          focus_areas: string[] | null
          id: string
          intelligence: Json
          last_synced_at: string | null
          notion_page_id: string | null
          partner_targets: string[] | null
          project_id: string
          project_name: string
          readiness_score: number | null
          required_support: string[] | null
          risk_level: string | null
          strategic_alignment: string[] | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          communities?: string[] | null
          created_at?: string | null
          embedding?: number[] | null
          focus_areas?: string[] | null
          id?: string
          intelligence?: Json
          last_synced_at?: string | null
          notion_page_id?: string | null
          partner_targets?: string[] | null
          project_id: string
          project_name: string
          readiness_score?: number | null
          required_support?: string[] | null
          risk_level?: string | null
          strategic_alignment?: string[] | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          communities?: string[] | null
          created_at?: string | null
          embedding?: number[] | null
          focus_areas?: string[] | null
          id?: string
          intelligence?: Json
          last_synced_at?: string | null
          notion_page_id?: string | null
          partner_targets?: string[] | null
          project_id?: string
          project_name?: string
          readiness_score?: number | null
          required_support?: string[] | null
          risk_level?: string | null
          strategic_alignment?: string[] | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_media_links: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          is_hero: boolean | null
          link_id: string
          link_type: string
          media_id: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_hero?: boolean | null
          link_id: string
          link_type: string
          media_id: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_hero?: boolean | null
          link_id?: string
          link_type?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "public_media_with_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      project_outcome_updates: {
        Row: {
          attachments: Json | null
          created_at: string | null
          data_collection_method: string | null
          description: string | null
          evidence_data: Json | null
          id: string
          metric_updates: Json | null
          project_outcome_id: string
          report_date: string
          reported_by: string
          title: string
          update_type: string
          validation_notes: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          data_collection_method?: string | null
          description?: string | null
          evidence_data?: Json | null
          id?: string
          metric_updates?: Json | null
          project_outcome_id: string
          report_date: string
          reported_by: string
          title: string
          update_type: string
          validation_notes?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          data_collection_method?: string | null
          description?: string | null
          evidence_data?: Json | null
          id?: string
          metric_updates?: Json | null
          project_outcome_id?: string
          report_date?: string
          reported_by?: string
          title?: string
          update_type?: string
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_outcome_updates_project_outcome_id_fkey"
            columns: ["project_outcome_id"]
            isOneToOne: false
            referencedRelation: "project_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_outcomes: {
        Row: {
          baseline_data: Json | null
          community_attribution: Json | null
          confidence_level: string | null
          contributing_organizations: Json | null
          created_at: string | null
          current_metrics: Json | null
          data_sources: Json | null
          description: string | null
          direct_beneficiaries: Json | null
          featured: boolean | null
          final_metrics: Json | null
          geographic_impact: Json | null
          id: string
          indirect_beneficiaries: Json | null
          individual_attribution: Json | null
          measurement_frequency: string | null
          measurement_methodology: string | null
          media_assets: Json | null
          outcome_category: string
          outcome_period_end: string | null
          outcome_period_start: string | null
          outcome_type: string
          project_id: string
          public_visibility: boolean | null
          report_url: string | null
          reported_by: string | null
          status: string | null
          target_metrics: Json | null
          temporal_impact: Json | null
          title: string
          updated_at: string | null
          verification_date: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_by: string | null
        }
        Insert: {
          baseline_data?: Json | null
          community_attribution?: Json | null
          confidence_level?: string | null
          contributing_organizations?: Json | null
          created_at?: string | null
          current_metrics?: Json | null
          data_sources?: Json | null
          description?: string | null
          direct_beneficiaries?: Json | null
          featured?: boolean | null
          final_metrics?: Json | null
          geographic_impact?: Json | null
          id?: string
          indirect_beneficiaries?: Json | null
          individual_attribution?: Json | null
          measurement_frequency?: string | null
          measurement_methodology?: string | null
          media_assets?: Json | null
          outcome_category: string
          outcome_period_end?: string | null
          outcome_period_start?: string | null
          outcome_type: string
          project_id: string
          public_visibility?: boolean | null
          report_url?: string | null
          reported_by?: string | null
          status?: string | null
          target_metrics?: Json | null
          temporal_impact?: Json | null
          title: string
          updated_at?: string | null
          verification_date?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_by?: string | null
        }
        Update: {
          baseline_data?: Json | null
          community_attribution?: Json | null
          confidence_level?: string | null
          contributing_organizations?: Json | null
          created_at?: string | null
          current_metrics?: Json | null
          data_sources?: Json | null
          description?: string | null
          direct_beneficiaries?: Json | null
          featured?: boolean | null
          final_metrics?: Json | null
          geographic_impact?: Json | null
          id?: string
          indirect_beneficiaries?: Json | null
          individual_attribution?: Json | null
          measurement_frequency?: string | null
          measurement_methodology?: string | null
          media_assets?: Json | null
          outcome_category?: string
          outcome_period_end?: string | null
          outcome_period_start?: string | null
          outcome_type?: string
          project_id?: string
          public_visibility?: boolean | null
          report_url?: string | null
          reported_by?: string | null
          status?: string | null
          target_metrics?: Json | null
          temporal_impact?: Json | null
          title?: string
          updated_at?: string | null
          verification_date?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pairings: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          partner_project_id: string
          project_id: string
          reason: string | null
          similarity: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          partner_project_id: string
          project_id: string
          reason?: string | null
          similarity?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          partner_project_id?: string
          project_id?: string
          reason?: string | null
          similarity?: number | null
        }
        Relationships: []
      }
      project_research: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          project_id: string
          source: string
          summary: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id: string
          source: string
          summary?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          source?: string
          summary?: string | null
          url?: string | null
        }
        Relationships: []
      }
      project_support_graph: {
        Row: {
          created_at: string | null
          funding_gap: number | null
          keyword_highlights: string[] | null
          last_calculated: string | null
          metadata: Json | null
          notion_project_id: string | null
          project_id: string
          project_name: string | null
          project_status: string | null
          supporters: Json | null
          upcoming_milestone: string | null
          updated_at: string | null
          urgency_score: number | null
        }
        Insert: {
          created_at?: string | null
          funding_gap?: number | null
          keyword_highlights?: string[] | null
          last_calculated?: string | null
          metadata?: Json | null
          notion_project_id?: string | null
          project_id: string
          project_name?: string | null
          project_status?: string | null
          supporters?: Json | null
          upcoming_milestone?: string | null
          updated_at?: string | null
          urgency_score?: number | null
        }
        Update: {
          created_at?: string | null
          funding_gap?: number | null
          keyword_highlights?: string[] | null
          last_calculated?: string | null
          metadata?: Json | null
          notion_project_id?: string | null
          project_id?: string
          project_name?: string | null
          project_status?: string | null
          supporters?: Json | null
          upcoming_milestone?: string | null
          updated_at?: string | null
          urgency_score?: number | null
        }
        Relationships: []
      }
      project_updates: {
        Row: {
          author: string | null
          body_md: string
          community_contributed: boolean | null
          created_at: string | null
          id: string
          image_url: string | null
          project_id: string | null
          published_at: string | null
          title: string
          update_type: string | null
        }
        Insert: {
          author?: string | null
          body_md: string
          community_contributed?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          published_at?: string | null
          title: string
          update_type?: string | null
        }
        Update: {
          author?: string | null
          body_md?: string
          community_contributed?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          published_at?: string | null
          title?: string
          update_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived: boolean
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          notion_id: string | null
          notion_project_id: string | null
          organization_id: string | null
          status: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          notion_id?: string | null
          notion_project_id?: string | null
          organization_id?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          notion_id?: string | null
          notion_project_id?: string | null
          organization_id?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          current_organization: string | null
          email: string | null
          empathy_ledger_profile_id: string | null
          full_name: string
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          last_synced_at: string | null
          location: string | null
          photo_credit: string | null
          photo_url: string | null
          preferred_name: string | null
          pronouns: string | null
          role_tags: string[] | null
          slug: string
          social_links: Json | null
          sync_type: string | null
          synced_from_empathy_ledger: boolean | null
          tagline: string | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          current_organization?: string | null
          email?: string | null
          empathy_ledger_profile_id?: string | null
          full_name: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          photo_credit?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          role_tags?: string[] | null
          slug: string
          social_links?: Json | null
          sync_type?: string | null
          synced_from_empathy_ledger?: boolean | null
          tagline?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          current_organization?: string | null
          email?: string | null
          empathy_ledger_profile_id?: string | null
          full_name?: string
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          photo_credit?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          role_tags?: string[] | null
          slug?: string
          social_links?: Json | null
          sync_type?: string | null
          synced_from_empathy_ledger?: boolean | null
          tagline?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          portrait_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          portrait_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          portrait_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_events_portrait_id_fkey"
            columns: ["portrait_id"]
            isOneToOne: false
            referencedRelation: "portraits"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          storyteller_id: string
          subscription: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          storyteller_id: string
          subscription: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          storyteller_id?: string
          subscription?: Json
        }
        Relationships: []
      }
      quotes: {
        Row: {
          ai_confidence_score: number | null
          attribution_approved: boolean | null
          context_after: string | null
          context_before: string | null
          created_at: string | null
          emotional_tone: string[] | null
          extracted_by_ai: boolean | null
          id: string
          last_used_at: string | null
          quote_text: string
          quote_type: string | null
          significance_score: number | null
          story_id: string | null
          storyteller_approved: boolean | null
          storyteller_id: string
          themes: string[] | null
          transcript_id: string | null
          updated_at: string | null
          usage_count: number | null
          usage_permissions: string[] | null
          visibility: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          attribution_approved?: boolean | null
          context_after?: string | null
          context_before?: string | null
          created_at?: string | null
          emotional_tone?: string[] | null
          extracted_by_ai?: boolean | null
          id?: string
          last_used_at?: string | null
          quote_text: string
          quote_type?: string | null
          significance_score?: number | null
          story_id?: string | null
          storyteller_approved?: boolean | null
          storyteller_id: string
          themes?: string[] | null
          transcript_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_permissions?: string[] | null
          visibility?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          attribution_approved?: boolean | null
          context_after?: string | null
          context_before?: string | null
          created_at?: string | null
          emotional_tone?: string[] | null
          extracted_by_ai?: boolean | null
          id?: string
          last_used_at?: string | null
          quote_text?: string
          quote_type?: string | null
          significance_score?: number | null
          story_id?: string | null
          storyteller_approved?: boolean | null
          storyteller_id?: string
          themes?: string[] | null
          transcript_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_permissions?: string[] | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      rd_activity_log: {
        Row: {
          category: string | null
          completed_at: string | null
          component: string
          created_at: string | null
          developer: string
          findings: string | null
          hypothesis: string
          id: string
          methodology: string
          notion_page_id: string | null
          started_at: string | null
          status: string | null
          success_metric: string
          time_spent_hours: number | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          component: string
          created_at?: string | null
          developer: string
          findings?: string | null
          hypothesis: string
          id?: string
          methodology: string
          notion_page_id?: string | null
          started_at?: string | null
          status?: string | null
          success_metric: string
          time_spent_hours?: number | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          component?: string
          created_at?: string | null
          developer?: string
          findings?: string | null
          hypothesis?: string
          id?: string
          methodology?: string
          notion_page_id?: string | null
          started_at?: string | null
          status?: string | null
          success_metric?: string
          time_spent_hours?: number | null
        }
        Relationships: []
      }
      recommendation_outcomes: {
        Row: {
          acted_upon: boolean | null
          confidence_score: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          feedback_notes: string | null
          id: string
          outcome: string | null
          outcome_date: string | null
          outcome_value: number | null
          recommendation_type: string
          recommended_action: string
          recommended_at: string | null
        }
        Insert: {
          acted_upon?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          feedback_notes?: string | null
          id?: string
          outcome?: string | null
          outcome_date?: string | null
          outcome_value?: number | null
          recommendation_type: string
          recommended_action: string
          recommended_at?: string | null
        }
        Update: {
          acted_upon?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          feedback_notes?: string | null
          id?: string
          outcome?: string | null
          outcome_date?: string | null
          outcome_value?: number | null
          recommendation_type?: string
          recommended_action?: string
          recommended_at?: string | null
        }
        Relationships: []
      }
      registered_services: {
        Row: {
          alma_intervention_id: string | null
          approach: string
          community_connection_score: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          description: string
          empathy_ledger_project_id: string | null
          founded_year: number | null
          id: string
          impact_summary: string
          indigenous_knowledge: boolean | null
          interview_date: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          last_synced_at: string | null
          latitude: number | null
          linked_service_id: string | null
          location: string
          location_type: string | null
          longitude: number | null
          name: string
          organization: string
          organization_id: string | null
          participants_served: number | null
          relationship_type: string | null
          search_vector: unknown
          service_id: string | null
          state: string
          success_rate: number | null
          synced_from_empathy_ledger: boolean | null
          tags: string[] | null
          updated_at: string | null
          website: string | null
          years_operating: number | null
        }
        Insert: {
          alma_intervention_id?: string | null
          approach: string
          community_connection_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          empathy_ledger_project_id?: string | null
          founded_year?: number | null
          id?: string
          impact_summary: string
          indigenous_knowledge?: boolean | null
          interview_date?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          linked_service_id?: string | null
          location: string
          location_type?: string | null
          longitude?: number | null
          name: string
          organization: string
          organization_id?: string | null
          participants_served?: number | null
          relationship_type?: string | null
          search_vector?: unknown
          service_id?: string | null
          state: string
          success_rate?: number | null
          synced_from_empathy_ledger?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
          years_operating?: number | null
        }
        Update: {
          alma_intervention_id?: string | null
          approach?: string
          community_connection_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          empathy_ledger_project_id?: string | null
          founded_year?: number | null
          id?: string
          impact_summary?: string
          indigenous_knowledge?: boolean | null
          interview_date?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_synced_at?: string | null
          latitude?: number | null
          linked_service_id?: string | null
          location?: string
          location_type?: string | null
          longitude?: number | null
          name?: string
          organization?: string
          organization_id?: string | null
          participants_served?: number | null
          relationship_type?: string | null
          search_vector?: unknown
          service_id?: string | null
          state?: string
          success_rate?: number | null
          synced_from_empathy_ledger?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
          years_operating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_programs_alma_intervention_id_fkey"
            columns: ["alma_intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_programs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_programs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registered_services_linked_service_id_fkey"
            columns: ["linked_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registered_services_linked_service_id_fkey"
            columns: ["linked_service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_services_profiles: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          program_id: string | null
          public_profile_id: string | null
          role: string
          role_description: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          program_id?: string | null
          public_profile_id?: string | null
          role: string
          role_description?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          program_id?: string | null
          public_profile_id?: string | null
          role?: string
          role_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_programs_profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_programs_profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      research_items: {
        Row: {
          authors: string[] | null
          category: Database["public"]["Enums"]["research_category"]
          created_at: string | null
          display_order: number | null
          external_url: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          jurisdiction: Database["public"]["Enums"]["research_jurisdiction"]
          key_findings: string[] | null
          organization: string
          pdf_url: string | null
          slug: string
          summary: string
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["research_type"]
          updated_at: string | null
          video_url: string | null
          year: number
        }
        Insert: {
          authors?: string[] | null
          category: Database["public"]["Enums"]["research_category"]
          created_at?: string | null
          display_order?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          jurisdiction: Database["public"]["Enums"]["research_jurisdiction"]
          key_findings?: string[] | null
          organization: string
          pdf_url?: string | null
          slug: string
          summary: string
          tags?: string[] | null
          title: string
          type: Database["public"]["Enums"]["research_type"]
          updated_at?: string | null
          video_url?: string | null
          year: number
        }
        Update: {
          authors?: string[] | null
          category?: Database["public"]["Enums"]["research_category"]
          created_at?: string | null
          display_order?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          jurisdiction?: Database["public"]["Enums"]["research_jurisdiction"]
          key_findings?: string[] | null
          organization?: string
          pdf_url?: string | null
          slug?: string
          summary?: string
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["research_type"]
          updated_at?: string | null
          video_url?: string | null
          year?: number
        }
        Relationships: []
      }
      review_curated_entries: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          display_order: number | null
          edited_description: string | null
          edited_title: string | null
          has_project_page: boolean | null
          hero_image_alt: string | null
          hero_image_id: string | null
          hero_image_url: string | null
          hero_video_platform: string | null
          hero_video_title: string | null
          hero_video_url: string | null
          id: string
          included: boolean | null
          metadata: Json | null
          photos: string[] | null
          project_slug: string | null
          season_order: number | null
          source: string
          status: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          display_order?: number | null
          edited_description?: string | null
          edited_title?: string | null
          has_project_page?: boolean | null
          hero_image_alt?: string | null
          hero_image_id?: string | null
          hero_image_url?: string | null
          hero_video_platform?: string | null
          hero_video_title?: string | null
          hero_video_url?: string | null
          id: string
          included?: boolean | null
          metadata?: Json | null
          photos?: string[] | null
          project_slug?: string | null
          season_order?: number | null
          source?: string
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string | null
          year?: number
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          display_order?: number | null
          edited_description?: string | null
          edited_title?: string | null
          has_project_page?: boolean | null
          hero_image_alt?: string | null
          hero_image_id?: string | null
          hero_image_url?: string | null
          hero_video_platform?: string | null
          hero_video_title?: string | null
          hero_video_url?: string | null
          id?: string
          included?: boolean | null
          metadata?: Json | null
          photos?: string[] | null
          project_slug?: string | null
          season_order?: number | null
          source?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      review_media_links: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          is_hero: boolean | null
          link_id: string
          link_type: string
          media_id: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_hero?: boolean | null
          link_id: string
          link_type: string
          media_id: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_hero?: boolean | null
          link_id?: string
          link_type?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "public_media_with_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      review_projects: {
        Row: {
          content_blocks: Json
          created_at: string | null
          featured_order: number | null
          hero_caption: string | null
          hero_image_id: string | null
          hero_video_type: string | null
          hero_video_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          subtitle: string | null
          timeline_entry_id: string
          title: string
          updated_at: string | null
          year: number
        }
        Insert: {
          content_blocks?: Json
          created_at?: string | null
          featured_order?: number | null
          hero_caption?: string | null
          hero_image_id?: string | null
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          subtitle?: string | null
          timeline_entry_id: string
          title: string
          updated_at?: string | null
          year?: number
        }
        Update: {
          content_blocks?: Json
          created_at?: string | null
          featured_order?: number | null
          hero_caption?: string | null
          hero_image_id?: string | null
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          subtitle?: string | null
          timeline_entry_id?: string
          title?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_projects_hero_image_id_fkey"
            columns: ["hero_image_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_projects_hero_image_id_fkey"
            columns: ["hero_image_id"]
            isOneToOne: false
            referencedRelation: "public_media_with_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      review_videos: {
        Row: {
          autoplay: boolean | null
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          embed_url: string
          id: string
          is_featured: boolean | null
          link_id: string | null
          link_type: string
          platform: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          video_id: string
          year: number
        }
        Insert: {
          autoplay?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          embed_url: string
          id?: string
          is_featured?: boolean | null
          link_id?: string | null
          link_type: string
          platform: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_id: string
          year?: number
        }
        Update: {
          autoplay?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          embed_url?: string
          id?: string
          is_featured?: boolean | null
          link_id?: string | null
          link_type?: string
          platform?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_id?: string
          year?: number
        }
        Relationships: []
      }
      review_year_settings: {
        Row: {
          last_updated: string | null
          seasons: Json | null
          settings: Json | null
          year: number
        }
        Insert: {
          last_updated?: string | null
          seasons?: Json | null
          settings?: Json | null
          year: number
        }
        Update: {
          last_updated?: string | null
          seasons?: Json | null
          settings?: Json | null
          year?: number
        }
        Relationships: []
      }
      role_taxonomy: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          id: string
          is_active?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      scraped_services: {
        Row: {
          active: boolean | null
          availability_schedule: Json | null
          capacity_indicators: Json | null
          category: string | null
          confidence_score: number
          contact_info: Json | null
          cost_structure: string | null
          created_at: string | null
          description: string | null
          eligibility_criteria: string[] | null
          extraction_timestamp: string | null
          geographical_coverage: Json | null
          id: string
          name: string
          organization_id: string | null
          outcomes_evidence: string[] | null
          source_url: string | null
          subcategory: string | null
          target_demographics: Json | null
          updated_at: string | null
          validation_status: string | null
        }
        Insert: {
          active?: boolean | null
          availability_schedule?: Json | null
          capacity_indicators?: Json | null
          category?: string | null
          confidence_score: number
          contact_info?: Json | null
          cost_structure?: string | null
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: string[] | null
          extraction_timestamp?: string | null
          geographical_coverage?: Json | null
          id?: string
          name: string
          organization_id?: string | null
          outcomes_evidence?: string[] | null
          source_url?: string | null
          subcategory?: string | null
          target_demographics?: Json | null
          updated_at?: string | null
          validation_status?: string | null
        }
        Update: {
          active?: boolean | null
          availability_schedule?: Json | null
          capacity_indicators?: Json | null
          category?: string | null
          confidence_score?: number
          contact_info?: Json | null
          cost_structure?: string | null
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: string[] | null
          extraction_timestamp?: string | null
          geographical_coverage?: Json | null
          id?: string
          name?: string
          organization_id?: string | null
          outcomes_evidence?: string[] | null
          source_url?: string | null
          subcategory?: string | null
          target_demographics?: Json | null
          updated_at?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraped_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_metadata: {
        Row: {
          ai_processing_version: string
          confidence_scores: Json
          created_at: string | null
          data_lineage: Json | null
          discovery_method: string
          extraction_method: string
          id: string
          last_updated: string | null
          organization_id: string | null
          quality_flags: Json | null
          scraping_timestamp: string | null
          source_type: string
          source_url: string
          validation_status: string | null
        }
        Insert: {
          ai_processing_version: string
          confidence_scores?: Json
          created_at?: string | null
          data_lineage?: Json | null
          discovery_method: string
          extraction_method: string
          id?: string
          last_updated?: string | null
          organization_id?: string | null
          quality_flags?: Json | null
          scraping_timestamp?: string | null
          source_type: string
          source_url: string
          validation_status?: string | null
        }
        Update: {
          ai_processing_version?: string
          confidence_scores?: Json
          created_at?: string | null
          data_lineage?: Json | null
          discovery_method?: string
          extraction_method?: string
          id?: string
          last_updated?: string | null
          organization_id?: string | null
          quality_flags?: Json | null
          scraping_timestamp?: string | null
          source_type?: string
          source_url?: string
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraping_metadata_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          filters: Json | null
          id: string
          query: string
          results_count: number | null
          search_timestamp: string | null
          user_id: string | null
        }
        Insert: {
          filters?: Json | null
          id?: string
          query: string
          results_count?: number | null
          search_timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number | null
          search_timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_contacts: {
        Row: {
          contact_name: string | null
          contact_type: string | null
          created_at: string | null
          email: string | null
          hours: string | null
          id: string
          is_primary: boolean | null
          phone: string | null
          service_id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          service_id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          service_id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_contacts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contacts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      service_locations: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          latitude: number | null
          locality: string | null
          location_name: string | null
          longitude: number | null
          operating_hours: Json | null
          postcode: string | null
          region: string | null
          service_id: string
          state: string | null
          street_address: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          locality?: string | null
          location_name?: string | null
          longitude?: number | null
          operating_hours?: Json | null
          postcode?: string | null
          region?: string | null
          service_id: string
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          locality?: string | null
          location_name?: string | null
          longitude?: number | null
          operating_hours?: Json | null
          postcode?: string | null
          region?: string | null
          service_id?: string
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_locations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_locations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          accessibility_features: string[] | null
          active: boolean | null
          alma_intervention_id: string | null
          availability_schedule: Json | null
          capacity_current: number | null
          capacity_indicators: Json | null
          capacity_total: number | null
          categories: string[] | null
          category: string | null
          contact_email: string | null
          contact_info: Json | null
          contact_phone: string | null
          cost: string | null
          cost_structure: string | null
          created_at: string | null
          data_source: string | null
          data_source_url: string | null
          delivery_method: string[] | null
          description: string | null
          eligibility_criteria: string[] | null
          gender_specific: string[] | null
          geographical_coverage: Json | null
          id: string
          indigenous_specific: boolean | null
          infrastructure_type: string | null
          is_accepting_referrals: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          keywords: string[] | null
          languages_supported: string[] | null
          last_scraped_at: string | null
          last_verified_at: string | null
          latitude: number | null
          location_address: string | null
          location_city: string | null
          location_geocoded_at: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_postcode: string | null
          location_state: string | null
          location_type: string | null
          longitude: number | null
          metadata: Json | null
          name: string
          online_booking_url: string | null
          operating_hours: Json | null
          organization_id: string | null
          outcomes_evidence: string[] | null
          parent_service_id: string | null
          program_type: string | null
          project: string | null
          scrape_confidence_score: number | null
          service_area: string[] | null
          service_category: string[] | null
          service_type: string | null
          slug: string | null
          subcategory: string | null
          success_rate: number | null
          tags: string[] | null
          target_age_max: number | null
          target_age_min: number | null
          target_demographics: Json | null
          updated_at: string | null
          verification_status: string | null
          waitlist_time_weeks: number | null
          website_url: string | null
          youth_specific: boolean | null
        }
        Insert: {
          accessibility_features?: string[] | null
          active?: boolean | null
          alma_intervention_id?: string | null
          availability_schedule?: Json | null
          capacity_current?: number | null
          capacity_indicators?: Json | null
          capacity_total?: number | null
          categories?: string[] | null
          category?: string | null
          contact_email?: string | null
          contact_info?: Json | null
          contact_phone?: string | null
          cost?: string | null
          cost_structure?: string | null
          created_at?: string | null
          data_source?: string | null
          data_source_url?: string | null
          delivery_method?: string[] | null
          description?: string | null
          eligibility_criteria?: string[] | null
          gender_specific?: string[] | null
          geographical_coverage?: Json | null
          id?: string
          indigenous_specific?: boolean | null
          infrastructure_type?: string | null
          is_accepting_referrals?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string[] | null
          languages_supported?: string[] | null
          last_scraped_at?: string | null
          last_verified_at?: string | null
          latitude?: number | null
          location_address?: string | null
          location_city?: string | null
          location_geocoded_at?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_postcode?: string | null
          location_state?: string | null
          location_type?: string | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          online_booking_url?: string | null
          operating_hours?: Json | null
          organization_id?: string | null
          outcomes_evidence?: string[] | null
          parent_service_id?: string | null
          program_type?: string | null
          project?: string | null
          scrape_confidence_score?: number | null
          service_area?: string[] | null
          service_category?: string[] | null
          service_type?: string | null
          slug?: string | null
          subcategory?: string | null
          success_rate?: number | null
          tags?: string[] | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_demographics?: Json | null
          updated_at?: string | null
          verification_status?: string | null
          waitlist_time_weeks?: number | null
          website_url?: string | null
          youth_specific?: boolean | null
        }
        Update: {
          accessibility_features?: string[] | null
          active?: boolean | null
          alma_intervention_id?: string | null
          availability_schedule?: Json | null
          capacity_current?: number | null
          capacity_indicators?: Json | null
          capacity_total?: number | null
          categories?: string[] | null
          category?: string | null
          contact_email?: string | null
          contact_info?: Json | null
          contact_phone?: string | null
          cost?: string | null
          cost_structure?: string | null
          created_at?: string | null
          data_source?: string | null
          data_source_url?: string | null
          delivery_method?: string[] | null
          description?: string | null
          eligibility_criteria?: string[] | null
          gender_specific?: string[] | null
          geographical_coverage?: Json | null
          id?: string
          indigenous_specific?: boolean | null
          infrastructure_type?: string | null
          is_accepting_referrals?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string[] | null
          languages_supported?: string[] | null
          last_scraped_at?: string | null
          last_verified_at?: string | null
          latitude?: number | null
          location_address?: string | null
          location_city?: string | null
          location_geocoded_at?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_postcode?: string | null
          location_state?: string | null
          location_type?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          online_booking_url?: string | null
          operating_hours?: Json | null
          organization_id?: string | null
          outcomes_evidence?: string[] | null
          parent_service_id?: string | null
          program_type?: string | null
          project?: string | null
          scrape_confidence_score?: number | null
          service_area?: string[] | null
          service_category?: string[] | null
          service_type?: string | null
          slug?: string | null
          subcategory?: string | null
          success_rate?: number | null
          tags?: string[] | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_demographics?: Json | null
          updated_at?: string | null
          verification_status?: string | null
          waitlist_time_weeks?: number | null
          website_url?: string | null
          youth_specific?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "services_alma_intervention_id_fkey"
            columns: ["alma_intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_parent_service_id_fkey"
            columns: ["parent_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_parent_service_id_fkey"
            columns: ["parent_service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      services_profiles: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          public_profile_id: string | null
          role: string
          role_description: string | null
          service_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          public_profile_id?: string | null
          role: string
          role_description?: string | null
          service_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          public_profile_id?: string | null
          role?: string
          role_description?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_profiles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_profiles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_evidence: {
        Row: {
          ai_confidence_score: number | null
          community_value_score: number | null
          context_description: string | null
          created_at: string | null
          demonstration_examples: Json | null
          evidence_quote: string | null
          evidence_strength:
            | Database["public"]["Enums"]["evidence_strength_enum"]
            | null
          human_validated: boolean | null
          id: string
          innovation_factor: number | null
          learning_stage: string | null
          mentoring_capacity: boolean | null
          proficiency_level:
            | Database["public"]["Enums"]["proficiency_level_enum"]
            | null
          skill_category: Database["public"]["Enums"]["skill_category_enum"]
          skill_name: string
          storyteller_id: string | null
          teaching_potential: boolean | null
          transferability_score: number | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          community_value_score?: number | null
          context_description?: string | null
          created_at?: string | null
          demonstration_examples?: Json | null
          evidence_quote?: string | null
          evidence_strength?:
            | Database["public"]["Enums"]["evidence_strength_enum"]
            | null
          human_validated?: boolean | null
          id?: string
          innovation_factor?: number | null
          learning_stage?: string | null
          mentoring_capacity?: boolean | null
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level_enum"]
            | null
          skill_category: Database["public"]["Enums"]["skill_category_enum"]
          skill_name: string
          storyteller_id?: string | null
          teaching_potential?: boolean | null
          transferability_score?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          community_value_score?: number | null
          context_description?: string | null
          created_at?: string | null
          demonstration_examples?: Json | null
          evidence_quote?: string | null
          evidence_strength?:
            | Database["public"]["Enums"]["evidence_strength_enum"]
            | null
          human_validated?: boolean | null
          id?: string
          innovation_factor?: number | null
          learning_stage?: string | null
          mentoring_capacity?: boolean | null
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level_enum"]
            | null
          skill_category?: Database["public"]["Enums"]["skill_category_enum"]
          skill_name?: string
          storyteller_id?: string | null
          teaching_potential?: boolean | null
          transferability_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_evidence_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_snapshots: {
        Row: {
          actual_remaining: number | null
          avg_cycle_time: number | null
          avg_lead_time: number | null
          blocked: number | null
          blocked_issues: number
          by_priority: Json | null
          by_repository: Json | null
          by_type: Json | null
          completion_percentage: number | null
          created_at: string | null
          done_issues: number
          flow_efficiency: number | null
          github_org: string | null
          id: string
          ideal_remaining: number | null
          in_progress: number | null
          in_progress_issues: number
          is_final_snapshot: boolean | null
          is_sprint_complete: boolean | null
          project_id: string | null
          snapshot_date: string
          snapshot_time: string
          sprint_end_date: string | null
          sprint_name: string
          sprint_number: number | null
          sprint_start_date: string | null
          throughput_per_week: number | null
          todo: number | null
          todo_issues: number
          total_issues: number
          velocity: number | null
          wip_count: number | null
        }
        Insert: {
          actual_remaining?: number | null
          avg_cycle_time?: number | null
          avg_lead_time?: number | null
          blocked?: number | null
          blocked_issues?: number
          by_priority?: Json | null
          by_repository?: Json | null
          by_type?: Json | null
          completion_percentage?: number | null
          created_at?: string | null
          done_issues?: number
          flow_efficiency?: number | null
          github_org?: string | null
          id?: string
          ideal_remaining?: number | null
          in_progress?: number | null
          in_progress_issues?: number
          is_final_snapshot?: boolean | null
          is_sprint_complete?: boolean | null
          project_id?: string | null
          snapshot_date?: string
          snapshot_time?: string
          sprint_end_date?: string | null
          sprint_name: string
          sprint_number?: number | null
          sprint_start_date?: string | null
          throughput_per_week?: number | null
          todo?: number | null
          todo_issues?: number
          total_issues?: number
          velocity?: number | null
          wip_count?: number | null
        }
        Update: {
          actual_remaining?: number | null
          avg_cycle_time?: number | null
          avg_lead_time?: number | null
          blocked?: number | null
          blocked_issues?: number
          by_priority?: Json | null
          by_repository?: Json | null
          by_type?: Json | null
          completion_percentage?: number | null
          created_at?: string | null
          done_issues?: number
          flow_efficiency?: number | null
          github_org?: string | null
          id?: string
          ideal_remaining?: number | null
          in_progress?: number | null
          in_progress_issues?: number
          is_final_snapshot?: boolean | null
          is_sprint_complete?: boolean | null
          project_id?: string | null
          snapshot_date?: string
          snapshot_time?: string
          sprint_end_date?: string | null
          sprint_name?: string
          sprint_number?: number | null
          sprint_start_date?: string | null
          throughput_per_week?: number | null
          todo?: number | null
          todo_issues?: number
          total_issues?: number
          velocity?: number | null
          wip_count?: number | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          date_recorded: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          impact_level: string | null
          is_featured: boolean | null
          is_published: boolean | null
          location: string | null
          organization_id: string | null
          participant_age: number | null
          participant_name: string
          public_profile_id: string | null
          published_at: string | null
          slug: string | null
          source_platform: string | null
          status: string | null
          story_type: string | null
          summary: string | null
          tags: string[] | null
          themes: string[] | null
          title: string
          transcript_id: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          date_recorded?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          impact_level?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          organization_id?: string | null
          participant_age?: number | null
          participant_name: string
          public_profile_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_platform?: string | null
          status?: string | null
          story_type?: string | null
          summary?: string | null
          tags?: string[] | null
          themes?: string[] | null
          title: string
          transcript_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          date_recorded?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          impact_level?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          organization_id?: string | null
          participant_age?: number | null
          participant_name?: string
          public_profile_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_platform?: string | null
          status?: string | null
          story_type?: string | null
          summary?: string | null
          tags?: string[] | null
          themes?: string[] | null
          title?: string
          transcript_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_analysis: {
        Row: {
          ai_model_used: string | null
          analysis_type: string
          analysis_version: string | null
          approved_for_publication: boolean | null
          coherence_score: number | null
          created_at: string | null
          editorial_notes: string | null
          emotional_impact_score: number | null
          engagement_score: number | null
          human_reviewed: boolean | null
          id: string
          key_messages: string[] | null
          literary_themes: string[] | null
          narrative_score: number | null
          narrative_structure: string | null
          processing_notes: Json | null
          processing_status: string | null
          processing_time_seconds: number | null
          publication_ready: boolean | null
          readability_score: number | null
          results: Json | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          story_arc: string | null
          story_id: string
          story_quotes: string[] | null
          story_summary: string | null
          storyteller_id: string
          transcript_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model_used?: string | null
          analysis_type?: string
          analysis_version?: string | null
          approved_for_publication?: boolean | null
          coherence_score?: number | null
          created_at?: string | null
          editorial_notes?: string | null
          emotional_impact_score?: number | null
          engagement_score?: number | null
          human_reviewed?: boolean | null
          id?: string
          key_messages?: string[] | null
          literary_themes?: string[] | null
          narrative_score?: number | null
          narrative_structure?: string | null
          processing_notes?: Json | null
          processing_status?: string | null
          processing_time_seconds?: number | null
          publication_ready?: boolean | null
          readability_score?: number | null
          results?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          story_arc?: string | null
          story_id: string
          story_quotes?: string[] | null
          story_summary?: string | null
          storyteller_id: string
          transcript_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model_used?: string | null
          analysis_type?: string
          analysis_version?: string | null
          approved_for_publication?: boolean | null
          coherence_score?: number | null
          created_at?: string | null
          editorial_notes?: string | null
          emotional_impact_score?: number | null
          engagement_score?: number | null
          human_reviewed?: boolean | null
          id?: string
          key_messages?: string[] | null
          literary_themes?: string[] | null
          narrative_score?: number | null
          narrative_structure?: string | null
          processing_notes?: Json | null
          processing_status?: string | null
          processing_time_seconds?: number | null
          publication_ready?: boolean | null
          readability_score?: number | null
          results?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          story_arc?: string | null
          story_id?: string
          story_quotes?: string[] | null
          story_summary?: string | null
          storyteller_id?: string
          transcript_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_analysis_storyteller_id_fkey1"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_analysis_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      story_attribution_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          referrer: string | null
          session_id: string
          source_url: string | null
          storyteller_id: string
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id: string
          source_url?: string | null
          storyteller_id: string
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id?: string
          source_url?: string | null
          storyteller_id?: string
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          like_count: number | null
          story_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          like_count?: number | null
          story_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          like_count?: number | null
          story_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction_type: string
          story_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction_type: string
          story_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction_type?: string
          story_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_related_art: {
        Row: {
          art_innovation_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          relevance_note: string | null
          story_id: string | null
        }
        Insert: {
          art_innovation_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
          story_id?: string | null
        }
        Update: {
          art_innovation_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_related_art_art_innovation_id_fkey"
            columns: ["art_innovation_id"]
            isOneToOne: false
            referencedRelation: "art_innovation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_related_art_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_related_interventions: {
        Row: {
          created_at: string | null
          id: string
          intervention_id: string
          relevance_note: string | null
          story_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intervention_id: string
          relevance_note?: string | null
          story_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intervention_id?: string
          relevance_note?: string | null
          story_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_related_interventions_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "alma_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_related_interventions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_related_programs: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          program_id: string | null
          relevance_note: string | null
          story_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          program_id?: string | null
          relevance_note?: string | null
          story_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          program_id?: string | null
          relevance_note?: string | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_related_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_related_programs_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_related_services: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          relevance_note: string | null
          service_id: string | null
          story_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
          service_id?: string | null
          story_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          relevance_note?: string | null
          service_id?: string | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_related_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_related_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_related_services_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      storyteller_ai_intelligence: {
        Row: {
          aboriginal_protocol_adherence: number | null
          analysis_completeness: number | null
          collaboration_style: Json | null
          community_centered_approach: number | null
          community_impact_potential: number | null
          core_expertise_areas: Json | null
          created_at: string | null
          cultural_competency_level: string | null
          cultural_sensitivity_indicators: Json | null
          id: string
          ideal_collaboration_profiles: Json | null
          innovation_indicators: Json | null
          last_analysis_date: string | null
          narrative_authenticity_score: number | null
          professional_credibility_score: number | null
          professional_growth_trajectory: Json | null
          requires_human_review: boolean | null
          story_engagement_quality: number | null
          storyteller_id: string | null
          updated_at: string | null
        }
        Insert: {
          aboriginal_protocol_adherence?: number | null
          analysis_completeness?: number | null
          collaboration_style?: Json | null
          community_centered_approach?: number | null
          community_impact_potential?: number | null
          core_expertise_areas?: Json | null
          created_at?: string | null
          cultural_competency_level?: string | null
          cultural_sensitivity_indicators?: Json | null
          id?: string
          ideal_collaboration_profiles?: Json | null
          innovation_indicators?: Json | null
          last_analysis_date?: string | null
          narrative_authenticity_score?: number | null
          professional_credibility_score?: number | null
          professional_growth_trajectory?: Json | null
          requires_human_review?: boolean | null
          story_engagement_quality?: number | null
          storyteller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aboriginal_protocol_adherence?: number | null
          analysis_completeness?: number | null
          collaboration_style?: Json | null
          community_centered_approach?: number | null
          community_impact_potential?: number | null
          core_expertise_areas?: Json | null
          created_at?: string | null
          cultural_competency_level?: string | null
          cultural_sensitivity_indicators?: Json | null
          id?: string
          ideal_collaboration_profiles?: Json | null
          innovation_indicators?: Json | null
          last_analysis_date?: string | null
          narrative_authenticity_score?: number | null
          professional_credibility_score?: number | null
          professional_growth_trajectory?: Json | null
          requires_human_review?: boolean | null
          story_engagement_quality?: number | null
          storyteller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyteller_ai_intelligence_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      storyteller_connections: {
        Row: {
          connection_type: string
          created_at: string | null
          id: string
          match_basis: Json | null
          mutual_consent: boolean | null
          status: string | null
          storyteller_a: string | null
          storyteller_b: string | null
          strength_score: number | null
          updated_at: string | null
        }
        Insert: {
          connection_type: string
          created_at?: string | null
          id?: string
          match_basis?: Json | null
          mutual_consent?: boolean | null
          status?: string | null
          storyteller_a?: string | null
          storyteller_b?: string | null
          strength_score?: number | null
          updated_at?: string | null
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          id?: string
          match_basis?: Json | null
          mutual_consent?: boolean | null
          status?: string | null
          storyteller_a?: string | null
          storyteller_b?: string | null
          strength_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyteller_connections_storyteller_a_fkey"
            columns: ["storyteller_a"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyteller_connections_storyteller_b_fkey"
            columns: ["storyteller_b"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      storyteller_media: {
        Row: {
          alt_text: string | null
          associated_stories: string[] | null
          created_at: string | null
          cultural_protocol: string
          description: string | null
          dimensions: Json | null
          duration: number | null
          file_size: number
          id: string
          metadata: Json | null
          storyteller_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          url: string
          usage_rights: string
        }
        Insert: {
          alt_text?: string | null
          associated_stories?: string[] | null
          created_at?: string | null
          cultural_protocol?: string
          description?: string | null
          dimensions?: Json | null
          duration?: number | null
          file_size: number
          id?: string
          metadata?: Json | null
          storyteller_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          url: string
          usage_rights?: string
        }
        Update: {
          alt_text?: string | null
          associated_stories?: string[] | null
          created_at?: string | null
          cultural_protocol?: string
          description?: string | null
          dimensions?: Json | null
          duration?: number | null
          file_size?: number
          id?: string
          metadata?: Json | null
          storyteller_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string
          usage_rights?: string
        }
        Relationships: [
          {
            foreignKeyName: "storyteller_media_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      storyteller_videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          platform: string | null
          storyteller_id: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          platform?: string | null
          storyteller_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url: string
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          platform?: string | null
          storyteller_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyteller_videos_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      storytellers: {
        Row: {
          achievements_mentioned: string[] | null
          advice_given: string[] | null
          affiliations_expressed: string[] | null
          age_range: string | null
          airtable_record_id: string | null
          aspirations: string[] | null
          assistance_types: Json | null
          attribution_preferences: Json | null
          available_for_collaboration: boolean | null
          bio: string | null
          capabilities_mentioned: Json | null
          challenges_faced: string[] | null
          community_roles: string[] | null
          consent_date: string | null
          consent_expiry: string | null
          consent_given: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          cultural_background: string | null
          cultural_communities: string[] | null
          current_organization: string | null
          current_role: string | null
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          expertise_areas: string[] | null
          full_name: string
          generated_themes: string[] | null
          generational_connections: string[] | null
          geographic_connections: string[] | null
          growth_areas: string[] | null
          id: string
          impact_stories: Json[] | null
          impact_story_promotion: boolean | null
          industry_sectors: Json | null
          influence_areas: string[] | null
          institutional_connections: Json[] | null
          interested_in_peer_support: boolean | null
          key_insights: string[] | null
          knowledge_shared: string[] | null
          language_communities: string[] | null
          leadership_expressions: string[] | null
          learning_interests: string[] | null
          life_lessons: string[] | null
          life_motto: string | null
          linkedin_profile_url: string | null
          location: string | null
          location_id: string | null
          media_type: string | null
          media_url: string | null
          mission_statements: string[] | null
          narrative_ownership_level: string | null
          networks_accessible: string[] | null
          notion_id: string | null
          open_to_mentoring: boolean | null
          organization_id: string | null
          organizations_mentioned: Json[] | null
          outcomes_described: string[] | null
          partnerships_described: string[] | null
          personal_goals: string[] | null
          personal_statement: string | null
          philosophical_expressions: string[] | null
          phone_number: string | null
          platform_benefit_sharing: Json | null
          preferred_pronouns: string | null
          privacy_preferences: Json | null
          professional_summary: string | null
          profile_image_alt_text: string | null
          profile_image_file: string | null
          profile_image_url: string | null
          project_id: string | null
          quote_sharing_consent: boolean | null
          resources_available: string[] | null
          resume_url: string | null
          role: string | null
          seeking_organizational_connections: boolean | null
          skills_discovered: Json | null
          story_use_permissions: Json | null
          story_visibility_level: string | null
          support_needed: Json | null
          support_offered: Json | null
          transcript: string | null
          transformation_stories: Json[] | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          vision_expressions: string[] | null
          website_url: string | null
          wisdom_sharing_level: string | null
          years_of_experience: number | null
        }
        Insert: {
          achievements_mentioned?: string[] | null
          advice_given?: string[] | null
          affiliations_expressed?: string[] | null
          age_range?: string | null
          airtable_record_id?: string | null
          aspirations?: string[] | null
          assistance_types?: Json | null
          attribution_preferences?: Json | null
          available_for_collaboration?: boolean | null
          bio?: string | null
          capabilities_mentioned?: Json | null
          challenges_faced?: string[] | null
          community_roles?: string[] | null
          consent_date?: string | null
          consent_expiry?: string | null
          consent_given?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          cultural_background?: string | null
          cultural_communities?: string[] | null
          current_organization?: string | null
          current_role?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          expertise_areas?: string[] | null
          full_name: string
          generated_themes?: string[] | null
          generational_connections?: string[] | null
          geographic_connections?: string[] | null
          growth_areas?: string[] | null
          id?: string
          impact_stories?: Json[] | null
          impact_story_promotion?: boolean | null
          industry_sectors?: Json | null
          influence_areas?: string[] | null
          institutional_connections?: Json[] | null
          interested_in_peer_support?: boolean | null
          key_insights?: string[] | null
          knowledge_shared?: string[] | null
          language_communities?: string[] | null
          leadership_expressions?: string[] | null
          learning_interests?: string[] | null
          life_lessons?: string[] | null
          life_motto?: string | null
          linkedin_profile_url?: string | null
          location?: string | null
          location_id?: string | null
          media_type?: string | null
          media_url?: string | null
          mission_statements?: string[] | null
          narrative_ownership_level?: string | null
          networks_accessible?: string[] | null
          notion_id?: string | null
          open_to_mentoring?: boolean | null
          organization_id?: string | null
          organizations_mentioned?: Json[] | null
          outcomes_described?: string[] | null
          partnerships_described?: string[] | null
          personal_goals?: string[] | null
          personal_statement?: string | null
          philosophical_expressions?: string[] | null
          phone_number?: string | null
          platform_benefit_sharing?: Json | null
          preferred_pronouns?: string | null
          privacy_preferences?: Json | null
          professional_summary?: string | null
          profile_image_alt_text?: string | null
          profile_image_file?: string | null
          profile_image_url?: string | null
          project_id?: string | null
          quote_sharing_consent?: boolean | null
          resources_available?: string[] | null
          resume_url?: string | null
          role?: string | null
          seeking_organizational_connections?: boolean | null
          skills_discovered?: Json | null
          story_use_permissions?: Json | null
          story_visibility_level?: string | null
          support_needed?: Json | null
          support_offered?: Json | null
          transcript?: string | null
          transformation_stories?: Json[] | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          vision_expressions?: string[] | null
          website_url?: string | null
          wisdom_sharing_level?: string | null
          years_of_experience?: number | null
        }
        Update: {
          achievements_mentioned?: string[] | null
          advice_given?: string[] | null
          affiliations_expressed?: string[] | null
          age_range?: string | null
          airtable_record_id?: string | null
          aspirations?: string[] | null
          assistance_types?: Json | null
          attribution_preferences?: Json | null
          available_for_collaboration?: boolean | null
          bio?: string | null
          capabilities_mentioned?: Json | null
          challenges_faced?: string[] | null
          community_roles?: string[] | null
          consent_date?: string | null
          consent_expiry?: string | null
          consent_given?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          cultural_background?: string | null
          cultural_communities?: string[] | null
          current_organization?: string | null
          current_role?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          expertise_areas?: string[] | null
          full_name?: string
          generated_themes?: string[] | null
          generational_connections?: string[] | null
          geographic_connections?: string[] | null
          growth_areas?: string[] | null
          id?: string
          impact_stories?: Json[] | null
          impact_story_promotion?: boolean | null
          industry_sectors?: Json | null
          influence_areas?: string[] | null
          institutional_connections?: Json[] | null
          interested_in_peer_support?: boolean | null
          key_insights?: string[] | null
          knowledge_shared?: string[] | null
          language_communities?: string[] | null
          leadership_expressions?: string[] | null
          learning_interests?: string[] | null
          life_lessons?: string[] | null
          life_motto?: string | null
          linkedin_profile_url?: string | null
          location?: string | null
          location_id?: string | null
          media_type?: string | null
          media_url?: string | null
          mission_statements?: string[] | null
          narrative_ownership_level?: string | null
          networks_accessible?: string[] | null
          notion_id?: string | null
          open_to_mentoring?: boolean | null
          organization_id?: string | null
          organizations_mentioned?: Json[] | null
          outcomes_described?: string[] | null
          partnerships_described?: string[] | null
          personal_goals?: string[] | null
          personal_statement?: string | null
          philosophical_expressions?: string[] | null
          phone_number?: string | null
          platform_benefit_sharing?: Json | null
          preferred_pronouns?: string | null
          privacy_preferences?: Json | null
          professional_summary?: string | null
          profile_image_alt_text?: string | null
          profile_image_file?: string | null
          profile_image_url?: string | null
          project_id?: string | null
          quote_sharing_consent?: boolean | null
          resources_available?: string[] | null
          resume_url?: string | null
          role?: string | null
          seeking_organizational_connections?: boolean | null
          skills_discovered?: Json | null
          story_use_permissions?: Json | null
          story_visibility_level?: string | null
          support_needed?: Json | null
          support_offered?: Json | null
          transcript?: string | null
          transformation_stories?: Json[] | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          vision_expressions?: string[] | null
          website_url?: string | null
          wisdom_sharing_level?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "storytellers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storytellers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storytellers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "storytellers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_analytics: {
        Row: {
          actual_cost: number | null
          analyzed_at: string | null
          confidence: number | null
          created_at: string | null
          estimated_value: number | null
          id: string
          last_used_date: string | null
          recommendation: string | null
          recommendation_reason: string | null
          subscription_id: string
          tenant_id: string
          usage_frequency: string | null
          value_score: number | null
        }
        Insert: {
          actual_cost?: number | null
          analyzed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          last_used_date?: string | null
          recommendation?: string | null
          recommendation_reason?: string | null
          subscription_id: string
          tenant_id: string
          usage_frequency?: string | null
          value_score?: number | null
        }
        Update: {
          actual_cost?: number | null
          analyzed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          last_used_date?: string | null
          recommendation?: string | null
          recommendation_reason?: string | null
          subscription_id?: string
          tenant_id?: string
          usage_frequency?: string | null
          value_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_analytics_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "discovered_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_receipts: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          extracted_amount: number | null
          extracted_date: string | null
          extracted_vendor: string | null
          file_type: string | null
          file_url: string | null
          gmail_message_id: string | null
          id: string
          ner_entities: Json | null
          ocr_confidence: number | null
          ocr_text: string | null
          receipt_date: string | null
          reconciliation_confidence: number | null
          reconciliation_date: string | null
          reconciliation_status: string | null
          source: string | null
          subscription_id: string
          xero_transaction_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_vendor?: string | null
          file_type?: string | null
          file_url?: string | null
          gmail_message_id?: string | null
          id?: string
          ner_entities?: Json | null
          ocr_confidence?: number | null
          ocr_text?: string | null
          receipt_date?: string | null
          reconciliation_confidence?: number | null
          reconciliation_date?: string | null
          reconciliation_status?: string | null
          source?: string | null
          subscription_id: string
          xero_transaction_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_vendor?: string | null
          file_type?: string | null
          file_url?: string | null
          gmail_message_id?: string | null
          id?: string
          ner_entities?: Json | null
          ocr_confidence?: number | null
          ocr_text?: string | null
          receipt_date?: string | null
          reconciliation_confidence?: number | null
          reconciliation_date?: string | null
          reconciliation_status?: string | null
          source?: string | null
          subscription_id?: string
          xero_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_receipts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "discovered_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_feedback: {
        Row: {
          action: string
          admin_notes: string | null
          created_at: string | null
          final_role: string | null
          id: string
          original_role: string | null
          reviewed_by: string | null
          suggestion_id: string
        }
        Insert: {
          action: string
          admin_notes?: string | null
          created_at?: string | null
          final_role?: string | null
          id?: string
          original_role?: string | null
          reviewed_by?: string | null
          suggestion_id: string
        }
        Update: {
          action?: string
          admin_notes?: string | null
          created_at?: string | null
          final_role?: string | null
          id?: string
          original_role?: string | null
          reviewed_by?: string | null
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_feedback_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_feedback_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "content_link_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_matches: {
        Row: {
          created_at: string | null
          id: string
          match_confidence: number | null
          seeker_id: string | null
          status: string | null
          support_description: string
          support_type: string
          supporter_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          seeker_id?: string | null
          status?: string | null
          support_description: string
          support_type: string
          supporter_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          seeker_id?: string | null
          status?: string | null
          support_description?: string
          support_type?: string
          supporter_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_matches_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_matches_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_events: {
        Row: {
          batch_id: string | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          max_retries: number | null
          operation_data: Json
          priority: number | null
          processed_at: string | null
          record_id: string
          retry_count: number | null
          sync_status: string | null
          sync_target: string
          table_name: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          max_retries?: number | null
          operation_data: Json
          priority?: number | null
          processed_at?: string | null
          record_id: string
          retry_count?: number | null
          sync_status?: string | null
          sync_target: string
          table_name: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          max_retries?: number | null
          operation_data?: Json
          priority?: number | null
          processed_at?: string | null
          record_id?: string
          retry_count?: number | null
          sync_status?: string | null
          sync_target?: string
          table_name?: string
        }
        Relationships: []
      }
      sync_state: {
        Row: {
          created_at: string
          error_count: number | null
          id: string
          last_error: string | null
          last_sync_at: string
          last_sync_token: string | null
          metadata: Json | null
          next_page_token: string | null
          state: Json | null
          sync_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_count?: number | null
          id: string
          last_error?: string | null
          last_sync_at?: string
          last_sync_token?: string | null
          metadata?: Json | null
          next_page_token?: string | null
          state?: Json | null
          sync_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_sync_at?: string
          last_sync_token?: string | null
          metadata?: Json | null
          next_page_token?: string | null
          state?: Json | null
          sync_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tag_inference_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          match_value: string
          priority: number | null
          rule_type: string
          tags: string[]
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          match_value: string
          priority?: number | null
          rule_type: string
          tags: string[]
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          match_value?: string
          priority?: number | null
          rule_type?: string
          tags?: string[]
        }
        Relationships: []
      }
      themes: {
        Row: {
          ai_confidence_threshold: number | null
          category: string | null
          created_at: string | null
          cultural_context: string[] | null
          description: string | null
          id: string
          level: number | null
          name: string
          parent_theme_id: string | null
          requires_cultural_review: boolean | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          ai_confidence_threshold?: number | null
          category?: string | null
          created_at?: string | null
          cultural_context?: string[] | null
          description?: string | null
          id?: string
          level?: number | null
          name: string
          parent_theme_id?: string | null
          requires_cultural_review?: boolean | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          ai_confidence_threshold?: number | null
          category?: string | null
          created_at?: string | null
          cultural_context?: string[] | null
          description?: string | null
          id?: string
          level?: number | null
          name?: string
          parent_theme_id?: string | null
          requires_cultural_review?: boolean | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "themes_parent_theme_id_fkey"
            columns: ["parent_theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      touchpoints: {
        Row: {
          contact_email: string | null
          contact_id: number | null
          contact_name: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          occurred_at: string | null
          project_id: string | null
          project_name: string | null
          source: string
          source_id: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_id?: number | null
          contact_name?: string | null
          created_at?: string | null
          id: string
          metadata?: Json | null
          occurred_at?: string | null
          project_id?: string | null
          project_name?: string | null
          source: string
          source_id?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_id?: number | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          project_id?: string | null
          project_name?: string | null
          source?: string
          source_id?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_dataset: {
        Row: {
          brand_voice_score: number | null
          completion: string
          content_type: string
          created_at: string | null
          cultural_safety_score: number | null
          difficulty_level: string | null
          id: string
          included_in_training_run: string[] | null
          last_used_for_training: string | null
          overall_quality_score: number | null
          project_slug: string | null
          prompt: string
          tags: string[] | null
          themes: string[] | null
          usage_count: number | null
          verification_id: string | null
        }
        Insert: {
          brand_voice_score?: number | null
          completion: string
          content_type: string
          created_at?: string | null
          cultural_safety_score?: number | null
          difficulty_level?: string | null
          id?: string
          included_in_training_run?: string[] | null
          last_used_for_training?: string | null
          overall_quality_score?: number | null
          project_slug?: string | null
          prompt: string
          tags?: string[] | null
          themes?: string[] | null
          usage_count?: number | null
          verification_id?: string | null
        }
        Update: {
          brand_voice_score?: number | null
          completion?: string
          content_type?: string
          created_at?: string | null
          cultural_safety_score?: number | null
          difficulty_level?: string | null
          id?: string
          included_in_training_run?: string[] | null
          last_used_for_training?: string | null
          overall_quality_score?: number | null
          project_slug?: string | null
          prompt?: string
          tags?: string[] | null
          themes?: string[] | null
          usage_count?: number | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_dataset_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "ai_content_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_dataset_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "training_ready_content"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_analysis: {
        Row: {
          ai_model_used: string
          analysis_type: string
          analysis_version: string | null
          approved_for_use: boolean | null
          confidence_score: number | null
          created_at: string | null
          cultural_elements: Json | null
          cultural_review_required: boolean | null
          human_reviewed: boolean | null
          id: string
          insights: string[] | null
          key_quotes: string[] | null
          key_topics: string[] | null
          primary_emotions: string[] | null
          processing_notes: string | null
          processing_status: string | null
          processing_time_seconds: number | null
          quality_score: number | null
          results: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sensitivity_flags: string[] | null
          storyteller_id: string | null
          summary: string | null
          themes_identified: string[] | null
          transcript_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model_used: string
          analysis_type: string
          analysis_version?: string | null
          approved_for_use?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          cultural_elements?: Json | null
          cultural_review_required?: boolean | null
          human_reviewed?: boolean | null
          id?: string
          insights?: string[] | null
          key_quotes?: string[] | null
          key_topics?: string[] | null
          primary_emotions?: string[] | null
          processing_notes?: string | null
          processing_status?: string | null
          processing_time_seconds?: number | null
          quality_score?: number | null
          results: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitivity_flags?: string[] | null
          storyteller_id?: string | null
          summary?: string | null
          themes_identified?: string[] | null
          transcript_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model_used?: string
          analysis_type?: string
          analysis_version?: string | null
          approved_for_use?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          cultural_elements?: Json | null
          cultural_review_required?: boolean | null
          human_reviewed?: boolean | null
          id?: string
          insights?: string[] | null
          key_quotes?: string[] | null
          key_topics?: string[] | null
          primary_emotions?: string[] | null
          processing_notes?: string | null
          processing_status?: string | null
          processing_time_seconds?: number | null
          quality_score?: number | null
          results?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitivity_flags?: string[] | null
          storyteller_id?: string | null
          summary?: string | null
          themes_identified?: string[] | null
          transcript_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_analysis_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_analysis_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_analysis_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_usage: {
        Row: {
          content_id: string | null
          content_type: string | null
          source_end_position: number | null
          source_start_position: number | null
          transcript_id: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          source_end_position?: number | null
          source_start_position?: number | null
          transcript_id?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          source_end_position?: number | null
          source_start_position?: number | null
          transcript_id?: string | null
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          access_restrictions: string[] | null
          analysis_completed_date: string | null
          analysis_quality_score: number | null
          analysis_requested_date: string | null
          character_count: number | null
          collection_date: string | null
          collection_method: string | null
          consent_date: string | null
          consent_for_ai_analysis: boolean | null
          consent_for_quote_extraction: boolean | null
          consent_for_story_creation: boolean | null
          consent_for_theme_analysis: boolean | null
          consent_notes: string | null
          content_warnings: string[] | null
          created_at: string | null
          cultural_considerations: string | null
          duration_minutes: number | null
          id: string
          interviewer_name: string | null
          language: string | null
          last_processed_date: string | null
          last_story_creation_date: string | null
          location: string | null
          original_file_format: string | null
          original_file_size_mb: number | null
          privacy_level: string | null
          processing_notes: string | null
          processing_status: string | null
          ready_for_analysis: boolean | null
          requires_cultural_review: boolean | null
          safety_notes: string | null
          safety_review_status: string | null
          stories_created_count: number | null
          storyteller_approved_content: boolean | null
          storyteller_id: string
          transcript_content: string
          transcript_type: string | null
          transcription_confidence_score: number | null
          transcription_method: string | null
          trauma_informed_considerations: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          access_restrictions?: string[] | null
          analysis_completed_date?: string | null
          analysis_quality_score?: number | null
          analysis_requested_date?: string | null
          character_count?: number | null
          collection_date?: string | null
          collection_method?: string | null
          consent_date?: string | null
          consent_for_ai_analysis?: boolean | null
          consent_for_quote_extraction?: boolean | null
          consent_for_story_creation?: boolean | null
          consent_for_theme_analysis?: boolean | null
          consent_notes?: string | null
          content_warnings?: string[] | null
          created_at?: string | null
          cultural_considerations?: string | null
          duration_minutes?: number | null
          id?: string
          interviewer_name?: string | null
          language?: string | null
          last_processed_date?: string | null
          last_story_creation_date?: string | null
          location?: string | null
          original_file_format?: string | null
          original_file_size_mb?: number | null
          privacy_level?: string | null
          processing_notes?: string | null
          processing_status?: string | null
          ready_for_analysis?: boolean | null
          requires_cultural_review?: boolean | null
          safety_notes?: string | null
          safety_review_status?: string | null
          stories_created_count?: number | null
          storyteller_approved_content?: boolean | null
          storyteller_id: string
          transcript_content: string
          transcript_type?: string | null
          transcription_confidence_score?: number | null
          transcription_method?: string | null
          trauma_informed_considerations?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          access_restrictions?: string[] | null
          analysis_completed_date?: string | null
          analysis_quality_score?: number | null
          analysis_requested_date?: string | null
          character_count?: number | null
          collection_date?: string | null
          collection_method?: string | null
          consent_date?: string | null
          consent_for_ai_analysis?: boolean | null
          consent_for_quote_extraction?: boolean | null
          consent_for_story_creation?: boolean | null
          consent_for_theme_analysis?: boolean | null
          consent_notes?: string | null
          content_warnings?: string[] | null
          created_at?: string | null
          cultural_considerations?: string | null
          duration_minutes?: number | null
          id?: string
          interviewer_name?: string | null
          language?: string | null
          last_processed_date?: string | null
          last_story_creation_date?: string | null
          location?: string | null
          original_file_format?: string | null
          original_file_size_mb?: number | null
          privacy_level?: string | null
          processing_notes?: string | null
          processing_status?: string | null
          ready_for_analysis?: boolean | null
          requires_cultural_review?: boolean | null
          safety_notes?: string | null
          safety_review_status?: string | null
          stories_created_count?: number | null
          storyteller_approved_content?: boolean | null
          storyteller_id?: string
          transcript_content?: string
          transcript_type?: string | null
          transcription_confidence_score?: number | null
          transcription_method?: string | null
          trauma_informed_considerations?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_insights: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          average_session_duration: number | null
          calculation_version: string | null
          collaboration_effectiveness_score: number | null
          collaboration_initiated: number | null
          collaboration_matches: Json | null
          collaboration_patterns: Json | null
          community_contribution_score: number | null
          content_interactions_total: number | null
          content_preferences: Json | null
          content_quality_score: number | null
          created_at: string | null
          data_sharing_consent: boolean | null
          engagement_patterns: Json | null
          engagement_score: number | null
          id: string
          insights_consent: boolean | null
          last_calculated_at: string | null
          page_views_total: number | null
          platform_usage_patterns: Json | null
          predicted_interests: Json | null
          recommended_projects: Json | null
          total_session_time: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          average_session_duration?: number | null
          calculation_version?: string | null
          collaboration_effectiveness_score?: number | null
          collaboration_initiated?: number | null
          collaboration_matches?: Json | null
          collaboration_patterns?: Json | null
          community_contribution_score?: number | null
          content_interactions_total?: number | null
          content_preferences?: Json | null
          content_quality_score?: number | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          engagement_patterns?: Json | null
          engagement_score?: number | null
          id?: string
          insights_consent?: boolean | null
          last_calculated_at?: string | null
          page_views_total?: number | null
          platform_usage_patterns?: Json | null
          predicted_interests?: Json | null
          recommended_projects?: Json | null
          total_session_time?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          average_session_duration?: number | null
          calculation_version?: string | null
          collaboration_effectiveness_score?: number | null
          collaboration_initiated?: number | null
          collaboration_matches?: Json | null
          collaboration_patterns?: Json | null
          community_contribution_score?: number | null
          content_interactions_total?: number | null
          content_preferences?: Json | null
          content_quality_score?: number | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          engagement_patterns?: Json | null
          engagement_score?: number | null
          id?: string
          insights_consent?: boolean | null
          last_calculated_at?: string | null
          page_views_total?: number | null
          platform_usage_patterns?: Json | null
          predicted_interests?: Json | null
          recommended_projects?: Json | null
          total_session_time?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_community_engagement: {
        Row: {
          availability: Json | null
          contribution_areas: Json | null
          created_at: string | null
          cultural_considerations: Json | null
          ethical_guidelines: Json | null
          id: string
          leadership_interests: Json | null
          participation_style: Json | null
          skill_sharing_preferences: Json | null
          updated_at: string | null
          user_profile_id: string
        }
        Insert: {
          availability?: Json | null
          contribution_areas?: Json | null
          created_at?: string | null
          cultural_considerations?: Json | null
          ethical_guidelines?: Json | null
          id?: string
          leadership_interests?: Json | null
          participation_style?: Json | null
          skill_sharing_preferences?: Json | null
          updated_at?: string | null
          user_profile_id: string
        }
        Update: {
          availability?: Json | null
          contribution_areas?: Json | null
          created_at?: string | null
          cultural_considerations?: Json | null
          ethical_guidelines?: Json | null
          id?: string
          leadership_interests?: Json | null
          participation_style?: Json | null
          skill_sharing_preferences?: Json | null
          updated_at?: string | null
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_community_engagement_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_summary"
            referencedColumns: ["user_profile_id"]
          },
          {
            foreignKeyName: "user_community_engagement_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          accessibility_needs: Json | null
          account_status: string | null
          avatar_url: string | null
          bio: string | null
          collaboration_preferences: Json | null
          content_preferences: Json | null
          created_at: string | null
          cultural_protocols: Json | null
          dashboard_layout: Json | null
          display_name: string | null
          email: string | null
          expertise_areas: Json | null
          id: string
          interests: Json | null
          last_active_at: string | null
          location: Json | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          preferred_languages: Json | null
          privacy_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accessibility_needs?: Json | null
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          collaboration_preferences?: Json | null
          content_preferences?: Json | null
          created_at?: string | null
          cultural_protocols?: Json | null
          dashboard_layout?: Json | null
          display_name?: string | null
          email?: string | null
          expertise_areas?: Json | null
          id?: string
          interests?: Json | null
          last_active_at?: string | null
          location?: Json | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          preferred_languages?: Json | null
          privacy_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accessibility_needs?: Json | null
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          collaboration_preferences?: Json | null
          content_preferences?: Json | null
          created_at?: string | null
          cultural_protocols?: Json | null
          dashboard_layout?: Json | null
          display_name?: string | null
          email?: string | null
          expertise_areas?: Json | null
          id?: string
          interests?: Json | null
          last_active_at?: string | null
          location?: Json | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          preferred_languages?: Json | null
          privacy_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_project_preferences: {
        Row: {
          collaboration_interest: Json | null
          created_at: string | null
          engagement_level: string | null
          id: string
          notification_enabled: boolean | null
          preference_type: string
          project_id: string
          updated_at: string | null
          user_profile_id: string
        }
        Insert: {
          collaboration_interest?: Json | null
          created_at?: string | null
          engagement_level?: string | null
          id?: string
          notification_enabled?: boolean | null
          preference_type: string
          project_id: string
          updated_at?: string | null
          user_profile_id: string
        }
        Update: {
          collaboration_interest?: Json | null
          created_at?: string | null
          engagement_level?: string | null
          id?: string
          notification_enabled?: boolean | null
          preference_type?: string
          project_id?: string
          updated_at?: string | null
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_project_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_impact_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "user_project_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_project_preferences_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_summary"
            referencedColumns: ["user_profile_id"]
          },
          {
            foreignKeyName: "user_project_preferences_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string
          permissions: string[] | null
          updated_at: string | null
          user_role: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash: string
          permissions?: string[] | null
          updated_at?: string | null
          user_role?: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string
          permissions?: string[] | null
          updated_at?: string | null
          user_role?: string
          username?: string
        }
        Relationships: []
      }
      vendor_contact_log: {
        Row: {
          created_at: string | null
          email_body: string | null
          email_subject: string | null
          error_message: string | null
          gmail_message_id: string | null
          gmail_thread_id: string | null
          id: string
          last_retry_at: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          subscription_id: string
          updated_at: string | null
          vendor_email: string
        }
        Insert: {
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          error_message?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          last_retry_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subscription_id: string
          updated_at?: string | null
          vendor_email: string
        }
        Update: {
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          error_message?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          last_retry_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subscription_id?: string
          updated_at?: string | null
          vendor_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contact_log_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "discovered_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_embeds: {
        Row: {
          autoplay: boolean | null
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          embed_url: string
          id: string
          is_featured: boolean | null
          link_id: string | null
          link_type: string | null
          platform: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          video_id: string
        }
        Insert: {
          autoplay?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          embed_url: string
          id?: string
          is_featured?: boolean | null
          link_id?: string | null
          link_type?: string | null
          platform: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_id: string
        }
        Update: {
          autoplay?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          embed_url?: string
          id?: string
          is_featured?: boolean | null
          link_id?: string | null
          link_type?: string | null
          platform?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_id?: string
        }
        Relationships: []
      }
      volunteer_hours: {
        Row: {
          activity: string
          created_at: string | null
          date: string
          ghl_contact_id: string | null
          hours: number
          id: string
          project: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          date: string
          ghl_contact_id?: string | null
          hours: number
          id?: string
          project?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          date?: string
          ghl_contact_id?: string | null
          hours?: number
          id?: string
          project?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_hours_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "ghl_contacts"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "volunteer_hours_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_with_protocols"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "volunteer_hours_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_donor_summary"
            referencedColumns: ["ghl_id"]
          },
          {
            foreignKeyName: "volunteer_hours_ghl_contact_id_fkey"
            columns: ["ghl_contact_id"]
            isOneToOne: false
            referencedRelation: "v_volunteer_summary"
            referencedColumns: ["ghl_id"]
          },
        ]
      }
      volunteer_interest: {
        Row: {
          availability: string | null
          created_at: string | null
          email: string
          experience_level: string | null
          id: string
          interests: string[] | null
          location: string | null
          message: string | null
          name: string
          phone: string | null
          preferred_contribution: string | null
          skills: string[] | null
          status: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          email: string
          experience_level?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          message?: string | null
          name: string
          phone?: string | null
          preferred_contribution?: string | null
          skills?: string[] | null
          status?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          email?: string
          experience_level?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          preferred_contribution?: string | null
          skills?: string[] | null
          status?: string | null
        }
        Relationships: []
      }
      wiki_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          priority: string | null
          queue_item_id: string | null
          read_at: string | null
          title: string
          type: string
          wiki_page_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          priority?: string | null
          queue_item_id?: string | null
          read_at?: string | null
          title: string
          type: string
          wiki_page_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          queue_item_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          wiki_page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_notifications_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_extraction_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_notifications_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "pending_extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_notifications_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_notifications_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_notifications_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_page_links: {
        Row: {
          created_at: string | null
          from_page_id: string
          id: string
          link_type: string | null
          to_page_id: string
        }
        Insert: {
          created_at?: string | null
          from_page_id: string
          id?: string
          link_type?: string | null
          to_page_id: string
        }
        Update: {
          created_at?: string | null
          from_page_id?: string
          id?: string
          link_type?: string | null
          to_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_page_links_from_page_id_fkey"
            columns: ["from_page_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_page_links_from_page_id_fkey"
            columns: ["from_page_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_page_links_from_page_id_fkey"
            columns: ["from_page_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_page_links_to_page_id_fkey"
            columns: ["to_page_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_page_links_to_page_id_fkey"
            columns: ["to_page_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_page_links_to_page_id_fkey"
            columns: ["to_page_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_page_versions: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          page_id: string
          title: string
          version: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          page_id: string
          title: string
          version: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          page_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "wiki_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_pages: {
        Row: {
          approval_confidence: number | null
          auto_approved: boolean | null
          content: string
          content_embedding: string | null
          created_at: string | null
          domains: string[] | null
          excerpt: string | null
          extracted_from_ids: string[] | null
          id: string
          last_reviewed_at: string | null
          last_viewed_at: string | null
          next_review_due: string | null
          notion_page_id: string | null
          page_type: string
          parent_method_id: string | null
          parent_practice_id: string | null
          parent_principle_id: string | null
          projects: string[] | null
          quality_score: number | null
          review_frequency_days: number | null
          search_vector: unknown
          slug: string
          source_types: string[] | null
          source_urls: string[] | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          verified_at: string | null
          verified_by: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          approval_confidence?: number | null
          auto_approved?: boolean | null
          content: string
          content_embedding?: string | null
          created_at?: string | null
          domains?: string[] | null
          excerpt?: string | null
          extracted_from_ids?: string[] | null
          id?: string
          last_reviewed_at?: string | null
          last_viewed_at?: string | null
          next_review_due?: string | null
          notion_page_id?: string | null
          page_type: string
          parent_method_id?: string | null
          parent_practice_id?: string | null
          parent_principle_id?: string | null
          projects?: string[] | null
          quality_score?: number | null
          review_frequency_days?: number | null
          search_vector?: unknown
          slug: string
          source_types?: string[] | null
          source_urls?: string[] | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          approval_confidence?: number | null
          auto_approved?: boolean | null
          content?: string
          content_embedding?: string | null
          created_at?: string | null
          domains?: string[] | null
          excerpt?: string | null
          extracted_from_ids?: string[] | null
          id?: string
          last_reviewed_at?: string | null
          last_viewed_at?: string | null
          next_review_due?: string | null
          notion_page_id?: string | null
          page_type?: string
          parent_method_id?: string | null
          parent_practice_id?: string | null
          parent_principle_id?: string | null
          projects?: string[] | null
          quality_score?: number | null
          review_frequency_days?: number | null
          search_vector?: unknown
          slug?: string
          source_types?: string[] | null
          source_urls?: string[] | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_pages_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      wisdom_extracts: {
        Row: {
          ai_confidence_score: number | null
          attribution_required: boolean | null
          context_after: string | null
          context_before: string | null
          context_required: boolean | null
          created_at: string | null
          cultural_appropriateness_score: number | null
          emotional_tone: string | null
          extracted_quote: string
          human_validated: boolean | null
          id: string
          life_stage: string | null
          relevance_keywords: string[] | null
          sharing_approved: boolean | null
          storyteller_id: string | null
          themes: string[] | null
          transcript_analysis_id: string | null
          updated_at: string | null
          validation_notes: string | null
          wisdom_type: Database["public"]["Enums"]["wisdom_type_enum"]
        }
        Insert: {
          ai_confidence_score?: number | null
          attribution_required?: boolean | null
          context_after?: string | null
          context_before?: string | null
          context_required?: boolean | null
          created_at?: string | null
          cultural_appropriateness_score?: number | null
          emotional_tone?: string | null
          extracted_quote: string
          human_validated?: boolean | null
          id?: string
          life_stage?: string | null
          relevance_keywords?: string[] | null
          sharing_approved?: boolean | null
          storyteller_id?: string | null
          themes?: string[] | null
          transcript_analysis_id?: string | null
          updated_at?: string | null
          validation_notes?: string | null
          wisdom_type: Database["public"]["Enums"]["wisdom_type_enum"]
        }
        Update: {
          ai_confidence_score?: number | null
          attribution_required?: boolean | null
          context_after?: string | null
          context_before?: string | null
          context_required?: boolean | null
          created_at?: string | null
          cultural_appropriateness_score?: number | null
          emotional_tone?: string | null
          extracted_quote?: string
          human_validated?: boolean | null
          id?: string
          life_stage?: string | null
          relevance_keywords?: string[] | null
          sharing_approved?: boolean | null
          storyteller_id?: string | null
          themes?: string[] | null
          transcript_analysis_id?: string | null
          updated_at?: string | null
          validation_notes?: string | null
          wisdom_type?: Database["public"]["Enums"]["wisdom_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "wisdom_extracts_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wisdom_extracts_transcript_analysis_id_fkey"
            columns: ["transcript_analysis_id"]
            isOneToOne: false
            referencedRelation: "transcript_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      wisdom_insights: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          insight_text: string
          life_area: string | null
          sharing_level: string | null
          source_story: string | null
          source_transcript: string | null
          storyteller_id: string | null
          universality_score: number | null
          updated_at: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          insight_text: string
          life_area?: string | null
          sharing_level?: string | null
          source_story?: string | null
          source_transcript?: string | null
          storyteller_id?: string | null
          universality_score?: number | null
          updated_at?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          insight_text?: string
          life_area?: string | null
          sharing_level?: string | null
          source_story?: string | null
          source_transcript?: string | null
          storyteller_id?: string | null
          universality_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wisdom_insights_source_transcript_fkey"
            columns: ["source_transcript"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wisdom_insights_storyteller_id_fkey"
            columns: ["storyteller_id"]
            isOneToOne: false
            referencedRelation: "storytellers"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_bank_transactions: {
        Row: {
          bank_account_id: string | null
          bank_account_name: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          date: string | null
          id: string
          line_items: Json | null
          reference: string | null
          status: string | null
          subtotal: number | null
          synced_at: string | null
          tenant_id: string
          total: number | null
          total_tax: number | null
          type: string
          updated_at: string | null
          xero_id: string
        }
        Insert: {
          bank_account_id?: string | null
          bank_account_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id: string
          total?: number | null
          total_tax?: number | null
          type: string
          updated_at?: string | null
          xero_id: string
        }
        Update: {
          bank_account_id?: string | null
          bank_account_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id?: string
          total?: number | null
          total_tax?: number | null
          type?: string
          updated_at?: string | null
          xero_id?: string
        }
        Relationships: []
      }
      xero_bas_tracking: {
        Row: {
          created_at: string | null
          gst_on_purchases: number | null
          gst_on_sales: number | null
          id: string
          lodged_date: string | null
          net_gst: number | null
          payg_withheld: number | null
          period_end: string
          period_start: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gst_on_purchases?: number | null
          gst_on_sales?: number | null
          id?: string
          lodged_date?: string | null
          net_gst?: number | null
          payg_withheld?: number | null
          period_end: string
          period_start: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gst_on_purchases?: number | null
          gst_on_sales?: number | null
          id?: string
          lodged_date?: string | null
          net_gst?: number | null
          payg_withheld?: number | null
          period_end?: string
          period_start?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      xero_contacts: {
        Row: {
          abn: string | null
          account_number: string | null
          addresses: Json | null
          balance: number | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_customer: boolean | null
          is_supplier: boolean | null
          last_name: string | null
          name: string
          outstanding_payable: number | null
          outstanding_receivable: number | null
          phones: Json | null
          synced_at: string | null
          tax_number: string | null
          tenant_id: string
          updated_at: string | null
          xero_id: string
        }
        Insert: {
          abn?: string | null
          account_number?: string | null
          addresses?: Json | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_customer?: boolean | null
          is_supplier?: boolean | null
          last_name?: string | null
          name: string
          outstanding_payable?: number | null
          outstanding_receivable?: number | null
          phones?: Json | null
          synced_at?: string | null
          tax_number?: string | null
          tenant_id: string
          updated_at?: string | null
          xero_id: string
        }
        Update: {
          abn?: string | null
          account_number?: string | null
          addresses?: Json | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_customer?: boolean | null
          is_supplier?: boolean | null
          last_name?: string | null
          name?: string
          outstanding_payable?: number | null
          outstanding_receivable?: number | null
          phones?: Json | null
          synced_at?: string | null
          tax_number?: string | null
          tenant_id?: string
          updated_at?: string | null
          xero_id?: string
        }
        Relationships: []
      }
      xero_financial_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          amount: number | null
          created_at: string | null
          detected_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          related_invoice_id: string | null
          related_xero_id: string | null
          resolved_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          amount?: number | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          related_invoice_id?: string | null
          related_xero_id?: string | null
          resolved_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          amount?: number | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          related_invoice_id?: string | null
          related_xero_id?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_financial_alerts_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "xero_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_financial_alerts_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "xero_overdue_receivables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_financial_alerts_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "xero_upcoming_payables"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_financial_snapshots: {
        Row: {
          ap_count: number | null
          ap_due_this_month: number | null
          ap_due_this_week: number | null
          ap_total: number | null
          ar_count: number | null
          ar_overdue_1_30_days: number | null
          ar_overdue_31_60_days: number | null
          ar_overdue_61_90_days: number | null
          ar_overdue_90_plus_days: number | null
          ar_overdue_count: number | null
          ar_overdue_total: number | null
          ar_total: number | null
          created_at: string | null
          id: string
          invoices_issued_this_period: number | null
          metadata: Json | null
          net_position: number | null
          rd_spend_this_period: number | null
          rd_tracking_category: string | null
          revenue_this_period: number | null
          snapshot_date: string
          snapshot_type: string
        }
        Insert: {
          ap_count?: number | null
          ap_due_this_month?: number | null
          ap_due_this_week?: number | null
          ap_total?: number | null
          ar_count?: number | null
          ar_overdue_1_30_days?: number | null
          ar_overdue_31_60_days?: number | null
          ar_overdue_61_90_days?: number | null
          ar_overdue_90_plus_days?: number | null
          ar_overdue_count?: number | null
          ar_overdue_total?: number | null
          ar_total?: number | null
          created_at?: string | null
          id?: string
          invoices_issued_this_period?: number | null
          metadata?: Json | null
          net_position?: number | null
          rd_spend_this_period?: number | null
          rd_tracking_category?: string | null
          revenue_this_period?: number | null
          snapshot_date: string
          snapshot_type?: string
        }
        Update: {
          ap_count?: number | null
          ap_due_this_month?: number | null
          ap_due_this_week?: number | null
          ap_total?: number | null
          ar_count?: number | null
          ar_overdue_1_30_days?: number | null
          ar_overdue_31_60_days?: number | null
          ar_overdue_61_90_days?: number | null
          ar_overdue_90_plus_days?: number | null
          ar_overdue_count?: number | null
          ar_overdue_total?: number | null
          ar_total?: number | null
          created_at?: string | null
          id?: string
          invoices_issued_this_period?: number | null
          metadata?: Json | null
          net_position?: number | null
          rd_spend_this_period?: number | null
          rd_tracking_category?: string | null
          revenue_this_period?: number | null
          snapshot_date?: string
          snapshot_type?: string
        }
        Relationships: []
      }
      xero_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          contact_id: string | null
          contact_name: string | null
          contact_xero_id: string | null
          created_at: string | null
          currency_code: string | null
          date: string | null
          due_date: string | null
          has_attachments: boolean | null
          id: string
          invoice_number: string | null
          invoice_type: string | null
          line_items: Json | null
          reference: string | null
          status: string | null
          subtotal: number | null
          synced_at: string | null
          tenant_id: string
          total: number | null
          total_tax: number | null
          tracking_category_1: string | null
          tracking_category_2: string | null
          tracking_option_1: string | null
          tracking_option_2: string | null
          type: string
          updated_at: string | null
          url: string | null
          xero_id: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          contact_xero_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          date?: string | null
          due_date?: string | null
          has_attachments?: boolean | null
          id?: string
          invoice_number?: string | null
          invoice_type?: string | null
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id: string
          total?: number | null
          total_tax?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          tracking_option_1?: string | null
          tracking_option_2?: string | null
          type: string
          updated_at?: string | null
          url?: string | null
          xero_id: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          contact_xero_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          date?: string | null
          due_date?: string | null
          has_attachments?: boolean | null
          id?: string
          invoice_number?: string | null
          invoice_type?: string | null
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id?: string
          total?: number | null
          total_tax?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          tracking_option_1?: string | null
          tracking_option_2?: string | null
          type?: string
          updated_at?: string | null
          url?: string | null
          xero_id?: string
        }
        Relationships: []
      }
      xero_sync_status: {
        Row: {
          created_at: string | null
          error_count: number | null
          error_message: string | null
          id: string
          last_error: string | null
          last_sync: string | null
          next_sync: string | null
          organization_name: string | null
          sync_duration_ms: number | null
          sync_status: string | null
          synced_items: number | null
          tenant_id: string
          total_bills: number | null
          total_contacts: number | null
          total_invoices: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_error?: string | null
          last_sync?: string | null
          next_sync?: string | null
          organization_name?: string | null
          sync_duration_ms?: number | null
          sync_status?: string | null
          synced_items?: number | null
          tenant_id: string
          total_bills?: number | null
          total_contacts?: number | null
          total_invoices?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_error?: string | null
          last_sync?: string | null
          next_sync?: string | null
          organization_name?: string | null
          sync_duration_ms?: number | null
          sync_status?: string | null
          synced_items?: number | null
          tenant_id?: string
          total_bills?: number | null
          total_contacts?: number | null
          total_invoices?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      youth_detention_facilities: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          capacity_beds: number | null
          city: string
          closed_date: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          current_population: number | null
          data_source: string | null
          data_source_url: string | null
          facility_type: string
          female_capacity: number | null
          government_department: string
          has_cultural_programs: boolean | null
          has_education_programs: boolean | null
          has_indigenous_liaison: boolean | null
          has_remand_section: boolean | null
          has_sentenced_section: boolean | null
          has_therapeutic_programs: boolean | null
          id: string
          indigenous_population_percentage: number | null
          last_data_update: string | null
          latitude: number | null
          longitude: number | null
          male_capacity: number | null
          managing_agency: string | null
          name: string
          opened_date: string | null
          operational_status: string | null
          postcode: string | null
          security_level: string | null
          slug: string | null
          state: string
          street_address: string | null
          suburb: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          capacity_beds?: number | null
          city: string
          closed_date?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          current_population?: number | null
          data_source?: string | null
          data_source_url?: string | null
          facility_type?: string
          female_capacity?: number | null
          government_department: string
          has_cultural_programs?: boolean | null
          has_education_programs?: boolean | null
          has_indigenous_liaison?: boolean | null
          has_remand_section?: boolean | null
          has_sentenced_section?: boolean | null
          has_therapeutic_programs?: boolean | null
          id?: string
          indigenous_population_percentage?: number | null
          last_data_update?: string | null
          latitude?: number | null
          longitude?: number | null
          male_capacity?: number | null
          managing_agency?: string | null
          name: string
          opened_date?: string | null
          operational_status?: string | null
          postcode?: string | null
          security_level?: string | null
          slug?: string | null
          state: string
          street_address?: string | null
          suburb?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          capacity_beds?: number | null
          city?: string
          closed_date?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          current_population?: number | null
          data_source?: string | null
          data_source_url?: string | null
          facility_type?: string
          female_capacity?: number | null
          government_department?: string
          has_cultural_programs?: boolean | null
          has_education_programs?: boolean | null
          has_indigenous_liaison?: boolean | null
          has_remand_section?: boolean | null
          has_sentenced_section?: boolean | null
          has_therapeutic_programs?: boolean | null
          id?: string
          indigenous_population_percentage?: number | null
          last_data_update?: string | null
          latitude?: number | null
          longitude?: number | null
          male_capacity?: number | null
          managing_agency?: string | null
          name?: string
          opened_date?: string | null
          operational_status?: string | null
          postcode?: string | null
          security_level?: string | null
          slug?: string | null
          state?: string
          street_address?: string | null
          suburb?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_wiki_pages: {
        Row: {
          content: string | null
          created_at: string | null
          domains: string[] | null
          excerpt: string | null
          extracted_from_ids: string[] | null
          id: string | null
          incoming_links: number | null
          last_reviewed_at: string | null
          last_viewed_at: string | null
          next_review_due: string | null
          outgoing_links: number | null
          page_type: string | null
          parent_method_id: string | null
          parent_practice_id: string | null
          parent_principle_id: string | null
          projects: string[] | null
          quality_score: number | null
          review_frequency_days: number | null
          review_status: string | null
          search_vector: unknown
          slug: string | null
          source_types: string[] | null
          source_urls: string[] | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          verified_at: string | null
          verified_by: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          domains?: string[] | null
          excerpt?: string | null
          extracted_from_ids?: string[] | null
          id?: string | null
          incoming_links?: never
          last_reviewed_at?: string | null
          last_viewed_at?: string | null
          next_review_due?: string | null
          outgoing_links?: never
          page_type?: string | null
          parent_method_id?: string | null
          parent_practice_id?: string | null
          parent_principle_id?: string | null
          projects?: string[] | null
          quality_score?: number | null
          review_frequency_days?: number | null
          review_status?: never
          search_vector?: unknown
          slug?: string | null
          source_types?: string[] | null
          source_urls?: string[] | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          domains?: string[] | null
          excerpt?: string | null
          extracted_from_ids?: string[] | null
          id?: string | null
          incoming_links?: never
          last_reviewed_at?: string | null
          last_viewed_at?: string | null
          next_review_due?: string | null
          outgoing_links?: never
          page_type?: string | null
          parent_method_id?: string | null
          parent_practice_id?: string | null
          parent_principle_id?: string | null
          projects?: string[] | null
          quality_score?: number | null
          review_frequency_days?: number | null
          review_status?: never
          search_vector?: unknown
          slug?: string | null
          source_types?: string[] | null
          source_urls?: string[] | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_pages_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_method_id_fkey"
            columns: ["parent_method_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_practice_id_fkey"
            columns: ["parent_practice_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_principle_id_fkey"
            columns: ["parent_principle_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_health_dashboard: {
        Row: {
          agent_id: string | null
          alert_level: string | null
          avg_response_time_ms: number | null
          enabled: boolean | null
          health_status: string | null
          last_health_check: string | null
          name: string | null
          success_rate: number | null
          type: string | null
        }
        Insert: {
          agent_id?: string | null
          alert_level?: never
          avg_response_time_ms?: number | null
          enabled?: boolean | null
          health_status?: string | null
          last_health_check?: string | null
          name?: string | null
          success_rate?: number | null
          type?: string | null
        }
        Update: {
          agent_id?: string | null
          alert_level?: never
          avg_response_time_ms?: number | null
          enabled?: boolean | null
          health_status?: string | null
          last_health_check?: string | null
          name?: string | null
          success_rate?: number | null
          type?: string | null
        }
        Relationships: []
      }
      alma_cost_analysis: {
        Row: {
          community_expenditure: number | null
          community_percent: number | null
          cost_per_day_community: number | null
          cost_per_day_detention: number | null
          detention_expenditure: number | null
          detention_percent: number | null
          detention_vs_community_ratio: number | null
          indigenous_percentage: number | null
          jurisdiction: string | null
          recidivism_rate: number | null
          report_year: string | null
          total_expenditure: number | null
        }
        Insert: {
          community_expenditure?: number | null
          community_percent?: never
          cost_per_day_community?: number | null
          cost_per_day_detention?: number | null
          detention_expenditure?: number | null
          detention_percent?: never
          detention_vs_community_ratio?: never
          indigenous_percentage?: number | null
          jurisdiction?: string | null
          recidivism_rate?: number | null
          report_year?: string | null
          total_expenditure?: number | null
        }
        Update: {
          community_expenditure?: number | null
          community_percent?: never
          cost_per_day_community?: number | null
          cost_per_day_detention?: number | null
          detention_expenditure?: number | null
          detention_percent?: never
          detention_vs_community_ratio?: never
          indigenous_percentage?: number | null
          jurisdiction?: string | null
          recidivism_rate?: number | null
          report_year?: string | null
          total_expenditure?: number | null
        }
        Relationships: []
      }
      alma_daily_sentiment: {
        Row: {
          article_count: number | null
          avg_sentiment: number | null
          date: string | null
          mixed_count: number | null
          negative_count: number | null
          neutral_count: number | null
          positive_count: number | null
          sentiment_stddev: number | null
          source_name: string | null
        }
        Relationships: []
      }
      alma_dashboard_funding: {
        Row: {
          avg_community_cost_per_day: number | null
          avg_detention_cost_per_day: number | null
          community_expenditure: number | null
          detention_expenditure: number | null
          detention_percentage: number | null
          jurisdiction: string | null
          report_year: string | null
          total_expenditure: number | null
        }
        Relationships: []
      }
      alma_dashboard_interventions: {
        Row: {
          avg_portfolio_score: number | null
          count: number | null
          evidence_backed_count: number | null
          evidence_level: string | null
          intervention_type: string | null
          jurisdiction: string | null
          published_count: number | null
        }
        Relationships: []
      }
      alma_dashboard_queue: {
        Row: {
          avg_priority: number | null
          count: number | null
          jurisdiction: string | null
          oldest_pending: string | null
          source_type: string | null
          status: string | null
        }
        Relationships: []
      }
      alma_dashboard_sources: {
        Row: {
          avg_quality_score: number | null
          avg_success_rate: number | null
          jurisdiction: string | null
          last_scraped: string | null
          source_count: number | null
          source_type: string | null
          total_entities: number | null
        }
        Relationships: []
      }
      alma_dashboard_tags: {
        Row: {
          category: string | null
          name: string | null
          slug: string | null
          unique_entities: number | null
          usage_count: number | null
        }
        Relationships: []
      }
      alma_interventions_unified: {
        Row: {
          consent_level: string | null
          contact_email: string | null
          contact_phone: string | null
          contexts: Json | null
          created_at: string | null
          cultural_authority: string | null
          description: string | null
          evidence: Json | null
          evidence_level: string | null
          geography: string[] | null
          id: string | null
          linked_community_program_id: string | null
          linked_service_id: string | null
          name: string | null
          operating_organization: string | null
          outcomes: Json | null
          portfolio_score: number | null
          review_status: string | null
          source: string | null
          target_cohort: string[] | null
          type: string | null
          updated_at: string | null
          website: string | null
          years_operating: number | null
        }
        Relationships: []
      }
      alma_sentiment_program_correlation: {
        Row: {
          announced_date: string | null
          community_led: boolean | null
          program_id: string | null
          program_name: string | null
          sentiment_after: number | null
          sentiment_before: number | null
          sentiment_shift: number | null
        }
        Relationships: []
      }
      alma_unified_search: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          jurisdiction: string | null
          relevance_boost: number | null
          search_vector: unknown
          title: string | null
        }
        Relationships: []
      }
      auto_approval_quality: {
        Row: {
          approval_confidence: number | null
          approved_at: string | null
          days_since_approval: number | null
          id: string | null
          last_updated: string | null
          page_type: string | null
          post_approval_status: string | null
          title: string | null
        }
        Insert: {
          approval_confidence?: number | null
          approved_at?: string | null
          days_since_approval?: never
          id?: string | null
          last_updated?: string | null
          page_type?: string | null
          post_approval_status?: never
          title?: string | null
        }
        Update: {
          approval_confidence?: number | null
          approved_at?: string | null
          days_since_approval?: never
          id?: string | null
          last_updated?: string | null
          page_type?: string | null
          post_approval_status?: never
          title?: string | null
        }
        Relationships: []
      }
      coe_key_people_v: {
        Row: {
          bio_override: string | null
          created_at: string | null
          display_order: number | null
          expertise_area: string | null
          id: string | null
          is_active: boolean | null
          profile_id: string | null
          role: string | null
          role_title: string | null
        }
        Insert: {
          bio_override?: string | null
          created_at?: string | null
          display_order?: number | null
          expertise_area?: string | null
          id?: string | null
          is_active?: boolean | null
          profile_id?: string | null
          role?: string | null
          role_title?: string | null
        }
        Update: {
          bio_override?: string | null
          created_at?: string | null
          display_order?: number | null
          expertise_area?: string | null
          id?: string | null
          is_active?: boolean | null
          profile_id?: string | null
          role?: string | null
          role_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coe_key_people_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_engagement_overview: {
        Row: {
          avg_engagement_score: number | null
          event_category: string | null
          event_count: number | null
          milestones_reached: number | null
          unique_users: number | null
          user_actions: number | null
          week: string | null
        }
        Relationships: []
      }
      community_programs_profiles_v: {
        Row: {
          community_program_id: string | null
          created_at: string | null
          display_order: number | null
          id: string | null
          is_featured: boolean | null
          profile_id: string | null
          program_id: string | null
          public_profile_id: string | null
          role: string | null
          role_description: string | null
        }
        Insert: {
          community_program_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string | null
          is_featured?: boolean | null
          profile_id?: string | null
          program_id?: string | null
          public_profile_id?: string | null
          role?: string | null
          role_description?: string | null
        }
        Update: {
          community_program_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string | null
          is_featured?: boolean | null
          profile_id?: string | null
          program_id?: string | null
          public_profile_id?: string | null
          role?: string | null
          role_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_programs_profiles_program_id_fkey"
            columns: ["community_program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_programs_profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "registered_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_programs_profiles_public_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_programs_profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_progress: {
        Row: {
          account_email: string | null
          annual_value: number | null
          consolidation_status: string | null
          subscription_count: number | null
          tenant_id: string | null
        }
        Relationships: []
      }
      current_knowledge: {
        Row: {
          active_from: string | null
          changed_by: string | null
          content: string | null
          content_type: string | null
          knowledge_id: string | null
          projects: string[] | null
          reason_for_change: string | null
          tags: string[] | null
          version: number | null
        }
        Insert: {
          active_from?: string | null
          changed_by?: string | null
          content?: string | null
          content_type?: string | null
          knowledge_id?: string | null
          projects?: string[] | null
          reason_for_change?: string | null
          tags?: string[] | null
          version?: number | null
        }
        Update: {
          active_from?: string | null
          changed_by?: string | null
          content?: string | null
          content_type?: string | null
          knowledge_id?: string | null
          projects?: string[] | null
          reason_for_change?: string | null
          tags?: string[] | null
          version?: number | null
        }
        Relationships: []
      }
      decision_analytics: {
        Row: {
          avg_confidence: number | null
          avg_outcome_rating: number | null
          category: string | null
          completed_with_outcomes: number | null
          decision_count: number | null
          priority: string | null
          status: string | null
        }
        Relationships: []
      }
      financial_by_account: {
        Row: {
          account_email: string | null
          auto_matched_count: number | null
          avg_confidence: number | null
          document_count: number | null
          document_type: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      financial_monthly_summary: {
        Row: {
          account_email: string | null
          avg_confidence: number | null
          document_type: string | null
          month: string | null
          total_amount: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      gmail_sync_stats: {
        Row: {
          approved: number | null
          last_history_id: string | null
          last_scan_extracted: number | null
          last_scan_found: number | null
          last_sync_at: string | null
          latest_extraction: string | null
          pending_review: number | null
          status: string | null
          total_in_queue: number | null
          user_email: string | null
        }
        Relationships: []
      }
      knowledge_review_schedule: {
        Row: {
          id: string | null
          last_reviewed_at: string | null
          next_review_due: string | null
          review_frequency_days: number | null
          review_status: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          id?: string | null
          last_reviewed_at?: string | null
          next_review_due?: never
          review_frequency_days?: number | null
          review_status?: never
          title?: string | null
          type?: string | null
        }
        Update: {
          id?: string | null
          last_reviewed_at?: string | null
          next_review_due?: never
          review_frequency_days?: number | null
          review_status?: never
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      knowledge_source_health: {
        Row: {
          approval_rate_pct: number | null
          consecutive_errors: number | null
          enabled: boolean | null
          health_status: string | null
          last_error: string | null
          last_sync_at: string | null
          next_sync_due: string | null
          source_type: string | null
          status: string | null
          total_items_approved: number | null
          total_items_extracted: number | null
          total_items_scanned: number | null
        }
        Insert: {
          approval_rate_pct?: never
          consecutive_errors?: number | null
          enabled?: boolean | null
          health_status?: never
          last_error?: string | null
          last_sync_at?: string | null
          next_sync_due?: string | null
          source_type?: string | null
          status?: string | null
          total_items_approved?: number | null
          total_items_extracted?: number | null
          total_items_scanned?: number | null
        }
        Update: {
          approval_rate_pct?: never
          consecutive_errors?: number | null
          enabled?: boolean | null
          health_status?: never
          last_error?: string | null
          last_sync_at?: string | null
          next_sync_due?: string | null
          source_type?: string | null
          status?: string | null
          total_items_approved?: number | null
          total_items_extracted?: number | null
          total_items_scanned?: number | null
        }
        Relationships: []
      }
      migration_progress: {
        Row: {
          avg_pending_priority: number | null
          completed: number | null
          completion_rate: number | null
          contacted: number | null
          done: number | null
          high_priority: number | null
          low_priority: number | null
          medium_priority: number | null
          not_started: number | null
          pending_contact: number | null
          skipped: number | null
          tenant_id: string | null
          total_subscriptions: number | null
          vendor_confirmed: number | null
        }
        Relationships: []
      }
      missing_subscriptions: {
        Row: {
          amount: number | null
          avg_amount: number | null
          bank_account_name: string | null
          description: string | null
          id: string | null
          tenant_id: string | null
          transaction_count: number | null
          transaction_date: string | null
          vendor: string | null
        }
        Relationships: []
      }
      notification_summary: {
        Row: {
          high_confidence_count: number | null
          high_count: number | null
          latest_unread_at: string | null
          review_due_count: number | null
          unread_count: number | null
          urgent_count: number | null
        }
        Relationships: []
      }
      outstanding_invoices: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          days_overdue: number | null
          gmail_message_id: string | null
          id: string | null
          priority_score: number | null
          priority_status: string | null
          receipt_date: string | null
          source: string | null
          subscription_id: string | null
          tenant_id: string | null
          vendor: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_receipts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "discovered_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_storytellers_v: {
        Row: {
          avatar_url: string | null
          bio_excerpt: string | null
          consent_level: string | null
          display_name: string | null
          display_order: number | null
          empathy_ledger_profile_id: string | null
          id: string | null
          is_featured: boolean | null
          is_public: boolean | null
          linked_at: string | null
          node_id: string | null
          organization_id: string | null
          quote: string | null
          role: string | null
          role_at_org: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio_excerpt?: string | null
          consent_level?: string | null
          display_name?: string | null
          display_order?: number | null
          empathy_ledger_profile_id?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          linked_at?: string | null
          node_id?: string | null
          organization_id?: string | null
          quote?: string | null
          role?: string | null
          role_at_org?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio_excerpt?: string | null
          consent_level?: string | null
          display_name?: string | null
          display_order?: number | null
          empathy_ledger_profile_id?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          linked_at?: string | null
          node_id?: string | null
          organization_id?: string | null
          quote?: string | null
          role?: string | null
          role_at_org?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_storytellers_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "justicehub_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_storytellers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_elder_reviews: {
        Row: {
          assigned_to: string | null
          content_type: string | null
          cultural_topics: string[] | null
          id: string | null
          priority: number | null
          project_slug: string | null
          sensitivity_level: string | null
          submitted_at: string | null
          submitter_email: string | null
        }
        Relationships: []
      }
      pending_extractions: {
        Row: {
          confidence_level: string | null
          confidence_score: number | null
          created_at: string | null
          extracted_at: string | null
          extracted_knowledge: string | null
          extraction_model: string | null
          extraction_prompt: string | null
          id: string | null
          priority: number | null
          raw_content: string | null
          raw_title: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string | null
          source_metadata: Json | null
          source_type: string | null
          source_url: string | null
          status: string | null
          suggested_domains: string[] | null
          suggested_excerpt: string | null
          suggested_parent_ids: Json | null
          suggested_projects: string[] | null
          suggested_tags: string[] | null
          suggested_title: string | null
          suggested_type: string | null
          wiki_page_id: string | null
        }
        Insert: {
          confidence_level?: never
          confidence_score?: number | null
          created_at?: string | null
          extracted_at?: string | null
          extracted_knowledge?: string | null
          extraction_model?: string | null
          extraction_prompt?: string | null
          id?: string | null
          priority?: number | null
          raw_content?: string | null
          raw_title?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          suggested_domains?: string[] | null
          suggested_excerpt?: string | null
          suggested_parent_ids?: Json | null
          suggested_projects?: string[] | null
          suggested_tags?: string[] | null
          suggested_title?: string | null
          suggested_type?: string | null
          wiki_page_id?: string | null
        }
        Update: {
          confidence_level?: never
          confidence_score?: number | null
          created_at?: string | null
          extracted_at?: string | null
          extracted_knowledge?: string | null
          extraction_model?: string | null
          extraction_prompt?: string | null
          id?: string | null
          priority?: number | null
          raw_content?: string | null
          raw_title?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          suggested_domains?: string[] | null
          suggested_excerpt?: string | null
          suggested_parent_ids?: Json | null
          suggested_projects?: string[] | null
          suggested_tags?: string[] | null
          suggested_title?: string | null
          suggested_type?: string | null
          wiki_page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_extraction_queue_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "active_wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_extraction_queue_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "auto_approval_quality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_extraction_queue_wiki_page_id_fkey"
            columns: ["wiki_page_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_organization_stats: {
        Row: {
          collection_count: number | null
          id: string | null
          last_upload: string | null
          name: string | null
          photo_count: number | null
          slug: string | null
          storage_quota_gb: number | null
          storage_used_gb: number | null
          total_downloads: number | null
          total_media_items: number | null
          total_views: number | null
          uploads_this_month: number | null
          video_count: number | null
        }
        Relationships: []
      }
      platform_public_media_with_collections: {
        Row: {
          capture_date: string | null
          collections: Json | null
          content_category: string | null
          content_subcategory: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string | null
          impact_themes: string[] | null
          manual_tags: string[] | null
          organization_name: string | null
          organization_slug: string | null
          photographer: string | null
          platform_organization_id: string | null
          thumbnail_url: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_media_items_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organization_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_media_items_platform_organization_id_fkey"
            columns: ["platform_organization_id"]
            isOneToOne: false
            referencedRelation: "platform_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_impact_summary: {
        Row: {
          last_outcome_update: string | null
          project_id: string | null
          project_name: string | null
          project_status: string | null
          total_beneficiaries: number | null
          total_contributions: number | null
          total_outcomes: number | null
          unique_contributors: number | null
          verified_outcomes: number | null
        }
        Relationships: []
      }
      project_support_overview: {
        Row: {
          concentration_risk: boolean | null
          financial_last_updated: string | null
          funding_gap: number | null
          project_id: string | null
          project_name: string | null
          project_status: string | null
          supporter_slots: number | null
          total_actual: number | null
          total_potential: number | null
          upcoming_milestone: string | null
          urgency_score: number | null
        }
        Relationships: []
      }
      public_media_with_collections: {
        Row: {
          alt_text: string | null
          capture_date: string | null
          collections: Json | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string | null
          impact_themes: string[] | null
          manual_tags: string[] | null
          photographer: string | null
          thumbnail_url: string | null
          title: string | null
        }
        Relationships: []
      }
      recent_agent_activity: {
        Row: {
          action: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          request_id: string | null
          source_agent: string | null
          source_name: string | null
          status: string | null
          target_agent: string | null
          target_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_requests_source_agent_fkey"
            columns: ["source_agent"]
            isOneToOne: false
            referencedRelation: "agent_health_dashboard"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_requests_source_agent_fkey"
            columns: ["source_agent"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_requests_target_agent_fkey"
            columns: ["target_agent"]
            isOneToOne: false
            referencedRelation: "agent_health_dashboard"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_requests_target_agent_fkey"
            columns: ["target_agent"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["agent_id"]
          },
        ]
      }
      services_complete: {
        Row: {
          active: boolean | null
          age_range: Json | null
          categories: string[] | null
          contact: Json | null
          contacts: Json | null
          created_at: string | null
          description: string | null
          id: string | null
          indigenous_specific: boolean | null
          keywords: string[] | null
          last_scraped_at: string | null
          location: Json | null
          location_latitude: number | null
          location_longitude: number | null
          locations: Json | null
          maximum_age: number | null
          minimum_age: number | null
          name: string | null
          organization: Json | null
          organizations: Json | null
          score: number | null
          slug: string | null
          updated_at: string | null
          url: string | null
          youth_specific: boolean | null
        }
        Relationships: []
      }
      services_unified: {
        Row: {
          address: string | null
          alma_intervention_id: string | null
          alma_review_status: string | null
          city: string | null
          consent_level: string | null
          created_at: string | null
          cultural_authority: string | null
          description: string | null
          email: string | null
          evidence_level: string | null
          id: string | null
          impact_summary: string | null
          indigenous_specific: boolean | null
          infrastructure_type: string | null
          intervention_type: string | null
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          organization_id: string | null
          organization_name: string | null
          participants_served: number | null
          phone: string | null
          portfolio_score: number | null
          postcode: string | null
          program_approach: string | null
          registered_service_id: string | null
          service_categories: string[] | null
          service_id: string | null
          slug: string | null
          source_table: string | null
          state: string | null
          success_rate: number | null
          tags: string[] | null
          updated_at: string | null
          website: string | null
          years_operating: number | null
          youth_specific: boolean | null
        }
        Relationships: []
      }
      subscription_cost_anomalies: {
        Row: {
          account_email: string | null
          current_amount: number | null
          expected_amount: number | null
          id: string | null
          percent_difference: number | null
          severity: string | null
          tenant_id: string | null
          transaction_date: string | null
          vendor: string | null
        }
        Relationships: []
      }
      subscription_cost_by_account: {
        Row: {
          account_email: string | null
          active_count: number | null
          avg_amount: number | null
          cancelled_count: number | null
          max_amount: number | null
          min_amount: number | null
          subscription_count: number | null
          tenant_id: string | null
          total_annual_cost: number | null
        }
        Relationships: []
      }
      subscription_cost_by_category: {
        Row: {
          active_count: number | null
          avg_amount: number | null
          category: string | null
          subscription_count: number | null
          tenant_id: string | null
          total_annual_cost: number | null
          total_monthly_cost: number | null
        }
        Relationships: []
      }
      subscription_payment_calendar: {
        Row: {
          account_email: string | null
          amount: number | null
          created_at: string | null
          currency: string | null
          days_until_due: number | null
          id: string | null
          next_payment_date: string | null
          payment_pattern_confidence: number | null
          subscription_frequency: string | null
          subscription_status: string | null
          tenant_id: string | null
          updated_at: string | null
          urgency: string | null
          vendor: string | null
        }
        Insert: {
          account_email?: string | null
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          days_until_due?: never
          id?: string | null
          next_payment_date?: string | null
          payment_pattern_confidence?: number | null
          subscription_frequency?: string | null
          subscription_status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          urgency?: never
          vendor?: string | null
        }
        Update: {
          account_email?: string | null
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          days_until_due?: never
          id?: string | null
          next_payment_date?: string | null
          payment_pattern_confidence?: number | null
          subscription_frequency?: string | null
          subscription_status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          urgency?: never
          vendor?: string | null
        }
        Relationships: []
      }
      subscription_renewal_alerts: {
        Row: {
          account_email: string | null
          alert_type: string | null
          amount: number | null
          currency: string | null
          days_until_due: number | null
          id: string | null
          last_renewal_reminder_date: string | null
          next_payment_date: string | null
          payment_pattern_confidence: number | null
          renewal_reminder_sent: boolean | null
          subscription_frequency: string | null
          tenant_id: string | null
          vendor: string | null
        }
        Insert: {
          account_email?: string | null
          alert_type?: never
          amount?: number | null
          currency?: string | null
          days_until_due?: never
          id?: string | null
          last_renewal_reminder_date?: string | null
          next_payment_date?: string | null
          payment_pattern_confidence?: number | null
          renewal_reminder_sent?: boolean | null
          subscription_frequency?: string | null
          tenant_id?: string | null
          vendor?: string | null
        }
        Update: {
          account_email?: string | null
          alert_type?: never
          amount?: number | null
          currency?: string | null
          days_until_due?: never
          id?: string | null
          last_renewal_reminder_date?: string | null
          next_payment_date?: string | null
          payment_pattern_confidence?: number | null
          renewal_reminder_sent?: boolean | null
          subscription_frequency?: string | null
          tenant_id?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      sync_event_statistics: {
        Row: {
          avg_processing_time_seconds: number | null
          event_count: number | null
          newest_event: string | null
          oldest_event: string | null
          sync_status: string | null
          sync_target: string | null
          table_name: string | null
        }
        Relationships: []
      }
      training_ready_content: {
        Row: {
          brand_voice_score: number | null
          completion: string | null
          content_type: string | null
          cultural_safety_score: number | null
          id: string | null
          overall_quality_score: number | null
          project_slug: string | null
          prompt: string | null
          verified_at: string | null
        }
        Insert: {
          brand_voice_score?: number | null
          completion?: string | null
          content_type?: string | null
          cultural_safety_score?: number | null
          id?: string | null
          overall_quality_score?: number | null
          project_slug?: string | null
          prompt?: string | null
          verified_at?: string | null
        }
        Update: {
          brand_voice_score?: number | null
          completion?: string | null
          content_type?: string | null
          cultural_safety_score?: number | null
          id?: string | null
          overall_quality_score?: number | null
          project_slug?: string | null
          prompt?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      unreconciled_financial_documents: {
        Row: {
          account_email: string | null
          amount: number | null
          confidence: number | null
          document_type: string | null
          id: string | null
          priority: string | null
          transaction_date: string | null
          vendor: string | null
        }
        Insert: {
          account_email?: string | null
          amount?: number | null
          confidence?: number | null
          document_type?: string | null
          id?: string | null
          priority?: never
          transaction_date?: string | null
          vendor?: string | null
        }
        Update: {
          account_email?: string | null
          amount?: number | null
          confidence?: number | null
          document_type?: string | null
          id?: string | null
          priority?: never
          transaction_date?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      unused_subscriptions: {
        Row: {
          account_email: string | null
          amount: number | null
          currency: string | null
          days_since_last_activity: number | null
          id: string | null
          last_xero_transaction_date: string | null
          subscription_frequency: string | null
          tenant_id: string | null
          usage_last_checked_date: string | null
          usage_status: string | null
          vendor: string | null
        }
        Relationships: []
      }
      user_dashboard_summary: {
        Row: {
          contributed_projects: number | null
          display_name: string | null
          engagement_score: number | null
          followed_projects: number | null
          interests: Json | null
          last_active_at: string | null
          location: Json | null
          onboarding_completed: boolean | null
          user_id: string | null
          user_profile_id: string | null
        }
        Relationships: []
      }
      v_contacts_with_protocols: {
        Row: {
          company_name: string | null
          created_at: string | null
          cultural_nation: string | null
          custom_fields: Json | null
          elder_status: boolean | null
          email: string | null
          engagement_status: string | null
          first_contact_date: string | null
          first_name: string | null
          full_name: string | null
          ghl_created_at: string | null
          ghl_id: string | null
          ghl_location_id: string | null
          ghl_updated_at: string | null
          has_cultural_protocols: boolean | null
          id: string | null
          last_contact_date: string | null
          last_name: string | null
          last_synced_at: string | null
          phone: string | null
          projects: string[] | null
          requires_elder_review: boolean | null
          review_status: string | null
          sync_error: string | null
          sync_status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_donor_summary: {
        Row: {
          donation_count: number | null
          donor_status: string | null
          email: string | null
          first_donation: string | null
          full_name: string | null
          ghl_id: string | null
          last_donation: string | null
          lifetime_value: number | null
        }
        Relationships: []
      }
      v_facilities_with_partnerships: {
        Row: {
          active_partnerships: number | null
          age_range_max: number | null
          age_range_min: number | null
          capacity_beds: number | null
          city: string | null
          closed_date: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          current_population: number | null
          data_source: string | null
          data_source_url: string | null
          facility_type: string | null
          female_capacity: number | null
          government_department: string | null
          has_cultural_programs: boolean | null
          has_education_programs: boolean | null
          has_indigenous_liaison: boolean | null
          has_remand_section: boolean | null
          has_sentenced_section: boolean | null
          has_therapeutic_programs: boolean | null
          id: string | null
          indigenous_population_percentage: number | null
          last_data_update: string | null
          latitude: number | null
          longitude: number | null
          male_capacity: number | null
          managing_agency: string | null
          name: string | null
          opened_date: string | null
          operational_status: string | null
          organization_partners: number | null
          partnership_count: number | null
          postcode: string | null
          program_partners: number | null
          security_level: string | null
          service_partners: number | null
          slug: string | null
          state: string | null
          street_address: string | null
          suburb: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
      v_funders_summary: {
        Row: {
          active_opportunities: number | null
          all_jurisdictions: string[] | null
          avg_max_grant: number | null
          funder_name: string | null
          source_type: string | null
          total_available: number | null
          total_opportunities: number | null
        }
        Relationships: []
      }
      v_funding_pipeline: {
        Row: {
          application_count: number | null
          application_url: string | null
          category: string | null
          created_at: string | null
          days_until_deadline: number | null
          deadline: string | null
          focus_areas: string[] | null
          funder_name: string | null
          id: string | null
          jurisdictions: string[] | null
          max_grant_amount: number | null
          min_grant_amount: number | null
          name: string | null
          relevance_score: number | null
          source_type: string | null
          source_url: string | null
          status: string | null
          total_pool_amount: number | null
          updated_at: string | null
        }
        Insert: {
          application_count?: never
          application_url?: string | null
          category?: string | null
          created_at?: string | null
          days_until_deadline?: never
          deadline?: string | null
          focus_areas?: string[] | null
          funder_name?: string | null
          id?: string | null
          jurisdictions?: string[] | null
          max_grant_amount?: number | null
          min_grant_amount?: number | null
          name?: string | null
          relevance_score?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          total_pool_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          application_count?: never
          application_url?: string | null
          category?: string | null
          created_at?: string | null
          days_until_deadline?: never
          deadline?: string | null
          focus_areas?: string[] | null
          funder_name?: string | null
          id?: string | null
          jurisdictions?: string[] | null
          max_grant_amount?: number | null
          min_grant_amount?: number | null
          name?: string | null
          relevance_score?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          total_pool_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_latest_reports: {
        Row: {
          alerts: string[] | null
          executive_summary: string | null
          generated_at: string | null
          highlights: string[] | null
          id: string | null
          published_at: string | null
          report_type: string | null
          status: string | null
          title: string | null
          week_end: string | null
          week_start: string | null
        }
        Relationships: []
      }
      v_state_ecosystem_summary: {
        Row: {
          community_programs: number | null
          operational_facilities: number | null
          organizations: number | null
          services: number | null
          state: string | null
          total_capacity: number | null
          total_population: number | null
        }
        Relationships: []
      }
      v_volunteer_summary: {
        Row: {
          email: string | null
          full_name: string | null
          ghl_id: string | null
          last_volunteered: string | null
          projects_volunteered: string[] | null
          session_count: number | null
          total_hours: number | null
        }
        Relationships: []
      }
      vw_alma_intervention_matches: {
        Row: {
          alignment_score: number | null
          alignment_tags: string[] | null
          alma_intervention_id: string | null
          alma_signal_boost: number | null
          contact_id: string | null
          created_at: string | null
          email_address: string | null
          engagement_status: string | null
          full_name: string | null
          id: string | null
          match_reason: string | null
          matched_keywords: string[] | null
          person_id: string | null
          project_name: string | null
          project_notion_id: string | null
          project_source: string | null
          strategic_value: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contact_matches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contact_matches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["linkedin_contact_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      vw_auto_mapped_contacts: {
        Row: {
          bio: string | null
          current_company: string | null
          data_source: string | null
          discovered_via: string | null
          email_address: string | null
          engagement_priority: string | null
          exa_confidence_score: number | null
          exa_last_enriched: string | null
          full_name: string | null
          linkedin_contact_id: string | null
          person_created_at: string | null
          person_id: string | null
        }
        Relationships: []
      }
      vw_beautiful_obsolescence_progress: {
        Row: {
          act_energy_percent: number | null
          contact_count: number | null
          current_stage: string | null
          obsolescence_rate_percent: number | null
          obsolete_count: number | null
          pipeline_type: string | null
        }
        Relationships: []
      }
      vw_engagement_tier_stats: {
        Row: {
          government_contacts: number | null
          synced_to_notion: number | null
          tier: string | null
          total_contacts: number | null
        }
        Relationships: []
      }
      vw_exa_queue_summary: {
        Row: {
          avg_priority: number | null
          campaign_type: string | null
          count: number | null
          newest_queued: string | null
          oldest_queued: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_exa_usage_summary: {
        Row: {
          company_requests: number | null
          estimated_cost_usd: number | null
          failed_requests: number | null
          free_tier_exceeded: boolean | null
          free_tier_limit: number | null
          free_tier_remaining: number | null
          linkedin_requests: number | null
          media_requests: number | null
          network_discovery_requests: number | null
          period_month: string | null
          successful_requests: number | null
          total_requests: number | null
          usage_percentage: number | null
        }
        Insert: {
          company_requests?: number | null
          estimated_cost_usd?: number | null
          failed_requests?: number | null
          free_tier_exceeded?: boolean | null
          free_tier_limit?: number | null
          free_tier_remaining?: number | null
          linkedin_requests?: number | null
          media_requests?: number | null
          network_discovery_requests?: number | null
          period_month?: string | null
          successful_requests?: number | null
          total_requests?: number | null
          usage_percentage?: never
        }
        Update: {
          company_requests?: number | null
          estimated_cost_usd?: number | null
          failed_requests?: number | null
          free_tier_exceeded?: boolean | null
          free_tier_limit?: number | null
          free_tier_remaining?: number | null
          linkedin_requests?: number | null
          media_requests?: number | null
          network_discovery_requests?: number | null
          period_month?: string | null
          successful_requests?: number | null
          total_requests?: number | null
          usage_percentage?: never
        }
        Relationships: []
      }
      vw_goods_enrichment_candidates: {
        Row: {
          composite_score: number | null
          current_company: string | null
          current_position: string | null
          email: string | null
          engagement_priority: string | null
          enrichment_priority: number | null
          exa_enriched: boolean | null
          exa_enriched_at: string | null
          full_name: string | null
          influence_score: number | null
          person_id: string | null
          tags: string[] | null
        }
        Relationships: []
      }
      vw_high_value_project_matches: {
        Row: {
          alignment_score: number | null
          alignment_tags: string[] | null
          alma_intervention_id: string | null
          alma_signal_boost: number | null
          contact_id: string | null
          created_at: string | null
          current_company: string | null
          current_position: string | null
          email_address: string | null
          engagement_status: string | null
          full_name: string | null
          ghl_contact_id: string | null
          id: string | null
          linkedin_url: string | null
          match_reason: string | null
          matched_keywords: string[] | null
          notion_person_id: string | null
          person_id: string | null
          project_name: string | null
          project_notion_id: string | null
          project_source: string | null
          strategic_value: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contact_matches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contact_matches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["linkedin_contact_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_identity_map"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_auto_mapped_contacts"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_goods_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_justice_enrichment_candidates"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "project_contact_matches_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "vw_newsletter_segments"
            referencedColumns: ["person_id"]
          },
        ]
      }
      vw_justice_enrichment_candidates: {
        Row: {
          composite_score: number | null
          current_company: string | null
          current_position: string | null
          email: string | null
          engagement_priority: string | null
          enrichment_priority: number | null
          exa_enriched: boolean | null
          exa_enriched_at: string | null
          full_name: string | null
          influence_score: number | null
          person_id: string | null
          tags: string[] | null
          youth_justice_relevance_score: number | null
        }
        Relationships: []
      }
      vw_newsletter_segments: {
        Row: {
          alignment_tags: string[] | null
          composite_score: number | null
          email: string | null
          engagement_priority: string | null
          full_name: string | null
          newsletter_type: string | null
          person_id: string | null
          sector: string | null
        }
        Relationships: []
      }
      wiki_hierarchy: {
        Row: {
          breadcrumb: string[] | null
          id: string | null
          level: number | null
          page_type: string | null
          path: string[] | null
          slug: string | null
          title: string | null
        }
        Relationships: []
      }
      xero_financial_health: {
        Row: {
          last_sync: string | null
          overdue_count: number | null
          overdue_receivables: number | null
          payable_count: number | null
          payables_due_this_week: number | null
          receivable_count: number | null
          total_payables: number | null
          total_receivables: number | null
        }
        Relationships: []
      }
      xero_overdue_receivables: {
        Row: {
          aging_bucket: string | null
          amount_due: number | null
          amount_paid: number | null
          contact_id: string | null
          contact_name: string | null
          contact_xero_id: string | null
          created_at: string | null
          currency_code: string | null
          date: string | null
          days_overdue: number | null
          due_date: string | null
          has_attachments: boolean | null
          id: string | null
          invoice_number: string | null
          invoice_type: string | null
          line_items: Json | null
          reference: string | null
          status: string | null
          subtotal: number | null
          synced_at: string | null
          tenant_id: string | null
          total: number | null
          total_tax: number | null
          tracking_category_1: string | null
          tracking_category_2: string | null
          tracking_option_1: string | null
          tracking_option_2: string | null
          type: string | null
          updated_at: string | null
          url: string | null
          xero_id: string | null
        }
        Insert: {
          aging_bucket?: never
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          contact_xero_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          date?: string | null
          days_overdue?: never
          due_date?: string | null
          has_attachments?: boolean | null
          id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id?: string | null
          total?: number | null
          total_tax?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          tracking_option_1?: string | null
          tracking_option_2?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
          xero_id?: string | null
        }
        Update: {
          aging_bucket?: never
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          contact_xero_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          date?: string | null
          days_overdue?: never
          due_date?: string | null
          has_attachments?: boolean | null
          id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id?: string | null
          total?: number | null
          total_tax?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          tracking_option_1?: string | null
          tracking_option_2?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
          xero_id?: string | null
        }
        Relationships: []
      }
      xero_upcoming_payables: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          contact_id: string | null
          contact_name: string | null
          contact_xero_id: string | null
          created_at: string | null
          currency_code: string | null
          date: string | null
          days_until_due: number | null
          due_date: string | null
          has_attachments: boolean | null
          id: string | null
          invoice_number: string | null
          invoice_type: string | null
          line_items: Json | null
          reference: string | null
          status: string | null
          subtotal: number | null
          synced_at: string | null
          tenant_id: string | null
          total: number | null
          total_tax: number | null
          tracking_category_1: string | null
          tracking_category_2: string | null
          tracking_option_1: string | null
          tracking_option_2: string | null
          type: string | null
          updated_at: string | null
          url: string | null
          xero_id: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          contact_xero_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          date?: string | null
          days_until_due?: never
          due_date?: string | null
          has_attachments?: boolean | null
          id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id?: string | null
          total?: number | null
          total_tax?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          tracking_option_1?: string | null
          tracking_option_2?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
          xero_id?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          contact_xero_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          date?: string | null
          days_until_due?: never
          due_date?: string | null
          has_attachments?: boolean | null
          id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          line_items?: Json | null
          reference?: string | null
          status?: string | null
          subtotal?: number | null
          synced_at?: string | null
          tenant_id?: string | null
          total?: number | null
          total_tax?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          tracking_option_1?: string | null
          tracking_option_2?: string | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
          xero_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_new_storyteller: {
        Args: {
          p_bio?: string
          p_community?: string
          p_email: string
          p_full_name: string
        }
        Returns: string
      }
      analyze_contact_strategic_value: { Args: never; Returns: number }
      assign_engagement_tier: { Args: { person_uuid: string }; Returns: string }
      auto_approve_high_confidence: {
        Args: { confidence_threshold?: number; dry_run?: boolean }
        Returns: {
          action: string
          confidence: number
          queue_item_id: string
          suggested_type: string
          title: string
        }[]
      }
      backfill_all_community_programs_to_alma: {
        Args: never
        Returns: {
          intervention_id: string
          program_id: string
          program_name: string
          status: string
        }[]
      }
      backfill_community_program_to_alma_intervention: {
        Args: { p_program_id: string }
        Returns: string
      }
      calculate_community_authority_signal: {
        Args: { intervention_id: string }
        Returns: number
      }
      calculate_community_investment_score: {
        Args: { p_jurisdiction: string }
        Returns: {
          community_percent: number
          detention_cost_ratio: number
          investment_score: number
          jurisdiction: string
          recommendation: string
        }[]
      }
      calculate_coverage_metrics: { Args: never; Returns: undefined }
      calculate_empowerment_score: {
        Args: { analysis_data: Json }
        Returns: number
      }
      calculate_engagement_score: {
        Args: {
          collaborations: number
          interactions: number
          page_views: number
          session_time: number
        }
        Returns: number
      }
      calculate_evidence_signal: {
        Args: { intervention_id: string }
        Returns: number
      }
      calculate_funding_relevance: {
        Args: { opportunity_id: string }
        Returns: number
      }
      calculate_harm_risk_signal: {
        Args: { intervention_id: string }
        Returns: number
      }
      calculate_implementation_signal: {
        Args: { intervention_id: string }
        Returns: number
      }
      calculate_migration_priority: {
        Args: { sub_amount: number; sub_confidence: number; sub_metadata: Json }
        Returns: number
      }
      calculate_next_scrape: {
        Args: { p_priority_score: number; p_update_frequency: string }
        Returns: string
      }
      calculate_option_value_signal: {
        Args: { intervention_id: string }
        Returns: number
      }
      calculate_portfolio_score: {
        Args: { int_id: string }
        Returns: {
          community_authority: number
          composite_score: number
          evidence_strength: number
          harm_risk: number
          implementation: number
          intervention_id: string
          intervention_name: string
          intervention_type: string
          option_value: number
          recommendation: string
        }[]
      }
      calculate_portfolio_signals: {
        Args: { p_intervention_id: string }
        Returns: {
          community_authority: number
          evidence_strength: number
          harm_risk: number
          implementation_capability: number
          option_value: number
          portfolio_score: number
        }[]
      }
      calculate_potential_savings: {
        Args: {
          p_avg_detention_days?: number
          p_community_cost_per_day?: number
          p_detention_cost_per_day?: number
          p_young_people_diverted: number
        }
        Returns: {
          community_program_cost: number
          detention_cost_avoided: number
          generational_multiplier: number
          net_savings: number
          savings_per_person: number
          total_generational_impact: number
          young_people_diverted: number
        }[]
      }
      calculate_project_sovereignty_score: {
        Args: { target_project_id: string }
        Returns: number
      }
      calculate_reading_time: {
        Args: { content_text: string }
        Returns: number
      }
      calculate_relationship_score: {
        Args: { contact_id: string }
        Returns: number
      }
      calculate_service_completeness: {
        Args: { service_id_param: string }
        Returns: number
      }
      calculate_trust_score: {
        Args: {
          base_score?: number
          decay_days?: number
          interaction_dates: string[]
          quality_scores: number[]
        }
        Returns: number
      }
      can_access_story: {
        Args: { story_id: string; user_id: string }
        Returns: boolean
      }
      can_read_storyteller_data: { Args: never; Returns: boolean }
      check_consent_compliance: {
        Args: { p_action: string; p_entity_id: string; p_entity_type: string }
        Returns: {
          allowed: boolean
          reason: string
        }[]
      }
      cleanup_expired_conversations: { Args: never; Returns: number }
      cleanup_old_sync_events: {
        Args: { retention_days?: number }
        Returns: number
      }
      compare_interventions: {
        Args: { p_intervention_ids: string[] }
        Returns: {
          consent_level: string
          cost_per_day: number
          evidence_count: number
          evidence_level: string
          geography: string
          intervention_id: string
          name: string
          outcome_count: number
          outcome_types: string[]
          type: string
        }[]
      }
      contact_matches_region: {
        Args: { contact_location: string; region_tags: string[] }
        Returns: boolean
      }
      contact_matches_role: {
        Args: {
          contact_alignment_tags: string[]
          contact_company: string
          contact_industry: string
          contact_position: string
          contact_skills: string[]
          role_tags: string[]
        }
        Returns: boolean
      }
      cosine_similarity: { Args: { a: string; b: string }; Returns: number }
      create_decision_outcomes_table: { Args: never; Returns: undefined }
      create_decisions_table: { Args: never; Returns: undefined }
      create_empathy_project: {
        Args: {
          creator_user_id: string
          organization_email: string
          organization_name: string
          project_name: string
          template_id?: string
        }
        Returns: string
      }
      create_extraction_notifications: { Args: never; Returns: number }
      create_research_session: {
        Args: {
          p_depth?: string
          p_max_consent_level?: string
          p_query: string
          p_user_id?: string
        }
        Returns: string
      }
      create_review_reminders: { Args: never; Returns: number }
      decrement_communities_joined: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      decrement_stories_contributed: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      exec: { Args: { sql: string }; Returns: Json }
      exec_sql: { Args: { query: string }; Returns: undefined }
      execute_sql: { Args: { sql_query: string }; Returns: Json }
      find_evidence_gaps: {
        Args: {
          p_intervention_type?: string
          p_jurisdiction?: string
          p_limit?: number
        }
        Returns: {
          current_evidence_level: string
          evidence_count: number
          gap_description: string
          gap_severity: string
          geography: string
          intervention_id: string
          intervention_name: string
          intervention_type: string
          outcome_count: number
        }[]
      }
      find_similar_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      generate_album_slug: { Args: { title_text: string }; Returns: string }
      generate_short_id: { Args: { length?: number }; Returns: string }
      generate_weekly_report_data: {
        Args: { p_organization_id?: string; p_week_start: string }
        Returns: Json
      }
      get_auto_approval_stats: {
        Args: never
        Returns: {
          avg_confidence: number
          by_type_method: number
          by_type_practice: number
          by_type_principle: number
          by_type_procedure: number
          last_30_days: number
          last_7_days: number
          total_auto_approved: number
        }[]
      }
      get_business_state_summary: { Args: never; Returns: Json }
      get_contacts_needing_attention: {
        Args: { days_threshold?: number }
        Returns: {
          days_since_contact: number
          ghl_contact_id: string
          last_communication: string
          last_direction: string
          total_communications: number
        }[]
      }
      get_current_platform_organization_id: { Args: never; Returns: string }
      get_decision_recommendations: {
        Args: { limit_count?: number }
        Returns: {
          ai_recommendation: string
          confidence_score: number
          days_pending: number
          decision_id: string
          priority: string
          title: string
        }[]
      }
      get_entity_by_identifier: {
        Args: { identifier: string }
        Returns: string
      }
      get_gmail_accounts_for_sync: {
        Args: never
        Returns: {
          account_id: string
          last_history_id: string
          last_sync_at: string
          user_email: string
        }[]
      }
      get_hero_image: {
        Args: { p_link_id: string; p_link_type: string }
        Returns: {
          alt_text: string
          blurhash: string
          file_url: string
          id: string
          thumbnail_url: string
          title: string
        }[]
      }
      get_intervention_comprehensive: {
        Args: { p_intervention_id: string }
        Returns: Json
      }
      get_jurisdiction_stats: {
        Args: { p_jurisdiction: string }
        Returns: Json
      }
      get_location_id_by_name: {
        Args: { location_name: string }
        Returns: string
      }
      get_next_exa_batch: {
        Args: { p_batch_size?: number; p_campaign_type?: string }
        Returns: {
          campaign_type: string
          current_company: string
          enrich_company: boolean
          enrich_linkedin: boolean
          enrich_media: boolean
          enrich_network: boolean
          person_email: string
          person_id: string
          person_name: string
          priority: number
          queue_id: string
        }[]
      }
      get_pending_enrichments: {
        Args: { p_project_slug?: string }
        Returns: {
          ai_generated: Json
          confidence: number
          created_at: string
          enrichment_type: string
          id: string
          original_data: Json
          project_slug: string
          project_title: string
          reasoning: string
        }[]
      }
      get_pending_sync_events: {
        Args: { batch_size?: number; target_filter?: string }
        Returns: {
          created_at: string
          event_type: string
          id: string
          operation_data: Json
          priority: number
          record_id: string
          retry_count: number
          sync_target: string
          table_name: string
        }[]
      }
      get_project_media: {
        Args: { p_link_id: string; p_link_type: string }
        Returns: {
          alt_text: string
          blurhash: string
          caption: string
          credit: string
          description: string
          display_order: number
          file_type: string
          file_url: string
          height: number
          id: string
          is_featured: boolean
          is_hero: boolean
          thumbnail_url: string
          title: string
          width: number
        }[]
      }
      get_roles_by_category: {
        Args: { p_category?: string }
        Returns: {
          category: string
          description: string
          display_name: string
          display_order: number
          id: string
        }[]
      }
      get_stories_needing_analysis: {
        Args: never
        Returns: {
          created_at: string
          story_id: string
          title: string
        }[]
      }
      get_storytellers_needing_analysis: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          storyteller_id: string
        }[]
      }
      get_transcript_analysis_for_story: {
        Args: { p_story_id: string }
        Returns: {
          emotions: string[]
          insights: string[]
          quotes: string[]
          summary: string
          themes: string[]
        }[]
      }
      get_unified_services_stats: {
        Args: never
        Returns: {
          by_state: Json
          from_alma: number
          from_community_programs: number
          from_services: number
          indigenous_specific: number
          total_count: number
          with_coordinates: number
          youth_specific: number
        }[]
      }
      get_week_start: { Args: { p_date?: string }; Returns: string }
      increment_clicks: { Args: { portrait_uuid: string }; Returns: undefined }
      increment_communities_joined: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_stories_contributed: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_views: { Args: { portrait_uuid: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      log_alma_usage: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_query_text?: string
        }
        Returns: undefined
      }
      log_research_tool: {
        Args: {
          p_error_message?: string
          p_execution_time_ms: number
          p_session_id: string
          p_success: boolean
          p_tool_input: Json
          p_tool_name: string
          p_tool_output: Json
        }
        Returns: string
      }
      mark_service_verified: {
        Args: { service_id_param: string }
        Returns: undefined
      }
      match_knowledge_chunks: {
        Args: {
          filter_project_id?: string
          filter_source_type?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          confidence: number
          content: string
          file_path: string
          id: string
          metadata: Json
          project_id: string
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      normalize_location_name: { Args: { input_name: string }; Returns: string }
      populate_media_quote_links: { Args: never; Returns: undefined }
      populate_storyteller_media_links: { Args: never; Returns: undefined }
      process_new_transcript: {
        Args: {
          p_source?: string
          p_story_id: string
          p_transcript_text: string
        }
        Returns: string
      }
      queue_campaign_for_enrichment: {
        Args: {
          p_campaign_id: string
          p_campaign_type: string
          p_limit?: number
        }
        Returns: number
      }
      queue_for_exa_enrichment: {
        Args: {
          p_campaign_type?: string
          p_enrich_network?: boolean
          p_person_id: string
          p_priority?: number
        }
        Returns: string
      }
      record_research_finding: {
        Args: {
          p_confidence?: number
          p_content: Json
          p_entity_id?: string
          p_entity_type?: string
          p_finding_type: string
          p_session_id: string
          p_sources?: string[]
        }
        Returns: string
      }
      refresh_alma_dashboards: { Args: never; Returns: undefined }
      refresh_funding_relevance_scores: { Args: never; Returns: number }
      refresh_portfolio_rankings: { Args: never; Returns: undefined }
      refresh_sentiment_analytics: { Args: never; Returns: undefined }
      refresh_trust_scores: { Args: never; Returns: undefined }
      reset_failed_sync_events: {
        Args: { max_age_hours?: number; table_filter?: string }
        Returns: number
      }
      search_alma_interventions: {
        Args: {
          p_consent_level?: string
          p_evidence_level?: string
          p_geography?: string[]
          p_limit?: number
          p_query?: string
          p_type?: string
        }
        Returns: {
          consent_level: string
          description: string
          evidence_count: number
          evidence_level: string
          geography: string
          id: string
          name: string
          operating_organization: string
          outcome_count: number
          relevance_score: number
          type: string
        }[]
      }
      search_alma_unified: {
        Args: {
          entity_types?: string[]
          jurisdictions?: string[]
          limit_results?: number
          query_text: string
        }
        Returns: {
          category: string
          description: string
          entity_id: string
          entity_type: string
          jurisdiction: string
          rank: number
          title: string
        }[]
      }
      search_interventions_unified: {
        Args: {
          p_consent_level?: string
          p_geography?: string[]
          p_min_evidence_level?: string
          p_search_query: string
        }
        Returns: {
          description: string
          evidence_level: string
          geography: string[]
          id: string
          name: string
          operating_organization: string
          relevance_rank: number
          source: string
        }[]
      }
      search_media: {
        Args: {
          p_file_type?: string
          p_limit?: number
          p_offset?: number
          p_project_slug?: string
          p_search_query?: string
          p_tag?: string
        }
        Returns: {
          alt_text: string
          created_at: string
          description: string
          file_type: string
          file_url: string
          id: string
          impact_themes: string[]
          manual_tags: string[]
          project_slugs: string[]
          thumbnail_url: string
          title: string
        }[]
      }
      set_platform_organization_context: {
        Args: { org_slug: string }
        Returns: undefined
      }
      should_promote_to_notion: {
        Args: { person_uuid: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      snapshot_alma_metrics: { Args: never; Returns: undefined }
      sync_linkedin_contacts_from_imports: { Args: never; Returns: number }
      track_exa_api_usage: {
        Args: { p_request_type?: string; p_requests_used: number }
        Returns: undefined
      }
      update_gmail_sync_state: {
        Args: {
          p_account_id: string
          p_error_message?: string
          p_history_id: string
          p_items_extracted: number
          p_items_found: number
          p_status?: string
        }
        Returns: undefined
      }
      update_research_session: {
        Args: {
          p_error_message?: string
          p_plan?: Json
          p_results?: Json
          p_scratchpad?: Json
          p_session_id: string
          p_status?: string
        }
        Returns: undefined
      }
      update_source_after_scrape: {
        Args: {
          p_entities_found: number
          p_source_url: string
          p_success: boolean
        }
        Returns: undefined
      }
      update_sync_event_status: {
        Args: { error_msg?: string; event_id: string; new_status: string }
        Returns: boolean
      }
      user_can_perform_alma_action: {
        Args: { p_action: string; p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
    }
    Enums: {
      analysis_job_status_enum: "queued" | "processing" | "completed" | "failed"
      business_category:
        | "markets"
        | "arts"
        | "accommodation"
        | "services"
        | "food"
        | "wellness"
        | "retail"
        | "other"
      business_status: "pending" | "approved" | "rejected"
      connection_strength_enum:
        | "weak"
        | "moderate"
        | "strong"
        | "very_strong"
        | "foundational"
      connection_type_enum:
        | "family"
        | "professional"
        | "community"
        | "organizational"
        | "cultural"
        | "educational"
        | "mentorship"
        | "collaboration"
        | "service"
        | "advocacy"
      consent_type_enum:
        | "general_participation"
        | "ai_analysis"
        | "quote_sharing"
        | "story_sharing"
        | "image_use"
        | "contact_permission"
        | "research_participation"
        | "platform_features"
      event_category: "market" | "community" | "arts" | "workshop" | "music"
      event_status: "pending" | "approved" | "rejected"
      evidence_strength:
        | "rigorous_rct"
        | "quasi_experimental"
        | "longitudinal_study"
        | "evaluation_report"
        | "promising_practice"
        | "emerging"
      evidence_strength_enum:
        | "weak"
        | "moderate"
        | "strong"
        | "very_strong"
        | "exceptional"
      global_region:
        | "north_america"
        | "europe"
        | "asia_pacific"
        | "africa"
        | "latin_america"
        | "middle_east"
        | "australasia"
      impact_scope_enum:
        | "individual"
        | "family"
        | "local_community"
        | "regional"
        | "national"
        | "international"
        | "cultural_group"
        | "professional_network"
        | "online_community"
      impact_type_enum:
        | "personal_growth"
        | "community_development"
        | "social_change"
        | "economic_impact"
        | "cultural_preservation"
        | "education_advancement"
        | "health_improvement"
        | "environmental_benefit"
        | "innovation_creation"
        | "policy_influence"
        | "relationship_building"
        | "knowledge_transfer"
      proficiency_level_enum:
        | "beginner"
        | "developing"
        | "competent"
        | "proficient"
        | "expert"
        | "master"
      program_type:
        | "custodial_reform"
        | "diversion"
        | "restorative_justice"
        | "family_therapy"
        | "community_based"
        | "education_vocational"
        | "mentoring"
        | "prevention"
        | "reentry_support"
        | "policy_initiative"
        | "traditional_practice"
      research_category:
        | "trauma-informed"
        | "indigenous-diversion"
        | "family-engagement"
        | "restorative-justice"
        | "youth-rights"
        | "recidivism"
        | "mental-health"
      research_jurisdiction:
        | "Australia"
        | "Queensland"
        | "New Zealand"
        | "Scotland"
        | "International"
        | "Nordic"
      research_type:
        | "research-paper"
        | "systematic-review"
        | "meta-analysis"
        | "policy-brief"
        | "case-study"
        | "video"
        | "report"
      sharing_consent_enum:
        | "none"
        | "anonymous_only"
        | "attributed_sharing"
        | "full_sharing"
        | "community_only"
      skill_category_enum:
        | "technical"
        | "creative"
        | "interpersonal"
        | "leadership"
        | "analytical"
        | "cultural"
        | "traditional"
        | "entrepreneurial"
        | "educational"
        | "healing"
        | "community_building"
        | "innovation"
        | "communication"
        | "problem_solving"
      user_role: "user" | "admin"
      wisdom_type_enum:
        | "life_lesson"
        | "practical_advice"
        | "philosophical_insight"
        | "cultural_knowledge"
        | "professional_guidance"
        | "personal_reflection"
        | "community_wisdom"
        | "traditional_teaching"
        | "innovation_insight"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_job_status_enum: ["queued", "processing", "completed", "failed"],
      business_category: [
        "markets",
        "arts",
        "accommodation",
        "services",
        "food",
        "wellness",
        "retail",
        "other",
      ],
      business_status: ["pending", "approved", "rejected"],
      connection_strength_enum: [
        "weak",
        "moderate",
        "strong",
        "very_strong",
        "foundational",
      ],
      connection_type_enum: [
        "family",
        "professional",
        "community",
        "organizational",
        "cultural",
        "educational",
        "mentorship",
        "collaboration",
        "service",
        "advocacy",
      ],
      consent_type_enum: [
        "general_participation",
        "ai_analysis",
        "quote_sharing",
        "story_sharing",
        "image_use",
        "contact_permission",
        "research_participation",
        "platform_features",
      ],
      event_category: ["market", "community", "arts", "workshop", "music"],
      event_status: ["pending", "approved", "rejected"],
      evidence_strength: [
        "rigorous_rct",
        "quasi_experimental",
        "longitudinal_study",
        "evaluation_report",
        "promising_practice",
        "emerging",
      ],
      evidence_strength_enum: [
        "weak",
        "moderate",
        "strong",
        "very_strong",
        "exceptional",
      ],
      global_region: [
        "north_america",
        "europe",
        "asia_pacific",
        "africa",
        "latin_america",
        "middle_east",
        "australasia",
      ],
      impact_scope_enum: [
        "individual",
        "family",
        "local_community",
        "regional",
        "national",
        "international",
        "cultural_group",
        "professional_network",
        "online_community",
      ],
      impact_type_enum: [
        "personal_growth",
        "community_development",
        "social_change",
        "economic_impact",
        "cultural_preservation",
        "education_advancement",
        "health_improvement",
        "environmental_benefit",
        "innovation_creation",
        "policy_influence",
        "relationship_building",
        "knowledge_transfer",
      ],
      proficiency_level_enum: [
        "beginner",
        "developing",
        "competent",
        "proficient",
        "expert",
        "master",
      ],
      program_type: [
        "custodial_reform",
        "diversion",
        "restorative_justice",
        "family_therapy",
        "community_based",
        "education_vocational",
        "mentoring",
        "prevention",
        "reentry_support",
        "policy_initiative",
        "traditional_practice",
      ],
      research_category: [
        "trauma-informed",
        "indigenous-diversion",
        "family-engagement",
        "restorative-justice",
        "youth-rights",
        "recidivism",
        "mental-health",
      ],
      research_jurisdiction: [
        "Australia",
        "Queensland",
        "New Zealand",
        "Scotland",
        "International",
        "Nordic",
      ],
      research_type: [
        "research-paper",
        "systematic-review",
        "meta-analysis",
        "policy-brief",
        "case-study",
        "video",
        "report",
      ],
      sharing_consent_enum: [
        "none",
        "anonymous_only",
        "attributed_sharing",
        "full_sharing",
        "community_only",
      ],
      skill_category_enum: [
        "technical",
        "creative",
        "interpersonal",
        "leadership",
        "analytical",
        "cultural",
        "traditional",
        "entrepreneurial",
        "educational",
        "healing",
        "community_building",
        "innovation",
        "communication",
        "problem_solving",
      ],
      user_role: ["user", "admin"],
      wisdom_type_enum: [
        "life_lesson",
        "practical_advice",
        "philosophical_insight",
        "cultural_knowledge",
        "professional_guidance",
        "personal_reflection",
        "community_wisdom",
        "traditional_teaching",
        "innovation_insight",
      ],
    },
  },
} as const
