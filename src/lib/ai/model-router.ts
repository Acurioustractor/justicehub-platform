/**
 * Multi-Provider LLM Engine
 *
 * Round-robin rotation across free/cheap providers first.
 * Ported from GrantScope's battle-tested pattern.
 *
 * Provider order (free/cheap first):
 * 1. Groq (free, llama-3.3-70b)
 * 2. Gemini (free tier, gemini-2.5-flash)
 * 3. DeepSeek ($0.27/M tokens)
 * 4. OpenAI (gpt-4o-mini)
 * 5. Anthropic (claude-sonnet-4-5)
 */

import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderConfig {
  name: string;
  envKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  supportsJsonMode: boolean;
  isReasoning?: boolean; // strip <think> blocks
}

export interface CallLLMOptions {
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
}

// ---------------------------------------------------------------------------
// Provider configs
// ---------------------------------------------------------------------------

const PROVIDERS: ProviderConfig[] = [
  {
    name: 'groq',
    envKey: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4096,
    supportsJsonMode: true,
  },
  {
    name: 'gemini',
    envKey: 'GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
    maxTokens: 4096,
    supportsJsonMode: true,
  },
  {
    name: 'deepseek',
    envKey: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    maxTokens: 4096,
    supportsJsonMode: true,
    isReasoning: true,
  },
  {
    name: 'openai',
    envKey: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    supportsJsonMode: true,
  },
  {
    name: 'anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    supportsJsonMode: false,
  },
];

// ---------------------------------------------------------------------------
// LLM Client (singleton)
// ---------------------------------------------------------------------------

export class LLMClient {
  private static instance: LLMClient;
  private callIndex = 0;
  private disabledProviders = new Set<string>();

  static getInstance(): LLMClient {
    if (!LLMClient.instance) {
      LLMClient.instance = new LLMClient();
    }
    return LLMClient.instance;
  }

  /** Get active providers (have API key + not disabled) */
  private getActiveProviders(): ProviderConfig[] {
    return PROVIDERS.filter(
      (p) => process.env[p.envKey] && !this.disabledProviders.has(p.name)
    );
  }

  /** Round-robin next provider */
  private getNextProvider(active: ProviderConfig[]): ProviderConfig {
    const provider = active[this.callIndex % active.length];
    this.callIndex++;
    return provider;
  }

  /** Strip <think>...</think> blocks from reasoning models */
  private stripThinkBlocks(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  /** Call any OpenAI-compatible endpoint */
  private async callOpenAICompatible(
    provider: ProviderConfig,
    prompt: string,
    options: CallLLMOptions = {}
  ): Promise<string> {
    const apiKey = process.env[provider.envKey]!;
    const body: Record<string, unknown> = {
      model: provider.model,
      max_tokens: options.maxTokens ?? provider.maxTokens,
      temperature: options.temperature ?? 0.3,
      messages: [
        ...(options.systemPrompt
          ? [{ role: 'system', content: options.systemPrompt }]
          : []),
        { role: 'user', content: prompt },
      ],
    };

    if (options.jsonMode && provider.supportsJsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text().catch(() => '');

      if (status === 429) {
        throw new Error(`RATELIMIT: ${provider.name} rate limited`);
      }
      if (status === 402 || status === 403 || errorText.includes('quota')) {
        throw new Error(`QUOTA: ${provider.name} quota exceeded`);
      }
      throw new Error(`${provider.name} API error ${status}: ${errorText.slice(0, 200)}`);
    }

    const json = await response.json();
    let text = json.choices?.[0]?.message?.content || '';

    if (provider.isReasoning) {
      text = this.stripThinkBlocks(text);
    }

    return text;
  }

  /** Call Anthropic Messages API */
  private async callAnthropic(
    provider: ProviderConfig,
    prompt: string,
    options: CallLLMOptions = {}
  ): Promise<string> {
    const apiKey = process.env[provider.envKey]!;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: provider.model,
      max_tokens: options.maxTokens ?? provider.maxTokens,
      temperature: options.temperature ?? 0.3,
      ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    return content.type === 'text' ? content.text : '';
  }

  /** Call a single provider */
  private async callProvider(
    provider: ProviderConfig,
    prompt: string,
    options: CallLLMOptions = {}
  ): Promise<string> {
    if (provider.name === 'anthropic') {
      return this.callAnthropic(provider, prompt, options);
    }
    return this.callOpenAICompatible(provider, prompt, options);
  }

  /**
   * Call LLM with automatic rotation and fallback.
   * Tries providers round-robin; disables on quota, retries on rate limit.
   */
  async call(prompt: string, options: CallLLMOptions = {}): Promise<string> {
    const active = this.getActiveProviders();
    if (active.length === 0) {
      throw new Error('No AI providers configured (check API keys in env)');
    }

    const startIdx = this.callIndex;
    const errors: string[] = [];

    for (let attempt = 0; attempt < active.length; attempt++) {
      const provider = this.getNextProvider(active);
      try {
        console.log(`[LLM] Trying ${provider.name} (${provider.model})`);
        const result = await this.callProvider(provider, prompt, options);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name}: ${msg}`);

        if (msg.startsWith('QUOTA:')) {
          console.warn(`[LLM] ${provider.name} quota exceeded — disabled for session`);
          this.disabledProviders.add(provider.name);
        } else if (msg.startsWith('RATELIMIT:')) {
          console.warn(`[LLM] ${provider.name} rate limited — trying next`);
        } else {
          console.warn(`[LLM] ${provider.name} error: ${msg}`);
        }
      }
    }

    throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
  }

  /** Reset disabled providers (e.g., on new request cycle) */
  resetDisabled(): void {
    this.disabledProviders.clear();
  }

  /** Get status of all providers */
  getStatus(): Array<{ name: string; available: boolean; disabled: boolean }> {
    return PROVIDERS.map((p) => ({
      name: p.name,
      available: Boolean(process.env[p.envKey]),
      disabled: this.disabledProviders.has(p.name),
    }));
  }
}

// ---------------------------------------------------------------------------
// Convenience export
// ---------------------------------------------------------------------------

/** Call LLM with automatic provider rotation */
export async function callLLM(prompt: string, options?: CallLLMOptions): Promise<string> {
  return LLMClient.getInstance().call(prompt, options);
}

