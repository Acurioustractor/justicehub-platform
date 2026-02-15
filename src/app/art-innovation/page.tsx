'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import {
  Palette, Camera, Film, Lightbulb, Sparkles,
  ArrowRight, Play, ExternalLink, MapPin, Users
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface ArtProject {
  id: string;
  title: string;
  slug: string;
  type: string;
  tagline: string | null;
  description: string;
  featured_image_url: string | null;
  video_url: string | null;
  creators: Array<{name: string; role: string}>;
  year: number | null;
  location: string | null;
  tags: string[];
  is_featured: boolean;
}

export default function ArtAndInnovationPage() {
  const [projects, setProjects] = useState<ArtProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function fetchProjects() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('art_innovation')
        .select('*')
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    }

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    if (activeFilter === 'all') return true;
    return project.type === activeFilter;
  });

  const featuredProjects = projects.filter(p => p.is_featured);
  const projectTypes = ['all', ...new Set(projects.map(p => p.type))];

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'art':
        return <Palette className="h-5 w-5" />;
      case 'campaign':
        return <Sparkles className="h-5 w-5" />;
      case 'innovation':
      case 'technology':
        return <Lightbulb className="h-5 w-5" />;
      case 'multimedia':
      case 'design':
        return <Film className="h-5 w-5" />;
      default:
        return <Camera className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-20 border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl">
              <div className="inline-block bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-wider mb-6">
                Art & Innovation
              </div>
              <h1 className="text-5xl md:text-6xl font-black mb-6">
                Creative Works Driving Change
              </h1>
              <p className="text-xl text-earth-700 font-medium mb-8 max-w-3xl">
                Showcasing artistic expression, campaigns, and innovative solutions from the youth justice sector.
                Real creativity, real impact, real change.
              </p>

              {!loading && projects.length > 0 && (
                <div className="grid grid-cols-3 gap-8 max-w-2xl">
                  <div>
                    <div className="text-4xl font-black text-earth-900 mb-1">{projects.length}</div>
                    <p className="text-sm font-medium text-earth-700">Projects</p>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-earth-900 mb-1">{featuredProjects.length}</div>
                    <p className="text-sm font-medium text-earth-700">Featured</p>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-earth-900 mb-1">{projectTypes.length - 1}</div>
                    <p className="text-sm font-medium text-earth-700">Categories</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filters */}
        {!loading && projects.length > 0 && (
          <section className="border-b border-gray-200 bg-white sticky top-32 z-10">
            <div className="container-justice py-6">
              <div className="flex flex-wrap gap-3">
                {projectTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`px-4 py-2 font-bold uppercase tracking-wider text-sm transition-all border-2 border-black ${
                      activeFilter === type
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-earth-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <div className="container-justice py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ochre-600 mx-auto mb-4"></div>
            <p className="text-earth-600">Loading projects...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="container-justice py-20 text-center">
            <Sparkles className="h-16 w-16 text-earth-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No Projects Yet</h2>
            <p className="text-earth-600 mb-8">
              Be the first to showcase your creative work or innovative solution!
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-earth-800 transition-colors"
            >
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Featured Projects */}
        {!loading && featuredProjects.length > 0 && activeFilter === 'all' && (
          <section className="container-justice py-16">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              Featured Projects
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/art-innovation/${project.slug}`}
                  className="group block border-2 border-black overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {project.featured_image_url ? (
                    <div className="w-full h-64 relative overflow-hidden bg-gray-900">
                      <img
                        src={project.featured_image_url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {project.video_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="bg-white rounded-full p-4">
                            <Play className="h-8 w-8 text-black" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-ochre-100 to-sand-100 flex items-center justify-center">
                      {getTypeIcon(project.type)}
                    </div>
                  )}

                  <div className="p-6 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-ochre-100 border border-earth-300 text-xs font-bold uppercase">
                        {getTypeIcon(project.type)}
                        {project.type}
                      </span>
                      {project.year && (
                        <span className="text-sm text-earth-600 font-medium">{project.year}</span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                      {project.title}
                    </h3>

                    {project.tagline && (
                      <p className="text-lg font-medium text-earth-700 mb-3">
                        {project.tagline}
                      </p>
                    )}

                    <p className="text-earth-700 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-earth-600">
                      {project.creators && project.creators.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">
                            {project.creators.map(c => c.name).join(', ')}
                          </span>
                        </div>
                      )}
                      {project.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{project.location}</span>
                        </div>
                      )}
                    </div>

                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-sand-100 text-earth-800 text-xs font-medium border border-earth-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Projects Grid */}
        {!loading && filteredProjects.length > 0 && (
          <section className="container-justice py-16">
            {activeFilter !== 'all' && (
              <h2 className="text-3xl font-black mb-8">
                {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Projects
              </h2>
            )}

            <div className="grid md:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/art-innovation/${project.slug}`}
                  className="group block border-2 border-black overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {project.featured_image_url ? (
                    <div className="w-full h-48 relative overflow-hidden bg-gray-900">
                      <img
                        src={project.featured_image_url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-ochre-100 to-sand-100 flex items-center justify-center">
                      <div className="text-center">
                        {getTypeIcon(project.type)}
                        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-earth-600">
                          {project.type}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-white">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-ochre-600 transition-colors">
                      {project.title}
                    </h3>

                    {project.tagline && (
                      <p className="text-sm text-earth-700 font-medium mb-2 line-clamp-1">
                        {project.tagline}
                      </p>
                    )}

                    {project.creators && project.creators.length > 0 && (
                      <p className="text-xs text-earth-600 font-medium">
                        by {project.creators[0].name}
                        {project.creators.length > 1 && ` +${project.creators.length - 1} more`}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-black text-white py-20">
          <div className="container-justice text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Share Your Creative Work
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Have an art project, campaign, or innovative solution making a difference in youth justice?
              We'd love to showcase your work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all"
              >
                Submit Your Project
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/stories"
                className="inline-flex items-center justify-center gap-2 border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all"
              >
                View Stories
                <ExternalLink className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
