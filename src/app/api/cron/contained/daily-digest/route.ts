import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

const DIGEST_TO = process.env.CONTAINED_DIGEST_TO || 'benjamin@act.place';

/**
 * GET /api/cron/contained/daily-digest
 *
 * Morning digest for the CONTAINED capture funnel: new EOIs, supporters and
 * nominations from the last 24h, plus nominees with 3+ nominations who need
 * personal outreach. Sends one email to the team. Read-only apart from the
 * digest email itself.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient() as any;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('full_name, email, organization, metadata, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100);

    const contained = (registrations || []).filter((r: any) =>
      String(r.metadata?.event_name || '').toUpperCase().includes('CONTAINED')
    );
    const eois = contained.filter((r: any) =>
      (r.metadata?.tags || []).includes('experience:eoi')
    );
    const supporters = contained.filter((r: any) =>
      (r.metadata?.tags || []).includes('engagement:supporter')
    );
    const others = contained.filter((r: any) => !eois.includes(r) && !supporters.includes(r));

    // Live nomination system: campaign_nominations (one row per nomination,
    // public wall at /contained/nominations).
    const { data: allNoms } = await supabase
      .from('campaign_nominations')
      .select('nominee_name, nominee_title, nominee_org, reason, nominator_name, created_at, is_public')
      .order('created_at', { ascending: false })
      .limit(500);

    const pendingCount = (allNoms || []).filter((n: any) => !n.is_public).length;

    const newNominations = (allNoms || []).filter((n: any) => n.created_at >= since);
    const countsByNominee: Record<string, number> = {};
    for (const n of allNoms || []) {
      countsByNominee[n.nominee_name] = (countsByNominee[n.nominee_name] || 0) + 1;
    }
    const hotNominees = Object.entries(countsByNominee)
      .filter(([, c]) => c >= 3)
      .map(([name, c]) => {
        const latest = (allNoms || []).find((n: any) => n.nominee_name === name);
        return { ...latest, count: c };
      });

    const total = eois.length + supporters.length + others.length + newNominations.length;

    const fmtReg = (r: any) => {
      const why = String(r.metadata?.how_heard || '').slice(0, 160);
      return `- ${r.full_name}${r.organization ? ` (${r.organization})` : ''} <${r.email}>${why ? `\n  "${why}"` : ''}`;
    };
    const fmtNom = (n: any) => {
      const count = n.count || countsByNominee[n.nominee_name] || 1;
      return `- ${n.nominee_name}${n.nominee_title ? `, ${n.nominee_title}` : ''}${n.nominee_org ? ` (${n.nominee_org})` : ''}: ${count} nomination${count > 1 ? 's' : ''}${n.is_public === false ? ' [AWAITING REVIEW]' : ''}${n.reason ? `\n  "${String(n.reason).slice(0, 160)}"` : ''}${n.nominator_name ? ` (nominated by ${n.nominator_name})` : ''}`;
    };

    const sections: string[] = [];
    if (eois.length) sections.push(`EOI QUEUE (${eois.length} new) — read the why, triage to Warm-review:\n${eois.map(fmtReg).join('\n')}`);
    if (newNominations.length) sections.push(`NEW NOMINATIONS (${newNominations.length}):\n${newNominations.map(fmtNom).join('\n')}`);
    if (hotNominees.length) sections.push(`3+ NOMINATIONS — personal outreach from you:\n${hotNominees.map(fmtNom).join('\n')}`);
    if (supporters.length) sections.push(`STANDING WITH IT (${supporters.length} new):\n${supporters.map(fmtReg).join('\n')}`);
    if (others.length) sections.push(`OTHER CONTAINED CAPTURES (${others.length}):\n${others.map(fmtReg).join('\n')}`);

    if (total === 0 && hotNominees.length === 0) {
      return NextResponse.json({ success: true, sent: false, reason: 'nothing new' });
    }

    const body = `Morning. ${total} new in the CONTAINED funnel since yesterday.

${sections.join('\n\n')}

${pendingCount > 0 ? `${pendingCount} nomination message${pendingCount > 1 ? 's' : ''} awaiting your review: https://justicehub.com.au/admin/contained/flow\n\n` : ''}Boards:
Engagement: https://app.gohighlevel.com/v2/location/agzsSZWgovjwgpcoASWG/opportunities/list
Adelaide experience pipeline: same view, switch pipeline top-left.

Every invitation is yours to make. Nothing here has been contacted beyond the receipt.`;

    await sendEmail({
      to: DIGEST_TO,
      subject: `CONTAINED daily: ${eois.length} EOI · ${newNominations.length} nominations · ${supporters.length} supporters`,
      preheader: 'New people in the funnel, triage queue first.',
      body,
    });

    return NextResponse.json({
      success: true,
      sent: true,
      counts: { eois: eois.length, supporters: supporters.length, nominations: newNominations.length, hot: hotNominees.length },
    });
  } catch (error: any) {
    console.error('CONTAINED daily digest error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
