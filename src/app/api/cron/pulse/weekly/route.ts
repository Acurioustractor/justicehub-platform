import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { callLLM } from '@/lib/ai/model-router';
import { sendBatchEmail } from '@/lib/email/send';

export const maxDuration = 60;

/**
 * GET /api/cron/pulse/weekly
 *
 * Weekly pulse briefing — runs Monday 8am AEST (22:00 UTC Sunday).
 * 1. Gathers 7 days of pulse data from ALMA + CivicScope tables
 * 2. AI-generates a concise briefing
 * 3. Stores in pulse_reports
 * 4. Emails to all newsletter subscribers via GHL
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoff = weekAgo.toISOString();

    // ── Gather data in parallel ──────────────────────────────────────
    const [
      interventionsRes,
      mediaRes,
      fundingRes,
      evidenceRes,
      statementsRes,
      alertsRes,
      orgsRes,
    ] = await Promise.all([
      // New interventions
      supabase
        .from('alma_interventions')
        .select('name, evidence_level, operating_organization, cost_per_young_person')
        .neq('verification_status', 'ai_generated')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(20),

      // Media coverage
      supabase
        .from('alma_media_articles')
        .select('headline, source_name, sentiment')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(20),

      // Funding tracked
      supabase
        .from('justice_funding')
        .select('program_name, amount_dollars')
        .gte('created_at', cutoff)
        .limit(50),

      // New evidence
      supabase
        .from('alma_evidence')
        .select('title, evidence_type')
        .gte('created_at', cutoff)
        .limit(15),

      // Government statements (youth justice filtered)
      supabase
        .from('civic_ministerial_statements')
        .select('headline, minister_name, portfolio')
        .or(
          'headline.ilike.%youth%,headline.ilike.%justice%,headline.ilike.%detention%,headline.ilike.%child%,headline.ilike.%young people%'
        )
        .gte('published_at', cutoff)
        .order('published_at', { ascending: false })
        .limit(10),

      // Civic alerts
      supabase
        .from('civic_alerts')
        .select('title, alert_type, severity')
        .gte('created_at', cutoff)
        .limit(10),

      // New organizations
      supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', cutoff),
    ]);

    const interventions = interventionsRes.data || [];
    const media = mediaRes.data || [];
    const funding = fundingRes.data || [];
    const evidence = evidenceRes.data || [];
    const statements = statementsRes.data || [];
    const alerts = alertsRes.data || [];
    const newOrgsCount = orgsRes.count || 0;

    // ── Compute stats ────────────────────────────────────────────────
    const totalFunding = funding.reduce(
      (sum, f) => sum + (Number(f.amount_dollars) || 0),
      0
    );
    const negativeSentiment = media.filter((m) => m.sentiment === 'negative').length;
    const positiveSentiment = media.filter((m) => m.sentiment === 'positive').length;

    const stats = {
      new_interventions: interventions.length,
      media_articles: media.length,
      funding_records: funding.length,
      funding_total_dollars: totalFunding,
      new_evidence: evidence.length,
      government_statements: statements.length,
      civic_alerts: alerts.length,
      new_organizations: newOrgsCount,
      media_sentiment: { positive: positiveSentiment, negative: negativeSentiment },
    };

    // ── Generate AI briefing ─────────────────────────────────────────
    const dataSnapshot = JSON.stringify(
      {
        stats,
        top_interventions: interventions.slice(0, 5).map((i) => i.name),
        top_media: media
          .slice(0, 5)
          .map((m) => `${m.headline} (${m.source_name}, ${m.sentiment})`),
        top_statements: statements
          .slice(0, 3)
          .map((s) => `${s.minister_name}: ${s.headline}`),
        top_alerts: alerts.slice(0, 3).map((a) => `[${a.severity}] ${a.title}`),
      },
      null,
      2
    );

    const briefing = await callLLM(
      `You are the JusticeHub Weekly Pulse briefing writer. Write a concise, punchy weekly briefing for youth justice advocates and funders in Australia.

DATA FROM THE LAST 7 DAYS:
${dataSnapshot}

RULES:
- Open with a 1-sentence headline summary of the most important development
- Use 3-5 short paragraphs max
- Bold the key numbers
- Include specific program names, ministers, and sources where available
- End with one "Action Item" — the single most important thing readers should do this week
- Tone: urgent but hopeful. Data-driven, not preachy.
- Do NOT use emojis
- Write in plain text (the email system wraps it in HTML)
- If there are zero items for a category, skip it — don't mention empty categories

OUTPUT: The briefing text only, no preamble.`,
      { maxTokens: 1024, temperature: 0.7 }
    );

    // ── Store report ─────────────────────────────────────────────────
    const { error: insertError } = await supabase.from('pulse_reports').insert({
      period_start: cutoff,
      period_end: now.toISOString(),
      report_type: 'weekly',
      stats,
      briefing,
      raw_data: { interventions, media, funding: stats.funding_records, evidence, statements, alerts },
    });

    if (insertError) {
      console.error('Failed to store pulse report:', insertError);
    }

    // ── Email subscribers ────────────────────────────────────────────
    const { data: subscribers } = await supabase
      .from('vw_newsletter_segments')
      .select('email, full_name')
      .not('email', 'is', null);

    let sentCount = 0;

    if (subscribers && subscribers.length > 0) {
      const weekLabel = `${weekAgo.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      sentCount = await sendBatchEmail({
        emails: subscribers.map((sub) => ({
          to: sub.email,
          name: sub.full_name || undefined,
          subject: `JusticeHub Pulse — Week of ${weekLabel}`,
          body: briefing,
          preheader: `${stats.new_interventions} programs documented, ${stats.media_articles} media articles, $${(totalFunding / 1_000_000).toFixed(1)}M tracked`,
        })),
        tags: ['pulse-weekly'],
        source: 'pulse_cron',
      });

      // Update sent count on the report
      if (!insertError) {
        await supabase
          .from('pulse_reports')
          .update({ sent_to: sentCount })
          .eq('period_start', cutoff);
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      briefing_length: briefing.length,
      subscribers: subscribers?.length || 0,
      sent: sentCount,
    });
  } catch (error: unknown) {
    console.error('Pulse weekly cron error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
