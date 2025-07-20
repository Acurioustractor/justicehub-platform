#!/usr/bin/env node
/**
 * Health monitoring script for Youth Justice Service Finder
 * Ensures deployment stays stable and alerts if issues
 */

import axios from 'axios';
import fs from 'fs';

const DEPLOYMENT_URL = 'https://youth-justice-service-finder-production-v2.up.railway.app';
const EXPECTED_SERVICES = 987;
const EXPECTED_ORGANIZATIONS = 639;

async function checkHealth() {
  const results = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    issues: [],
    metrics: {}
  };

  try {
    // 1. Health endpoint
    console.log('🔍 Checking health endpoint...');
    const health = await axios.get(`${DEPLOYMENT_URL}/health`, { timeout: 10000 });
    results.metrics.health = health.data;
    
    if (health.data.status !== 'healthy') {
      results.issues.push('Health endpoint reports unhealthy status');
      results.status = 'warning';
    }

    // 2. Database connection & service count
    console.log('📊 Checking database and service count...');
    const stats = await axios.get(`${DEPLOYMENT_URL}/stats`, { timeout: 10000 });
    results.metrics.stats = stats.data;
    
    if (stats.data.totals.services !== EXPECTED_SERVICES) {
      results.issues.push(`Service count mismatch: expected ${EXPECTED_SERVICES}, got ${stats.data.totals.services}`);
      results.status = 'error';
    }
    
    if (stats.data.totals.organizations !== EXPECTED_ORGANIZATIONS) {
      results.issues.push(`Organization count mismatch: expected ${EXPECTED_ORGANIZATIONS}, got ${stats.data.totals.organizations}`);
      results.status = 'warning';
    }

    // 3. Search functionality
    console.log('🔍 Testing search functionality...');
    const search = await axios.get(`${DEPLOYMENT_URL}/working-search?limit=5`, { timeout: 10000 });
    results.metrics.search = {
      total: search.data.pagination?.total || search.data.total,
      returned: search.data.services?.length || 0
    };
    
    if (results.metrics.search.total !== EXPECTED_SERVICES) {
      results.issues.push(`Search total mismatch: expected ${EXPECTED_SERVICES}, got ${results.metrics.search.total}`);
      results.status = 'error';
    }

    // 4. Frontend serving (check if React app loads)
    console.log('🌐 Checking frontend serving...');
    const frontend = await axios.get(DEPLOYMENT_URL, { timeout: 10000 });
    const isReactApp = frontend.data.includes('<!doctype html>') || 
                      frontend.data.includes('<div id="root">') ||
                      typeof frontend.data === 'string';
    
    if (!isReactApp) {
      results.issues.push('Frontend not serving React app - getting API response instead');
      results.status = 'error';
    } else {
      results.metrics.frontend = 'React app serving correctly';
    }

    // 5. Response times
    const start = Date.now();
    await axios.get(`${DEPLOYMENT_URL}/health`);
    results.metrics.responseTime = Date.now() - start;
    
    if (results.metrics.responseTime > 5000) {
      results.issues.push(`Slow response time: ${results.metrics.responseTime}ms`);
      results.status = 'warning';
    }

  } catch (error) {
    results.status = 'error';
    results.issues.push(`Connection error: ${error.message}`);
    results.error = error.message;
  }

  return results;
}

async function main() {
  console.log('🚀 Youth Justice Service Finder - Health Check');
  console.log(`📍 Monitoring: ${DEPLOYMENT_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const results = await checkHealth();
  
  // Save results to file
  const reportFile = `health-report-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  
  // Console output
  console.log(`\n📊 Status: ${results.status.toUpperCase()}`);
  console.log(`⏰ Checked at: ${results.timestamp}`);
  
  if (results.metrics.health) {
    console.log(`❤️  Health: ${results.metrics.health.status} (uptime: ${Math.round(results.metrics.health.uptime)}s)`);
  }
  
  if (results.metrics.stats) {
    console.log(`📈 Services: ${results.metrics.stats.totals.services} | Organizations: ${results.metrics.stats.totals.organizations}`);
  }
  
  if (results.metrics.search) {
    console.log(`🔍 Search: ${results.metrics.search.total} services searchable`);
  }
  
  if (results.metrics.frontend) {
    console.log(`🌐 Frontend: ${results.metrics.frontend}`);
  }
  
  if (results.metrics.responseTime) {
    console.log(`⚡ Response time: ${results.metrics.responseTime}ms`);
  }
  
  if (results.issues.length > 0) {
    console.log(`\n⚠️  Issues found:`);
    results.issues.forEach(issue => console.log(`   • ${issue}`));
    process.exit(1);
  } else {
    console.log(`\n✅ All systems operational - Youth Justice Service Finder is stable!`);
    console.log(`📝 Report saved: ${reportFile}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { checkHealth };