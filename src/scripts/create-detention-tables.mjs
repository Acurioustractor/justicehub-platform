#!/usr/bin/env node
/**
 * Create Youth Detention Facilities Tables
 *
 * Uses Supabase management API to create tables directly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createTables() {
  console.log('============================================================');
  console.log('CREATING YOUTH DETENTION FACILITIES TABLES');
  console.log('============================================================\n');

  // Main detention facilities table
  const createFacilitiesSQL = `
    CREATE TABLE IF NOT EXISTS youth_detention_facilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      facility_type TEXT CHECK (facility_type IN (
        'youth_detention', 'remand_centre', 'training_centre',
        'watch_house', 'therapeutic_facility', 'transition_facility'
      )) NOT NULL DEFAULT 'youth_detention',
      street_address TEXT,
      suburb TEXT,
      city TEXT NOT NULL,
      state TEXT CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')) NOT NULL,
      postcode TEXT,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      operational_status TEXT CHECK (operational_status IN (
        'operational', 'under_construction', 'closed', 'temporary_closure'
      )) DEFAULT 'operational',
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
      security_level TEXT CHECK (security_level IN (
        'minimum', 'medium', 'maximum', 'mixed'
      )) DEFAULT 'mixed',
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
  `;

  // Create facility partnerships table
  const createPartnershipsSQL = `
    CREATE TABLE IF NOT EXISTS facility_partnerships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      facility_id UUID REFERENCES youth_detention_facilities(id) ON DELETE CASCADE,
      partner_type TEXT CHECK (partner_type IN (
        'organization', 'community_program', 'service'
      )) NOT NULL,
      organization_id UUID,
      program_id UUID,
      service_id UUID,
      partnership_type TEXT CHECK (partnership_type IN (
        'in_facility_program', 'post_release_support', 'bail_support',
        'family_connection', 'education_provider', 'health_provider',
        'legal_support', 'cultural_program', 'mentoring',
        'housing_support', 'employment_support', 'advocacy', 'other'
      )) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      start_date DATE,
      end_date DATE,
      participants_served INTEGER,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Add columns to community_programs
  const addCoordsToPrograms = `
    ALTER TABLE community_programs
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
  `;

  // Use fetch to call Supabase REST API for SQL execution
  const projectRef = 'tednluwflfhxyucgwigh';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Executing SQL via Supabase...');

  // Try using the Postgres connection through REST API
  // Since we can't execute raw SQL easily, let's check what we can do

  // First, let's see if the table exists by trying an RPC call
  const { data: rpcResult, error: rpcError } = await supabase.rpc('check_table_exists', {
    table_name: 'youth_detention_facilities'
  });

  if (rpcError && rpcError.code === 'PGRST202') {
    console.log('RPC not available. Checking table directly...');

    // Just try to query the table - if it doesn't exist we'll get an error
    const { error: queryError } = await supabase
      .from('youth_detention_facilities')
      .select('id')
      .limit(1);

    if (queryError && queryError.code === '42P01') {
      console.log('\nTable does not exist. Run this SQL in Supabase Dashboard:\n');
      console.log('https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql/new\n');
      console.log('------- COPY SQL BELOW -------\n');
      console.log(createFacilitiesSQL);
      console.log('\n-- Also run:');
      console.log(createPartnershipsSQL);
      console.log('\n-- And add coordinates to community_programs:');
      console.log(addCoordsToPrograms);
      console.log('\n------- END SQL -------\n');
      console.log('After running the SQL, run this script again to seed data.');
      return false;
    }
  }

  console.log('Table exists! Proceeding with data seed...');
  return true;
}

// Seed data
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

async function seedData() {
  console.log('\nSeeding detention facilities...\n');

  let inserted = 0;
  for (const facility of FACILITIES) {
    const { error } = await supabase
      .from('youth_detention_facilities')
      .upsert(facility, { onConflict: 'slug' });

    if (error) {
      console.log(`  X ${facility.name}: ${error.message}`);
    } else {
      console.log(`  + ${facility.name} (${facility.state})`);
      inserted++;
    }
  }

  console.log(`\nInserted ${inserted} facilities`);
}

async function main() {
  const tableExists = await createTables();
  if (tableExists) {
    await seedData();
  }
}

main().catch(console.error);
