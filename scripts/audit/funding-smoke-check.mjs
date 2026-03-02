import { getFundingSmokeBaseUrl } from './lib/get-funding-smoke-base-url.mjs';

const EXPECT_SEEDED = process.env.FUNDING_SMOKE_EXPECT_SEEDED === 'true';

const PAGE_CHECKS = [
  {
    path: '/funding/accountability',
    markers: [
      'Community Accountability',
      'Award Accountability Ledger',
      'Search an organization',
    ],
  },
  {
    path: '/funding/discovery',
    markers: [
      'Funder Discovery',
      'Refresh Discovery',
      'Min Readiness',
    ],
  },
  {
    path: '/funding/discovery/shortlist',
    markers: [
      'Funder Shortlist',
      'Refresh Shortlist',
      'Shortlisted',
    ],
  },
  {
    path: '/contact',
    markers: [
      'Send Us a Message',
      'Your Name *',
      'Send Message',
    ],
  },
];

function formatResult(ok, label, detail = '') {
  const status = ok ? 'PASS' : 'FAIL';
  return `[${status}] ${label}${detail ? ` - ${detail}` : ''}`;
}

async function fetchText(url, init) {
  const res = await fetch(url, init);
  return {
    status: res.status,
    body: await res.text(),
    headers: res.headers,
  };
}

async function run() {
    const baseUrl = await getFundingSmokeBaseUrl();
  console.log(`Using base URL: ${baseUrl}`);

  let failures = 0;

  for (const page of PAGE_CHECKS) {
    try {
      const { status, body } = await fetchText(`${baseUrl}${page.path}`, {
        headers: { accept: 'text/html' },
      });
      const missing = page.markers.filter((marker) => !body.includes(marker));
      const ok = status === 200 && missing.length === 0;
      if (!ok) failures += 1;
      console.log(
        formatResult(
          ok,
          `page ${page.path}`,
          status === 200
            ? missing.length === 0
              ? 'markers found'
              : `missing markers: ${missing.join(', ')}`
            : `HTTP ${status}`
        )
      );
    } catch (error) {
      failures += 1;
      console.log(
        formatResult(false, `page ${page.path}`, error instanceof Error ? error.message : String(error))
      );
    }
  }

  try {
    const accountability = await fetchText(`${baseUrl}/api/funding/accountability?limit=3`, {
      headers: { accept: 'application/json' },
    });
    const parsed = JSON.parse(accountability.body);
    const hasArray = parsed?.success === true && Array.isArray(parsed?.data);
    const hasSeededData = !EXPECT_SEEDED || Number(parsed?.count || 0) > 0;
    const ok = accountability.status === 200 && hasArray && hasSeededData;
    if (!ok) failures += 1;
    console.log(
      formatResult(
        ok,
        'api /api/funding/accountability',
        accountability.status === 200
          ? `count=${parsed?.count ?? 'n/a'}${EXPECT_SEEDED ? ' (seeded expected)' : ''}`
          : `HTTP ${accountability.status}`
      )
    );
  } catch (error) {
    failures += 1;
    console.log(
      formatResult(
        false,
        'api /api/funding/accountability',
        error instanceof Error ? error.message : String(error)
      )
    );
  }

  try {
    const discovery = await fetchText(`${baseUrl}/api/funding/discovery?limit=3`, {
      headers: { accept: 'application/json' },
    });
    const parsed = JSON.parse(discovery.body);
    const hasArray = parsed?.success === true && Array.isArray(parsed?.data);
    const hasSeededData = !EXPECT_SEEDED || Number(parsed?.count || 0) > 0;
    const hasTopMatch =
      !EXPECT_SEEDED ||
      parsed.data.some(
        (item) => Array.isArray(item?.topMatches) && item.topMatches.length > 0
      );
    const ok = discovery.status === 200 && hasArray && hasSeededData && hasTopMatch;
    if (!ok) failures += 1;
    console.log(
      formatResult(
        ok,
        'api /api/funding/discovery',
        discovery.status === 200
          ? `count=${parsed?.count ?? 'n/a'}${EXPECT_SEEDED ? ', top match expected' : ''}`
          : `HTTP ${discovery.status}`
      )
    );
  } catch (error) {
    failures += 1;
    console.log(
      formatResult(
        false,
        'api /api/funding/discovery',
        error instanceof Error ? error.message : String(error)
      )
    );
  }

  try {
    const contribute = await fetchText(
      `${baseUrl}/api/funding/accountability/commitments/00000000-0000-0000-0000-000000000000/contribute`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'update',
          narrative: 'Funding smoke check invalid commitment probe',
        }),
      }
    );
    const ok =
      contribute.status === 400 && contribute.body.includes('Outcome commitment not found');
    if (!ok) failures += 1;
    console.log(
      formatResult(
        ok,
        'api invalid contribution handling',
        ok ? '400 Outcome commitment not found' : `HTTP ${contribute.status}`
      )
    );
  } catch (error) {
    failures += 1;
    console.log(
      formatResult(
        false,
        'api invalid contribution handling',
        error instanceof Error ? error.message : String(error)
      )
    );
  }

  for (const path of [
    '/api/admin/funding/os/public-submissions?limit=5',
    '/api/admin/funding/os/conversations?limit=5&status=all',
  ]) {
    try {
      const adminRes = await fetchText(`${baseUrl}${path}`, {
        headers: { accept: 'application/json' },
      });
      const ok =
        adminRes.status === 401 && adminRes.body.includes('Not authenticated');
      if (!ok) failures += 1;
      console.log(
        formatResult(
          ok,
          `admin auth boundary ${path}`,
          ok ? '401 Not authenticated' : `HTTP ${adminRes.status}`
        )
      );
    } catch (error) {
      failures += 1;
      console.log(
        formatResult(
          false,
          `admin auth boundary ${path}`,
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }

  if (failures > 0) {
    console.error(`Funding smoke check failed: ${failures} check(s) failed.`);
    process.exit(1);
  }

  console.log('Funding smoke check passed.');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
