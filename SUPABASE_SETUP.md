# Supabase Setup for Youth Justice Service Finder

## 🔧 Environment Configuration

To connect to the **real data with 1000+ services**, you need to configure your Supabase environment variables.

### 1. Get Supabase Credentials

The Youth Justice Service Finder uses Supabase to store all the service data. You need:

- **Supabase URL**: Your project URL 
- **Supabase Anon Key**: Your public API key
- **Optional: Service Key**: For admin operations

### 2. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Youth Justice Service Finder - Supabase Connection
YJSF_SUPABASE_URL=https://your-project.supabase.co
YJSF_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Or use the main Supabase connection (fallback)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Enable the service finder
ENABLE_SERVICE_FINDER=true
```

### 3. Supabase Database Schema

The service finder expects these tables in your Supabase database:

```sql
-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],
  keywords TEXT[],
  minimum_age INTEGER,
  maximum_age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  name TEXT NOT NULL,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table  
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  service_id UUID REFERENCES services(id),
  street_address TEXT,
  locality TEXT,
  region TEXT,
  state TEXT,
  postcode TEXT,
  coordinates POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  service_id UUID REFERENCES services(id),
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Test Connection

After setting up the environment variables, restart your development server:

```bash
npm run dev
```

Visit http://localhost:3001/services and you should see:

- **Real service count** in the stats boxes at the top
- **Actual services** from your Supabase database
- **Search functionality** working with real data

### 5. Expected Data

With proper Supabase connection, you should see:

- ✅ **1000+ services** (instead of just 2 mock services)
- ✅ **Real organizations** like PCYC, Legal Aid Queensland, Headspace
- ✅ **Actual locations** across Queensland 
- ✅ **Live search** through the full database
- ✅ **Statistics** showing total services, organizations, locations

## 🔍 Troubleshooting

### Error: "Failed to connect to service database"

1. **Check environment variables** - Make sure `.env.local` has correct Supabase credentials
2. **Verify Supabase project** - Ensure your Supabase project is active
3. **Test API key** - Check that your anon key has proper permissions
4. **Check table names** - Ensure tables exist and have correct names

### No services showing

1. **Check data exists** - Verify you have services in your Supabase `services` table
2. **Project filter** - Services should have `project = 'youth-justice-service-finder'`
3. **Table relationships** - Ensure foreign keys are set up correctly

### Search not working

1. **Check API routes** - Ensure `/api/services/search` is working
2. **Verify permissions** - RLS policies might be blocking queries
3. **Test directly** - Try the API endpoints in browser/Postman

## 📊 Data Import

If you need to import service data:

1. **Use existing data extracts** from `src/modules/youth-justice-finder/archive/data-extracts/`
2. **Run import scripts** from the original module
3. **Use Supabase dashboard** to upload CSV data

## 🚀 Once Connected

After successful Supabase connection, you'll have:

- **Full service database** with 1000+ Queensland services
- **Geographic search** by location and region  
- **Category filtering** by service type
- **Real contact information** for each service
- **Live statistics** showing database size

The service finder will transform from a demo with 2 services to a **fully functional directory** with comprehensive Queensland youth justice services!