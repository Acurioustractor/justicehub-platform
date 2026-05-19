import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { OutreachQueueClient, type QueueRow } from './OutreachQueueClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Outreach Queue | Australian Living Map of Alternatives | Admin',
};

export default async function OutreachQueuePage() {
  // Admin gate
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login?next=/admin/alma/outreach-queue');

  const { data: profile } = await (supabaseAuth as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/');

  const supabase = createServiceClient() as any;

  // Pull candidates with their org context.
  // Skip Indigenous-led orgs — they go through the elder-review queue.
  const { data: candidates } = await supabase
    .from('alma_org_enrichment_candidates')
    .select(`
      id, organization_id, source, extracted_fields, confidence, status, provenance, created_at
    `)
    .eq('source', 'website_scrape')
    .in('status', ['pending_review', 'pending_data_repair'])
    .order('confidence', { ascending: false, nullsFirst: false })
    .limit(200);

  const entityIds = Array.from(new Set((candidates || []).map((c: any) => c.organization_id)));
  let orgsById: Record<string, any> = {};
  let claimsByOrgId: Record<string, any> = {};
  let outreachByOrgId: Record<string, any> = {};

  if (entityIds.length > 0) {
    const [orgsRes, claimsRes, outreachRes] = await Promise.all([
      supabase
        .from('organizations')
        .select(
          'id, name, slug, state, suburb, city, is_indigenous_org, profile_completeness_score, profile_completeness_breakdown, featured_on_map, website_url, website, logo_url, email, contact_email, phone'
        )
        .in('id', entityIds),
      supabase
        .from('organization_claims')
        .select('organization_id, status, contact_name, contact_email, created_at')
        .in('organization_id', entityIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('organization_outreach_log')
        .select('organization_id, attempt_kind, response_status, sent_at')
        .in('organization_id', entityIds)
        .order('sent_at', { ascending: false }),
    ]);

    for (const o of orgsRes.data || []) orgsById[o.id] = o;
    for (const c of claimsRes.data || []) {
      if (!claimsByOrgId[c.organization_id]) claimsByOrgId[c.organization_id] = c;
    }
    for (const r of outreachRes.data || []) {
      if (!outreachByOrgId[r.organization_id]) outreachByOrgId[r.organization_id] = r;
    }
  }

  const rows: QueueRow[] = (candidates || [])
    .map((c: any) => {
      const org = orgsById[c.organization_id];
      if (!org) return null;
      if (org.is_indigenous_org) return null; // cultural-authority gate
      return {
        candidateId: c.id,
        orgId: org.id,
        orgName: org.name,
        orgSlug: org.slug,
        state: org.state,
        suburb: org.suburb,
        city: org.city,
        website: org.website_url || org.website || null,
        logoUrl: org.logo_url || null,
        completenessScore: org.profile_completeness_score
          ? Number(org.profile_completeness_score)
          : null,
        completenessBreakdown: org.profile_completeness_breakdown || null,
        currentEmail: org.contact_email || org.email || null,
        currentPhone: org.phone || null,
        extractedFields: c.extracted_fields || {},
        candidateConfidence: c.confidence !== null ? Number(c.confidence) : null,
        candidateCreatedAt: c.created_at,
        existingClaim: claimsByOrgId[org.id] || null,
        lastOutreach: outreachByOrgId[org.id] || null,
      };
    })
    .filter(Boolean) as QueueRow[];

  // Also pull priority-1 orgs that don't have candidates yet — show them as
  // "needs enrichment" so admin can run the cron against them.
  const { data: untouchedRaw } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, state, profile_completeness_score, website_url, website, is_indigenous_org, featured_on_map'
    )
    .eq('is_indigenous_org', false)
    .eq('featured_on_map', false)
    .not('website_url', 'is', null)
    .order('profile_completeness_score', { ascending: false, nullsFirst: false })
    .limit(50);

  const candidateIds = new Set(rows.map((r) => r.orgId));
  const untouched = (untouchedRaw || []).filter((o: any) => !candidateIds.has(o.id));

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <OutreachQueueClient
          rows={rows}
          untouched={untouched.map((o: any) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            state: o.state,
            score: o.profile_completeness_score ? Number(o.profile_completeness_score) : null,
            website: o.website_url || o.website,
          }))}
        />
      </main>
      <Footer />
    </div>
  );
}
