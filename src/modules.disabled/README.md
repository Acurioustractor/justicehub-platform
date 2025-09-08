# JusticeHub Modules

This directory contains integrated external modules that extend JusticeHub's functionality.

## Integrated Modules

### 1. Youth Justice Service Finder
**Path:** `src/modules/youth-justice-finder/`
**Source:** https://github.com/Acurioustractor/Youth-Justice-Service-Finder

**Key Features:**
- Service search and discovery
- Geographic location finder
- Database of youth justice services
- API endpoints for service data
- React frontend components

**Main Files:**
- `api/` - REST API endpoints
- `frontend/` - React frontend
- `src/scrapers/` - Data collection scripts
- `database/` - Schema and migrations

### 2. QLD Youth Justice Tracker
**Path:** `src/modules/qld-justice-tracker/`
**Source:** https://github.com/Acurioustractor/qld-youth-justice-tracker

**Key Features:**
- Budget tracking and analysis
- Cost comparison visualizations
- Indigenous youth justice disparity data
- Automated data scrapers
- Transparency dashboard

**Main Files:**
- `app/` - Next.js pages and components
- `components/` - React dashboard components
- `scripts/scrapers/` - Data collection automation
- `lib/` - Utility functions and services

## Integration Strategy

### Suggested Routes
- Youth Justice Service Finder: `/services`
- QLD Youth Justice Tracker: `/transparency` or `/budget-tracker`

### Dependencies to Add
Both modules will require additional npm packages. Key dependencies include:

**Service Finder:**
- Geocoding libraries (leaflet, react-leaflet)
- API client libraries (axios)
- Database connectors

**Tracker:**
- Data visualization (recharts, d3)
- Web scraping (puppeteer, cheerio)
- PDF processing libraries

### Next Steps
1. Review module package.json files for dependencies
2. Merge necessary dependencies into main package.json
3. Create route handlers in main app
4. Set up environment variables
5. Configure database connections
6. Test module functionality

## Usage Notes

These modules were integrated using git subtree, which means:
- Full history is preserved
- Updates can be pulled from original repos
- Changes can be contributed back upstream

To update modules:
```bash
# Update Youth Justice Service Finder
git subtree pull --prefix=src/modules/youth-justice-finder https://github.com/Acurioustractor/Youth-Justice-Service-Finder.git main --squash

# Update QLD Youth Justice Tracker
git subtree pull --prefix=src/modules/qld-justice-tracker https://github.com/Acurioustractor/qld-youth-justice-tracker.git main --squash
```