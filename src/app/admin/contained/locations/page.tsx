'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin, Users, Building2, DollarSign, BarChart3,
  CheckCircle, AlertTriangle, ArrowRight, Loader2,
  ExternalLink, Shield, Megaphone, Target, Calendar,
  ChevronDown, ChevronRight
} from 'lucide-react';

interface TourStop {
  city: string;
  state: string;
  partner: string;
  date: string;
  status: string;
  description: string;
  event_slug: string;
}

interface OrgBrief {
  name: string;
  city: string | null;
  is_indigenous_org: boolean;
  interventions: number;
  total_funding: number;
}

interface PersonBrief {
  name: string;
  org: string | null;
  status: string;
  score: number;
  approach: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
}

interface LocationData {
  stop: TourStop;
  orgs: OrgBrief[];
  people: PersonBrief[];
  stats: { indigenous_orgs: number; interventions: number; funding_records: number };
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

const STATUS_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-800',
  responded: 'bg-emerald-100 text-emerald-800',
  active: 'bg-blue-100 text-blue-800',
  warm: 'bg-amber-100 text-amber-800',
  sent: 'bg-gray-100 text-gray-600',
  pending: 'bg-gray-50 text-gray-500',
  overdue: 'bg-red-200 text-red-900',
  cold: 'bg-blue-50 text-blue-600',
  'follow-up': 'bg-purple-100 text-purple-700',
};

function LocationCard({ data, expanded, onToggle }: { data: LocationData; expanded: boolean; onToggle: () => void }) {
  const { stop, orgs, people, stats } = data;
  const hotPeople = people.filter(p => ['hot', 'responded', 'active', 'overdue'].includes(p.status));
  const pendingPeople = people.filter(p => !['hot', 'responded', 'active', 'overdue'].includes(p.status));

  return (
    <div className={`bg-white mb-4 ${stop.status === 'demand' ? 'border-2 border-dashed border-amber-400' : 'border-2 border-[#0A0A0A]'}`}>
      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${stop.status === 'demand' ? 'bg-amber-100 text-amber-800' : 'bg-[#0A0A0A] text-white'}`}>
            {stop.status === 'demand' ? '📣' : stop.state}
          </div>
          <div>
            <h3 className="font-black text-lg">{stop.city}</h3>
            <p className="text-sm text-gray-500">
              {new Date(stop.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · {stop.partner}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {people.length}</span>
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {orgs.length}</span>
            <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> {stats.interventions}</span>
          </div>
          {hotPeople.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
              {hotPeople.length} hot
            </span>
          )}
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t-2 border-[#0A0A0A]">
          {/* Stats strip */}
          <div className="grid grid-cols-4 border-b border-gray-100">
            <div className="p-4 text-center border-r border-gray-100">
              <p className="text-2xl font-black">{stats.indigenous_orgs}</p>
              <p className="text-xs text-gray-500">Indigenous Orgs</p>
            </div>
            <div className="p-4 text-center border-r border-gray-100">
              <p className="text-2xl font-black">{stats.interventions}</p>
              <p className="text-xs text-gray-500">Interventions</p>
            </div>
            <div className="p-4 text-center border-r border-gray-100">
              <p className="text-2xl font-black">{people.length}</p>
              <p className="text-xs text-gray-500">People Connected</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-black">{orgs.filter(o => o.interventions > 0).length}</p>
              <p className="text-xs text-gray-500">Orgs with Programs</p>
            </div>
          </div>

          {/* Description */}
          {stop.description && (
            <div className="px-5 py-3 bg-gray-50 text-sm text-gray-600 border-b border-gray-100">
              {stop.description}
            </div>
          )}

          {/* People */}
          {people.length > 0 && (
            <div className="p-5 border-b border-gray-100">
              <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-3">People</h4>
              <div className="space-y-2">
                {hotPeople.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{p.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                          {p.status}
                        </span>
                        {p.source === 'notion' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">📦 Notion</span>}
                        {p.score > 0 && <span className="text-[10px] text-gray-400">{p.score}</span>}
                      </div>
                      {p.org && <p className="text-xs text-gray-500">{p.org}</p>}
                      {p.approach && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{p.approach}</p>}
                      {p.email && <a href={`mailto:${p.email}`} className="text-xs text-[#059669] hover:underline mt-1 block">{p.email}</a>}
                    </div>
                  </div>
                ))}
                {pendingPeople.slice(0, 12).map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                          {p.status}
                        </span>
                        {p.source === 'notion' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">📦 Notion</span>}
                      </div>
                      {p.org && <p className="text-xs text-gray-400">{p.org}</p>}
                      {p.approach && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.approach}</p>}
                      {p.email && <a href={`mailto:${p.email}`} className="text-xs text-[#059669] hover:underline">{p.email}</a>}
                    </div>
                  </div>
                ))}
                {pendingPeople.length > 12 && (
                  <p className="text-xs text-gray-400 pl-2">+ {pendingPeople.length - 12} more</p>
                )}
              </div>
            </div>
          )}

          {/* Orgs */}
          {orgs.length > 0 && (
            <div className="p-5 border-b border-gray-100">
              <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-3">Youth Justice Orgs</h4>
              <div className="space-y-1">
                {orgs.slice(0, 8).map((o, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {o.is_indigenous_org && <Shield className="w-3 h-3 text-purple-500 flex-shrink-0" />}
                      <span className="truncate">{o.name}</span>
                      {o.city && <span className="text-xs text-gray-400 flex-shrink-0">{o.city}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                      {o.interventions > 0 && <span>{o.interventions} progs</span>}
                      {o.total_funding > 0 && <span className="font-mono">{formatDollars(o.total_funding)}</span>}
                    </div>
                  </div>
                ))}
                {orgs.length > 8 && (
                  <p className="text-xs text-gray-400 pl-2">+ {orgs.length - 8} more in {stop.state}</p>
                )}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="p-4 bg-gray-50 flex flex-wrap gap-3 text-xs">
            <Link href={`/contained/tour/${stop.event_slug}`} className="text-[#059669] hover:underline flex items-center gap-1">
              Tour stop page <ExternalLink className="w-3 h-3" />
            </Link>
            <Link href={`/for-funders/evidence-gaps`} className="text-blue-600 hover:underline flex items-center gap-1">
              Evidence gaps <ExternalLink className="w-3 h-3" />
            </Link>
            <Link href="/for-funders/compare" className="text-purple-600 hover:underline flex items-center gap-1">
              Funder comparison <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContainedLocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/admin/contained/locations');
      if (!res.ok) throw new Error(res.status === 401 ? 'Not authenticated' : res.status === 403 ? 'Not authorized' : 'Failed to load');
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/campaign-engine" className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">
              ← Campaign Engine
            </Link>
            <h1 className="text-3xl font-black">Tour Stop Locations</h1>
            <p className="text-gray-500 mt-1">
              {locations.length} stops · People, orgs, and data per location
            </p>
          </div>
          <Link
            href="/viz/ecosystem-map.html"
            target="_blank"
            className="bg-[#0A0A0A] text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            Map <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border-2 border-[#0A0A0A] p-4 text-center">
            <p className="text-3xl font-black">{locations.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Tour Stops</p>
          </div>
          <div className="bg-white border-2 border-[#0A0A0A] p-4 text-center">
            <p className="text-3xl font-black">{locations.reduce((s, l) => s + l.people.length, 0)}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">People Connected</p>
          </div>
          <div className="bg-white border-2 border-[#0A0A0A] p-4 text-center">
            <p className="text-3xl font-black text-yellow-700">
              {locations.reduce((s, l) => s + l.people.filter(p => p.source === 'notion').length, 0)}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">📦 Notion Requesters</p>
          </div>
        </div>

        {/* Location cards */}
        {locations.length === 0 ? (
          <div className="bg-white border-2 border-[#0A0A0A] p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tour stops found. Check the tour_stops table.</p>
          </div>
        ) : (
          locations
            .sort((a, b) => new Date(a.stop.date).getTime() - new Date(b.stop.date).getTime())
            .map((loc, i) => (
              <LocationCard
                key={loc.stop.event_slug}
                data={loc}
                expanded={expandedIdx === i}
                onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
              />
            ))
        )}

        {/* Quick links */}
        <div className="mt-8 bg-white border-2 border-[#0A0A0A] p-5">
          <h3 className="font-bold mb-3">Campaign Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/campaign-engine" className="text-sm text-[#059669] hover:underline">Campaign Engine →</Link>
            <Link href="/admin/contained/crm" className="text-sm text-[#059669] hover:underline">CRM Contacts →</Link>
            <Link href="/for-funders" className="text-sm text-[#059669] hover:underline">Funder Hub →</Link>
            <Link href="/contained/tour" className="text-sm text-[#059669] hover:underline">Public Tour Page →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
