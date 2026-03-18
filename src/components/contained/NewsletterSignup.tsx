'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface NewsletterSignupProps {
  source?: string;
  tags?: string[];
}

export function NewsletterSignup({
  source = 'contained_launch',
  tags = ['CONTAINED_LAUNCH', 'NEWSLETTER'],
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch('/api/ghl/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name, source, tags }),
      });
      setSubmitted(true);
    } catch {
      /* silent */
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-900 border border-emerald-700 rounded-lg p-6 text-center">
        <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="font-bold text-lg text-white">You&apos;re in.</p>
        <p className="text-gray-300 text-sm">
          Watch your inbox. Share this page to recruit others.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
    >
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-3 text-sm text-black bg-white border-2 border-gray-600 flex-1 min-w-0"
      />
      <input
        type="email"
        placeholder="Your email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-3 text-sm text-black bg-white border-2 border-gray-600 flex-1 min-w-0"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 text-sm font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors shrink-0 disabled:opacity-50"
      >
        {loading ? 'Joining...' : 'Join'}
      </button>
    </form>
  );
}
