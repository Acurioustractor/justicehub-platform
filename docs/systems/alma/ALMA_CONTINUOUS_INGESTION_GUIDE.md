# ALMA Continuous Ingestion Guide

**Automated Internet Scanning for Youth Justice Intelligence**

---

## Overview

The ALMA Continuous Ingestion system automatically scans the internet for youth justice programs, research, court results, media coverage, and community initiatives across Australia. It uses ALMAAgent to detect patterns, enforce ethics, and build out the JusticeHub intelligence layer.

## What Gets Ingested

### Data Sources (by Category)

**Government Sources** (Monthly)
- Australian Institute of Health and Welfare (AIHW)
- Queensland Youth Justice Department
- NSW Department of Communities and Justice
- Victorian Youth Justice
- Northern Territory Youth Justice

**Indigenous Organizations** (Weekly) - Community Controlled
- NATSILS (National Aboriginal and Torres Strait Islander Legal Services)
- SNAICC (Secretariat of National Aboriginal and Islander Child Care)
- QATSICPP (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)

**Research Institutions** (Monthly)
- Australian Research Council (ARC)
- Griffith Criminology Institute
- Melbourne Law School

**Media Sources** (Daily)
- The Guardian Australia - Youth Justice
- ABC News - Youth Justice

**Legal Databases** (Weekly)
- Australasian Legal Information Institute (AustLII)

## How It Works

### 1. Web Scraping (Firecrawl)
```
Internet Source → Firecrawl API → Markdown Content
```

### 2. AI Extraction (Claude)
```
Markdown Content → Claude 3.5 Sonnet → Structured Data
```
Extracts:
- Interventions (programs)
- Evidence (research findings)
- Outcomes (measured results)

### 3. Database Storage (Supabase)
```
Structured Data → Supabase PostgreSQL → ALMA Tables
```
Tables populated:
- `alma_interventions`
- `alma_evidence`
- `alma_outcomes`
- `alma_community_contexts`

### 4. Pattern Detection (ALMAAgent)
```
New Data → Python ALMAAgent → Patterns Detected
```
Detects:
- Cross-domain opportunities
- Slow drift (authority erosion)
- Familiar failure modes
- Early inflection points

### 5. Ethics Checking
```
Before Storage → ALMAAgent Ethics Check → Approved/Blocked
```
Enforces:
- No individual profiling
- No community ranking
- Community sovereignty
- Consent requirements

## Installation

### Prerequisites

1. **Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FIRECRAWL_API_KEY=your_firecrawl_key
ANTHROPIC_API_KEY=your_claude_key
```

2. **Python Environment** (ACT Farmhand):
```bash
cd /Users/benknight/act-global-infrastructure/act-personal-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Node.js Dependencies**:
```bash
cd /Users/benknight/Code/JusticeHub
npm install
```

## Usage

### Manual Ingestion

**Run specific category:**
```bash
# Government sources
node scripts/alma-continuous-ingestion.mjs government

# Indigenous organizations (Community Controlled)
node scripts/alma-continuous-ingestion.mjs indigenous

# Research institutions
node scripts/alma-continuous-ingestion.mjs research

# Media sources
node scripts/alma-continuous-ingestion.mjs media

# Legal databases
node scripts/alma-continuous-ingestion.mjs legal

# All sources
node scripts/alma-continuous-ingestion.mjs all
```

### Automated Scheduling

**Using scheduler:**
```bash
# Auto-detect based on date (daily/weekly/monthly/quarterly)
node scripts/alma-scheduler.mjs auto

# Force specific schedule
node scripts/alma-scheduler.mjs daily
node scripts/alma-scheduler.mjs weekly
node scripts/alma-scheduler.mjs monthly
node scripts/alma-scheduler.mjs quarterly
```

**Using cron (recommended for production):**
```bash
# Edit crontab
crontab -e

# Add daily run at 2am
0 2 * * * cd /path/to/JusticeHub && node scripts/alma-scheduler.mjs auto >> /path/to/logs/alma.log 2>&1
```

### GitHub Actions (Automated)

The system runs automatically via GitHub Actions:

**Schedule:**
- Daily at 2am UTC (media sources)
- Weekly on Sundays (Indigenous orgs, legal databases)
- Monthly on 1st (government sources, research)
- Quarterly (comprehensive scan)

**Manual trigger:**
1. Go to GitHub Actions tab
2. Select "ALMA Continuous Ingestion"
3. Click "Run workflow"
4. Choose mode (auto/daily/weekly/etc)
5. Click "Run workflow"

**View results:**
- Check Actions tab for run status
- Download artifacts (logs, reports)
- Review ingestion summary

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERNET SOURCES                         │
│  Government | Indigenous Orgs | Research | Media | Legal    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Firecrawl API │  ← Web scraping
              └────────┬───────┘
                       │
                       ▼ (Markdown)
              ┌────────────────┐
              │  Claude API    │  ← AI extraction
              │  (Sonnet 3.5)  │
              └────────┬───────┘
                       │
                       ▼ (JSON)
              ┌────────────────┐
              │  ALMAAgent     │  ← Ethics check
              │  (Python)      │  ← Pattern detection
              └────────┬───────┘
                       │
                       ▼ (Approved)
              ┌────────────────┐
              │  Supabase DB   │  ← Storage
              │  (PostgreSQL)  │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │  JusticeHub    │  ← User interface
              │  (Next.js)     │
              └────────────────┘
```

## Consent & Ethics

### Consent Levels

**Public Knowledge Commons:**
- Government reports
- Published research
- Public news articles
- Court decisions
- Anyone can access

**Community Controlled:**
- Indigenous organization content
- Requires cultural authority
- Explicit permission needed
- Can be revoked

**Strictly Private:**
- Never ingested
- Individual stories
- Personal data
- Sacred knowledge

### Ethics Enforcement

**Before ingestion**, ALMAAgent checks:
- ❌ BLOCKS: Individual profiling attempts
- ❌ BLOCKS: Community ranking/scoring
- ❌ BLOCKS: Knowledge extraction without consent
- ✅ ALLOWS: System-level pattern detection
- ✅ ALLOWS: Public knowledge aggregation

**Example:**
```javascript
// BLOCKED
check_ethics("Predict which individual youth will reoffend")
// → ❌ Violates no_individual_profiling

// ALLOWED
check_ethics("Track system-level recidivism patterns")
// → ✅ Watches systems, not individuals
```

## Monitoring & Maintenance

### Check Ingestion Status

```bash
# View recent jobs
node scripts/check-alma-data.mjs

# View specific job details
psql -h $SUPABASE_HOST -U postgres -d postgres \
  -c "SELECT * FROM alma_ingestion_jobs ORDER BY started_at DESC LIMIT 10;"
```

### View Logs

```bash
# Tail live log (if running locally)
tail -f alma-ingestion.log

# View GitHub Actions logs
# Go to: github.com/your-org/JusticeHub/actions
```

### Troubleshoot Issues

**No interventions found:**
- Check Firecrawl API key is valid
- Check source URL is accessible
- Check Claude API key has quota
- Review extraction prompt

**Ethics violations:**
- Review ALMAAgent sacred boundaries
- Check consent_level is correct
- Verify cultural_authority is set

**Job failures:**
- Check ingestion_jobs table for error_message
- Review logs for stack traces
- Verify all API keys are valid

## Output & Results

### Database Tables Populated

**alma_interventions:**
```sql
SELECT name, type, jurisdiction, consent_level, review_status
FROM alma_interventions
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

**alma_evidence:**
```sql
SELECT title, source_type, evidence_level
FROM alma_evidence
WHERE created_at > NOW() - INTERVAL '7 days';
```

**alma_outcomes:**
```sql
SELECT outcome_type, measurement_method
FROM alma_outcomes
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Pattern Detection Reports

After ingestion, ALMAAgent generates reports:

**Patterns Detected:**
- Cross-domain opportunities
- Slow drift warnings
- Familiar failure modes
- Policy tensions
- Knowledge extraction attempts (⚠️ CRITICAL)

**Accessible via:**
```bash
node scripts/alma-agent-bridge.mjs patterns
node scripts/alma-agent-bridge.mjs all > report.txt
```

## Advanced Configuration

### Add New Data Sources

Edit `scripts/alma-continuous-ingestion.mjs`:

```javascript
const DATA_SOURCES = {
  government: [
    // ... existing sources
    {
      name: 'Your New Source',
      url: 'https://example.com',
      type: 'program', // or 'research', 'advocacy', 'media', 'legal'
      update_frequency: 'monthly', // 'daily', 'weekly', 'monthly', 'quarterly'
      consent_level: 'Public Knowledge Commons', // or 'Community Controlled'
      cultural_authority: false, // true for Indigenous sources
    },
  ],
};
```

### Customize Extraction Prompts

Edit Claude prompt in `useJusticeHubIngestion()`:

```javascript
const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
  body: JSON.stringify({
    messages: [{
      role: 'user',
      content: `Your custom extraction prompt here...`
    }],
  }),
});
```

### Adjust Schedules

Edit `scripts/alma-scheduler.mjs`:

```javascript
const SCHEDULE = {
  daily: {
    categories: ['media'], // Add more categories
    description: 'Daily media monitoring',
  },
  // ... modify as needed
};
```

## Cost Estimation

**Per ingestion run (all sources):**
- Firecrawl: ~$0.50 (20 pages × $0.025/page)
- Claude: ~$0.30 (20 requests × 50K tokens × $0.015/1K)
- **Total: ~$0.80 per run**

**Monthly cost (auto schedule):**
- Daily (media): 30 runs × $0.10 = $3.00
- Weekly (indigenous, legal): 4 runs × $0.20 = $0.80
- Monthly (government, research): 1 run × $0.25 = $0.25
- **Total: ~$4.05/month**

**Quarterly comprehensive:**
- Add $0.80 per quarter
- **Annual total: ~$51.80/year**

**Sustainable at scale!**

## Best Practices

1. **Start small**: Test with one category before running all
2. **Monitor costs**: Check Firecrawl and Claude usage
3. **Review ethics**: Ensure sacred boundaries are respected
4. **Validate data**: Human review interventions marked "Under Review"
5. **Track patterns**: Use ALMAAgent reports for insights
6. **Respect consent**: Honor Community Controlled permissions
7. **Update sources**: Add new data sources as discovered
8. **Log everything**: Keep detailed logs for debugging

## Troubleshooting

### Common Issues

**Issue: "Firecrawl API key not found"**
```bash
# Solution: Add to .env.local
echo "FIRECRAWL_API_KEY=your_key" >> .env.local
```

**Issue: "Claude did not return valid JSON"**
```bash
# Solution: Check Claude's response format
# Add error handling to parse partial JSON
```

**Issue: "Ethics check failed"**
```bash
# Solution: Review ALMAAgent sacred boundaries
# Ensure intervention description doesn't profile individuals
```

**Issue: "Duplicate interventions"**
```bash
# Solution: Check intervention name uniqueness
# Add deduplication logic based on name + jurisdiction
```

## Next Steps

1. **Run first ingestion**: `node scripts/alma-continuous-ingestion.mjs media`
2. **Check results**: `node scripts/check-alma-data.mjs`
3. **Detect patterns**: `node scripts/alma-agent-bridge.mjs patterns`
4. **Review interventions**: Login to JusticeHub admin, approve/reject
5. **Set up automation**: Enable GitHub Actions or configure cron
6. **Monitor regularly**: Check logs, review patterns, adjust sources

## Support

For issues or questions:
1. Check this guide first
2. Review logs (`alma-ingestion.log`)
3. Check GitHub Actions artifacts
4. Review ALMA Method Charter for philosophy
5. Contact ACT team

---

**Remember**: ALMA watches systems, not individuals. It surfaces patterns for human decision-makers, never decides for them. Community sovereignty is paramount.

**Version**: 1.0
**Last Updated**: January 2026
**Status**: Production Ready
