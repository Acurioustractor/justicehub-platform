'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  Users, Building2, Palette, FileText, Briefcase, Search,
  ArrowRight, TrendingUp, UserCheck, Network, Filter
} from 'lucide-react';
import { RoleBadge } from '@/components/admin/RoleSelector';

interface PersonSummary {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  tagline: string | null;
  is_public: boolean | null;
  synced_from_empathy_ledger: boolean | null;
  connections: {
    organizations: number;
    programs: number;
    art_projects: number;
    services: number;
    stories: number;
    total: number;
  };
  top_roles: string[];
}

interface NetworkStats {
  total_people: number;
  people_with_connections: number;
  total_connections: number;
  public_profiles: number;
  empathy_ledger_synced: number;
  by_role: { role: string; count: number }[];
}

export default function PeopleInNetworkPage() {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConnected, setFilterConnected] = useState<'all' | 'connected' | 'unconnected'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'connections' | 'recent'>('connections');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    // Load all profiles with connection counts
    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, full_name, slug, photo_url, tagline, is_public, synced_from_empathy_ledger')
      .order('full_name');

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Load connection counts for each profile
    const peopleWithConnections: PersonSummary[] = await Promise.all(
      profiles.map(async (profile) => {
        // Get organization connections
        const { count: orgCount } = await supabase
          .from('organizations_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('public_profile_id', profile.id);

        // Get program connections
        const { count: programCount } = await supabase
          .from('registered_services_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        // Get art project connections
        const { count: artCount } = await supabase
          .from('art_innovation_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        // Get service connections
        const { count: serviceCount } = await supabase
          .from('services_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        // Get story connections
        const { count: storyCount } = await supabase
          .from('blog_posts_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('public_profile_id', profile.id);

        // Get top roles for this person
        const { data: roles } = await supabase
          .from('organizations_profiles')
          .select('role')
          .eq('public_profile_id', profile.id)
          .limit(3);

        const topRoles = (roles?.map(r => r.role).filter((r): r is string => r !== null && r !== undefined) || []);

        return {
          ...profile,
          connections: {
            organizations: orgCount || 0,
            programs: programCount || 0,
            art_projects: artCount || 0,
            services: serviceCount || 0,
            stories: storyCount || 0,
            total: (orgCount || 0) + (programCount || 0) + (artCount || 0) + (serviceCount || 0) + (storyCount || 0),
          },
          top_roles: topRoles,
        };
      })
    );

    setPeople(peopleWithConnections);

    // Calculate stats
    const roleCountMap = new Map<string, number>();
    peopleWithConnections.forEach(p => {
      p.top_roles.forEach(role => {
        roleCountMap.set(role, (roleCountMap.get(role) || 0) + 1);
      });
    });

    const roleStats = Array.from(roleCountMap.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setStats({
      total_people: peopleWithConnections.length,
      people_with_connections: peopleWithConnections.filter(p => p.connections.total > 0).length,
      total_connections: peopleWithConnections.reduce((sum, p) => sum + p.connections.total, 0),
      public_profiles: peopleWithConnections.filter(p => p.is_public).length,
      empathy_ledger_synced: peopleWithConnections.filter(p => p.synced_from_empathy_ledger).length,
      by_role: roleStats,
    });

    setLoading(false);
  }

  // Filter and sort people
  const filteredPeople = people
    .filter(p => {
      // Search filter
      if (searchQuery && !p.full_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Connection filter
      if (filterConnected === 'connected' && p.connections.total === 0) return false;
      if (filterConnected === 'unconnected' && p.connections.total > 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'connections') return b.connections.total - a.connections.total;
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="text-2xl font-black">Loading network...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content">
        {/* Header */}
        <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white py-12 border-b-4 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-4">
              <Network className="h-10 w-10" />
              <h1 className="text-4xl md:text-5xl font-black">People in the Network</h1>
            </div>
            <p className="text-xl text-white/80 max-w-2xl">
              Overview of all people connected to JusticeHub - their roles, relationships, and contributions across the platform.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        {stats && (
          <section className="container-justice py-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Users className="h-6 w-6 mb-2 text-violet-600" />
                <div className="text-3xl font-black">{stats.total_people}</div>
                <div className="text-sm font-bold text-gray-600">Total People</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <UserCheck className="h-6 w-6 mb-2 text-green-600" />
                <div className="text-3xl font-black">{stats.people_with_connections}</div>
                <div className="text-sm font-bold text-gray-600">With Connections</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Network className="h-6 w-6 mb-2 text-blue-600" />
                <div className="text-3xl font-black">{stats.total_connections}</div>
                <div className="text-sm font-bold text-gray-600">Total Connections</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <TrendingUp className="h-6 w-6 mb-2 text-orange-600" />
                <div className="text-3xl font-black">{stats.public_profiles}</div>
                <div className="text-sm font-bold text-gray-600">Public Profiles</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl mb-2">✨</div>
                <div className="text-3xl font-black">{stats.empathy_ledger_synced}</div>
                <div className="text-sm font-bold text-gray-600">From Empathy Ledger</div>
              </div>
            </div>
          </section>
        )}

        {/* Top Roles */}
        {stats && stats.by_role.length > 0 && (
          <section className="container-justice pb-8">
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xl font-black mb-4">Top Roles in Network</h2>
              <div className="flex flex-wrap gap-3">
                {stats.by_role.map(({ role, count }) => (
                  <div key={role} className="flex items-center gap-2">
                    <RoleBadge role={role} />
                    <span className="text-sm font-bold text-gray-600">×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters & Search */}
        <section className="container-justice pb-4">
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-black"
                  placeholder="Search people..."
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  value={filterConnected}
                  onChange={(e) => setFilterConnected(e.target.value as any)}
                  className="px-3 py-2 border-2 border-black font-bold"
                >
                  <option value="all">All People</option>
                  <option value="connected">With Connections</option>
                  <option value="unconnected">No Connections</option>
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border-2 border-black font-bold"
              >
                <option value="connections">Most Connected</option>
                <option value="name">A-Z Name</option>
              </select>
            </div>
          </div>
        </section>

        {/* People List */}
        <section className="container-justice pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {person.photo_url ? (
                        <img
                          src={person.photo_url}
                          alt={person.full_name}
                          className="w-12 h-12 rounded-full border-2 border-black object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-black bg-gray-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-lg truncate">{person.full_name}</h3>
                        {person.synced_from_empathy_ledger && (
                          <span className="text-xs">✨</span>
                        )}
                        {!person.is_public && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 border border-gray-300 font-bold">
                            PRIVATE
                          </span>
                        )}
                      </div>
                      {person.tagline && (
                        <p className="text-sm text-gray-600 truncate">{person.tagline}</p>
                      )}
                      {person.top_roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {person.top_roles.slice(0, 2).map((role, i) => (
                            <RoleBadge key={i} role={role} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connection Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div title="Organizations">
                        <Building2 className="h-4 w-4 mx-auto text-cyan-600" />
                        <div className="text-sm font-bold">{person.connections.organizations}</div>
                      </div>
                      <div title="Programs">
                        <Users className="h-4 w-4 mx-auto text-eucalyptus-600" />
                        <div className="text-sm font-bold">{person.connections.programs}</div>
                      </div>
                      <div title="Art Projects">
                        <Palette className="h-4 w-4 mx-auto text-ochre-600" />
                        <div className="text-sm font-bold">{person.connections.art_projects}</div>
                      </div>
                      <div title="Services">
                        <Briefcase className="h-4 w-4 mx-auto text-blue-600" />
                        <div className="text-sm font-bold">{person.connections.services}</div>
                      </div>
                      <div title="Stories">
                        <FileText className="h-4 w-4 mx-auto text-violet-600" />
                        <div className="text-sm font-bold">{person.connections.stories}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <Link
                  href={`/admin/profiles/${person.id}/connections`}
                  className="block px-4 py-3 bg-gray-50 border-t-2 border-black font-bold text-sm hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Manage Connections</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          {filteredPeople.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-bold">No people found</p>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
