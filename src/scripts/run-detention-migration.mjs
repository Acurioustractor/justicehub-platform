#!/usr/bin/env node
/**
 * Run Youth Detention Facilities Migration
 *
 * This script checks if detention facilities tables exist and seeds data.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Detention facilities seed data
const DETENTION_FACILITIES = [
  // Queensland
  {
    name: 'Brisbane Youth Detention Centre',
    slug: 'brisbane-ydc',
    facility_type: 'youth_detention',
    city: 'Wacol',
    state: 'QLD',
    latitude: -27.5945,
    longitude: 152.9339,
    government_department: 'Department of Youth Justice',
    capacity_beds: 96,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'QLD Youth Justice Annual Report'
  },
  {
    name: 'Cleveland Youth Detention Centre',
    slug: 'cleveland-ydc',
    facility_type: 'youth_detention',
    city: 'Townsville',
    state: 'QLD',
    latitude: -19.2590,
    longitude: 146.8169,
    government_department: 'Department of Youth Justice',
    capacity_beds: 48,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'QLD Youth Justice Annual Report'
  },
  // NSW
  {
    name: 'Cobham Juvenile Justice Centre',
    slug: 'cobham-jjc',
    facility_type: 'youth_detention',
    city: 'Werrington',
    state: 'NSW',
    latitude: -33.7573,
    longitude: 150.7533,
    government_department: 'Youth Justice NSW',
    capacity_beds: 42,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'NSW Youth Justice Annual Report'
  },
  {
    name: 'Frank Baxter Juvenile Justice Centre',
    slug: 'frank-baxter-jjc',
    facility_type: 'youth_detention',
    city: 'Kariong',
    state: 'NSW',
    latitude: -33.4386,
    longitude: 151.2976,
    government_department: 'Youth Justice NSW',
    capacity_beds: 120,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'NSW Youth Justice Annual Report'
  },
  {
    name: 'Reiby Juvenile Justice Centre',
    slug: 'reiby-jjc',
    facility_type: 'youth_detention',
    city: 'Airds',
    state: 'NSW',
    latitude: -34.0819,
    longitude: 150.8281,
    government_department: 'Youth Justice NSW',
    capacity_beds: 60,
    security_level: 'medium',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'NSW Youth Justice Annual Report'
  },
  {
    name: 'Orana Juvenile Justice Centre',
    slug: 'orana-jjc',
    facility_type: 'youth_detention',
    city: 'Dubbo',
    state: 'NSW',
    latitude: -32.2569,
    longitude: 148.6011,
    government_department: 'Youth Justice NSW',
    capacity_beds: 30,
    security_level: 'medium',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'NSW Youth Justice Annual Report'
  },
  {
    name: 'Acmena Juvenile Justice Centre',
    slug: 'acmena-jjc',
    facility_type: 'youth_detention',
    city: 'Grafton',
    state: 'NSW',
    latitude: -29.6767,
    longitude: 152.9370,
    government_department: 'Youth Justice NSW',
    capacity_beds: 36,
    security_level: 'medium',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'NSW Youth Justice Annual Report'
  },
  // Victoria
  {
    name: 'Parkville Youth Justice Centre',
    slug: 'parkville-yjc',
    facility_type: 'youth_detention',
    city: 'Parkville',
    state: 'VIC',
    latitude: -37.7839,
    longitude: 144.9490,
    government_department: 'Department of Justice and Community Safety',
    capacity_beds: 100,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'VIC Youth Justice Annual Report'
  },
  {
    name: 'Malmsbury Youth Justice Centre',
    slug: 'malmsbury-yjc',
    facility_type: 'youth_detention',
    city: 'Malmsbury',
    state: 'VIC',
    latitude: -37.1859,
    longitude: 144.3743,
    government_department: 'Department of Justice and Community Safety',
    capacity_beds: 120,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'VIC Youth Justice Annual Report'
  },
  // WA
  {
    name: 'Banksia Hill Detention Centre',
    slug: 'banksia-hill',
    facility_type: 'youth_detention',
    city: 'Canning Vale',
    state: 'WA',
    latitude: -32.0766,
    longitude: 115.9180,
    government_department: 'Department of Justice WA',
    capacity_beds: 240,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'WA Corrective Services Annual Report'
  },
  // SA
  {
    name: 'Adelaide Youth Training Centre',
    slug: 'adelaide-ytc',
    facility_type: 'youth_detention',
    city: 'Cavan',
    state: 'SA',
    latitude: -34.8366,
    longitude: 138.5977,
    government_department: 'Department of Human Services SA',
    capacity_beds: 76,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'SA Youth Justice Annual Report'
  },
  // NT
  {
    name: 'Don Dale Youth Detention Centre',
    slug: 'don-dale',
    facility_type: 'youth_detention',
    city: 'Berrimah',
    state: 'NT',
    latitude: -12.4308,
    longitude: 130.9167,
    government_department: 'Territory Families',
    capacity_beds: 36,
    security_level: 'maximum',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'NT Territory Families Annual Report'
  },
  {
    name: 'Alice Springs Youth Detention Centre',
    slug: 'alice-springs-ydc',
    facility_type: 'youth_detention',
    city: 'Alice Springs',
    state: 'NT',
    latitude: -23.6980,
    longitude: 133.8807,
    government_department: 'Territory Families',
    capacity_beds: 24,
    security_level: 'medium',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'NT Territory Families Annual Report'
  },
  // Tasmania
  {
    name: 'Ashley Youth Detention Centre',
    slug: 'ashley-ydc',
    facility_type: 'youth_detention',
    city: 'Deloraine',
    state: 'TAS',
    latitude: -41.5175,
    longitude: 146.6503,
    government_department: 'Department of Communities Tasmania',
    capacity_beds: 51,
    security_level: 'medium',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'TAS Communities Annual Report'
  },
  // ACT
  {
    name: 'Bimberi Youth Justice Centre',
    slug: 'bimberi-yjc',
    facility_type: 'youth_detention',
    city: 'Mitchell',
    state: 'ACT',
    latitude: -35.2093,
    longitude: 149.1287,
    government_department: 'ACT Community Services',
    capacity_beds: 40,
    security_level: 'medium',
    has_therapeutic_programs: true,
    has_cultural_programs: true,
    operational_status: 'operational',
    data_source: 'ACT Community Services Annual Report'
  }
];

async function main() {
  console.log('============================================================');
  console.log('YOUTH DETENTION FACILITIES - CHECK & SEED');
  console.log('============================================================\n');

  // Check if table exists by trying to select
  const { data: existingFacilities, error: checkError } = await supabase
    .from('youth_detention_facilities')
    .select('id, name, state')
    .limit(100);

  if (checkError) {
    if (checkError.code === '42P01') {
      console.log('Table does not exist yet. Please run the SQL migration first.');
      console.log('\n1. Go to Supabase Dashboard SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql');
      console.log('\n2. Copy and run the SQL from:');
      console.log('   supabase/migrations/20260107000002_youth_detention_facilities.sql');
      return;
    }
    console.error('Error checking table:', checkError);
    return;
  }

  console.log(`Found ${existingFacilities?.length || 0} existing facilities\n`);

  if (existingFacilities && existingFacilities.length > 0) {
    console.log('Existing facilities:');
    const byState = {};
    existingFacilities.forEach(f => {
      byState[f.state] = byState[f.state] || [];
      byState[f.state].push(f.name);
    });
    Object.entries(byState).forEach(([state, facilities]) => {
      console.log(`  ${state}: ${facilities.length} facilities`);
    });
    console.log('\nTable already has data. Skipping seed.');
    return;
  }

  // Insert seed data
  console.log('Inserting detention facilities...\n');

  for (const facility of DETENTION_FACILITIES) {
    const { error } = await supabase
      .from('youth_detention_facilities')
      .upsert(facility, { onConflict: 'slug' });

    if (error) {
      console.log(`Failed ${facility.name}: ${error.message}`);
    } else {
      console.log(`Added ${facility.name} (${facility.state})`);
    }
  }

  // Verify
  const { count } = await supabase
    .from('youth_detention_facilities')
    .select('*', { count: 'exact', head: true });

  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Total facilities in database: ${count || 0}`);
}

main().catch(console.error);
