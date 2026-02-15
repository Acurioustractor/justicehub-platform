#!/usr/bin/env node

/**
 * Generate SAFE SQL INSERT statements from Airtable CSV
 * Uses DO block to check for existing records
 */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'Grid view.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.split('\n');
const organizations = [];
const seen = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cols.push(current.trim());

  const orgName = cols[0]?.replace(/^["']|["']$/g, '').trim();
  const orgType = cols[1]?.replace(/^["']|["']$/g, '').trim();
  const primaryFocus = cols[2]?.replace(/^["']|["']$/g, '').trim();

  if (!orgName || seen.has(orgName)) continue;
  seen.add(orgName);

  // Escape single quotes for SQL
  const escapeName = orgName.replace(/'/g, "''");
  const escapeDesc = `${orgType} - ${primaryFocus}`.replace(/'/g, "''");

  organizations.push({ name: escapeName, description: escapeDesc });
}

console.log('-- Import organizations from Airtable CSV');
console.log('-- Safe import using DO block');
console.log('-- Generated:', new Date().toISOString());
console.log('-- Total unique organizations:', organizations.length);
console.log('');

console.log('DO $$');
console.log('DECLARE');
console.log('  org_id UUID;');
console.log('  service_categories TEXT[];');
console.log('  orgs_created INT := 0;');
console.log('  services_created INT := 0;');
console.log('BEGIN');

organizations.forEach((org, idx) => {
  console.log('');
  console.log(`  -- Organization ${idx + 1}: ${org.name.substring(0, 50)}`);
  console.log('  SELECT id INTO org_id FROM organizations WHERE name = ' + `'${org.name}';`);
  console.log('  ');
  console.log('  IF org_id IS NULL THEN');
  console.log('    INSERT INTO organizations (name, description, website_url)');
  console.log(`    VALUES ('${org.name}', '${org.description}', NULL)`);
  console.log('    RETURNING id INTO org_id;');
  console.log('    orgs_created := orgs_created + 1;');
  console.log('  END IF;');
  console.log('  ');
  console.log('  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN');
  console.log("    service_categories := ARRAY['support'];");
  console.log('    ');

  // Category logic
  if (org.description.toLowerCase().includes('legal') ||
      org.description.toLowerCase().includes('court') ||
      org.description.toLowerCase().includes('advocacy')) {
    console.log("    service_categories := array_append(service_categories, 'legal_aid');");
    console.log("    service_categories := array_append(service_categories, 'advocacy');");
  }

  if (org.description.toLowerCase().includes('housing') ||
      org.description.toLowerCase().includes('homeless') ||
      org.description.toLowerCase().includes('accommodation')) {
    console.log("    service_categories := array_append(service_categories, 'housing');");
  }

  if (org.description.toLowerCase().includes('mental') ||
      org.description.toLowerCase().includes('counseling') ||
      org.description.toLowerCase().includes('wellbeing')) {
    console.log("    service_categories := array_append(service_categories, 'mental_health');");
  }

  if (org.description.toLowerCase().includes('indigenous') ||
      org.description.toLowerCase().includes('aboriginal') ||
      org.description.toLowerCase().includes('cultural')) {
    console.log("    service_categories := array_append(service_categories, 'cultural_support');");
  }

  if (org.description.toLowerCase().includes('family')) {
    console.log("    service_categories := array_append(service_categories, 'family_support');");
  }

  if (org.description.toLowerCase().includes('education') ||
      org.description.toLowerCase().includes('training')) {
    console.log("    service_categories := array_append(service_categories, 'education_training');");
  }

  if (org.description.toLowerCase().includes('detention') ||
      org.description.toLowerCase().includes('bail') ||
      org.description.toLowerCase().includes('diversion')) {
    console.log("    service_categories := array_append(service_categories, 'court_support');");
  }

  console.log('    ');
  console.log('    INSERT INTO services (');
  console.log('      name, slug, description, program_type, service_category,');
  console.log('      organization_id, location_city, location_state');
  console.log('    )');
  console.log(`    VALUES (`);
  console.log(`      '${org.name}',`);
  console.log(`      lower(regexp_replace('${org.name}', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),`);
  console.log(`      '${org.description}',`);
  console.log(`      'support',`);
  console.log(`      service_categories,`);
  console.log(`      org_id,`);
  console.log(`      'Queensland',`);
  console.log(`      'QLD'`);
  console.log('    );');
  console.log('    services_created := services_created + 1;');
  console.log('  END IF;');
});

console.log('');
console.log("  RAISE NOTICE 'Import complete: % orgs created, % services created', orgs_created, services_created;");
console.log('END $$;');
console.log('');
console.log('-- Verify results');
console.log("SELECT 'Organizations' as type, COUNT(*) as total FROM organizations");
console.log('UNION ALL');
console.log("SELECT 'Services' as type, COUNT(*) as total FROM services;");
