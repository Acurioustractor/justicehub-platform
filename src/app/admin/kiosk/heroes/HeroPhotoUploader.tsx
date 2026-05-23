'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * File picker + upload trigger for a single org. Calls
 * POST /api/admin/kiosk/hero-photo with multipart form-data and refreshes
 * the page so the new image appears.
 */

export function HeroPhotoUploader({ slug, hasExisting }: { slug: string; hasExisting: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg(null);
    const form = new FormData();
    form.append('file', file);
    form.append('slug', slug);
    try {
      const res = await fetch('/api/admin/kiosk/hero-photo', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || 'Upload failed.');
        return;
      }
      setStatus('ok');
      setFile(null);
      router.refresh();
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error.');
    }
  }

  async function clear() {
    if (!confirm(`Remove the hero photo for "${slug}"?`)) return;
    setStatus('uploading');
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/kiosk/hero-photo?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || 'Could not clear photo.');
        return;
      }
      setStatus('ok');
      router.refresh();
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error.');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={status === 'uploading'}
        className="text-sm"
      />
      <button
        type="button"
        onClick={upload}
        disabled={!file || status === 'uploading'}
        className="px-4 py-2 bg-stone-900 text-white text-xs font-mono uppercase tracking-widest rounded hover:bg-stone-800 disabled:bg-stone-300"
      >
        {status === 'uploading' ? 'Uploading…' : 'Upload'}
      </button>
      {hasExisting && (
        <button
          type="button"
          onClick={clear}
          disabled={status === 'uploading'}
          className="px-4 py-2 border border-rose-300 text-rose-700 text-xs font-mono uppercase tracking-widest rounded hover:bg-rose-50"
        >
          Remove
        </button>
      )}
      {status === 'ok' && <span className="text-xs font-mono uppercase tracking-widest text-emerald-700">Saved</span>}
      {status === 'error' && errorMsg && <span className="text-xs text-rose-700">{errorMsg}</span>}
    </div>
  );
}
