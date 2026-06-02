'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from 'lucide-react';

export function ProgramCreateForm({
  orgId,
  defaultLocation,
  defaultState,
}: {
  orgId: string;
  defaultLocation: string;
  defaultState: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/org-hub/${orgId}/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.get('name') || ''),
          description: String(formData.get('description') || ''),
          approach: String(formData.get('approach') || ''),
          location: String(formData.get('location') || ''),
          state: String(formData.get('state') || ''),
          participants_served: String(formData.get('participants_served') || ''),
          tags: String(formData.get('tags') || ''),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Could not create program');
      }

      form.reset();
      setMessage('Program created. The profile is refreshing.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create program');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-2 border-black bg-white p-4">
      <div className="flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-eucalyptus-700" />
        <h3 className="text-base font-black">Add a first program or service</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Program name</span>
          <input name="name" required className="w-full border-2 border-black px-3 py-2 text-sm font-bold" placeholder="e.g. Community repair workshops" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Approach</span>
          <input name="approach" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" placeholder="community-led, mentoring, training..." />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-black uppercase tracking-wide text-gray-500">What it does</span>
        <textarea name="description" required rows={3} className="w-full border-2 border-black px-3 py-2 text-sm" placeholder="Describe what the program runs, who it supports, and why it matters." />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Location</span>
          <input name="location" defaultValue={defaultLocation} className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">State</span>
          <input name="state" defaultValue={defaultState} className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">Participants</span>
          <input name="participants_served" inputMode="numeric" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" placeholder="Optional" />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-black uppercase tracking-wide text-gray-500">Tags</span>
        <input name="tags" className="w-full border-2 border-black px-3 py-2 text-sm" placeholder="youth, training, community, enterprise" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="inline-flex min-h-[44px] items-center gap-2 border-2 border-black bg-black px-4 py-2 text-sm font-black text-white disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          Add program
        </button>
        {message && <p className="text-sm font-bold text-eucalyptus-800">{message}</p>}
        {error && <p className="text-sm font-bold text-red-700">{error}</p>}
      </div>
    </form>
  );
}
