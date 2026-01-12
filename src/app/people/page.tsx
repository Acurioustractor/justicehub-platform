import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const supabase = createServiceClient();

  // Fetch all public profiles
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('full_name', { ascending: true });

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-20 border-b-2 border-black">
        <div className="container-justice">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            People
          </h1>
          <p className="text-xl md:text-2xl text-earth-700 max-w-3xl mb-6">
            Advocates, artists, researchers, and changemakers working to transform youth justice in Australia.
          </p>

          <p className="text-sm max-w-2xl text-earth-600 border-l-4 border-ochre-400 pl-4 text-left">
            <strong>Want to be listed?</strong> People are featured here by application or invitation.
            Once listed, you can manage your own profile and be connected to stories, organizations, and content across JusticeHub.
          </p>
        </div>
      </section>

      {/* Profiles Grid */}
      <section className="container-justice py-16">
        {profiles && profiles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/people/${profile.slug}`}
                className="group border-2 border-black overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {/* Photo */}
                {profile.photo_url && (
                  <div className="w-full h-64 relative overflow-hidden bg-gray-900">
                    <img
                      src={profile.photo_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {profile.is_featured && (
                      <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-lg">
                        Featured
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="p-6 bg-white">
                  <h3 className="text-2xl font-black mb-2 group-hover:text-ochre-600 transition-colors">
                    {profile.preferred_name || profile.full_name}
                  </h3>

                  {profile.tagline && (
                    <p className="text-earth-700 font-medium mb-3">
                      {profile.tagline}
                    </p>
                  )}

                  {/* Role Tags */}
                  {profile.role_tags && profile.role_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.role_tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-ochre-100 text-ochre-800 text-xs font-bold uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                      {profile.role_tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold">
                          +{profile.role_tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-earth-600">No profiles found.</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
