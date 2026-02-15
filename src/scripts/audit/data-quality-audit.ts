/**
 * JusticeHub Data Quality Audit
 *
 * Runs comprehensive data quality checks across all tables
 * and outputs a detailed report.
 *
 * Run with: npx tsx src/scripts/audit/data-quality-audit.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

interface AuditResult {
  table: string;
  totalCount: number;
  issues: string[];
  coverage: Record<string, number>;
  sampleMissing?: string[];
}

async function auditTable(
  tableName: string,
  requiredFields: string[],
  groupByField?: string
): Promise<AuditResult> {
  const result: AuditResult = {
    table: tableName,
    totalCount: 0,
    issues: [],
    coverage: {}
  };

  try {
    // Get total count
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    result.totalCount = count || 0;

    // Get all records to check required fields
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000);

    if (error) {
      result.issues.push(`Error fetching data: ${error.message}`);
      return result;
    }

    if (!data || data.length === 0) {
      result.issues.push('No records found');
      return result;
    }

    // Check required fields
    for (const field of requiredFields) {
      const missingCount = data.filter(row => !row[field] || row[field] === '').length;
      if (missingCount > 0) {
        const percentage = ((missingCount / data.length) * 100).toFixed(1);
        result.issues.push(`${field}: ${missingCount} records missing (${percentage}%)`);

        // Sample of records with missing field
        const missingIds = data
          .filter(row => !row[field])
          .slice(0, 3)
          .map(row => row.id || row.slug || 'unknown');
        if (missingIds.length > 0 && !result.sampleMissing) {
          result.sampleMissing = missingIds;
        }
      }
    }

    // Group by field for coverage analysis
    if (groupByField) {
      const { data: groupData } = await supabase
        .from(tableName)
        .select(groupByField);

      if (groupData) {
        groupData.forEach(row => {
          let value = row[groupByField];

          // Handle metadata->state pattern
          if (groupByField === 'metadata' && row.metadata?.state) {
            value = row.metadata.state;
          }

          if (value) {
            result.coverage[value] = (result.coverage[value] || 0) + 1;
          } else {
            result.coverage['(no value)'] = (result.coverage['(no value)'] || 0) + 1;
          }
        });
      }
    }

  } catch (err: any) {
    result.issues.push(`Exception: ${err.message}`);
  }

  return result;
}

async function checkDuplicates(tableName: string, field: string): Promise<string[]> {
  const duplicates: string[] = [];

  try {
    const { data } = await supabase
      .from(tableName)
      .select(field);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(row => {
        const value = row[field]?.toLowerCase?.() || row[field];
        if (value) {
          counts[value] = (counts[value] || 0) + 1;
        }
      });

      Object.entries(counts)
        .filter(([_, count]) => count > 1)
        .forEach(([name, count]) => {
          duplicates.push(`"${name}" appears ${count} times`);
        });
    }
  } catch (err) {
    // Ignore errors
  }

  return duplicates;
}

async function getGeographicCoverage(): Promise<Record<string, { interventions: number; services: number }>> {
  const coverage: Record<string, { interventions: number; services: number }> = {};
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

  // Initialize all states
  states.forEach(state => {
    coverage[state] = { interventions: 0, services: 0 };
  });

  // Count interventions by state (from metadata)
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('metadata');

  interventions?.forEach(row => {
    const state = row.metadata?.state;
    if (state && coverage[state]) {
      coverage[state].interventions++;
    }
  });

  // Count services by state
  const { data: services } = await supabase
    .from('services')
    .select('location_state');

  services?.forEach(row => {
    const state = row.location_state;
    if (state && coverage[state]) {
      coverage[state].services++;
    }
  });

  return coverage;
}

async function runAudit() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         JUSTICEHUB DATA QUALITY AUDIT                      ║');
  console.log('║         ' + new Date().toISOString() + '                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 1. Audit alma_interventions
  console.log('📊 ALMA INTERVENTIONS');
  console.log('─'.repeat(60));
  const interventionsAudit = await auditTable(
    'alma_interventions',
    ['name', 'description', 'type', 'consent_level'],
    'metadata'
  );
  console.log(`Total: ${interventionsAudit.totalCount} programs`);
  if (interventionsAudit.issues.length > 0) {
    console.log('Issues:');
    interventionsAudit.issues.forEach(i => console.log(`  ⚠️  ${i}`));
  } else {
    console.log('  ✅ All required fields present');
  }

  // Check for outcomes data
  const { count: withOutcomes } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .not('outcomes', 'is', null);
  const outcomesRate = interventionsAudit.totalCount > 0
    ? ((withOutcomes || 0) / interventionsAudit.totalCount * 100).toFixed(1)
    : '0';
  console.log(`  📈 With outcomes data: ${withOutcomes || 0} (${outcomesRate}%)`);

  const intDupes = await checkDuplicates('alma_interventions', 'name');
  if (intDupes.length > 0) {
    console.log(`  🔄 Potential duplicates: ${intDupes.length}`);
    intDupes.slice(0, 3).forEach(d => console.log(`     - ${d}`));
  }
  console.log();

  // 2. Audit services
  console.log('🏥 SERVICES');
  console.log('─'.repeat(60));
  const servicesAudit = await auditTable(
    'services',
    ['name', 'description', 'categories'],
    'location_state'
  );
  console.log(`Total: ${servicesAudit.totalCount} services`);
  if (servicesAudit.issues.length > 0) {
    console.log('Issues:');
    servicesAudit.issues.forEach(i => console.log(`  ⚠️  ${i}`));
  } else {
    console.log('  ✅ All required fields present');
  }

  // Verification status
  const { count: verified } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'verified');
  console.log(`  ✓ Verified: ${verified || 0} services`);

  const svcDupes = await checkDuplicates('services', 'name');
  if (svcDupes.length > 0) {
    console.log(`  🔄 Potential duplicates: ${svcDupes.length}`);
  }
  console.log();

  // 3. Audit public_profiles
  console.log('👥 PUBLIC PROFILES');
  console.log('─'.repeat(60));
  const profilesAudit = await auditTable(
    'public_profiles',
    ['full_name', 'slug'],
    'is_public'
  );
  console.log(`Total: ${profilesAudit.totalCount} profiles`);

  const { count: publicProfiles } = await supabase
    .from('public_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true);
  console.log(`  👁️  Public: ${publicProfiles || 0} profiles`);

  const { count: withBio } = await supabase
    .from('public_profiles')
    .select('*', { count: 'exact', head: true })
    .not('bio', 'is', null);
  console.log(`  📝 With bio: ${withBio || 0} profiles`);
  console.log();

  // 4. Audit organizations
  console.log('🏢 ORGANIZATIONS');
  console.log('─'.repeat(60));
  const orgsAudit = await auditTable(
    'organizations',
    ['name', 'slug', 'type'],
    'type'
  );
  console.log(`Total: ${orgsAudit.totalCount} organizations`);
  if (Object.keys(orgsAudit.coverage).length > 0) {
    console.log('  By type:');
    Object.entries(orgsAudit.coverage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });
  }
  console.log();

  // 5. Audit stories
  console.log('📖 STORIES');
  console.log('─'.repeat(60));
  const storiesAudit = await auditTable(
    'stories',
    ['title', 'content'],
    'story_type'
  );
  console.log(`Total: ${storiesAudit.totalCount} stories`);
  if (Object.keys(storiesAudit.coverage).length > 0) {
    console.log('  By type:');
    Object.entries(storiesAudit.coverage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`    - ${type || '(untyped)'}: ${count}`);
      });
  }
  console.log();

  // 6. Geographic Coverage
  console.log('🗺️  GEOGRAPHIC COVERAGE');
  console.log('─'.repeat(60));
  const geoCoverage = await getGeographicCoverage();
  console.log('State      | Interventions | Services');
  console.log('─'.repeat(40));
  Object.entries(geoCoverage)
    .sort((a, b) => (b[1].interventions + b[1].services) - (a[1].interventions + a[1].services))
    .forEach(([state, counts]) => {
      const bar = '█'.repeat(Math.min(20, counts.interventions / 10));
      console.log(`${state.padEnd(10)} | ${String(counts.interventions).padStart(13)} | ${String(counts.services).padStart(8)}`);
    });

  // Identify gaps
  const gaps = Object.entries(geoCoverage)
    .filter(([_, counts]) => counts.interventions === 0 || counts.services === 0)
    .map(([state]) => state);

  if (gaps.length > 0) {
    console.log(`\n  ⚠️  Coverage gaps: ${gaps.join(', ')}`);
  }
  console.log();

  // 7. Summary
  console.log('═'.repeat(60));
  console.log('📋 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`
  Total Programs:      ${interventionsAudit.totalCount}
  Total Services:      ${servicesAudit.totalCount}
  Total Profiles:      ${profilesAudit.totalCount} (${publicProfiles || 0} public)
  Total Organizations: ${orgsAudit.totalCount}
  Total Stories:       ${storiesAudit.totalCount}

  Outcomes Data:       ${outcomesRate}% of programs
  Verified Services:   ${verified || 0}
  Geographic Gaps:     ${gaps.length > 0 ? gaps.join(', ') : 'None'}
  `);

  // 8. Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('─'.repeat(60));

  if (parseInt(outcomesRate) < 50) {
    console.log('  1. Increase outcomes data coverage (currently ' + outcomesRate + '%)');
  }
  if (gaps.length > 0) {
    console.log(`  2. Add programs/services for: ${gaps.join(', ')}`);
  }
  if ((publicProfiles || 0) < 10) {
    console.log('  3. Encourage more profile visibility (only ' + publicProfiles + ' public)');
  }
  if (intDupes.length > 0) {
    console.log(`  4. Review ${intDupes.length} potential duplicate interventions`);
  }

  console.log('\n✅ Audit complete!\n');
}

runAudit().catch(console.error);
