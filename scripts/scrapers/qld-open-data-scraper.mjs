#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

console.log('📊 Queensland Open Data Youth Justice Scraper')
console.log('============================================')
console.log('Mission: Extract structured datasets from Queensland Open Data Portal')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Queensland Open Data API endpoints for youth justice
const QLD_OPEN_DATA_TARGETS = [
  {
    name: 'Young offenders in youth detention',
    package_id: 'young-offenders-in-youth-detention',
    description: 'Daily count by legal status (remand/sentence), sex, Indigenous status',
    api_url: 'https://www.data.qld.gov.au/api/3/action/datastore_search',
    resource_id: '4a9b8c8c-9e2f-4c8d-8b7a-1f2e3d4c5b6a', // Example resource ID
    data_type: 'detention_daily_counts',
    key_fields: ['date', 'legal_status', 'sex', 'indigenous_status', 'count']
  },
  {
    name: 'Young offenders on youth justice orders',
    package_id: 'young-offenders-on-youth-justice-orders',
    description: 'Commencements of supervised & unsupervised orders by age, region',
    api_url: 'https://www.data.qld.gov.au/api/3/action/datastore_search',
    resource_id: '5b0c9d9d-0f3g-5d9e-9c8b-2g3f4e5d6c7b',
    data_type: 'youth_justice_orders',
    key_fields: ['date', 'age_group', 'region', 'order_type', 'commencements']
  },
  {
    name: 'Children subject to both supervised youth-justice orders and child-protection orders',
    package_id: 'crossover-children-youth-justice-child-protection',
    description: 'Cross-over cohort numbers by gender & Indigenous status',
    api_url: 'https://www.data.qld.gov.au/api/3/action/datastore_search',
    resource_id: '6c1d0e0e-1g4h-6e0f-0d9c-3h4g5f6e7d8c',
    data_type: 'crossover_children',
    key_fields: ['date', 'gender', 'indigenous_status', 'dual_orders_count']
  },
  {
    name: 'Youth Justice Pocket Stats',
    package_id: 'youth-justice-pocket-statistics',
    description: 'Quarterly trends: daily detention pop., breach rates, re-offence within 12 months',
    api_url: 'https://www.data.qld.gov.au/api/3/action/datastore_search',
    resource_id: '7d2e1f1f-2h5i-7f1g-1e0d-4i5h6g7f8e9d',
    data_type: 'pocket_stats',
    key_fields: ['quarter', 'daily_detention_avg', 'breach_rate', 'reoffence_rate_12m']
  }
]

async function discoverDatasets() {
  console.log('\n🔍 Discovering Queensland Open Data youth justice datasets...')
  
  try {
    // Search for youth justice related datasets
    const searchUrl = 'https://www.data.qld.gov.au/api/3/action/package_search'
    const searchParams = new URLSearchParams({
      q: 'youth justice',
      rows: 20,
      start: 0
    })
    
    const response = await fetch(`${searchUrl}?${searchParams}`)
    const data = await response.json()
    
    if (data.success && data.result.results) {
      console.log(`   ✅ Found ${data.result.count} youth justice datasets`)
      
      const datasets = data.result.results.map(dataset => ({
        name: dataset.title,
        id: dataset.id,
        organization: dataset.organization?.title || 'Unknown',
        resources: dataset.resources?.length || 0,
        tags: dataset.tags?.map(tag => tag.name) || [],
        last_updated: dataset.metadata_modified
      }))
      
      console.log('\n📋 Available Datasets:')
      datasets.forEach((dataset, index) => {
        console.log(`   ${index + 1}. "${dataset.name}"`)
        console.log(`      • Organization: ${dataset.organization}`)
        console.log(`      • Resources: ${dataset.resources}`)
        console.log(`      • Tags: ${dataset.tags.join(', ')}`)
        console.log(`      • Last updated: ${dataset.last_updated}`)
        console.log('')
      })
      
      return datasets
    } else {
      throw new Error('Failed to search datasets')
    }
  } catch (error) {
    console.error(`   ❌ Discovery failed: ${error.message}`)
    return []
  }
}

async function fetchDatasetResources(packageId) {
  console.log(`\n📦 Fetching resources for package: ${packageId}`)
  
  try {
    const packageUrl = 'https://www.data.qld.gov.au/api/3/action/package_show'
    const response = await fetch(`${packageUrl}?id=${packageId}`)
    const data = await response.json()
    
    if (data.success && data.result.resources) {
      const resources = data.result.resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        format: resource.format,
        url: resource.url,
        last_modified: resource.last_modified,
        size: resource.size
      }))
      
      console.log(`   ✅ Found ${resources.length} resources`)
      resources.forEach(resource => {
        console.log(`      • ${resource.name} (${resource.format})`)
        console.log(`        ID: ${resource.id}`)
        console.log(`        Size: ${resource.size || 'Unknown'}`)
      })
      
      return resources
    } else {
      throw new Error('Package not found')
    }
  } catch (error) {
    console.error(`   ❌ Resource fetch failed: ${error.message}`)
    return []
  }
}

async function fetchDatastoreData(resourceId, limit = 1000) {
  console.log(`\n📊 Fetching data from resource: ${resourceId}`)
  
  try {
    const datastoreUrl = 'https://www.data.qld.gov.au/api/3/action/datastore_search'
    const params = new URLSearchParams({
      resource_id: resourceId,
      limit: limit.toString(),
      offset: '0'
    })
    
    const response = await fetch(`${datastoreUrl}?${params}`)
    const data = await response.json()
    
    if (data.success && data.result.records) {
      console.log(`   ✅ Retrieved ${data.result.records.length} records`)
      console.log(`   📈 Total records available: ${data.result.total}`)
      
      // Show sample fields
      if (data.result.records.length > 0) {
        const sampleRecord = data.result.records[0]
        console.log(`   🔍 Sample fields: ${Object.keys(sampleRecord).join(', ')}`)
      }
      
      return {
        records: data.result.records,
        total: data.result.total,
        fields: data.result.fields || []
      }
    } else {
      throw new Error('No data found in datastore')
    }
  } catch (error) {
    console.error(`   ❌ Data fetch failed: ${error.message}`)
    return null
  }
}

async function storeOpenData(records, dataType, target) {
  if (!records || records.length === 0) return
  
  console.log(`\n💾 Storing ${records.length} records of type: ${dataType}`)
  
  try {
    // Choose appropriate table based on data type
    let tableName = 'youth_justice_data' // Default table
    
    switch (dataType) {
      case 'detention_daily_counts':
        tableName = 'detention_daily_counts'
        break
      case 'youth_justice_orders':
        tableName = 'youth_justice_orders'
        break
      case 'crossover_children':
        tableName = 'crossover_children'
        break
      case 'pocket_stats':
        tableName = 'pocket_stats'
        break
    }
    
    // Transform records for database storage
    const transformedRecords = records.map(record => ({
      ...record,
      source: target.name,
      source_url: target.api_url,
      data_type: dataType,
      scraped_at: new Date().toISOString()
    }))
    
    // Note: In production, you'd want to create specific tables for each data type
    // For now, we'll store in a generic table with JSON fields
    const { error } = await supabase
      .from('scraped_content')
      .insert(transformedRecords.map(record => ({
        title: `${target.name} - ${record._id || 'Record'}`,
        content: JSON.stringify(record),
        url: target.api_url,
        source_type: 'qld_open_data',
        metadata: {
          data_type: dataType,
          package_id: target.package_id,
          resource_id: target.resource_id,
          key_fields: target.key_fields
        },
        scraped_at: new Date().toISOString()
      })))
    
    if (error) {
      console.log(`   ⚠️  Database storage error: ${error.message}`)
      console.log(`   📊 Would store ${transformedRecords.length} records`)
    } else {
      console.log(`   ✅ Successfully stored ${transformedRecords.length} records`)
    }
  } catch (error) {
    console.log(`   ⚠️  Storage error: ${error.message}`)
  }
}

async function runOpenDataScraping() {
  console.log('\n🚀 Starting Queensland Open Data scraping')
  console.log('   Mission: Extract structured youth justice datasets')
  console.log('   Approach: API-based data collection for accountability tracking\n')
  
  // First, discover available datasets
  const datasets = await discoverDatasets()
  
  if (datasets.length === 0) {
    console.log('❌ No datasets discovered. Using predefined targets.')
  }
  
  // Process each target dataset
  for (const target of QLD_OPEN_DATA_TARGETS) {
    console.log(`\n📊 Processing: ${target.name}`)
    console.log(`   📋 ${target.description}`)
    
    // Get package resources
    const resources = await fetchDatasetResources(target.package_id)
    
    if (resources.length > 0) {
      // Use the first CSV resource or the specified resource_id
      const targetResource = resources.find(r => r.format === 'CSV') || resources[0]
      
      if (targetResource) {
        // Fetch data from datastore
        const data = await fetchDatastoreData(targetResource.id)
        
        if (data && data.records.length > 0) {
          // Store the data
          await storeOpenData(data.records, target.data_type, target)
        }
      }
    }
    
    // Respectful delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n📈 QUEENSLAND OPEN DATA SCRAPING SUMMARY')
  console.log('======================================')
  console.log('✅ Data collection targeting:')
  console.log('   • Daily detention counts by demographics')
  console.log('   • Youth justice order commencements')
  console.log('   • Cross-over children (dual protection + justice orders)')
  console.log('   • Quarterly performance indicators')
  console.log('')
  console.log('🎯 Accountability Impact:')
  console.log('   • Structured datasets for trend analysis')
  console.log('   • Indigenous overrepresentation tracking')
  console.log('   • Cross-system intervention point identification')
  console.log('   • Performance monitoring and accountability')
  
  return { datasets, processed: QLD_OPEN_DATA_TARGETS.length }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runOpenDataScraping()
    .then(results => {
      console.log('\n✅ Queensland Open Data scraping complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Open Data scraping failed:', error.message)
      process.exit(1)
    })
}

export { runOpenDataScraping }