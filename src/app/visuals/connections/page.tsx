import { ConnectionWeb } from '@/components/visuals/ConnectionWeb';
import Link from 'next/link';

export default function ConnectionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/visuals" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to All Visuals
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">
                The Connection Web
              </h1>
              <p className="text-gray-600 mt-2">
                How JusticeHub breaks down silos and connects everyone who cares about young people
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ConnectionWeb />

        {/* Context */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What This Shows</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong className="text-gray-900">The Problem:</strong> Youth justice operates in silos.
              Young people and families feel alone. Practitioners cannot learn from each other. Researchers
              lack access to community knowledge. Policy makers make decisions without evidence.
              Everyone wants to help, but nobody can see the whole picture.
            </p>
            <p>
              <strong className="text-gray-900">The Solution:</strong> JusticeHub sits at the center,
              connecting everyone. Each stakeholder group has direct access to the platform:
            </p>
            <ul className="space-y-2 list-disc list-inside ml-4">
              <li><strong>Young People:</strong> Find hope, see possibilities, understand options</li>
              <li><strong>Families:</strong> Stay connected, get support, navigate the system</li>
              <li><strong>Communities:</strong> Share knowledge, get compensated, build capacity</li>
              <li><strong>Practitioners:</strong> Learn best practice, improve outcomes, reduce harm</li>
              <li><strong>Researchers:</strong> Access evidence, validate programs, inform policy</li>
              <li><strong>Policy Makers:</strong> Use data, make informed decisions, transform systems</li>
            </ul>
            <p>
              <strong className="text-gray-900">The Impact:</strong> Transparency creates trust.
              Connections create collaboration. Knowledge creates power. Everyone sees the same information.
              Everyone works toward the same goal: better outcomes for young people.
            </p>
            <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
              <p className="text-purple-900 font-medium">
                Real impact: A young person in Dubbo can see that other young people like them have succeeded
                in community programs. Their family can connect with other families who have navigated the system.
                Their local practitioner can learn from best practice nationwide. Policy makers can see what actually
                works in communities. Everyone benefits from shared understanding.
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
              href="/visuals/flow"
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-lg transition-all"
            >
              <h4 className="font-bold text-lg mb-2">Local to Scale</h4>
              <p className="text-gray-600 text-sm">
                How knowledge flows from local practice to national impact
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
