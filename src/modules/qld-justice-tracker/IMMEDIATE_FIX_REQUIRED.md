# IMMEDIATE FIX REQUIRED: Database Environment Variables

## THE PROBLEM
The production site shows "0 data" because it's connecting to the **WRONG DATABASE**.

## EVIDENCE
- **Frontend console errors** show connections to: `ivvvkombgqvjyrrmwmbs.supabase.co` (empty database)
- **Local development** uses: `oxgkjgurpopntowhxlxm.supabase.co` (has 17 real government records)
- **Dashboard API works** because it uses fallback data when database fails
- **Sources page shows 0** because it directly queries the empty production database

## THE SOLUTION
Update the **Vercel environment variables** to use the database that has data:

### Current (Wrong) Production Environment:
```
NEXT_PUBLIC_SUPABASE_URL=https://ivvvkombgqvjyrrmwmbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[wrong key]
```

### Correct Environment (from .env.local):
```
NEXT_PUBLIC_SUPABASE_URL=https://oxgkjgurpopntowhxlxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z2tqZ3VycG9wbnRvd2h4bHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzQyMDAsImV4cCI6MjA2NTU1MDIwMH0.V94-idRZ_86lQpTdq6aPqAjumq3lEC1Tu3qerZs6-k8
```

## WHAT THIS WILL FIX
✅ Sources page will show **17 verified records** instead of 0  
✅ Data Explorer will show **real government data** in all tabs  
✅ Console errors will stop (no more failed Supabase requests)  
✅ Service worker errors will stop  
✅ All "No data found" messages will disappear  

## DATA AVAILABLE AFTER FIX
- **2 Court Statistics** (8,457 defendants, 61.9% Indigenous)
- **2 Youth Detention Records** (338 youth, 73.4% Indigenous) 
- **6 Budget Records** ($489.1M total, $443M detention)
- **3 Parliamentary Documents** (oversight, questions on notice)
- **1 Youth Crime Record** (15,234 offenders, 58% repeat rate)
- **3 Scraped Content Records** (source materials)

## URGENCY: CRITICAL
This is a **5-minute environment variable fix** that will immediately resolve all "No data found" issues across the entire site.

The technical work is complete - the data exists and the APIs work. Only the environment configuration needs updating.