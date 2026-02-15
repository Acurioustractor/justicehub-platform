import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  FileText
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import ExcellenceMap from '@/components/ExcellenceMap';
import { researchSources } from '@/content/excellence-map-locations';
import ResearchLibrary from '@/components/coe/ResearchLibrary';

interface ResearchItem {
  id: string;
  title: string;
  authors: string[];
  organization: string;
  year: number;
  category: 'trauma-informed' | 'indigenous-diversion' | 'family-engagement' | 'restorative-justice' | 'youth-rights' | 'recidivism' | 'mental-health';
  jurisdiction: 'Australia' | 'Queensland' | 'New Zealand' | 'Scotland' | 'International' | 'Nordic';
  type: 'research-paper' | 'systematic-review' | 'meta-analysis' | 'policy-brief' | 'case-study' | 'video' | 'report';
  summary: string;
  keyFindings: string[];
  pdfUrl?: string;
  externalUrl?: string;
  videoUrl?: string;
  tags: string[];
  featured?: boolean;
}

async function getResearchItems(): Promise<ResearchItem[]> {
  const { data, error } = await supabase
    .from('research_items')
    .select('*')
    .eq('is_active', true)
    .order('year', { ascending: false });

  if (error) {
    console.error('Error fetching research items:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.slug,
    title: item.title,
    authors: item.authors || [],
    organization: item.organization,
    year: item.year,
    category: item.category,
    jurisdiction: item.jurisdiction,
    type: item.type,
    summary: item.summary,
    keyFindings: item.key_findings || [],
    pdfUrl: item.pdf_url,
    externalUrl: item.external_url,
    videoUrl: item.video_url,
    tags: item.tags || [],
    featured: item.is_featured,
  }));
}

export default async function ResearchLibraryPage() {
  const researchItems = await getResearchItems();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/centre-of-excellence"
              className="inline-flex items-center gap-2 font-bold text-gray-700 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Centre of Excellence
            </Link>

            <div className="inline-block px-4 py-2 bg-blue-100 border-2 border-black mb-6">
              <span className="font-bold">RESEARCH LIBRARY</span>
            </div>

            <h1 className="headline-truth mb-6">
              Research Library
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl mb-8 leading-relaxed">
              27 peer-reviewed studies on what works in youth justice. Trauma-informed care, Indigenous diversion, restorative justice, and more — searchable, categorised, and growing.
            </p>

            {/* Map Link */}
            <div className="mb-8">
              <Link
                href="/centre-of-excellence/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
              >
                <MapPin className="h-5 w-5" />
                View Research Sources on Global Map
              </Link>
            </div>

            {/* Research Sources Map */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Global Research Sources
              </h3>
              <p className="text-gray-700 mb-6">
                Major research institutions contributing to our evidence base. Click markers to learn more about each organization.
              </p>
              <ExcellenceMap
                locations={researchSources}
                height="450px"
                initialZoom={1.5}
                initialCenter={[25, 10]}
              />
            </div>
          </div>
        </section>

        {/* Research Library Component - handles filtering and display */}
        <ResearchLibrary initialItems={researchItems} />

        {/* CTA */}
        <section className="section-padding bg-gradient-to-br from-blue-400 to-purple-400 border-t-2 border-black">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-6 text-white">Contribute to Our Research Library</h2>
            <p className="text-xl text-white max-w-3xl mx-auto mb-8 leading-relaxed">
              Have research, case studies, or evidence-based frameworks to share? Help build Australia&apos;s most comprehensive youth justice evidence base.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Submit Research
              </Link>
              <Link
                href="/centre-of-excellence"
                className="px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Centre
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
