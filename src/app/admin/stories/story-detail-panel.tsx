'use client';

import { useState, useEffect } from 'react';
import { X, Building2, User, Tag, Link as LinkIcon, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import type { UnifiedStory } from '@/app/api/admin/stories/unified/route';

const SOURCE_LABELS: Record<string, string> = {
  articles: 'Article (editorial)',
  synced_stories: 'Empathy Ledger (synced)',
  partner_stories: 'Partner Story (org-linked)',
  stories: 'Interview / Testimony',
  tour_stories: 'Community Submission (tour)',
};

interface Props {
  story: UnifiedStory;
  onClose: () => void;
  onRefresh: () => void;
}

interface OrgSearchResult {
  id: string;
  name: string;
  slug: string;
}

export function StoryDetailPanel({ story, onClose, onRefresh }: Props) {
  const [orgSearch, setOrgSearch] = useState('');
  const [allOrgs, setAllOrgs] = useState<OrgSearchResult[]>([]);
  const [linkingOrg, setLinkingOrg] = useState(false);
  const [showOrgSearch, setShowOrgSearch] = useState(false);

  // Fetch all organizations once when search panel opens
  useEffect(() => {
    if (!showOrgSearch || allOrgs.length > 0) return;
    (async () => {
      try {
        const res = await fetch('/api/organizations');
        if (res.ok) {
          const data = await res.json();
          setAllOrgs((data.organizations || []).map((o: any) => ({ id: o.id, name: o.name, slug: o.slug })));
        }
      } catch {
        // ignore
      }
    })();
  }, [showOrgSearch, allOrgs.length]);

  const orgResults = orgSearch.length >= 2
    ? allOrgs.filter(o => o.name.toLowerCase().includes(orgSearch.toLowerCase())).slice(0, 8)
    : [];

  const handleLinkOrg = async (orgId: string) => {
    setLinkingOrg(true);
    try {
      const res = await fetch('/api/admin/stories/unified', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link_org',
          story_id: story.id,
          source_table: story.source_table,
          organization_id: orgId,
        }),
      });
      if (res.ok) {
        setShowOrgSearch(false);
        setOrgSearch('');
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to link org:', err);
    } finally {
      setLinkingOrg(false);
    }
  };

  const canLinkOrg = ['articles', 'stories', 'partner_stories'].includes(story.source_table);
  const canEdit = story.source_table === 'articles';

  return (
    <div className="fixed inset-y-0 right-0 w-[440px] bg-white border-l-2 border-black shadow-[-8px_0_24px_rgba(0,0,0,0.1)] z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b-2 border-black px-6 py-4 flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <h2 className="text-lg font-black text-black leading-tight">{story.title}</h2>
          <p className="text-xs text-gray-500 mt-1">{SOURCE_LABELS[story.source_table]}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Excerpt */}
        {story.excerpt && (
          <div>
            <h3 className="text-xs font-black uppercase text-gray-500 mb-2">Excerpt</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{story.excerpt}</p>
          </div>
        )}

        {/* Image */}
        {story.image_url && (
          <div>
            <h3 className="text-xs font-black uppercase text-gray-500 mb-2">Image</h3>
            <img
              src={story.image_url}
              alt={story.title}
              className="w-full h-40 object-cover border border-gray-200 rounded"
            />
          </div>
        )}

        {/* Organization */}
        <div>
          <h3 className="text-xs font-black uppercase text-gray-500 mb-2 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Organization
          </h3>
          {story.organization_name ? (
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border border-gray-200">
              <span className="text-sm font-medium">{story.organization_name}</span>
              {canLinkOrg && (
                <button
                  onClick={() => setShowOrgSearch(!showOrgSearch)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  Change
                </button>
              )}
            </div>
          ) : canLinkOrg ? (
            <button
              onClick={() => setShowOrgSearch(!showOrgSearch)}
              className="w-full text-left px-3 py-2 border border-dashed border-gray-300 text-sm text-gray-500 hover:border-black hover:text-black transition-colors"
            >
              + Link to organization
            </button>
          ) : (
            <p className="text-sm text-gray-400">Not applicable for {story.source_table}</p>
          )}

          {/* Org search */}
          {showOrgSearch && (
            <div className="mt-2 border border-gray-200 bg-white p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 focus:border-black focus:outline-none"
                  autoFocus
                />
              </div>
              {showOrgSearch && allOrgs.length === 0 && <p className="text-xs text-gray-400 mt-1 px-1">Loading orgs...</p>}
              {orgResults.length > 0 && (
                <div className="mt-1 max-h-48 overflow-y-auto">
                  {orgResults.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleLinkOrg(org.id)}
                      disabled={linkingOrg}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 border-b border-gray-100 last:border-b-0"
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Author */}
        <div>
          <h3 className="text-xs font-black uppercase text-gray-500 mb-2 flex items-center gap-1">
            <User className="w-3 h-3" /> Author
          </h3>
          <p className="text-sm">{story.author_name || <span className="text-gray-400">Unknown</span>}</p>
        </div>

        {/* Themes */}
        {story.themes.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase text-gray-500 mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Themes
            </h3>
            <div className="flex flex-wrap gap-1">
              {story.themes.map(theme => (
                <span key={theme} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Campaign tags */}
        <div>
          <h3 className="text-xs font-black uppercase text-gray-500 mb-2">Campaign Tags</h3>
          <div className="flex flex-wrap gap-1">
            {story.is_contained && (
              <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-700 border border-red-500">
                CONTAINED
              </span>
            )}
            {story.is_featured && (
              <span className="text-xs font-bold px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-500">
                FEATURED
              </span>
            )}
            {story.project_slugs.filter(s => s !== 'the-contained').map(slug => (
              <span key={slug} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-300">
                {slug}
              </span>
            ))}
            {!story.is_contained && !story.is_featured && story.project_slugs.length === 0 && (
              <span className="text-xs text-gray-400">No campaign tags</span>
            )}
          </div>
        </div>

        {/* Source info */}
        <div>
          <h3 className="text-xs font-black uppercase text-gray-500 mb-2 flex items-center gap-1">
            <LinkIcon className="w-3 h-3" /> Source Info
          </h3>
          <dl className="text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-gray-500">Table</dt>
              <dd className="font-mono text-xs">{story.source_table}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">ID</dt>
              <dd className="font-mono text-xs truncate max-w-[200px]">{story.id}</dd>
            </div>
            {story.el_sync_id && (
              <div className="flex justify-between">
                <dt className="text-gray-500">EL ID</dt>
                <dd className="font-mono text-xs truncate max-w-[200px]">{story.el_sync_id}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-bold text-xs uppercase">{story.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd className="text-xs">
                {new Date(story.created_at).toLocaleDateString('en-AU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          {canEdit && (
            <Link
              href={`/admin/stories/${story.id}`}
              className="block w-full text-center px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors border-2 border-black"
            >
              Edit Article
            </Link>
          )}
          {story.source_table === 'tour_stories' && (
            <Link
              href="/admin/contained"
              className="block w-full text-center px-4 py-2 bg-white text-black font-bold text-sm hover:bg-gray-50 transition-colors border-2 border-black flex items-center justify-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Contained Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
