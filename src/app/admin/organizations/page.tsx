import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Users, Building2, Link as LinkIcon, Sparkles } from 'lucide-react';

export default async function AdminOrganizationsPage() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/organizations');
  }
  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all organizations with team member counts
  const { data: organizations } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      description,
      type,
      location,
      website,
      created_at,
      organizations_profiles (
        id,
        role,
        is_current,
        public_profiles (
          id,
          full_name,
          photo_url,
          slug
        )
      )
    `)
    .order('name');

  // Calculate stats
  const totalOrgs = organizations?.length || 0;
  const totalMembers = organizations?.reduce((sum, org) => sum + (org.organizations_profiles?.length || 0), 0) || 0;
  const autoLinkedOrgs = organizations?.filter(org => org.organizations_profiles && org.organizations_profiles.length > 0).length || 0;

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                Organizations
              </h1>
              <p className="text-lg text-earth-700">
                Manage organizations and their team members
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black">{totalOrgs}</div>
              <div className="text-sm text-earth-600 font-medium">Total Organizations</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-cyan-600">{totalMembers}</div>
              <div className="text-sm text-earth-600 font-medium">Team Members</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-indigo-600">{autoLinkedOrgs}</div>
              <div className="text-sm text-earth-600 font-medium">With Auto-Links</div>
            </div>
          </div>
        </div>
      </section>

      {/* Organizations List */}
      <section className="container-justice py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations && organizations.length > 0 ? (
            organizations.map((org: any) => {
              const teamSize = org.organizations_profiles?.length || 0;
              const hasAutoLinks = teamSize > 0;

              return (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.slug || org.id}`}
                  className="group bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-black mb-1 group-hover:text-cyan-600 transition-colors">
                        {org.name}
                      </h3>
                      {org.type && (
                        <div className="text-xs font-bold text-gray-500 uppercase">
                          {org.type}
                        </div>
                      )}
                    </div>
                    {hasAutoLinks && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-600">
                        <Sparkles className="h-3 w-3" />
                        AUTO
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {org.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  {/* Location */}
                  {org.location && (
                    <div className="text-xs text-gray-500 mb-4">
                      📍 {org.location}
                    </div>
                  )}

                  {/* Team Members */}
                  {teamSize > 0 ? (
                    <div className="border-t-2 border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-700">Team Members</span>
                        <span className="text-sm font-bold text-cyan-600">{teamSize}</span>
                      </div>

                      {/* Profile Photos */}
                      <div className="flex -space-x-2">
                        {org.organizations_profiles.slice(0, 5).map((link: any) => (
                          link.public_profiles && (
                            <div
                              key={link.id}
                              className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
                              title={link.public_profiles.full_name}
                            >
                              {link.public_profiles.photo_url ? (
                                <img
                                  src={link.public_profiles.photo_url}
                                  alt={link.public_profiles.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-cyan-100 text-cyan-600 text-xs font-bold">
                                  {link.public_profiles.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                          )
                        ))}
                        {teamSize > 5 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-600 text-white text-xs font-bold flex items-center justify-center">
                            +{teamSize - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t-2 border-gray-200 pt-4 text-sm text-gray-400 italic">
                      No team members yet
                    </div>
                  )}

                  {/* View Arrow */}
                  <div className="mt-4 flex items-center justify-end text-cyan-600 font-bold text-sm">
                    View Team →
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-gray-600">
              No organizations found
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
