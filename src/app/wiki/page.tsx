import { WikiSidebar } from '@/components/WikiSidebar';
import { Book, DollarSign, Settings, FileText, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WikiHomePage() {
  return (
    <div className="flex min-h-screen">
      <WikiSidebar />

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              JusticeHub Wiki
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Strategic planning, budget frameworks, and platform documentation
              for transforming Australia's youth justice system.
            </p>
          </div>

          {/* FEATURED: Mindaroo Foundation Pitch Package */}
          <section className="mb-8 bg-white p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-6">
              <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm font-semibold mb-3">
                🎯 FEATURED PITCH PACKAGE
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Mindaroo Foundation Pitch</h2>
              <p className="text-gray-700 text-base mb-4 leading-relaxed">
                Complete strategic pitch package with interactive budget scenarios, research evidence,
                and implementation roadmap. 5 comprehensive documents ready for presentation.
              </p>
              <Link
                href="/wiki/mindaroo-pitch"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold transition-colors text-sm"
              >
                View Complete Pitch Package
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Link
                href="/wiki/mindaroo-pitch/one-pager"
                className="bg-gray-50 hover:bg-gray-100 p-5 rounded border border-gray-200 transition-colors"
              >
                <div className="text-2xl mb-2">📄</div>
                <div className="font-bold text-base mb-1 text-gray-900">One-Page Pitch</div>
                <div className="text-sm text-gray-600">5-minute executive summary</div>
              </Link>

              <Link
                href="/wiki/mindaroo-pitch/budget-breakdown"
                className="bg-gray-50 hover:bg-gray-100 p-5 rounded border border-gray-200 transition-colors"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-bold text-base mb-1 text-gray-900">Budget Breakdown</div>
                <div className="text-sm text-gray-600">LEAN/BASE/UPPER scenarios</div>
              </Link>

              <Link
                href="/wiki/mindaroo-pitch/sovereignty-flywheel"
                className="bg-gray-50 hover:bg-gray-100 p-5 rounded border border-gray-200 transition-colors"
              >
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-bold text-base mb-1 text-gray-900">Sovereignty Flywheel</div>
                <div className="text-sm text-gray-600">Core visual + prompts</div>
              </Link>
            </div>

            <div className="mt-6 p-5 bg-gray-50 rounded border border-gray-200">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">$10.5M</div>
                  <div className="text-xs text-gray-600">The Ask (BASE)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">6</div>
                  <div className="text-xs text-gray-600">Partner Communities</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">15-20</div>
                  <div className="text-xs text-gray-600">Members Trained</div>
                </div>
              </div>
            </div>
          </section>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Strategic Planning */}
            <section className="bg-white p-6 border-2 border-black">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-50 p-2 rounded">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Strategic Planning</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive frameworks for building a transformative youth justice platform.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/wiki/strategic-overview"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Strategic Overview
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/executive-summary"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Executive Summary
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/justicehub-planning"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        JusticeHub Planning (25K words)
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/one-page-overview"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
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
            <section className="bg-white p-6 border-2 border-black">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-50 p-2 rounded">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Budget & Funding</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Funding strategies and budget scenarios for government, foundations, and corporate sponsors.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/wiki/three-scenarios-budget"
                      className="col-span-2 flex items-center justify-between p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                        Three Budget Scenarios: LEAN/BASE/UPPER
                      </span>
                      <ArrowRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                    </Link>
                    <Link
                      href="/wiki/mindaroo-strategic-pitch"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Mindaroo Strategic Pitch
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/budget-summary"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Budget Summary
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Platform Documentation */}
            <section className="bg-white p-6 border-2 border-black">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-50 p-2 rounded">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Platform Documentation</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Guides for managing the platform, admin workflows, and content management.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/wiki/admin-user-guide"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        User Guide
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/admin-quick-start"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Quick Start
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/admin-routes-complete"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Routes Complete
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Technical Documentation */}
            <section className="bg-white p-6 border-2 border-black">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-50 p-2 rounded">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Technical Documentation</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Implementation details and system architecture.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/wiki/centre-of-excellence-complete"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Centre of Excellence
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/empathy-ledger-full-integration"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Empathy Ledger
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <Link
                      href="/wiki/auto-linking-complete"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        Auto-Linking
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Getting Started */}
          <div className="mt-8 bg-white p-6 border-2 border-black">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Getting Started</h3>
            <p className="text-sm text-gray-600 mb-4">
              New to JusticeHub planning? Start with these essential documents:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/wiki/one-page-overview"
                className="bg-gray-50 p-4 rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-bold text-sm text-gray-900 mb-1">1. One-Page Overview</div>
                <div className="text-xs text-gray-600">Quick introduction (5 min)</div>
              </Link>
              <Link
                href="/wiki/executive-summary"
                className="bg-gray-50 p-4 rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-bold text-sm text-gray-900 mb-1">2. Executive Summary</div>
                <div className="text-xs text-gray-600">Strategic overview (15 min)</div>
              </Link>
              <Link
                href="/wiki/justicehub-planning"
                className="bg-gray-50 p-4 rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-bold text-sm text-gray-900 mb-1">3. Full Planning Doc</div>
                <div className="text-xs text-gray-600">Complete framework (60 min)</div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
