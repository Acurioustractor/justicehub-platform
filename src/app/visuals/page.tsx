import Link from 'next/link';

export default function VisualsIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <Link href="/" className="text-black hover:underline text-sm font-bold">
              ← Back to Homepage
            </Link>
            <h1 className="text-4xl font-black text-black mt-2">
              Impact Visualisations
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Professional visuals showing how JusticeHub transforms the youth justice system
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="bg-white p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-12">
          <h2 className="text-2xl font-black text-black mb-4">Why These Visuals Matter</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              These visualisations show the <strong>real impact</strong> of JusticeHub - not abstract concepts,
              but concrete transformation:
            </p>
            <ul className="space-y-2 list-disc list-inside ml-4">
              <li>How isolated communities become a connected network</li>
              <li>How the youth justice system transforms from punitive to healing</li>
              <li>How local knowledge scales to create national impact</li>
              <li>How all stakeholders connect through shared understanding</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              All visuals are built with professional SVG graphics, are fully responsive,
              and can be exported for presentations and pitch documents.
            </p>
          </div>
        </div>

        {/* Visual Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Visual 1: Network Effect */}
          <Link
            href="/visuals/network"
            className="group bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden"
          >
            <div className="bg-gradient-to-br from-red-100 to-green-100 p-8">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500 opacity-30 mx-auto mb-2"></div>
                  <div className="w-16 h-16 rounded-full bg-red-500 opacity-30 mx-auto mb-2"></div>
                  <div className="w-16 h-16 rounded-full bg-red-500 opacity-30 mx-auto"></div>
                  <p className="text-xs font-bold text-red-600 mt-2">ISOLATED</p>
                </div>
                <div className="text-4xl text-gray-400">→</div>
                <div className="text-center relative">
                  <div className="w-20 h-20 rounded-full bg-blue-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500 opacity-80"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="w-12 h-12 rounded-full bg-green-500 opacity-80"></div>
                    <div className="w-12 h-12 rounded-full bg-green-500 opacity-80"></div>
                    <div className="w-12 h-12 rounded-full bg-green-500 opacity-80"></div>
                    <div className="w-12 h-12 rounded-full bg-green-500 opacity-80"></div>
                  </div>
                  <p className="text-xs font-bold text-green-600 mt-2">CONNECTED</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                1. Network Effect
              </h3>
              <p className="text-gray-600 mb-4">
                How isolated communities transform into a connected network through JusticeHub
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-red-600 transition-colors">
                View Visual
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Visual 2: System Transformation */}
          <Link
            href="/visuals/transformation"
            className="group bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden"
          >
            <div className="bg-gradient-to-br from-red-100 to-green-100 p-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-24 h-8 bg-red-500 opacity-30 rounded"></div>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-red-600 mt-2">OLD SYSTEM</p>
                </div>
                <div>
                  <div className="w-16 h-16 rounded-full bg-blue-600 mb-2"></div>
                  <p className="text-xs font-bold text-blue-600">JH</p>
                </div>
                <div className="text-center">
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-24 h-8 bg-green-500 opacity-80 rounded"></div>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-green-600 mt-2">NEW SYSTEM</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                2. System Transformation
              </h3>
              <p className="text-gray-600 mb-4">
                How the youth justice system transforms from punitive detention to community healing
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-green-600 transition-colors">
                View Visual
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Visual 3: Local to Scale */}
          <Link
            href="/visuals/flow"
            className="group bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden"
          >
            <div className="bg-gradient-to-r from-yellow-100 via-blue-100 to-green-100 p-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="w-20 h-28 bg-yellow-500 opacity-40 "></div>
                  <p className="text-xs font-bold text-yellow-600 mt-2">LOCAL</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="w-20 h-28 bg-blue-500 opacity-60 "></div>
                  <p className="text-xs font-bold text-blue-600 mt-2">PLATFORM</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="w-20 h-28 bg-green-500 opacity-80 "></div>
                  <p className="text-xs font-bold text-green-600 mt-2">SCALE</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                3. Local to Scale
              </h3>
              <p className="text-gray-600 mb-4">
                How community intelligence flows from local practice to create national impact
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-yellow-600 transition-colors">
                View Visual
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Visual 4: Connection Web */}
          <Link
            href="/visuals/connections"
            className="group bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden"
          >
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8">
              <div className="flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-full bg-blue-600 z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-purple-300 opacity-50"></div>
                </div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-red-500 opacity-60"></div>
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-orange-500 opacity-60"></div>
                </div>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-12 h-12 rounded-full bg-yellow-500 opacity-60"></div>
                </div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-12 h-12 rounded-full bg-green-500 opacity-60"></div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                4. Connection Web
              </h3>
              <p className="text-gray-600 mb-4">
                How JusticeHub breaks down silos and connects all stakeholders through shared understanding
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-purple-600 transition-colors">
                View Visual
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Using These Visuals */}
        <div className="mt-12 bg-black p-8 text-white border-2 border-black">
          <h2 className="text-2xl font-bold mb-4">Using These Visuals</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2">For Presentations</h3>
              <p className="text-blue-100 text-sm">
                Each visual can be exported as high-resolution PNG or SVG for use in pitch decks,
                funding proposals, and stakeholder presentations.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">For Documentation</h3>
              <p className="text-blue-100 text-sm">
                Screenshots and exports can be included in strategic documents, annual reports,
                and impact assessments to communicate transformation clearly.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">For Funders</h3>
              <p className="text-blue-100 text-sm">
                Show potential funders exactly how investment creates systemic change, not just
                abstract concepts but concrete transformation pathways.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">For Communities</h3>
              <p className="text-blue-100 text-sm">
                Help communities understand how their knowledge contributes to national impact
                and how they benefit from network connections.
              </p>
            </div>
          </div>
        </div>

        {/* Related Resources */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Related Resources</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/wiki/mindaroo-strategic-pitch"
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Strategic Pitch Document</h4>
              <p className="text-gray-600 text-sm">
                Complete pitch for Mindaroo Foundation with full strategic context
              </p>
            </Link>
            <Link
              href="/wiki/three-scenarios-budget"
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Budget Scenarios</h4>
              <p className="text-gray-600 text-sm">
                LEAN, BASE, and UPPER budget scenarios for different funding levels
              </p>
            </Link>
            <Link
              href="/wiki/design-tools-guide"
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Design Tools Guide</h4>
              <p className="text-gray-600 text-sm">
                Professional tools and AI platforms for creating custom visuals
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
