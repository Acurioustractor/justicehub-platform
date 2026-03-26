import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  Building2, MapPin, DollarSign, TrendingUp, Shield,
  Users, BarChart3, CheckCircle, ArrowRight, ExternalLink,
  Target, Heart, Scale, AlertTriangle, Award
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const DETENTION_COST_PER_CHILD = 1_550_000;

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'bg-emerald-600',
  'Effective (strong evaluation, positive outcomes)': 'bg-green-600',
  'Promising (community-endorsed, emerging evidence)': 'bg-amber-500',
  'Indigenous-led (culturally grounded, community authority)': 'bg-purple-600',
  'Untested (theory/pilot stage)': 'bg-gray-400',
};

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

async function getOrgData(slug: string) {
  const supabase = createServiceClient();

  // Get org
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, type, description, city, state, website, is_indigenous_org, abn, acnc_data')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!org) return null;

  // Parallel fetches — cast to any to avoid typed client issues with ALMA tables
  const sb = supabase as any;
  const [interventions, funding, metrics, storytellers, photos] = await Promise.all([
    sb
      .from('alma_interventions')
      .select('id, name, description, type, evidence_level, cost_per_young_person, estimated_annual_capacity, verification_status, website, geography, years_operating, cultural_authority')
      .eq('operating_organization_id', org.id)
      .neq('verification_status', 'ai_generated')
      .order('evidence_level'),
    sb
      .from('justice_funding')
      .select('id, source, program_name, amount_dollars, financial_year, recipient_name')
      .eq('alma_organization_id', org.id)
      .order('amount_dollars', { ascending: false }),
    supabase
      .from('partner_impact_metrics')
      .select('*')
      .eq('organization_id', org.id)
      .order('is_featured', { ascending: false })
      .order('display_order'),
    supabase
      .from('partner_storytellers')
      .select('id, display_name, role_at_org, quote, avatar_url, is_featured')
      .eq('organization_id', org.id)
      .eq('is_featured', true)
      .limit(3),
    supabase
      .from('partner_photos')
      .select('id, photo_url, title, is_featured')
      .eq('organization_id', org.id)
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .limit(4),
  ]);

  return {
    org,
    interventions: interventions.data || [],
    funding: funding.data || [],
    metrics: metrics.data || [],
    storytellers: storytellers.data || [],
    photos: photos.data || [],
  };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getOrgData(params.slug);
  if (!data) return { title: 'Not Found' };
  return {
    title: `${data.org.name} — Funder Profile | JusticeHub`,
    description: `Evidence-based community programs by ${data.org.name}. ${data.interventions.length} verified interventions. See the data that makes the case.`,
    openGraph: {
      title: `${data.org.name} — Community Evidence Profile`,
      description: data.org.description?.slice(0, 160) || `${data.interventions.length} community programs making a measurable difference.`,
    },
  };
}

export default async function FunderOrgPitchPage({ params }: { params: { slug: string } }) {
  const data = await getOrgData(params.slug);
  if (!data) notFound();

  const { org, interventions, funding, metrics, storytellers, photos } = data;

  // Compute stats
  const totalFunding = funding.reduce((sum, f) => sum + (f.amount_dollars || 0), 0);
  const uniqueSources = [...new Set(funding.map(f => f.source))];
  const communityVerified = interventions.filter(i => i.verification_status === 'community_verified').length;
  const evidenceCounts = interventions.reduce((acc, i) => {
    const level = i.evidence_level || 'Untested (theory/pilot stage)';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const totalParticipants = interventions.reduce((sum, i) => sum + (i.estimated_annual_capacity || 0), 0);
  const avgCost = interventions.filter(i => i.cost_per_young_person).length > 0
    ? interventions.reduce((sum, i) => sum + (i.cost_per_young_person || 0), 0) / interventions.filter(i => i.cost_per_young_person).length
    : null;
  const detentionEquivalent = avgCost ? Math.round(DETENTION_COST_PER_CHILD / avgCost) : null;
  const heroPhoto = photos.find(p => p.is_featured) || photos[0];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header bar */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm">
        <Link href="/for-funders" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Back to Funder Hub</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/50">JUSTICEHUB FUNDER PROFILE</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-start gap-8">
            <div className="flex-1">
              {org.is_indigenous_org && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 mb-4">
                  <Shield className="w-3 h-3" /> Aboriginal Community Organisation
                </span>
              )}
              <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {org.name}
              </h1>
              {(org.city || org.state) && (
                <p className="flex items-center gap-2 text-white/60 mb-6">
                  <MapPin className="w-4 h-4" />
                  {[org.city, org.state].filter(Boolean).join(', ')}
                </p>
              )}
              {org.description && (
                <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
                  {org.description}
                </p>
              )}
            </div>
            {heroPhoto?.photo_url && (
              <div className="hidden lg:block w-64 h-48 rounded-lg overflow-hidden flex-shrink-0">
                <img src={heroPhoto.photo_url} alt={heroPhoto.title || org.name} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Numbers Strip */}
      <div className="bg-[#0A0A0A] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{interventions.length}</p>
            <p className="text-sm text-white/50 font-mono">Verified Programs</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatDollars(totalFunding)}</p>
            <p className="text-sm text-white/50 font-mono">Funding Tracked</p>
          </div>
          {totalParticipants > 0 && (
            <div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{totalParticipants.toLocaleString()}</p>
              <p className="text-sm text-white/50 font-mono">Participants / Year</p>
            </div>
          )}
          <div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{communityVerified}/{interventions.length}</p>
            <p className="text-sm text-white/50 font-mono">Community Verified</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* The Case for Investment */}
        {(avgCost || detentionEquivalent) && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The Case for Investment
            </h2>
            <div className="bg-white rounded-xl p-8 border border-gray-200 space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-sm font-mono text-gray-500 uppercase tracking-wider">Detention Cost</p>
                  <p className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    $1.55M <span className="text-base font-normal text-gray-500">/ child / year</span>
                  </p>
                  <p className="text-sm text-gray-500">84% reoffend within 12 months</p>
                </div>
                {avgCost && (
                  <div className="space-y-2">
                    <p className="text-sm font-mono text-gray-500 uppercase tracking-wider">{org.name} Average</p>
                    <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatDollars(avgCost)} <span className="text-base font-normal text-gray-500">/ participant / year</span>
                    </p>
                    {detentionEquivalent && (
                      <p className="text-sm text-[#059669]">
                        <strong>{detentionEquivalent}x</strong> more people supported per dollar than detention
                      </p>
                    )}
                  </div>
                )}
              </div>
              {detentionEquivalent && detentionEquivalent > 5 && (
                <div className="bg-[#059669]/5 rounded-lg p-4 border border-[#059669]/20">
                  <p className="text-sm text-[#0A0A0A]">
                    <strong>For the cost of detaining one child for one year,</strong> {org.name} could support{' '}
                    <strong className="text-[#059669]">{detentionEquivalent} people</strong> through community programs — with evidence of better outcomes.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Evidence Profile */}
        {interventions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Evidence Profile
            </h2>

            {/* Evidence level bar */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-4">
                {Object.entries(evidenceCounts).map(([level, count]) => (
                  <div
                    key={level}
                    className={`${EVIDENCE_COLORS[level] || 'bg-gray-400'} relative group`}
                    style={{ flex: count }}
                    title={`${EVIDENCE_SHORT[level] || level}: ${count}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {Object.entries(evidenceCounts).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-2 text-sm">
                    <span className={`w-3 h-3 rounded-full ${EVIDENCE_COLORS[level] || 'bg-gray-400'}`} />
                    <span className="text-gray-600">{EVIDENCE_SHORT[level] || level} ({count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interventions list */}
            <div className="space-y-3">
              {interventions.map(intervention => (
                <div key={intervention.id} className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-[#0A0A0A]">{intervention.name}</h3>
                        {intervention.verification_status === 'community_verified' && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#059669]">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      {intervention.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{intervention.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {intervention.type && (
                          <span className="text-xs font-mono text-gray-400">{intervention.type}</span>
                        )}
                        {intervention.geography?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" /> {intervention.geography.join(', ')}
                          </span>
                        )}
                        {intervention.years_operating && (
                          <span className="text-xs font-mono text-gray-400">{intervention.years_operating}+ years</span>
                        )}
                        {intervention.cost_per_young_person && (
                          <span className="text-xs font-mono text-gray-400">
                            {formatDollars(intervention.cost_per_young_person)}/yr
                          </span>
                        )}
                        {intervention.estimated_annual_capacity && (
                          <span className="text-xs font-mono text-gray-400">
                            {intervention.estimated_annual_capacity} participants/yr
                          </span>
                        )}
                        {intervention.cultural_authority && (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-500">
                            <Shield className="w-3 h-3" /> {intervention.cultural_authority}
                          </span>
                        )}
                      </div>
                      {intervention.website && (
                        <a href={intervention.website.startsWith('http') ? intervention.website : `https://${intervention.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#059669] hover:underline mt-2">
                          <ExternalLink className="w-3 h-3" /> {intervention.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap ${EVIDENCE_COLORS[intervention.evidence_level || ''] || 'bg-gray-400'}`}>
                      {EVIDENCE_SHORT[intervention.evidence_level || ''] || 'Untested'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Funding Sources */}
        {funding.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Funding Sources
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-mono text-gray-500 uppercase">Source</th>
                    <th className="text-left px-6 py-3 text-xs font-mono text-gray-500 uppercase">Program</th>
                    <th className="text-right px-6 py-3 text-xs font-mono text-gray-500 uppercase">Amount</th>
                    <th className="text-right px-6 py-3 text-xs font-mono text-gray-500 uppercase">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {funding.slice(0, 15).map(f => (
                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-700">{f.recipient_name || f.source}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{f.program_name || '—'}</td>
                      <td className="px-6 py-3 text-sm text-right font-mono text-[#0A0A0A]">
                        {f.amount_dollars ? formatDollars(f.amount_dollars) : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-gray-400 font-mono">{f.financial_year || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {funding.length > 15 && (
                <div className="px-6 py-3 text-sm text-gray-400 text-center border-t border-gray-100">
                  + {funding.length - 15} more funding records
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
              <span className="font-mono">Total tracked: <strong className="text-[#0A0A0A]">{formatDollars(totalFunding)}</strong></span>
              <span className="font-mono">Sources: <strong className="text-[#0A0A0A]">{uniqueSources.length}</strong></span>
            </div>
          </section>
        )}

        {/* Impact Metrics */}
        {metrics.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Impact
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {metrics.map(m => (
                <div key={m.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <p className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {m.metric_value}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{m.metric_name}</p>
                  {m.metric_context && (
                    <p className="text-xs text-gray-400 mt-1">{m.metric_context}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Community Voices */}
        {storytellers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Community Voices
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {storytellers.map(s => (
                <div key={s.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  {s.quote && (
                    <blockquote className="text-sm text-gray-700 italic mb-4 line-clamp-4">
                      &ldquo;{s.quote}&rdquo;
                    </blockquote>
                  )}
                  <div className="flex items-center gap-3">
                    {s.avatar_url && (
                      <img src={s.avatar_url} alt={s.display_name} className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#0A0A0A]">{s.display_name}</p>
                      {s.role_at_org && <p className="text-xs text-gray-400">{s.role_at_org}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-[#0A0A0A] rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Interested in supporting {org.name}?
          </h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            JusticeHub connects funders with community-controlled organisations delivering evidence-based alternatives to detention.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={`/organizations/${org.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Full Profile <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-funders/calculator"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              <DollarSign className="w-4 h-4" /> Impact Calculator
            </Link>
          </div>
        </section>

        {/* Source attribution */}
        <footer className="text-center text-xs text-gray-400 font-mono pb-8">
          <p>Data sourced from ALMA Network, Australian Government, ACNC, ORIC, and community-verified records.</p>
          <p className="mt-1">
            Generated by <Link href="/" className="underline hover:text-gray-600">JusticeHub</Link> — Australia&apos;s community justice evidence platform.
          </p>
        </footer>
      </div>
    </div>
  );
}
