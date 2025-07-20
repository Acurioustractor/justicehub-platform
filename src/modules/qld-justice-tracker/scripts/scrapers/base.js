const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') })

class BaseScraper {
  constructor() {
    // Use NEXT_PUBLIC variables if available, otherwise fallback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials. Please check your .env.local file')
      console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY')
      process.exit(1)
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async fetchPage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const html = await response.text()
      return cheerio.load(html)
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      throw error
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  extractTables($) {
    const tables = []
    $('table').each((i, table) => {
      const headers = []
      const rows = []
      
      // Extract headers
      $(table).find('th').each((i, th) => {
        headers.push($(th).text().trim())
      })
      
      // Extract rows
      $(table).find('tr').each((i, tr) => {
        const cells = []
        $(tr).find('td').each((i, td) => {
          cells.push($(td).text().trim())
        })
        
        if (cells.length > 0 && cells.length === headers.length) {
          const row = {}
          headers.forEach((header, index) => {
            row[header] = cells[index]
          })
          rows.push(row)
        }
      })
      
      if (rows.length > 0) {
        tables.push({
          headers,
          data: rows
        })
      }
    })
    
    return tables
  }

  parseAmount(text) {
    const match = text.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:million|m|thousand|k)?/i)
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''))
      
      if (/million|m/i.test(text)) {
        amount *= 1_000_000
      } else if (/thousand|k/i.test(text)) {
        amount *= 1_000
      }
      
      return amount
    }
    return null
  }

  async saveToSupabase(table, data) {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
      
      if (error) {
        console.error(`Error saving to ${table}:`, error)
        throw error
      }
      
      console.log(`Saved ${data.length} records to ${table}`)
      return result
    } catch (error) {
      console.error('Supabase error:', error)
      throw error
    }
  }
}

module.exports = BaseScraper