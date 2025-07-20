import crypto from 'crypto'

/**
 * Professional Data Validation Framework
 * Ensures all data meets quality standards before storage
 */

export class DataValidator {
  constructor() {
    this.validationRules = {
      // Source validation
      source: {
        mustBeGovernment: (url) => url.includes('.gov.au'),
        mustBeHTTPS: (url) => url.startsWith('https://'),
        mustBeAccessible: async (url) => {
          try {
            const response = await fetch(url, { method: 'HEAD' })
            return response.ok
          } catch {
            return false
          }
        }
      },
      
      // Data quality checks
      quality: {
        hasDate: (data) => data.date || data.report_date || data.period,
        hasSource: (data) => data.source_url && data.source_document,
        isRecent: (data) => {
          const date = new Date(data.date || data.report_date)
          const ageInDays = (Date.now() - date) / (1000 * 60 * 60 * 24)
          return ageInDays < 365 // Less than 1 year old
        },
        hasMetadata: (data) => data.extracted_at && data.scraper_name
      },
      
      // Data integrity
      integrity: {
        noMockData: (data) => {
          const mockIndicators = ['mock', 'test', 'example', 'sample', 'demo']
          const dataStr = JSON.stringify(data).toLowerCase()
          return !mockIndicators.some(indicator => dataStr.includes(indicator))
        },
        hasRealisticValues: (data) => {
          // Check for realistic number ranges
          if (data.total_youth !== undefined) {
            return data.total_youth > 0 && data.total_youth < 10000
          }
          if (data.indigenous_percentage !== undefined) {
            return data.indigenous_percentage >= 0 && data.indigenous_percentage <= 100
          }
          return true
        }
      }
    }
    
    this.qualityScores = {
      A: { min: 90, description: 'Direct from official API/database' },
      B: { min: 75, description: 'Extracted from verified PDF' },
      C: { min: 60, description: 'Scraped from official website' },
      D: { min: 40, description: 'Derived or calculated data' },
      F: { min: 0, description: 'Unverifiable or low quality' }
    }
  }

  /**
   * Validate a single data record
   */
  async validateRecord(record) {
    const validation = {
      valid: true,
      score: 100,
      issues: [],
      grade: 'A'
    }

    // Check source validity
    if (record.source_url) {
      if (!this.validationRules.source.mustBeGovernment(record.source_url)) {
        validation.issues.push('Source is not a government domain')
        validation.score -= 30
      }
      
      if (!this.validationRules.source.mustBeHTTPS(record.source_url)) {
        validation.issues.push('Source must use HTTPS')
        validation.score -= 10
      }
      
      const accessible = await this.validationRules.source.mustBeAccessible(record.source_url)
      if (!accessible) {
        validation.issues.push('Source URL is not accessible')
        validation.score -= 20
      }
    } else {
      validation.issues.push('No source URL provided')
      validation.score -= 40
    }

    // Check data quality
    if (!this.validationRules.quality.hasDate(record)) {
      validation.issues.push('No date information')
      validation.score -= 15
    }
    
    if (!this.validationRules.quality.hasSource(record)) {
      validation.issues.push('Missing source documentation')
      validation.score -= 20
    }
    
    if (!this.validationRules.quality.isRecent(record)) {
      validation.issues.push('Data is older than 1 year')
      validation.score -= 10
    }

    // Check integrity
    if (!this.validationRules.integrity.noMockData(record)) {
      validation.issues.push('Contains mock/test data indicators')
      validation.score -= 50
      validation.valid = false
    }
    
    if (!this.validationRules.integrity.hasRealisticValues(record)) {
      validation.issues.push('Contains unrealistic values')
      validation.score -= 25
    }

    // Assign grade
    validation.grade = this.calculateGrade(validation.score)
    
    // Fail if score too low
    if (validation.score < 40) {
      validation.valid = false
    }

    return validation
  }

  /**
   * Calculate quality grade from score
   */
  calculateGrade(score) {
    for (const [grade, config] of Object.entries(this.qualityScores)) {
      if (score >= config.min) {
        return grade
      }
    }
    return 'F'
  }

  /**
   * Generate data fingerprint for tracking
   */
  generateFingerprint(data) {
    const normalized = JSON.stringify(data, Object.keys(data).sort())
    return crypto.createHash('sha256').update(normalized).digest('hex')
  }

  /**
   * Create audit record
   */
  createAuditRecord(record, validation) {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      data_fingerprint: this.generateFingerprint(record),
      source_url: record.source_url,
      validation_score: validation.score,
      validation_grade: validation.grade,
      validation_issues: validation.issues,
      scraper_name: record.scraper_name || 'unknown',
      data_type: record.data_type || 'unknown'
    }
  }

  /**
   * Validate batch of records
   */
  async validateBatch(records) {
    const results = {
      total: records.length,
      valid: 0,
      invalid: 0,
      grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      issues: {},
      records: []
    }

    for (const record of records) {
      const validation = await this.validateRecord(record)
      
      if (validation.valid) {
        results.valid++
      } else {
        results.invalid++
      }
      
      results.grades[validation.grade]++
      
      // Track common issues
      validation.issues.forEach(issue => {
        results.issues[issue] = (results.issues[issue] || 0) + 1
      })
      
      results.records.push({
        record,
        validation,
        audit: this.createAuditRecord(record, validation)
      })
    }

    return results
  }

  /**
   * Generate validation report
   */
  generateReport(results) {
    const report = []
    
    report.push('DATA VALIDATION REPORT')
    report.push('='.repeat(50))
    report.push(`Total Records: ${results.total}`)
    report.push(`Valid: ${results.valid} (${(results.valid/results.total*100).toFixed(1)}%)`)
    report.push(`Invalid: ${results.invalid} (${(results.invalid/results.total*100).toFixed(1)}%)`)
    report.push('')
    
    report.push('Quality Grades:')
    Object.entries(results.grades).forEach(([grade, count]) => {
      if (count > 0) {
        const desc = this.qualityScores[grade].description
        report.push(`  ${grade}: ${count} records - ${desc}`)
      }
    })
    report.push('')
    
    if (Object.keys(results.issues).length > 0) {
      report.push('Common Issues:')
      Object.entries(results.issues)
        .sort((a, b) => b[1] - a[1])
        .forEach(([issue, count]) => {
          report.push(`  - ${issue}: ${count} occurrences`)
        })
    }
    
    return report.join('\n')
  }
}

// Export singleton instance
export const validator = new DataValidator()