/**
 * Empathy Ledger Service
 * 
 * High-level service for managing Empathy Ledger integration,
 * including data synchronization and analytics aggregation.
 */

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { EmpathyLedgerClient, EmpathyLedgerConfig, EmpathyLedgerStory, EmpathyLedgerSyncResult } from './client';

export interface SyncOptions {
  organizationId: string;
  syncType: 'import' | 'export' | 'full_sync';
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    storyTypes?: string[];
    includeUnpublished?: boolean;
  };
}

export interface SyncResult extends EmpathyLedgerSyncResult {
  syncLogId: string;
  duration: number;
}

export class EmpathyLedgerService {
  private supabase = createSupabaseServerClient();

  /**
   * Get Empathy Ledger configuration for an organization
   */
  async getOrganizationConfig(organizationId: string): Promise<EmpathyLedgerConfig | null> {
    try {
      const { data: org, error } = await this.supabase
        .from('organizations')
        .select('empathy_ledger_config, name, slug')
        .eq('id', organizationId)
        .single();

      if (error || !org?.empathy_ledger_config) {
        return null;
      }

      const config = org.empathy_ledger_config as any;
      
      return {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://api.empathyledger.org',
        projectId: config.projectId || org.slug,
        organizationId: org.name
      };
    } catch (error) {
      console.error('Error getting Empathy Ledger config:', error);
      return null;
    }
  }

  /**
   * Import stories from Empathy Ledger into local database
   */
  async importStories(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    
    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await this.supabase
      .from('empathy_ledger_sync_log')
      .insert({
        organization_id: options.organizationId,
        sync_type: options.syncType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (syncLogError || !syncLog) {
      throw new Error(`Failed to create sync log: ${syncLogError?.message}`);
    }

    try {
      // Get organization config
      const config = await this.getOrganizationConfig(options.organizationId);
      if (!config) {
        throw new Error('No Empathy Ledger configuration found for organization');
      }

      // Create client and import stories
      const client = new EmpathyLedgerClient(config);
      const importResult = await client.importStories({
        date_from: options.filters?.dateFrom,
        date_to: options.filters?.dateTo,
        story_types: options.filters?.storyTypes,
        limit: 1000 // Reasonable batch size
      });

      if (!importResult.success) {
        throw new Error(importResult.message || 'Import failed');
      }

      // Transform and insert stories into local database
      let successCount = 0;
      let failCount = 0;
      const errors: Array<{ record_id?: string; error: string }> = [];

      for (const story of importResult.stories) {
        try {
          // Check if story already exists
          const { data: existingStory } = await this.supabase
            .from('stories')
            .select('id')
            .eq('external_id', story.id)
            .eq('source', 'empathy_ledger')
            .single();

          const storyData = {
            title: story.title,
            content: story.content,
            slug: this.generateSlug(story.title),
            external_id: story.id,
            organization_id: options.organizationId,
            source: 'empathy_ledger' as const,
            story_type: story.story_type,
            visibility: 'organization' as const,
            status: 'published' as const,
            tags: story.tags,
            published_at: story.created_at,
            metadata: {
              empathy_ledger: {
                project_name: story.project_name,
                organization_name: story.organization_name,
                engagement_metrics: story.engagement_metrics,
                imported_at: new Date().toISOString()
              }
            }
          };

          if (existingStory) {
            // Update existing story
            const { error: updateError } = await this.supabase
              .from('stories')
              .update({
                ...storyData,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingStory.id);

            if (updateError) throw updateError;
          } else {
            // Insert new story
            const { error: insertError } = await this.supabase
              .from('stories')
              .insert(storyData);

            if (insertError) throw insertError;
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error processing story ${story.id}:`, error);
          failCount++;
          errors.push({
            record_id: story.id,
            error: error.message
          });
        }
      }

      // Update sync log
      const duration = Date.now() - startTime;
      await this.supabase
        .from('empathy_ledger_sync_log')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_processed: importResult.stories.length,
          records_successful: successCount,
          records_failed: failCount,
          error_details: errors.length > 0 ? { errors } : null
        })
        .eq('id', syncLog.id);

      return {
        success: true,
        message: `Import completed: ${successCount} stories imported, ${failCount} errors`,
        records_processed: importResult.stories.length,
        records_successful: successCount,
        records_failed: failCount,
        errors: errors.length > 0 ? errors : undefined,
        syncLogId: syncLog.id,
        duration
      };

    } catch (error: any) {
      // Update sync log with error
      const duration = Date.now() - startTime;
      await this.supabase
        .from('empathy_ledger_sync_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: { error: error.message }
        })
        .eq('id', syncLog.id);

      return {
        success: false,
        message: `Import failed: ${error.message}`,
        records_processed: 0,
        records_successful: 0,
        records_failed: 0,
        syncLogId: syncLog.id,
        duration
      };
    }
  }

  /**
   * Export stories to Empathy Ledger
   */
  async exportStories(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    
    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await this.supabase
      .from('empathy_ledger_sync_log')
      .insert({
        organization_id: options.organizationId,
        sync_type: options.syncType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (syncLogError || !syncLog) {
      throw new Error(`Failed to create sync log: ${syncLogError?.message}`);
    }

    try {
      // Get organization config
      const config = await this.getOrganizationConfig(options.organizationId);
      if (!config) {
        throw new Error('No Empathy Ledger configuration found for organization');
      }

      // Get stories to export
      let query = this.supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          story_type,
          tags,
          created_at,
          updated_at,
          published_at,
          author_id,
          users!stories_author_id_fkey(display_name)
        `)
        .eq('organization_id', options.organizationId)
        .eq('source', 'local');

      if (!options.filters?.includeUnpublished) {
        query = query.eq('status', 'published');
      }

      if (options.filters?.dateFrom) {
        query = query.gte('created_at', options.filters.dateFrom);
      }

      if (options.filters?.dateTo) {
        query = query.lte('created_at', options.filters.dateTo);
      }

      if (options.filters?.storyTypes?.length) {
        query = query.in('story_type', options.filters.storyTypes);
      }

      const { data: stories, error: storiesError } = await query;

      if (storiesError) {
        throw new Error(`Failed to fetch stories: ${storiesError.message}`);
      }

      if (!stories || stories.length === 0) {
        const duration = Date.now() - startTime;
        await this.supabase
          .from('empathy_ledger_sync_log')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            records_processed: 0,
            records_successful: 0,
            records_failed: 0
          })
          .eq('id', syncLog.id);

        return {
          success: true,
          message: 'No stories to export',
          records_processed: 0,
          records_successful: 0,
          records_failed: 0,
          syncLogId: syncLog.id,
          duration
        };
      }

      // Transform stories for Empathy Ledger
      const empathyLedgerStories: Omit<EmpathyLedgerStory, 'id'>[] = stories.map(story => ({
        external_id: story.id,
        title: story.title,
        content: story.content,
        author_name: (story.users as any)?.display_name || 'Anonymous',
        story_type: story.story_type,
        tags: story.tags || [],
        created_at: story.created_at,
        updated_at: story.updated_at,
        project_name: config.projectId,
        organization_name: config.organizationId,
        metadata: {
          justicehub_id: story.id,
          published_at: story.published_at
        }
      }));

      // Export to Empathy Ledger
      const client = new EmpathyLedgerClient(config);
      const exportResult = await client.exportStories(empathyLedgerStories);

      // Update sync log
      const duration = Date.now() - startTime;
      await this.supabase
        .from('empathy_ledger_sync_log')
        .update({
          status: exportResult.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          records_processed: exportResult.records_processed,
          records_successful: exportResult.records_successful,
          records_failed: exportResult.records_failed,
          error_details: exportResult.errors?.length ? { errors: exportResult.errors } : null
        })
        .eq('id', syncLog.id);

      return {
        ...exportResult,
        syncLogId: syncLog.id,
        duration
      };

    } catch (error: any) {
      // Update sync log with error
      const duration = Date.now() - startTime;
      await this.supabase
        .from('empathy_ledger_sync_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: { error: error.message }
        })
        .eq('id', syncLog.id);

      return {
        success: false,
        message: `Export failed: ${error.message}`,
        records_processed: 0,
        records_successful: 0,
        records_failed: 0,
        syncLogId: syncLog.id,
        duration
      };
    }
  }

  /**
   * Perform full synchronization (import and export)
   */
  async fullSync(options: Omit<SyncOptions, 'syncType'>): Promise<{
    import: SyncResult;
    export: SyncResult;
    overall: {
      success: boolean;
      message: string;
      duration: number;
    };
  }> {
    const startTime = Date.now();

    // Import first
    const importResult = await this.importStories({
      ...options,
      syncType: 'import'
    });

    // Then export
    const exportResult = await this.exportStories({
      ...options,
      syncType: 'export'
    });

    const duration = Date.now() - startTime;
    const overallSuccess = importResult.success && exportResult.success;

    return {
      import: importResult,
      export: exportResult,
      overall: {
        success: overallSuccess,
        message: overallSuccess 
          ? 'Full synchronization completed successfully'
          : 'Full synchronization completed with errors',
        duration
      }
    };
  }

  /**
   * Get sync history for an organization
   */
  async getSyncHistory(organizationId: string, limit: number = 50) {
    const { data, error } = await this.supabase
      .from('empathy_ledger_sync_log')
      .select('*')
      .eq('organization_id', organizationId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch sync history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update cross-project metrics
   */
  async updateCrossProjectMetrics(organizationId: string) {
    try {
      const config = await this.getOrganizationConfig(organizationId);
      if (!config) {
        throw new Error('No Empathy Ledger configuration found');
      }

      const client = new EmpathyLedgerClient(config);
      const analyticsResult = await client.getAnalytics();

      if (!analyticsResult.success) {
        throw new Error(analyticsResult.message || 'Failed to fetch analytics');
      }

      // Update local metrics table
      for (const metric of analyticsResult.metrics) {
        for (const metricData of metric.metrics) {
          await this.supabase
            .from('cross_project_metrics')
            .upsert({
              project_name: metric.project_name,
              organization_id: organizationId,
              metric_type: metricData.metric_type,
              metric_value: metricData.value,
              metric_date: metricData.date,
              metadata: metricData.metadata || {}
            }, {
              onConflict: 'project_name,organization_id,metric_type,metric_date'
            });
        }
      }

      return {
        success: true,
        message: `Updated metrics for ${analyticsResult.metrics.length} projects`
      };
    } catch (error: any) {
      console.error('Error updating cross-project metrics:', error);
      return {
        success: false,
        message: `Failed to update metrics: ${error.message}`
      };
    }
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100);
  }
}

// Export singleton instance
export const empathyLedgerService = new EmpathyLedgerService();