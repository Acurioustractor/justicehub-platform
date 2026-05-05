'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ExternalLink, MapPin, Building2, Award, DollarSign, Users, Loader2 } from 'lucide-react';

interface OrgDetail {
  org: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    website: string | null;
    logo_url: string | null;
    partner_tier: string | null;
  };
  registry: {
    abn: string | null;
    acn: string | null;
    state: string | null;
    postcode: string | null;
    lga: string | null;
    remoteness: string | null;
    sector: string | null;
    sub_sector: string | null;
    latest_revenue: number | null;
    latest_assets: number | null;
    financial_year: string | null;
    community_controlled: boolean;
    community_controlled_tier: string | null;
    supply_nation_certified: boolean;
    seifa_irsd_decile: number | null;
    email: string | null;
    phone: string | null;
  } | null;
  acnc: {
    charity_size: string | null;
    pbi: boolean;
    hpc: boolean;
    registration_date: string | null;
    address: string;
    website: string | null;
    purposes: string[] | null;
    beneficiaries: string[] | null;
    operating_states: string[] | null;
    beneficiary_flags: { aboriginal_tsi: boolean; youth: boolean; pre_post_release: boolean };
    is_foundation: boolean;
    is_oric_corporation: boolean;
    oric_icn: string | null;
    is_social_enterprise: boolean;
  } | null;
  geo: { locality: string | null; sa2_name: string | null; sa3_name: string | null; lga_name: string | null; remoteness: string | null } | null;
  programs: Array<{ id: string; name: string; type: string | null; evidence_level: string | null; cultural_authority: string | null; years_operating: number | null }>;
  funding: { total_dollars: number; records: number };
}

interface Props {
  orgId: string | null;
  onClose: () => void;
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function OrgDetailPanel({ orgId, onClose }: Props) {
  const [data, setData] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    setData(null);
    fetch(`/api/intelligence/orgs/${orgId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  if (!orgId) return null;

  return (
    <div
      className="fixed top-0 right-0 bottom-0 w-full md:w-[520px] bg-white z-[1000] shadow-2xl border-l-2 border-black overflow-y-auto"
      role="dialog"
      aria-label="Organisation detail"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black text-white hover:bg-red-600 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {loading && (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {data && !loading && (
        <div className="font-mono">
          {/* Header */}
          <div className="px-6 py-6 border-b-2 border-black bg-gray-50">
            <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-2">
              Organisation
            </div>
            <h2 className="text-2xl font-black tracking-tight leading-tight pr-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {data.org.name}
            </h2>
            {data.acnc && (
              <div className="flex flex-wrap gap-2 mt-3">
                {data.registry?.community_controlled && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-red-600 text-white font-bold">
                    Community-controlled{data.registry.community_controlled_tier ? ` · ${data.registry.community_controlled_tier}` : ''}
                  </span>
                )}
                {data.acnc.beneficiary_flags.aboriginal_tsi && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 border border-black font-bold">
                    First Nations beneficiaries
                  </span>
                )}
                {data.acnc.beneficiary_flags.youth && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 border border-black font-bold">
                    Youth
                  </span>
                )}
                {data.acnc.beneficiary_flags.pre_post_release && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 border border-black font-bold">
                    Pre/post release
                  </span>
                )}
                {data.acnc.is_foundation && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-amber-500 text-black font-bold">
                    Foundation
                  </span>
                )}
                {data.registry?.supply_nation_certified && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-blue-600 text-white font-bold">
                    Supply Nation
                  </span>
                )}
                {data.acnc.is_oric_corporation && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-emerald-600 text-white font-bold">
                    ORIC{data.acnc.oric_icn ? ` · ${data.acnc.oric_icn}` : ''}
                  </span>
                )}
              </div>
            )}
            {data.org.description && (
              <p className="text-sm text-gray-700 mt-4 leading-relaxed">{data.org.description.slice(0, 280)}{data.org.description.length > 280 ? '...' : ''}</p>
            )}
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-3 gap-px bg-black">
            <div className="bg-white p-4">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Programs</div>
              <div className="text-2xl font-black">{data.programs.length}</div>
            </div>
            <div className="bg-white p-4">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Funding tracked</div>
              <div className="text-2xl font-black">{fmtMoney(data.funding.total_dollars)}</div>
            </div>
            <div className="bg-white p-4">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Charity size</div>
              <div className="text-base font-black">{data.acnc?.charity_size ?? '—'}</div>
            </div>
          </div>

          {/* Location block */}
          {data.registry && (
            <Section icon={MapPin} title="Location">
              <Row label="State / postcode" value={`${data.registry.state ?? '—'} ${data.registry.postcode ?? ''}`} />
              {data.geo?.locality && <Row label="Locality" value={data.geo.locality} />}
              {data.registry.lga && <Row label="LGA" value={data.registry.lga} />}
              {data.geo?.sa3_name && <Row label="ABS region (SA3)" value={data.geo.sa3_name} />}
              {data.registry.remoteness && <Row label="Remoteness" value={data.registry.remoteness} />}
              {data.acnc?.address && <Row label="Registered address" value={data.acnc.address} />}
              {data.registry.seifa_irsd_decile != null && (
                <Row label="SEIFA IRSD decile" value={`${data.registry.seifa_irsd_decile} / 10`} />
              )}
            </Section>
          )}

          {/* ACNC registry */}
          {(data.registry?.abn || data.acnc) && (
            <Section icon={Award} title="ACNC + ABN registry">
              {data.registry?.abn && <Row label="ABN" value={data.registry.abn} mono />}
              {data.registry?.acn && <Row label="ACN" value={data.registry.acn} mono />}
              {data.acnc?.charity_size && <Row label="ACNC charity size" value={data.acnc.charity_size} />}
              {data.acnc?.registration_date && <Row label="ACNC registered" value={data.acnc.registration_date} />}
              {data.acnc?.pbi && <Row label="PBI" value="Yes (Public Benevolent Institution)" />}
              {data.acnc?.hpc && <Row label="HPC" value="Yes (Health Promotion Charity)" />}
              {data.registry?.sector && <Row label="Sector" value={[data.registry.sector, data.registry.sub_sector].filter(Boolean).join(' · ')} />}
              {data.acnc?.purposes && data.acnc.purposes.length > 0 && (
                <Row label="Purposes" value={data.acnc.purposes.slice(0, 5).join(' · ')} />
              )}
              {data.acnc?.operating_states && data.acnc.operating_states.length > 0 && (
                <Row label="Operates in" value={data.acnc.operating_states.join(' · ')} />
              )}
            </Section>
          )}

          {/* Financials */}
          {data.registry && (data.registry.latest_revenue || data.registry.latest_assets) && (
            <Section icon={DollarSign} title="Financials">
              {data.registry.latest_revenue && <Row label="Revenue" value={fmtMoney(Number(data.registry.latest_revenue))} sub={data.registry.financial_year ? `FY ${data.registry.financial_year}` : undefined} />}
              {data.registry.latest_assets && <Row label="Assets" value={fmtMoney(Number(data.registry.latest_assets))} />}
              {data.funding.total_dollars > 0 && (
                <Row label="YJ funding tracked" value={fmtMoney(data.funding.total_dollars)} sub={`${data.funding.records} grant records`} />
              )}
            </Section>
          )}

          {/* Programs delivered */}
          {data.programs.length > 0 && (
            <Section icon={Building2} title={`Programs delivered (${data.programs.length})`}>
              <ul className="space-y-2">
                {data.programs.slice(0, 25).map((p) => (
                  <li key={p.id} className="border border-gray-200 p-3 hover:border-black transition-colors">
                    <Link href={`/intelligence/interventions/${p.id}`} className="block">
                      <div className="text-sm font-bold leading-tight">{p.name}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                        {p.type && <span className="text-gray-600">{p.type}</span>}
                        {p.evidence_level && (
                          <span className="px-1.5 py-0.5 border border-emerald-700 text-emerald-700 uppercase tracking-wider font-bold">
                            {p.evidence_level.split('(')[0].trim()}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
                {data.programs.length > 25 && (
                  <li className="text-xs text-gray-500 italic pt-1">... and {data.programs.length - 25} more</li>
                )}
              </ul>
            </Section>
          )}

          {/* Contact + actions */}
          <Section icon={Users} title="Contact">
            {data.org.website && (
              <a href={data.org.website.startsWith('http') ? data.org.website : `https://${data.org.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 mb-2">
                <ExternalLink className="w-3.5 h-3.5" />
                {data.org.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {data.registry?.email && (
              <a href={`mailto:${data.registry.email}`} className="block text-sm text-blue-700 hover:text-blue-900 mb-2">
                {data.registry.email}
              </a>
            )}
            {data.registry?.phone && (
              <div className="text-sm text-gray-700 mb-2">{data.registry.phone}</div>
            )}
          </Section>

          {/* Cross-links */}
          <div className="px-6 py-6 border-t-2 border-black bg-gray-50 space-y-3">
            <div className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-2">Go deeper</div>
            {data.registry?.abn && (
              <a
                href={`https://www.acnc.gov.au/charity/charities?ABN=${data.registry.abn}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border-2 border-black px-4 py-3 hover:bg-black hover:text-white transition-colors"
              >
                <span className="text-sm font-bold">View on ACNC.gov.au</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {data.registry?.abn && (
              <a
                href={`https://abr.business.gov.au/ABN/View?abn=${data.registry.abn}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border-2 border-black px-4 py-3 hover:bg-black hover:text-white transition-colors"
              >
                <span className="text-sm font-bold">View on ABR (ATO)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <h3 className="text-[11px] uppercase tracking-widest font-bold text-gray-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, sub, mono }: { label: string; value: string | number; sub?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
      <span className={`text-right ${mono ? 'font-mono' : ''}`}>
        <span className="text-black font-bold">{value}</span>
        {sub && <span className="text-gray-500 text-xs block">{sub}</span>}
      </span>
    </div>
  );
}
