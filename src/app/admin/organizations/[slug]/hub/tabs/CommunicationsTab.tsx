'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Copy, Trash2, Save, Check } from 'lucide-react';

interface SavedDraft {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

const DRAFT_TYPES = [
  { value: 'social_post', label: 'Social Post' },
  { value: 'acquittal_report', label: 'Acquittal Report' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'thank_you', label: 'Thank You Letter' },
  { value: 'media_release', label: 'Media Release' },
];

const TONE_OPTIONS = [
  { value: 'warm', label: 'Warm' },
  { value: 'formal', label: 'Formal' },
  { value: 'youth', label: 'Youth-Friendly' },
];

const TYPE_LABELS: Record<string, string> = {
  social_post: 'Social Post',
  acquittal_report: 'Acquittal Report',
  newsletter: 'Newsletter',
  thank_you: 'Thank You',
  media_release: 'Media Release',
};

function getDraftsKey(orgId: string) {
  return `org-hub-drafts-${orgId}`;
}

function loadDrafts(orgId: string): SavedDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getDraftsKey(orgId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDraftsToStorage(orgId: string, drafts: SavedDraft[]) {
  localStorage.setItem(getDraftsKey(orgId), JSON.stringify(drafts));
}

export function CommunicationsTab({ orgId }: { orgId: string }) {
  const [draftType, setDraftType] = useState('social_post');
  const [tone, setTone] = useState('warm');
  const [sourceContent, setSourceContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(loadDrafts(orgId));
  }, [orgId]);

  async function handleGenerate() {
    if (!sourceContent.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedContent('');
    try {
      const res = await fetch(`/api/org-hub/${orgId}/social-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'custom',
          customContent: sourceContent,
          tone,
          draftType,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to generate draft');
      }
      const data = await res.json();
      setGeneratedContent(data.content || data.draft || '');
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyGenerated() {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveDraft() {
    if (!generatedContent.trim()) return;
    const draft: SavedDraft = {
      id: crypto.randomUUID(),
      type: draftType,
      content: generatedContent,
      createdAt: new Date().toISOString(),
    };
    const updated = [draft, ...drafts];
    setDrafts(updated);
    saveDraftsToStorage(orgId, updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  function handleDeleteDraft(id: string) {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    saveDraftsToStorage(orgId, updated);
  }

  async function handleCopyDraft(id: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Draft Composer */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <h2 className="text-xl font-black mb-4">Draft Composer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold mb-1">Type</label>
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
            >
              {DRAFT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {draftType === 'social_post' && (
            <div>
              <label className="block text-sm font-bold mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Source Content</label>
          <textarea
            value={sourceContent}
            onChange={(e) => setSourceContent(e.target.value)}
            placeholder="Paste or write the content you want to transform..."
            rows={4}
            className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none resize-y"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !sourceContent.trim()}
          className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </>
          )}
        </button>

        {genError && (
          <p className="mt-3 text-sm text-red-600 font-medium">{genError}</p>
        )}

        {generatedContent && (
          <div className="mt-6">
            <label className="block text-sm font-bold mb-1">Generated Draft</label>
            <textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={6}
              className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none resize-y"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleCopyGenerated}
                className="px-4 py-2 font-bold bg-gray-800 text-white hover:bg-black inline-flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 font-bold bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-2"
              >
                {savedMsg ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Saved Drafts */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <h2 className="text-xl font-black mb-4">Saved Drafts</h2>

        {drafts.length === 0 ? (
          <p className="text-gray-500 text-sm">No saved drafts yet. Generate and save a draft above.</p>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="border-2 border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-800">
                      {TYPE_LABELS[draft.type] || draft.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(draft.createdAt).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">{draft.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyDraft(draft.id, draft.content)}
                    className="px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-gray-100 inline-flex items-center gap-1"
                  >
                    {copiedDraftId === draft.id ? (
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
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="px-3 py-1.5 text-sm font-bold border-2 border-red-300 text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
