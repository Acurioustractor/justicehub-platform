# Quick Fix for "No Data Found" Issue

## The Problem
Your Supabase database is empty - the scrapers haven't populated it yet and some tables might be missing.

## Quick Solution

1. **Go to your Supabase Dashboard**
   - https://supabase.com/dashboard/project/ivvvkombgqvjyrrmwmbs

2. **Run the SQL Migration**
   - Click on "SQL Editor" in the left sidebar
   - Copy and paste the contents of `supabase/migrations/007_ensure_core_tables.sql`
   - Click "Run" to create the tables

3. **Insert Sample Data**
   - Still in SQL Editor, run this to add sample data:

```sql
-- Insert sample youth statistics
INSERT INTO public.youth_statistics (date, total_in_detention, indigenous_percentage, on_remand_percentage, average_daily_number, reoffending_rate, successful_completions, source, fiscal_year)
VALUES 
  ('2024-12-01', 340, 72, 74, 335, 68, 156, 'Department of Youth Justice', '2024-25'),
  ('2024-11-01', 328, 71, 73, 325, 67, 148, 'Department of Youth Justice', '2024-25');

-- Insert sample budget data
INSERT INTO public.budget_allocations (fiscal_year, category, subcategory, amount, description, source)
VALUES 
  ('2024-25', 'detention', 'Operations', 453000000, 'Youth detention centre operations', 'Queensland Budget Papers 2024-25'),
  ('2024-25', 'community', 'Programs', 127000000, 'Community-based programs and supervision', 'Queensland Budget Papers 2024-25'),
  ('2024-25', 'detention', 'Infrastructure', 98000000, 'New detention centre construction', 'Queensland Budget Papers 2024-25');

-- Insert sample scraped content
INSERT INTO public.scraped_content (source, url, title, content, metadata, scraper_name, data_type)
VALUES 
  ('Queensland Budget Papers', 'https://budget.qld.gov.au/', 'Youth Justice Budget Allocation 2024-25', 'Total youth justice budget: $678 million. Detention: $551 million (81%). Community programs: $127 million (19%).', '{"fiscal_year": "2024-25", "total_budget": 678000000}', 'budget_scraper', 'budget'),
  ('Department of Youth Justice', 'https://www.dcssds.qld.gov.au/our-work/youth-justice', 'Youth Detention Monthly Statistics', 'Average daily number in detention: 335. Indigenous: 72%. On remand: 74%.', '{"month": "December 2024", "total_detained": 340}', 'youth_justice_scraper', 'statistics');
```

4. **Refresh your website**
   - The data should now appear!

## Long-term Solution
We need to:
1. Fix the scraper timeout issues
2. Update scraper URLs (some government sites have changed)
3. Set up scheduled scraping

## Alternative: Run Local Scrapers
If you want real data instead of sample data:

```bash
# Run individual scrapers that work
node scripts/scrapers/youth-justice-scraper.mjs
node scripts/scrapers/qld-open-data-scraper.mjs
```

These scrapers should populate your database with real data.