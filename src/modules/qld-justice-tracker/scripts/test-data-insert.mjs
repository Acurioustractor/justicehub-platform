#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('🧪 TESTING DATA INSERT')
console.log('=====================\n')

async function testInsert() {
  // Test 1: Court Statistics
  console.log('Testing court_annual_statistics...')
  const courtData = {
    fiscal_year: '2023-24',
    total_child_defendants: 8457,
    indigenous_defendants_count: 5235,
    indigenous_defendants_percentage: 61.9,
    bail_refused_count: 2148,
    bail_refused_percentage: 25.4,
    source_document: 'Childrens Court Annual Report 2023-24',
    source_url: 'https://www.courts.qld.gov.au/__data/assets/pdf_file/0006/819771/cc-ar-2023-2024.pdf',
    data_quality_grade: 'A'
  }
  
  const { data: court, error: courtError } = await supabase
    .from('court_annual_statistics')
    .insert(courtData)
    .select()
  
  if (courtError) {
    console.log('❌ Court insert failed:', courtError.message || JSON.stringify(courtError))
  } else {
    console.log('✅ Court data inserted successfully')
  }
  
  // Test 2: Detention Census
  console.log('\nTesting detention_census...')
  const detentionData = {
    census_date: '2024-03-31',
    total_youth_in_detention: 338,
    indigenous_count: 248,
    indigenous_percentage: 73.4,
    remanded_count: 231,
    remanded_percentage: 68.3,
    capacity_utilization: 107,
    source_document: 'Youth Detention Census Q1 2024',
    source_url: 'https://www.cyjma.qld.gov.au/resources/dcsyw/youth-justice/publications/yj-census-summary.pdf',
    data_quality_grade: 'A'
  }
  
  const { data: detention, error: detentionError } = await supabase
    .from('detention_census')
    .insert(detentionData)
    .select()
  
  if (detentionError) {
    console.log('❌ Detention insert failed:', detentionError.message || JSON.stringify(detentionError))
  } else {
    console.log('✅ Detention data inserted successfully')
  }
  
  // Test 3: Check what's in the database
  console.log('\n📊 Checking database contents...')
  
  const { count: courtCount } = await supabase
    .from('court_annual_statistics')
    .select('*', { count: 'exact' })
    
  const { count: detentionCount } = await supabase
    .from('detention_census')
    .select('*', { count: 'exact' })
    
  console.log(`Court records: ${courtCount}`)
  console.log(`Detention records: ${detentionCount}`)
  
  // Show a sample of the data
  const { data: sample } = await supabase
    .from('court_annual_statistics')
    .select('fiscal_year, total_child_defendants, indigenous_defendants_percentage')
    .limit(1)
  
  if (sample && sample.length > 0) {
    console.log('\nSample data:')
    console.log(`Fiscal Year: ${sample[0].fiscal_year}`)
    console.log(`Total Defendants: ${sample[0].total_child_defendants}`)
    console.log(`Indigenous %: ${sample[0].indigenous_defendants_percentage}%`)
  }
}

testInsert()