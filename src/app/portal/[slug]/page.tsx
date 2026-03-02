import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { OrgSupportHubClient } from '@/app/admin/organizations/[slug]/hub/OrgSupportHubClient';

export default async function PortalHubPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal');

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug, type, description, location, state, tags')
    .eq('slug', params.slug)
    .single();

  if (!organization) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-gray-600">Organization not found</p>
      </div>
    );
  }

  const hasAccess = await checkOrgAccess(supabase, user.id, organization.id);
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <h1 className="text-2xl font-black mb-4">Access Denied</h1>
          <p className="text-earth-700">You are not a member of this organization.</p>
        </div>
      </div>
    );
  }

  return <OrgSupportHubClient organization={organization} isPortal />;
}
