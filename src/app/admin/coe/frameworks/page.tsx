import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

export default async function AdminFrameworksPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/coe/frameworks');

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all frameworks
  const { data: frameworks } = await supabase
    .from('australian_frameworks')
    .select('*')
    .order('display_order', { ascending: true });

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
              <h1 className="text-4xl font-black text-black mb-2">Australian Frameworks</h1>
              <p className="text-lg text-gray-600">
                Manage Centre of Excellence state/territory frameworks
              </p>
            </div>
            <Link
              href="/admin/coe/frameworks/new"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Add Framework
            </Link>
          </div>

          {frameworks && frameworks.length > 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Order</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">State</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Outcomes</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {frameworks.map((framework: any) => (
                    <tr key={framework.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold">{framework.display_order}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold">{framework.name}</div>
                        <div className="text-sm text-gray-500">{framework.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold border border-${framework.color}-600 text-${framework.color}-600 bg-${framework.color}-50`}>
                          {framework.state}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {framework.is_active ? (
                          <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 border border-green-600">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-600">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {framework.outcomes?.length || 0} outcomes
                      </td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <Link
                          href={`/admin/coe/frameworks/${framework.slug}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/centre-of-excellence/best-practice`}
                          target="_blank"
                          className="text-sm font-bold text-gray-600 hover:text-gray-800"
                        >
                          Preview
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <p className="text-xl font-bold text-gray-600 mb-4">No frameworks yet</p>
              <p className="text-gray-500 mb-6">Australian frameworks will appear here after running the database migration.</p>
              <Link
                href="/admin/coe/frameworks/new"
                className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Add Your First Framework
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
