'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Eye,
  Users,
  Database,
  Cookie,
  Mail,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="border-b-2 border-black py-12 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white font-bold text-sm uppercase tracking-wider mb-6">
                <Shield className="h-4 w-4" />
                Legal
              </div>

              <h1 className="text-4xl font-black mb-4">PRIVACY POLICY</h1>

              <p className="text-lg text-gray-700 mb-4">
                <strong>Effective Date:</strong> January 1, 2024
              </p>

              <p className="text-gray-700">
                At JusticeHub, we take your privacy seriously. This policy explains how we collect,
                use, protect, and share your personal information.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Quick Summary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-green-600 p-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    What We DO
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Encrypt and protect your data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Let you control your privacy settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Give you access to your data anytime</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Delete your data when you ask</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-red-600 p-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    What We DON'T Do
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Sell your data to advertisers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Share your info without permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Track you across other websites</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Use your data for unrelated purposes</span>
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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  1. Information We Collect
                </h2>

                <h3 className="text-xl font-bold mb-3 mt-6">Information You Provide</h3>
                <p className="text-gray-700 mb-4">
                  When you use JusticeHub, you may provide us with:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Account Information:</strong> Name, email, age, location</li>
                  <li><strong>Stories:</strong> Your personal stories and experiences you choose to share</li>
                  <li><strong>Profile Data:</strong> Goals, interests, achievements, and journey tracking</li>
                  <li><strong>Communications:</strong> Messages you send through our platform</li>
                  <li><strong>Organization Details:</strong> For partners and talent scouts</li>
                </ul>

                <h3 className="text-xl font-bold mb-3 mt-6">Information We Collect Automatically</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Usage Data:</strong> How you interact with our platform</li>
                  <li><strong>Device Information:</strong> Browser type, IP address, device type</li>
                  <li><strong>Analytics:</strong> Pages viewed, time spent, features used</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  2. How We Use Your Information
                </h2>

                <p className="text-gray-700 mb-4">We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Provide Services:</strong> Connect you with resources, programs, and opportunities</li>
                  <li><strong>Personalize Experience:</strong> Tailor recommendations to your needs</li>
                  <li><strong>Enable Connections:</strong> Match youth with mentors and programs</li>
                  <li><strong>Improve Platform:</strong> Analyze usage to make JusticeHub better</li>
                  <li><strong>Communicate:</strong> Send updates, notifications, and support</li>
                  <li><strong>Safety & Security:</strong> Detect fraud and abuse</li>
                  <li><strong>Legal Compliance:</strong> Meet our legal obligations</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Lock className="h-6 w-6" />
                  3. Privacy Controls & Your Choices
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-800 p-6 mb-6">
                  <h3 className="font-bold mb-2 text-blue-900">Story Visibility Controls</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    When sharing your story, you choose who can see it:
                  </p>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span><strong>Public:</strong> Visible to everyone (helps inspire others)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span><strong>Network Only:</strong> Shared with trusted organizations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span><strong>Anonymous:</strong> Published without identifying information</span>
                    </li>
                  </ul>
                </div>

                <p className="text-gray-700 mb-4">You can also:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Update or delete your stories anytime</li>
                  <li>Control who can contact you</li>
                  <li>Opt out of certain communications</li>
                  <li>Download all your data</li>
                  <li>Delete your account completely</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">4. How We Share Information</h2>

                <p className="text-gray-700 mb-4">
                  <strong>We will NEVER sell your personal data.</strong> We only share information:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>With Your Consent:</strong> When you explicitly agree</li>
                  <li><strong>Service Providers:</strong> Trusted partners who help us operate (hosting, analytics)</li>
                  <li><strong>Safety & Legal:</strong> When required by law or to prevent harm</li>
                  <li><strong>Aggregated Data:</strong> Non-identifiable statistics for research and advocacy</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  5. Data Security
                </h2>

                <p className="text-gray-700 mb-4">
                  We protect your data with:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Industry-standard encryption (SSL/TLS)</li>
                  <li>Secure servers in Australia</li>
                  <li>Regular security audits</li>
                  <li>Limited employee access</li>
                  <li>Two-factor authentication options</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Cookie className="h-6 w-6" />
                  6. Cookies & Tracking
                </h2>

                <p className="text-gray-700 mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Remember your login and preferences</li>
                  <li>Understand how you use our platform</li>
                  <li>Improve performance and security</li>
                </ul>

                <p className="text-gray-700 mb-4">
                  You can control cookies through your browser settings. Note that disabling cookies
                  may limit some functionality.
                </p>
              </div>

              {/* Section 7 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">7. Children's Privacy (Under 18)</h2>

                <div className="bg-orange-50 border-l-4 border-orange-600 p-6 mb-6">
                  <p className="text-orange-900 font-medium mb-3">
                    <strong>Special Protections for Young People</strong>
                  </p>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Default privacy settings are more restrictive for users under 18</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Stories from minors require additional review before publication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Contact from talent scouts is monitored and restricted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Parents/guardians can request account deletion at any time</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 8 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">8. Your Rights</h2>

                <p className="text-gray-700 mb-4">Under Australian privacy law, you have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correct:</strong> Update incorrect or incomplete information</li>
                  <li><strong>Delete:</strong> Request deletion of your account and data</li>
                  <li><strong>Restrict:</strong> Limit how we use your information</li>
                  <li><strong>Port:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Object:</strong> Opt out of certain data processing</li>
                </ul>

                <p className="text-gray-700 mb-4">
                  To exercise these rights, email us at{' '}
                  <a href="mailto:privacy@justicehub.org.au" className="text-blue-800 hover:underline font-medium">
                    privacy@justicehub.org.au
                  </a>
                </p>
              </div>

              {/* Section 9 */}
              <div className="mb-12 border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4">9. Changes to This Policy</h2>

                <p className="text-gray-700 mb-4">
                  We may update this privacy policy from time to time. We'll notify you of any
                  significant changes via email or a prominent notice on our platform.
                </p>
              </div>

              {/* Contact */}
              <div className="border-t-2 border-black pt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Mail className="h-6 w-6" />
                  10. Contact Us
                </h2>

                <p className="text-gray-700 mb-4">
                  If you have questions or concerns about your privacy:
                </p>

                <div className="bg-gray-50 border-2 border-black p-6">
                  <p className="mb-2"><strong>Email:</strong> <a href="mailto:privacy@justicehub.org.au" className="text-blue-800 hover:underline">privacy@justicehub.org.au</a></p>
                  <p className="mb-2"><strong>Phone:</strong> <a href="tel:1800123456" className="text-blue-800 hover:underline">1800 123 456</a></p>
                  <p className="mb-2"><strong>Mail:</strong> Privacy Officer, JusticeHub</p>
                  <p>Level 3, 123 Justice St, Brisbane QLD 4000</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="section-padding bg-gray-50 border-t-2 border-black">
          <div className="container-justice text-center">
            <h3 className="text-2xl font-bold mb-4">Questions About Privacy?</h3>
            <p className="text-gray-700 mb-6">
              We're here to help. Reach out anytime.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact" className="cta-primary">
                Contact Us
              </Link>
              <Link href="/terms" className="cta-secondary">
                View Terms of Service
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}