import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { CopyCitationButton } from '../../cases/[id]/CopyCitationButton';
import { LegalDisclaimer } from '../../_components/LegalDisclaimer';
import { ArrowLeft, ExternalLink, Megaphone, ShieldCheck, MapPin } from 'lucide-react';

// Cormorant Garamond + Instrument Sans are loaded globally via globals.css.
const DISPLAY = "'Cormorant Garamond', Georgia, serif";

interface CampaignRow {
  id: string;
  country_region: string;
  campaign_name: string;
  lead_organizations: string | null;
  goals: string | null;
  notable_tactics: string | null;
  outcome_status: string | null;
  campaign_link: string | null;
  start_year: number | null;
  end_year: number | null;
  is_ongoing: boolean | null;
  categories: string[] | null;
  country_code: string | null;
  source: string | null;
  contributor_org: string | null;
  verified: boolean | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

interface SimilarCampaign {
  id: string;
  campaign_name: string;
  country_region: string | null;
  start_year: number | null;
  is_ongoing: boolean | null;
}

interface LinkedCase {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  outcome: string | null;
}

async function fetchProfile(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data: c, error } = await supabase
    .from('justice_matrix_campaigns')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !c) return null;
  const campaignRow = c as CampaignRow;

  // Semantic similarity via pgvector. Falls back to category overlap if the
  // RPCs return nothing (e.g. missing embedding on this row).
  const cats = campaignRow.categories ?? [];
  const [similarRes, casesRes] = await Promise.all([
    supabase.rpc('justice_matrix_related_campaigns', {
      campaign_id: campaignRow.id,
      match_limit: 6,
    }),
    supabase.rpc('justice_matrix_related_cases_for_campaign', {
      campaign_id: campaignRow.id,
      match_limit: 6,
    }),
  ]);

  let similar: SimilarCampaign[] = (similarRes.data ?? []) as SimilarCampaign[];
  let cases: LinkedCase[] = (casesRes.data ?? []) as LinkedCase[];

  if (!similar.length && cats.length) {
    const fb = await supabase
      .from('justice_matrix_campaigns')
      .select('id,campaign_name,country_region,start_year,is_ongoing')
      .neq('id', campaignRow.id)
      .overlaps('categories', cats)
      .limit(6);
    similar = (fb.data ?? []) as SimilarCampaign[];
  }
  if (!cases.length && cats.length) {
    const fb = await supabase
      .from('justice_matrix_cases')
      .select('id,case_citation,jurisdiction,year,outcome')
      .overlaps('categories', cats)
      .limit(6);
    cases = (fb.data ?? []) as LinkedCase[];
  }

  return { campaignRow, similar, cases };
}

export default async function CampaignProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await fetchProfile(id);
  if (!profile) notFound();
  const { campaignRow, similar, cases } = profile;

  const yearLabel =
    campaignRow.start_year && campaignRow.end_year
      ? `${campaignRow.start_year}–${campaignRow.end_year}`
      : campaignRow.start_year
      ? `${campaignRow.start_year}${campaignRow.is_ongoing === false ? '' : ', ongoing'}`
      : campaignRow.is_ongoing
      ? 'Ongoing'
      : '';

  return (
    <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
      {/* HERO */}
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
              Back to the matrix
            </Link>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d3b583] mb-4">
              Justice Matrix · Campaign profile
            </div>
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.05 }}
              className="text-4xl md:text-5xl lg:text-6xl text-white max-w-4xl mb-6"
            >
              {campaignRow.campaign_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#eadff2] text-sm">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {campaignRow.country_region}
              </span>
              {yearLabel && <span>{yearLabel}</span>}
              {campaignRow.lead_organizations && (
                <span className="opacity-90">{campaignRow.lead_organizations}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <Pill tone={campaignRow.is_ongoing === false ? 'warn' : 'good'}>
                <Megaphone className="w-3 h-3 mr-1" />
                {campaignRow.is_ongoing === false ? 'Concluded' : 'Active'}
              </Pill>
              {campaignRow.verified && (
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
            {/* LEFT */}
            <div className="space-y-12">
              {campaignRow.goals && (
                <Block kicker="Goals" title="What this campaign seeks">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                    {campaignRow.goals}
                  </p>
                </Block>
              )}

              {campaignRow.notable_tactics && (
                <Block kicker="Tactics" title="How it works">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                    {campaignRow.notable_tactics}
                  </p>
                </Block>
              )}

              {campaignRow.outcome_status && (
                <Block kicker="Outcome and status" title="Where it stands">
                  <p style={{ color: '#584b40' }} className="text-lg leading-8 whitespace-pre-line">
                    {campaignRow.outcome_status}
                  </p>
                </Block>
              )}

              {campaignRow.categories && campaignRow.categories.length > 0 && (
                <Block kicker="Issue areas" title="Categories">
                  <div className="flex flex-wrap gap-2">
                    {campaignRow.categories.map((c) => (
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

              {campaignRow.campaign_link && (
                <Block kicker="Source" title="Campaign link">
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2"
                    style={{ color: '#8d6a44' }}
                  >
                    Source of record
                  </div>
                  <a
                    href={campaignRow.campaign_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[18px] border px-4 py-3 transition-colors hover:bg-white"
                    style={{ background: '#fff8ef', borderColor: '#e6d7c1', color: '#4a2560' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="break-all text-sm">{campaignRow.campaign_link}</span>
                  </a>
                </Block>
              )}
            </div>

            {/* RIGHT */}
            <aside className="space-y-6">
              <Card>
                <Kicker>Provenance</Kicker>
                <dl className="text-sm divide-y" style={{ borderColor: '#e8dcc9' }}>
                  <ProvRow label="Source">{campaignRow.source ?? '—'}</ProvRow>
                  <ProvRow label="Contributor">{campaignRow.contributor_org ?? '—'}</ProvRow>
                  <ProvRow label="Verified">
                    {campaignRow.verified
                      ? `by ${campaignRow.verified_by ?? '—'}${campaignRow.verified_at ? ` on ${new Date(campaignRow.verified_at).toLocaleDateString()}` : ''}`
                      : 'Pending review'}
                  </ProvRow>
                  <ProvRow label="Added">{new Date(campaignRow.created_at).toLocaleDateString()}</ProvRow>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyCitationButton text={campaignRow.campaign_name} label="Copy name" />
                  <CopyCitationButton path={`/justice-matrix/campaigns/${campaignRow.id}`} />
                </div>
              </Card>

              {similar.length > 0 && (
                <Card>
                  <Kicker>Similar campaigns</Kicker>
                  <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                    {similar.map((s) => (
                      <li key={s.id} className="py-3">
                        <Link
                          href={`/justice-matrix/campaigns/${s.id}`}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <div style={{ fontFamily: DISPLAY, color: '#2b2530' }} className="text-lg font-medium leading-tight">
                            {s.campaign_name}
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#5e5145' }}>
                            {s.country_region}
                            {s.start_year ? ` · ${s.start_year}` : ''}
                            {s.is_ongoing === false ? ' · concluded' : s.is_ongoing ? ' · active' : ''}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {cases.length > 0 && (
                <Card>
                  <Kicker>Linked cases</Kicker>
                  <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
                    {cases.map((c) => (
                      <li key={c.id} className="py-3">
                        <Link
                          href={`/justice-matrix/cases/${c.id}`}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <div style={{ fontFamily: DISPLAY, color: '#2b2530' }} className="text-lg font-medium leading-tight">
                            {c.case_citation}
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#5e5145' }}>
                            {c.jurisdiction}
                            {c.year ? ` · ${c.year}` : ''}
                            {c.outcome ? ` · ${c.outcome}` : ''}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
          </aside>
        </div>

        {/* Governance v1: disclaimer + CC BY-NC licence, page end */}
        <div className="mt-14">
          <LegalDisclaimer tone="footer" />
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Local presentational helpers (parallel to those in cases/[id]/page.tsx)
// ---------------------------------------------------------------------------

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-4" style={{ color: '#8d6a44' }}>
      {children}
    </div>
  );
}

function Block({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h2 style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }} className="text-3xl md:text-4xl mb-5 leading-tight">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] p-6" style={{ background: '#fff8ef', border: '1px solid #e6d7c1', boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}>
      {children}
    </div>
  );
}

function ProvRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 flex gap-3">
      <dt className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] mt-1" style={{ color: '#8d6a44' }}>
        {label}
      </dt>
      <dd style={{ color: '#2b2530' }} className="text-sm">
        {children}
      </dd>
    </div>
  );
}

function Pill({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'good' | 'bad' | 'warn' }) {
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
