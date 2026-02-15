# ALMA Quick Start - Continuous Ingestion

**Get JusticeHub Auto-Populating in 5 Minutes**

---

## ✨ What This Does

Automatically scans the internet for:
- 📋 Youth justice programs (government + community-led)
- 📊 Research and evidence
- 📰 Media coverage and court results
- 🏛️ Policy changes
- 🌏 Indigenous-led initiatives

Then uses **ALMAAgent** to:
- ✅ Check ethics (blocks individual profiling, community ranking)
- 🔍 Detect patterns (cross-domain opportunities, slow drift, failure modes)
- 📈 Calculate portfolio signals (community authority has highest weight: 30%)
- 🗣️ Translate (community language ↔ funder language)

---

## 🚀 Quick Start (3 Commands)

### 1. Test Single Source (1 minute)
```bash
# Scrape ABC News youth justice coverage
node scripts/alma-continuous-ingestion.mjs media
```

**What happens:**
- Firecrawl scrapes ABC News
- Claude extracts interventions
- ALMAAgent checks ethics
- Supabase stores approved data
- Pattern detection runs

**Expected output:**
```
📥 Ingesting from: ABC News - Youth Justice
   🔥 Using Firecrawl to scrape...
   ✅ Scraped 15,240 characters
   🤖 Using Claude to extract interventions...
   📊 Extracted:
      - 3 interventions
      - 1 evidence records
      - 2 outcomes
   ✅ Inserted 3 interventions

🔍 PATTERN DETECTION (After Ingestion)
   • Cross-Domain Opportunity: Justice + Storytelling
```

### 2. Run Indigenous Sources (2 minutes)
```bash
# Scrape NATSILS, SNAICC, QATSICPP (Community Controlled)
node scripts/alma-continuous-ingestion.mjs indigenous
```

**What happens:**
- Scrapes 3 Indigenous organizations
- Marks as "Community Controlled" (requires cultural authority)
- Sets `cultural_authority: true`
- Interventions go to "Under Review" status (need human approval)

### 3. Set Up Automation (1 minute)
```bash
# Enable GitHub Actions (daily auto-run)
# File already created: .github/workflows/alma-ingestion.yml

# OR set up cron job for local server
crontab -e

# Add this line (runs daily at 2am):
0 2 * * * cd /Users/benknight/Code/JusticeHub && node scripts/alma-scheduler.mjs auto
```

---

## 📅 Automatic Schedule

Once enabled, ALMA runs:

| Frequency | Sources | What Gets Ingested |
|-----------|---------|-------------------|
| **Daily** | Media | Guardian, ABC news coverage |
| **Weekly** | Indigenous + Legal | NATSILS, SNAICC, QATSICPP, AustLII |
| **Monthly** | Government + Research | AIHW, state departments, universities |
| **Quarterly** | All | Comprehensive scan (120+ sources) |

---

## 🎯 Commands Reference

### Ingestion
```bash
# Single category
node scripts/alma-continuous-ingestion.mjs government
node scripts/alma-continuous-ingestion.mjs indigenous
node scripts/alma-continuous-ingestion.mjs research
node scripts/alma-continuous-ingestion.mjs media
node scripts/alma-continuous-ingestion.mjs legal

# All sources
node scripts/alma-continuous-ingestion.mjs all
```

### Scheduling
```bash
# Auto-detect (for cron)
node scripts/alma-scheduler.mjs auto

# Force specific schedule
node scripts/alma-scheduler.mjs daily
node scripts/alma-scheduler.mjs weekly
node scripts/alma-scheduler.mjs monthly
node scripts/alma-scheduler.mjs quarterly
```

### Analysis
```bash
# Detect patterns
node scripts/alma-agent-bridge.mjs patterns

# Track signals
node scripts/alma-agent-bridge.mjs signals

# Check ethics
node scripts/alma-agent-bridge.mjs ethics

# Translate language
node scripts/alma-agent-bridge.mjs translate

# Full intelligence report
node scripts/alma-agent-bridge.mjs all
```

---

## 📊 Check Results

### Database Query
```bash
# Check what was ingested
node scripts/check-alma-data.mjs
```

**Output:**
```
🔍 Checking ALMA Database...

✓ alma_interventions: 124 records
✓ alma_evidence: 9 records
✓ alma_outcomes: 10 records
✓ alma_community_contexts: 10 records

📋 Sample interventions:
  - Youth Conferencing Program (Diversion)
  - Cultural Connection Program (Cultural Connection)
  - Family Strengthening Initiative (Family Strengthening)
```

### PostgreSQL Direct
```sql
-- Recent interventions
SELECT name, type, jurisdiction, consent_level, review_status
FROM alma_interventions
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Community Controlled programs
SELECT name, cultural_authority, source_name
FROM alma_interventions
WHERE consent_level = 'Community Controlled';

-- Ingestion jobs status
SELECT source_name, status, interventions_found, interventions_inserted, started_at
FROM alma_ingestion_jobs
ORDER BY started_at DESC
LIMIT 10;
```

---

## 🔒 Ethics & Consent

### Automatic Ethics Checks

**Before ingestion**, ALMAAgent blocks:
- ❌ Individual profiling ("Predict which youth will reoffend")
- ❌ Community ranking ("Rank organizations by effectiveness")
- ❌ Knowledge extraction without consent
- ❌ Optimization of people

**Allows:**
- ✅ System-level pattern detection
- ✅ Public knowledge aggregation
- ✅ Community-controlled knowledge (with permission)

### Consent Levels

| Level | What It Means | Who Can Access |
|-------|---------------|----------------|
| **Public Knowledge Commons** | Government reports, published research | Anyone |
| **Community Controlled** | Indigenous org content, requires permission | Approved users only |
| **Strictly Private** | Individual stories, sacred knowledge | NEVER ingested |

---

## 💰 Cost

**Per run (all sources):**
- Firecrawl: $0.50 (20 pages)
- Claude: $0.30 (extraction)
- **Total: ~$0.80**

**Monthly (auto schedule):**
- Daily media: $3.00
- Weekly indigenous/legal: $0.80
- Monthly gov/research: $0.25
- **Total: ~$4/month**

**Annual: ~$52/year** (sustainable!)

---

## 🎨 What You Get

### Interventions Auto-Populated
- 120+ programs across 8 states
- Government + community-led
- Indigenous-controlled marked
- Review status workflow

### Evidence Library
- Research citations
- Key findings
- Evidence levels
- Source attribution

### Outcomes Tracked
- Reduced recidivism
- Family reunification
- Cultural connection
- Employment outcomes

### Pattern Detection
- Cross-domain opportunities
- Slow drift warnings
- Familiar failure modes
- Early inflection points
- Policy tensions

---

## 🚨 Troubleshooting

### "Firecrawl API key not found"
```bash
# Add to .env.local
echo "FIRECRAWL_API_KEY=your_key" >> .env.local
```

### "Claude did not return valid JSON"
- Check Claude API quota
- Review extraction prompt
- Check source content quality

### "No interventions found"
- Verify source URL accessible
- Check source still has youth justice content
- Review Claude extraction logic

### "Ethics check failed"
- Review intervention description
- Ensure not profiling individuals
- Check consent level appropriate

---

## 📚 Full Documentation

- [Continuous Ingestion Guide](docs/ALMA_CONTINUOUS_INGESTION_GUIDE.md) - Complete reference
- [ALMA Method Charter](docs/alma/ALMA_METHOD_CHARTER.md) - Philosophy
- [ALMA Quick Reference](docs/alma/ALMA_QUICK_REFERENCE.md) - Signal families
- [ACT Farmhand README](../act-global-infrastructure/act-personal-ai/README.md) - ALMAAgent docs

---

## ✅ Next Steps

1. **Run test ingestion**: `node scripts/alma-continuous-ingestion.mjs media`
2. **Check results**: `node scripts/check-alma-data.mjs`
3. **Detect patterns**: `node scripts/alma-agent-bridge.mjs patterns`
4. **Review interventions**: JusticeHub admin → ALMA → Review queue
5. **Enable automation**: GitHub Actions or cron
6. **Monitor weekly**: Check logs, review new interventions, approve/reject

---

**Remember**: ALMA = Memory + Pattern Recognition + Translation

It watches **systems, not individuals**. It surfaces **patterns for humans to decide**, never decides for them. **Community sovereignty is paramount.**

🌾 **Built with justice-as-a-lens, community sovereignty first**

---

**Version**: 1.0
**Status**: Production Ready
**Last Updated**: January 2026
