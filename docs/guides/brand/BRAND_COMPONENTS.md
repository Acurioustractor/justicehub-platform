# JusticeHub Brand Components Guide

## Overview
This document provides implementation guides for all brand-aligned components following the JusticeHub design system.

## Core Principles
1. **ONE Design System**: White/black brutalist across the entire site
2. **Consistency**: Same brand voice, colors, and components everywhere
3. **Accessibility First**: WCAG AAA compliance on all components
4. **Performance**: Next.js Image optimization, lazy loading
5. **Brand Voice**: Direct, uncompromising, evidence-based

## Brand Design System

**Colors**:
- Background: White (`bg-white`)
- Text: Black (`text-black`)
- Borders: Black 2px (`border-2 border-black`)
- Accents: Red (#dc2626) for CTAs and highlights, Green (#16a34a) for success

**Typography**:
- Headings: Inter font family, bold, high contrast
- Body: Inter font family, regular
- Stats: IBM Plex Mono font family, bold
- Utility classes: `.headline-truth`, `.body-truth`

**Components**:
- Black 2px borders on all cards and containers
- No rounded corners (brutalist aesthetic)
- High contrast white/black
- Minimal use of color (red, green for specific meanings only)

---

## Image Components

### ImageGallery
**Purpose**: Display collections of images with lightbox functionality
**File**: `/src/components/ImageGallery.tsx`

#### Usage
```tsx
import ImageGallery from '@/components/ImageGallery';

<ImageGallery
  images={[
    {
      src: "/images/program-1.jpg",
      alt: "Community program in action",
      caption: "Groote Eylandt Youth Program",
      credit: "ACT Photography"
    },
    // ... more images
  ]}
  columns={3}
/>
```

#### Props
- `images`: Array of {src, alt, caption?, credit?}
- `columns`: 2 | 3 | 4 (default: 3)

#### Features
- ✅ Brutalist grid with black 2px borders
- ✅ Hover overlay with captions (black background, white text)
- ✅ Full-screen lightbox with navigation
- ✅ Keyboard accessible (ESC to close, arrows to navigate)
- ✅ Responsive breakpoints
- ✅ Next.js Image optimization

---

### FeaturedVideo
**Purpose**: Embed videos with brand-aligned player interface
**File**: `/src/components/FeaturedVideo.tsx`

#### Usage
```tsx
import FeaturedVideo from '@/components/FeaturedVideo';

<FeaturedVideo
  videoUrl="https://www.youtube.com/watch?v=VIDEO_ID"
  title="Community Justice in Action"
  description="See how Bourke's Maranguka program achieved 45% reduction in youth detention"
  thumbnailUrl="/images/video-thumb.jpg"
/>
```

#### Props
- `videoUrl`: YouTube, Vimeo, or direct video file URL
- `title`: Video title (required)
- `description`: Optional description text
- `thumbnailUrl`: Custom thumbnail (auto-generated if not provided)
- `autoplay`: boolean (default: false)

#### Features
- ✅ YouTube & Vimeo support
- ✅ Direct video file support
- ✅ Custom thumbnails with white play button (hovers to red)
- ✅ Black 2px border container
- ✅ White text on black background for title/description
- ✅ Responsive aspect ratio (16:9)
- ✅ Accessibility labels

---

### ProfileCard
**Purpose**: Display user/contributor profiles
**File**: `/src/components/ProfileCard.tsx`

#### Usage
```tsx
import ProfileCard from '@/components/ProfileCard';

<ProfileCard
  profile={{
    id: "user-123",
    name: "Aunty Margaret Wilson",
    preferred_name: "Aunty Margaret",
    bio: "Yolngu Elder and community advocate...",
    profile_picture_url: "/images/profiles/aunty-margaret.jpg",
    organization: { name: "Community Justice Network" }
  }}
  role="Elder"
  isFeatured={true}
  culturalWarning="This story contains references to deceased persons"
  showLink={true}
/>
```

#### Props
- `profile`: EmpathyLedgerProfile object
- `role`: Optional role/title string
- `storyExcerpt`: Alternative to bio
- `isFeatured`: Adds featured badge
- `culturalWarning`: Displays cultural sensitivity notice (amber styling)
- `showLink`: Shows "Read full story" link

#### Features
- ✅ Next.js Image for profile photos
- ✅ Gradient fallback when no photo
- ✅ Cultural warnings with amber alert styling
- ✅ Links to Empathy Ledger profiles
- ✅ Responsive text truncation
- ✅ Black 2px border

---

## Layout Components

### Header Spacing
**Problem**: Fixed navigation can overlap hero content
**Solution**: Use provided utility classes

```tsx
// Pages WITH Navigation component
<main className="page-content">
  {/* Content has automatic top padding */}
</main>

// Hero sections specifically
<section className="min-h-screen header-offset">
  {/* Hero content won't overlap with nav */}
</section>
```

#### Available Classes
- `.page-content`: 192px top padding (desktop), 176px (mobile)
- `.header-offset`: pt-52 (desktop), pt-56 (mobile)

#### When to Use
- ✅ Use on pages with `<Navigation />` component
- ❌ Don't use on scrollytelling pages (full-screen design)

---

## Page Templates

### Standard Page with Navigation
```tsx
import { Navigation, Footer } from '@/components/ui/navigation';

export default function StandardPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="page-content">
        {/* Hero */}
        <section className="min-h-screen header-offset">
          <div className="container-justice text-center">
            <h1 className="headline-truth">Your Truth</h1>
            <p className="body-truth">No filter, just facts</p>
            <Link href="/action" className="cta-primary">
              TAKE ACTION
            </Link>
          </div>
        </section>

        {/* Content sections */}
        <section className="section-padding border-t-2 border-black">
          {/* ... */}
        </section>
      </main>

      <Footer />
    </div>
  );
}
```

### Scrollytelling Page (No Navigation)
```tsx
export default function ScrollytellingPage() {
  return (
    <main className="bg-white text-black min-h-screen">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-gray-200 z-50 border-b-2 border-black">
        <div className="h-full bg-black transition-all duration-300" style={{ width: '50%' }} />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center border-b-2 border-black">
        <div className="container-justice text-center py-20">
          <h1 className="headline-truth mb-8">
            The Pattern<br />
            That Changed<br />
            Everything
          </h1>
        </div>
      </section>

      {/* Scrollytelling sections */}
      {/* ... */}

      {/* Footer Navigation */}
      <div className="py-12 px-4 border-t-2 border-black">
        <Link href="/stories" className="text-gray-600 hover:text-black">
          ← Back to Stories
        </Link>
      </div>
    </main>
  );
}
```

### Intelligence/Data Page
```tsx
export default function IntelligencePage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="headline-truth mb-4">
            ALMA Intelligence Studio
          </h1>
          <p className="body-truth max-w-3xl">
            Real-time media sentiment tracking, program analysis, and evidence-based insights.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="border-2 border-black p-6 bg-white">
            <div className="text-3xl mb-2">📰</div>
            <div className="text-3xl font-bold mb-1">37</div>
            <div className="text-sm uppercase tracking-wider text-gray-600 font-bold">
              Articles
            </div>
          </div>
          {/* More stat cards */}
        </div>
      </div>
    </main>
  );
}
```

---

## Brand Checklist

Before shipping any page/component:

### Visual Brand
- [ ] White background (`bg-white`)
- [ ] Black text (`text-black`)
- [ ] Black 2px borders on all cards (`border-2 border-black`)
- [ ] No rounded corners
- [ ] Typography follows hierarchy (Inter for body, IBM Plex Mono for stats)
- [ ] CTAs use `.cta-primary` or `.cta-secondary`
- [ ] Minimal color use (red for CTAs, green for success only)
- [ ] Proper spacing (`.section-padding`, `.container-justice`)

### Accessibility
- [ ] Color contrast ≥ 7:1 (AAA)
- [ ] All images have alt text
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader tested
- [ ] Skip links on pages with navigation

### Performance
- [ ] Using Next.js `<Image>` component
- [ ] Proper `sizes` attribute on images
- [ ] Lazy loading for below-fold content
- [ ] No layout shift on load

### Brand Voice
- [ ] Direct, uncompromising language
- [ ] Data-driven claims with sources
- [ ] No inspirational quotes or soft language
- [ ] Action-oriented CTAs (uppercase)

---

## Examples in Production

### Homepage
- Path: `/src/app/page.tsx`
- Style: White/black brutalist
- Features: Rotating stats, data cards, black borders

### Pattern Story (Scrollytelling)
- Path: `/src/app/stories/the-pattern/PatternStory.tsx`
- Style: White/black brutalist with scrollytelling
- Features: Progress bar, full-screen sections, brutalist stat cards

### ALMA Intelligence
- Path: `/src/app/stories/intelligence/page.tsx`
- Style: White/black brutalist with data visualizations
- Features: Real-time data, sentiment charts, topic bursts, black-bordered stat cards

### Gallery Page
- Path: `/src/app/gallery/page.tsx`
- Style: White/black brutalist
- Features: ImageGallery and FeaturedVideo components

### Community Programs
- Path: `/src/app/community-programs/page.tsx`
- Style: White/black brutalist
- Features: Program cards, video showcases, image galleries

---

## Next.js Image Configuration

Ensure `next.config.js` allows external image domains:

```js
module.exports = {
  images: {
    domains: [
      'empathy-ledger.vercel.app',
      // Add other image hosts
    ],
  },
}
```

---

## Component File Structure

```
src/
├── components/
│   ├── ImageGallery.tsx          # Brand-aligned image galleries
│   ├── FeaturedVideo.tsx          # Branded video player
│   ├── ProfileCard.tsx            # User profile cards
│   ├── FeaturedStories.tsx        # Story cards
│   ├── visualizations/            # D3 data viz
│   │   ├── SentimentTimeline.tsx
│   │   └── TopicBurst.tsx
│   └── ui/
│       └── navigation.tsx         # Site navigation
├── app/
│   ├── page.tsx                   # Homepage
│   ├── stories/
│   │   ├── the-pattern/           # Scrollytelling
│   │   ├── intelligence/          # Data viz page
│   │   └── page-content.tsx       # Stories listing
│   ├── gallery/                   # Image/video gallery
│   ├── community-programs/        # Programs page
│   ├── intelligence/              # Intelligence hub
│   └── globals.css                # Design system CSS
└── .claude/
    └── skills/
        └── justicehub-brand-design/
            └── SKILL.md            # Brand guidelines
```

---

## Common Patterns

### Stat Cards
```tsx
<div className="border-2 border-black p-6 bg-white">
  <div className="font-mono text-6xl font-bold text-green-600">95%</div>
  <h3 className="text-xl font-bold mt-2">SUCCESS RATE</h3>
  <p className="text-gray-700 mt-1">Community programs</p>
</div>
```

### Data Comparison
```tsx
<div className="grid md:grid-cols-2 gap-12">
  {/* Failure */}
  <div className="bg-orange-50 border-l-8 border-orange-600 p-6">
    <div className="text-6xl font-mono font-bold text-orange-600">15.5%</div>
    <h3 className="font-bold text-xl">DETENTION SUCCESS</h3>
    <p>84.5% reoffend</p>
  </div>

  {/* Success */}
  <div className="bg-green-50 border-l-8 border-green-600 p-6">
    <div className="text-6xl font-mono font-bold text-green-600">95%</div>
    <h3 className="font-bold text-xl">COMMUNITY SUCCESS</h3>
    <p>Cultural programs work</p>
  </div>
</div>
```

### Section Headers
```tsx
<section className="section-padding border-t-2 border-black">
  <div className="container-justice">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
      SECTION TITLE
    </h2>
    {/* Content */}
  </div>
</section>
```

### CTAs
```tsx
{/* Primary CTA - Red background */}
<Link href="/action" className="cta-primary">
  TAKE ACTION
</Link>

{/* Secondary CTA - White background, black border */}
<Link href="/learn" className="cta-secondary">
  LEARN MORE
</Link>
```

---

## Support

For questions about brand implementation:
1. Review `.claude/skills/justicehub-brand-design/SKILL.md`
2. Check `src/app/globals.css` for design tokens
3. Reference `src/app/page.tsx` for homepage examples
4. Reference `src/app/stories/the-pattern/PatternStory.tsx` for scrollytelling patterns
5. Use the `justicehub-brand-design` Claude skill for audits
