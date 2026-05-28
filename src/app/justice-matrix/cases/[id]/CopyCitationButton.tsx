'use client';

import { useState } from 'react';
import { Check, Copy, Link as LinkIcon } from 'lucide-react';

interface Props {
  /** Plain text to copy (e.g. a citation). */
  text?: string;
  /** Relative path; the browser prefixes window.location.origin at click time. */
  path?: string;
  /** Optional button label override. Default is "Copy citation" or "Copy link". */
  label?: string;
}

export function CopyCitationButton({ text, path, label }: Props) {
  const [copied, setCopied] = useState(false);
  const isLink = !!path && !text;
  const buttonLabel = label ?? (isLink ? 'Copy link' : 'Copy citation');

  async function onCopy() {
    const value = path ? `${window.location.origin}${path}` : (text ?? '');
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fall back to a textarea-select pattern if clipboard API is blocked.
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white"
      style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#4a2560' }}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copied
        </>
      ) : isLink ? (
        <>
          <LinkIcon className="w-3.5 h-3.5" />
          {buttonLabel}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {buttonLabel}
        </>
      )}
    </button>
  );
}
