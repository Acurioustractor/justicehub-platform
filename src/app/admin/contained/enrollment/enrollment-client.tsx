'use client';

import { useState, FormEvent } from 'react';

interface CodeRow {
  id: string;
  code: string;
  project_slug: string;
  event_name: string | null;
  tour_stop_slug: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  initialCodes: CodeRow[];
  totalSessions: number;
}

export function EnrollmentAdminClient({ initialCodes, totalSessions }: Props) {
  const [codes, setCodes] = useState<CodeRow[]>(initialCodes);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totalUses = codes.reduce((s, c) => s + c.current_uses, 0);
  const activeCount = codes.filter((c) => c.is_active).length;

  async function refresh() {
    const res = await fetch('/api/admin/contained/enrollment-codes');
    if (res.ok) {
      const json = await res.json();
      setCodes(json.codes ?? []);
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      code: String(fd.get('code') ?? '').trim().toUpperCase(),
      event_name: String(fd.get('event_name') ?? '').trim() || null,
      tour_stop_slug: String(fd.get('tour_stop_slug') ?? '').trim() || null,
      max_uses: fd.get('max_uses') ? Number(fd.get('max_uses')) : null,
      notes: String(fd.get('notes') ?? '').trim() || null,
    };
    const res = await fetch('/api/admin/contained/enrollment-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? 'Failed to create');
    } else {
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      await refresh();
    }
    setBusy(false);
  }

  async function toggleActive(c: CodeRow) {
    setBusy(true);
    await fetch(`/api/admin/contained/enrollment-codes/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Active codes" value={activeCount.toString()} />
        <Stat label="Total uses" value={totalUses.toLocaleString()} />
        <Stat label="Device sessions" value={totalSessions.toLocaleString()} />
      </div>

      {/* New code button + form */}
      <div className="mb-6">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800"
          >
            + Mint new code
          </button>
        ) : (
          <form onSubmit={handleCreate} className="border-2 border-black p-6 bg-gray-50 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Code (e.g. CONT-NEWSTOP)" name="code" required uppercase />
              <Field label="Event name" name="event_name" placeholder="Adelaide · Tandanya" />
              <Field label="Tour stop slug" name="tour_stop_slug" placeholder="contained-adelaide-tandanya" />
              <Field label="Max uses (blank = unlimited)" name="max_uses" type="number" />
            </div>
            <Field label="Notes" name="notes" textarea />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="px-6 py-3 bg-red-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50">
                {busy ? 'Creating...' : 'Create code'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border-2 border-black text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Codes table */}
      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3 uppercase tracking-wider text-xs">Code</th>
              <th className="text-left p-3 uppercase tracking-wider text-xs">Event</th>
              <th className="text-left p-3 uppercase tracking-wider text-xs">Stop</th>
              <th className="text-right p-3 uppercase tracking-wider text-xs">Uses</th>
              <th className="text-center p-3 uppercase tracking-wider text-xs">Active</th>
              <th className="text-right p-3 uppercase tracking-wider text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-mono font-bold">{c.code}</td>
                <td className="p-3 text-gray-700">{c.event_name ?? '—'}</td>
                <td className="p-3 font-mono text-xs text-gray-500">{c.tour_stop_slug ?? '—'}</td>
                <td className="p-3 text-right font-mono">
                  {c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : ''}
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${c.is_active ? 'bg-green-600' : 'bg-gray-400'}`} />
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => toggleActive(c)}
                    disabled={busy}
                    className="text-xs uppercase tracking-widest font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {c.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No codes yet. Mint the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Visitors enter codes at <span className="font-mono">/contained/enroll</span> or via QR (<span className="font-mono">?code=CONT-XXXX</span>).
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black p-4">
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}

function Field({
  label, name, required, placeholder, type = 'text', textarea, uppercase,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  uppercase?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest font-bold mb-1">{label}</span>
      {textarea ? (
        <textarea name={name} rows={2} className="w-full border-2 border-black p-2 font-mono text-sm" placeholder={placeholder} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={`w-full border-2 border-black p-2 font-mono text-sm ${uppercase ? 'uppercase' : ''}`}
        />
      )}
    </label>
  );
}
