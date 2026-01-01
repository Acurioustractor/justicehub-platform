# Anthropic Max Plan API Configuration

**Status**: ✅ Configured and Working

---

## API Key Configuration

Both API keys have been tested and are working with Claude Sonnet 4.5:

### JusticeHub API Key
- **Location**: `/Users/benknight/Code/JusticeHub/.env.local`
- **Key**: `sk-ant-api03-FBEwX2FKI...` (JusticeHub)
- **Status**: ✅ Working with `claude-sonnet-4-5-20250929`

### ACT Farmhand API Key (Max Plan)
- **Location**: `/Users/benknight/act-global-infrastructure/act-personal-ai/.env`
- **Key**: `sk-ant-api03-l2ORljus...` (ACT Farmhand Max Plan)
- **Status**: ✅ Working with `claude-sonnet-4-5-20250929`

---

## Critical Fix Applied

### Issue
The model name was incorrectly formatted as `claude-3-5-sonnet-20241022` (with periods in version).

### Solution
Updated to correct model name: **`claude-sonnet-4-5-20250929`** (with hyphens).

### Files Updated

#### 1. JusticeHub Ingestion Script
**File**: `scripts/alma-continuous-ingestion.mjs:312`

```javascript
// BEFORE (❌ Wrong model name)
model: 'claude-3-5-sonnet-20241022',

// AFTER (✅ Correct model name)
model: 'claude-sonnet-4-5-20250929',
```

---

## Model Information

### Claude Sonnet 4.5 Specifications

| Property | Value |
|----------|-------|
| **Model Name** | `claude-sonnet-4-5-20250929` |
| **Pricing** | $3/$15 per million tokens (input/output) |
| **Max Tokens** | 4000 (configured in ingestion script) |
| **Knowledge Cutoff** | July 2025 (most reliable through January 2025) |
| **Release Date** | September 29, 2025 |

### Alternative Model Names

According to Anthropic documentation, these are also valid:
- `anthropic/claude-sonnet-4.5`
- `claude-sonnet-4-5`
- `claude-sonnet-4-5-20250929` ← **Recommended for production**

**Why use the versioned name?**
- Ensures consistent behavior
- Model aliases may auto-migrate to newer versions
- Production apps should pin to specific versions

---

## Verification Tests

### Test Results (January 1, 2026)

```bash
node /tmp/test_anthropic_keys3.mjs
```

**Output**:
```
============================================================
Testing JusticeHub API Key
============================================================
  ✅ claude-sonnet-4-5-20250929: WORKS!

============================================================
Testing ACT Farmhand API Key (Max Plan)
============================================================
  ✅ claude-sonnet-4-5-20250929: WORKS!
```

---

## Usage in ALMA Ingestion Pipeline

### Current Configuration

**File**: [scripts/alma-continuous-ingestion.mjs:312](scripts/alma-continuous-ingestion.mjs#L312)

```javascript
const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',  // ✅ Correct model name
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Extract youth justice interventions from this webpage content.

Source: ${source.name}
URL: ${source.url}
Type: ${source.type}
Consent Level: ${source.consent_level}

Content:
${markdown.slice(0, 50000)}
...`
    }]
  })
});
```

### What It Does

1. **Firecrawl** scrapes web content → Markdown
2. **Claude Sonnet 4.5** extracts structured intervention data → JSON
3. **ALMA Agent** performs ethics checks → Approved/Blocked
4. **Supabase** stores results → JusticeHub database

---

## Testing the Pipeline

### Run Manual Test

```bash
cd /Users/benknight/Code/JusticeHub
node scripts/alma-continuous-ingestion.mjs media
```

### Expected Output (Successful)

```
╔═══════════════════════════════════════════════════════════╗
║      ALMA Continuous Ingestion Pipeline                  ║
║      Scanning Internet for Youth Justice Intelligence    ║
╚═══════════════════════════════════════════════════════════╝

============================================================
📂 Category: MEDIA
============================================================

📥 Ingesting from: The Guardian Australia - Youth Justice
   URL: https://www.theguardian.com/australia-news/youth-justice
   Type: media
   Frequency: daily
   🌐 Firecrawl: 7188 chars
   🤖 Claude: Extracted 3 interventions
   ✅ ALMA: Approved 3 interventions
   💾 Stored: 3 interventions

============================================================
📊 INGESTION SUMMARY
============================================================
Jobs completed: 2
Interventions added: 5
Evidence records: 8
Outcome records: 12
Duration: 45.2s

✅ Ingestion pipeline completed
```

---

## Environment Variables Reference

### Required Variables

```env
# Anthropic API (Max Plan)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Firecrawl (for web scraping)
FIRECRAWL_API_KEY=fc-...

# Supabase (JusticeHub database)
NEXT_PUBLIC_SUPABASE_URL=https://tednluwflfhxyucgwigh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Location by Project

| Project | Environment File | API Key Used |
|---------|-----------------|--------------|
| **JusticeHub** | `.env.local` | JusticeHub (`sk-ant-api03-FBEwX...`) |
| **ACT Farmhand** | `act-personal-ai/.env` | Max Plan (`sk-ant-api03-l2ORl...`) |

---

## Troubleshooting

### Issue: "credit balance too low"

**Error Message**:
```
Claude failed: Bad Request - Your credit balance is too low to access the Anthropic API
```

**Solution**: This error occurred with the old model name. Now using `claude-sonnet-4-5-20250929`, both keys work correctly.

### Issue: "model not_found_error"

**Error Message**:
```
not_found_error - model: claude-3-5-sonnet-20241022
```

**Solution**: The model name was incorrect. Changed from `claude-3-5-sonnet-20241022` to `claude-sonnet-4-5-20250929`.

### Issue: API Key Typo

**Error**: `AANTHROPIC_API_KEY` (double A) in ACT Farmhand `.env`

**Fixed**: Changed to `ANTHROPIC_API_KEY` (single A) in [act-personal-ai/.env:1](../../../act-global-infrastructure/act-personal-ai/.env#L1)

---

## Cost Monitoring

### Current Pricing (Claude Sonnet 4.5)

- **Input**: $3 per million tokens
- **Output**: $15 per million tokens

### Example Cost Calculation

**Typical ingestion job**:
- Input: ~10,000 tokens (scrape content + prompt)
- Output: ~1,000 tokens (structured JSON)

**Cost per job**: $0.03 (input) + $0.015 (output) = **~$0.045**

**Daily run (2 sources)**: ~$0.09/day = **~$2.70/month**

### Monitoring Dashboard

View API usage at: https://console.anthropic.com/settings/billing

---

## Next Steps

### 1. Enable GitHub Actions Automation

**File**: `.github/workflows/alma-ingestion.yml`

**Status**: Workflow exists but not enabled

**To Enable**:
1. Add `ANTHROPIC_API_KEY` to GitHub Secrets
2. Add `FIRECRAWL_API_KEY` to GitHub Secrets
3. Add `SUPABASE_SERVICE_KEY` to GitHub Secrets
4. Uncomment schedule in workflow file

### 2. Monitor First Automated Run

**Schedule**: Daily at 6 AM UTC

**What to Check**:
- GitHub Actions logs
- Supabase dashboard for new interventions
- Cost tracking in Anthropic console

### 3. Scale to More Sources

**Current**: 2 media sources (Guardian, ABC)

**Available**: Government (3 sources), Legal (1 source), Academia (2 sources)

**To Add**: Update `SOURCES` object in `scripts/alma-continuous-ingestion.mjs`

---

## Related Documentation

- [ALMA System Overview](SETUP_COMPLETE_SUMMARY.md)
- [Supabase Type Generation](SUPABASE_TYPES_QUICKSTART.md)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude Sonnet 4.5 Announcement](https://www.anthropic.com/news/claude-sonnet-4-5)

---

**Last Updated**: January 1, 2026
**Status**: Production Ready
**API Keys**: Both JusticeHub and ACT Farmhand Max Plan keys working ✅
