import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Tag,
  Users,
  Briefcase,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusClass(status: string) {
  switch (status) {
    case 'open':
      return 'bg-emerald-100 text-emerald-800 border-emerald-700';
    case 'closing_soon':
      return 'bg-orange-100 text-orange-800 border-orange-700';
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 border-blue-700';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-700';
    case 'recurring':
      return 'bg-purple-100 text-purple-800 border-purple-700';
    case 'archived':
      return 'bg-gray-100 text-gray-500 border-gray-400';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-700';
  }
}

async function getOpportunity(id: string) {
  if (!UUID_RE.test(id)) return null;
  const supabase = createServiceClient();
  const { data } = await (supabase as any)
    .from('alma_funding_opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data || null;
}

async function getRelatedApplications(opportunityId: string) {
  const supabase = createServiceClient();
  const { data } = await (supabase as any)
    .from('alma_funding_applications')
    .select('id, organization_id, status, amount_requested, amount_awarded, submitted_at, updated_at')
    .eq('opportunity_id', opportunityId)
    .order('updated_at', { ascending: false })
    .limit(8);
  if (!data || data.length === 0) return [];
  const orgIds = Array.from(new Set(data.map((a: any) => a.organization_id).filter(Boolean)));
  const orgs: Record<string, any> = {};
  if (orgIds.length > 0) {
    const { data: orgRows } = await (supabase as any)
      .from('organizations')
      .select('id, name, slug')
      .in('id', orgIds);
    for (const o of orgRows || []) {
      orgs[o.id] = o;
    }
  }
  return data.map((a: any) => ({ ...a, organization: orgs[a.organization_id] || null }));
}

async function getMatchedAnchors(opportunity: any) {
  const supabase = createServiceClient();
  const { data } = await (supabase as any)
    .from('organizations')
    .select('id, name, slug, state, is_indigenous_org, verification_status')
    .in('slug', ['oonchiumpa', 'palm-island-community-company', 'bg-fit', 'mmeic'])
    .eq('verification_status', 'verified');
  if (!data) return [];
  const oppJurisdictions: string[] = Array.isArray(opportunity?.jurisdictions) ? opportunity.jurisdictions : [];
  const isNational = Boolean(opportunity?.is_national);
  return data.map((org: any) => {
    const jurisdictionMatch = isNational || oppJurisdictions.includes(org.state);
    const indigenousMatch = Boolean(org.is_indigenous_org);
    let score = 50;
    if (jurisdictionMatch) score += 30;
    if (indigenousMatch) score += 20;
    return { ...org, score, jurisdictionMatch, indigenousMatch };
  }).sort((a: any, b: any) => b.score - a.score);
}

export default async function FundingOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) notFound();

  const [applications, anchors] = await Promise.all([
    getRelatedApplications(id),
    getMatchedAnchors(opportunity),
  ]);

  const minAmount = formatCurrency(Number(opportunity.min_grant_amount));
  const maxAmount = formatCurrency(Number(opportunity.max_grant_amount));
  const totalPool = formatCurrency(Number(opportunity.total_pool_amount));
  const opensAt = formatDate(opportunity.opens_at);
  const deadline = formatDate(opportunity.deadline);
  const decisionDate = formatDate(opportunity.decision_date);
  const daysToDeadline = daysUntil(opportunity.deadline);

  const focusAreas: string[] = Array.isArray(opportunity.focus_areas) ? opportunity.focus_areas : [];
  const keywords: string[] = Array.isArray(opportunity.keywords) ? opportunity.keywords : [];
  const jurisdictions: string[] = Array.isArray(opportunity.jurisdictions) ? opportunity.jurisdictions : [];
  const regions: string[] = Array.isArray(opportunity.regions) ? opportunity.regions : [];
  const eligibleOrgTypes: string[] = Array.isArray(opportunity.eligible_org_types) ? opportunity.eligible_org_types : [];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        <section className="py-10 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/admin/funding"
              className="inline-flex items-center gap-2 px-3 py-2 mb-6 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Funding Pipeline
            </Link>

            <div className="flex flex-wrap items-start gap-4 mb-4">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 border-black bg-gray-100">
                {opportunity.source_type}
              </span>
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 ${statusClass(opportunity.status)}`}>
                {opportunity.status.replace('_', ' ')}
              </span>
              {opportunity.category && (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 border-black bg-emerald-50 text-emerald-800">
                  {String(opportunity.category).replace('_', ' ')}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">{opportunity.name}</h1>
            <div className="flex items-center gap-2 text-lg text-gray-700 mb-6">
              <Building2 className="w-5 h-5" />
              <span className="font-bold">{opportunity.funder_name}</span>
            </div>

            {opportunity.description && (
              <p className="text-lg text-gray-700 max-w-3xl mb-6 leading-relaxed">{opportunity.description}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {opportunity.application_url && (
                <a
                  href={opportunity.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors border-2 border-black"
                >
                  Open at funder
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {opportunity.guidelines_url && (
                <a
                  href={opportunity.guidelines_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white border-2 border-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Guidelines
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {opportunity.source_url && (
                <a
                  href={opportunity.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white border-2 border-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Source
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Key facts grid */}
        <section className="py-10 bg-gray-50 border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border-2 border-black p-5">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-gray-600">
                  <DollarSign className="w-4 h-4" /> Grant amount
                </div>
                <div className="text-2xl font-black">
                  {minAmount && maxAmount ? `${minAmount} – ${maxAmount}` : maxAmount || minAmount || '—'}
                </div>
                {totalPool && (
                  <div className="text-xs text-gray-600 mt-1">Total pool: {totalPool}</div>
                )}
                {opportunity.funding_duration && (
                  <div className="text-xs text-gray-600 mt-1">{opportunity.funding_duration.replace('_', ' ')}</div>
                )}
              </div>

              <div className="bg-white border-2 border-black p-5">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-gray-600">
                  <Calendar className="w-4 h-4" /> Deadline
                </div>
                <div className="text-2xl font-black">
                  {deadline || (opportunity.status === 'recurring' ? 'Rolling' : '—')}
                </div>
                {typeof daysToDeadline === 'number' && (
                  <div className={`text-xs mt-1 font-bold ${
                    daysToDeadline < 0 ? 'text-gray-500'
                    : daysToDeadline < 14 ? 'text-red-700'
                    : daysToDeadline < 60 ? 'text-orange-700'
                    : 'text-gray-600'
                  }`}>
                    {daysToDeadline < 0
                      ? `Closed ${Math.abs(daysToDeadline)} days ago`
                      : `${daysToDeadline} days to deadline`}
                  </div>
                )}
                {opensAt && (
                  <div className="text-xs text-gray-600 mt-1">Opens {opensAt}</div>
                )}
              </div>

              <div className="bg-white border-2 border-black p-5">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-gray-600">
                  <MapPin className="w-4 h-4" /> Reach
                </div>
                <div className="text-2xl font-black">
                  {opportunity.is_national ? 'National' : (jurisdictions[0] || '—')}
                </div>
                {jurisdictions.length > 0 && !opportunity.is_national && (
                  <div className="text-xs text-gray-600 mt-1">{jurisdictions.join(' · ')}</div>
                )}
                {regions.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">{regions.slice(0, 3).join(' · ')}</div>
                )}
              </div>

              <div className="bg-white border-2 border-black p-5">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-gray-600">
                  <CheckCircle className="w-4 h-4" /> Decision date
                </div>
                <div className="text-2xl font-black">{decisionDate || '—'}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {opportunity.requires_deductible_gift_recipient ? 'DGR required · ' : ''}
                  {opportunity.requires_abn ? 'ABN required' : 'ABN not required'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Anchor matches */}
        <section className="py-10 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Anchor community fit
            </h2>
            <p className="text-gray-700 mb-6 max-w-3xl">
              Quick fit check across the four anchor communities. Score is rough: 50 base, +30 for jurisdiction match, +20 if Indigenous-led.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {anchors.map((anchor: any) => (
                <Link
                  key={anchor.id}
                  href={`/organizations/${anchor.slug}`}
                  className="block bg-white border-2 border-black p-5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-black text-lg uppercase tracking-tighter group-hover:underline">{anchor.name}</h3>
                    <span className={`px-2 py-1 text-xs font-bold border ${
                      anchor.score >= 90 ? 'bg-emerald-100 text-emerald-800 border-emerald-700'
                      : anchor.score >= 70 ? 'bg-blue-100 text-blue-800 border-blue-700'
                      : 'bg-gray-100 text-gray-700 border-gray-700'
                    }`}>{anchor.score}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">{anchor.state || '—'}</div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li className="flex items-center gap-1">
                      <span className={anchor.jurisdictionMatch ? 'text-emerald-700' : 'text-gray-400'}>●</span>
                      {anchor.jurisdictionMatch ? 'Jurisdiction matches' : 'Outside jurisdiction'}
                    </li>
                    <li className="flex items-center gap-1">
                      <span className={anchor.indigenousMatch ? 'text-emerald-700' : 'text-gray-400'}>●</span>
                      {anchor.indigenousMatch ? 'Indigenous-led' : 'Non-Indigenous-led'}
                    </li>
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Two-column: focus areas + eligibility */}
        <section className="py-10 bg-gray-50 border-b-2 border-black">
          <div className="container-justice grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-black text-xl uppercase tracking-tighter mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-700" />
                Focus and keywords
              </h3>
              {focusAreas.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Focus areas</div>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((f) => (
                      <span key={f} className="px-2 py-1 text-xs font-bold bg-emerald-50 border border-emerald-700 text-emerald-800">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {keywords.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Keywords</div>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((k) => (
                      <span key={k} className="px-2 py-1 text-xs bg-gray-100 border border-gray-400 text-gray-700">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {focusAreas.length === 0 && keywords.length === 0 && (
                <div className="text-sm text-gray-500">No focus areas or keywords on record.</div>
              )}
            </div>

            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-black text-xl uppercase tracking-tighter mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                Eligibility
              </h3>
              {eligibleOrgTypes.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Eligible org types</div>
                  <ul className="space-y-1">
                    {eligibleOrgTypes.map((t) => (
                      <li key={t} className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        {t.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {opportunity.eligibility_criteria && Object.keys(opportunity.eligibility_criteria).length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Criteria</div>
                  <ul className="space-y-1">
                    {Object.entries(opportunity.eligibility_criteria as Record<string, any>).map(([k, v]) => (
                      <li key={k} className="text-sm">
                        <span className="font-bold">{k.replace(/_/g, ' ')}:</span>{' '}
                        <span className="text-gray-700">{String(v)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Applications */}
        <section className="py-10 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-700" />
              Applications on record
            </h2>
            {applications.length === 0 ? (
              <div className="bg-white border-2 border-black p-6">
                <p className="text-sm text-gray-700">
                  No applications have been started for this opportunity yet. When an org begins drafting, the application
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="border-2 border-black bg-white">
                {applications.map((app: any, i: number) => (
                  <div key={app.id} className={`p-5 ${i > 0 ? 'border-t-2 border-black' : ''} grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 md:items-center`}>
                    <div>
                      <div className="font-bold">
                        {app.organization?.name || 'Unknown organisation'}
                      </div>
                      {app.organization?.slug && (
                        <Link href={`/organizations/${app.organization.slug}`} className="text-xs text-emerald-700 hover:underline">
                          /organizations/{app.organization.slug}
                        </Link>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-xs font-bold uppercase text-gray-500">Status</span>
                      <div className="font-bold">{app.status || '—'}</div>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs font-bold uppercase text-gray-500">Requested</span>
                      <div className="font-bold">{formatCurrency(Number(app.amount_requested)) || '—'}</div>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs font-bold uppercase text-gray-500">Awarded</span>
                      <div className="font-bold">{formatCurrency(Number(app.amount_awarded)) || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Source meta */}
        <section className="py-10">
          <div className="container-justice max-w-3xl">
            <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500 mb-2">Source meta</h3>
            <dl className="text-sm space-y-2">
              <div className="flex flex-wrap items-baseline gap-2 border-b border-gray-200 pb-2">
                <dt className="font-bold text-gray-600 w-32">Scrape source</dt>
                <dd className="text-gray-700">{opportunity.scrape_source || 'unknown'}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 border-b border-gray-200 pb-2">
                <dt className="font-bold text-gray-600 w-32">Source ID</dt>
                <dd className="text-gray-700 font-mono text-xs">{opportunity.source_id || opportunity.id}</dd>
              </div>
              {opportunity.scraped_at && (
                <div className="flex flex-wrap items-baseline gap-2 border-b border-gray-200 pb-2">
                  <dt className="font-bold text-gray-600 w-32">Last scraped</dt>
                  <dd className="text-gray-700">{formatDate(opportunity.scraped_at)}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
