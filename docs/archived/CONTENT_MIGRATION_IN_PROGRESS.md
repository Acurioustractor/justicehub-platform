# 🚀 Content Migration In Progress

**Started**: October 11, 2025
**Status**: 🟡 In Progress - Scraping Content
**Target**: Migrate all articles from justicehub.com.au to new platform

---

## ✅ Completed Steps

### 1. Database Schema Created
**File**: [supabase/migrations/create-content-tables.sql](supabase/migrations/create-content-tables.sql)

**Tables Created**:
- ✅ `authors` - Author profiles (Benjamin Knight created by default)
- ✅ `articles` - Blog articles with full content
- ✅ `article_locations` - Geographic data for Justice Map
- ✅ `pages` - Static pages (About, Contact)
- ✅ `article_tags` - Flexible tagging system
- ✅ `newsletter_subscribers` - Email list

**Features**:
- Full-text search index on articles
- Automatic reading time calculation
- RLS policies for security
- Optimized indexes for performance
- Views for common queries

### 2. Content Scraper Built
**File**: [src/scripts/scrape-webflow-content.ts](src/scripts/scrape-webflow-content.ts)

**What It Does**:
1. Scrapes articles index page from justicehub.com.au
2. Extracts article list with titles and metadata
3. Scrapes each individual article page
4. Uses Claude AI to convert HTML → clean Markdown
5. Extracts metadata (category, location tags, SEO)
6. Scrapes About and Contact pages
7. Saves everything to `/data/webflow-migration/`

**Output Structure**:
```
data/webflow-migration/
├── articles.json              # All articles as JSON
├── articles-markdown/         # Individual .md files
│   ├── article-slug-1.md
│   ├── article-slug-2.md
│   └── ...
├── about.md                   # About page content
├── contact.md                 # Contact page content
└── migration-summary.json     # Summary report
```

---

## 🔄 Currently Running

### Content Scraping (in progress)
**Command**: `NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/scrape-webflow-content.ts`

**Articles Being Scraped** (6 found):
1. "Where Fire Meets Country: A Journey Through Mount Isa's NAIDOC week"
2. "Achieving Gold-Standard Youth Crime Prevention"
3. "Beyond Shadows: Plato's Cave and Youth Justice"
4. "Creating Spaces for Growth"
5. "From Control to Care: Reimagining Staff Roles"
6. "The Courage to Connect"

**Process** (per article):
- Fetch HTML from justicehub.com.au
- Send to Claude AI for extraction
- Convert HTML to clean Markdown
- Extract metadata and images
- Save to JSON and individual .md files
- 2-second delay between requests (respectful scraping)

**Estimated Time**: ~20-30 seconds per article = 2-3 minutes total

---

## ⏭️ Next Steps (After Scraping Completes)

### 3. Create Image Storage Bucket
```sql
-- In Supabase Storage
CREATE BUCKET article-images (public)
```

### 4. Build Article Import Script
**File to create**: `src/scripts/import-articles-to-database.ts`

**What It Will Do**:
- Read articles from `data/webflow-migration/articles.json`
- Download images from Webflow
- Upload images to Supabase Storage
- Insert articles into `articles` table
- Insert locations into `article_locations` table
- Create About/Contact pages

### 5. Build Frontend Pages

**Pages to Create**:
```
/articles                      # Articles index
/articles/[slug]              # Individual article
/articles/category/[cat]      # Category filters
/author/[slug]                # Author profiles
/justice-map                  # Enhanced map (stories + services)
/about                        # About page
/contact                      # Contact page
```

**Components Needed**:
- `ArticleCard` - Article preview card
- `ArticleContent` - Full article with MDX rendering
- `CategoryBadge` - Seeds/Growth/Harvest/Roots badges
- `AuthorByline` - Author info with photo
- `RelatedArticles` - Sidebar recommendations
- `EnhancedJusticeMap` - Combined stories + services map

### 6. Enhanced Justice Map Integration

**Innovation**: Combine stories + services on one interactive map

**Map Markers**:
- 📖 Purple = Stories/Articles (e.g., "CAMPFIRE Journey" in Mount Isa)
- 🤝 Blue = Services (511 existing services)
- 🌱 Green = Programs
- ⚖️ Orange = Inquiries

**User Flow**:
1. User reads story about transformative program
2. Map shows story location + nearby services
3. User discovers real services they can access
4. Click service → get contact info, directions

---

## 📊 Expected Results

### Content Inventory (from documentation)
- **Articles**: 9+ articles (6 confirmed scraped so far)
- **Categories**:
  - 🌱 Seeds: 2 articles
  - 🌿 Growth: 5 articles
  - 🌾 Harvest: TBD
  - 🌳 Roots: 1 article
- **Author**: Benjamin Knight (primary)
- **Timeframe**: All published March 2025
- **Topics**: Youth justice transformation, programs, philosophy

### Platform After Migration
**Before**:
- Old site: 9+ transformational stories
- New site: 511 services

**After**:
- **Unified platform**: Stories + Services integrated
- **Enhanced discovery**: Read inspiration → Find real help
- **Justice Map 2.0**: Interactive visualization
- **SEO preserved**: All URLs redirected properly
- **Future-proof**: Easy to add more content

---

## 🎯 Success Criteria

- [ ] All 9+ articles successfully scraped
- [ ] All images migrated to Supabase Storage
- [ ] Articles imported to database
- [ ] Frontend pages built and functioning
- [ ] Enhanced Justice Map showing both stories + services
- [ ] SEO metadata preserved
- [ ] URLs redirected properly
- [ ] Mobile-responsive design
- [ ] Fast page load times (< 2 seconds)

---

## 📋 Technical Details

### Technologies Used
- **Scraping**: Node.js, tsx, Anthropic Claude API
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Frontend**: Next.js 14, React, TypeScript
- **Content Format**: MDX (Markdown + React components)
- **Maps**: MapLibre GL
- **Styling**: Tailwind CSS

### API Usage
- Claude Sonnet 4 for HTML → Markdown conversion
- ~6-9 API calls per article (title, content, metadata extraction)
- ~50-60 total API calls for full migration
- Estimated cost: ~$2-3 total

---

## 🔍 Monitoring Progress

Check scraper output:
```bash
# View scraping progress
tail -f /path/to/output

# Check scraped files
ls -la data/webflow-migration/

# View scraped articles
cat data/webflow-migration/articles.json
```

---

## 📞 Next Session Recommendations

### When Scraping Completes:
1. Review scraped articles in `data/webflow-migration/`
2. Verify content quality and completeness
3. Run article import script
4. Build frontend pages
5. Test Justice Map integration
6. Deploy to production

### If Issues Occur:
- Check API key is valid
- Verify justicehub.com.au is accessible
- Review error logs
- Adjust scraper if HTML structure changed

---

**Last Updated**: 2025-10-11 09:31 UTC
**Current Step**: Scraping article 1 of 6
**Next Milestone**: Complete scraping → Import to database
