import { spawn } from 'node:child_process';

const AUTO_GATE_PORT = String(process.env.FUNDING_SMOKE_AUTO_PORT || '3012').trim();
const AUTO_GATE_BASE_URL = `http://127.0.0.1:${AUTO_GATE_PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasReachableBaseUrl(baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);

  try {
    const response = await fetch(`${baseUrl}/contact`, {
      redirect: 'manual',
      headers: { accept: 'text/html' },
      signal: controller.signal,
    });

    if (response.status < 200 || response.status >= 400) {
      return false;
    }

    const html = await response.text();
    return (
      html.includes('JusticeHub') ||
      html.includes('Get In Touch') ||
      html.includes('Contact')
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForExplicitApp(baseUrl, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await hasReachableBaseUrl(baseUrl)) {
      return;
    }
    await sleep(1000);
  }

  throw new Error(`Local JusticeHub app did not become reachable on ${baseUrl} in time`);
}

async function run() {
  let devProcess = null;
  let startedDev = true;
  const smokeBaseUrlOverride = AUTO_GATE_BASE_URL;

  devProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: AUTO_GATE_PORT,
    },
    stdio: 'ignore',
  });

  await waitForExplicitApp(AUTO_GATE_BASE_URL, 30000);

  try {
    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'check:funding'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          ...(smokeBaseUrlOverride
            ? { FUNDING_SMOKE_BASE_URL: smokeBaseUrlOverride }
            : {}),
        },
        stdio: 'inherit',
      });

      child.on('error', reject);
      child.on('exit', (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } finally {
    if (startedDev && devProcess && !devProcess.killed) {
      devProcess.kill('SIGTERM');
    }
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
