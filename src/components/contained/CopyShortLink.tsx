'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyShortLink({
  label,
  url,
  dark = false,
}: {
  label: string;
  url: string;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    }
  };

  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText()) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }
      }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition-colors"
      style={{
        borderColor: dark ? 'rgba(255,255,255,0.22)' : '#ded8cf',
        background: copied ? '#059669' : dark ? 'rgba(255,255,255,0.08)' : '#ffffff',
        color: copied ? '#ffffff' : dark ? '#f5f0e8' : '#171717',
      }}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : label}
    </button>
  );
}
