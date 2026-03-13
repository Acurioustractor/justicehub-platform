import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * POST /api/admin/campaign-alignment/score
 * Runs deterministic scoring across orgs (from materialized view) and persons (from CRM).
 * Admin-only. No LLM — pure rule-based scoring.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const service = createServiceClient();

    // Create scoring run
    const { data: run } = await service
      .from('campaign_alignment_runs')
      .insert({ run_by: user.email, status: 'running' })
      .select('id')
      .single();

    const runId = run!.id;

    try {
      // 1. Refresh materialized view
      await service.rpc('refresh_mv_org_justice_signals' as never);

      // 2. Score organizations from materialized view
      const { data: orgs } = await service
        .from('mv_org_justice_signals' as never)
        .select('*')
        .or('purpose_score.gt.0,beneficiary_score.gt.0,has_foundation.eq.true,is_oric_registered.eq.true,grant_count.gt.0');

      const orgEntities = (orgs || []).map((org: Record<string, unknown>) => {
        const purposeScore = (org.purpose_score as number) || 0;
        const beneficiaryScore = (org.beneficiary_score as number) || 0;
        const foundationBoost = org.has_foundation ? 30 : 0;
        const justiceFoundationBoost = org.has_justice_focus ? 20 : 0;
        const almaBoost = (org.intervention_count as number) > 0 ? 20 : 0;
        const fundingBoost = (org.grant_count as number) > 0 ? 20 : 0;
        const oricBoost = org.is_oric_registered ? 10 : 0;

        const rawAlignment = purposeScore + beneficiaryScore + foundationBoost +
          justiceFoundationBoost + almaBoost + fundingBoost + oricBoost;
        // Normalize to -100..+100 (max raw = 80+100+30+20+20+20+10 = 280)
        const justiceAlignmentScore = Math.min(100, Math.round((rawAlignment / 180) * 100));

        // Reach/influence from charity size + foundation giving + interventions
        const sizeScore = org.charity_size === 'Large' ? 40 : org.charity_size === 'Medium' ? 25 : 10;
        const givingScore = Math.min(30, Math.round(((org.total_giving_annual as number) || 0) / 1000000));
        const interventionScore = Math.min(30, ((org.intervention_count as number) || 0) * 10);
        const reachInfluenceScore = Math.min(100, sizeScore + givingScore + interventionScore);

        const alignmentCategory = justiceAlignmentScore > 50 ? 'ally'
          : justiceAlignmentScore > 20 ? 'potential_ally'
          : justiceAlignmentScore > -20 ? 'neutral'
          : 'unknown'; // Never auto-assign 'opponent' — needs human review

        // Campaign list assignment
        let campaignList: string;
        if (org.has_foundation && org.has_justice_focus) {
          campaignList = 'funders_to_pitch';
        } else if (alignmentCategory === 'ally') {
          campaignList = 'allies_to_activate';
        } else if (alignmentCategory === 'potential_ally' && org.has_foundation) {
          campaignList = 'funders_to_pitch';
        } else if (alignmentCategory === 'potential_ally') {
          campaignList = 'allies_to_activate';
        } else {
          campaignList = 'allies_to_activate';
        }

        // Build alignment signals
        const signals: Array<{ type: string; detail: string }> = [];
        if (org.purpose_law_policy) signals.push({ type: 'purpose', detail: 'Law & Policy' });
        if (org.purpose_human_rights) signals.push({ type: 'purpose', detail: 'Human Rights' });
        if (org.purpose_reconciliation) signals.push({ type: 'purpose', detail: 'Reconciliation' });
        if (org.ben_aboriginal_tsi) signals.push({ type: 'beneficiary', detail: 'Aboriginal & TSI peoples' });
        if (org.ben_youth) signals.push({ type: 'beneficiary', detail: 'Youth' });
        if (org.ben_pre_post_release) signals.push({ type: 'beneficiary', detail: 'Pre/post release' });
        if (org.is_oric_registered) signals.push({ type: 'registration', detail: 'ORIC registered Indigenous corporation' });
        if (org.has_foundation) signals.push({ type: 'foundation', detail: `Foundation (${org.has_justice_focus ? 'justice focus' : 'general'})` });
        if ((org.intervention_count as number) > 0) signals.push({ type: 'alma', detail: `${org.intervention_count} ALMA interventions` });
        if ((org.grant_count as number) > 0) signals.push({ type: 'funding', detail: `${org.grant_count} justice grants ($${((org.total_funding_received as number) || 0).toLocaleString()})` });

        const confidence = signals.length >= 3 ? 'high' : signals.length >= 1 ? 'medium' : 'low';
        const compositeScore = Math.round(justiceAlignmentScore * 0.5 + reachInfluenceScore * 0.5);

        return {
          entity_type: 'organization',
          acnc_abn: org.abn as string,
          organization_name: org.name as string,
          name: org.name as string,
          website: org.website as string | null,
          justice_alignment_score: justiceAlignmentScore,
          reach_influence_score: reachInfluenceScore,
          accessibility_score: 0, // Orgs don't have accessibility yet
          composite_score: compositeScore,
          alignment_category: alignmentCategory,
          campaign_list: campaignList,
          alignment_signals: signals,
          funding_history: (org.grant_count as number) > 0 ? [{ total: org.total_funding_received, grants: org.grant_count }] : [],
          outreach_status: 'pending',
          score_confidence: confidence,
          last_scored_at: new Date().toISOString(),
          scoring_run_id: runId,
        };
      });

      // 3. Score persons from CRM
      const { data: persons } = await service
        .from('person_identity_map')
        .select('person_id, full_name, email, current_position, current_company, youth_justice_relevance_score, indigenous_affiliation, alignment_tags, ghl_contact_id, government_influence, funding_capacity, collaboration_potential, last_communication_at');

      // Build org name → signal lookup from scored orgs
      const orgSignals = new Map<string, { alignment: number; abn: string }>();
      for (const oe of orgEntities) {
        if (oe.organization_name) {
          orgSignals.set(oe.organization_name.toLowerCase(), {
            alignment: oe.justice_alignment_score,
            abn: oe.acnc_abn,
          });
        }
      }

      const personEntities = (persons || []).map((p: Record<string, unknown>) => {
        // Org alignment inheritance
        const company = (p.current_company as string || '').toLowerCase();
        const orgMatch = company ? orgSignals.get(company) : null;
        const orgInheritance = orgMatch ? Math.round(orgMatch.alignment * 0.5) : 0;

        // Personal signals
        const yjScore = (p.youth_justice_relevance_score as number) || 0;
        const indigenousBoost = p.indigenous_affiliation ? 20 : 0;
        const tags = (p.alignment_tags as string[]) || [];
        const tagBoost = Math.min(30, tags.length * 10);
        const govInfluence = (p.government_influence as number) || 0;

        const rawAlignment = orgInheritance + yjScore + indigenousBoost + tagBoost;
        const justiceAlignmentScore = Math.max(-100, Math.min(100, rawAlignment));

        // Accessibility
        const ghlBoost = p.ghl_contact_id ? 30 : 0;
        const emailBoost = p.email ? 20 : 0;
        const recentCommsBoost = p.last_communication_at ? 15 : 0;
        const warmPathBoost = orgMatch ? 20 : 0;
        const accessibilityScore = Math.min(100, ghlBoost + emailBoost + recentCommsBoost + warmPathBoost);

        // Reach/influence
        const govScore = Math.min(40, govInfluence * 10);
        const fundingCap = p.funding_capacity === 'high' ? 30 : p.funding_capacity === 'medium' ? 20 : 10;
        const collabScore = Math.min(30, ((p.collaboration_potential as number) || 0) * 10);
        const reachInfluenceScore = Math.min(100, govScore + fundingCap + collabScore);

        const compositeScore = Math.round(
          justiceAlignmentScore * 0.4 + reachInfluenceScore * 0.3 + accessibilityScore * 0.3
        );

        const alignmentCategory = justiceAlignmentScore > 50 ? 'ally'
          : justiceAlignmentScore > 20 ? 'potential_ally'
          : justiceAlignmentScore > -20 ? 'neutral'
          : 'unknown';

        // Campaign list
        let campaignList: string;
        if (p.funding_capacity === 'high' || (orgMatch && orgEntities.find(o => o.acnc_abn === orgMatch.abn)?.campaign_list === 'funders_to_pitch')) {
          campaignList = 'funders_to_pitch';
        } else if (govInfluence >= 3) {
          campaignList = 'decision_makers';
        } else if (warmPathBoost > 0 && accessibilityScore >= 50) {
          campaignList = 'warm_intros';
        } else if (alignmentCategory === 'ally') {
          campaignList = 'allies_to_activate';
        } else {
          campaignList = 'allies_to_activate';
        }

        const signals: Array<{ type: string; detail: string }> = [];
        if (orgMatch) signals.push({ type: 'org_link', detail: `Works at ${p.current_company} (alignment: ${orgMatch.alignment})` });
        if (yjScore > 0) signals.push({ type: 'relevance', detail: `Youth justice relevance: ${yjScore}` });
        if (p.indigenous_affiliation) signals.push({ type: 'indigenous', detail: 'Indigenous affiliation' });
        for (const tag of tags.slice(0, 5)) signals.push({ type: 'tag', detail: tag });
        if (govInfluence >= 3) signals.push({ type: 'government', detail: `Government influence: ${govInfluence}` });

        const warmPaths = orgMatch ? [{ via: 'employer', org: p.current_company, abn: orgMatch.abn }] : [];

        return {
          entity_type: 'person',
          person_id: p.person_id as string,
          name: p.full_name as string || 'Unknown',
          organization: p.current_company as string | null,
          position: p.current_position as string | null,
          email: p.email as string | null,
          justice_alignment_score: justiceAlignmentScore,
          reach_influence_score: reachInfluenceScore,
          accessibility_score: accessibilityScore,
          composite_score: compositeScore,
          alignment_category: alignmentCategory,
          campaign_list: campaignList,
          alignment_signals: signals,
          warm_paths: warmPaths,
          ghl_contact_id: p.ghl_contact_id as string | null,
          outreach_status: 'pending',
          score_confidence: signals.length >= 2 ? 'high' : signals.length >= 1 ? 'medium' : 'low',
          last_scored_at: new Date().toISOString(),
          scoring_run_id: runId,
        };
      });

      // 4. Clear previous entities and insert new ones
      await service.from('campaign_alignment_entities').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert in batches of 500
      const allEntities = [...orgEntities, ...personEntities];
      const BATCH_SIZE = 500;
      for (let i = 0; i < allEntities.length; i += BATCH_SIZE) {
        const batch = allEntities.slice(i, i + BATCH_SIZE);
        const { error } = await service.from('campaign_alignment_entities').insert(batch);
        if (error) throw new Error(`Batch insert failed at ${i}: ${error.message}`);
      }

      // 5. Update run record
      await service.from('campaign_alignment_runs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        orgs_scored: orgEntities.length,
        persons_scored: personEntities.length,
        total_entities: allEntities.length,
      }).eq('id', runId);

      return NextResponse.json({
        success: true,
        run_id: runId,
        orgs_scored: orgEntities.length,
        persons_scored: personEntities.length,
        total: allEntities.length,
      });
    } catch (err) {
      await service.from('campaign_alignment_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : String(err),
      }).eq('id', runId);
      throw err;
    }
  } catch (error) {
    console.error('Campaign scoring error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scoring failed' },
      { status: 500 }
    );
  }
}
