import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  TrendingDown,
  Heart,
  Users,
  AlertCircle
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import ExcellenceMap from '@/components/ExcellenceMap';
import { australianFrameworks } from '@/content/excellence-map-locations';
import AustralianFrameworksList from '@/components/coe/AustralianFrameworksList';

interface Outcome {
  metric: string;
  value: string;
  context: string;
}

interface Resource {
  title: string;
  type: 'research' | 'policy' | 'report';
  url: string;
  description: string;
}

interface BestPracticeModel {
  id: string;
  name: string;
  state: string;
  tagline: string;
  overview: string;
  keyFeatures: string[];
  outcomes: Outcome[];
  strengths: string[];
  challenges: string[];
  resources: Resource[];
  color: string;
}

async function getAustralianFrameworks(): Promise<BestPracticeModel[]> {
  const { data, error } = await supabase
    .from('australian_frameworks')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching frameworks:', error);
    return [];
  }

  return data.map((framework: any) => ({
    id: framework.slug,
    name: framework.name,
    state: framework.state,
    tagline: framework.tagline,
    overview: framework.overview,
    keyFeatures: framework.key_features || [],
    outcomes: framework.outcomes || [],
    strengths: framework.strengths || [],
    challenges: framework.challenges || [],
    resources: framework.resources || [],
    color: framework.color,
  }));
}

export default async function BestPracticePage() {
  const frameworks = await getAustralianFrameworks();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-green-50 via-white to-blue-50 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/centre-of-excellence"
              className="inline-flex items-center gap-2 font-bold text-gray-700 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Centre of Excellence
            </Link>

            <div className="inline-block px-4 py-2 bg-green-100 border-2 border-black mb-6">
              <span className="font-bold">AUSTRALIAN BEST PRACTICE</span>
            </div>

            <h1 className="headline-truth mb-6">
              Australian Frameworks
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl mb-6 leading-relaxed">
              Learn from 4 Australian state frameworks. Queensland, NSW, Victoria, and Western Australia — each analysed with outcomes, strengths, challenges, and resources.
            </p>

            {/* Map Link */}
            <div className="mb-8">
              <Link
                href="/centre-of-excellence/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-all"
              >
                <MapPin className="h-5 w-5" />
                View Australian Frameworks on Map
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border-2 border-black p-6 bg-white text-center">
                <TrendingDown className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl font-bold mb-1">40%</div>
                <div className="text-sm text-gray-600">Custody reduction NSW Youth Koori Court</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Heart className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                <div className="text-3xl font-bold mb-1">MST/FFT</div>
                <div className="text-sm text-gray-600">Evidence-based therapy trials in Victoria</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-yellow-600" />
                <div className="text-3xl font-bold mb-1">$134M</div>
                <div className="text-sm text-gray-600">Queensland investment 2018-2023</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-600" />
                <div className="text-3xl font-bold mb-1">71%</div>
                <div className="text-sm text-gray-600">WA detention are Aboriginal (6% population)</div>
              </div>
            </div>

            {/* Australian Frameworks Map */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Australian State Frameworks
              </h3>
              <p className="text-gray-700 mb-6">
                See where these state-level approaches operate across Australia. Click markers for key outcomes and challenges.
              </p>
              <ExcellenceMap
                locations={australianFrameworks}
                height="450px"
                initialZoom={3.5}
                initialCenter={[133.7751, -26.2744]}
              />
            </div>
          </div>
        </section>

        {/* Australian Models */}
        <section className="section-padding">
          <div className="container-justice">
            <AustralianFrameworksList frameworks={frameworks} />
          </div>
        </section>

        {/* Related Resources Section */}
        <section className="section-padding border-t-2 border-black bg-sand-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4">Explore Related Resources</h2>
            <p className="text-lg text-gray-700 mb-8">
              Connect these frameworks to real programs and services operating across Australia.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/community-programs"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-eucalyptus-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Community Programs
                </div>
                <h3 className="text-xl font-bold mb-2">Local Programs</h3>
                <p className="text-gray-600 mb-4">
                  Discover community-led programs implementing these frameworks in your state.
                </p>
                <span className="text-eucalyptus-600 font-bold inline-flex items-center gap-1">
                  Browse Programs <span className="ml-1">→</span>
                </span>
              </Link>

              <Link
                href="/services"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-ochre-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Service Finder
                </div>
                <h3 className="text-xl font-bold mb-2">Support Services</h3>
                <p className="text-gray-600 mb-4">
                  Find legal, health, and support services connected to youth justice in your area.
                </p>
                <span className="text-ochre-600 font-bold inline-flex items-center gap-1">
                  Find Services <span className="ml-1">→</span>
                </span>
              </Link>

              <Link
                href="/youth-justice-report/interventions"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">
                  ALMA Evidence
                </div>
                <h3 className="text-xl font-bold mb-2">Rated Interventions</h3>
                <p className="text-gray-600 mb-4">
                  See how specific interventions are rated by our evidence analysis system.
                </p>
                <span className="text-blue-600 font-bold inline-flex items-center gap-1">
                  View Evidence <span className="ml-1">→</span>
                </span>
              </Link>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <Link
                href="/centre-of-excellence/global-insights"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-purple-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Global Insights
                </div>
                <h3 className="text-xl font-bold mb-2">International Models</h3>
                <p className="text-gray-600 mb-4">
                  Compare Australian approaches with successful models from around the world.
                </p>
                <span className="text-purple-600 font-bold inline-flex items-center gap-1">
                  Explore Global <span className="ml-1">→</span>
                </span>
              </Link>

              <Link
                href="/network"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-green-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Network
                </div>
                <h3 className="text-xl font-bold mb-2">JusticeHub Nodes</h3>
                <p className="text-gray-600 mb-4">
                  Connect with state-based nodes coordinating reform efforts across Australia.
                </p>
                <span className="text-green-600 font-bold inline-flex items-center gap-1">
                  View Network <span className="ml-1">→</span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-gradient-to-br from-green-400 to-blue-400 border-t-2 border-black">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-6 text-white">Contribute Australian Research</h2>
            <p className="text-xl text-white max-w-3xl mx-auto mb-8 leading-relaxed">
              Know of other Australian state or territory programs making a difference? Help build our comprehensive evidence base of what works across Australia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                Submit Research
              </Link>
              <Link
                href="/centre-of-excellence/research"
                className="px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all inline-flex items-center justify-center gap-2"
              >
                Browse Full Library
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
