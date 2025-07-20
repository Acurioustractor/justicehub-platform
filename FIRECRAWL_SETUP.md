# 🔥 Firecrawl Integration Setup

## IMPORTANT: API Key Security

⚠️ **NEVER share your API key publicly!** If you accidentally exposed it, regenerate immediately.

## Setup Instructions

### 1. Get Your Firecrawl API Key

1. Go to [https://firecrawl.dev](https://firecrawl.dev)
2. Sign up or login to your account
3. Navigate to your dashboard/API settings
4. Generate a new API key
5. Copy the key (starts with `fc-`)

### 2. Add to Environment Variables

Add to your `.env.local` file:

```bash
# Firecrawl API Key (for enhanced web scraping)
FIRECRAWL_API_KEY=fc-your-actual-key-here
```

### 3. Test the Integration

Run the Firecrawl enhanced scraper:

```bash
# Make sure your API key is set first!
chmod +x scripts/scrapers/firecrawl-enhanced-scraper.mjs
node scripts/scrapers/firecrawl-enhanced-scraper.mjs
```

### 4. What Firecrawl Enables

🎯 **Better Scraping Capabilities:**
- **Dynamic content** - Waits for JavaScript to load
- **Reliable extraction** - Handles modern web applications
- **Structured data** - Returns clean markdown and HTML
- **Rate limiting** - Built-in respectful crawling
- **Error handling** - Robust failure recovery

🔍 **Enhanced Data Collection:**
- **Queensland Courts** - Annual reports and statistics
- **Police Open Data** - Crime datasets and patterns
- **Youth Justice Dept** - Program reports and outcomes
- **Budget Papers** - Spending allocations and figures

### 5. Integration Benefits

✅ **Reliability** - Firecrawl handles complex websites better than basic scrapers
✅ **Respect** - Built-in rate limiting prevents overwhelming servers
✅ **Quality** - Clean data extraction with markdown formatting
✅ **Monitoring** - Integrates with our existing health monitoring system

### 6. Usage Examples

The Firecrawl scraper will:
- Extract youth justice mentions from government websites
- Find budget figures and spending data
- Collect publication links and report titles
- Store structured data for analysis

### 7. Cost Management

💡 **Free Tier Usage:**
- Monitor your usage in the Firecrawl dashboard
- Our scraper includes delays between requests
- Targets only essential government data sources
- Optimized for maximum value per API call

### 8. Security Best Practices

🔒 **Protect Your API Key:**
- Never commit API keys to version control
- Store only in `.env.local` (which is gitignored)
- Regenerate keys if accidentally exposed
- Use environment variables in production

### 9. Integration with Existing System

The Firecrawl scraper integrates seamlessly:
- Updates the same `scraper_health` monitoring table
- Stores data in `scraped_content` table
- Appears in the monitoring dashboard
- Follows the same error handling patterns

### 10. Run Enhanced Scraping

```bash
# Run all scrapers including Firecrawl
node scripts/run-all-enhanced-scrapers.mjs

# Or run just Firecrawl
node scripts/scrapers/firecrawl-enhanced-scraper.mjs
```

## Troubleshooting

### Common Issues:

1. **"API key not found"**
   - Check `.env.local` has the correct key
   - Restart dev server after adding the key

2. **"Rate limit exceeded"**
   - Wait a few minutes and try again
   - Check your Firecrawl dashboard usage

3. **"Scraping failed"**
   - Some government sites may block scrapers
   - Try accessing the URL manually first

### Support

- Firecrawl docs: https://docs.firecrawl.dev
- Our monitoring dashboard: http://localhost:3000/monitoring
- Check scraper health in real-time

## Impact on Mission

🎯 **Enhanced Data Collection = Better Advocacy**

With Firecrawl, we can:
- Access more government data reliably
- Handle dynamic websites that basic scrapers miss
- Extract structured information more effectively
- Build a more comprehensive picture of youth justice failures

Every successful scrape brings us closer to full transparency about Queensland's youth justice system!