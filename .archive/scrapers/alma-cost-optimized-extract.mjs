#!/usr/bin/env node
/**
 * ALMA Cost-Optimized Extraction
 *
 * Uses free/cheap APIs in order of cost:
 * 1. Ollama (local, free)
 * 2. Groq (free tier)
 * 3. Gemini Flash (very cheap)
 * 4. Claude Haiku (last resort)
 *
 * 99%+ cost reduction vs Claude Sonnet/Opus
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Provider configurations
const PROVIDERS = {
  ollama: {
    name: 'Ollama (Local)',
    cost: 0,
    costPer1K: 0,
    quality: 0.70,
    available: false, // Will check
    models: ['llama3.1:8b', 'llama3.2', 'qwen2.5:7b', 'mistral'],

    async check() {
      try {
        const res = await fetch('http://localhost:11434/api/tags', {
          signal: AbortSignal.timeout(2000)
        });
        if (res.ok) {
          const data = await res.json();
          this.available = data.models?.length > 0;
          console.log(`  ✅ Ollama: ${data.models?.length || 0} models available`);
        }
      } catch {
        console.log('  ⚠️ Ollama: Not running (brew install ollama && ollama serve)');
        this.available = false;
      }
      return this.available;
    },

    async extract(prompt, model = 'llama3.1:8b') {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: { temperature: 0.1 }
        })
      });
      const data = await res.json();
      return data.response;
    }
  },

  groq: {
    name: 'Groq (Free Tier)',
    cost: 0,
    costPer1K: 0,
    quality: 0.85,
    available: false,
    rateLimit: { requests: 30, perMinute: true },

    async check() {
      this.available = !!env.GROQ_API_KEY;
      if (this.available) {
        console.log('  ✅ Groq: API key configured (free tier)');
      } else {
        console.log('  ⚠️ Groq: No API key (get free at console.groq.com)');
      }
      return this.available;
    },

    async extract(prompt) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 4096
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices[0].message.content;
    }
  },

  gemini: {
    name: 'Gemini Flash (Cheap)',
    cost: 0.000075,
    costPer1K: 0.000075,
    quality: 0.85,
    available: false,

    async check() {
      this.available = !!env.GEMINI_API_KEY;
      if (this.available) {
        console.log('  ✅ Gemini: API key configured ($0.075/M tokens)');
      } else {
        console.log('  ⚠️ Gemini: No API key (get at makersuite.google.com)');
      }
      return this.available;
    },

    async extract(prompt) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
          })
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates[0].content.parts[0].text;
    }
  },

  openrouter: {
    name: 'OpenRouter (Multi-model)',
    cost: 0.0002,
    costPer1K: 0.0002,
    quality: 0.80,
    available: false,

    async check() {
      this.available = !!env.OPENROUTER_API_KEY;
      if (this.available) {
        console.log('  ✅ OpenRouter: API key configured');
      } else {
        console.log('  ⚠️ OpenRouter: No API key (get at openrouter.ai)');
      }
      return this.available;
    },

    async extract(prompt, model = 'mistralai/mistral-7b-instruct') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://justicehub.org',
          'X-Title': 'ALMA Youth Justice'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices[0].message.content;
    }
  },

  claude_haiku: {
    name: 'Claude Haiku (Quality)',
    cost: 0.00025,
    costPer1K: 0.00025,
    quality: 0.90,
    available: false,

    async check() {
      this.available = !!env.ANTHROPIC_API_KEY;
      if (this.available) {
        console.log('  ✅ Claude Haiku: API key configured ($0.25/M tokens)');
      } else {
        console.log('  ⚠️ Claude: No API key');
      }
      return this.available;
    },

    async extract(prompt) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const res = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });
      return res.content[0].text;
    }
  }
};

/**
 * Check which providers are available
 */
async function checkProviders() {
  console.log('\n📡 Checking available providers...\n');

  for (const [key, provider] of Object.entries(PROVIDERS)) {
    await provider.check();
  }

  const available = Object.entries(PROVIDERS)
    .filter(([_, p]) => p.available)
    .sort((a, b) => a[1].cost - b[1].cost);

  console.log(`\n✅ ${available.length} providers available\n`);
  return available;
}

/**
 * Extract with automatic fallback to cheapest working provider
 */
async function extractWithFallback(prompt, options = {}) {
  const {
    minQuality = 0.7,
    maxCost = 0.001, // per 1K tokens
    preferredProvider = null
  } = options;

  // Get available providers sorted by cost
  const available = Object.entries(PROVIDERS)
    .filter(([_, p]) => p.available && p.quality >= minQuality && p.costPer1K <= maxCost)
    .sort((a, b) => a[1].cost - b[1].cost);

  if (available.length === 0) {
    throw new Error(`No providers available with quality >= ${minQuality} and cost <= $${maxCost}/1K`);
  }

  // Try preferred provider first if specified
  if (preferredProvider && PROVIDERS[preferredProvider]?.available) {
    try {
      const result = await PROVIDERS[preferredProvider].extract(prompt);
      if (result && result.length > 50) {
        return {
          result,
          provider: preferredProvider,
          cost: PROVIDERS[preferredProvider].cost
        };
      }
    } catch (error) {
      console.log(`  ⚠️ ${preferredProvider} failed: ${error.message}`);
    }
  }

  // Try providers in order of cost
  for (const [name, provider] of available) {
    try {
      console.log(`  🔄 Trying ${provider.name}...`);
      const result = await provider.extract(prompt);

      if (result && result.length > 50) {
        const costStr = provider.cost === 0 ? 'FREE' : `$${provider.costPer1K}/1K`;
        console.log(`  ✅ Success with ${provider.name} (${costStr})`);
        return { result, provider: name, cost: provider.cost };
      }
    } catch (error) {
      console.log(`  ⚠️ ${provider.name} failed: ${error.message}`);
    }
  }

  throw new Error('All providers failed');
}

/**
 * Intervention extraction prompt
 */
function createExtractionPrompt(content, jurisdiction = 'Australia') {
  return `Extract youth justice interventions from this content. Return valid JSON array.

CONTENT:
${content.substring(0, 8000)}

Return JSON array with objects containing:
- name: Program name
- type: One of [Diversion, Prevention, Early Intervention, Therapeutic, Justice Reinvestment, Cultural Connection, Education/Employment, Wraparound Support, Community-Led, Family Strengthening]
- description: Brief description
- evidence_level: One of [Proven, Effective, Promising, Indigenous-led, Untested]
- target_cohort: Who it serves
- geography: Location array

Return ONLY the JSON array, no other text. If no interventions found, return [].`;
}

/**
 * Test extraction with a sample
 */
async function testExtraction() {
  console.log('\n🧪 Testing extraction with sample content...\n');

  const sampleContent = `
    The BackTrack Youth Works program in Armidale, NSW provides wraparound support
    for at-risk young people. The program has shown a 50% reduction in police contact
    and 60% school re-engagement. It uses adventure-based learning and mentoring.

    The Maranguka Justice Reinvestment Project in Bourke has achieved 23% reduction
    in criminal charges and 38% reduction in domestic violence incidents through
    Aboriginal community-led justice reinvestment.
  `;

  const prompt = createExtractionPrompt(sampleContent);

  try {
    const { result, provider, cost } = await extractWithFallback(prompt);

    console.log(`\n📋 Extraction Result (via ${provider}):\n`);
    console.log(result.substring(0, 500) + '...');

    // Try to parse JSON
    try {
      const interventions = JSON.parse(result);
      console.log(`\n✅ Successfully extracted ${interventions.length} interventions`);
      interventions.forEach((i, idx) => {
        console.log(`  ${idx + 1}. ${i.name} (${i.type})`);
      });
    } catch {
      console.log('\n⚠️ Could not parse as JSON - may need prompt adjustment');
    }

  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message);
  }
}

/**
 * Cost comparison report
 */
function showCostComparison() {
  console.log('\n💰 COST COMPARISON (per 1M tokens)\n');
  console.log('┌─────────────────────────┬──────────┬─────────┐');
  console.log('│ Provider                │ Cost     │ Quality │');
  console.log('├─────────────────────────┼──────────┼─────────┤');

  const sorted = Object.entries(PROVIDERS).sort((a, b) => a[1].cost - b[1].cost);

  for (const [key, p] of sorted) {
    const costStr = p.cost === 0 ? 'FREE'.padEnd(8) : `$${(p.costPer1K * 1000).toFixed(2)}`.padEnd(8);
    const qualityStr = `${(p.quality * 100).toFixed(0)}%`.padEnd(7);
    const status = p.available ? '✅' : '⚠️';
    console.log(`│ ${status} ${p.name.padEnd(20)} │ ${costStr} │ ${qualityStr} │`);
  }

  console.log('└─────────────────────────┴──────────┴─────────┘');

  console.log('\n📊 Estimated costs for 624 programs refresh:');
  console.log('  • Claude Sonnet: ~$120');
  console.log('  • Claude Haiku:  ~$15');
  console.log('  • Gemini Flash:  ~$0.50');
  console.log('  • Groq/Ollama:   FREE');
}

// Main execution
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     ALMA Cost-Optimized Extraction System                 ║');
  console.log('║     Free/cheap alternatives to Claude Sonnet/Opus         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Check available providers
  await checkProviders();

  // Show cost comparison
  showCostComparison();

  // Test extraction
  await testExtraction();

  console.log('\n✅ System ready for cost-optimized extraction\n');
  console.log('Usage:');
  console.log('  import { extractWithFallback } from "./alma-cost-optimized-extract.mjs"');
  console.log('  const { result, provider, cost } = await extractWithFallback(prompt);\n');
}

// Run if called directly
if (process.argv[1]?.includes('alma-cost-optimized-extract')) {
  main().catch(console.error);
}

export { PROVIDERS, checkProviders, extractWithFallback, createExtractionPrompt };
