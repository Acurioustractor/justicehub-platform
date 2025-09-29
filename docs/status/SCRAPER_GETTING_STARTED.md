# 🚀 JusticeHub AI Scraper - Getting Started Guide

## 📋 Prerequisites

Before running the AI scraper, ensure you have:

1. ✅ Real API keys for:
   - OpenAI
   - Anthropic
   - Firecrawl

2. ✅ All database tables created
3. ✅ Development server running
4. ✅ Proper environment configuration

## 🔧 Setting Up Your Real API Keys

### 1. Add Your Real API Keys to `.env.local`

Edit the `.env.local` file and replace the placeholder values with your real API keys:

```bash
# Open your .env.local file
nano /Users/benknight/Code/JusticeHub/.env.local
```

Replace the placeholder values with your real keys:

```env
# REAL AI SERVICE API KEYS
OPENAI_API_KEY=sk-proj-your-real-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-api03-your-real-anthropic-api-key-here
FIRECRAWL_API_KEY=fc-your-real-firecrawl-api-key-here
PERPLEXITY_API_KEY=your-real-perplexity-api-key-here
GOOGLE_API_KEY=your-real-google-api-key-here
XAI_API_KEY=your-real-xai-api-key-here
OPENROUTER_API_KEY=your-real-openrouter-api-key-here
MISTRAL_API_KEY=your-real-mistral-api-key-here
```

### 2. Verify Your Keys Are Loaded

Test that your keys are properly loaded:

```bash
# Check if keys are in environment
cd /Users/benknight/Code/JusticeHub
printenv | grep -E "(OPENAI_API_KEY|ANTHROPIC_API_KEY|FIRECRAWL_API_KEY)"
```

## ▶️ Running the AI Scraper

### Step 1: Initialize the Scraping System

First, initialize the scraping system with default government data sources:

```bash
cd /Users/benknight/Code/JusticeHub
npx tsx src/scripts/initialize-scraper.ts
```

Expected output:
```
🔧 Initializing AI Scraping System...
✅ Created data source: Australian Government Open Data
✅ Created data source: NSW Family and Community Services
✅ Created data source: QLD Youth Justice Services
✅ Created data source: Legal Aid NSW
✅ Created data source: Youth Law Australia
🎉 AI Scraping System initialization complete
```

### Step 2: Run a Test Scrape

Run a test scraping job to verify everything is working:

```bash
cd /Users/benknight/Code/JusticeHub
npx tsx src/scripts/run-test-scrape.ts
```

Expected output:
```
🧪 Running Test Scraping Job...
🔑 API Key Status:
OpenAI: ✅ Found
Anthropic: ✅ Found
Firecrawl: ✅ Found
📋 Testing with data source: Australian Government Open Data
✅ Created test job: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
🚀 Job is queued and will be processed by the scraping system
```

### Step 3: Monitor the Scraping Progress

Monitor the progress of your scraping job:

```bash
# Check job status
curl -s "http://localhost:3000/api/scraping/jobs" | jq
```

Or query the database directly:

```bash
# Check processing jobs table
psql -h localhost -U postgres -d justicehub -c "SELECT * FROM processing_jobs ORDER BY created_at DESC LIMIT 5;"
```

## 📊 Expected Results

After running the scraper:

1. **New Services Discovered**: The AI scraper will find real youth justice services from government websites
2. **Database Population**: New records will be added to the `scraped_services` and `organization_enrichment` tables
3. **Service Finder Growth**: Your Service Finder will automatically show more real services
4. **Data Enrichment**: Organizations will be enriched with additional information

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. "Invalid API Key" Errors
```bash
# Verify your keys are correct
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
echo $FIRECRAWL_API_KEY
```

#### 2. "Connection Refused" Errors
```bash
# Make sure Supabase is accessible
curl -s "https://tednluwflfhxyucgwigh.supabase.co/rest/v1/" -H "apikey: $(grep SUPABASE_ANON_KEY .env | cut -d '=' -f2)"
```

#### 3. "Rate Limit Exceeded" Errors
```bash
# Wait and try again, or adjust rate limits in data_sources table
echo "Waiting 60 seconds for rate limit reset..."
sleep 60
```

## 🎯 Advanced Usage

### Custom Data Sources
Add your own data sources to scrape:

```sql
INSERT INTO data_sources (name, type, base_url, active, scraping_config) 
VALUES ('Your Custom Source', 'custom_directory', 'https://your-source.com', true, 
        '{"rate_limit_ms": 1000, "max_concurrent_requests": 2}');
```

### Scheduled Scraping
Set up cron jobs for regular scraping:

```bash
# Add to crontab for weekly scraping
crontab -e
# Add line:
# 0 2 * * 1 cd /Users/benknight/Code/JusticeHub && npx tsx src/scripts/run-weekly-scrape.ts
```

## 🔐 Security Best Practices

### 1. Key Rotation
Regularly rotate your API keys:
- OpenAI: Every 90 days
- Anthropic: Every 90 days
- Firecrawl: Every 90 days

### 2. Monitoring
Monitor API usage for unusual activity:
```bash
# Check OpenAI usage
curl -s "https://api.openai.com/v1/usage" -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 3. Access Control
Restrict API keys to only necessary permissions in each service's dashboard.

## 🚀 Going to Production

### 1. Production Environment
Set up separate API keys for production:
```env
# Production .env.local
OPENAI_API_KEY=sk-proj-production-key-here
ANTHROPIC_API_KEY=sk-ant-api03-production-key-here
FIRECRAWL_API_KEY=fc-production-key-here
```

### 2. Scaling
Configure for high-volume scraping:
```sql
UPDATE data_sources 
SET scraping_config = jsonb_set(scraping_config, '{max_concurrent_requests}', '5')
WHERE active = true;
```

## 📞 Support

If you encounter issues:
1. Check the logs in `logs/scraper.log`
2. Review error messages in `processing_jobs` table
3. Verify API key validity
4. Check network connectivity to data sources

Happy scraping! 🤖🔍