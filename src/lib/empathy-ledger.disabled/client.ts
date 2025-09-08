/**
 * Empathy Ledger Database Client
 * 
 * Direct connection to the existing Empathy Ledger database for storytelling
 * and cross-project data management.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { Database } from './database-types';

export interface EmpathyLedgerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  projectId: string;
  organizationId: string;
}

export interface EmpathyLedgerStory {
  id: string;
  external_id?: string;
  title: string;
  content: string;
  author_name?: string;
  story_type: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  project_name: string;
  organization_name: string;
  engagement_metrics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  metadata?: Record<string, any>;
}

export interface EmpathyLedgerMetrics {
  project_name: string;
  organization_name: string;
  total_stories: number;
  total_engagement: number;
  success_rate?: number;
  program_effectiveness?: number;
  cost_per_participant?: number;
  participant_count?: number;
  date_range: {
    start: string;
    end: string;
  };
  metrics: Array<{
    metric_type: string;
    value: number;
    date: string;
    metadata?: Record<string, any>;
  }>;
}

export interface EmpathyLedgerSyncResult {
  success: boolean;
  message: string;
  records_processed: number;
  records_successful: number;
  records_failed: number;
  errors?: Array<{
    record_id?: string;
    error: string;
    details?: any;
  }>;
}

export class EmpathyLedgerClient {
  private config: EmpathyLedgerConfig;
  private supabase: SupabaseClient<Database>;

  constructor(config: EmpathyLedgerConfig) {
    this.config = config;
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Test connection to Empathy Ledger API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/health`, {
        method: 'GET',
        headers: this.baseHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: `Connected to Empathy Ledger. Status: ${data.status || 'healthy'}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Import stories from Empathy Ledger
   */
  async importStories(filters?: {
    project_names?: string[];
    date_from?: string;
    date_to?: string;
    story_types?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    stories: EmpathyLedgerStory[];
    total_count: number;
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.project_names?.length) {
        queryParams.append('project_names', filters.project_names.join(','));
      }
      if (filters?.date_from) {
        queryParams.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        queryParams.append('date_to', filters.date_to);
      }
      if (filters?.story_types?.length) {
        queryParams.append('story_types', filters.story_types.join(','));
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      if (filters?.offset) {
        queryParams.append('offset', filters.offset.toString());
      }

      const url = `${this.config.baseUrl}/api/stories${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        stories: data.stories || [],
        total_count: data.total_count || 0,
        message: data.message
      };
    } catch (error: any) {
      console.error('Error importing stories from Empathy Ledger:', error);
      return {
        success: false,
        stories: [],
        total_count: 0,
        message: `Import failed: ${error.message}`
      };
    }
  }

  /**
   * Export stories to Empathy Ledger
   */
  async exportStories(stories: Omit<EmpathyLedgerStory, 'id'>[]): Promise<EmpathyLedgerSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/stories/batch`, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify({
          stories: stories.map(story => ({
            ...story,
            project_name: this.config.projectId,
            organization_name: this.config.organizationId
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: data.message || 'Stories exported successfully',
        records_processed: stories.length,
        records_successful: data.successful_count || 0,
        records_failed: data.failed_count || 0,
        errors: data.errors || []
      };
    } catch (error: any) {
      console.error('Error exporting stories to Empathy Ledger:', error);
      return {
        success: false,
        message: `Export failed: ${error.message}`,
        records_processed: stories.length,
        records_successful: 0,
        records_failed: stories.length,
        errors: [{ error: error.message }]
      };
    }
  }

  /**
   * Get cross-project analytics from Empathy Ledger
   */
  async getAnalytics(filters?: {
    project_names?: string[];
    date_from?: string;
    date_to?: string;
    metric_types?: string[];
  }): Promise<{
    success: boolean;
    metrics: EmpathyLedgerMetrics[];
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.project_names?.length) {
        queryParams.append('project_names', filters.project_names.join(','));
      }
      if (filters?.date_from) {
        queryParams.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        queryParams.append('date_to', filters.date_to);
      }
      if (filters?.metric_types?.length) {
        queryParams.append('metric_types', filters.metric_types.join(','));
      }

      const url = `${this.config.baseUrl}/api/analytics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        metrics: data.metrics || [],
        message: data.message
      };
    } catch (error: any) {
      console.error('Error fetching analytics from Empathy Ledger:', error);
      return {
        success: false,
        metrics: [],
        message: `Analytics fetch failed: ${error.message}`
      };
    }
  }

  /**
   * Get aggregated impact metrics across all projects
   */
  async getImpactMetrics(): Promise<{
    success: boolean;
    impact: {
      total_stories: number;
      total_participants: number;
      average_success_rate: number;
      total_cost_savings: number;
      projects_count: number;
      organizations_count: number;
      engagement_metrics: {
        total_views: number;
        total_likes: number;
        total_shares: number;
        average_engagement_rate: number;
      };
    };
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/impact`, {
        method: 'GET',
        headers: this.baseHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        impact: data.impact || {
          total_stories: 0,
          total_participants: 0,
          average_success_rate: 0,
          total_cost_savings: 0,
          projects_count: 0,
          organizations_count: 0,
          engagement_metrics: {
            total_views: 0,
            total_likes: 0,
            total_shares: 0,
            average_engagement_rate: 0
          }
        },
        message: data.message
      };
    } catch (error: any) {
      console.error('Error fetching impact metrics from Empathy Ledger:', error);
      return {
        success: false,
        impact: {
          total_stories: 0,
          total_participants: 0,
          average_success_rate: 0,
          total_cost_savings: 0,
          projects_count: 0,
          organizations_count: 0,
          engagement_metrics: {
            total_views: 0,
            total_likes: 0,
            total_shares: 0,
            average_engagement_rate: 0
          }
        },
        message: `Impact metrics fetch failed: ${error.message}`
      };
    }
  }

  /**
   * Submit program effectiveness data
   */
  async submitProgramMetrics(metrics: {
    program_name: string;
    success_rate: number;
    participant_count: number;
    cost_per_participant: number;
    duration_weeks: number;
    outcomes: Array<{
      outcome_type: string;
      value: number;
      description?: string;
    }>;
    date_range: {
      start: string;
      end: string;
    };
  }): Promise<EmpathyLedgerSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/programs/metrics`, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify({
          ...metrics,
          project_name: this.config.projectId,
          organization_name: this.config.organizationId,
          submitted_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: data.message || 'Program metrics submitted successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      };
    } catch (error: any) {
      console.error('Error submitting program metrics to Empathy Ledger:', error);
      return {
        success: false,
        message: `Metrics submission failed: ${error.message}`,
        records_processed: 1,
        records_successful: 0,
        records_failed: 1,
        errors: [{ error: error.message }]
      };
    }
  }
}

/**
 * Create an Empathy Ledger client from organization configuration
 */
export function createEmpathyLedgerClient(config: EmpathyLedgerConfig): EmpathyLedgerClient {
  return new EmpathyLedgerClient(config);
}

/**
 * Default client instance (requires configuration)
 */
export function getDefaultEmpathyLedgerClient(): EmpathyLedgerClient | null {
  // This would be configured based on the current organization context
  // For now, return null if no default configuration is available
  return null;
}