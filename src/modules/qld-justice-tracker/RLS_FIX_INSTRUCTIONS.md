# 🔧 Fix Row Level Security (RLS) Policies - Critical First Step

## Problem
The scrapers are successfully collecting data but cannot store it in Supabase due to Row Level Security (RLS) policies blocking the service role key. This is preventing all data from being saved.

## Solution
Run the comprehensive RLS fix script that grants proper permissions to the service role.

## Steps to Fix

### 1. Go to Supabase SQL Editor
Open your Supabase dashboard and navigate to the SQL Editor:
```
https://ivvvkombgqvjyrrmwmbs.supabase.com/dashboard/project/ivvvkombgqvjyrrmwmbs/sql/new
```

### 2. Run the Fix Script
1. Open the file: `scripts/fix-rls-policies-comprehensive.sql`
2. Copy the ENTIRE contents of the file
3. Paste it into the Supabase SQL Editor
4. Click "Run" or press Cmd/Ctrl + Enter

### 3. Verify Success
You should see:
- "Success. No rows returned" message
- A final message: "RLS policies have been fixed! Service role now has full access to all tables."
- Notice messages showing the number of policies created

### 4. Test Data Insertion
After running the fix, test that scrapers can now insert data:

```bash
# Test the Firecrawl scraper (known to be working)
node scripts/scrapers/firecrawl-enhanced-scraper.mjs

# Check if data was inserted
node scripts/check-existing-data.mjs
```

## What This Script Does

1. **Disables RLS temporarily** on all tables to clean up
2. **Drops all existing policies** that might be conflicting
3. **Re-enables RLS** for security
4. **Creates new policies** that:
   - Allow public read access (for the frontend)
   - Allow service role full access (for scrapers)
5. **Handles all tables** including:
   - Main data tables (budget_allocations, youth_statistics, etc.)
   - Monitoring tables (scraper_health, scraper_runs, etc.)
   - Any additional tables from other migrations

## Why This is Critical

Without fixing RLS policies:
- ❌ Scrapers run but data is silently rejected
- ❌ Database remains empty despite successful scraping
- ❌ Frontend shows no data
- ❌ Monitoring shows scrapers as "failing"

After fixing RLS policies:
- ✅ Scrapers can insert data successfully
- ✅ Database populates with real government data
- ✅ Frontend can display actual statistics
- ✅ Monitoring shows true scraper health

## Next Steps

Once RLS is fixed, proceed with:
1. Testing each scraper individually
2. Verifying data in the database
3. Updating scraper configurations
4. Removing mock data from components

## Troubleshooting

If you still see insertion errors after running the script:
1. Check that you're using the service role key (not anon key) in scrapers
2. Verify the service key is correctly set in `.env.local`
3. Check Supabase logs for any specific error messages
4. Try running a simple INSERT query in SQL Editor to test

## Alternative Manual Fix

If the script doesn't work, you can manually fix in Supabase Dashboard:
1. Go to Authentication > Policies
2. For each table, create a policy:
   - Name: "Enable all access for service role"
   - Target roles: Check only "service_role"
   - Policy: `true` (allows everything)
3. Keep existing "public read" policies for frontend access