import { requireAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import OrganizationList from '@/components/admin/OrganizationList';

type OrganizationListItem = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  type: string | null;
  location: string | null;
  website: string | null;
  created_at: string | null;
  organizations_profiles: Array<{
    id: string;
    role: string | null;
    is_current: boolean | null;
    public_profiles: {
      id: string;
      full_name: string;
      photo_url: string | null;
      slug: string | null;
    } | null;
  }>;
};

export default async function AdminOrganizationsPage() {
  const { supabase } = await requireAdmin('/admin/organizations');

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

  const normalizedOrganizations: OrganizationListItem[] = (organizations || []).map((org: any) => ({
    id: org.id,
    name: org.name,
    slug: org.slug ?? null,
    description: org.description ?? null,
    type: org.type ?? null,
    location: org.location ?? null,
    website: org.website ?? null,
    created_at: org.created_at ?? null,
    organizations_profiles: (org.organizations_profiles || []).map((profileLink: any) => ({
      id: profileLink.id,
      role: profileLink.role ?? null,
      is_current: profileLink.is_current ?? null,
      public_profiles: Array.isArray(profileLink.public_profiles)
        ? (profileLink.public_profiles[0]
            ? {
                id: profileLink.public_profiles[0].id,
                full_name: profileLink.public_profiles[0].full_name,
                photo_url: profileLink.public_profiles[0].photo_url ?? null,
                slug: profileLink.public_profiles[0].slug ?? null,
              }
            : null)
        : profileLink.public_profiles
          ? {
              id: profileLink.public_profiles.id,
              full_name: profileLink.public_profiles.full_name,
              photo_url: profileLink.public_profiles.photo_url ?? null,
              slug: profileLink.public_profiles.slug ?? null,
            }
          : null,
    })),
  }));

  // Fetch pending claims count
  const serviceClient = createServiceClient();
  const { count: pendingClaimsCount } = await (serviceClient as any)
    .from('organization_claims')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Calculate stats
  const totalOrgs = normalizedOrganizations.length;
  const totalMembers = normalizedOrganizations.reduce((sum, org) => sum + (org.organizations_profiles?.length || 0), 0);
  const autoLinkedOrgs = normalizedOrganizations.filter((org) => org.organizations_profiles.length > 0).length;

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
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
            {(pendingClaimsCount ?? 0) > 0 && (
              <Link href="/admin/org-claims" className="bg-purple-50 border-2 border-purple-600 p-4 hover:bg-purple-100 transition-colors">
                <div className="text-3xl font-black text-purple-600">{pendingClaimsCount}</div>
                <div className="text-sm text-purple-700 font-medium">Pending Claims →</div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Organizations List with Search/Filters */}
      <section className="container-justice py-8">
        <OrganizationList organizations={normalizedOrganizations} />
      </section>

      <Footer />
    </div>
  );
}
