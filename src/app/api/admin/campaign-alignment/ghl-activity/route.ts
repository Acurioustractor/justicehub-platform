import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient } from '@/lib/ghl/client';

/**
 * GET /api/admin/campaign-alignment/ghl-activity?entityId=X
 * Pull GHL conversation history for a single entity
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const entityId = request.nextUrl.searchParams.get('entityId');
    if (!entityId) return NextResponse.json({ error: 'entityId required' }, { status: 400 });

    const service = createServiceClient();
    const { data: entity } = await service
      .from('campaign_alignment_entities')
      .select('ghl_contact_id, name, email')
      .eq('id', entityId)
      .single();

    if (!entity?.ghl_contact_id) {
      return NextResponse.json({ activity: [], contact: null, message: 'No GHL contact linked' });
    }

    const ghl = getGHLClient();
    const GHL_API_BASE = 'https://services.leadconnectorhq.com';
    const apiKey = process.env.GHL_API_KEY || '';

    // Pull contact details, conversations, notes, and tasks in parallel
    const [contact, conversations, notesRes, tasksRes] = await Promise.all([
      ghl.getContact(entity.ghl_contact_id),
      ghl.getContactConversations(entity.ghl_contact_id),
      fetch(`${GHL_API_BASE}/contacts/${entity.ghl_contact_id}/notes`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Version: '2021-07-28' },
      }).catch(() => null),
      fetch(`${GHL_API_BASE}/contacts/${entity.ghl_contact_id}/tasks`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Version: '2021-07-28' },
      }).catch(() => null),
    ]);

    // Parse notes
    let notes: Array<{ id: string; body: string; dateAdded: string }> = [];
    if (notesRes?.ok) {
      const notesData = await notesRes.json();
      notes = (notesData.notes || []).map((n: any) => ({
        id: n.id,
        body: n.body || '',
        dateAdded: n.dateAdded || '',
      }));
    }

    // Parse tasks
    let tasks: Array<{ id: string; title: string; dueDate: string; completed: boolean }> = [];
    if (tasksRes?.ok) {
      const tasksData = await tasksRes.json();
      tasks = (tasksData.tasks || []).map((t: any) => ({
        id: t.id,
        title: t.title || '',
        dueDate: t.dueDate || '',
        completed: t.completed || false,
      }));
    }

    // Pull messages from the most recent conversations (max 3)
    const recentConvos = conversations.slice(0, 3);
    const messagesPerConvo = await Promise.all(
      recentConvos.map(async (convo: any) => {
        const messages = await ghl.getConversationMessages(convo.id, 10);
        return {
          id: convo.id,
          type: convo.type,
          lastMessageDate: convo.lastMessageDate,
          messages: messages.map((m: any) => ({
            id: m.id,
            type: m.type,
            direction: m.direction,
            status: m.status,
            body: m.body || m.text || '',
            subject: m.subject || '',
            dateAdded: m.dateAdded,
          })),
        };
      })
    );

    return NextResponse.json({
      contact: contact ? {
        id: contact.id,
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        email: contact.email,
        tags: contact.tags || [],
        lastActivity: contact.lastActivity,
        dateAdded: contact.dateAdded,
      } : null,
      activity: messagesPerConvo,
      notes,
      tasks,
    });
  } catch (error) {
    console.error('GHL activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch GHL activity' }, { status: 500 });
  }
}
