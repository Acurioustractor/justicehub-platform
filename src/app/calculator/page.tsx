import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { CalculatorClient } from './CalculatorClient';
import { getDetentionCosts } from '@/lib/detention-costs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Detention Cost Calculator | JusticeHub',
  description:
    'What if we redirected detention spending to community alternatives? Interactive calculator showing the cost of locking kids up vs investing in what works.',
};

export default async function CalculatorPage() {
  const supabase = createServiceClient() as any;

  // Get cost data for ALMA models
  const { data: costData } = await supabase
    .from('alma_interventions')
    .select('cost_per_young_person, evidence_level, type')
    .neq('verification_status', 'ai_generated')
    .not('cost_per_young_person', 'is', null)
    .gt('cost_per_young_person', 0)
    .lt('cost_per_young_person', 500000);

  const costs = (costData || []).map((r: any) => Number(r.cost_per_young_person));
  const avgCost = costs.length ? costs.reduce((a: number, b: number) => a + b, 0) / costs.length : 8500;
  const medianCost = costs.length ? costs.sort((a: number, b: number) => a - b)[Math.floor(costs.length / 2)] : 5000;
  const modelCount = costs.length;

  // Get live detention costs from ROGS
  const detentionCosts = await getDetentionCosts();

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <CalculatorClient
          avgCost={Math.round(avgCost)}
          medianCost={Math.round(medianCost)}
          modelCount={modelCount}
          detentionCosts={detentionCosts}
        />
      </main>
      <Footer />
    </div>
  );
}
