# Queensland Youth Justice Tracker - Project Review Points

## 🎯 Project Mission
Evidence-based government accountability tracking for Queensland Youth Justice reform through systematic data collection from 6 official government sources.

## 📊 Current Status (Last Updated: June 2025)

### ✅ Major Achievements
- **Data Collection System Operational**: Successfully scraped 6 government sources
- **$1.38 billion spending transparency** tracked with hidden cost analysis  
- **20x Indigenous overrepresentation crisis** documented with official statistics
- **Complete accountability report generated** (170 lines of evidence-based findings)
- **Next.js dashboard framework** implemented with modern UI components

### 📈 Key Statistics Collected
- **175 per 10,000 supervision rate** - Queensland highest in Australia
- **86% of 10-11 year olds in court are Indigenous** (Children's Court admission)
- **$857 claimed vs $1,570 true daily cost** (including hidden expenses)
- **470 children in police watch houses** (5-14 days average)
- **90.6% spent on detention** vs 9.4% on community programs

## 🔧 Technical Architecture

### Data Sources (All Operational)
1. **AIHW Youth Justice Statistics** - Indigenous overrepresentation documentation
2. **Queensland Treasury Budget** - $1.38B spending transparency tracking  
3. **Queensland Open Data Portal** - 37 datasets with API integration
4. **Queensland Police Service** - Real-time youth crime demographics
5. **ABS Census & SEIFA** - Socio-economic risk factor mapping
6. **Children's Court Reports** - PDF extraction (156,011 characters)

### Tech Stack
- **Frontend**: Next.js 13+ with App Router, Tailwind CSS, Framer Motion
- **Backend**: Node.js scrapers, Supabase database, Firecrawl API
- **Data Collection**: Automated scrapers with monitoring system
- **Deployment**: Vercel (configured)

## 🚧 Current Development Status

### Recent Changes Made
- **Simplified homepage layout**: Removed complex scrollytelling, added clean card-based navigation
- **Clear user journeys**: Added focused sections for Advocates, Journalists, Researchers
- **Trust indicators**: Added methodology links and data source transparency
- **Navigation cleanup**: Streamlined from complex animations to functional design

### Outstanding Tasks (Priority Order)

#### 🔴 High Priority - Core Functionality
- [ ] **Remove data mode toggle** and clean up dashboard inconsistencies
- [ ] **Fix all non-working buttons** throughout the application
- [ ] **Create clear user journeys** for each major section
- [ ] **Build purposeful data explorer page** with Indigenous focus filtering
- [ ] **Create functional alerts page** for real-time monitoring

#### 🟡 Medium Priority - Content Pages  
- [ ] **Build investigation section pages** that work with real data
- [ ] **Create action pages** with actual campaign tools
- [ ] **Implement downloads functionality** with multiple export formats
- [ ] **Connect /sources page** to actual scraped data verification

#### 🟢 Low Priority - Enhancements
- [ ] **Add data visualization components** for key statistics
- [ ] **Implement real-time data updates** from Supabase
- [ ] **Create parliamentary submission templates**
- [ ] **Build public transparency portal**

## 🗂️ Key Files to Review

### Main Application Structure
- `app/page.tsx` - Recently updated homepage (315 lines)
- `app/layout.tsx` - App configuration and navigation  
- `components/` - Reusable UI components
- `app/api/` - API routes for data access

### Data & Reports
- `exports/accountability-report-2025-06-18.md` - Complete evidence summary
- `scripts/scrapers/` - All operational data collection scripts
- `supabase/migrations/` - Database schema and setup

### Documentation
- `deployment-summary.md` - Deployment status and instructions
- `SCRAPER_MONITORING_GUIDE.md` - Technical monitoring setup
- `DATA_COLLECTION_STRATEGY.md` - Scraping methodology

## 🎯 Next Session Action Plan

### Immediate Priorities (1-2 hours)
1. **Audit all navigation links** - Check every button/link works correctly
2. **Remove data mode toggle** - Clean up any confusing UI elements  
3. **Test key user journeys** - Ensure /data-explorer, /alerts, /sources work

### Medium-term Goals (3-5 hours)  
1. **Build functional data explorer** with Indigenous statistics filtering
2. **Create working alerts dashboard** with real monitoring data
3. **Implement download functionality** for reports and datasets

### Long-term Vision
- **Parliamentary submission generator** with official statistics
- **Real-time accountability monitoring** with automated alerts
- **Public transparency portal** for media and advocacy use

## 🔍 Quick Development Setup

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Test scrapers (if needed)
node scripts/test-all-scrapers.mjs

# Check database connection
node scripts/test-supabase-connection.mjs
```

## 💡 Key Context for Re-entry

### Project Philosophy
This isn't just a data dashboard - it's an **accountability tool** designed to force government transparency on youth justice spending and outcomes. Every feature should serve evidence-based advocacy.

### User Types & Needs
- **Advocates**: Campaign-ready content and verified statistics
- **Journalists**: Fact-checkable data with direct government source links  
- **Researchers**: Downloadable datasets with clear methodology
- **Public**: Clear visualization of taxpayer spending and system failures

### Current UI State
The homepage was recently simplified from complex animations to clean, functional navigation. Focus is now on **usability over flash** - each section should have a clear purpose and working functionality.

---

**Last Review**: January 2025
**Status**: Core data collection complete, UI cleanup in progress
**Next Focus**: Functional user journeys and working page implementations 