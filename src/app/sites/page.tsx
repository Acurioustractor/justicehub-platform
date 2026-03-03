import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { MapPin, ArrowLeft } from 'lucide-react';

export default async function SitesIndexPage() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, type, location, state, tagline, logo_url, tags')
    .eq('is_active', true)
    .not('slug', 'is', null)
    .order('name');

  return (
    <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50">
      {/* Back to JusticeHub */}
      <nav className="border-b-2 border-black bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-earth-700 hover:text-ochre-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to JusticeHub
          </Link>
          <Link href="/organizations" className="text-sm font-medium text-earth-500 hover:text-ochre-600 transition-colors">
            All Organizations
          </Link>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-2">Community Organizations</h1>
        <p className="text-lg text-earth-600 mb-10">Organizations supported by JusticeHub</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(orgs || []).map((org) => (
            <Link
              key={org.id}
              href={`/sites/${org.slug}`}
              className="bg-white border-2 border-black p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-ochre-100 border border-ochre-200 flex items-center justify-center text-xl font-black text-ochre-600">
                    {org.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="font-black text-lg leading-tight">{org.name}</h2>
                  {org.type && <span className="text-xs text-earth-500 capitalize">{org.type}</span>}
                </div>
              </div>
              {org.tagline && <p className="text-sm text-earth-600 mb-3">{org.tagline}</p>}
              {org.location && (
                <span className="flex items-center gap-1 text-xs text-earth-500">
                  <MapPin className="w-3 h-3" /> {org.location}{org.state ? `, ${org.state}` : ''}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
