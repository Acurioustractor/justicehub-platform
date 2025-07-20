# Vercel Environment Variables

Copy and paste these into your Vercel project settings:
https://vercel.com/benjamin-knights-projects/qld-youth-justice-tracker/settings/environment-variables

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://oxgkjgurpopntowhxlxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2tqZ3VycG9wbnRvd2h4bHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDY3ODEsImV4cCI6MjA2NjAyMjc4MX0.MNRqMqOKmNL-0g_rCsrFSj5e-x4CPFoJCzGDXAIp8Gc
```

## Steps to Add:

1. Go to: https://vercel.com/benjamin-knights-projects/qld-youth-justice-tracker/settings/environment-variables

2. For each variable:
   - Click "Add Variable"
   - Enter the Name and Value exactly as shown above
   - Select all environments (Production, Preview, Development)
   - Click "Save"

3. After adding both variables:
   - Click "Redeploy" button at the top of the page
   - Select the latest deployment
   - Click "Redeploy"

## Verify Success:

Once redeployed, your app should:
- Show real data instead of "No data found"
- Connect to the correct Supabase instance
- Display the scraped youth justice statistics

## Current Data Available:

- Youth Statistics: 8 records
- Budget Allocations: 3 records
- Scraped Content: 2 records (Courts + Police data)
- Total: 13 data points exposing system failures