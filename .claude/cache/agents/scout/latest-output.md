# Admin & Stories Pages Inconsistency Report
Generated: 2026-01-20

## Executive Summary

Reviewed 5 key admin pages for inconsistencies. Found **12 critical issues** across broken links, UI pattern inconsistencies, missing functionality, and authentication/authorization differences.

---

## 1. BROKEN LINKS & NAVIGATION

### ✗ CRITICAL: stories/intelligence/page.tsx:305
```tsx
<Link href="/stories/the-pattern" className="inline-flex items-center...">
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back to Story
</Link>
```
**Issue:** Links to `/stories/the-pattern` which exists, but inconsistent - other pages use breadcrumb navigation back to `/admin`.

**Status:** Link works but pattern differs from admin pages.

---

### ✗ MEDIUM: admin/profiles/page.tsx:249
```tsx
<Link href={`/people/${profile.slug}/edit`} ...>
```
**Issue:** References `/people/[slug]/edit` route which EXISTS (verified at `/src/app/people/[slug]/edit/page.tsx`).

**Status:** ✓ VERIFIED - Route exists, no broken link.

---

### ✗ MEDIUM: admin/profiles/page.tsx:84,256
```tsx
<Link href="/admin/profiles/new" ...>
<Link href={`/admin/profiles/${profile.id}/connections`} ...>
```
**Issue:** References `/admin/profiles/new` and `/admin/profiles/[id]/connections` routes.

**Status:** 
- `/admin/profiles/new` - NOT FOUND in filesystem
- `/admin/profiles/[id]/connections/page.tsx` - ✓ VERIFIED EXISTS

---

### ✗ LOW: admin/programs/page.tsx:88,94
```tsx
<Link href={`/admin/programs/${program.id}`} ...>
<Link href={`/admin/programs/${program.id}/people`} ...>
```
**Issue:** References non-existent routes:
- `/admin/programs/[id]` - NOT FOUND
- `/admin/programs/[id]/people` - NOT FOUND

**Available routes:**
- `/admin/programs/page.tsx` (list)
- `/admin/programs/new/page.tsx` - NOT FOUND

**Status:** ✗ BROKEN - Edit and people management pages missing.

---

## 2. INCONSISTENT UI PATTERNS

### ✗ CRITICAL: Navigation Component Import Inconsistency

**Pattern 1 - Deprecated Import (stories/intelligence):**
```tsx
// src/app/stories/intelligence/page.tsx:6
import { createClient } from '@/lib/supabase/client';
// No Navigation component imported - uses inline header
```

**Pattern 2 - Modern Import (admin pages):**
```tsx
// src/app/admin/page.tsx:3
import { Navigation } from '@/components/ui/navigation';

// src/app/admin/organizations/page.tsx:3
import { Navigation, Footer } from '@/components/ui/navigation';
```

**Issue:** `stories/intelligence` page doesn't use the standard Navigation component, creates custom header. Admin pages consistently use `<Navigation />` component.

---

### ✗ MEDIUM: Header Styles Inconsistent

**stories/intelligence/page.tsx:302-319:**
```tsx
<div className="border-b-2 border-black">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="headline-truth mb-4">ALMA Intelligence Studio</h1>
```

**admin/page.tsx:207-218:**
```tsx
<div className="min-h-screen bg-gray-50 page-content">
  <Navigation />
  <div className="pt-8 pb-16">
    <div className="container-justice">
      <h1 className="text-4xl font-black text-black mb-2">Admin Dashboard</h1>
```

**Issue:** Different utility classes:
- Stories: `headline-truth`, `max-w-7xl`, `body-truth`
- Admin: `text-4xl font-black`, `container-justice`, `page-content`

---

### ✗ MEDIUM: Stats Card Implementations Differ

**stories/intelligence (inline component):**
```tsx
function StatCard({ label, value, icon, color = 'neutral' }: {...}) {
  return (
    <div className="border-2 border-black p-6 bg-white">
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-3xl font-bold mb-1 ${colorClasses[color]}`}>{value}</div>
```

**admin/page.tsx (inline stats):**
```tsx
stats.map((stat) => {
  const Icon = stat.icon;
  return (
    <Link href={stat.href} className="group relative bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]...">
      <div className={`inline-flex p-3 ${stat.bgColor} mb-4`}>
        <Icon className={`w-6 h-6 ${stat.textColor}`} />
```

**Issue:** Similar stats cards implemented differently:
- Stories: Custom `StatCard` component, emoji icons, not clickable
- Admin: Inline with Link wrapper, Lucide icons, clickable with hover effects

---

### ✗ LOW: Button Style Inconsistency

**stories/intelligence/page.tsx:290:**
```tsx
<button onClick={() => window.location.reload()} className="cta-primary">
  Retry
</button>
```

**admin/page.tsx:285-291:**
```tsx
<Link href="/signup" className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-100 transition-colors">
```

**Issue:**
- Stories uses `cta-primary` utility class (custom)
- Admin uses explicit Tailwind classes with color-coded borders

---

## 3. MISSING FUNCTIONALITY

### ✗ CRITICAL: admin/programs/page.tsx - No Edit/Manage Pages

**Line 88-98:** Links to non-existent routes:
```tsx
<Link href={`/admin/programs/${program.id}`}>Edit</Link>
<Link href={`/admin/programs/${program.id}/people`}>Manage People</Link>
```

**Status:** No implementation found for:
- Individual program edit page
- Program-to-people relationship management

**Contrast:** Organizations have full CRUD:
- `/admin/organizations/page.tsx` (list)
- `/admin/organizations/[slug]/page.tsx` (view)
- `/admin/organizations/[slug]/edit/page.tsx` (edit)
- `/admin/organizations/[slug]/storytellers/page.tsx` (relationships)

---

### ✗ MEDIUM: admin/profiles/page.tsx - Missing "Add Profile" Route

**Line 84:**
```tsx
<Link href="/admin/profiles/new">
  <UserPlus className="h-5 w-5" />
  Add Profile
</Link>
```

**Status:** Route does not exist in filesystem.

**Available:**
- List page: ✓ `/admin/profiles/page.tsx`
- View page: ✓ `/people/[slug]/page.tsx`
- Edit page: ✓ `/people/[slug]/edit/page.tsx`
- Connections: ✓ `/admin/profiles/[id]/connections/page.tsx`

**Missing:**
- `/admin/profiles/new/page.tsx`

---

### ✗ LOW: stories/intelligence - No Admin Link

**Issue:** Intelligence page has no navigation back to admin dashboard. All admin pages have breadcrumbs or "Back to Dashboard" links.

**Line 305:** Only links to `/stories/the-pattern`, not `/admin`.

---

## 4. HARDCODED DATA

### ✓ GOOD: stories/intelligence/page.tsx:82-129

**Has demo data fallback:**
```tsx
function useDemoData() {
  console.log('Using demo data');
  // Generate 30 days of demo sentiment data
  const demoSentimentData: DailySentiment[] = [];
  for (let i = 0; i < 30; i++) {
    // ... generates demo data
  }
}
```

**Called at line 146:**
```tsx
if (sentimentError) {
  console.error('Supabase error:', sentimentError);
  useDemoData();
  return;
}
```

**Status:** ✓ Intentional fallback for demo purposes, well-commented.

---

### ✓ GOOD: Admin Pages - All Dynamic

All admin pages (page.tsx, organizations, profiles, programs) use Supabase queries with no hardcoded fallbacks. Appropriate for admin interfaces.

---

## 5. AUTHENTICATION/AUTHORIZATION ISSUES

### ⚠️ INCONSISTENCY: Auth Check Patterns Differ

**Pattern A - Server Component (admin/page.tsx:8-25):**
```tsx
export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin');
  
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();
  
  if (!profileData?.is_super_admin) redirect('/');
```

**Pattern B - Client Component (stories/intelligence:1,132):**
```tsx
'use client';
// ... no auth check at all
export default function MediaIntelligenceStudio() {
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      // Fetches data without checking auth
```

**Issue:** Intelligence page has NO authentication/authorization checks. Anyone can access it.

---

**Pattern C - Different Server Auth (admin/organizations:7-24):**
```tsx
export default async function AdminOrganizationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/organizations');
  
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();
  
  if (!profileData?.is_super_admin) redirect('/');
```

**Status:** ✓ Consistent across admin pages (page.tsx, organizations, profiles, programs all use same pattern).

---

### ✗ CRITICAL: stories/intelligence Has No Auth Protection

**Issue:** Public page that displays admin-level intelligence data without any authentication.

**Recommendation:** Either:
1. Add auth checks if this should be admin-only
2. Move to `/admin/intelligence` if it's an admin tool
3. Document as intentionally public if that's the design

---

## 6. INCONSISTENT STYLING

### Color Schemes

**stories/intelligence:**
- Uses semantic colors: `text-green-600`, `text-red-600`, `text-gray-600`
- Stats cards with `border-2 border-black`
- Consistent brutalist design

**admin/page.tsx:**
- Uses gradient colors: `from-blue-500 to-blue-600`, `from-purple-500 to-purple-600`
- Shadow utilities: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Hover transforms: `hover:translate-x-[-2px] hover:translate-y-[-2px]`

**admin/organizations:**
- Uses gradient backgrounds: `from-cyan-50 via-blue-50 to-indigo-50`
- Custom color scheme: `text-cyan-600`, `border-cyan-600`

**admin/profiles:**
- Uses gradient backgrounds: `from-ochre-50 via-sand-50 to-eucalyptus-50`
- Custom palette: `text-ochre-600`, `bg-sand-50`

**Status:** ⚠️ Each admin page has unique color scheme, no consistent design system.

---

### Shadow Patterns

**stories/intelligence:** Basic `border-2 border-black`

**admin pages:** Brutalist shadows `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` with hover effects `hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`

**Status:** ✓ Admin pages consistent with each other, stories page simpler.

---

## SUMMARY TABLE

| Issue | Severity | File | Line | Status |
|-------|----------|------|------|--------|
| Missing /admin/programs/[id] edit page | CRITICAL | admin/programs/page.tsx | 88 | ✗ BROKEN |
| Missing /admin/programs/[id]/people page | CRITICAL | admin/programs/page.tsx | 94 | ✗ BROKEN |
| Missing /admin/profiles/new page | MEDIUM | admin/profiles/page.tsx | 84 | ✗ BROKEN |
| No auth on intelligence page | CRITICAL | stories/intelligence/page.tsx | 57 | ✗ SECURITY RISK |
| Inconsistent Navigation usage | MEDIUM | stories/intelligence/page.tsx | 300 | ⚠️ PATTERN DIFF |
| Inconsistent header classes | MEDIUM | All pages | Multiple | ⚠️ STYLE DIFF |
| Different StatCard implementations | LOW | stories/intelligence vs admin | Multiple | ⚠️ DRY VIOLATION |
| No admin breadcrumb on intelligence | LOW | stories/intelligence/page.tsx | 305 | ⚠️ UX ISSUE |
| Unique color schemes per page | LOW | All admin pages | Multiple | ⚠️ NO DESIGN SYS |
| Edit/View links work | ✓ GOOD | admin/profiles/page.tsx | 242-254 | ✓ VERIFIED |
| Demo data fallback | ✓ GOOD | stories/intelligence/page.tsx | 82-129 | ✓ INTENTIONAL |
| Consistent admin auth | ✓ GOOD | All admin pages | Multiple | ✓ VERIFIED |

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. **Add auth protection to `/stories/intelligence`** - Either move to `/admin/intelligence` or add auth checks
2. **Implement `/admin/programs/[id]/page.tsx`** - Edit functionality for programs
3. **Implement `/admin/programs/[id]/people/page.tsx`** - Manage program-people relationships

### Priority 2 (Medium)
4. **Implement `/admin/profiles/new/page.tsx`** - Complete CRUD for profiles
5. **Standardize Navigation component usage** - All pages should use `<Navigation />` from `@/components/ui/navigation`
6. **Create shared StatCard component** - Reuse across admin and stories pages

### Priority 3 (Low)
7. **Establish design system** - Standardize color schemes across admin pages
8. **Add admin breadcrumbs** - Intelligence page should link back to `/admin`
9. **Consolidate heading classes** - Choose between `headline-truth` vs `text-4xl font-black`

---

## FILES REVIEWED

1. `/src/app/stories/intelligence/page.tsx` (775 lines)
2. `/src/app/admin/page.tsx` (520 lines)
3. `/src/app/admin/organizations/page.tsx` (102 lines)
4. `/src/app/admin/profiles/page.tsx` (282 lines)
5. `/src/app/admin/programs/page.tsx` (122 lines)
6. `/src/components/admin/OrganizationList.tsx` (279 lines)
7. `/src/app/admin/people/page.tsx` (393 lines)

**Total LOC Reviewed:** 2,473 lines
