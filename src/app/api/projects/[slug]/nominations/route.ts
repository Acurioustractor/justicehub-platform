import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_CANONICAL, CONTAINED_PIPELINES } from '@/lib/ghl/client';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';
import { nominatorReceipt } from '@/content/contained-receipts';

const SITE = 'https://justicehub.com.au';

// Internal team notification address (canonical CONTAINED inbox, matching
// /api/contained/connect). The nominee is NEVER emailed — VIP/decision-maker
// invites only ever come from a relationship owner, by hand.
const TEAM_EMAIL = 'benjamin@act.place';

const VALID_CATEGORIES = [
  'politician',
  'justice_official',
  'media',
  'business',
  'community',
  'other',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProject(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from('art_innovation')
    .select('id, title, slug')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data;
}

/**
 * GET /api/projects/[slug]/nominations
 * Public: returns count, breakdown by category, and recent nominations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    const project = await resolveProject(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // Wall mode: paginated full nominations for /contained/nominations
    if (mode === 'wall') {
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const category = searchParams.get('category');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('campaign_nominations')
        .select('nominee_name, nominee_title, nominee_org, category, reason, created_at', { count: 'exact' })
        .eq('project_id', project.id)
        .eq('is_public', true);

      if (category && VALID_CATEGORIES.includes(category)) {
        query = query.eq('category', category);
      }

      const { data, count: totalCount, error: wallError } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (wallError) throw wallError;

      return NextResponse.json({
        nominations: data || [],
        total: totalCount || 0,
        page,
        limit,
        hasMore: (totalCount || 0) > offset + limit,
      });
    }

    // Leaderboard mode: nominations grouped by nominee with upvote counts and
    // every public message, for /contained/nominations.
    if (mode === 'leaderboard') {
      const [{ data: noms, error: nomsError }, { data: votes, error: votesError }] = await Promise.all([
        supabase
          .from('campaign_nominations')
          .select('nominee_name, nominee_title, nominee_org, category, reason, nominator_name, created_at, is_public')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true })
          .limit(1000),
        supabase
          .from('campaign_nomination_upvotes')
          .select('nominee_key')
          .eq('project_id', project.id)
          .limit(10000),
      ]);
      if (nomsError) throw nomsError;
      if (votesError) throw votesError;

      const upvotesByKey: Record<string, number> = {};
      for (const v of votes || []) {
        upvotesByKey[v.nominee_key] = (upvotesByKey[v.nominee_key] || 0) + 1;
      }

      const byNominee: Record<string, any> = {};
      for (const n of noms || []) {
        const key = n.nominee_name.trim().toLowerCase();
        if (!byNominee[key]) {
          byNominee[key] = {
            nominee_key: key,
            nominee_name: n.nominee_name,
            nominee_title: n.nominee_title,
            nominee_org: n.nominee_org,
            category: n.category,
            first_nominated_at: n.created_at,
            messages: [],
          };
        }
        // Prefer the most complete title/org seen
        if (!byNominee[key].nominee_title && n.nominee_title) byNominee[key].nominee_title = n.nominee_title;
        if (!byNominee[key].nominee_org && n.nominee_org) byNominee[key].nominee_org = n.nominee_org;
        // Counts include pending nominations; message TEXT shows only after
        // moderation (approve on /admin/contained/flow).
        byNominee[key].total_count = (byNominee[key].total_count || 0) + 1;
        if (n.is_public) {
          byNominee[key].messages.push({
            reason: n.reason,
            nominator_name: n.nominator_name || null,
            created_at: n.created_at,
          });
        }
      }

      const leaderboard = Object.values(byNominee)
        .map((n: any) => ({
          ...n,
          nomination_count: n.total_count,
          upvotes: upvotesByKey[n.nominee_key] || 0,
        }))
        .sort(
          (a: any, b: any) =>
            b.upvotes + b.nomination_count * 2 - (a.upvotes + a.nomination_count * 2)
        );

      return NextResponse.json({ leaderboard, total: (noms || []).length });
    }

    // Default mode: summary with counts and truncated recent
    // Total count
    const { count, error: countError } = await supabase
      .from('campaign_nominations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('is_public', true);

    if (countError) throw countError;

    // Count by category
    const { data: catRows, error: catError } = await supabase
      .from('campaign_nominations')
      .select('category')
      .eq('project_id', project.id)
      .eq('is_public', true);

    if (catError) throw catError;

    const byCategory: Record<string, number> = {};
    for (const row of catRows || []) {
      byCategory[row.category] = (byCategory[row.category] || 0) + 1;
    }

    // Recent 10 nominations (public info only — no nominator details)
    const { data: recent, error: recentError } = await supabase
      .from('campaign_nominations')
      .select('nominee_name, category, reason, created_at')
      .eq('project_id', project.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    const recentNominations = (recent || []).map(
      (n: { nominee_name: string; category: string; reason: string; created_at: string }) => ({
        nominee_name: n.nominee_name,
        category: n.category,
        reason: n.reason.length > 100 ? n.reason.slice(0, 100) + '...' : n.reason,
        created_at: n.created_at,
      })
    );

    return NextResponse.json({
      count: count || 0,
      byCategory,
      recent: recentNominations,
    });
  } catch (error) {
    console.error('Nominations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch nominations' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[slug]/nominations
 * Public: submit a nomination. No auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    const project = await resolveProject(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      nominee_name,
      nominee_title,
      nominee_org,
      category,
      reason,
      nominator_name,
      nominator_email,
      honeypot,
      turnstile_token,
    } = body;

    // Honeypot — bots fill the hidden field. Return a success shape with no
    // insert so the bot cannot distinguish a block from a real submission.
    if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, count: 0 }, { status: 200 });
    }

    // Bot verification (Cloudflare Turnstile). Skipped in dev when no secret set.
    const turnstileValid = await verifyTurnstileToken(turnstile_token);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Bot verification failed. Please try again.' },
        { status: 403 }
      );
    }

    // Rate limit: ~5 nominations per IP per hour.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const limit = checkRateLimit(`nominations:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many nominations from this connection. Please try again later.' },
        { status: 429 }
      );
    }

    if (!nominee_name || !category || !reason) {
      return NextResponse.json(
        { error: 'nominee_name, category, and reason are required' },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (reason.length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (nominator_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nominator_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { error } = await supabase.from('campaign_nominations').insert({
      project_id: project.id,
      nominee_name: nominee_name.trim(),
      nominee_title: nominee_title?.trim() || null,
      nominee_org: nominee_org?.trim() || null,
      category,
      reason: reason.trim(),
      nominator_name: nominator_name?.trim() || null,
      nominator_email: nominator_email?.trim().toLowerCase() || null,
      // Moderation gate: messages publish after human review (approve on
      // /admin/contained/flow). Counts include pending so pressure ticks live.
      is_public: false,
    });

    if (error) throw error;

    // Sync nominator to GHL if they provided email
    if (nominator_email) {
      const ghl = getGHLClient();
      if (ghl.isConfigured()) {
        ghl.upsertContact({
          email: nominator_email.trim().toLowerCase(),
          name: nominator_name?.trim() || '',
          // Nominator is a supporter taking an action (R4 canonical; RC1).
          tags: [
            GHL_CANONICAL.PROJECT_JH,
            GHL_CANONICAL.SOURCE_EVENT_CONTAINED,
            GHL_CANONICAL.INTEREST_JUSTICE_REFORM,
            GHL_CANONICAL.ROLE_SUPPORTER,
          ],
          source: 'JusticeHub CONTAINED Nomination',
          customFields: {
            nominated_person: nominee_name.trim(),
            nomination_category: category,
          },
        })
          .then((contactId) => {
            // Nominators are warm — surface them on the Engagement board.
            if (!contactId) return;
            return ghl.ensureOpportunity({
              pipelineId: CONTAINED_PIPELINES.CONTAINED_ENGAGEMENT.id,
              pipelineStageId: CONTAINED_PIPELINES.CONTAINED_ENGAGEMENT.stageIdentified,
              contactId,
              name: `${nominator_name?.trim() || nominator_email.trim().toLowerCase()} — nominator`,
            });
          })
          .catch(console.error); // fire-and-forget
      }
    }

    const cleanNomineeName = nominee_name.trim();
    const cleanNomineeTitle = nominee_title?.trim() || null;
    const cleanNomineeOrg = nominee_org?.trim() || null;
    const cleanNominatorName = nominator_name?.trim() || null;
    const cleanNominatorEmail = nominator_email?.trim().toLowerCase() || null;
    const cleanReason = reason.trim();

    // Notification 1 — confirmation to the nominator (only if they left an
    // email). Fire-and-forget; never blocks the response. Adapted from the
    // orphaned /api/contained/nominations template. No site/venue language —
    // the nominee gets a personal invite from a relationship owner, not us.
    if (cleanNominatorEmail) {
      // Per-nominee count for the "pressure is building" line.
      const { count: nomineeCount } = await supabase
        .from('campaign_nominations')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .ilike('nominee_name', cleanNomineeName);
      sendEmail({
        to: cleanNominatorEmail,
        ...nominatorReceipt({
          nominatorName: cleanNominatorName || 'friend',
          nomineeName: cleanNomineeName,
          nomineeTitle: cleanNomineeTitle,
          nomineeOrg: cleanNomineeOrg,
          reason: cleanReason,
          nominationCount: nomineeCount || 1,
        }),
      }).catch((err) => console.error('Failed to send nominator confirmation:', err));
    }

    // Notification 2 — internal alert to the team on EVERY nomination.
    // Fire-and-forget; never blocks the response. The nominee is never emailed.
    sendEmail({
      to: TEAM_EMAIL,
      subject: `[CONTAINED] New nomination: ${cleanNomineeName}`,
      preheader: `${cleanNominatorName || 'Someone'} nominated ${cleanNomineeName}.`,
      body: `New CONTAINED nomination.

Nominee: ${cleanNomineeName}${cleanNomineeTitle ? `, ${cleanNomineeTitle}` : ''}${cleanNomineeOrg ? ` (${cleanNomineeOrg})` : ''}
Category: ${category}
Reason: ${cleanReason}

Nominator: ${cleanNominatorName || '(anonymous)'}${cleanNominatorEmail ? ` <${cleanNominatorEmail}>` : ''}

Review: ${SITE}/admin/contained`,
    }).catch((err) => console.error('Failed to send team nomination alert:', err));

    // Return updated count (includes pending — the pressure number is live)
    const { count } = await supabase
      .from('campaign_nominations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id);

    return NextResponse.json({ success: true, count: count || 0 }, { status: 201 });
  } catch (error) {
    console.error('Nominations POST error:', error);
    return NextResponse.json({ error: 'Failed to submit nomination' }, { status: 500 });
  }
}
