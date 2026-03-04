'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Users, BookOpen, Quote, MapPin, Star,
  ChevronDown, ChevronRight, Loader2, AlertCircle, FolderOpen,
  Sparkles, Shield, Globe, Heart
} from 'lucide-react';

interface AnalysisData {
  organization: { id: string; name: string };
  stories: {
    total: number;
    public: number;
    featured: number;
    themes: { name: string; count: number }[];
    types: Record<string, number>;
    items: {
      id: string;
      title: string;
      summary: string | null;
      themes: string[];
      story_type: string | null;
      privacy_level: string;
      is_public: boolean;
      is_featured: boolean;
      published_at: string | null;
      created_at: string;
    }[];
  };
  storytellers: {
    fromStories: {
      id: string;
      display_name: string;
      bio: string | null;
      cultural_background: string | null;
      is_elder: boolean;
      is_featured: boolean;
      location: string | null;
      areas_of_expertise: string[] | null;
      language_skills: string[] | null;
    }[];
    justicehubEnabled: number;
    total: number;
  };
  projects: {
    id: string;
    name: string;
    description: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  }[];
  projectAnalyses: {
    id: string;
    project_id: string;
    analysis_type: string;
    key_quotes: any[];
    storyteller_profiles: any[];
    aggregated_impact: any;
    aggregated_insights: any;
    themes: any[];
    summary: string | null;
  }[];
  transcripts: {
    total: number;
    themes: { name: string; count: number }[];
    items: {
      id: string;
      title: string;
      themes: string[];
      language: string | null;
      duration_minutes: number | null;
      word_count: number | null;
      created_at: string;
    }[];
  };
}

export function AnalysisTab({ orgId }: { orgId: string }) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'themes', 'storytellers']));

  useEffect(() => {
    fetch(`/api/org-hub/${orgId}/analysis`)
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error);
        else if (json.message) setMessage(json.message);
        else setData(json.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading Empathy Ledger analysis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
        <AlertCircle className="w-4 h-4 inline mr-1" />
        {error}
      </div>
    );
  }

  if (message || !data) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 text-amber-900">
        <Sparkles className="w-5 h-5 inline mr-2" />
        <span className="font-bold">Empathy Ledger Integration</span>
        <p className="mt-2 text-sm">{message || 'No analysis data available.'}</p>
        <p className="mt-1 text-sm text-amber-700">
          Link this organization to its Empathy Ledger record to see storytelling analysis, themes, and community voice data.
        </p>
      </div>
    );
  }

  const hasAnalyses = data.projectAnalyses.length > 0;
  const hasTranscripts = data.transcripts.total > 0;
  const allThemes = [...data.stories.themes];
  // Merge transcript themes into story themes
  for (const tt of data.transcripts.themes) {
    const existing = allThemes.find(t => t.name === tt.name);
    if (existing) existing.count += tt.count;
    else allThemes.push(tt);
  }
  allThemes.sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Empathy Ledger Analysis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Community voice data, storytelling themes, and impact insights from Empathy Ledger
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">
            Live from EL
          </span>
        </div>
      </div>

      {/* Overview Stats */}
      <SectionHeader
        title="Overview"
        sectionKey="overview"
        icon={<Globe className="w-4 h-4" />}
        expanded={expandedSections.has('overview')}
        onToggle={toggleSection}
      />
      {expandedSections.has('overview') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Stories" value={data.stories.total} sub={`${data.stories.public} public`} icon={<BookOpen className="w-4 h-4 text-blue-500" />} />
          <StatCard label="Storytellers" value={data.storytellers.total} sub={`${data.storytellers.justicehubEnabled} JH-enabled`} icon={<Users className="w-4 h-4 text-green-500" />} />
          <StatCard label="Projects" value={data.projects.length} sub={data.projects[0]?.name || ''} icon={<FolderOpen className="w-4 h-4 text-amber-500" />} />
          <StatCard label="Themes" value={allThemes.length} sub="across all content" icon={<Heart className="w-4 h-4 text-red-500" />} />
          {hasTranscripts && (
            <StatCard label="Transcripts" value={data.transcripts.total} sub="interview records" icon={<Quote className="w-4 h-4 text-purple-500" />} />
          )}
          {hasAnalyses && (
            <StatCard label="Analyses" value={data.projectAnalyses.length} sub="project-level" icon={<Sparkles className="w-4 h-4 text-indigo-500" />} />
          )}
        </div>
      )}

      {/* Themes */}
      <SectionHeader
        title={`Themes (${allThemes.length})`}
        sectionKey="themes"
        icon={<Heart className="w-4 h-4" />}
        expanded={expandedSections.has('themes')}
        onToggle={toggleSection}
      />
      {expandedSections.has('themes') && allThemes.length > 0 && (
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {allThemes.map(t => (
              <span
                key={t.name}
                className="px-3 py-1.5 text-sm font-medium bg-purple-50 text-purple-800 border border-purple-200 rounded-full"
              >
                {t.name}
                {t.count > 1 && <span className="ml-1 text-purple-500 text-xs">({t.count})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Storytellers */}
      <SectionHeader
        title={`Storytellers (${data.storytellers.fromStories.length})`}
        sectionKey="storytellers"
        icon={<Users className="w-4 h-4" />}
        expanded={expandedSections.has('storytellers')}
        onToggle={toggleSection}
      />
      {expandedSections.has('storytellers') && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.storytellers.fromStories.map(st => (
            <div key={st.id} className="bg-white border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-600">
                    {st.display_name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{st.display_name}</span>
                    {st.is_elder && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded">Elder</span>
                    )}
                    {st.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </div>
                  {st.cultural_background && (
                    <div className="text-xs text-gray-500 mt-0.5">{st.cultural_background}</div>
                  )}
                  {st.location && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {st.location}
                    </div>
                  )}
                  {st.bio && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{st.bio}</p>
                  )}
                  {st.areas_of_expertise && st.areas_of_expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {st.areas_of_expertise.map(a => (
                        <span key={a} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data.storytellers.fromStories.length === 0 && (
            <div className="col-span-2 text-sm text-gray-500 p-4 bg-gray-50 border border-gray-200">
              No storyteller profiles available. Stories may not have linked storyteller accounts.
            </div>
          )}
        </div>
      )}

      {/* Stories */}
      <SectionHeader
        title={`Stories (${data.stories.total})`}
        sectionKey="stories"
        icon={<BookOpen className="w-4 h-4" />}
        expanded={expandedSections.has('stories')}
        onToggle={toggleSection}
      />
      {expandedSections.has('stories') && (
        <div className="space-y-3">
          {data.stories.items.map(story => (
            <div key={story.id} className="bg-white border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm">{story.title}</h4>
                  {story.summary && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{story.summary}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {story.themes.map(t => (
                      <span key={t} className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-700 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    story.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {story.privacy_level}
                  </span>
                  {story.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  {story.published_at && (
                    <span className="text-[10px] text-gray-400">
                      {new Date(story.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Analyses (if RLS allows) */}
      {hasAnalyses && (
        <>
          <SectionHeader
            title={`Project Analyses (${data.projectAnalyses.length})`}
            sectionKey="analyses"
            icon={<Sparkles className="w-4 h-4" />}
            expanded={expandedSections.has('analyses')}
            onToggle={toggleSection}
          />
          {expandedSections.has('analyses') && (
            <div className="space-y-4">
              {data.projectAnalyses.map(pa => (
                <div key={pa.id} className="bg-white border border-gray-200 p-4">
                  <div className="font-bold text-sm mb-2">{pa.analysis_type || 'Project Analysis'}</div>
                  {pa.summary && <p className="text-sm text-gray-700 mb-3">{pa.summary}</p>}
                  {pa.key_quotes.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <div className="text-xs font-bold text-gray-500 uppercase">Key Quotes</div>
                      {pa.key_quotes.slice(0, 5).map((q: any, i: number) => (
                        <blockquote key={i} className="border-l-2 border-purple-300 pl-3 text-sm text-gray-700 italic">
                          {typeof q === 'string' ? q : q.text || q.quote || JSON.stringify(q)}
                          {q.speaker && <span className="text-xs text-gray-500 not-italic block mt-0.5">— {q.speaker}</span>}
                        </blockquote>
                      ))}
                    </div>
                  )}
                  {pa.aggregated_insights && (
                    <div className="bg-indigo-50 border border-indigo-200 p-3 text-sm">
                      <div className="text-xs font-bold text-indigo-600 uppercase mb-1">Aggregated Insights</div>
                      <div className="text-gray-700">
                        {typeof pa.aggregated_insights === 'string'
                          ? pa.aggregated_insights
                          : JSON.stringify(pa.aggregated_insights, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Transcripts (if RLS allows) */}
      {hasTranscripts && (
        <>
          <SectionHeader
            title={`Transcripts (${data.transcripts.total})`}
            sectionKey="transcripts"
            icon={<Quote className="w-4 h-4" />}
            expanded={expandedSections.has('transcripts')}
            onToggle={toggleSection}
          />
          {expandedSections.has('transcripts') && (
            <div className="space-y-3">
              {data.transcripts.themes.length > 0 && (
                <div className="bg-white border border-gray-200 p-3">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">Transcript Themes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.transcripts.themes.map(t => (
                      <span key={t.name} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full">
                        {t.name} ({t.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.transcripts.items.map(t => (
                <div key={t.id} className="bg-white border border-gray-200 p-3">
                  <div className="font-bold text-sm">{t.title}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    {t.word_count && <span>{t.word_count.toLocaleString()} words</span>}
                    {t.duration_minutes && <span>{t.duration_minutes} min</span>}
                    {t.language && <span>{t.language}</span>}
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  {t.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {t.themes.map(th => (
                        <span key={th} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">{th}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <>
          <SectionHeader
            title={`EL Projects (${data.projects.length})`}
            sectionKey="projects"
            icon={<FolderOpen className="w-4 h-4" />}
            expanded={expandedSections.has('projects')}
            onToggle={toggleSection}
          />
          {expandedSections.has('projects') && (
            <div className="space-y-3">
              {data.projects.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{p.name}</span>
                    {p.status && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded">{p.status}</span>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-gray-600 mt-1">{p.description}</p>}
                  {(p.start_date || p.end_date) && (
                    <div className="text-[10px] text-gray-400 mt-1">
                      {p.start_date && new Date(p.start_date).toLocaleDateString()}
                      {p.start_date && p.end_date && ' — '}
                      {p.end_date && new Date(p.end_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* RLS Note */}
      {!hasAnalyses && !hasTranscripts && (
        <div className="bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
          <Shield className="w-4 h-4 inline mr-1 text-gray-400" />
          <span className="font-bold">Note:</span> Transcript-level analysis and project-level insights require elevated Empathy Ledger access.
          Contact your EL administrator to enable service-level API access for richer analysis data including key quotes,
          aggregated impact metrics, and storyteller-level insights.
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sectionKey, icon, expanded, onToggle }: {
  title: string;
  sectionKey: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(sectionKey)}
      className="w-full flex items-center gap-2 py-2 text-left font-black text-sm hover:text-purple-700 transition-colors"
    >
      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      {icon}
      {title}
    </button>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: number; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
