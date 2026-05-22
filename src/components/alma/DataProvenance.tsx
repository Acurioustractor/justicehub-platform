import { createServiceClient } from '@/lib/supabase/service';

interface FieldProvenance {
  field: string;
  source: string;
  detail?: string;
  when?: string;
}

interface Props {
  orgId: string;
}

/**
 * Server-side component that fetches and renders per-field provenance for
 * an org. Designed to live in the footer of an org page as a quiet
 * expandable so curious / sceptical users can see how the data was
 * assembled without dominating the visual hierarchy.
 *
 * Renders nothing when no provenance signals exist — first-touch orgs
 * with raw ACNC-only data shouldn't get an empty section.
 */
export async function DataProvenance({ orgId }: Props) {
  const supabase = createServiceClient() as any;

  const [candidateRes, claimRes, orgRes] = await Promise.all([
    supabase
      .from('alma_org_enrichment_candidates')
      .select('extracted_fields, provenance, confidence, reviewed_at, status')
      .eq('organization_id', orgId)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('organization_claims')
      .select('status, contact_name, verified_at, created_at')
      .eq('organization_id', orgId)
      .in('status', ['verified', 'community_verified'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('organizations')
      .select('acnc_data, updated_at')
      .eq('id', orgId)
      .single(),
  ]);

  const candidate = candidateRes.data;
  const claim = claimRes.data;
  const org = orgRes.data;
  const acnc = (org?.acnc_data || {}) as Record<string, any>;

  const lines: FieldProvenance[] = [];

  // Claim
  if (claim) {
    lines.push({
      field: 'Claim status',
      source: claim.status === 'verified' ? 'Verified by admin' : 'Verified by community',
      detail: claim.contact_name ? `Contact: ${claim.contact_name}` : undefined,
      when: claim.verified_at || claim.created_at,
    });
  }

  // ACNC register
  if (acnc?.website_enriched_at || acnc?.mission_statement) {
    lines.push({
      field: 'Mission / services',
      source: 'ACNC register + AI website extraction',
      when: acnc.website_enriched_at,
    });
  }

  // Approved enrichment candidate
  if (candidate) {
    const prov = candidate.provenance || {};
    const ext = candidate.extracted_fields || {};
    const provider = prov.llm_provider || 'unknown LLM';
    const autoMarker = prov.auto_approved_by;
    const ourFields = [
      ext.contact_email ? 'email' : null,
      ext.contact_phone ? 'phone' : null,
      ext.logo_url ? 'logo' : null,
      ext.history_summary ? 'history' : null,
      ext.annual_report_url ? 'annual report link' : null,
    ].filter(Boolean);

    if (ourFields.length > 0) {
      lines.push({
        field: ourFields.join(', '),
        source: autoMarker ? `Auto-approved (${provider})` : `Reviewed by admin (${provider})`,
        detail:
          typeof candidate.confidence === 'number'
            ? `Confidence ${Math.round(candidate.confidence * 100)}%`
            : undefined,
        when: candidate.reviewed_at,
      });
    }
  }

  // Annual report deep-extract
  if (acnc?.annual_report_facts) {
    const facts = acnc.annual_report_facts;
    lines.push({
      field: 'Annual report facts',
      source: `Extracted from PDF${facts.extractor?.provider ? ` via ${facts.extractor.provider}` : ''}`,
      detail: facts.report_year ? `FY${facts.report_year}` : undefined,
      when: facts.extracted_at,
    });
  }

  // Funder discovery
  if (acnc?.discovered_funder_mentions) {
    const fd = acnc.discovered_funder_mentions;
    lines.push({
      field: 'Funder mentions',
      source: 'Cross-referenced against ALMA org index',
      detail: `${fd.matched || 0} of ${fd.total || 0} matched to known orgs`,
      when: fd.run_at,
    });
  }

  if (lines.length === 0) return null;

  return (
    <details className="max-w-5xl mx-auto px-6 py-8 text-xs text-[#0A0A0A]/60">
      <summary
        className="cursor-pointer text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/40 hover:text-[#0A0A0A]/70"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        Where does this data come from?
      </summary>
      <div className="mt-3 bg-white border border-[#0A0A0A]/10 rounded p-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-[#0A0A0A]/40 border-b border-[#0A0A0A]/5">
              <th className="py-1.5 pr-3">Field</th>
              <th className="py-1.5 pr-3">Source</th>
              <th className="py-1.5 pr-3">Detail</th>
              <th className="py-1.5">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A0A0A]/5">
            {lines.map((line, i) => (
              <tr key={i} className="align-top">
                <td className="py-1.5 pr-3 font-semibold">{line.field}</td>
                <td className="py-1.5 pr-3">{line.source}</td>
                <td
                  className="py-1.5 pr-3 text-[#0A0A0A]/60"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {line.detail || '—'}
                </td>
                <td
                  className="py-1.5 text-[#0A0A0A]/40 text-[10px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {line.when ? new Date(line.when).toLocaleDateString('en-AU') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-[#0A0A0A]/40 mt-3 leading-relaxed">
          JusticeHub assembles org profiles from multiple sources: public registers (ACNC), AI extraction
          from the org's own website, deep-extract of annual reports, and direct claims from the org.
          Every field carries its provenance so you can judge how to trust it. If something looks
          wrong, the org can claim their entry and edit it directly.
        </p>
      </div>
    </details>
  );
}
