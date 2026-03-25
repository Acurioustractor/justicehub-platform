'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, MapPin, Heart, Building2, Newspaper, DollarSign, Users } from 'lucide-react';

const INTEREST_ROLES = [
  { key: 'organization', label: 'Organisation', icon: Building2, description: 'Advocacy, legal services, or justice sector' },
  { key: 'media', label: 'Media', icon: Newspaper, description: 'Journalist, filmmaker, podcaster' },
  { key: 'supporter', label: 'Supporter', icon: Heart, description: 'Advocate, volunteer, community member' },
  { key: 'funder', label: 'Funder', icon: DollarSign, description: 'Philanthropist, foundation, government' },
  { key: 'lived_experience', label: 'Lived Experience', icon: Users, description: 'Direct experience of the justice system' },
] as const;

const STATES = ['NSW', 'QLD', 'SA', 'WA', 'NT', 'VIC', 'TAS', 'ACT'];

export default function RegisterInterestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    state: '',
    organization: '',
    message: '',
    newsletter: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.role) {
      setError('Please fill in your name, email, and role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Push to GHL as a lead
      const res = await fetch('/api/ghl/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          member_type: formData.role,
          state: formData.state,
          organization: formData.organization,
          source: 'register-interest',
          newsletter: formData.newsletter,
          tags: ['register-interest', 'contained', `contained_${formData.role}`],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to register');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#059669]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#059669]" />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Interest Registered
          </h1>
          <p className="text-sm text-[#F5F0E8]/60 mb-6">
            Thanks {formData.full_name}. We&apos;ll keep you updated on CONTAINED and how you can get involved.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/contained"
              className="px-4 py-2 border border-[#F5F0E8]/20 text-sm font-bold hover:bg-[#F5F0E8]/5 transition-colors"
            >
              Campaign Page
            </Link>
            <Link
              href="/contained/join"
              className="px-4 py-2 bg-[#DC2626] text-white text-sm font-bold hover:bg-[#DC2626]/90 transition-colors"
            >
              Join as Member
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-[#F5F0E8]/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/contained" className="inline-flex items-center gap-2 text-sm text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            CONTAINED
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Register Your Interest
          </h1>
          <p className="text-sm text-[#F5F0E8]/60">
            Can&apos;t make it to a tour stop? Register here to stay connected with the movement and learn how you can contribute.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role selection */}
          <div>
            <label className="block font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider mb-3">
              I am a... <span className="text-[#DC2626]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INTEREST_ROLES.map((role) => {
                const Icon = role.icon;
                const selected = formData.role === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, role: role.key }))}
                    className={`p-3 border text-left transition-colors ${
                      selected
                        ? 'border-[#DC2626] bg-[#DC2626]/10'
                        : 'border-[#F5F0E8]/10 hover:border-[#F5F0E8]/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${selected ? 'text-[#DC2626]' : 'text-[#F5F0E8]/30'}`} />
                      <span className="font-bold text-sm">{role.label}</span>
                    </div>
                    <p className="text-[10px] text-[#F5F0E8]/40 font-mono mt-1">{role.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider mb-1">
                Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider mb-1">
                Email <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* State + Organisation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider mb-1">
                State
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData(f => ({ ...f, state: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm"
              >
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider mb-1">
                Organisation
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData(f => ({ ...f, organization: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider mb-1">
              How would you like to be involved?
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(f => ({ ...f, message: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm resize-none"
              placeholder="Tell us what interests you about CONTAINED..."
            />
          </div>

          {/* Newsletter opt-in */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.newsletter}
              onChange={(e) => setFormData(f => ({ ...f, newsletter: e.target.checked }))}
              className="w-4 h-4 accent-[#DC2626]"
            />
            <span className="text-sm text-[#F5F0E8]/60">Keep me updated with campaign news</span>
          </label>

          {error && (
            <p className="text-sm text-[#DC2626] font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#DC2626] text-white font-bold text-sm hover:bg-[#DC2626]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Register Interest
          </button>
        </form>
      </div>
    </div>
  );
}
