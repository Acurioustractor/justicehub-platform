# Schema Analysis & Scraping Strategy

## Current Database Schema Analysis

### ⚠️ **SCHEMA MISMATCH IDENTIFIED**

You have **TWO DIFFERENT `services` table schemas** in your database:

#### 1. **Main Platform Schema** (`20250120000001_initial_schema.sql`)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,              -- ❌ Missing in seed data
  organization_id UUID REFERENCES organizations(id),
  description TEXT NOT NULL,
  program_type TEXT NOT NULL,              -- ❌ Missing in seed data
  service_category TEXT[],                 -- ✅ Similar to 'categories'
  target_age_min INTEGER,                  -- ✅ Maps to minimum_age
  target_age_max INTEGER,                  -- ✅ Maps to maximum_age
  delivery_method TEXT[],                  -- ❌ Missing in seed data
  capacity_total INTEGER,                  -- ❌ Missing in seed data
  capacity_current INTEGER,                -- ❌ Missing in seed data
  is_accepting_referrals BOOLEAN,          -- ❌ Missing in seed data
  cost TEXT,                               -- ❌ Missing in seed data
  eligibility_criteria TEXT[],             -- ❌ Missing in seed data
  location_address TEXT,                   -- ⚠️ Separate table in seed
  location_city TEXT,                      -- ⚠️ Separate table in seed
  location_state TEXT,                     -- ⚠️ Separate table in seed
  location_postcode TEXT,                  -- ⚠️ Separate table in seed
  contact_phone TEXT,                      -- ⚠️ Separate table in seed
  contact_email TEXT,                      -- ⚠️ Separate table in seed
  website_url TEXT,                        -- ⚠️ Separate table in seed
  success_rate DECIMAL(5,2),               -- ❌ Missing in seed data
  is_featured BOOLEAN,                     -- ❌ Missing in seed data
  is_active BOOLEAN,                       -- ❌ Missing in seed data
  tags TEXT[],                             -- ✅ Similar to 'keywords'
  operating_hours JSONB,                   -- ❌ Missing in seed data
  metadata JSONB                           -- ❌ Missing in seed data
);
```

#### 2. **Youth Services Seed Schema** (`setup-youth-services.sql`)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  project TEXT DEFAULT 'youth-justice-service-finder',  -- ✅ For multi-tenancy
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],                       -- ✅ Has data
  keywords TEXT[],                         -- ✅ Has data
  minimum_age INTEGER,                     -- ✅ Has data
  maximum_age INTEGER,                     -- ✅ Has data
  organization_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Separate linked tables:
CREATE TABLE organizations (...)
CREATE TABLE locations (...)              -- ✅ Better normalization
CREATE TABLE contacts (...)               -- ✅ Better normalization
```

---

## 🚨 **Issues & Recommendations**

### **Issue 1: Schema Conflicts**
The main platform schema expects different fields than what the seed data provides.

**Solutions:**
1. **Option A: Migrate seed data to main schema** (Recommended)
   - Transform seed data to match main platform schema
   - Add missing required fields with sensible defaults
   - Merge location/contact data into main services table

2. **Option B: Use separate tables** (Current state)
   - Keep youth services in separate normalized tables
   - Create views to bridge both schemas
   - Update frontend to query normalized structure

3. **Option C: Unified hybrid schema** (Best long-term)
   - Create new migration that merges both approaches
   - Preserve normalization for locations/contacts
   - Add all enrichment fields to services table

### **Issue 2: Frontend Expectations**

Looking at [ServiceFinderWidget.tsx](src/components/modules/ServiceFinderWidget.tsx:24-79), the frontend expects:

```typescript
interface Service {
  id: string;
  name: string;
  description?: string;
  categories?: string[];                // ✅ Available
  keywords?: string[];                  // ✅ Available
  minimum_age?: number;                 // ✅ Available
  maximum_age?: number;                 // ✅ Available
  age_range?: {                         // ⚠️ Computed field
    minimum?: number;
    maximum?: number;
  };
  youth_specific?: boolean;             // ❌ Missing
  indigenous_specific?: boolean;        // ❌ Missing
  organization?: {                      // ⚠️ Needs JOIN
    id?: string;
    name?: string;
    type?: string;
    website?: string;
  };
  organizations?: {                     // ⚠️ Alternative structure
    id: string;
    name: string;
    website?: string;
  };
  location?: {                          // ⚠️ Needs JOIN
    address?: string;
    city?: string;
    region?: string;
    state?: string;
    postcode?: string;
  };
  locations?: {                         // ⚠️ Alternative structure
    id: string;
    street_address?: string;
    locality?: string;
    region?: string;
    state?: string;
    postcode?: string;
  };
  contact?: {                           // ⚠️ Needs JOIN
    phone?: any;
    email?: any;
    website?: string;
    hours?: string;
  };
  contacts?: {                          // ⚠️ Alternative structure
    id: string;
    phone?: string;
    email?: string;
    website?: string;
    hours?: string;
  };
  url?: string;
  score?: number;                       // ❌ For search relevance
}
```

---

## ✅ **Recommended Unified Schema for Scraping**

### **Enhanced Services Table**
```sql
CREATE TABLE IF NOT EXISTS services (
  -- Core identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  project TEXT DEFAULT 'youth-justice-service-finder',

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Classification (scraping targets)
  categories TEXT[] DEFAULT '{}',           -- legal_aid, mental_health, housing, etc.
  keywords TEXT[] DEFAULT '{}',             -- aboriginal, crisis, court, etc.
  service_type TEXT,                        -- direct_service, referral, information
  program_type TEXT,                        -- case_management, counseling, legal, etc.

  -- Target demographics (scraping targets)
  target_age_min INTEGER,
  target_age_max INTEGER,
  youth_specific BOOLEAN DEFAULT false,
  indigenous_specific BOOLEAN DEFAULT false,
  gender_specific TEXT[],                   -- all, male, female, non_binary

  -- Service details (scraping targets)
  eligibility_criteria TEXT[],
  cost TEXT,                                -- free, subsidized, fee_based
  delivery_method TEXT[],                   -- in_person, online, phone, outreach
  languages_supported TEXT[],
  accessibility_features TEXT[],

  -- Capacity & availability (scraping targets)
  is_accepting_referrals BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  capacity_total INTEGER,
  capacity_current INTEGER DEFAULT 0,
  waitlist_time_weeks INTEGER,

  -- Location (for services with single location)
  location_type TEXT,                       -- fixed, mobile, online, statewide
  street_address TEXT,
  locality TEXT,
  city TEXT,
  region TEXT,
  state TEXT,
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_area TEXT[],                      -- suburbs/regions covered

  -- Contact (primary contact info)
  contact_phone TEXT,
  contact_email TEXT,
  website_url TEXT,
  online_booking_url TEXT,
  operating_hours JSONB,                    -- { "mon": "9-5", "tue": "9-5", ... }

  -- Relationships
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  parent_service_id UUID REFERENCES services(id),  -- For service hierarchies

  -- Quality & verification (for AI scraping)
  data_source TEXT,                         -- scraped_website, manual_entry, api_import
  data_source_url TEXT,                     -- Original URL scraped from
  last_verified_at TIMESTAMP,
  verification_status TEXT DEFAULT 'unverified', -- verified, unverified, needs_review
  scrape_confidence_score DECIMAL(3,2),     -- 0.00-1.00 AI confidence
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',              -- Flexible for additional scraped data

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scraped_at TIMESTAMP WITH TIME ZONE
);

-- Linked tables for multi-location services
CREATE TABLE IF NOT EXISTS service_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  location_name TEXT,                       -- e.g., "Brisbane Office"
  street_address TEXT,
  locality TEXT,
  city TEXT,
  region TEXT,
  state TEXT,
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  contact_phone TEXT,
  contact_email TEXT,
  operating_hours JSONB,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Linked table for service contacts
CREATE TABLE IF NOT EXISTS service_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  contact_type TEXT,                        -- general, crisis, intake, admin
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  hours TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations (enhanced)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT,                                -- nonprofit, government, community, private
  abn TEXT,
  website_url TEXT,
  email TEXT,
  phone TEXT,
  description TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 **Optimal Scraping Strategy**

### **Data Points to Extract (Priority Order)**

#### **Tier 1: Essential Fields** (Must extract)
1. ✅ `name` - Service name
2. ✅ `description` - What the service does
3. ✅ `categories` - Service type(s)
4. ✅ `organization.name` - Provider organization
5. ✅ `contact_phone` - Primary phone number
6. ✅ `website_url` - Service website
7. ✅ `location` - At least city/region

#### **Tier 2: Important Fields** (Extract when available)
8. ✅ `eligibility_criteria` - Who can access
9. ✅ `target_age_min/max` - Age range
10. ✅ `cost` - Free/subsidized/paid
11. ✅ `operating_hours` - When available
12. ✅ `street_address` - Full address
13. ✅ `contact_email` - Email contact
14. ✅ `keywords` - Additional tags

#### **Tier 3: Enhanced Fields** (Extract if present)
15. ✅ `delivery_method` - How service is delivered
16. ✅ `indigenous_specific` - Cultural appropriateness
17. ✅ `youth_specific` - Youth-focused service
18. ✅ `is_accepting_referrals` - Current availability
19. ✅ `languages_supported` - Language accessibility
20. ✅ `accessibility_features` - Physical accessibility

#### **Tier 4: Quality Assurance** (Auto-generated)
21. ✅ `data_source_url` - Where scraped from
22. ✅ `scrape_confidence_score` - AI confidence (0-1)
23. ✅ `last_scraped_at` - Freshness timestamp
24. ✅ `verification_status` - Review status

---

## 📊 **Database View for Frontend Compatibility**

Create a view that matches frontend expectations:

```sql
CREATE OR REPLACE VIEW services_complete AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.description,
  s.categories,
  s.keywords,
  s.target_age_min AS minimum_age,
  s.target_age_max AS maximum_age,
  jsonb_build_object(
    'minimum', s.target_age_min,
    'maximum', s.target_age_max
  ) AS age_range,
  s.youth_specific,
  s.indigenous_specific,
  s.website_url AS url,
  s.is_active AS active,

  -- Organization data
  jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'type', o.type,
    'website', o.website_url
  ) AS organization,

  -- Primary location data
  jsonb_build_object(
    'address', s.street_address,
    'locality', s.locality,
    'city', s.city,
    'region', s.region,
    'state', s.state,
    'postcode', s.postcode
  ) AS location,

  -- Primary contact data
  jsonb_build_object(
    'phone', s.contact_phone,
    'email', s.contact_email,
    'website', s.website_url,
    'hours', s.operating_hours
  ) AS contact,

  -- All locations (array)
  (
    SELECT json_agg(
      jsonb_build_object(
        'id', sl.id,
        'street_address', sl.street_address,
        'locality', sl.locality,
        'region', sl.region,
        'state', sl.state,
        'postcode', sl.postcode
      )
    )
    FROM service_locations sl
    WHERE sl.service_id = s.id
  ) AS locations,

  -- All contacts (array)
  (
    SELECT json_agg(
      jsonb_build_object(
        'id', sc.id,
        'phone', sc.phone,
        'email', sc.email,
        'website', sc.website,
        'hours', sc.hours
      )
    )
    FROM service_contacts sc
    WHERE sc.service_id = s.id
  ) AS contacts,

  s.created_at,
  s.updated_at,
  s.last_scraped_at

FROM services s
LEFT JOIN organizations o ON s.organization_id = o.id
WHERE s.is_active = true;
```

---

## 🤖 **AI Extraction Schema (for Claude/GPT-4)**

### **JSON Schema for Structured Extraction**

```typescript
const ServiceExtractionSchema = {
  type: "object",
  required: ["name", "description", "categories"],
  properties: {
    // Tier 1: Essential
    name: { type: "string", description: "Official service name" },
    description: { type: "string", description: "What the service provides" },
    categories: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "legal_aid", "mental_health", "housing", "crisis_support",
          "education_training", "substance_abuse", "family_support",
          "cultural_support", "advocacy", "court_support", "diversion",
          "case_management", "mentoring", "recreation", "health"
        ]
      }
    },
    organization_name: { type: "string" },
    contact_phone: { type: "string" },
    website_url: { type: "string", format: "uri" },

    // Tier 2: Important
    eligibility_criteria: { type: "array", items: { type: "string" } },
    target_age_min: { type: "integer", minimum: 0, maximum: 100 },
    target_age_max: { type: "integer", minimum: 0, maximum: 100 },
    cost: { type: "string", enum: ["free", "subsidized", "fee_based", "unknown"] },
    operating_hours: { type: "object" },
    location: {
      type: "object",
      properties: {
        street_address: { type: "string" },
        locality: { type: "string" },
        city: { type: "string" },
        region: { type: "string" },
        state: { type: "string" },
        postcode: { type: "string" }
      }
    },

    // Tier 3: Enhanced
    delivery_method: {
      type: "array",
      items: {
        type: "string",
        enum: ["in_person", "online", "phone", "outreach", "mobile"]
      }
    },
    indigenous_specific: { type: "boolean" },
    youth_specific: { type: "boolean" },
    languages_supported: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },

    // Confidence & metadata
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "AI confidence in extraction (0-1)"
    },
    extraction_notes: {
      type: "string",
      description: "Any uncertainties or notes about the extraction"
    }
  }
};
```

---

## 🚀 **Immediate Action Plan**

### **Step 1: Fix Schema Mismatch** ✅
```sql
-- Create migration: 20250121000001_unify_services_schema.sql
-- Add missing fields to existing services table
-- Preserve existing seed data
```

### **Step 2: Create Database View** ✅
```sql
-- Create services_complete view for frontend
-- Update API routes to use view
```

### **Step 3: Build Scraping Pipeline** ✅
1. **Playwright scraper** → Extract raw HTML
2. **Claude AI extraction** → Structured JSON (using schema above)
3. **Validation layer** → Check required fields, confidence scores
4. **Supabase ingestion** → Insert/update with proper relationships

### **Step 4: Update Frontend** (if needed)
```typescript
// Update API route to use unified view
const { data } = await supabase
  .from('services_complete')
  .select('*')
  .eq('active', true);
```

---

## 📈 **Expected Outcomes**

### **Before Unification**
- ❌ Schema conflicts between seed data and platform
- ❌ Frontend expecting fields that don't exist
- ❌ No standardized scraping structure
- ❌ Difficult to add new services programmatically

### **After Unification**
- ✅ Single source of truth for services schema
- ✅ Frontend fully compatible with database
- ✅ AI can extract to standardized format
- ✅ Confidence scores for data quality
- ✅ Easy to scale to thousands of services
- ✅ Proper normalization for multi-location services
- ✅ Audit trail with source URLs and timestamps

---

## 🔍 **Next Steps**

Would you like me to:
1. **Create the unified migration SQL** to fix the schema?
2. **Build the database view** for frontend compatibility?
3. **Update the API routes** to use the new structure?
4. **Start building the scraper** with the unified schema?

Choose your path forward! 🚀
