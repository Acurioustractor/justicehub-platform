'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import { ELPhotoPickerModal } from '@/components/empathy-ledger/ELPhotoPickerModal';

interface StorytellerOption {
  id: string;
  display_name: string;
  location?: string | null;
}

interface DraftResponse {
  success: boolean;
  story_id: string;
  status: string;
  title: string;
  edit_url: string;
  view_url: string;
  error?: string;
  details?: unknown;
}

const STORY_TYPES = [
  { value: 'community_news', label: 'Community News (default for articles)' },
  { value: 'reflection', label: 'Reflection / Editorial' },
  { value: 'impact_story', label: 'Impact Story' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'personal_narrative', label: 'Personal Narrative' },
] as const;

const SENSITIVITY_LEVELS = [
  { value: 'standard', label: 'Standard, public-safe' },
  { value: 'sensitive', label: 'Sensitive, requires review' },
  { value: 'sacred', label: 'Sacred, Elder review required' },
  { value: 'restricted', label: 'Restricted, internal only' },
] as const;

const QUICK_ARTICLE_TEMPLATE = `# Title goes here

Opening paragraph. State the moment. Anchor a name, a place, an image.

It was not a tour. It was an argument.

The voice belonged to **person A** and **person B**. (Add the framing here.)

> One quotable sentence the piece hangs on.

## Section heading

Section body. Short. Then longer. Then short again.

## What this changes

Closing beat.
`;

export default function DraftToEmpathyLedgerPage() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState(QUICK_ARTICLE_TEMPLATE);
  const [contentFormat, setContentFormat] = useState<'markdown' | 'html'>('markdown');
  const [heroImage, setHeroImage] = useState<string>('');
  const [storyType, setStoryType] = useState<typeof STORY_TYPES[number]['value']>('community_news');
  const [sensitivity, setSensitivity] =
    useState<typeof SENSITIVITY_LEVELS[number]['value']>('standard');
  const [themesText, setThemesText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [storytellerId, setStorytellerId] = useState<string>('');
  const [provenanceNote, setProvenanceNote] = useState('');

  const [storytellers, setStorytellers] = useState<StorytellerOption[]>([]);
  const [storytellersLoading, setStorytellersLoading] = useState(true);
  const [storytellerSearch, setStorytellerSearch] = useState('');

  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DraftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/empathy-ledger/profiles?limit=300');
        if (!res.ok) throw new Error('Failed to load storytellers');
        const data = await res.json();
        const list: StorytellerOption[] = (data.storytellers || data.profiles || []).map(
          (s: { id: string; display_name?: string; displayName?: string; location?: string | null }) => ({
            id: s.id,
            display_name: s.display_name || s.displayName || 'Unknown',
            location: s.location || null,
          })
        );
        if (!cancelled) setStorytellers(list);
      } catch (err) {
        console.error('Storyteller load error:', err);
      } finally {
        if (!cancelled) setStorytellersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStorytellers = useMemo(() => {
    const q = storytellerSearch.trim().toLowerCase();
    if (!q) return storytellers.slice(0, 50);
    return storytellers
      .filter(
        (s) =>
          s.display_name.toLowerCase().includes(q) ||
          (s.location && s.location.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [storytellers, storytellerSearch]);

  function parseList(text: string): string[] {
    return text
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setResult(null);

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/empathy-ledger/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || undefined,
          content,
          content_format: contentFormat,
          hero_image_url: heroImage || undefined,
          story_type: storyType,
          cultural_sensitivity_level: sensitivity,
          themes: parseList(themesText),
          tags: parseList(tagsText),
          primary_storyteller_id: storytellerId || undefined,
          jh_provenance_note: provenanceNote.trim() || undefined,
        }),
      });
      const data: DraftResponse = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || `Failed (HTTP ${res.status})`);
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForNewDraft() {
    setResult(null);
    setError(null);
    setTitle('');
    setSummary('');
    setContent(QUICK_ARTICLE_TEMPLATE);
    setHeroImage('');
    setThemesText('');
    setTagsText('');
    setStorytellerId('');
    setProvenanceNote('');
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.18em] text-gray-600 hover:text-[#0A0A0A]"
        >
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>

        <header className="mb-10 border-b-2 border-[#0A0A0A] pb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-[#DC2626]">
            Draft to Empathy Ledger
          </p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Push article draft to EL
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-gray-700">
            Drafts a story in Empathy Ledger with status <code className="rounded bg-white px-1.5 py-0.5 text-[13px]">draft</code>, never publishes. Returns the EL editor URL so you can finish, attach more storytellers, and confirm consent before going public. Imagination Architect voice, run the seven tests before you press send.
          </p>
        </header>

        {result && (
          <section className="mb-10 border-2 border-[#059669] bg-white p-6">
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-[#059669]">
              Draft created in Empathy Ledger
            </p>
            <h2 className="mb-2 text-2xl font-bold">{result.title}</h2>
            <p className="mb-5 text-sm text-gray-600">
              Status: {result.status} · Story ID: <code className="font-mono text-[12px]">{result.story_id}</code>
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={result.edit_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#0A0A0A] px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
              >
                Open in Empathy Ledger editor <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={result.view_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-5 py-3 text-sm font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
              >
                Preview view URL <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={resetForNewDraft}
                className="inline-flex items-center gap-2 border-2 border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
              >
                Draft another
              </button>
            </div>
          </section>
        )}

        {error && (
          <section className="mb-10 border-2 border-[#DC2626] bg-red-50 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#DC2626]">Submission error</p>
            <p className="mt-2 text-sm text-[#0A0A0A]">{error}</p>
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Last Tuesday on Country, fifty-five judges, six postcards, one frame"
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Summary / excerpt (optional, &le; 600 chars)
              </span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="One paragraph that lands the frame, used as the article excerpt on listings."
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Content
              </span>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setContentFormat('markdown')}
                  className={`px-3 py-1 font-mono uppercase tracking-[0.14em] ${
                    contentFormat === 'markdown'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'border border-[#0A0A0A]/30 text-gray-600 hover:border-[#0A0A0A]'
                  }`}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setContentFormat('html')}
                  className={`px-3 py-1 font-mono uppercase tracking-[0.14em] ${
                    contentFormat === 'html'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'border border-[#0A0A0A]/30 text-gray-600 hover:border-[#0A0A0A]'
                  }`}
                >
                  HTML
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={22}
              spellCheck
              className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 font-mono text-[13.5px] leading-6 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
            <p className="mt-2 text-xs text-gray-500">
              {contentFormat === 'markdown'
                ? 'Markdown is converted to HTML on send. # headings, **bold**, *italic*, > blockquote, --- hr supported.'
                : 'Raw HTML passed straight through to TipTap.'}
            </p>
          </div>

          <div>
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
              Hero image (Empathy Ledger)
            </span>
            {heroImage ? (
              <div className="flex items-start gap-4">
                <div className="relative h-40 w-64 overflow-hidden border-2 border-[#0A0A0A] bg-[#0A0A0A]">
                  <Image src={heroImage} alt="Hero" fill className="object-cover" sizes="256px" unoptimized />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(true)}
                    className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] bg-white px-4 py-2 text-sm font-bold hover:bg-[#0A0A0A] hover:text-white"
                  >
                    <ImageIcon className="h-4 w-4" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroImage('')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#DC2626]"
                  >
                    <X className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPhotoPicker(true)}
                className="inline-flex items-center gap-2 border-2 border-dashed border-[#0A0A0A] bg-white px-5 py-4 text-sm font-bold hover:bg-[#0A0A0A] hover:text-white"
              >
                <ImageIcon className="h-5 w-5" /> Pick hero image from Empathy Ledger
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Story type
              </span>
              <select
                value={storyType}
                onChange={(e) => setStoryType(e.target.value as typeof storyType)}
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                {STORY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Cultural sensitivity
              </span>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value as typeof sensitivity)}
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                {SENSITIVITY_LEVELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
              Primary storyteller (optional, but the EL story attaches to this person's record)
            </span>
            <input
              type="text"
              value={storytellerSearch}
              onChange={(e) => setStorytellerSearch(e.target.value)}
              placeholder="Search storytellers, e.g. Kristy, Tanya, Fred"
              className="mb-2 w-full border-2 border-[#0A0A0A] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
            {storytellersLoading ? (
              <p className="text-xs text-gray-500">
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Loading storytellers from EL…
              </p>
            ) : (
              <div className="max-h-56 overflow-auto border-2 border-[#0A0A0A] bg-white">
                {filteredStorytellers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No matches.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredStorytellers.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setStorytellerId(s.id === storytellerId ? '' : s.id)}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-[#F5F0E8] ${
                            s.id === storytellerId ? 'bg-[#059669]/10 font-bold' : ''
                          }`}
                        >
                          <span>
                            {s.display_name}
                            {s.location && (
                              <span className="ml-2 text-xs text-gray-500">{s.location}</span>
                            )}
                          </span>
                          {s.id === storytellerId && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#059669]">
                              Selected
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {storytellerId && (
              <p className="mt-2 text-xs text-gray-500">
                Storyteller ID: <code className="font-mono">{storytellerId}</code>
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Themes (comma-separated)
              </span>
              <input
                type="text"
                value={themesText}
                onChange={(e) => setThemesText(e.target.value)}
                placeholder="judges-on-country, oonchiumpa, youth-justice"
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Tags (comma-separated, justicehub + jh-drafted added auto)
              </span>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="cultural-authority, community-led-alternatives"
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-gray-700">
                Provenance note (saved to provenance_chain, optional)
              </span>
              <input
                type="text"
                value={provenanceNote}
                onChange={(e) => setProvenanceNote(e.target.value)}
                placeholder="Drafted from compendium/articles/judges-on-country-2026-04-21.md"
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </label>
          </div>

          <div className="border-t-2 border-[#0A0A0A] pt-6">
            <p className="mb-4 max-w-2xl text-xs text-gray-600">
              Submitting creates a draft only. The EL editor opens in a new tab so you can attach
              additional storytellers, confirm consent, set the publishing date, and run the final
              voice tests before going public. Nothing is shown publicly until you press publish in
              EL.
            </p>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-2 bg-[#0A0A0A] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Drafting in EL…
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" /> Push draft to Empathy Ledger
                </>
              )}
            </button>
          </div>
        </form>

        {showPhotoPicker && (
          <ELPhotoPickerModal
            title="Pick a hero image from Empathy Ledger"
            source="all"
            onClose={() => setShowPhotoPicker(false)}
            onPick={(url) => {
              setHeroImage(url);
              setShowPhotoPicker(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
