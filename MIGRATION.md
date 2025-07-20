# JusticeHub Module Migration Guide

## Quick Migration Commands

### Option 1: Git Subtree (Recommended)
```bash
# Add Youth Justice Service Finder
git subtree add --prefix=src/modules/youth-justice-finder \
  https://github.com/Acurioustractor/Youth-Justice-Service-Finder.git main --squash

# Add QLD Youth Justice Tracker  
git subtree add --prefix=src/modules/qld-justice-tracker \
  https://github.com/Acurioustractor/qld-youth-justice-tracker.git main --squash
```

### Option 2: Direct Clone & Migrate
```bash
# Clone and copy
git clone https://github.com/Acurioustractor/Youth-Justice-Service-Finder.git temp-yjsf
git clone https://github.com/Acurioustractor/qld-youth-justice-tracker.git temp-qjt

# Create module directories
mkdir -p src/modules/{youth-justice-finder,qld-justice-tracker}

# Copy files
cp -r temp-yjsf/* src/modules/youth-justice-finder/
cp -r temp-qjt/* src/modules/qld-justice-tracker/

# Cleanup
rm -rf temp-yjsf temp-qjt

# Commit
git add src/modules/
git commit -m "feat: integrate youth justice modules"
```

## Integration Steps

### 1. Youth Justice Service Finder
- Route: `/services`
- Components to integrate: Service search, location finder
- API routes: Service database queries
- Database: Merge service provider schemas

### 2. QLD Youth Justice Tracker
- Route: `/transparency` or `/budget-tracker`
- Components: Budget visualizations, comparison charts
- Scrapers: Move to GitHub Actions or /scripts
- Database: Budget and tracking data schemas

## Dependencies to Add

### Youth Justice Service Finder
```json
{
  "axios": "^1.6.0",
  "react-leaflet": "^4.2.1",
  "leaflet": "^1.9.4"
}
```

### QLD Youth Justice Tracker
```json
{
  "puppeteer": "^21.5.0",
  "cheerio": "^1.0.0-rc.12",
  "d3": "^7.8.5"
}
```

## Directory Structure After Migration
```
src/
├── modules/
│   ├── youth-justice-finder/
│   │   ├── src/
│   │   ├── api/
│   │   ├── frontend/
│   │   └── database/
│   ├── qld-justice-tracker/
│   │   ├── src/
│   │   ├── scripts/
│   │   ├── components/
│   │   └── lib/
│   └── index.ts  # Module registry
```

## Post-Migration Tasks
1. Update package.json with new dependencies
2. Merge database schemas
3. Update routing in app/layout.tsx
4. Test module functionality
5. Update environment variables
6. Configure GitHub Actions for scrapers