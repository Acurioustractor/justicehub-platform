import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Get active subscribers with focus_areas containing 'system_terminal'
  const { data: subscribers, error: subError } = await supabase
    .from('alert_preferences')
    .select('id, name, states, keywords, categories, last_sent_at')
    .eq('enabled', true)
    .contains('focus_areas', ['system_terminal']);

  if (subError) {
    console.error('[alert-deliver] Subscriber query error:', subError);
    return NextResponse.json({ error: 'Failed to query subscribers' }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No active subscribers' });
  }

  // 2. Get new alerts since the earliest last_sent_at (or last 24h for new subscribers)
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const earliestSent = subscribers.reduce((earliest, sub) => {
    const sent = sub.last_sent_at ? new Date(sub.last_sent_at) : oneDayAgo;
    return sent < earliest ? sent : earliest;
  }, now);

  const { data: alerts, error: alertError } = await supabase
    .from('civic_alerts')
    .select('id, alert_type, severity, title, summary, jurisdiction, source_url, created_at')
    .gte('created_at', earliestSent.toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (alertError) {
    console.error('[alert-deliver] Alert query error:', alertError);
    return NextResponse.json({ error: 'Failed to query alerts' }, { status: 500 });
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No new alerts' });
  }

  // 3. Also get recent ministerial statements
  const { data: statements } = await supabase
    .from('civic_ministerial_statements')
    .select('id, headline, minister_name, published_at, source_url')
    .gte('published_at', earliestSent.toISOString())
    .order('published_at', { ascending: false })
    .limit(10);

  // 4. Send digest to each subscriber
  let sentCount = 0;
  const errors: string[] = [];

  for (const sub of subscribers) {
    const sinceDate = sub.last_sent_at ? new Date(sub.last_sent_at) : oneDayAgo;

    // Filter alerts relevant to this subscriber's states
    const subStates = (sub.states as string[]) || [];
    const relevantAlerts = alerts.filter(a => {
      if (new Date(a.created_at) <= sinceDate) return false;
      if (subStates.length > 0 && a.jurisdiction) {
        return subStates.some(s => a.jurisdiction!.toUpperCase().includes(s.toUpperCase()));
      }
      return true; // include alerts without jurisdiction
    });

    const relevantStatements = (statements || []).filter(s =>
      new Date(s.published_at) > sinceDate
    );

    if (relevantAlerts.length === 0 && relevantStatements.length === 0) {
      continue; // nothing new for this subscriber
    }

    const email = sub.name;
    if (!email || !email.includes('@')) continue;

    const html = buildDigestHtml(relevantAlerts, relevantStatements, subStates);

    try {
      await resend.emails.send({
        from: 'JusticeHub Alerts <alerts@justicehub.org.au>',
        to: email,
        subject: `Youth Justice Alert Digest — ${relevantAlerts.length} alert${relevantAlerts.length !== 1 ? 's' : ''}, ${relevantStatements.length} statement${relevantStatements.length !== 1 ? 's' : ''}`,
        html,
      });

      // Update last_sent_at
      await supabase
        .from('alert_preferences')
        .update({ last_sent_at: now.toISOString(), match_count: (relevantAlerts.length + relevantStatements.length) })
        .eq('id', sub.id);

      sentCount++;
    } catch (err: any) {
      console.error(`[alert-deliver] Failed to send to ${email}:`, err.message);
      errors.push(`${email}: ${err.message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    sent: sentCount,
    totalSubscribers: subscribers.length,
    totalAlerts: alerts.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

function buildDigestHtml(
  alerts: { severity: string; title: string; summary: string; jurisdiction: string | null; source_url: string | null; created_at: string }[],
  statements: { headline: string; minister_name: string; published_at: string; source_url: string | null }[],
  states: string[],
): string {
  const stateLabel = states.length > 0 ? states.join(', ') : 'All States';
  const severityColor: Record<string, string> = { high: '#DC2626', medium: '#D97706', low: '#6B7280' };

  let html = `
    <div style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#F5F0E8;padding:32px 24px">
      <div style="border-bottom:1px solid #333;padding-bottom:16px;margin-bottom:24px">
        <p style="font-family:monospace;font-size:11px;color:#DC2626;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 8px">JusticeHub System Terminal</p>
        <h1 style="font-size:22px;font-weight:700;margin:0;color:#F5F0E8">Youth Justice Alert Digest</h1>
        <p style="font-family:monospace;font-size:12px;color:#888;margin:8px 0 0">${stateLabel} · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>`;

  // Alerts section
  if (alerts.length > 0) {
    html += `
      <div style="margin-bottom:24px">
        <h2 style="font-family:monospace;font-size:13px;color:#F59E0B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Alerts (${alerts.length})</h2>`;

    for (const a of alerts) {
      const color = severityColor[a.severity] || '#6B7280';
      html += `
        <div style="border-left:3px solid ${color};padding:8px 12px;margin-bottom:12px;background:#111">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-family:monospace;font-size:10px;color:${color};text-transform:uppercase;font-weight:700">${a.severity}</span>
            ${a.jurisdiction ? `<span style="font-family:monospace;font-size:10px;color:#555">${a.jurisdiction}</span>` : ''}
          </div>
          <p style="font-size:14px;margin:0;color:#F5F0E8;line-height:1.4">${a.source_url ? `<a href="${a.source_url}" style="color:#F5F0E8;text-decoration:underline">${a.title}</a>` : a.title}</p>
          ${a.summary ? `<p style="font-family:monospace;font-size:11px;color:#888;margin:4px 0 0">${a.summary.slice(0, 200)}</p>` : ''}
        </div>`;
    }
    html += `</div>`;
  }

  // Statements section
  if (statements.length > 0) {
    html += `
      <div style="margin-bottom:24px">
        <h2 style="font-family:monospace;font-size:13px;color:#DC2626;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Ministerial Statements (${statements.length})</h2>`;

    for (const s of statements) {
      html += `
        <div style="border-bottom:1px solid #222;padding:8px 0">
          <p style="font-family:monospace;font-size:11px;color:#888;margin:0 0 2px">${s.minister_name} · ${new Date(s.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
          <p style="font-size:13px;margin:0;color:#F5F0E8;line-height:1.4">${s.source_url ? `<a href="${s.source_url}" style="color:#F5F0E8;text-decoration:underline">${s.headline}</a>` : s.headline}</p>
        </div>`;
    }
    html += `</div>`;
  }

  // Footer
  html += `
      <div style="border-top:1px solid #333;padding-top:16px;margin-top:24px">
        <p style="font-family:monospace;font-size:11px;color:#555;margin:0">
          <a href="https://justicehub.org.au/system" style="color:#DC2626;text-decoration:none">View System Terminal</a> ·
          Source: CivicScope auto-scraper ·
          <a href="https://justicehub.org.au/system" style="color:#555;text-decoration:none">Unsubscribe</a>
        </p>
      </div>
    </div>`;

  return html;
}
