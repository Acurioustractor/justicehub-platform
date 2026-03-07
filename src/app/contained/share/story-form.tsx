'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Check, PenLine, Share2 } from 'lucide-react';

const TOUR_STOPS = [
  'Mount Druitt',
  'Adelaide',
  'Perth',
  'Tennant Creek',
];

const SITE_URL = 'https://justicehub.org.au';

export function StoryForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    tour_stop: '',
    story: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/projects/the-contained/tour-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = form.story.length;

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <div className="max-w-3xl">
              <Link
                href="/contained"
                className="text-sm font-bold uppercase tracking-widest text-red-400 hover:text-red-300 mb-4 inline-block"
              >
                ← Back to CONTAINED
              </Link>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                Share Your Story
              </h1>
              <p className="text-xl text-gray-300">
                Attended a CONTAINED tour stop? Your experience matters.
                Share what you felt, what you learned, and what you think should change.
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-12">
          <div className="container-justice">
            <div className="max-w-2xl">
              {submitted ? (
                <div className="border-2 border-emerald-600 bg-emerald-50 p-8 text-center">
                  <Check className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-black mb-2">Thank you</h2>
                  <p className="text-gray-700 mb-6">
                    Your story has been submitted for review. Once approved, it will appear
                    on the CONTAINED page to help build the case for change.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `I just shared my experience with THE CONTAINED — an immersive tour showing what youth detention is really like. Share yours: ${SITE_URL}/contained/share #CONTAINED #YouthJustice`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-900 transition-colors flex items-center gap-2"
                    >
                      <Share2 className="w-3 h-3" /> Share on X
                    </a>
                    <Link
                      href="/contained"
                      className="px-4 py-2 text-sm font-bold uppercase tracking-widest border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      Back to Tour
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="border-2 border-red-600 bg-red-50 p-4 text-sm text-red-800 font-bold">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="How you'd like to be credited"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest mb-2">
                      Email <span className="font-normal text-gray-500">(optional — for follow-up only)</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest mb-2">
                      Tour Stop *
                    </label>
                    <select
                      required
                      value={form.tour_stop}
                      onChange={(e) => setForm({ ...form, tour_stop: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                    >
                      <option value="">Select a tour stop</option>
                      {TOUR_STOPS.map((stop) => (
                        <option key={stop} value={stop}>
                          {stop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest mb-2">
                      Your Story *
                    </label>
                    <textarea
                      required
                      value={form.story}
                      onChange={(e) => setForm({ ...form, story: e.target.value.slice(0, 2000) })}
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-600 resize-y"
                      placeholder="What did you experience? What surprised you? What do you think should change?"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{charCount < 20 ? `${20 - charCount} more characters needed` : ''}</span>
                      <span className={charCount > 1800 ? 'text-red-600 font-bold' : ''}>
                        {charCount}/2,000
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || charCount < 20}
                    className="w-full px-6 py-4 text-sm font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <PenLine className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Submit Your Story'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Stories are reviewed before publishing. By submitting, you agree to your story
                    being shared publicly on JusticeHub to support the campaign.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
