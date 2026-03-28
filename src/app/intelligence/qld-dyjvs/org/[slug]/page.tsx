import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { ArrowRight } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import { Users } from 'lucide-react';
import { Building2 } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Shield } from 'lucide-react';
import { Globe } from 'lucide-react';
import { formatDollars } from '@/lib/intelligence/regional-computations';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createServiceClient();
  const { data: org } = await (supabase as any).from('organizations')
    .select('name')
    .eq('slug', params.slug)
    .single();

  const name = org?.name || params.slug;
  return {
    title: `${name} — DYJVS Contract Profile | JusticeHub`,
    description: `DYJVS contract profile for ${name}: funding, programs, board members, and regional context.`,
  };
}

/* ── Types ─────────────────────────────────────────────────── */

const CONTROL_LABELS: Record<string, string> = {
  community_controlled: 'Community Controlled',
  community_adjacent: 'Community Adjacent',
  intermediary: 'Intermediary',
  government: 'Government',
  university: 'University',
  peak_body: 'Peak Body',
};

const CONTROL_COLORS: Record<string, string> = {
  community_controlled: 'bg-emerald-100 text-emerald-800',
  community_adjacent: 'bg-teal-100 text-teal-800',
  intermediary: 'bg-amber-100 text-amber-800',
  government: 'bg-slate-100 text-slate-800',
  university: 'bg-blue-100 text-blue-800',
  peak_body: 'bg-indigo-100 text-indigo-800',
};

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven': 'bg-emerald-100 text-emerald-800',
  'Effective': 'bg-green-100 text-green-800',
  'Promising': 'bg-amber-100 text-amber-800',
  'Indigenous-led': 'bg-purple-100 text-purple-800',
  'Untested': 'bg-gray-100 text-gray-700',
};

/* ── Data fetching ─────────────────────────────────────────── */

async function getOrgProfile(slug: string) {
  const supabase = createServiceClient();
  const sb = supabase as any;

  // Get org
  const { data: org } = await sb.from('organizations')
    .select('id, name, slug, state, city, abn, website, is_indigenous_org, control_type, acnc_data')
    .eq('slug', slug)
    .single();

  if (!org) return null;

  // Parallel queries — fetch by org ID, then name fallback separately
  const [
    dyjvsRes,
    allFundingRes,
    programsRes,
    boardRes,
    mediaRes,
  ] = await Promise.all([
    // DYJVS contracts by org ID
    sb.from('justice_funding')
      .select('id, amount_dollars, recipient_name, source_statement_id, financial_year, project_description')
      .eq('source', 'dyjvs-contracts')
      .eq('alma_organization_id', org.id)
      .order('amount_dollars', { ascending: false }),

    // ALL funding by org ID
    sb.from('justice_funding')
      .select('id, amount_dollars, source, financial_year, project_description, recipient_name')
      .eq('alma_organization_id', org.id)
      .order('amount_dollars', { ascending: false })
      .limit(200),

    // Programs run by this org
    sb.from('alma_interventions')
      .select('id, name, evidence_level, cost_per_young_person, geography, description, type, years_operating')
      .eq('operating_organization_id', org.id)
      .neq('verification_status', 'ai_generated')
      .order('name'),

    // Board members via ABN
    org.abn
      ? sb.from('person_roles')
          .select('person_name, role_type, appointment_date, cessation_date')
          .eq('company_abn', org.abn)
          .order('appointment_date', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),

    // Media mentions
    sb.from('alma_media_articles')
      .select('id, headline, source_name, published_date, url, sentiment')
      .or(`headline.ilike.%${org.name.split(' ').slice(0, 3).join(' ')}%`)
      .order('published_date', { ascending: false })
      .limit(20),
  ]);

  const dyjvsContracts = dyjvsRes.data || [];
  const allFunding = allFundingRes.data || [];

  // Name fallback: if ID query returned nothing, try by name
  if (dyjvsContracts.length === 0 && org.name) {
    const { data: nameFallback } = await sb.from('justice_funding')
      .select('id, amount_dollars, recipient_name, source_statement_id, financial_year, project_description')
      .eq('source', 'dyjvs-contracts')
      .ilike('recipient_name', `%${org.name}%`);
    if (nameFallback) dyjvsContracts.push(...nameFallback);
  }
  if (allFunding.length === 0 && org.name) {
    const { data: nameFallback } = await sb.from('justice_funding')
      .select('id, amount_dollars, source, financial_year, project_description, recipient_name')
      .ilike('recipient_name', `%${org.name}%`)
      .limit(200);
    if (nameFallback) allFunding.push(...nameFallback);
  }
  const programs = programsRes.data || [];
  const boardMembers = boardRes.data || [];
  const mediaArticles = mediaRes.data || [];

  // Aggregate funding by source
  const fundingBySource: Record<string, { total: number; count: number }> = {};
  for (const f of allFunding) {
    const src = f.source || 'unknown';
    if (!fundingBySource[src]) fundingBySource[src] = { total: 0, count: 0 };
    fundingBySource[src].total += f.amount_dollars || 0;
    fundingBySource[src].count++;
  }

  const totalDyjvs = dyjvsContracts.reduce((s: number, c: any) => s + (c.amount_dollars || 0), 0);
  const totalAllFunding = allFunding.reduce((s: number, c: any) => s + (c.amount_dollars || 0), 0);

  // Find other orgs in the same region doing YJ work
  const regionOrgs: any[] = [];
  if (org.state) {
    const { data: nearbyOrgs } = await sb.from('organizations')
      .select('id, name, slug, is_indigenous_org, control_type, city')
      .eq('state', org.state)
      .eq('is_active', true)
      .neq('id', org.id)
      .or('control_type.eq.community_controlled,control_type.eq.community_adjacent')
      .limit(500);

    // Filter to orgs that have programs
    if (nearbyOrgs && nearbyOrgs.length > 0) {
      const nearbyIds = nearbyOrgs.map((o: any) => o.id);
      // Get orgs that have programs (batch check)
      const { data: orgsWithPrograms } = await sb.from('alma_interventions')
        .select('operating_organization_id')
        .in('operating_organization_id', nearbyIds.slice(0, 200))
        .neq('verification_status', 'ai_generated');

      const orgIdsWithPrograms = new Set((orgsWithPrograms || []).map((p: any) => p.operating_organization_id));

      // Also check for DYJVS funding
      const { data: orgsWithDyjvs } = await sb.from('justice_funding')
        .select('alma_organization_id')
        .eq('source', 'dyjvs-contracts')
        .in('alma_organization_id', nearbyIds.slice(0, 200));

      const orgIdsWithDyjvs = new Set((orgsWithDyjvs || []).map((f: any) => f.alma_organization_id));

      for (const o of nearbyOrgs) {
        if (orgIdsWithPrograms.has(o.id) || orgIdsWithDyjvs.has(o.id)) {
          regionOrgs.push({
            ...o,
            hasPrograms: orgIdsWithPrograms.has(o.id),
            hasDyjvs: orgIdsWithDyjvs.has(o.id),
          });
        }
      }
      regionOrgs.sort((a: any, b: any) => (b.is_indigenous_org ? 1 : 0) - (a.is_indigenous_org ? 1 : 0));
    }
  }

  // Deduplicate board members by name
  const seenNames = new Set<string>();
  const uniqueBoard = boardMembers.filter((m: any) => {
    const key = m.person_name?.toLowerCase();
    if (!key || seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  return {
    org,
    dyjvsContracts,
    allFunding,
    fundingBySource,
    programs,
    boardMembers: uniqueBoard,
    mediaArticles,
    totalDyjvs,
    totalAllFunding,
    regionOrgs: regionOrgs.slice(0, 30),
  };
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function OrgProfilePage({ params }: { params: { slug: string } }) {
  const data = await getOrgProfile(params.slug);
  if (!data) notFound();

  const { org, dyjvsContracts, fundingBySource, programs, boardMembers, mediaArticles, totalDyjvs, totalAllFunding, regionOrgs } = data;

  const evidenceSummary: Record<string, number> = {};
  for (const p of programs) {
    const short = EVIDENCE_SHORT[p.evidence_level] || 'Untested';
    evidenceSummary[short] = (evidenceSummary[short] || 0) + 1;
  }

  const acnc = org.acnc_data || {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Nav */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm print:hidden">
        <Link href="/intelligence/qld-dyjvs" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>QLD Sector Report</span>
        </Link>
        <span className="font-mono text-xs text-white/50">ORG PROFILE</span>
      </div>

      {/* Hero */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${CONTROL_COLORS[org.control_type] || 'bg-gray-100 text-gray-700'}`}>
              {CONTROL_LABELS[org.control_type] || org.control_type || 'Unknown'}
            </span>
            {org.is_indigenous_org && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Indigenous Organisation
              </span>
            )}
            {org.state && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
                {org.city ? `${org.city}, ` : ''}{org.state}
              </span>
            )}
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {org.name}
          </h1>
          {org.abn && <p className="text-xs font-mono text-white/30">ABN {org.abn}</p>}
          {org.website && (
            <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white mt-2">
              <Globe className="w-3.5 h-3.5" /> {org.website}
            </a>
          )}

          {/* Stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold font-mono text-white">{formatDollars(totalDyjvs)}</div>
              <div className="text-xs text-white/50 font-mono uppercase mt-1">DYJVS contracts</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{formatDollars(totalAllFunding)}</div>
              <div className="text-xs text-white/50 font-mono uppercase mt-1">All funding</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{programs.length}</div>
              <div className="text-xs text-white/50 font-mono uppercase mt-1">Programs mapped</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">{boardMembers.length}</div>
              <div className="text-xs text-white/50 font-mono uppercase mt-1">Board/leadership</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-12">

        {/* ── DYJVS Contracts ── */}
        {dyjvsContracts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[#0A0A0A]/40" />
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
                DYJVS Contracts ({dyjvsContracts.length})
              </h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Description</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Amount</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {dyjvsContracts.map((c: any, i: number) => (
                    <tr key={c.id} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3 text-[#0A0A0A]">{c.project_description || c.recipient_name || 'DYJVS Contract'}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{formatDollars(c.amount_dollars)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[#0A0A0A]/50">{c.financial_year || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0A0A0A] text-white">
                    <td className="px-4 py-3 font-medium">Total DYJVS</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold">{formatDollars(totalDyjvs)}</td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* ── All Funding by Source ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#0A0A0A]/40" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
              All Government Funding
            </h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0A0A0A] text-white">
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase">Source</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase">Total</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase">Records</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fundingBySource)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([source, data], i) => (
                    <tr key={source} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3 text-[#0A0A0A]">
                        <span className={source === 'dyjvs-contracts' ? 'font-medium text-[#DC2626]' : ''}>
                          {source.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{formatDollars(data.total)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{data.count}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[#0A0A0A]/50">
                        {totalAllFunding > 0 ? `${Math.round((data.total / totalAllFunding) * 100)}%` : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#0A0A0A] text-white">
                  <td className="px-4 py-3 font-medium">Total All Sources</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold">{formatDollars(totalAllFunding)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {Object.values(fundingBySource).reduce((s, d) => s + d.count, 0)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
          {totalDyjvs > 0 && totalAllFunding > totalDyjvs && (
            <p className="text-xs text-[#0A0A0A]/50 mt-3">
              DYJVS contracts represent <strong>{Math.round((totalDyjvs / totalAllFunding) * 100)}%</strong> of
              this organisation&apos;s total tracked government funding.
            </p>
          )}
        </section>

        {/* ── Programs ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#0A0A0A]/40" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
              Programs ({programs.length})
            </h2>
          </div>
          {programs.length === 0 ? (
            <div className="bg-[#DC2626]/5 border-2 border-[#DC2626]/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    No programs mapped
                  </p>
                  <p className="text-sm text-[#0A0A0A]/70 mt-1">
                    This organisation receives {formatDollars(totalDyjvs)} in DYJVS contracts but has no
                    programs mapped in JusticeHub. This is a data gap — it means we cannot assess what services
                    this funding delivers or whether outcomes are being measured.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Evidence summary */}
              <div className="flex gap-2 mb-4">
                {Object.entries(evidenceSummary)
                  .sort(([a], [b]) => {
                    const order = ['Proven', 'Effective', 'Promising', 'Indigenous-led', 'Untested'];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .map(([level, count]) => (
                    <span key={level} className={`px-2.5 py-1 rounded-full text-xs font-medium ${EVIDENCE_COLORS[level] || 'bg-gray-100 text-gray-700'}`}>
                      {count} {level}
                    </span>
                  ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {programs.map((p: any) => {
                  const shortEvidence = EVIDENCE_SHORT[p.evidence_level] || 'Untested';
                  return (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {p.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${EVIDENCE_COLORS[shortEvidence] || 'bg-gray-100 text-gray-700'}`}>
                          {shortEvidence}
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-xs text-[#0A0A0A]/60 leading-relaxed mb-2 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#0A0A0A]/40">
                        {p.geography && Array.isArray(p.geography) && p.geography.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {p.geography.join(', ')}
                          </span>
                        )}
                        {p.cost_per_young_person && (
                          <span>${p.cost_per_young_person.toLocaleString()}/yp</span>
                        )}
                        {p.years_operating && (
                          <span>{p.years_operating}yr</span>
                        )}
                        {p.type && <span>{p.type}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ── Board & Leadership ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#0A0A0A]/40" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
              Board &amp; Leadership ({boardMembers.length})
            </h2>
          </div>
          {boardMembers.length === 0 ? (
            <p className="text-sm text-[#0A0A0A]/50">No board data available{org.abn ? '' : ' (no ABN on file)'}.</p>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Role</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Since</th>
                  </tr>
                </thead>
                <tbody>
                  {boardMembers.slice(0, 30).map((m: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium text-[#0A0A0A]">{m.person_name}</td>
                      <td className="px-4 py-3 text-[#0A0A0A]/60">{m.role_type || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[#0A0A0A]/50">
                        {m.appointment_date ? new Date(m.appointment_date).getFullYear() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {boardMembers.length > 30 && (
                <p className="px-4 py-2 text-xs text-[#0A0A0A]/40 bg-[#F5F0E8]/30">
                  Showing 30 of {boardMembers.length}. Source: ASIC/ACNC.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Media Mentions ── */}
        {mediaArticles.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5 text-[#0A0A0A]/40" />
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
                Media Mentions ({mediaArticles.length})
              </h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm divide-y divide-[#F5F0E8]">
              {mediaArticles.slice(0, 10).map((a: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="font-mono text-[10px] text-[#0A0A0A]/30 w-16 flex-shrink-0 pt-0.5">
                    {a.published_date ? new Date(a.published_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : ''}
                  </span>
                  <div className="flex-1 min-w-0">
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#0A0A0A] hover:text-[#059669] transition-colors line-clamp-1">
                        {a.headline}
                      </a>
                    ) : (
                      <span className="text-xs text-[#0A0A0A] line-clamp-1">{a.headline}</span>
                    )}
                    <span className="text-[10px] text-[#0A0A0A]/30 ml-1">{a.source_name}</span>
                  </div>
                  {a.sentiment && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                      a.sentiment === 'negative' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                      a.sentiment === 'positive' ? 'bg-[#059669]/10 text-[#059669]' :
                      'bg-[#0A0A0A]/5 text-[#0A0A0A]/40'
                    }`}>
                      {a.sentiment}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Accountability Assessment ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#0A0A0A]/40" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
              Accountability Assessment
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Programs vs Funding */}
            <div className={`p-5 rounded-xl border-2 ${
              programs.length === 0
                ? 'border-[#DC2626]/20 bg-[#DC2626]/5'
                : 'border-[#059669]/20 bg-[#059669]/5'
            }`}>
              <p className="font-bold text-sm text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {programs.length === 0
                  ? `${formatDollars(totalDyjvs)} DYJVS funding, 0 programs mapped`
                  : `${programs.length} program${programs.length > 1 ? 's' : ''} for ${formatDollars(totalDyjvs)} DYJVS`
                }
              </p>
              <p className="text-xs text-[#0A0A0A]/60 mt-1">
                {programs.length === 0
                  ? 'Cannot assess what services this funding delivers.'
                  : `${formatDollars(Math.round(totalDyjvs / programs.length))} per program on average.`
                }
              </p>
            </div>

            {/* Evidence quality */}
            <div className={`p-5 rounded-xl border-2 ${
              evidenceSummary['Untested'] === programs.length && programs.length > 0
                ? 'border-[#DC2626]/20 bg-[#DC2626]/5'
                : programs.length === 0
                  ? 'border-[#0A0A0A]/10 bg-[#0A0A0A]/5'
                  : 'border-[#059669]/20 bg-[#059669]/5'
            }`}>
              <p className="font-bold text-sm text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {programs.length === 0
                  ? 'No evidence assessment possible'
                  : evidenceSummary['Untested'] === programs.length
                    ? `All ${programs.length} programs untested`
                    : `${programs.length - (evidenceSummary['Untested'] || 0)} of ${programs.length} have some evidence`
                }
              </p>
              <p className="text-xs text-[#0A0A0A]/60 mt-1">
                {programs.length === 0
                  ? 'No programs to evaluate.'
                  : evidenceSummary['Effective']
                    ? `${evidenceSummary['Effective']} with strong evaluation evidence.`
                    : evidenceSummary['Promising']
                      ? `${evidenceSummary['Promising']} at Promising level — community-endorsed but not independently evaluated.`
                      : 'No independently evaluated programs.'
                }
              </p>
            </div>

            {/* Control type context */}
            <div className="p-5 rounded-xl border-2 border-[#0A0A0A]/10 bg-white">
              <p className="font-bold text-sm text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {CONTROL_LABELS[org.control_type] || 'Unclassified'}
              </p>
              <p className="text-xs text-[#0A0A0A]/60 mt-1">
                {org.control_type === 'intermediary'
                  ? 'National intermediary — operates across multiple regions. Overhead rates and community delivery percentages are not publicly disclosed.'
                  : org.control_type === 'community_controlled'
                    ? 'Community-controlled organisation — governed by the community it serves.'
                    : org.control_type === 'community_adjacent'
                      ? 'Community-adjacent — locally based but not community-governed.'
                      : `Classified as ${org.control_type || 'unknown'}.`
                }
              </p>
            </div>

            {/* ACNC data */}
            {acnc.charity_size && (
              <div className="p-5 rounded-xl border-2 border-[#0A0A0A]/10 bg-white">
                <p className="font-bold text-sm text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  ACNC: {acnc.charity_size}
                </p>
                <p className="text-xs text-[#0A0A0A]/60 mt-1">
                  {acnc.charity_type || ''}{acnc.activities ? ` — ${acnc.activities}` : ''}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Regional Context ── */}
        {regionOrgs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-[#0A0A0A]/40" />
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
                Other YJ Organisations in {org.state} ({regionOrgs.length})
              </h2>
            </div>
            <p className="text-xs text-[#0A0A0A]/50 mb-4">
              Community-controlled and community-adjacent organisations in {org.state} that also run youth justice programs or receive DYJVS funding.
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              {regionOrgs.map((ro: any) => (
                <Link
                  key={ro.id}
                  href={`/intelligence/qld-dyjvs/org/${ro.slug || ro.id}`}
                  className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {ro.is_indigenous_org && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" title="Indigenous org" />
                    )}
                    <p className="text-sm font-medium text-[#0A0A0A] group-hover:text-[#059669] transition-colors line-clamp-1">
                      {ro.name}
                    </p>
                  </div>
                  <div className="flex gap-2 text-[10px] font-mono text-[#0A0A0A]/40">
                    <span className={`px-1.5 py-0.5 rounded ${CONTROL_COLORS[ro.control_type] || 'bg-gray-100 text-gray-700'}`}>
                      {CONTROL_LABELS[ro.control_type]?.split(' ')[0] || '?'}
                    </span>
                    {ro.city && <span>{ro.city}</span>}
                    {ro.hasDyjvs && <span className="text-[#DC2626]">DYJVS</span>}
                    {ro.hasPrograms && <span>Programs</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <div className="pb-8">
          <div className="bg-[#0A0A0A] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-white/30 mb-1">DATA SOURCES</p>
                <p className="text-xs text-white/50">
                  QLD Contract Disclosure, ACNC, ASIC, JusticeHub program mapping.
                  Board data via ABN linkage. Funding from all 35 tracked sources.
                </p>
              </div>
              <Link
                href="/intelligence/qld-dyjvs"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors flex-shrink-0"
              >
                Back to Report <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
