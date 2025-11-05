import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, Edit, ExternalLink, Sparkles, Mail, Globe, MapPin } from 'lucide-react';

export default async function AdminOrganizationDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/organizations');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (userData?.user_role !== 'admin') {
    redirect('/');
  }

  // Fetch organization with team members
  const { data: organization } = await supabase
    .from('organizations')
    .select(`
      *,
      organizations_profiles (
        id,
        role,
        role_description,
        is_current,
        is_featured,
        start_date,
        end_date,
        created_at,
        public_profiles (
          id,
          full_name,
          slug,
          photo_url,
          bio,
          current_organization,
          role_tags,
          is_featured,
          synced_from_empathy_ledger
        )
      )
    `)
    .eq('slug', params.slug)
    .single();

  if (!organization) {
    return <div>Organization not found</div>;
  }

  const teamMembers = organization.organizations_profiles || [];
  const currentMembers = teamMembers.filter((m: any) => m.is_current);
  const pastMembers = teamMembers.filter((m: any) => !m.is_current);
  const autoLinkedMembers = teamMembers.filter((m: any) => m.public_profiles?.synced_from_empathy_ledger);

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <Link
            href="/admin/organizations"
            className="inline-flex items-center gap-2 text-sm font-bold text-earth-700 hover:text-black mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organizations
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                {organization.name}
              </h1>
              {organization.type && (
                <div className="text-sm font-bold text-gray-600 uppercase mb-4">
                  {organization.type}
                </div>
              )}
              {organization.description && (
                <p className="text-lg text-earth-700 max-w-3xl">
                  {organization.description}
                </p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 mt-6">
            {organization.location && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4" />
                {organization.location}
              </div>
            )}
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                <Globe className="h-4 w-4" />
                Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {organization.email && (
              <a
                href={`mailto:${organization.email}`}
                className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black">{teamMembers.length}</div>
              <div className="text-sm text-earth-600 font-medium">Total Members</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-green-600">{currentMembers.length}</div>
              <div className="text-sm text-earth-600 font-medium">Current</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-indigo-600">{autoLinkedMembers.length}</div>
              <div className="text-sm text-earth-600 font-medium">Auto-Linked</div>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <div className="text-3xl font-black text-orange-600">{pastMembers.length}</div>
              <div className="text-sm text-earth-600 font-medium">Past Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="container-justice py-12">
        {/* Current Members */}
        {currentMembers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black mb-6">Current Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentMembers.map((member: any) => {
                const profile = member.public_profiles;
                if (!profile) return null;

                return (
                  <div
                    key={member.id}
                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
                  >
                    {/* Profile Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {profile.photo_url ? (
                        <img
                          src={profile.photo_url}
                          alt={profile.full_name}
                          className="w-16 h-16 rounded-full border-2 border-black object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-black bg-cyan-100 text-cyan-600 flex items-center justify-center text-2xl font-black">
                          {profile.full_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-black text-lg">{profile.full_name}</h3>
                        {member.role && (
                          <div className="text-sm font-bold text-cyan-600">{member.role}</div>
                        )}
                      </div>
                    </div>

                    {/* Auto-Link Badge */}
                    {profile.synced_from_empathy_ledger && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-indigo-50 border border-indigo-600 text-indigo-700 text-xs font-bold mb-3 w-fit">
                        <Sparkles className="h-3 w-3" />
                        AUTO-LINKED
                      </div>
                    )}

                    {/* Role Description */}
                    {member.role_description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {member.role_description}
                      </p>
                    )}

                    {/* Bio Preview */}
                    {profile.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {profile.bio}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t-2 border-gray-200">
                      <Link
                        href={`/people/${profile.slug}`}
                        className="flex-1 text-center px-3 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors text-xs font-bold"
                      >
                        VIEW
                      </Link>
                      <Link
                        href={`/admin/profiles/${profile.id}/connections`}
                        className="flex-1 text-center px-3 py-2 border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white transition-colors text-xs font-bold"
                      >
                        EDIT
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Members */}
        {pastMembers.length > 0 && (
          <div>
            <h2 className="text-2xl font-black mb-6">Past Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastMembers.map((member: any) => {
                const profile = member.public_profiles;
                if (!profile) return null;

                return (
                  <div
                    key={member.id}
                    className="bg-gray-50 border-2 border-gray-300 p-6 opacity-75"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {profile.photo_url ? (
                        <img
                          src={profile.photo_url}
                          alt={profile.full_name}
                          className="w-12 h-12 rounded-full border-2 border-gray-400 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-gray-400 bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-black">
                          {profile.full_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-black">{profile.full_name}</h3>
                        {member.role && (
                          <div className="text-sm font-bold text-gray-600">{member.role}</div>
                        )}
                        {member.end_date && (
                          <div className="text-xs text-gray-500">Until {new Date(member.end_date).getFullYear()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Members */}
        {teamMembers.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-4">No team members yet</p>
            <Link
              href="/admin/profiles"
              className="inline-block px-6 py-3 bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors"
            >
              Link People to This Organization
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
