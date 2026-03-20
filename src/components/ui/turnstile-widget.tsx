'use client';

import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile CAPTCHA widget.
 *
 * Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set (dev mode).
 * In production, the widget must be solved before form submission.
 */
export function TurnstileWidget({ onSuccess, onError, theme = 'auto' }: TurnstileWidgetProps) {
  if (!SITE_KEY) {
    // In dev without keys, auto-pass
    if (typeof window !== 'undefined') {
      setTimeout(() => onSuccess('dev-bypass'), 0);
    }
    return null;
  }

  return (
    <Turnstile
      siteKey={SITE_KEY}
      onSuccess={onSuccess}
      onError={onError}
      options={{ theme, size: 'flexible' }}
    />
  );
}
