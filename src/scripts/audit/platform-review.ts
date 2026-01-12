/**
 * JusticeHub Platform Review Script
 *
 * Comprehensive audit of pages, routes, Supabase connections, and Empathy Ledger integration.
 * Run with: npx tsx src/scripts/audit/platform-review.ts [scope]
 *
 * Scopes: full | pages | api | supabase | empathy-ledger | functions
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Types
interface ReviewResult {
  file: string;
  category: string;
  status: 'pass' | 'warning' | 'fail';
  pattern?: string;
  issues: string[];
  suggestions: string[];
}

interface ReviewReport {
  timestamp: string;
  scope: string;
  summary: {
    total: number;
    passing: number;
    warnings: number;
    failures: number;
  };
  categories: {
    pages: ReviewResult[];
    apiRoutes: ReviewResult[];
    supabaseConnections: ReviewResult[];
    empathyLedger: ReviewResult[];
    functions: ReviewResult[];
  };
}

// Pattern definitions
const PATTERNS = {
  // Correct patterns
  SERVICE_CLIENT: /import\s*{\s*createServiceClient\s*}\s*from\s*['"]@\/lib\/supabase\/service['"]/,
  FORCE_DYNAMIC: /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/,
  USE_CLIENT: /['"]use client['"]/,

  // Problematic patterns
  CLIENT_IN_SERVER: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/client['"]/,
  SERVER_COOKIE: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/server['"]/,

  // Empathy Ledger
  EL_CLIENT: /empathyLedgerClient/,
  EL_PROFILE_ID: /empathy_ledger_profile_id|empathyLedgerProfileId/,
  EL_DATA_COPY: /\.insert\(\s*\{[^}]*name:\s*\w+\.name/,

  // ALMA patterns
  ALMA_SCORE_DISPLAY: /[Ss]core:\s*\{?\s*\w+\.?\w*[Ss]core\s*\}?\s*\/\s*10/,
  ALMA_SIGNAL: /scoreToSignal|impactLevel|ImpactLevel/,
};

// Review functions
async function reviewPage(filePath: string): Promise<ReviewResult> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: ReviewResult = {
    file: filePath,
    category: 'page',
    status: 'pass',
    issues: [],
    suggestions: [],
  };

  const isClientComponent = PATTERNS.USE_CLIENT.test(content);
  const hasServiceClient = PATTERNS.SERVICE_CLIENT.test(content);
  const hasClientClient = PATTERNS.CLIENT_IN_SERVER.test(content);
  const hasServerCookie = PATTERNS.SERVER_COOKIE.test(content);
  const hasForceDynamic = PATTERNS.FORCE_DYNAMIC.test(content);
  const hasSupabaseImport = hasServiceClient || hasClientClient || hasServerCookie;

  // Determine pattern
  if (!hasSupabaseImport) {
    result.pattern = 'STATIC';
  } else if (isClientComponent && hasClientClient) {
    result.pattern = 'CLIENT_INTERACTIVE';
  } else if (hasServiceClient && hasForceDynamic) {
    result.pattern = 'CORRECT_SERVER';
  } else if (hasServiceClient && !hasForceDynamic) {
    result.pattern = 'NEEDS_DYNAMIC_FLAG';
    result.status = 'warning';
    result.issues.push('Missing force-dynamic export for server-side data fetching');
    result.suggestions.push("Add: export const dynamic = 'force-dynamic';");
  } else if (hasClientClient && !isClientComponent) {
    result.pattern = 'NEEDS_FIX_CLIENT_FETCH';
    result.status = 'fail';
    result.issues.push('Using client Supabase in server component');
    result.suggestions.push('Change to createServiceClient from @/lib/supabase/service');
  } else if (hasServerCookie) {
    // Server cookie client is appropriate for pages that need authentication
    const isAdminPage = filePath.includes('/admin/');
    const hasAuthCheck = content.includes('auth.getUser') || content.includes('getSession');

    if (isAdminPage || hasAuthCheck) {
      result.pattern = 'SERVER_COOKIE_AUTH';
      // Admin pages appropriately use cookie-based auth - no warning
    } else {
      result.pattern = 'SERVER_COOKIE_PATTERN';
      result.status = 'warning';
      result.issues.push('Using cookie-based server client without auth check - consider using createServiceClient');
      result.suggestions.push('For public pages, use createServiceClient from @/lib/supabase/service');
    }
  }

  // Check for ALMA score display issues
  if (PATTERNS.ALMA_SCORE_DISPLAY.test(content)) {
    result.issues.push('Displaying numeric score instead of categorical signal');
    result.suggestions.push('Use scoreToSignal() from @/lib/alma/impact-signals');
    if (result.status === 'pass') result.status = 'warning';
  }

  return result;
}

async function reviewApiRoute(filePath: string): Promise<ReviewResult> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: ReviewResult = {
    file: filePath,
    category: 'api',
    status: 'pass',
    issues: [],
    suggestions: [],
  };

  // Check for service client usage
  // Note: Routes that need auth context (auth.getUser, getSession) can use server cookie client
  const needsAuthContext = content.includes('auth.getUser') || content.includes('getSession');

  if (!PATTERNS.SERVICE_CLIENT.test(content) &&
      (PATTERNS.CLIENT_IN_SERVER.test(content) || PATTERNS.SERVER_COOKIE.test(content))) {
    if (!needsAuthContext) {
      result.status = 'warning';
      result.issues.push('API route should use createServiceClient');
      result.suggestions.push('Import createServiceClient from @/lib/supabase/service');
    } else {
      // Route appropriately uses server cookie client for auth
      result.pattern = 'SERVER_COOKIE_AUTH';
    }
  }

  // Check for error handling
  if (!content.includes('try') || !content.includes('catch')) {
    result.status = 'warning';
    result.issues.push('Missing try/catch error handling');
  }

  // Check for input validation
  if (content.includes('request.json()') && !content.includes('validate')) {
    result.issues.push('Consider adding input validation');
  }

  return result;
}

async function reviewSupabaseConnection(filePath: string): Promise<ReviewResult> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: ReviewResult = {
    file: filePath,
    category: 'supabase',
    status: 'pass',
    issues: [],
    suggestions: [],
  };

  // Check which client type is used
  if (PATTERNS.SERVICE_CLIENT.test(content)) {
    result.pattern = 'SERVICE_CLIENT';
  } else if (PATTERNS.CLIENT_IN_SERVER.test(content)) {
    result.pattern = 'BROWSER_CLIENT';
    if (!PATTERNS.USE_CLIENT.test(content)) {
      result.status = 'fail';
      result.issues.push('Browser client used outside client component');
    }
  } else if (PATTERNS.SERVER_COOKIE.test(content)) {
    result.pattern = 'SERVER_COOKIE_CLIENT';
  }

  return result;
}

async function reviewEmpathyLedger(filePath: string): Promise<ReviewResult> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: ReviewResult = {
    file: filePath,
    category: 'empathy-ledger',
    status: 'pass',
    issues: [],
    suggestions: [],
  };

  // Check for EL client usage
  if (PATTERNS.EL_CLIENT.test(content)) {
    result.pattern = 'EL_INTEGRATION';

    // Check for proper link-based pattern
    if (PATTERNS.EL_PROFILE_ID.test(content)) {
      result.suggestions.push('Good: Using link-based profile references');
    }

    // Check for data duplication (anti-pattern)
    if (PATTERNS.EL_DATA_COPY.test(content)) {
      result.status = 'fail';
      result.issues.push('Potential data duplication from Empathy Ledger');
      result.suggestions.push('Use link-based integration instead of copying data');
    }
  }

  return result;
}

async function reviewFunction(filePath: string): Promise<ReviewResult> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: ReviewResult = {
    file: filePath,
    category: 'function',
    status: 'pass',
    issues: [],
    suggestions: [],
  };

  // Check for proper typing
  if (!content.includes(': Promise<') && content.includes('async function')) {
    result.issues.push('Async function missing return type annotation');
  }

  // Check for ALMA signal usage
  if (PATTERNS.ALMA_SCORE_DISPLAY.test(content) && !PATTERNS.ALMA_SIGNAL.test(content)) {
    result.status = 'warning';
    result.issues.push('Using numeric scores instead of ALMA signals');
  }

  return result;
}

// Main review runner
async function runReview(scope: string): Promise<ReviewReport> {
  const report: ReviewReport = {
    timestamp: new Date().toISOString(),
    scope,
    summary: { total: 0, passing: 0, warnings: 0, failures: 0 },
    categories: {
      pages: [],
      apiRoutes: [],
      supabaseConnections: [],
      empathyLedger: [],
      functions: [],
    },
  };

  const srcPath = path.join(process.cwd(), 'src');

  // Review pages
  if (scope === 'full' || scope === 'pages') {
    const pages = await glob('**/page.tsx', { cwd: path.join(srcPath, 'app') });
    for (const page of pages) {
      const result = await reviewPage(path.join(srcPath, 'app', page));
      report.categories.pages.push(result);
    }
  }

  // Review API routes
  if (scope === 'full' || scope === 'api') {
    const routes = await glob('**/route.ts', { cwd: path.join(srcPath, 'app/api') });
    for (const route of routes) {
      const result = await reviewApiRoute(path.join(srcPath, 'app/api', route));
      report.categories.apiRoutes.push(result);
    }
  }

  // Review Supabase connections
  if (scope === 'full' || scope === 'supabase') {
    const files = await glob('**/*.{ts,tsx}', { cwd: srcPath });
    for (const file of files) {
      const content = fs.readFileSync(path.join(srcPath, file), 'utf-8');
      if (content.includes('@/lib/supabase')) {
        const result = await reviewSupabaseConnection(path.join(srcPath, file));
        report.categories.supabaseConnections.push(result);
      }
    }
  }

  // Review Empathy Ledger integration
  if (scope === 'full' || scope === 'empathy-ledger') {
    const files = await glob('**/*.{ts,tsx}', { cwd: srcPath });
    for (const file of files) {
      const content = fs.readFileSync(path.join(srcPath, file), 'utf-8');
      if (content.includes('empathyLedger') || content.includes('empathy_ledger')) {
        const result = await reviewEmpathyLedger(path.join(srcPath, file));
        report.categories.empathyLedger.push(result);
      }
    }
  }

  // Review functions
  if (scope === 'full' || scope === 'functions') {
    const libFiles = await glob('**/*.ts', { cwd: path.join(srcPath, 'lib') });
    for (const file of libFiles) {
      const result = await reviewFunction(path.join(srcPath, 'lib', file));
      report.categories.functions.push(result);
    }
  }

  // Calculate summary
  const allResults = [
    ...report.categories.pages,
    ...report.categories.apiRoutes,
    ...report.categories.supabaseConnections,
    ...report.categories.empathyLedger,
    ...report.categories.functions,
  ];

  report.summary.total = allResults.length;
  report.summary.passing = allResults.filter(r => r.status === 'pass').length;
  report.summary.warnings = allResults.filter(r => r.status === 'warning').length;
  report.summary.failures = allResults.filter(r => r.status === 'fail').length;

  return report;
}

// Report formatter
function formatReport(report: ReviewReport): string {
  let output = `# JusticeHub Platform Review Report

**Generated:** ${report.timestamp}
**Scope:** ${report.scope}

## Summary

| Metric | Count |
|--------|-------|
| Total Files | ${report.summary.total} |
| Passing | ${report.summary.passing} ✅ |
| Warnings | ${report.summary.warnings} ⚠️ |
| Failures | ${report.summary.failures} ❌ |

## Category Breakdown

| Category | Total | Pass | Warn | Fail |
|----------|-------|------|------|------|
| Pages | ${report.categories.pages.length} | ${report.categories.pages.filter(r => r.status === 'pass').length} | ${report.categories.pages.filter(r => r.status === 'warning').length} | ${report.categories.pages.filter(r => r.status === 'fail').length} |
| API Routes | ${report.categories.apiRoutes.length} | ${report.categories.apiRoutes.filter(r => r.status === 'pass').length} | ${report.categories.apiRoutes.filter(r => r.status === 'warning').length} | ${report.categories.apiRoutes.filter(r => r.status === 'fail').length} |
| Supabase | ${report.categories.supabaseConnections.length} | ${report.categories.supabaseConnections.filter(r => r.status === 'pass').length} | ${report.categories.supabaseConnections.filter(r => r.status === 'warning').length} | ${report.categories.supabaseConnections.filter(r => r.status === 'fail').length} |
| Empathy Ledger | ${report.categories.empathyLedger.length} | ${report.categories.empathyLedger.filter(r => r.status === 'pass').length} | ${report.categories.empathyLedger.filter(r => r.status === 'warning').length} | ${report.categories.empathyLedger.filter(r => r.status === 'fail').length} |
| Functions | ${report.categories.functions.length} | ${report.categories.functions.filter(r => r.status === 'pass').length} | ${report.categories.functions.filter(r => r.status === 'warning').length} | ${report.categories.functions.filter(r => r.status === 'fail').length} |

`;

  // Add issues section
  const issues = [
    ...report.categories.pages,
    ...report.categories.apiRoutes,
    ...report.categories.supabaseConnections,
    ...report.categories.empathyLedger,
    ...report.categories.functions,
  ].filter(r => r.status !== 'pass');

  if (issues.length > 0) {
    output += `## Issues Found

`;
    for (const issue of issues) {
      const statusIcon = issue.status === 'fail' ? '❌' : '⚠️';
      output += `### ${statusIcon} ${issue.file}

**Pattern:** ${issue.pattern || 'N/A'}
**Status:** ${issue.status.toUpperCase()}

`;
      if (issue.issues.length > 0) {
        output += `**Issues:**
${issue.issues.map(i => `- ${i}`).join('\n')}

`;
      }
      if (issue.suggestions.length > 0) {
        output += `**Suggestions:**
${issue.suggestions.map(s => `- ${s}`).join('\n')}

`;
      }
    }
  }

  output += `---

*Review completed using JusticeHub Platform Reviewer*
`;

  return output;
}

// CLI entry point
async function main() {
  const scope = process.argv[2] || 'full';
  const validScopes = ['full', 'pages', 'api', 'supabase', 'empathy-ledger', 'functions'];

  if (!validScopes.includes(scope)) {
    console.error(`Invalid scope: ${scope}`);
    console.log(`Valid scopes: ${validScopes.join(', ')}`);
    process.exit(1);
  }

  console.log(`🔍 Running JusticeHub Platform Review (scope: ${scope})...\n`);

  try {
    const report = await runReview(scope);
    const formatted = formatReport(report);

    // Output to console
    console.log(formatted);

    // Save report
    const reportPath = path.join(process.cwd(), 'docs', 'PLATFORM_REVIEW_REPORT.md');
    fs.writeFileSync(reportPath, formatted);
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (report.summary.failures > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Review failed:', error);
    process.exit(1);
  }
}

main();
