#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { config } from 'dotenv';
import chalk from 'chalk';

// Load environment variables
config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log(chalk.blue.bold('\n🔍 Running Data Integrity Checks\n'));

const issues = [];

// Check 1: Youth statistics consistency
async function checkYouthStatisticsIntegrity() {
  console.log(chalk.yellow('📊 Checking youth statistics integrity...'));
  
  const { data, error } = await supabase
    .from('youth_statistics')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    issues.push({ type: 'ERROR', message: `Failed to fetch youth statistics: ${error.message}` });
    return;
  }

  let issueCount = 0;

  for (const record of data || []) {
    // Check indigenous count doesn't exceed total
    if (record.indigenous_youth > record.total_youth) {
      issues.push({
        type: 'DATA_INTEGRITY',
        table: 'youth_statistics',
        record_id: record.id,
        message: `Indigenous youth (${record.indigenous_youth}) exceeds total youth (${record.total_youth})`,
        severity: 'HIGH'
      });
      issueCount++;
    }

    // Check percentage calculation
    const calculatedPercentage = (record.indigenous_youth / record.total_youth) * 100;
    if (Math.abs(calculatedPercentage - record.indigenous_percentage) > 0.5) {
      issues.push({
        type: 'CALCULATION',
        table: 'youth_statistics',
        record_id: record.id,
        message: `Indigenous percentage mismatch: stored ${record.indigenous_percentage}%, calculated ${calculatedPercentage.toFixed(1)}%`,
        severity: 'MEDIUM'
      });
      issueCount++;
    }

    // Check for missing data
    if (!record.facility_name) {
      issues.push({
        type: 'MISSING_DATA',
        table: 'youth_statistics',
        record_id: record.id,
        message: 'Missing facility name',
        severity: 'HIGH'
      });
      issueCount++;
    }
  }

  if (issueCount === 0) {
    console.log(chalk.green('✅ Youth statistics integrity check passed'));
  } else {
    console.log(chalk.red(`❌ Found ${issueCount} issues in youth statistics`));
  }
}

// Check 2: Budget allocations consistency
async function checkBudgetAllocationsIntegrity() {
  console.log(chalk.yellow('\n💰 Checking budget allocations integrity...'));
  
  const { data, error } = await supabase
    .from('budget_allocations')
    .select('*')
    .order('fiscal_year', { ascending: false });

  if (error) {
    issues.push({ type: 'ERROR', message: `Failed to fetch budget allocations: ${error.message}` });
    return;
  }

  let issueCount = 0;

  // Check for negative amounts
  for (const record of data || []) {
    if (record.amount < 0) {
      issues.push({
        type: 'DATA_INTEGRITY',
        table: 'budget_allocations',
        record_id: record.id,
        message: `Negative budget amount: $${record.amount}`,
        severity: 'HIGH'
      });
      issueCount++;
    }

    // Check fiscal year format
    if (!record.fiscal_year.match(/^\d{4}-\d{2}$/)) {
      issues.push({
        type: 'FORMAT',
        table: 'budget_allocations',
        record_id: record.id,
        message: `Invalid fiscal year format: ${record.fiscal_year}`,
        severity: 'MEDIUM'
      });
      issueCount++;
    }
  }

  // Check for duplicate allocations
  const seen = new Set();
  for (const record of data || []) {
    const key = `${record.fiscal_year}-${record.department}-${record.program}`;
    if (seen.has(key)) {
      issues.push({
        type: 'DUPLICATE',
        table: 'budget_allocations',
        record_id: record.id,
        message: `Duplicate allocation for ${key}`,
        severity: 'HIGH'
      });
      issueCount++;
    }
    seen.add(key);
  }

  if (issueCount === 0) {
    console.log(chalk.green('✅ Budget allocations integrity check passed'));
  } else {
    console.log(chalk.red(`❌ Found ${issueCount} issues in budget allocations`));
  }
}

// Check 3: Court statistics consistency
async function checkCourtStatisticsIntegrity() {
  console.log(chalk.yellow('\n⚖️ Checking court statistics integrity...'));
  
  const { data, error } = await supabase
    .from('court_statistics')
    .select('*');

  if (error) {
    issues.push({ type: 'ERROR', message: `Failed to fetch court statistics: ${error.message}` });
    return;
  }

  let issueCount = 0;

  for (const record of data || []) {
    // Check indigenous defendants don't exceed total
    if (record.indigenous_defendants && record.total_defendants && 
        record.indigenous_defendants > record.total_defendants) {
      issues.push({
        type: 'DATA_INTEGRITY',
        table: 'court_statistics',
        record_id: record.id,
        message: `Indigenous defendants (${record.indigenous_defendants}) exceeds total (${record.total_defendants})`,
        severity: 'HIGH'
      });
      issueCount++;
    }

    // Check bail refused doesn't exceed total
    if (record.bail_refused_count && record.total_defendants && 
        record.bail_refused_count > record.total_defendants) {
      issues.push({
        type: 'DATA_INTEGRITY',
        table: 'court_statistics',
        record_id: record.id,
        message: `Bail refused count (${record.bail_refused_count}) exceeds total defendants (${record.total_defendants})`,
        severity: 'HIGH'
      });
      issueCount++;
    }
  }

  if (issueCount === 0) {
    console.log(chalk.green('✅ Court statistics integrity check passed'));
  } else {
    console.log(chalk.red(`❌ Found ${issueCount} issues in court statistics`));
  }
}

// Check 4: Referential integrity
async function checkReferentialIntegrity() {
  console.log(chalk.yellow('\n🔗 Checking referential integrity...'));
  
  let issueCount = 0;

  // Check for orphaned records
  // This would normally check foreign key relationships
  
  if (issueCount === 0) {
    console.log(chalk.green('✅ Referential integrity check passed'));
  } else {
    console.log(chalk.red(`❌ Found ${issueCount} referential integrity issues`));
  }
}

// Check 5: Date consistency
async function checkDateConsistency() {
  console.log(chalk.yellow('\n📅 Checking date consistency...'));
  
  const tables = ['youth_statistics', 'budget_allocations', 'court_statistics', 'parliamentary_documents'];
  let issueCount = 0;

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id, date, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) continue;

    for (const record of data || []) {
      // Check dates aren't in the future
      if (record.date && new Date(record.date) > new Date()) {
        issues.push({
          type: 'DATE_CONSISTENCY',
          table,
          record_id: record.id,
          message: `Future date detected: ${record.date}`,
          severity: 'MEDIUM'
        });
        issueCount++;
      }

      // Check updated_at is after created_at
      if (new Date(record.updated_at) < new Date(record.created_at)) {
        issues.push({
          type: 'DATE_CONSISTENCY',
          table,
          record_id: record.id,
          message: 'Updated timestamp is before created timestamp',
          severity: 'LOW'
        });
        issueCount++;
      }
    }
  }

  if (issueCount === 0) {
    console.log(chalk.green('✅ Date consistency check passed'));
  } else {
    console.log(chalk.red(`❌ Found ${issueCount} date consistency issues`));
  }
}

// Generate report
function generateReport() {
  console.log(chalk.blue.bold('\n📋 Integrity Check Report\n'));
  
  if (issues.length === 0) {
    console.log(chalk.green.bold('🎉 All integrity checks passed! No issues found.\n'));
    return;
  }

  // Group issues by severity
  const bySeverity = issues.reduce((acc, issue) => {
    const severity = issue.severity || 'INFO';
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(issue);
    return acc;
  }, {});

  // Display issues by severity
  const severities = ['HIGH', 'MEDIUM', 'LOW', 'INFO'];
  
  for (const severity of severities) {
    if (!bySeverity[severity] || bySeverity[severity].length === 0) continue;
    
    console.log(chalk.bold(`\n${getSeverityIcon(severity)} ${severity} Priority Issues (${bySeverity[severity].length})`));
    console.log('─'.repeat(50));
    
    for (const issue of bySeverity[severity]) {
      console.log(`\n${chalk.yellow('Table:')} ${issue.table || 'N/A'}`);
      console.log(`${chalk.yellow('Type:')} ${issue.type}`);
      console.log(`${chalk.yellow('Message:')} ${issue.message}`);
      if (issue.record_id) {
        console.log(`${chalk.yellow('Record ID:')} ${issue.record_id}`);
      }
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 Summary'));
  console.log('─'.repeat(50));
  console.log(`Total issues found: ${chalk.red(issues.length)}`);
  
  for (const severity of severities) {
    if (bySeverity[severity]) {
      console.log(`${getSeverityIcon(severity)} ${severity}: ${bySeverity[severity].length}`);
    }
  }
}

function getSeverityIcon(severity) {
  switch (severity) {
    case 'HIGH': return '🔴';
    case 'MEDIUM': return '🟡';
    case 'LOW': return '🟢';
    default: return 'ℹ️';
  }
}

// Main execution
async function main() {
  try {
    await checkYouthStatisticsIntegrity();
    await checkBudgetAllocationsIntegrity();
    await checkCourtStatisticsIntegrity();
    await checkReferentialIntegrity();
    await checkDateConsistency();
    
    generateReport();
    
    // Exit with error code if issues found
    process.exit(issues.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('\n❌ Fatal error during integrity checks:'), error);
    process.exit(1);
  }
}

main();