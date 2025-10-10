/**
 * AI-powered service data extraction using Claude 3.5 Sonnet
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ScrapedService } from './types';

// Validation schema for extracted data - handles nulls gracefully
const ServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  categories: z.array(z.string()).default([]),
  organization_name: z.string().min(1),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional().or(z.literal('').nullable()),
  website_url: z.string().url().nullable().optional().or(z.literal('').nullable()),
  street_address: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  eligibility_criteria: z.array(z.string()).nullable().optional(),
  target_age_min: z.number().int().min(0).max(100).nullable().optional(),
  target_age_max: z.number().int().min(0).max(100).nullable().optional(),
  cost: z.enum(['free', 'subsidized', 'fee_based', 'unknown']).nullable().optional(),
  delivery_method: z.array(z.string()).nullable().optional(),
  operating_hours: z.record(z.string(), z.any()).nullable().optional().or(z.object({}).nullable()),
  keywords: z.array(z.string()).nullable().optional(),
  youth_specific: z.boolean().nullable().optional(),
  indigenous_specific: z.boolean().nullable().optional(),
  languages_supported: z.array(z.string()).nullable().optional(),
  confidence: z.number().min(0).max(1),
  extraction_notes: z.string().nullable().optional(),
});

export class AIExtractor {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Extract service data from raw HTML/text using Claude
   */
  async extractServices(
    html: string,
    sourceUrl: string
  ): Promise<ScrapedService[]> {
    const prompt = this.buildExtractionPrompt(html, sourceUrl);

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Latest stable version
        max_tokens: 8000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Parse JSON response
      const services = this.parseResponse(responseText, sourceUrl);

      return services;
    } catch (error) {
      console.error('AI extraction error:', error);
      throw error;
    }
  }

  private buildExtractionPrompt(html: string, sourceUrl: string): string {
    return `You are an expert at extracting structured youth justice service data from web pages.

🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY 🚨

This is a DIRECTORY PAGE with MULTIPLE SERVICES. You MUST extract EACH service as a SEPARATE entry.

DO NOT create one generic service like "headspace Centers" or "Legal Aid Services"
DO extract EVERY individual location, centre, or program as its OWN service

EXAMPLES:

❌ WRONG (too generic):
[{"name": "headspace Centers", "description": "National mental health services"}]

✅ CORRECT (specific locations):
[
  {"name": "headspace Brisbane CBD", "street_address": "Level 2, 211 Brisbane St", "city": "Brisbane", "postcode": "4000"},
  {"name": "headspace Redcliffe", "street_address": "123 Anzac Ave", "city": "Redcliffe", "postcode": "4020"},
  {"name": "headspace Gold Coast", "street_address": "456 Surfers Paradise Blvd", "city": "Gold Coast", "postcode": "4217"}
]

EXTRACTION RULES:
- Each physical location = separate service
- Each distinct program = separate service
- Each office/branch = separate service
- Include FULL address for each
- Include specific contact details
- Extract 10-50+ services if they're listed

Source URL: ${sourceUrl}

HTML Content:
${html.substring(0, 50000)}

Extract services following these rules:

1. **Categories**: Use these standard categories:
   - legal_aid, mental_health, housing, crisis_support, education_training
   - substance_abuse, family_support, cultural_support, advocacy, court_support
   - diversion, case_management, mentoring, recreation, health

2. **Youth-specific**: Mark as true if:
   - Explicitly mentions "youth", "young people", "under 25"
   - Age range is 0-25 or similar
   - Service is clearly designed for young people

3. **Indigenous-specific**: Mark as true if mentions:
   - Aboriginal, Torres Strait Islander, Indigenous, ATSI, Murri

4. **Cost**: Categorize as:
   - "free" if explicitly free or no mention of cost
   - "subsidized" if reduced fees or financial support available
   - "fee_based" if charges apply
   - "unknown" if unclear

5. **Confidence score**: Rate 0.0-1.0 based on:
   - Complete data (1.0)
   - Most fields present (0.8)
   - Basic info only (0.5)
   - Uncertain data (0.3)

Return ONLY a JSON array of services (no markdown, no explanation):

[
  {
    "name": "Service Name",
    "description": "What the service does",
    "categories": ["category1", "category2"],
    "organization_name": "Organization providing the service",
    "contact_phone": "07 XXXX XXXX or null",
    "contact_email": "email@example.com or null",
    "website_url": "https://example.com or null",
    "street_address": "123 Street",
    "locality": "Suburb",
    "city": "Brisbane",
    "region": "Southeast Queensland",
    "state": "QLD",
    "postcode": "4000",
    "eligibility_criteria": ["Ages 10-25", "Queensland residents"],
    "target_age_min": 10,
    "target_age_max": 25,
    "cost": "free",
    "delivery_method": ["in_person", "online"],
    "operating_hours": {"mon-fri": "9am-5pm"},
    "keywords": ["youth", "legal", "court"],
    "youth_specific": true,
    "indigenous_specific": false,
    "languages_supported": ["English"],
    "confidence": 0.9,
    "extraction_notes": "Any uncertainties or assumptions"
  }
]

Extract ALL services found. Return empty array [] if no services found.`;
  }

  private parseResponse(responseText: string, sourceUrl: string): ScrapedService[] {
    try {
      // Remove markdown code blocks if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonText);
      const servicesArray = Array.isArray(parsed) ? parsed : [parsed];

      // Validate and transform each service
      const services: ScrapedService[] = [];
      for (const rawService of servicesArray) {
        try {
          const validated = ServiceSchema.parse(rawService);

          services.push({
            ...validated,
            data_source: 'ai_scrape',
            data_source_url: sourceUrl,
            scrape_confidence_score: validated.confidence,
            contact_email: validated.contact_email || undefined,
            website_url: validated.website_url || undefined,
          });
        } catch (validationError) {
          console.warn('Service validation failed:', validationError);
          // Continue with other services
        }
      }

      return services;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Response text:', responseText.substring(0, 500));
      return [];
    }
  }
}
