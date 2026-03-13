'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function BasecampApplyPage() {
  const [form, setForm] = useState({
    orgName: '',
    abn: '',
    contactName: '',
    contactEmail: '',
    location: '',
    state: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/basecamps/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Application failed');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 flex items-center justify-center page-content">
        <div className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-3">Application Received</h1>
          <p className="text-earth-600 mb-6">
            We'll review your application and get back to you within a few business days.
            Basecamps get full access to JusticeHub — free, forever.
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-earth-800">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 page-content">
      <div className="container-justice py-12 max-w-2xl">
        <Link href="/" className="text-sm font-bold text-earth-600 hover:text-black flex items-center gap-1 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-black mb-3">Become a Basecamp</h1>
        <p className="text-earth-600 text-lg mb-8">
          Basecamps are community organisations doing the work on the ground.
          You get full access to every JusticeHub feature — free, forever.
          Revenue from paid subscribers flows back to basecamps.
        </p>

        {error && (
          <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 mb-6 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <div>
            <label className="block font-bold mb-2">Organisation Name *</label>
            <input
              type="text"
              required
              value={form.orgName}
              onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
              placeholder="e.g. BG Fit Youth Programs"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">ABN</label>
            <input
              type="text"
              value={form.abn}
              onChange={(e) => setForm({ ...form, abn: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
              placeholder="11 digit ABN (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2">Contact Name *</label>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
              />
            </div>
            <div>
              <label className="block font-bold mb-2">Contact Email *</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2">Location *</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                placeholder="e.g. Mount Isa"
              />
            </div>
            <div>
              <label className="block font-bold mb-2">State *</label>
              <select
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600 bg-white"
              >
                <option value="">Select...</option>
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="WA">WA</option>
                <option value="SA">SA</option>
                <option value="TAS">TAS</option>
                <option value="NT">NT</option>
                <option value="ACT">ACT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-2">Tell us about your work *</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
              placeholder="What does your organisation do? Why do you want to be a JusticeHub basecamp?"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
