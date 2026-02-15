/**
 * Enrichment Service
 *
 * Orchestrates the data enrichment process:
 * 1. Search for contact via Exa.ai
 * 2. Synthesize results via OpenAI (GPT-4o)
 * 3. Return structured profile
 */

import { getExaClient } from '@/lib/exa/client';
import OpenAI from 'openai';

interface EnrichedProfile {
    summary: string;
    currentRole: string;
    linkedInUrl?: string;
    keyInterests: string[];
    suggestedTags: string[];
}

export class EnrichmentService {
    private openai: OpenAI;
    private exa = getExaClient();

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || '',
        });
    }

    async enrichContact(name: string, organization: string): Promise<EnrichedProfile | null> {
        if (!this.exa.isConfigured()) {
            console.warn('Exa not configured, skipping enrichment');
            return null;
        }

        // 1. Search
        console.log(`Searching Exa for: ${name} at ${organization}`);
        const results = await this.exa.findPerson(name, organization);

        if (!results || results.length === 0) {
            return null;
        }

        // 2. Synthesize with OpenAI
        console.log(`Synthesizing ${results.length} results with GPT-4o...`);

        // Prepare context from search results
        const context = results.map(r => `
      Title: ${r.title}
      URL: ${r.url}
      Content: ${r.text?.slice(0, 500)}...
    `).join('\n---\n');

        const prompt = `
      You are an expert researcher. Create a professional profile summary for:
      Name: ${name}
      Organization: ${organization}

      Based ONLY on the following search results:
      ${context}

      Return a JSON object with:
      - summary: A 2-3 sentence professional bio.
      - currentRole: Their likely current job title.
      - linkedInUrl: The URL of their LinkedIn profile if found (otherwise null).
      - keyInterests: Array of 3-5 professional interests or topics they write about.
      - suggestedTags: Array of 3-5 tags for a CRM (e.g., "Policy Maker", "Researcher", "Youth Justice").
    `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a helpful assistant that outputs JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
            });

            const responseText = completion.choices[0].message.content || '{}';
            return JSON.parse(responseText) as EnrichedProfile;
        } catch (error) {
            console.error('Enrichment synthesis error:', error);
            return null;
        }
    }
}

export const enrichmentService = new EnrichmentService();
