'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Check, Loader2 } from 'lucide-react';
import { tourStops } from '@/content/campaign';
import { TurnstileWidget } from '@/components/ui/turnstile-widget';

interface RegistrationData {
  full_name: string;
  email: string;
  organization: string;
  role: string;
  dietary_requirements: string;
  accessibility_needs: string;
  how_heard: string;
  newsletter: boolean;
}

// Colon canon to match the live GHL CRM (project:contained, cohort:<x>); the
// route adds project:contained-adelaide-2026, state:<x>, role:<x> on top.
const cohortDetails: Record<string, { label: string; tag: string; note: string }> = {
  'young-people': {
    label: 'Young people / build pathway',
    tag: 'cohort:young-people',
    note: 'For supported participation in the build, hosting, or youth-led reflection pathway.',
  },
  'student-service': {
    label: 'Students + services',
    tag: 'cohort:student-service',
    note: 'For Flinders, local services, youth organisations, arts/community groups, and supervised cohorts.',
  },
  'conference-delegate': {
    label: 'Conference delegates',
    tag: 'cohort:conference-delegate',
    note: 'For Reintegration Puzzle delegates requesting a hosted walkthrough beside the conference.',
  },
  'vip-media': {
    label: 'VIP / media / funder',
    tag: 'cohort:vip-media',
    note: 'For MPs, courts, public servants, funders, journalists, and decision-makers needing a priority window.',
  },
  'next-city': {
    label: 'Next-city partner',
    tag: 'cohort:next-city',
    note: 'For Perth, Victoria/Melbourne, and future tour-stop partners.',
  },
  public: {
    label: 'Public walkthrough',
    tag: 'cohort:public',
    note: 'For public visitors requesting a hosted walkthrough.',
  },
};

// GHL native booking-calendar URL (RC4: native Calendar, not an embedded form).
// Empty until the Phase D calendar is created — the "book your time" CTA only
// renders once this is set, so no broken link ships before then.
const CONTAINED_CALENDAR_URL = process.env.NEXT_PUBLIC_GHL_CONTAINED_CALENDAR_URL || '';

function findRequestedStop(stopParam: string | null) {
  const normalized = (stopParam || 'adelaide').toLowerCase().trim();
  return (
    tourStops.find((stop) =>
      stop.eventSlug.toLowerCase() === normalized ||
      stop.eventSlug.toLowerCase().includes(normalized) ||
      stop.city.toLowerCase().includes(normalized)
    ) ||
    tourStops.find((stop) => stop.eventSlug === 'contained-adelaide-tandanya') ||
    tourStops[0]
  );
}

function ContainedRegisterPageContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [turnstileToken, setTurnstileToken] = useState('');

  const [formData, setFormData] = useState<RegistrationData>({
    full_name: '',
    email: '',
    organization: '',
    role: '',
    dietary_requirements: '',
    accessibility_needs: '',
    how_heard: '',
    newsletter: true,
  });

  const selectedStop = findRequestedStop(searchParams.get('stop'));
  const requestedCohort = searchParams.get('cohort') || 'public';
  const cohort = cohortDetails[requestedCohort] || cohortDetails.public;
  const displayDate = selectedStop.date;
  const eventDetails = {
    title: `CONTAINED: ${selectedStop.city}`,
    date: displayDate,
    time: 'Hosted session details confirmed after registration',
    venue: selectedStop.venue,
    address: `${selectedStop.city}, ${selectedStop.state}`,
    slug: selectedStop.eventSlug,
    cohort: cohort.label,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the GHL register API which handles both database and CRM sync.
      // Send only the tags the route cannot derive (the cohort) plus the stop
      // state; the route applies the canonical CONTAINED/state tags itself.
      const response = await fetch('/api/ghl/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          organization: formData.organization,
          role: formData.role,
          dietary_requirements: formData.dietary_requirements,
          accessibility_needs: formData.accessibility_needs,
          how_heard: formData.how_heard,
          newsletter: formData.newsletter,
          event_name: eventDetails.title,
          event_slug: eventDetails.slug,
          state: selectedStop.state,
          tags: [cohort.tag],
          turnstile_token: turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0e8]">
      {/* Header */}
      <header className="border-b border-white/12">
        <div className="container-justice py-4">
          <Link
            href="/contained"
            className="inline-flex items-center gap-2 text-white/55 hover:text-[#f5f0e8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CONTAINED
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="container-justice max-w-2xl">
          {/* Event Summary */}
          <div className="border border-white/12 p-6 mb-8 bg-white/[0.04]">
            <h1 className="text-2xl font-bold mb-4">{eventDetails.title}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-white/55">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/45" />
                {eventDetails.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/45" />
                {eventDetails.time}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white/45" />
                {eventDetails.venue}
              </div>
            </div>
            <div className="mt-4 border-t border-white/12 pt-4 text-sm text-white/80">
              <div className="font-bold text-[#f5f0e8]">{eventDetails.cohort}</div>
              <p className="mt-1 text-white/50">{cohort.note}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= s
                      ? 'bg-[#dc2626] text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`hidden sm:inline text-sm ${step >= s ? 'text-[#f5f0e8]' : 'text-white/40'}`}>
                  {s === 1 ? 'Your Details' : s === 2 ? 'Preferences' : 'Confirmation'}
                </span>
                {s < 3 && (
                  <div className={`w-8 h-0.5 ${step > s ? 'bg-[#dc2626]' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Forms */}
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold mb-6">Your Details</h2>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-2">
                  Full Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/15 text-[#f5f0e8] focus:border-[#dc2626] focus:outline-none"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/15 text-[#f5f0e8] focus:border-[#dc2626] focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/15 text-[#f5f0e8] focus:border-[#dc2626] focus:outline-none"
                  placeholder="Your organization (optional)"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-2">
                  Your Role / Interest
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/15 text-[#f5f0e8] focus:border-[#dc2626] focus:outline-none"
                >
                  <option value="">Select your role...</option>
                  <option value="researcher">Researcher / Academic</option>
                  <option value="student">Student</option>
                  <option value="practitioner">Youth Justice Practitioner</option>
                  <option value="service_org">Service / Community Organisation</option>
                  <option value="policymaker">Policymaker / Government</option>
                  <option value="funder">Funder / Philanthropy</option>
                  <option value="advocate">Advocate / Activist</option>
                  <option value="artist">Artist / Creative</option>
                  <option value="media">Media / Journalist</option>
                  <option value="lived_experience">Person with Lived Experience</option>
                  <option value="community">Community Member</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#dc2626] text-white font-bold text-lg hover:bg-[#b91c1c] transition-colors"
              >
                Continue
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-bold mb-6">Preferences & Accessibility</h2>

              <div>
                <label htmlFor="dietary_requirements" className="block text-sm font-medium mb-2">
                  Dietary Requirements
                </label>
                <input
                  type="text"
                  id="dietary_requirements"
                  name="dietary_requirements"
                  value={formData.dietary_requirements}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/15 text-[#f5f0e8] focus:border-[#dc2626] focus:outline-none"
                  placeholder="E.g., vegetarian, vegan, gluten-free, allergies..."
                />
              </div>

              <div>
                <label htmlFor="accessibility_needs" className="block text-sm font-medium mb-2">
                  Accessibility Requirements
                </label>
                <textarea
                  id="accessibility_needs"
                  name="accessibility_needs"
                  value={formData.accessibility_needs}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/15 text-[#f5f0e8] focus:border-[#dc2626] focus:outline-none"
                  placeholder="Please let us know if you have any accessibility needs we should accommodate..."
                />
                <p className="text-xs text-white/50 mt-2">
                  The venue is wheelchair accessible. Auslan interpretation available on request.
                </p>
              </div>

              <div>
                <label htmlFor="how_heard" className="block text-sm font-medium mb-2">
                  How did you hear about this event?
                </label>
                <select
                  id="how_heard"
                  name="how_heard"
                  value={formData.how_heard}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/15 text-[#f5f0e8] focus:border-[#dc2626] focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="email">Email / Newsletter</option>
                  <option value="social_media">Social Media</option>
                  <option value="colleague">Colleague / Friend</option>
                  <option value="justicehub">JusticeHub Website</option>
                  <option value="media">Media Coverage</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="newsletter"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 bg-white/[0.04] border border-white/15"
                />
                <label htmlFor="newsletter" className="text-sm text-white/80">
                  Keep me updated about JusticeHub events and youth justice reform news
                </label>
              </div>

              <TurnstileWidget onSuccess={setTurnstileToken} theme="dark" />

              {error && (
                <div className="p-4 bg-[#dc2626]/10 border border-[#dc2626]/40 text-[#fecaca] text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border border-white/20 text-[#f5f0e8] font-bold hover:bg-white/[0.06] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="flex-1 py-4 bg-[#dc2626] text-white font-bold text-lg hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#059669] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold mb-4">You&apos;re Registered!</h2>

              <p className="text-xl text-white/80 mb-8">
                Thank you for registering for the CONTAINED launch event, {formData.full_name.split(' ')[0]}.
              </p>

              {/* GHL native-calendar booking CTA (RC4) — gated on Phase D env var */}
              {CONTAINED_CALENDAR_URL && (
                <div className="border border-[#dc2626]/40 bg-[#dc2626]/10 p-6 mb-8 text-left">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#dc2626]" />
                    Book your walk-through time
                  </h3>
                  <p className="text-white/70 text-sm mb-4">
                    Pick a 30-minute slot. Walk-throughs run in small groups, so choosing a time now
                    secures your place.
                  </p>
                  <a
                    href={CONTAINED_CALENDAR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#dc2626] text-white font-bold hover:bg-[#b91c1c] transition-colors"
                  >
                    Choose a Time <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="border border-white/12 p-6 mb-8 bg-white/[0.04] text-left">
                <h3 className="font-bold mb-4">Event Details</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-white/45" />
                    {eventDetails.date}
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-white/45" />
                    {eventDetails.time}
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-white/45 flex-shrink-0 mt-1" />
                    <div>
                      <div>{eventDetails.venue}</div>
                      <div className="text-white/50">{eventDetails.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-white/55">
                  A confirmation email has been sent to <strong className="text-[#f5f0e8]">{formData.email}</strong>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contained"
                    className="px-6 py-3 border border-white/20 text-[#f5f0e8] font-bold hover:bg-white/[0.06] transition-colors"
                  >
                    Explore CONTAINED
                  </Link>
                  <Link
                    href="/"
                    className="px-6 py-3 bg-[#dc2626] text-white font-bold hover:bg-[#b91c1c] transition-colors"
                  >
                    Back to JusticeHub
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ContainedRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] p-8 text-[#f5f0e8]">Loading registration...</div>}>
      <ContainedRegisterPageContent />
    </Suspense>
  );
}
