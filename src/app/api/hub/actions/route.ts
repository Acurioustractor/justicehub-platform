import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

const VALID_ACTION_TYPES = [
  'mp_letter',
  'social_share',
  'event_registration',
  'org_claim',
  'story_read',
  'funding_explored',
  'page_shared',
] as const;

/**
 * GET /api/hub/actions
 *
 * Returns the current user's action summary (counts by type) and recent actions.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  // Get all actions for this user
  const { data: actions, error } = await (service as any)
    .from('member_actions')
    .select('action_type, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Actions] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }

  // Aggregate counts by type
  const counts: Record<string, number> = {};
  for (const action of actions || []) {
    counts[action.action_type] = (counts[action.action_type] || 0) + 1;
  }

  return NextResponse.json({
    counts,
    total: (actions || []).length,
    recent: (actions || []).slice(0, 10),
  });
}

/**
 * POST /api/hub/actions
 *
 * Records a new engagement action for the current user.
 * Body: { action_type: string, metadata?: object }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action_type, metadata } = body;

  if (!action_type || !VALID_ACTION_TYPES.includes(action_type)) {
    return NextResponse.json(
      { error: `Invalid action_type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data, error } = await (service as any)
    .from('member_actions')
    .insert({
      user_id: user.id,
      action_type,
      metadata: metadata || {},
    })
    .select('id, action_type, created_at')
    .single();

  if (error) {
    console.error('[Actions] Insert error:', error);
    return NextResponse.json({ error: 'Failed to record action' }, { status: 500 });
  }

  // Fire-and-forget: sync engagement tags to GHL
  syncEngagementTags(user.id, action_type, service).catch(err =>
    console.error('[Actions] GHL sync error (non-blocking):', err)
  );

  return NextResponse.json({ success: true, action: data });
}

/**
 * Check action counts and add engagement tags to GHL contact.
 * Runs after each action insert — non-blocking.
 */
async function syncEngagementTags(userId: string, actionType: string, supabase: any) {
  // Get GHL contact ID from profile
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('metadata, role_tags')
    .eq('user_id', userId)
    .single();

  const ghlContactId = profile?.metadata?.ghl_contact_id;
  if (!ghlContactId) return;

  const ghl = getGHLClient();
  if (!ghl.isConfigured()) return;

  const roleTags: string[] = profile?.role_tags || [];
  const tagsToAdd: string[] = [];

  // Immediate engagement tags based on action type
  if (actionType === 'org_claim') {
    tagsToAdd.push(GHL_TAGS.ORG_CLAIMED);
  }
  if (actionType === 'mp_letter') {
    tagsToAdd.push(GHL_TAGS.WROTE_MP, GHL_TAGS.ACTIVE_SUPPORTER);
  }

  // Threshold-based engagement tags — check action counts
  const { count } = await supabase
    .from('member_actions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const totalActions = count || 0;

  if (totalActions >= 3) {
    // Add role-specific engagement tag
    if (roleTags.includes('contained_organization')) tagsToAdd.push(GHL_TAGS.ACTIVE_ORG);
    if (roleTags.includes('contained_media')) tagsToAdd.push(GHL_TAGS.ENGAGED_MEDIA);
    if (roleTags.includes('contained_funder')) tagsToAdd.push(GHL_TAGS.ENGAGED_FUNDER);
    if (roleTags.includes('contained_lived_experience')) tagsToAdd.push(GHL_TAGS.ACTIVE_PEER);
    if (roleTags.includes('contained_supporter') && !tagsToAdd.includes(GHL_TAGS.ACTIVE_SUPPORTER)) {
      tagsToAdd.push(GHL_TAGS.ACTIVE_SUPPORTER);
    }
  }

  if (tagsToAdd.length > 0) {
    await ghl.addTags(ghlContactId, tagsToAdd);
  }
}
