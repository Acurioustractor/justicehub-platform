import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Globe, Image, Users, BarChart3, FileText, Settings,
  CheckCircle, AlertTriangle, TrendingUp, DollarSign,
  MapPin, Shield, ArrowRight, ExternalLink
} from 'lucide-react';

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

async function getBasecampData(orgId: string) {
  const supabase = createServiceClient() as any;

  const [photos, contacts, goals, metrics, storytellers, interventions, funding] = await Promise.all([
    supabase.from('partner_photos').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_contacts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_goals').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_impact_metrics').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_storytellers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('alma_interventions')
      .select('id, name, evidence_level, community_verified')
      .eq('operating_organization_id', orgId)
      .neq('verification_status', 'ai_generated'),
    supabase.from('justice_funding')
      .select('id, amount_dollars, source, funder_name')
      .eq('alma_organization_id', orgId),
  ]);

  const interventionData = interventions.data || [];
  const fundingData = funding.data || [];

  const evidenceCounts = interventionData.reduce((acc: Record<string, number>, i: any) => {
    const short = (i.evidence_level || 'Untested').split(' (')[0];
    acc[short] = (acc[short] || 0) + 1;
    return acc;
  }, {});

  const totalFunding = fundingData.reduce((sum: number, f: any) => sum + (f.amount_dollars || 0), 0);
  const communityVerified = interventionData.filter((i: any) => i.community_verified).length;

  return {
    photoCount: photos.count || 0,
    contactCount: contacts.count || 0,
    goalCount: goals.count || 0,
    metricCount: metrics.count || 0,
    storytellerCount: storytellers.count || 0,
    interventionCount: interventionData.length,
    communityVerified,
    evidenceCounts,
    totalFunding,
    fundingRecords: fundingData.length,
    fundingSources: [...new Set(fundingData.map((f: any) => f.funder_name || f.source))].length,
  };
}

// Profile completeness score
function getCompleteness(data: Awaited<ReturnType<typeof getBasecampData>>): { score: number; missing: string[] } {
  const checks = [
    { name: 'Photos', done: data.photoCount > 0 },
    { name: 'Team contacts', done: data.contactCount > 0 },
    { name: 'Impact metrics', done: data.metricCount > 0 },
    { name: 'Storytellers', done: data.storytellerCount > 0 },
    { name: 'Programs', done: data.interventionCount > 0 },
    { name: 'Goals', done: data.goalCount > 0 },
  ];
  const done = checks.filter(c => c.done).length;
  const missing = checks.filter(c => !c.done).map(c => c.name);
  return { score: Math.round((done / checks.length) * 100), missing };
}

export default async function BasecampPage({ params }: { params: { 'org-slug': string } }) {
  const slug = params['org-slug'];
  const service = createServiceClient();

  const { data: organization } = await service
    .from('organizations')
    .select('id, name, slug, type, partner_tier, city, state, is_indigenous_org')
    .eq('slug', slug)
    .single();

  if (!organization) redirect('/');

  if (organization.type !== 'basecamp' && organization.partner_tier !== 'basecamp') {
    redirect(`/hub/${slug}/dashboard`);
  }

  const data = await getBasecampData(organization.id);
  const completeness = getCompleteness(data);

  const EVIDENCE_COLORS: Record<string, string> = {
    'Proven': 'bg-emerald-600',
    'Effective': 'bg-green-600',
    'Promising': 'bg-amber-500',
    'Indigenous-led': 'bg-purple-600',
    'Untested': 'bg-gray-400',
  };

  return (
    <div>
      {/* Header with completeness */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black mb-1">Basecamp Dashboard</h1>
            <p className="text-earth-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {[organization.city, organization.state].filter(Boolean).join(', ')}
              {organization.is_indigenous_org && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> ACCO
                </span>
              )}
            </p>
          </div>
          <Link
            href={`/for-funders/org/${slug}`}
            className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 transition-colors"
            target="_blank"
          >
            Funder View <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* At a Glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-2 border-black p-5">
          <p className="text-3xl font-black">{data.interventionCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mt-1">Programs</p>
          <p className="text-xs text-earth-500 mt-1">{data.communityVerified} community verified</p>
        </div>
        <div className="bg-white border-2 border-black p-5">
          <p className="text-3xl font-black">{data.totalFunding > 0 ? formatDollars(data.totalFunding) : '$0'}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mt-1">Funding Tracked</p>
          <p className="text-xs text-earth-500 mt-1">{data.fundingRecords} records, {data.fundingSources} sources</p>
        </div>
        <div className="bg-white border-2 border-black p-5">
          <p className="text-3xl font-black">{data.storytellerCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mt-1">Storytellers</p>
          <p className="text-xs text-earth-500 mt-1">{data.photoCount} photos</p>
        </div>
        <div className="bg-white border-2 border-black p-5">
          <p className={`text-3xl font-black ${completeness.score >= 80 ? 'text-green-700' : completeness.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {completeness.score}%
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mt-1">Profile Complete</p>
          {completeness.missing.length > 0 && (
            <p className="text-xs text-red-500 mt-1">Missing: {completeness.missing.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Evidence breakdown */}
      {data.interventionCount > 0 && Object.keys(data.evidenceCounts).length > 0 && (
        <div className="bg-white border-2 border-black p-6 mb-8">
          <h3 className="font-black mb-4">Evidence Profile</h3>
          <div className="flex gap-1 h-6 rounded overflow-hidden mb-3">
            {Object.entries(data.evidenceCounts).map(([level, count]) => (
              <div
                key={level}
                className={`${EVIDENCE_COLORS[level] || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold`}
                style={{ flex: count }}
                title={`${level}: ${count}`}
              >
                {count}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.evidenceCounts).map(([level, count]) => (
              <span key={level} className="flex items-center gap-1.5 text-xs text-earth-600">
                <span className={`w-2.5 h-2.5 rounded-full ${EVIDENCE_COLORS[level] || 'bg-gray-400'}`} />
                {level} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h3 className="font-black mb-4">Manage Your Profile</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { title: 'Mini-Site', description: 'Edit your public page', icon: Globe, href: `/hub/${slug}/site-editor`, stat: 'Live', statColor: 'text-green-700' },
          { title: 'Photos & Gallery', description: 'Manage your photo gallery', icon: Image, href: `/hub/${slug}/site-editor#gallery`, stat: `${data.photoCount} photos`, statColor: 'text-earth-600' },
          { title: 'Storytellers', description: 'Manage storyteller profiles', icon: Users, href: `/hub/${slug}/site-editor#team`, stat: `${data.storytellerCount} people`, statColor: 'text-earth-600' },
          { title: 'Impact Metrics', description: 'Track and share your impact', icon: BarChart3, href: `/hub/${slug}/site-editor#metrics`, stat: `${data.metricCount} metrics`, statColor: 'text-earth-600' },
          { title: 'Goals', description: 'Set and track program goals', icon: FileText, href: `/hub/${slug}/site-editor#goals`, stat: `${data.goalCount} goals`, statColor: 'text-earth-600' },
          { title: 'Team Contacts', description: 'Manage who visitors can reach', icon: Settings, href: `/hub/${slug}/site-editor#contacts`, stat: `${data.contactCount} contacts`, statColor: 'text-earth-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5 text-earth-600" />
                <h3 className="font-black">{card.title}</h3>
              </div>
              <p className="text-sm text-earth-600 mb-4">{card.description}</p>
              <span className={`text-sm font-bold ${card.statColor}`}>{card.stat}</span>
            </Link>
          );
        })}
      </div>

      {/* Public pages */}
      <div className="bg-ochre-50 border-2 border-ochre-300 p-6">
        <h3 className="font-black mb-3">Your Public Pages</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-earth-600">Community page:</span>
            <Link href={`/sites/${slug}`} className="text-ochre-700 hover:text-ochre-900 font-bold text-sm underline" target="_blank">
              justicehub.com.au/sites/{slug}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-earth-600">Full profile:</span>
            <Link href={`/organizations/${slug}`} className="text-ochre-700 hover:text-ochre-900 font-bold text-sm underline" target="_blank">
              justicehub.com.au/organizations/{slug}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-earth-600">Funder pitch page:</span>
            <Link href={`/for-funders/org/${slug}`} className="text-ochre-700 hover:text-ochre-900 font-bold text-sm underline" target="_blank">
              justicehub.com.au/for-funders/org/{slug}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
