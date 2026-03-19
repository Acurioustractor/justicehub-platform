import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sendEmail } from '@/lib/email/send';

const SITE = 'https://justicehub.com.au';

// Pipeline stages — ordered progression
const PIPELINE_STAGES = [
  'cold',       // Identified, no contact yet
  'warm',       // Expressed interest or nominated
  'proposal',   // Sent proposal / in discussion
  'committed',  // Verbally or formally committed
  'active',     // Actively supporting (funding, hosting, etc.)
  'stale',      // Was warm/proposal but went quiet (30+ days)
] as const;

type PipelineStage = typeof PIPELINE_STAGES[number];

// Auto follow-up templates per stage
const FOLLOW_UP_TEMPLATES: Partial<Record<PipelineStage, { subject: string; body: string; days: number }>> = {
  warm: {
    days: 7,
    subject: 'Following up — THE CONTAINED',
    body: `Hey {{name}},

Just a quick follow-up on THE CONTAINED. I know you expressed interest and wanted to make sure you had everything you needed.

Quick recap: THE CONTAINED is a shipping container experience that shows what youth detention looks like in Australia — and what 876 verified community programs can do instead. Three rooms. Thirty minutes. Evidence you can feel.

We're currently booking tour stops and looking for hosting partners, funders, and community connectors.

Would be great to grab 15 minutes to chat about what that could look like with you involved.

No pressure. Just a conversation.

— Ben
JusticeHub`,
  },
  proposal: {
    days: 14,
    subject: 'Checking in — CONTAINED partnership',
    body: `Hey {{name}},

Wanted to check in on our conversation about THE CONTAINED. I know these things take time on your end, so no rush.

Just wanted to flag that we're finalising the tour schedule and would love to have you part of it.

Happy to jump on a call whenever suits, or answer any questions via email.

— Ben
JusticeHub`,
  },
  stale: {
    days: 30,
    subject: 'Still thinking about THE CONTAINED?',
    body: `Hey {{name}},

It's been a while since we chatted about THE CONTAINED. I know timing is everything.

Just wanted to let you know the tour is still happening, the evidence is still growing, and we'd still love to have you involved — in whatever capacity makes sense.

No pressure at all. If the timing isn't right, I totally understand. But if you're still interested, I'm here.

→ See what's new: ${SITE}/contained

— Ben
JusticeHub`,
  },
};

/**
 * GET /api/admin/partner-pipeline
 *
 * Returns the current partner pipeline grouped by stage,
 * with follow-up reminders for overdue contacts.
 * Admin-only.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient() as any;

    // Check admin auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCron = authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
      // Check for session-based admin auth
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get all pipeline entities
    const { data: entities, error } = await supabase
      .from('campaign_alignment_entities')
      .select('id, name, entity_type, position, organization, email, alignment_category, outreach_status, alignment_signals, updated_at')
      .not('outreach_status', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Pipeline] Query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Map outreach_status to pipeline stages
    const pipeline: Record<string, any[]> = {};
    for (const stage of PIPELINE_STAGES) {
      pipeline[stage] = [];
    }

    const now = new Date();
    const followUpNeeded: any[] = [];

    for (const entity of (entities || [])) {
      const stage = mapStatusToStage(entity.outreach_status);
      pipeline[stage].push(entity);

      // Check if follow-up is overdue
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(entity.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const template = FOLLOW_UP_TEMPLATES[stage];
      if (template && daysSinceUpdate >= template.days && entity.email) {
        followUpNeeded.push({
          ...entity,
          stage,
          days_overdue: daysSinceUpdate - template.days,
          suggested_template: template.subject,
        });
      }

      // Auto-mark as stale if warm/proposal and 30+ days inactive
      if ((stage === 'warm' || stage === 'proposal') && daysSinceUpdate >= 30) {
        pipeline.stale.push(entity);
      }
    }

    const summary = {
      total: entities?.length || 0,
      by_stage: Object.fromEntries(
        PIPELINE_STAGES.map(s => [s, pipeline[s].length])
      ),
      follow_ups_needed: followUpNeeded.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      pipeline,
      follow_up_needed: followUpNeeded,
    });
  } catch (error: any) {
    console.error('[Pipeline] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/partner-pipeline
 *
 * Actions on the pipeline:
 * - advance: Move entity to next stage
 * - follow_up: Send follow-up email
 * - add: Add new entity to pipeline
 * - note: Add a note to entity's alignment_signals
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entity_id, data } = body;

    const supabase = createServiceClient() as any;

    switch (action) {
      case 'advance': {
        if (!entity_id || !data?.stage) {
          return NextResponse.json({ error: 'entity_id and stage required' }, { status: 400 });
        }

        const outreachStatus = mapStageToStatus(data.stage);
        const { error } = await supabase
          .from('campaign_alignment_entities')
          .update({
            outreach_status: outreachStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entity_id);

        if (error) {
          return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, new_stage: data.stage });
      }

      case 'follow_up': {
        if (!entity_id) {
          return NextResponse.json({ error: 'entity_id required' }, { status: 400 });
        }

        // Get entity
        const { data: entity, error } = await supabase
          .from('campaign_alignment_entities')
          .select('*')
          .eq('id', entity_id)
          .single();

        if (error || !entity) {
          return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }

        if (!entity.email) {
          return NextResponse.json({ error: 'No email for this entity' }, { status: 400 });
        }

        const stage = mapStatusToStage(entity.outreach_status);
        const template = FOLLOW_UP_TEMPLATES[stage];

        if (!template) {
          return NextResponse.json({ error: `No follow-up template for stage: ${stage}` }, { status: 400 });
        }

        const emailBody = (data?.custom_message || template.body)
          .replace(/\{\{name\}\}/g, entity.name || 'there');

        const result = await sendEmail({
          to: entity.email,
          subject: data?.custom_subject || template.subject,
          body: emailBody,
          replyTo: 'ben@justicehub.com.au',
        });

        if (!result) {
          return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
        }

        // Record the follow-up in alignment_signals
        const signals = entity.alignment_signals || {};
        const followUps = signals.follow_ups || [];
        followUps.push({
          sent_at: new Date().toISOString(),
          template: template.subject,
          stage,
        });

        await supabase
          .from('campaign_alignment_entities')
          .update({
            alignment_signals: { ...signals, follow_ups: followUps },
            updated_at: new Date().toISOString(),
          })
          .eq('id', entity_id);

        // Sync to GHL
        const ghl = getGHLClient();
        if (ghl.isConfigured()) {
          ghl.upsertContact({
            email: entity.email,
            name: entity.name,
            tags: [GHL_TAGS.PARTNER, GHL_TAGS.CONTAINED],
            source: 'JusticeHub Partner Pipeline',
          }).catch(err => console.error('[Pipeline] GHL sync error:', err));
        }

        return NextResponse.json({ success: true, email_sent: true });
      }

      case 'add': {
        if (!data?.name) {
          return NextResponse.json({ error: 'name required' }, { status: 400 });
        }

        const { data: entity, error } = await supabase
          .from('campaign_alignment_entities')
          .insert({
            name: data.name,
            entity_type: data.entity_type || 'individual',
            position: data.position || null,
            organization: data.organization || null,
            email: data.email || null,
            alignment_category: data.category || 'supporter',
            outreach_status: mapStageToStatus(data.stage || 'cold'),
            alignment_signals: {
              pipeline_created: new Date().toISOString(),
              source: data.source || 'manual',
              notes: data.notes ? [{ text: data.notes, date: new Date().toISOString() }] : [],
            },
          })
          .select('id')
          .single();

        if (error) {
          console.error('[Pipeline] Insert error:', error);
          return NextResponse.json({ error: 'Failed to add entity' }, { status: 500 });
        }

        return NextResponse.json({ success: true, entity_id: entity?.id });
      }

      case 'note': {
        if (!entity_id || !data?.note) {
          return NextResponse.json({ error: 'entity_id and note required' }, { status: 400 });
        }

        const { data: entity } = await supabase
          .from('campaign_alignment_entities')
          .select('alignment_signals')
          .eq('id', entity_id)
          .single();

        const signals = entity?.alignment_signals || {};
        const notes = signals.notes || [];
        notes.push({ text: data.note, date: new Date().toISOString() });

        const { error } = await supabase
          .from('campaign_alignment_entities')
          .update({
            alignment_signals: { ...signals, notes },
            updated_at: new Date().toISOString(),
          })
          .eq('id', entity_id);

        if (error) {
          return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Pipeline] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Map outreach_status values to pipeline stages
 */
function mapStatusToStage(status: string): PipelineStage {
  const map: Record<string, PipelineStage> = {
    'not_started': 'cold',
    'identified': 'cold',
    'nominated': 'warm',
    'contacted': 'warm',
    'in_discussion': 'proposal',
    'proposal_sent': 'proposal',
    'committed': 'committed',
    'active': 'active',
    'engaged': 'active',
    'stale': 'stale',
    'declined': 'stale',
  };
  return map[status] || 'cold';
}

/**
 * Map pipeline stage back to outreach_status
 */
function mapStageToStatus(stage: string): string {
  const map: Record<string, string> = {
    cold: 'not_started',
    warm: 'contacted',
    proposal: 'proposal_sent',
    committed: 'committed',
    active: 'active',
    stale: 'stale',
  };
  return map[stage] || 'not_started';
}
