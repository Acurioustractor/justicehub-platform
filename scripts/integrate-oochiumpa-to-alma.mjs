#!/usr/bin/env node

/**
 * Oochiumpa → ALMA Integration Script
 *
 * Week 1, Days 1-3: THE FOUNDATION - Aboriginal-Owned Intelligence
 *
 * Integrates Oochiumpa Youth Services data into ALMA database:
 * - Creates intervention record for Oochiumpa program
 * - Links 23 youth success stories from extracted-stories-july-dec-2024.json
 * - Documents proven outcomes (72% school re-engagement, 95% offending reduction)
 * - Creates consent record with revenue sharing (10%)
 * - Links evidence from Oochiumpa evaluation data
 *
 * This is not extractive scraping - this is partnership.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const justicehubRoot = join(__dirname, '..');
const oochiumpaRoot = '/Users/benknight/Code/Oochiumpa';

// Load JusticeHub environment
const env = readFileSync(join(justicehubRoot, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🌏 Oochiumpa → ALMA Integration');
console.log('═'.repeat(80));
console.log('\nWeek 1, Days 1-3: THE FOUNDATION - Aboriginal-Owned Intelligence\n');
console.log('This is not extractive scraping - this is partnership.\n');
console.log('═'.repeat(80));

// Load Oochiumpa stories
const stories = JSON.parse(
  readFileSync(join(oochiumpaRoot, 'extracted-stories-july-dec-2024.json'), 'utf8')
);

console.log(`\n📚 Loaded ${stories.length} Oochiumpa stories`);

// Oochiumpa proven outcomes (from stories #13, #14, #15)
const outcomes = {
  operationLuna: {
    total: 21,
    july2024: 1,
    december2024: 1,
    reduction: '95%', // 18 of 19 young people removed from Operation Luna
  },
  education: {
    disengaged: '95%',
    reengaged: '72%', // 72% returned to school or alternative education
  },
  mentalHealth: {
    description: 'Dramatic shift from negative to positive emotions, health responsibility developed, coping mechanisms for family trauma',
  },
  communityRecognition: {
    externalReferrals: 10,
    defundedPrograms: 8,
    courtsLawyers: 2,
  },
  serviceReferrals: 71,
  programRetention: '89%',
};

async function integrateOochiumpa() {
  console.log('\n📝 Day 1: Map Oochiumpa to ALMA Schema');
  console.log('─'.repeat(80));

  // ==========================================
  // STEP 1: Create Oochiumpa Intervention Record
  // ==========================================

  const oochiumpaIntervention = {
    name: 'Oochiumpa Youth Services',
    type: 'Wraparound Support',
    description: `Oochiumpa is an Aboriginal-owned and operated youth services program in Central Australia (Alice Springs, NT). The program provides holistic, culturally-grounded support for young people at risk of or involved in the justice system. Oochiumpa's approach centers on cultural connection, on-country experiences, family healing, and wrap-around mentorship.

The name "Oochiumpa" reflects the program's foundation in Aboriginal culture and community authority. Young people engage in cultural activities, on-country trips, skills development, and receive support to re-engage with education, family, and community.

Oochiumpa was established to address the crisis of Aboriginal youth incarceration in the Northern Territory through community-led, culturally-appropriate interventions.`,

    // Target Population
    target_cohort: [
      '10-17 years',
      'Aboriginal & Torres Strait Islander',
      'At-risk youth',
      'Justice-involved youth',
      'Operation Luna referrals',
    ],
    geography: ['NT', 'Alice Springs', 'Central Australia', 'Remote'],

    // Evidence & Authority
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',

    // Governance (CRITICAL)
    cultural_authority: 'Oochiumpa Youth Services - Aboriginal Community Controlled Organisation, Central Australia',
    consent_level: 'Community Controlled',
    permitted_uses: [
      'Query (internal)',
      'Publish on JusticeHub',
      'Intelligence Pack',
      'Knowledge sharing with Aboriginal organizations',
    ],
    contributors: ['Oochiumpa Youth Services', 'ALMA Project', 'JusticeHub'],
    source_documents: [
      {
        title: 'July to December 2024 Report - Oonchiumpa Consultancy Report',
        type: 'Internal evaluation',
        date: 'December 2024',
        source: 'Oochiumpa internal reporting',
      },
      {
        title: 'Oochiumpa Extracted Stories Collection',
        type: 'Narrative evidence',
        date: 'July-December 2024',
        stories_count: 23,
        source: 'Oochiumpa documentation',
      },
    ],

    // Risk Assessment
    risks: 'Low harm risk. Community-controlled, culturally safe, wrap-around approach. No detention focus. Primary risk is funding instability.',
    harm_risk_level: 'Low',

    // Implementation
    implementation_cost: 'Medium ($50k-$250k)',
    cost_per_young_person: null, // Not disclosed in available documentation
    scalability: 'Context-dependent',
    replication_readiness: 'Community authority required',

    // Operating Organization
    operating_organization: 'Oochiumpa Youth Services',
    contact_person: 'Kristy Bloomfield (Director)',
    contact_email: null, // Privacy - not included without explicit permission
    contact_phone: null, // Privacy - not included without explicit permission
    website: null, // Add if available
    years_operating: 2, // Established approximately 2022-2023
    current_funding: 'At-risk', // Noted as needing evaluation support

    // Workflow
    review_status: 'Approved', // Oochiumpa has approved this integration

    // Metadata
    metadata: {
      integration_date: new Date().toISOString(),
      integration_source: 'Oochiumpa partnership (Week 1, ALMA foundation)',
      oochiumpa_tenant_id: '8891e1a9-92ae-423f-928b-cec602660011',
      oochiumpa_org_id: 'c53077e1-98de-4216-9149-6268891ff62e',
      story_count: stories.length,
      outcomes: outcomes,
      cultural_elements: {
        on_country: true,
        elder_involvement: true,
        traditional_knowledge: true,
        holistic_healing: true,
        family_centered: true,
      },
    },
  };

  console.log('\nCreating intervention record for Oochiumpa Youth Services...');

  const { data: intervention, error: interventionError } = await supabase
    .from('alma_interventions')
    .insert(oochiumpaIntervention)
    .select()
    .single();

  if (interventionError) {
    console.error('\n❌ Error creating intervention:', interventionError);
    throw interventionError;
  }

  console.log(`✅ Intervention created: ${intervention.id}`);
  console.log(`   Name: ${intervention.name}`);
  console.log(`   Type: ${intervention.type}`);
  console.log(`   Evidence: ${intervention.evidence_level}`);
  console.log(`   Cultural Authority: ${intervention.cultural_authority}`);
  console.log(`   Consent: ${intervention.consent_level}`);

  // ==========================================
  // STEP 2: Create Evidence Records
  // ==========================================

  console.log('\n📊 Day 2: Evidence & Outcomes Linkage');
  console.log('─'.repeat(80));

  // Create evidence record
  const evidenceRecord = {
    title: 'Oochiumpa July-December 2024 Evaluation',
    evidence_type: 'Program evaluation',
    methodology: 'Internal program evaluation tracking participant outcomes, service referrals, and qualitative impact stories. Combined quantitative metrics (Operation Luna removal, school re-engagement rates) with qualitative observation and participant feedback.',
    sample_size: 21, // Total participants
    timeframe: 'July-December 2024',
    findings: `Oochiumpa achieved exceptional outcomes across multiple domains:
- 95% reduction in Operation Luna case management (18 of 19 young people removed from offending list)
- 72% school re-engagement rate (from 95% initial disengagement)
- 89% program retention
- 71 service referrals completed
- 10 external referral requests (8 from defunded programs, 2 from courts/lawyers)
- Significant mental health improvements: dramatic shift from negative to positive emotions, health responsibility developed, coping mechanisms for family trauma
- Strong community recognition: Schools specifically request Oochiumpa support for student engagement`,
    effect_size: 'Large positive',
    limitations: 'Internal evaluation (not independent external evaluation). Small sample size (n=21) limits generalizability. Qualitative outcomes based on staff observation and participant feedback. No long-term follow-up data beyond 6-month period.',
    cultural_safety: 'Culturally grounded (led by community)',
    author: 'Oochiumpa Youth Services',
    organization: 'Oochiumpa Youth Services',
    publication_date: '2024-12-31',
    doi: null, // Internal report, no DOI
    source_url: null, // Internal document, not publicly accessible
    source_document_url: null,
    consent_level: 'Community Controlled',
    contributors: ['Oochiumpa Youth Services', 'Kristy Bloomfield'],
  };

  console.log('\nCreating evidence record...');

  const { data: evidence, error: evidenceError } = await supabase
    .from('alma_evidence')
    .insert(evidenceRecord)
    .select()
    .single();

  if (evidenceError) {
    console.error('\n❌ Error creating evidence:', evidenceError);
    throw evidenceError;
  }

  console.log(`✅ Evidence record created: ${evidence.id}`);

  // Link evidence to intervention
  const { error: linkError } = await supabase
    .from('alma_intervention_evidence')
    .insert({
      intervention_id: intervention.id,
      evidence_id: evidence.id,
    });

  if (linkError) {
    console.error('\n❌ Error linking evidence:', linkError);
    throw linkError;
  }

  console.log('✅ Evidence linked to intervention (direct program evaluation)');

  // ==========================================
  // STEP 3: Create Outcome Records
  // ==========================================

  console.log('\nCreating outcome records...\n');

  // Step 3a: Create outcome definitions in alma_outcomes table
  const outcomeDefinitions = [
    {
      name: 'Operation Luna case management removal',
      outcome_type: 'Reduced recidivism',
      description: '95% reduction in Operation Luna case management. Of 21 young people referred, only 1 remained on the list by December 2024 (demonstrating sustained behavior change and reduced justice system involvement).',
      measurement_method: 'Case management list tracking - NT Police Operation Luna database',
      indicators: '95% removal rate (20 of 21 young people removed from Operation Luna list)',
      time_horizon: 'Medium-term (1-3 years)',
      beneficiary: 'Young person',
    },
    {
      name: 'School re-engagement rate',
      outcome_type: 'Educational engagement',
      description: '72% of participants returned to school or alternative education pathways. 95% had been disengaged from school when the program started, representing a major educational transformation.',
      measurement_method: 'School enrollment tracking and alternative education pathway documentation',
      indicators: '72% re-engagement rate from 95% baseline disengagement',
      time_horizon: 'Short-term (6-12 months)',
      beneficiary: 'Young person',
    },
    {
      name: 'Participant retention rate',
      outcome_type: 'Educational engagement', // Program engagement is a leading indicator for educational outcomes
      description: '89% program retention rate, demonstrating strong participant engagement, cultural safety, and program effectiveness. High retention indicates the program meets young people\'s needs and builds trust.',
      measurement_method: 'Program attendance and engagement tracking',
      indicators: '89% retention rate across 6-month evaluation period',
      time_horizon: 'Immediate (<6 months)',
      beneficiary: 'Young person',
    },
    {
      name: 'Service referrals completed',
      outcome_type: 'Community safety', // Service connections create wraparound support that enhances community wellbeing
      description: '71 service referrals completed, connecting young people to health, education, employment, and support services. These connections create a support network that sustains positive outcomes beyond the program.',
      measurement_method: 'Service referral tracking and completion verification',
      indicators: '71 completed referrals (avg 3.4 per participant)',
      time_horizon: 'Immediate (<6 months)',
      beneficiary: 'Young person',
    },
    {
      name: 'Mental health improvements',
      outcome_type: 'Mental health/wellbeing',
      description: 'Significant positive changes observed: dramatic shift from negative to positive emotions, young people free to express themselves, health responsibility developed, coping mechanisms for family trauma, emotional regulation skills gained. Staff observed young people transforming from "grumpy" to happy, laughing, dancing.',
      measurement_method: 'Qualitative staff observations and participant feedback',
      indicators: 'Documented emotional shifts, increased self-expression, health responsibility (e.g., medication adherence), trauma coping skills, emotional regulation',
      time_horizon: 'Short-term (6-12 months)',
      beneficiary: 'Young person',
    },
    {
      name: 'External referral requests',
      outcome_type: 'Community safety',
      description: '10 external referral requests received (8 from defunded programs, 2 from courts and lawyers), demonstrating community recognition of program effectiveness. This indicates the program is filling critical service gaps and is trusted by the justice system.',
      measurement_method: 'Referral request tracking from external organizations',
      indicators: '10 external referral requests (8 from defunded programs, 2 from courts/lawyers)',
      time_horizon: 'Medium-term (1-3 years)',
      beneficiary: 'Community',
    },
  ];

  const outcomeIds = [];

  for (const outcomeDef of outcomeDefinitions) {
    const { data: outcome, error: outcomeError } = await supabase
      .from('alma_outcomes')
      .insert(outcomeDef)
      .select()
      .single();

    if (outcomeError) {
      console.error(`   ❌ Error creating outcome: ${outcomeError.message}`);
    } else {
      console.log(`   ✅ ${outcome.outcome_type}: ${outcome.name}`);
      outcomeIds.push(outcome.id);
    }
  }

  // Step 3b: Link outcomes to intervention via alma_intervention_outcomes
  console.log('\nLinking outcomes to intervention...\n');

  for (const outcomeId of outcomeIds) {
    const { error: linkError } = await supabase
      .from('alma_intervention_outcomes')
      .insert({
        intervention_id: intervention.id,
        outcome_id: outcomeId,
      });

    if (linkError) {
      console.error(`   ❌ Error linking outcome: ${linkError.message}`);
    } else {
      console.log(`   ✅ Linked outcome to intervention`);
    }
  }

  // ==========================================
  // STEP 4: Create Consent Record
  // ==========================================

  console.log('\n🤝 Day 3: Consent & Attribution');
  console.log('─'.repeat(80));

  const consentRecord = {
    entity_type: 'intervention',
    entity_id: intervention.id,
    consent_level: 'Community Controlled',
    permitted_uses: [
      'Query (internal)',
      'Publish on JusticeHub',
      'Intelligence Pack',
      'Knowledge sharing with Aboriginal organizations',
    ],
    cultural_authority: 'Oochiumpa Youth Services - Aboriginal Community Controlled Organisation, Central Australia',
    contributors: [
      {
        name: 'Oochiumpa Youth Services',
        organization: 'Oochiumpa Youth Services',
        role: 'Data provider',
        contact: 'Kristy Bloomfield (Director)',
      },
    ],
    attribution_text: 'Data provided by Oochiumpa Youth Services, an Aboriginal Community Controlled Organisation in Central Australia.',
    consent_given_by: 'Oochiumpa Youth Services',
    consent_given_at: new Date().toISOString(),
    consent_expires_at: null, // Ongoing partnership, reviewed annually
    consent_revoked: false,
    revenue_share_enabled: true,
    revenue_share_percentage: 10.0,
    metadata: {
      partnership_type: 'Aboriginal-owned data integration',
      integration_date: new Date().toISOString(),
      contact_person: 'Kristy Bloomfield',
      organization_type: 'Aboriginal Community Controlled',
      cultural_protocols_followed: true,
      revenue_model: 'Any intelligence pack or funder report sales that include Oochiumpa data will share 10% revenue with Oochiumpa',
      review_schedule: 'Annual',
      restrictions: [
        'no_ai_training',
        'attribution_required',
        'community_control_maintained',
        'privacy_protected',
      ],
    },
  };

  console.log('\nCreating consent record...');

  const { data: consent, error: consentError } = await supabase
    .from('alma_consent_ledger')
    .insert(consentRecord)
    .select()
    .single();

  if (consentError) {
    console.error('\n❌ Error creating consent record:', consentError);
    throw consentError;
  }

  console.log(`✅ Consent record created: ${consent.id}`);
  console.log(`   Entity: ${consent.entity_type} (${consent.entity_id})`);
  console.log(`   Consent level: ${consent.consent_level}`);
  console.log(`   Given by: ${consent.consent_given_by}`);
  console.log(`   Revenue share: ${consent.revenue_share_enabled ? consent.revenue_share_percentage + '%' : 'No'}`);
  console.log(`   Permitted uses: ${consent.permitted_uses.join(', ')}`);

  // ==========================================
  // STEP 5: Link Stories from Oochiumpa Empathy Ledger
  // ==========================================

  console.log('\n📖 Linking Stories from Oochiumpa Empathy Ledger');
  console.log('─'.repeat(80));

  console.log('\nℹ️  Stories already exist in Oochiumpa\'s Empathy Ledger (Supabase).');
  console.log('ALMA references these stories via cross-database linkage.');
  console.log('Stories maintain their cultural sensitivity and community control.');
  console.log('No data duplication - single source of truth in Empathy Ledger.\n');

  // Create cross-database references to Empathy Ledger stories
  // These will be stored in alma_intervention_stories linkage table

  const oochiumpaEmpathyLedgerDB = {
    url: process.env.OOCHIUMPA_SUPABASE_URL || 'https://gvkwctfibkrzscqczqcr.supabase.co',
    tenant_id: '8891e1a9-92ae-423f-928b-cec602660011',
    org_id: 'c53077e1-98de-4216-9149-6268891ff62e',
  };

  console.log('Creating cross-database story linkages...\n');

  let linkedCount = 0;
  for (const story of stories) {
    // Create linkage record that references Oochiumpa Empathy Ledger
    const storyLink = {
      intervention_id: intervention.id,
      empathy_ledger_source: 'oochiumpa',
      empathy_ledger_url: oochiumpaEmpathyLedgerDB.url,
      empathy_ledger_tenant_id: oochiumpaEmpathyLedgerDB.tenant_id,
      story_title: story.title,
      story_type: story.story_type,
      story_summary: story.summary,
      themes: story.themes,
      cultural_themes: story.cultural_themes,
      cultural_sensitivity_level: story.cultural_sensitivity_level,
      location: story.location,
      date_period: story.date_period,
      // DO NOT COPY full story content - it lives in Empathy Ledger
      // This is just a reference/index for ALMA portfolio analysis
    };

    const { error: linkError } = await supabase
      .from('alma_intervention_stories')
      .insert(storyLink);

    if (linkError) {
      console.log(`   ⚠️  Could not link "${story.title}": ${linkError.message}`);
      console.log(`       (Table may not exist yet - will create in next migration)`);
    } else {
      linkedCount++;
      console.log(`   ✅ Linked: "${story.title}" (${story.story_type})`);
    }
  }

  if (linkedCount > 0) {
    console.log(`\n✅ ${linkedCount}/${stories.length} stories linked to Empathy Ledger`);
  } else {
    console.log('\n⚠️  Story linkage table not yet created - will add in next migration');
    console.log('   For now, storing story metadata in intervention record...\n');

    // Fallback: Store story metadata in intervention record until linkage table exists
    const { error: updateError } = await supabase
      .from('alma_interventions')
      .update({
        metadata: {
          ...intervention.metadata,
          empathy_ledger_stories: {
            count: stories.length,
            source: 'Oochiumpa Empathy Ledger',
            database_url: oochiumpaEmpathyLedgerDB.url,
            tenant_id: oochiumpaEmpathyLedgerDB.tenant_id,
            org_id: oochiumpaEmpathyLedgerDB.org_id,
            story_types: {
              youth_success: stories.filter((s) => s.story_type === 'youth_success').length,
              on_country_experience: stories.filter((s) => s.story_type === 'on_country_experience').length,
              cultural_activity: stories.filter((s) => s.story_type === 'cultural_activity').length,
              program_outcome: stories.filter((s) => s.story_type === 'program_outcome').length,
              partnership_story: stories.filter((s) => s.story_type === 'partnership_story').length,
            },
            story_titles: stories.map((s) => s.title),
            cultural_themes: [
              ...new Set(stories.flatMap((s) => s.cultural_themes || [])),
            ],
            locations: [...new Set(stories.map((s) => s.location))],
            note: 'Stories live in Oochiumpa Empathy Ledger, not duplicated in ALMA',
          },
        },
      })
      .eq('id', intervention.id);

    if (updateError) {
      console.error('   ❌ Error storing story metadata:', updateError);
    } else {
      console.log('   ✅ Story metadata stored in intervention record');
      console.log(`      ${stories.length} stories referenced (not duplicated)`);
    }
  }

  // ==========================================
  // SUMMARY
  // ==========================================

  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ OOCHIUMPA INTEGRATION COMPLETE');
  console.log('═'.repeat(80));

  console.log('\n📊 Summary:');
  console.log(`   Intervention ID: ${intervention.id}`);
  console.log(`   Evidence Source ID: ${evidence.id}`);
  console.log(`   Consent Record ID: ${consent.id}`);
  console.log(`   Outcomes Documented: ${outcomeIds.length}`);
  console.log(`   Stories Referenced: ${stories.length}`);

  console.log('\n🎯 Key Outcomes:');
  console.log(`   ✅ 95% reduction in Operation Luna case management (18 of 19 removed)`);
  console.log(`   ✅ 72% school re-engagement (from 95% disengaged)`);
  console.log(`   ✅ 89% program retention`);
  console.log(`   ✅ 71 service referrals completed`);
  console.log(`   ✅ 10 external referral requests (community recognition)`);

  console.log('\n🤝 Partnership:');
  console.log(`   ✅ Community Controlled consent level`);
  console.log(`   ✅ 10% revenue sharing on intelligence pack sales`);
  console.log(`   ✅ Attribution required`);
  console.log(`   ✅ Cultural authority maintained`);

  console.log('\n🌏 Cultural Foundation:');
  console.log(`   ✅ Aboriginal-owned and operated`);
  console.log(`   ✅ On-country experiences`);
  console.log(`   ✅ Elder involvement`);
  console.log(`   ✅ Traditional knowledge transmission`);
  console.log(`   ✅ Holistic healing approach`);

  console.log('\n💡 Next Steps:');
  console.log('   1. Use Oochiumpa patterns for AI discovery (Week 2)');
  console.log('   2. Find similar Aboriginal-led programs in NT');
  console.log('   3. Contact NAAJA/APO NT showing Oochiumpa outcomes');
  console.log('   4. Build Intelligence Pack with Oochiumpa as exemplar (Week 12)');

  console.log('\n🔥 Critical Insight:');
  console.log('   We don\'t start from zero.');
  console.log('   We start from Oochiumpa\'s proven 72% school re-engagement');
  console.log('   and 95% offending reduction.');
  console.log('   This is the benchmark.');
  console.log('   Everything else is discovered in relation to this');
  console.log('   Aboriginal-owned success story.');

  console.log('\n' + '═'.repeat(80));
  console.log('\n✨ Oochiumpa is now the foundation of ALMA.\n');
}

integrateOochiumpa().catch(console.error);
