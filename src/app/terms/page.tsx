'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  Scale,
  Mail
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="border-b-2 border-black py-12 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white font-bold text-sm uppercase tracking-wider mb-6">
                <FileText className="h-4 w-4" />
                Legal
              </div>

              <h1 className="text-4xl font-black mb-4">TERMS OF SERVICE</h1>

              <p className="text-lg text-gray-700 mb-4">
                <strong>Effective Date:</strong> January 1, 2024<br />
                <strong>Last Updated:</strong> January 1, 2024
              </p>

              <p className="text-gray-700">
                Welcome to JusticeHub. By using our platform, you agree to these terms.
                Please read them carefully.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                The Basics (Plain English)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-blue-800 p-6">
                  <h3 className="font-bold mb-3 text-blue-900">What You Can Do</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800 font-bold">✓</span>
                      <span>Use JusticeHub to find services and support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800 font-bold">✓</span>
                      <span>Share your stories and experiences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800 font-bold">✓</span>
                      <span>Connect with programs and mentors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800 font-bold">✓</span>
                      <span>Access transparency data</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-red-600 p-6">
                  <h3 className="font-bold mb-3 text-red-900">What You Can't Do</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span>Post harmful, abusive, or illegal content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span>Impersonate others or share false info</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span>Scrape or misuse our data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span>Violate others' privacy or rights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto prose prose-lg">

              {/* Section 1 */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>

                <p className="text-gray-700 mb-4">
                  By accessing or using JusticeHub ("the Platform"), you agree to be bound by these
                  Terms of Service ("Terms"). If you don't agree, please don't use the Platform.
                </p>

                <p className="text-gray-700 mb-4">
                  These Terms apply to all users, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Young people seeking support or services</li>
                  <li>Organizations and service providers</li>
                  <li>Mentors and talent scouts</li>
                  <li>Community members and visitors</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>

                <div className="bg-orange-50 border-l-4 border-orange-600 p-6 mb-6">
                  <h3 className="font-bold mb-2 text-orange-900">Age Requirements</h3>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>You must be at least 13 years old to create an account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Users under 18 have additional privacy protections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Talent scouts must be 18+ and verified</span>
                    </li>
                  </ul>
                </div>

                <p className="text-gray-700 mb-4">
                  You must provide accurate information and keep your account secure.
                  You're responsible for all activity under your account.
                </p>
              </div>

              {/* Section 3 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  3. User Content & Conduct
                </h2>

                <h3 className="text-xl font-bold mb-3 mt-6">Content You Share</h3>
                <p className="text-gray-700 mb-4">
                  When you share stories, comments, or other content on JusticeHub:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>You retain ownership of your content</li>
                  <li>You grant us a license to display and distribute it (based on your privacy settings)</li>
                  <li>You're responsible for what you post</li>
                  <li>You confirm you have the right to share this content</li>
                </ul>

                <h3 className="text-xl font-bold mb-3 mt-6">Prohibited Content</h3>
                <p className="text-gray-700 mb-4">You may NOT post content that is:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Illegal, harmful, threatening, or abusive</li>
                  <li>Hateful, discriminatory, or harassing</li>
                  <li>False, misleading, or defamatory</li>
                  <li>Spam, malware, or phishing attempts</li>
                  <li>Violates others' privacy or intellectual property</li>
                  <li>Sexually explicit (especially involving minors)</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  4. Platform Rules & Safety
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-800 p-6 mb-6">
                  <h3 className="font-bold mb-2 text-blue-900">Special Rules for Talent Scouts</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    If you're using JusticeHub as a talent scout or organization representative:
                  </p>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>You must be verified before contacting youth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>All communications are monitored for safety</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Respect youth privacy and boundaries at all times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Violations may result in immediate account termination</span>
                    </li>
                  </ul>
                </div>

                <p className="text-gray-700 mb-4">
                  We reserve the right to remove content, suspend accounts, or ban users who violate
                  these Terms or endanger the safety of our community.
                </p>
              </div>

              {/* Section 5 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>

                <p className="text-gray-700 mb-4">
                  <strong>Our Content:</strong> The JusticeHub platform, including design, features,
                  and original content, is protected by copyright and other laws. You may not copy,
                  reproduce, or create derivative works without permission.
                </p>

                <p className="text-gray-700 mb-4">
                  <strong>Your Content:</strong> You keep all rights to content you create. By sharing
                  on JusticeHub, you grant us a non-exclusive license to use, display, and distribute
                  your content according to your privacy settings.
                </p>

                <p className="text-gray-700 mb-4">
                  <strong>Attribution:</strong> When using JusticeHub data or stories for research or
                  advocacy, please provide appropriate attribution.
                </p>
              </div>

              {/* Section 6 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">6. Third-Party Services</h2>

                <p className="text-gray-700 mb-4">
                  JusticeHub may contain links to third-party websites, services, or organizations.
                  We don't control and aren't responsible for these third parties. Use them at your
                  own risk and review their terms and privacy policies.
                </p>

                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 mb-6">
                  <h3 className="font-bold mb-2 text-yellow-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Important Note
                  </h3>
                  <p className="text-sm text-yellow-800">
                    JusticeHub provides information about services, but we don't endorse or guarantee
                    any third-party providers. Always do your own research and use your judgment when
                    accessing services.
                  </p>
                </div>
              </div>

              {/* Section 7 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Scale className="h-6 w-6" />
                  7. Disclaimers & Limitations
                </h2>

                <p className="text-gray-700 mb-4">
                  <strong>AS-IS BASIS:</strong> JusticeHub is provided "as is" without warranties of
                  any kind. We don't guarantee the platform will be error-free, uninterrupted, or
                  completely secure.
                </p>

                <p className="text-gray-700 mb-4">
                  <strong>NOT PROFESSIONAL ADVICE:</strong> Information on JusticeHub is for general
                  informational purposes only. It's not legal, medical, or professional advice.
                  Always consult qualified professionals for specific guidance.
                </p>

                <p className="text-gray-700 mb-4">
                  <strong>LIMITATION OF LIABILITY:</strong> To the fullest extent permitted by law,
                  JusticeHub and its operators aren't liable for any indirect, incidental, or
                  consequential damages arising from your use of the platform.
                </p>
              </div>

              {/* Section 8 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">8. Termination</h2>

                <p className="text-gray-700 mb-4">
                  <strong>Your Right:</strong> You can close your account at any time by contacting
                  us or using account settings.
                </p>

                <p className="text-gray-700 mb-4">
                  <strong>Our Right:</strong> We may suspend or terminate your access if you:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Violate these Terms</li>
                  <li>Engage in harmful or illegal conduct</li>
                  <li>Pose a risk to other users</li>
                  <li>Provide false information</li>
                </ul>

                <p className="text-gray-700 mb-4">
                  Upon termination, your right to use the platform ends immediately. We may delete
                  your content, though some information may remain in backups.
                </p>
              </div>

              {/* Section 9 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>

                <p className="text-gray-700 mb-4">
                  We may update these Terms from time to time. We'll notify you of significant changes
                  via email or a prominent notice on the platform. Continued use after changes means
                  you accept the updated Terms.
                </p>
              </div>

              {/* Section 10 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>

                <p className="text-gray-700 mb-4">
                  These Terms are governed by the laws of Queensland, Australia. Any disputes will be
                  resolved in the courts of Queensland.
                </p>
              </div>

              {/* Contact */}
              <div className="border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Mail className="h-6 w-6" />
                  11. Contact Us
                </h2>

                <p className="text-gray-700 mb-4">
                  Questions about these Terms? We're here to help:
                </p>

                <div className="bg-gray-50 border-2 border-black p-6">
                  <p className="mb-2"><strong>Email:</strong> <a href="mailto:legal@justicehub.org.au" className="text-blue-800 hover:underline">legal@justicehub.org.au</a></p>
                  <p className="mb-2"><strong>Phone:</strong> <a href="tel:1800123456" className="text-blue-800 hover:underline">1800 123 456</a></p>
                  <p className="mb-2"><strong>Mail:</strong> Legal Team, JusticeHub</p>
                  <p>Level 3, 123 Justice St, Brisbane QLD 4000</p>
                </div>
              </div>

              {/* Acknowledgement */}
              <div className="bg-blue-50 border-2 border-blue-800 p-6 mt-8">
                <h3 className="font-bold mb-2 text-blue-900">By Using JusticeHub, You Agree To:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Follow these Terms of Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Comply with our Privacy Policy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Use the platform responsibly and ethically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Respect the safety and privacy of our community</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="section-padding bg-gray-50 border-t-2 border-black">
          <div className="container-justice text-center">
            <h3 className="text-2xl font-bold mb-4">Questions About These Terms?</h3>
            <p className="text-gray-700 mb-6">
              We're here to help clarify anything that's unclear.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact" className="cta-primary">
                Contact Us
              </Link>
              <Link href="/privacy" className="cta-secondary">
                View Privacy Policy
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}