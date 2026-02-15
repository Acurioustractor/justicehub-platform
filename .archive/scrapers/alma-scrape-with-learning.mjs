#!/usr/bin/env node

/**
 * ALMA Scraper with Continuous Learning
 *
 * Integrates the learning system with document scraping and extraction.
 * Automatically tracks extraction quality and improves over time.
 *
 * Features:
 * - Automatic quality tracking for every extraction
 * - Learning-based extraction strategy selection
 * - Confidence scoring and human review flagging
 * - Performance metrics and cost tracking
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { ExtractionQualityTracker } from './alma-extraction-tracker.mjs';

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
 * Enhanced extraction with learning integration
 */
class LearningEnabledExtractor {
  constructor() {
    this.tracker = new ExtractionQualityTracker();
  }

  /**
   * Extract interventions from content with quality tracking
   */
  async extractInterventionsWithLearning(sourceDocument, rawContent) {
    console.log(`\n🧠 Extracting with learning system: ${sourceDocument.source_organization}`);

    // Start tracking
    const strategy = await this.tracker.startExtraction({
      source_document_id: sourceDocument.id,
      raw_content_id: rawContent.id,
      source_url: sourceDocument.source_url,
      title: sourceDocument.title,
      source_organization: sourceDocument.source_organization,
      content_length: rawContent.content?.length || 0,
      content_type: rawContent.content_type,
      structure: this.detectStructure(rawContent.content),
    });

    // Select extraction strategy based on learning
    const extractionPrompt = this.buildExtractionPrompt(strategy.strategy, rawContent);

    try {
      // Perform extraction
      const startTime = Date.now();
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 16000,
        temperature: 0,
        messages: [{
          role: 'user',
          content: extractionPrompt,
        }],
      });

      const extractionTime = Date.now() - startTime;

      // Parse response
      const interventions = this.parseExtractionResponse(response.content[0].text);

      // Track token usage
      this.tracker.recordLLMUsage(
        response.usage.input_tokens + response.usage.output_tokens,
        this.calculateCost(response.usage)
      );

      // Record each extracted intervention
      const savedInterventions = [];
      for (const intervention of interventions) {
        // Calculate confidence for this intervention
        const confidence = this.calculateInterventionConfidence(intervention);
        intervention.metadata = intervention.metadata || {};
        intervention.metadata.extraction_confidence = confidence;
        intervention.metadata.extraction_strategy = strategy.strategy;
        intervention.metadata.extraction_time_ms = extractionTime;

        // Track intervention
        this.tracker.recordIntervention(intervention);

        // Save to database
        const saved = await this.saveIntervention(intervention, sourceDocument);
        if (saved) {
          savedInterventions.push(saved);
        }
      }

      // Complete tracking
      await this.tracker.completeExtraction(true);

      // Get quality assessment
      const quality = this.tracker.assessQuality();
      if (quality) {
        console.log(`\n📊 Extraction Quality:`);
        console.log(`  Score: ${(quality.quality_score * 100).toFixed(1)}%`);
        console.log(`  Completeness: ${(quality.completeness * 100).toFixed(1)}%`);
        if (quality.needs_review) {
          console.log(`  ⚠️  Needs review`);
        }
        if (quality.recommendations.length > 0) {
          console.log(`  Recommendations:`);
          quality.recommendations.forEach(rec => {
            console.log(`    - [${rec.severity}] ${rec.message}`);
          });
        }
      }

      return savedInterventions;

    } catch (error) {
      console.error('Extraction error:', error);
      await this.tracker.completeExtraction(false);
      return [];
    }
  }

  /**
   * Detect content structure
   */
  detectStructure(content) {
    if (!content) return 'unknown';

    const hasTable = content.includes('<table>') || content.includes('| ') || /\t.*\t/.test(content);
    const hasList = content.includes('<ul>') || content.includes('<ol>') || /^\s*[-*•]\s/m.test(content);
    const hasHeadings = content.includes('##') || /<h[1-6]>/i.test(content);

    if (hasTable) return 'table';
    if (hasList) return 'list';
    if (hasHeadings) return 'structured';
    return 'narrative';
  }

  /**
   * Build extraction prompt based on strategy
   */
  buildExtractionPrompt(strategy, rawContent) {
    // Base extraction instructions (shared across strategies)
    const baseInstructions = `You are ALMA (Adaptive Learning for Meaningful Accountability), an AI agent that extracts evidence about Aboriginal and Torres Strait Islander youth justice interventions.

CRITICAL CONTEXT:
- Australia is experiencing a moral panic about youth crime
- Media and politicians push for harsher detention
- Aboriginal and Torres Strait Islander youth are VASTLY over-represented in detention (50x+ rate)
- Community-led alternatives exist but are under-resourced
- Evidence matters: We need to know what works to shift from incarceration to healing

YOUR TASK: Extract structured data about interventions, programs, and services.

EXTRACTION GUIDELINES:

1. EVIDENCE LEVEL (use exact categories):
   - "Proven (RCT/quasi-experimental, replicated)" - Multiple rigorous evaluations showing impact
   - "Effective (strong evaluation, positive outcomes)" - Strong evaluation evidence
   - "Indigenous-led (culturally grounded, community authority)" - Aboriginal Community Controlled, Indigenous-led
   - "Promising (community-endorsed, emerging evidence)" - Early evidence, community support
   - "Unknown" - No evidence mentioned

2. CULTURAL AUTHORITY (be specific):
   - "Aboriginal Community Controlled Organization (ACCO)" - Community owns and controls
   - "Indigenous-led partnership" - Indigenous organization leads
   - "Co-designed with Aboriginal community" - Equal partnership in design
   - "Culturally adapted mainstream" - Mainstream program adapted
   - "Consultation only" - Community consulted but not leading

3. INTERVENTION TYPE:
   - "Community-Led" - Aboriginal Community Controlled
   - "Cultural Connection" - On-country, language, cultural programs
   - "Diversion" - Alternative to court/detention
   - "Early Intervention" - Prevention before justice contact
   - "Detention" - Custodial programs
   - "Post-Release" - After detention support
   - "Family Support" - Whole-of-family approach
   - "Other" - Doesn't fit categories

4. TARGET COHORT:
   - "Aboriginal and Torres Strait Islander youth (10-17)" - Primary target
   - "At-risk youth (all backgrounds)" - Universal
   - "Young people in detention" - Currently detained
   - "Post-release youth" - After detention
   - "Families of justice-involved youth" - Family-focused

5. EXTRACT IF AVAILABLE:
   - Costs/funding (budget, cost per participant)
   - Outcomes (recidivism rates, reconnection metrics)
   - Risk factors (harm potential, especially for detention)
   - Geography (state, region, community)

OUTPUT FORMAT: Return JSON array of interventions.

Example:
\`\`\`json
[
  {
    "name": "Townsville Indigenous Youth Support Network",
    "type": "Community-Led",
    "description": "24/7 crisis support and cultural connection for Indigenous youth",
    "evidence_level": "Indigenous-led (culturally grounded, community authority)",
    "cultural_authority": "Aboriginal Community Controlled Organization (ACCO)",
    "target_cohort": "Aboriginal and Torres Strait Islander youth (10-17)",
    "geography": "Queensland - Townsville",
    "costs": "Annual budget: $2.5M, Cost per youth: ~$15,000",
    "outcomes": "85% of youth avoid detention, 70% reconnect with school",
    "risks": "Low - community-based, no coercive elements",
    "metadata": {
      "source_notes": "Government report mentions strong community endorsement",
      "confidence": 0.85
    }
  }
]
\`\`\`

CONTENT TO EXTRACT FROM:

${rawContent.content}`;

    // Strategy-specific adjustments
    if (strategy === 'table_focused') {
      return baseInstructions + `

STRATEGY: This document contains tables. Focus on extracting structured data from tables, treating each row as a potential intervention.`;
    }

    if (strategy === 'narrative_focused') {
      return baseInstructions + `

STRATEGY: This document is narrative text. Look for intervention descriptions within paragraphs and sections.`;
    }

    if (strategy === 'list_focused') {
      return baseInstructions + `

STRATEGY: This document contains lists. Extract interventions from bullet points and numbered lists.`;
    }

    return baseInstructions;
  }

  /**
   * Parse extraction response
   */
  parseExtractionResponse(responseText) {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Error parsing extraction response:', error);
      console.log('Response text:', responseText.substring(0, 500));
      return [];
    }
  }

  /**
   * Calculate intervention confidence score
   */
  calculateInterventionConfidence(intervention) {
    let confidence = 0.5; // Base confidence

    // Has name
    if (intervention.name && intervention.name !== 'Unknown') {
      confidence += 0.1;
    }

    // Has evidence level (not Unknown)
    if (intervention.evidence_level && intervention.evidence_level !== 'Unknown') {
      confidence += 0.15;
    }

    // Has cultural authority
    if (intervention.cultural_authority) {
      confidence += 0.15;
    }

    // Has target cohort
    if (intervention.target_cohort) {
      confidence += 0.05;
    }

    // Has geography
    if (intervention.geography) {
      confidence += 0.05;
    }

    // Has costs
    if (intervention.costs) {
      confidence += 0.05;
    }

    // Has outcomes
    if (intervention.outcomes) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate cost from Anthropic usage
   */
  calculateCost(usage) {
    // Claude 3.5 Sonnet pricing (as of 2024)
    const inputCostPer1M = 3.00;
    const outputCostPer1M = 15.00;

    const inputCost = (usage.input_tokens / 1000000) * inputCostPer1M;
    const outputCost = (usage.output_tokens / 1000000) * outputCostPer1M;

    return inputCost + outputCost;
  }

  /**
   * Save intervention to database
   */
  async saveIntervention(intervention, sourceDocument) {
    try {
      const { data, error } = await supabase
        .from('alma_interventions')
        .insert({
          name: intervention.name || 'Unknown Program',
          type: intervention.type || 'Other',
          description: intervention.description,
          evidence_level: intervention.evidence_level,
          cultural_authority: intervention.cultural_authority,
          target_cohort: intervention.target_cohort,
          geography: intervention.geography,
          costs: intervention.costs,
          outcomes: intervention.outcomes,
          risks: intervention.risks,
          harm_risk_level: this.determineHarmRisk(intervention),
          metadata: intervention.metadata || {},
          source_documents: [{
            url: sourceDocument.source_url,
            organization: sourceDocument.source_organization,
            title: sourceDocument.title,
            extracted_at: new Date().toISOString(),
          }],
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving intervention:', error);
        return null;
      }

      console.log(`  ✅ Saved: ${intervention.name}`);
      return data;

    } catch (error) {
      console.error('Error saving intervention:', error);
      return null;
    }
  }

  /**
   * Determine harm risk level
   */
  determineHarmRisk(intervention) {
    const type = intervention.type || '';
    const risks = (intervention.risks || '').toLowerCase();
    const description = (intervention.description || '').toLowerCase();

    // High risk: Detention
    if (type === 'Detention' || risks.includes('detention') || risks.includes('incarceration')) {
      return 'High';
    }

    // Medium risk: Intensive supervision, surveillance
    if (risks.includes('surveillance') || risks.includes('monitoring') || risks.includes('supervision')) {
      return 'Medium';
    }

    // Low risk: Community-based
    if (type === 'Community-Led' || type === 'Cultural Connection' || risks.includes('low')) {
      return 'Low';
    }

    return 'Unknown';
  }
}

/**
 * Process a source document with learning
 */
async function processDocumentWithLearning(sourceDocumentId) {
  const extractor = new LearningEnabledExtractor();

  // Get source document
  const { data: sourceDoc, error: docError } = await supabase
    .from('alma_source_documents')
    .select('*')
    .eq('id', sourceDocumentId)
    .single();

  if (docError || !sourceDoc) {
    console.error('Error fetching source document:', docError);
    return;
  }

  // Get raw content
  const { data: rawContent, error: contentError } = await supabase
    .from('alma_raw_content')
    .select('*')
    .eq('source_document_id', sourceDocumentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (contentError || !rawContent) {
    console.error('Error fetching raw content:', contentError);
    return;
  }

  // Extract with learning
  const interventions = await extractor.extractInterventionsWithLearning(sourceDoc, rawContent);

  console.log(`\n✅ Extracted ${interventions.length} interventions with learning system`);
  return interventions;
}

/**
 * Batch process recent documents
 */
async function batchProcessWithLearning(limit = 10) {
  console.log(`\n🧠 Batch processing ${limit} documents with learning system\n`);

  // Get recent raw content
  const { data: rawContents, error } = await supabase
    .from('alma_raw_content')
    .select('*, source_document:alma_source_documents(*)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !rawContents) {
    console.error('Error fetching raw content:', error);
    return;
  }

  const extractor = new LearningEnabledExtractor();

  let totalInterventions = 0;
  for (const rawContent of rawContents) {
    if (!rawContent.source_document) continue;

    try {
      const interventions = await extractor.extractInterventionsWithLearning(
        rawContent.source_document,
        rawContent
      );
      totalInterventions += interventions.length;

      // Small delay between documents
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${rawContent.source_document.source_organization}:`, error);
    }
  }

  console.log(`\n✅ Batch complete: ${totalInterventions} total interventions extracted`);

  // Show quality report
  await extractor.tracker.exportQualityReport(7);
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'batch') {
    const limit = parseInt(args[1]) || 10;
    await batchProcessWithLearning(limit);
  } else if (args[0] === 'document') {
    const docId = args[1];
    if (!docId) {
      console.error('Please provide document ID');
      process.exit(1);
    }
    await processDocumentWithLearning(docId);
  } else {
    console.log('Usage:');
    console.log('  node alma-scrape-with-learning.mjs batch [limit]    - Process recent documents');
    console.log('  node alma-scrape-with-learning.mjs document <id>    - Process specific document');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LearningEnabledExtractor, processDocumentWithLearning, batchProcessWithLearning };
