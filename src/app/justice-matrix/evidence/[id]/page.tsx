import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Scale, Megaphone, MapPin } from 'lucide-react';

const DISPLAY = "'Cormorant Garamond', Georgia, serif";

export const dynamic = 'force-dynamic';

interface EvidenceRow {
  id: string;
  title: string;
  evidence_type: string | null;
  methodology: string | null;
  sample_size: number | null;
  timeframe: string | null;
  findings: string | null;
  effect_size: string | null;
  limitations: string | null;
  cultural_safety: string | null;
  author: string | null;
  organization: string | null;
  publication_date: string | null;
  doi: string | null;
  source_url: string | null;
  source_document_url: string | null;
  consent_level: string | null;
  classified_by: string | null;
  classified_at: string | null;
  consent_authority: string | null;
}

interface RelatedCase {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  outcome: string | null;
}

interface RelatedCampaign {
  id: string;
  campaign_name: string;
  country_region: string | null;
  is_ongoing: boolean | null;
}

async function fetchEvidence(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('alma_evidence')
    .select(
      // Note: revocation_token is deliberately NOT selected. It is a per-row
      // capability secret and must never reach the client.
      'id,title,evidence_type,methodology,sample_size,timeframe,findings,effect_size,limitations,cultural_safety,author,organization,publication_date,doi,source_url,source_document_url,consent_level,classified_by,classified_at,consent_authority',
    )
    .eq('id', id)
    .single();
  if (error || !data) return null;
  const row = data as EvidenceRow;

  // Consent gate. 'Strictly Private' (and anything not explicitly public or
  // community-controlled) is not reachable here at all.
  if (row.consent_level !== 'Public Knowledge Commons' && row.consent_level !== 'Community Controlled') {
    return null;
  }
  const restricted = row.consent_level === 'Community Controlled';

  const [casesRes, campaignsRes] = await Promise.all([
    supabase.rpc('justice_matrix_related_cases_for_evidence', { evidence_id: row.id, match_limit: 6 }),
    supabase.rpc('justice_matrix_related_campaigns_for_evidence', { evidence_id: row.id, match_limit: 6 }),
  ]);

  return {
    row,
    restricted,
    relatedCases: (casesRes.data ?? []) as RelatedCase[],
    relatedCampaigns: (campaignsRes.data ?? []) as RelatedCampaign[],
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await fetchEvidence(id);
  if (!profile) return { title: 'Evidence · Justice Matrix' };
  return {
    title: `${profile.row.title} · Justice Matrix`,
    description: 'Australian youth-justice evidence in the Justice Matrix.',
  };
}

export default async function EvidenceProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await fetchEvidence(id);
  if (!profile) notFound();
  const { row, restricted, relatedCases, relatedCampaigns } = profile;
  const year = row.publication_date ? new Date(row.publication_date).getUTCFullYear() : null;
  const sourceUrl = restricted ? null : row.source_url ?? row.source_document_url ?? null;

  return (
    <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
      {/* HERO */}
      <section
        style={{ background: 'radial-gradient(circle at 30% 0%, #1f6f78, #155a61 60%, #11464c)' }}
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
            href="/justice-matrix/explore?type=evidence"
            className="inline-flex items-center gap-2 text-[#d6efe9] hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to explore
          </Link>
          <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#bfe3da] mb-4">
            Justice Matrix · Evidence · Australia
          </div>
          <h1
            style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.05 }}
            className="text-4xl md:text-5xl lg:text-6xl text-white max-w-4xl mb-6"
          >
            {row.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#d6efe9] text-sm">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {row.evidence_type ?? 'Evidence'}
            </span>
            {row.organization && <span>{row.organization}</span>}
            {row.author && <span>{row.author}</span>}
            {year && <span>{year}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {restricted && (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}
              >
                Community controlled
              </span>
            )}
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          {/* LEFT — substance */}
          <div className="space-y-12">
            {restricted ? (
              <Card>
                <Kicker>Community controlled</Kicker>
                <p className="text-lg leading-8" style={{ color: '#584b40' }}>
                  This evidence is held under community control. Its title and provenance are
                  shown here so it can be found and cited, but the full study is available on
                  request rather than published openly.
                </p>
                {row.cultural_safety && (
                  <p className="text-base leading-7 mt-4 italic" style={{ color: '#1f6f78' }}>
                    {row.cultural_safety}
                  </p>
                )}
                <p className="text-sm leading-6 mt-5" style={{ color: '#7d5f3d' }}>
                  This record stays under the control of the community that holds it. The holding
                  community can request a change to how it appears, or its removal, at any time, and
                  that request is honoured.
                </p>
              </Card>
            ) : (
              <>
                {row.findings && (
                  <Block kicker="Findings" title="What the evidence shows">
                    <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                      {row.findings}
                    </p>
                  </Block>
                )}
                {row.effect_size && (
                  <Block kicker="Effect size" title="How much it moved the needle">
                    <p style={{ color: '#584b40' }} className="text-lg leading-8">
                      {row.effect_size}
                    </p>
                  </Block>
                )}
                {(row.methodology || row.sample_size || row.timeframe) && (
                  <Block kicker="Method" title="How the study was done">
                    {row.methodology && (
                      <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line mb-3">
                        {row.methodology}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: '#7d5f3d' }}>
                      {row.sample_size != null && <span>Sample size: {row.sample_size}</span>}
                      {row.timeframe && <span>Timeframe: {row.timeframe}</span>}
                    </div>
                  </Block>
                )}
                {row.limitations && (
                  <Block kicker="Limitations" title="What to hold lightly">
                    <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                      {row.limitations}
                    </p>
                  </Block>
                )}
                {row.cultural_safety && (
                  <Block kicker="Cultural safety" title="How this sits with community">
                    <p style={{ color: '#1f6f78' }} className="text-lg leading-8 italic">
                      {row.cultural_safety}
                    </p>
                  </Block>
                )}
              </>
            )}
          </div>

          {/* RIGHT — provenance + reverse links */}
          <div className="space-y-8">
            <Card>
              <Kicker>Provenance</Kicker>
              <dl className="space-y-2 text-sm">
                <ProvRow label="Type" value={row.evidence_type} />
                <ProvRow label="Author" value={row.author} />
                <ProvRow label="Organisation" value={row.organization} />
                <ProvRow label="Published" value={year ? String(year) : null} />
                <ProvRow label="DOI" value={restricted ? null : row.doi} />
                <ProvRow label="Classified by" value={row.classified_by} />
                <ProvRow label="On authority of" value={row.consent_authority} />
              </dl>
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold underline"
                  style={{ color: '#1f6f78' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View source
                </a>
              )}
              {restricted && (
                <p className="text-xs mt-4 italic" style={{ color: '#a96a1c' }}>
                  Full study available on request.
                </p>
              )}
            </Card>

            {relatedCases.length > 0 && (
              <Card>
                <Kicker>Cases this speaks to</Kicker>
                <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                  {relatedCases.map((c) => (
                    <li key={c.id} className="py-3">
                      <Link
                        href={`/justice-matrix/cases/${c.id}`}
                        className="group flex items-start gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        <Scale className="w-3.5 h-3.5 mt-1 shrink-0 opacity-60" style={{ color: '#4a2560' }} />
                        <div className="flex-1">
                          <div
                            style={{ fontFamily: DISPLAY, color: '#2b2530' }}
                            className="text-base font-medium leading-snug"
                          >
                            {c.case_citation}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: '#5e5145' }}>
                            {[c.jurisdiction, c.year].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 self-center" style={{ color: '#4a2560' }} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {relatedCampaigns.length > 0 && (
              <Card>
                <Kicker>Campaigns this speaks to</Kicker>
                <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                  {relatedCampaigns.map((m) => (
                    <li key={m.id} className="py-3">
                      <Link
                        href={`/justice-matrix/campaigns/${m.id}`}
                        className="group flex items-start gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        <Megaphone className="w-3.5 h-3.5 mt-1 shrink-0 opacity-60" style={{ color: '#a96a1c' }} />
                        <div className="flex-1">
                          <div
                            style={{ fontFamily: DISPLAY, color: '#2b2530' }}
                            className="text-base font-medium leading-snug"
                          >
                            {m.campaign_name}
                          </div>
                          {m.country_region && (
                            <div className="text-xs mt-0.5 inline-flex items-center gap-1" style={{ color: '#5e5145' }}>
                              <MapPin className="w-3 h-3" />
                              {m.country_region}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 self-center" style={{ color: '#a96a1c' }} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Local UI bits (self-contained; mirrors the case profile visual language)
// ---------------------------------------------------------------------------

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2.5"
      style={{ color: '#8d6a44' }}
    >
      {children}
    </div>
  );
}

function Block({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h2 style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }} className="text-2xl md:text-3xl mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[18px] border p-6"
      style={{ background: '#fff8ef', borderColor: '#e6d7c1', boxShadow: '0 12px 28px rgba(49,31,15,0.05)' }}
    >
      {children}
    </div>
  );
}

function ProvRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-[11px] uppercase tracking-[0.14em]" style={{ color: '#8d6a44' }}>
        {label}
      </dt>
      <dd style={{ color: '#2b2530' }}>{value}</dd>
    </div>
  );
}
