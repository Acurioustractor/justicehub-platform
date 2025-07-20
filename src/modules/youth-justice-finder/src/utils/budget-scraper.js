// Queensland Youth Justice Budget Intelligence System
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import csvParser from 'csv-parser';

class QueenslandBudgetTracker {
  constructor() {
    this.baseUrls = {
      openData: 'https://www.data.qld.gov.au',
      budget: 'https://budget.qld.gov.au',
      families: 'https://www.families.qld.gov.au',
      parliament: 'https://www.parliament.qld.gov.au'
    };
    
    this.budgetData = {
      total: 770900000, // $770.9M for 2025-26
      previousYear: 615000000, // Estimate for 2024-25
      allocations: {},
      contracts: [],
      tenders: [],
      announcements: []
    };
  }

  // Simple manual CSV parsing approach  
  parseCSVLine(line, headers) {
    const result = {};
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    headers.forEach((header, index) => {
      result[header] = values[index] || '';
    });
    
    return result;
  }

  // Fetch the latest contract disclosure CSV - simplified approach
  async fetchContractData() {
    try {
      console.log('Fetching latest contract disclosure data...');
      
      // Start with just one CSV to test
      const csvUrl = 'https://www.families.qld.gov.au/_media/documents/open-data/dyj_contract_disclosure_oct_2024.csv';
      
      console.log(`Fetching contracts from: ${csvUrl}`);
      const response = await axios.get(csvUrl, { 
        timeout: 30000,
        responseType: 'text'
      });
      
      // Clean the CSV data
      let csvData = response.data;
      if (csvData.charCodeAt(0) === 0xFEFF) {
        csvData = csvData.slice(1);
      }
      
      console.log('CSV data length:', csvData.length);
      console.log('First 500 chars:', csvData.substring(0, 500));
      
      const lines = csvData.split('\n').filter(line => line.trim());
      console.log('Total lines:', lines.length);
      
      if (lines.length === 0) {
        console.log('No lines found in CSV');
        return [];
      }
      
      // Parse header
      const headerLine = lines[0];
      console.log('Header line:', headerLine);
      
      const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('Headers:', headers);
      
      const contracts = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        try {
          const row = this.parseCSVLine(line, headers);
          
          if (i <= 3) {
            console.log(`Row ${i}:`, row);
          }
          
          // Extract contract data with multiple possible column names
          const description = row['Contract description/name'] || 
                            row['Contract description'] || 
                            row['Description'] || '';
                            
          const supplierName = row['Supplier name'] || 
                             row['Supplier Name'] || 
                             row['Supplier'] || '';
                             
          const contractValue = row['Contract value'] || 
                              row['Value'] || '0';
                              
          const awardDate = row['Award contract date'] || 
                          row['Award Date'] || '';
                          
          const contractRef = row['Contract reference number'] || 
                            row['Reference'] || '';
                            
          const supplierAddress = row['Supplier Address'] || 
                                row['Address'] || '';
          
          if (description && supplierName && description.trim() && supplierName.trim()) {
            const contract = {
              contractNumber: contractRef,
              description: description.trim(),
              supplier: supplierName.trim(),
              value: this.parseContractValue(contractValue),
              awardDate: this.parseDate(awardDate),
              category: this.categorizeContract(description),
              region: this.extractRegion(supplierAddress)
            };
            
            contracts.push(contract);
            
            if (contracts.length <= 5) {
              console.log(`Added contract ${contracts.length}:`, contract.description, '-', contract.value);
            }
          }
        } catch (rowError) {
          console.error(`Error parsing row ${i}:`, rowError.message);
        }
      }
      
      console.log(`Total contracts processed: ${contracts.length}`);
      return contracts;
      
    } catch (error) {
      console.error('Error fetching contract data:', error);
      return [];
    }
  }

  // Parse contract values (handle various formats)
  parseContractValue(valueString) {
    if (!valueString) return 0;
    
    // Remove currency symbols and commas
    const cleaned = valueString.replace(/[$,\s]/g, '');
    
    // Handle ranges (take the higher value)
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-');
      return parseFloat(parts[parts.length - 1]) || 0;
    }
    
    return parseFloat(cleaned) || 0;
  }

  // Parse dates in various formats
  parseDate(dateString) {
    if (!dateString) return new Date();
    
    try {
      // Handle DD/MM/YYYY format (Australian format)
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY -> YYYY-MM-DD
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return new Date(`${year}-${month}-${day}`);
        }
      }
      
      return new Date(dateString);
    } catch (error) {
      console.warn('Failed to parse date:', dateString);
      return new Date();
    }
  }

  // Categorize contracts based on description
  categorizeContract(description) {
    const categories = {
      'Travel & Transportation': ['travel', 'accommodation', 'meals', 'transport', 'vehicle', 'flight', 'charter'],
      'Technology Services': ['ICT', 'hardware', 'software', 'laptop', 'monitor', 'computer', 'system', 'technology'],
      'Infrastructure & Facilities': ['fit out', 'office', 'construction', 'building', 'facility', 'maintenance', 'infrastructure'],
      'Professional Services': ['professional services', 'consulting', 'advisory', 'management', 'recruitment'],
      'Food Services': ['food', 'meal', 'catering', 'provisions', 'meat', 'kitchen'],
      'Security & Safety': ['security', 'protective', 'safety', 'equipment', 'uniform', 'duress'],
      'Health Services': ['health', 'medical', 'mental health', 'counselling', 'wellbeing'],
      'Education & Training': ['education', 'school', 'training', 'learning', 'educational'],
      'Legal Services': ['legal', 'court', 'magistrate', 'justice', 'advocacy'],
      'Community Programs': ['community', 'diversion', 'outreach', 'support', 'cultural', 'indigenous'],
      'Cleaning & Maintenance': ['cleaning', 'maintenance', 'janitorial', 'grounds'],
      'Administration': ['administration', 'office supplies', 'stationery', 'communication']
    };

    const desc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other Services';
  }

  // Extract region from supplier address
  extractRegion(address) {
    const regions = {
      'Brisbane': ['brisbane', 'south brisbane', 'west end', 'fortitude valley'],
      'Gold Coast': ['gold coast', 'southport', 'surfers paradise'],
      'Sunshine Coast': ['sunshine coast', 'maroochydore', 'caloundra'],
      'Townsville': ['townsville', 'thuringowa'],
      'Cairns': ['cairns', 'port douglas'],
      'Toowoomba': ['toowoomba', 'dalby'],
      'Mackay': ['mackay', 'proserpine'],
      'Rockhampton': ['rockhampton', 'gladstone'],
      'Bundaberg': ['bundaberg', 'hervey bay'],
      'Mount Isa': ['mount isa', 'cloncurry']
    };

    const addr = address.toLowerCase();
    
    for (const [region, locations] of Object.entries(regions)) {
      if (locations.some(location => addr.includes(location))) {
        return region;
      }
    }
    
    return 'Other';
  }

  // Fetch budget allocation data from budget papers
  async fetchBudgetAllocations() {
    try {
      console.log('Fetching budget allocation data...');
      
      // Key budget allocations for 2024-25 and 2025-26
      const allocations = {
        '2025-26': {
          total: 770900000,
          programs: {
            'Early Intervention Programs': 215000000,
            'Staying On Track Rehabilitation': 225000000,
            'Youth Justice Schools': 40000000,
            'Youth Detention Support': 50800000,
            'Educational Engagement': 288200000,
            'After Hours Services': 6000000,
            'Restorative Justice': 5000000,
            'Cultural Family Partnership': 3300000,
            'Justice Reform Office': 24800000,
            'New Courts': 4100000
          }
        },
        '2024-25': {
          total: 615000000, // Estimated
          programs: {
            'Educational Engagement': 288200000,
            'Youth Detention Support': 50800000,
            'Integrated Case Management': 27700000,
            'After Hours Services': 6000000,
            'Restorative Justice': 5000000,
            'Cultural Family Partnership': 3300000,
            'Justice Reform Office': 24800000,
            'New Courts': 4100000
          }
        }
      };

      return allocations;
    } catch (error) {
      console.error('Error fetching budget allocations:', error);
      return {};
    }
  }

  // Monitor for new funding opportunities and tenders
  async monitorFundingOpportunities() {
    try {
      console.log('Monitoring funding opportunities...');
      
      const opportunities = [];
      
      // Check QTenders for youth justice opportunities
      const qtendersUrl = 'https://qtenders.hpw.qld.gov.au/qtenders/';
      
      // Check grant opportunity websites
      const grantSites = [
        'https://www.business.qld.gov.au/starting-business/grants-assistance',
        'https://www.qcoss.org.au/funding-opportunities/'
      ];

      // This would be implemented with actual web scraping
      // For now, return structure for known opportunities
      opportunities.push({
        title: 'Youth Justice Community Programs Grant',
        description: 'Funding for community-based youth justice programs',
        amount: 5000000,
        closingDate: new Date('2025-08-15'),
        status: 'Open',
        eligibility: 'Community organizations working with at-risk youth',
        source: 'Department of Youth Justice',
        link: 'https://www.youthjustice.qld.gov.au/funding'
      });

      return opportunities;
    } catch (error) {
      console.error('Error monitoring funding opportunities:', error);
      return [];
    }
  }

  // Analyze spending trends and predictions
  async analyzeSpendingTrends(contracts) {
    try {
      console.log('Analyzing spending trends...');
      
      const analysis = {
        totalSpending: 0,
        spendingByCategory: {},
        spendingByMonth: {},
        spendingByRegion: {},
        averageContractValue: 0,
        largestContracts: [],
        trends: {
          monthlyGrowth: 0,
          categoryShifts: {},
          regionalDistribution: {}
        }
      };

      // Calculate totals and averages
      analysis.totalSpending = contracts.reduce((sum, contract) => sum + contract.value, 0);
      analysis.averageContractValue = analysis.totalSpending / contracts.length;

      // Group by category
      contracts.forEach(contract => {
        if (!analysis.spendingByCategory[contract.category]) {
          analysis.spendingByCategory[contract.category] = 0;
        }
        analysis.spendingByCategory[contract.category] += contract.value;
      });

      // Group by month
      contracts.forEach(contract => {
        if (contract.awardDate) {
          const month = contract.awardDate.toISOString().substring(0, 7); // YYYY-MM
          if (!analysis.spendingByMonth[month]) {
            analysis.spendingByMonth[month] = 0;
          }
          analysis.spendingByMonth[month] += contract.value;
        }
      });

      // Group by region
      contracts.forEach(contract => {
        if (!analysis.spendingByRegion[contract.region]) {
          analysis.spendingByRegion[contract.region] = 0;
        }
        analysis.spendingByRegion[contract.region] += contract.value;
      });

      // Find largest contracts
      analysis.largestContracts = contracts
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Calculate trends
      const months = Object.keys(analysis.spendingByMonth).sort();
      if (months.length >= 2) {
        const recent = analysis.spendingByMonth[months[months.length - 1]];
        const previous = analysis.spendingByMonth[months[months.length - 2]];
        analysis.trends.monthlyGrowth = ((recent - previous) / previous) * 100;
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing spending trends:', error);
      return {};
    }
  }

  // Generate budget intelligence report
  async generateIntelligenceReport() {
    try {
      console.log('Generating budget intelligence report...');
      
      const [contracts, allocations, opportunities] = await Promise.all([
        this.fetchContractData(),
        this.fetchBudgetAllocations(),
        this.monitorFundingOpportunities()
      ]);

      const analysis = await this.analyzeSpendingTrends(contracts);

      const report = {
        generatedAt: new Date(),
        summary: {
          totalBudget2025: 770900000,
          totalBudget2024: 615000000,
          budgetIncrease: 155900000,
          contractsAnalyzed: contracts.length,
          totalContractValue: analysis.totalSpending
        },
        allocations,
        contracts: {
          total: contracts.length,
          totalValue: analysis.totalSpending,
          byCategory: analysis.spendingByCategory,
          byRegion: analysis.spendingByRegion,
          largest: analysis.largestContracts
        },
        trends: {
          spending: analysis.trends,
          predictions: this.generatePredictions(analysis, allocations)
        },
        opportunities: opportunities,
        alerts: this.generateAlerts(analysis, opportunities)
      };

      return report;
    } catch (error) {
      console.error('Error generating intelligence report:', error);
      return null;
    }
  }

  // Generate spending predictions
  generatePredictions(analysis, allocations) {
    const predictions = {};
    
    // Predict quarterly spending based on historical data
    const currentSpending = analysis.totalSpending;
    const budgetUtilization = currentSpending / allocations['2025-26']?.total || 0;
    
    predictions.quarterlySpending = allocations['2025-26']?.total * 0.25; // Assume even quarterly distribution
    predictions.budgetUtilizationRate = budgetUtilization * 100;
    predictions.projectedYearEnd = currentSpending * 4; // Simple projection
    
    // Category predictions
    predictions.growingCategories = Object.entries(analysis.spendingByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    return predictions;
  }

  // Generate alerts for significant changes or opportunities
  generateAlerts(analysis, opportunities) {
    const alerts = [];
    
    // Budget utilization alerts
    if (analysis.trends.monthlyGrowth > 50) {
      alerts.push({
        type: 'warning',
        title: 'High Spending Growth',
        message: `Monthly spending increased by ${analysis.trends.monthlyGrowth.toFixed(1)}%`,
        priority: 'high'
      });
    }

    // Opportunity alerts
    opportunities.forEach(opp => {
      const daysUntilClose = Math.ceil((opp.closingDate - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilClose <= 30 && daysUntilClose > 0) {
        alerts.push({
          type: 'opportunity',
          title: 'Funding Opportunity Closing Soon',
          message: `${opp.title} closes in ${daysUntilClose} days`,
          priority: 'medium',
          link: opp.link
        });
      }
    });

    // Large contract alerts
    const largeContracts = analysis.largestContracts?.slice(0, 3) || [];
    largeContracts.forEach(contract => {
      if (contract.value > 1000000) { // $1M+
        alerts.push({
          type: 'info',
          title: 'Large Contract Awarded',
          message: `${contract.description} - $${(contract.value / 1000000).toFixed(1)}M to ${contract.supplier}`,
          priority: 'low'
        });
      }
    });

    return alerts;
  }

  // Save report to file
  async saveReport(report, filename = null) {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const file = filename || `budget-intelligence-${timestamp}.json`;
      
      await fs.promises.writeFile(file, JSON.stringify(report, null, 2));
      console.log(`Report saved to ${file}`);
      
      return file;
    } catch (error) {
      console.error('Error saving report:', error);
      return null;
    }
  }
}

export default QueenslandBudgetTracker;