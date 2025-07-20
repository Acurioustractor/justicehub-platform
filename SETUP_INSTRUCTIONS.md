# 🚀 Queensland Youth Justice Tracker - Complete Setup Guide

## YOU'RE RIGHT - LET'S FIX THIS PROPERLY!

This guide will set up your world-class scraper system properly with no more API key issues or database connection failures.

## 🎯 Step 1: Create NEW Supabase Project

**You need a fresh Supabase project to avoid all the connection issues:**

1. Go to https://app.supabase.com
2. Click **"New project"**
3. Name it: `qld-youth-justice-tracker`
4. Choose **Australia Southeast (Sydney)** region
5. Create a strong password and **SAVE IT**
6. Click **"Create new project"**
7. **Wait 2-3 minutes** for project to be ready

## 🔑 Step 2: Get Your NEW API Keys

1. In your new Supabase project dashboard
2. Go to **Settings** > **API**
3. Copy these 3 values:

```
Project URL: https://YOUR_NEW_PROJECT_ID.supabase.co
anon public key: eyJ... (long key starting with eyJ)
service_role key: eyJ... (different long key starting with eyJ)
```

## 🛠️ Step 3: Update Environment Variables

1. **Open the file:** `.env.new` (in your project root)
2. **Replace the placeholder values:**

```bash
# Replace these with YOUR actual values:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY
SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY
```

3. **Save the file**
4. **Copy it to create both required env files:**

```bash
cp .env.new .env.local
cp .env.new .env
```

## 🗄️ Step 4: Set Up Database Tables

Run this command to create all database tables automatically:

```bash
node scripts/setup-database-tables.mjs
```

You should see:
```
✅ Database connection established
✅ Tables created with proper schema
✅ Row Level Security policies configured
🎉 DATABASE SETUP COMPLETE!
```

## 🧪 Step 5: Test Everything Works

```bash
node scripts/test-database-connection.mjs
```

You should see:
```
✅ Database connection successful
🎉 DATABASE CONNECTION TEST PASSED!
🚀 Ready to run world-class scrapers!
```

## 🌟 Step 6: Run Your World-Class Scraper System

```bash
node scripts/run-world-class-scrapers.mjs
```

This will:
- ✅ Run professional youth justice scraper
- ✅ Run budget data scraper  
- ✅ Run police statistics scraper
- ✅ Insert data into your database
- ✅ Show you complete professional output

## 🚀 Step 7: Start Your Website

```bash
npm run dev
```

Visit: http://localhost:3000

Your data should now be visible on the website!

## 🌐 Step 8: Deploy to Vercel (Optional)

1. Go to: https://vercel.com/new
2. Import your GitHub repository
3. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://YOUR_NEW_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = YOUR_ACTUAL_ANON_KEY
   ```
4. Deploy!

## 🔄 Step 9: Automate Your Scrapers

Add these scripts to your `package.json` (already done):

```bash
# Run all scrapers
npm run scrapers:all

# Run individual scrapers  
npm run scrapers:youth
npm run scrapers:budget
npm run scrapers:police
```

## ⚡ Quick Commands Summary

```bash
# 1. Set up database
node scripts/setup-database-tables.mjs

# 2. Test connection
node scripts/test-database-connection.mjs

# 3. Run scrapers
node scripts/run-world-class-scrapers.mjs

# 4. Start website
npm run dev
```

## ❌ Troubleshooting

### "Missing environment variables"
- Make sure you copied `.env.new` to both `.env` and `.env.local`
- Check you replaced ALL placeholder values with your real Supabase credentials

### "Database connection failed"
- Verify your Supabase project URL is correct
- Check your service role key is copied exactly (it's very long)
- Make sure your Supabase project is active (not paused)

### "No data found on website"
- Run the scrapers first: `node scripts/run-world-class-scrapers.mjs`
- Check the scraper output shows records were inserted
- Refresh your browser

### Still having issues?
- Your Supabase project might be in a different region
- Try creating a new project in **Australia Southeast (Sydney)**
- Make sure you're using the **service_role** key for the scrapers (not the anon key)

## 🎉 Success!

When everything is working you should see:

1. ✅ Scrapers running successfully with professional output
2. ✅ Data being inserted into Supabase
3. ✅ Website showing youth justice statistics, budget data, and trends
4. ✅ No more API key or connection errors

**Your world-class scraper system is now operational!** 🌟

## 🔧 Advanced Features

Your system includes:

- **Professional retry logic** with exponential backoff
- **Rate limiting** to be respectful to government websites  
- **Data validation** and quality checks
- **Health monitoring** of all scrapers
- **Comprehensive logging** and error handling
- **Concurrent execution** with batch processing
- **Real-time status** updates
- **Automatic fallback** to local JSON if Supabase fails

This is a **production-grade system** built to professional standards.