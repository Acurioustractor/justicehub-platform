'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Users, ArrowRight, Mail, Star } from 'lucide-react';

export default function ContainedLaunchPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const eventDetails = {
    title: 'CONTAINED: Exhibition Launch',
    date: 'Saturday, 15 February 2026',
    time: '6:00 PM - 9:00 PM',
    venue: 'Brisbane Powerhouse',
    address: '119 Lamington St, New Farm QLD 4005',
    description: 'Join us for the world premiere of CONTAINED, an immersive art experience that transforms shipping containers into chambers of truth, revealing the hidden realities of youth detention in Australia.',
  };

  const [loading, setLoading] = useState(false);

  const handleQuickRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to GHL newsletter API with CONTAINED Launch tag
      const response = await fetch('/api/ghl/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          subscription_type: 'general',
          source: 'contained_launch_rsvp',
          tags: ['CONTAINED Launch Interest'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to RSVP');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('RSVP error:', error);
      // Still show success to user - we don't want to block the UX
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(234,88,12,0.3),transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(5,150,105,0.3),transparent_50%)]" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 container-justice text-center py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-ochre-600/20 border border-ochre-500/50 text-ochre-400 text-sm font-bold uppercase tracking-wider mb-8">
            <Star className="w-4 h-4" />
            World Premiere
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
            CONTAINED
          </h1>

          <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto">
            An immersive art experience revealing the hidden realities of youth detention
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-400 mb-12">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ochre-500" />
              {eventDetails.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-ochre-500" />
              {eventDetails.time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-ochre-500" />
              {eventDetails.venue}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contained/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-ochre-600 text-white font-bold text-lg hover:bg-ochre-700 transition-colors"
            >
              Register Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contained/about"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-black transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* About the Exhibition */}
      <section className="py-20 border-t border-gray-800">
        <div className="container-justice">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                What is CONTAINED?
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  CONTAINED transforms shipping containers into immersive chambers that simulate
                  the isolation, surveillance, and environmental conditions experienced by young
                  people in Australian youth detention.
                </p>
                <p>
                  Drawing on extensive research, testimony from young people with lived experience,
                  and the findings of multiple Royal Commissions, CONTAINED is both an artwork
                  and a call to action.
                </p>
                <p>
                  Each chamber represents a different aspect of the youth justice system—from
                  the fluorescent isolation of solitary confinement to the invisible barriers
                  that prevent rehabilitation.
                </p>
              </div>
            </div>

            <div className="relative h-80 md:h-96 bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                <div className="text-center">
                  <div className="text-6xl mb-2">📦</div>
                  <p className="text-sm">Exhibition preview coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Rooms */}
      <section className="py-20 bg-gray-950 border-t border-gray-800">
        <div className="container-justice">
          <h2 className="text-4xl font-bold mb-4 text-center">The Chambers</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Each container reveals a different truth about the youth justice system
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-800 p-6 hover:border-ochre-500/50 transition-colors">
              <div className="text-3xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-2">The Bright Room</h3>
              <p className="text-gray-400 text-sm">
                Experience the relentless fluorescent glare that never stops—24 hours a day,
                7 days a week—as documented in the NT Royal Commission.
              </p>
            </div>

            <div className="border border-gray-800 p-6 hover:border-ochre-500/50 transition-colors">
              <div className="text-3xl mb-4">🚪</div>
              <h3 className="text-xl font-bold mb-2">The Isolation Cell</h3>
              <p className="text-gray-400 text-sm">
                A recreation of the conditions young people face in solitary confinement—
                sometimes for weeks at a time.
              </p>
            </div>

            <div className="border border-gray-800 p-6 hover:border-ochre-500/50 transition-colors">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">The Data Room</h3>
              <p className="text-gray-400 text-sm">
                Interactive visualizations revealing the statistics, costs, and outcomes
                of youth incarceration in Australia.
              </p>
            </div>

            <div className="border border-gray-800 p-6 hover:border-ochre-500/50 transition-colors">
              <div className="text-3xl mb-4">🎤</div>
              <h3 className="text-xl font-bold mb-2">The Voice Chamber</h3>
              <p className="text-gray-400 text-sm">
                First-person testimonies from young people who have experienced detention,
                presented with their consent and on their terms.
              </p>
            </div>

            <div className="border border-gray-800 p-6 hover:border-ochre-500/50 transition-colors">
              <div className="text-3xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-2">The Alternative</h3>
              <p className="text-gray-400 text-sm">
                What could youth justice look like? A glimpse into evidence-based
                alternatives that actually work.
              </p>
            </div>

            <div className="border border-gray-800 p-6 hover:border-ochre-500/50 transition-colors">
              <div className="text-3xl mb-4">✍️</div>
              <h3 className="text-xl font-bold mb-2">The Action Room</h3>
              <p className="text-gray-400 text-sm">
                Don&apos;t just witness—act. Tools, contacts, and pathways for turning
                your experience into real change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-20 border-t border-gray-800">
        <div className="container-justice">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">Launch Event Details</h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="border border-gray-800 p-8">
                <h3 className="text-xl font-bold mb-6">Event Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Calendar className="w-5 h-5 text-ochre-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold">{eventDetails.date}</div>
                      <div className="text-gray-400 text-sm">{eventDetails.time}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-ochre-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold">{eventDetails.venue}</div>
                      <div className="text-gray-400 text-sm">{eventDetails.address}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Users className="w-5 h-5 text-ochre-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold">Limited Capacity</div>
                      <div className="text-gray-400 text-sm">Early registration recommended</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-800 p-8">
                <h3 className="text-xl font-bold mb-6">What to Expect</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-ochre-500">•</span>
                    Guided tours through the CONTAINED chambers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ochre-500">•</span>
                    Panel discussion with creators and advocates
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ochre-500">•</span>
                    Networking with youth justice reform community
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ochre-500">•</span>
                    Complimentary refreshments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ochre-500">•</span>
                    Accessibility accommodations available
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick RSVP */}
            {!submitted ? (
              <div className="border border-ochre-500/50 bg-ochre-500/10 p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Quick RSVP</h3>
                <p className="text-gray-300 mb-6">
                  Enter your email to express interest. We&apos;ll send you full registration details.
                </p>
                <form onSubmit={handleQuickRSVP} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 px-4 py-3 bg-black border border-gray-700 text-white placeholder-gray-500 focus:border-ochre-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-ochre-600 text-white font-bold hover:bg-ochre-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'RSVP'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="border border-eucalyptus-500/50 bg-eucalyptus-500/10 p-8 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-2xl font-bold mb-2">Thanks for your interest!</h3>
                <p className="text-gray-300 mb-6">
                  We&apos;ll send you registration details shortly.
                </p>
                <Link
                  href="/contained/register"
                  className="inline-flex items-center gap-2 text-ochre-400 hover:text-ochre-300"
                >
                  Complete full registration <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-ochre-900/50 to-black border-t border-gray-800">
        <div className="container-justice text-center">
          <h2 className="text-4xl font-bold mb-4">Be Part of the Movement</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            CONTAINED is more than an exhibition—it&apos;s a catalyst for change.
            Join us for the launch and help build a more just future.
          </p>
          <Link
            href="/contained/register"
            className="inline-flex items-center gap-2 px-10 py-5 bg-ochre-600 text-white font-bold text-xl hover:bg-ochre-700 transition-colors"
          >
            Register for Launch <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container-justice text-center text-gray-500 text-sm">
          <p>
            CONTAINED is a project of <Link href="/" className="text-ochre-400 hover:text-ochre-300">JusticeHub</Link> &
            <Link href="https://acurioustractor.com" className="text-ochre-400 hover:text-ochre-300 ml-1">A Curious Tractor</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
