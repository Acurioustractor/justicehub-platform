import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const REQUESTED_BASE_URL = (process.env.FRONTEND_SMOKE_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '');
const OUTPUT_ROOT = process.env.FRONTEND_SMOKE_OUTPUT_DIR || path.join(process.cwd(), 'artifacts', 'frontend-smoke');
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
const BASE_URL_CANDIDATES = [
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:3004',
  'http://127.0.0.1:3005',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
];

const DEFAULT_ROUTE_SET = [
  '/',
  '/services',
  '/community-programs',
  '/community-map',
  '/intelligence',
  '/intelligence/overview',
  '/intelligence/dashboard',
  '/intelligence/map',
  '/intelligence/status',
  '/intelligence/research',
  '/centre-of-excellence',
  '/for-community-leaders',
  '/for-funders',
];

function parseRouteOverrides() {
  const raw = process.env.FRONTEND_SMOKE_ROUTES;
  if (!raw) return null;
  const parsed = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith('/') ? value : `/${value}`));
  return parsed.length > 0 ? parsed : null;
}

const FATAL_MARKERS = [
  'application error',
  'internal server error',
  'unhandled runtime error',
  'something went wrong',
];

function sanitizeRoute(route) {
  if (route === '/') return 'home';
  return route.replace(/^\//, '').replace(/[^a-zA-Z0-9-_/]/g, '-').replace(/\//g, '__');
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function canReachBaseUrl(baseUrl) {
  const status = await getStatus(`${baseUrl}/`);
  return status > 0;
}

async function getStatus(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
      headers: { accept: '*/*' },
    });
    return typeof res.status === 'number' ? res.status : 0;
  } catch {
    return 0;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveBaseUrl() {
  if (REQUESTED_BASE_URL) {
    const ok = await canReachBaseUrl(REQUESTED_BASE_URL);
    if (ok) {
      return REQUESTED_BASE_URL;
    }
    console.warn(
      `Configured base URL is unreachable: ${REQUESTED_BASE_URL}. ` +
      'Falling back to auto-discovery.'
    );
  }

  for (const candidate of BASE_URL_CANDIDATES) {
    // Prefer hosts that look like JusticeHub by checking core route availability.
    // eslint-disable-next-line no-await-in-loop
    const rootStatus = await getStatus(`${candidate}/`);
    if (rootStatus === 0) continue;
    // eslint-disable-next-line no-await-in-loop
    const servicesStatus = await getStatus(`${candidate}/services`);
    if (servicesStatus >= 200 && servicesStatus < 400) {
      return candidate;
    }
  }

  // Fallback: any reachable candidate root.
  for (const candidate of BASE_URL_CANDIDATES) {
    // eslint-disable-next-line no-await-in-loop
    if (await canReachBaseUrl(candidate)) return candidate;
  }

  throw new Error(
    'No reachable local app URL found. Start Next.js dev server and/or set FRONTEND_SMOKE_BASE_URL.'
  );
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverDynamicRoutes(baseUrl) {
  const discovered = [];

  const services = await fetchJson(`${baseUrl}/api/services?limit=1`);
  const serviceId = services?.data?.[0]?.id;
  if (typeof serviceId === 'string' && serviceId.length > 0) {
    discovered.push(`/services/${serviceId}`);
  }

  const programs = await fetchJson(`${baseUrl}/api/programs?limit=1`);
  const programId = programs?.programs?.[0]?.id;
  if (typeof programId === 'string' && programId.length > 0) {
    discovered.push(`/community-programs/${programId}`);
  }

  return discovered;
}

function buildRouteList(dynamicRoutes) {
  const overrideRoutes = parseRouteOverrides();
  const seen = new Set();
  const baseRoutes = overrideRoutes || DEFAULT_ROUTE_SET;
  const all = [...baseRoutes, ...dynamicRoutes];
  const ordered = [];
  for (const route of all) {
    if (!route || seen.has(route)) continue;
    seen.add(route);
    ordered.push(route);
  }
  return ordered;
}

async function checkRoute(context, runDir, viewportName, route, baseUrl) {
  const page = await context.newPage();
  const url = `${baseUrl}${route}`;
  const consoleErrors = [];
  const pageErrors = [];
  const startedAt = Date.now();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });

  let status = 0;
  const reasons = [];

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = response?.status() || 0;

    if (status >= 400 || status === 0) {
      reasons.push(`HTTP status ${status}`);
    }

    await page.waitForTimeout(1000);

    const bodyText = (await page.textContent('body')) || '';
    const lowered = bodyText.toLowerCase();
    const matchedFatalMarkers = FATAL_MARKERS.filter((marker) => lowered.includes(marker));
    if (matchedFatalMarkers.length > 0) {
      reasons.push(`Fatal marker(s): ${matchedFatalMarkers.join(', ')}`);
    }
  } catch (error) {
    reasons.push(error instanceof Error ? error.message : String(error));
  }

  if (pageErrors.length > 0) {
    reasons.push(`Page errors: ${pageErrors.length}`);
  }

  const screenshotFile = `${viewportName}-${sanitizeRoute(route)}.png`;
  const screenshotPath = path.join(runDir, screenshotFile);

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    reasons.push(`Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const durationMs = Date.now() - startedAt;
  await page.close();

  return {
    route,
    url,
    viewport: viewportName,
    status,
    durationMs,
    pass: reasons.length === 0,
    reasons,
    consoleErrors,
    pageErrors,
    screenshotFile,
  };
}

function toMarkdown(results, runDir, baseUrl) {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const lines = [
    '# Frontend Smoke Report',
    '',
    `- Base URL: ${baseUrl}`,
    `- Run Dir: ${runDir}`,
    `- Total checks: ${results.length}`,
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    '',
    '| Viewport | Route | Status | Result | Notes | Screenshot |',
    '|---|---|---:|---|---|---|',
  ];

  for (const result of results) {
    const notes = result.reasons.length > 0 ? result.reasons.join('; ').replace(/\|/g, '/') : 'ok';
    const verdict = result.pass ? 'PASS' : 'FAIL';
    lines.push(`| ${result.viewport} | ${result.route} | ${result.status} | ${verdict} | ${notes} | ${result.screenshotFile} |`);
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const baseUrl = await resolveBaseUrl();
  console.log(`Using base URL: ${baseUrl}`);

  const runDir = path.join(OUTPUT_ROOT, nowStamp());
  await ensureDir(runDir);

  const dynamicRoutes = await discoverDynamicRoutes(baseUrl);
  const routes = buildRouteList(dynamicRoutes);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ viewport });
      try {
        for (const route of routes) {
          const result = await checkRoute(context, runDir, viewportName, route, baseUrl);
          results.push(result);
          const prefix = result.pass ? 'PASS' : 'FAIL';
          console.log(`[${prefix}] ${viewportName} ${route} (${result.status})`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const report = {
    baseUrl,
    runDir,
    generatedAt: new Date().toISOString(),
    routes,
    dynamicRoutes,
    routeOverride: parseRouteOverrides(),
    totals: {
      checks: results.length,
      passed: results.filter((r) => r.pass).length,
      failed: results.filter((r) => !r.pass).length,
    },
    results,
  };

  await fs.writeFile(path.join(runDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(path.join(runDir, 'report.md'), toMarkdown(results, runDir, baseUrl), 'utf8');

  if (report.totals.failed > 0) {
    console.error(`Frontend smoke check failed: ${report.totals.failed}/${report.totals.checks} checks failed.`);
    console.error(`See ${path.join(runDir, 'report.md')}`);
    process.exit(1);
  }

  console.log(`Frontend smoke check passed: ${report.totals.passed}/${report.totals.checks} checks.`);
  console.log(`Reports written to ${runDir}`);
}

main().catch((error) => {
  console.error('Frontend smoke check crashed:', error);
  process.exit(1);
});
