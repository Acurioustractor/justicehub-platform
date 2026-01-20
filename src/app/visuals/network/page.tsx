import { NetworkMap } from '@/components/visuals/NetworkMap';
import Link from 'next/link';

export default function NetworkMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/visuals" className="text-black hover:underline text-sm font-bold">
                ← Back to All Visuals
              </Link>
              <h1 className="text-4xl font-black text-black mt-2">
                The Network Effect
              </h1>
              <p className="text-gray-600 mt-2">
                How JusticeHub transforms isolated communities into a connected network
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <NetworkMap />

        {/* Context */}
        <div className="mt-12 bg-white p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black mb-4">What This Shows</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong className="text-gray-900">BEFORE:</strong> Communities work in isolation.
              Knowledge stays local. Alice Springs does not know what works in Bourke.
              Darwin cannot learn from Moree. Every community reinvents the wheel.
            </p>
            <p>
              <strong className="text-gray-900">AFTER:</strong> JusticeHub connects communities.
              Knowledge flows freely. Best practices scale. Communities learn from each other.
              Young people everywhere benefit from collective intelligence.
            </p>
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
              <p className="text-blue-900 font-medium">
                Real impact: When Alice Springs shares their healing circle program, practitioners
                in 10+ other communities can implement it, benefiting hundreds of young people.
              </p>
            </div>
          </div>
        </div>

        {/* Other Visuals */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Explore More Visuals</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/visuals/transformation"
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h4 className="font-bold text-lg mb-2">System Transformation</h4>
              <p className="text-gray-600 text-sm">
                How the youth justice system changes from punitive to healing
              </p>
            </Link>
            <Link
              href="/visuals/flow"
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Local to Scale</h4>
              <p className="text-gray-600 text-sm">
                How knowledge flows from local practice to national impact
              </p>
            </Link>
            <Link
              href="/visuals/connections"
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
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
