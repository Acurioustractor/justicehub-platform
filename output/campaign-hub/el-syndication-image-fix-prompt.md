# Prompt for Empathy Ledger repo

## Task: Include story images in syndication API responses + import script

### Problem
The JusticeHub syndication API (`/api/syndication/justicehub/stories`) doesn't include `story_image_url` in its response. When JusticeHub fetches syndicated stories, they have no thumbnail/cover image. The import script (`scripts/import-justicehub-articles.ts`) also doesn't map images when importing.

### Fix 1: Syndication stories API

**File:** `src/app/api/syndication/justicehub/stories/route.ts`

The story query (line ~73) selects:
```
id, title, excerpt, themes, status, published_at, cultural_sensitivity_level, storyteller_id, project_id, storytellers!stories_storyteller_id_fkey(...)
```

Add `story_image_url` to the SELECT:
```
id, title, excerpt, themes, status, published_at, cultural_sensitivity_level, storyteller_id, project_id, story_image_url, storytellers!stories_storyteller_id_fkey(...)
```

Then in the result mapping (line ~138), add:
```typescript
imageUrl: story.story_image_url,
```

### Fix 2: Syndication content API

**File:** `src/app/api/syndication/content/[storyId]/route.ts`

The story query (line ~83) selects:
```
id, title, content, excerpt, is_public, cultural_permission_level
```

Add `story_image_url`:
```
id, title, content, excerpt, is_public, cultural_permission_level, story_image_url
```

Then in the response (line ~148), add `imageUrl: story.story_image_url` to the story object.

### Fix 3: Import script image mapping

**File:** `scripts/import-justicehub-articles.ts`

When mapping JH articles to EL articles, also map:
- JH `featured_image_url` → EL `featured_image_url` (for articles table)
- If the article is being created as a story (not just an article), also set `story_image_url`

### Fix 4: Syndication articles API (if it exists)

**File:** `src/app/api/syndication/articles/route.ts`

This endpoint already selects `featured_image_id` and resolves it to a URL. Verify it's returning the image URL in the response. If so, no change needed here.

### Verify

After deploying:
1. `GET /api/syndication/justicehub/stories` should include `imageUrl` for stories that have `story_image_url` set
2. `GET /api/syndication/content/{storyId}` should include `imageUrl` in the story object
3. The Oonchiumpa story specifically should have its cover image included

### Context
JusticeHub currently has a manual workaround (setting `featured_image_url` directly on the JH articles table). This fix makes images flow automatically through syndication so no manual step is needed.
