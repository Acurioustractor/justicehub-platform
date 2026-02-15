#!/usr/bin/env node
/**
 * Setup Detention Facilities via Supabase Database API
 *
 * Uses the Supabase postgrest API to execute SQL via a stored procedure.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Detention facilities data
const FACILITIES = [
  { name: 'Brisbane Youth Detention Centre', slug: 'brisbane-ydc', facility_type: 'youth_detention', city: 'Wacol', state: 'QLD', latitude: -27.5945, longitude: 152.9339, government_department: 'Department of Youth Justice', capacity_beds: 96, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'QLD Youth Justice Annual Report' },
  { name: 'Cleveland Youth Detention Centre', slug: 'cleveland-ydc', facility_type: 'youth_detention', city: 'Townsville', state: 'QLD', latitude: -19.2590, longitude: 146.8169, government_department: 'Department of Youth Justice', capacity_beds: 48, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'QLD Youth Justice Annual Report' },
  { name: 'Cobham Juvenile Justice Centre', slug: 'cobham-jjc', facility_type: 'youth_detention', city: 'Werrington', state: 'NSW', latitude: -33.7573, longitude: 150.7533, government_department: 'Youth Justice NSW', capacity_beds: 42, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'NSW Youth Justice Annual Report' },
  { name: 'Frank Baxter Juvenile Justice Centre', slug: 'frank-baxter-jjc', facility_type: 'youth_detention', city: 'Kariong', state: 'NSW', latitude: -33.4386, longitude: 151.2976, government_department: 'Youth Justice NSW', capacity_beds: 120, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'NSW Youth Justice Annual Report' },
  { name: 'Reiby Juvenile Justice Centre', slug: 'reiby-jjc', facility_type: 'youth_detention', city: 'Airds', state: 'NSW', latitude: -34.0819, longitude: 150.8281, government_department: 'Youth Justice NSW', capacity_beds: 60, security_level: 'medium', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'NSW Youth Justice Annual Report' },
  { name: 'Orana Juvenile Justice Centre', slug: 'orana-jjc', facility_type: 'youth_detention', city: 'Dubbo', state: 'NSW', latitude: -32.2569, longitude: 148.6011, government_department: 'Youth Justice NSW', capacity_beds: 30, security_level: 'medium', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'NSW Youth Justice Annual Report' },
  { name: 'Acmena Juvenile Justice Centre', slug: 'acmena-jjc', facility_type: 'youth_detention', city: 'Grafton', state: 'NSW', latitude: -29.6767, longitude: 152.9370, government_department: 'Youth Justice NSW', capacity_beds: 36, security_level: 'medium', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'NSW Youth Justice Annual Report' },
  { name: 'Parkville Youth Justice Centre', slug: 'parkville-yjc', facility_type: 'youth_detention', city: 'Parkville', state: 'VIC', latitude: -37.7839, longitude: 144.9490, government_department: 'Department of Justice and Community Safety', capacity_beds: 100, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'VIC Youth Justice Annual Report' },
  { name: 'Malmsbury Youth Justice Centre', slug: 'malmsbury-yjc', facility_type: 'youth_detention', city: 'Malmsbury', state: 'VIC', latitude: -37.1859, longitude: 144.3743, government_department: 'Department of Justice and Community Safety', capacity_beds: 120, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'VIC Youth Justice Annual Report' },
  { name: 'Banksia Hill Detention Centre', slug: 'banksia-hill', facility_type: 'youth_detention', city: 'Canning Vale', state: 'WA', latitude: -32.0766, longitude: 115.9180, government_department: 'Department of Justice WA', capacity_beds: 240, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'WA Corrective Services Annual Report' },
  { name: 'Adelaide Youth Training Centre', slug: 'adelaide-ytc', facility_type: 'youth_detention', city: 'Cavan', state: 'SA', latitude: -34.8366, longitude: 138.5977, government_department: 'Department of Human Services SA', capacity_beds: 76, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'SA Youth Justice Annual Report' },
  { name: 'Don Dale Youth Detention Centre', slug: 'don-dale', facility_type: 'youth_detention', city: 'Berrimah', state: 'NT', latitude: -12.4308, longitude: 130.9167, government_department: 'Territory Families', capacity_beds: 36, security_level: 'maximum', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'NT Territory Families Annual Report' },
  { name: 'Alice Springs Youth Detention Centre', slug: 'alice-springs-ydc', facility_type: 'youth_detention', city: 'Alice Springs', state: 'NT', latitude: -23.6980, longitude: 133.8807, government_department: 'Territory Families', capacity_beds: 24, security_level: 'medium', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'NT Territory Families Annual Report' },
  { name: 'Ashley Youth Detention Centre', slug: 'ashley-ydc', facility_type: 'youth_detention', city: 'Deloraine', state: 'TAS', latitude: -41.5175, longitude: 146.6503, government_department: 'Department of Communities Tasmania', capacity_beds: 51, security_level: 'medium', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'TAS Communities Annual Report' },
  { name: 'Bimberi Youth Justice Centre', slug: 'bimberi-yjc', facility_type: 'youth_detention', city: 'Mitchell', state: 'ACT', latitude: -35.2093, longitude: 149.1287, government_department: 'ACT Community Services', capacity_beds: 40, security_level: 'medium', has_therapeutic_programs: true, has_cultural_programs: true, operational_status: 'operational', data_source: 'ACT Community Services Annual Report' }
];

async function main() {
  console.log('============================================================');
  console.log('DETENTION FACILITIES SETUP VIA SUPABASE API');
  console.log('============================================================\n');

  // Try executing SQL via the Data API
  const projectRef = 'tednluwflfhxyucgwigh';

  // First check if we can access the Management API
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log('Attempting to use Supabase Management API...\n');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS youth_detention_facilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      facility_type TEXT DEFAULT 'youth_detention',
      street_address TEXT,
      suburb TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postcode TEXT,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      operational_status TEXT DEFAULT 'operational',
      opened_date DATE,
      closed_date DATE,
      capacity_beds INTEGER,
      current_population INTEGER,
      male_capacity INTEGER,
      female_capacity INTEGER,
      age_range_min INTEGER DEFAULT 10,
      age_range_max INTEGER DEFAULT 18,
      government_department TEXT NOT NULL,
      managing_agency TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      website TEXT,
      security_level TEXT DEFAULT 'mixed',
      has_remand_section BOOLEAN DEFAULT true,
      has_sentenced_section BOOLEAN DEFAULT true,
      has_therapeutic_programs BOOLEAN DEFAULT false,
      has_education_programs BOOLEAN DEFAULT true,
      has_cultural_programs BOOLEAN DEFAULT false,
      has_indigenous_liaison BOOLEAN DEFAULT false,
      indigenous_population_percentage DECIMAL(5,2),
      data_source TEXT,
      data_source_url TEXT,
      last_data_update DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE youth_detention_facilities ENABLE ROW LEVEL SECURITY;

    -- Allow public read access
    CREATE POLICY IF NOT EXISTS "Public read access" ON youth_detention_facilities
      FOR SELECT USING (true);
  `;

  // Try direct HTTP call to management API
  try {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    if (!accessToken) {
      console.log('No SUPABASE_ACCESS_TOKEN found.');
      console.log('Please run the SQL manually in the Supabase Dashboard.\n');
      console.log('URL: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql/new\n');
      console.log('After creating the table, run: node src/scripts/seed-detention-data.mjs');
      return;
    }

    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: createTableSQL })
    });

    if (response.ok) {
      console.log('Table created successfully via Management API!');
    } else {
      const error = await response.text();
      console.log('Management API error:', error);
    }
  } catch (err) {
    console.log('Could not use Management API:', err.message);
  }

  // As fallback, provide instructions
  console.log('\n============================================================');
  console.log('MANUAL SETUP INSTRUCTIONS');
  console.log('============================================================\n');
  console.log('1. Open: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql/new');
  console.log('2. Run the full SQL from: supabase/migrations/20260107000002_youth_detention_facilities.sql');
  console.log('3. Then run: node src/scripts/seed-detention-data.mjs');
}

main().catch(console.error);
