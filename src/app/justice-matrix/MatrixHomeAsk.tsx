'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  ArrowRight,
  BookOpenCheck,
  FilePlus2,
  Layers3,
  Loader2,
  Megaphone,
  MessageCircle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type Surface = 'all' | 'refugee' | 'youth';
type SourceKind = 'case' | 'campaign' | 'evidence';

interface Stats {
  cases: number;
  campaigns: number;
  evidence: number;
  sources: number;
  regions: number;
  refugeeCases: number;
}

interface IssueLite {
  slug: string;
  title: string;
  question: string;
  surface: string;
}

interface Citation {
  id: string;
  label: string;
  kind: SourceKind;
  title: string;
  href: string;
  externalUrl: string | null;
  meta: string;
  excerpt: string | null;
  verified?: boolean | null;
  humanConfirmed?: boolean | null;
  restricted?: boolean;
}

interface AskResponse {
  question: string;
  surface: Surface;
  answer: string;
  citations: Citation[];
  retrieval: {
    mode: string;
    total: number;
    provider: string;
  };
}

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  teal: '#1f6f78',
  amber: '#a96a1c',
  gold: '#d3b583',
  dark: '#1c1420',
  purpleWash: 'rgba(74,37,96,0.10)',
};

const defaultPrompts = [
  'Can Australia send people seeking asylum to PNG or another third country?',
  'Can they keep a boy of 10 in youth detention?',
  'What UN rules apply to offshore detention and non-refoulement?',
  'Who is working on campaigns about immigration detention?',
];

const surfaces: Array<{ key: Surface; label: string; help: string }> = [
  { key: 'all', label: 'All', help: 'cases, campaigns, evidence' },
  { key: 'refugee', label: 'Refugee', help: 'asylum and borders' },
  { key: 'youth', label: 'Youth', help: 'children and detention' },
];

function kindIcon(kind: SourceKind) {
  if (kind === 'case') return <Scale className="h-4 w-4" />;
  if (kind === 'campaign') return <Megaphone className="h-4 w-4" />;
  return <BookOpenCheck className="h-4 w-4" />;
}

function kindColor(kind: SourceKind) {
  if (kind === 'case') return C.accent;
  if (kind === 'campaign') return C.amber;
  return C.teal;
}

function askHref(question: string, surface: Surface) {
  const params = new URLSearchParams({ q: question });
  if (surface !== 'all') params.set('surface', surface);
  return `/justice-matrix/ask?${params.toString()}`;
}

export function MatrixHomeAsk({
  stats,
  issues,
  initialQuestion = '',
  initialSurface = 'all',
}: {
  stats: Stats;
  issues: IssueLite[];
  initialQuestion?: string;
  initialSurface?: Surface;
}) {
  const starters = useMemo(() => {
    const issueQuestions = issues.map((issue) => issue.question).filter(Boolean).slice(0, 3);
    return Array.from(new Set([...issueQuestions, ...defaultPrompts])).slice(0, 6);
  }, [issues]);
  const [question, setQuestion] = useState(initialQuestion.trim() || starters[0] || defaultPrompts[0]);
  const [surface, setSurface] = useState<Surface>(initialSurface);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalRecords = stats.cases + stats.campaigns + stats.evidence;
  const canSubmit = question.trim().length >= 3 && !loading;

  async function submitQuestion(value = question, nextSurface = surface) {
    const cleaned = value.trim();
    if (cleaned.length < 3 || loading) return;

    setQuestion(cleaned);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/justice-matrix/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleaned, surface: nextSurface }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Ask the Matrix failed.');
      setResponse(json as AskResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ask the Matrix failed.');
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void submitQuestion();
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #1c1420 0%, #2f1d38 45%, #113e43 100%)',
        color: '#fff',
        fontFamily: SANS,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-6 px-5 pb-8 pt-8 md:px-8 md:pb-12 md:pt-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)] lg:items-start">
        <div className="space-y-6">
          <div>
            <div
              className="mb-4 inline-flex items-center gap-2 uppercase"
              style={{ color: C.gold, fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em' }}
            >
              <MessageCircle className="h-4 w-4" />
              Justice Matrix
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-white md:text-6xl">
              Ask any justice question.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 md:text-base" style={{ color: '#d9cbe3' }}>
              Use simple language. The Matrix searches cases, campaigns, evidence and issue guides, then returns a
              plain-language answer with links back to the records.
            </p>
          </div>

          <SupportLayers stats={stats} totalRecords={totalRecords} className="hidden lg:block" />
        </div>

        <div className="rounded-xl border shadow-2xl" style={{ background: '#fff', borderColor: 'rgba(255,255,255,0.22)', color: C.ink }}>
          <form onSubmit={submit} className="border-b p-4 md:p-5" style={{ borderColor: C.border }}>
            <label htmlFor="matrix-home-question" className="mb-3 block text-sm font-semibold" style={{ color: C.ink }}>
              What do you need to understand?
            </label>
            <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.page }}>
              <textarea
                id="matrix-home-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                className="block w-full resize-none bg-transparent px-2 py-2 text-[15px] leading-6 outline-none"
                style={{ color: C.ink }}
                placeholder="Ask in plain language..."
              />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-3 gap-1 rounded-md border p-1" style={{ borderColor: C.border, background: '#fff' }}>
                  {surfaces.map((item) => {
                    const selected = surface === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        title={item.help}
                        aria-pressed={selected}
                        onClick={() => setSurface(item.key)}
                        className="rounded px-2 py-1.5 text-xs font-semibold"
                        style={{ background: selected ? C.accent : 'transparent', color: selected ? '#fff' : C.body }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                  style={{ background: C.gold, color: C.dark }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Ask
                </button>
              </div>
            </div>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </form>

          <div className="p-4 md:p-5">
            {loading ? (
              <div className="flex min-h-[340px] items-center justify-center text-sm" style={{ color: C.muted }}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching Matrix records and preparing citations...
              </div>
            ) : response ? (
              <AnswerPanel response={response} surface={surface} />
            ) : (
              <ReadyPanel starters={starters} surface={surface} onAsk={(starter) => void submitQuestion(starter, surface)} />
            )}
          </div>
        </div>

        <SupportLayers stats={stats} totalRecords={totalRecords} className="lg:hidden" />
      </div>
    </section>
  );
}

function SupportLayers({
  stats,
  totalRecords,
  className = '',
}: {
  stats: Stats;
  totalRecords: number;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-3 gap-2 sm:max-w-xl">
        <Stat value={totalRecords} label="records" />
        <Stat value={stats.sources} label="active sources" />
        <Stat value={stats.regions} label="regions" />
      </div>

      <div className="grid gap-2 sm:max-w-2xl sm:grid-cols-2">
        <LayerLink
          href="/justice-matrix/explore"
          icon={<Search className="h-4 w-4" />}
          title="Search the corpus"
          body="Keyword and semantic search for people who want to inspect every result."
        />
        <LayerLink
          href="/justice-matrix/issues"
          icon={<Layers3 className="h-4 w-4" />}
          title="Open the wiki layer"
          body="Issue pages explain the question, linked law, campaigns and evidence."
        />
        <LayerLink
          href="/justice-matrix/un"
          icon={<BookOpenCheck className="h-4 w-4" />}
          title="Use the UN pack"
          body="Review-ready OHCHR material, status notes and source matrices."
        />
        <LayerLink
          href="/justice-matrix/contribute"
          icon={<FilePlus2 className="h-4 w-4" />}
          title="Add or correct information"
          body="Send a missing case, source link, campaign, correction or note."
        />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border px-3 py-3" style={{ borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)' }}>
      <div className="text-2xl font-semibold tabular-nums text-white">{value.toLocaleString()}</div>
      <div className="uppercase" style={{ color: '#cbb8d6', fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em' }}>
        {label}
      </div>
    </div>
  );
}

function LayerLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border p-3 transition-colors hover:border-white/40"
      style={{ borderColor: 'rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.07)' }}
    >
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'rgba(255,255,255,0.10)', color: C.gold }}>
          {icon}
        </span>
        {title}
      </div>
      <p className="text-[12px] leading-5" style={{ color: '#d9cbe3' }}>
        {body}
      </p>
    </Link>
  );
}

function ReadyPanel({
  starters,
  surface,
  onAsk,
}: {
  starters: string[];
  surface: Surface;
  onAsk: (starter: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-4" style={{ borderColor: C.border, background: C.page }}>
        <div className="mb-3 flex items-center gap-2 font-semibold" style={{ color: C.ink }}>
          <ShieldCheck className="h-4 w-4" style={{ color: C.accent }} />
          What the answer includes
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            'A short answer in plain language',
            'Cited cases, campaigns and evidence',
            'Direct source links where available',
            'Limits and not-legal-advice boundary',
          ].map((label) => (
            <div key={label} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: C.border, background: '#fff', color: C.body }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em' }}>
          Try a plain-language question
        </div>
        <div className="grid gap-2">
          {starters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => onAsk(starter)}
              className="group flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm leading-5 transition-colors hover:border-zinc-300"
              style={{ borderColor: C.border, color: C.body, background: '#fff' }}
            >
              <span>{starter}</span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: C.accent }} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <Link href={askHref(starters[0] ?? defaultPrompts[0], surface)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5" style={{ borderColor: C.border, color: C.accent }}>
          Open full ask workspace <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/justice-matrix/how-it-works" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5" style={{ borderColor: C.border, color: C.muted }}>
          How answers are grounded <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function AnswerPanel({ response, surface }: { response: AskResponse; surface: Surface }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: C.ink }}>
            Answer
          </h2>
          <p className="text-xs" style={{ color: C.muted }}>
            Cited synthesis from Matrix retrieval.
          </p>
        </div>
        <div className="rounded px-2 py-1 text-xs" style={{ background: '#f4f4f5', color: C.muted, fontFamily: MONO }}>
          {response.retrieval.provider} | {response.retrieval.mode} | {response.citations.length} cited
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto rounded-lg border p-4" style={{ borderColor: C.border, background: C.page }}>
        <div className="space-y-3 text-[14px] leading-7">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ color: C.body }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: C.ink }}>{children}</strong>,
              ul: ({ children }) => (
                <ul className="list-disc space-y-1 pl-5" style={{ color: C.body }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal space-y-1 pl-5" style={{ color: C.body }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => <li>{children}</li>,
            }}
          >
            {response.answer}
          </ReactMarkdown>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em' }}>
            Cited records
          </div>
          <Link href={askHref(response.question, surface)} className="inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: C.accent }}>
            Continue in Ask <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {response.citations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {response.citations.slice(0, 6).map((citation) => (
              <CitationCard key={`${citation.kind}:${citation.id}`} citation={citation} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-4 text-sm" style={{ borderColor: C.border, color: C.muted }}>
            No supporting records were returned. Try a narrower question or use search.
          </div>
        )}
      </div>
    </div>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  const color = kindColor(citation.kind);
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: '#fff' }}>
      <div className="mb-2 flex flex-wrap items-center gap-2" style={{ color }}>
        {kindIcon(citation.kind)}
        <span className="rounded px-1.5 py-0.5 text-[10px] uppercase" style={{ background: `${color}18`, fontFamily: MONO }}>
          {citation.label} {citation.kind}
        </span>
        {citation.verified ? (
          <span className="rounded px-1.5 py-0.5 text-[10px] uppercase" style={{ background: '#e7f5ed', color: '#256c42', fontFamily: MONO }}>
            verified
          </span>
        ) : null}
      </div>
      <Link href={citation.href} className="block text-sm font-semibold leading-5 hover:underline" style={{ color: C.ink }}>
        {citation.title}
      </Link>
      {citation.meta ? (
        <p className="mt-1 text-xs leading-5" style={{ color: C.muted }}>
          {citation.meta}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
        <Link href={citation.href} className="inline-flex items-center gap-1 hover:underline" style={{ color }}>
          Open record <ArrowRight className="h-3 w-3" />
        </Link>
        {citation.externalUrl ? (
          <a href={citation.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: C.muted }}>
            Source <ArrowRight className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
