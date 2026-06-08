'use client';

import { useEffect } from 'react';
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
  useEffect(() => {
    if (!SITE_KEY) {
      onSuccess('dev-bypass');
    }
  }, [onSuccess]);

  if (!SITE_KEY) {
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
