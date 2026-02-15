# 🎯 Supabase Type Generation - Quick Start

**The Magic Command**

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

## Example

### Before (no types):

```typescript
const { data } = await supabase.from('alma_interventions').select('*')
// data is `any` - no autocomplete, typos cause runtime errors 💥
```

### After (with generated types):

```typescript
import { Database } from './types/database.types'

const supabase = createClient<Database>(url, key)

const { data } = await supabase.from('alma_interventions').select('*')
// data is fully typed - autocomplete works, typos caught at compile time ✅
```

---

## Setup for Any Codebase

1. **Install Supabase CLI**:

```bash
brew install supabase/tap/supabase
# or
npm install -g supabase
```

2. **Login**:

```bash
supabase login
```

3. **Link your project**:

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

4. **Generate types**:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

5. **Use in your code**:

```typescript
import { Database } from './types/database.types'
const supabase = createClient<Database>(url, key)
```

6. **Add to package.json**:

```json
{
  "scripts": {
    "types:generate": "npx supabase gen types typescript --linked > src/types/database.types.ts"
  }
}
```

7. **Run after schema changes**:

```bash
npm run types:generate
```

---

## Benefits

✅ **Auto-complete** - IDE suggests all available columns
✅ **Type safety** - Catch typos before runtime
✅ **No manual typing** - Generates 1000s of types automatically
✅ **Schema sync** - Types update when database changes
✅ **Refactoring safe** - Rename column = TypeScript finds all usages

---

**Full guide**: [docs/SUPABASE_TYPE_GENERATION_GUIDE.md](docs/SUPABASE_TYPE_GENERATION_GUIDE.md)

**This works for any codebase using Supabase - just run the command and you get full TypeScript types for your entire database!** 🚀
