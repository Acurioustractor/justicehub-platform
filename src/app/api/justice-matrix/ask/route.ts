import { NextResponse } from 'next/server';
import { SURFACES } from '@/lib/justice-matrix/surfaces';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

type Surface = 'all' | 'refugee' | 'youth';
type SourceKind = 'case' | 'campaign' | 'evidence';

interface AskRequest {
  question?: string;
  surface?: Surface;
}

interface RawCase {
  kind: 'case';
  id: string;
  title: string;
  jurisdiction: string | null;
  year: number | null;
  court: string | null;
  excerpt: string | null;
  authoritative_link: string | null;
  verified: boolean | null;
  human_confirmed: boolean | null;
}

interface RawCampaign {
  kind: 'campaign';
  id: string;
  title: string;
  region: string | null;
  start_year: number | null;
  excerpt: string | null;
  lead_organizations: string | null;
  campaign_link: string | null;
}

interface RawEvidence {
  kind: 'evidence';
  id: string;
  title: string;
  jurisdiction: string | null;
  year: number | null;
  evidence_type: string | null;
  excerpt: string | null;
  organization: string | null;
  source_url: string | null;
  restricted: boolean;
}

type RawHit = RawCase | RawCampaign | RawEvidence;

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

interface SearchPayload {
  mode: 'keyword' | 'semantic';
  cases?: RawCase[];
  campaigns?: RawCampaign[];
  evidence?: RawEvidence[];
  total?: number;
}

interface Provider {
  name: string;
  url: string;
  model: string;
  key: string;
}

const SYSTEM_PROMPT = `You are Ask the Matrix, a grounded research assistant for JusticeHub's Justice Matrix.

Use only the retrieved Matrix records provided by the API. Cite every substantive factual claim with bracket citations like [C1] or [C2]. If the records do not support an answer, say what is missing and suggest a better search.

Boundaries:
- This is research support and strategy orientation, not legal advice.
- Do not tell a user what legal action to take.
- Do not invent cases, campaigns, outcomes, holdings, source links, or facts.
- Prefer clear, practical summaries over broad commentary.

Answer shape:
1. Direct answer in 2-4 short paragraphs.
2. "Useful records" with 3-6 bullets, each cited.
3. "Limits" with anything the corpus did not establish.`;

function cleanQuestion(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function normaliseSurface(value: unknown): Surface {
  return value === 'refugee' || value === 'youth' ? value : 'all';
}

function chooseProvider(): Provider | null {
  if (process.env.GEMINI_API_KEY) {
    return {
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.5-flash',
      key: process.env.GEMINI_API_KEY,
    };
  }
  if (process.env.GROQ_API_KEY) {
    return {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      key: process.env.GROQ_API_KEY,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      key: process.env.OPENAI_API_KEY,
    };
  }
  return null;
}

function hrefFor(hit: RawHit): string {
  if (hit.kind === 'case') return `/justice-matrix/cases/${hit.id}`;
  if (hit.kind === 'campaign') return `/justice-matrix/campaigns/${hit.id}`;
  return `/justice-matrix/evidence/${hit.id}`;
}

function metaFor(hit: RawHit): string {
  if (hit.kind === 'case') {
    return [hit.court, hit.jurisdiction, hit.year].filter(Boolean).join(' | ');
  }
  if (hit.kind === 'campaign') {
    return [hit.region, hit.start_year, hit.lead_organizations].filter(Boolean).join(' | ');
  }
  return [hit.jurisdiction ?? 'Australia', hit.year, hit.evidence_type, hit.organization].filter(Boolean).join(' | ');
}

function toCitation(hit: RawHit, index: number): Citation {
  const label = `C${index + 1}`;
  if (hit.kind === 'case') {
    return {
      id: hit.id,
      label,
      kind: 'case',
      title: hit.title,
      href: hrefFor(hit),
      externalUrl: hit.authoritative_link,
      meta: metaFor(hit),
      excerpt: hit.excerpt,
      verified: hit.verified,
      humanConfirmed: hit.human_confirmed,
    };
  }
  if (hit.kind === 'campaign') {
    return {
      id: hit.id,
      label,
      kind: 'campaign',
      title: hit.title,
      href: hrefFor(hit),
      externalUrl: hit.campaign_link,
      meta: metaFor(hit),
      excerpt: hit.excerpt,
    };
  }
  return {
    id: hit.id,
    label,
    kind: 'evidence',
    title: hit.title,
    href: hrefFor(hit),
    externalUrl: hit.source_url,
    meta: metaFor(hit),
    excerpt: hit.excerpt,
    restricted: hit.restricted,
  };
}

function orderedHits(payload: SearchPayload, surface: Surface): RawHit[] {
  const cases = payload.cases ?? [];
  const campaigns = payload.campaigns ?? [];
  const evidence = surface === 'refugee' ? [] : payload.evidence ?? [];
  const all: RawHit[] = [];
  const max = Math.max(cases.length, campaigns.length, evidence.length);

  for (let i = 0; i < max; i += 1) {
    if (cases[i]) all.push(cases[i]);
    if (campaigns[i]) all.push(campaigns[i]);
    if (evidence[i]) all.push(evidence[i]);
  }

  const seen = new Set<string>();
  return all.filter((hit) => {
    const key = `${hit.kind}:${hit.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildContext(citations: Citation[]): string {
  return citations
    .map((c) =>
      [
        `[${c.label}] ${c.kind.toUpperCase()}: ${c.title}`,
        `Route: ${c.href}`,
        c.externalUrl ? `Source: ${c.externalUrl}` : null,
        c.meta ? `Meta: ${c.meta}` : null,
        c.verified === true ? 'Trust: verified case, human confirmed when noted in metadata.' : null,
        c.restricted ? 'Consent: restricted evidence, title and provenance only.' : null,
        c.excerpt ? `Excerpt: ${c.excerpt}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');
}

function fallbackAnswer(question: string, citations: Citation[], searchMode: string): string {
  if (!citations.length) {
    return [
      `I could not find a strong Matrix match for "${question}".`,
      '',
      'Try a narrower search term, a case name, a campaign name, or one of the issue phrases such as "non-refoulement high seas", "third country transfer", "offshore detention", or "raise the age".',
      '',
      'This is research support, not legal advice.',
    ].join('\n');
  }

  const useful = citations
    .slice(0, 6)
    .map((c) => `- [${c.label}] ${c.title}${c.meta ? ` (${c.meta})` : ''}`)
    .join('\n');

  return [
    `I found ${citations.length} Matrix record${citations.length === 1 ? '' : 's'} for "${question}" using ${searchMode} retrieval.`,
    '',
    'This is a cited research packet rather than generated synthesis because no chat provider is configured in this environment. Use the records below to move from question to source.',
    '',
    'Useful records:',
    useful,
    '',
    'Limits: the Matrix can orient strategy and source review, but it does not provide legal advice. Read the linked source before relying on a case or campaign.',
  ].join('\n');
}

async function askProvider(provider: Provider, question: string, citations: Citation[]): Promise<string> {
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: 1100,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            `Question: ${question}`,
            '',
            'Retrieved Matrix records:',
            buildContext(citations),
          ].join('\n'),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${provider.name} failed: ${res.status} ${text.slice(0, 160)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`${provider.name} returned no answer`);
  }
  return content.trim();
}

async function retrieve(request: Request, question: string, surface: Surface): Promise<{
  citations: Citation[];
  mode: string;
  total: number;
}> {
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    q: question,
    mode: 'semantic',
    type: 'all',
    limit: surface === 'youth' ? '8' : '10',
  });

  if (surface === 'refugee' || surface === 'youth') {
    const preset = SURFACES[surface];
    params.set('scope', preset.defaultScope);
    if (preset.defaultCats.length) params.set('cat', preset.defaultCats.join(','));
  }

  const res = await fetch(`${origin}/api/justice-matrix/search?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Matrix search failed: ${res.status}`);

  const payload = (await res.json()) as SearchPayload;
  const hits = orderedHits(payload, surface).slice(0, 10);
  return {
    citations: hits.map(toCitation),
    mode: payload.mode ?? 'keyword',
    total: payload.total ?? hits.length,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AskRequest;
    const question = cleanQuestion(body.question);
    const surface = normaliseSurface(body.surface);

    if (question.length < 3) {
      return NextResponse.json({ error: 'Question must be at least 3 characters.' }, { status: 400 });
    }

    const retrieved = await retrieve(request, question, surface);
    const provider = chooseProvider();

    let answer: string;
    let providerName = 'retrieval-only';
    try {
      if (provider && retrieved.citations.length) {
        answer = await askProvider(provider, question, retrieved.citations);
        providerName = provider.name;
      } else {
        answer = fallbackAnswer(question, retrieved.citations, retrieved.mode);
      }
    } catch (error) {
      console.warn('[Ask the Matrix] provider failed, falling back:', error);
      answer = fallbackAnswer(question, retrieved.citations, retrieved.mode);
    }

    return NextResponse.json({
      question,
      surface,
      answer,
      citations: retrieved.citations,
      retrieval: {
        mode: retrieved.mode,
        total: retrieved.total,
        provider: providerName,
      },
    });
  } catch (error) {
    console.error('[Ask the Matrix] failed:', error);
    return NextResponse.json({ error: 'Ask the Matrix could not answer right now.' }, { status: 500 });
  }
}
