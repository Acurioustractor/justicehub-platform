import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

export default async function AdminProgramsPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/programs');

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all programs with profile connection counts
  const { data: programs } = await supabase
    .from('registered_services')
    .select(`
      *,
      registered_services_profiles(count)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-black text-black mb-2">Community Programs</h1>
              <p className="text-lg text-gray-600">
                Manage programs and connect them to people
              </p>
            </div>
            <Link
              href="/admin/programs/new"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Add Program
            </Link>
          </div>

          {programs && programs.length > 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Organization</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Connections</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((program: any) => {
                    const connectionCount = program.registered_services_profiles?.[0]?.count || 0;
                    return (
                      <tr key={program.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{program.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{program.organization_slug || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {connectionCount > 0 ? (
                            <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 border border-green-600">
                              {connectionCount} PEOPLE
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-600">
                              NO CONNECTIONS
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-4">
                          <Link
                            href={`/admin/programs/${program.id}`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/programs/${program.id}/people`}
                            className="text-sm font-bold text-green-600 hover:text-green-800"
                          >
                            Manage People
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <p className="text-xl font-bold text-gray-600 mb-4">No programs yet</p>
              <Link
                href="/admin/programs/new"
                className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Add Your First Program
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
