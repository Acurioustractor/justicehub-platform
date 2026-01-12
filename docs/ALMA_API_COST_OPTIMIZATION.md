# ALMA API Cost Optimization & Alternatives

## The Problem

The first scraping run was expensive because:
1. **Claude API costs**: ~$0.015-0.075 per 1K tokens (Sonnet/Opus)
2. **Firecrawl costs**: $0.01-0.05 per page scraped
3. **Large documents**: Government PDFs can be 100+ pages
4. **Redundant extraction**: Re-processing same content multiple times

---

## Cost-Effective Alternatives

### 1. **Local LLMs (FREE after setup)**

**Ollama** - Run models locally on your Mac

```bash
# Install Ollama
brew install ollama

# Pull efficient models
ollama pull llama3.2        # 3B - Fast, good for extraction
ollama pull mistral         # 7B - Better quality
ollama pull mixtral         # 8x7B - Near-Claude quality
ollama pull qwen2.5:14b     # Great for structured extraction
```

**Integration**:
```javascript
// Replace Anthropic client with Ollama
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama3.2',
    prompt: extractionPrompt,
    stream: false
  })
});
```

**Pros**: Free, private, fast for small models
**Cons**: Lower quality than Claude, needs good hardware

---

### 2. **OpenRouter (Pay-per-use, cheaper models)**

Access multiple models through one API with transparent pricing:

```javascript
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Use cheap but capable models
const response = await openrouter.chat.completions.create({
  model: 'mistralai/mistral-7b-instruct', // ~$0.0002/1K tokens
  // model: 'google/gemini-flash-1.5',    // ~$0.00001/1K tokens (very cheap!)
  // model: 'anthropic/claude-3-haiku',   // ~$0.00025/1K tokens
  messages: [{ role: 'user', content: prompt }]
});
```

**Pricing Comparison** (per 1M tokens):

| Model | Input | Output | Quality |
|-------|-------|--------|---------|
| Claude Opus | $15.00 | $75.00 | Excellent |
| Claude Sonnet | $3.00 | $15.00 | Very Good |
| Claude Haiku | $0.25 | $1.25 | Good |
| Gemini Flash 1.5 | $0.075 | $0.30 | Good |
| Mistral 7B | $0.20 | $0.20 | Decent |
| Llama 3.1 70B | $0.80 | $0.80 | Good |
| Llama 3.2 3B | $0.06 | $0.06 | Basic |

**Best Value**: Gemini Flash 1.5 (100x cheaper than Sonnet!)

---

### 3. **Google Gemini API (Generous free tier)**

```bash
# Free tier: 60 requests/minute, 1M tokens/day
```

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const result = await model.generateContent(extractionPrompt);
```

**Pros**: Very generous free tier, fast, good quality
**Cons**: Rate limits, may have content restrictions

---

### 4. **Groq (FREE, extremely fast)**

```javascript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const response = await groq.chat.completions.create({
  model: 'llama-3.1-70b-versatile', // FREE!
  messages: [{ role: 'user', content: prompt }],
});
```

**Free Tier Limits**:
- 6,000 tokens/minute
- 100,000 tokens/day
- Llama 3.1 70B and Mixtral available

**Pros**: Free, extremely fast (500+ tokens/sec)
**Cons**: Rate limits, queuing during peak

---

### 5. **Together AI (Cheap, fast)**

```javascript
import Together from 'together-ai';

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const response = await together.chat.completions.create({
  model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
  messages: [{ role: 'user', content: prompt }],
});
```

**Pricing**: ~$0.18/M tokens for Llama 3.1 70B

---

## Scraping Alternatives (Replace Firecrawl)

### 1. **Playwright (FREE)**

```javascript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url);
await page.waitForSelector('.content');
const html = await page.content();
await browser.close();
```

**Pros**: Free, handles JavaScript, full control
**Cons**: Need to manage browser instances

### 2. **Puppeteer (FREE)**

```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle2' });
const content = await page.evaluate(() => document.body.innerText);
```

### 3. **Cheerio + Fetch (FREE, fast)**

For non-JavaScript sites:

```javascript
import * as cheerio from 'cheerio';

const html = await fetch(url).then(r => r.text());
const $ = cheerio.load(html);
const content = $('article').text();
```

### 4. **Crawlee (FREE, production-ready)**

```javascript
import { PlaywrightCrawler } from 'crawlee';

const crawler = new PlaywrightCrawler({
  async requestHandler({ page, request }) {
    const content = await page.textContent('body');
    // Process content...
  },
});

await crawler.run(['https://...']);
```

---

## Recommended Cost-Optimized Architecture

### Tier 1: Free Operations (90% of work)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Playwright │────▶│   Cheerio   │────▶│   Ollama    │
│  (scraping) │     │  (parsing)  │     │  (extract)  │
└─────────────┘     └─────────────┘     └─────────────┘
      FREE              FREE              FREE
```

### Tier 2: Cheap API (Complex documents)

```
┌─────────────┐     ┌─────────────┐
│   Gemini    │────▶│    Groq     │
│   Flash     │     │  (backup)   │
└─────────────┘     └─────────────┘
   $0.075/M           FREE
```

### Tier 3: Quality API (Final validation)

```
┌─────────────┐
│   Claude    │
│   Haiku     │
└─────────────┘
   $0.25/M
```

---

## Implementation: Multi-Provider Extraction

```javascript
// scripts/alma-cost-optimized-extract.mjs

const PROVIDERS = {
  ollama: {
    cost: 0,
    quality: 0.7,
    speed: 'fast',
    async extract(prompt) {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({ model: 'llama3.2', prompt, stream: false })
      });
      return (await res.json()).response;
    }
  },

  groq: {
    cost: 0,
    quality: 0.85,
    speed: 'very-fast',
    async extract(prompt) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const res = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }]
      });
      return res.choices[0].message.content;
    }
  },

  gemini: {
    cost: 0.000075, // per 1K tokens
    quality: 0.85,
    speed: 'fast',
    async extract(prompt) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  },

  claude_haiku: {
    cost: 0.00025, // per 1K tokens
    quality: 0.9,
    speed: 'medium',
    async extract(prompt) {
      const res = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });
      return res.content[0].text;
    }
  }
};

async function extractWithFallback(prompt, requiredQuality = 0.7) {
  // Try providers in order of cost (cheapest first)
  const orderedProviders = Object.entries(PROVIDERS)
    .filter(([_, p]) => p.quality >= requiredQuality)
    .sort((a, b) => a[1].cost - b[1].cost);

  for (const [name, provider] of orderedProviders) {
    try {
      console.log(`Trying ${name}...`);
      const result = await provider.extract(prompt);
      if (result && result.length > 100) {
        console.log(`✅ Success with ${name} (cost: $${provider.cost}/1K)`);
        return { result, provider: name, cost: provider.cost };
      }
    } catch (error) {
      console.log(`⚠️ ${name} failed: ${error.message}`);
    }
  }

  throw new Error('All providers failed');
}
```

---

## Cost Comparison: Old vs Optimized

### Old Approach (Expensive)
```
624 programs × ~5 API calls each × ~2K tokens = 6.2M tokens
Claude Sonnet: 6.2M × $0.003 = $18.60 input
                6.2M × $0.015 = $93.00 output
Firecrawl: 500 pages × $0.02 = $10.00
─────────────────────────────────────────
TOTAL: ~$120+ per full database refresh
```

### Optimized Approach
```
Playwright/Cheerio (scraping): $0
Ollama local (80% of extractions): $0
Groq free tier (15% of extractions): $0
Gemini Flash (5% complex docs): ~$0.50
─────────────────────────────────────────
TOTAL: ~$0.50 per full database refresh (99.6% savings!)
```

---

## Quick Setup Commands

### 1. Install Ollama
```bash
brew install ollama
ollama serve &
ollama pull llama3.2
ollama pull qwen2.5:7b
```

### 2. Get Free API Keys
```bash
# Groq (free)
# https://console.groq.com/keys

# Google Gemini (free tier)
# https://makersuite.google.com/app/apikey

# OpenRouter (pay-per-use)
# https://openrouter.ai/keys
```

### 3. Add to .env.local
```bash
# Free/cheap alternatives
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AI...
OPENROUTER_API_KEY=sk-or-...
TOGETHER_API_KEY=...

# Local
OLLAMA_HOST=http://localhost:11434
```

---

## Recommended Strategy

### For ALMA Continuous Ingestion:

1. **Daily Scraping**: Playwright (free)
2. **Simple Extraction**: Ollama llama3.2 (free, local)
3. **Complex Documents**: Groq Llama 70B (free tier)
4. **PDFs & Tables**: Gemini Flash (cheap, good at structured data)
5. **Quality Validation**: Claude Haiku (only for final 5%)

### Estimated Monthly Cost:
- **Before optimization**: $100-500/month
- **After optimization**: $5-20/month (90-95% reduction)

---

## Next Steps

1. [ ] Install Ollama and pull models
2. [ ] Get Groq and Gemini API keys (free)
3. [ ] Create `alma-cost-optimized-extract.mjs` with fallback logic
4. [ ] Update existing scripts to use multi-provider approach
5. [ ] Test quality of cheaper models on sample documents
6. [ ] Set up rate limiting to stay within free tiers

---

**Bottom Line**: You can run ALMA continuously for nearly free by using:
- **Ollama** (local) for 80% of extractions
- **Groq** (free) for complex documents
- **Gemini Flash** (cheap) for PDFs and tables
- **Claude Haiku** (only when quality is critical)

This reduces costs from ~$120/refresh to ~$0.50/refresh (99.6% savings).
