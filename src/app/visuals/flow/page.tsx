import { LocalToScale } from '@/components/visuals/LocalToScale';
import Link from 'next/link';

export default function FlowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/visuals" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to All Visuals
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">
                Local to National Scale
              </h1>
              <p className="text-gray-600 mt-2">
                How community intelligence flows from local practice to national impact
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LocalToScale />

        {/* Context */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What This Shows</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong className="text-gray-900">STEP 1 - LOCAL (Yellow):</strong> An Elder in Alice Springs
              develops a healing circle program. 12 young people supported, 0 return to detention.
              This is incredible, but knowledge stays local. Only 12 young people benefit.
            </p>
            <p>
              <strong className="text-gray-900">STEP 2 - PLATFORM (Blue):</strong> JusticeHub captures
              the story, tags the program, records the evidence. The platform creates connections to
              similar communities, interested practitioners, researchers, and funders. Knowledge becomes
              discoverable and shareable.
            </p>
            <p>
              <strong className="text-gray-900">STEP 3 - SCALE (Green):</strong> A practitioner in Sydney
              finds the program, adapts it with local community input, implements the same healing approach.
              Now hundreds of young people benefit from one Elder's wisdom in Alice Springs.
            </p>
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
              <p className="text-yellow-900 font-medium">
                <strong>The Multiplier Effect:</strong> Without JusticeHub, 12 young people benefit.
                With JusticeHub, thousands of young people benefit. Communities get compensated.
                Elders are valued. Knowledge scales nationally while staying culturally grounded.
              </p>
            </div>
          </div>
        </div>

        {/* Other Visuals */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Explore More Visuals</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/visuals/network"
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-lg transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Network Effect</h4>
              <p className="text-gray-600 text-sm">
                How isolated communities transform into a connected network
              </p>
            </Link>
            <Link
              href="/visuals/transformation"
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-lg transition-all"
            >
              <h4 className="font-bold text-lg mb-2">System Transformation</h4>
              <p className="text-gray-600 text-sm">
                How the youth justice system changes from punitive to healing
              </p>
            </Link>
            <Link
              href="/visuals/connections"
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-lg transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Connection Web</h4>
              <p className="text-gray-600 text-sm">
                How all stakeholders connect through the platform
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
