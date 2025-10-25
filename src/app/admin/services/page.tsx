import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/services');

  const { data: userData } = await supabase
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (userData?.user_role !== 'admin') redirect('/');

  const page = parseInt(searchParams.page || '1');
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Fetch services with pagination
  let query = supabase
    .from('services')
    .select(`
      *,
      services_profiles(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`);
  }

  const { data: services, count } = await query;

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

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
              <h1 className="text-4xl font-black text-black mb-2">Services</h1>
              <p className="text-lg text-gray-600">
                {count} service providers across Australia
              </p>
            </div>
            <Link
              href="/admin/services/import"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
            >
              Import Services
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <form method="GET" className="flex gap-4">
              <input
                type="search"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search services..."
                className="flex-1 px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Search
              </button>
            </form>
          </div>

          {services && services.length > 0 ? (
            <>
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Service Name</th>
                      <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Location</th>
                      <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Connections</th>
                      <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service: any) => {
                      const connectionCount = service.services_profiles?.[0]?.count || 0;
                      return (
                        <tr key={service.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{service.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {service.suburb}, {service.state}
                          </td>
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
                              href={`/admin/services/${service.id}`}
                              className="text-sm font-bold text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/admin/services/${service.id}/people`}
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

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {offset + 1} to {Math.min(offset + pageSize, count || 0)} of {count} services
                </div>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin/services?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                      className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 bg-black text-white font-bold border-2 border-black">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/admin/services?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                      className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <p className="text-xl font-bold text-gray-600 mb-4">No services found</p>
              <Link
                href="/admin/services/import"
                className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Import Services
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
