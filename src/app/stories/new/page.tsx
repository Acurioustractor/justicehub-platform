'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Shield,
  Upload,
  AlertCircle,
  CheckCircle,
  Globe,
  Users,
  Lock
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface StoryFormData {
  title: string;
  author: string;
  age: string;
  location: string;
  program: string;
  theme: string;
  summary: string;
  fullStory: string;
  quote: string;
  email: string;
  phone: string;
  visibility: 'public' | 'network' | 'anonymous';
  consent: boolean;
}

function NewStoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyType = searchParams.get('type'); // 'program' or null for personal story

  const [formData, setFormData] = useState<StoryFormData>({
    title: '',
    author: '',
    age: '',
    location: '',
    program: '',
    theme: 'Transformation',
    summary: '',
    fullStory: '',
    quote: '',
    email: '',
    phone: '',
    visibility: 'public',
    consent: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const themes = [
    'Transformation',
    'Education',
    'Healing',
    'Foster Care',
    'Advocacy',
    'Justice',
    'Community',
    'Creative Arts',
    'Employment',
    'Mental Health'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consent) {
      setError('Please confirm that you consent to share your story');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/stories', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitted(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/stories');
      }, 3000);

    } catch (err) {
      setError('Failed to submit story. Please try again.');
      console.error('Story submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-4">Story Submitted Successfully!</h1>
                <p className="text-lg text-gray-700 mb-6">
                  Thank you for sharing your story. Your voice matters and will inspire others.
                </p>
                <div className="bg-blue-50 border-2 border-blue-800 p-6">
                  <p className="font-medium text-blue-900">
                    Your story is being reviewed by our team and will be published within 48 hours.
                    We'll send you an email at <strong>{formData.email}</strong> when it's live.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/stories" className="cta-primary">
                  View All Stories
                </Link>
                <Link href="/" className="cta-secondary">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="border-b-2 border-black py-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-black hover:underline font-medium mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Stories
            </Link>

            <h1 className="text-3xl md:text-4xl font-black mb-4">
              {storyType === 'program' ? 'Highlight a Program' : 'Share Your Story'}
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl">
              {storyType === 'program'
                ? 'Showcase an organization or program that made a real difference in your community.'
                : 'Your journey matters. Share your story to inspire others and help build a stronger community.'}
            </p>
          </div>
        </section>

        {/* Privacy Notice */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4 bg-white border-2 border-black p-6">
                <Shield className="h-6 w-6 text-blue-800 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Your Privacy & Safety</h3>
                  <p className="text-gray-700 mb-4">
                    You control who sees your story. Choose your visibility level below.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <span className="font-bold">Public:</span> Visible to everyone, helps inspire others
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <span className="font-bold">Network:</span> Shared only with trusted organizations
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <span className="font-bold">Anonymous:</span> Your identity stays protected
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="section-padding">
          <div className="container-justice">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border-2 border-red-600 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-black">
                  1. Basic Information
                </h2>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block font-bold mb-2">
                      Story Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., From Prison to Purpose: My Journey"
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="author" className="block font-bold mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="author"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        required
                        placeholder="First name or pseudonym"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        You can use a pseudonym if you prefer
                      </p>
                    </div>

                    <div>
                      <label htmlFor="age" className="block font-bold mb-2">
                        Your Age *
                      </label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                        min="10"
                        max="99"
                        placeholder="e.g., 19"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="location" className="block font-bold mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Logan, QLD"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>

                    <div>
                      <label htmlFor="program" className="block font-bold mb-2">
                        Program/Organization
                      </label>
                      <input
                        type="text"
                        id="program"
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        placeholder="e.g., BackTrack Youth Works"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Optional: Name the program that helped you
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="theme" className="block font-bold mb-2">
                      Story Theme *
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    >
                      {themes.map(theme => (
                        <option key={theme} value={theme}>{theme}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Your Story */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-black">
                  2. Your Story
                </h2>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="summary" className="block font-bold mb-2">
                      Story Summary * (2-3 sentences)
                    </label>
                    <textarea
                      id="summary"
                      name="summary"
                      value={formData.summary}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      placeholder="Brief overview of your journey..."
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="fullStory" className="block font-bold mb-2">
                      Full Story *
                    </label>
                    <textarea
                      id="fullStory"
                      name="fullStory"
                      value={formData.fullStory}
                      onChange={handleInputChange}
                      required
                      rows={12}
                      placeholder="Tell your story in your own words. What challenges did you face? What helped you? Where are you now?"
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Write as much or as little as you're comfortable sharing
                    </p>
                  </div>

                  <div>
                    <label htmlFor="quote" className="block font-bold mb-2">
                      Key Quote (Optional)
                    </label>
                    <input
                      type="text"
                      id="quote"
                      name="quote"
                      value={formData.quote}
                      onChange={handleInputChange}
                      placeholder="One powerful sentence that captures your journey"
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Privacy */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-black">
                  3. Contact & Privacy
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block font-bold mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        We'll only use this to contact you about your story
                      </p>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block font-bold mb-2">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="04XX XXX XXX"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-3">
                      Who can see your story? *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can read your story (recommended to inspire others)' },
                        { value: 'network', icon: Users, label: 'Network Only', desc: 'Only shared with trusted organizations and programs' },
                        { value: 'anonymous', icon: Lock, label: 'Anonymous', desc: 'Published without identifying information' }
                      ].map(({ value, icon: Icon, label, desc }) => (
                        <label
                          key={value}
                          className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-all ${
                            formData.visibility === value
                              ? 'border-blue-800 bg-blue-50'
                              : 'border-gray-300 hover:border-blue-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name="visibility"
                            value={value}
                            checked={formData.visibility === value}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">{label}</div>
                            <div className="text-sm text-gray-700">{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 border-2 border-black p-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={formData.consent}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <span className="font-bold">I consent to sharing my story *</span>
                        <p className="text-gray-700 mt-1">
                          I understand that my story will be reviewed and published on JusticeHub.
                          I can request removal or updates at any time by contacting stories@justicehub.org.au
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 justify-end border-t-2 border-black pt-8">
                <Link href="/stories" className="cta-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !formData.consent}
                  className="cta-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Submit Story
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function NewStoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="text-center">
              <div className="text-xl text-gray-600">Loading form...</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <NewStoryForm />
    </Suspense>
  );
}