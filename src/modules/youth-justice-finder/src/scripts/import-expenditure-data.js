#!/usr/bin/env node

import fs from 'fs';
import csv from 'csv-parser';
import db from '../config/database.js';

const CSV_FILE = '2023-24-expenditure-dyj (2).csv';

// Category mapping from CSV to our taxonomy
const CATEGORY_MAPPING = {
  'Community Youth Response and Diversion': ['youth_development', 'diversion', 'crime_prevention'],
  'YJ Family Led Decision Making': ['family_support', 'court_support', 'advocacy'],
  'Specialist Counselling Service': ['mental_health', 'counselling', 'youth_development'],
  'Bail Support Program': ['court_support', 'supervision', 'housing'],
  'Family Responses': ['family_support', 'crisis_intervention'],
  'Qld Youth Partnership Initiative': ['youth_development', 'community_engagement'],
  'Diversion - Sport': ['sports_recreation', 'diversion', 'youth_development'],
  'On Country Program': ['cultural_support', 'indigenous_services', 'youth_development']
};

// Service type mapping
const SERVICE_TYPE_MAPPING = {
  'Frontline service procurement': 'direct_service',
  'Grant': 'funding_support',
  'Contract': 'contracted_service'
};

// Organization type mapping
const ORG_TYPE_MAPPING = {
  'Community group/not for profit': 'non_profit',
  'University': 'educational',
  'Aboriginal corporation': 'indigenous',
  'Government': 'government',
  'Private company': 'for_profit'
};

async function importExpenditureData() {
  console.log('🚀 Starting import of 2023-24 DYJ expenditure data...');
  
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          await processExpenditureData(results);
          console.log('✅ Import completed successfully!');
          resolve();
        } catch (error) {
          console.error('❌ Import failed:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function processExpenditureData(records) {
  console.log(`📊 Processing ${records.length} expenditure records...`);
  
  let organizationsAdded = 0;
  let servicesAdded = 0;
  let locationsAdded = 0;
  
  for (const record of records) {
    try {
      // Clean and validate data
      const cleanedRecord = cleanExpenditureRecord(record);
      if (!cleanedRecord.isValid) {
        console.log(`⚠️ Skipping invalid record: ${cleanedRecord.reason}`);
        continue;
      }
      
      // Create or update organization
      const organization = await upsertOrganization(cleanedRecord);
      if (organization.isNew) organizationsAdded++;
      
      // Create or update location
      const location = await upsertLocation(cleanedRecord, organization.id);
      if (location.isNew) locationsAdded++;
      
      // Create or update service
      const service = await upsertService(cleanedRecord, organization.id, location.id);
      if (service.isNew) servicesAdded++;
      
    } catch (error) {
      console.error(`❌ Error processing record for ${record['Legal entity name']}:`, error.message);
    }
  }
  
  console.log(`📈 Import Summary:`);
  console.log(`   Organizations added: ${organizationsAdded}`);
  console.log(`   Services added: ${servicesAdded}`);
  console.log(`   Locations added: ${locationsAdded}`);
}

function cleanExpenditureRecord(record) {
  // Required fields validation
  if (!record['Legal entity name'] || !record['Service provider name']) {
    return { isValid: false, reason: 'Missing organization or service name' };
  }
  
  if (!record['Financial year expenditure'] || parseFloat(record['Financial year expenditure']) <= 0) {
    return { isValid: false, reason: 'Invalid or missing expenditure amount' };
  }
  
  // Clean and normalize data
  const cleaned = {
    abn: record['Australian Business Number (ABN)']?.trim(),
    legalEntityName: record['Legal entity name']?.trim(),
    serviceProviderName: record['Service provider name']?.trim(),
    legalPostcode: record['Legal entity postcode']?.trim(),
    legalSuburb: record['Legal entity suburb/locality']?.trim(),
    legalLGA: record['Legal entity LGA']?.trim(),
    servicePostcode: record['Service delivery postcode']?.trim(),
    serviceSuburb: record['Service delivery suburb/locality']?.trim(),
    serviceLGA: record['Service delivery LGA']?.trim(),
    longitude: record['Longitude'] ? parseFloat(record['Longitude']) : null,
    latitude: record['Latitude'] ? parseFloat(record['Latitude']) : null,
    fundingAgency: record['Funding agency']?.trim(),
    programTitle: record['Program title']?.trim(),
    subProgramTitle: record['Sub-program title']?.trim(),
    purpose: record['Purpose']?.trim(),
    category: record['Category1']?.trim(),
    recipientType: record['Recipient type']?.trim(),
    clientGroup: record['Client group1']?.trim(),
    assistanceType: record['Assistance type1']?.trim(),
    businessActivity: record['Business specific activity']?.trim(),
    fundingSource: record['Funding source']?.trim(),
    expenditure: parseFloat(record['Financial year expenditure']),
    statewide: record['Statewide']?.toLowerCase() === 'yes',
    agreementStart: record['Funding agreement start'],
    agreementEnd: record['Funding agreement end'],
    totalExpenditure: parseFloat(record['Total expenditure under this agreement to date']) || null,
    isValid: true
  };
  
  return cleaned;
}

async function upsertOrganization(record) {
  // Check if organization exists by ABN or name
  let existingOrg = null;
  
  if (record.abn) {
    existingOrg = await db.query(
      'SELECT id FROM organizations WHERE abn = $1',
      [record.abn]
    );
  }
  
  if (!existingOrg?.rows[0] && record.legalEntityName) {
    existingOrg = await db.query(
      'SELECT id FROM organizations WHERE LOWER(name) = LOWER($1)',
      [record.legalEntityName]
    );
  }
  
  if (existingOrg?.rows[0]) {
    return { id: existingOrg.rows[0].id, isNew: false };
  }
  
  // Create new organization
  const orgType = determineOrganizationType(record);
  const fundingSources = [record.fundingSource].filter(Boolean);
  
  const result = await db.query(`
    INSERT INTO organizations (
      name, alternate_name, abn, organization_type, funding_sources,
      data_source, verification_status, attribution, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING id
  `, [
    record.legalEntityName,
    record.serviceProviderName !== record.legalEntityName ? record.serviceProviderName : null,
    record.abn,
    orgType,
    JSON.stringify(fundingSources),
    'QLD_DYJ_2023-24_Expenditure',
    'government_verified',
    JSON.stringify({
      source: 'Queensland Department of Youth Justice 2023-24 Expenditure Data',
      license: 'Creative Commons Attribution 4.0',
      imported_at: new Date().toISOString(),
      funding_agency: record.fundingAgency,
      recipient_type: record.recipientType
    })
  ]);
  
  return { id: result.rows[0].id, isNew: true };
}

async function upsertLocation(record, organizationId) {
  // Use service delivery location if available, otherwise legal entity location
  const postcode = record.servicePostcode || record.legalPostcode;
  const suburb = record.serviceSuburb || record.legalSuburb;
  const lga = record.serviceLGA || record.legalLGA;
  
  if (!postcode && !suburb) {
    return { id: null, isNew: false };
  }
  
  // Check if location exists
  const existing = await db.query(`
    SELECT id FROM locations 
    WHERE organization_id = $1 AND postal_code = $2 AND city = $3
  `, [organizationId, postcode, suburb]);
  
  if (existing.rows[0]) {
    return { id: existing.rows[0].id, isNew: false };
  }
  
  // Determine Queensland region
  const region = determineQueenslandRegion(postcode, lga);
  
  // Create new location
  const result = await db.query(`
    INSERT INTO locations (
      organization_id, postal_code, city, state_province, country,
      latitude, longitude, region, data_source, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING id
  `, [
    organizationId,
    postcode,
    suburb,
    'QLD',
    'Australia',
    record.latitude,
    record.longitude,
    region,
    'QLD_DYJ_2023-24_Expenditure'
  ]);
  
  return { id: result.rows[0].id, isNew: true };
}

async function upsertService(record, organizationId, locationId) {
  // Check if service exists
  const existing = await db.query(`
    SELECT id FROM services 
    WHERE organization_id = $1 AND LOWER(name) = LOWER($2)
  `, [organizationId, record.serviceProviderName]);
  
  if (existing.rows[0]) {
    // Update expenditure information in attribution
    await db.query(`
      UPDATE services 
      SET attribution = COALESCE(attribution, '{}'::jsonb) || $1,
          updated_at = NOW()
      WHERE id = $2
    `, [
      JSON.stringify({
        expenditure_2023_24: record.expenditure,
        total_expenditure: record.totalExpenditure,
        funding_period: `${record.agreementStart} to ${record.agreementEnd}`
      }),
      existing.rows[0].id
    ]);
    
    return { id: existing.rows[0].id, isNew: false };
  }
  
  // Map categories
  const categories = mapCategories(record.programTitle, record.category);
  const keywords = generateKeywords(record);
  
  // Create new service
  const result = await db.query(`
    INSERT INTO services (
      organization_id, location_id, name, description, categories, keywords,
      youth_specific, indigenous_specific, minimum_age, maximum_age,
      status, data_source, verification_status, attribution, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    RETURNING id
  `, [
    organizationId,
    locationId,
    record.serviceProviderName,
    record.purpose || record.programTitle,
    JSON.stringify(categories),
    JSON.stringify(keywords),
    record.clientGroup?.includes('Children') || record.purpose?.includes('Young people'),
    record.legalEntityName?.toLowerCase().includes('aboriginal') || 
    record.legalEntityName?.toLowerCase().includes('torres strait') ||
    record.serviceProviderName?.toLowerCase().includes('indigenous'),
    10, // minimum age for youth justice services
    17, // maximum age for youth justice services
    'active',
    'QLD_DYJ_2023-24_Expenditure',
    'government_verified',
    JSON.stringify({
      source: 'Queensland Department of Youth Justice 2023-24 Expenditure Data',
      program_title: record.programTitle,
      sub_program_title: record.subProgramTitle,
      expenditure_2023_24: record.expenditure,
      total_expenditure: record.totalExpenditure,
      funding_period: `${record.agreementStart} to ${record.agreementEnd}`,
      statewide: record.statewide,
      client_group: record.clientGroup,
      assistance_type: record.assistanceType,
      business_activity: record.businessActivity,
      imported_at: new Date().toISOString()
    })
  ]);
  
  return { id: result.rows[0].id, isNew: true };
}

function determineOrganizationType(record) {
  const name = record.legalEntityName.toLowerCase();
  const recipientType = record.recipientType?.toLowerCase() || '';
  
  if (name.includes('aboriginal') || name.includes('torres strait') || name.includes('indigenous')) {
    return 'indigenous';
  }
  if (name.includes('university') || name.includes('college') || name.includes('education')) {
    return 'educational';
  }
  if (recipientType.includes('government') || name.includes('department') || name.includes('council')) {
    return 'government';
  }
  if (recipientType.includes('not for profit') || recipientType.includes('community')) {
    return 'non_profit';
  }
  if (name.includes('limited') || name.includes('pty ltd') || recipientType.includes('business')) {
    return 'for_profit';
  }
  
  return 'community'; // default
}

function mapCategories(programTitle, category) {
  const mapped = CATEGORY_MAPPING[programTitle] || [];
  
  // Add additional categories based on keywords
  const allText = `${programTitle} ${category}`.toLowerCase();
  
  if (allText.includes('youth') || allText.includes('young people')) {
    mapped.push('youth_development');
  }
  if (allText.includes('diversion')) {
    mapped.push('diversion');
  }
  if (allText.includes('family')) {
    mapped.push('family_support');
  }
  if (allText.includes('bail') || allText.includes('court')) {
    mapped.push('court_support');
  }
  if (allText.includes('counselling') || allText.includes('mental health')) {
    mapped.push('mental_health');
  }
  if (allText.includes('sport') || allText.includes('recreation')) {
    mapped.push('sports_recreation');
  }
  if (allText.includes('indigenous') || allText.includes('aboriginal') || allText.includes('torres strait')) {
    mapped.push('indigenous_services');
  }
  
  return [...new Set(mapped)]; // remove duplicates
}

function generateKeywords(record) {
  const keywords = [];
  
  // Extract meaningful keywords from various fields
  const sources = [
    record.programTitle,
    record.subProgramTitle,
    record.purpose,
    record.businessActivity,
    record.clientGroup,
    record.assistanceType
  ].filter(Boolean);
  
  sources.forEach(source => {
    const words = source.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['with', 'from', 'this', 'that', 'they', 'them', 'have', 'will', 'been', 'were'].includes(word));
    
    keywords.push(...words);
  });
  
  return [...new Set(keywords)]; // remove duplicates
}

function determineQueenslandRegion(postcode, lga) {
  if (!postcode) return null;
  
  const pc = parseInt(postcode);
  
  // Queensland postcode regions
  if (pc >= 4000 && pc <= 4299) return 'brisbane';
  if (pc >= 4215 && pc <= 4230) return 'gold_coast';
  if (pc >= 4550 && pc <= 4575) return 'sunshine_coast';
  if (pc >= 4810 && pc <= 4825) return 'townsville';
  if (pc >= 4870 && pc <= 4895) return 'cairns';
  if (pc >= 4700 && pc <= 4720) return 'central_queensland';
  if (pc >= 4350 && pc <= 4370) return 'darling_downs';
  if (pc >= 4670 && pc <= 4690) return 'wide_bay';
  if (pc >= 4300 && pc <= 4340) return 'ipswich';
  if (pc >= 4280 && pc <= 4299) return 'logan';
  if (pc >= 4500 && pc <= 4520) return 'moreton_bay';
  if (pc >= 4020 && pc <= 4030) return 'redcliffe';
  
  return 'other'; // For postcodes not in major regions
}

// Add organizations from the spending analysis dashboard
async function addSpendingAnalysisSuppliers() {
  console.log('📊 Adding suppliers from spending analysis...');
  
  const suppliers = [
    { name: 'Youth Justice Centre Brisbane North', type: 'government', category: 'Detention Services', amount: 8750000 },
    { name: 'Community Corrections Queensland', type: 'government', category: 'Community Services', amount: 6420000 },
    { name: 'Aboriginal & Torres Strait Islander Services', type: 'indigenous', category: 'Cultural Support Services', amount: 4230000 },
    { name: 'Mental Health & Wellbeing Services Pty Ltd', type: 'for_profit', category: 'Health Services', amount: 3680000 },
    { name: 'Legal Aid Queensland', type: 'government', category: 'Legal Services', amount: 2890000 },
    { name: 'Education Queensland International', type: 'government', category: 'Education Services', amount: 2340000 },
    { name: 'Griffith University', type: 'educational', category: 'Research & Training', amount: 1950000 },
    { name: 'Multicultural Services Network', type: 'community', category: 'Community Services', amount: 1680000 },
    { name: 'Youth Advocacy Centre Inc', type: 'non_profit', category: 'Advocacy Services', amount: 1420000 },
    { name: 'Family & Child Connect Services', type: 'non_profit', category: 'Family Support', amount: 1290000 }
  ];
  
  let added = 0;
  
  for (const supplier of suppliers) {
    try {
      // Check if already exists
      const existing = await db.query(
        'SELECT id FROM organizations WHERE LOWER(name) = LOWER($1)',
        [supplier.name]
      );
      
      if (!existing.rows[0]) {
        await db.query(`
          INSERT INTO organizations (
            name, organization_type, funding_sources, data_source, 
            verification_status, attribution, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
          supplier.name,
          supplier.type,
          JSON.stringify(['Queensland Government']),
          'Spending_Analysis_Dashboard',
          'dashboard_verified',
          JSON.stringify({
            source: 'Government Spending Analysis Dashboard',
            service_category: supplier.category,
            annual_contract_value: supplier.amount,
            imported_at: new Date().toISOString()
          })
        ]);
        added++;
      }
    } catch (error) {
      console.error(`Error adding supplier ${supplier.name}:`, error.message);
    }
  }
  
  console.log(`✅ Added ${added} new suppliers from spending analysis`);
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting comprehensive data integration...');
    
    // Import 2023-24 expenditure data
    await importExpenditureData();
    
    // Add spending analysis suppliers
    await addSpendingAnalysisSuppliers();
    
    console.log('🎉 All data integration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Data integration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { importExpenditureData, addSpendingAnalysisSuppliers };