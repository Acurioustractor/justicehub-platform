'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpenCheck,
  BookText,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Map as MapIcon,
  Megaphone,
  MessageCircle,
  Plus,
  Scale,
  Search,
  Share2,
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

// ADDITIVE structured answer. Null on older / back-compat responses.
interface AnswerStructured {
  directAnswer: string;
  keyRecords: { label: string; point: string }[];
  whatHeld: string[];
  limits: string;
  confidence: 'strong' | 'partial' | 'thin';
  boundaryNote: string;
}

interface Retrieval {
  mode: string;
  total: number;
  provider: string;
  bestDistance?: number | null;
  verifiedShare?: number;
  intent?: string;
  queries?: number;
  planSource?: string;
  weak?: boolean;
}

interface Followup {
  id: string;
  text: string;
  askPayload: { question: string; surface: Surface };
  origin: 'issue' | 'category' | 'llm' | 'template';
}

interface RelatedIssue {
  slug: string;
  title: string;
  surface: string;
  href: string;
  matchedCategories: string[];
  recordCount: number;
}

interface GapRoute {
  label: string;
  href: string | null;
  external: boolean;
}

interface Gap {
  kind: 'no-records' | 'thin-records' | 'no-australian' | 'no-evidence' | 'consent-restricted';
  message: string;
  routes: GapRoute[];
}

interface TrailMove {
  label: string;
  move: 'broaden' | 'narrow' | 'adjacent-jurisdiction' | 'same-tactic';
  href: string;
}

interface Action {
  id: 'export' | 'follow-issue' | 'contribute' | 'open-map';
  label: string;
  href: string;
  method: 'GET' | 'POST' | 'link';
  enabled: boolean;
  payloadHint?: Record<string, string>;
}

interface AskResponse {
  question: string;
  surface: Surface;
  answer: string;
  answerStructured?: AnswerStructured | null;
  citations: Citation[];
  retrieval: Retrieval;
  followups?: Followup[];
  relatedIssues?: RelatedIssue[];
  gaps?: Gap[];
  researchTrail?: TrailMove[];
  actions?: Action[];
}

interface Turn {
  key: string;
  question: string;
  surface: Surface;
  response: AskResponse;
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

const GLOSSARY: Array<{ term: string; definition: string }> = [
  {
    term: 'Non-refoulement',
    definition:
      'The rule that a person must not be returned to a place where they face persecution, torture, or other serious harm.',
  },
  {
    term: 'Third-country transfer',
    definition: 'Moving an asylum seeker to a different country to have their claim processed or held there.',
  },
  {
    term: 'Raise the age',
    definition:
      'The campaign to lift the minimum age of criminal responsibility so younger children are not charged or jailed.',
  },
  {
    term: 'Justice reinvestment',
    definition:
      'Shifting money from prisons into community-led programs that prevent crime and support people early.',
  },
  {
    term: 'Deaths in custody',
    definition:
      'Deaths of people held in police cells, watch houses, or prisons, and the accountability questions they raise.',
  },
  {
    term: 'Diversion',
    definition:
      'Steering a person away from court and detention toward support, cautions, or community programs instead.',
  },
];

const TRAIL_LABELS: Record<TrailMove['move'], string> = {
  broaden: 'Broaden',
  narrow: 'Narrow',
  'adjacent-jurisdiction': 'Adjacent jurisdiction',
  'same-tactic': 'Same tactic',
};

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

function confidenceStyle(confidence: AnswerStructured['confidence']) {
  if (confidence === 'strong') return { bg: '#e7f5ed', fg: '#047857', label: 'Strong match' };
  if (confidence === 'partial') return { bg: '#fdf3e6', fg: '#b45309', label: 'Partial match' };
  return { bg: '#fbeaea', fg: '#b91c1c', label: 'Thin match' };
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

export function AskMatrixClient() {
  const [question, setQuestion] = useState(starters[0]);
  const [surface, setSurface] = useState<Surface>('all');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const autoSubmitted = useRef(false);

  const canSubmit = useMemo(() => question.trim().length >= 3 && !loading, [question, loading]);

  const runAsk = useCallback(async (q: string, s: Surface) => {
    const text = q.trim();
    if (text.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/justice-matrix/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, surface: s }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Ask the Matrix failed.');
      const response = json as AskResponse;
      setTurns((prev) => [
        {
          key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          question: text,
          surface: s,
          response,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ask the Matrix failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    void runAsk(question, surface);
  }

  function askStarter(value: string) {
    setQuestion(value);
    void runAsk(value, surface);
  }

  // Follow-up re-ask: send the follow-up's own payload (its surface may differ).
  function askFollowup(payload: { question: string; surface: Surface }) {
    setQuestion(payload.question);
    setSurface(payload.surface);
    void runAsk(payload.question, payload.surface);
  }

  // Prefill + auto-submit once from ?q= / ?surface= using window.location (no Suspense needed).
  useEffect(() => {
    if (autoSubmitted.current) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!q || q.trim().length < 3) return;
    const sParam = params.get('surface');
    const s: Surface = sParam === 'refugee' || sParam === 'youth' ? sParam : 'all';
    autoSubmitted.current = true;
    setQuestion(q);
    setSurface(s);
    void runAsk(q, s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyShareLink(turn: Turn) {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/justice-matrix/ask?q=${encodeURIComponent(turn.question)}&surface=${turn.surface}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
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
            className="mb-5 inline-block uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
                Ask a strategic question. Get a cited answer.
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 md:text-base" style={{ color: '#d9cbe3' }}>
                A grounded answer layer over cases, campaigns, and evidence. It reads your question, retrieves from the
                Matrix first, writes a plain answer with citations, and keeps the boundary clear: research support, not
                legal advice.
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
                Every answer is anchored to returned Matrix records. If the corpus does not support the question, the
                answer says what is missing and where to look next.
              </p>
              <Link
                href="/justice-matrix/how-it-works"
                className="mt-3 inline-flex items-center gap-1 font-semibold text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
          <form
            onSubmit={submit}
            className="rounded-lg border p-4"
            style={{ background: C.surface, borderColor: C.border }}
            aria-label="Ask the Matrix"
          >
            <label className="mb-2 block text-sm font-semibold" htmlFor="matrix-question">
              Question
            </label>
            <textarea
              id="matrix-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              className="w-full resize-none rounded-md border px-3 py-2 text-sm leading-6 focus:outline-none focus-visible:ring-2"
              style={{ borderColor: C.border, color: C.ink }}
            />

            <div className="mt-4">
              <div
                className="mb-2 text-xs uppercase"
                id="surface-label"
                style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.14em' }}
              >
                Surface
              </div>
              <div
                className="grid grid-cols-3 gap-1 rounded-md border p-1"
                style={{ borderColor: C.border }}
                role="group"
                aria-labelledby="surface-label"
              >
                {surfaces.map((item) => {
                  const active = surface === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSurface(item.key)}
                      aria-pressed={active}
                      aria-label={`Surface: ${item.label}`}
                      className="rounded px-3 py-2 text-xs font-semibold focus:outline-none focus-visible:ring-2"
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
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 disabled:opacity-50"
              style={{ background: C.gold, color: C.dark }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Ask
            </button>
            {error ? (
              <p className="mt-3 text-sm" role="alert" style={{ color: '#b91c1c' }}>
                {error}
              </p>
            ) : null}
          </form>

          <div className="rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
            <div
              className="mb-3 text-xs uppercase"
              style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.14em' }}
            >
              Try
            </div>
            <div className="space-y-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => askStarter(starter)}
                  className="block w-full rounded-md border px-3 py-2 text-left text-sm leading-5 transition-colors hover:border-zinc-300 focus:outline-none focus-visible:ring-2"
                  style={{ borderColor: C.border, color: C.body, background: '#fff' }}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border" style={{ background: C.surface, borderColor: C.border }}>
            <button
              type="button"
              onClick={() => setGlossaryOpen((v) => !v)}
              aria-expanded={glossaryOpen}
              aria-controls="key-terms-panel"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left focus:outline-none focus-visible:ring-2"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: C.ink }}>
                <BookText className="h-4 w-4" style={{ color: C.teal }} />
                Key terms
              </span>
              {glossaryOpen ? (
                <ChevronDown className="h-4 w-4" style={{ color: C.muted }} />
              ) : (
                <ChevronRight className="h-4 w-4" style={{ color: C.muted }} />
              )}
            </button>
            {glossaryOpen ? (
              <dl id="key-terms-panel" className="space-y-3 border-t px-4 py-3" style={{ borderColor: C.border }}>
                {GLOSSARY.map((g) => (
                  <div key={g.term}>
                    <dt className="text-sm font-semibold" style={{ color: C.ink }}>
                      {g.term}
                    </dt>
                    <dd className="mt-0.5 text-sm leading-5" style={{ color: C.body }}>
                      {g.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </aside>

        <section
          className="min-h-[520px] rounded-lg border"
          style={{ background: C.surface, borderColor: C.border }}
          aria-live="polite"
        >
          <div className="border-b px-4 py-3" style={{ borderColor: C.border }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Answer</h2>
                <p className="text-xs" style={{ color: C.muted }}>
                  Cited answers from Matrix retrieval. Newest on top.
                </p>
              </div>
              {turns.length > 0 ? (
                <div
                  className="rounded px-2 py-1 text-xs"
                  style={{ background: '#f4f4f5', color: C.muted, fontFamily: MONO }}
                >
                  {turns.length} {turns.length === 1 ? 'answer' : 'answers'}
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-4 md:p-5">
            {loading ? (
              <div className="mb-5 flex items-center justify-center rounded-md border py-6 text-sm" style={{ color: C.muted, borderColor: C.border, background: '#fafafa' }}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reading your question and searching Matrix records...
              </div>
            ) : null}

            {turns.length === 0 && !loading ? (
              <div className="flex h-80 items-center justify-center text-center">
                <div>
                  <MessageCircle className="mx-auto mb-3 h-8 w-8" style={{ color: C.accent }} />
                  <p className="text-sm" style={{ color: C.body }}>
                    Ask about precedent, campaigns, tactics, or youth-justice evidence.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-6">
              {turns.map((turn) => (
                <TurnBlock
                  key={turn.key}
                  turn={turn}
                  onFollowup={askFollowup}
                  onShare={() => copyShareLink(turn)}
                  shareCopied={shareCopied}
                />
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function TurnBlock({
  turn,
  onFollowup,
  onShare,
  shareCopied,
}: {
  turn: Turn;
  onFollowup: (payload: { question: string; surface: Surface }) => void;
  onShare: () => void;
  shareCopied: boolean;
}) {
  const { response } = turn;
  const structured = response.answerStructured ?? null;
  const citations = response.citations ?? [];
  const retrieval = response.retrieval ?? { mode: '', total: 0, provider: '' };
  const followups = response.followups ?? [];
  const relatedIssues = response.relatedIssues ?? [];
  const gaps = response.gaps ?? [];
  const trail = response.researchTrail ?? [];
  const actions = (response.actions ?? []).filter((a) => a.enabled);

  const citationByLabel = useMemo(() => {
    const m = new Map<string, Citation>();
    citations.forEach((c) => m.set(c.label, c));
    return m;
  }, [citations]);

  return (
    <article className="rounded-lg border" style={{ borderColor: C.border, background: '#fff' }}>
      {/* Question + detected-surface chip */}
      <header className="border-b px-4 py-3 md:px-5" style={{ borderColor: C.border, background: '#fafafa' }}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] uppercase"
            style={{ background: `${C.accent}14`, color: C.accent, fontFamily: MONO, letterSpacing: '0.1em' }}
          >
            Asked as {turn.surface}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] uppercase"
            style={{ background: '#eef2f3', color: C.teal, fontFamily: MONO, letterSpacing: '0.06em' }}
            title="How the Matrix read your question"
          >
            Understood as: {response.surface}
            {retrieval.intent ? ` · ${retrieval.intent}` : ''}
          </span>
        </div>
        <p className="text-[15px] font-semibold leading-6" style={{ color: C.ink }}>
          {turn.question}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onShare}
            aria-label="Copy a shareable link to this answer"
            className="inline-flex items-center gap-1 text-xs font-semibold focus:outline-none focus-visible:ring-2"
            style={{ color: C.muted }}
          >
            {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {shareCopied ? 'Link copied' : 'Save or share'}
          </button>
          <span className="text-xs" style={{ color: C.muted, fontFamily: MONO }}>
            {retrieval.provider} · {retrieval.mode} · {citations.length} cited
          </span>
        </div>
      </header>

      <div className="space-y-5 p-4 md:p-5">
        {structured ? (
          <StructuredAnswer structured={structured} retrieval={retrieval} citationByLabel={citationByLabel} />
        ) : (
          <BackCompatAnswer answer={response.answer} />
        )}

        {/* Cited records */}
        {citations.length ? (
          <section>
            <SectionLabel>Cited records</SectionLabel>
            <div className="grid gap-3 md:grid-cols-2">
              {citations.map((citation) => (
                <CitationCard key={`${citation.kind}:${citation.id}`} citation={citation} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Follow-ups */}
        {followups.length ? (
          <section>
            <SectionLabel>Ask next</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {followups.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFollowup(f.askPayload)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2"
                  style={{ borderColor: C.border, color: C.body, background: '#fff' }}
                  aria-label={`Ask follow-up: ${f.text}`}
                >
                  <Plus className="h-3.5 w-3.5" style={{ color: C.accent }} />
                  {f.text}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* Related issues */}
        {relatedIssues.length ? (
          <section>
            <SectionLabel>Related issues</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {relatedIssues.map((issue) => (
                <Link
                  key={issue.slug}
                  href={issue.href}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
                  style={{ borderColor: C.border, background: '#fff', color: C.body }}
                >
                  <span className="font-semibold" style={{ color: C.ink }}>
                    {issue.title}
                  </span>
                  {issue.matchedCategories.length ? (
                    <span className="text-xs" style={{ color: C.teal, fontFamily: MONO }}>
                      {issue.matchedCategories.slice(0, 3).join(' · ')}
                    </span>
                  ) : null}
                  <span className="text-xs" style={{ color: C.muted, fontFamily: MONO }}>
                    {issue.recordCount} records
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Gaps */}
        {gaps.length ? (
          <section className="space-y-3">
            <SectionLabel>What is missing</SectionLabel>
            {gaps.map((gap) => (
              <GapCallout key={gap.kind} gap={gap} />
            ))}
          </section>
        ) : null}

        {/* Research trail */}
        {trail.length ? (
          <section>
            <SectionLabel>Keep digging</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {trail.map((t) => (
                <Link
                  key={`${t.move}:${t.label}`}
                  href={t.href}
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2"
                  style={{ borderColor: C.border, background: '#fff', color: C.body }}
                >
                  <Compass className="h-3.5 w-3.5" style={{ color: C.accent }} />
                  <span className="text-xs uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.08em' }}>
                    {TRAIL_LABELS[t.move]}
                  </span>
                  <span style={{ color: C.ink }}>{t.label}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Actions */}
        {actions.length ? (
          <section>
            <SectionLabel>Do something with this</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <ActionLink key={action.id} action={action} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-xs uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.14em' }}>
      {children}
    </div>
  );
}

function StructuredAnswer({
  structured,
  retrieval,
  citationByLabel,
}: {
  structured: AnswerStructured;
  retrieval: Retrieval;
  citationByLabel: Map<string, Citation>;
}) {
  const conf = confidenceStyle(structured.confidence);
  const verifiedPct =
    typeof retrieval.verifiedShare === 'number' ? `${Math.round(retrieval.verifiedShare * 100)}% verified` : null;
  const detailBits = [retrieval.intent, retrieval.planSource, retrieval.queries ? `${retrieval.queries} queries` : null, verifiedPct].filter(
    Boolean,
  ) as string[];

  return (
    <div className="space-y-4">
      {/* Confidence badge + detail */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded px-2 py-1 text-xs font-semibold"
          style={{ background: conf.bg, color: conf.fg }}
        >
          {conf.label}
        </span>
        {detailBits.length ? (
          <span className="text-[11px]" style={{ color: C.muted, fontFamily: MONO }}>
            {detailBits.join(' · ')}
          </span>
        ) : null}
      </div>

      {/* Direct answer */}
      <p className="text-[15px] leading-7" style={{ color: C.body }}>
        {structured.directAnswer}
      </p>

      {/* Key records */}
      {structured.keyRecords.length ? (
        <div>
          <SectionLabel>Key records</SectionLabel>
          <ul className="space-y-2">
            {structured.keyRecords.map((rec, i) => {
              const cite = citationByLabel.get(rec.label);
              return (
                <li key={`${rec.label}-${i}`} className="flex gap-2 text-sm leading-6" style={{ color: C.body }}>
                  {cite ? (
                    <Link
                      href={cite.href}
                      className="mt-0.5 inline-flex h-fit shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase focus:outline-none focus-visible:ring-2"
                      style={{ background: `${kindColor(cite.kind)}18`, color: kindColor(cite.kind), fontFamily: MONO }}
                      aria-label={`Open cited record ${rec.label}: ${cite.title}`}
                    >
                      {rec.label}
                    </Link>
                  ) : (
                    <span
                      className="mt-0.5 inline-flex h-fit shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: '#f4f4f5', color: C.muted, fontFamily: MONO }}
                    >
                      {rec.label}
                    </span>
                  )}
                  <span>{rec.point}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* What the records held */}
      {structured.whatHeld.length ? (
        <div>
          <SectionLabel>What the records held</SectionLabel>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6" style={{ color: C.body }}>
            {structured.whatHeld.map((held, i) => (
              <li key={i}>{held}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Limits */}
      {structured.limits ? (
        <div
          className="rounded-md border px-3 py-2 text-sm leading-6"
          style={{ borderColor: C.border, background: '#fafafa', color: C.body }}
        >
          <span className="font-semibold" style={{ color: C.ink }}>
            Limits:{' '}
          </span>
          {structured.limits}
        </div>
      ) : null}

      {/* Boundary note (always shown) */}
      <p className="text-xs leading-5" style={{ color: C.muted }}>
        {structured.boundaryNote || 'This is a research resource, not legal advice.'}
      </p>
    </div>
  );
}

function BackCompatAnswer({ answer }: { answer: string }) {
  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap text-[15px] leading-7" style={{ color: C.body }}>
        {answer}
      </div>
      <p className="text-xs leading-5" style={{ color: C.muted }}>
        This is a research resource, not legal advice.
      </p>
    </div>
  );
}

function GapCallout({ gap }: { gap: Gap }) {
  return (
    <div
      className="rounded-md border px-4 py-3"
      style={{ borderColor: '#e7d8be', background: '#fdf6ea' }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.amber }} />
        <div className="space-y-2">
          <p className="text-sm leading-6" style={{ color: C.body }}>
            {gap.message}
          </p>
          {gap.routes.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {gap.routes.map((route, i) => {
                if (route.href === null) {
                  // name-only external authority: plain text, never a link
                  return (
                    <span key={`${route.label}-${i}`} className="text-xs" style={{ color: C.muted, fontFamily: MONO }}>
                      (go direct: {route.label})
                    </span>
                  );
                }
                if (route.external) {
                  return (
                    <a
                      key={`${route.label}-${i}`}
                      href={route.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2"
                      style={{ borderColor: '#e7d8be', background: '#fff', color: C.amber }}
                    >
                      {route.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                }
                return (
                  <Link
                    key={`${route.label}-${i}`}
                    href={route.href}
                    className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2"
                    style={{ borderColor: '#e7d8be', background: '#fff', color: C.amber }}
                  >
                    {route.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function actionIcon(id: Action['id']) {
  if (id === 'export') return <Download className="h-3.5 w-3.5" />;
  if (id === 'follow-issue') return <Bell className="h-3.5 w-3.5" />;
  if (id === 'open-map') return <MapIcon className="h-3.5 w-3.5" />;
  return <Plus className="h-3.5 w-3.5" />;
}

function ActionLink({ action }: { action: Action }) {
  const external = action.href.startsWith('http');
  const className =
    'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2';
  const style = { background: C.accent, color: '#fff' } as const;

  if (external) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className={className} style={style} aria-label={action.label}>
        {actionIcon(action.id)}
        {action.label}
      </a>
    );
  }
  return (
    <Link href={action.href} className={className} style={style} aria-label={action.label}>
      {actionIcon(action.id)}
      {action.label}
    </Link>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  const color = kindColor(citation.kind);
  const [copied, setCopied] = useState(false);

  async function copyCitation() {
    const sourceUrl = citation.externalUrl ?? citation.href;
    const parts = [citation.title, citation.meta, sourceUrl].filter((p) => p && p.length > 0);
    const formatted = parts.join('. ');
    const ok = await copyToClipboard(formatted);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: C.border, background: '#fff' }}>
      <div className="mb-2 flex items-center gap-2" style={{ color }}>
        {kindIcon(citation.kind)}
        <span className="rounded px-1.5 py-0.5 text-[10px] uppercase" style={{ background: `${color}18`, fontFamily: MONO }}>
          {citation.label} {citation.kind}
        </span>
        {citation.verified ? (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] uppercase"
            style={{ background: '#e7f5ed', color: '#256c42', fontFamily: MONO }}
          >
            verified
          </span>
        ) : null}
        {citation.restricted ? (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] uppercase"
            style={{ background: '#fdf3e6', color: C.amber, fontFamily: MONO }}
          >
            restricted
          </span>
        ) : null}
      </div>
      <Link href={citation.href} className="block text-sm font-semibold leading-5 hover:underline focus:outline-none focus-visible:ring-2" style={{ color: C.ink }}>
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
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
        <Link href={citation.href} className="inline-flex items-center gap-1 hover:underline focus:outline-none focus-visible:ring-2" style={{ color }}>
          Open record <ArrowRight className="h-3 w-3" />
        </Link>
        {citation.externalUrl ? (
          <a
            href={citation.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline focus:outline-none focus-visible:ring-2"
            style={{ color: C.muted }}
          >
            Source <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        <button
          type="button"
          onClick={copyCitation}
          aria-label={`Copy citation for ${citation.title}`}
          className="inline-flex items-center gap-1 hover:underline focus:outline-none focus-visible:ring-2"
          style={{ color: C.muted }}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy citation'}
        </button>
      </div>
    </div>
  );
}
