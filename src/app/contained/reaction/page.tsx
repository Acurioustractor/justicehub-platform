'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Send, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { TurnstileWidget } from '@/components/ui/turnstile-widget';

const FEELINGS = [
  'Angry',
  'Sad',
  'Hopeful',
  'Motivated',
  'Shocked',
  'Inspired',
  'Overwhelmed',
  'Determined',
];

export default function ReactionPage() {
  const [feelings, setFeelings] = useState<string[]>([]);
  const [response, setResponse] = useState('');
  const [wouldNominate, setWouldNominate] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFeeling(f: string) {
    setFeelings((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (honeypot) return;

    if (feelings.length === 0 && !response) {
      setError('Please share at least one feeling or a written response.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contained/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feelings,
          response,
          would_nominate: wouldNominate,
          name: name || undefined,
          email: email || undefined,
          turnstile_token: turnstileToken,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
        <Navigation />
        <main className="pt-40">
          <section className="py-24">
            <div className="container-justice text-center max-w-lg mx-auto">
              <CheckCircle className="w-16 h-16 text-[#059669] mx-auto mb-6" />
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">
                Thank You
              </h1>
              <p className="text-gray-600 mb-8">
                Your response matters. Every voice adds to the evidence that change is possible
                and necessary.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contained/act"
                  className="inline-flex items-center justify-center gap-2 bg-[#DC2626] text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                >
                  Take Action <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contained#nominate"
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#0A0A0A] px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-colors"
                >
                  Nominate Someone
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="pt-40">
        <section className="py-12 border-b-2 border-[#0A0A0A]">
          <div className="container-justice">
            <Link
              href="/contained"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#0A0A0A] mb-6 py-3"
            >
              <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" /> Back to CONTAINED
            </Link>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">
              What Did You Feel?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              You just walked through THE CONTAINED. We want to know what that was like.
              Your response is anonymous unless you choose to share your name.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container-justice max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Feelings */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                  How do you feel right now? (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-3">
                  {FEELINGS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFeeling(f)}
                      className={`px-5 py-3 text-sm font-bold border-2 transition-colors ${
                        feelings.includes(f)
                          ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                          : 'border-gray-300 hover:border-[#0A0A0A]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Written response */}
              <div>
                <label
                  htmlFor="response"
                  className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                >
                  What stays with you? (Optional)
                </label>
                <textarea
                  id="response"
                  rows={4}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="The thing I can't stop thinking about is..."
                  className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>

              {/* Would nominate */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Is there someone who needs to see this?
                </label>
                <div className="flex gap-3">
                  {['Yes — I want to nominate someone', 'Not right now'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setWouldNominate(option)}
                      className={`px-5 py-3 text-sm font-bold border-2 transition-colors ${
                        wouldNominate === option
                          ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                          : 'border-gray-300 hover:border-[#0A0A0A]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional identity */}
              <div className="border-t-2 border-gray-200 pt-8">
                <p className="text-sm text-gray-500 mb-4">
                  Optional — share your details if you want us to follow up or if your quote can
                  be used publicly (with your permission).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                  />
                </div>
                {/* Honeypot */}
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="absolute -left-[9999px]"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
              </div>

              <TurnstileWidget onSuccess={setTurnstileToken} theme="light" />

              {error && (
                <p className="text-[#DC2626] text-sm font-bold">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !turnstileToken}
                className="w-full flex items-center justify-center gap-2 bg-[#DC2626] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Share Your Response
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
