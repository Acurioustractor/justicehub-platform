'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ExternalLink,
  Loader2,
  X,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

interface SocialDraftResult {
  success: boolean;
  draft: string;
  sourceType: string;
  error?: string;
}

type SourceType = 'session' | 'milestone' | 'story' | 'custom';
type Tone = 'warm' | 'formal' | 'youth';

export function StoriesTab({ orgId }: { orgId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>('custom');
  const [tone, setTone] = useState<Tone>('warm');
  const [customContent, setCustomContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<SocialDraftResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setDraft(null);
    try {
      const body: Record<string, string> = { sourceType, tone };
      if (sourceType === 'custom') {
        body.customContent = customContent;
      }
      const res = await fetch(`/api/org-hub/${orgId}/social-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate draft');
      }
      const json = await res.json();
      setDraft(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDraft(null);
    setError(null);
    setCustomContent('');
    setSourceType('custom');
    setTone('warm');
  };

  // Parse sections from draft markdown
  const parseDraftSections = (text: string) => {
    const sections: { label: string; content: string }[] = [];
    const patterns = [
      { label: 'Instagram', regex: /\*\*Instagram\*\*[^\n]*\n([\s\S]*?)(?=\*\*Facebook\*\*|$)/i },
      { label: 'Facebook', regex: /\*\*Facebook\*\*[^\n]*\n([\s\S]*?)(?=\*\*WhatsApp\*\*|$)/i },
      { label: 'WhatsApp', regex: /\*\*WhatsApp\*\*[^\n]*\n([\s\S]*?)$/i },
    ];
    for (const p of patterns) {
      const match = text.match(p.regex);
      if (match) {
        sections.push({ label: p.label, content: match[1].trim() });
      }
    }
    // Fallback: if no sections parsed, return full text
    if (sections.length === 0 && text) {
      sections.push({ label: 'Draft', content: text });
    }
    return sections;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-xl font-black">Stories & Content</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Social Post
        </button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/stories"
          className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black">Published Stories</h3>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Manage articles and stories in the main Stories admin.
          </p>
        </Link>

        <Link
          href="/admin/stories/new"
          className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black">Write New Story</h3>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Create a new article or impact story for this organisation.
          </p>
        </Link>

        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
          <h3 className="font-black mb-2">Storytellers</h3>
          <p className="text-sm text-gray-600 font-medium">
            Partner storytellers are managed via the partner content system.
          </p>
          <Link
            href="/admin/profiles"
            className="inline-flex items-center gap-1 text-sm font-bold text-ochre-600 hover:text-ochre-800 mt-2"
          >
            View Profiles <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Social Post Generation Info */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-lg font-black">Social Content Generator</h3>
        </div>
        <p className="text-sm text-gray-600 font-medium mb-4">
          Generate social media posts from sessions, milestones, stories, or custom content.
          The AI creates platform-specific drafts for Instagram, Facebook, and WhatsApp that follow
          strengths-based language guidelines and protect participant privacy.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-pink-50 border border-pink-200">
            <p className="text-xs font-bold text-pink-800 uppercase tracking-wide mb-1">Instagram</p>
            <p className="text-xs text-pink-700">Visual storytelling with hashtags</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Facebook</p>
            <p className="text-xs text-blue-700">Community updates with call to action</p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">WhatsApp</p>
            <p className="text-xs text-green-700">Short personal community messages</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 px-4 py-2 font-bold bg-black text-white hover:bg-gray-800 inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Get Started
        </button>
      </div>

      {/* Generate Social Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b-2 border-black">
              <h3 className="text-lg font-black">Generate Social Post</h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Source Type */}
              <div>
                <label className="block text-sm font-bold mb-1">Source Type</label>
                <select
                  value={sourceType}
                  onChange={(e) => {
                    setSourceType(e.target.value as SourceType);
                    setDraft(null);
                    setError(null);
                  }}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  <option value="custom">Custom Content</option>
                  <option value="session">Session</option>
                  <option value="milestone">Milestone</option>
                  <option value="story">Story / Article</option>
                </select>
              </div>

              {/* Source-specific inputs */}
              {sourceType === 'custom' && (
                <div>
                  <label className="block text-sm font-bold mb-1">Content</label>
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    rows={5}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none resize-none"
                    placeholder="Describe the achievement, event, or story you want to share..."
                  />
                </div>
              )}

              {(sourceType === 'session' || sourceType === 'milestone' || sourceType === 'story') && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-300">
                  <p className="text-sm font-bold text-yellow-800">
                    Note: To generate from a {sourceType}, you will need the {sourceType} ID.
                    For now, use &quot;Custom Content&quot; to paste details from any source.
                  </p>
                </div>
              )}

              {/* Tone */}
              <div>
                <label className="block text-sm font-bold mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  <option value="warm">Warm & Community-focused</option>
                  <option value="formal">Professional & Formal</option>
                  <option value="youth">Energetic & Youth-friendly</option>
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-300 text-sm font-bold text-red-800">
                  {error}
                </div>
              )}

              {/* Draft Result */}
              {draft && draft.success && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700">Drafts generated</span>
                  </div>
                  {parseDraftSections(draft.draft).map((section) => (
                    <div key={section.label} className="border-2 border-black p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-black">{section.label}</h4>
                        <button
                          onClick={() => handleCopy(section.content, section.label)}
                          className="px-3 py-1 text-xs font-bold border border-black hover:bg-gray-100 inline-flex items-center gap-1"
                        >
                          {copied === section.label ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {section.content}
                      </pre>
                    </div>
                  ))}

                  {/* Copy All */}
                  <button
                    onClick={() => handleCopy(draft.draft, 'all')}
                    className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 inline-flex items-center gap-2"
                  >
                    {copied === 'all' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied All
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy All Drafts
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t-2 border-black">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100"
              >
                Close
              </button>
              {!draft && (
                <button
                  onClick={handleGenerate}
                  disabled={generating || (sourceType === 'custom' && !customContent.trim())}
                  className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Drafts
                    </>
                  )}
                </button>
              )}
              {draft && (
                <button
                  onClick={() => {
                    setDraft(null);
                    setError(null);
                  }}
                  className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
