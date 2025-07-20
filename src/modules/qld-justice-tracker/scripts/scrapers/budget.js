const BaseScraper = require('./base')

class BudgetScraper extends BaseScraper {
  constructor() {
    super()
    this.baseUrl = 'https://budget.qld.gov.au'
    this.youthJusticeKeywords = [
      'youth justice', 'youth detention', 'cleveland youth detention',
      'west moreton youth detention', 'youth crime', 'community youth justice',
      'supervised community accommodation', 'youth engagement', 'restorative justice'
    ]
  }

  async scrapeBudgetPapers(year = '2025-26') {
    console.log(`Scraping budget papers for ${year}`)
    
    const results = []
    const budgetUrls = [
      `/budget/${year}/budget-papers`,
      `/budget/${year}/service-delivery-statements`,
      `/budget/${year}/capital-statement`
    ]
    
    for (const urlPath of budgetUrls) {
      try {
        const url = this.baseUrl + urlPath
        const $ = await this.fetchPage(url)
        
        // Look for relevant department links
        const links = $('a[href]').map((i, el) => ({
          href: $(el).attr('href'),
          text: $(el).text().trim()
        })).get()
        
        for (const link of links) {
          const text = link.text.toLowerCase()
          if (this.isRelevantDepartment(text)) {
            if (link.href.endsWith('.pdf')) {
              results.push({
                type: 'pdf',
                url: link.href.startsWith('http') ? link.href : this.baseUrl + link.href,
                title: link.text,
                year: year
              })
            } else {
              const deptData = await this.scrapeDepartmentPage(link.href)
              results.push(...deptData)
            }
          }
        }
        
        // Add delay to avoid rate limiting
        await this.delay(1000)
      } catch (error) {
        console.error(`Error scraping ${urlPath}:`, error)
      }
    }
    
    return results
  }

  isRelevantDepartment(text) {
    const relevantDepts = ['youth justice', 'children', 'employment', 'communities']
    return relevantDepts.some(dept => text.includes(dept))
  }

  async scrapeDepartmentPage(url) {
    if (!url.startsWith('http')) {
      url = this.baseUrl + url
    }
    
    try {
      const $ = await this.fetchPage(url)
      const results = []
      
      // Extract tables with budget data
      const tables = this.extractTables($)
      
      for (const table of tables) {
        for (const row of table.data) {
          const rowText = Object.values(row).join(' ').toLowerCase()
          
          if (this.youthJusticeKeywords.some(keyword => rowText.includes(keyword))) {
            const amount = this.extractAmountFromRow(row)
            if (amount) {
              results.push({
                source: url,
                data: row,
                amount: amount,
                scraped_date: new Date().toISOString()
              })
            }
          }
        }
      }
      
      return results
    } catch (error) {
      console.error(`Error scraping department page ${url}:`, error)
      return []
    }
  }

  extractAmountFromRow(row) {
    for (const value of Object.values(row)) {
      const amount = this.parseAmount(value)
      if (amount) return amount
    }
    return null
  }

  async parseYouthJusticeAllocations(data) {
    const allocations = []
    
    for (const item of data) {
      if (item.data) {
        const row = item.data
        const category = this.determineCategory(row)
        
        allocations.push({
          fiscal_year: '2025-26',
          department: 'Department of Youth Justice',
          program: this.extractProgramName(row),
          category: category,
          amount: item.amount,
          description: JSON.stringify(row),
          source_url: item.source,
          source_document: 'Budget Paper',
          scraped_date: new Date().toISOString()
        })
      }
    }
    
    return allocations
  }

  determineCategory(row) {
    const rowText = JSON.stringify(row).toLowerCase()
    const detentionKeywords = ['detention', 'cleveland', 'west moreton']
    
    return detentionKeywords.some(keyword => rowText.includes(keyword)) 
      ? 'detention' 
      : 'community'
  }

  extractProgramName(row) {
    // Look for program/service names in common column headers
    const programKeys = ['program', 'service', 'initiative', 'description']
    
    for (const key of Object.keys(row)) {
      if (programKeys.some(pk => key.toLowerCase().includes(pk))) {
        return row[key]
      }
    }
    
    // Return first non-numeric value as program name
    for (const value of Object.values(row)) {
      if (typeof value === 'string' && !value.match(/^[\d\$,\.]+$/)) {
        return value
      }
    }
    
    return 'Unknown Program'
  }

  async run() {
    try {
      console.log('Starting budget scraper...')
      
      // Scrape budget papers
      const scrapedData = await this.scrapeBudgetPapers()
      console.log(`Found ${scrapedData.length} relevant budget items`)
      
      // Parse allocations
      const allocations = await this.parseYouthJusticeAllocations(scrapedData)
      console.log(`Parsed ${allocations.length} youth justice allocations`)
      
      // Save to Supabase
      if (allocations.length > 0) {
        await this.saveToSupabase('budget_allocations', allocations)
      }
      
      console.log('Budget scraper completed successfully')
    } catch (error) {
      console.error('Budget scraper failed:', error)
      process.exit(1)
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scraper = new BudgetScraper()
  scraper.run()
}

module.exports = BudgetScraper