/**
 * ALMA Consent Service
 *
 * Governance middleware that enforces ALMA's consent model.
 * Every action that touches ALMA data goes through these checks.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  EntityType,
  ConsentLevel,
  PermittedUse,
  ALMAConsentLedger,
  GovernanceCheck,
  GovernanceViolation,
} from '@/types/alma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Consent Service - All ALMA governance checks
 */
export class ConsentService {
  /**
   * Check if action is permitted for entity
   */
  async checkPermission(
    entityType: EntityType,
    entityId: string,
    action: PermittedUse,
    userId?: string
  ): Promise<{ allowed: boolean; reason?: string; checks: GovernanceCheck[] }> {
    const checks: GovernanceCheck[] = [];

    try {
      // Get consent ledger entry
      const { data: consent } = await this.getConsentLedger(entityType, entityId);

      if (!consent) {
        checks.push({
          rule: 'consent_exists',
          passed: false,
          reason: 'No consent record found',
        });

        return {
          allowed: false,
          reason: 'No consent record found for this entity',
          checks,
        };
      }

      // Check 1: Consent not revoked
      if (consent.consent_revoked) {
        checks.push({
          rule: 'consent_not_revoked',
          passed: false,
          reason: `Consent revoked on ${consent.consent_revoked_at}`,
        });

        return {
          allowed: false,
          reason: 'Consent has been revoked',
          checks,
        };
      }

      checks.push({
        rule: 'consent_not_revoked',
        passed: true,
      });

      // Check 2: Consent not expired
      if (consent.consent_expires_at) {
        const expired = new Date(consent.consent_expires_at) < new Date();
        if (expired) {
          checks.push({
            rule: 'consent_not_expired',
            passed: false,
            reason: `Consent expired on ${consent.consent_expires_at}`,
            required_action: 'Renew consent',
          });

          return {
            allowed: false,
            reason: 'Consent has expired',
            checks,
          };
        }
      }

      checks.push({
        rule: 'consent_not_expired',
        passed: true,
      });

      // Check 3: Action is permitted
      const actionPermitted = consent.permitted_uses.includes(action);

      if (!actionPermitted) {
        checks.push({
          rule: 'action_permitted',
          passed: false,
          reason: `Action "${action}" not in permitted uses: ${consent.permitted_uses.join(', ')}`,
          required_action: 'Update consent to include this action',
        });

        return {
          allowed: false,
          reason: `Action "${action}" not permitted`,
          checks,
        };
      }

      checks.push({
        rule: 'action_permitted',
        passed: true,
      });

      // Check 4: Consent level allows action
      const levelCheck = this.checkConsentLevelForAction(consent.consent_level, action);

      if (!levelCheck.passed) {
        checks.push(levelCheck);
        return {
          allowed: false,
          reason: levelCheck.reason,
          checks,
        };
      }

      checks.push(levelCheck);

      // All checks passed
      return {
        allowed: true,
        checks,
      };
    } catch (err) {
      checks.push({
        rule: 'system_error',
        passed: false,
        reason: err instanceof Error ? err.message : 'Unknown error',
      });

      return {
        allowed: false,
        reason: 'System error checking consent',
        checks,
      };
    }
  }

  /**
   * Check consent level restrictions for specific actions
   */
  private checkConsentLevelForAction(
    consentLevel: ConsentLevel,
    action: PermittedUse
  ): GovernanceCheck {
    // Strictly Private: Only internal queries allowed
    if (consentLevel === 'Strictly Private') {
      if (action !== 'Query (internal)') {
        return {
          rule: 'consent_level_restriction',
          passed: false,
          reason: 'Strictly Private entities can only be queried internally',
          required_action: 'Escalate consent level to Community Controlled or Public',
        };
      }
    }

    // Community Controlled: No AI training without explicit permission
    if (consentLevel === 'Community Controlled') {
      if (action === 'Training (AI)') {
        return {
          rule: 'consent_level_restriction',
          passed: false,
          reason: 'Community Controlled entities require explicit permission for AI training',
          required_action: 'Obtain community approval for AI training',
        };
      }
    }

    return {
      rule: 'consent_level_restriction',
      passed: true,
    };
  }

  /**
   * Get consent ledger entry for entity
   */
  async getConsentLedger(
    entityType: EntityType,
    entityId: string
  ): Promise<{ data: ALMAConsentLedger | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('alma_consent_ledger')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to get consent ledger'),
      };
    }
  }

  /**
   * Create or update consent ledger entry
   */
  async updateConsent(
    entityType: EntityType,
    entityId: string,
    consent: {
      consent_level: ConsentLevel;
      permitted_uses: PermittedUse[];
      cultural_authority?: string;
      contributors?: any[];
      consent_given_by: string;
      consent_expires_at?: string;
      revenue_share_enabled?: boolean;
      revenue_share_percentage?: number;
    }
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.from('alma_consent_ledger').insert({
        entity_type: entityType,
        entity_id: entityId,
        ...consent,
        consent_given_at: new Date().toISOString(),
        consent_revoked: false,
      });

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update consent'),
      };
    }
  }

  /**
   * Revoke consent
   */
  async revokeConsent(
    entityType: EntityType,
    entityId: string,
    revokedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get current consent
      const { data: current } = await this.getConsentLedger(entityType, entityId);

      if (!current) {
        return { success: false, error: new Error('No consent record found') };
      }

      // Update to revoked
      const { error } = await supabase
        .from('alma_consent_ledger')
        .update({
          consent_revoked: true,
          consent_revoked_at: new Date().toISOString(),
          consent_revoked_by: revokedBy,
          notes: reason || current.notes,
        })
        .eq('id', current.id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to revoke consent'),
      };
    }
  }

  /**
   * Check if cultural authority is required and present
   */
  checkCulturalAuthority(
    consentLevel: ConsentLevel,
    culturalAuthority?: string
  ): GovernanceCheck {
    if (consentLevel !== 'Public Knowledge Commons' && !culturalAuthority) {
      return {
        rule: 'cultural_authority_required',
        passed: false,
        reason: 'Cultural authority required for Community Controlled and Strictly Private',
        required_action: 'Specify who holds authority over this knowledge',
      };
    }

    return {
      rule: 'cultural_authority_required',
      passed: true,
    };
  }

  /**
   * Enforce all governance gates before action
   */
  async enforceGates(
    entityType: EntityType,
    entityId: string,
    action: PermittedUse,
    userId?: string
  ): Promise<void> {
    const result = await this.checkPermission(entityType, entityId, action, userId);

    if (!result.allowed) {
      const violation: GovernanceViolation = {
        failed_checks: result.checks.filter((c) => !c.passed),
        entity_type: entityType,
        entity_id: entityId,
        action,
      };

      throw new Error(
        `Governance violation: ${result.reason}\n\nFailed checks:\n${violation.failed_checks
          .map((c) => `- ${c.rule}: ${c.reason}`)
          .join('\n')}`
      );
    }
  }

  /**
   * Log consent usage for attribution
   */
  async logConsentUsage(
    entityType: EntityType,
    entityId: string,
    action: PermittedUse,
    userId?: string,
    revenueGenerated?: number
  ): Promise<void> {
    try {
      await supabase.from('alma_usage_log').insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        user_id: userId,
        revenue_generated: revenueGenerated,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log consent usage:', err);
    }
  }

  /**
   * Get usage history for entity (for attribution/revenue sharing)
   */
  async getUsageHistory(
    entityType: EntityType,
    entityId: string,
    filters?: {
      action?: PermittedUse;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    data: any[];
    totalRevenue: number;
    error: Error | null;
  }> {
    try {
      let query = supabase
        .from('alma_usage_log')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return { data: [], totalRevenue: 0, error: new Error(error.message) };
      }

      const totalRevenue = data.reduce(
        (sum, log) => sum + (log.revenue_generated || 0),
        0
      );

      return { data: data || [], totalRevenue, error: null };
    } catch (err) {
      return {
        data: [],
        totalRevenue: 0,
        error: err instanceof Error ? err : new Error('Failed to get usage history'),
      };
    }
  }
}

// Export singleton instance
export const consentService = new ConsentService();
