import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface ValidationResult {
  passed: boolean
  field: string
  rule: string
  message: string
  value?: any
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const dataSource = searchParams.get('data_source')
    const days = parseInt(searchParams.get('days') || '30')
    
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    
    let query = supabase
      .from('data_quality_metrics')
      .select('*')
      .gte('metric_date', fromDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })

    if (dataSource && dataSource !== 'all') {
      query = query.eq('data_source', dataSource)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Calculate trends
    const trends = calculateQualityTrends(data || [])

    return NextResponse.json({
      success: true,
      data,
      trends,
      summary: {
        average_completeness: calculateAverage(data || [], 'completeness_score'),
        average_validation: calculateAverage(data || [], 'validation_pass_rate'),
        total_anomalies: (data || []).reduce((sum, m) => sum + (m.anomalies_detected?.length || 0), 0),
        total_missing_fields: (data || []).reduce((sum, m) => sum + (m.missing_fields?.length || 0), 0)
      }
    })
  } catch (error) {
    console.error('Error fetching data quality metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data quality metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data_source, records } = body
    
    const supabase = createClient()
    
    // Get validation rules for this data source
    const { data: rules, error: rulesError } = await supabase
      .from('data_validation_rules')
      .select('*')
      .eq('data_source', data_source)
      .eq('is_active', true)

    if (rulesError) {
      throw rulesError
    }

    // Validate records
    const validationResults = validateRecords(records, rules || [])
    
    // Calculate metrics
    const totalFields = countTotalFields(records)
    const missingFields = findMissingFields(records, rules || [])
    const completenessScore = totalFields > 0 
      ? ((totalFields - missingFields.length) / totalFields) * 100 
      : 0
    
    const validationPassRate = validationResults.length > 0
      ? (validationResults.filter(r => r.passed).length / validationResults.length) * 100
      : 100

    // Detect anomalies
    const anomalies = await detectAnomalies(supabase, data_source, records)

    // Save metrics
    const { error: metricsError } = await supabase
      .from('data_quality_metrics')
      .upsert({
        data_source,
        metric_date: new Date().toISOString().split('T')[0],
        completeness_score: completenessScore,
        validation_pass_rate: validationPassRate,
        missing_fields: missingFields,
        validation_failures: validationResults.filter(r => !r.passed),
        anomalies_detected: anomalies,
        record_count: records.length,
        expected_record_count: null // This would be set based on historical data
      }, {
        onConflict: 'data_source,metric_date'
      })

    if (metricsError) {
      throw metricsError
    }

    // Create alerts for critical issues
    if (completenessScore < 70 || validationPassRate < 80) {
      await supabase
        .from('scraper_alerts')
        .insert({
          scraper_name: 'quality_monitor',
          data_source,
          alert_type: 'data_quality',
          severity: completenessScore < 50 || validationPassRate < 60 ? 'high' : 'medium',
          message: `Data quality below threshold: ${completenessScore.toFixed(1)}% complete, ${validationPassRate.toFixed(1)}% valid`,
          details: {
            completeness_score: completenessScore,
            validation_pass_rate: validationPassRate,
            missing_fields: missingFields.slice(0, 10),
            validation_failures: validationResults.filter(r => !r.passed).slice(0, 10)
          }
        })
    }

    return NextResponse.json({
      success: true,
      metrics: {
        completeness_score: completenessScore,
        validation_pass_rate: validationPassRate,
        missing_fields: missingFields.length,
        validation_failures: validationResults.filter(r => !r.passed).length,
        anomalies: anomalies.length
      }
    })
  } catch (error) {
    console.error('Error processing data quality metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process data quality metrics' },
      { status: 500 }
    )
  }
}

function validateRecords(records: any[], rules: any[]): ValidationResult[] {
  const results: ValidationResult[] = []
  
  records.forEach((record, index) => {
    rules.forEach(rule => {
      const result = validateField(record, rule, index)
      if (result) {
        results.push(result)
      }
    })
  })
  
  return results
}

function validateField(record: any, rule: any, recordIndex: number): ValidationResult | null {
  const fieldValue = record[rule.field_name]
  const logic = rule.validation_logic
  
  switch (rule.rule_type) {
    case 'required_field':
      if (!fieldValue || fieldValue === '') {
        return {
          passed: false,
          field: rule.field_name,
          rule: rule.rule_name,
          message: rule.error_message || `${rule.field_name} is required`,
          value: fieldValue
        }
      }
      break
      
    case 'format':
      if (fieldValue && logic.pattern) {
        const regex = new RegExp(logic.pattern)
        if (!regex.test(fieldValue)) {
          return {
            passed: false,
            field: rule.field_name,
            rule: rule.rule_name,
            message: rule.error_message || `${rule.field_name} has invalid format`,
            value: fieldValue
          }
        }
      }
      break
      
    case 'range':
      if (fieldValue && (logic.min !== undefined || logic.max !== undefined)) {
        const numValue = parseFloat(fieldValue)
        if (!isNaN(numValue)) {
          if ((logic.min !== undefined && numValue < logic.min) ||
              (logic.max !== undefined && numValue > logic.max)) {
            return {
              passed: false,
              field: rule.field_name,
              rule: rule.rule_name,
              message: rule.error_message || `${rule.field_name} is out of range`,
              value: fieldValue
            }
          }
        }
      }
      break
  }
  
  return null
}

function countTotalFields(records: any[]): number {
  if (records.length === 0) return 0
  
  const allFields = new Set<string>()
  records.forEach(record => {
    Object.keys(record).forEach(field => allFields.add(field))
  })
  
  return allFields.size * records.length
}

function findMissingFields(records: any[], rules: any[]): string[] {
  const requiredFields = rules
    .filter(r => r.rule_type === 'required_field')
    .map(r => r.field_name)
  
  const missingFields = new Set<string>()
  
  records.forEach(record => {
    requiredFields.forEach(field => {
      if (!record[field] || record[field] === '') {
        missingFields.add(field)
      }
    })
  })
  
  return Array.from(missingFields)
}

async function detectAnomalies(supabase: any, dataSource: string, records: any[]): Promise<any[]> {
  const anomalies = []
  
  // Get historical data for comparison
  const { data: historicalStats } = await supabase
    .from('data_historical_stats')
    .select('*')
    .eq('data_source', dataSource)
    .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  
  // Example: Check for unusual record count
  if (historicalStats && historicalStats.length > 0) {
    const avgRecordCount = historicalStats.reduce((sum: number, stat: any) => sum + (stat.metric_count || 0), 0) / historicalStats.length
    const stdDev = calculateStandardDeviation(historicalStats.map((s: any) => s.metric_count || 0))
    
    if (stdDev > 0) {
      const zScore = Math.abs((records.length - avgRecordCount) / stdDev)
      if (zScore > 3) {
        anomalies.push({
          type: 'record_count',
          severity: 'high',
          message: `Unusual record count: ${records.length} (expected ~${Math.round(avgRecordCount)})`,
          z_score: zScore
        })
      }
    }
  }
  
  return anomalies
}

function calculateAverage(data: any[], field: string): number {
  if (data.length === 0) return 0
  const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0)
  return sum / data.length
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  return Math.sqrt(avgSquaredDiff)
}

function calculateQualityTrends(data: any[]): any {
  if (data.length < 2) return null
  
  const sorted = [...data].sort((a, b) => 
    new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime()
  )
  
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  
  return {
    completeness_trend: last.completeness_score - first.completeness_score,
    validation_trend: last.validation_pass_rate - first.validation_pass_rate,
    days_analyzed: sorted.length
  }
}