# Services Page Improvements Plan

## Current Issues
1. **Limited category filtering**: Only 8 categories shown, but database has 14 categories
2. **No live map**: Users can't visually explore services by location
3. **Basic filtering**: Missing advanced filters like radius search, multi-category selection
4. **Generic UI**: Could be more specific to youth justice context

## Proposed Improvements

### 1. Enhanced Category System ✅

Update categories to match our actual 14 database categories:

```typescript
const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: Target, color: '#6b7280' },
  { id: 'mental_health', label: 'Mental Health', icon: Heart, color: '#8b5cf6' },
  { id: 'housing', label: 'Housing Support', icon: Home, color: '#f59e0b' },
  { id: 'legal_aid', label: 'Legal Aid', icon: Scale, color: '#3b82f6' },
  { id: 'advocacy', label: 'Rights Advocacy', icon: Megaphone, color: '#10b981' },
  { id: 'cultural_support', label: 'Cultural Support', icon: Users, color: '#ef4444' },
  { id: 'family_support', label: 'Family Services', icon: Users2, color: '#ec4899' },
  { id: 'education_training', label: 'Education & Training', icon: GraduationCap, color: '#6366f1' },
  { id: 'court_support', label: 'Court & Diversion', icon: Gavel, color: '#3b82f6' },
  { id: 'substance_abuse', label: 'Substance Support', icon: HeartPulse, color: '#8b5cf6' },
  { id: 'employment', label: 'Employment', icon: Briefcase, color: '#10b981' },
  { id: 'health', label: 'Health Services', icon: Activity, color: '#8b5cf6' },
  { id: 'disability_support', label: 'Disability Support', icon: Accessibility, color: '#f59e0b' },
  { id: 'recreation', label: 'Recreation & Arts', icon: Palette, color: '#10b981' },
  { id: 'life_skills', label: 'Life Skills', icon: BookOpen, color: '#6366f1' }
];
```

### 2. Live Interactive Map ✅ CREATED

**Component**: `/src/components/ServicesMap.tsx`

**Features**:
- MapLibre GL for interactive mapping
- Color-coded markers by category
- Popups on hover showing service details
- Click to select service
- Fly-to animation for selected services
- Legend showing category colors
- Navigation controls (zoom, rotate)
- Fullscreen mode

**Integration**:
```tsx
import { ServicesMap } from '@/components/ServicesMap';

// Add to services page
<ServicesMap
  services={filteredServicesWithCoordinates}
  selectedService={selectedService}
  onServiceClick={(service) => setSelectedService(service)}
/>
```

### 3. Advanced Filtering

**Multi-Category Selection**:
```tsx
const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);

// Toggle category
const toggleCategory = (categoryId: string) => {
  if (categoryId === 'all') {
    setSelectedCategories(['all']);
  } else {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId && c !== 'all')
      : [...selectedCategories.filter(c => c !== 'all'), categoryId];
    setSelectedCategories(newCategories.length === 0 ? ['all'] : newCategories);
  }
};
```

**Radius Search** (requires geocoding):
```tsx
const [searchRadius, setSearchRadius] = useState<number>(25); // km
const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

// Get user location
const getUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  }
};

// Filter by radius
const withinRadius = (serviceLat: number, serviceLng: number) => {
  if (!userLocation) return true;
  const distance = calculateDistance(
    userLocation.lat, userLocation.lng,
    serviceLat, serviceLng
  );
  return distance <= searchRadius;
};
```

### 4. Better UI/UX

**Sticky Filters**:
```tsx
<div className="sticky top-20 z-40 bg-white border-b-2 border-black shadow-lg">
  {/* Filters always visible while scrolling */}
</div>
```

**Results Counter with Context**:
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h3 className="text-2xl font-bold">{filteredServices.length} Services Found</h3>
    <p className="text-sm text-gray-600 mt-1">
      {selectedCategories.length > 1 ?
        `Showing ${selectedCategories.join(', ')} services` :
        'Showing all services'
      }
      {selectedState !== 'all' && ` in ${selectedState}`}
      {userLocation && ` within ${searchRadius}km`}
    </p>
  </div>
  <div className="flex gap-2">
    <button onClick={() => setViewMode('cards')}>Cards</button>
    <button onClick={() => setViewMode('table')}>Table</button>
    <button onClick={() => setViewMode('map')}>Map</button>
  </div>
</div>
```

**Improved Category Pills**:
```tsx
<div className="flex flex-wrap gap-3">
  {CATEGORIES.map((category) => {
    const Icon = category.icon;
    const isSelected = selectedCategories.includes(category.id);
    return (
      <button
        key={category.id}
        onClick={() => toggleCategory(category.id)}
        className={`
          flex items-center gap-2 px-4 py-3 border-2 border-black
          font-bold transition-all
          ${isSelected
            ? 'bg-black text-white'
            : 'hover:bg-gray-100'
          }
        `}
        style={isSelected ? {
          backgroundColor: category.color,
          borderColor: category.color,
          color: 'white'
        } : {}}
      >
        <Icon className="h-5 w-5" />
        <span>{category.label}</span>
        {isSelected && category.id !== 'all' && (
          <X className="h-4 w-4 ml-1" />
        )}
      </button>
    );
  })}
</div>
```

### 5. Map View Mode

**Three View Modes**:
1. **Cards**: Current grid view
2. **Table**: Current table view
3. **Map**: NEW - Full-width map with service markers

```tsx
{viewMode === 'map' && (
  <div className="h-[800px] w-full">
    <ServicesMap
      services={filteredServicesWithCoordinates}
      selectedService={selectedService}
      onServiceClick={(service) => {
        setSelectedService(service);
        // Open service details sidebar
      }}
    />
  </div>
)}
```

**Split View Option**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Left: Service List */}
  <div className="space-y-4 overflow-y-auto max-h-[800px]">
    {filteredServices.map(service => (
      <ServiceCard
        key={service.id}
        service={service}
        onClick={() => setSelectedService(service)}
        isSelected={selectedService?.id === service.id}
      />
    ))}
  </div>

  {/* Right: Map */}
  <div className="sticky top-24 h-[800px]">
    <ServicesMap
      services={filteredServicesWithCoordinates}
      selectedService={selectedService}
      onServiceClick={setSelectedService}
    />
  </div>
</div>
```

### 6. Smart Search

**Category-Aware Search**:
```tsx
const searchServices = (query: string) => {
  const lowerQuery = query.toLowerCase();

  // Check if query matches category names
  const matchingCategory = CATEGORIES.find(c =>
    c.label.toLowerCase().includes(lowerQuery)
  );

  if (matchingCategory) {
    setSelectedCategories([matchingCategory.id]);
  }

  // Standard search
  return services.filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.description.toLowerCase().includes(lowerQuery) ||
    s.categories.some(c => c.toLowerCase().includes(lowerQuery))
  );
};
```

**Search Suggestions**:
```tsx
const SEARCH_SUGGESTIONS = [
  'mental health crisis',
  'housing support brisbane',
  'legal aid for youth',
  'cultural programs',
  'bail support',
  'detention alternatives',
  'family counseling',
  'drug and alcohol support'
];
```

### 7. Service Density Heatmap

**Show service coverage**:
```tsx
// Add heatmap layer to map
map.current.addLayer({
  id: 'service-heatmap',
  type: 'heatmap',
  source: 'services',
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': 1,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0,0,255,0)',
      0.2, 'rgba(0,255,255,0.5)',
      0.4, 'rgba(0,255,0,0.7)',
      0.6, 'rgba(255,255,0,0.8)',
      0.8, 'rgba(255,128,0,0.9)',
      1, 'rgba(255,0,0,1)'
    ],
    'heatmap-radius': 30
  }
});
```

### 8. Export & Share

**Export Search Results**:
```tsx
const exportResults = () => {
  const csv = filteredServices.map(s =>
    `"${s.name}","${s.description}","${s.location.city}","${s.contact.phone}"`
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'justicehub-services.csv';
  a.click();
};
```

**Share Search URL**:
```tsx
const shareSearch = () => {
  const params = new URLSearchParams({
    categories: selectedCategories.join(','),
    state: selectedState,
    query: searchQuery
  });
  const url = `${window.location.origin}/services?${params}`;
  navigator.clipboard.writeText(url);
  // Show toast: "Link copied!"
};
```

## Implementation Priority

### Phase 1: Essential (This Week)
1. ✅ Create ServicesMap component
2. Update category system to use all 14 categories
3. Add multi-category selection
4. Add map view mode
5. Improve category pill UI with colors

### Phase 2: Enhanced (Next Week)
1. Add geocoding for addresses (convert city/state to lat/lng)
2. Implement radius search
3. Add split view (list + map)
4. Sticky filters
5. Better search suggestions

### Phase 3: Advanced (Future)
1. Service density heatmap
2. Export/share functionality
3. Save favorite services
4. Compare services side-by-side
5. Mobile-optimized map interactions

## Required Dependencies

```bash
npm install maplibre-gl
npm install @types/maplibre-gl --save-dev
```

Already installed in project ✅

## Geocoding Strategy

For services without lat/lng coordinates:

1. **OpenCage Geocoder** (free tier: 2,500 requests/day)
   ```typescript
   const geocode = async (city: string, state: string) => {
     const response = await fetch(
       `https://api.opencagedata.com/geocode/v1/json?q=${city},${state},Australia&key=${API_KEY}`
     );
     const data = await response.json();
     return data.results[0]?.geometry;
   };
   ```

2. **Batch Geocoding Script**:
   ```typescript
   // src/scripts/geocode-services.ts
   // Run once to add coordinates to all services
   ```

3. **Progressive Enhancement**:
   - Show services on map that have coordinates
   - Queue services without coordinates for background geocoding
   - Update map as coordinates become available

## Database Schema Update

Add coordinates to services table:

```sql
ALTER TABLE services
ADD COLUMN location_latitude DECIMAL(10, 8),
ADD COLUMN location_longitude DECIMAL(11, 8),
ADD COLUMN location_geocoded_at TIMESTAMP;

CREATE INDEX idx_services_location ON services(location_latitude, location_longitude);
```

## Testing Checklist

- [ ] All 14 categories display correctly
- [ ] Map loads for services with coordinates
- [ ] Markers are color-coded by category
- [ ] Clicking marker shows popup
- [ ] Selecting service flies map to location
- [ ] Multi-category filter works
- [ ] Radius search filters correctly
- [ ] Mobile responsive (map + filters)
- [ ] Accessibility (keyboard navigation)
- [ ] Performance (1000+ services load quickly)

## Next Steps

1. **Add geocoding**: Run batch script to add lat/lng to all services
2. **Update services page**: Integrate ServicesMap component
3. **Test with real data**: Use 511 services in database
4. **Optimize performance**: Cluster markers when zoomed out
5. **Add analytics**: Track which categories/locations are most searched

---

**Status**: ServicesMap component created ✅
**Next**: Integrate into services page and add geocoding
