#!/usr/bin/env node

/**
 * ALMA Continuous Learning Feedback Loop
 *
 * This system implements continuous learning for ALMA evidence extraction:
 * 1. Tracks extraction patterns and quality metrics
 * 2. Learns from successful vs failed extractions
 * 3. Adapts extraction strategies based on document types
 * 4. Improves confidence scoring over time
 * 5. Surfaces insights for human review
 *
 * Philosophy:
 * - Machines learn patterns, humans make decisions
 * - Transparent learning (no black box)
 * - Community authority > algorithmic confidence
 * - Learns what to escalate to humans, not what to decide
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
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

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * Learning System Architecture
 *
 * 1. Extraction Feedback Loop
 *    - Track extraction attempts (success/failure/partial)
 *    - Identify patterns in successful extractions
 *    - Learn document type → extraction strategy mappings
 *
 * 2. Quality Signal Learning
 *    - Track which interventions get high community authority scores
 *    - Learn indicators of evidence strength
 *    - Identify patterns in implementation capability
 *
 * 3. Pattern Recognition
 *    - Detect familiar document structures
 *    - Identify common evidence types
 *    - Learn program naming patterns
 *
 * 4. Confidence Calibration
 *    - Track confidence scores vs actual accuracy
 *    - Adjust confidence thresholds over time
 *    - Learn when to escalate to human review
 */

class ALMALearningSystem {
  constructor() {
    this.learningDatabase = 'alma_learning_patterns';
    this.extractionHistory = 'alma_extraction_history';
    this.qualityMetrics = 'alma_quality_metrics';
  }

  /**
   * Initialize learning database tables
   */
  async initializeLearningTables() {
    console.log('Initializing learning system tables...');

    // Create extraction history table
    const extractionHistorySQL = `
      CREATE TABLE IF NOT EXISTS alma_extraction_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_document_id UUID REFERENCES alma_source_documents(id),
        raw_content_id UUID REFERENCES alma_raw_content(id),
        extraction_timestamp TIMESTAMPTZ DEFAULT NOW(),

        -- Extraction metadata
        document_type TEXT, -- 'government_report', 'research_paper', 'news_article', 'policy_doc'
        document_length INT,
        document_structure TEXT, -- 'pdf_table', 'pdf_narrative', 'html_list', 'html_article'

        -- Extraction results
        interventions_extracted INT DEFAULT 0,
        interventions_validated INT DEFAULT 0, -- After human review
        extraction_confidence FLOAT, -- 0.0-1.0
        extraction_strategy TEXT, -- Which prompt/approach used

        -- Quality metrics
        evidence_extracted BOOLEAN DEFAULT FALSE,
        community_authority_detected BOOLEAN DEFAULT FALSE,
        cost_data_extracted BOOLEAN DEFAULT FALSE,
        outcomes_extracted BOOLEAN DEFAULT FALSE,

        -- Learning signals
        extraction_success BOOLEAN, -- Did it work?
        human_review_required BOOLEAN DEFAULT FALSE,
        human_review_completed BOOLEAN DEFAULT FALSE,
        human_feedback JSONB, -- What humans corrected

        -- Performance
        extraction_time_ms INT,
        llm_tokens_used INT,
        cost_usd NUMERIC(10, 4),

        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_extraction_document_type ON alma_extraction_history(document_type);
      CREATE INDEX IF NOT EXISTS idx_extraction_success ON alma_extraction_history(extraction_success);
      CREATE INDEX IF NOT EXISTS idx_extraction_timestamp ON alma_extraction_history(extraction_timestamp DESC);
    `;

    // Create learning patterns table
    const learningPatternsSQL = `
      CREATE TABLE IF NOT EXISTS alma_learning_patterns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pattern_type TEXT NOT NULL, -- 'document_structure', 'evidence_indicator', 'program_naming', 'authority_signal'
        pattern_name TEXT NOT NULL,
        pattern_description TEXT,

        -- Pattern definition
        pattern_signals JSONB, -- What signals indicate this pattern
        confidence_threshold FLOAT DEFAULT 0.7,

        -- Learning metrics
        observations_count INT DEFAULT 0, -- How many times seen
        success_rate FLOAT, -- % of successful extractions when pattern detected
        precision FLOAT, -- % of pattern detections that were correct
        recall FLOAT, -- % of actual instances that were detected

        -- Adaptation
        strategy_adjustments JSONB, -- How to adjust extraction when pattern detected
        human_validation_required BOOLEAN DEFAULT FALSE,

        -- Evolution
        first_observed TIMESTAMPTZ DEFAULT NOW(),
        last_observed TIMESTAMPTZ,
        pattern_strength FLOAT DEFAULT 0.5, -- How strong/reliable is this pattern

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_learning_pattern_type ON alma_learning_patterns(pattern_type);
      CREATE INDEX IF NOT EXISTS idx_learning_strength ON alma_learning_patterns(pattern_strength DESC);
    `;

    // Create quality metrics table
    const qualityMetricsSQL = `
      CREATE TABLE IF NOT EXISTS alma_quality_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_date DATE DEFAULT CURRENT_DATE,

        -- Extraction quality
        total_extractions INT DEFAULT 0,
        successful_extractions INT DEFAULT 0,
        partial_extractions INT DEFAULT 0,
        failed_extractions INT DEFAULT 0,

        -- Evidence quality
        high_evidence_interventions INT DEFAULT 0, -- evidence_strength > 0.7
        community_led_interventions INT DEFAULT 0, -- community_authority > 0.8
        complete_interventions INT DEFAULT 0, -- All required fields populated

        -- Learning progress
        new_patterns_discovered INT DEFAULT 0,
        patterns_validated INT DEFAULT 0,
        patterns_deprecated INT DEFAULT 0,

        -- Confidence calibration
        avg_extraction_confidence FLOAT,
        avg_human_agreement_rate FLOAT, -- % humans agree with extraction
        confidence_calibration_error FLOAT, -- Difference between confidence and accuracy

        -- Efficiency
        avg_extraction_time_ms INT,
        avg_tokens_per_extraction INT,
        avg_cost_per_extraction NUMERIC(10, 4),

        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_quality_date ON alma_quality_metrics(metric_date DESC);
    `;

    try {
      await supabase.rpc('exec_sql', { sql: extractionHistorySQL });
      await supabase.rpc('exec_sql', { sql: learningPatternsSQL });
      await supabase.rpc('exec_sql', { sql: qualityMetricsSQL });
      console.log('✅ Learning system tables initialized');
    } catch (error) {
      console.error('Error initializing tables:', error);
      // Tables might already exist, continue
    }
  }

  /**
   * Record an extraction attempt
   */
  async recordExtraction(extractionData) {
    const { data, error } = await supabase
      .from('alma_extraction_history')
      .insert({
        source_document_id: extractionData.source_document_id,
        raw_content_id: extractionData.raw_content_id,
        document_type: extractionData.document_type,
        document_length: extractionData.document_length,
        document_structure: extractionData.document_structure,
        interventions_extracted: extractionData.interventions_extracted || 0,
        extraction_confidence: extractionData.extraction_confidence,
        extraction_strategy: extractionData.extraction_strategy,
        evidence_extracted: extractionData.evidence_extracted || false,
        community_authority_detected: extractionData.community_authority_detected || false,
        cost_data_extracted: extractionData.cost_data_extracted || false,
        outcomes_extracted: extractionData.outcomes_extracted || false,
        extraction_success: extractionData.extraction_success,
        extraction_time_ms: extractionData.extraction_time_ms,
        llm_tokens_used: extractionData.llm_tokens_used,
        cost_usd: extractionData.cost_usd,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording extraction:', error);
      return null;
    }

    return data;
  }

  /**
   * Learn patterns from successful extractions
   */
  async learnFromExtractions() {
    console.log('\n🧠 Learning from extraction patterns...\n');

    // Get recent successful extractions
    const { data: successfulExtractions, error } = await supabase
      .from('alma_extraction_history')
      .select('*')
      .eq('extraction_success', true)
      .order('extraction_timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching extractions:', error);
      return;
    }

    console.log(`Analyzing ${successfulExtractions.length} successful extractions...`);

    // Group by document type
    const byDocType = {};
    for (const ext of successfulExtractions) {
      const type = ext.document_type || 'unknown';
      if (!byDocType[type]) {
        byDocType[type] = [];
      }
      byDocType[type].push(ext);
    }

    // Learn patterns for each document type
    for (const [docType, extractions] of Object.entries(byDocType)) {
      await this.learnDocumentTypePatterns(docType, extractions);
    }

    // Learn quality indicators
    await this.learnQualityIndicators(successfulExtractions);

    // Calibrate confidence scores
    await this.calibrateConfidence();

    console.log('✅ Learning complete\n');
  }

  /**
   * Learn patterns for a specific document type
   */
  async learnDocumentTypePatterns(documentType, extractions) {
    console.log(`\n📊 Document Type: ${documentType} (${extractions.length} samples)`);

    // Calculate success metrics
    const avgConfidence = extractions.reduce((sum, e) => sum + (e.extraction_confidence || 0), 0) / extractions.length;
    const evidenceRate = extractions.filter(e => e.evidence_extracted).length / extractions.length;
    const authorityRate = extractions.filter(e => e.community_authority_detected).length / extractions.length;
    const avgInterventions = extractions.reduce((sum, e) => sum + (e.interventions_extracted || 0), 0) / extractions.length;

    console.log(`  Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`  Evidence extraction rate: ${(evidenceRate * 100).toFixed(1)}%`);
    console.log(`  Community authority detection: ${(authorityRate * 100).toFixed(1)}%`);
    console.log(`  Average interventions per document: ${avgInterventions.toFixed(1)}`);

    // Identify best extraction strategy for this document type
    const byStrategy = {};
    for (const ext of extractions) {
      const strategy = ext.extraction_strategy || 'default';
      if (!byStrategy[strategy]) {
        byStrategy[strategy] = { count: 0, totalConfidence: 0, totalInterventions: 0 };
      }
      byStrategy[strategy].count++;
      byStrategy[strategy].totalConfidence += ext.extraction_confidence || 0;
      byStrategy[strategy].totalInterventions += ext.interventions_extracted || 0;
    }

    let bestStrategy = 'default';
    let bestScore = 0;
    for (const [strategy, stats] of Object.entries(byStrategy)) {
      const avgConf = stats.totalConfidence / stats.count;
      const avgInt = stats.totalInterventions / stats.count;
      const score = avgConf * avgInt; // Combined score
      console.log(`  Strategy "${strategy}": ${stats.count} uses, ${(avgConf * 100).toFixed(1)}% confidence, ${avgInt.toFixed(1)} interventions`);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }

    // Store or update learning pattern
    const patternData = {
      pattern_type: 'document_structure',
      pattern_name: `${documentType}_optimal_strategy`,
      pattern_description: `Best extraction strategy for ${documentType} documents`,
      pattern_signals: {
        document_type: documentType,
        recommended_strategy: bestStrategy,
        avg_confidence: avgConfidence,
        evidence_rate: evidenceRate,
        authority_rate: authorityRate,
      },
      observations_count: extractions.length,
      success_rate: 1.0, // These are all successful
      pattern_strength: avgConfidence,
      last_observed: new Date().toISOString(),
    };

    // Upsert pattern
    const { error } = await supabase
      .from('alma_learning_patterns')
      .upsert(patternData, { onConflict: 'pattern_name' });

    if (error) {
      console.error('Error storing pattern:', error);
    } else {
      console.log(`  ✅ Learned: Use "${bestStrategy}" strategy for ${documentType}`);
    }
  }

  /**
   * Learn quality indicators
   */
  async learnQualityIndicators(extractions) {
    console.log('\n🎯 Learning quality indicators...');

    // Find interventions with high signal scores
    const { data: highQualityInterventions } = await supabase
      .from('alma_interventions')
      .select(`
        id, name, type, evidence_level, cultural_authority,
        created_at, metadata
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!highQualityInterventions) return;

    // Analyze what makes high-quality interventions
    const withHighEvidence = highQualityInterventions.filter(
      i => i.evidence_level?.includes('Proven') || i.evidence_level?.includes('Effective')
    );

    const withHighAuthority = highQualityInterventions.filter(
      i => i.cultural_authority?.includes('Aboriginal Community Controlled') ||
           i.cultural_authority?.includes('Indigenous-led')
    );

    console.log(`  High evidence: ${withHighEvidence.length}/${highQualityInterventions.length}`);
    console.log(`  High community authority: ${withHighAuthority.length}/${highQualityInterventions.length}`);

    // Extract common patterns in high-quality interventions
    const evidenceKeywords = this.extractKeywords(
      withHighEvidence.map(i => i.metadata?.description || i.name || '')
    );

    const authorityKeywords = this.extractKeywords(
      withHighAuthority.map(i => i.cultural_authority || '')
    );

    console.log(`  Evidence indicators: ${evidenceKeywords.slice(0, 5).join(', ')}`);
    console.log(`  Authority indicators: ${authorityKeywords.slice(0, 5).join(', ')}`);

    // Store patterns
    await supabase.from('alma_learning_patterns').upsert({
      pattern_type: 'evidence_indicator',
      pattern_name: 'high_evidence_keywords',
      pattern_description: 'Keywords commonly found in high-evidence interventions',
      pattern_signals: { keywords: evidenceKeywords.slice(0, 20) },
      observations_count: withHighEvidence.length,
      pattern_strength: withHighEvidence.length / highQualityInterventions.length,
      last_observed: new Date().toISOString(),
    }, { onConflict: 'pattern_name' });

    await supabase.from('alma_learning_patterns').upsert({
      pattern_type: 'authority_signal',
      pattern_name: 'community_authority_keywords',
      pattern_description: 'Keywords indicating community authority and Indigenous leadership',
      pattern_signals: { keywords: authorityKeywords.slice(0, 20) },
      observations_count: withHighAuthority.length,
      pattern_strength: withHighAuthority.length / highQualityInterventions.length,
      last_observed: new Date().toISOString(),
    }, { onConflict: 'pattern_name' });

    console.log('  ✅ Quality patterns learned');
  }

  /**
   * Extract keywords from text samples
   */
  extractKeywords(texts) {
    const wordCounts = {};
    const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'has', 'are', 'was', 'were']);

    for (const text of texts) {
      const words = text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  /**
   * Calibrate confidence scores against actual accuracy
   */
  async calibrateConfidence() {
    console.log('\n📈 Calibrating confidence scores...');

    // Get extractions with human review
    const { data: reviewedExtractions } = await supabase
      .from('alma_extraction_history')
      .select('*')
      .eq('human_review_completed', true)
      .order('extraction_timestamp', { ascending: false })
      .limit(50);

    if (!reviewedExtractions || reviewedExtractions.length === 0) {
      console.log('  No human-reviewed extractions yet. Calibration will improve as humans review.');
      return;
    }

    // Calculate calibration error
    let totalError = 0;
    let validatedCorrect = 0;

    for (const ext of reviewedExtractions) {
      const confidence = ext.extraction_confidence || 0;
      const actualSuccess = ext.interventions_validated > 0;
      const actualAccuracy = ext.interventions_validated / Math.max(ext.interventions_extracted, 1);

      const error = Math.abs(confidence - actualAccuracy);
      totalError += error;

      if (actualAccuracy > 0.7) {
        validatedCorrect++;
      }
    }

    const avgCalibrationError = totalError / reviewedExtractions.length;
    const humanAgreementRate = validatedCorrect / reviewedExtractions.length;

    console.log(`  Human agreement rate: ${(humanAgreementRate * 100).toFixed(1)}%`);
    console.log(`  Average calibration error: ${(avgCalibrationError * 100).toFixed(1)}%`);

    if (avgCalibrationError > 0.2) {
      console.log('  ⚠️  High calibration error detected. Consider adjusting confidence thresholds.');
    } else {
      console.log('  ✅ Confidence scores well-calibrated');
    }

    // Store metrics
    await supabase.from('alma_quality_metrics').insert({
      metric_date: new Date().toISOString().split('T')[0],
      total_extractions: reviewedExtractions.length,
      successful_extractions: validatedCorrect,
      avg_extraction_confidence: reviewedExtractions.reduce((sum, e) => sum + (e.extraction_confidence || 0), 0) / reviewedExtractions.length,
      avg_human_agreement_rate: humanAgreementRate,
      confidence_calibration_error: avgCalibrationError,
    });
  }

  /**
   * Generate extraction strategy recommendations based on learned patterns
   */
  async getExtractionStrategy(documentType, documentStructure) {
    // Get learned patterns for this document type
    const { data: patterns } = await supabase
      .from('alma_learning_patterns')
      .select('*')
      .eq('pattern_type', 'document_structure')
      .ilike('pattern_name', `${documentType}%`)
      .order('pattern_strength', { ascending: false })
      .limit(1);

    if (!patterns || patterns.length === 0) {
      return {
        strategy: 'default',
        confidence: 0.5,
        reason: 'No learned patterns for this document type yet',
      };
    }

    const pattern = patterns[0];
    return {
      strategy: pattern.pattern_signals?.recommended_strategy || 'default',
      confidence: pattern.pattern_strength || 0.5,
      reason: `Based on ${pattern.observations_count} successful extractions`,
      expectedEvidence: pattern.pattern_signals?.evidence_rate || 0,
      expectedAuthority: pattern.pattern_signals?.authority_rate || 0,
    };
  }

  /**
   * Suggest interventions that need human review
   */
  async suggestHumanReview() {
    console.log('\n👤 Interventions needing human review:\n');

    // Find recent interventions with low confidence or incomplete data
    const { data: interventions } = await supabase
      .from('alma_interventions')
      .select(`
        id, name, type, evidence_level, cultural_authority,
        target_cohort, geography, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!interventions) return;

    const needsReview = [];

    for (const intervention of interventions) {
      const issues = [];

      // Check for missing critical fields
      if (!intervention.evidence_level || intervention.evidence_level === 'Unknown') {
        issues.push('Missing evidence level');
      }

      if (!intervention.cultural_authority) {
        issues.push('Missing cultural authority');
      }

      if (!intervention.target_cohort) {
        issues.push('Missing target cohort');
      }

      if (!intervention.geography) {
        issues.push('Missing geography');
      }

      // Check for ambiguous data
      if (intervention.type === 'Other') {
        issues.push('Uncategorized type');
      }

      if (issues.length > 0) {
        needsReview.push({
          ...intervention,
          issues,
          priority: issues.length >= 3 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // Sort by priority
    needsReview.sort((a, b) => {
      if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
      if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
      return b.issues.length - a.issues.length;
    });

    console.log(`Found ${needsReview.length} interventions needing review:\n`);

    for (const item of needsReview.slice(0, 10)) {
      console.log(`${item.priority === 'HIGH' ? '🔴' : '🟡'} ${item.name}`);
      console.log(`   ${item.issues.join(', ')}`);
      console.log(`   Created: ${new Date(item.created_at).toLocaleDateString()}`);
      console.log('');
    }

    return needsReview;
  }

  /**
   * Generate learning report
   */
  async generateLearningReport() {
    console.log('\n📊 ALMA Learning System Report\n');
    console.log('='.repeat(60));

    // Get overall metrics
    const { data: recentMetrics } = await supabase
      .from('alma_quality_metrics')
      .select('*')
      .order('metric_date', { ascending: false })
      .limit(30);

    if (recentMetrics && recentMetrics.length > 0) {
      const latest = recentMetrics[0];
      console.log('\n📈 Recent Performance:');
      console.log(`  Total extractions: ${latest.total_extractions}`);
      console.log(`  Success rate: ${((latest.successful_extractions / latest.total_extractions) * 100).toFixed(1)}%`);
      console.log(`  Avg confidence: ${(latest.avg_extraction_confidence * 100).toFixed(1)}%`);
      console.log(`  Human agreement: ${(latest.avg_human_agreement_rate * 100).toFixed(1)}%`);
    }

    // Get learned patterns
    const { data: patterns } = await supabase
      .from('alma_learning_patterns')
      .select('*')
      .order('pattern_strength', { ascending: false });

    if (patterns && patterns.length > 0) {
      console.log(`\n🧠 Learned Patterns (${patterns.length} total):\n`);

      const byType = {};
      for (const pattern of patterns) {
        const type = pattern.pattern_type;
        if (!byType[type]) byType[type] = [];
        byType[type].push(pattern);
      }

      for (const [type, typePatterns] of Object.entries(byType)) {
        console.log(`  ${type}: ${typePatterns.length} patterns`);
        for (const p of typePatterns.slice(0, 3)) {
          console.log(`    • ${p.pattern_name} (strength: ${(p.pattern_strength * 100).toFixed(1)}%, n=${p.observations_count})`);
        }
        console.log('');
      }
    }

    // Get extraction history summary
    const { data: history } = await supabase
      .from('alma_extraction_history')
      .select('document_type, extraction_success, interventions_extracted')
      .order('extraction_timestamp', { ascending: false })
      .limit(100);

    if (history && history.length > 0) {
      console.log(`\n📚 Recent Extraction History (last ${history.length}):\n`);

      const byDocType = {};
      for (const ext of history) {
        const type = ext.document_type || 'unknown';
        if (!byDocType[type]) {
          byDocType[type] = { total: 0, success: 0, interventions: 0 };
        }
        byDocType[type].total++;
        if (ext.extraction_success) byDocType[type].success++;
        byDocType[type].interventions += ext.interventions_extracted || 0;
      }

      for (const [type, stats] of Object.entries(byDocType)) {
        const successRate = (stats.success / stats.total) * 100;
        const avgInterventions = stats.interventions / stats.total;
        console.log(`  ${type}:`);
        console.log(`    ${stats.total} extractions, ${successRate.toFixed(1)}% success, ${avgInterventions.toFixed(1)} interventions avg`);
      }
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  const system = new ALMALearningSystem();

  console.log('🧠 ALMA Continuous Learning System\n');
  console.log('This system learns from extraction patterns to improve');
  console.log('evidence extraction quality over time.\n');

  // Initialize tables
  await system.initializeLearningTables();

  // Learn from existing extractions
  await system.learnFromExtractions();

  // Suggest what needs human review
  await system.suggestHumanReview();

  // Generate report
  await system.generateLearningReport();

  console.log('\n✅ Learning cycle complete\n');
  console.log('Run this script regularly (e.g., daily) to continuously improve extraction quality.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ALMALearningSystem };
