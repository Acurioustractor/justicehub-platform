import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { checkOrgAccess } from '@/lib/org-hub/auth';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
    const serviceClient = getServiceClient();
    const now = new Date();

    const sb = supabase as any;
    const { data: docs, error } = await sb
      .from('org_compliance_docs')
      .select('*')
      .eq('organization_id', orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const updates: any[] = [];
    const actionItems: any[] = [];

    for (const doc of docs || []) {
      let newStatus = doc.status;

      if (!doc.expiry_date) {
        // No expiry date — keep current status or mark as not_started if no document
        if (!doc.document_url && doc.status !== 'in_progress') {
          newStatus = 'not_started';
        }
      } else {
        const expiry = new Date(doc.expiry_date);
        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const reminderDays = doc.reminder_days || 30;

        if (daysUntil < 0) {
          newStatus = 'expired';
        } else if (daysUntil <= reminderDays) {
          newStatus = 'expiring';
        } else {
          newStatus = 'current';
        }
      }

      if (newStatus !== doc.status) {
        updates.push({ id: doc.id, status: newStatus });

        if (newStatus === 'expired' || newStatus === 'expiring') {
          actionItems.push({
            organization_id: orgId,
            item_type: 'compliance',
            title: `${newStatus === 'expired' ? 'EXPIRED' : 'Expiring'}: ${doc.title}`,
            description: `${doc.title} (${doc.category}) status changed to ${newStatus}.`,
            priority: newStatus === 'expired' ? 'urgent' : 'high',
            due_date: doc.expiry_date,
            source_agent: 'compliance_check',
            link_to_table: 'org_compliance_docs',
            link_to_id: doc.id,
          });
        }
      }
    }

    // Apply status updates
    for (const update of updates) {
      await serviceClient
        .from('org_compliance_docs')
        .update({ status: update.status })
        .eq('id', update.id);
    }

    // Clear old compliance_check items and insert new ones
    await serviceClient
      .from('org_action_items')
      .delete()
      .eq('organization_id', orgId)
      .eq('source_agent', 'compliance_check')
      .in('status', ['open']);

    if (actionItems.length > 0) {
      await serviceClient.from('org_action_items').insert(actionItems);
    }

    return NextResponse.json({
      success: true,
      docsChecked: (docs || []).length,
      statusUpdates: updates.length,
      actionItemsCreated: actionItems.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
