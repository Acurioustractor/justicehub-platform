#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n📊 PARSING QLD YOUTH JUSTICE CSV\n');

// Read CSV file
const csvPath = join(root, 'Grid view.csv');
const csvContent = readFileSync(csvPath, 'utf8');

// Parse CSV
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',');

console.log(`Found ${lines.length - 1} programs in CSV\n`);

// Map organization type to ALMA intervention type
function mapOrgTypeToInterventionType(orgType, primaryFocus) {
  const typeMap = {
    'Cultural Program': 'Cultural Connection',
    'Workplace Mentoring': 'Education/Employment',
    'Health Service': 'Wraparound Support',
    'Indigenous Service': 'Cultural Connection',
    'Non-Government Organization': 'Wraparound Support',
    'Community Initiative': 'Community-Led',
    'Community Organization': 'Community-Led',
    'Support Service': 'Wraparound Support',
    'Behavioral Program': 'Therapeutic',
    'Diversion Program': 'Diversion',
    'Police Program': 'Early Intervention',
    'Youth Program': 'Prevention',
    'Sports Program': 'Prevention',
    'Housing Program': 'Wraparound Support',
    'Government Facility': 'Diversion', // Detention centers (not ideal but best fit)
    'Faith-Based Organization': 'Community-Led',
    'Arts Program': 'Cultural Connection',
    'Skills Program': 'Education/Employment',
    'Wellbeing Program': 'Therapeutic',
    'Prevention Program': 'Prevention',
    'Advocacy Organization': 'Community-Led',
    'Justice Program': 'Diversion',
    'Development Program': 'Education/Employment',
    'Resilience Program': 'Therapeutic',
    'Mentoring Program': 'Early Intervention',
    'Therapy Program': 'Therapeutic',
    'Transition Program': 'Wraparound Support',
    'Government Program': 'Prevention',
    'Local Government Service': 'Community-Led',
    'Government Agency': 'Diversion',
    'Educational Program': 'Education/Employment',
    'Team Building Program': 'Prevention',
    'After-School Program': 'Prevention',
    'Education Program': 'Education/Employment',
    'Empowerment Program': 'Early Intervention',
    'Advisory Group': 'Community-Led',
    'Family Service': 'Family Strengthening',
    'Peak Body': 'Community-Led',
    'Legal Service': 'Diversion',
    'Online Platform': 'Prevention',
    'Government Event': 'Prevention',
    'Government Initiative': 'Prevention',
    'Government Department': 'Diversion',
    'Advisory Board': 'Community-Led',
    'Consortium': 'Community-Led',
    'Support Program': 'Wraparound Support',
    'Advocacy Campaign': 'Community-Led',
    'Community Space': 'Prevention',
    'Youth Facility': 'Prevention',
    'Youth Center': 'Wraparound Support',
    'Community Hub': 'Community-Led',
    'Outreach Service': 'Early Intervention',
    'Outreach Program': 'Early Intervention',
    'Online Mentoring': 'Education/Employment',
    'Community Center': 'Community-Led',
    'Intervention Program': 'Early Intervention',
    'Educational Service': 'Education/Employment',
    'Training Program': 'Education/Employment',
    'Educational Institution': 'Education/Employment',
    'Recreational Event': 'Prevention',
    'Gender-Specific Program': 'Wraparound Support',
    'Diversionary Program': 'Diversion',
    'International Program': 'Prevention',
    'Multi-Agency Program': 'Wraparound Support',
    'Career Program': 'Education/Employment',
    'Leadership Program': 'Education/Employment',
    'School Program': 'Prevention',
    'Recreation Program': 'Prevention',
    'Sports Facility': 'Prevention',
    'Animal Therapy Program': 'Therapeutic',
    'Indigenous Training Organization': 'Education/Employment',
    'Indigenous Organization': 'Cultural Connection',
    'Indigenous Program': 'Cultural Connection',
    'Indigenous Health Service': 'Wraparound Support',
    'Government Team': 'Diversion',
    'Government Role': 'Wraparound Support',
    'PCYC Program': 'Prevention',
    'Youth Service': 'Wraparound Support',
    'Police-led Program': 'Early Intervention',
  };

  let type = typeMap[orgType] || 'Community-Led';

  // Override based on primary focus if needed
  if (primaryFocus.includes('Justice Reinvestment')) {
    type = 'Justice Reinvestment';
  } else if (primaryFocus.includes('Detention')) {
    type = 'Diversion'; // Detention centers
  } else if (primaryFocus.includes('Indigenous') || primaryFocus.includes('Cultural')) {
    type = 'Cultural Connection';
  }

  return type;
}

// Determine consent level based on organization type and primary focus
function determineConsentLevel(orgName, orgType, primaryFocus) {
  const indigenousKeywords = [
    'Aboriginal', 'Torres Strait', 'Indigenous', 'First Nations',
    'Mob', 'Cultural', 'ATSI', 'QATSICPP', 'Yiliyapinya',
    'Marigurim', 'Jabalbina', 'Community Justice Group'
  ];

  const isIndigenous =
    indigenousKeywords.some(keyword => orgName.includes(keyword)) ||
    indigenousKeywords.some(keyword => orgType.includes(keyword)) ||
    indigenousKeywords.some(keyword => primaryFocus.includes(keyword));

  return isIndigenous ? 'Community Controlled' : 'Public Knowledge Commons';
}

// Determine cultural authority
function determineCulturalAuthority(orgName, orgType, primaryFocus, consentLevel) {
  if (consentLevel === 'Community Controlled') {
    return `${orgName} - Aboriginal Community Controlled Organisation`;
  } else if (orgType.includes('Government')) {
    return `${orgName} - Queensland Government program`;
  } else {
    return `${orgName} - Community organization`;
  }
}

// Map to evidence level
function mapToEvidenceLevel(orgType, primaryFocus, consentLevel) {
  if (consentLevel === 'Community Controlled') {
    return 'Indigenous-led (culturally grounded, community authority)';
  } else if (orgType.includes('Government')) {
    return 'Promising (community-endorsed, emerging evidence)';
  } else {
    return 'Untested (theory/pilot stage)';
  }
}

// Parse CSV rows
const programs = [];
const duplicateNames = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];

  // Parse CSV (handle quoted fields with commas)
  const fields = [];
  let currentField = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());

  const [orgName, orgType, primaryFocus, serviceArea, targetAge, keyServices] = fields;

  if (!orgName || orgName === 'Organisation Name') continue;

  // Check for duplicates in CSV
  if (duplicateNames.has(orgName)) {
    console.log(`⚠️  Duplicate in CSV: ${orgName} (skipping)`);
    continue;
  }
  duplicateNames.add(orgName);

  const consentLevel = determineConsentLevel(orgName, orgType, primaryFocus);
  const type = mapOrgTypeToInterventionType(orgType, primaryFocus);
  const evidenceLevel = mapToEvidenceLevel(orgType, primaryFocus, consentLevel);
  const culturalAuthority = determineCulturalAuthority(orgName, orgType, primaryFocus, consentLevel);

  // Parse geography
  const geography = ['QLD'];
  if (serviceArea && serviceArea !== 'Queensland' && serviceArea !== 'Statewide' && serviceArea !== 'Multiple locations') {
    // Add specific location
    geography.push(serviceArea);
  }

  // Parse target cohort
  const targetCohort = [];
  if (targetAge && targetAge !== 'Youth' && targetAge !== 'All ages') {
    targetCohort.push(targetAge);
  }
  targetCohort.push('QLD');

  const program = {
    name: orgName,
    type,
    description: `${primaryFocus} program in Queensland. ${keyServices ? keyServices.replace(/;/g, ',') : ''}`.substring(0, 500),
    target_cohort: targetCohort,
    geography,
    evidence_level: evidenceLevel,
    cultural_authority: culturalAuthority,
    consent_level: consentLevel,
    harm_risk_level: 'Low',
    current_funding: orgType.includes('Government') ? 'Established' : 'Pilot/seed',
    review_status: 'Published',
    operating_organization: orgName,
    metadata: {
      source: 'QLD Youth Justice Programs CSV 2025',
      organization_type: orgType,
      primary_focus: primaryFocus,
      service_area: serviceArea,
      key_services: keyServices,
    },
  };

  programs.push(program);
}

console.log(`Parsed ${programs.length} unique programs\n`);

// Check for existing programs in database
const { data: existingPrograms } = await supabase
  .from('alma_interventions')
  .select('name')
  .eq('geography', 'QLD');

const existingNames = new Set(existingPrograms?.map(p => p.name) || []);

const newPrograms = programs.filter(p => !existingNames.has(p.name));
const skippedPrograms = programs.filter(p => existingNames.has(p.name));

console.log(`${existingNames.size} programs already in database`);
console.log(`${newPrograms.length} new programs to add`);
console.log(`${skippedPrograms.length} duplicates skipped\n`);

if (skippedPrograms.length > 0) {
  console.log('Skipping these duplicates:');
  skippedPrograms.forEach(p => console.log(`  - ${p.name}`));
  console.log('');
}

// Insert in batches of 50
const batchSize = 50;
let inserted = 0;
let errors = 0;

for (let i = 0; i < newPrograms.length; i += batchSize) {
  const batch = newPrograms.slice(i, i + batchSize);

  console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} programs)...`);

  const { data, error } = await supabase
    .from('alma_interventions')
    .insert(batch)
    .select('id, name');

  if (error) {
    console.error(`❌ Error inserting batch:`, error.message);
    errors += batch.length;
  } else {
    console.log(`✅ Inserted ${data.length} programs`);
    inserted += data.length;
  }
}

console.log(`\n📊 SUMMARY\n`);
console.log(`Total programs in CSV: ${programs.length}`);
console.log(`Already in database: ${skippedPrograms.length}`);
console.log(`Successfully inserted: ${inserted}`);
console.log(`Errors: ${errors}`);

// Get final count
const { count: finalCount } = await supabase
  .from('alma_interventions')
  .select('*', { count: 'exact', head: true });

console.log(`\n🎉 Total interventions in database: ${finalCount}\n`);

// Breakdown by consent level for QLD
const { data: qldPrograms } = await supabase
  .from('alma_interventions')
  .select('consent_level')
  .contains('geography', ['QLD']);

const qldBreakdown = {
  'Community Controlled': 0,
  'Public Knowledge Commons': 0,
};

qldPrograms?.forEach(p => {
  qldBreakdown[p.consent_level] = (qldBreakdown[p.consent_level] || 0) + 1;
});

console.log('QLD Programs Breakdown:');
console.log(`  Aboriginal-led (Community Controlled): ${qldBreakdown['Community Controlled']}`);
console.log(`  Government/NGO (Public Knowledge Commons): ${qldBreakdown['Public Knowledge Commons']}`);
console.log(`  Total QLD: ${qldPrograms?.length}\n`);
