import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrgSupportHubClient } from './OrgSupportHubClient';

export default async function OrgHubPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/organizations');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

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

  return <OrgSupportHubClient organization={organization} />;
}
