# Service Import Guide - 325 Organizations from Airtable

## Overview

We've successfully processed your Airtable mapping of **336 Queensland youth justice organizations** and generated SQL to import **325 unique organizations** (after deduplication) into the JusticeHub database.

## Current Status

- **Current services in database**: 34
- **Organizations to import**: 325
- **Expected total after import**: **~359 services**

## Import Methods

### Method 1: SQL Editor (Recommended - Fastest)

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor

2. **Run the Generated SQL**
   - Open file: `/supabase/safe-import.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify Import**
   - The SQL includes automatic verification queries
   - Check the results show ~325 organizations and ~359 total services

**Time**: ~30 seconds

### Method 2: CSV Import via Supabase UI

1. **Prepare CSV**
   - Use the existing `Grid view.csv` file

2. **Import Organizations**
   - Go to Supabase Dashboard → Table Editor → `organizations` table
   - Click "Insert" → "Import data from CSV"
   - Upload `Grid view.csv`
   - Map columns:
     - `Organisation Name` → `name`
     - Create formula for `description`: `[Organisation Type] - [Primary Focus]`

3. **Create Services**
   - After organizations imported, run the service creation script from generated SQL

**Time**: ~5 minutes

## What Gets Imported

### Organizations (325 unique)

Sample organizations included:
- **Legal Aid**: Youth Advocacy Centre, Legal Aid Queensland, Aboriginal and Torres Strait Islander Legal Service
- **Housing**: Brisbane Youth Service, Cairns Youth Foyer, Gold Coast Youth Foyer, Logan Youth Foyer
- **Mental Health**: Headspace, QPASTT, Youth Beyond Blue
- **Indigenous Support**: QATSICPP, Multiple Aboriginal Community Controlled services
- **Family Support**: Anglicare, UnitingCare, Mission Australia, YFS
- **Crisis Support**: Kids Helpline, Lifeline, Open Doors
- **Education**: Multiple PCYC programs, Alternative education providers
- **Court Support**: Youth Court services, Bail programs, Restorative justice
- **Detention**: Brisbane Youth Detention Centre, Cleveland Youth Detention Centre, West Moreton

### Automatic Category Mapping

Each service is automatically categorized based on keywords in the organization type and primary focus:

| Keyword Match | Assigned Category |
|---------------|-------------------|
| legal, court, advocacy | `legal_aid`, `advocacy` |
| housing, homeless, accommodation, foyer | `housing` |
| mental, counseling, wellbeing, trauma | `mental_health` |
| drug, alcohol, substance | `substance_abuse` |
| indigenous, aboriginal, torres strait, cultural | `cultural_support` |
| family, parent | `family_support` |
| education, training, employment, school | `education_training` |
| crisis, emergency | `crisis_support` |
| detention, bail, diversion | `court_support` |
| case management | `case_management` |

### Service Data Structure

Each service created includes:
- **Name**: Organization name
- **Description**: `[Organisation Type] - [Primary Focus]`
- **Categories**: Auto-assigned array based on keywords
- **Location**: Queensland, QLD (base location)
- **Data Source**: Airtable Manual Mapping
- **Verification Status**: pending (ready for enrichment)

## After Import - Next Steps

### 1. Enrich Services with Web Scraping

Run the enrichment script to add contact details, addresses, websites:

```bash
npm run enrich:services
```

This will:
- Visit each organization's website
- Extract contact information
- Add detailed service descriptions
- Populate operating hours
- Add eligibility criteria

### 2. Manual Review and Verification

Priority organizations to verify first:
1. **High-volume providers**: Mission Australia, Anglicare, UnitingCare
2. **Youth Foyers**: Cairns, Gold Coast, Logan, Townsville (housing + support)
3. **Legal services**: Youth Advocacy Centre, Legal Aid Queensland
4. **Indigenous services**: QATSICPP, ATSILS, Aboriginal health services

### 3. Add Missing Data

For services flagged as "pending", manually add:
- Contact phone numbers
- Email addresses
- Physical addresses
- Website URLs
- Opening hours
- Specific program details

## Files Generated

### SQL Import File
**Location**: `/supabase/generated-import.sql`
**Size**: 443 lines
**Contains**:
- INSERT statements for 325 organizations
- PL/pgSQL procedure to auto-create services
- Category auto-assignment logic
- Verification queries

### Generator Script
**Location**: `/scripts/generate-import-sql.js`
**Purpose**: Converts Airtable CSV to SQL
**Usage**: `node scripts/generate-import-sql.js > supabase/generated-import.sql`

### Source Data
**Location**: `/Grid view.csv`
**Rows**: 336 organizations
**Unique**: 325 (after deduplication)

## Expected Results

### Before Import
- Organizations: ~26
- Services: 34

### After Import
- Organizations: **~351** (+325)
- Services: **~359** (+325)

### Service Category Distribution (Estimated)

Based on Airtable data analysis:
- **Youth Support**: ~120 services
- **Cultural/Indigenous**: ~60 services
- **Legal/Advocacy**: ~40 services
- **Housing**: ~25 services
- **Mental Health**: ~20 services
- **Family Support**: ~30 services
- **Education/Training**: ~35 services
- **Recreation/Sports**: ~15 services
- **Other**: ~14 services

## Troubleshooting

### Issue: "Row-level security policy" errors
**Solution**: Use SQL Editor method (bypasses RLS)

### Issue: Duplicate organizations
**Solution**: SQL includes `ON CONFLICT (name) DO NOTHING` - safe to rerun

### Issue: Services not created
**Solution**: Run the service creation PL/pgSQL block separately

### Issue: Wrong categories assigned
**Solution**: Update category mapping logic in generated SQL and rerun

## Verification Queries

After import, run these to verify:

```sql
-- Check total counts
SELECT
  'Organizations' as type,
  COUNT(*) as count
FROM organizations
UNION ALL
SELECT
  'Services' as type,
  COUNT(*) as count
FROM services;

-- Check category distribution
SELECT
  unnest(categories) as category,
  COUNT(*) as count
FROM services
GROUP BY category
ORDER BY count DESC;

-- Check organizations without services
SELECT name
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM services);

-- Check most recent imports
SELECT name, created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 20;
```

## Summary

This import represents **10x growth** in the service directory:
- From 34 services → **359 services**
- Comprehensive Queensland coverage
- All major youth justice service categories
- Ready for enrichment with detailed data

🎉 **Impact**: JusticeHub will become the most comprehensive Queensland youth justice service directory!
