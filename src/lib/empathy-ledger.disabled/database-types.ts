/**
 * Empathy Ledger Database Types
 * 
 * TypeScript definitions for the existing Empathy Ledger database structure.
 * This connects JusticeHub to the existing storytelling database.
 */

export interface Database {
  public: {
    Tables: {
      // Existing Empathy Ledger tables
      storytellers: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email?: string;
          age?: number;
          location?: string;
          bio?: string;
          avatar_url?: string;
          project_id: string;
          organization_id: string;
          consent_status: 'pending' | 'granted' | 'revoked';
          privacy_settings: any;
          is_active: boolean;
          metadata?: any;
        };
        Insert: Omit<Database['public']['Tables']['storytellers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['storytellers']['Insert']>;
      };
      
      stories: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          content: string;
          storyteller_id: string;
          project_id: string;
          organization_id: string;
          story_type: string;
          visibility: 'public' | 'organization' | 'private';
          status: 'draft' | 'published' | 'archived';
          tags: string[];
          media_urls?: string[];
          view_count: number;
          like_count: number;
          share_count: number;
          featured_image_url?: string;
          consent_verified: boolean;
          metadata?: any;
        };
        Insert: Omit<Database['public']['Tables']['stories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['stories']['Insert']>;
      };
      
      projects: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          description: string;
          organization_id: string;
          project_type: string;
          status: 'active' | 'inactive' | 'completed';
          settings: any;
          success_metrics?: any;
          is_public: boolean;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      
      organizations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          description?: string;
          website?: string;
          contact_email?: string;
          logo_url?: string;
          organization_type: string;
          location?: string;
          is_verified: boolean;
          settings: any;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      
      story_interactions: {
        Row: {
          id: string;
          created_at: string;
          story_id: string;
          storyteller_id?: string;
          interaction_type: 'view' | 'like' | 'share' | 'comment';
          metadata?: any;
        };
        Insert: Omit<Database['public']['Tables']['story_interactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_interactions']['Insert']>;
      };
      
      consent_records: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          storyteller_id: string;
          story_id?: string;
          consent_type: string;
          status: 'granted' | 'revoked' | 'pending';
          consent_details: any;
          expires_at?: string;
          granted_by?: string;
        };
        Insert: Omit<Database['public']['Tables']['consent_records']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['consent_records']['Insert']>;
      };
      
      cross_project_metrics: {
        Row: {
          id: string;
          created_at: string;
          project_id: string;
          organization_id: string;
          metric_type: string;
          metric_value: number;
          metric_date: string;
          metadata?: any;
        };
        Insert: Omit<Database['public']['Tables']['cross_project_metrics']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cross_project_metrics']['Insert']>;
      };
      
      // JusticeHub specific tables (if needed for additional functionality)
      justicehub_users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          storyteller_id?: string;
          email: string;
          role: 'storyteller' | 'mentor' | 'admin';
          auth_provider: string;
          auth_id: string;
          last_login?: string;
          preferences: any;
        };
        Insert: Omit<Database['public']['Tables']['justicehub_users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['justicehub_users']['Insert']>;
      };
    };
    Views: {
      story_analytics: {
        Row: {
          story_id: string;
          title: string;
          storyteller_name: string;
          project_name: string;
          organization_name: string;
          total_views: number;
          total_likes: number;
          total_shares: number;
          engagement_rate: number;
          created_at: string;
        };
      };
      
      project_impact: {
        Row: {
          project_id: string;
          project_name: string;
          organization_name: string;
          total_stories: number;
          total_storytellers: number;
          total_engagement: number;
          success_rate?: number;
          cost_effectiveness?: number;
        };
      };
    };
    Functions: {
      get_story_engagement: {
        Args: { story_id: string };
        Returns: {
          views: number;
          likes: number;
          shares: number;
          comments: number;
        }[];
      };
      
      get_project_metrics: {
        Args: { 
          project_id: string;
          date_from?: string;
          date_to?: string;
        };
        Returns: {
          metric_type: string;
          metric_value: number;
          metric_date: string;
        }[];
      };
    };
  };
}