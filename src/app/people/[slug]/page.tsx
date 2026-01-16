import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Mail, Globe, Linkedin, Twitter, Edit, Building2, Briefcase, MapPin, Users, Sparkles } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface PublicProfile {
  id: string;
  user_id: string | null;
  full_name: string;
  slug: string;
  preferred_name: string | null;
  pronouns: string | null;
  bio: string | null;
  tagline: string | null;
  role_tags: string[];
  photo_url: string | null;
  photo_credit: string | null;
  website_url: string | null;
  email: string | null;
  social_links: Record<string, string>;
  is_featured: boolean;
  is_public: boolean;

  // Related content
  art_innovation_profiles: Array<{
    role: string;
    role_description: string | null;
    art_innovation: {
      id: string;
      title: string;
      slug: string;
      type: string;
      tagline: string | null;
      featured_image_url: string | null;
    };
  }>;

  registered_services_profiles: Array<{
    role: string;
    role_description: string | null;
    registered_services: {
      id: string;
      name: string;
      organization: string;
      location: string;
      state: string;
    };
  }>;

  services_profiles: Array<{
    role: string;
    role_description: string | null;
    services: {
      id: string;
      name: string;
      slug: string;
      organization_id: string | null;
    };
  }>;
}

export default async function ProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServiceClient();

  // Check if current user can edit
  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;

  console.log('🔍 Auth check:', user ? `User ID: ${user.id}` : 'Not logged in');

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile data:', profileData);
    canEdit = profileData?.is_super_admin === true;
  }

  // Fetch profile - allow private profiles if user owns them
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      art_innovation_profiles (
        role,
        role_description,
        art_innovation:art_innovation_id (
          id,
          title,
          slug,
          type,
          tagline,
          featured_image_url
        )
      ),
      registered_services_profiles (
        role,
        role_description,
        registered_services:program_id (
          id,
          name,
          organization,
          location,
          state
        )
      ),
      services_profiles (
        role,
        role_description,
        services:service_id (
          id,
          name,
          slug,
          organization_id
        )
      )
    `)
    .eq('slug', params.slug)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Check if profile is private and user doesn't own it
  // Note: user_id in profiles is usually the same as id for auth-linked profiles
  const profileUserId = profile.user_id || profile.id;
  if (!profile.is_public && (!user || profileUserId !== user.id)) {
    // Private profile - only owner can view
    notFound();
  }

  const typedProfile = profile as any; // Cast as any or update interface if needed

  // Check if user owns this profile
  console.log('🔗 Profile user_id:', profileUserId);
  console.log('👤 Current user:', user?.id);

  if (user && profileUserId === user.id) {
    console.log('✅ User owns this profile!');
    canEdit = true;
  }

  console.log('🔐 Can edit?', canEdit);

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-20 border-b-2 border-black">
        <div className="container-justice">
          <div className="flex justify-between items-center mb-8">
            <Link
              href="/art-innovation"
              className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            {canEdit && (
              <Link
                href={`/people/${params.slug}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-bold hover:bg-earth-800 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Link>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Profile Photo */}
            {typedProfile.photo_url && (
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={typedProfile.photo_url}
                    alt={typedProfile.full_name}
                    className="w-48 h-48 rounded-full border-4 border-black object-cover"
                  />
                  {typedProfile.is_featured && (
                    <div className="absolute -top-2 -right-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-black shadow-lg">
                      Featured
                    </div>
                  )}
                </div>
                {typedProfile.photo_credit && (
                  <p className="text-xs text-earth-600 mt-2 text-center">
                    Photo: {typedProfile.photo_credit}
                  </p>
                )}
              </div>
            )}

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-black mb-4">
                {typedProfile.preferred_name || typedProfile.full_name}
              </h1>

              {typedProfile.pronouns && (
                <p className="text-lg text-earth-600 mb-4">
                  {typedProfile.pronouns}
                </p>
              )}

              {typedProfile.tagline && (
                <p className="text-2xl text-earth-700 font-medium mb-4">
                  {typedProfile.tagline}
                </p>
              )}

              {/* Role Tags */}
              {typedProfile.role_tags && typedProfile.role_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {typedProfile.role_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-black text-white text-sm font-bold uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-4">
                {typedProfile.website_url && (
                  <a
                    href={typedProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {typedProfile.email && (
                  <a
                    href={`mailto:${typedProfile.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                {typedProfile.social_links?.linkedin && (
                  <a
                    href={typedProfile.social_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {typedProfile.social_links?.twitter && (
                  <a
                    href={typedProfile.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      {typedProfile.bio && (
        <section className="container-justice py-16">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-black mb-6">About</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed text-earth-800 whitespace-pre-line">
                {typedProfile.bio}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Connected Content */}
      <section className="container-justice py-16 border-t-2 border-black">
        <div className="max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="h-8 w-8" />
            <h2 className="text-3xl font-black">Connected Work</h2>
          </div>

          {/* Check if there's any connected work */}
          {(typedProfile.art_innovation_profiles?.length > 0 ||
            typedProfile.registered_services_profiles?.length > 0 ||
            typedProfile.services_profiles?.length > 0) ? (
            <div className="grid gap-12">
              {/* Art & Innovation Projects */}
              {typedProfile.art_innovation_profiles && typedProfile.art_innovation_profiles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-5 w-5 text-ochre-600" />
                    <h3 className="text-2xl font-bold">Art & Innovation</h3>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typedProfile.art_innovation_profiles.map((link: any) => (
                      <Link
                        key={link.art_innovation.id}
                        href={`/art-innovation/${link.art_innovation.slug}`}
                        className="group border-2 border-black overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        {link.art_innovation.featured_image_url && (
                          <div className="w-full h-48 relative overflow-hidden bg-gray-900">
                            <img
                              src={link.art_innovation.featured_image_url}
                              alt={link.art_innovation.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4 bg-white">
                          <span className="inline-block px-2 py-1 bg-ochre-100 text-xs font-bold uppercase mb-2">
                            {link.art_innovation.type}
                          </span>
                          <h4 className="font-bold text-lg mb-2 group-hover:text-ochre-600 transition-colors">
                            {link.art_innovation.title}
                          </h4>
                          <p className="text-sm text-earth-600 font-medium">
                            <span className="text-ochre-600">Role:</span> {link.role_description || link.role}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Programs */}
              {typedProfile.registered_services_profiles && typedProfile.registered_services_profiles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Users className="h-5 w-5 text-eucalyptus-600" />
                    <h3 className="text-2xl font-bold">Community Programs</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {typedProfile.registered_services_profiles.map((link: any) => (
                      <Link
                        key={link.registered_services.id}
                        href={`/community-programs/${link.registered_services.id}`}
                        className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
                      >
                        <h4 className="font-bold text-lg mb-2 group-hover:text-eucalyptus-600 transition-colors">
                          {link.registered_services.name}
                        </h4>
                        <p className="text-sm text-earth-700 mb-2">
                          {link.registered_services.organization}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-earth-600 mb-3">
                          <MapPin className="h-4 w-4" />
                          {link.registered_services.location}, {link.registered_services.state}
                        </div>
                        <p className="text-sm font-medium">
                          <span className="text-eucalyptus-600">Role:</span> {link.role_description || link.role}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {typedProfile.services_profiles && typedProfile.services_profiles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-2xl font-bold">Services</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {typedProfile.services_profiles.map((link: any) => (
                      <Link
                        key={link.services.id}
                        href={`/services/${link.services.slug}`}
                        className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
                      >
                        <h4 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                          {link.services.name}
                        </h4>
                        <p className="text-sm font-medium">
                          <span className="text-blue-600">Role:</span> {link.role_description || link.role}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-earth-300 p-8 text-center bg-sand-50">
              <Briefcase className="h-12 w-12 text-earth-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-earth-700 mb-2">No Connected Work Yet</h3>
              <p className="text-earth-600 max-w-md mx-auto">
                This profile doesn't have any linked programs, services, or projects yet.
                {canEdit && ' Edit your profile to add connections.'}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
