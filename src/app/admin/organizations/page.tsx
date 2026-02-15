import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import OrganizationList from '@/components/admin/OrganizationList';

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

      {/* Organizations List with Search/Filters */}
      <section className="container-justice py-8">
        <OrganizationList organizations={organizations || []} />
      </section>

      <Footer />
    </div>
  );
}
