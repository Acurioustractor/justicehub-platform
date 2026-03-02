const BASE_URL_CANDIDATES = [];
const PROBE_TIMEOUT_MS = 500;
const PROBE_ATTEMPTS = 1;

for (let port = 3000; port <= 3012; port += 1) {
  BASE_URL_CANDIDATES.push(`http://127.0.0.1:${port}`);
}

for (let port = 3000; port <= 3012; port += 1) {
  BASE_URL_CANDIDATES.push(`http://localhost:${port}`);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function isJusticeHubApp(baseUrl) {
  for (let attempt = 0; attempt < PROBE_ATTEMPTS; attempt += 1) {
    try {
      const pageResponse = await fetchWithTimeout(`${baseUrl}/contact`, {
        redirect: 'manual',
        headers: { accept: 'text/html' },
      });

      if (pageResponse.status >= 200 && pageResponse.status < 400) {
        const html = await pageResponse.text();
        if (
          html.includes('JusticeHub') ||
          html.includes('Get In Touch') ||
          html.includes('Contact')
        ) {
          return true;
        }
      }
    } catch {
      // Retry.
    }

    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/funding/accountability?limit=1`, {
        redirect: 'manual',
        headers: { accept: 'application/json' },
      });

      if (response.status >= 200 && response.status < 400) {
        const body = await response.text();
        try {
          const payload = JSON.parse(body);
          if (payload && typeof payload === 'object') {
            return true;
          }
        } catch {
          // Retry.
        }
      }
    } catch {
      // Retry.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

export async function getFundingSmokeBaseUrl() {
  const explicitBaseUrl = String(process.env.FUNDING_SMOKE_BASE_URL || '').trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  for (const baseUrl of BASE_URL_CANDIDATES) {
    if (await isJusticeHubApp(baseUrl)) {
      return baseUrl;
    }
  }

  throw new Error('No reachable local JusticeHub app URL found. Start Next.js dev server first.');
}
