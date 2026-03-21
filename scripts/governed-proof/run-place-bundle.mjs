import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const placeKey = String(process.argv[2] || '').trim();

if (!/^\d{4}$/.test(placeKey)) {
  console.error('Usage: node scripts/governed-proof/run-place-bundle.mjs <4-digit-postcode>');
  process.exit(1);
}

const sharedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sharedServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const empathyUrl = process.env.EMPATHY_LEDGER_URL || process.env.EMPATHY_LEDGER_SUPABASE_URL;
const empathyServiceKey = process.env.EMPATHY_LEDGER_SERVICE_KEY || process.env.EMPATHY_LEDGER_API_KEY;

if (!sharedUrl || !sharedServiceKey) {
  console.error('Missing shared Supabase service credentials in JusticeHub env.');
  process.exit(1);
}

if (!empathyUrl || !empathyServiceKey) {
  console.error('Missing Empathy Ledger service credentials in JusticeHub env.');
  process.exit(1);
}

const shared = createClient(sharedUrl, sharedServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }) },
});

const empathy = createClient(empathyUrl, empathyServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }) },
});

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function average(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function canDisplayOnJusticeHub(story) {
  if (!story.is_public) return false;
  if (story.privacy_level !== 'public') return false;
  if (story.requires_elder_approval && !story.elder_approved_at) return false;
  return true;
}

function deriveLifecycleStatus({ capital, evidence, voice, governance }) {
  const activeLayers = [capital, evidence, voice, governance].filter((value) => value >= 0.6).length;
  if (activeLayers >= 4 && voice >= 0.8 && governance >= 0.8) return 'validated';
  if (activeLayers >= 3) return 'linked';
  if (activeLayers >= 2) return 'enriched';
  return 'resolved';
}

function mergeOrganizations(directOrganizations, evidenceOrganizations) {
  const merged = new Map();

  for (const organization of directOrganizations) {
    merged.set(organization.id, organization);
  }

  for (const organization of evidenceOrganizations) {
    if (!organization?.id) continue;
    merged.set(organization.id, {
      id: organization.id,
      name: organization.name ?? null,
      slug: organization.slug ?? null,
      gs_entity_id: organization.gs_entity_id ?? null,
      empathy_ledger_org_id: organization.empathy_ledger_org_id ?? null,
      postcode: organization.postcode ?? null,
    });
  }

  return Array.from(merged.values());
}

async function fetchSingle(queryPromise, label) {
  const { data, error } = await queryPromise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function fetchMany(queryPromise, label) {
  const { data, error } = await queryPromise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data ?? [];
}

async function main() {
  const bundleKey = `place:${placeKey}`;
  const task = await fetchSingle(
    shared
      .from('governed_proof_tasks')
      .insert({
        task_type: 'assemble_proof',
        queue_lane: 'core',
        priority: 'high',
        owner_system: 'SHARED',
        system_scope: ['GS', 'JH', 'EL'],
        target_type: 'place',
        target_id: placeKey,
        value_score: 85,
        confidence_required: 0.8,
        input_payload: { bundleKey, placeKey },
        acceptance_checks: [
          'capital_context_present',
          'evidence_context_present',
          'voice_context_governed',
        ],
        review_status: 'not_required',
        promotion_status: 'internal',
      })
      .select('*')
      .single(),
    'create governed proof task'
  );

  try {
    const [fundingByPostcode, entitySamples, directOrganizations] = await Promise.all([
      fetchSingle(
        shared
          .from('mv_funding_by_postcode')
          .select('*')
          .eq('postcode', placeKey)
          .order('total_funding', { ascending: false })
          .limit(25),
        'load funding by postcode'
      ),
      fetchMany(
        shared
          .from('gs_entities')
          .select(
            'id, canonical_name, entity_type, abn, postcode, lga_name, remoteness, seifa_irsd_decile, is_community_controlled'
          )
          .eq('postcode', placeKey)
          .limit(25),
        'load gs entities'
      ),
      fetchMany(
        shared
          .from('organizations')
          .select('id, name, slug, gs_entity_id, empathy_ledger_org_id, postcode')
          .eq('postcode', placeKey)
          .limit(50),
        'load direct organizations'
      ),
    ]);

    const entityIds = entitySamples.map((entity) => entity.id).filter(Boolean);
    const evidenceOrganizations = entityIds.length
      ? await fetchMany(
          shared
            .from('organizations')
            .select('id, name, slug, gs_entity_id, empathy_ledger_org_id, postcode')
            .in('gs_entity_id', entityIds),
          'load evidence organizations'
        )
      : [];

    const organizationIds = evidenceOrganizations.map((organization) => organization.id).filter(Boolean);
    const interventions = organizationIds.length
      ? await fetchMany(
          shared
            .from('alma_interventions')
            .select('id, name, type, operating_organization_id')
            .in('operating_organization_id', organizationIds),
          'load interventions'
        )
      : [];

    const mergedOrganizations = mergeOrganizations(directOrganizations, evidenceOrganizations);
    const linkedEmpathyOrgIds = mergedOrganizations
      .map((organization) => organization.empathy_ledger_org_id)
      .filter(Boolean);

    const empathyOrganizations = linkedEmpathyOrgIds.length
      ? await fetchMany(
          empathy
            .from('organizations')
            .select('id, name, slug, location, traditional_country, indigenous_controlled')
            .in('id', linkedEmpathyOrgIds),
          'load empathy organizations'
        )
      : [];

    const empathyStories = linkedEmpathyOrgIds.length
      ? await fetchMany(
          empathy
            .from('stories')
            .select(
              'id, title, summary, story_type, organization_id, storyteller_id, privacy_level, is_public, requires_elder_approval, elder_approved_at, cultural_sensitivity_level, published_at, created_at, themes, location_text'
            )
            .in('organization_id', linkedEmpathyOrgIds)
            .order('published_at', { ascending: false })
            .limit(100),
          'load empathy stories'
        )
      : [];

    const publishableStories = empathyStories.filter(canDisplayOnJusticeHub);
    const storytellerIds = Array.from(
      new Set(
        publishableStories
          .map((story) => story.storyteller_id)
          .filter(Boolean)
      )
    );

    const storytellers = storytellerIds.length
      ? await fetchMany(
          empathy
            .from('storytellers')
            .select('id, display_name, bio, is_elder, location, public_avatar_url')
            .in('id', storytellerIds),
          'load storytellers'
        )
      : [];

    const fundingSummaries = fundingByPostcode ?? [];
    const capitalConfidence = fundingSummaries.length > 0 ? 0.9 : entitySamples.length > 0 ? 0.7 : 0.45;
    const evidenceConfidence = organizationIds.length > 0 ? 0.8 : 0.5;
    const voiceConfidence = publishableStories.length > 0 ? 0.88 : linkedEmpathyOrgIds.length > 0 ? 0.55 : 0.25;
    const governanceConfidence = empathyStories.length > 0 ? 0.9 : linkedEmpathyOrgIds.length > 0 ? 0.65 : 0.4;
    const overallConfidence = average([
      capitalConfidence,
      evidenceConfidence,
      voiceConfidence,
      governanceConfidence,
    ]);
    const lifecycleStatus = deriveLifecycleStatus({
      capital: capitalConfidence,
      evidence: evidenceConfidence,
      voice: voiceConfidence,
      governance: governanceConfidence,
    });
    const reviewStatus = publishableStories.length < empathyStories.length ? 'pending' : 'not_required';
    const freshnessAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const lastValidatedAt = new Date().toISOString();

    const capitalContext = {
      fundingByPostcode: fundingSummaries[0] ?? null,
      fundingSummaries,
      entitySamples,
    };
    const evidenceContext = {
      organizations: evidenceOrganizations,
      interventions,
    };
    const voiceContext = {
      linkedOrganizations: empathyOrganizations,
      stories: publishableStories.map((story) => ({
        id: story.id,
        title: story.title,
        summary: story.summary,
        story_type: story.story_type,
        organization_id: story.organization_id,
        storyteller_id: story.storyteller_id,
        published_at: story.published_at,
        created_at: story.created_at,
        cultural_sensitivity_level: story.cultural_sensitivity_level,
        themes: story.themes ?? [],
        location_text: story.location_text ?? null,
      })),
      storytellers,
      summary: {
        linkedOrganizationCount: empathyOrganizations.length,
        totalStoryCount: empathyStories.length,
        publishableStoryCount: publishableStories.length,
        storytellerCount: storytellers.length,
      },
    };
    const governanceContext = {
      consentModel: 'public-plus-elder-approved',
      publishability: publishableStories.length > 0 ? 'partner' : empathyOrganizations.length > 0 ? 'internal' : 'internal',
      restrictedStoryCount: Math.max(empathyStories.length - publishableStories.length, 0),
      elderApprovalRequiredCount: empathyStories.filter((story) => story.requires_elder_approval).length,
    };
    const outputContext = {
      summary: {
        placeKey,
        entityCount: entitySamples.length,
        organizationCount: evidenceOrganizations.length,
        interventionCount: interventions.length,
        linkedVoiceOrganizationCount: empathyOrganizations.length,
        publishableStoryCount: publishableStories.length,
        storytellerCount: storytellers.length,
      },
      generatedBy: 'JusticeHub.governed-proof.cli',
      generatedAt: lastValidatedAt,
    };

    const bundle = await fetchSingle(
      shared
        .from('governed_proof_bundles')
        .upsert(
          {
            bundle_key: bundleKey,
            subject_type: 'place',
            subject_id: placeKey,
            owner_system: 'SHARED',
            lifecycle_status: lifecycleStatus,
            review_status: reviewStatus,
            promotion_status: 'internal',
            overall_confidence: overallConfidence,
            capital_confidence: capitalConfidence,
            evidence_confidence: evidenceConfidence,
            voice_confidence: voiceConfidence,
            governance_confidence: governanceConfidence,
            capital_context: capitalContext,
            evidence_context: evidenceContext,
            voice_context: voiceContext,
            governance_context: governanceContext,
            output_context: outputContext,
            freshness_at: freshnessAt,
            last_validated_at: lastValidatedAt,
          },
          { onConflict: 'bundle_key' }
        )
        .select('*')
        .single(),
      'upsert bundle'
    );

    const recordInputs = [];
    if (fundingSummaries.length > 0) {
      recordInputs.push({
        bundle_id: bundle.id,
        record_system: 'GS',
        record_type: 'place_funding_summary',
        record_id: `postcode:${placeKey}`,
        link_role: 'capital_summary',
        confidence_score: capitalConfidence,
        provenance_payload: { source: 'mv_funding_by_postcode', postcode: placeKey },
      });
    }
    for (const entity of entitySamples) {
      if (!entity.id) continue;
      recordInputs.push({
        bundle_id: bundle.id,
        record_system: 'GS',
        record_type: 'entity',
        record_id: entity.id,
        link_role: 'place_entity',
        confidence_score: capitalConfidence,
        provenance_payload: { source: 'gs_entities', postcode: placeKey },
      });
    }
    for (const organization of evidenceOrganizations) {
      if (!organization.id) continue;
      recordInputs.push({
        bundle_id: bundle.id,
        record_system: 'JH',
        record_type: 'organization',
        record_id: organization.id,
        link_role: 'operating_organization',
        confidence_score: evidenceConfidence,
        provenance_payload: { source: 'organizations', postcode: placeKey },
      });
    }
    for (const intervention of interventions) {
      if (!intervention.id) continue;
      recordInputs.push({
        bundle_id: bundle.id,
        record_system: 'JH',
        record_type: 'intervention',
        record_id: intervention.id,
        link_role: 'place_intervention',
        confidence_score: evidenceConfidence,
        provenance_payload: { source: 'alma_interventions', postcode: placeKey },
      });
    }
    for (const organization of empathyOrganizations) {
      if (!organization.id) continue;
      recordInputs.push({
        bundle_id: bundle.id,
        record_system: 'EL',
        record_type: 'organization',
        record_id: organization.id,
        link_role: 'voice_organization',
        confidence_score: voiceConfidence,
        provenance_payload: { source: 'organizations', postcode: placeKey },
      });
    }
    for (const story of publishableStories) {
      if (!story.id) continue;
      recordInputs.push({
        bundle_id: bundle.id,
        record_system: 'EL',
        record_type: 'story',
        record_id: story.id,
        link_role: 'voice_story',
        confidence_score: voiceConfidence,
        provenance_payload: { source: 'stories', postcode: placeKey },
      });
    }
    for (const storyteller of storytellers) {
      if (!storyteller.id) continue;
      recordInputs.push({
        bundle_id: bundle.id,
        record_system: 'EL',
        record_type: 'storyteller',
        record_id: storyteller.id,
        link_role: 'voice_storyteller',
        confidence_score: voiceConfidence,
        provenance_payload: { source: 'storytellers', postcode: placeKey },
      });
    }

    if (recordInputs.length > 0) {
      const { error: recordError } = await shared
        .from('governed_proof_bundle_records')
        .upsert(recordInputs, {
          onConflict: 'bundle_id,record_system,record_type,record_id,link_role',
        });
      if (recordError) throw new Error(`attach bundle records: ${recordError.message}`);
    }

    const runPayload = {
      placeKey,
      bundleKey,
      actorId: 'scripts/governed-proof/run-place-bundle.mjs',
      recordCount: recordInputs.length,
    };

    const { error: runError } = await shared.from('governed_proof_runs').insert({
      task_id: task.id,
      agent_role: 'governed_proof_cli_runner',
      provider: 'justicehub-script',
      model: 'deterministic-rest',
      strategy_version: 'place-bundle-v1',
      input_hash: sha256({ placeKey, bundleKey }),
      output_hash: sha256({
        bundleId: bundle.id,
        overallConfidence,
        recordCount: recordInputs.length,
        outputContext,
      }),
      result_status: 'success',
      eval_score: overallConfidence,
      confidence_delta: overallConfidence,
      notes: `Assembled governed proof bundle for postcode ${placeKey}`,
      run_payload: runPayload,
    });
    if (runError) throw new Error(`log governed proof run: ${runError.message}`);

    const { error: completeError } = await shared
      .from('governed_proof_tasks')
      .update({
        status: 'completed',
        review_status: reviewStatus,
        promotion_status: 'internal',
        completed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', task.id);
    if (completeError) throw new Error(`complete governed proof task: ${completeError.message}`);

    console.log(
      JSON.stringify(
        {
          success: true,
          placeKey,
          taskId: task.id,
          bundleId: bundle.id,
          bundleKey,
          lifecycleStatus,
          reviewStatus,
          overallConfidence,
          recordCount: recordInputs.length,
          outputSummary: outputContext.summary,
        },
        null,
        2
      )
    );
  } catch (error) {
    await shared
      .from('governed_proof_tasks')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        last_error: error instanceof Error ? error.message : String(error),
      })
      .eq('id', task.id);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
