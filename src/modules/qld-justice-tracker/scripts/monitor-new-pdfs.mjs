#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// PDF sources to monitor
const PDF_SOURCES = [
  {
    name: 'Childrens Court Annual Report',
    baseUrl: 'https://www.courts.qld.gov.au/courts/childrens-court/annual-reports',
    pdfPattern: /cc-ar-(\d{4}-\d{4})\.pdf/,
    frequency: 'annual',
    expectedMonth: 7, // July
    lastKnown: '2023-24'
  },
  {
    name: 'Youth Detention Census',
    baseUrl: 'https://www.cyjma.qld.gov.au/resources/resource/youth-justice-census',
    pdfPattern: /yj-census.*\.pdf/,
    frequency: 'quarterly',
    checkEveryDays: 90
  },
  {
    name: 'Police Statistical Review', 
    baseUrl: 'https://www.police.qld.gov.au/maps-and-statistics',
    pdfPattern: /Statistical.*Review.*(\d{4}).*\.pdf/,
    frequency: 'annual',
    expectedMonth: 8, // August
    lastKnown: '2023-24'
  },
  {
    name: 'Budget Papers - DCSSDS',
    baseUrl: 'https://budget.qld.gov.au/',
    pdfPattern: /Budget.*DCSSDS.*(\d{4}).*\.pdf/,
    frequency: 'annual',
    expectedMonth: 6, // June
    lastKnown: '2024-25'
  }
]

console.log('🔍 MONITORING FOR NEW GOVERNMENT PDFS')
console.log('=====================================\n')

async function checkForNewPDFs() {
  const newPDFs = []
  
  for (const source of PDF_SOURCES) {
    console.log(`\n📄 Checking: ${source.name}`)
    console.log(`   URL: ${source.baseUrl}`)
    console.log(`   Frequency: ${source.frequency}`)
    
    try {
      // Check if it's time to look for new PDFs
      const shouldCheck = shouldCheckSource(source)
      if (!shouldCheck) {
        console.log('   ⏰ Not time to check yet')
        continue
      }
      
      // Fetch the page
      const response = await fetch(source.baseUrl)
      const html = await response.text()
      
      // Find PDF links
      const pdfLinks = extractPDFLinks(html, source.pdfPattern)
      console.log(`   📎 Found ${pdfLinks.length} PDFs matching pattern`)
      
      // Check if any are new
      for (const pdf of pdfLinks) {
        const isNew = await checkIfNewPDF(pdf, source)
        if (isNew) {
          console.log(`   🆕 NEW PDF FOUND: ${pdf.filename}`)
          newPDFs.push({
            source: source.name,
            url: pdf.url,
            filename: pdf.filename,
            foundAt: new Date().toISOString()
          })
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking source: ${error.message}`)
    }
  }
  
  // Store any new PDFs found
  if (newPDFs.length > 0) {
    console.log(`\n\n🎉 FOUND ${newPDFs.length} NEW PDFS!`)
    await storeNewPDFs(newPDFs)
    await notifyNewPDFs(newPDFs)
  } else {
    console.log('\n\n✅ No new PDFs found - all sources up to date')
  }
  
  return newPDFs
}

function shouldCheckSource(source) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  
  if (source.frequency === 'annual' && source.expectedMonth) {
    // Check in expected month and one month after
    return currentMonth === source.expectedMonth || 
           currentMonth === source.expectedMonth + 1
  }
  
  // For quarterly/other frequencies, always check
  return true
}

function extractPDFLinks(html, pattern) {
  const links = []
  const linkRegex = /href=["']([^"']+\.pdf)["']/gi
  let match
  
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    const filename = url.split('/').pop()
    
    if (pattern.test(filename)) {
      links.push({
        url: url.startsWith('http') ? url : `https://www.qld.gov.au${url}`,
        filename
      })
    }
  }
  
  return links
}

async function checkIfNewPDF(pdf, source) {
  // Check if we've already processed this PDF
  const { data } = await supabase
    .from('scraped_content')
    .select('url')
    .eq('url', pdf.url)
    .single()
  
  return !data // New if not in database
}

async function storeNewPDFs(pdfs) {
  for (const pdf of pdfs) {
    await supabase
      .from('scraped_content')
      .insert({
        source: pdf.source,
        url: pdf.url,
        title: `${pdf.source} - ${pdf.filename}`,
        content: 'PDF awaiting extraction',
        metadata: {
          filename: pdf.filename,
          foundAt: pdf.foundAt,
          status: 'pending_extraction'
        },
        scraper_name: 'pdf-monitor',
        data_type: 'pdf_document'
      })
  }
}

async function notifyNewPDFs(pdfs) {
  console.log('\n📧 NOTIFICATION:')
  console.log('================')
  pdfs.forEach(pdf => {
    console.log(`\nNew ${pdf.source} available!`)
    console.log(`Filename: ${pdf.filename}`)
    console.log(`URL: ${pdf.url}`)
    console.log(`Action: Run extraction script to process`)
  })
}

// Manual extraction for specific PDFs
export async function extractPDFData(pdfUrl, dataType) {
  console.log(`\n📄 Extracting data from: ${pdfUrl}`)
  
  try {
    // Download PDF
    const response = await fetch(pdfUrl)
    const buffer = await response.buffer()
    
    // Parse PDF (would use pdf-parse here)
    console.log(`   ✅ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)
    
    // Extract based on type
    let extractedData = {}
    
    switch (dataType) {
      case 'court_statistics':
        extractedData = {
          total_defendants: 'Extract from page 15',
          indigenous_percentage: 'Extract from page 18-19',
          bail_refused_percentage: 'Extract from page 22'
        }
        break
        
      case 'youth_detention':
        extractedData = {
          total_youth: 'Extract from summary page',
          indigenous_percentage: 'Extract from demographics',
          capacity_percentage: 'Extract from facilities section'
        }
        break
        
      case 'police_statistics':
        extractedData = {
          youth_offenders: 'Extract from youth crime section',
          repeat_offender_rate: 'Extract from recidivism data'
        }
        break
    }
    
    console.log('   📊 Extracted data structure:', Object.keys(extractedData))
    return extractedData
    
  } catch (error) {
    console.error(`   ❌ Extraction failed: ${error.message}`)
    throw error
  }
}

// Run the monitor
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkForNewPDFs()
    .then(pdfs => {
      if (pdfs.length > 0) {
        console.log('\n\n🚀 Next step: Run extraction on new PDFs')
      }
    })
    .catch(error => {
      console.error('Monitor failed:', error)
      process.exit(1)
    })
}