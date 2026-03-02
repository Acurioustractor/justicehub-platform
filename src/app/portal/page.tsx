import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PortalPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Find user's profile (profiles.id matches auth user id)
  const profile = (await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single()).data;

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <h1 className="text-2xl font-black mb-4">No Profile Found</h1>
          <p className="text-earth-700">Your account is not linked to a profile. Contact an administrator.</p>
        </div>
      </div>
    );
  }

  // Find their active org memberships
  // organization_members uses user_id (auth user id) and status (not profile_id/is_active)
  const { data: memberships } = await (supabase as any)
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, slug, type, location)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const orgs = (memberships || [])
    .filter((m: any) => m.organizations)
    .map((m: any) => ({ ...m.organizations, memberRole: m.role }));

  // Single org — redirect directly
  if (orgs.length === 1 && orgs[0].slug) {
    redirect(`/portal/${orgs[0].slug}`);
  }

  // No orgs
  if (orgs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <h1 className="text-2xl font-black mb-4">No Organizations</h1>
          <p className="text-earth-700 mb-4">You are not a member of any organization yet.</p>
          <Link href="/" className="text-ochre-600 hover:text-ochre-800 underline font-bold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Multiple orgs — show picker
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-justice py-12">
        <h1 className="text-3xl font-black mb-2">Your Organizations</h1>
        <p className="text-earth-700 mb-8">Select an organization to access its Support Hub.</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org: any) => (
            <Link
              key={org.id}
              href={`/portal/${org.slug}`}
              className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              <h2 className="text-xl font-black mb-1">{org.name}</h2>
              <p className="text-sm text-earth-600 mb-2">{org.type} &middot; {org.location}</p>
              <span className="inline-block px-2 py-1 text-xs font-bold bg-ochre-100 text-ochre-800 border border-ochre-300">
                {org.memberRole}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
