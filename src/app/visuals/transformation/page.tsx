import { SystemTransformation } from '@/components/visuals/SystemTransformation';
import Link from 'next/link';

export default function TransformationPage() {
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
                System Transformation
              </h1>
              <p className="text-gray-600 mt-2">
                How JusticeHub transforms the youth justice system from punitive to healing
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SystemTransformation />

        {/* Context */}
        <div className="mt-12 bg-white p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black mb-4">What This Shows</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong className="text-gray-900">OLD SYSTEM (Red):</strong> Punitive approach.
              Young person struggles → Detention → Family cut off → 75% return to system.
              The cycle repeats. Communities lose their children. Trauma compounds.
            </p>
            <p>
              <strong className="text-gray-900">NEW SYSTEM (Green):</strong> Healing approach.
              Early identification → Community response → Cultural connection → Family engaged → Better outcomes.
              Young people stay connected to culture, family, country.
            </p>
            <p>
              <strong className="text-gray-900">THE CATALYST (Blue):</strong> JusticeHub sits in the middle.
              38+ stories, 521 programs, 450+ organisations. The platform provides the evidence,
              connections, and community intelligence needed for transformation.
            </p>
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-600 rounded">
              <p className="text-green-900 font-medium">
                Real impact: Instead of detention costing $500,000+ per year and creating trauma,
                community programs cost $20,000 per year and create healing. Young people thrive.
                Families stay together. Communities get stronger.
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
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Network Effect</h4>
              <p className="text-gray-600 text-sm">
                How isolated communities transform into a connected network
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
