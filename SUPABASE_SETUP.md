# 🚀 Supabase Setup Guide - Youth Justice Service Finder

**MUCH BETTER than local PostgreSQL!** Supabase eliminates all the local database headaches and provides a rock-solid cloud-hosted solution.

## ✅ Why Supabase?

- ✅ **No local database setup** - Everything runs in the cloud
- ✅ **Instant scaling** - Handles thousands of users automatically  
- ✅ **Built-in API** - RESTful endpoints out of the box
- ✅ **Real-time updates** - Live data synchronization
- ✅ **Free tier** - Perfect for your project size
- ✅ **Web dashboard** - Easy database management
- ✅ **Automatic backups** - Never lose your data
- ✅ **Fast deployment** - Works with Vercel, Railway, etc.
- ✅ **Multi-project support** - Tagged data for different apps

---

## 🎯 Quick Setup (5 Minutes)

### 1. Create Supabase Project (or use existing)

If you already have a Supabase project with stories and other data, perfect! We'll add the Youth Justice Service Finder tables alongside your existing data.

### 2. Get Your Connection Details

From your Supabase dashboard:

1. Go to **Settings** → **API**
2. Copy these two values:

```bash
# Add these to your .env file:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Create Database Tables (with Project Tagging)

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste this SQL:

```sql
-- Organizations table (with project tagging)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT,
  website TEXT,
  abn TEXT,
  description TEXT,
  project TEXT DEFAULT 'youth-justice-service-finder',
  source TEXT,
  app_type TEXT DEFAULT 'service-directory',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table (with project tagging)
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  address TEXT,
  suburb TEXT,
  postcode TEXT,
  state TEXT DEFAULT 'QLD',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  region TEXT,
  project TEXT DEFAULT 'youth-justice-service-finder',
  app_type TEXT DEFAULT 'service-directory',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table (with project tagging)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone TEXT,
  email TEXT,
  website TEXT,
  project TEXT DEFAULT 'youth-justice-service-finder',
  app_type TEXT DEFAULT 'service-directory',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table (main table with project tagging)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT REFERENCES organizations(id),
  location_id TEXT REFERENCES locations(id),
  contact_id TEXT REFERENCES contacts(id),
  name TEXT NOT NULL,
  description TEXT,
  keywords TEXT,
  service_type TEXT,
  target_age_min INTEGER,
  target_age_max INTEGER,
  eligibility TEXT,
  cost TEXT,
  availability TEXT,
  project TEXT DEFAULT 'youth-justice-service-finder',
  source TEXT,
  app_type TEXT DEFAULT 'service-directory',
  import_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_keywords ON services(keywords);
CREATE INDEX IF NOT EXISTS idx_services_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_project ON services(project);
CREATE INDEX IF NOT EXISTS idx_locations_suburb ON locations(suburb);
CREATE INDEX IF NOT EXISTS idx_locations_postcode ON locations(postcode);
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project);
CREATE INDEX IF NOT EXISTS idx_organizations_project ON organizations(project);
CREATE INDEX IF NOT EXISTS idx_contacts_project ON contacts(project);
```

3. Click **"Run"**

### 4. Update Your Environment

Add to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 🏷️ **Multi-Project Support**

**Perfect for shared databases!** All Youth Justice Service Finder data is tagged with:

- **`project: 'youth-justice-service-finder'`** - Identifies this app's data
- **`app_type: 'service-directory'`** - Categories the data type
- **`source: 'ultra-extraction-2025-07-16'`** - Tracks data origin
- **`import_date`** - When data was imported

This means:
- ✅ **Your stories stay separate** from services
- ✅ **Multiple apps can share one database** safely
- ✅ **Easy to query specific project data**
- ✅ **No data conflicts or mixing**

---

## 🚀 Import Your 1,075 Services

Now import all your services to Supabase:

```bash
npm run import:supabase
```

This will:
- ✅ Read your `ultra-extraction-2025-07-16.json` file
- ✅ Process all 1,075 services
- ✅ **Tag everything with `project: 'youth-justice-service-finder'`**
- ✅ Upload to Supabase in optimized batches
- ✅ Show real-time progress

---

## 🎉 Start Your App

```bash
# Start with Supabase (recommended)
npm run start:supabase
```

Your app will be available at:
- 🌐 **Frontend**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3000/docs  
- ❤️ **Health Check**: http://localhost:3000/health
- 🔍 **Search**: http://localhost:3000/search?q=counselling

**Only Youth Justice Service Finder data will be shown** - your other projects stay separate!

---

## 📊 Database Management

### Supabase Dashboard
- **Tables**: View and edit data
- **SQL Editor**: Run custom queries
- **API**: Auto-generated REST endpoints
- **Auth**: User management (for future features)
- **Storage**: File uploads (for future features)

### Query Specific Project Data
```sql
-- Get only Youth Justice Service Finder services
SELECT * FROM services WHERE project = 'youth-justice-service-finder';

-- Get only stories (your other project)
SELECT * FROM stories;

-- Get all projects in your database
SELECT DISTINCT project FROM services 
UNION 
SELECT 'stories' as project;
```

### Check Your Data
```bash
# Get database stats (Youth Justice Service Finder only)
curl http://localhost:3000/stats

# Search services (filtered to this app)
curl "http://localhost:3000/search?q=mental health"

# Get all services (paginated, filtered)
curl "http://localhost:3000/services?page=1&limit=10"
```

---

## 🌐 Deploy to Production

### Vercel (Frontend)
```bash
# Already working!
https://frontend-of1eug1mj-benjamin-knights-projects.vercel.app
```

### Railway (Full-stack)
```bash
# Deploy both frontend + API
railway up
```

### Environment Variables for Production
Add these to your hosting platform:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
NODE_ENV=production
```

---

## 🔧 Troubleshooting

### Can't connect to Supabase?
1. Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
2. Make sure you're using the **anon** key, not the **service_role** key
3. Verify your project is active in Supabase dashboard

### Import failing?
1. Check that `ultra-extraction-2025-07-16.json` exists in `archive/data-extracts/`
2. Verify your database tables were created (run the SQL again)
3. Check the console output for specific error messages

### API returning errors?
1. Test the health endpoint: `curl http://localhost:3000/health`
2. Check Supabase dashboard for any database issues
3. Look at the server logs for detailed error messages

### Data from other projects showing up?
- This shouldn't happen! All queries are filtered by `project = 'youth-justice-service-finder'`
- Check the database tags in Supabase dashboard to verify data is properly tagged

---

## 🎯 Next Steps

With Supabase set up, you can:

1. **Deploy to production** - Everything will work the same way
2. **Add real-time features** - Services update live across all users
3. **Scale automatically** - Supabase handles traffic spikes
4. **Add user accounts** - Built-in authentication system
5. **Add file uploads** - Service photos, documents, etc.
6. **API analytics** - Built-in usage tracking
7. **Multiple apps** - Share the database with other projects safely

**This is SO much better than local PostgreSQL AND keeps your projects organized!** 🎉

---

## 📞 Need Help?

1. **Supabase Docs**: https://supabase.com/docs
2. **Community**: https://github.com/supabase/supabase/discussions
3. **Discord**: https://discord.supabase.com

Your Youth Justice Service Finder is now powered by enterprise-grade infrastructure with perfect project isolation! 🚀 