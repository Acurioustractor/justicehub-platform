#!/usr/bin/env node
/**
 * Working AI Scraper - Bypasses processing_jobs table issues
 *
 * This scraper works around the schema cache issue by directly creating
 * scraped services without using the problematic processing_jobs table
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

interface DataSource {
  id: string
  name: string
  type: string
  base_url: string
  scraping_config: any
  discovery_patterns: any[]
}

interface ScrapedService {
  organization_id?: string
  name: string
  description: string
  category: string
  subcategory?: string
  eligibility_criteria?: string[]
  cost_structure?: string
  contact_info?: any
  confidence_score: number
  source_url: string
  extraction_timestamp: string
  validation_status: string
}

async function workingScraper() {
  console.log('🚀 Starting Working AI Scraper...')

  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )

  const openaiKey = process.env.OPENAI_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY

  if (!openaiKey) {
    console.log('❌ OpenAI API key required for AI extraction')
    return
  }

  if (!firecrawlKey) {
    console.log('❌ Firecrawl API key required for web scraping')
    return
  }

  try {
    // Step 1: Get active data sources
    console.log('\n🔍 Getting active data sources...')
    const { data: sources, error: sourcesError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('active', true)
      .limit(3) // Process just a few to start

    if (sourcesError) {
      throw new Error(`Failed to get data sources: ${sourcesError.message}`)
    }

    if (!sources || sources.length === 0) {
      console.log('❌ No active data sources found')
      return
    }

    console.log(`✅ Found ${sources.length} active data sources`)

    let totalServicesFound = 0

    // Step 2: Process each data source
    for (const source of sources) {
      console.log(`\\n🔍 Processing: ${source.name}`)

      try {
        // Step 2a: Scrape the main page
        console.log('   📋 Scraping main page...')
        const scrapedContent = await scrapeWithFirecrawl(source.base_url, firecrawlKey)

        if (!scrapedContent) {
          console.log('   ⚠️ No content scraped, skipping')
          continue
        }

        console.log(`   ✅ Scraped ${scrapedContent.length} characters`)

        // Step 2b: Extract services with AI
        console.log('   🧠 Extracting services with AI...')
        const extractedServices = await extractServicesWithAI(scrapedContent, source.base_url, openaiKey)

        if (extractedServices.length === 0) {
          console.log('   ⚠️ No services found, skipping')
          continue
        }

        console.log(`   ✅ Found ${extractedServices.length} potential services`)

        // Step 2c: Save services to database
        console.log('   💾 Saving services to database...')
        for (const service of extractedServices) {
          try {
            const { data, error } = await supabase
              .from('scraped_services')
              .insert(service)
              .select()

            if (error) {
              console.log(`   ❌ Failed to save service "${service.name}": ${error.message}`)
            } else {
              console.log(`   ✅ Saved: ${service.name}`)
              totalServicesFound++
            }
          } catch (saveError) {
            console.log(`   ❌ Error saving service: ${saveError.message}`)
          }
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (sourceError) {
        console.log(`   ❌ Error processing ${source.name}: ${sourceError.message}`)
        continue
      }
    }

    console.log(`\\n🎉 Scraping completed!`)
    console.log(`📊 Total new services discovered: ${totalServicesFound}`)

    if (totalServicesFound > 0) {
      console.log('\\n📋 Next steps:')
      console.log('1. Review scraped services in the database')
      console.log('2. Validate and approve high-confidence services')
      console.log('3. Run the scraper again to find more services')
    }

  } catch (error) {
    console.error('💥 Scraper failed:', error.message)
  }
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 30000
      })
    })

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`)
    }

    const result = await response.json()
    return result?.data?.markdown || null

  } catch (error) {
    console.log(`     ❌ Scraping failed: ${error.message}`)
    return null
  }
}

async function extractServicesWithAI(content: string, sourceUrl: string, apiKey: string): Promise<ScrapedService[]> {
  try {
    const prompt = `
Analyze this web content and extract youth justice services, legal aid services, or community support services for young people.

Content to analyze:
${content.substring(0, 4000)}...

Extract services in this JSON format:
[
  {
    "name": "Service Name",
    "description": "Brief description of what this service provides",
    "category": "legal_support|crisis_intervention|youth_support|mental_health|education_training",
    "subcategory": "legal_advice|court_representation|counseling|etc",
    "eligibility_criteria": ["Age 12-18", "Queensland residents"],
    "cost_structure": "free|fee_for_service|sliding_scale|unknown",
    "contact_info": {"phone": "...", "email": "...", "website": "..."},
    "confidence_score": 0.85
  }
]

Only extract services that are clearly for youth/young people. Be conservative and only include high-confidence matches.
Return valid JSON only, no explanation.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 1500,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const result = await response.json()
    const aiResponse = result?.choices?.[0]?.message?.content

    if (!aiResponse) {
      return []
    }

    // Parse the AI response
    const services = JSON.parse(aiResponse)

    // Convert to our ScrapedService format
    return services.map((service: any) => ({
      name: service.name,
      description: service.description,
      category: service.category,
      subcategory: service.subcategory,
      eligibility_criteria: service.eligibility_criteria || [],
      cost_structure: service.cost_structure || 'unknown',
      contact_info: service.contact_info || null,
      confidence_score: service.confidence_score || 0.5,
      source_url: sourceUrl,
      extraction_timestamp: new Date().toISOString(),
      validation_status: 'pending'
    }))

  } catch (error) {
    console.log(`     ❌ AI extraction failed: ${error.message}`)
    return []
  }
}

// Run the scraper
workingScraper()