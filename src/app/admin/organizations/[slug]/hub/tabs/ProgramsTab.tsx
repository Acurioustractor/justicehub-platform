'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Users, BookOpen, TrendingUp, Link2, UserPlus, Plus, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Program {
  id: string;
  name: string;
  description: string | null;
  approach: string | null;
  impact_summary: string | null;
  success_rate: number | null;
  participants_served: number | null;
  tags: string[] | null;
}

interface LinkedStory {
  id: string;
  title: string;
  slug: string | null;
  status: string;
}

interface LinkedPerson {
  id: string;
  full_name: string;
  slug: string | null;
  role: string | null;
  photo_url: string | null;
}

export function ProgramsTab({ orgId }: { orgId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [linkedStories, setLinkedStories] = useState<Record<string, LinkedStory[]>>({});
  const [linkedPeople, setLinkedPeople] = useState<Record<string, LinkedPerson[]>>({});
  const [linkingStory, setLinkingStory] = useState<string | null>(null);
  const [linkingPerson, setLinkingPerson] = useState<string | null>(null);
  const [availableStories, setAvailableStories] = useState<LinkedStory[]>([]);
  const [availablePeople, setAvailablePeople] = useState<LinkedPerson[]>([]);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/programs`);
      if (!res.ok) throw new Error('Failed to load programs');
      const json = await res.json();
      setPrograms(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const toggleExpand = async (programId: string) => {
    if (expandedProgram === programId) {
      setExpandedProgram(null);
      return;
    }
    setExpandedProgram(programId);
    // Fetch linked stories and people for this program
    if (!linkedStories[programId]) {
      try {
        const res = await fetch(`/api/org-hub/${orgId}/programs/${programId}/links`);
        if (res.ok) {
          const json = await res.json();
          setLinkedStories(prev => ({ ...prev, [programId]: json.stories || [] }));
          setLinkedPeople(prev => ({ ...prev, [programId]: json.people || [] }));
        }
      } catch { /* ignore */ }
    }
  };

  const startLinkStory = async (programId: string) => {
    setLinkingStory(programId);
    if (availableStories.length === 0) {
      try {
        const res = await fetch(`/api/org-hub/${orgId}/programs/available-stories`);
        if (res.ok) {
          const json = await res.json();
          setAvailableStories(json.data || []);
        }
      } catch { /* ignore */ }
    }
  };

  const startLinkPerson = async (programId: string) => {
    setLinkingPerson(programId);
    if (availablePeople.length === 0) {
      try {
        const res = await fetch(`/api/org-hub/${orgId}/programs/available-people`);
        if (res.ok) {
          const json = await res.json();
          setAvailablePeople(json.data || []);
        }
      } catch { /* ignore */ }
    }
  };

  const linkStory = async (programId: string, storyId: string) => {
    try {
      const res = await fetch(`/api/org-hub/${orgId}/programs/${programId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'story', targetId: storyId }),
      });
      if (res.ok) {
        const json = await res.json();
        setLinkedStories(prev => ({
          ...prev,
          [programId]: [...(prev[programId] || []), json.data],
        }));
        setLinkingStory(null);
      }
    } catch { /* ignore */ }
  };

  const linkPerson = async (programId: string, personId: string, role: string) => {
    try {
      const res = await fetch(`/api/org-hub/${orgId}/programs/${programId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'person', targetId: personId, role }),
      });
      if (res.ok) {
        const json = await res.json();
        setLinkedPeople(prev => ({
          ...prev,
          [programId]: [...(prev[programId] || []), json.data],
        }));
        setLinkingPerson(null);
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 p-4 text-red-700 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Programs</h2>
          <p className="text-sm text-gray-600 mt-1">
            {programs.length} program{programs.length !== 1 ? 's' : ''} — link stories and people to show impact
          </p>
        </div>
      </div>

      {programs.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-bold">No programs registered</p>
          <p className="text-sm text-gray-400 mt-1">
            Add programs via the{' '}
            <Link href="/community-programs/add" className="text-red-600 underline">
              community programs page
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => {
            const isExpanded = expandedProgram === program.id;
            const stories = linkedStories[program.id] || [];
            const people = linkedPeople[program.id] || [];

            return (
              <div
                key={program.id}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {/* Program Header */}
                <button
                  onClick={() => toggleExpand(program.id)}
                  className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-black">{program.name}</h3>
                        {program.approach && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                            {program.approach}
                          </span>
                        )}
                      </div>
                      {program.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {program.description}
                        </p>
                      )}
                      {/* Stats row */}
                      <div className="flex items-center gap-6 mt-3">
                        {program.participants_served != null && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-bold">{program.participants_served}</span>
                            <span className="text-gray-500">served</span>
                          </div>
                        )}
                        {program.success_rate != null && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-bold">{program.success_rate}%</span>
                            <span className="text-gray-500">success</span>
                          </div>
                        )}
                        {stories.length > 0 && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="font-bold">{stories.length}</span>
                            <span className="text-gray-500">stories</span>
                          </div>
                        )}
                        {people.length > 0 && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <UserPlus className="w-4 h-4 text-purple-500" />
                            <span className="font-bold">{people.length}</span>
                            <span className="text-gray-500">people</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t-2 border-black">
                    {/* Impact Summary */}
                    {program.impact_summary && (
                      <div className="p-5 bg-green-50 border-b border-gray-200">
                        <h4 className="text-xs font-black uppercase tracking-wider text-green-800 mb-2">Impact</h4>
                        <p className="text-sm text-green-900">{program.impact_summary}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {program.tags && program.tags.length > 0 && (
                      <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap gap-1.5">
                        {program.tags.slice(0, 10).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {tag}
                          </span>
                        ))}
                        {program.tags.length > 10 && (
                          <span className="text-xs text-gray-400">+{program.tags.length - 10} more</span>
                        )}
                      </div>
                    )}

                    {/* Linked Stories */}
                    <div className="p-5 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                          Linked Stories ({stories.length})
                        </h4>
                        <button
                          onClick={() => startLinkStory(program.id)}
                          className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          <Plus className="w-3 h-3" /> Link Story
                        </button>
                      </div>
                      {stories.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No stories linked yet. Link stories to show case studies for this program.</p>
                      ) : (
                        <div className="space-y-2">
                          {stories.map((story) => (
                            <div key={story.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <Link
                                href={story.slug ? `/stories/${story.slug}` : `/admin/stories/${story.id}`}
                                className="text-sm font-medium text-black hover:text-red-600 flex-1 truncate"
                              >
                                {story.title}
                              </Link>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                story.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {story.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Link Story Picker */}
                      {linkingStory === program.id && (
                        <div className="mt-3 border border-gray-200 rounded bg-white p-3 max-h-48 overflow-y-auto">
                          <p className="text-xs font-bold text-gray-500 mb-2">Select a story to link:</p>
                          {availableStories.length === 0 ? (
                            <p className="text-xs text-gray-400">No stories available for this organization.</p>
                          ) : (
                            availableStories
                              .filter(s => !stories.some(ls => ls.id === s.id))
                              .map((story) => (
                                <button
                                  key={story.id}
                                  onClick={() => linkStory(program.id, story.id)}
                                  className="block w-full text-left p-2 text-sm hover:bg-gray-50 rounded truncate"
                                >
                                  {story.title}
                                </button>
                              ))
                          )}
                          <button
                            onClick={() => setLinkingStory(null)}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Linked People */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                          Key People ({people.length})
                        </h4>
                        <button
                          onClick={() => startLinkPerson(program.id)}
                          className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          <Plus className="w-3 h-3" /> Link Person
                        </button>
                      </div>
                      {people.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No people linked yet. Link elders, staff, and community members.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {people.map((person) => (
                            <div key={person.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              {person.photo_url ? (
                                <img src={person.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={person.slug ? `/people/${person.slug}` : '#'}
                                  className="text-sm font-bold text-black hover:text-red-600 truncate block"
                                >
                                  {person.full_name}
                                </Link>
                                {person.role && (
                                  <p className="text-xs text-gray-500 truncate">{person.role}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Link Person Picker */}
                      {linkingPerson === program.id && (
                        <div className="mt-3 border border-gray-200 rounded bg-white p-3 max-h-48 overflow-y-auto">
                          <p className="text-xs font-bold text-gray-500 mb-2">Select a person to link:</p>
                          {availablePeople.length === 0 ? (
                            <p className="text-xs text-gray-400">No profiles available.</p>
                          ) : (
                            availablePeople
                              .filter(p => !people.some(lp => lp.id === p.id))
                              .map((person) => (
                                <button
                                  key={person.id}
                                  onClick={() => linkPerson(program.id, person.id, 'Team Member')}
                                  className="block w-full text-left p-2 text-sm hover:bg-gray-50 rounded truncate"
                                >
                                  {person.full_name}
                                </button>
                              ))
                          )}
                          <button
                            onClick={() => setLinkingPerson(null)}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* View on site link */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                      <Link
                        href={`/community-programs/${program.id}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black"
                      >
                        View on site <ExternalLink className="w-3 h-3" />
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
