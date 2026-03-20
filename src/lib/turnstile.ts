/**
 * Server-side Cloudflare Turnstile token verification.
 *
 * Env vars:
 *   TURNSTILE_SECRET_KEY — Cloudflare dashboard → Turnstile → site → secret key
 *
 * In development (no secret key set), verification is skipped.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification in development when no key is configured
  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}
