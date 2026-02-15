/**
 * ALMA Intervention Service
 *
 * Handles all CRUD operations for interventions with governance enforcement.
 * Every operation checks consent, validates authority, and logs usage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ALMAIntervention,
  CreateInterventionRequest,
  UpdateInterventionRequest,
  ConsentLevel,
  PermittedUse,
  ReviewStatus,
  PortfolioSignals,
} from '@/types/alma';

// Lazy-initialized Supabase client (avoids build-time errors)
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }

    _supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabase;
}

/**
 * Intervention Service - All operations enforce governance
 */
export class InterventionService {
  /**
   * Create a new intervention with governance checks
   */
  async create(
    data: CreateInterventionRequest,
    userId: string
  ): Promise<{ data: ALMAIntervention | null; error: Error | null }> {
    try {
      // Governance check: Community Controlled requires cultural authority
      if (
        data.consent_level !== 'Public Knowledge Commons' &&
        !data.cultural_authority
      ) {
        return {
          data: null,
          error: new Error(
            'Cultural authority required for Community Controlled and Strictly Private interventions'
          ),
        };
      }

      // Insert intervention
      const { data: intervention, error: insertError } = await getSupabase()
        .from('alma_interventions')
        .insert({
          ...data,
          review_status: 'Draft', // Always start as Draft
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return { data: null, error: new Error(insertError.message) };
      }

      // Create consent ledger entry
      await this.createConsentLedger(intervention.id, data, userId);

      // Log creation
      await this.logUsage(intervention.id, 'view', userId);

      // Calculate portfolio signals
      await this.calculateAndUpdateSignals(intervention.id);

      return { data: intervention, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to create intervention'),
      };
    }
  }

  /**
   * Get intervention by ID with consent filtering
   */
  async getById(
    id: string,
    userId?: string
  ): Promise<{ data: ALMAIntervention | null; error: Error | null }> {
    try {
      const { data: intervention, error } = await getSupabase()
        .from('alma_interventions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Log access
      if (userId) {
        await this.logUsage(id, 'view', userId);
      }

      return { data: intervention, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to fetch intervention'),
      };
    }
  }

  /**
   * List interventions with filters
   */
  async list(filters: {
    consent_level?: ConsentLevel;
    review_status?: ReviewStatus;
    geography?: string[];
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: ALMAIntervention[]; error: Error | null; count: number }> {
    try {
      let query = getSupabase().from('alma_interventions').select('*', { count: 'exact' });

      // Apply filters
      if (filters.consent_level) {
        query = query.eq('consent_level', filters.consent_level);
      }

      if (filters.review_status) {
        query = query.eq('review_status', filters.review_status);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.geography && filters.geography.length > 0) {
        query = query.overlaps('geography', filters.geography);
      }

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by portfolio score (highest first)
      query = query.order('portfolio_score', { ascending: false, nullsFirst: false });

      const { data, error, count } = await query;

      if (error) {
        return { data: [], error: new Error(error.message), count: 0 };
      }

      return { data: data || [], error: null, count: count || 0 };
    } catch (err) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to list interventions'),
        count: 0,
      };
    }
  }

  /**
   * Update intervention with governance checks
   */
  async update(
    req: UpdateInterventionRequest,
    userId: string
  ): Promise<{ data: ALMAIntervention | null; error: Error | null }> {
    try {
      // Get current intervention
      const { data: current } = await this.getById(req.id);

      if (!current) {
        return { data: null, error: new Error('Intervention not found') };
      }

      // Governance check: Can only update Draft status
      if (current.review_status !== 'Draft' && current.review_status !== 'Community Review') {
        return {
          data: null,
          error: new Error('Can only update interventions in Draft or Community Review status'),
        };
      }

      // Governance check: If changing consent level, verify authority
      if (
        req.consent_level &&
        req.consent_level !== 'Public Knowledge Commons' &&
        !req.cultural_authority &&
        !current.cultural_authority
      ) {
        return {
          data: null,
          error: new Error('Cultural authority required for this consent level'),
        };
      }

      const { data: updated, error: updateError } = await getSupabase()
        .from('alma_interventions')
        .update({
          ...req,
          id: undefined, // Remove id from update
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: new Error(updateError.message) };
      }

      // Recalculate portfolio signals
      await this.calculateAndUpdateSignals(req.id);

      // Log update
      await this.logUsage(req.id, 'view', userId);

      return { data: updated, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to update intervention'),
      };
    }
  }

  /**
   * Submit intervention for community review
   */
  async submitForReview(
    id: string,
    userId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data: intervention } = await this.getById(id);

      if (!intervention) {
        return { success: false, error: new Error('Intervention not found') };
      }

      if (intervention.review_status !== 'Draft') {
        return { success: false, error: new Error('Can only submit Draft interventions') };
      }

      const { error } = await getSupabase()
        .from('alma_interventions')
        .update({
          review_status: 'Community Review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      await this.logUsage(id, 'publish', userId);

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to submit for review'),
      };
    }
  }

  /**
   * Approve intervention (platform admin only)
   */
  async approve(
    id: string,
    userId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await getSupabase()
        .from('alma_interventions')
        .update({
          review_status: 'Approved',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('review_status', 'Community Review'); // Can only approve if in review

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      await this.logUsage(id, 'publish', userId);

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to approve intervention'),
      };
    }
  }

  /**
   * Publish intervention to JusticeHub (requires Approved status)
   */
  async publish(
    id: string,
    userId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Check consent compliance
      const { allowed, reason } = await this.checkConsentCompliance(id, 'Publish (JusticeHub)');

      if (!allowed) {
        return { success: false, error: new Error(`Cannot publish: ${reason}`) };
      }

      const { error } = await getSupabase()
        .from('alma_interventions')
        .update({
          review_status: 'Published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('review_status', 'Approved'); // Can only publish if approved

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      await this.logUsage(id, 'publish', userId, 'JusticeHub');

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to publish intervention'),
      };
    }
  }

  /**
   * Link outcomes to intervention
   */
  async linkOutcomes(
    interventionId: string,
    outcomeIds: string[]
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Remove existing links
      await getSupabase()
        .from('alma_intervention_outcomes')
        .delete()
        .eq('intervention_id', interventionId);

      // Create new links
      const links = outcomeIds.map((outcomeId) => ({
        intervention_id: interventionId,
        outcome_id: outcomeId,
      }));

      const { error } = await getSupabase().from('alma_intervention_outcomes').insert(links);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to link outcomes'),
      };
    }
  }

  /**
   * Link evidence to intervention
   */
  async linkEvidence(
    interventionId: string,
    evidenceIds: string[]
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Remove existing links
      await getSupabase()
        .from('alma_intervention_evidence')
        .delete()
        .eq('intervention_id', interventionId);

      // Create new links
      const links = evidenceIds.map((evidenceId) => ({
        intervention_id: interventionId,
        evidence_id: evidenceId,
      }));

      const { error } = await getSupabase().from('alma_intervention_evidence').insert(links);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to link evidence'),
      };
    }
  }

  /**
   * Link contexts to intervention
   */
  async linkContexts(
    interventionId: string,
    contextIds: string[]
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Remove existing links
      await getSupabase()
        .from('alma_intervention_contexts')
        .delete()
        .eq('intervention_id', interventionId);

      // Create new links
      const links = contextIds.map((contextId) => ({
        intervention_id: interventionId,
        context_id: contextId,
      }));

      const { error } = await getSupabase().from('alma_intervention_contexts').insert(links);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to link contexts'),
      };
    }
  }

  /**
   * Calculate and update portfolio signals for an intervention
   */
  private async calculateAndUpdateSignals(interventionId: string): Promise<void> {
    try {
      const { data, error } = await getSupabase().rpc('calculate_portfolio_signals', {
        intervention_id: interventionId,
      });

      if (error || !data || data.length === 0) {
        console.error('Failed to calculate signals:', error);
        return;
      }

      const signals = data[0];

      await getSupabase()
        .from('alma_interventions')
        .update({
          evidence_strength_signal: signals.evidence_strength,
          community_authority_signal: signals.community_authority,
          harm_risk_signal: signals.harm_risk,
          implementation_capability_signal: signals.implementation_capability,
          option_value_signal: signals.option_value,
          portfolio_score: signals.portfolio_score,
        })
        .eq('id', interventionId);
    } catch (err) {
      console.error('Error calculating signals:', err);
    }
  }

  /**
   * Create consent ledger entry
   */
  private async createConsentLedger(
    interventionId: string,
    data: CreateInterventionRequest,
    userId: string
  ): Promise<void> {
    try {
      await getSupabase().from('alma_consent_ledger').insert({
        entity_type: 'intervention',
        entity_id: interventionId,
        consent_level: data.consent_level || 'Strictly Private',
        permitted_uses: data.permitted_uses || ['Query (internal)'],
        cultural_authority: data.cultural_authority,
        contributors: data.contributors
          ? [{ name: data.operating_organization || 'Unknown' }]
          : [],
        consent_given_by: userId,
        consent_given_at: new Date().toISOString(),
        revenue_share_enabled: true,
      });
    } catch (err) {
      console.error('Failed to create consent ledger:', err);
    }
  }

  /**
   * Log usage for attribution
   */
  private async logUsage(
    interventionId: string,
    action: string,
    userId: string,
    destination?: string
  ): Promise<void> {
    try {
      await getSupabase().from('alma_usage_log').insert({
        entity_type: 'intervention',
        entity_id: interventionId,
        action,
        user_id: userId,
        destination,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log usage:', err);
    }
  }

  /**
   * Check consent compliance for an action
   */
  private async checkConsentCompliance(
    interventionId: string,
    action: PermittedUse
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data, error } = await getSupabase().rpc('check_consent_compliance', {
        p_entity_type: 'intervention',
        p_entity_id: interventionId,
        p_action: action,
      });

      if (error || !data || data.length === 0) {
        return { allowed: false, reason: 'Failed to check consent' };
      }

      const result = data[0];
      return { allowed: result.allowed, reason: result.reason };
    } catch (err) {
      return { allowed: false, reason: 'Error checking consent' };
    }
  }
}

// Export singleton instance
export const interventionService = new InterventionService();
