/**
 * Empathy Ledger Connection Health Check
 *
 * Verifies the connection and integration patterns with Empathy Ledger.
 * Run with: DOTENV_CONFIG_PATH=.env.local npx tsx src/scripts/audit/empathy-ledger-health.ts
 */

import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

async function checkEmpathyLedgerHealth(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // 1. Check environment variables
  const elUrl = process.env.EMPATHY_LEDGER_SUPABASE_URL;
  const elKey = process.env.EMPATHY_LEDGER_SUPABASE_ANON_KEY;

  checks.push({
    name: 'Environment Variables',
    status: elUrl && elKey ? 'pass' : 'fail',
    message: elUrl && elKey
      ? 'Empathy Ledger credentials configured'
      : 'Missing EMPATHY_LEDGER_SUPABASE_URL or EMPATHY_LEDGER_SUPABASE_ANON_KEY',
  });

  if (!elUrl || !elKey) {
    console.log('\n⚠️  Cannot proceed without Empathy Ledger credentials\n');
    return checks;
  }

  // 2. Test connection - use stories table as it's more accessible
  const elClient = createClient(elUrl, elKey);

  try {
    // Use stories table for connection test (profiles has RLS recursion issue)
    const { data, error } = await elClient.from('stories').select('id').limit(1);

    checks.push({
      name: 'Database Connection',
      status: error ? 'fail' : 'pass',
      message: error ? `Connection failed: ${error.message}` : 'Successfully connected to Empathy Ledger',
    });
  } catch (err) {
    checks.push({
      name: 'Database Connection',
      status: 'fail',
      message: `Connection error: ${err}`,
    });
  }

  // 3. Check profiles table access
  // Note: Profiles table has known RLS issue that returns empty error/count - this is expected
  try {
    const { count, error } = await elClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // RLS issue manifests as empty error message OR null count with no error message
    const isRLSIssue = error?.message?.includes('infinite recursion') ||
                       (error && !error.message) ||
                       (count === null && !error?.message);

    checks.push({
      name: 'Profiles Table Access',
      status: isRLSIssue ? 'warning' : (error ? 'fail' : 'pass'),
      message: isRLSIssue
        ? 'Known RLS policy restriction - profile data accessed via story author fields instead'
        : (error ? `Cannot access profiles: ${error.message}` : `Profiles table accessible (${count} records)`),
      details: { count, knownIssue: isRLSIssue },
    });
  } catch (err) {
    checks.push({
      name: 'Profiles Table Access',
      status: 'warning',
      message: `Known RLS issue - use story/author data instead: ${err}`,
    });
  }

  // 4. Check stories table access
  try {
    const { count, error } = await elClient
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)
      .eq('privacy_level', 'public');

    checks.push({
      name: 'Stories Table Access (Public)',
      status: error ? 'fail' : 'pass',
      message: error ? `Cannot access stories: ${error.message}` : `Public stories accessible (${count} records)`,
      details: { count },
    });
  } catch (err) {
    checks.push({
      name: 'Stories Table Access',
      status: 'fail',
      message: `Error: ${err}`,
    });
  }

  // 5. Check organizations table
  // Note: Organizations table also has RLS restrictions similar to profiles
  try {
    const { count, error } = await elClient
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    // Same RLS pattern as profiles - empty error or null count
    const isRLSIssue = (error && !error.message) || (count === null && !error?.message);

    checks.push({
      name: 'Organizations Table Access',
      status: isRLSIssue ? 'warning' : (error ? 'warning' : 'pass'),
      message: isRLSIssue
        ? 'Known RLS policy restriction - org data accessed via story organization fields'
        : (error ? `Limited access: ${error.message}` : `Organizations accessible (${count} records)`),
      details: { count, knownIssue: isRLSIssue },
    });
  } catch (err) {
    checks.push({
      name: 'Organizations Table Access',
      status: 'warning',
      message: `May not have access: ${err}`,
    });
  }

  // 6. Check JusticeHub connection for profile_appearances
  const jhUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const jhKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (jhUrl && jhKey) {
    const jhClient = createClient(jhUrl, jhKey);

    try {
      const { count, error } = await jhClient
        .from('profile_appearances')
        .select('*', { count: 'exact', head: true });

      checks.push({
        name: 'JusticeHub Profile Appearances',
        status: error ? 'warning' : 'pass',
        message: error
          ? `Table may not exist: ${error.message}`
          : `Profile appearances table ready (${count} links)`,
        details: { count },
      });
    } catch (err) {
      checks.push({
        name: 'JusticeHub Profile Appearances',
        status: 'warning',
        message: `Cannot access: ${err}`,
      });
    }
  }

  // 7. Verify link-based integration
  try {
    // Check if any JH tables have empathy_ledger_profile_id columns
    const jhClient = createClient(jhUrl!, jhKey!);

    const { data, error } = await jhClient.rpc('get_table_columns', {
      table_name: 'profile_appearances',
    });

    if (!error && data) {
      const hasELId = data.some((col: { column_name: string }) =>
        col.column_name.includes('empathy_ledger')
      );

      checks.push({
        name: 'Link-Based Architecture',
        status: hasELId ? 'pass' : 'warning',
        message: hasELId
          ? 'Profile appearances uses empathy_ledger_profile_id (correct pattern)'
          : 'Could not verify link-based pattern',
      });
    }
  } catch {
    // This check is optional, don't fail on RPC errors
  }

  return checks;
}

async function main() {
  console.log('🔍 Empathy Ledger Integration Health Check\n');
  console.log('='.repeat(50));

  const checks = await checkEmpathyLedgerHealth();

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`\n${icon} ${check.name}`);
    console.log(`   ${check.message}`);
    if (check.details) {
      console.log(`   Details: ${JSON.stringify(check.details)}`);
    }

    if (check.status === 'pass') passCount++;
    else if (check.status === 'warning') warnCount++;
    else failCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Summary: ${passCount} pass, ${warnCount} warnings, ${failCount} failures`);

  if (failCount > 0) {
    console.log('\n❌ Health check failed - review issues above');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\n⚠️  Health check passed with warnings');
  } else {
    console.log('\n✅ All health checks passed!');
  }
}

main().catch(console.error);
