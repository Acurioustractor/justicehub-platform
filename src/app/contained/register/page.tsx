'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, MapPin, Clock, Check, Loader2 } from 'lucide-react';

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

export default function ContainedRegisterPage() {
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationId, setRegistrationId] = useState('');

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

  const eventDetails = {
    title: 'CONTAINED: Exhibition Launch',
    date: 'Saturday, 15 February 2026',
    time: '6:00 PM - 9:00 PM',
    venue: 'Brisbane Powerhouse',
    address: '119 Lamington St, New Farm QLD 4005',
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
      // Use the GHL register API which handles both database and CRM sync
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setRegistrationId(data.registration_id || 'confirmed');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container-justice py-4">
          <Link
            href="/contained/launch"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Launch Info
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="container-justice max-w-2xl">
          {/* Event Summary */}
          <div className="border border-gray-800 p-6 mb-8 bg-gray-950">
            <h1 className="text-2xl font-bold mb-4">{eventDetails.title}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-ochre-500" />
                {eventDetails.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ochre-500" />
                {eventDetails.time}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ochre-500" />
                {eventDetails.venue}
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= s
                      ? 'bg-ochre-600 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`hidden sm:inline text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                  {s === 1 ? 'Your Details' : s === 2 ? 'Preferences' : 'Confirmation'}
                </span>
                {s < 3 && (
                  <div className={`w-8 h-0.5 ${step > s ? 'bg-ochre-600' : 'bg-gray-800'}`} />
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
                  Full Name <span className="text-ochre-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:border-ochre-500 focus:outline-none"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address <span className="text-ochre-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:border-ochre-500 focus:outline-none"
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
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:border-ochre-500 focus:outline-none"
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
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:border-ochre-500 focus:outline-none"
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
                className="w-full py-4 bg-ochre-600 text-white font-bold text-lg hover:bg-ochre-700 transition-colors"
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
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:border-ochre-500 focus:outline-none"
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
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:border-ochre-500 focus:outline-none"
                  placeholder="Please let us know if you have any accessibility needs we should accommodate..."
                />
                <p className="text-xs text-gray-500 mt-2">
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
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:border-ochre-500 focus:outline-none"
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
                  className="mt-1 w-4 h-4 bg-gray-900 border border-gray-700"
                />
                <label htmlFor="newsletter" className="text-sm text-gray-300">
                  Keep me updated about JusticeHub events and youth justice reform news
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border border-gray-700 text-white font-bold hover:bg-gray-900 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-ochre-600 text-white font-bold text-lg hover:bg-ochre-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="w-20 h-20 bg-eucalyptus-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold mb-4">You&apos;re Registered!</h2>

              <p className="text-xl text-gray-300 mb-8">
                Thank you for registering for the CONTAINED launch event, {formData.full_name.split(' ')[0]}.
              </p>

              <div className="border border-gray-800 p-6 mb-8 bg-gray-950 text-left">
                <h3 className="font-bold mb-4">Event Details</h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-ochre-500" />
                    {eventDetails.date}
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-ochre-500" />
                    {eventDetails.time}
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-ochre-500 flex-shrink-0 mt-1" />
                    <div>
                      <div>{eventDetails.venue}</div>
                      <div className="text-gray-500">{eventDetails.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-400">
                  A confirmation email has been sent to <strong className="text-white">{formData.email}</strong>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contained"
                    className="px-6 py-3 border border-gray-700 text-white font-bold hover:bg-gray-900 transition-colors"
                  >
                    Explore CONTAINED
                  </Link>
                  <Link
                    href="/"
                    className="px-6 py-3 bg-ochre-600 text-white font-bold hover:bg-ochre-700 transition-colors"
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
