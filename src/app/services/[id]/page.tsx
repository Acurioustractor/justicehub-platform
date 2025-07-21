'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft,
  MapPin, 
  Users, 
  DollarSign,
  Target,
  Phone,
  Mail,
  Globe,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface ServiceDetail {
  id: string;
  name: string;
  organization: string;
  location: string;
  state: string;
  description: string;
  full_description: string;
  category: string;
  age_range: string;
  success_rate?: number;
  cost_per_year?: number;
  participants_served?: number;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  photos: Array<{
    id: string;
    url: string;
    caption: string;
  }>;
  tags: string[];
  is_featured: boolean;
  impact_stories: Array<{
    quote: string;
    author: string;
  }>;
  outcomes: string[];
  eligibility: string[];
}

export default function ServiceDetailPage() {
  const params = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - will be replaced with Supabase query
    const mockService: ServiceDetail = {
      id: params.id as string,
      name: 'BackTrack Youth Works',
      organization: 'BackTrack',
      location: 'Armidale',
      state: 'NSW',
      description: 'Intensive mentoring program using vocational training, animal therapy, and community engagement.',
      full_description: `BackTrack Youth Works transforms the lives of young people who have disengaged from education, 
      employment, and community. Through innovative programs combining vocational training, animal therapy, and intensive 
      mentoring, we create pathways to success for youth who have been written off by traditional systems.
      
      Our approach is simple: we meet young people where they are, build genuine relationships, and provide practical 
      skills that lead to real employment. From welding and construction to working with rescue dogs, every activity 
      is designed to build confidence, responsibility, and hope.`,
      category: 'Mentorship & Training',
      age_range: '12-18',
      success_rate: 87,
      cost_per_year: 58000,
      participants_served: 150,
      contact_phone: '02 6772 1234',
      contact_email: 'info@backtrack.org.au',
      website: 'https://backtrack.org.au',
      photos: [
        { id: '1', url: '/api/placeholder/800/600', caption: 'Youth working with rescue dogs' },
        { id: '2', url: '/api/placeholder/800/600', caption: 'Welding workshop in action' },
        { id: '3', url: '/api/placeholder/800/600', caption: 'Community project completion' },
        { id: '4', url: '/api/placeholder/800/600', caption: 'Mentorship session' }
      ],
      tags: ['mentorship', 'vocational', 'dogs', 'welding', 'construction'],
      is_featured: true,
      impact_stories: [
        {
          quote: "BackTrack saved my life. I went from sleeping rough to having a trade and a future.",
          author: "Jake, 17"
        },
        {
          quote: "My son found purpose here when nowhere else would give him a chance.",
          author: "Sarah, Parent"
        }
      ],
      outcomes: [
        '87% of participants do not reoffend',
        '92% gain employment or return to education',
        '100% report improved self-confidence',
        '85% maintain stable housing after 12 months'
      ],
      eligibility: [
        'Ages 12-18 years',
        'Disengaged from mainstream education',
        'Referred by youth justice, schools, or self-referral',
        'Willing to participate in hands-on activities'
      ]
    };

    setService(mockService);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="font-mono">Loading service details...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Service not found</h2>
          <Link href="/services" className="cta-secondary">
            BACK TO SERVICES
          </Link>
        </div>
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % service.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + service.photos.length) % service.photos.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white z-50 border-b-2 border-black">
        <div className="container-justice py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-bold text-xl tracking-tight">
              JUSTICEHUB
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/grassroots" className="font-medium hover:underline">
                Grassroots
              </Link>
              <Link href="/services" className="font-medium hover:underline">
                Services
              </Link>
              <Link href="/gallery" className="font-medium hover:underline">
                Gallery
              </Link>
              <Link href="/dashboard/youth" className="cta-primary">
                START HERE
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Back Navigation */}
      <section className="pt-24 pb-4 border-b border-gray-300">
        <div className="container-justice">
          <Link href="/services" className="inline-flex items-center gap-2 font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </Link>
        </div>
      </section>

      {/* Service Header */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <span className="text-sm font-bold bg-black text-white px-2 py-1">
                  {service.category}
                </span>
              </div>
              <h1 className="headline-truth mb-4">{service.name}</h1>
              <p className="text-xl mb-2">{service.organization}</p>
              <p className="text-lg flex items-center gap-2 mb-6">
                <MapPin className="h-5 w-5" />
                {service.location}, {service.state}
              </p>
              <p className="text-xl leading-relaxed">{service.description}</p>
            </div>

            <div className="space-y-6">
              {service.success_rate && (
                <div className="data-card text-center">
                  <div className="font-mono text-6xl font-bold mb-2">{service.success_rate}%</div>
                  <p className="text-lg">Success Rate</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="font-bold">Age Range</p>
                  <p>{service.age_range} years</p>
                </div>
                <div>
                  <p className="font-bold">Annual Cost</p>
                  <p className="font-mono">${service.cost_per_year?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-bold">Youth Served</p>
                  <p className="font-mono">{service.participants_served}+ annually</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      {service.photos.length > 0 && (
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-8">PROGRAM IN ACTION</h2>
            
            <div className="relative">
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-2xl text-gray-500">PHOTO</span>
                </div>
                
                {/* Navigation */}
                {service.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
              
              <p className="mt-4 text-center">
                <span className="font-bold">{currentPhotoIndex + 1} / {service.photos.length}:</span> {service.photos[currentPhotoIndex].caption}
              </p>
            </div>
            
            <div className="text-center mt-6">
              <Link href="/gallery" className="font-bold underline">
                View more photos in gallery →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Full Description */}
      <section className="section-padding">
        <div className="container-justice">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold mb-6">ABOUT THE PROGRAM</h2>
              <div className="prose prose-lg max-w-none">
                {service.full_description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-6 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Impact Stories */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">VOICES OF IMPACT</h3>
                <div className="space-y-6">
                  {service.impact_stories.map((story, index) => (
                    <blockquote key={index} className="quote-truth">
                      "{story.quote}"
                      <cite className="block mt-2 text-lg font-normal">— {story.author}</cite>
                    </blockquote>
                  ))}
                </div>
              </div>

              {/* Outcomes */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">PROVEN OUTCOMES</h3>
                <div className="space-y-3">
                  {service.outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Award className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <p className="text-lg">{outcome}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {/* Eligibility */}
              <div className="data-card mb-8">
                <h3 className="font-bold text-lg mb-4">WHO CAN JOIN</h3>
                <ul className="space-y-2">
                  {service.eligibility.map((item, index) => (
                    <li key={index} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="data-card">
                <h3 className="font-bold text-lg mb-4">GET CONNECTED</h3>
                <div className="space-y-3">
                  {service.contact_phone && (
                    <a href={`tel:${service.contact_phone}`} className="flex items-center gap-2 hover:underline">
                      <Phone className="h-4 w-4" />
                      {service.contact_phone}
                    </a>
                  )}
                  {service.contact_email && (
                    <a href={`mailto:${service.contact_email}`} className="flex items-center gap-2 hover:underline">
                      <Mail className="h-4 w-4" />
                      {service.contact_email}
                    </a>
                  )}
                  {service.website && (
                    <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                      <Globe className="h-4 w-4" />
                      Visit website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <a 
                    href={`tel:${service.contact_phone}`}
                    className="cta-primary w-full text-center"
                  >
                    CALL NOW
                  </a>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-8">
                <h4 className="font-bold mb-3">PROGRAM FEATURES</h4>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 border border-black text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding bg-black text-white">
        <div className="container-justice text-center">
          <h2 className="headline-truth mb-8">
            Ready to change your story?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            This program has helped {service.participants_served}+ young people transform their lives. 
            You could be next.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`tel:${service.contact_phone}`}
              className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100"
            >
              CONTACT PROGRAM
            </a>
            <Link href="/services" className="inline-block border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
              EXPLORE MORE SERVICES
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}