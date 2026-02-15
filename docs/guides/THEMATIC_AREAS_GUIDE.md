# Thematic Areas Guide

## Overview

Thematic Areas provide a cross-cutting lens for understanding youth justice. Rather than organizing information by service type or location alone, themes highlight the interconnected issues that shape young people's pathways through the justice system.

## Current Themes

| Theme | ID | Key Stat | Focus |
|-------|-----|----------|-------|
| **Disability** | `disability` | 60-80% | Cognitive impairment, FASD, neurodevelopmental differences |
| Health | `health` | 70-88% | Mental health, substance use, trauma |
| Marginalised Groups | `marginalised` | 23x | Indigenous, LGBTQIA+, refugee backgrounds |
| Housing | `housing` | 13% | Homelessness, housing instability |
| Education | `education` | 50%+ | School exclusion, disengagement |
| Culture | `culture` | 92% | Cultural connection, Indigenous-led approaches |

## File Structure

```
src/app/themes/
├── page.tsx                 # Thematic hub page
├── disability/
│   └── page.tsx            # Detailed disability theme page
└── [future-themes]/
    └── page.tsx

src/components/
└── thematic-section.tsx     # Reusable thematic components

compendium/stories/
└── disability-youth-justice-hidden-epidemic.md  # Research content
```

## URL Structure

- `/themes` - Hub page with all themes
- `/themes/disability` - Individual theme page
- Future: `/themes/health`, `/themes/housing`, etc.

## Components

### ThematicSection

Reusable component for embedding thematic content anywhere on the site.

```tsx
import { ThematicSection } from '@/components/thematic-section';

// Full featured section with highlighted theme
<ThematicSection 
  variant="full" 
  featuredTheme="disability" 
/>

// Compact grid of all themes
<ThematicSection 
  variant="compact" 
  showStats={true}
/>

// Horizontal navigation banner
<ThematicSection 
  variant="banner" 
/>
```

### ThemeCard

Individual theme card for custom layouts:

```tsx
import { ThemeCard } from '@/components/thematic-section';

<ThemeCard themeId="disability" variant="featured" />
<ThemeCard themeId="health" variant="compact" />
```

## Adding a New Theme

1. **Update themes array** in `src/components/thematic-section.tsx`:
```typescript
const themes = [
  // ... existing themes
  {
    id: 'new_theme',
    title: 'New Theme',
    icon: IconComponent,
    color: 'ochre', // or 'eucalyptus', 'sand'
    stat: 'XX%',
    description: 'Brief description of the theme',
  },
];
```

2. **Create theme page** at `src/app/themes/[theme-id]/page.tsx`

3. **Add navigation entry** in `src/config/navigation.ts`

4. **Create research content** in `compendium/stories/` if applicable

## Content Guidelines

### Theme Pages Should Include:

1. **Hero section** with theme-specific statistics
2. **Problem statement** explaining the justice intersection
3. **Types/categories** within the theme
4. **Pathway visualization** showing how this theme leads to justice involvement
5. **Services section** with relevant support categories
6. **Stories section** with lived experience content
7. **Related themes** cross-links
8. **Clear CTAs** to services and support

### Tone and Voice

- Evidence-based but accessible
- Center lived experience
- Avoid deficit framing
- Focus on systemic factors, not individual blame
- Include hope/connection to solutions

## Integration Points

### Homepage
Thematic section added after "What We Build" section:
```tsx
<ThematicSection variant="full" featuredTheme="disability" />
```

### Services Page
Thematic banner added before Quick Access Links:
```tsx
<ThematicSection variant="banner" />
```

### Stories Page
Compact thematic grid added before footer:
```tsx
<ThematicSection variant="compact" />
```

### Navigation
Thematic Areas added to Discover dropdown:
```typescript
{
  label: 'Thematic Areas',
  href: '/themes',
  description: 'Explore by disability, health, housing, and more'
}
```

## Research Content

Long-form research content lives in `compendium/stories/` and is linked from theme pages:

- `disability-youth-justice-hidden-epidemic.md` - Comprehensive research synthesis
- Future: `health-youth-justice.md`, `housing-youth-justice.md`, etc.

## Data Sources

Key data sources for theme statistics:

- **AIHW Youth Justice reports** - National statistics
- **Disability Royal Commission** - Progress tracking
- **State/territory youth justice data** - Jurisdiction-specific
- **Academic research** - Published studies
- **Lived experience** - Community-sourced insights

## Future Enhancements

### Planned Themes
- [ ] Gender & Justice (girls and young women)
- [ ] Family Violence (victimisation and perpetration)
- [ ] Geographic Isolation (remote/regional challenges)
- [ ] Care Experience (child protection to justice pipeline)
- [ ] Age Transitions (16-25 adult system crossover)

### Technical Enhancements
- [ ] Filter services by theme tags
- [ ] Theme-based content recommendations
- [ ] Thematic search filters
- [ ] Theme-specific service badges
- [ ] Interactive pathway visualizations

## Related Documentation

- [Site Map & Routes](./JUSTICEHUB_SITE_MAP_AND_ROUTES.md)
- [Youth Justice Filtering](./ALMA/YOUTH_JUSTICE_FILTERING.md)
- [Disability Service Mapping](./ALMA/DISABILITY_JUSTICE_SERVICE_MAPPING.md)
- [Adding Research Guide](../guides/ADDING_RESEARCH_GUIDE.md)

## Questions?

Contact the JusticeHub team or refer to the main [README](../../README.md).
