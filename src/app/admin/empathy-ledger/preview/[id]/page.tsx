import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';
import { requireAdmin } from '@/lib/supabase/admin-lite';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';

export const dynamic = 'force-dynamic';

const EMPATHY_LEDGER_BASE_URL = (
  process.env.EMPATHY_LEDGER_V2_URL || 'https://www.empathyledger.com'
).replace(/\/+$/, '');

type PreviewStory = {
  id: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  story_image_url: string | null;
  story_type: string | null;
  privacy_level: string | null;
  is_public: boolean | null;
  status: string | null;
  community_status: string | null;
  story_stage: string | null;
  has_explicit_consent: boolean | null;
  cultural_sensitivity_level: string | null;
  themes: unknown;
  tags: unknown;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  storyteller_id: string | null;
};

type Storyteller = {
  id: string;
  display_name: string | null;
  public_avatar_url: string | null;
  avatar_url: string | null;
  location: string | null;
};

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'name' in item) {
        const name = (item as { name?: unknown }).name;
        return typeof name === 'string' ? name : '';
      }
      return '';
    })
    .filter(Boolean);
}

function mdToHtml(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}

async function getPreviewStory(id: string) {
  if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
    throw new Error('Empathy Ledger service access is not configured');
  }

  const { data: story, error } = await empathyLedgerServiceClient
    .from('stories')
    .select(`
      id, title, summary, content, story_image_url, story_type,
      privacy_level, is_public, status, community_status, story_stage,
      has_explicit_consent, cultural_sensitivity_level, themes, tags,
      published_at, created_at, updated_at, storyteller_id
    `)
    .eq('id', id)
    .maybeSingle<PreviewStory>();

  if (error) throw error;
  if (!story) return null;

  let storyteller: Storyteller | null = null;
  if (story.storyteller_id) {
    const { data } = await empathyLedgerServiceClient
      .from('storytellers')
      .select('id, display_name, public_avatar_url, avatar_url, location')
      .eq('id', story.storyteller_id)
      .maybeSingle<Storyteller>();
    storyteller = data || null;
  }

  return { story, storyteller };
}

export default async function EmpathyLedgerStoryPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin(`/admin/empathy-ledger/preview/${params.id}`);

  const preview = await getPreviewStory(params.id);
  if (!preview) notFound();

  const { story, storyteller } = preview;
  const themes = textList(story.themes);
  const tags = textList(story.tags);
  const content = story.content || story.summary || '';
  const contentHtml = content.trim().startsWith('<') ? content : mdToHtml(content);
  const isPublishReady =
    story.is_public === true &&
    story.privacy_level === 'public' &&
    story.status === 'published' &&
    story.has_explicit_consent === true;

  return (
    <main className="min-h-screen bg-white page-content">
      <section className="border-b-2 border-black bg-amber-50 py-8">
        <div className="container-justice">
          <Link
            href="/admin/empathy-ledger"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-earth-700 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Empathy Ledger admin
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                Admin draft preview
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-5xl">
                {story.title || 'Untitled Empathy Ledger story'}
              </h1>
              <p className="mt-3 max-w-3xl text-earth-700">
                This page is for checking a story in JusticeHub before it is public. It does
                not add the story to /stories.
              </p>
            </div>
            <a
              href={`${EMPATHY_LEDGER_BASE_URL}/stories/write/${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-black bg-black px-5 py-3 font-bold text-white hover:bg-earth-900"
            >
              Edit in Empathy Ledger
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="container-justice py-8">
        <section className="mb-8 grid gap-3 border-2 border-black bg-white p-4 text-sm md:grid-cols-4">
          <div>
            <div className="font-black uppercase text-earth-500">Status</div>
            <div className="font-bold">{story.status || 'unknown'}</div>
          </div>
          <div>
            <div className="font-black uppercase text-earth-500">Privacy</div>
            <div className="font-bold">{story.privacy_level || 'unknown'}</div>
          </div>
          <div>
            <div className="font-black uppercase text-earth-500">Public</div>
            <div className="font-bold">{story.is_public ? 'yes' : 'no'}</div>
          </div>
          <div>
            <div className="font-black uppercase text-earth-500">Consent</div>
            <div className="font-bold">{story.has_explicit_consent ? 'yes' : 'no'}</div>
          </div>
        </section>

        {!isPublishReady && (
          <section className="mb-8 border-2 border-amber-500 bg-amber-50 p-4">
            <p className="font-bold text-amber-900">
              Not publish-ready yet. To appear on public /stories, this needs public privacy,
              published status, public visibility, and explicit consent.
            </p>
          </section>
        )}

        <article className="mx-auto max-w-4xl">
          {story.story_image_url && (
            <div className="mb-8 overflow-hidden border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
              <Image
                src={story.story_image_url}
                alt={story.title || 'Empathy Ledger story image'}
                width={1200}
                height={675}
                className="h-auto w-full"
              />
            </div>
          )}

          {story.summary && (
            <p className="mb-8 border-l-4 border-black pl-4 text-xl leading-relaxed text-earth-700">
              {story.summary}
            </p>
          )}

          {storyteller && (
            <div className="mb-8 flex items-center gap-3 border-2 border-black bg-gray-50 p-4">
              {(storyteller.public_avatar_url || storyteller.avatar_url) && (
                <Image
                  src={storyteller.public_avatar_url || storyteller.avatar_url || ''}
                  alt={storyteller.display_name || 'Storyteller'}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border-2 border-black object-cover"
                />
              )}
              <div>
                <div className="font-black">{storyteller.display_name || 'Unknown storyteller'}</div>
                {storyteller.location && (
                  <div className="text-sm text-earth-600">{storyteller.location}</div>
                )}
              </div>
            </div>
          )}

          {(themes.length > 0 || tags.length > 0) && (
            <div className="mb-8 flex flex-wrap gap-2">
              {[...themes, ...tags].slice(0, 16).map((item, index) => (
                <span key={`${item}-${index}`} className="border border-black bg-gray-100 px-2 py-1 text-xs font-bold">
                  {item}
                </span>
              ))}
            </div>
          )}

          <div
            className="prose prose-lg max-w-none prose-headings:font-black prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>
      </div>
    </main>
  );
}
