# Program Research Scripts - Quick Start Guide

## ✅ What You Have

Two powerful scripts to research and add international programs:

### 1. Enrich Program from URL (Simple & Fast)
**File:** `src/scripts/enrich-program-from-url.ts`

Use when you know the program's official website.

**Command:**
```bash
npx tsx src/scripts/enrich-program-from-url.ts "Program Name" "Country" "https://website.com"
```

**Example:**
```bash
npx tsx src/scripts/enrich-program-from-url.ts "Diagrama Foundation" "Spain" "https://www.diagramaaustralia.org/"
```

**What it does:**
1. Scrapes the website with Firecrawl
2. Analyzes content with Claude AI
3. Extracts structured data
4. Saves to database automatically

**Extracted data:**
- Name, country, description
- Approach summary
- Recidivism rates (if mentioned)
- Evidence strength level
- Key outcomes
- Year established
- Scale/reach
- Australian adaptations

### 2. Research & Enrich Program (Advanced)
**File:** `src/scripts/research-and-enrich-program.ts`

Use when you don't know the website - it will search for it.

**Command:**
```bash
npx tsx src/scripts/research-and-enrich-program.ts "Program Name" "Country"
```

**Note:** Currently has search issues - use URL version above until fixed.

## 🎯 How to Add New Programs

### Step 1: Find Program Websites

Search Google for:
- "Program name official website"
- "Program name [country] youth justice"
- "Program name government website"

### Step 2: Run the Script

```bash
npx tsx src/scripts/enrich-program-from-url.ts "Program Name" "Country" "URL"
```

### Step 3: Verify on Website

Visit: `http://localhost:3003/centre-of-excellence/global-insights`

The new program will appear in the list!

## 📋 Priority Programs to Add

### High Priority (Gold Standard)

1. **Germany - Jugendstrafvollzug**
   - Website: https://www.dvjj.de/
   ```bash
   npx tsx src/scripts/enrich-program-from-url.ts "Jugendstrafvollzug" "Germany" "https://www.dvjj.de/"
   ```

2. **Japan - Juvenile Training Schools**
   - Website: http://www.moj.go.jp/ENGLISH/
   ```bash
   npx tsx src/scripts/enrich-program-from-url.ts "Juvenile Training Schools" "Japan" "http://www.moj.go.jp/ENGLISH/"
   ```

3. **Norway - Youth Welfare System**
   - Website: https://www.bufetat.no/
   ```bash
   npx tsx src/scripts/enrich-program-from-url.ts "Youth Welfare System" "Norway" "https://www.bufetat.no/"
   ```

4. **Belgium - Community Service Orders**
   - Website: Research needed

5. **Italy - Juvenile Justice Centres**
   - Website: https://www.giustizia.it/

### Medium Priority

6. Singapore - Guidance Programme
7. South Korea - Diversion System
8. Chile - Sename Reform
9. Colombia - Restorative Justice
10. Argentina - Youth Courts

## 🔄 Enrich Existing Programs

To add more details to programs already in database:

1. Find the program's website
2. Run the script with the same name/country
3. It will UPDATE instead of creating duplicate

Example - enrich Missouri Model:
```bash
npx tsx src/scripts/enrich-program-from-url.ts "Missouri Model" "United States" "https://www.aecf.org/"
```

## 🛠️ Technology Stack

**Firecrawl:**
- Scrapes any website cleanly
- Handles JavaScript-heavy sites
- Extracts clean markdown

**Claude AI (Anthropic):**
- Analyzes website content
- Extracts structured data
- Ensures data quality

**Supabase:**
- Stores all program data
- Automatic duplicate detection
- Updates existing records

## 💡 Tips for Best Results

### 1. Use Official Websites
- Government sites
- Program's own website
- Academic institution sites
- Avoid news articles or Wikipedia

### 2. Check Data After Import
- Visit global-insights page
- Verify recidivism rates
- Check outcomes make sense
- Add manual corrections if needed

### 3. Batch Processing
You can create a list and process multiple programs:

```bash
# Create a script file: add-programs.sh
npx tsx src/scripts/enrich-program-from-url.ts "Program 1" "Country 1" "URL1"
npx tsx src/scripts/enrich-program-from-url.ts "Program 2" "Country 2" "URL2"
npx tsx src/scripts/enrich-program-from-url.ts "Program 3" "Country 3" "URL3"

# Run it:
bash add-programs.sh
```

## 📊 Current Status

**Database:** 17 programs (16 original + 1 Diagrama enriched)
**Target:** 50 programs (need 33 more)
**Research capability:** ✅ Ready
**Scraping capability:** ✅ Ready
**AI analysis:** ✅ Ready

## 🚀 Next Steps

1. **Add 10 European Programs** (Germany, Italy, Belgium, etc.)
2. **Add 10 Asian Programs** (Japan, Singapore, South Korea, etc.)
3. **Add 10 Latin American** (Chile, Colombia, Argentina, etc.)
4. **Add 3 African Programs** (expand beyond South Africa)

## 📝 Example Session

```bash
# Session: Adding German programs
cd /path/to/JusticeHub

# Add program 1
npx tsx src/scripts/enrich-program-from-url.ts \
  "Jugendstrafvollzug" \
  "Germany" \
  "https://www.dvjj.de/"

# Wait for completion (30-60 seconds)
# ✅ Complete!

# Add program 2
npx tsx src/scripts/enrich-program-from-url.ts \
  "Erziehungshilfen" \
  "Germany" \
  "https://www.bagljae.de/"

# Continue until done...
```

## ⚠️ Known Issues

1. **Search function not working** - Use URL version instead
2. **Some websites may timeout** - Try again or find alternative source
3. **Non-English sites** - Claude handles translation, but English sites work better
4. **Rate limiting** - Wait 30-60 seconds between requests

## 💰 API Costs (Estimated)

Per program enrichment:
- Firecrawl: ~1 credit (~$0.03)
- Claude API: ~5,000 tokens (~$0.01)
- **Total: ~$0.04 per program**

Adding 50 programs: ~$2
Adding 200 programs: ~$8

Very affordable for comprehensive research!

---

## 🎓 Ready to Start?

Pick any program from the priority list and run:

```bash
npx tsx src/scripts/enrich-program-from-url.ts "Name" "Country" "URL"
```

Watch the magic happen! 🪄
