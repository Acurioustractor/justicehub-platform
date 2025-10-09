# Centre of Excellence - Global Map Integration

## Overview

I've created a comprehensive map feature for the Centre of Excellence that displays international best practice models, Australian state frameworks, and major research institutions geographically. This provides an intuitive, visual way to explore excellence resources worldwide.

## What Was Created

### 1. **Geographic Data Structure** (`/src/content/excellence-map-locations.ts`)

A complete data file containing geographic coordinates and details for:
- **6 International Models**: Spain (Diagrama), New Zealand (Oranga Tamariki), Scotland (Children's Hearings), Nordic Countries (Finland), Canada (YCJA), USA (Missouri Model)
- **4 Australian Frameworks**: NSW Youth Koori Court, Victoria's Therapeutic Model, Queensland Diversion, WA Aboriginal Programs
- **5 Major Research Sources**: AIFS, BOCSAR, Lowitja Institute, Oranga Tamariki Research, Annie E. Casey Foundation

Each location includes:
- Name and description
- Geographic coordinates (lat/lng)
- Category (international-model, australian-framework, research-source)
- Key statistics and outcomes
- Tags for filtering
- Links to detail pages and external websites
- Featured status

### 2. **Global Excellence Map Page** (`/src/app/centre-of-excellence/map/page.tsx`)

A full-featured interactive map with:
- **MapLibre GL** rendering with marker clustering
- **Search functionality** - search by name, country, keyword, stats
- **Category filtering** - filter by International Models, Australian Frameworks, Research Sources
- **Interactive markers** - color-coded by category, clickable popups with key stats
- **Focus functionality** - click cards to focus map on specific locations
- **Responsive design** - works on mobile and desktop
- **Multiple basemap fallbacks** - local style → Carto → MapLibre demo → OpenStreetMap raster

**Stats Displayed:**
- 6 International Models
- 4 Australian Frameworks
- 5 Research Sources

### 3. **Map Links Added to All CoE Pages**

**Centre of Excellence Landing Page:**
- Primary hero button: "Global Excellence Map" (prominent black button)

**Research Library Page:**
- Blue button: "View Research Sources on Global Map"

**Global Insights Page:**
- Purple button: "View International Models on Global Map"

**Best Practice Page:**
- Green button: "View Australian Frameworks on Map"

## How the Map Works

### Search & Filter Workflow

1. **Search Bar**: Type keywords to search across names, descriptions, countries, stats, tags
2. **Category Filters**: Click category buttons to filter by type:
   - All Resources (view everything)
   - International Models (blue markers)
   - Australian Frameworks (red markers)
   - Research Sources (green markers)
3. **Map Markers**: Click markers to view popup with:
   - Name and description
   - Location details
   - Key statistics
   - Links to detail page and external website
4. **Location Cards**: Below map, browse all filtered locations with:
   - Full descriptions
   - Key stats in highlighted boxes
   - "Focus" button to zoom map to location
   - Links to detail pages and external resources

### Color Coding

- **Blue** = International Models (Spain, NZ, Scotland, Nordic, Canada, Missouri)
- **Red** = Australian Frameworks (NSW, VIC, QLD, WA)
- **Green** = Research Sources (AIFS, BOCSAR, Lowitja, etc.)
- **Purple** = Training Hubs (reserved for future)

### Map Features

- **Auto-fit bounds**: Map automatically adjusts to show all filtered locations
- **Smooth fly-to**: Clicking "Focus" animates to location with smooth transition
- **Popup management**: Only one popup open at a time
- **Legend**: Clear color legend showing category meanings
- **Reset button**: Clear all filters and search with one click
- **Results counter**: Shows "X locations" matching current filters

## User Experience Flow

### Example 1: Finding International Models
1. User visits `/centre-of-excellence/global-insights`
2. Clicks "View International Models on Global Map"
3. Arrives at map pre-filtered to show only blue markers (6 international models)
4. Can see Spain, NZ, Scotland, Finland, Canada, Missouri at a glance
5. Clicks "Spain - Diagrama Foundation" card
6. Map zooms to Madrid, popup shows "13.6% recidivism vs 80-96%" stat
7. Clicks "View Details →" to see full Diagrama model page

### Example 2: Exploring Australian Frameworks
1. User visits `/centre-of-excellence/best-practice`
2. Clicks "View Australian Frameworks on Map"
3. Map shows 4 red markers across Australia (Sydney, Melbourne, Brisbane, Perth)
4. Searches "Aboriginal" in search bar
5. Filters to NSW Youth Koori Court and WA Aboriginal Programs
6. Compares outcomes: NSW (40% custody reduction) vs WA (71% overrepresentation crisis)

### Example 3: Finding Research Sources
1. User visits `/centre-of-excellence/research`
2. Clicks "View Research Sources on Global Map"
3. Map shows 5 green markers (Australia, NZ, USA)
4. Clicks AIFS marker in Melbourne
5. Popup shows "National research authority" with link to research library
6. Clicks "View Details →" to see all AIFS research filtered in library

## Technical Implementation

### Map Technology Stack
- **MapLibre GL JS** - Open-source mapping library (already in package.json)
- **TypeScript interfaces** - Strongly typed location data
- **React hooks** - useState, useEffect, useMemo for state management
- **Next.js App Router** - Server-side rendering with client components
- **Responsive CSS** - Mobile-first design with Tailwind classes

### Data Structure
```typescript
interface ExcellenceLocation {
  id: string;
  name: string;
  category: 'international-model' | 'australian-framework' | 'research-source';
  type: 'global-insight' | 'best-practice' | 'research';
  description: string;
  coordinates: { lat: number; lng: number };
  country: string;
  city?: string;
  state?: string;
  keyStats: string[];
  tags: string[];
  detailUrl: string; // Links back to CoE pages
  externalUrl?: string;
  featured?: boolean;
}
```

### Performance Optimizations
- **useMemo** for filtered results (prevents unnecessary recalculations)
- **Map reference** with useRef (single map instance)
- **Marker pooling** (remove old markers before adding new)
- **Lazy loading** (map only loads when user visits page)
- **Multiple style fallbacks** (works even if CDN unavailable)

## URLs and Navigation

### New URLs Created
- `/centre-of-excellence/map` - Main map page (new)

### Existing URLs Enhanced
- `/centre-of-excellence` - Added "Global Excellence Map" button
- `/centre-of-excellence/research` - Added map link button
- `/centre-of-excellence/global-insights` - Added map link button
- `/centre-of-excellence/best-practice` - Added map link button

### Deep Linking
All map markers link back to detail pages:
- International models → `/centre-of-excellence/global-insights#model-id`
- Australian frameworks → `/centre-of-excellence/best-practice#framework-id`
- Research sources → `/centre-of-excellence/research?jurisdiction=...`

## Benefits

### For Users
1. **Visual Discovery**: See global distribution of excellence at a glance
2. **Geographic Context**: Understand where models originated and succeeded
3. **Easy Comparison**: Compare international vs Australian approaches visually
4. **Quick Access**: Find nearest/relevant research sources by location
5. **Comprehensive View**: All excellence resources in one interactive map

### For JusticeHub
1. **Positioning as Authority**: Demonstrates comprehensive global knowledge
2. **Engagement**: Interactive features increase time on site
3. **Discoverability**: Users find resources they wouldn't search for directly
4. **Professional Presentation**: Maps add credibility and sophistication
5. **Expandable**: Easy to add more locations as research/models added

## Future Enhancements (Optional)

1. **Service Integration**: Link map to actual services from Service Finder
2. **Training Locations**: Add purple markers for training hubs when launched
3. **Journey Pathways**: Show "learning journeys" connecting related models
4. **Filters by Outcome**: Filter by recidivism rate, cost, cultural approach
5. **Print View**: Export map view as PDF for reports/presentations
6. **Stories Layer**: Overlay case studies at specific locations
7. **Timeline Slider**: Show how models evolved over time (1991-2025)

## Testing the Map

### To View
1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000/centre-of-excellence/map`

### To Test
1. **Search**: Type "Aboriginal" → should show NSW Koori Court and WA programs
2. **Filter**: Click "International Models" → should show 6 blue markers
3. **Focus**: Click any location card "Focus" button → map should zoom to location
4. **Popup**: Click any map marker → popup with stats should appear
5. **Links**: Click "View Details →" in popup → should navigate to detail page
6. **Reset**: Click "Reset" button → should clear all filters and search
7. **Mobile**: Resize browser to mobile → should remain functional

## Files Modified

### New Files
1. `/src/content/excellence-map-locations.ts` - Geographic data (266 lines)
2. `/src/app/centre-of-excellence/map/page.tsx` - Map page component (610 lines)
3. `/CENTRE_OF_EXCELLENCE_MAP.md` - This documentation

### Modified Files
1. `/src/app/centre-of-excellence/page.tsx` - Added "Global Excellence Map" button
2. `/src/app/centre-of-excellence/research/page.tsx` - Added map link
3. `/src/app/centre-of-excellence/global-insights/page.tsx` - Added map link
4. `/src/app/centre-of-excellence/best-practice/page.tsx` - Added map link

## Summary

The Centre of Excellence now has a fully functional, interactive global map that:
- ✅ Displays all international models, Australian frameworks, and research sources
- ✅ Provides search and filtering capabilities
- ✅ Links to all existing CoE pages with deep linking
- ✅ Works on mobile and desktop
- ✅ Uses existing MapLibre GL library (no new dependencies)
- ✅ Follows JusticeHub's design language (black borders, bold typography)
- ✅ Accessible from all CoE pages with prominent buttons

The map makes it incredibly simple to explore global youth justice excellence geographically, compare approaches across jurisdictions, and discover research sources - exactly what you requested.
