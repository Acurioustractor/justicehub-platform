import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { LetterGenerator } from './LetterGenerator';
import { fmt } from '@/lib/format';
import { getDetentionCosts } from '@/lib/detention-costs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Write to Your MP | JusticeHub',
  description:
    'Generate a data-backed letter to your local MP about youth justice. Your postcode, your state\'s data, your voice. Takes 2 minutes.',
};

export default async function WriteYourMPPage() {
  const supabase = createServiceClient() as any;

  // Get per-state data for letter generation
  const states = ['NT', 'QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT'];
  const stateDataPromises = states.map(async (state) => {
    const [fundingRes, orgsRes, indOrgsRes, almaRes] = await Promise.all([
      supabase.from('justice_funding').select('amount_dollars').eq('state', state).gt('amount_dollars', 0),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('state', state),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('state', state).eq('is_indigenous_org', true),
      supabase.from('alma_interventions').select('id, organizations!alma_interventions_operating_organization_id_fkey(state)').neq('verification_status', 'ai_generated'),
    ]);

    const funding = fundingRes.data || [];
    const totalFunding = funding.reduce((s: number, f: any) => s + (Number(f.amount_dollars) || 0), 0);
    const stateAlma = (almaRes.data || []).filter((a: any) => a.organizations?.state === state);

    return {
      state,
      totalFunding: fmt(totalFunding),
      totalOrgs: orgsRes.count || 0,
      indigenousOrgs: indOrgsRes.count || 0,
      almaModels: stateAlma.length,
      fundingRecords: funding.length,
    };
  });

  const stateData = await Promise.all(stateDataPromises);

  // National stats
  const [totalModelsRes, costRes] = await Promise.all([
    supabase.from('alma_interventions').select('id', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
    supabase.from('alma_interventions').select('cost_per_young_person').neq('verification_status', 'ai_generated').not('cost_per_young_person', 'is', null).gt('cost_per_young_person', 0).lt('cost_per_young_person', 500000),
  ]);

  const costs = (costRes.data || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0);
  const avgCost = costs.length ? Math.round(costs.reduce((a: number, b: number) => a + b, 0) / costs.length) : 8500;
  const detentionCostsData = await getDetentionCosts();
  const ratio = Math.round(detentionCostsData.national.annualCost / avgCost);

  // Build per-state detention daily costs from live ROGS data
  const stateDetentionCosts: Record<string, number> = {};
  for (const [code, data] of Object.entries(detentionCostsData.byState)) {
    stateDetentionCosts[code] = data.dailyCost;
  }

  const stateDataMap: Record<string, any> = {};
  for (const sd of stateData) {
    stateDataMap[sd.state] = sd;
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Take Action
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Write to Your MP
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              A data-backed letter generated from your state&apos;s actual numbers.
              Select your state, personalise if you want, copy, and send. Takes 2 minutes.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 sm:px-12 py-16">
          <LetterGenerator
            stateData={stateDataMap}
            nationalModels={totalModelsRes.count || 0}
            avgCost={avgCost}
            ratio={ratio}
            stateDetentionCosts={stateDetentionCosts}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
