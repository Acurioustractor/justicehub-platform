import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { CopyCitationButton } from './CopyCitationButton';
import { ArrowLeft, ExternalLink, Scale, ShieldCheck, MapPin, Newspaper, BookOpen, Gavel } from 'lucide-react';

// Cormorant Garamond + Instrument Sans are loaded globally via globals.css.
const DISPLAY = "'Cormorant Garamond', Georgia, serif";

interface CaseRow {
  id: string;
  jurisdiction: string;
  case_citation: string;
  year: number | null;
  court: string | null;
  strategic_issue: string | null;
  key_holding: string | null;
  facts: string | null;
  reasoning: string | null;
  dissents: string | null;
  statutes_cited: string[] | null;
  cases_cited: string[] | null;
  judges: string[] | null;
  authoritative_link: string | null;
  region: string | null;
  country_code: string | null;
  categories: string[] | null;
  outcome: 'favorable' | 'adverse' | 'pending' | null;
  precedent_strength: 'high' | 'medium' | 'low' | null;
  source: string | null;
  contributor_org: string | null;
  verified: boolean | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

interface CampaignRow {
  id: string;
  campaign_name: string;
  country_region: string | null;
  is_ongoing: boolean | null;
  categories: string[] | null;
}

interface SimilarCase {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  outcome: string | null;
}

interface ResearchHit {
  id: string;
  title: string;
  author: string | null;
  organization: string | null;
  year: number | null;
  evidence_type: string | null;
  source_url: string | null;
  consent_level: string | null;
  cultural_safety: string | null;
}

interface MediaArticleHit {
  id: string;
  headline: string;
  source_name: string | null;
  published_date: string | null;
  url: string;
  summary: string | null;
}

async function fetchProfile(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data: c, error } = await supabase
    .from('justice_matrix_cases')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !c) return null;
  const caseRow = c as CaseRow;

  // Semantic similarity via pgvector embeddings. Falls back to category-overlap
  // if the case has no embedding (shouldn't happen — embed-new cron keeps the
  // matrix current — but defensive in case of partial backfills).
  const cats = caseRow.categories ?? [];

  // alma_media_articles.topics overlap → straight semantic-ish match.
  const mediaTask = cats.length
    ? supabase
        .from('alma_media_articles')
        .select('id,headline,source_name,published_date,url,summary')
        .overlaps('topics', cats)
        .order('published_date', { ascending: false, nullsFirst: false })
        .limit(5)
    : Promise.resolve({ data: [] as MediaArticleHit[] });

  // Related evidence is now semantic (case embedding → nearest alma_evidence),
  // replacing the old ilike-on-categories match. The RPC bakes in the consent
  // gate: 'Strictly Private' excluded, 'Community Controlled' redacted to title
  // + provenance. No unfiltered fallback — if a case lacks an embedding it
  // simply shows no related evidence rather than risk leaking restricted rows.
  const [similarRes, campaignsRes, mediaRes, researchRes] = await Promise.all([
    supabase.rpc('justice_matrix_related_cases', { case_id: caseRow.id, match_limit: 6 }),
    supabase.rpc('justice_matrix_related_campaigns_for_case', {
      case_id: caseRow.id,
      match_limit: 6,
    }),
    mediaTask,
    supabase.rpc('justice_matrix_related_evidence_for_case', {
      case_id: caseRow.id,
      match_limit: 5,
    }),
  ]);

  let similar: SimilarCase[] = (similarRes.data ?? []) as SimilarCase[];
  let campaigns: CampaignRow[] = (campaignsRes.data ?? []) as CampaignRow[];
  const media = (mediaRes.data ?? []) as MediaArticleHit[];
  const research = (researchRes.data ?? []) as ResearchHit[];

  // Fallback to category-overlap if the RPCs returned nothing (no embedding,
  // or all neighbours were filtered out).
  if (!similar.length && cats.length) {
    const fb = await supabase
      .from('justice_matrix_cases')
      .select('id,case_citation,jurisdiction,year,outcome')
      .neq('id', caseRow.id)
      .overlaps('categories', cats)
      .limit(6);
    similar = (fb.data ?? []) as SimilarCase[];
  }
  if (!campaigns.length && cats.length) {
    const fb = await supabase
      .from('justice_matrix_campaigns')
      .select('id,campaign_name,country_region,is_ongoing,categories')
      .overlaps('categories', cats)
      .limit(6);
    campaigns = (fb.data ?? []) as CampaignRow[];
  }

  return { caseRow, similar, campaigns, media, research };
}

export default async function CaseProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await fetchProfile(id);
  if (!profile) notFound();
  const { caseRow, similar, campaigns, media, research } = profile;

  return (
    <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
        {/* HERO — deep purple */}
        <section
          style={{ background: 'radial-gradient(circle at 30% 0%, #5a2d74, #38184d 60%, #2c1240)' }}
          className="relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
            <Link
              href="/justice-matrix/explore"
              className="inline-flex items-center gap-2 text-[#eadff2] hover:text-white text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to explore
            </Link>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d3b583] mb-4">
              Justice Matrix · Case profile
            </div>
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.05 }}
              className="text-4xl md:text-5xl lg:text-6xl text-white max-w-4xl mb-6"
            >
              {caseRow.case_citation}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#eadff2] text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                {caseRow.jurisdiction}
              </span>
              {caseRow.court && <span>{caseRow.court}</span>}
              {caseRow.year && <span>{caseRow.year}</span>}
              {caseRow.region && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {caseRow.region}
                </span>
              )}
            </div>
            {/* Status pills */}
            <div className="flex flex-wrap gap-2 mt-6">
              {caseRow.outcome && <OutcomePill outcome={caseRow.outcome} />}
              {caseRow.precedent_strength && (
                <Pill tone="light">
                  {caseRow.precedent_strength.charAt(0).toUpperCase() + caseRow.precedent_strength.slice(1)} precedent
                </Pill>
              )}
              {caseRow.verified && (
                <Pill tone="light">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verified
                </Pill>
              )}
            </div>
          </div>
        </section>

        {/* BODY */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
            {/* LEFT — substance */}
            <div className="space-y-12">
              {caseRow.strategic_issue && (
                <Block kicker="Strategic issue" title="What was at stake">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8">
                    {caseRow.strategic_issue}
                  </p>
                </Block>
              )}

              {caseRow.facts && (
                <Block kicker="Facts" title="What happened">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                    {caseRow.facts}
                  </p>
                </Block>
              )}

              {caseRow.key_holding && (
                <Block kicker="Key holding" title="What the court decided">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8">
                    {caseRow.key_holding}
                  </p>
                </Block>
              )}

              {caseRow.reasoning && (
                <Block kicker="Reasoning" title="How the court got there">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                    {caseRow.reasoning}
                  </p>
                </Block>
              )}

              {caseRow.dissents && (
                <Block kicker="Dissents" title="Who pushed back">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                    {caseRow.dissents}
                  </p>
                </Block>
              )}

              {(caseRow.statutes_cited?.length || caseRow.cases_cited?.length) ? (
                <Block kicker="Authorities" title="Statutes and cases cited">
                  {caseRow.statutes_cited && caseRow.statutes_cited.length > 0 && (
                    <div className="mb-4">
                      <Kicker>Statutes &amp; treaties</Kicker>
                      <ul className="space-y-1 text-base" style={{ color: '#584b40' }}>
                        {caseRow.statutes_cited.map((s) => (
                          <li key={s} className="leading-7">
                            <span style={{ color: '#4a2560' }}>§</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {caseRow.cases_cited && caseRow.cases_cited.length > 0 && (
                    <div>
                      <Kicker>Cases cited</Kicker>
                      <ul className="space-y-1 text-base" style={{ color: '#584b40', fontFamily: DISPLAY }}>
                        {caseRow.cases_cited.map((c) => (
                          <li key={c} className="leading-7 italic">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Block>
              ) : null}

              {caseRow.categories && caseRow.categories.length > 0 && (
                <Block kicker="Issue areas" title="Categories">
                  <div className="flex flex-wrap gap-2">
                    {caseRow.categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-full px-3 py-1 text-[12px] font-semibold tracking-[0.04em]"
                        style={{ background: '#f3eadb', color: '#5e5145', border: '1px solid #eadfce' }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </Block>
              )}

              {caseRow.authoritative_link && (
                <Block kicker="Source" title="Authoritative link">
                  <a
                    href={caseRow.authoritative_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[18px] border px-4 py-3 transition-colors hover:bg-white"
                    style={{ background: '#fff8ef', borderColor: '#e6d7c1', color: '#4a2560' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="break-all text-sm">{caseRow.authoritative_link}</span>
                  </a>
                </Block>
              )}
            </div>

            {/* RIGHT — context */}
            <aside className="space-y-6">
              {/* Provenance */}
              <Card>
                <Kicker>Provenance</Kicker>
                <dl className="text-sm divide-y" style={{ borderColor: '#e8dcc9' }}>
                  <ProvRow label="Source">{caseRow.source ?? '—'}</ProvRow>
                  <ProvRow label="Contributor">{caseRow.contributor_org ?? '—'}</ProvRow>
                  <ProvRow label="Verified">
                    {caseRow.verified
                      ? `by ${caseRow.verified_by ?? '—'}${caseRow.verified_at ? ` on ${new Date(caseRow.verified_at).toLocaleDateString()}` : ''}`
                      : 'Pending review'}
                  </ProvRow>
                  <ProvRow label="Added">{new Date(caseRow.created_at).toLocaleDateString()}</ProvRow>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyCitationButton text={caseRow.case_citation} />
                  <CopyCitationButton path={`/justice-matrix/cases/${caseRow.id}`} />
                </div>
              </Card>

              {/* Bench */}
              {caseRow.judges && caseRow.judges.length > 0 && (
                <Card>
                  <Kicker>Bench</Kicker>
                  <ul className="space-y-1.5 text-sm" style={{ color: '#2b2530' }}>
                    {caseRow.judges.map((j) => (
                      <li key={j} className="flex items-center gap-2">
                        <Gavel className="w-3 h-3 opacity-60" style={{ color: '#4a2560' }} />
                        {j}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Related research */}
              {research.length > 0 && (
                <Card>
                  <Kicker>Related research</Kicker>
                  <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                    {research.map((r) => {
                      const restricted = r.consent_level === 'Community Controlled';
                      const provenance = [r.author, r.organization, r.year]
                        .filter(Boolean)
                        .join(' · ');
                      const titleEl = (
                        <div
                          style={{ fontFamily: DISPLAY, color: '#2b2530' }}
                          className="text-base font-medium leading-snug"
                        >
                          {r.title}
                        </div>
                      );
                      return (
                        <li key={r.id} className="py-3">
                          <div className="flex items-start gap-1.5">
                            <BookOpen
                              className="w-3.5 h-3.5 mt-1 shrink-0 opacity-60"
                              style={{ color: '#4a2560' }}
                            />
                            <div>
                              {r.source_url ? (
                                <a
                                  href={r.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block hover:opacity-80 transition-opacity"
                                >
                                  {titleEl}
                                </a>
                              ) : (
                                titleEl
                              )}
                              {provenance && (
                                <div className="text-xs mt-1" style={{ color: '#5e5145' }}>
                                  {provenance}
                                </div>
                              )}
                              {restricted && (
                                <div className="text-xs mt-1 italic" style={{ color: '#a96a1c' }}>
                                  Community controlled — access on request
                                </div>
                              )}
                              {r.cultural_safety && (
                                <div className="text-xs mt-1 italic" style={{ color: '#1f6f78' }}>
                                  {r.cultural_safety}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}

              {/* Media coverage */}
              {media.length > 0 && (
                <Card>
                  <Kicker>In the news</Kicker>
                  <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                    {media.map((m) => (
                      <li key={m.id} className="py-3">
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-start gap-1.5">
                            <Newspaper className="w-3.5 h-3.5 mt-1 shrink-0 opacity-60" style={{ color: '#4a2560' }} />
                            <div>
                              <div
                                style={{ fontFamily: DISPLAY, color: '#2b2530' }}
                                className="text-base font-medium leading-snug"
                              >
                                {m.headline}
                              </div>
                              <div className="text-xs mt-1" style={{ color: '#5e5145' }}>
                                {[m.source_name, m.published_date ? new Date(m.published_date).toLocaleDateString() : null]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            </div>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Similar cases */}
              {similar.length > 0 && (
                <Card>
                  <Kicker>Similar cases</Kicker>
                  <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                    {similar.map((s) => (
                      <li key={s.id} className="py-3">
                        <Link
                          href={`/justice-matrix/cases/${s.id}`}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <div
                            style={{ fontFamily: DISPLAY, color: '#2b2530' }}
                            className="text-lg font-medium leading-tight"
                          >
                            {s.case_citation}
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#5e5145' }}>
                            {s.jurisdiction}
                            {s.year ? ` · ${s.year}` : ''}
                            {s.outcome ? ` · ${s.outcome}` : ''}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Linked campaigns */}
              {campaigns.length > 0 && (
                <Card>
                  <Kicker>Linked campaigns</Kicker>
                  <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                    {campaigns.map((c) => (
                      <li key={c.id} className="py-3">
                        <div
                          style={{ fontFamily: DISPLAY, color: '#2b2530' }}
                          className="text-lg font-medium leading-tight"
                        >
                          {c.campaign_name}
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#5e5145' }}>
                          {c.country_region}
                          {c.is_ongoing === false ? ' · concluded' : c.is_ongoing ? ' · active' : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </aside>
          </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-4"
      style={{ color: '#8d6a44' }}
    >
      {children}
    </div>
  );
}

function Block({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h2
        style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
        className="text-3xl md:text-4xl mb-5 leading-tight"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[22px] p-6"
      style={{
        background: '#fff8ef',
        border: '1px solid #e6d7c1',
        boxShadow: '0 16px 40px rgba(49,31,15,0.06)',
      }}
    >
      {children}
    </div>
  );
}

function ProvRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 flex gap-3">
      <dt
        className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] mt-1"
        style={{ color: '#8d6a44' }}
      >
        {label}
      </dt>
      <dd style={{ color: '#2b2530' }} className="text-sm">
        {children}
      </dd>
    </div>
  );
}

function Pill({
  children,
  tone = 'light',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'good' | 'bad' | 'warn';
}) {
  const palette = {
    light: { bg: 'rgba(255,255,255,0.10)', color: '#f1e6f7', border: 'rgba(255,255,255,0.22)' },
    good: { bg: 'rgba(61,111,74,0.22)', color: '#d3eed4', border: 'rgba(211,238,212,0.35)' },
    bad: { bg: 'rgba(138,42,42,0.30)', color: '#f4d4d4', border: 'rgba(244,212,212,0.35)' },
    warn: { bg: 'rgba(169,106,28,0.25)', color: '#f1dcb0', border: 'rgba(241,220,176,0.35)' },
  }[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] border"
      style={{ background: palette.bg, color: palette.color, borderColor: palette.border }}
    >
      {children}
    </span>
  );
}

function OutcomePill({ outcome }: { outcome: 'favorable' | 'adverse' | 'pending' }) {
  const tone = outcome === 'favorable' ? 'good' : outcome === 'adverse' ? 'bad' : 'warn';
  const label = outcome.charAt(0).toUpperCase() + outcome.slice(1);
  return <Pill tone={tone}>{label}</Pill>;
}
