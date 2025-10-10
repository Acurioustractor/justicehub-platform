/**
 * Import Services from Airtable CSV Export
 *
 * Imports the 336 organizations from your Airtable mapping
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface AirtableRow {
  'Organisation Name': string;
  'Organisation Type': string;
  'Primary Focus': string;
  'Service Area': string;
  'Target Age Group': string;
  'Key Services': string;
}

async function importFromCSV() {
  console.log('📊 Importing services from Airtable CSV...\n');

  // Read CSV
  const csvPath = '/Users/benknight/Code/JusticeHub/Grid view.csv';
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Simple CSV parsing
  const lines = csvContent.split('\n');
  const headers = lines[0].replace('\ufeff', '').split(','); // Remove BOM
  const records: AirtableRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',');
    const record: any = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.trim() || '';
    });
    records.push(record);
  }

  console.log(`✅ Loaded ${records.length} organizations from CSV\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const orgName = record['Organisation Name'];

    if (!orgName || orgName.trim() === '') {
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${records.length}] ${orgName}`);

    try {
      // Check if organization exists
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', orgName)
        .single();

      let orgId: string;

      if (existingOrg) {
        console.log(`  ⏭️  Organization exists`);
        orgId = existingOrg.id;
      } else {
        // Create organization
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            description: `${record['Organisation Type']} - ${record['Primary Focus']}`,
            website_url: null // Will be populated later through web scraping
          })
          .select('id')
          .single();

        if (orgError) {
          console.error(`  ❌ Error creating organization:`, orgError.message);
          errors++;
          continue;
        }

        orgId = newOrg!.id;
        console.log(`  ✅ Created organization`);
      }

      // Map categories from Primary Focus
      const categories = mapCategories(record['Primary Focus'], record['Key Services']);

      // Parse service area for location
      const location = parseServiceArea(record['Service Area']);

      // Create/update service
      const { data: existingService } = await supabase
        .from('services')
        .select('id')
        .eq('organization_id', orgId)
        .eq('name', orgName)
        .single();

      if (existingService) {
        console.log(`  ⏭️  Service exists`);
        skipped++;
      } else {
        const { error: serviceError } = await supabase
          .from('services')
          .insert({
            name: orgName,
            description: `${record['Primary Focus']} services. ${record['Key Services']}`,
            categories: categories,
            organization_id: orgId,
            location: location,
            eligibility_criteria: [record['Target Age Group']],
            data_source: 'Airtable Manual Mapping',
            data_source_url: 'https://airtable.com/appUVadubEmOCLCRx/shr8LMd6uAwnzIQVD',
            verification_status: 'pending'
          });

        if (serviceError) {
          console.error(`  ❌ Error creating service:`, serviceError.message);
          errors++;
        } else {
          console.log(`  ✅ Created service`);
          created++;
        }
      }

    } catch (error: any) {
      console.error(`  ❌ Error processing:`, error.message);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 IMPORT SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total records: ${records.length}`);
  console.log(`Services created: ${created}`);
  console.log(`Services skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

function mapCategories(primaryFocus: string, keyServices: string): string[] {
  const categories: string[] = [];
  const text = `${primaryFocus} ${keyServices}`.toLowerCase();

  // Legal
  if (text.includes('legal') || text.includes('court')) categories.push('legal_aid');
  if (text.includes('advocacy')) categories.push('advocacy');

  // Housing
  if (text.includes('housing') || text.includes('homeless') || text.includes('accommodation') || text.includes('foyer'))
    categories.push('housing');

  // Mental Health
  if (text.includes('mental health') || text.includes('counseling') || text.includes('wellbeing') || text.includes('trauma'))
    categories.push('mental_health');

  // Substance Abuse
  if (text.includes('drug') || text.includes('alcohol') || text.includes('substance'))
    categories.push('substance_abuse');

  // Family Support
  if (text.includes('family') || text.includes('parent'))
    categories.push('family_support');

  // Education
  if (text.includes('education') || text.includes('school') || text.includes('training') || text.includes('employment'))
    categories.push('education_training');

  // Indigenous
  if (text.includes('indigenous') || text.includes('aboriginal') || text.includes('torres strait') || text.includes('cultural'))
    categories.push('cultural_support');

  // Crisis
  if (text.includes('crisis') || text.includes('emergency'))
    categories.push('crisis_support');

  // Case Management
  if (text.includes('case management') || text.includes('support service'))
    categories.push('case_management');

  // Youth Development
  if (text.includes('youth development') || text.includes('mentoring') || text.includes('leadership'))
    categories.push('youth_development');

  // Court Support
  if (text.includes('court') || text.includes('bail') || text.includes('diversion'))
    categories.push('court_support');

  return categories.length > 0 ? categories : ['support'];
}

function parseServiceArea(serviceArea: string): any {
  const area = serviceArea?.trim() || '';

  if (area.toLowerCase().includes('statewide') || area.toLowerCase().includes('queensland')) {
    return {
      region: 'Queensland',
      state: 'QLD',
      coverage_area: 'Statewide'
    };
  }

  if (area.toLowerCase().includes('multiple') || area.toLowerCase().includes('australia-wide')) {
    return {
      region: 'Multiple locations',
      state: 'QLD',
      coverage_area: 'Multiple'
    };
  }

  // Specific city/region
  return {
    city: area,
    state: 'QLD',
    region: 'Queensland'
  };
}

importFromCSV()
  .then(() => {
    console.log('\n✅ Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
