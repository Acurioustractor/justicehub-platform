import dotenv from 'dotenv';
import { getFundingSmokeBaseUrl } from './lib/get-funding-smoke-base-url.mjs';

dotenv.config({ path: '.env.local' });

const smokeSecret = String(process.env.FUNDING_SMOKE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!smokeSecret) {
  console.error('Missing FUNDING_SMOKE_SECRET or SUPABASE_SERVICE_ROLE_KEY for local admin smoke auth');
  process.exit(1);
}

function fail(message) {
  throw new Error(message);
}

async function run() {
  const baseUrl = await getFundingSmokeBaseUrl();
  console.log(`Using base URL: ${baseUrl}`);

  const sessionResponse = await fetch(`${baseUrl}/api/dev/funding-smoke/admin-session`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-funding-smoke-secret': smokeSecret,
    },
  });

  const sessionPayload = await sessionResponse.json().catch(() => null);
  if (sessionResponse.status !== 200 || sessionPayload?.success !== true) {
    throw new Error(
      sessionPayload?.error ||
        `Admin session route failed with HTTP ${sessionResponse.status}`
    );
  }

  const setCookieHeader = sessionResponse.headers.get('set-cookie');
  const cookieHeader = String(setCookieHeader || '').split(';')[0].trim();
  if (!cookieHeader) {
    fail('Admin session route did not return a session cookie');
  }

  const pageResponse = await fetch(`${baseUrl}/admin/funding/os`, {
    method: 'GET',
    headers: {
      accept: 'text/html',
      cookie: cookieHeader,
    },
    redirect: 'manual',
  });

  const pageHtml = await pageResponse.text();
  if (pageResponse.status !== 200) {
    fail(`Expected admin page 200, found ${pageResponse.status}`);
  }

  if (!pageHtml.includes('Funding OS') && !pageHtml.includes('Run Bootstrap')) {
    fail('Admin funding page shell did not contain expected Funding OS markers');
  }

  const apiResponse = await fetch(
    `${baseUrl}/api/admin/funding/os/conversations?limit=2&status=all`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        cookie: cookieHeader,
      },
    }
  );

  const apiPayload = await apiResponse.json().catch(() => null);
  if (apiResponse.status !== 200 || !Array.isArray(apiPayload?.data)) {
    throw new Error(
      apiPayload?.error ||
        `Admin conversations API failed with HTTP ${apiResponse.status}`
    );
  }

  console.log('[PASS] funding admin auth smoke');
  console.log(
    JSON.stringify(
      {
        adminPageStatus: pageResponse.status,
        conversationsCount: apiPayload.data.length,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
