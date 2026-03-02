import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
  },
});

const now = new Date();
const isoNow = now.toISOString();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
const oneHundredEightyDaysAhead = new Date(
  now.getTime() + 180 * 24 * 60 * 60 * 1000
).toISOString();
const ninetyDaysAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const SOURCE_NAME = 'Funding Smoke Seed Source';
const PROGRAM_SLUG = 'funding-smoke-seed-program';
const PROGRAM_NAME = 'Funding Smoke Seed Program';
const PROGRAM_CODE = 'SMOKE-001';
const OPPORTUNITY_SOURCE_ID = 'funding-smoke-seed-opportunity-1';
const OPPORTUNITY_NAME = 'Funding Smoke Seed Opportunity';
const PROMOTION_PROGRAM_SLUG = 'funding-smoke-promotion-program';
const PROMOTION_PROGRAM_NAME = 'Funding Smoke Promotion Program';
const PROMOTION_PROGRAM_CODE = 'SMOKE-002';
const PROMOTION_OPPORTUNITY_SOURCE_ID = 'funding-smoke-promotion-opportunity-1';
const PROMOTION_OPPORTUNITY_NAME = 'Funding Smoke Promotion Opportunity';
const AWARD_SUMMARY = 'Funding smoke seed for local workflow validation.';
const OUTCOME_NAME = 'Funding Smoke Seed Youth Diversion';
const SPENDING_REFERENCE = 'funding-smoke-seed-payment-1';

function fail(message) {
  throw new Error(message);
}

async function maybeSingle(query, notFoundMessage) {
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message || notFoundMessage);
  }
  return data;
}

async function loadOrganizations() {
  let response = await supabase
    .from('organizations')
    .select('id, name, state, city, partner_tier')
    .in('partner_tier', ['basecamp', 'partner'])
    .order('name', { ascending: true })
    .limit(4);

  if (response.error) {
    response = await supabase
      .from('organizations')
      .select('id, name, state, city')
      .order('name', { ascending: true })
      .limit(4);
  }

  if (response.error) {
    throw new Error(response.error.message || 'Failed to load organizations for funding smoke seed');
  }

  const organizations = response.data || [];
  if (organizations.length === 0) {
    fail('No organizations available to seed funding smoke fixtures');
  }

  return organizations;
}

async function ensureSmokeOpportunity({ sourceId, name }) {
  const existing = await maybeSingle(
    supabase
      .from('alma_funding_opportunities')
      .select('id, name, funder_name, status')
      .eq('scrape_source', 'funding_smoke_seed')
      .eq('source_id', sourceId),
    'Failed to query funding smoke opportunity'
  );

  if (existing?.id) {
    return existing;
  }

  const { data, error } = await supabase
    .from('alma_funding_opportunities')
      .insert({
      name,
      description: 'Synthetic opportunity used to validate discovery-to-pipeline workflow smoke tests.',
      funder_name: SOURCE_NAME,
      source_type: 'philanthropy',
      category: 'youth_justice',
      total_pool_amount: 250000,
      min_grant_amount: 25000,
      max_grant_amount: 120000,
      funding_duration: '12 months',
      opens_at: thirtyDaysAgo,
      deadline: oneHundredEightyDaysAhead,
      decision_date: oneHundredEightyDaysAhead,
      status: 'open',
      jurisdictions: ['NSW', 'QLD', 'NT'],
      regions: ['Mount Isa'],
      is_national: false,
      eligibility_criteria: {
        smoke_seed: true,
      },
      eligible_org_types: ['community_org', 'indigenous_org'],
      requires_deductible_gift_recipient: false,
      requires_abn: true,
      focus_areas: ['youth', 'justice', 'community_led'],
      keywords: ['smoke_seed', 'funding', 'justicehub'],
      source_url: 'https://example.org/funding-smoke-seed-opportunity',
      application_url: 'https://example.org/funding-smoke-seed-apply',
      guidelines_url: 'https://example.org/funding-smoke-seed-guidelines',
      source_id: sourceId,
      scraped_at: isoNow,
      scrape_source: 'funding_smoke_seed',
      raw_data: {
        seed_kind: 'funding_smoke',
        seed_version: 1,
      },
      relevance_score: 88,
    })
    .select('id, name, funder_name, status')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke opportunity');
  }

  return data;
}

async function ensureFundingSource() {
  const existing = await maybeSingle(
    supabase.from('funding_sources').select('id').eq('name', SOURCE_NAME),
    'Failed to query funding smoke source'
  );

  if (existing?.id) {
    return existing;
  }

  const { data, error } = await supabase
    .from('funding_sources')
    .insert({
      name: SOURCE_NAME,
      source_type: 'philanthropy',
      source_subtype: 'smoke_seed',
      website_url: 'https://example.org/funding-smoke-seed',
      canonical_url: 'https://example.org/funding-smoke-seed',
      jurisdictions: ['NSW', 'QLD', 'NT'],
      decision_cycle: 'rolling',
      reporting_orientation: 'community_first',
      discovery_priority: 85,
      metadata: {
        seed_kind: 'funding_smoke',
        seed_version: 1,
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke source');
  }

  return data;
}

async function ensureFundingProgram(fundingSourceId, opportunityId, { slug, name, programCode }) {
  const existing = await maybeSingle(
    supabase.from('funding_programs').select('id, linked_opportunity_id').eq('slug', slug),
    'Failed to query funding smoke program'
  );

  if (existing?.id) {
    if (opportunityId && existing.linked_opportunity_id !== opportunityId) {
      const { error: updateError } = await supabase
        .from('funding_programs')
        .update({
          linked_opportunity_id: opportunityId,
          metadata: {
            seed_kind: 'funding_smoke',
            seed_version: 2,
          },
        })
        .eq('id', existing.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update funding smoke program opportunity');
      }
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('funding_programs')
    .insert({
      funding_source_id: fundingSourceId,
      linked_opportunity_id: opportunityId || null,
      name,
      slug,
      program_kind: 'grant_program',
      status: 'active',
      source_program_code: programCode,
      description: 'Minimal seeded funding program for workflow smoke testing.',
      objective: 'Exercise funding discovery, accountability, and review flows with live data.',
      total_budget_amount: 250000,
      committed_amount: 120000,
      disbursed_amount: 40000,
      budget_currency: 'AUD',
      budget_start_date: now.toISOString().slice(0, 10),
      budget_end_date: oneHundredEightyDaysAhead.slice(0, 10),
      decision_window: 'Rolling review',
      primary_jurisdictions: ['NSW', 'QLD', 'NT'],
      target_populations: ['young_people', 'first_nations'],
      focus_areas: ['youth_justice', 'community_led'],
      community_reporting_required: true,
      public_transparency_required: true,
      metadata: {
        seed_kind: 'funding_smoke',
        seed_version: 1,
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke program');
  }

  return data;
}

async function ensureCapabilityProfile(organization) {
  const payload = {
    organization_id: organization.id,
    service_geographies: [organization.state || 'NSW', organization.city || 'Community'],
    priority_populations: ['young_people', 'first_nations'],
    capability_tags: ['youth_justice', 'community_led', 'funding_smoke_seed'],
    operating_models: ['place_based', 'community_led'],
    lived_experience_led: true,
    first_nations_led: true,
    funding_readiness_score: 82,
    compliance_readiness_score: 78,
    delivery_confidence_score: 84,
    community_trust_score: 88,
    evidence_maturity_score: 72,
    reporting_to_community_score: 91,
    can_manage_government_contracts: true,
    can_manage_philanthropic_grants: true,
    last_capability_review_at: isoNow,
    next_capability_review_at: oneHundredEightyDaysAhead,
    capability_notes: 'Funding smoke seed capability profile for workflow validation.',
    supporting_evidence: {
      seed_kind: 'funding_smoke',
    },
    metadata: {
      seed_kind: 'funding_smoke',
      seed_version: 1,
    },
  };

  const { data, error } = await supabase
    .from('organization_capability_profiles')
    .upsert(payload, { onConflict: 'organization_id' })
    .select('id, organization_id')
    .single();

  if (error) {
    throw new Error(error.message || `Failed to upsert capability profile for ${organization.name}`);
  }

  return data;
}

async function ensureAward(programId, organizationId, opportunityId) {
  const existing = await maybeSingle(
    supabase
      .from('funding_awards')
      .select('id, opportunity_id')
      .eq('funding_program_id', programId)
      .eq('organization_id', organizationId)
      .eq('public_summary', AWARD_SUMMARY),
    'Failed to query funding smoke award'
  );

  if (existing?.id) {
    if (opportunityId && existing.opportunity_id !== opportunityId) {
      const { error: updateError } = await supabase
        .from('funding_awards')
        .update({
          opportunity_id: opportunityId,
          metadata: {
            seed_kind: 'funding_smoke',
            seed_version: 2,
          },
        })
        .eq('id', existing.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update funding smoke award opportunity');
      }
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('funding_awards')
    .insert({
      funding_program_id: programId,
      opportunity_id: opportunityId || null,
      organization_id: organizationId,
      award_status: 'active',
      award_type: 'grant',
      amount_awarded: 120000,
      amount_disbursed: 40000,
      currency: 'AUD',
      awarded_at: thirtyDaysAgo,
      contract_start_at: thirtyDaysAgo,
      contract_end_at: oneHundredEightyDaysAhead,
      reporting_cadence: 'quarterly',
      community_governance_required: true,
      community_report_due_at: sevenDaysAgo,
      outcome_summary: 'Seeded outcome commitments for smoke testing.',
      public_summary: AWARD_SUMMARY,
      metadata: {
        seed_kind: 'funding_smoke',
        seed_version: 1,
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke award');
  }

  return data;
}

async function ensureSpendingTransaction(programId, organizationId, opportunityId) {
  const existing = await maybeSingle(
    supabase
      .from('public_spending_transactions')
      .select('id, opportunity_id')
      .eq('source_reference', SPENDING_REFERENCE),
    'Failed to query funding smoke spending transaction'
  );

  if (existing?.id) {
    if (opportunityId && existing.opportunity_id !== opportunityId) {
      const { error: updateError } = await supabase
        .from('public_spending_transactions')
        .update({
          opportunity_id: opportunityId,
          metadata: {
            seed_kind: 'funding_smoke',
            seed_version: 2,
          },
        })
        .eq('id', existing.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update funding smoke spending opportunity');
      }
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('public_spending_transactions')
    .insert({
      funding_program_id: programId,
      opportunity_id: opportunityId || null,
      organization_id: organizationId,
      transaction_type: 'grant_payment',
      transaction_status: 'disbursed',
      amount: 40000,
      currency: 'AUD',
      transaction_date: isoNow,
      period_start: now.toISOString().slice(0, 10),
      period_end: oneHundredEightyDaysAhead.slice(0, 10),
      jurisdiction: 'NSW',
      source_reference: SPENDING_REFERENCE,
      description: 'Funding smoke seed payment event.',
      community_visible: true,
      metadata: {
        seed_kind: 'funding_smoke',
        seed_version: 1,
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke spending transaction');
  }

  return data;
}

async function ensureOutcomeDefinition() {
  const existing = await maybeSingle(
    supabase
      .from('community_outcome_definitions')
      .select('id')
      .eq('name', OUTCOME_NAME)
      .eq('outcome_domain', 'youth_justice'),
    'Failed to query funding smoke outcome definition'
  );

  if (existing?.id) {
    return existing;
  }

  const { data, error } = await supabase
    .from('community_outcome_definitions')
    .insert({
      name: OUTCOME_NAME,
      outcome_domain: 'youth_justice',
      unit: 'young people',
      description: 'Smoke seed outcome used to validate the public accountability workflow.',
      baseline_method: 'Manual seed baseline',
      community_defined: true,
      first_nations_data_sensitive: false,
      is_active: true,
      metadata: {
        seed_kind: 'funding_smoke',
        seed_version: 1,
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke outcome definition');
  }

  return data;
}

async function ensureCommitment(awardId, organizationId, outcomeDefinitionId) {
  const existing = await maybeSingle(
    supabase
      .from('funding_outcome_commitments')
      .select('id')
      .eq('funding_award_id', awardId)
      .eq('outcome_definition_id', outcomeDefinitionId),
    'Failed to query funding smoke commitment'
  );

  if (existing?.id) {
    return existing;
  }

  const { data, error } = await supabase
    .from('funding_outcome_commitments')
    .insert({
      funding_award_id: awardId,
      organization_id: organizationId,
      outcome_definition_id: outcomeDefinitionId,
      commitment_status: 'active',
      baseline_value: 10,
      target_value: 25,
      current_value: 16,
      target_date: ninetyDaysAhead,
      measurement_notes: 'Smoke seed commitment for accountability testing.',
      evidence_confidence_score: 58,
      community_priority_weight: 82,
      metadata: {
        seed_kind: 'funding_smoke',
        seed_version: 1,
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke commitment');
  }

  return data;
}

function buildCommunityContext({ includeFollowUp }) {
  return [
    '[Community context]',
    'Role: Community participant',
    'Connection: Direct lived experience of the program outcome',
    'Location: Local youth justice community',
    `Follow-up contact: ${includeFollowUp ? 'Yes' : 'No'}`,
    includeFollowUp ? 'Follow-up preference: Email is fine for clarification' : null,
  ]
    .filter(Boolean)
    .join('\n');
}

async function ensurePublicUpdate(commitmentId) {
  const existing = await maybeSingle(
    supabase
      .from('funding_outcome_updates')
      .select('id')
      .eq('commitment_id', commitmentId)
      .eq('narrative', `${buildCommunityContext({ includeFollowUp: false })}\n\nSmoke seed public update for workflow validation.`),
    'Failed to query funding smoke public update'
  );

  if (existing?.id) {
    return existing;
  }

  const { data, error } = await supabase
    .from('funding_outcome_updates')
    .insert({
      commitment_id: commitmentId,
      update_type: 'progress',
      reported_value: 16,
      reported_at: isoNow,
      reporting_period_start: now.toISOString().slice(0, 10),
      reporting_period_end: oneHundredEightyDaysAhead.slice(0, 10),
      narrative: `${buildCommunityContext({ includeFollowUp: false })}\n\nSmoke seed public update for workflow validation.`,
      evidence_urls: ['https://example.org/funding-smoke-update'],
      confidence_score: 42,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke public update');
  }

  return data;
}

async function ensurePublicValidation(updateId) {
  const note = `${buildCommunityContext({ includeFollowUp: true })}\n\nThis needs follow-up because the on-the-ground experience does not yet match the reported progress.`;

  const existing = await maybeSingle(
    supabase
      .from('community_outcome_validations')
      .select('id')
      .eq('update_id', updateId)
      .eq('validation_notes', note),
    'Failed to query funding smoke public validation'
  );

  if (existing?.id) {
    return existing;
  }

  const { data, error } = await supabase
    .from('community_outcome_validations')
    .insert({
      update_id: updateId,
      validator_kind: 'community_member',
      validator_name: 'Funding Smoke Community Reviewer',
      validation_status: 'needs_follow_up',
      validation_notes: note,
      impact_rating: 3,
      trust_rating: 2,
      validated_at: isoNow,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to insert funding smoke public validation');
  }

  return data;
}

async function ensureRecommendation(opportunityId, organizationId, capabilityProfileId) {
  if (!opportunityId) {
    return null;
  }

  const { data, error } = await supabase
    .from('funding_match_recommendations')
    .upsert(
      {
        opportunity_id: opportunityId,
        organization_id: organizationId,
        capability_profile_id: capabilityProfileId,
        recommendation_status: 'candidate',
        match_score: 86,
        readiness_score: 82,
        community_alignment_score: 88,
        outcome_alignment_score: 74,
        geographic_fit_score: 79,
        explainability: {
          seed_kind: 'funding_smoke',
          summary: 'Seeded recommendation for smoke testing.',
        },
        agent_notes: 'Funding smoke seed recommendation.',
        last_evaluated_at: isoNow,
      },
      { onConflict: 'opportunity_id,organization_id' }
    )
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to upsert funding smoke recommendation');
  }

  return data;
}

async function main() {
  const organizations = await loadOrganizations();
  const primaryOrganization = organizations[0];
  const secondaryOrganizations = organizations.slice(1, 3);
  const accountabilityOpportunity = await ensureSmokeOpportunity({
    sourceId: OPPORTUNITY_SOURCE_ID,
    name: OPPORTUNITY_NAME,
  });
  const promotionOpportunity = await ensureSmokeOpportunity({
    sourceId: PROMOTION_OPPORTUNITY_SOURCE_ID,
    name: PROMOTION_OPPORTUNITY_NAME,
  });

  const fundingSource = await ensureFundingSource();
  const fundingProgram = await ensureFundingProgram(
    fundingSource.id,
    accountabilityOpportunity?.id || null,
    {
      slug: PROGRAM_SLUG,
      name: PROGRAM_NAME,
      programCode: PROGRAM_CODE,
    }
  );
  await ensureFundingProgram(
    fundingSource.id,
    promotionOpportunity?.id || null,
    {
      slug: PROMOTION_PROGRAM_SLUG,
      name: PROMOTION_PROGRAM_NAME,
      programCode: PROMOTION_PROGRAM_CODE,
    }
  );

  const primaryProfile = await ensureCapabilityProfile(primaryOrganization);
  for (const organization of secondaryOrganizations) {
    await ensureCapabilityProfile(organization);
  }

  const award = await ensureAward(
    fundingProgram.id,
    primaryOrganization.id,
    accountabilityOpportunity?.id || null
  );
  const spending = await ensureSpendingTransaction(
    fundingProgram.id,
    primaryOrganization.id,
    accountabilityOpportunity?.id || null
  );
  const outcomeDefinition = await ensureOutcomeDefinition();
  const commitment = await ensureCommitment(
    award.id,
    primaryOrganization.id,
    outcomeDefinition.id
  );
  const publicUpdate = await ensurePublicUpdate(commitment.id);
  const publicValidation = await ensurePublicValidation(publicUpdate.id);
  const recommendation = await ensureRecommendation(
    promotionOpportunity?.id || null,
    primaryOrganization.id,
    primaryProfile.id
  );

  console.log('Funding smoke fixtures ready.');
  console.log(
    JSON.stringify(
      {
        fundingSourceId: fundingSource.id,
        fundingProgramId: fundingProgram.id,
        primaryOrganizationId: primaryOrganization.id,
        primaryOrganizationName: primaryOrganization.name,
        awardId: award.id,
        spendingTransactionId: spending.id,
        outcomeDefinitionId: outcomeDefinition.id,
        commitmentId: commitment.id,
        publicUpdateId: publicUpdate.id,
        publicValidationId: publicValidation.id,
        recommendationId: recommendation?.id || null,
        accountabilityOpportunityId: accountabilityOpportunity?.id || null,
        accountabilityOpportunityName: accountabilityOpportunity?.name || null,
        promotionOpportunityId: promotionOpportunity?.id || null,
        promotionOpportunityName: promotionOpportunity?.name || null,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
