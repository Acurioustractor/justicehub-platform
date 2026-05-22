import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ExternalLink, MapPin, Users, DollarSign, ScrollText, Building2 } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service';
import { TierBadge } from '@/components/intelligence/civic/TierBadge';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ 'org-slug': string }>;
}

async function fetchOrgPortrait(slug: string) {
  const sb = createServiceClient() as any;

  const { data: org } = await sb
    .from('organizations')
    .select('id, name, slug, description, website, logo_url, partner_tier, state, is_indigenous_org, gs_entity_id')
    .eq('slug', slug)
    .maybeSingle();
  if (!org) return null;

  // Civic classification: only published if confirmed Tier 1
  const { data: classification } = await sb
    .from('civic_org_classifications')
    .select('tier, sector_category, confirmed_at, llm_evidence_snippet')
    .eq('organization_id', org.id)
    .not('confirmed_at', 'is', null)
    .maybeSingle();

  if (!classification || classification.tier !== 1) {
    return { org, classification: null };
  }

  // Registry record
  let gs: any = null;
  if (org.gs_entity_id) {
    const { data } = await sb
      .from('gs_entities')
      .select('canonical_name, abn, acn, state, postcode, lga_name, remoteness, sector, latest_revenue, financial_year, is_community_controlled, community_controlled_tier, website, email, phone, description')
      .eq('id', org.gs_entity_id)
      .maybeSingle();
    gs = data;
  }

  // Programs
  const { data: programs } = await sb
    .from('alma_interventions')
    .select('id, name, type, service_role, target_cohort, geography, years_operating, evidence_level')
    .eq('operating_organization_id', org.id)
    .neq('verification_status', 'ai_generated')
    .order('name')
    .limit(50);

  // Funding (paginated)
  let fundingRows: any[] = [];
  if (org.gs_entity_id || gs?.abn) {
    const orParts = [
      org.gs_entity_id ? `gs_entity_id.eq.${org.gs_entity_id}` : null,
      gs?.abn ? `recipient_abn.eq.${gs.abn}` : null,
    ].filter(Boolean).join(',');
    const { data } = await sb
      .from('justice_funding')
      .select('id, amount_dollars, recipient_name, program_name, financial_year, source, state, project_description')
      .or(orParts)
      .order('financial_year', { ascending: false })
      .limit(50);
    fundingRows = data || [];
  }

  const fundingTotal = fundingRows.reduce((s, r) => s + Number(r.amount_dollars || 0), 0);

  // Ministerial access check: name fuzzy match against civic_ministerial_diaries
  const orgNameLc = (org.name || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3)[0];
  let ministerMeetings = 0;
  if (orgNameLc) {
    const { count } = await sb
      .from('civic_ministerial_diaries')
      .select('id', { count: 'exact', head: true })
      .ilike('organisation', `%${orgNameLc}%`);
    ministerMeetings = count || 0;
  }

  return {
    org,
    classification,
    gs,
    programs: programs || [],
    fundingRows,
    fundingTotal,
    ministerMeetings,
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { 'org-slug': slug } = await params;
  const data = await fetchOrgPortrait(slug);
  if (!data || !data.classification) {
    return { title: 'Organisation not on Tier 1 list | JusticeHub' };
  }
  return {
    title: `${data.org.name} · Civic portrait | JusticeHub`,
    description: `A public portrait of ${data.org.name}, a confirmed Tier 1 youth justice frontline organisation.`,
  };
}

export default async function OrgCivicPortraitPage({ params }: PageProps) {
  const { 'org-slug': slug } = await params;
  const data = await fetchOrgPortrait(slug);
  if (!data) notFound();

  if (!data.classification) {
    return <NotOnTier1 orgName={data.org.name} />;
  }

  const { org, classification, gs, programs, fundingRows, fundingTotal, ministerMeetings } = data as any;
  const dollar = (n: number) => `$${Math.round(Number(n || 0)).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3 text-sm">
          <Link href="/intelligence/civic" className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900">
            <ChevronLeft className="w-3 h-3" /> Civic Intelligence
          </Link>
          <span className="text-stone-300">·</span>
          <span className="text-stone-700">Tier 1 portrait</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-stone-900 text-stone-50 px-6 py-14 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <TierBadge tier={1} />
            {classification.sector_category && (
              <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-widest bg-stone-800 text-stone-300 rounded border border-stone-700">
                {classification.sector_category}
              </span>
            )}
            {org.is_indigenous_org && (
              <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-widest bg-amber-900/40 text-amber-200 rounded border border-amber-700">
                Indigenous-controlled
              </span>
            )}
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400">{org.state}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{org.name}</h1>
          {(gs?.description || org.description) && (
            <p className="mt-4 max-w-2xl text-lg text-stone-300">{gs?.description || org.description}</p>
          )}
          {classification.llm_evidence_snippet && (
            <p className="mt-4 text-sm font-mono text-stone-500 max-w-2xl italic">
              Why Tier 1: "{classification.llm_evidence_snippet}"
            </p>
          )}
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Identity row */}
        <section>
          <SectionLabel>Identity</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {gs?.abn && <Fact label="ABN" value={gs.abn} icon={<Building2 className="w-3 h-3" />} />}
            {gs?.acn && <Fact label="ACN" value={gs.acn} />}
            {gs?.lga_name && <Fact label="LGA" value={gs.lga_name} icon={<MapPin className="w-3 h-3" />} />}
            {gs?.remoteness && <Fact label="Remoteness" value={gs.remoteness} />}
            {gs?.community_controlled_tier && <Fact label="Community controlled" value={gs.community_controlled_tier} />}
            {gs?.sector && <Fact label="Registry sector" value={gs.sector} />}
          </div>
          {(gs?.website || org.website) && (
            <a href={gs?.website || org.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-stone-700 underline underline-offset-2 hover:text-stone-900">
              {gs?.website || org.website} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </section>

        {/* Programs */}
        {programs.length > 0 && (
          <section>
            <SectionLabel><Users className="w-3 h-3 inline mr-1" /> Programs delivered ({programs.length})</SectionLabel>
            <ul className="mt-3 space-y-2">
              {programs.map((p: any) => (
                <li key={p.id} className="p-3 bg-white border border-stone-200 rounded-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-900">{p.name}</span>
                    {p.service_role && <span className="text-xs font-mono uppercase tracking-widest bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">{p.service_role}</span>}
                    {p.evidence_level && <span className="text-xs font-mono uppercase tracking-widest bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded">evidence: {p.evidence_level}</span>}
                  </div>
                  {(p.geography || p.target_cohort) && (
                    <p className="mt-1 text-xs text-stone-600">
                      {p.geography && <>📍 {p.geography} </>}
                      {p.target_cohort && <>· cohort: {p.target_cohort}</>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Funding history */}
        <section>
          <SectionLabel><DollarSign className="w-3 h-3 inline mr-1" /> Funding tracked</SectionLabel>
          <div className="mt-3 p-4 bg-white border border-stone-200 rounded-lg flex items-baseline justify-between">
            <span className="text-3xl font-bold text-stone-900">{dollar(fundingTotal)}</span>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500">{fundingRows.length} record{fundingRows.length === 1 ? '' : 's'} tracked</span>
          </div>
          {fundingRows.length > 0 && (
            <ul className="mt-3 space-y-1.5 max-h-96 overflow-y-auto">
              {fundingRows.slice(0, 20).map((f: any) => (
                <li key={f.id} className="p-2.5 bg-stone-100 border border-stone-200 rounded text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-stone-900">{dollar(f.amount_dollars)}</span>
                    <span className="text-xs font-mono text-stone-500">{f.financial_year || 'n/a'}</span>
                  </div>
                  {f.program_name && <p className="text-xs text-stone-700 mt-0.5">{f.program_name}</p>}
                  {f.source && <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">{f.source}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ministerial access */}
        <section>
          <SectionLabel><ScrollText className="w-3 h-3 inline mr-1" /> Ministerial access</SectionLabel>
          <div className="mt-3 p-4 bg-white border border-stone-200 rounded-lg">
            {ministerMeetings > 0 ? (
              <>
                <p className="text-2xl font-bold text-stone-900">{ministerMeetings} recorded meeting{ministerMeetings === 1 ? '' : 's'}</p>
                <p className="text-sm text-stone-600 mt-1">
                  Across QLD and NT ministerial diary registers, organisations matching this name appear in {ministerMeetings} disclosed meeting{ministerMeetings === 1 ? '' : 's'}.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-stone-900">No recorded meetings</p>
                <p className="text-sm text-stone-600 mt-1">
                  This organisation does not appear in any disclosed QLD or NT ministerial diary entry. That can mean the access happens through other channels, or it can mean no access at all. The methodology page explains why this register is incomplete.
                </p>
              </>
            )}
            <Link href="/intelligence/civic#access" className="mt-3 inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-stone-700 hover:text-stone-900 underline">
              Access chapter →
            </Link>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="pt-8 border-t border-stone-300">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Audit trail</p>
          <p className="text-sm text-stone-700">
            This portrait is built from <code>organizations</code>, <code>gs_entities</code>, <code>alma_interventions</code>, <code>justice_funding</code>, and <code>civic_ministerial_diaries</code>.
            Tier 1 status is recorded in <code>civic_org_classifications</code> and was confirmed on {classification.confirmed_at?.slice(0, 10)}.
            <Link href="/intelligence/civic/methodology#tier-1-curation" className="ml-2 underline">Methodology →</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-mono uppercase tracking-widest text-stone-500">{children}</h2>;
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="p-3 bg-white border border-stone-200 rounded">
      <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-0.5 inline-flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm font-mono text-stone-900">{value}</p>
    </div>
  );
}

function NotOnTier1({ orgName }: { orgName: string }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">v1 scope</p>
        <h1 className="text-3xl font-bold text-stone-900 mb-4">{orgName} is not on the v1 Tier 1 list</h1>
        <p className="text-stone-700 mb-6">
          v1 publishes civic portraits for confirmed Tier 1 frontline organisations in NT and QLD only. An organisation can be doing brilliant frontline work and not be on this list, either because the curation has not reached it yet, or because the available registry data was insufficient to confirm primary-frontline status.
        </p>
        <p className="text-stone-700 mb-6">
          The Tier 1 list expands in v2. You can write to <a href="mailto:civic@justicehub.com.au" className="underline">civic@justicehub.com.au</a> with a proposed addition.
        </p>
        <Link href="/intelligence/civic" className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 text-stone-50 rounded hover:bg-stone-700">
          <ChevronLeft className="w-4 h-4" /> Back to Civic Intelligence
        </Link>
      </div>
    </div>
  );
}
