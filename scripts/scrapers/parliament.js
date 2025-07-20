const BaseScraper = require('./base')

class ParliamentScraper extends BaseScraper {
  constructor() {
    super()
    this.baseUrl = 'https://www.parliament.qld.gov.au'
    this.youthJusticeKeywords = [
      'youth justice', 'youth detention', 'juvenile', 'young offender',
      'cleveland', 'west moreton', 'youth crime', 'youth criminal'
    ]
  }

  async scrapeHansard(days = 30) {
    console.log(`Scraping Hansard for last ${days} days`)
    const results = []
    
    try {
      // Navigate to Hansard search page
      const searchUrl = `${this.baseUrl}/work-of-assembly/hansard`
      const $ = await this.fetchPage(searchUrl)
      
      // Extract recent Hansard links
      const hansardLinks = $('a[href*="hansard"]').map((i, el) => ({
        href: $(el).attr('href'),
        text: $(el).text().trim(),
        date: this.extractDate($(el).text())
      })).get()
      
      // Filter by date range
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const recentLinks = hansardLinks.filter(link => {
        if (link.date && new Date(link.date) > cutoffDate) {
          return true
        }
        return false
      })
      
      // Search each Hansard for youth justice mentions
      for (const link of recentLinks) {
        try {
          const doc = await this.searchHansardDocument(link)
          if (doc) {
            results.push(doc)
          }
          await this.delay(1500) // Rate limiting
        } catch (error) {
          console.error(`Error processing Hansard link:`, error)
        }
      }
      
    } catch (error) {
      console.error('Error scraping Hansard:', error)
    }
    
    return results
  }

  async searchHansardDocument(link) {
    const url = link.href.startsWith('http') ? link.href : this.baseUrl + link.href
    
    try {
      const $ = await this.fetchPage(url)
      const content = $('body').text().toLowerCase()
      
      // Check for youth justice keywords
      const hasYouthJustice = this.youthJusticeKeywords.some(keyword => 
        content.includes(keyword)
      )
      
      if (!hasYouthJustice) {
        return null
      }
      
      // Extract relevant passages
      const mentions = this.extractMentions($, this.youthJusticeKeywords)
      
      return {
        document_type: 'hansard',
        title: link.text,
        date: link.date,
        url: url,
        content: mentions.join('\n\n'),
        mentions_youth_justice: true,
        mentions_spending: content.includes('budget') || content.includes('cost') || content.includes('spending'),
        mentions_indigenous: content.includes('indigenous') || content.includes('aboriginal') || content.includes('torres strait'),
        scraped_date: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error searching document ${url}:`, error)
      return null
    }
  }

  async scrapeCommitteeReports() {
    console.log('Scraping committee reports')
    const results = []
    
    try {
      const committeesUrl = `${this.baseUrl}/work-of-committees/committees`
      const $ = await this.fetchPage(committeesUrl)
      
      // Find relevant committees
      const relevantCommittees = [
        'Legal Affairs and Safety Committee',
        'Community Support and Services Committee',
        'Economics and Governance Committee'
      ]
      
      for (const committee of relevantCommittees) {
        const committeeLink = $(`a:contains("${committee}")`).attr('href')
        if (committeeLink) {
          const reports = await this.scrapeCommitteeReportsPage(committeeLink)
          results.push(...reports)
        }
      }
      
    } catch (error) {
      console.error('Error scraping committee reports:', error)
    }
    
    return results
  }

  async scrapeCommitteeReportsPage(url) {
    if (!url.startsWith('http')) {
      url = this.baseUrl + url
    }
    
    const results = []
    
    try {
      const $ = await this.fetchPage(url)
      
      // Find report links
      const reportLinks = $('a[href*="report"]').map((i, el) => ({
        href: $(el).attr('href'),
        text: $(el).text().trim()
      })).get()
      
      for (const link of reportLinks) {
        const text = link.text.toLowerCase()
        if (this.youthJusticeKeywords.some(keyword => text.includes(keyword))) {
          results.push({
            document_type: 'committee_report',
            title: link.text,
            date: this.extractDate(link.text),
            url: link.href.startsWith('http') ? link.href : this.baseUrl + link.href,
            mentions_youth_justice: true,
            scraped_date: new Date().toISOString()
          })
        }
      }
      
    } catch (error) {
      console.error(`Error scraping committee page ${url}:`, error)
    }
    
    return results
  }

  async scrapeQuestionsOnNotice() {
    console.log('Scraping questions on notice')
    const results = []
    
    try {
      const qonUrl = `${this.baseUrl}/work-of-assembly/questions-on-notice`
      const $ = await this.fetchPage(qonUrl)
      
      // Extract QON links
      const qonLinks = $('a[href*="question"]').map((i, el) => ({
        href: $(el).attr('href'),
        text: $(el).text().trim()
      })).get()
      
      for (const link of qonLinks) {
        const text = link.text.toLowerCase()
        if (this.youthJusticeKeywords.some(keyword => text.includes(keyword))) {
          const qon = await this.parseQuestionOnNotice(link)
          if (qon) {
            results.push(qon)
          }
        }
      }
      
    } catch (error) {
      console.error('Error scraping questions on notice:', error)
    }
    
    return results
  }

  async parseQuestionOnNotice(link) {
    const url = link.href.startsWith('http') ? link.href : this.baseUrl + link.href
    
    try {
      const $ = await this.fetchPage(url)
      const content = $('body').text()
      
      // Extract author from QON format
      const authorMatch = content.match(/Asked by: ([^,\n]+)/i)
      const author = authorMatch ? authorMatch[1].trim() : null
      
      return {
        document_type: 'question_on_notice',
        title: link.text,
        date: this.extractDate(link.text),
        author: author,
        url: url,
        content: content.substring(0, 5000), // First 5000 chars
        mentions_youth_justice: true,
        mentions_spending: content.toLowerCase().includes('cost') || content.toLowerCase().includes('budget'),
        mentions_indigenous: content.toLowerCase().includes('indigenous'),
        scraped_date: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error parsing QON ${url}:`, error)
      return null
    }
  }

  extractDate(text) {
    // Try various date formats
    const patterns = [
      /(\d{1,2}[\s-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s-]\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const date = new Date(match[1])
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      }
    }
    
    return null
  }

  extractMentions($, keywords) {
    const mentions = []
    const paragraphs = $('p').toArray()
    
    for (const p of paragraphs) {
      const text = $(p).text()
      const lowerText = text.toLowerCase()
      
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        mentions.push(text.trim())
      }
    }
    
    return mentions
  }

  async run() {
    try {
      console.log('Starting parliament scraper...')
      
      // Scrape different document types
      const hansardDocs = await this.scrapeHansard()
      console.log(`Found ${hansardDocs.length} Hansard documents`)
      
      const committeeReports = await this.scrapeCommitteeReports()
      console.log(`Found ${committeeReports.length} committee reports`)
      
      const qons = await this.scrapeQuestionsOnNotice()
      console.log(`Found ${qons.length} questions on notice`)
      
      // Combine all documents
      const allDocuments = [...hansardDocs, ...committeeReports, ...qons]
      
      // Save to Supabase
      if (allDocuments.length > 0) {
        await this.saveToSupabase('parliamentary_documents', allDocuments)
      }
      
      console.log('Parliament scraper completed successfully')
    } catch (error) {
      console.error('Parliament scraper failed:', error)
      process.exit(1)
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scraper = new ParliamentScraper()
  scraper.run()
}

module.exports = ParliamentScraper