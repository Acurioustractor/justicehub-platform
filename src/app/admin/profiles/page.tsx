import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Edit, Eye, EyeOff, Trash2, UserPlus } from 'lucide-react';

export default async function AdminProfilesPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/profiles');
  }

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    console.log('Not super admin - redirecting.');
    redirect('/');
  }

  console.log('Admin access granted!');

  // Fetch all profiles with filters
  let query = supabase
    .from('profiles')
    .select(`
      *,
      art_innovation_profiles (count),
      community_programs_profiles (count),
      services_profiles (count)
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  const filter = searchParams.filter;
  if (filter === 'public') {
    query = query.eq('is_public', true);
  } else if (filter === 'private') {
    query = query.eq('is_public', false);
  } else if (filter === 'featured') {
    query = query.eq('is_featured', true);
  } else if (filter === 'no-user') {
    query = query.is('user_id', null);
  }

  const { data: profiles } = await query;

  const totalProfiles = profiles?.length || 0;
  const publicProfiles = profiles?.filter(p => p.is_public).length || 0;
  const privateProfiles = profiles?.filter(p => !p.is_public).length || 0;
  const featuredProfiles = profiles?.filter(p => p.is_featured).length || 0;

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                Profile Management
              </h1>
              <p className="text-lg text-earth-700">
                Manage all user profiles, visibility, and connections
              </p>
            </div>
            <Link
              href="/admin/profiles/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-earth-800 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Add Profile
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black">{totalProfiles}</div>
              <div className="text-sm text-earth-600 font-medium">Total Profiles</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-green-600">{publicProfiles}</div>
              <div className="text-sm text-earth-600 font-medium">Public</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-orange-600">{privateProfiles}</div>
              <div className="text-sm text-earth-600 font-medium">Private</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-ochre-600">{featuredProfiles}</div>
              <div className="text-sm text-earth-600 font-medium">Featured</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b-2 border-black bg-sand-50">
        <div className="container-justice py-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/profiles"
              className={`px-4 py-2 font-bold text-sm border-2 border-black transition-colors ${!filter ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
            >
              All Profiles
            </Link>
            <Link
              href="/admin/profiles?filter=public"
              className={`px-4 py-2 font-bold text-sm border-2 border-black transition-colors ${filter === 'public' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
            >
              Public Only
            </Link>
            <Link
              href="/admin/profiles?filter=private"
              className={`px-4 py-2 font-bold text-sm border-2 border-black transition-colors ${filter === 'private' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
            >
              Private Only
            </Link>
            <Link
              href="/admin/profiles?filter=featured"
              className={`px-4 py-2 font-bold text-sm border-2 border-black transition-colors ${filter === 'featured' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
            >
              Featured
            </Link>
            <Link
              href="/admin/profiles?filter=no-user"
              className={`px-4 py-2 font-bold text-sm border-2 border-black transition-colors ${filter === 'no-user' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
            >
              No User Account
            </Link>
          </div>
        </div>
      </section>

      {/* Profiles Table */}
      <section className="container-justice py-8">
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left px-4 py-3 font-bold">Profile</th>
                <th className="text-left px-4 py-3 font-bold">Email</th>
                <th className="text-left px-4 py-3 font-bold">Status</th>
                <th className="text-left px-4 py-3 font-bold">Connections</th>
                <th className="text-left px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {profiles && profiles.length > 0 ? (
                profiles.map((profile: any) => (
                  <tr key={profile.id} className="hover:bg-sand-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {profile.photo_url && (
                          <img
                            src={profile.photo_url}
                            alt={profile.full_name}
                            className="w-12 h-12 rounded-full border-2 border-black object-cover"
                          />
                        )}
                        <div>
                          <div className="font-bold">{profile.full_name}</div>
                          <div className="text-sm text-earth-600">/{profile.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {profile.email || (
                          <span className="text-gray-400 italic">No email</span>
                        )}
                      </div>
                      {profile.is_super_admin && (
                        <div className="text-xs text-earth-600 font-bold">
                          SUPER ADMIN
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {profile.is_public ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold w-fit">
                            <Eye className="h-3 w-3" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold w-fit">
                            <EyeOff className="h-3 w-3" />
                            Private
                          </span>
                        )}
                        {profile.is_featured && (
                          <span className="inline-flex items-center px-2 py-1 bg-ochre-100 text-ochre-800 text-xs font-bold w-fit">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm space-y-1">
                        {profile.art_innovation_profiles?.[0]?.count > 0 && (
                          <div>🎨 {profile.art_innovation_profiles[0].count} art projects</div>
                        )}
                        {profile.community_programs_profiles?.[0]?.count > 0 && (
                          <div>🏘️ {profile.community_programs_profiles[0].count} programs</div>
                        )}
                        {profile.services_profiles?.[0]?.count > 0 && (
                          <div>🔧 {profile.services_profiles[0].count} services</div>
                        )}
                        {(!profile.art_innovation_profiles?.[0]?.count &&
                          !profile.community_programs_profiles?.[0]?.count &&
                          !profile.services_profiles?.[0]?.count) && (
                            <span className="text-gray-400 italic">No connections</span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/people/${profile.slug}`}
                          className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                          title="View profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/people/${profile.slug}/edit`}
                          className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                          title="Edit profile"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/profiles/${profile.id}/connections`}
                          className="px-3 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors text-xs font-bold"
                          title="Manage connections"
                        >
                          LINKS
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-earth-600">
                    No profiles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Footer />
    </div>
  );
}
