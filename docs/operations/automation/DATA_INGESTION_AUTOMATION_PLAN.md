# JusticeHub Data Ingestion & Automation - Complete Implementation Plan

## Executive Summary

JusticeHub has a sophisticated data ingestion architecture but several manual processes and automation gaps. This plan establishes **fully automated data pipelines** for all content types using GitHub Actions, aligns ALMA scraping with the unified profile system, and eliminates manual data entry bottlenecks.

---

## Current State Analysis

### ✅ **Already Automated**
1. **ALMA Interventions Scraping** - Daily at 2am UTC (`.github/workflows/alma-ingestion.yml`)
2. **Media Sentiment Tracking** - Daily at 6am UTC (`.github/workflows/daily-media-sentiment.yml`)
3. **Pattern Detection** - After ALMA ingestion via Python ALMA Agent

### ⚠️ **Partially Automated**
1. **Service Directory Scraping** - Scraper daemon exists but not deployed
2. **Empathy Ledger Sync** - API exists but requires manual trigger
3. **Evidence Research** - Table exists, minimal ingestion

### ❌ **Currently Manual**
1. **Public Profiles** - Empathy Ledger sync requires admin action
2. **Blog Posts & Articles** - Fully manual CMS
3. **Community Programs** - Manual script execution
4. **Government Program Detection** - Manual seeding
5. **Cross-Reference Validation** - No duplicate detection
6. **Health Monitoring** - No source uptime tracking

---

## Data Flow Architecture (Proposed)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                             │
├──────────────┬──────────────┬──────────────┬─────────────────────────┤
│ EMPATHY      │ WEB SCRAPING │ MEDIA        │ RESEARCH                │
│ LEDGER V2    │ (Firecrawl)  │ OUTLETS      │ INSTITUTIONS            │
│              │              │              │                         │
│ • Profiles   │ • Govt Sites │ • Guardian   │ • ARC                   │
│ • Stories    │ • Indigenous │ • ABC News   │ • Universities          │
│ • Projects   │   Orgs       │ • NITV       │ • Griffith              │
└──────────────┴──────────────┴──────────────┴─────────────────────────┘
       │              │              │                │
       │ Sync API     │ Firecrawl   │ Firecrawl     │ Firecrawl
       │ Daily 4am    │ Daily 2am   │ Daily 6am     │ Weekly
       ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   GITHUB ACTIONS ORCHESTRATION                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  sync-empathy-ledger.yml    alma-ingestion.yml                     │
│  ├─ Fetch profiles          ├─ Government sources                  │
│  ├─ Create/update           ├─ Indigenous orgs                     │
│  └─ Link to stories         ├─ Legal sources                       │
│                             ├─ Inquiry reports                      │
│  daily-media-sentiment.yml  └─ Pattern detection                   │
│  ├─ Scrape media                                                   │
│  ├─ Extract sentiment       service-directory-scraping.yml         │
│  ├─ Refresh views           ├─ headspace                           │
│  └─ Generate report         ├─ Legal Aid (all states)              │
│                             ├─ Ask Izzy                             │
│  research-evidence.yml      └─ State directories                   │
│  ├─ Google Scholar                                                  │
│  ├─ ResearchGate            health-monitoring.yml                  │
│  └─ University repos        ├─ Check all sources                   │
│                             ├─ Detect changes                       │
│                             └─ Alert on failures                    │
│                                                                     │
└──────────────┬──────────────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE (Unified Storage)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  public_profiles ← Empathy Ledger (automated sync)                 │
│  alma_interventions ← Web scraping (automated)                     │
│  alma_evidence ← Research scraping (automated)                     │
│  alma_media_articles ← Media scraping (automated)                  │
│  services ← Directory scraping (automated)                         │
│  articles/blog_posts ← Manual CMS (stays manual)                   │
│                                                                     │
│  RELATIONSHIP TABLES (from unification):                            │
│  • article_related_interventions                                   │
│  • article_related_evidence                                        │
│  • story_related_interventions                                     │
│  • alma_intervention_profiles (links people to programs)           │
│                                                                     │
└──────────────┬──────────────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              INTELLIGENCE & ANALYTICS LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ALMA Agent (Python)        Materialized Views                     │
│  • Pattern detection        • alma_daily_sentiment                 │
│  • Portfolio signals        • alma_sentiment_program_correlation   │
│  • Ethics checking                                                  │
│                             Cross-Validation                        │
│  Auto-Linking               • Duplicate detection                  │
│  • Detect relationships     • Contact verification                 │
│  • Link profiles ↔ programs • Geographic validation                │
│  • Link evidence ↔ interventions                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### **Phase 1: Critical Automation (Week 1)**

#### 1.1 Empathy Ledger Daily Sync ⭐ **HIGHEST PRIORITY**

**Why**: Profiles are the foundation of the unified system. Currently manual.

**Implementation**:

Create `.github/workflows/sync-empathy-ledger.yml`:

```yaml
name: Sync Empathy Ledger Profiles

on:
  schedule:
    - cron: '0 4 * * *'  # Daily at 4am UTC
  workflow_dispatch:      # Allow manual trigger

jobs:
  sync-profiles:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Sync Empathy Ledger Profiles
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          EMPATHY_LEDGER_SUPABASE_URL: ${{ secrets.EMPATHY_LEDGER_SUPABASE_URL }}
          EMPATHY_LEDGER_SUPABASE_ANON_KEY: ${{ secrets.EMPATHY_LEDGER_SUPABASE_ANON_KEY }}
        run: |
          node -e "
          const fetch = require('node-fetch');

          (async () => {
            const response = await fetch('${{ secrets.NEXT_PUBLIC_SITE_URL }}/api/admin/sync-empathy-ledger', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}'
              }
            });

            const result = await response.json();
            console.log('Sync complete:', result);

            if (result.failed > 0) {
              console.error('Some profiles failed to sync');
              process.exit(1);
            }
          })();
          "

      - name: Upload sync log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: empathy-ledger-sync-log
          path: empathy-ledger-sync-*.log
          retention-days: 30
```

**Alternative Approach** (Better - Use dedicated script):

Create `scripts/sync-empathy-ledger.mjs`:

```javascript
#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local for local runs, fallback to env vars for CI
let env = {};
try {
  const envFile = readFileSync(join(root, '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...values] = line.split('=');
      env[key.trim()] = values.join('=').trim();
    }
  });
} catch {
  env = process.env; // CI environment
}

const justiceHubSupabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const empathyLedgerSupabase = createClient(
  env.EMPATHY_LEDGER_SUPABASE_URL,
  env.EMPATHY_LEDGER_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n🔄 Syncing Empathy Ledger Profiles...\n');

// Fetch profiles marked for JusticeHub
const { data: profiles, error: fetchError } = await empathyLedgerSupabase
  .from('public_profiles')
  .select('*')
  .eq('justicehub_enabled', true);

if (fetchError) {
  console.error('❌ Error fetching profiles:', fetchError.message);
  process.exit(1);
}

console.log(`📥 Found ${profiles.length} profiles to sync\n`);

let created = 0, updated = 0, failed = 0;

for (const profile of profiles) {
  try {
    // Check if profile exists
    const { data: existing } = await justiceHubSupabase
      .from('public_profiles')
      .select('id')
      .eq('empathy_ledger_profile_id', profile.id)
      .single();

    const profileData = {
      empathy_ledger_profile_id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      role: profile.justicehub_role || 'community_member',
      featured: profile.justicehub_featured || false,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing
      const { error: updateError } = await justiceHubSupabase
        .from('public_profiles')
        .update(profileData)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      console.log(`   ✅ Updated: ${profile.display_name}`);
      updated++;
    } else {
      // Create new
      const { error: insertError } = await justiceHubSupabase
        .from('public_profiles')
        .insert(profileData);

      if (insertError) throw insertError;
      console.log(`   ✅ Created: ${profile.display_name}`);
      created++;
    }

    // Update sync timestamp in Empathy Ledger
    await empathyLedgerSupabase
      .from('public_profiles')
      .update({ justicehub_synced_at: new Date().toISOString() })
      .eq('id', profile.id);

  } catch (error) {
    console.error(`   ❌ Failed: ${profile.display_name} - ${error.message}`);
    failed++;
  }
}

console.log('\n📊 Sync Summary:');
console.log(`   Created: ${created}`);
console.log(`   Updated: ${updated}`);
console.log(`   Failed: ${failed}`);
console.log(`   Total: ${profiles.length}\n`);

if (failed > 0) {
  process.exit(1);
}
```

Then GitHub Action becomes:

```yaml
      - name: Sync Empathy Ledger Profiles
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          EMPATHY_LEDGER_SUPABASE_URL: ${{ secrets.EMPATHY_LEDGER_SUPABASE_URL }}
          EMPATHY_LEDGER_SUPABASE_ANON_KEY: ${{ secrets.EMPATHY_LEDGER_SUPABASE_ANON_KEY }}
        run: node scripts/sync-empathy-ledger.mjs
```

#### 1.2 Service Directory Scraping Automation

**Why**: Currently using scraper daemon (not deployed). Move to GitHub Actions for reliability.

Create `.github/workflows/service-directory-scraping.yml`:

```yaml
name: Service Directory Scraping

on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3am UTC
  workflow_dispatch:
    inputs:
      priority:
        description: 'Priority filter (high/medium/low/all)'
        required: false
        default: 'all'
      batch_size:
        description: 'Batch size'
        required: false
        default: '10'

jobs:
  scrape-services:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Service Scraping
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx tsx src/scripts/scrape-qld-services-batch.ts \
            ${{ github.event.inputs.batch_size || '10' }} \
            ${{ github.event.inputs.priority || 'all' }}

      - name: Upload scraping logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: service-scraping-logs
          path: logs/scraper-*.log
          retention-days: 7
```

#### 1.3 Health Monitoring System

Create `.github/workflows/health-monitoring.yml`:

```yaml
name: Data Source Health Monitoring

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Health Checks
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: node scripts/health-check-sources.mjs

      - name: Upload health report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: health-check-report
          path: health-check-*.json
          retention-days: 30
```

Create `scripts/health-check-sources.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Health Check for All Data Sources
 * Checks accessibility, response time, content changes
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// All sources to monitor
const SOURCES = [
  // ALMA Government Sources
  { url: 'https://www.aihw.gov.au/reports/youth-justice', category: 'government', name: 'AIHW Youth Justice' },
  { url: 'https://www.djag.qld.gov.au/youth-justice', category: 'government', name: 'QLD Youth Justice' },

  // Media Sources
  { url: 'https://www.theguardian.com/australia-news/youth-justice', category: 'media', name: 'Guardian Australia' },
  { url: 'https://www.abc.net.au/news/topic/youth-justice', category: 'media', name: 'ABC News' },

  // Service Directories
  { url: 'https://headspace.org.au/headspace-centres/', category: 'services', name: 'headspace Centres' },
  { url: 'https://www.legalaid.qld.gov.au/Find-legal-information/Community-legal-centres-and-services/Find-legal-services', category: 'services', name: 'Legal Aid QLD' },

  // Add more sources...
];

async function checkSource(source) {
  const startTime = Date.now();

  try {
    const response = await fetch(source.url, {
      method: 'HEAD',
      timeout: 10000,
      headers: { 'User-Agent': 'JusticeHub-HealthCheck/1.0' }
    });

    const responseTime = Date.now() - startTime;
    const status = response.ok ? 'up' : 'down';
    const statusCode = response.status;

    // Get content hash for change detection (if GET supported)
    let contentHash = null;
    if (status === 'up') {
      try {
        const fullResponse = await fetch(source.url, { timeout: 10000 });
        const content = await fullResponse.text();
        contentHash = crypto.createHash('md5').update(content).digest('hex');
      } catch {}
    }

    return {
      ...source,
      status,
      statusCode,
      responseTime,
      contentHash,
      checkedAt: new Date().toISOString(),
      error: null
    };

  } catch (error) {
    return {
      ...source,
      status: 'down',
      statusCode: null,
      responseTime: Date.now() - startTime,
      contentHash: null,
      checkedAt: new Date().toISOString(),
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Running health checks on all data sources...\n');

  const results = await Promise.all(SOURCES.map(checkSource));

  const upCount = results.filter(r => r.status === 'up').length;
  const downCount = results.filter(r => r.status === 'down').length;

  console.log(`📊 Health Check Summary:`);
  console.log(`   ✅ Up: ${upCount}`);
  console.log(`   ❌ Down: ${downCount}`);
  console.log(`   📈 Total: ${results.length}\n`);

  // Log details
  results.forEach(result => {
    const icon = result.status === 'up' ? '✅' : '❌';
    const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
    console.log(`${icon} ${result.name} (${result.category})`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.statusCode || 'ERROR'} | Response Time: ${time}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    console.log('');
  });

  // Send alert if any sources are down
  if (downCount > 0 && process.env.SLACK_WEBHOOK_URL) {
    const downSources = results.filter(r => r.status === 'down');
    const message = {
      text: `⚠️ Data Source Health Alert: ${downCount} source(s) down`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Data Source Health Alert*\n${downCount} source(s) are currently unavailable:`
          }
        },
        ...downSources.map(s => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${s.name}*\n  ${s.url}\n  Error: ${s.error || 'HTTP ' + s.statusCode}`
          }
        }))
      ]
    };

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }

  // Save results to file
  const fs = await import('fs');
  const filename = `health-check-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  process.exit(downCount > 0 ? 1 : 0);
}

main();
```

---

### **Phase 2: Expansion & Enhancement (Week 2-3)**

#### 2.1 Research Evidence Automation

Create `.github/workflows/research-evidence-scraping.yml`:

```yaml
name: Research Evidence Scraping

on:
  schedule:
    - cron: '0 5 * * 0'  # Weekly on Sunday at 5am UTC
  workflow_dispatch:

jobs:
  scrape-research:
    runs-on: ubuntu-latest
    timeout-minutes: 120

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Scrape Research Evidence
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node scripts/scrape-research-evidence.mjs

      - name: Upload evidence report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: research-evidence-report
          path: research-evidence-*.json
          retention-days: 90
```

Create `scripts/scrape-research-evidence.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Research Evidence Scraping
 * Sources: ARC, Griffith Criminology, AIHW research, universities
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const RESEARCH_SOURCES = [
  {
    url: 'https://www.arc.gov.au/grants-and-funding/grant-outcomes',
    search_term: 'youth justice',
    category: 'research_grants'
  },
  {
    url: 'https://www.griffith.edu.au/criminology-institute/research/youth-justice',
    category: 'university_research'
  },
  {
    url: 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice/reports',
    category: 'government_research'
  }
];

// Implementation similar to alma-continuous-ingestion.mjs
// Extract: title, authors, publication_year, methodology, findings, DOI
```

#### 2.2 Auto-Link Profiles to Interventions

Create `scripts/auto-link-profiles-interventions.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Automatically link profiles to interventions based on:
 * - Name mentions in intervention descriptions
 * - Organization affiliations
 * - Source document authorship
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Use Claude to detect relationships between profiles and interventions
// Create entries in alma_intervention_profiles with detected roles
```

Add to `.github/workflows/alma-ingestion.yml`:

```yaml
      - name: Auto-Link Profiles
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node scripts/auto-link-profiles-interventions.mjs
```

#### 2.3 Auto-Detect Government Programs

Enhance `scripts/alma-continuous-ingestion.mjs` to detect program announcements:

```javascript
// In media scraping section, add:
if (article.topics?.includes('Government Announcement') ||
    article.topics?.includes('Policy') ||
    article.stakeholders_mentioned?.some(s => s.includes('Minister'))) {

  // Extract program details
  const programExtraction = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze this media article and extract any youth justice program announcements...`
    }]
  });

  // If program detected, insert into alma_government_programs
  if (programData.program_name) {
    await supabase.from('alma_government_programs').insert({
      program_name: programData.program_name,
      announced_date: article.published_date,
      announcing_body: programData.government_department,
      funding_amount: programData.funding,
      media_article_id: article.id
    });
  }
}
```

---

### **Phase 3: Cross-Validation & Quality (Week 4)**

#### 3.1 Duplicate Detection

Create `scripts/detect-duplicate-services.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Detect and merge duplicate services
 * Match on: similar names, same phone, same address
 */

import { createClient } from '@supabase/supabase-js';
import stringSimilarity from 'string-similarity';

async function detectDuplicates() {
  // Fetch all services
  const { data: services } = await supabase
    .from('services')
    .select('*');

  const duplicates = [];

  for (let i = 0; i < services.length; i++) {
    for (let j = i + 1; j < services.length; j++) {
      const service1 = services[i];
      const service2 = services[j];

      // Name similarity
      const nameSimilarity = stringSimilarity.compareTwoStrings(
        service1.name.toLowerCase(),
        service2.name.toLowerCase()
      );

      // Phone match
      const phoneMatch = service1.phone_number === service2.phone_number;

      // Address similarity
      const addressSimilarity = service1.address && service2.address ?
        stringSimilarity.compareTwoStrings(
          service1.address.toLowerCase(),
          service2.address.toLowerCase()
        ) : 0;

      // Flag as duplicate if high similarity
      if (nameSimilarity > 0.85 || phoneMatch || addressSimilarity > 0.9) {
        duplicates.push({
          service1_id: service1.id,
          service2_id: service2.id,
          name_similarity: nameSimilarity,
          phone_match: phoneMatch,
          address_similarity: addressSimilarity,
          confidence: Math.max(nameSimilarity, phoneMatch ? 1 : 0, addressSimilarity)
        });
      }
    }
  }

  // Insert into duplicate tracking table
  if (duplicates.length > 0) {
    await supabase.from('service_duplicates').insert(duplicates);
  }

  console.log(`Found ${duplicates.length} potential duplicates`);
}
```

#### 3.2 Contact Verification

Create `scripts/verify-service-contacts.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Verify service contact information
 * - Check phone number format (Australian)
 * - Verify website accessibility
 * - Validate email format
 */

async function verifyContacts() {
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .is('contact_verified', false);

  for (const service of services) {
    const verificationResults = {
      phone_valid: validateAustralianPhone(service.phone_number),
      email_valid: validateEmail(service.email),
      website_accessible: await checkWebsiteAccessibility(service.website_url)
    };

    await supabase
      .from('services')
      .update({
        contact_verified: verificationResults.phone_valid && verificationResults.email_valid,
        contact_verification_results: verificationResults,
        contact_verified_at: new Date().toISOString()
      })
      .eq('id', service.id);
  }
}
```

---

## GitHub Actions Schedule Summary

```yaml
# Daily Workflows
04:00 UTC - sync-empathy-ledger.yml        (Profiles from Empathy Ledger)
02:00 UTC - alma-ingestion.yml             (ALMA interventions, all sources)
03:00 UTC - service-directory-scraping.yml (Service directories)
06:00 UTC - daily-media-sentiment.yml      (Media articles + sentiment)

# Regular Intervals
Every 6 hours - health-monitoring.yml      (Source uptime checks)

# Weekly Workflows
Sunday 05:00 UTC - research-evidence-scraping.yml (Academic research)

# Monthly Workflows
1st of month - duplicate-detection.yml     (Find & merge duplicates)
1st of month - contact-verification.yml    (Verify service contacts)
```

---

## Required GitHub Secrets

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# Empathy Ledger
EMPATHY_LEDGER_SUPABASE_URL
EMPATHY_LEDGER_SUPABASE_ANON_KEY

# AI Services
ANTHROPIC_API_KEY          # Claude for extraction
FIRECRAWL_API_KEY          # Web scraping
OPENAI_API_KEY             # Optional: GPT-4 for articles

# Monitoring
SLACK_WEBHOOK_URL          # Alerts for failures
NEXT_PUBLIC_SITE_URL       # For API calls

# Optional
GOOGLE_CUSTOM_SEARCH_API_KEY  # For smart source discovery
SENTRY_DSN                    # Error tracking
```

---

## Success Metrics

After full implementation:

- ✅ **100% Automated Profile Sync** - Daily Empathy Ledger sync
- ✅ **500+ Services** - Up from ~50 with expanded scraping
- ✅ **Daily Media Coverage** - Automated sentiment tracking
- ✅ **Weekly Research Updates** - Academic evidence ingestion
- ✅ **Zero Manual Data Entry** - Except blog content (intentional)
- ✅ **99% Source Uptime** - Health monitoring with alerts
- ✅ **<5% Duplicate Rate** - Auto-detection and merging
- ✅ **Auto-Linked Relationships** - Profiles ↔ Programs ↔ Evidence

---

## Next Steps

### Immediate (This Week):
1. ✅ Create `scripts/sync-empathy-ledger.mjs`
2. ✅ Create `.github/workflows/sync-empathy-ledger.yml`
3. ✅ Create `.github/workflows/service-directory-scraping.yml`
4. ✅ Create `scripts/health-check-sources.mjs`
5. ✅ Create `.github/workflows/health-monitoring.yml`

### Week 2:
6. Create `scripts/scrape-research-evidence.mjs`
7. Create `.github/workflows/research-evidence-scraping.yml`
8. Create `scripts/auto-link-profiles-interventions.mjs`
9. Enhance media scraping with program detection

### Week 3-4:
10. Create `scripts/detect-duplicate-services.mjs`
11. Create `scripts/verify-service-contacts.mjs`
12. Add cross-validation workflows
13. Implement smart source discovery

---

This plan establishes **fully automated data pipelines** for all content types, eliminates manual bottlenecks, and ensures JusticeHub has fresh, validated data flowing from all sources 24/7.
