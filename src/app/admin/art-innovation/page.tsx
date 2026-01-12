import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

export default async function AdminArtInnovationPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/art-innovation');

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all art projects with profile connection counts
  const { data: projects } = await supabase
    .from('art_innovation')
    .select(`
      *,
      art_innovation_profiles(count)
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
              <h1 className="text-4xl font-black text-black mb-2">Art & Innovation</h1>
              <p className="text-lg text-gray-600">
                Manage creative projects and connect them to people
              </p>
            </div>
            <Link
              href="/admin/art-innovation/new"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
            >
              Create Project
            </Link>
          </div>

          {projects && projects.length > 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Project Name</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Connections</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project: any) => {
                    const connectionCount = project.art_innovation_profiles?.[0]?.count || 0;
                    return (
                      <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{project.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{project.type || 'N/A'}</td>
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
                            href={`/admin/art-innovation/${project.id}`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/art-innovation/${project.id}/people`}
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
              <p className="text-xl font-bold text-gray-600 mb-4">No art projects yet</p>
              <Link
                href="/admin/art-innovation/new"
                className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
