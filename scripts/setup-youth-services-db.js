#!/usr/bin/env node

/**
 * Setup script to create Youth Justice Service Finder database tables
 * and import data from the integrated modules
 */

const fs = require('fs');
const path = require('path');

// Database setup SQL
const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],
  keywords TEXT[],
  minimum_age INTEGER,
  maximum_age INTEGER,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  name TEXT NOT NULL,
  website TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table  
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  street_address TEXT,
  locality TEXT,
  region TEXT,
  state TEXT DEFAULT 'QLD',
  postcode TEXT,
  coordinates POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_type TEXT DEFAULT 'general', -- general, phone, email, website
  phone TEXT,
  email TEXT,
  website TEXT,
  hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_project ON services(project);
CREATE INDEX IF NOT EXISTS idx_services_categories ON services USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_organizations_project ON organizations(project);
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
CREATE INDEX IF NOT EXISTS idx_contacts_project ON contacts(project);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY IF NOT EXISTS "Public read access for services" ON services FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for locations" ON locations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for contacts" ON contacts FOR SELECT USING (true);
`;

// Function to load and parse service data
function loadServiceData() {
  const dataFiles = [
    'src/modules/youth-justice-finder/archive/data-extracts/MASTER-Queensland-Youth-Services.json',
    'src/modules/youth-justice-finder/archive/data-extracts/MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json'
  ];

  let allServices = [];
  
  for (const filePath of dataFiles) {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.services && Array.isArray(data.services)) {
          allServices = allServices.concat(data.services);
          console.log(`📄 Loaded ${data.services.length} services from ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error loading ${filePath}:`, error.message);
    }
  }

  return allServices;
}

// Function to generate SQL INSERT statements
function generateInsertSQL(services) {
  const organizations = new Map();
  const serviceInserts = [];
  const locationInserts = [];
  const contactInserts = [];

  services.forEach(service => {
    // Generate organization if it exists
    if (service.organizations && service.organizations.name) {
      const orgId = service.organization_id || `org-${service.organizations.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      if (!organizations.has(orgId)) {
        organizations.set(orgId, {
          id: orgId,
          name: service.organizations.name,
          website: service.organizations.website || null
        });
      }
    }

    // Generate service insert
    const serviceId = service.id || `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    serviceInserts.push(`
      ('${serviceId}', 'youth-justice-service-finder', '${(service.name || '').replace(/'/g, "''")}', 
       '${(service.description || '').replace(/'/g, "''")}', 
       ARRAY[${(service.categories || []).map(c => `'${c.replace(/'/g, "''")}'`).join(',')}],
       ARRAY[${(service.keywords || []).map(k => `'${k.replace(/'/g, "''")}'`).join(',')}],
       ${service.minimum_age || 'NULL'}, ${service.maximum_age || 'NULL'},
       ${service.organization_id ? `'${service.organization_id}'` : 'NULL'})
    `);

    // Generate location insert if exists
    if (service.locations) {
      const loc = service.locations;
      locationInserts.push(`
        (uuid_generate_v4(), 'youth-justice-service-finder', '${serviceId}', NULL,
         '${(loc.street_address || '').replace(/'/g, "''")}',
         '${(loc.locality || '').replace(/'/g, "''")}',
         '${(loc.region || '').replace(/'/g, "''")}',
         '${(loc.state || 'QLD').replace(/'/g, "''")}',
         '${(loc.postcode || '').replace(/'/g, "''")}', NULL)
      `);
    }

    // Generate contact insert if exists
    if (service.contacts) {
      const contact = service.contacts;
      contactInserts.push(`
        (uuid_generate_v4(), 'youth-justice-service-finder', '${serviceId}', NULL, 'general',
         '${(contact.phone || '').replace(/'/g, "''")}',
         '${(contact.email || '').replace(/'/g, "''")}',
         '${(contact.website || '').replace(/'/g, "''")}', NULL)
      `);
    }
  });

  // Generate organization inserts
  const orgInserts = Array.from(organizations.values()).map(org => `
    ('${org.id}', 'youth-justice-service-finder', '${org.name.replace(/'/g, "''")}', 
     '${(org.website || '').replace(/'/g, "''")}', NULL, NULL)
  `);

  return {
    createTables: createTablesSQL,
    insertOrganizations: orgInserts.length > 0 ? `
      INSERT INTO organizations (id, project, name, website, email, phone) VALUES 
      ${orgInserts.join(',')};
    ` : '',
    insertServices: serviceInserts.length > 0 ? `
      INSERT INTO services (id, project, name, description, categories, keywords, minimum_age, maximum_age, organization_id) VALUES 
      ${serviceInserts.join(',')};
    ` : '',
    insertLocations: locationInserts.length > 0 ? `
      INSERT INTO locations (id, project, service_id, organization_id, street_address, locality, region, state, postcode, coordinates) VALUES 
      ${locationInserts.join(',')};
    ` : '',
    insertContacts: contactInserts.length > 0 ? `
      INSERT INTO contacts (id, project, service_id, organization_id, contact_type, phone, email, website, hours) VALUES 
      ${contactInserts.join(',')};
    ` : ''
  };
}

// Main execution
console.log('🚀 Setting up Youth Justice Service Finder database...');

const services = loadServiceData();
console.log(`📊 Found ${services.length} total services to import`);

if (services.length === 0) {
  console.log('❌ No service data found. Make sure the data files exist in the modules directory.');
  process.exit(1);
}

const sql = generateInsertSQL(services.slice(0, 100)); // Limit to first 100 for testing

// Write SQL to file
const outputFile = 'setup-youth-services.sql';
const fullSQL = [
  '-- Youth Justice Service Finder Database Setup',
  '-- Generated: ' + new Date().toISOString(),
  '',
  sql.createTables,
  '',
  sql.insertOrganizations,
  '',
  sql.insertServices,
  '',
  sql.insertLocations,
  '',
  sql.insertContacts
].join('\n');

fs.writeFileSync(outputFile, fullSQL);

console.log(`✅ Generated SQL setup file: ${outputFile}`);
console.log('📋 Next steps:');
console.log('1. Run this SQL in your Supabase SQL editor');
console.log('2. Or use: psql "your_supabase_connection_string" -f setup-youth-services.sql');
console.log('3. Restart your development server');
console.log('4. Visit /services to see the imported data');