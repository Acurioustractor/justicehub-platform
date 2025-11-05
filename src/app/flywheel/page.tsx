import { SovereigntyFlywheel } from '@/components/SovereigntyFlywheel';
import Link from 'next/link';

export default function FlywheelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to Homepage
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">
                The Sovereignty Flywheel
              </h1>
              <p className="text-gray-600 mt-2">
                An interactive visualization showing how JusticeHub creates inevitable momentum toward community sovereignty
              </p>
            </div>
            <Link
              href="/wiki/sovereignty-flywheel-visual"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SovereigntyFlywheel />

        {/* Additional Context */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {/* How It Works */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How the Flywheel Works</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong className="text-gray-900">A flywheel is a self-reinforcing cycle</strong> where each step
                makes the next step easier and more effective. For JusticeHub, this means:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>More community engagement → Better content → Greater trust</li>
                <li>Greater trust → More communities join → More economic value</li>
                <li>More economic value → Indigenous developers hired → Community ownership</li>
                <li>Community ownership → More engagement (cycle continues)</li>
              </ul>
              <p className="text-sm text-gray-600 italic mt-4">
                Unlike linear programs that end when funding stops, flywheels build momentum that becomes
                self-sustaining.
              </p>
            </div>
          </div>

          {/* Why This Matters */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why This Visual Matters</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong className="text-gray-900">Traditional pitch decks show linear roadmaps.</strong> But
                community sovereignty isn't a straight line—it's a reinforcing cycle.
              </p>
              <p>This visual demonstrates:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Interconnection:</strong> Every part strengthens every other part</li>
                <li><strong>Inevitability:</strong> Once started, momentum builds naturally</li>
                <li><strong>Sustainability:</strong> The cycle becomes self-reinforcing</li>
                <li><strong>Clarity:</strong> Funders see how investment creates lasting change</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Links to Related Content */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Explore More</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/wiki/three-scenarios-budget"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-6 transition-all"
            >
              <h3 className="font-bold text-lg mb-2">📊 Budget Scenarios</h3>
              <p className="text-blue-100 text-sm">
                See how LEAN, BASE, and UPPER budgets all create the same flywheel effect
              </p>
            </Link>
            <Link
              href="/wiki/mindaroo-strategic-pitch"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-6 transition-all"
            >
              <h3 className="font-bold text-lg mb-2">📄 Strategic Pitch</h3>
              <p className="text-blue-100 text-sm">
                Complete pitch document for Mindaroo Foundation with full context
              </p>
            </Link>
            <Link
              href="/wiki/design-tools-guide"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-6 transition-all"
            >
              <h3 className="font-bold text-lg mb-2">🎨 Design Tools</h3>
              <p className="text-blue-100 text-sm">
                Create your own version using AI tools like Napkin AI or Canva
              </p>
            </Link>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-8 bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Technical Details</h3>
          <p className="text-sm text-gray-600">
            This interactive visual is built with React and SVG, rendered at{' '}
            <code className="bg-gray-200 px-2 py-1 rounded text-xs">
              /src/components/SovereigntyFlywheel.tsx
            </code>
            . Export functionality allows you to download as SVG (vector, scalable) or PNG (raster, presentation-ready).
            The visualization is fully responsive and accessible.
          </p>
        </div>
      </main>
    </div>
  );
}
