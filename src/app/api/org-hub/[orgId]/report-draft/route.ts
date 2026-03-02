import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    const body = await request.json();
    const { grantId, periodStart, periodEnd } = body;

    if (!grantId) return NextResponse.json({ error: 'grantId required' }, { status: 400 });

    const sb = supabase as any;

    // Fetch grant details
    const { data: grant } = await sb
      .from('org_grants')
      .select('*')
      .eq('id', grantId)
      .eq('organization_id', orgId)
      .single();

    if (!grant) return NextResponse.json({ error: 'Grant not found' }, { status: 404 });

    // Fetch org name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    // Fetch sessions in period
    let sessionsQuery = sb
      .from('org_sessions')
      .select('*')
      .eq('organization_id', orgId);

    if (periodStart) sessionsQuery = sessionsQuery.gte('session_date', periodStart);
    if (periodEnd) sessionsQuery = sessionsQuery.lte('session_date', periodEnd);

    const { data: sessions } = await sessionsQuery.order('session_date', { ascending: true });

    // Fetch milestones in period
    let milestonesQuery = sb
      .from('org_milestones')
      .select('*')
      .eq('organization_id', orgId);

    if (periodStart) milestonesQuery = milestonesQuery.gte('milestone_date', periodStart);
    if (periodEnd) milestonesQuery = milestonesQuery.lte('milestone_date', periodEnd);

    const { data: milestones } = await milestonesQuery;

    // Fetch budget lines for this grant
    const { data: budgetLines } = await sb
      .from('org_grant_budget_lines')
      .select('*')
      .eq('grant_id', grantId);

    // Fetch transactions for this grant in period
    let txQuery = sb
      .from('org_grant_transactions')
      .select('*')
      .eq('grant_id', grantId);

    if (periodStart) txQuery = txQuery.gte('transaction_date', periodStart);
    if (periodEnd) txQuery = txQuery.lte('transaction_date', periodEnd);

    const { data: transactions } = await txQuery;

    const totalSessions = (sessions || []).length;
    const totalParticipants = (sessions || []).reduce((sum: number, s: any) => sum + (s.participant_count || 0), 0);
    const totalSpent = (transactions || []).reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

    const prompt = `You are writing a grant acquittal report for a grassroots Indigenous community organisation in Australia.

Organisation: ${org?.name || 'Unknown'}
Grant: ${grant.grant_name}
Funder: ${grant.funder_name}
Reporting Period: ${periodStart || grant.contract_start || 'Start'} to ${periodEnd || grant.contract_end || 'End'}
Amount Awarded: $${grant.amount_awarded || 0}

ACTIVITY DATA:
- Total sessions delivered: ${totalSessions}
- Total participant engagements: ${totalParticipants}
- Sessions breakdown: ${JSON.stringify((sessions || []).map((s: any) => ({
  date: s.session_date,
  program: s.program_name,
  type: s.session_type,
  participants: s.participant_count,
  elder: s.elder_present,
  outcome: s.outcome_summary,
})))}

MILESTONES:
${(milestones || []).map((m: any) => `- ${m.milestone_date}: ${m.milestone_type} — ${m.description}`).join('\n') || 'None recorded'}

FINANCIAL SUMMARY:
- Total spent this period: $${totalSpent.toFixed(2)}
- Budget lines: ${JSON.stringify((budgetLines || []).map((b: any) => ({
  category: b.category,
  budgeted: b.budgeted_amount,
  actual: b.actual_amount,
})))}

Write a professional but warm acquittal report suitable for government/philanthropic funders. Include:
1. Executive Summary
2. Activities Delivered
3. Outcomes & Impact
4. Financial Summary
5. Challenges & Learnings
6. Next Steps

Use plain language. Highlight community impact and cultural connection. Keep it under 1000 words.`;

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const draft = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      success: true,
      draft,
      metadata: {
        grantName: grant.grant_name,
        funder: grant.funder_name,
        period: `${periodStart || 'start'} to ${periodEnd || 'end'}`,
        totalSessions,
        totalParticipants,
        totalSpent,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
