import { ScraperManager } from '../../monitoring/ScraperManager'
import axios from 'axios'
import * as cheerio from 'cheerio'

interface BudgetAllocation {
  year: string
  category: string
  program_name: string
  amount: number
  percentage_of_total?: number
  is_community_based: boolean
  is_detention_based: boolean
  source_url: string
  notes?: string
}

export class BudgetAllocationsScraper {
  private manager: ScraperManager
  private supabase: any

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.manager = new ScraperManager(supabaseUrl, supabaseKey)
    // We'll use the manager's supabase instance indirectly
  }

  async scrape(): Promise<void> {
    const runId = await this.manager.startRun({
      scraperName: 'Budget Allocations Scraper',
      dataSource: 'budget_website',
      description: 'Scrapes Queensland youth justice budget allocations'
    })

    try {
      // URLs to scrape (these would be real Queensland budget pages)
      const urls = [
        'https://budget.qld.gov.au/youth-justice/',
        'https://www.treasury.qld.gov.au/budget-papers/',
        // Add more URLs as needed
      ]

      const allAllocations: BudgetAllocation[] = []

      for (const url of urls) {
        try {
          await this.manager.logWarning(`Scraping ${url}`)
          const allocations = await this.scrapeBudgetPage(url)
          allAllocations.push(...allocations)
        } catch (error) {
          await this.manager.logWarning(`Failed to scrape ${url}`, error)
        }
      }

      // Check data quality
      const qualityCheck = await this.manager.checkDataQuality(allAllocations)
      
      if (qualityCheck.completenessScore < 80) {
        await this.manager.createAlert({
          type: 'data_quality',
          severity: 'medium',
          message: `Budget data completeness is only ${qualityCheck.completenessScore}%`,
          details: qualityCheck
        })
      }

      // Save to database
      const metrics = await this.saveAllocations(allAllocations)

      // Complete the run
      await this.manager.completeRun({
        recordsFound: allAllocations.length,
        recordsProcessed: allAllocations.length,
        recordsInserted: metrics.inserted,
        recordsUpdated: metrics.updated
      })

    } catch (error) {
      await this.manager.failRun(error as Error)
      throw error
    }
  }

  private async scrapeBudgetPage(url: string): Promise<BudgetAllocation[]> {
    const allocations: BudgetAllocation[] = []

    try {
      // In a real implementation, this would fetch and parse the page
      // For now, we'll create mock data
      const mockData: BudgetAllocation[] = [
        {
          year: '2024-25',
          category: 'Youth Detention Centers',
          program_name: 'Cleveland Youth Detention Centre Operations',
          amount: 45000000,
          percentage_of_total: 35.5,
          is_community_based: false,
          is_detention_based: true,
          source_url: url,
          notes: 'Operational costs for 120-bed facility'
        },
        {
          year: '2024-25',
          category: 'Community Programs',
          program_name: 'Restorative Justice Conferencing',
          amount: 8500000,
          percentage_of_total: 6.7,
          is_community_based: true,
          is_detention_based: false,
          source_url: url,
          notes: 'Statewide program for youth diversion'
        },
        {
          year: '2024-25',
          category: 'Youth Detention Centers',
          program_name: 'Brisbane Youth Detention Centre',
          amount: 52000000,
          percentage_of_total: 41.0,
          is_community_based: false,
          is_detention_based: true,
          source_url: url
        },
        {
          year: '2024-25',
          category: 'Community Programs',
          program_name: 'On Country Programs',
          amount: 4200000,
          percentage_of_total: 3.3,
          is_community_based: true,
          is_detention_based: false,
          source_url: url,
          notes: 'Indigenous-led rehabilitation programs'
        },
        {
          year: '2024-25',
          category: 'Early Intervention',
          program_name: 'Youth Support Coordinators',
          amount: 6800000,
          percentage_of_total: 5.4,
          is_community_based: true,
          is_detention_based: false,
          source_url: url
        },
        {
          year: '2024-25',
          category: 'Infrastructure',
          program_name: 'New Youth Detention Facility Planning',
          amount: 10300000,
          percentage_of_total: 8.1,
          is_community_based: false,
          is_detention_based: true,
          source_url: url,
          notes: 'Planning for 200-bed facility in North Queensland'
        }
      ]

      // Add timestamp
      const timestamp = new Date().toISOString()
      mockData.forEach(item => {
        allocations.push({
          ...item,
          scraped_at: timestamp
        } as any)
      })

      return mockData

    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
      throw error
    }
  }

  private async saveAllocations(allocations: BudgetAllocation[]): Promise<{ inserted: number, updated: number }> {
    let inserted = 0
    let updated = 0

    // In a real implementation, this would save to Supabase
    // For now, we'll simulate the save
    console.log(`💾 Would save ${allocations.length} budget allocations to Supabase`)
    
    // Group by year and category for analysis
    const byCategory = allocations.reduce((acc, alloc) => {
      const key = `${alloc.year}-${alloc.is_detention_based ? 'detention' : 'community'}`
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 }
      }
      acc[key].total += alloc.amount
      acc[key].count++
      return acc
    }, {} as Record<string, { total: number, count: number }>)

    console.log('\n📊 Budget Analysis:')
    Object.entries(byCategory).forEach(([key, data]) => {
      console.log(`   ${key}: $${data.total.toLocaleString()} across ${data.count} programs`)
    })

    // Calculate detention vs community split
    const detentionTotal = allocations
      .filter(a => a.is_detention_based)
      .reduce((sum, a) => sum + a.amount, 0)
    
    const communityTotal = allocations
      .filter(a => a.is_community_based)
      .reduce((sum, a) => sum + a.amount, 0)
    
    const total = detentionTotal + communityTotal
    const detentionPercentage = (detentionTotal / total) * 100

    console.log(`\n🔍 Spending Split:`)
    console.log(`   Detention: $${detentionTotal.toLocaleString()} (${detentionPercentage.toFixed(1)}%)`)
    console.log(`   Community: $${communityTotal.toLocaleString()} (${(100 - detentionPercentage).toFixed(1)}%)`)

    // Check if detention spending is too high
    if (detentionPercentage > 70) {
      await this.manager.createAlert({
        type: 'anomaly',
        severity: 'high',
        message: `Detention spending is ${detentionPercentage.toFixed(1)}% of youth justice budget`,
        details: {
          detention_total: detentionTotal,
          community_total: communityTotal,
          percentage: detentionPercentage
        }
      })
    }

    // Simulate database operations
    inserted = allocations.length
    updated = 0

    return { inserted, updated }
  }
}