import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

/**
 * GET /api/admin/contained/crm
 * Merges contacts from 6 supporter tables into a unified view.
 * Admin-only.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all 6 tables in parallel
    const [
      newsletterRes,
      registrationsRes,
      nominationsRes,
      backersRes,
      reactionsRes,
      tourStoriesRes,
    ] = await Promise.all([
      supabase.from('newsletter_subscriptions').select('email, full_name, source, created_at, is_active, ghl_contact_id'),
      supabase.from('event_registrations').select('email, full_name, organization, registration_status, metadata, created_at, ghl_contact_id'),
      supabase.from('campaign_nominations').select('nominator_email, nominator_name, nominee_name, category, created_at'),
      supabase.from('project_backers').select('name, email, message, amount, created_at'),
      supabase.from('tour_reactions').select('name, email, rating, reaction, role, created_at'),
      supabase.from('tour_stories').select('name, email, tour_stop, status, created_at'),
    ]);

    // Build unified contacts map (keyed by email)
    const contacts = new Map<string, {
      email: string;
      name: string;
      organization: string | null;
      activities: string[];
      ghl_synced: boolean;
      first_seen: string;
      last_seen: string;
    }>();

    function upsert(email: string | null, name: string | null, activity: string, date: string | null, org?: string | null, ghlId?: string | null) {
      if (!email) return;
      const key = email.toLowerCase();
      const existing = contacts.get(key);
      const ts = date || new Date().toISOString();
      if (existing) {
        if (!existing.activities.includes(activity)) existing.activities.push(activity);
        if (name && !existing.name) existing.name = name;
        if (org && !existing.organization) existing.organization = org;
        if (ghlId) existing.ghl_synced = true;
        if (ts < existing.first_seen) existing.first_seen = ts;
        if (ts > existing.last_seen) existing.last_seen = ts;
      } else {
        contacts.set(key, {
          email: key,
          name: name || '',
          organization: org || null,
          activities: [activity],
          ghl_synced: !!ghlId,
          first_seen: ts,
          last_seen: ts,
        });
      }
    }

    // Process each source
    for (const s of newsletterRes.data || []) {
      upsert(s.email, s.full_name, 'newsletter', s.created_at, null, s.ghl_contact_id);
    }
    for (const r of registrationsRes.data || []) {
      upsert(r.email, r.full_name, 'event-registration', r.created_at, r.organization, r.ghl_contact_id);
    }
    for (const n of nominationsRes.data || []) {
      upsert(n.nominator_email, n.nominator_name, 'nominator', n.created_at);
    }
    for (const b of backersRes.data || []) {
      upsert(b.email, b.name, 'backer', b.created_at);
    }
    for (const r of reactionsRes.data || []) {
      upsert(r.email, r.name, 'reaction', r.created_at);
    }
    for (const t of tourStoriesRes.data || []) {
      upsert(t.email, t.name, 'tour-story', t.created_at);
    }

    // Build summary
    const contactList = Array.from(contacts.values())
      .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());

    const summary = {
      total_contacts: contactList.length,
      newsletter: (newsletterRes.data || []).length,
      registrations: (registrationsRes.data || []).length,
      nominations: (nominationsRes.data || []).length,
      backers: (backersRes.data || []).length,
      reactions: (reactionsRes.data || []).length,
      tour_stories: (tourStoriesRes.data || []).length,
      ghl_synced: contactList.filter(c => c.ghl_synced).length,
    };

    return NextResponse.json({ summary, contacts: contactList });
  } catch (error) {
    console.error('CRM GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
