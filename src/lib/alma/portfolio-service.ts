/**
 * ALMA Portfolio Service
 *
 * Portfolio analytics and recommendation engine.
 * Calculates signals, builds portfolios, identifies opportunities.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ALMAIntervention,
  PortfolioSignals,
  InterventionScore,
  PortfolioAnalysis,
  PortfolioConstraints,
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
 * Portfolio Service - Intelligence and recommendations
 */
export class PortfolioService {
  /**
   * Default portfolio constraints (from ALMA Charter)
   */
  private defaultConstraints: PortfolioConstraints = {
    max_untested_allocation: 0.15, // Max 15% untested
    min_community_endorsed: 0.8, // Min 80% community-endorsed
    harm_risk_cap: 'Medium', // No high-risk without mitigation
  };

  /**
   * Calculate portfolio signals for an intervention
   */
  async calculateSignals(interventionId: string): Promise<PortfolioSignals | null> {
    try {
      const { data, error } = await getSupabase().rpc('calculate_portfolio_signals', {
        intervention_id: interventionId,
      });

      if (error || !data || data.length === 0) {
        console.error('Failed to calculate signals:', error);
        return null;
      }

      return data[0] as PortfolioSignals;
    } catch (err) {
      console.error('Error calculating signals:', err);
      return null;
    }
  }

  /**
   * Score all interventions and return analysis
   */
  async analyzePortfolio(
    constraints: Partial<PortfolioConstraints> = {}
  ): Promise<PortfolioAnalysis> {
    const finalConstraints = { ...this.defaultConstraints, ...constraints };

    // Get all approved or published interventions
    const { data: interventions } = await getSupabase()
      .from('alma_interventions')
      .select('*')
      .in('review_status', ['Approved', 'Published'])
      .order('portfolio_score', { ascending: false, nullsFirst: false });

    if (!interventions || interventions.length === 0) {
      return {
        underfunded_high_evidence: [],
        promising_but_unproven: [],
        ready_to_scale: [],
        high_risk_flagged: [],
        learning_opportunities: [],
      };
    }

    // Score each intervention
    const scored: InterventionScore[] = interventions.map((i) => ({
      intervention: i,
      signals: {
        evidence_strength: i.evidence_strength_signal || 0,
        community_authority: i.community_authority_signal || 0,
        harm_risk: i.harm_risk_signal || 0,
        implementation_capability: i.implementation_capability_signal || 0,
        option_value: i.option_value_signal || 0,
        portfolio_score: i.portfolio_score || 0,
      },
      confidence: this.calculateConfidence(i),
      recommendations: this.generateRecommendations(i),
      risks: this.identifyRisks(i),
    }));

    // Categorize interventions
    return {
      underfunded_high_evidence: scored
        .filter(
          (s) =>
            s.signals.evidence_strength > 0.7 &&
            s.intervention.current_funding &&
            ['Unfunded', 'Pilot/seed', 'At-risk'].includes(s.intervention.current_funding)
        )
        .slice(0, 10),

      promising_but_unproven: scored
        .filter(
          (s) =>
            s.signals.evidence_strength < 0.5 &&
            s.signals.community_authority > 0.6 &&
            s.signals.option_value > 0.6
        )
        .slice(0, 10),

      ready_to_scale: scored
        .filter(
          (s) =>
            s.signals.evidence_strength > 0.8 &&
            s.signals.community_authority > 0.7 &&
            s.intervention.replication_readiness === 'Ready (playbook available)'
        )
        .slice(0, 10),

      high_risk_flagged: scored
        .filter(
          (s) =>
            s.intervention.harm_risk_level &&
            ['High', 'Requires cultural review'].includes(s.intervention.harm_risk_level)
        )
        .slice(0, 10),

      learning_opportunities: scored
        .filter(
          (s) =>
            s.signals.option_value > 0.7 &&
            s.signals.community_authority > 0.6 &&
            s.intervention.evidence_level?.includes('Untested')
        )
        .slice(0, 10),
    };
  }

  /**
   * Build a diversified portfolio
   */
  async buildPortfolio(
    totalBudget: number,
    constraints: Partial<PortfolioConstraints> = {}
  ): Promise<{
    interventions: Array<{
      intervention: ALMAIntervention;
      allocation: number;
      percentage: number;
      rationale: string;
    }>;
    totalAllocated: number;
    diversification: {
      byType: Record<string, number>;
      byGeography: Record<string, number>;
      byEvidenceLevel: Record<string, number>;
    };
  }> {
    const finalConstraints = { ...this.defaultConstraints, ...constraints };
    const analysis = await this.analyzePortfolio(finalConstraints);

    // Portfolio allocation strategy:
    // - 60% High evidence + ready to scale
    // - 25% Underfunded high evidence
    // - 15% Learning/promising but unproven

    const allocations: Array<{
      intervention: ALMAIntervention;
      allocation: number;
      percentage: number;
      rationale: string;
    }> = [];

    // Allocate to ready-to-scale (60%)
    const scaleAllocation = totalBudget * 0.6;
    const scaleInterventions = analysis.ready_to_scale.slice(0, 5);
    const perScale = scaleInterventions.length > 0 ? scaleAllocation / scaleInterventions.length : 0;

    scaleInterventions.forEach((s) => {
      allocations.push({
        intervention: s.intervention,
        allocation: perScale,
        percentage: (perScale / totalBudget) * 100,
        rationale: 'Ready to scale: High evidence + community authority + replication ready',
      });
    });

    // Allocate to underfunded (25%)
    const underfundedAllocation = totalBudget * 0.25;
    const underfundedInterventions = analysis.underfunded_high_evidence.slice(0, 3);
    const perUnderfunded =
      underfundedInterventions.length > 0 ? underfundedAllocation / underfundedInterventions.length : 0;

    underfundedInterventions.forEach((s) => {
      allocations.push({
        intervention: s.intervention,
        allocation: perUnderfunded,
        percentage: (perUnderfunded / totalBudget) * 100,
        rationale: 'Underfunded opportunity: High evidence but lacks funding',
      });
    });

    // Allocate to learning (15%)
    const learningAllocation = totalBudget * 0.15;
    const learningInterventions = analysis.learning_opportunities.slice(0, 2);
    const perLearning =
      learningInterventions.length > 0 ? learningAllocation / learningInterventions.length : 0;

    learningInterventions.forEach((s) => {
      allocations.push({
        intervention: s.intervention,
        allocation: perLearning,
        percentage: (perLearning / totalBudget) * 100,
        rationale: 'Learning opportunity: High potential but needs evidence building',
      });
    });

    // Calculate diversification
    const diversification = {
      byType: this.calculateDiversification(allocations, 'type'),
      byGeography: this.calculateDiversification(allocations, 'geography'),
      byEvidenceLevel: this.calculateDiversification(allocations, 'evidence_level'),
    };

    return {
      interventions: allocations,
      totalAllocated: allocations.reduce((sum, a) => sum + a.allocation, 0),
      diversification,
    };
  }

  /**
   * Identify funding gaps
   */
  async identifyGaps(): Promise<{
    geographic_gaps: Array<{ state: string; gap_score: number }>;
    cohort_gaps: Array<{ cohort: string; gap_score: number }>;
    type_gaps: Array<{ type: string; gap_score: number }>;
  }> {
    const { data: interventions } = await getSupabase()
      .from('alma_interventions')
      .select('geography, target_cohort, type, current_funding, portfolio_score')
      .in('review_status', ['Approved', 'Published']);

    if (!interventions || interventions.length === 0) {
      return {
        geographic_gaps: [],
        cohort_gaps: [],
        type_gaps: [],
      };
    }

    // Analyze geographic coverage
    const geoMap = new Map<string, number>();
    interventions.forEach((i) => {
      i.geography?.forEach((g: string) => {
        const current = geoMap.get(g) || 0;
        // Weight by funding status (unfunded = higher gap)
        const weight = ['Unfunded', 'At-risk'].includes(i.current_funding) ? 2 : 1;
        geoMap.set(g, current + weight);
      });
    });

    const geographic_gaps = Array.from(geoMap.entries())
      .map(([state, count]) => ({
        state,
        gap_score: Math.max(0, 10 - count), // Gap = 10 - coverage
      }))
      .filter((g) => g.gap_score > 0)
      .sort((a, b) => b.gap_score - a.gap_score);

    // Analyze cohort coverage
    const cohortMap = new Map<string, number>();
    interventions.forEach((i) => {
      i.target_cohort?.forEach((c: string) => {
        const current = cohortMap.get(c) || 0;
        cohortMap.set(c, current + 1);
      });
    });

    const cohort_gaps = Array.from(cohortMap.entries())
      .map(([cohort, count]) => ({
        cohort,
        gap_score: Math.max(0, 10 - count),
      }))
      .filter((g) => g.gap_score > 0)
      .sort((a, b) => b.gap_score - a.gap_score);

    // Analyze type coverage
    const typeMap = new Map<string, number>();
    interventions.forEach((i) => {
      const current = typeMap.get(i.type) || 0;
      typeMap.set(i.type, current + 1);
    });

    const type_gaps = Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        gap_score: Math.max(0, 10 - count),
      }))
      .filter((g) => g.gap_score > 0)
      .sort((a, b) => b.gap_score - a.gap_score);

    return {
      geographic_gaps,
      cohort_gaps,
      type_gaps,
    };
  }

  /**
   * Calculate confidence score for intervention
   */
  private calculateConfidence(intervention: ALMAIntervention): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for proven evidence
    if (intervention.evidence_level?.includes('Proven')) {
      confidence += 0.3;
    } else if (intervention.evidence_level?.includes('Effective')) {
      confidence += 0.2;
    } else if (intervention.evidence_level?.includes('Indigenous-led')) {
      confidence += 0.25;
    }

    // Higher confidence if culturally grounded
    if (intervention.cultural_authority) {
      confidence += 0.1;
    }

    // Higher confidence if operating for years
    if (intervention.years_operating && intervention.years_operating > 5) {
      confidence += 0.1;
    }

    // Lower confidence if high risk
    if (intervention.harm_risk_level === 'High') {
      confidence -= 0.2;
    }

    return Math.min(1.0, Math.max(0, confidence));
  }

  /**
   * Generate recommendations for intervention
   */
  private generateRecommendations(intervention: ALMAIntervention): string[] {
    const recommendations: string[] = [];

    // Funding recommendations
    if (intervention.current_funding === 'Unfunded' && intervention.portfolio_score && intervention.portfolio_score > 0.7) {
      recommendations.push('FUND: High portfolio score but unfunded');
    }

    if (intervention.current_funding === 'At-risk') {
      recommendations.push('URGENT: Intervention at risk of closure');
    }

    // Scaling recommendations
    if (intervention.replication_readiness === 'Ready (playbook available)') {
      recommendations.push('SCALE: Ready for replication with playbook');
    }

    // Learning recommendations
    if (intervention.evidence_level?.includes('Untested') && intervention.community_authority_signal && intervention.community_authority_signal > 0.7) {
      recommendations.push('LEARN: Strong community endorsement, invest in evaluation');
    }

    // Risk recommendations
    if (intervention.harm_risk_level === 'High') {
      recommendations.push('CAUTION: High harm risk - require mitigation plan');
    }

    if (intervention.harm_risk_level === 'Requires cultural review') {
      recommendations.push('REVIEW: Requires cultural safety assessment');
    }

    return recommendations;
  }

  /**
   * Identify risks for intervention
   */
  private identifyRisks(intervention: ALMAIntervention): string[] {
    const risks: string[] = [];

    if (intervention.risks) {
      risks.push(intervention.risks);
    }

    if (intervention.harm_risk_level === 'High') {
      risks.push('High harm risk identified');
    }

    if (intervention.scalability === 'Local only' && intervention.replication_readiness?.includes('Ready')) {
      risks.push('Marked as replication-ready but scalability is local only');
    }

    if (!intervention.cultural_authority && intervention.evidence_level?.includes('Indigenous-led')) {
      risks.push('Indigenous-led but no cultural authority specified');
    }

    return risks;
  }

  /**
   * Calculate diversification metrics
   */
  private calculateDiversification(
    allocations: Array<{ intervention: ALMAIntervention; allocation: number }>,
    dimension: 'type' | 'geography' | 'evidence_level'
  ): Record<string, number> {
    const map = new Map<string, number>();

    allocations.forEach((a) => {
      if (dimension === 'type') {
        const current = map.get(a.intervention.type) || 0;
        map.set(a.intervention.type, current + a.allocation);
      } else if (dimension === 'geography') {
        a.intervention.geography?.forEach((g) => {
          const current = map.get(g) || 0;
          map.set(g, current + a.allocation);
        });
      } else if (dimension === 'evidence_level') {
        const level = a.intervention.evidence_level || 'Unknown';
        const current = map.get(level) || 0;
        map.set(level, current + a.allocation);
      }
    });

    return Object.fromEntries(map.entries());
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();
