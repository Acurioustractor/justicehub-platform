import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

export default async function AdminCoePeoplePage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/coe/people');

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all CoE key people with their profile details
  const { data: people } = await supabase
    .from('coe_key_people')
    .select(`
      id,
      role_title,
      expertise_area,
      bio_override,
      display_order,
      is_active,
      profile:public_profiles(
        id, slug, full_name, photo_url
      )
    `)
    .order('display_order', { ascending: true });

  // Fetch available public profiles for adding new people
  const { data: availableProfiles } = await supabase
    .from('public_profiles')
    .select('id, slug, full_name')
    .order('full_name');

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
              <h1 className="text-4xl font-black text-black mb-2">CoE Key People</h1>
              <p className="text-lg text-gray-600">
                Manage Centre of Excellence leadership and experts
              </p>
            </div>
            <Link
              href="/admin/coe/people/new"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Add Person
            </Link>
          </div>

          {people && people.length > 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Order</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Person</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Expertise</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((person: any) => (
                    <tr key={person.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold">{person.display_order}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {person.profile?.photo_url && (
                            <img
                              src={person.profile.photo_url}
                              alt={person.profile.full_name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-black"
                            />
                          )}
                          <div>
                            <div className="font-bold">{person.profile?.full_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{person.profile?.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{person.role_title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{person.expertise_area || '-'}</td>
                      <td className="px-6 py-4">
                        {person.is_active ? (
                          <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 border border-green-600">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-600">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <Link
                          href={`/admin/coe/people/${person.id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/people/${person.profile?.slug}`}
                          target="_blank"
                          className="text-sm font-bold text-gray-600 hover:text-gray-800"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <p className="text-xl font-bold text-gray-600 mb-4">No CoE people yet</p>
              <p className="text-gray-500 mb-6">Add people to the Centre of Excellence leadership team.</p>
              <Link
                href="/admin/coe/people/new"
                className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Add First Person
              </Link>
            </div>
          )}

          {/* Available Profiles Reference */}
          <div className="mt-8 p-6 bg-gray-100 border-2 border-gray-300">
            <h3 className="font-bold mb-2">Available Public Profiles</h3>
            <p className="text-sm text-gray-600 mb-4">
              {availableProfiles?.length || 0} profiles available to add as CoE key people.
            </p>
            <Link href="/admin/profiles" className="text-sm font-bold text-blue-600 hover:text-blue-800">
              Manage Public Profiles →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
