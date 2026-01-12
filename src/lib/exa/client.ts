/**
 * Exa.ai API Client
 *
 * Provides interface for Neural Search and Content Extraction.
 */

const EXA_API_BASE = 'https://api.exa.ai';

interface ExaConfig {
    apiKey: string;
}

export interface ExaResult {
    title: string;
    url: string;
    id: string;
    score?: number;
    publishedDate?: string;
    author?: string;
    text?: string;
}

export interface ExaSearchResponse {
    results: ExaResult[];
}

export class ExaClient {
    private apiKey: string;

    constructor(config?: ExaConfig) {
        this.apiKey = config?.apiKey || process.env.EXA_API_KEY || '';
    }

    private get headers() {
        return {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
        };
    }

    isConfigured(): boolean {
        return Boolean(this.apiKey);
    }

    /**
     * Search and retrieve contents in one neural step
     */
    async searchAndContents(query: string, options: {
        numResults?: number;
        useAutoprompt?: boolean;
        type?: 'neural' | 'keyword';
    } = {}): Promise<ExaSearchResponse> {
        if (!this.isConfigured()) {
            console.warn('Exa Client not configured');
            return { results: [] };
        }

        try {
            const response = await fetch(`${EXA_API_BASE}/search`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    query,
                    numResults: options.numResults || 3,
                    useAutoprompt: options.useAutoprompt ?? true,
                    contents: {
                        text: true,
                        highlights: true
                    }
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Exa API error: ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Exa searchAndContents error:', error);
            return { results: [] };
        }
    }

    /**
     * Find a person by name and organization
     */
    async findPerson(name: string, organization: string): Promise<ExaResult[]> {
        const query = `linkedin profile and bio for ${name} at ${organization}`;
        const response = await this.searchAndContents(query, { numResults: 3 });
        return response.results;
    }
}

// Singleton instance
let exaClient: ExaClient | null = null;

export function getExaClient(): ExaClient {
    if (!exaClient) {
        exaClient = new ExaClient();
    }
    return exaClient;
}
