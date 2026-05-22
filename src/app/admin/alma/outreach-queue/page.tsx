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
  const { data: candidates, error: candidatesErr } = await supabase
    .from('alma_org_enrichment_candidates')
    .select(`
      id, organization_id, source, extracted_fields, confidence, status, provenance, created_at
    `)
    .eq('source', 'website_scrape')
    .in('status', ['pending_review', 'pending_data_repair'])
    .order('confidence', { ascending: false, nullsFirst: false })
    .limit(1000);
  if (candidatesErr) console.error('[outreach-queue] candidates fetch failed:', candidatesErr.message);

  const entityIds = Array.from(new Set((candidates || []).map((c: any) => c.organization_id)));
  let orgsById: Record<string, any> = {};
  let claimsByOrgId: Record<string, any> = {};
  let outreachByOrgId: Record<string, any> = {};

  // Chunk .in() into batches of 100 — supabase-js sends as a GET querystring
  // and URLs > ~16KB fail silently (returns no rows, no error).
  async function fetchInChunks<T>(ids: string[], fetcher: (chunk: string[]) => Promise<{ data: T[] | null }>) {
    const out: T[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data } = await fetcher(ids.slice(i, i + 100));
      if (data) out.push(...data);
    }
    return out;
  }

  if (entityIds.length > 0) {
    const [orgs, claims, outreach] = await Promise.all([
      fetchInChunks<any>(entityIds, (ids) =>
        supabase
          .from('organizations')
          .select(
            'id, name, slug, state, suburb, city, is_indigenous_org, profile_completeness_score, profile_completeness_breakdown, featured_on_map, website_url, website, logo_url, email, contact_email, phone, history_summary, annual_report_url'
          )
          .in('id', ids)
      ),
      fetchInChunks<any>(entityIds, (ids) =>
        supabase
          .from('organization_claims')
          .select('organization_id, status, contact_name, contact_email, created_at')
          .in('organization_id', ids)
          .order('created_at', { ascending: false })
      ),
      fetchInChunks<any>(entityIds, (ids) =>
        supabase
          .from('organization_outreach_log')
          .select('organization_id, attempt_kind, response_status, sent_at')
          .in('organization_id', ids)
          .order('sent_at', { ascending: false })
      ),
    ]);

    for (const o of orgs) orgsById[o.id] = o;
    for (const c of claims) {
      if (!claimsByOrgId[c.organization_id]) claimsByOrgId[c.organization_id] = c;
    }
    for (const r of outreach) {
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
        currentHistory: org.history_summary || null,
        currentAnnualReport: org.annual_report_url || null,
        extractedFields: c.extracted_fields || {},
        candidateConfidence: c.confidence !== null ? Number(c.confidence) : null,
        candidateCreatedAt: c.created_at,
        provenance: c.provenance || null,
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
