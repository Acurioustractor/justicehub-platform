#!/usr/bin/env node

/**
 * ALMA Extraction Quality Tracker
 *
 * Wraps extraction processes to track quality metrics and learn from patterns.
 * Integrates with the continuous learning system to improve over time.
 *
 * Features:
 * - Records every extraction attempt with full metadata
 * - Tracks success/failure patterns
 * - Measures extraction quality (completeness, confidence)
 * - Suggests optimal extraction strategies
 * - Identifies extractions needing human review
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { ALMALearningSystem } from './alma-learning-system.mjs';

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

class ExtractionQualityTracker {
  constructor() {
    this.learningSystem = new ALMALearningSystem();
    this.currentExtraction = null;
  }

  /**
   * Start tracking an extraction
   */
  async startExtraction(documentMetadata) {
    this.currentExtraction = {
      source_document_id: documentMetadata.source_document_id,
      raw_content_id: documentMetadata.raw_content_id,
      document_type: this.detectDocumentType(documentMetadata),
      document_length: documentMetadata.content_length || 0,
      document_structure: this.detectDocumentStructure(documentMetadata),
      start_time: Date.now(),
      interventions_extracted: 0,
      extraction_confidence: 0,
      evidence_extracted: false,
      community_authority_detected: false,
      cost_data_extracted: false,
      outcomes_extracted: false,
      tokens_used: 0,
    };

    // Get recommended extraction strategy based on learned patterns
    const strategy = await this.learningSystem.getExtractionStrategy(
      this.currentExtraction.document_type,
      this.currentExtraction.document_structure
    );

    this.currentExtraction.extraction_strategy = strategy.strategy;
    this.currentExtraction.strategy_confidence = strategy.confidence;

    console.log(`\n📊 Starting extraction tracking:`);
    console.log(`  Document type: ${this.currentExtraction.document_type}`);
    console.log(`  Structure: ${this.currentExtraction.document_structure}`);
    console.log(`  Recommended strategy: ${strategy.strategy} (${(strategy.confidence * 100).toFixed(0)}% confidence)`);
    if (strategy.reason) {
      console.log(`  Reason: ${strategy.reason}`);
    }

    return strategy;
  }

  /**
   * Detect document type from metadata
   */
  detectDocumentType(metadata) {
    const url = metadata.source_url || '';
    const title = (metadata.title || '').toLowerCase();
    const org = (metadata.source_organization || '').toLowerCase();

    // Government reports
    if (url.includes('.gov.') || org.includes('government') || org.includes('parliament')) {
      return 'government_report';
    }

    // Research papers
    if (url.includes('research') || title.includes('evaluation') || title.includes('study')) {
      return 'research_paper';
    }

    // News articles
    if (url.includes('news') || org.includes('news') || org.includes('abc') || org.includes('guardian')) {
      return 'news_article';
    }

    // Policy documents
    if (title.includes('policy') || title.includes('strategy') || title.includes('framework')) {
      return 'policy_document';
    }

    // Service directories
    if (title.includes('service') || title.includes('program') || url.includes('directory')) {
      return 'service_directory';
    }

    return 'unknown';
  }

  /**
   * Detect document structure
   */
  detectDocumentStructure(metadata) {
    const contentType = metadata.content_type || '';
    const structure = (metadata.structure || '').toLowerCase();

    if (contentType.includes('pdf')) {
      if (structure.includes('table')) return 'pdf_table';
      if (structure.includes('list')) return 'pdf_list';
      return 'pdf_narrative';
    }

    if (contentType.includes('html')) {
      if (structure.includes('table')) return 'html_table';
      if (structure.includes('list')) return 'html_list';
      return 'html_article';
    }

    return 'unknown';
  }

  /**
   * Record extraction of an intervention
   */
  recordIntervention(intervention) {
    if (!this.currentExtraction) return;

    this.currentExtraction.interventions_extracted++;

    // Track what was extracted
    if (intervention.evidence_level && intervention.evidence_level !== 'Unknown') {
      this.currentExtraction.evidence_extracted = true;
    }

    if (intervention.cultural_authority) {
      this.currentExtraction.community_authority_detected = true;
    }

    if (intervention.costs || intervention.metadata?.cost_data) {
      this.currentExtraction.cost_data_extracted = true;
    }

    if (intervention.outcomes || intervention.metadata?.outcomes) {
      this.currentExtraction.outcomes_extracted = true;
    }

    // Update confidence (running average)
    if (intervention.metadata?.extraction_confidence) {
      const currentTotal = this.currentExtraction.extraction_confidence *
        (this.currentExtraction.interventions_extracted - 1);
      this.currentExtraction.extraction_confidence =
        (currentTotal + intervention.metadata.extraction_confidence) /
        this.currentExtraction.interventions_extracted;
    }
  }

  /**
   * Record LLM usage
   */
  recordLLMUsage(tokensUsed, costUSD) {
    if (!this.currentExtraction) return;
    this.currentExtraction.tokens_used += tokensUsed;
    this.currentExtraction.cost_usd = (this.currentExtraction.cost_usd || 0) + costUSD;
  }

  /**
   * Complete extraction tracking
   */
  async completeExtraction(success = true) {
    if (!this.currentExtraction) return;

    const extractionTime = Date.now() - this.currentExtraction.start_time;

    // Determine if extraction was successful
    const extractionSuccess = success && this.currentExtraction.interventions_extracted > 0;

    // Determine if human review is needed
    const needsReview = this.determineIfReviewNeeded();

    // Record in database
    const extractionRecord = {
      ...this.currentExtraction,
      extraction_time_ms: extractionTime,
      extraction_success: extractionSuccess,
      human_review_required: needsReview,
      llm_tokens_used: this.currentExtraction.tokens_used,
    };

    delete extractionRecord.start_time;
    delete extractionRecord.strategy_confidence;
    delete extractionRecord.tokens_used;

    const result = await this.learningSystem.recordExtraction(extractionRecord);

    console.log(`\n✅ Extraction tracking complete:`);
    console.log(`  Interventions extracted: ${this.currentExtraction.interventions_extracted}`);
    console.log(`  Success: ${extractionSuccess ? 'Yes' : 'No'}`);
    console.log(`  Confidence: ${(this.currentExtraction.extraction_confidence * 100).toFixed(1)}%`);
    console.log(`  Time: ${(extractionTime / 1000).toFixed(2)}s`);
    console.log(`  Tokens used: ${this.currentExtraction.tokens_used.toLocaleString()}`);
    console.log(`  Cost: $${this.currentExtraction.cost_usd?.toFixed(4) || '0.0000'}`);
    if (needsReview) {
      console.log(`  ⚠️  Human review recommended`);
    }

    this.currentExtraction = null;
    return result;
  }

  /**
   * Determine if extraction needs human review
   */
  determineIfReviewNeeded() {
    if (!this.currentExtraction) return false;

    // Low confidence
    if (this.currentExtraction.extraction_confidence < 0.6) {
      return true;
    }

    // No interventions found (might be extraction failure)
    if (this.currentExtraction.interventions_extracted === 0) {
      return true;
    }

    // Missing critical data
    if (!this.currentExtraction.evidence_extracted &&
        !this.currentExtraction.community_authority_detected) {
      return true;
    }

    // Unknown document type (need to learn)
    if (this.currentExtraction.document_type === 'unknown') {
      return true;
    }

    return false;
  }

  /**
   * Assess extraction quality
   */
  assessQuality() {
    if (!this.currentExtraction) return null;

    const qualityScore = this.calculateQualityScore();

    return {
      quality_score: qualityScore,
      interventions_count: this.currentExtraction.interventions_extracted,
      confidence: this.currentExtraction.extraction_confidence,
      completeness: this.calculateCompleteness(),
      needs_review: this.determineIfReviewNeeded(),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Calculate overall quality score (0-1)
   */
  calculateQualityScore() {
    if (!this.currentExtraction) return 0;

    let score = 0;

    // Intervention count (up to 30 points)
    score += Math.min(this.currentExtraction.interventions_extracted * 5, 30);

    // Confidence (up to 25 points)
    score += this.currentExtraction.extraction_confidence * 25;

    // Completeness (up to 45 points)
    if (this.currentExtraction.evidence_extracted) score += 15;
    if (this.currentExtraction.community_authority_detected) score += 15;
    if (this.currentExtraction.cost_data_extracted) score += 7.5;
    if (this.currentExtraction.outcomes_extracted) score += 7.5;

    return Math.min(score / 100, 1.0);
  }

  /**
   * Calculate extraction completeness
   */
  calculateCompleteness() {
    if (!this.currentExtraction) return 0;

    const fields = [
      this.currentExtraction.evidence_extracted,
      this.currentExtraction.community_authority_detected,
      this.currentExtraction.cost_data_extracted,
      this.currentExtraction.outcomes_extracted,
    ];

    const completedFields = fields.filter(f => f === true).length;
    return completedFields / fields.length;
  }

  /**
   * Generate recommendations for improvement
   */
  generateRecommendations() {
    if (!this.currentExtraction) return [];

    const recommendations = [];

    if (this.currentExtraction.interventions_extracted === 0) {
      recommendations.push({
        type: 'extraction_failure',
        message: 'No interventions extracted - document may not contain programs or extraction strategy needs adjustment',
        severity: 'high',
      });
    }

    if (this.currentExtraction.extraction_confidence < 0.5) {
      recommendations.push({
        type: 'low_confidence',
        message: 'Low extraction confidence - consider human review or different extraction strategy',
        severity: 'high',
      });
    }

    if (!this.currentExtraction.evidence_extracted) {
      recommendations.push({
        type: 'missing_evidence',
        message: 'No evidence data extracted - prompt may need to emphasize evidence extraction',
        severity: 'medium',
      });
    }

    if (!this.currentExtraction.community_authority_detected) {
      recommendations.push({
        type: 'missing_authority',
        message: 'No community authority detected - may need better prompting for Indigenous leadership indicators',
        severity: 'medium',
      });
    }

    if (this.currentExtraction.document_type === 'unknown') {
      recommendations.push({
        type: 'unknown_document',
        message: 'Document type unknown - adding to learning patterns for future classification',
        severity: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Export quality report
   */
  async exportQualityReport(days = 7) {
    console.log(`\n📊 Extraction Quality Report (Last ${days} days)\n`);
    console.log('='.repeat(70));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get extraction history
    const { data: extractions, error } = await supabase
      .from('alma_extraction_history')
      .select('*')
      .gte('extraction_timestamp', startDate.toISOString())
      .order('extraction_timestamp', { ascending: false });

    if (error || !extractions || extractions.length === 0) {
      console.log('No extractions found in this period.');
      return;
    }

    // Overall stats
    const total = extractions.length;
    const successful = extractions.filter(e => e.extraction_success).length;
    const avgConfidence = extractions.reduce((sum, e) => sum + (e.extraction_confidence || 0), 0) / total;
    const avgInterventions = extractions.reduce((sum, e) => sum + (e.interventions_extracted || 0), 0) / total;
    const avgTime = extractions.reduce((sum, e) => sum + (e.extraction_time_ms || 0), 0) / total;
    const totalCost = extractions.reduce((sum, e) => sum + (parseFloat(e.cost_usd) || 0), 0);

    console.log(`\n📈 Overall Performance:`);
    console.log(`  Total extractions: ${total}`);
    console.log(`  Success rate: ${(successful / total * 100).toFixed(1)}%`);
    console.log(`  Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`  Avg interventions: ${avgInterventions.toFixed(1)}`);
    console.log(`  Avg time: ${(avgTime / 1000).toFixed(2)}s`);
    console.log(`  Total cost: $${totalCost.toFixed(2)}`);

    // By document type
    console.log(`\n📚 By Document Type:`);
    const byType = {};
    for (const ext of extractions) {
      const type = ext.document_type || 'unknown';
      if (!byType[type]) {
        byType[type] = { count: 0, success: 0, interventions: 0, confidence: 0 };
      }
      byType[type].count++;
      if (ext.extraction_success) byType[type].success++;
      byType[type].interventions += ext.interventions_extracted || 0;
      byType[type].confidence += ext.extraction_confidence || 0;
    }

    for (const [type, stats] of Object.entries(byType).sort((a, b) => b[1].count - a[1].count)) {
      console.log(`  ${type}:`);
      console.log(`    ${stats.count} extractions, ${(stats.success / stats.count * 100).toFixed(0)}% success`);
      console.log(`    ${(stats.interventions / stats.count).toFixed(1)} interventions avg, ${(stats.confidence / stats.count * 100).toFixed(0)}% confidence`);
    }

    // Quality indicators
    console.log(`\n🎯 Quality Indicators:`);
    const withEvidence = extractions.filter(e => e.evidence_extracted).length;
    const withAuthority = extractions.filter(e => e.community_authority_detected).length;
    const withCost = extractions.filter(e => e.cost_data_extracted).length;
    const withOutcomes = extractions.filter(e => e.outcomes_extracted).length;

    console.log(`  Evidence extracted: ${(withEvidence / total * 100).toFixed(1)}%`);
    console.log(`  Community authority: ${(withAuthority / total * 100).toFixed(1)}%`);
    console.log(`  Cost data: ${(withCost / total * 100).toFixed(1)}%`);
    console.log(`  Outcomes data: ${(withOutcomes / total * 100).toFixed(1)}%`);

    // Review needed
    const needReview = extractions.filter(e => e.human_review_required).length;
    if (needReview > 0) {
      console.log(`\n⚠️  ${needReview} extractions need human review (${(needReview / total * 100).toFixed(1)}%)`);
    }

    console.log('\n' + '='.repeat(70));
  }
}

// Export for use in other modules
export { ExtractionQualityTracker };

// CLI usage
async function main() {
  const tracker = new ExtractionQualityTracker();

  // Example: Generate quality report
  await tracker.exportQualityReport(30); // Last 30 days
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
