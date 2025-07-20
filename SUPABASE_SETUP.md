# Supabase Setup Guide for Queensland Youth Justice Tracker

This guide will help you set up Supabase for the Queensland Youth Justice Tracker project.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js 16+ installed
- Python 3.8+ installed (for scrapers)

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New project"
3. Choose your organization
4. Enter project details:
   - **Name**: `qld-youth-justice-tracker`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to Queensland, Australia
5. Click "Create new project"

## Step 2: Set Up the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration
5. You should see all tables created successfully

## Step 3: Configure Environment Variables

### For Next.js Application

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### For Python Scrapers

Create a `.env` file in the root directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase dashboard:
- Go to Project Settings > API
- Copy the `URL`, `anon public` key, and `service_role` key

## Step 4: Install Dependencies

### For Next.js:

```bash
npm install @supabase/supabase-js
```

### For Python:

```bash
pip install supabase python-dotenv
```

## Step 5: Test the Connection

### Test Next.js Connection:

Run the development server:

```bash
npm run dev
```

Visit:
- http://localhost:3000/api/budget-allocations
- http://localhost:3000/api/youth-statistics
- http://localhost:3000/api/cost-comparisons

You should see JSON responses (empty arrays if no data yet).

### Test Python Connection:

Create a test script `test_supabase.py`:

```python
from src.database.supabase_client import supabase_client

if supabase_client:
    print("Supabase connection successful!")
    
    # Test inserting a budget allocation
    test_data = {
        'fiscal_year': '2024-25',
        'department': 'Test Department',
        'program': 'Test Program',
        'category': 'community',
        'amount': 1000000,
        'description': 'Test allocation'
    }
    
    result = supabase_client.insert_budget_allocation(test_data)
    if result:
        print("Test data inserted successfully!")
    
    # Test querying
    allocations = supabase_client.get_budget_allocations()
    print(f"Found {len(allocations)} allocations")
else:
    print("Supabase client not initialized. Check your environment variables.")
```

Run: `python test_supabase.py`

## Step 6: Run Scrapers with Supabase

The scrapers are now configured to save data to both SQLite (local) and Supabase (cloud).

Run a scraper:

```bash
python -m src.scrapers.budget_scraper
```

Data will be saved to both databases automatically.

## Step 7: Set Up Row Level Security (RLS) Policies

The migration already includes basic RLS policies for public read access. To add write access for authenticated users:

1. Go to Authentication > Policies in Supabase dashboard
2. For each table that needs write access, add a policy:
   - **Name**: "Authenticated users can insert"
   - **Target roles**: authenticated
   - **WITH CHECK expression**: `true`

## Step 8: Deploy to Production

### Environment Variables for Vercel:

In your Vercel project settings, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### For Python scrapers in production:

Use environment variables or a secrets management system to store:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## API Endpoints

The following API endpoints are available for the dashboard:

### Budget Allocations
```
GET /api/budget-allocations
Query params:
  - fiscal_year: Filter by fiscal year (e.g., "2024-25")
  - category: Filter by category ("detention" or "community")
```

### Youth Statistics
```
GET /api/youth-statistics
Query params:
  - start_date: Filter from date (YYYY-MM-DD)
  - end_date: Filter to date (YYYY-MM-DD)
  - facility_name: Filter by facility
  - program_type: Filter by program type
```

### Cost Comparisons
```
GET /api/cost-comparisons
Query params:
  - limit: Number of records to return (default: 10)
```

### Hidden Costs
```
GET /api/hidden-costs
Query params:
  - category: Filter by cost category
  - stakeholder_type: Filter by stakeholder type
```

### Parliamentary Documents
```
GET /api/parliamentary-documents
Query params:
  - document_type: Filter by type
  - mentions_youth_justice: Filter documents mentioning youth justice (true/false)
  - mentions_spending: Filter documents mentioning spending (true/false)
  - mentions_indigenous: Filter documents mentioning indigenous issues (true/false)
  - limit: Number of records (default: 20)
```

## Monitoring and Maintenance

1. **Monitor Usage**: Check your Supabase dashboard for API usage and database size
2. **Backup**: Enable Point-in-Time Recovery in Supabase for automatic backups
3. **Performance**: Monitor slow queries in the Supabase dashboard
4. **Security**: Regularly review and update RLS policies

## Troubleshooting

### Connection Issues
- Verify environment variables are set correctly
- Check if your IP is allowed in Supabase (for service role key)
- Ensure you're using the correct keys (anon key for client, service key for server)

### Data Not Appearing
- Check browser console for errors
- Verify RLS policies allow read access
- Check Supabase logs for query errors

### Performance Issues
- Add indexes for frequently queried columns
- Use pagination for large datasets
- Consider caching frequently accessed data

## Next Steps

1. Set up scheduled jobs to run scrapers automatically
2. Implement data validation and deduplication
3. Add monitoring and alerting for scraper failures
4. Create data export functionality
5. Implement data archiving for old records