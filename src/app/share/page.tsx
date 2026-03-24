import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowRight, Download, Share2, Linkedin, Twitter } from 'lucide-react';
import { Metadata } from 'next';
import { ShareCardGrid } from './ShareCardGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Share the Data | JusticeHub',
  description:
    'Branded data cards from JusticeHub — share youth justice stats on LinkedIn, Twitter, email, and board packs. The data that changes the conversation.',
};

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default async function SharePage() {
  const supabase = createServiceClient() as any;

  const [interventionsRes, costDataRes, fundingRes, orgRes, indOrgRes] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id, evidence_level', { count: 'exact' })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('alma_interventions')
      .select('cost_per_young_person')
      .neq('verification_status', 'ai_generated')
      .not('cost_per_young_person', 'is', null)
      .gt('cost_per_young_person', 0)
      .lt('cost_per_young_person', 500000),
    supabase.from('justice_funding').select('amount_dollars').gt('amount_dollars', 0),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_indigenous_org', true),
  ]);

  const interventions = interventionsRes.data || [];
  const costData = (costDataRes.data || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0);
  const funding = fundingRes.data || [];
  const totalFunding = funding.reduce((sum: number, f: any) => sum + (Number(f.amount_dollars) || 0), 0);
  const avgCost = costData.length ? Math.round(costData.reduce((a: number, b: number) => a + b, 0) / costData.length) : 8500;
  const detentionCost = 547500;
  const ratio = Math.round(detentionCost / avgCost);
  const evidenceBacked = interventions.filter((i: any) => i.evidence_level && !i.evidence_level.startsWith('Untested')).length;
  const modelCount = interventions.length;
  const totalOrgs = orgRes.count || 0;
  const indigenousOrgs = indOrgRes.count || 0;
  const fundingRecords = funding.length;

  const cards = [
    {
      id: 'cost-comparison',
      title: 'Cost Comparison',
      description: `Detention ${fmt(detentionCost)}/yr vs ALMA ${fmt(avgCost)} — ${ratio}x cheaper`,
      url: `/api/cards?type=cost-comparison&models=${modelCount}&avg_cost=${avgCost}`,
      category: 'The Argument',
    },
    {
      id: 'cost-comparison-nt',
      title: 'NT Cost Comparison',
      description: 'Northern Territory — highest detention cost in Australia',
      url: `/api/cards?type=cost-comparison&state=NT&models=${modelCount}&avg_cost=${avgCost}`,
      category: 'The Argument',
    },
    {
      id: 'proof',
      title: 'Wall of Proof',
      description: `${modelCount} verified models, ${evidenceBacked} evidence-backed`,
      url: `/api/cards?type=proof&models=${modelCount}&evidence=${evidenceBacked}&avg_cost=${avgCost}`,
      category: 'The Proof',
    },
    {
      id: 'funding',
      title: 'Funding Overview',
      description: `${fmt(totalFunding)} tracked across ${fundingRecords.toLocaleString()} records`,
      url: `/api/cards?type=funding&funding=${totalFunding}&records=${fundingRecords}&orgs=${totalOrgs}&indigenous_orgs=${indigenousOrgs}`,
      category: 'Follow the Money',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Amplify the Data
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Share the Data
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-4">
              Branded data cards from live platform stats. Download for LinkedIn, Twitter,
              newsletters, funder board packs. Every share puts a number in front of someone
              who needs to see it.
            </p>
            <p className="text-sm text-white/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              All data is live from JusticeHub. Cards update automatically.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-12">
          <ShareCardGrid cards={cards} />

          {/* How to use */}
          <section>
            <h2
              className="text-xl font-bold tracking-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              How to Use These
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <Linkedin className="w-6 h-6 text-[#0A6DC2] mb-3" />
                <h3 className="font-bold mb-2">LinkedIn</h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Download the card, attach as an image to your post. Lead with the number,
                  add context, link to JusticeHub. The post that got thousands of views? This
                  is how you replicate it.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <Share2 className="w-6 h-6 text-[#059669] mb-3" />
                <h3 className="font-bold mb-2">Funder Packs</h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Drop cards into board papers, investment proposals, and email decks. Each
                  card is a one-slide argument. Let the data do the talking.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <Twitter className="w-6 h-6 text-[#0A0A0A] mb-3" />
                <h3 className="font-bold mb-2">Social & Email</h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Use in newsletters, email signatures, social posts, presentations. Every
                  card links back to the full data on JusticeHub.
                </p>
              </div>
            </div>
          </section>

          {/* API note */}
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
            <h3 className="font-bold mb-2">For developers</h3>
            <p className="text-sm text-[#0A0A0A]/60 mb-3">
              Cards are generated server-side as PNGs via the API. Embed them anywhere:
            </p>
            <code
              className="text-xs bg-[#0A0A0A] text-[#059669] px-4 py-2 rounded block overflow-x-auto"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {'<img src="https://justicehub.org.au/api/cards?type=cost-comparison" />'}
            </code>
            <p className="text-xs text-[#0A0A0A]/40 mt-2">
              Types: cost-comparison, proof, funding, state. Add ?state=QLD for state-specific cards.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
