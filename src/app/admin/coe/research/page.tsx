import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

export default async function AdminResearchPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/coe/research');

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all research items
  const { data: items } = await supabase
    .from('research_items')
    .select('*')
    .order('year', { ascending: false });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'trauma-informed': 'Trauma-Informed',
      'indigenous-diversion': 'Indigenous Diversion',
      'family-engagement': 'Family Engagement',
      'restorative-justice': 'Restorative Justice',
      'youth-rights': 'Youth Rights',
      'recidivism': 'Recidivism',
      'mental-health': 'Mental Health'
    };
    return labels[category] || category;
  };

  const getTypeLabel = (type: string) => {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

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
              <h1 className="text-4xl font-black text-black mb-2">Research Library</h1>
              <p className="text-lg text-gray-600">
                Manage Centre of Excellence research items
              </p>
            </div>
            <Link
              href="/admin/coe/research/new"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Add Research
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white border-2 border-black p-4 text-center">
              <div className="text-3xl font-bold">{items?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="bg-white border-2 border-black p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{items?.filter(i => i.is_featured).length || 0}</div>
              <div className="text-sm text-gray-600">Featured</div>
            </div>
            <div className="bg-white border-2 border-black p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{items?.filter(i => i.is_active).length || 0}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white border-2 border-black p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{items?.filter(i => i.year >= 2024).length || 0}</div>
              <div className="text-sm text-gray-600">Recent (2024+)</div>
            </div>
          </div>

          {items && items.length > 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Year</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold truncate max-w-md" title={item.title}>{item.title}</div>
                        <div className="text-sm text-gray-500">{item.organization}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">{item.year}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getTypeLabel(item.type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {item.is_featured && (
                            <span className="text-xs font-bold px-2 py-1 bg-yellow-50 text-yellow-600 border border-yellow-600">
                              FEATURED
                            </span>
                          )}
                          {item.is_active ? (
                            <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 border border-green-600">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-600">
                              INACTIVE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <Link
                          href={`/admin/coe/research/${item.slug}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        {item.external_url && (
                          <a
                            href={item.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-gray-600 hover:text-gray-800"
                          >
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <p className="text-xl font-bold text-gray-600 mb-4">No research items yet</p>
              <p className="text-gray-500 mb-6">Research items will appear here after running the database migration.</p>
              <Link
                href="/admin/coe/research/new"
                className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Add Your First Research Item
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
