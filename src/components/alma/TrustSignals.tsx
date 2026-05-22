import { createServiceClient } from '@/lib/supabase/service';
import { CheckCircle2, ShieldCheck, Globe, FileText, Clock } from 'lucide-react';

interface Props {
  orgId: string;
}

/**
 * Trust strip — small row of signals that tell a visitor how to weight
 * what they're reading on an org page. Lives just under the hero.
 *
 * Signal tiers, in order of trust:
 *   1. Community-claimed + verified  (strongest — the org confirmed it)
 *   2. AI-extracted from website     (medium — checked by admin, but second-hand)
 *   3. From public register only     (weakest — ACNC seed, no enrichment)
 *
 * Plus freshness pills:
 *   - Last enriched N days ago
 *   - Annual report year (when present)
 */
export async function TrustSignals({ orgId }: Props) {
  const supabase = createServiceClient() as any;

  const [claimRes, candidateRes, orgRes] = await Promise.all([
    supabase
      .from('organization_claims')
      .select('status, verified_at')
      .eq('organization_id', orgId)
      .in('status', ['verified', 'community_verified'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('alma_org_enrichment_candidates')
      .select('reviewed_at, provenance')
      .eq('organization_id', orgId)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('organizations')
      .select('acnc_data, website_url, website, logo_url')
      .eq('id', orgId)
      .single(),
  ]);

  const claim = claimRes.data;
  const candidate = candidateRes.data;
  const org = orgRes.data;
  const acnc = (org?.acnc_data || {}) as Record<string, any>;

  // Determine trust tier
  let tier: 'claimed' | 'ai_extracted' | 'register' = 'register';
  if (claim) tier = 'claimed';
  else if (candidate) tier = 'ai_extracted';

  const signals: Array<{ icon: React.ReactNode; label: string; tone: string; title?: string }> = [];

  if (tier === 'claimed') {
    signals.push({
      icon: <ShieldCheck className="w-3 h-3" />,
      label: 'Claimed by org',
      tone: 'bg-[#059669]/10 text-[#059669] border-[#059669]/30',
      title: `Verified ${claim.verified_at ? new Date(claim.verified_at).toLocaleDateString('en-AU') : ''}`,
    });
  } else if (tier === 'ai_extracted') {
    signals.push({
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'AI-extracted, admin-reviewed',
      tone: 'bg-amber-100 text-amber-700 border-amber-300',
      title: 'Contact details and history extracted from the org\'s own website',
    });
  } else {
    signals.push({
      icon: <Globe className="w-3 h-3" />,
      label: 'From public register',
      tone: 'bg-[#0A0A0A]/5 text-[#0A0A0A]/60 border-[#0A0A0A]/15',
      title: 'Seeded from ACNC charity register; no enrichment yet',
    });
  }

  // Freshness
  if (candidate?.reviewed_at) {
    const days = Math.floor(
      (Date.now() - new Date(candidate.reviewed_at).getTime()) / 86400_000
    );
    const fresh = days < 60;
    const stale = days > 180;
    signals.push({
      icon: <Clock className="w-3 h-3" />,
      label: fresh
        ? `Enriched ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}`
        : stale
        ? `Last enriched ${Math.floor(days / 30)} months ago`
        : `Enriched ${Math.floor(days / 7)} weeks ago`,
      tone: fresh
        ? 'bg-[#059669]/5 text-[#059669] border-[#059669]/15'
        : stale
        ? 'bg-[#DC2626]/5 text-[#DC2626] border-[#DC2626]/15'
        : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/60 border-[#0A0A0A]/15',
    });
  }

  // Annual report year (signals depth of profile)
  const annualYear = acnc?.annual_report_facts?.report_year;
  if (annualYear) {
    const currentYear = new Date().getFullYear();
    const lag = currentYear - annualYear;
    signals.push({
      icon: <FileText className="w-3 h-3" />,
      label: `Annual report ${annualYear}`,
      tone:
        lag <= 1
          ? 'bg-[#059669]/5 text-[#059669] border-[#059669]/15'
          : lag <= 3
          ? 'bg-amber-100 text-amber-700 border-amber-200'
          : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/60 border-[#0A0A0A]/15',
    });
  }

  if (signals.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/40"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Trust signals
        </span>
        {signals.map((s, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${s.tone}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            title={s.title}
          >
            {s.icon}
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
