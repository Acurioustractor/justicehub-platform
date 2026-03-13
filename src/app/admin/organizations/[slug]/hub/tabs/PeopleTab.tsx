'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Loader2,
  Plus,
  Eye,
  EyeOff,
  Star,
  Edit3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Shield,
  Search,
  X,
  Layers,
  UserPlus,
  FileText,
  Tag,
  Save,
  BookOpen,
  Quote,
} from 'lucide-react';

interface ELEnrichment {
  themes: { name: string; count: number }[];
  quotes: { text: string; context: string; impactScore: number }[];
  cultural_background: string | null;
  is_elder: boolean;
  transcript_count: number;
  story_count: number;
}

interface OrgPerson {
  link_id: string;
  role: string | null;
  role_description: string | null;
  is_current: boolean;
  is_featured: boolean;
  display_order: number;
  profile: {
    id: string;
    full_name: string;
    slug: string;
    preferred_name: string | null;
    bio: string | null;
    photo_url: string | null;
    role_tags: string[] | null;
    is_public: boolean;
    is_featured: boolean;
    location: string | null;
    empathy_ledger_profile_id: string | null;
    synced_from_empathy_ledger: boolean;
    last_synced_at: string | null;
  };
  elEnrichment: ELEnrichment | null;
  linkedPrograms: { id: string; name: string }[];
}

type PersonType = 'founder' | 'staff' | 'elder' | 'community' | 'youth' | 'volunteer' | 'partner';

const PERSON_TYPES: { value: PersonType; label: string; description: string }[] = [
  { value: 'founder', label: 'Founder', description: 'Founder or co-founder of the organisation' },
  { value: 'staff', label: 'Staff', description: 'Organisation employee or contractor' },
  { value: 'elder', label: 'Elder / Cultural Authority', description: 'Cultural leader or elder advisor' },
  { value: 'community', label: 'Community Member', description: 'Community participant or supporter' },
  { value: 'youth', label: 'Young Person', description: 'Youth participant (use initials for privacy)' },
  { value: 'volunteer', label: 'Volunteer', description: 'Volunteer supporter' },
  { value: 'partner', label: 'Partner', description: 'External partner or collaborator' },
];

// -- Community Voice Summary sub-component --
function CommunityVoiceSummary({ orgId }: { orgId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/org-hub/${orgId}/analysis`)
      .then(res => res.json())
      .then(json => {
        if (!json.error && json.data) setData(json.data);
      })
      .catch(err => console.error('Failed to fetch analysis:', err))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-bold">Loading community voice data...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const themes = (data.stories?.themes || []).slice(0, 12);
  const storyItems = data.stories?.items || [];
  const storytellers = data.storytellers?.fromStories || [];
  const storytellerCount = data.storytellers?.total || 0;
  const storyCount = data.stories?.total || 0;

  // Use projectAnalyses quotes if available, otherwise extract from story summaries
  const keyQuotes = (data.projectAnalyses?.[0]?.key_quotes || []).slice(0, 3);
  const impact = data.projectAnalyses?.[0]?.aggregated_impact;

  // Build storyteller lookup for avatars/names
  const storytellerMap: Record<string, any> = {};
  for (const s of storytellers) storytellerMap[s.id] = s;

  const hasContent = themes.length > 0 || storyItems.length > 0 || storytellers.length > 0;
  if (!hasContent) return null;

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-black">Empathy Ledger Report</h3>
          <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200">
            {storytellerCount} storytellers / {storyCount} stories
          </span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="border-t-2 border-black p-4 space-y-5">
          {/* Top Themes */}
          {themes.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Themes from Community Voices</p>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme: { name: string; count: number }) => (
                  <span
                    key={theme.name}
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1.5"
                  >
                    <Tag className="w-3 h-3" />
                    {theme.name.replace(/_/g, ' ')}
                    <span className="text-indigo-400 font-medium">({theme.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Quotes from projectAnalyses (if available) */}
          {keyQuotes.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Key Quotes</p>
              <div className="space-y-2">
                {keyQuotes.map((q: any, i: number) => (
                  <div key={i} className="p-3 bg-indigo-50 border border-indigo-200">
                    <div className="flex items-start gap-2">
                      <Quote className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-indigo-900 italic leading-relaxed">
                          &ldquo;{q.text || q.quote || q.content}&rdquo;
                        </p>
                        {(q.storyteller_name || q.speaker || q.attribution) && (
                          <p className="text-xs text-indigo-600 font-bold mt-1">
                            &mdash; {q.storyteller_name || q.speaker || q.attribution}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALMA Impact Signals */}
          {impact && typeof impact === 'object' && Object.keys(impact).length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">ALMA Impact Signals</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {Object.entries(impact).map(([key, value]) => {
                  const pct = typeof value === 'number' ? Math.round(value * 100) : null;
                  if (pct === null) return null;
                  return (
                    <div key={key} className="p-2 bg-indigo-50 border border-indigo-200 text-center">
                      <p className="text-lg font-black text-indigo-700">{pct}%</p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase mt-0.5">
                        {key.replace(/_/g, ' ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stories with Summaries */}
          {storyItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Stories</p>
              <div className="space-y-2">
                {storyItems.map((story: any) => {
                  const teller = story.storyteller_id ? storytellerMap[story.storyteller_id] : null;
                  const isOpen = expandedStory === story.id;
                  return (
                    <div key={story.id} className="border border-indigo-200 bg-indigo-50/50">
                      <button
                        onClick={() => setExpandedStory(isOpen ? null : story.id)}
                        className="w-full text-left p-3 flex items-start gap-3 hover:bg-indigo-50 transition-colors"
                      >
                        {teller?.public_avatar_url ? (
                          <img src={teller.public_avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-indigo-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-indigo-900 truncate">{story.title}</p>
                            {story.is_public && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-200 flex-shrink-0">Public</span>
                            )}
                          </div>
                          {teller && (
                            <p className="text-[11px] text-indigo-600 font-medium mt-0.5">{teller.display_name}</p>
                          )}
                          {(story.themes || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {story.themes.slice(0, 4).map((t: string) => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-500 border border-indigo-200">
                                  {t.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                      </button>
                      {isOpen && story.summary && (
                        <div className="px-3 pb-3 pt-0 ml-11">
                          <div className="flex items-start gap-2 p-2 bg-white border border-indigo-200">
                            <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-800 italic leading-relaxed">{story.summary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Storyteller Profiles */}
          {storytellers.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Storytellers</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {storytellers.map((s: any) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200">
                    {s.public_avatar_url ? (
                      <img src={s.public_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-indigo-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-indigo-600">
                          {s.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{s.display_name}</p>
                        {s.is_elder && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-ochre-100 text-ochre-700 border border-ochre-200 flex-shrink-0">Elder</span>
                        )}
                      </div>
                      {s.bio && (
                        <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{s.bio}</p>
                      )}
                      {s.cultural_background && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.cultural_background}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PeopleTab({ orgId }: { orgId: string }) {
  const [people, setPeople] = useState<OrgPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [transcripts, setTranscripts] = useState<Record<string, any[]>>({});
  const [loadingTranscripts, setLoadingTranscripts] = useState<string | null>(null);

  // Add form state
  const [orgStories, setOrgStories] = useState<any[]>([]);

  const [newPerson, setNewPerson] = useState({
    full_name: '',
    preferred_name: '',
    role: '',
    role_description: '',
    person_type: 'staff' as PersonType,
    bio: '',
    location: '',
    is_public: true,
    is_featured: false,
  });

  const fetchPeople = useCallback(async () => {
    try {
      const [peopleRes, storiesRes] = await Promise.all([
        fetch(`/api/org-hub/${orgId}/people`),
        fetch(`/api/org-hub/${orgId}/stories`),
      ]);
      if (peopleRes.ok) {
        const json = await peopleRes.json();
        setPeople(json.data || []);
      }
      if (storiesRes.ok) {
        const json = await storiesRes.json();
        setOrgStories(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch people:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  // Auto-load transcripts when a person with EL profile is expanded
  useEffect(() => {
    if (!expandedPerson) return;
    const person = people.find(p => p.link_id === expandedPerson);
    if (!person) return;
    const elId = person.profile.empathy_ledger_profile_id;
    if (!elId) return;
    if (transcripts[elId]) return; // already loaded
    if (loadingTranscripts === person.link_id) return; // already loading
    fetchTranscripts(person);
  }, [expandedPerson, people]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPerson = async () => {
    if (!newPerson.full_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/people`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerson),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewPerson({
          full_name: '',
          preferred_name: '',
          role: '',
          role_description: '',
          person_type: 'staff',
          bio: '',
          location: '',
          is_public: true,
          is_featured: false,
        });
        await fetchPeople();
      }
    } catch (err) {
      console.error('Failed to add person:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (person: OrgPerson) => {
    setToggling(person.link_id);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/people/${person.profile.id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !person.profile.is_public }),
      });
      if (res.ok) await fetchPeople();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    } finally {
      setToggling(null);
    }
  };

  const handleToggleFeatured = async (person: OrgPerson) => {
    setToggling(`feat-${person.link_id}`);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/people/${person.profile.id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !person.is_featured }),
      });
      if (res.ok) await fetchPeople();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    } finally {
      setToggling(null);
    }
  };

  const startEditing = (person: OrgPerson) => {
    setEditingPerson(person.link_id);
    setEditRole(person.role || '');
    setEditTags([...(person.profile.role_tags || [])]);
  };

  const handleSaveEdit = async (person: OrgPerson) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/people/${person.profile.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole, role_tags: editTags }),
      });
      if (res.ok) {
        setEditingPerson(null);
        await fetchPeople();
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const fetchTranscripts = async (person: OrgPerson) => {
    const elId = person.profile.empathy_ledger_profile_id;
    if (!elId) return;
    if (transcripts[elId]) return; // already loaded

    setLoadingTranscripts(person.link_id);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/people/${person.profile.id}/transcripts`);
      if (res.ok) {
        const json = await res.json();
        setTranscripts(prev => ({ ...prev, [elId]: json.data || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch transcripts:', err);
    } finally {
      setLoadingTranscripts(null);
    }
  };

  // Compute filter counts
  const publicCount = people.filter(p => p.profile.is_public).length;
  const elSyncedCount = people.filter(p => p.profile.synced_from_empathy_ledger).length;
  const featuredCount = people.filter(p => p.is_featured).length;
  const hasStoriesCount = people.filter(p => (transcripts[p.profile.empathy_ledger_profile_id || ''] || []).length > 0).length;
  const typeCounts: Record<string, number> = {};
  for (const p of people) {
    for (const tag of (p.profile.role_tags || [])) {
      typeCounts[tag] = (typeCounts[tag] || 0) + 1;
    }
  }

  // Filtered people
  const filteredPeople = people.filter(p => {
    if (filter === 'current') return p.is_current;
    if (filter === 'public') return p.profile.is_public;
    if (filter === 'el-synced') return p.profile.synced_from_empathy_ledger;
    if (filter === 'featured') return p.is_featured;
    if (filter === 'has-stories') return (transcripts[p.profile.empathy_ledger_profile_id || ''] || []).length > 0;
    // Type filters
    if (PERSON_TYPES.some(t => t.value === filter)) {
      return (p.profile.role_tags || []).includes(filter);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-xl font-black">People</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {people.length} people — {publicCount} public, {elSyncedCount} synced from Empathy Ledger
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-2 text-sm font-bold bg-ochre-600 text-white hover:bg-ochre-700 inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Person
        </button>
      </div>

      {/* Community Voice Summary */}
      <CommunityVoiceSummary orgId={orgId} />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: `All (${people.length})` },
            { key: 'current', label: `Current (${people.filter(p => p.is_current).length})` },
            { key: 'public', label: `Public (${publicCount})` },
            { key: 'featured', label: `Featured (${featuredCount})` },
            { key: 'el-synced', label: `EL Synced (${elSyncedCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                filter === f.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Type filters */}
        <div className="flex flex-wrap gap-1.5">
          {PERSON_TYPES.filter(t => (typeCounts[t.value] || 0) > 0).map(t => (
            <button
              key={t.value}
              onClick={() => setFilter(filter === t.value ? 'all' : t.value)}
              className={`px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                filter === t.value
                  ? 'bg-black text-white border-black'
                  : 'bg-earth-50 text-earth-700 border-earth-200 hover:border-earth-400'
              }`}
            >
              {t.label} ({typeCounts[t.value]})
            </button>
          ))}
        </div>
      </div>

      {/* EL consent note */}
      <div className="p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Empathy Ledger consent controls</p>
            <p className="mt-0.5">
              People synced from Empathy Ledger control their own visibility through the EL platform.
              Their <code className="bg-blue-100 px-1">justicehub_enabled</code> flag determines whether they appear publicly.
              You can set organisational visibility here, but EL consent always takes precedence.
            </p>
          </div>
        </div>
      </div>

      {/* Add Person Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black">Add New Person</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Full Name *</label>
              <input
                type="text"
                value={newPerson.full_name}
                onChange={(e) => setNewPerson({ ...newPerson, full_name: e.target.value })}
                className="w-full border-2 border-black p-2 text-sm focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                placeholder="e.g. Kristy Bloomfield or 'MS' for privacy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Preferred Name</label>
              <input
                type="text"
                value={newPerson.preferred_name}
                onChange={(e) => setNewPerson({ ...newPerson, preferred_name: e.target.value })}
                className="w-full border-2 border-black p-2 text-sm focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                placeholder="How they like to be called"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Type</label>
              <select
                value={newPerson.person_type}
                onChange={(e) => setNewPerson({ ...newPerson, person_type: e.target.value as PersonType })}
                className="w-full border-2 border-black p-2 text-sm focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              >
                {PERSON_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {PERSON_TYPES.find(t => t.value === newPerson.person_type)?.description}
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Role / Title</label>
              <input
                type="text"
                value={newPerson.role}
                onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
                className="w-full border-2 border-black p-2 text-sm focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                placeholder="e.g. Director, Elder Advisor, Youth Participant"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">Bio</label>
              <textarea
                value={newPerson.bio}
                onChange={(e) => setNewPerson({ ...newPerson, bio: e.target.value })}
                rows={3}
                className="w-full border-2 border-black p-2 text-sm focus:ring-2 focus:ring-ochre-600 focus:outline-none resize-none"
                placeholder="Brief bio or description..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Location</label>
              <input
                type="text"
                value={newPerson.location}
                onChange={(e) => setNewPerson({ ...newPerson, location: e.target.value })}
                className="w-full border-2 border-black p-2 text-sm focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                placeholder="e.g. Alice Springs, NT"
              />
            </div>
            <div className="flex items-center gap-6 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPerson.is_public}
                  onChange={(e) => setNewPerson({ ...newPerson, is_public: e.target.checked })}
                  className="w-4 h-4 accent-ochre-600"
                />
                <span className="text-sm font-bold">Public profile</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPerson.is_featured}
                  onChange={(e) => setNewPerson({ ...newPerson, is_featured: e.target.checked })}
                  className="w-4 h-4 accent-ochre-600"
                />
                <span className="text-sm font-bold">Featured</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPerson}
              disabled={saving || !newPerson.full_name.trim()}
              className="px-4 py-2 text-sm font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Person
            </button>
          </div>
        </div>
      )}

      {/* People list */}
      {filteredPeople.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-600">
            {people.length === 0 ? 'No people added yet' : 'No matches for this filter'}
          </p>
          {people.length === 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700"
            >
              <UserPlus className="w-4 h-4" />
              Add First Person
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPeople.map((person) => {
            const isExpanded = expandedPerson === person.link_id;
            const p = person.profile;

            return (
              <div key={person.link_id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* Person row */}
                <button
                  onClick={() => setExpandedPerson(isExpanded ? null : person.link_id)}
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-earth-100 border-2 border-earth-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-earth-600">
                        {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm">{p.preferred_name || p.full_name}</h3>
                      {person.elEnrichment?.is_elder && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-ochre-100 text-ochre-700 border border-ochre-200">Elder</span>
                      )}
                      {person.is_featured && <Star className="w-3 h-3 text-ochre-500 fill-ochre-500" />}
                      {p.synced_from_empathy_ledger && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200" title="Synced from Empathy Ledger">
                          EL
                        </span>
                      )}
                      {person.elEnrichment && person.elEnrichment.transcript_count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-0.5">
                          <BookOpen className="w-3 h-3" />
                          {person.elEnrichment.transcript_count} {person.elEnrichment.transcript_count === 1 ? 'transcript' : 'transcripts'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {person.role && (
                        <span className="text-xs text-gray-600">{person.role}</span>
                      )}
                      {!p.is_public && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-600 flex items-center gap-0.5">
                          <EyeOff className="w-3 h-3" /> Private
                        </span>
                      )}
                      {!person.is_current && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200">
                          Past
                        </span>
                      )}
                      {(p.role_tags || []).length > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {(p.role_tags || []).slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                    {/* Inline themes from EL */}
                    {(person.elEnrichment?.themes || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {person.elEnrichment!.themes.slice(0, 4).map(t => (
                          <span key={t.name} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200">
                            {t.name.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {person.elEnrichment!.themes.length > 4 && (
                          <span className="text-[10px] text-indigo-400">+{person.elEnrichment!.themes.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t-2 border-black p-4 space-y-4">
                    {/* Bio */}
                    {p.bio && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Bio</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{p.bio}</p>
                      </div>
                    )}

                    {/* EL Enrichment: quotes, cultural background, expertise */}
                    {person.elEnrichment && (
                      <div className="space-y-3">
                        {/* Cultural background */}
                        {person.elEnrichment.cultural_background && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Cultural Background</p>
                            <p className="text-xs text-gray-700">{person.elEnrichment.cultural_background}</p>
                          </div>
                        )}

                        {/* Themes */}
                        {person.elEnrichment.themes.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Key Themes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {person.elEnrichment.themes.map(t => (
                                <span key={t.name} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium inline-flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5" />
                                  {t.name.replace(/_/g, ' ')}
                                  <span className="text-indigo-400">({t.count})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Quotes from transcripts */}
                        {person.elEnrichment.quotes.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Key Quotes</p>
                            <div className="space-y-2">
                              {person.elEnrichment.quotes.map((q, i) => (
                                <div key={i} className="p-3 bg-indigo-50 border border-indigo-200">
                                  <div className="flex items-start gap-2">
                                    <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs text-indigo-900 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                                      {q.context && (
                                        <p className="text-[10px] text-indigo-500 mt-1">{q.context}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Role & Tags — editable */}
                    {editingPerson === person.link_id ? (
                      <div className="p-3 bg-gray-50 border border-gray-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold mb-1">Role / Title</label>
                            <input
                              type="text"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="w-full border-2 border-black p-2 text-sm focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1">Type Tags</label>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {editTags.map(tag => (
                                <span key={tag} className="text-xs px-2 py-0.5 bg-earth-100 border border-earth-300 text-earth-700 font-medium inline-flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => removeTag(tag)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {PERSON_TYPES.filter(t => !editTags.includes(t.value)).map(t => (
                                <button
                                  key={t.value}
                                  onClick={() => addTag(t.value)}
                                  className="text-[10px] px-2 py-0.5 border border-dashed border-gray-300 text-gray-500 hover:border-earth-400 hover:text-earth-600 hover:bg-earth-50"
                                >
                                  + {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(person)}
                            disabled={savingEdit}
                            className="px-3 py-1.5 text-xs font-bold bg-ochre-600 text-white hover:bg-ochre-700 inline-flex items-center gap-1"
                          >
                            {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPerson(null)}
                            className="px-3 py-1.5 text-xs font-bold border border-gray-300 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          {/* Details grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {person.role_description && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Role Description</p>
                                <p className="text-xs text-gray-700">{person.role_description}</p>
                              </div>
                            )}
                            {p.location && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                                <p className="text-xs text-gray-700">{p.location}</p>
                              </div>
                            )}
                            {p.empathy_ledger_profile_id && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Empathy Ledger</p>
                                <p className="text-xs text-blue-600 font-medium">Linked</p>
                                {p.last_synced_at && (
                                  <p className="text-[10px] text-gray-400">
                                    Synced {new Date(p.last_synced_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Tags display */}
                          {(p.role_tags || []).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {p.role_tags!.map(tag => {
                                const typeInfo = PERSON_TYPES.find(t => t.value === tag);
                                return (
                                  <span key={tag} className="text-xs px-2 py-0.5 bg-earth-100 border border-earth-300 text-earth-700 font-medium">
                                    {typeInfo?.label || tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => startEditing(person)}
                          className="px-2 py-1 text-xs font-bold text-gray-400 hover:text-black flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    )}

                    {/* Linked Programs */}
                    {person.linkedPrograms.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Linked Programs</p>
                        <div className="flex flex-wrap gap-1">
                          {person.linkedPrograms.map(prog => (
                            <span key={prog.id} className="text-xs px-2 py-0.5 bg-ochre-50 border border-ochre-200 text-ochre-700 font-medium flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {prog.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked JH Stories */}
                    {orgStories.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Organisation Stories</p>
                        <div className="space-y-1.5">
                          {orgStories.map((story: any) => (
                            <div key={story.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                              <div className="flex items-center gap-2 min-w-0">
                                <BookOpen className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-gray-700 truncate">{story.title}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0 ${
                                  story.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {story.status}
                                </span>
                                {story.category && (
                                  <span className="text-[10px] text-gray-400 flex-shrink-0">{story.category}</span>
                                )}
                              </div>
                              <Link
                                href={`/admin/stories/${story.slug || story.id}`}
                                className="text-[10px] font-bold text-ochre-600 hover:text-ochre-800 flex-shrink-0 ml-2"
                              >
                                View
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transcripts section — only for EL-synced profiles */}
                    {p.empathy_ledger_profile_id && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Empathy Ledger Stories</p>
                          {!transcripts[p.empathy_ledger_profile_id] && (
                            <button
                              onClick={() => fetchTranscripts(person)}
                              disabled={loadingTranscripts === person.link_id}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {loadingTranscripts === person.link_id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <FileText className="w-3 h-3" />
                              )}
                              Load Stories
                            </button>
                          )}
                        </div>

                        {transcripts[p.empathy_ledger_profile_id] && (
                          <>
                            {transcripts[p.empathy_ledger_profile_id].length === 0 ? (
                              <p className="text-xs text-gray-400">No stories found in Empathy Ledger for this person</p>
                            ) : (
                              <div className="space-y-2">
                                {transcripts[p.empathy_ledger_profile_id].map((t: any) => (
                                  <div key={t.id} className="p-3 bg-blue-50 border border-blue-200">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-blue-800 text-xs">{t.title || 'Untitled Story'}</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {t.collection_date && (
                                            <span className="text-[10px] text-blue-600">
                                              {new Date(t.collection_date).toLocaleDateString()}
                                            </span>
                                          )}
                                          {t.word_count > 0 && (
                                            <span className="text-[10px] text-blue-600">{t.word_count.toLocaleString()} words</span>
                                          )}
                                          {t.story_type && (
                                            <span className="text-[10px] text-blue-500">{t.story_type.replace(/_/g, ' ')}</span>
                                          )}
                                          {t.privacy_level && (
                                            <span className={`text-[10px] font-bold px-1 py-0.5 ${
                                              t.privacy_level === 'public' ? 'bg-green-100 text-green-700' :
                                              t.privacy_level === 'community' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-gray-100 text-gray-600'
                                            }`}>
                                              {t.privacy_level}
                                            </span>
                                          )}
                                        </div>
                                        {t.content_preview && (
                                          <p className="text-xs text-blue-700/70 mt-1 line-clamp-2 italic">{t.content_preview}</p>
                                        )}
                                        {(t.themes || []).length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {t.themes.slice(0, 4).map((theme: string) => (
                                              <span key={theme} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 border border-blue-200">
                                                {theme.replace(/_/g, ' ')}
                                              </span>
                                            ))}
                                            {t.themes.length > 4 && (
                                              <span className="text-[10px] text-blue-400">+{t.themes.length - 4}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1 flex-shrink-0">
                                        {t.consent_for_story_creation && (
                                          <Link
                                            href={`/admin/stories/transcript?el_story=${t.id}`}
                                            className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                                          >
                                            <FileText className="w-3 h-3" />
                                            Extract
                                          </Link>
                                        )}
                                        {!t.consent_for_story_creation && (
                                          <span className="text-[10px] text-gray-400 px-2 py-1">
                                            {t.privacy_level === 'private' ? 'Private' : 'Not public'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleVisibility(person)}
                        disabled={toggling === person.link_id}
                        className={`px-3 py-1.5 text-xs font-bold border inline-flex items-center gap-1 ${
                          p.is_public
                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {toggling === person.link_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : p.is_public ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {p.is_public ? 'Public' : 'Private'}
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(person)}
                        disabled={toggling === `feat-${person.link_id}`}
                        className={`px-3 py-1.5 text-xs font-bold border inline-flex items-center gap-1 ${
                          person.is_featured
                            ? 'border-ochre-300 text-ochre-700 hover:bg-ochre-50'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {toggling === `feat-${person.link_id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Star className={`w-3 h-3 ${person.is_featured ? 'fill-ochre-500' : ''}`} />
                        )}
                        {person.is_featured ? 'Featured' : 'Feature'}
                      </button>
                      <Link
                        href={`/people/${p.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 text-xs font-bold border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-1 text-gray-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Profile
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
