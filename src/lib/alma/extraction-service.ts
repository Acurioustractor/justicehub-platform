/**
 * ALMA Extraction Service
 *
 * AI-powered document processing for ALMA entities.
 * Extracts structured data from PDFs, Word docs, and text using Claude.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import type {
  ALMAIntervention,
  ALMAEvidence,
  ALMAOutcome,
  ALMACommunityContext,
  ConsentLevel,
  InterventionType,
  EvidenceType,
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

// Lazy-initialized Anthropic client
let _anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing Anthropic API key');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

/**
 * Extraction result from Claude
 */
interface ExtractionResult {
  interventions: Partial<ALMAIntervention>[];
  evidence: Partial<ALMAEvidence>[];
  outcomes: Partial<ALMAOutcome>[];
  contexts: Partial<ALMACommunityContext>[];
  metadata: {
    source_document: string;
    extraction_confidence: number;
    warnings: string[];
  };
}

/**
 * Extraction Service - Document processing with AI
 */
export class ExtractionService {
  /**
   * Extract ALMA entities from text content
   */
  async extractFromText(
    text: string,
    sourceDocument: string,
    userId: string
  ): Promise<ExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(text);

      const message = await getAnthropic().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        temperature: 0.2,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const response = message.content[0];
      if (response.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const extracted = this.parseExtractionResponse(response.text);

      return {
        ...extracted,
        metadata: {
          source_document: sourceDocument,
          extraction_confidence: this.calculateConfidence(extracted),
          warnings: this.validateExtraction(extracted),
        },
      };
    } catch (err) {
      console.error('Extraction failed:', err);
      throw new Error(
        `Failed to extract ALMA entities: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract from PDF file (requires PDF parsing service)
   */
  async extractFromPDF(
    pdfPath: string,
    sourceDocument: string,
    userId: string
  ): Promise<ExtractionResult> {
    // This would integrate with a PDF parsing service
    // For now, throwing not implemented
    throw new Error('PDF extraction not yet implemented - integrate with PDF.js or similar');
  }

  /**
   * Extract from uploaded file in Supabase Storage
   */
  async extractFromStorageFile(
    storagePath: string,
    userId: string
  ): Promise<ExtractionResult> {
    try {
      // Download file from Supabase Storage
      const { data, error } = await getSupabase().storage
        .from('documents')
        .download(storagePath);

      if (error || !data) {
        throw new Error(`Failed to download file: ${error?.message}`);
      }

      // Convert blob to text
      const text = await data.text();

      return this.extractFromText(text, storagePath, userId);
    } catch (err) {
      throw new Error(
        `Failed to extract from storage: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create ALMA entities from extraction result
   */
  async createEntitiesFromExtraction(
    extraction: ExtractionResult,
    userId: string,
    options: {
      default_consent_level?: ConsentLevel;
      cultural_authority?: string;
      auto_publish?: boolean;
    } = {}
  ): Promise<{
    created_interventions: string[];
    created_evidence: string[];
    created_outcomes: string[];
    created_contexts: string[];
    errors: string[];
  }> {
    const created_interventions: string[] = [];
    const created_evidence: string[] = [];
    const created_outcomes: string[] = [];
    const created_contexts: string[] = [];
    const errors: string[] = [];

    // Create interventions
    for (const intervention of extraction.interventions) {
      try {
        const { data, error } = await getSupabase()
          .from('alma_interventions')
          .insert({
            ...intervention,
            consent_level: intervention.consent_level || options.default_consent_level || 'Community Controlled',
            cultural_authority: intervention.cultural_authority || options.cultural_authority,
            review_status: options.auto_publish ? 'Published' : 'Draft',
            created_by: userId,
            source_document: extraction.metadata.source_document,
          })
          .select('id')
          .single();

        if (error) {
          errors.push(`Intervention "${intervention.name}": ${error.message}`);
        } else if (data) {
          created_interventions.push(data.id);
        }
      } catch (err) {
        errors.push(
          `Intervention "${intervention.name}": ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    // Create evidence
    for (const evidence of extraction.evidence) {
      try {
        const { data, error } = await getSupabase()
          .from('alma_evidence')
          .insert({
            ...evidence,
            consent_level: evidence.consent_level || options.default_consent_level || 'Community Controlled',
            cultural_authority: evidence.cultural_authority || options.cultural_authority,
            created_by: userId,
            source_document: extraction.metadata.source_document,
          })
          .select('id')
          .single();

        if (error) {
          errors.push(`Evidence "${evidence.title}": ${error.message}`);
        } else if (data) {
          created_evidence.push(data.id);
        }
      } catch (err) {
        errors.push(
          `Evidence "${evidence.title}": ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    // Create outcomes
    for (const outcome of extraction.outcomes) {
      try {
        const { data, error } = await getSupabase()
          .from('alma_outcomes')
          .insert({
            ...outcome,
            consent_level: outcome.consent_level || options.default_consent_level || 'Public Knowledge Commons',
            created_by: userId,
            source_document: extraction.metadata.source_document,
          })
          .select('id')
          .single();

        if (error) {
          errors.push(`Outcome "${outcome.name}": ${error.message}`);
        } else if (data) {
          created_outcomes.push(data.id);
        }
      } catch (err) {
        errors.push(
          `Outcome "${outcome.name}": ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    // Create contexts
    for (const context of extraction.contexts) {
      try {
        const { data, error } = await getSupabase()
          .from('alma_community_contexts')
          .insert({
            ...context,
            consent_level: context.consent_level || options.default_consent_level || 'Community Controlled',
            cultural_authority: context.cultural_authority || options.cultural_authority,
            created_by: userId,
            source_document: extraction.metadata.source_document,
          })
          .select('id')
          .single();

        if (error) {
          errors.push(`Context "${context.name}": ${error.message}`);
        } else if (data) {
          created_contexts.push(data.id);
        }
      } catch (err) {
        errors.push(
          `Context "${context.name}": ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    return {
      created_interventions,
      created_evidence,
      created_outcomes,
      created_contexts,
      errors,
    };
  }

  /**
   * Build extraction prompt for Claude
   */
  private buildExtractionPrompt(text: string): string {
    return `Extract ALMA entities from this youth justice document.

DOCUMENT:
${text}

Extract and return a JSON object with these arrays:
- interventions: Programs, practices, or initiatives addressing youth justice
- evidence: Research, evaluations, or data supporting interventions
- outcomes: Intended or measured results
- contexts: Place-based or cultural contexts

For each entity, extract all available fields according to the ALMA schema.

Return ONLY valid JSON. No markdown, no explanation.`;
  }

  /**
   * System prompt for Claude
   */
  private getSystemPrompt(): string {
    return `You are an expert in youth justice and ALMA (Adaptive Learning & Measurement Architecture).

Your task is to extract structured ALMA entities from documents.

ALMA Entity Types:

1. INTERVENTION
   - name: string (required)
   - type: "Prevention" | "Diversion" | "Rehabilitation" | "Reintegration" | "Cultural/healing" | "Family support" | "Systems reform" (required)
   - description: string (required)
   - geography: string[] (states/territories)
   - target_cohort: string[] (e.g., "Aboriginal/Torres Strait Islander", "10-14 years")
   - evidence_level: string (e.g., "Proven Effective (RCT)", "Indigenous-led practice")
   - harm_risk_level: "None" | "Low" | "Medium" | "High" | "Requires cultural review"
   - current_funding: string
   - scalability: string
   - replication_readiness: string
   - years_operating: number
   - cultural_authority: string (who holds knowledge authority)
   - consent_level: "Public Knowledge Commons" | "Community Controlled" | "Strictly Private"

2. EVIDENCE
   - title: string (required)
   - type: "Peer-reviewed study" | "Government report" | "Program evaluation" | "Indigenous knowledge" | "Community testimony" (required)
   - authors: string[]
   - publication_year: number
   - methodology: string
   - sample_size: number
   - jurisdiction: string[]
   - key_findings: string
   - limitations: string
   - consent_level: ConsentLevel
   - cultural_authority: string

3. OUTCOME
   - name: string (required)
   - category: "Recidivism" | "School engagement" | "Family connection" | "Cultural identity" | "Mental health" | "Employment" | "Justice system engagement"
   - measurement_approach: string
   - baseline_rate: number
   - target_rate: number
   - timeframe: string
   - consent_level: ConsentLevel

4. CONTEXT
   - name: string (required)
   - type: "Geographic" | "Cultural" | "Institutional" | "Historical" (required)
   - description: string (required)
   - jurisdiction: string[]
   - population_demographics: any
   - cultural_protocols: string[]
   - consent_level: ConsentLevel
   - cultural_authority: string

RULES:
- Extract ONLY entities clearly described in the document
- Do NOT invent or infer data not explicitly stated
- For consent_level, default to "Community Controlled" unless document specifies otherwise
- For cultural_authority, extract who authored or holds authority over the knowledge
- Mark Indigenous-led practices appropriately
- Flag any harm risks or cultural review requirements
- Preserve exact quotes for key findings

Return valid JSON with this structure:
{
  "interventions": [...],
  "evidence": [...],
  "outcomes": [...],
  "contexts": [...]
}`;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseExtractionResponse(responseText: string): Omit<ExtractionResult, 'metadata'> {
    try {
      // Remove markdown code blocks if present
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      return {
        interventions: parsed.interventions || [],
        evidence: parsed.evidence || [],
        outcomes: parsed.outcomes || [],
        contexts: parsed.contexts || [],
      };
    } catch (err) {
      console.error('Failed to parse extraction response:', responseText);
      throw new Error('Claude returned invalid JSON');
    }
  }

  /**
   * Calculate extraction confidence score
   */
  private calculateConfidence(extraction: Omit<ExtractionResult, 'metadata'>): number {
    const total =
      extraction.interventions.length +
      extraction.evidence.length +
      extraction.outcomes.length +
      extraction.contexts.length;

    if (total === 0) return 0;

    // Calculate based on field completeness
    let completeness = 0;
    let fields = 0;

    extraction.interventions.forEach((i) => {
      if (i.name) completeness++;
      if (i.type) completeness++;
      if (i.description) completeness++;
      if (i.evidence_level) completeness++;
      if (i.cultural_authority) completeness++;
      fields += 5;
    });

    extraction.evidence.forEach((e) => {
      if (e.title) completeness++;
      if (e.type) completeness++;
      if (e.authors && e.authors.length > 0) completeness++;
      if (e.key_findings) completeness++;
      fields += 4;
    });

    extraction.outcomes.forEach((o) => {
      if (o.name) completeness++;
      if (o.category) completeness++;
      if (o.measurement_approach) completeness++;
      fields += 3;
    });

    extraction.contexts.forEach((c) => {
      if (c.name) completeness++;
      if (c.type) completeness++;
      if (c.description) completeness++;
      fields += 3;
    });

    return fields > 0 ? completeness / fields : 0;
  }

  /**
   * Validate extraction and return warnings
   */
  private validateExtraction(extraction: Omit<ExtractionResult, 'metadata'>): string[] {
    const warnings: string[] = [];

    // Check interventions
    extraction.interventions.forEach((i, idx) => {
      if (!i.name) {
        warnings.push(`Intervention ${idx + 1}: Missing required field "name"`);
      }
      if (!i.type) {
        warnings.push(`Intervention ${idx + 1}: Missing required field "type"`);
      }
      if (!i.description) {
        warnings.push(`Intervention ${idx + 1}: Missing required field "description"`);
      }
      if (
        i.consent_level !== 'Public Knowledge Commons' &&
        !i.cultural_authority
      ) {
        warnings.push(
          `Intervention "${i.name}": Consent level "${i.consent_level}" requires cultural_authority`
        );
      }
    });

    // Check evidence
    extraction.evidence.forEach((e, idx) => {
      if (!e.title) {
        warnings.push(`Evidence ${idx + 1}: Missing required field "title"`);
      }
      if (!e.type) {
        warnings.push(`Evidence ${idx + 1}: Missing required field "type"`);
      }
    });

    // Check outcomes
    extraction.outcomes.forEach((o, idx) => {
      if (!o.name) {
        warnings.push(`Outcome ${idx + 1}: Missing required field "name"`);
      }
      if (!o.category) {
        warnings.push(`Outcome ${idx + 1}: Missing required field "category"`);
      }
    });

    // Check contexts
    extraction.contexts.forEach((c, idx) => {
      if (!c.name) {
        warnings.push(`Context ${idx + 1}: Missing required field "name"`);
      }
      if (!c.type) {
        warnings.push(`Context ${idx + 1}: Missing required field "type"`);
      }
      if (!c.description) {
        warnings.push(`Context ${idx + 1}: Missing required field "description"`);
      }
    });

    return warnings;
  }

  /**
   * Batch process multiple documents
   */
  async batchExtract(
    documents: Array<{ path: string; type: 'text' | 'storage' }>,
    userId: string,
    options: {
      default_consent_level?: ConsentLevel;
      cultural_authority?: string;
      auto_publish?: boolean;
    } = {}
  ): Promise<{
    total_processed: number;
    total_created: number;
    results: Array<{
      document: string;
      extraction: ExtractionResult;
      created: {
        interventions: number;
        evidence: number;
        outcomes: number;
        contexts: number;
      };
      errors: string[];
    }>;
  }> {
    const results = [];
    let total_created = 0;

    for (const doc of documents) {
      try {
        let extraction: ExtractionResult;

        if (doc.type === 'storage') {
          extraction = await this.extractFromStorageFile(doc.path, userId);
        } else {
          // Read text file
          const text = await fetch(doc.path).then((r) => r.text());
          extraction = await this.extractFromText(text, doc.path, userId);
        }

        const created = await this.createEntitiesFromExtraction(
          extraction,
          userId,
          options
        );

        const created_count =
          created.created_interventions.length +
          created.created_evidence.length +
          created.created_outcomes.length +
          created.created_contexts.length;

        total_created += created_count;

        results.push({
          document: doc.path,
          extraction,
          created: {
            interventions: created.created_interventions.length,
            evidence: created.created_evidence.length,
            outcomes: created.created_outcomes.length,
            contexts: created.created_contexts.length,
          },
          errors: created.errors,
        });
      } catch (err) {
        results.push({
          document: doc.path,
          extraction: {
            interventions: [],
            evidence: [],
            outcomes: [],
            contexts: [],
            metadata: {
              source_document: doc.path,
              extraction_confidence: 0,
              warnings: [err instanceof Error ? err.message : 'Unknown error'],
            },
          },
          created: {
            interventions: 0,
            evidence: 0,
            outcomes: 0,
            contexts: 0,
          },
          errors: [err instanceof Error ? err.message : 'Unknown error'],
        });
      }
    }

    return {
      total_processed: documents.length,
      total_created,
      results,
    };
  }
}

// Export singleton instance
export const extractionService = new ExtractionService();
