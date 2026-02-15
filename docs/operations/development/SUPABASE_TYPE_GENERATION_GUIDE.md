# 🎯 Supabase Type Generation - Complete Guide

**Automatic TypeScript types for 100% type-safe database access**

---

## The Magic Command

```bash
npm run types:generate
```

This generates TypeScript types from your Supabase database schema!

---

## What It Does

```
PostgreSQL Database
    ↓
Supabase reads all tables/columns/types
    ↓
Generates TypeScript interfaces
    ↓
You get 100% type-safe database access
```

---

## Quick Start (5 Minutes)

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm (any platform)
npm install -g supabase

# Verify installation
supabase --version
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
# For JusticeHub
supabase link --project-ref tednluwflfhxyucgwigh

# For Empathy Ledger
cd ../empathy-ledger-v2
supabase link --project-ref yvnuayzslukamizrlhwb

# For any ACT project
supabase link --project-ref YOUR_PROJECT_ID
```

### 4. Generate Types

```bash
npm run types:generate
```

**Output**: `src/types/database.types.ts` with full TypeScript definitions for your entire database!

---

## Example: Before & After

### ❌ Before (No Types)

```typescript
const { data } = await supabase.from('alma_interventions').select('*')
// data is `any` - no autocomplete, typos cause runtime errors 💥
// IDE has no idea what columns exist
```

### ✅ After (With Generated Types)

```typescript
import { Database } from '@/types/database.types'

const supabase = createClient<Database>()

const { data } = await supabase.from('alma_interventions').select('*')
// data is fully typed!
// - IDE autocomplete for all columns ✅
// - Typos caught at compile time ✅
// - IntelliSense shows column types ✅
```

---

## Usage in Your Code

### Client Components

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Components

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export async function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // ... cookies config
  )
}
```

### In Your Components

```typescript
import { createClient } from '@/lib/supabase/client'

export default function InterventionsList() {
  const supabase = createClient()

  // Full type safety!
  const { data } = await supabase
    .from('alma_interventions')
    .select('id, name, type, jurisdiction, consent_level')
    .eq('review_status', 'Approved')
    .order('created_at', { ascending: false })

  // TypeScript knows exactly what columns exist
  // and what their types are!
  return (
    <div>
      {data?.map(intervention => (
        <div key={intervention.id}>
          <h3>{intervention.name}</h3>
          <p>{intervention.jurisdiction}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "types:generate": "npx supabase gen types typescript --linked > src/types/database.types.ts",
    "types:watch": "nodemon --watch supabase/migrations --exec 'npm run types:generate'"
  }
}
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run types:generate` | Generate types once |
| `npm run types:watch` | Auto-regenerate when migrations change |
| `npm run build` | Build project (types are already generated) |

---

## When to Regenerate Types

**Always regenerate types after:**

1. ✅ Running database migrations
2. ✅ Adding new tables
3. ✅ Adding/removing columns
4. ✅ Changing column types
5. ✅ Adding/updating RLS policies (affects permissions)
6. ✅ Creating database functions

**Best practice**: Add to your workflow

```bash
# After creating a migration
supabase migration new add_feature

# Edit the migration file
# ...

# Apply migration
supabase db push

# Regenerate types
npm run types:generate

# Commit both migration and types
git add supabase/migrations/ src/types/
git commit -m "feat: add new feature with types"
```

---

## Advanced: Type-Safe Queries

### Selecting Specific Columns

```typescript
const { data } = await supabase
  .from('alma_interventions')
  .select('id, name, type')

// TypeScript knows data is:
// Array<{ id: string, name: string, type: string }>
```

### Joins with Related Tables

```typescript
const { data } = await supabase
  .from('alma_interventions')
  .select(`
    id,
    name,
    evidence:alma_evidence(
      id,
      title,
      evidence_level
    )
  `)

// TypeScript knows about the nested relationship!
```

### Filtering with Type Safety

```typescript
const { data } = await supabase
  .from('alma_interventions')
  .eq('type', 'Cultural Connection')  // ✅ Type-checked
  .eq('type', 'InvalidType')          // ❌ TypeScript error!
```

### Insert with Type Safety

```typescript
const { data, error } = await supabase
  .from('alma_interventions')
  .insert({
    name: 'New Program',
    type: 'Prevention',
    jurisdiction: 'QLD',
    consent_level: 'Public Knowledge Commons',
    // Missing required field? TypeScript error!
    // Wrong type? TypeScript error!
  })
```

---

## Type Definitions Structure

```typescript
export type Database = {
  public: {
    Tables: {
      alma_interventions: {
        Row: {
          id: string
          name: string
          type: string
          // ... all columns with correct types
        }
        Insert: {
          // Types for inserting (some fields optional)
        }
        Update: {
          // Types for updating (all fields optional)
        }
      }
      // ... all other tables
    }
    Views: {
      // Database views
    }
    Functions: {
      // Database functions (RPC)
    }
  }
}
```

---

## Using with Database Functions (RPC)

```typescript
// Database function: calculate_portfolio_signals(intervention_id uuid)
const { data } = await supabase.rpc('calculate_portfolio_signals', {
  intervention_id: '123e4567-e89b-12d3-a456-426614174000'
})

// TypeScript knows the parameter types and return type!
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Database Migrations

on:
  push:
    paths:
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push migrations
        run: supabase db push

      - name: Generate types
        run: npm run types:generate

      - name: Commit types if changed
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add src/types/database.types.ts
          git diff --staged --quiet || git commit -m "chore: update database types"
          git push
```

---

## Troubleshooting

### Issue: "Module not found: @/types/database.types"

**Solution**: Generate types first

```bash
npm run types:generate
```

### Issue: "Property doesn't exist on type"

**Cause**: Database schema changed but types not regenerated

**Solution**: Regenerate types

```bash
npm run types:generate
```

### Issue: Types are out of sync with database

**Solution**: Pull latest schema and regenerate

```bash
# Option 1: If migrations are in sync
npm run types:generate

# Option 2: If remote has changes
supabase db pull  # Creates migration from remote
npm run types:generate
```

### Issue: "Cannot find module '@supabase/ssr'"

**Solution**: Install dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
```

---

## Best Practices

### 1. Always Use Type Parameter

```typescript
// ✅ GOOD
const supabase = createClient<Database>()

// ❌ BAD (loses type safety)
const supabase = createClient()
```

### 2. Regenerate After Every Migration

```bash
supabase db push && npm run types:generate
```

### 3. Commit Types with Migrations

```bash
git add supabase/migrations/ src/types/
git commit -m "feat: add new table with types"
```

### 4. Use Watch Mode During Development

```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Auto-regenerate types
npm run types:watch
```

### 5. Type Your Helper Functions

```typescript
import type { Database } from '@/types/database.types'

type Intervention = Database['public']['Tables']['alma_interventions']['Row']

export function formatIntervention(intervention: Intervention): string {
  return `${intervention.name} (${intervention.jurisdiction})`
}
```

---

## Multi-Project Setup

If you work with multiple ACT projects:

```bash
# JusticeHub
cd /Users/benknight/Code/JusticeHub
supabase link --project-ref tednluwflfhxyucgwigh
npm run types:generate

# Empathy Ledger
cd /Users/benknight/Code/empathy-ledger-v2
supabase link --project-ref yvnuayzslukamizrlhwb
npm run types:generate

# ACT Farm (example)
cd /Users/benknight/Code/act-farm
supabase link --project-ref YOUR_PROJECT_ID
npm run types:generate
```

---

## Type-Safe ALMA Integration

### Pattern Detection

```typescript
import type { Database } from '@/types/database.types'

type Intervention = Database['public']['Tables']['alma_interventions']['Row']

export async function detectPatterns() {
  const supabase = createClient()

  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('*')
    .eq('review_status', 'Approved')

  // interventions is typed as Intervention[]
  // Full autocomplete and type checking!

  const byState = groupBy(interventions, 'jurisdiction')
  const byType = groupBy(interventions, 'type')

  return { byState, byType }
}
```

### Signal Tracking

```typescript
export async function trackCommunityAuthority() {
  const supabase = createClient()

  const { data } = await supabase
    .from('alma_interventions')
    .select('*')
    .eq('consent_level', 'Community Controlled')
    .eq('cultural_authority', true)

  // TypeScript knows cultural_authority is boolean
  // TypeScript knows consent_level is a specific string type
}
```

---

## Benefits Summary

| Benefit | Impact |
|---------|--------|
| ✅ Auto-complete | Write code 3x faster |
| ✅ Type safety | Catch errors at compile time |
| ✅ No manual typing | Generates 1000s of types automatically |
| ✅ Schema sync | Types update when database changes |
| ✅ Refactoring safe | Rename column = TypeScript finds all usages |
| ✅ Documentation | Types serve as inline documentation |
| ✅ IntelliSense | Hover to see column types and descriptions |

---

## Related Documentation

- **Supabase CLI**: https://supabase.com/docs/guides/cli
- **Type Generation**: https://supabase.com/docs/reference/javascript/typescript-support
- **Migration Guide**: `./SUPABASE_CONNECTION_GUIDE.md`

---

## Quick Reference Card

```bash
# Initial Setup (once per project)
supabase login
supabase link --project-ref YOUR_PROJECT_ID

# Daily Workflow
supabase migration new feature_name  # Create migration
# ... edit migration file ...
supabase db push                     # Apply migration
npm run types:generate               # Update types
npm run dev                          # Start developing with types!

# Troubleshooting
npm run types:generate               # Regenerate if out of sync
supabase db pull                     # Pull remote changes
```

---

**Last Updated**: January 2026
**Status**: Production Ready
**Projects Using This**: JusticeHub, Empathy Ledger, ACT Farm, The Harvest, Goods

**This works for any codebase using Supabase - just run the command and you get full TypeScript types for your entire database!** 🚀
