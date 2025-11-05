# Blog System Setup Instructions

## Apply Database Migration

You need to apply the blog system migration to your Supabase database. Here's how:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250124000003_create_blog_system.sql`
4. Paste into the SQL Editor
5. Add this additional SQL to add the `reading_time_minutes` column:

```sql
-- Add reading time column
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER DEFAULT 1;
```

6. Click **Run** to execute the migration

### Option 2: Via Command Line

If you have the Supabase CLI configured with your database connection string:

```bash
DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx supabase db push --db-url "$YJSF_SUPABASE_DB_URL"
```

## Verify the Migration

After running the migration, verify it worked by running this SQL query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'blog_posts'
ORDER BY ordinal_position;
```

You should see the `blog_posts` table with all columns including `reading_time_minutes`.

## Troubleshooting

### Error: "Error saving blog post"

This means the `blog_posts` table doesn't exist yet. Follow the migration steps above.

### Error: "RLS policy violation"

Make sure you're logged in as an authenticated user. The blog system requires authentication to create posts.

### Error: "column 'reading_time_minutes' does not exist"

Run the ALTER TABLE command from Option 1 step 5 above.

## Testing the Blog System

Once the migration is complete:

1. Visit http://localhost:3003/admin/blog/new
2. Fill out the form:
   - **Title**: Test Blog Post
   - **Content**: Write some test content using the WYSIWYG editor
3. Click **Save Draft**
4. You should see "Draft saved!" message
5. Navigate to the blog posts list to see your saved post

## Next Steps

After setting up the database:
- The blog editor is fully functional with WYSIWYG editing
- Auto-save works every 5 seconds
- Fullscreen mode is available for focused writing
- Media library integration is ready (requires media_library migration too)

