'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Award, ArrowRight } from 'lucide-react';

interface CoEPerson {
  id: string;
  role_title: string;
  expertise_area: string;
  display_order: number;
  profile: {
    id: string;
    slug: string;
    full_name: string;
    tagline: string | null;
    photo_url: string | null;
    bio: string | null;
  };
}

export default function CoELeaders() {
  const [leaders, setLeaders] = useState<CoEPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaders() {
      try {
        const response = await fetch('/api/coe-leaders');
        if (response.ok) {
          const data = await response.json();
          setLeaders(data.leaders || []);
        }
      } catch (error) {
        console.error('Error loading CoE leaders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaders();
  }, []);

  if (loading) {
    return (
      <section className="section-padding bg-gradient-to-br from-green-50 via-eucalyptus-50 to-sand-50 border-t-2 border-b-2 border-black">
        <div className="container-justice">
          <div className="text-center text-gray-600">
            <div className="animate-pulse">Loading leadership team...</div>
          </div>
        </div>
      </section>
    );
  }

  if (leaders.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-gradient-to-br from-green-50 via-eucalyptus-50 to-sand-50 border-t-2 border-b-2 border-black">
      <div className="container-justice">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-700 mb-4">
            <Award className="h-5 w-5 text-green-700" />
            <span className="font-bold text-green-800 uppercase tracking-wider text-sm">
              Centre of Excellence
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Leadership Team
          </h2>

          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-4">
            Advocates, researchers, and community leaders driving youth justice reform across Australia.
          </p>
        </div>

        {/* Leaders Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          {leaders.map((leader) => (
            <Link
              key={leader.id}
              href={`/people/${leader.profile?.slug}`}
              className="group block no-underline"
            >
              <div className="border-2 border-black bg-white overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                {/* Photo */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-green-100 to-eucalyptus-100">
                  {leader.profile?.photo_url ? (
                    <Image
                      src={leader.profile.photo_url}
                      alt={leader.profile.full_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 16vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="h-12 w-12 text-green-300" />
                    </div>
                  )}
                </div>

                {/* Info - fixed height for consistency */}
                <div className="p-3 text-center h-24 flex flex-col justify-start">
                  <h3 className="font-bold text-sm leading-tight mb-1 group-hover:text-green-700 transition-colors">
                    {leader.profile?.full_name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {leader.role_title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/centre-of-excellence/people"
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all no-underline"
          >
            Meet the Full Team
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
