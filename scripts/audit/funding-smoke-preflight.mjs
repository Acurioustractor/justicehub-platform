import dotenv from 'dotenv';
import { getFundingSmokeBaseUrl } from './lib/get-funding-smoke-base-url.mjs';

dotenv.config({ path: '.env.local' });

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

async function run() {
  const missingEnv = requiredEnv.filter((key) => !String(process.env[key] || '').trim());

  if (missingEnv.length) {
    throw new Error(`Missing required env: ${missingEnv.join(', ')}`);
  }

  const baseUrl = await getFundingSmokeBaseUrl();

  const response = await fetch(`${baseUrl}/api/funding/accountability?limit=1`, {
    headers: {
      accept: 'application/json',
    },
  });

  const body = await response.text();

  if (response.status !== 200) {
    throw new Error(`Funding preflight API failed with HTTP ${response.status}`);
  }

  try {
    JSON.parse(body);
  } catch {
    throw new Error('Funding preflight API did not return JSON');
  }

  console.log(
    JSON.stringify(
      {
        baseUrl,
        env: 'ok',
        fundingApi: 'ok',
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
