import PDFParser from 'pdf-parse'
import fetch from 'node-fetch'
import { validator } from '../validation/data-validator.mjs'

/**
 * Professional PDF Data Extractor
 * Extracts structured data from Queensland government PDFs
 */

export class PDFExtractor {
  constructor() {
    this.patterns = {
      // Youth statistics patterns
      totalYouth: /total\s+(?:youth|young\s+people|children).*?(\d{1,4})/i,
      indigenousRate: /indigenous.*?(\d{1,3}\.?\d*)%/i,
      detentionCapacity: /capacity.*?(\d{1,3})%/i,
      remandRate: /remand.*?(\d{1,3}\.?\d*)%/i,
      
      // Financial patterns
      budgetAmount: /\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|M|B)/gi,
      costPerDay: /\$(\d{1,4})\s*(?:per|\/)\s*day/i,
      
      // Court statistics
      totalDefendants: /total\s+defendants.*?(\d{1,5})/i,
      bailRefused: /bail\s+refused.*?(\d{1,4})/i,
      averageDays: /average.*?(\d{1,3})\s*days/i,
      
      // Date patterns
      reportPeriod: /(?:financial|fiscal)\s+year\s+(\d{4}[-–]\d{2,4})/i,
      reportDate: /(?:as\s+at|dated?|report\s+date).*?(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i
    }
  }

  /**
   * Download and parse PDF from URL
   */
  async extractFromURL(url, metadata = {}) {
    try {
      console.log(`📄 Downloading PDF from: ${url}`)
      
      // Download PDF
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`)
      }
      
      const buffer = await response.buffer()
      console.log(`   ✅ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)
      
      // Parse PDF
      const data = await PDFParser(buffer)
      console.log(`   📖 Extracted ${data.numpages} pages`)
      
      // Extract structured data
      const extracted = this.extractStructuredData(data.text, metadata)
      
      // Add source information
      extracted.source_url = url
      extracted.source_document = metadata.name || url.split('/').pop()
      extracted.extracted_at = new Date().toISOString()
      extracted.pdf_pages = data.numpages
      extracted.scraper_name = 'pdf-extractor'
      
      return extracted
      
    } catch (error) {
      console.error(`   ❌ PDF extraction failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Extract structured data from text
   */
  extractStructuredData(text, metadata = {}) {
    const data = {
      raw_text_sample: text.substring(0, 500),
      data_type: metadata.dataType || 'unknown'
    }

    // Extract report period/date
    const periodMatch = text.match(this.patterns.reportPeriod)
    if (periodMatch) {
      data.report_period = periodMatch[1]
    }
    
    const dateMatch = text.match(this.patterns.reportDate)
    if (dateMatch) {
      data.report_date = this.parseDate(dateMatch[1])
    }

    // Extract based on document type
    switch (metadata.dataType) {
      case 'court_statistics':
        this.extractCourtStatistics(text, data)
        break
        
      case 'youth_detention':
        this.extractYouthDetentionData(text, data)
        break
        
      case 'budget':
        this.extractBudgetData(text, data)
        break
        
      case 'police_statistics':
        this.extractPoliceData(text, data)
        break
        
      default:
        // Try to extract any recognizable data
        this.extractGenericData(text, data)
    }

    return data
  }

  /**
   * Extract court statistics
   */
  extractCourtStatistics(text, data) {
    // Total defendants
    const defendantsMatch = text.match(this.patterns.totalDefendants)
    if (defendantsMatch) {
      data.total_defendants = parseInt(defendantsMatch[1])
    }

    // Indigenous percentage
    const indigenousMatch = text.match(this.patterns.indigenousRate)
    if (indigenousMatch) {
      data.indigenous_percentage = parseFloat(indigenousMatch[1])
    }

    // Bail refused
    const bailMatch = text.match(this.patterns.bailRefused)
    if (bailMatch) {
      data.bail_refused_count = parseInt(bailMatch[1])
    }

    // Average time to sentence
    const daysMatch = text.match(this.patterns.averageDays)
    if (daysMatch) {
      data.average_days_to_sentence = parseInt(daysMatch[1])
    }

    // Extract tables if present
    const tables = this.extractTables(text)
    if (tables.length > 0) {
      data.extracted_tables = tables
    }
  }

  /**
   * Extract youth detention data
   */
  extractYouthDetentionData(text, data) {
    // Total youth in detention
    const youthMatch = text.match(this.patterns.totalYouth)
    if (youthMatch) {
      data.total_youth = parseInt(youthMatch[1])
    }

    // Indigenous rate
    const indigenousMatch = text.match(this.patterns.indigenousRate)
    if (indigenousMatch) {
      data.indigenous_percentage = parseFloat(indigenousMatch[1])
    }

    // Detention capacity
    const capacityMatch = text.match(this.patterns.detentionCapacity)
    if (capacityMatch) {
      data.capacity_percentage = parseFloat(capacityMatch[1])
    }

    // Remand rate
    const remandMatch = text.match(this.patterns.remandRate)
    if (remandMatch) {
      data.remand_percentage = parseFloat(remandMatch[1])
    }

    // Age breakdown if available
    const agePattern = /(\d{2})\s*years?.*?(\d{1,3})\s*(?:youth|children)/gi
    let ageMatch
    data.age_breakdown = []
    while ((ageMatch = agePattern.exec(text)) !== null) {
      data.age_breakdown.push({
        age: parseInt(ageMatch[1]),
        count: parseInt(ageMatch[2])
      })
    }
  }

  /**
   * Extract budget data
   */
  extractBudgetData(text, data) {
    // Find all budget amounts
    const amounts = []
    let match
    while ((match = this.patterns.budgetAmount.exec(text)) !== null) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      const multiplier = match[2].toLowerCase().startsWith('b') ? 1000 : 1
      amounts.push({
        raw: match[0],
        amount: amount * multiplier * 1000000, // Convert to dollars
        context: text.substring(match.index - 50, match.index + 50)
      })
    }
    
    if (amounts.length > 0) {
      data.budget_amounts = amounts
      data.total_budget = amounts.reduce((sum, a) => sum + a.amount, 0)
    }

    // Cost per day
    const costMatch = text.match(this.patterns.costPerDay)
    if (costMatch) {
      data.cost_per_day = parseInt(costMatch[1])
    }

    // Look for specific allocations
    const categories = ['detention', 'community', 'prevention', 'infrastructure']
    data.allocations = []
    
    categories.forEach(category => {
      const pattern = new RegExp(`${category}.*?\\$([\\d,]+(?:\\.\\d+)?)(\\s*(?:million|M))`, 'i')
      const catMatch = text.match(pattern)
      if (catMatch) {
        data.allocations.push({
          category,
          amount: parseFloat(catMatch[1].replace(/,/g, '')) * 1000000
        })
      }
    })
  }

  /**
   * Extract police statistics
   */
  extractPoliceData(text, data) {
    // Youth offender numbers
    const offenderPattern = /youth\s+offenders?.*?(\d{1,5})/i
    const offenderMatch = text.match(offenderPattern)
    if (offenderMatch) {
      data.youth_offenders = parseInt(offenderMatch[1])
    }

    // Repeat offender rate
    const repeatPattern = /repeat\s+offenders?.*?(\d{1,3}\.?\d*)%/i
    const repeatMatch = text.match(repeatPattern)
    if (repeatMatch) {
      data.repeat_offender_rate = parseFloat(repeatMatch[1])
    }

    // Crime categories
    const crimeTypes = ['theft', 'assault', 'property', 'drug', 'traffic']
    data.crime_breakdown = []
    
    crimeTypes.forEach(crime => {
      const pattern = new RegExp(`${crime}.*?(\\d{1,5})\\s*(?:offences?|incidents?)`, 'i')
      const crimeMatch = text.match(pattern)
      if (crimeMatch) {
        data.crime_breakdown.push({
          type: crime,
          count: parseInt(crimeMatch[1])
        })
      }
    })
  }

  /**
   * Extract any generic data patterns
   */
  extractGenericData(text, data) {
    // Try all patterns
    this.extractCourtStatistics(text, data)
    this.extractYouthDetentionData(text, data)
    this.extractBudgetData(text, data)
    this.extractPoliceData(text, data)
    
    // Remove empty arrays
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key]) && data[key].length === 0) {
        delete data[key]
      }
    })
  }

  /**
   * Extract tables from text (basic implementation)
   */
  extractTables(text) {
    const tables = []
    
    // Look for table-like patterns
    const lines = text.split('\n')
    let currentTable = null
    
    lines.forEach(line => {
      // Detect table headers (multiple words separated by multiple spaces)
      if (line.match(/\w+\s{3,}\w+/)) {
        if (currentTable) {
          tables.push(currentTable)
        }
        currentTable = {
          headers: line.trim().split(/\s{3,}/),
          rows: []
        }
      } else if (currentTable && line.match(/\d/)) {
        // Add data rows
        const cells = line.trim().split(/\s{2,}/)
        if (cells.length === currentTable.headers.length) {
          currentTable.rows.push(cells)
        }
      }
    })
    
    if (currentTable && currentTable.rows.length > 0) {
      tables.push(currentTable)
    }
    
    return tables
  }

  /**
   * Parse various date formats
   */
  parseDate(dateStr) {
    // Try to parse common Australian date formats
    const formats = [
      /(\d{1,2})[\s\/\-](\d{1,2})[\s\/\-](\d{4})/,  // DD/MM/YYYY
      /(\d{1,2})[\s\/\-](\w+)[\s\/\-](\d{4})/,      // DD Month YYYY
      /(\w+)\s+(\d{4})/                              // Month YYYY
    ]
    
    for (const format of formats) {
      const match = dateStr.match(format)
      if (match) {
        try {
          return new Date(dateStr).toISOString().split('T')[0]
        } catch {
          return dateStr
        }
      }
    }
    
    return dateStr
  }

  /**
   * Validate extracted data
   */
  async validateExtractedData(data) {
    return await validator.validateRecord(data)
  }
}

// Export singleton instance
export const pdfExtractor = new PDFExtractor()