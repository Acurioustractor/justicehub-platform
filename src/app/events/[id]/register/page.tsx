'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, Calendar, MapPin, Clock, Check, Loader2, AlertCircle } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location_name?: string;
  location_state?: string;
  max_attendees?: number;
}

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

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    async function fetchEvent() {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_type, start_date, end_date, location_name, location_state, max_attendees')
        .eq('id', eventId)
        .eq('is_public', true)
        .single();

      if (error || !data) {
        router.push('/events');
        return;
      }

      // Check if event is in the past
      if (new Date(data.start_date) < new Date()) {
        router.push(`/events/${eventId}`);
        return;
      }

      setEvent(data as Event);
      setLoading(false);
    }

    fetchEvent();
  }, [eventId, router, supabase]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/ghl/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          email: formData.email,
          full_name: formData.full_name,
          organization: formData.organization,
          role: formData.role,
          dietary_requirements: formData.dietary_requirements,
          accessibility_needs: formData.accessibility_needs,
          how_heard: formData.how_heard,
          newsletter: formData.newsletter,
          event_name: event?.title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setStep(3);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white page-content">
        <Navigation />
        <main className="py-24">
          <div className="container-justice max-w-2xl text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-ochre-600" />
            <p className="mt-4 text-earth-600">Loading event details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Breadcrumb */}
        <section className="py-4 border-b border-gray-200 bg-sand-50">
          <div className="container-justice">
            <Link
              href={`/events/${eventId}`}
              className="flex items-center gap-2 text-sm text-earth-600 hover:text-ochre-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Event Details
            </Link>
          </div>
        </section>

        <section className="py-12">
          <div className="container-justice max-w-2xl">
            {/* Event Summary */}
            <div className="border-2 border-black p-6 mb-8 bg-sand-50">
              <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-6 text-sm text-earth-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-ochre-600" />
                  {formatDate(event.start_date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-ochre-600" />
                  {formatTime(event.start_date)}
                  {event.end_date && ` - ${formatTime(event.end_date)}`}
                </div>
                {event.location_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-ochre-600" />
                    {event.location_name}
                    {event.location_state && `, ${event.location_state}`}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-12">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                      step >= s
                        ? 'bg-ochre-600 text-white border-ochre-600'
                        : 'bg-white text-earth-400 border-earth-300'
                    }`}
                  >
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={`hidden sm:inline text-sm ${step >= s ? 'text-black font-medium' : 'text-earth-400'}`}>
                    {s === 1 ? 'Your Details' : s === 2 ? 'Preferences' : 'Confirmation'}
                  </span>
                  {s < 3 && (
                    <div className={`w-8 h-0.5 ${step > s ? 'bg-ochre-600' : 'bg-earth-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Your Details */}
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
                    Full Name <span className="text-ochre-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-black focus:border-ochre-600 focus:outline-none"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address <span className="text-ochre-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-black focus:border-ochre-600 focus:outline-none"
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
                    className="w-full px-4 py-3 border-2 border-black focus:border-ochre-600 focus:outline-none"
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
                    className="w-full px-4 py-3 border-2 border-black focus:border-ochre-600 focus:outline-none bg-white"
                  >
                    <option value="">Select your role...</option>
                    <option value="researcher">Researcher / Academic</option>
                    <option value="practitioner">Youth Justice Practitioner</option>
                    <option value="policymaker">Policymaker / Government</option>
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
                  className="w-full py-4 bg-black text-white font-bold text-lg hover:bg-gray-800 transition-colors"
                >
                  Continue
                </button>
              </form>
            )}

            {/* Step 2: Preferences */}
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
                    className="w-full px-4 py-3 border-2 border-black focus:border-ochre-600 focus:outline-none"
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
                    className="w-full px-4 py-3 border-2 border-black focus:border-ochre-600 focus:outline-none"
                    placeholder="Please let us know if you have any accessibility needs we should accommodate..."
                  />
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
                    className="w-full px-4 py-3 border-2 border-black focus:border-ochre-600 focus:outline-none bg-white"
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
                    className="mt-1 w-4 h-4 accent-ochre-600"
                  />
                  <label htmlFor="newsletter" className="text-sm text-earth-700">
                    Keep me updated about JusticeHub events and youth justice reform news
                  </label>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 border-2 border-black font-bold hover:bg-sand-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-black text-white font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
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

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-eucalyptus-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-3xl font-bold mb-4">You&apos;re Registered!</h2>

                <p className="text-xl text-earth-600 mb-8">
                  Thank you for registering for {event.title}, {formData.full_name.split(' ')[0]}.
                </p>

                <div className="border-2 border-black p-6 mb-8 bg-sand-50 text-left">
                  <h3 className="font-bold mb-4">Event Details</h3>
                  <div className="space-y-3 text-earth-700">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-ochre-600" />
                      {formatDate(event.start_date)}
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-ochre-600" />
                      {formatTime(event.start_date)}
                      {event.end_date && ` - ${formatTime(event.end_date)}`}
                    </div>
                    {event.location_name && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-ochre-600 flex-shrink-0 mt-1" />
                        <div>
                          <div>{event.location_name}</div>
                          {event.location_state && (
                            <div className="text-earth-500">{event.location_state}, Australia</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-earth-600">
                    A confirmation email has been sent to <strong className="text-black">{formData.email}</strong>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href={`/events/${eventId}`}
                      className="px-6 py-3 border-2 border-black font-bold hover:bg-sand-50 transition-colors"
                    >
                      View Event Details
                    </Link>
                    <Link
                      href="/events"
                      className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                    >
                      Browse More Events
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
