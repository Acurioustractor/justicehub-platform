import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  try {
    // 1. Fetch the program
    const { data: program, error: programError } = await supabase
      .from('alma_government_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // 2. Linked interventions — ONLY via verified junction table links
    const { data: links } = await supabase
      .from('alma_program_interventions')
      .select('intervention_id')
      .eq('program_id', id);

    const junctionIds = (links || []).map((l: any) => l.intervention_id);

    let interventions: any[] = [];
    if (junctionIds.length > 0) {
      const { data } = await supabase
        .from('alma_interventions')
        .select('id, name, description, evidence_level, cost_per_young_person, operating_organization, operating_organization_id')
        .in('id', junctionIds)
        .neq('verification_status', 'ai_generated');
      interventions = data || [];
    }

    // Also find interventions whose name contains the program name (exact name match only)
    if (program.name && program.name.length > 5) {
      const { data: byName } = await supabase
        .from('alma_interventions')
        .select('id, name, description, evidence_level, cost_per_young_person, operating_organization, operating_organization_id')
        .ilike('name', `%${program.name}%`)
        .neq('verification_status', 'ai_generated')
        .limit(10);

      const seenIds = new Set(interventions.map((i: any) => i.id));
      for (const i of byName || []) {
        if (!seenIds.has(i.id)) {
          interventions.push(i);
          seenIds.add(i.id);
        }
      }
    }

    // 3. Organisations — ONLY from linked interventions (no guessing)
    const orgIds = [...new Set(
      interventions.map((i: any) => i.operating_organization_id).filter(Boolean)
    )];

    let organisations: any[] = [];
    if (orgIds.length > 0) {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, abn, state, website')
        .in('id', orgIds);
      organisations = data || [];
    }

    // 4. Funding records matching program name
    let funding: any[] = [];
    if (program.name) {
      const { data } = await supabase
        .from('justice_funding')
        .select('id, source, amount_dollars, financial_year, program_name, recipient_name, recipient_abn, state, alma_organization_id')
        .ilike('program_name', `%${program.name.substring(0, 40)}%`)
        .not('amount_dollars', 'is', null)
        .order('financial_year', { ascending: false })
        .limit(50);
      funding = data || [];

      // Add orgs from funding records (these are verified — they received actual money)
      const fundingOrgIds = funding
        .map((f: any) => f.alma_organization_id)
        .filter((oid: any) => oid && !orgIds.includes(oid));

      if (fundingOrgIds.length > 0) {
        const uniqueFundingOrgIds = [...new Set(fundingOrgIds)];
        const { data: fundingOrgs } = await supabase
          .from('organizations')
          .select('id, name, abn, state, website')
          .in('id', uniqueFundingOrgIds);
        if (fundingOrgs?.length) {
          const existingIds = new Set(organisations.map((o: any) => o.id));
          for (const org of fundingOrgs) {
            if (!existingIds.has(org.id)) {
              organisations.push(org);
            }
          }
        }
      }

      // If no orgs yet, try matching funding recipient names
      if (organisations.length === 0) {
        const recipientNames = [...new Set(funding.map((f: any) => f.recipient_name).filter(Boolean))];
        for (const name of recipientNames.slice(0, 3)) {
          const { data: orgMatches } = await supabase
            .from('organizations')
            .select('id, name, abn, state, website')
            .ilike('name', `%${name.substring(0, 40)}%`)
            .limit(2);
          if (orgMatches?.length) {
            const existingIds = new Set(organisations.map((o: any) => o.id));
            for (const org of orgMatches) {
              if (!existingIds.has(org.id)) {
                organisations.push(org);
                existingIds.add(org.id);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      program: {
        id: program.id,
        name: program.name,
        programType: program.program_type,
        announcedDate: program.announced_date,
        status: program.status,
        budgetAmount: program.budget_amount,
        description: program.description,
        url: program.official_url,
        minister: program.minister,
        department: program.department,
        targetCohort: program.target_cohort,
        jurisdiction: program.jurisdiction,
      },
      interventions: interventions.map((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        evidenceLevel: i.evidence_level,
        costPerYoungPerson: i.cost_per_young_person,
        organizationName: i.operating_organization,
      })),
      organisations: organisations.map((o: any) => ({
        id: o.id,
        name: o.name,
        abn: o.abn,
        state: o.state,
        website: o.website,
      })),
      funding: funding.map((f: any) => ({
        id: f.id,
        source: f.source,
        amount: f.amount_dollars,
        year: f.financial_year,
        programName: f.program_name,
        recipientName: f.recipient_name,
        recipientAbn: f.recipient_abn,
        state: f.state,
      })),
    });
  } catch (error) {
    console.error('Program detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch program detail' }, { status: 500 });
  }
}
