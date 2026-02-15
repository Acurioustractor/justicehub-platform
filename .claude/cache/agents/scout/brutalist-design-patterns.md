# Brutalist Design System Exploration Report
Generated: 2026-01-18

## Summary
JusticeHub uses a "white brutalist" design system characterized by stark contrasts, heavy borders, bold typography, and minimal decoration. The aesthetic communicates truth and directness through simple, uncompromising design choices.

---

## 1. Standard Background Classes

### Primary Backgrounds
✓ VERIFIED in `src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/services/page.tsx`

```tsx
// Pure white (default/primary)
className="bg-white"

// Light gray (subtle variation)
className="bg-gray-50"

// Black sections (high contrast)
className="bg-black"

// Special gradients (limited use)
className="bg-gradient-to-br from-blue-50 to-purple-50"
className="bg-gradient-to-r from-green-50 to-blue-50"
```

### Pattern Analysis
- **Default**: `bg-white` for main content
- **Alternating sections**: `bg-gray-50` for visual separation
- **Emphasis sections**: `bg-black` with white text
- **Feature highlights**: Gradient backgrounds (blue-50, purple-50, green-50)

---

## 2. Border Patterns

### Core Border System
✓ VERIFIED across all marketing pages

```tsx
// Standard heavy borders
className="border-2 border-black"

// Section separators
className="border-t-2 border-black"
className="border-b-2 border-black"

// Inner grid borders
className="border-l-8 border-orange-600"  // Accent borders
className="border-l-4 border-black pl-6"  // Quotation style

// Complex grids with all borders
className="border-2 border-black"  // Container
className="border-r-2 border-black"  // Grid items
className="border-b-2 border-black"
```

### Brutalist Shadow Pattern
✓ VERIFIED in `src/app/page.tsx:383`

```tsx
// Signature shadow (creates "pop-out" effect)
className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
```

This is the **key brutalist signature** - a hard, offset shadow that creates depth without blur.

---

## 3. Text Color Patterns

### Text Hierarchy
✓ VERIFIED in `src/app/globals.css` and page implementations

```tsx
// Primary text (default)
className="text-black"

// Secondary/muted text
className="text-gray-600"
className="text-gray-700"

// White text on black backgrounds
className="text-white"

// Accent colors (semantic)
className="text-blue-800"    // Info/links
className="text-orange-600"  // Warning/detention stats
className="text-green-600"   // Success/positive outcomes
className="text-red-600"     // Critical/urgent
className="text-purple-700"  // Premium/ALMA features
```

### Typography Classes (from globals.css)
✓ VERIFIED in `src/app/globals.css:434-463`

```css
.headline-truth {
  @apply text-4xl md:text-6xl font-bold leading-tight;
}

.body-truth {
  @apply text-lg md:text-xl leading-relaxed max-w-3xl;
}

.hero-stat {
  @apply font-mono text-6xl md:text-8xl font-bold leading-none;
}
```

---

## 4. Card & Section Styling Patterns

### Data Card Pattern
✓ VERIFIED in `src/app/globals.css:225-227` and throughout pages

```tsx
// Standard data card
className="data-card"
// Expands to: border-2 border-black p-6 bg-white text-black

// Example usage from homepage (line 177):
<div className="data-card text-center">
  <div className="flex justify-center mb-4">
    <Target className="h-8 w-8 text-black" />
  </div>
  <div className="font-mono text-4xl font-bold mb-2">624</div>
  <p className="text-lg font-bold mb-1">Programs Documented</p>
</div>
```

### Card Variations
✓ VERIFIED in `src/app/page.tsx`

```tsx
// Accent border cards (homepage line 122-137)
<div className="data-card bg-orange-50 border-l-8 border-orange-600 text-center">
  <div className="font-mono text-6xl font-bold text-orange-600 mb-4">15.5%</div>
  <h3 className="text-xl font-bold mb-2">DETENTION SUCCESS RATE</h3>
  <p className="text-gray-700">84.5% reoffend within 12 months</p>
  <div className="mt-4 bg-orange-600 text-white py-2 px-4 font-bold">
    SYSTEM FAILURE
  </div>
</div>

// Grid with borders (homepage line 268-307)
<div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-white">
  <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-white">
    {/* Content */}
  </div>
</div>
```

### Justice Grid Pattern
✓ VERIFIED in `src/app/globals.css:263-269` and `src/app/page.tsx:318`

```tsx
// Creates bordered grid layout
className="justice-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Expands to:
// .justice-grid {
//   @apply grid gap-0 border-t border-l border-black;
// }
// .justice-grid > * {
//   @apply border-r border-b border-black;
// }
```

---

## 5. Shared Layout Components

### Container System
✓ VERIFIED in `src/app/globals.css:409-420`

```css
/* Main container */
.container-justice {
  @apply max-w-7xl mx-auto px-4 md:px-6 lg:px-8;
}

/* Section spacing */
.section-padding {
  @apply py-16 md:py-24;
}

/* Header offset (accounts for fixed nav) */
.header-offset {
  @apply pt-52 md:pt-56;
}
```

### CTA Button Patterns
✓ VERIFIED in `src/app/globals.css:216-222`

```css
/* Primary CTA */
.cta-primary {
  @apply bg-black text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-accent transition-colors duration-200;
}

/* Secondary CTA */
.cta-secondary {
  @apply border-2 border-black text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-200;
}
```

Example usage:
```tsx
<Link href="/services" className="cta-primary">
  FIND HELP NOW
</Link>
<Link href="#truth" className="cta-secondary">
  SEE THE DATA
</Link>
```

---

## 6. Navigation Patterns

### Fixed Header
✓ VERIFIED in `src/components/navigation/MainNavigation.tsx:83-85`

```tsx
// Default navigation style
className="fixed top-0 left-0 right-0 w-full bg-white z-50 border-b-2 border-black"

// Transparent variant (not used on marketing pages)
className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200"
```

### Logo Treatment
✓ VERIFIED in `src/components/navigation/MainNavigation.tsx:117-124`

```tsx
<h1 className="text-2xl md:text-3xl font-black tracking-tighter">
  <span className="bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent">
    JUSTICE
  </span>
  <span className="text-black">
    HUB
  </span>
</h1>
```

---

## 7. Complete Component Patterns

### Feature Card with Icon
Pattern from about page (line 349-375):

```tsx
<div className="p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
  <Brain className="h-10 w-10 text-purple-700 mb-4" />
  <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-black">
    ALMA Intelligence
  </h3>
  <p className="mb-4 text-black font-medium text-sm">
    AI-powered research assistant with 1,000+ interventions
  </p>
  <div className="space-y-2 text-xs">
    <div className="flex items-center gap-2">
      <Database className="h-3 w-3 text-purple-700" />
      <span className="text-black">Evidence-based recommendations</span>
    </div>
  </div>
  <Link href="/intelligence" className="text-purple-700 underline font-bold">
    Explore Intelligence Hub →
  </Link>
</div>
```

### Interactive Feature Tabs
Pattern from about page (line 284-297):

```tsx
<button
  onClick={() => setActiveScreenshot(feature.id)}
  className={`px-4 py-2 text-sm font-bold border-2 transition-all ${
    activeScreenshot === feature.id
      ? 'border-blue-800 bg-blue-800 text-white'
      : 'border-black hover:bg-black hover:text-white'
  }`}
>
  {feature.title}
</button>
```

### Stats Display
Pattern from homepage (line 177-194):

```tsx
<div className="data-card text-center">
  <div className="flex justify-center mb-4">
    <Target className="h-8 w-8 text-black" />
  </div>
  {statsLoading ? (
    <div className="font-mono text-4xl font-bold mb-2 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ) : (
    <div className="font-mono text-4xl font-bold mb-2">
      {stats?.programs_documented.toLocaleString() || '624'}
    </div>
  )}
  <p className="text-lg font-bold mb-1">Programs Documented</p>
  <p className="text-sm text-blue-800 font-medium">67% with outcomes data</p>
</div>
```

---

## 8. Key Design Principles

### Brutalist Philosophy
✓ INFERRED from pattern analysis across all files

1. **No Softness**: Hard edges, no rounded corners (radius: 0rem)
2. **Heavy Borders**: Always 2px minimum, black borders
3. **Bold Typography**: font-bold, uppercase, tight tracking
4. **High Contrast**: Black on white, no gray unless muted text
5. **Geometric Shadows**: Hard offset shadows, no blur
6. **Monospace Numbers**: font-mono for all statistics
7. **Truth Over Beauty**: Direct communication, no decoration

### Spacing System
```tsx
// Padding patterns
p-6     // Standard card padding
p-8     // Larger sections
px-8 py-4  // Button padding

// Margin patterns
mb-4    // Standard bottom margin
mb-8    // Section separation
mb-16   // Major section breaks
```

---

## 9. Color Palette

### Semantic Colors
✓ VERIFIED in `src/app/globals.css:8-43`

```css
--primary: 0 0% 0%;              /* Black */
--accent: 0 78% 44%;             /* Red #dc2626 */
--text-primary: 0 0% 0%;         /* #000000 */
--text-secondary: 0 0% 25%;      /* #404040 */
--text-muted: 0 0% 35%;          /* #595959 */
```

### Usage Patterns
- **Black** (`#000000`): Primary text, borders, backgrounds
- **White** (`#FFFFFF`): Backgrounds, inverse text
- **Gray-50** (`#F9FAFB`): Alternate section backgrounds
- **Gray-600/700**: Secondary text
- **Blue-800** (`#1E40AF`): Links, info, community programs
- **Orange-600** (`#EA580C`): Warnings, detention stats
- **Purple-700** (`#7E22CE`): ALMA AI features
- **Green-600** (`#16A34A`): Success indicators
- **Red-600** (`#DC2626`): Critical/urgent actions

---

## 10. Accessibility Features

### WCAG Compliance
✓ VERIFIED in `src/app/globals.css:271-363`

```css
/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  /* Shows on focus */
}

/* Focus states */
button:focus, a:focus {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .data-card {
    border-width: 3px;
  }
}
```

---

## 11. Quick Reference: Brutalist Classes Checklist

Use these patterns when building new pages:

### Sections
```tsx
<section className="section-padding border-t-2 border-black">
  <div className="container-justice">
    {/* Content */}
  </div>
</section>
```

### Cards
```tsx
<div className="data-card">
  <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">TITLE</h3>
  <p className="text-black">Description</p>
</div>
```

### CTAs
```tsx
<Link href="/path" className="cta-primary">PRIMARY ACTION</Link>
<Link href="/path" className="cta-secondary">SECONDARY ACTION</Link>
```

### Stats
```tsx
<div className="font-mono text-4xl font-bold mb-2 text-black">624</div>
<p className="text-lg font-bold mb-1">Label</p>
<p className="text-sm text-gray-600">Context</p>
```

### Grids
```tsx
<div className="justice-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div className="p-8">{/* Content */}</div>
</div>
```

---

## 12. Anti-Patterns (What NOT to Do)

❌ **Never use**:
- Rounded corners (`rounded-lg`, `rounded-md`)
- Soft shadows (`shadow-lg`, `shadow-md`)
- Gradient backgrounds on text (except logo)
- Thin borders (`border` without `-2`)
- Decorative elements
- Serif fonts

✓ **Always use**:
- Sharp corners (default)
- Hard shadows (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`)
- Solid backgrounds
- Heavy borders (`border-2`)
- Functional design
- Sans-serif fonts

---

## Files Referenced

| File | Purpose | Key Patterns |
|------|---------|--------------|
| `src/app/page.tsx` | Homepage | Hero, stats, data cards, justice grid |
| `src/app/about/page.tsx` | About page | Feature tabs, system overview |
| `src/app/services/page.tsx` | Services | Table view, filters, card grid |
| `src/app/globals.css` | Global styles | Core classes, typography, colors |
| `src/components/navigation/MainNavigation.tsx` | Header | Logo, nav, fixed positioning |

---

## Conclusion

The JusticeHub brutalist design system is **highly consistent** and **deliberately minimal**. Every design choice serves the mission of communicating truth without decoration. The system is:

1. **Accessible** - WCAG AAA contrast ratios
2. **Consistent** - Repeatable patterns across pages
3. **Bold** - Heavy borders, stark contrasts
4. **Functional** - No decoration without purpose
5. **Responsive** - Mobile-first with breakpoints

**For new pages**: Copy section patterns from homepage/about page, use utility classes from globals.css, and maintain the 2px black border standard.
