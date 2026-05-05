'use client';

import { useEffect, useState } from 'react';

interface Summary {
  programsCatalogued: number;
  strongEvidenceCount: number;
  orgsIndexed: number;
  indigenousLedOrgs: number;
  fundingTrackedBillions: number;
}

/**
 * Decision-grade stats for the Living Map of Alternatives.
 * Pulls from the same get_contained_intel_summary RPC the tour intelligence uses.
 * Each value is one SQL query away from being defended in a board meeting.
 */
export function InterventionsStatStrip() {
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    fetch('/api/intelligence/summary', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setS(d))
      .catch(() => {});
  }, []);

  const fmtFunding = (b: number) =>
    b >= 1 ? `$${b.toFixed(1)}B` : `$${(b * 1000).toFixed(0)}M`;

  const items = [
    {
      value: s ? s.programsCatalogued.toLocaleString() : '—',
      label: 'Programs catalogued',
      sub: 'From public sources',
      tooltip: 'alma_interventions where verification_status != ai_generated',
    },
    {
      value: s ? s.strongEvidenceCount.toLocaleString() : '—',
      label: 'Strong evidence',
      sub: 'Peer-citable',
      tooltip: "evidence_level IN ('Proven','Effective','Indigenous-led') AND verification_status='verified'",
    },
    {
      value: s ? s.orgsIndexed.toLocaleString() : '—',
      label: 'Organisations',
      sub: 'Delivering programs',
      tooltip: 'distinct operating_organization_id from alma_interventions',
    },
    {
      value: s ? s.indigenousLedOrgs.toLocaleString() : '—',
      label: 'Indigenous-led',
      sub: 'Community-controlled',
      tooltip: 'organizations.is_indigenous_org = true ∩ delivering YJ interventions',
    },
    {
      value: s ? fmtFunding(s.fundingTrackedBillions) : '—',
      label: 'YJ funding tracked',
      sub: 'Multi-year',
      tooltip: 'sum(amount_dollars) where alma_intervention_id is not null',
    },
  ];

  return (
    <section className="border-b-2 border-black bg-black text-white">
      <div className="container-justice py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/10">
          {items.map((it) => (
            <div
              key={it.label}
              title={it.tooltip}
              className="bg-black p-4 cursor-help group"
            >
              <div className="text-2xl md:text-3xl font-black font-mono group-hover:text-emerald-400 transition-colors">
                {it.value}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold mt-1">
                {it.label}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">
                {it.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
