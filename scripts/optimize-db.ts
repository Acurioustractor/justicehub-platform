#!/usr/bin/env tsx

/**
 * Database optimization script
 * Run with: npm run db:optimize
 */

import { config } from 'dotenv';
import { installPerformanceIndexes, analyzeDatabase, getDatabaseStats } from '../src/lib/db-utils';

// Load environment variables
config({ path: '.env.local' });

async function optimizeDatabase() {
  console.log('🚀 Starting database optimization...\n');

  try {
    // Step 1: Install performance indexes
    console.log('📊 Installing performance indexes...');
    await installPerformanceIndexes();
    console.log('✅ Performance indexes installed\n');

    // Step 2: Analyze tables for query planning
    console.log('🔍 Analyzing database statistics...');
    await analyzeDatabase();
    console.log('✅ Database analysis complete\n');

    // Step 3: Get performance statistics
    console.log('📈 Gathering performance statistics...');
    const stats = await getDatabaseStats();
    
    if (stats) {
      console.log('📊 Database Performance Report:');
      console.log('================================');
      
      // Table statistics
      if (stats.tableStats && stats.tableStats.length > 0) {
        console.log('\n📋 Table Statistics:');
        stats.tableStats.forEach((stat: any) => {
          console.log(`  ${stat.tablename}.${stat.attname}: ${stat.n_distinct} distinct values (correlation: ${stat.correlation})`);
        });
      }
      
      // Index usage
      if (stats.indexStats && stats.indexStats.length > 0) {
        console.log('\n🗂️  Top Index Usage:');
        stats.indexStats.slice(0, 10).forEach((stat: any, index: number) => {
          console.log(`  ${index + 1}. ${stat.indexname}: ${stat.idx_tup_read} reads, ${stat.idx_tup_fetch} fetches`);
        });
      }
      
      // Slow queries
      if (stats.slowQueries && stats.slowQueries.length > 0) {
        console.log('\n🐌 Slowest Queries:');
        stats.slowQueries.slice(0, 5).forEach((query: any, index: number) => {
          const avgTime = (query.mean_time || 0).toFixed(2);
          console.log(`  ${index + 1}. ${avgTime}ms avg - ${query.calls} calls`);
          console.log(`     ${(query.query || '').substring(0, 100)}...`);
        });
      }
    }

    console.log('\n✅ Database optimization complete!');
    console.log('\n💡 Recommendations:');
    console.log('   - Monitor slow queries and add indexes as needed');
    console.log('   - Run VACUUM ANALYZE periodically on high-write tables');
    console.log('   - Consider partitioning large tables (stories, logs)');
    console.log('   - Set up connection pooling for better concurrency');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  }
}

// Run optimization if script is called directly
if (require.main === module) {
  (async () => {
    try {
      await optimizeDatabase();
      console.log('\n🎉 All done!');
      process.exit(0);
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  })();
}

export { optimizeDatabase };