import { WikiSidebar } from '@/components/WikiSidebar';
import { Book, DollarSign, Settings, FileText, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WikiHomePage() {
  return (
    <div className="flex min-h-screen">
      <WikiSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              JusticeHub Wiki
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              Comprehensive strategic planning, budget frameworks, and platform documentation
              for transforming Australia's youth justice system.
            </p>
            <Link
              href="/wiki/site-overview"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Search className="w-5 h-5" />
              New? Start with Site Overview
            </Link>
          </div>

          {/* Featured: Sovereignty Flywheel - Interactive */}
          <div className="mb-12 grid md:grid-cols-2 gap-6">
            <Link
              href="/flywheel"
              className="block bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-xl text-white hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                🎯 Interactive Visual
              </div>
              <h2 className="text-3xl font-bold mb-3 group-hover:underline">
                The Sovereignty Flywheel
              </h2>
              <p className="text-blue-100 text-lg mb-4">
                See the live, interactive version! Hover over segments, explore the cycle,
                export as SVG/PNG. Built right into the platform.
              </p>
              <div className="flex items-center text-white/90">
                <span className="text-sm font-semibold">View Interactive Version</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            <Link
              href="/wiki/sovereignty-flywheel-visual"
              className="block bg-white border-2 border-purple-600 p-8 rounded-xl hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                📄 Documentation
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 group-hover:underline">
                Visual Specification
              </h2>
              <p className="text-gray-700 text-base mb-4">
                Complete design specification, concept explanation, and guide for creating
                your own version with AI tools.
              </p>
              <div className="flex items-center text-purple-600">
                <span className="text-sm font-semibold">Read Full Documentation</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-16">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">100K+</div>
              <div className="text-sm text-gray-600">Words of Documentation</div>
            </div>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <div className="text-3xl font-bold text-green-600 mb-2">15+</div>
              <div className="text-sm text-gray-600">Strategic Documents</div>
            </div>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
              <div className="text-sm text-gray-600">Budget Scenarios</div>
            </div>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">4</div>
              <div className="text-sm text-gray-600">Funding Templates</div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Strategic Planning */}
            <section className="bg-white p-8 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Book className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Strategic Planning</h2>
                  <p className="text-gray-600 mb-4">
                    Comprehensive frameworks for building a transformative youth justice platform,
                    including current state analysis, community-led approaches, and 3-year roadmaps.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/wiki/strategic-overview"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Strategic Overview
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/executive-summary"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Executive Summary
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/justicehub-planning"
                      className="flex items-center justify-between p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                        JusticeHub Planning (25K words) ⭐
                      </span>
                      <ArrowRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                    </Link>
                    <Link
                      href="/wiki/one-page-overview"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        One-Page Overview
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Budget & Funding */}
            <section className="bg-white p-8 rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Budget & Funding</h2>
                  <p className="text-gray-600 mb-4">
                    Comprehensive funding strategies, detailed budget scenarios, and ready-to-use pitch templates
                    for government, foundations, and corporate sponsors.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/wiki/three-scenarios-budget"
                      className="col-span-2 flex items-center justify-between p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors group border-2 border-blue-500"
                    >
                      <div>
                        <span className="text-base font-bold text-blue-900 group-hover:text-blue-950 block">
                          Three Budget Scenarios: LEAN/BASE/UPPER 🎯 NEW
                        </span>
                        <span className="text-sm text-blue-700">
                          Complete 3-year comparison ($5.9M - $17.6M) with clear tables and explanations
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-700 group-hover:text-blue-800" />
                    </Link>
                    <Link
                      href="/wiki/mindaroo-strategic-pitch"
                      className="col-span-2 flex items-center justify-between p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors group border-2 border-green-400"
                    >
                      <span className="text-base font-bold text-green-800 group-hover:text-green-900">
                        Mindaroo Strategic Pitch (15K words) ⭐
                      </span>
                      <ArrowRight className="w-5 h-5 text-green-700 group-hover:text-green-800" />
                    </Link>
                    <Link
                      href="/wiki/budget-summary"
                      className="flex items-center justify-between p-3 bg-green-50 rounded hover:bg-green-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-green-700 group-hover:text-green-800">
                        Budget Summary (5K words)
                      </span>
                      <ArrowRight className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                    </Link>
                    <Link
                      href="/wiki/funding-pitch-templates"
                      className="flex items-center justify-between p-3 bg-green-50 rounded hover:bg-green-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-green-700 group-hover:text-green-800">
                        Funding Pitch Templates (12K words)
                      </span>
                      <ArrowRight className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Platform Documentation */}
            <section className="bg-white p-8 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Platform Documentation</h2>
                  <p className="text-gray-600 mb-4">
                    Complete guides for managing the JusticeHub platform, including admin workflows,
                    content management, and system configuration.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Link
                      href="/wiki/admin-user-guide"
                      className="flex items-center justify-between p-3 bg-purple-50 rounded hover:bg-purple-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800">
                        User Guide
                      </span>
                      <ArrowRight className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                    </Link>
                    <Link
                      href="/wiki/admin-quick-start"
                      className="flex items-center justify-between p-3 bg-purple-50 rounded hover:bg-purple-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800">
                        Quick Start
                      </span>
                      <ArrowRight className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                    </Link>
                    <Link
                      href="/wiki/admin-routes-complete"
                      className="flex items-center justify-between p-3 bg-purple-50 rounded hover:bg-purple-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800">
                        Routes Complete
                      </span>
                      <ArrowRight className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Technical Documentation */}
            <section className="bg-white p-8 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Technical Documentation</h2>
                  <p className="text-gray-600 mb-4">
                    Implementation details, system architecture, and technical guides for developers
                    and technical stakeholders.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Link
                      href="/wiki/centre-of-excellence-complete"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                        Centre of Excellence
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                    </Link>
                    <Link
                      href="/wiki/empathy-ledger-full-integration"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                        Empathy Ledger
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                    </Link>
                    <Link
                      href="/wiki/auto-linking-complete"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
                        Auto-Linking
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Getting Started */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h3>
            <p className="text-gray-700 mb-6">
              New to JusticeHub planning? Start with these essential documents:
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Link
                href="/wiki/one-page-overview"
                className="bg-white p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="font-bold text-gray-900 mb-1">1. One-Page Overview</div>
                <div className="text-sm text-gray-600">Quick introduction (5 min read)</div>
              </Link>
              <Link
                href="/wiki/executive-summary"
                className="bg-white p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="font-bold text-gray-900 mb-1">2. Executive Summary</div>
                <div className="text-sm text-gray-600">Strategic overview (15 min read)</div>
              </Link>
              <Link
                href="/wiki/justicehub-planning"
                className="bg-white p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="font-bold text-gray-900 mb-1">3. Full Planning Doc</div>
                <div className="text-sm text-gray-600">Complete framework (60 min read)</div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
