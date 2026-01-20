'use client';

import { useState, useEffect } from 'react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Lock } from 'lucide-react';

export default function PreplanningPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated in this session
    const auth = sessionStorage.getItem('preplanning-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Purplemonkey1') {
      setIsAuthenticated(true);
      sessionStorage.setItem('preplanning-auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-3xl font-bold mb-2">JusticeHub Preplanning</h1>
            <p className="text-gray-600">This page is password protected</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none"
                placeholder="Enter password"
              />
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 border-2 border-black font-bold hover:bg-gray-800 transition-colors"
            >
              Access Preplanning
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            JusticeHub Preplanning
          </h1>
          <p className="text-xl text-gray-600">
            Strategic framework for building a transformative youth justice platform
          </p>
        </div>

        {/* Current State */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">
            Where We Are
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-black p-6">
              <h3 className="text-xl font-bold mb-4 text-green-700">✅ Complete</h3>
              <ul className="space-y-2">
                <li>• Platform infrastructure (100%)</li>
                <li>• 15 functional admin pages</li>
                <li>• Empathy Ledger integration (31 profiles, 35 transcripts)</li>
                <li>• 454 organizations mapped</li>
                <li>• 521 programs catalogued</li>
                <li>• 40,000+ words of documentation</li>
              </ul>
            </div>

            <div className="border-2 border-black p-6 bg-yellow-50">
              <h3 className="text-xl font-bold mb-4 text-orange-700">⚠️ Needed</h3>
              <ul className="space-y-2">
                <li>• Content expansion (50-100 programs)</li>
                <li>• Community activation (500-2,000 users)</li>
                <li>• Centre of Excellence development</li>
                <li>• Local place leadership model</li>
                <li>• Workshop & forum series</li>
                <li>• Sustainable funding secured</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Core Planning Areas */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">
            Five Core Elements
          </h2>

          <div className="space-y-8">
            {/* Project Management */}
            <div className="border-2 border-black p-6">
              <h3 className="text-2xl font-bold mb-4">1. Project Management</h3>
              <p className="text-gray-700 mb-4">
                Leadership, coordination, and governance with community-led approach
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Minimal</h4>
                  <p className="text-sm text-gray-600 mb-2">$30K/year</p>
                  <p className="text-sm">Part-time coordinator</p>
                </div>
                <div className="bg-blue-50 p-4 border-2 border-blue-600">
                  <h4 className="font-bold mb-2">Foundation ⭐</h4>
                  <p className="text-sm text-gray-600 mb-2">$120K/year</p>
                  <p className="text-sm">Core team with ED</p>
                </div>
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Mature</h4>
                  <p className="text-sm text-gray-600 mb-2">$220K/year</p>
                  <p className="text-sm">Full operations team</p>
                </div>
              </div>
            </div>

            {/* Content Development */}
            <div className="border-2 border-black p-6">
              <h3 className="text-2xl font-bold mb-4">2. Content Development</h3>
              <p className="text-gray-700 mb-4">
                Stories, research, and resources created WITH communities
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Basic</h4>
                  <p className="text-sm text-gray-600 mb-2">$50K/year</p>
                  <p className="text-sm">10-15 stories/year</p>
                </div>
                <div className="bg-blue-50 p-4 border-2 border-blue-600">
                  <h4 className="font-bold mb-2">Quality ⭐</h4>
                  <p className="text-sm text-gray-600 mb-2">$220K/year</p>
                  <p className="text-sm">50 stories + media</p>
                </div>
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Comprehensive</h4>
                  <p className="text-sm text-gray-600 mb-2">$450K/year</p>
                  <p className="text-sm">100+ pieces + video</p>
                </div>
              </div>
            </div>

            {/* Local Place Leadership */}
            <div className="border-2 border-black p-6">
              <h3 className="text-2xl font-bold mb-4">3. Local Place Leadership</h3>
              <p className="text-gray-700 mb-4">
                Community-led sites driving local transformation
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Not Started</h4>
                  <p className="text-sm text-gray-600 mb-2">$0</p>
                  <p className="text-sm">No sites</p>
                </div>
                <div className="bg-blue-50 p-4 border-2 border-blue-600">
                  <h4 className="font-bold mb-2">Pilot ⭐</h4>
                  <p className="text-sm text-gray-600 mb-2">$355K/year</p>
                  <p className="text-sm">4 demonstration sites</p>
                </div>
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Network</h4>
                  <p className="text-sm text-gray-600 mb-2">$1.34M/year</p>
                  <p className="text-sm">12 sites nationally</p>
                </div>
              </div>
            </div>

            {/* Workshops & Forums */}
            <div className="border-2 border-black p-6">
              <h3 className="text-2xl font-bold mb-4">4. Workshops & Forums</h3>
              <p className="text-gray-700 mb-4">
                Learning spaces and community of practice
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Online Only</h4>
                  <p className="text-sm text-gray-600 mb-2">$20K/year</p>
                  <p className="text-sm">Virtual events</p>
                </div>
                <div className="bg-blue-50 p-4 border-2 border-blue-600">
                  <h4 className="font-bold mb-2">Blended ⭐</h4>
                  <p className="text-sm text-gray-600 mb-2">$265K/year</p>
                  <p className="text-sm">6 in-person + virtual</p>
                </div>
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Comprehensive</h4>
                  <p className="text-sm text-gray-600 mb-2">$515K/year</p>
                  <p className="text-sm">National series + annual conference</p>
                </div>
              </div>
            </div>

            {/* Centre of Excellence */}
            <div className="border-2 border-black p-6">
              <h3 className="text-2xl font-bold mb-4">5. Centre of Excellence</h3>
              <p className="text-gray-700 mb-4">
                Knowledge hub for evidence and best practice
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">Basic</h4>
                  <p className="text-sm text-gray-600 mb-2">$90K/year</p>
                  <p className="text-sm">Framework only</p>
                </div>
                <div className="bg-blue-50 p-4 border-2 border-blue-600">
                  <h4 className="font-bold mb-2">Active Hub ⭐</h4>
                  <p className="text-sm text-gray-600 mb-2">$470K/year</p>
                  <p className="text-sm">50 programs + synthesis</p>
                </div>
                <div className="bg-gray-50 p-4">
                  <h4 className="font-bold mb-2">International</h4>
                  <p className="text-sm text-gray-600 mb-2">$1.08M/year</p>
                  <p className="text-sm">100+ programs + partnerships</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Budget Scenarios */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">
            Budget Scenarios
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-blue-600 p-6 bg-blue-50">
              <h3 className="text-2xl font-bold mb-4 text-blue-900">
                ⭐ Foundation Budget (Recommended)
              </h3>
              <p className="text-3xl font-bold mb-4">$960K Year 1</p>
              <ul className="space-y-2 mb-4">
                <li>• Core team (5-6 FTE)</li>
                <li>• Quality content development</li>
                <li>• 4 pilot local sites</li>
                <li>• Blended workshop program</li>
                <li>• Active Centre of Excellence</li>
              </ul>
              <p className="text-sm text-gray-700">
                This level provides enough resources to launch effectively while maintaining
                community-led approach and quality standards.
              </p>
            </div>

            <div className="border-2 border-black p-6">
              <h3 className="text-2xl font-bold mb-4">Comprehensive Budget</h3>
              <p className="text-3xl font-bold mb-4">$1.43M Year 1</p>
              <ul className="space-y-2 mb-4">
                <li>• Full operations team</li>
                <li>• Comprehensive content</li>
                <li>• 4 pilot sites + support</li>
                <li>• National workshop series</li>
                <li>• International CoE</li>
              </ul>
              <p className="text-sm text-gray-700">
                Maximum impact scenario with full implementation across all elements.
              </p>
            </div>
          </div>
        </section>

        {/* Philosophical Foundation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">
            Community-Led Philosophy
          </h2>

          <div className="bg-purple-50 border-2 border-purple-600 p-8">
            <p className="text-lg mb-6">
              <strong>Everything we build must be community-led.</strong> This isn't just a principle—it's how we work:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-3">Young People</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Co-creators, not subjects</li>
                  <li>• Paid for their expertise</li>
                  <li>• Control their stories</li>
                  <li>• Lead content development</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3">Local Communities</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Define their own priorities</li>
                  <li>• Lead local sites</li>
                  <li>• Set the agenda</li>
                  <li>• Own the solutions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3">Aboriginal Leadership</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Central, not peripheral</li>
                  <li>• Culturally safe practices</li>
                  <li>• Self-determination respected</li>
                  <li>• Community governance models</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3">Practitioners</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Sector-owned platform</li>
                  <li>• Practice-driven content</li>
                  <li>• Peer learning valued</li>
                  <li>• Bottom-up innovation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Full Documentation Links */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">
            Comprehensive Documentation
          </h2>

          <div className="space-y-4">
            <a
              href="/JUSTICEHUB_PLANNING.md"
              className="block border-2 border-black p-6 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">📄 JusticeHub Planning (25,000 words)</h3>
              <p className="text-gray-600">
                Complete strategic framework with detailed cost breakdowns, prioritization matrices,
                and community-led approach throughout all elements.
              </p>
            </a>

            <a
              href="/BUDGET_SUMMARY.md"
              className="block border-2 border-black p-6 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">💰 Budget Summary (5,000 words)</h3>
              <p className="text-gray-600">
                Quick reference for budget scenarios, 3-year projections, staffing models,
                and cost-per-impact calculations.
              </p>
            </a>

            <a
              href="/FUNDING_PITCH_TEMPLATES.md"
              className="block border-2 border-black p-6 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">🎯 Funding Pitch Templates (12,000 words)</h3>
              <p className="text-gray-600">
                Ready-to-adapt proposals for government agencies, foundations, corporate sponsors,
                and community foundations with budget justifications.
              </p>
            </a>
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">
            Impact Potential
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-2 border-black p-6 text-center">
              <p className="text-4xl font-bold mb-2">5,000+</p>
              <p className="text-sm text-gray-600">Youth justice workers to reach</p>
            </div>

            <div className="border-2 border-black p-6 text-center">
              <p className="text-4xl font-bold mb-2">25,000+</p>
              <p className="text-sm text-gray-600">Young people in system annually</p>
            </div>

            <div className="border-2 border-black p-6 text-center">
              <p className="text-4xl font-bold mb-2">100+</p>
              <p className="text-sm text-gray-600">Programs to document</p>
            </div>

            <div className="border-2 border-black p-6 text-center">
              <p className="text-4xl font-bold mb-2">$200</p>
              <p className="text-sm text-gray-600">Cost per worker trained (Foundation budget)</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
