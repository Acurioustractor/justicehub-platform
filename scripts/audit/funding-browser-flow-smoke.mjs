import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { getFundingSmokeBaseUrl } from './lib/get-funding-smoke-base-url.mjs';

dotenv.config({ path: '.env.local' });

const SEEDED_WORKSPACE_ORGANIZATION_ID = '11111111-1111-1111-1111-111111111004';

const smokeSecret = String(process.env.FUNDING_SMOKE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!smokeSecret) {
  console.error('Missing FUNDING_SMOKE_SECRET or SUPABASE_SERVICE_ROLE_KEY for funding browser smoke');
  process.exit(1);
}

function fail(message) {
  throw new Error(message);
}

function isRetriableNavigationError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('ERR_NETWORK_IO_SUSPENDED') ||
    message.includes('ERR_ABORTED') ||
    message.includes('Navigation failed because page was closed')
  );
}

async function gotoWithRetry(page, url, options = {}, attempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await page.goto(url, options);
      return;
    } catch (error) {
      lastError = error;

      if (!isRetriableNavigationError(error) || attempt === attempts) {
        throw error;
      }

      await page.waitForTimeout(1000 * attempt);
    }
  }

  throw lastError;
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
      sessionPayload?.error || `Admin session route failed with HTTP ${sessionResponse.status}`
    );
  }

  const setCookieHeader = sessionResponse.headers.get('set-cookie');
  const cookiePair = String(setCookieHeader || '').split(';')[0].trim();
  if (!cookiePair || !cookiePair.includes('=')) {
    fail('Admin session route did not return a usable session cookie');
  }

  const [cookieName, ...cookieValueParts] = cookiePair.split('=');
  const cookieValue = cookieValueParts.join('=');
  const base = new URL(baseUrl);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: cookieName,
        value: cookieValue,
        domain: base.hostname,
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);

    const page = await context.newPage();

    await gotoWithRetry(page, `${baseUrl}/funding/discovery`, { waitUntil: 'domcontentloaded' });
    const publicMarker = page.locator('text=Shortlist').first();
    await publicMarker.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const publicMarkerVisible = await publicMarker.isVisible().catch(() => false);
    if (!publicMarkerVisible) {
      fail('Public funding discovery page did not render the expected Shortlist marker');
    }

    await gotoWithRetry(page, `${baseUrl}/admin/funding/os`, { waitUntil: 'domcontentloaded' });
    const adminMarkerLocator = page.locator('text=Funding OS').first();
    await adminMarkerLocator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const adminMarker = await adminMarkerLocator.isVisible().catch(() => false);

    if (!adminMarker) {
      const bootstrapMarkerLocator = page.locator('text=Run Bootstrap').first();
      await bootstrapMarkerLocator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
      const bootstrapMarker = await bootstrapMarkerLocator.isVisible().catch(() => false);

      if (!bootstrapMarker) {
        fail('Admin Funding OS page did not render expected markers');
      }
    }

    await gotoWithRetry(page, `${baseUrl}/admin/funding/os/conversations?reply=relationship`, {
      waitUntil: 'domcontentloaded',
    });
    const queueMarkerLocator = page.locator('text=Conversation Requests').first();
    await queueMarkerLocator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const queueMarker = await queueMarkerLocator.isVisible().catch(() => false);
    if (!queueMarker) {
      fail('Admin conversations page did not render expected Conversation Requests marker');
    }

    await gotoWithRetry(page, `${baseUrl}/admin/funding/os/public-submissions?focus=contact-outreach`, {
      waitUntil: 'domcontentloaded',
    });
    const publicEvidenceMarkerLocator = page.locator('text=Public Evidence Review').first();
    await publicEvidenceMarkerLocator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const publicEvidenceMarker = await publicEvidenceMarkerLocator.isVisible().catch(() => false);
    if (!publicEvidenceMarker) {
      fail('Public evidence review page did not render expected Public Evidence Review marker');
    }

    await gotoWithRetry(page, `${baseUrl}/funding/workspace/${SEEDED_WORKSPACE_ORGANIZATION_ID}`, {
      waitUntil: 'domcontentloaded',
    });
    const workspaceMarker = await page
      .waitForFunction(() =>
        Boolean(document.body.textContent?.includes('Submission Readiness Checklist'))
      )
      .then(() => true)
      .catch(() => false);
    if (!workspaceMarker) {
      fail('Organization funding workspace page did not render expected Submission Readiness Checklist marker');
    }

    const supportEditorVisible = await page
      .waitForFunction(() =>
        Boolean(document.body.textContent?.includes('Working Business Support Note'))
      )
      .then(() => true)
      .catch(() => false);
    if (!supportEditorVisible) {
      fail('Organization funding workspace page did not render the business support editor');
    }

    const sharedContextField = page.getByPlaceholder(
      'Capture the current business context, grant framing, and shared working note.'
    );

    await page.waitForFunction(() => {
      const field = Array.from(document.querySelectorAll('textarea')).find((item) =>
        item.getAttribute('placeholder')?.includes('Capture the current business context')
      );
      return Boolean(field && !field.hasAttribute('disabled'));
    });

    await sharedContextField.fill('Browser smoke business support context for BG Fit.');
    const saveBusinessSupportButton = page.getByRole('button', { name: 'Save Business Support' });
    await page.waitForFunction(() => {
      const button = Array.from(document.querySelectorAll('button')).find((item) =>
        item.textContent?.includes('Save Business Support')
      );
      return Boolean(button && !button.hasAttribute('disabled'));
    });
    const businessSupportResponse = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/funding/workspace/business-support') &&
          response.request().method() === 'POST',
        { timeout: 20000 }
      ),
      saveBusinessSupportButton.click(),
    ]).then(([response]) => response);

    if (!businessSupportResponse.ok()) {
      fail(
        `Organization funding workspace page did not complete a successful business support save (HTTP ${businessSupportResponse.status()})`
      );
    }

    const draftLink = page.locator('text=Start Best-Match Draft').first();
    await draftLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const draftLinkVisible = await draftLink.isVisible().catch(() => false);
    if (!draftLinkVisible) {
      fail('Organization funding workspace page did not render expected Start Best-Match Draft action');
    }

    await draftLink.click();
    const draftMarkerLocator = page.locator('text=Application Draft Workspace').first();
    await draftMarkerLocator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const draftMarker = await draftMarkerLocator.isVisible().catch(() => false);
    if (!draftMarker) {
      fail('Application draft workspace page did not render expected Application Draft Workspace marker');
    }

    const narrativeDraftField = page.locator('textarea').first();
    await narrativeDraftField.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    const narrativeDraftVisible = await narrativeDraftField.isVisible().catch(() => false);
    if (!narrativeDraftVisible) {
      fail('Application draft workspace page did not render a writable narrative draft field');
    }

    await narrativeDraftField.fill('Browser smoke draft narrative for funding workspace validation.');
    const saveDraftButton = page.getByRole('button', { name: 'Save Draft' });
    await page.waitForFunction(() => {
      const button = Array.from(document.querySelectorAll('button')).find((item) =>
        item.textContent?.includes('Save Draft')
      );
      return Boolean(button && !button.hasAttribute('disabled'));
    });
    const saveResponse = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/funding/workspace/application-drafts') &&
          response.request().method() === 'POST',
        { timeout: 15000 }
      ),
      saveDraftButton.click(),
    ]).then(([response]) => response);

    if (!saveResponse.ok()) {
      fail(
        `Application draft workspace page did not complete a successful draft save (HTTP ${saveResponse.status()})`
      );
    }

    console.log('[PASS] funding browser flow smoke');
    console.log(
      JSON.stringify(
        {
          publicPath: '/funding/discovery',
          adminPath: '/admin/funding/os',
          queuePath: '/admin/funding/os/conversations?reply=relationship',
          publicEvidencePath: '/admin/funding/os/public-submissions?focus=contact-outreach',
          workspacePath: `/funding/workspace/${SEEDED_WORKSPACE_ORGANIZATION_ID}`,
          draftWorkspacePath: 'navigated from workspace via Start Best-Match Draft',
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
