'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Loader2,
  Megaphone,
  MessageCircle,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { MatrixFlowNav } from '../_components/MatrixFlowNav';

type Surface = 'all' | 'refugee' | 'youth';
type SourceKind = 'case' | 'campaign' | 'evidence';

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
};

const starters = [
  'What cases and campaigns connect to offshore detention and third-country transfer?',
  'Find precedent on non-refoulement at sea and border pushbacks.',
  'What should I read first on raising the age of criminal responsibility?',
  'Which campaigns changed public pressure on immigration detention?',
];

const surfaces: Array<{ key: Surface; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'refugee', label: 'Refugee' },
  { key: 'youth', label: 'Youth' },
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

export function AskMatrixClient() {
  const [question, setQuestion] = useState(starters[0]);
  const [surface, setSurface] = useState<Surface>('all');
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => question.trim().length >= 3 && !loading, [question, loading]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/justice-matrix/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, surface }),
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

  async function askStarter(value: string) {
    setQuestion(value);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/justice-matrix/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: value, surface }),
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

  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section
        className="border-b"
        style={{
          borderColor: C.border,
          background: 'linear-gradient(135deg, #1c1420 0%, #2f1d38 46%, #123f45 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
          <Link
            href="/justice-matrix"
            className="mb-5 inline-block uppercase"
            style={{ color: C.gold, fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em' }}
          >
            Justice Matrix
          </Link>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2" style={{ color: C.gold }}>
                <MessageCircle className="h-5 w-5" />
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em' }}>
                  Ask the Matrix
                </span>
              </div>
              <h1 className="mb-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                Ask a strategic question. Get cited records.
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 md:text-base" style={{ color: '#d9cbe3' }}>
                A grounded question layer over cases, campaigns, and evidence. It retrieves from the Matrix first,
                cites the records it used, and keeps the boundary clear: research support, not legal advice.
              </p>
            </div>
            <div
              className="rounded-lg border p-4 text-sm leading-6"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#e8ddec' }}
            >
              <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="h-4 w-4" />
                Ground rules
              </div>
              <p>
                Every answer is anchored to returned Matrix records. If the corpus does not support the question,
                the answer should say what is missing.
              </p>
              <Link
                href="/justice-matrix/how-it-works"
                className="mt-3 inline-flex items-center gap-1 font-semibold text-white hover:underline"
              >
                How it works and FAQ <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="ask" />

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 md:px-8 md:py-8 lg:grid-cols-[400px_1fr]">
        <aside className="space-y-4">
          <form onSubmit={submit} className="rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
            <label className="mb-2 block text-sm font-semibold" htmlFor="matrix-question">
              Question
            </label>
            <textarea
              id="matrix-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              className="w-full resize-none rounded-md border px-3 py-2 text-sm leading-6 focus:outline-none"
              style={{ borderColor: C.border, color: C.ink }}
            />

            <div className="mt-4">
              <div className="mb-2 text-xs uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.14em' }}>
                Surface
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-md border p-1" style={{ borderColor: C.border }}>
                {surfaces.map((item) => {
                  const active = surface === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSurface(item.key)}
                      className="rounded px-3 py-2 text-xs font-semibold"
                      style={{
                        background: active ? C.accent : 'transparent',
                        color: active ? '#fff' : C.body,
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ background: C.gold, color: C.dark }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Ask
            </button>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </form>

          <div className="rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
            <div className="mb-3 text-xs uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.14em' }}>
              Try
            </div>
            <div className="space-y-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => askStarter(starter)}
                  className="block w-full rounded-md border px-3 py-2 text-left text-sm leading-5 transition-colors hover:border-zinc-300"
                  style={{ borderColor: C.border, color: C.body, background: '#fff' }}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-h-[520px] rounded-lg border" style={{ background: C.surface, borderColor: C.border }}>
          <div className="border-b px-4 py-3" style={{ borderColor: C.border }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Answer</h2>
                <p className="text-xs" style={{ color: C.muted }}>
                  Cited synthesis from Matrix retrieval.
                </p>
              </div>
              {response ? (
                <div className="rounded px-2 py-1 text-xs" style={{ background: '#f4f4f5', color: C.muted, fontFamily: MONO }}>
                  {response.retrieval.provider} | {response.retrieval.mode} | {response.citations.length} cited
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-4 md:p-5">
            {loading ? (
              <div className="flex h-80 items-center justify-center text-sm" style={{ color: C.muted }}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching Matrix records...
              </div>
            ) : response ? (
              <div className="space-y-5">
                <div className="whitespace-pre-wrap text-[15px] leading-7" style={{ color: C.body }}>
                  {response.answer}
                </div>

                <div>
                  <div className="mb-3 text-xs uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.14em' }}>
                    Cited records
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {response.citations.map((citation) => (
                      <CitationCard key={`${citation.kind}:${citation.id}`} citation={citation} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center text-center">
                <div>
                  <MessageCircle className="mx-auto mb-3 h-8 w-8" style={{ color: C.accent }} />
                  <p className="text-sm" style={{ color: C.body }}>
                    Ask about precedent, campaigns, tactics, or youth-justice evidence.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  const color = kindColor(citation.kind);
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: C.border, background: '#fff' }}>
      <div className="mb-2 flex items-center gap-2" style={{ color }}>
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
      {citation.excerpt ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6" style={{ color: C.body }}>
          {citation.excerpt}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
        <Link href={citation.href} className="inline-flex items-center gap-1 hover:underline" style={{ color }}>
          Open record <ArrowRight className="h-3 w-3" />
        </Link>
        {citation.externalUrl ? (
          <a
            href={citation.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
            style={{ color: C.muted }}
          >
            Source <ArrowRight className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
