'use client';

import { useState, useEffect } from 'react';

interface EnrollmentCode {
  id: string;
  code: string;
  event_name: string | null;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminEnrollmentPage() {
  const [codes, setCodes] = useState<EnrollmentCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [eventName, setEventName] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [newCodeResult, setNewCodeResult] = useState<{ code: string; enrollUrl: string; qrUrl: string } | null>(null);

  async function fetchCodes() {
    try {
      const res = await fetch('/api/admin/enrollment/codes');
      if (!res.ok) return;
      const data = await res.json();
      setCodes(data.codes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCodes(); }, []);

  async function createCode() {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/enrollment/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName || undefined,
          max_uses: parseInt(maxUses) || 100,
        }),
      });
      const data = await res.json();
      if (data.code) {
        setNewCodeResult({
          code: data.code.code,
          enrollUrl: data.enrollUrl,
          qrUrl: data.qrUrl,
        });
        setEventName('');
        fetchCodes();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Device Enrollment</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate QR codes for Contained installation visitors
        </p>
      </div>

      {/* Generate Code */}
      <div className="border rounded-lg p-6 space-y-4 bg-white">
        <h2 className="font-semibold text-lg">Generate New Code</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Event Name (optional)</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Launch Night Brisbane"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Max Uses</label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
        <button
          onClick={createCode}
          disabled={creating}
          className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Generate Code'}
        </button>

        {newCodeResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-widest">{newCodeResult.code}</span>
              <button
                onClick={() => navigator.clipboard.writeText(newCodeResult.enrollUrl)}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
              >
                Copy URL
              </button>
            </div>
            <p className="text-sm text-gray-600 break-all">{newCodeResult.enrollUrl}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={newCodeResult.qrUrl} alt="QR Code" className="w-48 h-48" />
          </div>
        )}
      </div>

      {/* Codes List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Event</th>
              <th className="text-left px-4 py-3 font-medium">Uses</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">QR</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No codes generated yet</td></tr>
            ) : codes.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3 text-gray-600">{c.event_name || '—'}</td>
                <td className="px-4 py-3">
                  {c.current_uses} / {c.max_uses}
                </td>
                <td className="px-4 py-3">
                  {c.is_active ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${baseUrl}/contained/enroll?code=${c.code}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View QR
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
