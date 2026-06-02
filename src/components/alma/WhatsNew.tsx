import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { Plus, Mail, Phone, Image as ImageIcon, FileText, BookOpen } from 'lucide-react';

const FIELD_META: Record<string, { label: string; icon: React.ReactNode }> = {
  contact_email: { label: 'email', icon: <Mail className="w-3 h-3" /> },
  contact_phone: { label: 'phone', icon: <Phone className="w-3 h-3" /> },
  logo_url: { label: 'logo', icon: <ImageIcon className="w-3 h-3" /> },
  annual_report_url: { label: 'annual report', icon: <FileText className="w-3 h-3" /> },
  history_summary: { label: 'history', icon: <BookOpen className="w-3 h-3" /> },
};

/**
 * Public-facing feed of recently enriched orgs on /alma. Surfaces movement
 * so the Map doesn't feel static, and gives recently-touched orgs a reason
 * to visit ("did our claim go through?").
 *
 * Limits to last 14 days of approvals to keep the feed evergreen.
 */
async function loadWhatsNewItems(limit: number) {
  const supabase = createServiceClient() as any;

  const since = new Date(Date.now() - 14 * 86400_000).toISOString();

  const { data: candidates } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('id, organization_id, extracted_fields, reviewed_at, provenance')
    .eq('status', 'approved')
    .gte('reviewed_at', since)
    .order('reviewed_at', { ascending: false })
    .limit(limit * 2); // overpull in case some orgs are Indigenous-led (filtered out below)

  if (!candidates || candidates.length === 0) return [];

  const orgIds = Array.from(new Set(candidates.map((c: any) => c.organization_id)));
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, state, is_indigenous_org')
    .in('id', orgIds);
  const orgsById: Record<string, any> = {};
  for (const o of orgs || []) orgsById[o.id] = o;

  // Dedupe per org (only show one event per org in the feed) and filter
  // Indigenous orgs (those go through a separate cultural workflow).
  const seen = new Set<string>();
  const items = [];
  for (const c of candidates as any[]) {
    if (seen.has(c.organization_id)) continue;
    const org = orgsById[c.organization_id];
    if (!org || org.is_indigenous_org) continue;
    seen.add(c.organization_id);
    const ext = c.extracted_fields || {};
    const fieldsAdded = Object.keys(FIELD_META)
      .filter((k) => ext[k])
      .map((k) => ({ key: k, ...FIELD_META[k] }));
    items.push({
      id: c.id,
      org,
      fieldsAdded,
      isAuto: !!c.provenance?.auto_approved_by,
      reviewedAt: c.reviewed_at,
    });
    if (items.length >= limit) break;
  }

  return items;
}

const getWhatsNewItems = unstable_cache(loadWhatsNewItems, ['alma-whats-new-v1'], {
  revalidate: 300,
  tags: ['alma-whats-new'],
});

export async function WhatsNewFeed({ limit = 10 }: { limit?: number }) {
  const items = await getWhatsNewItems(limit);

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-6 border-b border-[#0A0A0A]/10">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.25em] text-[#059669]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Recently added + enriched
          </p>
          <h2
            className="text-base font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {items.length} {items.length === 1 ? 'organisation' : 'organisations'} updated in the last 14 days
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {items.map((item) => {
          const dayLabel = relativeTime(item.reviewedAt);
          return (
            <Link
              key={item.id}
              href={`/sites/${item.org.slug}`}
              className="bg-white border border-[#0A0A0A]/10 rounded p-3 hover:border-[#0A0A0A]/30 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded bg-[#F5F0E8] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#0A0A0A]/40">
                  {item.org.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{item.org.name}</p>
                  <p
                    className="text-[9px] text-[#0A0A0A]/50 mt-0.5"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {item.org.state || '—'} · {dayLabel}
                  </p>
                </div>
              </div>
              {item.fieldsAdded.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.fieldsAdded.slice(0, 3).map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/60"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {f.label}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}
