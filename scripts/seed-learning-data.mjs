#!/usr/bin/env node

/**
 * Seed ALMA Learning System with Sample Data
 *
 * Creates sample extraction history to demonstrate the learning system.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
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

async function seedLearningData() {
  console.log('\n🌱 Seeding ALMA Learning System with sample data...\n');

  // Get some raw content IDs
  const { data: rawContent } = await supabase
    .from('alma_raw_content')
    .select('id, source_url, source_type')
    .limit(5);

  if (!rawContent || rawContent.length === 0) {
    console.log('No raw content found. Run scraper first.');
    return;
  }

  console.log(`Found ${rawContent.length} raw content items to process\n`);

  // Sample extraction attempts with different outcomes
  const sampleExtractions = [
    {
      raw_content_id: rawContent[0]?.id,
      document_type: 'government_report',
      document_structure: 'pdf_table',
      document_length: 15000,
      interventions_extracted: 12,
      extraction_confidence: 0.87,
      extraction_strategy: 'table_focused',
      evidence_extracted: true,
      community_authority_detected: true,
      cost_data_extracted: true,
      outcomes_extracted: false,
      extraction_success: true,
      human_review_required: false,
      extraction_time_ms: 45200,
      llm_tokens_used: 125000,
      cost_usd: 0.0234,
    },
    {
      raw_content_id: rawContent[1]?.id,
      document_type: 'research_paper',
      document_structure: 'pdf_narrative',
      document_length: 28000,
      interventions_extracted: 5,
      extraction_confidence: 0.72,
      extraction_strategy: 'narrative_focused',
      evidence_extracted: true,
      community_authority_detected: false,
      cost_data_extracted: false,
      outcomes_extracted: true,
      extraction_success: true,
      human_review_required: false,
      extraction_time_ms: 62100,
      llm_tokens_used: 185000,
      cost_usd: 0.0412,
    },
    {
      raw_content_id: rawContent[2]?.id,
      document_type: 'service_directory',
      document_structure: 'html_list',
      document_length: 8500,
      interventions_extracted: 23,
      extraction_confidence: 0.91,
      extraction_strategy: 'list_focused',
      evidence_extracted: false,
      community_authority_detected: true,
      cost_data_extracted: false,
      outcomes_extracted: false,
      extraction_success: true,
      human_review_required: false,
      extraction_time_ms: 31200,
      llm_tokens_used: 98000,
      cost_usd: 0.0189,
    },
    {
      raw_content_id: rawContent[3]?.id,
      document_type: 'news_article',
      document_structure: 'html_article',
      document_length: 3200,
      interventions_extracted: 1,
      extraction_confidence: 0.45,
      extraction_strategy: 'default',
      evidence_extracted: false,
      community_authority_detected: false,
      cost_data_extracted: false,
      outcomes_extracted: false,
      extraction_success: true,
      human_review_required: true, // Low confidence
      extraction_time_ms: 18900,
      llm_tokens_used: 42000,
      cost_usd: 0.0087,
    },
    {
      raw_content_id: rawContent[4]?.id,
      document_type: 'policy_document',
      document_structure: 'pdf_narrative',
      document_length: 45000,
      interventions_extracted: 0,
      extraction_confidence: 0.23,
      extraction_strategy: 'default',
      evidence_extracted: false,
      community_authority_detected: false,
      cost_data_extracted: false,
      outcomes_extracted: false,
      extraction_success: false, // Failed
      human_review_required: true,
      extraction_time_ms: 89100,
      llm_tokens_used: 320000,
      cost_usd: 0.0678,
    },
  ];

  // Insert extraction history
  console.log('Inserting sample extraction attempts...\n');

  for (let i = 0; i < sampleExtractions.length; i++) {
    const extraction = sampleExtractions[i];

    const { error } = await supabase
      .from('alma_extraction_history')
      .insert(extraction);

    if (error) {
      console.error(`❌ Error inserting extraction ${i + 1}:`, error.message);
    } else {
      const status = extraction.extraction_success ? '✅' : '❌';
      const review = extraction.human_review_required ? '⚠️ ' : '';
      console.log(`${status} ${review}${extraction.document_type} (${extraction.document_structure})`);
      console.log(`   ${extraction.interventions_extracted} interventions, ${(extraction.extraction_confidence * 100).toFixed(0)}% confidence, ${extraction.extraction_strategy}`);
    }
  }

  // Insert sample learning patterns
  console.log('\n\nInserting sample learning patterns...\n');

  const samplePatterns = [
    {
      pattern_type: 'document_structure',
      pattern_name: 'government_report_optimal_strategy',
      pattern_description: 'Best extraction strategy for government reports',
      pattern_signals: {
        document_type: 'government_report',
        recommended_strategy: 'table_focused',
        avg_confidence: 0.85,
        evidence_rate: 0.72,
      },
      observations_count: 45,
      success_rate: 0.91,
      precision: 0.87,
      recall: 0.79,
      pattern_strength: 0.85,
      pattern_active: true,
    },
    {
      pattern_type: 'document_structure',
      pattern_name: 'service_directory_optimal_strategy',
      pattern_description: 'Best extraction strategy for service directories',
      pattern_signals: {
        document_type: 'service_directory',
        recommended_strategy: 'list_focused',
        avg_confidence: 0.92,
        evidence_rate: 0.23,
        authority_rate: 0.65,
      },
      observations_count: 12,
      success_rate: 0.96,
      precision: 0.94,
      recall: 0.88,
      pattern_strength: 0.92,
      pattern_active: true,
    },
    {
      pattern_type: 'evidence_indicator',
      pattern_name: 'high_evidence_keywords',
      pattern_description: 'Keywords commonly found in high-evidence interventions',
      pattern_signals: {
        keywords: ['randomized', 'controlled', 'trial', 'evaluation', 'impact', 'evidence', 'research', 'study', 'findings', 'outcomes'],
      },
      observations_count: 78,
      success_rate: 0.82,
      pattern_strength: 0.78,
      pattern_active: true,
    },
    {
      pattern_type: 'authority_signal',
      pattern_name: 'community_authority_keywords',
      pattern_description: 'Keywords indicating community authority and Indigenous leadership',
      pattern_signals: {
        keywords: ['Aboriginal Community Controlled', 'Indigenous-led', 'community-controlled', 'ACCO', 'co-designed', 'Elders', 'Traditional Owners'],
      },
      observations_count: 65,
      success_rate: 0.89,
      pattern_strength: 0.84,
      pattern_active: true,
    },
  ];

  for (const pattern of samplePatterns) {
    const { error } = await supabase
      .from('alma_learning_patterns')
      .insert(pattern);

    if (error) {
      console.error(`❌ Error inserting pattern:`, error.message);
    } else {
      console.log(`✅ ${pattern.pattern_name}`);
      console.log(`   Strength: ${(pattern.pattern_strength * 100).toFixed(0)}%, ${pattern.observations_count} observations`);
    }
  }

  // Insert quality metrics
  console.log('\n\nInserting quality metrics...\n');

  const { error: metricsError } = await supabase
    .from('alma_quality_metrics')
    .insert({
      metric_date: new Date().toISOString().split('T')[0],
      total_extractions: 5,
      successful_extractions: 4,
      partial_extractions: 0,
      failed_extractions: 1,
      high_evidence_interventions: 2,
      community_led_interventions: 2,
      complete_interventions: 1,
      avg_extraction_confidence: 0.636,
      avg_extraction_time_ms: 49300,
      avg_tokens_per_extraction: 154000,
      avg_cost_per_extraction: 0.032,
      total_cost_usd: 0.16,
    });

  if (metricsError) {
    console.error('❌ Error inserting metrics:', metricsError.message);
  } else {
    console.log('✅ Daily quality metrics recorded');
  }

  console.log('\n✅ Seeding complete!\n');
  console.log('Run: node scripts/alma-learning-system.mjs to see learning in action\n');
}

seedLearningData().catch(console.error);
