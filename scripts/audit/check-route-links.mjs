import { promises as fs } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const APP_ROOT = path.join(PROJECT_ROOT, 'src', 'app');
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');
const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');
const LEGACY_REDIRECTS_FILE = path.join(PROJECT_ROOT, 'config', 'legacy-route-redirects.json');

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return [fullPath];
  }));
  return nested.flat();
}

function toRouteFromPageFile(absolutePath) {
  const relative = absolutePath.replace(APP_ROOT, '').replace(/\\/g, '/');
  const route = relative.replace(/\/page\.(tsx|mdx)$/, '') || '/';
  return route;
}

function splitRoute(route) {
  if (route === '/') return [];
  return route.replace(/^\//, '').split('/').filter(Boolean);
}

function isDynamicSegment(segment) {
  return /^\[.+\]$/.test(segment) || /^\[\.\.\..+\]$/.test(segment);
}

function matchesDynamicRoute(pathname, dynamicRoute) {
  const pathSegments = splitRoute(pathname);
  const routeSegments = splitRoute(dynamicRoute);

  let i = 0;
  let j = 0;

  while (i < routeSegments.length && j < pathSegments.length) {
    const routeSegment = routeSegments[i];

    // Catch-all segment (e.g. [...slug])
    if (/^\[\.\.\..+\]$/.test(routeSegment)) {
      return true;
    }

    if (isDynamicSegment(routeSegment)) {
      i += 1;
      j += 1;
      continue;
    }

    if (routeSegment !== pathSegments[j]) {
      return false;
    }

    i += 1;
    j += 1;
  }

  return i === routeSegments.length && j === pathSegments.length;
}

function normalizePath(raw) {
  const noHash = raw.split('#')[0] || '/';
  const noQuery = noHash.split('?')[0] || '/';
  const stripped = noQuery.replace(/\/$/, '') || '/';
  return stripped;
}

async function loadLegacyRedirectSources() {
  try {
    const raw = await fs.readFile(LEGACY_REDIRECTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((entry) => normalizePath(entry.source)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function isLikelyStaticHref(value) {
  if (!value.startsWith('/')) return false;
  if (value.startsWith('/api/')) return false;
  if (value.startsWith('/_next/')) return false;
  if (value.startsWith('/#')) return false;
  if (value.includes('${')) return false;
  return true;
}

async function main() {
  const appFiles = await walkFiles(APP_ROOT);
  const pageFiles = appFiles.filter((file) => /\/page\.(tsx|mdx)$/.test(file));

  const routes = pageFiles.map(toRouteFromPageFile);
  const exactRoutes = new Set(routes.filter((route) => !route.includes('[')).map(normalizePath));
  const dynamicRoutes = routes.filter((route) => route.includes('[')).map(normalizePath);

  const publicFiles = await (async () => {
    try {
      const files = await walkFiles(PUBLIC_ROOT);
      return new Set(files.map((file) => '/' + path.relative(PUBLIC_ROOT, file).replace(/\\/g, '/')));
    } catch {
      return new Set();
    }
  })();

  const legacyRedirectSources = await loadLegacyRedirectSources();

  const srcFiles = (await walkFiles(SRC_ROOT)).filter((file) => /\.(ts|tsx|mdx)$/.test(file));

  const missing = [];
  const checked = [];

  for (const file of srcFiles) {
    const content = await fs.readFile(file, 'utf8');

    // JSX/static href attributes.
    const hrefAttributeRegex = /href\s*=\s*["']([^"']+)["']/g;
    for (const match of content.matchAll(hrefAttributeRegex)) {
      const hrefValue = match[1];
      if (!isLikelyStaticHref(hrefValue)) continue;

      const pathname = normalizePath(hrefValue);
      checked.push({ file, href: hrefValue, pathname });

      const isExact = exactRoutes.has(pathname);
      const isDynamic = dynamicRoutes.some((route) => matchesDynamicRoute(pathname, route));
      const isPublicAsset = publicFiles.has(pathname);
      const isLegacyRedirect = legacyRedirectSources.has(pathname);

      if (!isExact && !isDynamic && !isPublicAsset && !isLegacyRedirect) {
        missing.push({ file, href: hrefValue, pathname });
      }
    }

    // Object literal href values (e.g. nav config arrays) without template expressions.
    const hrefObjectRegex = /href\s*:\s*["']([^"']+)["']/g;
    for (const match of content.matchAll(hrefObjectRegex)) {
      const hrefValue = match[1];
      if (!isLikelyStaticHref(hrefValue)) continue;

      const pathname = normalizePath(hrefValue);
      checked.push({ file, href: hrefValue, pathname });

      const isExact = exactRoutes.has(pathname);
      const isDynamic = dynamicRoutes.some((route) => matchesDynamicRoute(pathname, route));
      const isPublicAsset = publicFiles.has(pathname);
      const isLegacyRedirect = legacyRedirectSources.has(pathname);

      if (!isExact && !isDynamic && !isPublicAsset && !isLegacyRedirect) {
        missing.push({ file, href: hrefValue, pathname });
      }
    }
  }

  const dedupedMissing = Array.from(
    new Map(missing.map((item) => [`${item.pathname}::${item.file}`, item])).values()
  );

  if (dedupedMissing.length === 0) {
    console.log(`Route link check passed. Checked ${checked.length} href references.`);
    return;
  }

  const grouped = dedupedMissing.reduce((acc, item) => {
    const key = item.pathname;
    if (!acc[key]) {
      acc[key] = { pathname: item.pathname, count: 0, files: new Set() };
    }
    acc[key].count += 1;
    acc[key].files.add(path.relative(PROJECT_ROOT, item.file).replace(/\\/g, '/'));
    return acc;
  }, {});

  const rows = Object.values(grouped)
    .sort((a, b) => b.count - a.count || a.pathname.localeCompare(b.pathname));

  console.error('Route link check failed. Missing static internal paths:\n');
  for (const row of rows) {
    const files = Array.from(row.files).slice(0, 5).join(', ');
    console.error(`- ${row.pathname} (${row.count}) -> ${files}`);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error('Route link check crashed:', error);
  process.exit(1);
});
