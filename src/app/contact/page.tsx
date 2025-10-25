'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Building2,
  User,
  HelpCircle
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  organization: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: 'general',
    message: '',
    organization: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'general', label: 'General Inquiry', icon: MessageSquare },
    { value: 'support', label: 'Technical Support', icon: HelpCircle },
    { value: 'partnership', label: 'Partnership Opportunity', icon: Building2 },
    { value: 'story', label: 'Share a Story', icon: User },
    { value: 'press', label: 'Media/Press Inquiry', icon: Mail }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitted(true);
    } catch (err) {
      setError('Failed to send message. Please try again or email us directly.');
      console.error('Contact form error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-white page-content">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-4">Message Sent Successfully!</h1>
                <p className="text-lg text-gray-700 mb-6">
                  Thank you for reaching out. We'll get back to you within 24-48 hours.
                </p>
                <div className="bg-blue-50 border-2 border-blue-800 p-6">
                  <p className="font-medium text-blue-900">
                    We've sent a confirmation to <strong>{formData.email}</strong>.
                    Check your inbox for our response.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/" className="cta-primary">
                  Back to Home
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      subject: '',
                      category: 'general',
                      message: '',
                      organization: ''
                    });
                  }}
                  className="cta-secondary"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="border-b-2 border-black py-12 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">GET IN TOUCH</h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Have questions? Want to partner with us? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-white border-2 border-black p-6 text-center">
                <Mail className="h-8 w-8 mx-auto mb-3 text-blue-800" />
                <h3 className="font-bold mb-2">Email Us</h3>
                <a
                  href="mailto:hello@justicehub.org.au"
                  className="text-blue-800 hover:underline"
                >
                  hello@justicehub.org.au
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Response within 24-48 hours
                </p>
              </div>

              <div className="bg-white border-2 border-black p-6 text-center">
                <Phone className="h-8 w-8 mx-auto mb-3 text-blue-800" />
                <h3 className="font-bold mb-2">Call Us</h3>
                <a
                  href="tel:1800123456"
                  className="text-blue-800 hover:underline font-mono text-lg"
                >
                  1800 123 456
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Mon-Fri, 9am-5pm AEST
                </p>
              </div>

              <div className="bg-white border-2 border-black p-6 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-3 text-blue-800" />
                <h3 className="font-bold mb-2">Visit Us</h3>
                <p className="text-gray-700">
                  Level 3, 123 Justice St<br />
                  Brisbane, QLD 4000
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  By appointment only
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Send Us a Message</h2>
                <p className="text-gray-700">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-8">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border-2 border-red-600 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block font-bold mb-2">
                      What's this about? *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block font-bold mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Full name"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                    </div>

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
                    </div>
                  </div>

                  {/* Phone & Organization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block font-bold mb-2">
                        Phone Number
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
                      <p className="text-sm text-gray-600 mt-1">Optional</p>
                    </div>

                    <div>
                      <label htmlFor="organization" className="block font-bold mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        placeholder="Company or organization"
                        className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                      />
                      <p className="text-sm text-gray-600 mt-1">Optional</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block font-bold mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief subject line"
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block font-bold mb-2">
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={8}
                      placeholder="Tell us what you need help with, or what you'd like to discuss..."
                      className="w-full px-4 py-3 border-2 border-black focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 justify-end pt-4 border-t-2 border-black">
                    <Link href="/" className="cta-secondary">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="cta-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="section-padding bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3">Looking for Something Specific?</h2>
              <p className="text-gray-700">Check out these resources</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link
                href="/support"
                className="group bg-white border-2 border-black p-6 hover:bg-blue-800 hover:text-white transition-all"
              >
                <HelpCircle className="h-8 w-8 mb-3" />
                <h3 className="font-bold mb-2">Help Center</h3>
                <p className="text-sm">Find answers to common questions and troubleshooting guides</p>
              </Link>

              <Link
                href="/partners"
                className="group bg-white border-2 border-black p-6 hover:bg-blue-800 hover:text-white transition-all"
              >
                <Building2 className="h-8 w-8 mb-3" />
                <h3 className="font-bold mb-2">Partner With Us</h3>
                <p className="text-sm">Learn about collaboration opportunities and how to get involved</p>
              </Link>

              <Link
                href="/media"
                className="group bg-white border-2 border-black p-6 hover:bg-blue-800 hover:text-white transition-all"
              >
                <Mail className="h-8 w-8 mb-3" />
                <h3 className="font-bold mb-2">Media Inquiries</h3>
                <p className="text-sm">Press resources, media kits, and interview requests</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}