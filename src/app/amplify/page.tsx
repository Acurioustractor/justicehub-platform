import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { ContentTemplates } from './ContentTemplates';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Content Amplification | JusticeHub',
  description:
    'Ready-to-post LinkedIn content, tweet threads, and newsletter snippets — auto-generated from live JusticeHub data. Copy, paste, amplify.',
};

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default async function AmplifyPage() {
  const supabase = createServiceClient() as any;

  const [interventionsRes, costDataRes, fundingRes, orgRes, indOrgRes, evidenceRes, basecampsRes] = await Promise.all([
    supabase.from('alma_interventions').select('id, evidence_level', { count: 'exact' }).neq('verification_status', 'ai_generated'),
    supabase.from('alma_interventions').select('cost_per_young_person').neq('verification_status', 'ai_generated').not('cost_per_young_person', 'is', null).gt('cost_per_young_person', 0).lt('cost_per_young_person', 500000),
    supabase.from('justice_funding').select('amount_dollars').gt('amount_dollars', 0),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_indigenous_org', true),
    supabase.from('alma_evidence').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).or('partner_tier.eq.basecamp,type.eq.basecamp'),
  ]);

  const interventions = interventionsRes.data || [];
  const costData = (costDataRes.data || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0);
  const funding = fundingRes.data || [];
  const totalFunding = funding.reduce((sum: number, f: any) => sum + (Number(f.amount_dollars) || 0), 0);
  const avgCost = costData.length ? Math.round(costData.reduce((a: number, b: number) => a + b, 0) / costData.length) : 8500;
  const detentionCost = 547500;
  const ntDetentionCost = 1539205;
  const ratio = Math.round(detentionCost / avgCost);
  const ntRatio = Math.round(ntDetentionCost / avgCost);
  const evidenceBacked = interventions.filter((i: any) => i.evidence_level && !i.evidence_level.startsWith('Untested')).length;
  const modelCount = interventions.length;

  const stats = {
    modelCount,
    evidenceBacked,
    avgCost,
    detentionCost,
    ntDetentionCost,
    ratio,
    ntRatio,
    totalFunding: fmt(totalFunding),
    fundingRecords: funding.length,
    totalOrgs: orgRes.count || 0,
    indigenousOrgs: indOrgRes.count || 0,
    evidenceItems: evidenceRes.count || 0,
    basecamps: basecampsRes.count || 0,
    costModels: costData.length,
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Content Engine
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Amplify the Data
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-4">
              Ready-to-post content generated from live platform data. Copy, paste, post.
              Every stat is real. Every number is current. Make the data impossible to ignore.
            </p>
            <p className="text-sm text-white/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              All content uses live data from JusticeHub. Updated automatically.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
          <ContentTemplates stats={stats} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
