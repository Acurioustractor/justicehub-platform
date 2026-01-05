import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { BookOpen, ExternalLink, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getResearchStats() {
  const supabase = createServiceClient();

  const { count } = await supabase
    .from('alma_evidence')
    .select('*', { count: 'exact', head: true });

  return { total: count || 0 };
}

export default async function ResearchPage() {
  const stats = await getResearchStats();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-eucalyptus-50 via-sand-50 to-white py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-earth-600 mb-4">
            <Link href="/youth-justice-report" className="hover:text-ochre-600">Report</Link>
            <span>/</span>
            <span>Australian Research</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-eucalyptus-100 border-2 border-black">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Australian Research</h1>
              <p className="text-earth-600">Peer-reviewed studies and evaluations</p>
            </div>
          </div>

          <p className="text-lg text-earth-700 max-w-2xl">
            {stats.total} research papers, evaluations, and studies on youth justice interventions
            in Australia. Connected to ALMA&apos;s knowledge base for AI-powered search.
          </p>
        </div>
      </section>

      {/* Search and Content */}
      <section className="py-12">
        <div className="container-justice max-w-5xl">
          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
              <input
                type="text"
                placeholder="Search research papers, authors, topics..."
                className="w-full border-2 border-black px-12 py-4 text-lg focus:ring-2 focus:ring-ochre-500 focus:outline-none"
              />
            </div>
            <p className="text-sm text-earth-600 mt-2">
              Or use <Link href="/chat" className="text-ochre-600 font-medium hover:underline">ALMA Chat</Link> to ask questions about the research
            </p>
          </div>

          {/* Categories */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="border-2 border-black p-6 hover:bg-eucalyptus-50 transition-colors">
              <h3 className="text-xl font-bold mb-2">Diversion & Early Intervention</h3>
              <p className="text-earth-600 mb-4">Research on diversion programs and early intervention strategies</p>
              <Link href="/intelligence/evidence?category=diversion" className="text-sm font-bold text-ochre-600 hover:text-ochre-800">
                Browse Papers
              </Link>
            </div>

            <div className="border-2 border-black p-6 hover:bg-eucalyptus-50 transition-colors">
              <h3 className="text-xl font-bold mb-2">Indigenous-Led Programs</h3>
              <p className="text-earth-600 mb-4">Studies on culturally grounded, community-controlled approaches</p>
              <Link href="/intelligence/evidence?category=indigenous" className="text-sm font-bold text-ochre-600 hover:text-ochre-800">
                Browse Papers
              </Link>
            </div>

            <div className="border-2 border-black p-6 hover:bg-eucalyptus-50 transition-colors">
              <h3 className="text-xl font-bold mb-2">Detention & Recidivism</h3>
              <p className="text-earth-600 mb-4">Research on detention effectiveness and recidivism rates</p>
              <Link href="/intelligence/evidence?category=detention" className="text-sm font-bold text-ochre-600 hover:text-ochre-800">
                Browse Papers
              </Link>
            </div>
          </div>

          {/* Key Findings */}
          <div className="border-2 border-black p-8 bg-eucalyptus-50">
            <h2 className="text-2xl font-bold mb-6">Key Research Findings</h2>

            <div className="space-y-6">
              <div className="border-l-4 border-eucalyptus-500 pl-6">
                <h3 className="font-bold mb-2">Diversion reduces recidivism by 20-40%</h3>
                <p className="text-earth-600 text-sm">
                  Meta-analysis of Australian diversion programs shows consistent reduction in reoffending
                  compared to formal processing through courts.
                </p>
              </div>

              <div className="border-l-4 border-eucalyptus-500 pl-6">
                <h3 className="font-bold mb-2">Community-controlled programs show 2x engagement rates</h3>
                <p className="text-earth-600 text-sm">
                  Indigenous-led programs demonstrate significantly higher engagement and completion rates
                  compared to mainstream alternatives.
                </p>
              </div>

              <div className="border-l-4 border-eucalyptus-500 pl-6">
                <h3 className="font-bold mb-2">Early intervention is most cost-effective</h3>
                <p className="text-earth-600 text-sm">
                  Economic analyses show prevention and early intervention programs deliver $3-8 return
                  for every $1 invested.
                </p>
              </div>
            </div>
          </div>

          {/* Link to ALMA */}
          <div className="mt-8 text-center">
            <Link
              href="/intelligence/evidence"
              className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
            >
              Browse Full Evidence Database
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
