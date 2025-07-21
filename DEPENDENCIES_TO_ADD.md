# Dependencies Analysis for Module Integration

## Current JusticeHub Dependencies
Already has: next, react, react-dom, typescript, @types/node, lucide-react, tailwindcss, drizzle-orm, postgres, etc.

## Youth Justice Service Finder - Key Dependencies to Add

### Core Service Finder Dependencies
```json
{
  "@supabase/supabase-js": "^2.52.0",
  "axios": "^1.10.0",
  "cheerio": "^1.1.0",
  "fastest-levenshtein": "^1.0.16",
  "string-similarity": "^4.0.4",
  "node-cache": "^5.1.2",
  "joi": "^17.11.0"
}
```

### Optional Service Finder Dependencies (if needed)
```json
{
  "@elastic/elasticsearch": "^8.11.0",
  "firecrawl": "^1.7.1",
  "nodemailer": "^6.9.7",
  "csv-parse": "^5.5.3",
  "pino": "^8.17.2"
}
```

## QLD Justice Tracker - Key Dependencies to Add

### Visualization & Charts
```json
{
  "chart.js": "^4.4.1",
  "react-chartjs-2": "^5.2.0",
  "recharts": "^2.15.3",
  "react-countup": "^6.5.3",
  "framer-motion": "^12.18.1"
}
```

### PDF & Data Processing
```json
{
  "pdf-parse": "^1.1.1",
  "pdfjs-dist": "^5.3.31",
  "csv-stringify": "^6.5.2",
  "swr": "^2.3.4"
}
```

### Web Scraping (DevDependencies)
```json
{
  "cheerio": "^1.1.0",
  "puppeteer": "^21.9.0",
  "node-cron": "^3.0.3"
}
```

## Conflicts Resolution

### Version Conflicts to Resolve
- **axios**: Service Finder uses ^1.10.0, Tracker uses ^1.10.0 ✅ Compatible
- **cheerio**: Both use ^1.1.0 ✅ Compatible  
- **@types/node**: Tracker uses 20.11.5, Main uses ^20.10.6 ✅ Compatible
- **lucide-react**: Tracker uses ^0.517.0, Main uses ^0.395.0 ⚠️ Update needed

### Radix UI Components Already Present
Main project already has most @radix-ui components, Tracker adds:
- `@radix-ui/react-progress` (new)
- `@radix-ui/react-tabs` (new)

## Recommended Merge Strategy

1. **Add Core Dependencies** - Essential for basic functionality
2. **Add Visualization Dependencies** - For dashboard features  
3. **Add Optional Dependencies** - As features are integrated
4. **Update Conflicting Versions** - To latest compatible versions

## Package.json Updates Needed

Update main package.json to include these core dependencies for immediate integration.