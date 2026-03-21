import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state')?.toUpperCase() || null;
  const supabase = createServiceClient();

  try {
    let query = supabase
      .from('alma_government_programs')
      .select('id, name, program_type, announced_date, status, budget_amount, description, official_url, minister, department, target_cohort, jurisdiction')
      .order('budget_amount', { ascending: false, nullsFirst: false });

    if (state) {
      query = query.eq('jurisdiction', state);
    }

    const { data: programs, error } = await query;
    if (error) throw error;

    // Count linked interventions per program
    const programIds = (programs || []).map((p: any) => p.id);
    let interventionCounts: Record<string, number> = {};

    if (programIds.length > 0) {
      const { data: links } = await supabase
        .from('alma_program_interventions')
        .select('program_id, intervention_id')
        .in('program_id', programIds);

      // Filter out ai_generated interventions
      const interventionIds = [...new Set((links || []).map((l: any) => l.intervention_id))];
      let validIds = new Set<string>();
      if (interventionIds.length > 0) {
        const { data: validInterventions } = await supabase
          .from('alma_interventions')
          .select('id')
          .in('id', interventionIds)
          .neq('verification_status', 'ai_generated');
        validIds = new Set((validInterventions || []).map((i: any) => i.id));
      }

      for (const link of links || []) {
        if (validIds.has(link.intervention_id)) {
          interventionCounts[link.program_id] = (interventionCounts[link.program_id] || 0) + 1;
        }
      }
    }

    const mapped = (programs || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      programType: p.program_type,
      announcedDate: p.announced_date,
      status: p.status,
      budgetAmount: p.budget_amount,
      description: p.description,
      url: p.official_url,
      minister: p.minister,
      department: p.department,
      targetCohort: p.target_cohort,
      jurisdiction: p.jurisdiction,
      interventionCount: interventionCounts[p.id] || 0,
    }));

    // Aggregate stats
    const totalPromised = mapped.reduce((sum: number, p: any) => sum + (p.budgetAmount || 0), 0);
    const statusBreakdown: Record<string, number> = {};
    for (const p of mapped) {
      const s = p.status || 'announced';
      statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
    }

    return NextResponse.json({
      programs: mapped,
      stats: {
        total: mapped.length,
        totalPromised,
        statusBreakdown,
        withBudget: mapped.filter((p: any) => p.budgetAmount && p.budgetAmount > 0).length,
      },
    });
  } catch (error) {
    console.error('Programs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}
