#!/usr/bin/env node

/**
 * Generate SQL INSERT statements from Airtable CSV
 *
 * Usage: node scripts/generate-import-sql.js > supabase/generated-import.sql
 */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'Grid view.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.split('\n');
const headers = lines[0].replace('\ufeff', '').split(',').map(h => h.trim());

console.log('-- Auto-generated SQL from Airtable CSV');
console.log('-- Generated:', new Date().toISOString());
console.log('-- Total rows:', lines.length - 1);
console.log('');
console.log('-- Insert organizations');
console.log('INSERT INTO organizations (name, description, website_url) VALUES');

const orgValues = [];
const seen = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Handle CSV parsing with commas in quoted fields
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

  orgValues.push(`  ('${escapeName}', '${escapeDesc}', NULL)`);
}

console.log(orgValues.join(',\n'));
console.log('ON CONFLICT (name) DO NOTHING;');
console.log('');
console.log('-- Create services from organizations');
console.log(`
DO $$
DECLARE
  org_record RECORD;
  service_categories TEXT[];
  csv_data TEXT[][] := ARRAY[
    ${orgValues.map((_, idx) => `ARRAY['org_${idx}']`).slice(0, 10).join(',\n    ')}
  ];
BEGIN
  FOR org_record IN
    SELECT id, name, description FROM organizations
    WHERE NOT EXISTS (
      SELECT 1 FROM services WHERE organization_id = organizations.id
    )
  LOOP
    -- Determine categories based on description
    service_categories := ARRAY['support']; -- Default

    IF org_record.description ILIKE '%legal%' OR org_record.description ILIKE '%court%' OR org_record.description ILIKE '%advocacy%' THEN
      service_categories := array_append(service_categories, 'legal_aid');
      service_categories := array_append(service_categories, 'advocacy');
    END IF;

    IF org_record.description ILIKE '%housing%' OR org_record.description ILIKE '%homeless%' OR org_record.description ILIKE '%accommodation%' THEN
      service_categories := array_append(service_categories, 'housing');
    END IF;

    IF org_record.description ILIKE '%mental%' OR org_record.description ILIKE '%counseling%' OR org_record.description ILIKE '%wellbeing%' OR org_record.description ILIKE '%trauma%' THEN
      service_categories := array_append(service_categories, 'mental_health');
    END IF;

    IF org_record.description ILIKE '%drug%' OR org_record.description ILIKE '%alcohol%' OR org_record.description ILIKE '%substance%' THEN
      service_categories := array_append(service_categories, 'substance_abuse');
    END IF;

    IF org_record.description ILIKE '%indigenous%' OR org_record.description ILIKE '%aboriginal%' OR org_record.description ILIKE '%torres strait%' OR org_record.description ILIKE '%cultural%' THEN
      service_categories := array_append(service_categories, 'cultural_support');
    END IF;

    IF org_record.description ILIKE '%family%' OR org_record.description ILIKE '%parent%' THEN
      service_categories := array_append(service_categories, 'family_support');
    END IF;

    IF org_record.description ILIKE '%education%' OR org_record.description ILIKE '%training%' OR org_record.description ILIKE '%employment%' OR org_record.description ILIKE '%school%' THEN
      service_categories := array_append(service_categories, 'education_training');
    END IF;

    IF org_record.description ILIKE '%crisis%' OR org_record.description ILIKE '%emergency%' THEN
      service_categories := array_append(service_categories, 'crisis_support');
    END IF;

    IF org_record.description ILIKE '%detention%' OR org_record.description ILIKE '%bail%' OR org_record.description ILIKE '%diversion%' THEN
      service_categories := array_append(service_categories, 'court_support');
    END IF;

    IF org_record.description ILIKE '%case management%' THEN
      service_categories := array_append(service_categories, 'case_management');
    END IF;

    -- Create service for this organization
    INSERT INTO services (
      name,
      description,
      categories,
      organization_id,
      location,
      data_source,
      data_source_url,
      verification_status
    ) VALUES (
      org_record.name,
      org_record.description,
      service_categories,
      org_record.id,
      jsonb_build_object(
        'region', 'Queensland',
        'state', 'QLD'
      ),
      'Airtable Manual Mapping',
      'https://airtable.com/appUVadubEmOCLCRx/shr8LMd6uAwnzIQVD',
      'pending'
    );
  END LOOP;
END $$;
`);

console.log('');
console.log('-- Verify import');
console.log(`
SELECT
  'Organizations' as table_name,
  COUNT(*) as count
FROM organizations
UNION ALL
SELECT
  'Services' as table_name,
  COUNT(*) as count
FROM services
ORDER BY table_name;
`);

console.error(`✅ Generated SQL for ${orgValues.length} unique organizations`);
