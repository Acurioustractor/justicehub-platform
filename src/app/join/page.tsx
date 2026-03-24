'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  MapPin,
  Shield,
  Heart,
  Mic,
  TrendingUp,
} from 'lucide-react';

const FOCUS_AREAS = [
  'Youth justice / diversion',
  'Cultural connection / healing',
  'Education / school engagement',
  'Mental health / wellbeing',
  'Family strengthening',
  'Employment / training',
  'Sport / fitness / recreation',
  'Arts / music / creative',
  'Mentoring / leadership',
  'Disability support',
  'Housing / homelessness',
  'Legal support / advocacy',
];

const STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'NT', name: 'Northern Territory' },
  { code: 'ACT', name: 'Australian Capital Territory' },
];

export default function JoinNetworkPage() {
  const [step, setStep] = useState<'info' | 'form' | 'submitted'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    orgName: '',
    abn: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    state: '',
    description: '',
    focusAreas: [] as string[],
    youngPeopleServed: '',
    isIndigenous: false,
  });

  function toggleFocus(area: string) {
    setForm((f) => ({
      ...f,
      focusAreas: f.focusAreas.includes(area)
        ? f.focusAreas.filter((a) => a !== area)
        : [...f.focusAreas, area],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/network/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          youngPeopleServed: form.youngPeopleServed
            ? parseInt(form.youngPeopleServed)
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');

      setResult(data);
      setStep('submitted');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#0A0A0A]/10 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#059669] mx-auto mb-4" />
          <h1
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Welcome to the Network
          </h1>
          <p className="text-[#0A0A0A]/60 mb-2">{result?.message}</p>
          {result?.basecampName && (
            <p className="text-sm text-[#059669] font-medium mb-6">
              {result.basecampName}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href="/basecamps"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white font-semibold rounded-lg text-sm hover:bg-[#0A0A0A]/90"
            >
              See the ALMA Network
            </Link>
            <Link
              href="/"
              className="text-sm text-[#0A0A0A]/50 hover:text-[#0A0A0A]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'info') {
    return (
      <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link
            href="/basecamps"
            className="text-sm text-[#0A0A0A]/50 hover:text-[#0A0A0A] flex items-center gap-1 mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> ALMA Network
          </Link>

          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Join the ALMA Network
          </h1>
          <p className="text-lg text-[#0A0A0A]/60 mb-12 max-w-2xl">
            If your organisation works with young people and believes in
            community-led alternatives to the broken system — you belong here.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
              <TrendingUp className="w-6 h-6 text-[#059669] mb-3" />
              <h3 className="font-bold mb-2">Grant Discovery</h3>
              <p className="text-sm text-[#0A0A0A]/60">
                Get matched to funding opportunities based on your work, your
                location, and your community.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
              <Users className="w-6 h-6 text-[#059669] mb-3" />
              <h3 className="font-bold mb-2">Peer Network</h3>
              <p className="text-sm text-[#0A0A0A]/60">
                Connect with organisations doing the same work across Australia.
                Share models, learn from each other.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
              <Mic className="w-6 h-6 text-[#059669] mb-3" />
              <h3 className="font-bold mb-2">Tell Your Story</h3>
              <p className="text-sm text-[#0A0A0A]/60">
                Voice notes, photos, quick check-ins — we turn your work into
                impact data that speaks for itself.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
              <Shield className="w-6 h-6 text-[#059669] mb-3" />
              <h3 className="font-bold mb-2">Funding Transparency</h3>
              <p className="text-sm text-[#0A0A0A]/60">
                See where the money actually goes. Your data sits alongside the
                big providers — and your outcomes speak louder.
              </p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] text-white rounded-xl p-8 mb-12">
            <h3
              className="text-xl font-bold text-white mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              What you contribute
            </h3>
            <p className="text-white/70 mb-4">
              The network gets stronger with every org that joins. All we ask is:
            </p>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
                Share your story — what you do, who you serve, what works
              </li>
              <li className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
                Check in when you can — a voice note, a photo, a quick update
              </li>
              <li className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
                Be part of the alternative — your work is the evidence that the
                system can change
              </li>
            </ul>
          </div>

          <button
            onClick={() => setStep('form')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] text-white font-semibold rounded-lg text-sm hover:bg-[#0A0A0A]/90 transition-colors"
          >
            Join the Network <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <button
          onClick={() => setStep('info')}
          className="text-sm text-[#0A0A0A]/50 hover:text-[#0A0A0A] flex items-center gap-1 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Tell us about your organisation
        </h1>
        <p className="text-sm text-[#0A0A0A]/60 mb-8">
          Takes about 2 minutes. We&apos;ll match you to your state Basecamp.
        </p>

        {error && (
          <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#DC2626] px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Org details */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Organisation Name *
            </label>
            <input
              type="text"
              required
              value={form.orgName}
              onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
              placeholder="e.g. Youth Futures Aboriginal Corporation"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">ABN</label>
              <input
                type="text"
                value={form.abn}
                onChange={(e) => setForm({ ...form, abn: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Location *
              </label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
                placeholder="e.g. Alice Springs"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              State *
            </label>
            <select
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
            >
              <option value="">Select state...</option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="indigenous"
              checked={form.isIndigenous}
              onChange={(e) =>
                setForm({ ...form, isIndigenous: e.target.checked })
              }
              className="w-4 h-4 rounded border-[#0A0A0A]/30"
            />
            <label htmlFor="indigenous" className="text-sm">
              Aboriginal and/or Torres Strait Islander led organisation
            </label>
          </div>

          {/* Contact */}
          <div className="border-t border-[#0A0A0A]/10 pt-6">
            <h3 className="font-semibold mb-4">Your contact details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) =>
                    setForm({ ...form, contactName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* About the work */}
          <div className="border-t border-[#0A0A0A]/10 pt-6">
            <h3 className="font-semibold mb-4">About your work</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5">
                What does your organisation do? *
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
                placeholder="Tell us about your work with young people..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-3">
                Focus areas (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocus(area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.focusAreas.includes(area)
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                        : 'bg-white text-[#0A0A0A]/60 border-[#0A0A0A]/15 hover:border-[#0A0A0A]/40'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">
                How many young people do you work with?
              </label>
              <input
                type="number"
                value={form.youngPeopleServed}
                onChange={(e) =>
                  setForm({ ...form, youngPeopleServed: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-[#0A0A0A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
                placeholder="Approximate number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3.5 bg-[#0A0A0A] text-white font-semibold rounded-lg text-sm hover:bg-[#0A0A0A]/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Join the ALMA Network'}
          </button>

          <p
            className="text-xs text-[#0A0A0A]/40 text-center"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Free forever. Your data stays yours. Open source.
          </p>
        </form>
      </div>
    </div>
  );
}
