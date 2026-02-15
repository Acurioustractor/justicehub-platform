'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, Shield, Activity, FileText, MapPin, ExternalLink } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

// Basecamp location type
interface BasecampLocation {
  slug: string;
  name: string;
  region: string;
  description: string;
  coordinates: { lat: number; lng: number };
  stats?: { label: string; value: string }[];
  image?: string;
}

// Fallback basecamp data (used if API fails or during initial load)
const FALLBACK_BASECAMPS: BasecampLocation[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    region: 'Central Australia (NT)',
    description: 'Cultural healing and deep listening on country. Supporting young Aboriginal people to stay strong in culture.',
    coordinates: { lat: -23.698, lng: 133.880 },
    stats: [
      { label: 'Reduced anti-social behavior', value: '95% reduced anti-social behavior' },
      { label: 'Return to education', value: '72% return to education' }
    ],
  },
  {
    slug: 'bg-fit',
    name: 'BG Fit',
    region: 'North West Queensland',
    description: 'Fitness-based youth engagement in Mount Isa. Using sport and discipline to redirect young people toward positive futures.',
    coordinates: { lat: -20.725, lng: 139.498 },
    stats: [
      { label: 'Diversion rate', value: '85% diversion rate' },
      { label: 'Youth engaged', value: '400+ youth engaged/year' }
    ],
  },
  {
    slug: 'mounty-yarns',
    name: 'Mounty Yarns',
    region: 'Western Sydney (NSW)',
    description: 'Youth-led storytelling and media production. Amplifying youth voices and challenging deficit narratives about Western Sydney.',
    coordinates: { lat: -33.770, lng: 150.820 },
    stats: [
      { label: 'Stories published', value: '150+ stories published' },
      { label: 'Into media careers', value: '30% into media careers' }
    ],
  },
  {
    slug: 'picc-townsville',
    name: 'PICC Townsville',
    region: 'North Queensland',
    description: 'Pacific Islander Community Council supporting Pasifika families through cultural connection and community strength.',
    coordinates: { lat: -19.26, lng: 146.82 },
    stats: [
      { label: 'Diversion success', value: '78% diversion success' },
      { label: 'Pacific languages', value: '12 Pacific languages' }
    ],
  }
];

export default function CentreOfExcellencePage() {
  const [basecamps, setBasecamps] = useState<BasecampLocation[]>(FALLBACK_BASECAMPS);

  useEffect(() => {
    async function loadBasecamps() {
      try {
        const res = await fetch('/api/basecamps');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Merge API data with fallback (API takes precedence)
            const merged = FALLBACK_BASECAMPS.map(fallback => {
              const fromApi = data.find((d: BasecampLocation) => d.slug === fallback.slug);
              return fromApi ? { ...fallback, ...fromApi } : fallback;
            });
            setBasecamps(merged);
          }
        }
      } catch (err) {
        console.error('Failed to load basecamps:', err);
      }
    }
    loadBasecamps();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="header-offset bg-gradient-to-br from-eucalyptus-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="inline-block px-4 py-2 bg-black text-white border-2 border-black mb-6">
              <span className="font-bold">CENTRE OF EXCELLENCE</span>
            </div>

            <h1 className="headline-truth mb-6">
              Australia's Hub for Youth Justice
            </h1>

            <p className="text-xl text-gray-700 max-w-4xl mb-8 leading-relaxed">
              Join the network proving what works. Access peer-reviewed research, connect with experts, and learn from international best practice. <span className="font-bold border-b-2 border-black">Community works better than detention.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="#basecamps" className="cta-primary">
                MEET THE BASECAMPS
              </Link>
              <Link href="/centre-of-excellence/research" className="cta-secondary">
                RESEARCH LIBRARY
              </Link>
              <Link href="/centre-of-excellence/people" className="cta-secondary">
                MEET THE EXPERTS
              </Link>
            </div>

            {/* Key Stats - Honest Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-black p-4 bg-white text-center">
                <div className="text-3xl font-black text-blue-600">27</div>
                <div className="text-sm font-bold">Research Items</div>
                <div className="text-xs text-gray-500">Peer-reviewed</div>
              </div>
              <div className="border-2 border-black p-4 bg-white text-center">
                <div className="text-3xl font-black text-green-600">4</div>
                <div className="text-sm font-bold">Australian Frameworks</div>
                <div className="text-xs text-gray-500">State models</div>
              </div>
              <div className="border-2 border-black p-4 bg-white text-center">
                <div className="text-3xl font-black text-purple-600">16</div>
                <div className="text-sm font-bold">International Models</div>
                <div className="text-xs text-gray-500">Global best practice</div>
              </div>
              <div className="border-2 border-black p-4 bg-white text-center">
                <div className="text-3xl font-black text-ochre-600">4</div>
                <div className="text-sm font-bold">Basecamp Partners</div>
                <div className="text-xs text-gray-500">Founding network</div>
              </div>
            </div>
          </div>
        </section>

        {/* Network Hubs - Basecamps (NOW AT TOP) */}
        <section id="basecamps" className="section-padding bg-ochre-50">
          <div className="container-justice">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <div className="inline-block px-4 py-2 bg-ochre-100 border-2 border-black mb-4">
                  <span className="font-bold">FOUNDING BASECAMPS</span>
                </div>
                <h2 className="headline-truth mb-2">
                  Meet the Basecamps
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl">
                  The 4 founding organizations anchoring the Centre of Excellence network. They hold local knowledge, launch initiatives, and ground our work in community.
                </p>
              </div>
              <Link
                href="/centre-of-excellence/map?category=basecamp"
                className="cta-secondary flex items-center gap-2 shrink-0"
              >
                <MapPin className="w-5 h-5" />
                VIEW ON MAP
              </Link>
            </div>

            {/* Basecamp Map Summary (stable fallback for local/dev) */}
            <div className="mb-8 border-2 border-black bg-white p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-xl font-black mb-2">Basecamp Footprint Snapshot</h3>
                  <p className="text-gray-600">
                    Explore the live interactive map from the dedicated map page.
                  </p>
                </div>
                <Link
                  href="/centre-of-excellence/map?category=basecamp"
                  className="cta-secondary flex items-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  OPEN INTERACTIVE MAP
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                {basecamps.map((basecamp) => (
                  <div
                    key={`map-summary-${basecamp.slug}`}
                    className="border border-black bg-gray-50 px-4 py-3"
                  >
                    <div className="font-bold text-black">{basecamp.name}</div>
                    <div className="text-sm text-gray-600">{basecamp.region}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {basecamp.coordinates.lat.toFixed(3)}, {basecamp.coordinates.lng.toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Basecamp Grid with Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {basecamps.map((basecamp) => (
                <Link
                  key={basecamp.slug}
                  href={`/organizations/${basecamp.slug}`}
                  className="border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group overflow-hidden"
                >
                  {/* Image Container */}
                  <div className="relative h-48 bg-gray-200 border-b-2 border-black overflow-hidden">
                    {basecamp.image ? (
                      <Image
                        src={basecamp.image}
                        alt={basecamp.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="absolute inset-0 bg-gradient-to-br from-ochre-100 to-ochre-200 flex items-center justify-center">
                              <span class="text-4xl font-black text-ochre-600">${basecamp.name.charAt(0)}</span>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-ochre-100 to-ochre-200 flex items-center justify-center">
                        <span className="text-4xl font-black text-ochre-600">{basecamp.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="inline-block px-2 py-1 bg-ochre-600 text-white text-xs font-bold uppercase tracking-wider mb-2">
                          Founding Basecamp
                        </div>
                        <div className="text-xs font-bold text-ochre-600 uppercase tracking-wider mb-1">{basecamp.region}</div>
                        <h3 className="text-2xl font-black">{basecamp.name}</h3>
                      </div>
                      <MapPin className="w-6 h-6 text-gray-400 group-hover:text-ochre-600 transition-colors" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      {basecamp.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {basecamp.stats?.map((stat, idx) => (
                        <span
                          key={idx}
                          className={`text-xs font-bold px-2 py-1 ${idx === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {stat.value}
                        </span>
                      ))}
                    </div>
                    <span className="font-bold text-ochre-600">View profile →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Expansion Note */}
            <div className="mt-8 p-6 bg-white border-2 border-black text-center">
              <p className="text-gray-600 mb-4">
                We're building the network. Interested in becoming a basecamp partner?
              </p>
              <Link href="/contact" className="font-bold text-ochre-600 hover:underline">
                Get in touch →
              </Link>
            </div>
          </div>
        </section>

        {/* The Opportunity - Brutalist Data */}
        <section id="mission" className="section-padding bg-black text-white">
          <div className="container-justice">
            <div className="border-2 border-white p-8 md:p-12 text-center max-w-4xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-4">
                Total Net Present Safety (NPS)
              </h2>
              <div className="font-mono text-6xl md:text-9xl font-bold mb-4">
                $1.1B
              </div>
              <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300">
                This is not a projection. This is the calculated economic value of 624+ verified community programs currently operating without adequate funding.
              </p>
            </div>
          </div>
        </section>

        {/* Global Map Preview */}
        <section className="section-padding bg-white">
          <div className="container-justice">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <h2 className="headline-truth max-w-2xl mb-2">
                  Global Excellence Map
                </h2>
                <p className="text-lg text-gray-600">
                  Explore 16 international models, 4 Australian frameworks, and key research sources
                </p>
              </div>
              <Link href="/centre-of-excellence/map" className="cta-primary flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                OPEN FULL MAP
              </Link>
            </div>

            {/* Map Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* International Models */}
              <Link
                href="/centre-of-excellence/map?category=international-model"
                className="border-2 border-black p-6 bg-purple-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
              >
                <Globe className="w-10 h-10 mb-4 text-purple-600" />
                <div className="text-4xl font-black text-purple-600 mb-2">16</div>
                <h3 className="text-xl font-bold mb-2">International Models</h3>
                <p className="text-gray-600 mb-4">
                  Spain, New Zealand, Finland, Scotland, Missouri and more
                </p>
                <span className="font-bold text-purple-600 flex items-center gap-1">
                  View on map <ExternalLink className="w-4 h-4" />
                </span>
              </Link>

              {/* Australian Frameworks */}
              <Link
                href="/centre-of-excellence/map?category=australian-framework"
                className="border-2 border-black p-6 bg-green-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
              >
                <MapPin className="w-10 h-10 mb-4 text-green-600" />
                <div className="text-4xl font-black text-green-600 mb-2">4</div>
                <h3 className="text-xl font-bold mb-2">Australian Frameworks</h3>
                <p className="text-gray-600 mb-4">
                  Queensland, NSW, Victoria, Western Australia
                </p>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  View on map <ExternalLink className="w-4 h-4" />
                </span>
              </Link>

              {/* Research Sources */}
              <Link
                href="/centre-of-excellence/map?category=research-source"
                className="border-2 border-black p-6 bg-blue-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
              >
                <FileText className="w-10 h-10 mb-4 text-blue-600" />
                <div className="text-4xl font-black text-blue-600 mb-2">5+</div>
                <h3 className="text-xl font-bold mb-2">Research Sources</h3>
                <p className="text-gray-600 mb-4">
                  Key institutions and evidence bases worldwide
                </p>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  View on map <ExternalLink className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* What You'll Find - Grid Layout */}
        <section id="network" className="section-padding border-t-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="headline-truth mb-6 text-center">
              What You'll Find Here
            </h2>
            <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
              Everything you need to understand, advocate for, and implement evidence-based youth justice
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Research */}
              <Link href="/centre-of-excellence/research" className="border-2 border-black bg-white p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <Globe className="w-12 h-12 mb-6 text-blue-600" />
                <h3 className="text-2xl font-bold mb-4 uppercase">Research Library</h3>
                <p className="mb-4 text-lg leading-relaxed text-gray-700">
                  27 peer-reviewed studies on trauma-informed care, Indigenous diversion, restorative justice, and more. Searchable, categorised, and growing.
                </p>
                <span className="font-bold text-blue-600 text-lg">
                  BROWSE RESEARCH →
                </span>
              </Link>

              {/* Best Practice */}
              <Link href="/centre-of-excellence/best-practice" className="border-2 border-black bg-white p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <Shield className="w-12 h-12 mb-6 text-green-600" />
                <h3 className="text-2xl font-bold mb-4 uppercase">Australian Frameworks</h3>
                <p className="mb-4 text-lg leading-relaxed text-gray-700">
                  Learn from Queensland, NSW, Victoria, and Western Australia. Each state's approach analysed with outcomes, strengths, and challenges.
                </p>
                <span className="font-bold text-green-600 text-lg">
                  EXPLORE FRAMEWORKS →
                </span>
              </Link>

              {/* Global */}
              <Link href="/centre-of-excellence/global-insights" className="border-2 border-black bg-white p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <Activity className="w-12 h-12 mb-6 text-purple-600" />
                <h3 className="text-2xl font-bold mb-4 uppercase">International Models</h3>
                <p className="mb-4 text-lg leading-relaxed text-gray-700">
                  16 global programs from Spain, New Zealand, Finland, Scotland, and more. See what recidivism rates are possible when you invest in community.
                </p>
                <span className="font-bold text-purple-600 text-lg">
                  VIEW GLOBAL →
                </span>
              </Link>

              {/* People */}
              <Link href="/centre-of-excellence/people" className="border-2 border-black bg-white p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                <FileText className="w-12 h-12 mb-6 text-ochre-600" />
                <h3 className="text-2xl font-bold mb-4 uppercase">Expert Network</h3>
                <p className="mb-4 text-lg leading-relaxed text-gray-700">
                  Connect with researchers, practitioners, and advocates. Our growing network includes Indigenous leaders, academics, and frontline workers.
                </p>
                <span className="font-bold text-ochre-600 text-lg">
                  MEET EXPERTS →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-6">
              Join the Network
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Whether you're a researcher, practitioner, funder, or community organisation — there's a place for you in Australia's youth justice centre of excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                GET INVOLVED
              </Link>
              <Link href="/stewards" className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
                BECOME A STEWARD
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
