'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, MapPin, Mail, Loader2, Search, Filter } from 'lucide-react';

interface NetworkProfile {
  id: string;
  full_name: string;
  role: string | null;
  expertise: string | null;
  email: string | null;
  location: string | null;
  organization: {
    id: string;
    name: string;
    location: string | null;
  };
}

export function SupportNetworkTab({ orgId }: { orgId: string }) {
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    async function fetchNetwork() {
      setLoading(true);
      try {
        const res = await fetch(`/api/org-hub/${orgId}/support-network`);
        if (!res.ok) throw new Error('Failed to load support network');
        const json = await res.json();
        setProfiles(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchNetwork();
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <p className="text-red-700 font-bold">Error: {error}</p>
      </div>
    );
  }

  const roles = Array.from(new Set(profiles.map(p => p.role).filter(Boolean))) as string[];

  const filtered = profiles.filter(p => {
    const matchesSearch = !searchQuery ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.expertise?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || p.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-black">Support Network</h3>
          <span className="ml-auto text-sm text-gray-500 font-bold">{filtered.length} people</span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          People from other organisations who can provide mentoring, expertise, and support.
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, org, role, expertise..."
              className="w-full pl-10 pr-4 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ochre-600"
            />
          </div>
          {roles.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-10 pr-8 py-2 border-2 border-black text-sm font-bold appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-ochre-600"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Profile Grid */}
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No profiles found matching your search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((profile) => (
              <div
                key={profile.id}
                className="border-2 border-black p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 border border-black flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm truncate">{profile.full_name}</h4>
                    {profile.role && (
                      <p className="text-xs text-gray-600 font-medium">{profile.role}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-bold truncate">{profile.organization?.name || 'Unknown org'}</span>
                  </div>
                  {(profile.location || profile.organization?.location) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{profile.location || profile.organization?.location}</span>
                    </div>
                  )}
                  {profile.expertise && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {profile.expertise.split(',').map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 border border-gray-300">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {profile.email && (
                  <a
                    href={`mailto:${profile.email}?subject=Support Network - Request for Mentoring`}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold border-2 border-black bg-ochre-600 text-white hover:bg-ochre-700 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Request Mentoring
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
