#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🌱 Seeding Test Data\n');

// Test data generators
const facilities = [
  'Brisbane Youth Detention Centre',
  'Cleveland Youth Detention Centre',
  'West Moreton Youth Detention Centre',
  'North Queensland Youth Detention Centre',
  'Townsville Youth Detention Centre'
];

const departments = [
  'Department of Youth Justice',
  'Department of Children, Youth Justice and Multicultural Affairs',
  'Queensland Police Service',
  'Department of Education',
  'Queensland Health'
];

const programs = [
  'Youth Detention Operations',
  'Community Youth Justice',
  'Transition from Detention',
  'Restorative Justice Services',
  'Indigenous Youth Programs',
  'Mental Health Support',
  'Education and Training'
];

async function seedYouthStatistics() {
  console.log('📊 Seeding youth statistics...');
  
  const data = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    for (const facility of facilities) {
      const totalYouth = faker.number.int({ min: 20, max: 100 });
      const indigenousYouth = faker.number.int({ min: Math.floor(totalYouth * 0.5), max: Math.floor(totalYouth * 0.85) });
      
      data.push({
        date: d.toISOString().split('T')[0],
        facility_name: facility,
        total_youth: totalYouth,
        indigenous_youth: indigenousYouth,
        indigenous_percentage: ((indigenousYouth / totalYouth) * 100).toFixed(1),
        average_age: faker.number.float({ min: 14, max: 17, precision: 0.1 }),
        average_stay_days: faker.number.int({ min: 30, max: 180 }),
        program_type: faker.helpers.arrayElement(['detention', 'community', null]),
        source_url: 'https://example.qld.gov.au/test-data',
        scraped_date: new Date().toISOString()
      });
    }
  }
  
  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase
      .from('youth_statistics')
      .upsert(batch, { onConflict: 'date,facility_name' });
    
    if (error) {
      console.error('❌ Error seeding youth statistics:', error.message);
    } else {
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`);
    }
  }
}

async function seedBudgetAllocations() {
  console.log('\n💰 Seeding budget allocations...');
  
  const data = [];
  const fiscalYears = ['2021-22', '2022-23', '2023-24', '2024-25'];
  
  for (const fiscalYear of fiscalYears) {
    for (const department of departments) {
      for (const program of programs) {
        const amount = faker.number.int({ min: 1000000, max: 50000000 });
        
        data.push({
          fiscal_year: fiscalYear,
          department: department,
          program: program,
          category: faker.helpers.arrayElement(['detention', 'community', 'administration', 'capital']),
          amount: amount,
          description: faker.lorem.sentence(),
          source_url: `https://budget.qld.gov.au/${fiscalYear}/test`,
          source_document: `Budget Paper ${faker.number.int({ min: 1, max: 5 })}`,
          scraped_date: new Date().toISOString()
        });
      }
    }
  }
  
  const { error } = await supabase
    .from('budget_allocations')
    .upsert(data, { onConflict: 'fiscal_year,department,program' });
  
  if (error) {
    console.error('❌ Error seeding budget allocations:', error.message);
  } else {
    console.log(`✅ Inserted ${data.length} budget allocations`);
  }
}

async function seedCourtStatistics() {
  console.log('\n⚖️ Seeding court statistics...');
  
  const data = [];
  const courtTypes = ['childrens', 'magistrates', 'district', 'supreme'];
  const periods = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'];
  
  for (const period of periods) {
    for (const courtType of courtTypes) {
      const totalDefendants = faker.number.int({ min: 100, max: 1000 });
      const indigenousDefendants = faker.number.int({ min: Math.floor(totalDefendants * 0.4), max: Math.floor(totalDefendants * 0.7) });
      const bailRefused = faker.number.int({ min: 10, max: Math.floor(totalDefendants * 0.3) });
      
      data.push({
        court_type: courtType,
        report_period: period,
        total_defendants: totalDefendants,
        indigenous_defendants: indigenousDefendants,
        indigenous_percentage: ((indigenousDefendants / totalDefendants) * 100).toFixed(1),
        bail_refused_count: bailRefused,
        bail_refused_percentage: ((bailRefused / totalDefendants) * 100).toFixed(1),
        remanded_custody: faker.number.int({ min: 5, max: bailRefused }),
        average_time_to_sentence_days: faker.number.int({ min: 30, max: 365 }),
        most_common_offence: faker.helpers.arrayElement(['Theft', 'Assault', 'Property Damage', 'Drug Offences']),
        source_document: `Court Statistics Report ${period}`,
        source_url: 'https://courts.qld.gov.au/test-data',
        scraped_date: new Date().toISOString()
      });
    }
  }
  
  const { error } = await supabase
    .from('court_statistics')
    .upsert(data, { onConflict: 'court_type,report_period' });
  
  if (error) {
    console.error('❌ Error seeding court statistics:', error.message);
  } else {
    console.log(`✅ Inserted ${data.length} court statistics`);
  }
}

async function seedCostComparisons() {
  console.log('\n💵 Seeding cost comparisons...');
  
  const comparisons = [
    { category: 'Education', item: 'Public school student (per year)', cost: 15000, unit: 'year' },
    { category: 'Education', item: 'University degree (4 years)', cost: 40000, unit: 'total' },
    { category: 'Education', item: 'TAFE certificate', cost: 5000, unit: 'course' },
    { category: 'Healthcare', item: 'Hospital bed (per day)', cost: 1200, unit: 'day' },
    { category: 'Healthcare', item: 'Mental health counseling', cost: 200, unit: 'session' },
    { category: 'Housing', item: 'Social housing (per week)', cost: 150, unit: 'week' },
    { category: 'Housing', item: 'Emergency accommodation', cost: 100, unit: 'night' },
    { category: 'Employment', item: 'Job training program', cost: 8000, unit: 'participant' },
    { category: 'Employment', item: 'Apprenticeship support', cost: 12000, unit: 'year' },
    { category: 'Justice', item: 'Youth detention (per day)', cost: 857, unit: 'day' },
    { category: 'Justice', item: 'Community supervision', cost: 41, unit: 'day' },
    { category: 'Justice', item: 'Restorative justice conference', cost: 2000, unit: 'conference' }
  ];
  
  const data = comparisons.map(comp => ({
    ...comp,
    description: `Average cost of ${comp.item} in Queensland`,
    source: 'Queensland Government Reports 2024',
    created_at: new Date().toISOString()
  }));
  
  const { error } = await supabase
    .from('cost_comparisons')
    .upsert(data, { onConflict: 'category,item' });
  
  if (error) {
    console.error('❌ Error seeding cost comparisons:', error.message);
  } else {
    console.log(`✅ Inserted ${data.length} cost comparisons`);
  }
}

async function seedHiddenCosts() {
  console.log('\n🔍 Seeding hidden costs...');
  
  const locations = ['Brisbane', 'Townsville', 'Cairns', 'Gold Coast', 'Toowoomba'];
  const costTypes = [
    { type: 'Family Travel', baseAmount: 200, description: 'Average cost per family visit including fuel and accommodation' },
    { type: 'Lost Wages', baseAmount: 400, description: 'Average daily wages lost by family members for visits' },
    { type: 'Phone Calls', baseAmount: 50, description: 'Monthly phone call costs at detention center rates' },
    { type: 'Legal Fees', baseAmount: 5000, description: 'Average legal representation costs' },
    { type: 'Counseling', baseAmount: 2000, description: 'Family counseling and support services' }
  ];
  
  const data = [];
  
  for (const location of locations) {
    for (const costType of costTypes) {
      const variance = faker.number.float({ min: 0.8, max: 1.5 });
      
      data.push({
        location: location,
        cost_type: costType.type,
        amount: Math.round(costType.baseAmount * variance),
        description: costType.description,
        calculation_method: 'Based on survey data and government reports',
        data_source: 'Family Impact Study 2024',
        created_at: new Date().toISOString()
      });
    }
  }
  
  const { error } = await supabase
    .from('hidden_costs')
    .upsert(data, { onConflict: 'location,cost_type' });
  
  if (error) {
    console.error('❌ Error seeding hidden costs:', error.message);
  } else {
    console.log(`✅ Inserted ${data.length} hidden costs`);
  }
}

async function clearTestData() {
  console.log('\n🧹 Clearing existing test data...');
  
  const tables = [
    'youth_statistics',
    'budget_allocations',
    'court_statistics',
    'cost_comparisons',
    'hidden_costs'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .like('source_url', '%test%');
    
    if (error) {
      console.error(`❌ Error clearing ${table}:`, error.message);
    } else {
      console.log(`✅ Cleared test data from ${table}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  const tablesOnly = args.filter(arg => !arg.startsWith('--'));
  
  if (shouldClear) {
    await clearTestData();
    if (args.length === 1) {
      console.log('\n✅ Test data cleared successfully!');
      process.exit(0);
    }
  }
  
  console.log('\n🚀 Starting data seeding...\n');
  
  const seedFunctions = {
    youth: seedYouthStatistics,
    budget: seedBudgetAllocations,
    court: seedCourtStatistics,
    cost: seedCostComparisons,
    hidden: seedHiddenCosts
  };
  
  if (tablesOnly.length > 0) {
    // Seed only specified tables
    for (const table of tablesOnly) {
      if (seedFunctions[table]) {
        await seedFunctions[table]();
      } else {
        console.log(`❌ Unknown table: ${table}`);
        console.log(`   Available: ${Object.keys(seedFunctions).join(', ')}`);
      }
    }
  } else {
    // Seed all tables
    await seedYouthStatistics();
    await seedBudgetAllocations();
    await seedCourtStatistics();
    await seedCostComparisons();
    await seedHiddenCosts();
  }
  
  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📝 Usage:');
  console.log('  node seed-test-data.mjs              # Seed all tables');
  console.log('  node seed-test-data.mjs youth budget # Seed specific tables');
  console.log('  node seed-test-data.mjs --clear      # Clear test data');
}

main().catch(console.error).finally(() => process.exit(0));