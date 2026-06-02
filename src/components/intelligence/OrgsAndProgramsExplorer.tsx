'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { OrgDetailPanel } from './OrgDetailPanel';
import { RecordTrustBadges } from '@/components/trust/RecordTrustBadges';

interface OrgRow {
  org_id: string;
  name: string;
  abn: string | null;
  state: string | null;
  postcode: string | null;
  locality: string | null;
  lga_name: string | null;
  remoteness: string | null;
  sector: string | null;
  community_controlled: boolean;
  cc_tier: string | null;
  supply_nation_certified: boolean;
  charity_size: string | null;
  acnc_registered: boolean;
  ben_aboriginal_tsi: boolean;
  ben_youth: boolean;
  is_oric_corporation: boolean;
  program_count: number;
  strong_evidence_count: number;
  funding_yj: number;
  funding_all: number;
  funding_records: number;
  funding_yj_records: number;
  org_row_count: number;
}

interface FundingRow {
  id: string;
  recipient_name: string | null;
  recipient_abn: string | null;
  program_name: string | null;
  program_round: string | null;
  amount_dollars: number | null;
  source: string | null;
  sector: string | null;
  funding_type: string | null;
  state: string | null;
  location: string | null;
  financial_year: string | null;
  announcement_date: string | null;
  project_description: string | null;
  alma_organization_id: string | null;
}

interface ProgramRow {
  program_id: string;
  name: string;
  type: string | null;
  description: string | null;
  evidence_level: string | null;
  target_cohort: string[] | null;
  geography: string[] | null;
  org_id: string | null;
  org_name: string | null;
  org_state: string | null;
  org_locality: string | null;
  org_lga: string | null;
  org_remoteness: string | null;
  org_community_controlled: boolean;
  org_charity_size: string | null;
  years_operating?: number | null;
  cultural_authority?: string | null;
  portfolio_score?: number | null;
}

type Tab = 'orgs' | 'programs' | 'funding';
type OrgSort = 'funding_desc' | 'programs_desc' | 'name_asc' | 'state' | 'remoteness';
type ProgramSort = 'evidence' | 'org' | 'name' | 'state' | 'type';
type FundingSort = 'amount_desc' | 'date_desc' | 'recipient' | 'state';

const REMOTENESS_RANK: Record<string, number> = {
  'Major Cities of Australia': 0,
  'Inner Regional Australia': 1,
  'Outer Regional Australia': 2,
  'Remote Australia': 3,
  'Very Remote Australia': 4,
};

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];

function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toLocaleString()}`;
  return '—';
}

export function OrgsAndProgramsExplorer() {
  const [tab, setTab] = useState<Tab>('orgs');
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [funding, setFunding] = useState<FundingRow[]>([]);
  const [fundingTotalCount, setFundingTotalCount] = useState<number>(0);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingFunding, setLoadingFunding] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [ccOnly, setCcOnly] = useState(false);
  const [acncOnly, setAcncOnly] = useState(false);
  const [strongOnly, setStrongOnly] = useState(false);
  const [orgSort, setOrgSort] = useState<OrgSort>('funding_desc');
  const [programSort, setProgramSort] = useState<ProgramSort>('evidence');
  const [fundingSort, setFundingSort] = useState<FundingSort>('amount_desc');
  const [fundingSourceFilter, setFundingSourceFilter] = useState<string>('');
  const [fundingSectorFilter, setFundingSectorFilter] = useState<string>('youth_justice');

  // Load orgs once
  useEffect(() => {
    fetch('/api/intelligence/orgs/browser', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const flat: OrgRow[] = [];
        for (const t of ['heavy_lifter', 'established', 'verified', 'emerging']) {
          flat.push(...((d.tiers?.[t] ?? []) as OrgRow[]));
        }
        setOrgs(flat);
      })
      .finally(() => setLoadingOrgs(false));
  }, []);

  // Lazy-load programs on tab switch
  useEffect(() => {
    if (tab === 'programs' && programs.length === 0 && !loadingPrograms) {
      setLoadingPrograms(true);
      fetch('/api/intelligence/programs/browser', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => setPrograms((d.programs ?? []) as ProgramRow[]))
        .finally(() => setLoadingPrograms(false));
    }
  }, [tab, programs.length, loadingPrograms]);

  // Funding records — refetch when filters change while on the funding tab.
  useEffect(() => {
    if (tab !== 'funding') return;
    setLoadingFunding(true);
    const params = new URLSearchParams();
    if (fundingSourceFilter) params.set('source', fundingSourceFilter);
    if (fundingSectorFilter) params.set('sector', fundingSectorFilter);
    if (stateFilter) params.set('state', stateFilter);
    params.set('limit', '500');
    fetch(`/api/intelligence/funding/browser?${params.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setFunding((d.records ?? []) as FundingRow[]);
        setFundingTotalCount(d.total ?? 0);
      })
      .finally(() => setLoadingFunding(false));
  }, [tab, fundingSourceFilter, fundingSectorFilter, stateFilter]);

  const filteredOrgs = useMemo(() => {
    let rows = [...orgs];
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(s) ||
          (r.lga_name || '').toLowerCase().includes(s) ||
          (r.locality || '').toLowerCase().includes(s),
      );
    }
    if (stateFilter) rows = rows.filter((r) => r.state === stateFilter);
    if (ccOnly) rows = rows.filter((r) => r.community_controlled);
    if (acncOnly) rows = rows.filter((r) => r.acnc_registered);
    if (strongOnly) rows = rows.filter((r) => r.strong_evidence_count > 0);
    rows.sort((a, b) => {
      if (orgSort === 'funding_desc') {
        const d = Number(b.funding_yj) - Number(a.funding_yj);
        if (d !== 0) return d;
        return b.program_count - a.program_count;
      }
      if (orgSort === 'programs_desc') {
        const d = b.program_count - a.program_count;
        if (d !== 0) return d;
        return Number(b.funding_yj) - Number(a.funding_yj);
      }
      if (orgSort === 'state') {
        const d = (a.state || 'ZZ').localeCompare(b.state || 'ZZ');
        if (d !== 0) return d;
        return b.program_count - a.program_count;
      }
      if (orgSort === 'remoteness') {
        const ar = REMOTENESS_RANK[a.remoteness || ''] ?? 9;
        const br = REMOTENESS_RANK[b.remoteness || ''] ?? 9;
        const d = br - ar; // most remote first
        if (d !== 0) return d;
        return b.program_count - a.program_count;
      }
      return a.name.localeCompare(b.name);
    });
    return rows;
  }, [orgs, search, stateFilter, ccOnly, acncOnly, strongOnly, orgSort]);

  const filteredPrograms = useMemo(() => {
    let rows = [...programs];
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(s) ||
          (r.org_name || '').toLowerCase().includes(s) ||
          (r.type || '').toLowerCase().includes(s),
      );
    }
    if (stateFilter) rows = rows.filter((r) => r.org_state === stateFilter);
    if (ccOnly) rows = rows.filter((r) => r.org_community_controlled);
    if (strongOnly) {
      rows = rows.filter((r) => {
        const l = (r.evidence_level || '').toLowerCase();
        return l.startsWith('proven') || l.startsWith('effective') || l.startsWith('indigenous');
      });
    }
    rows.sort((a, b) => {
      if (programSort === 'evidence') {
        const rank = (l: string | null) => {
          const x = (l || '').toLowerCase();
          if (x.startsWith('proven')) return 0;
          if (x.startsWith('effective')) return 1;
          if (x.startsWith('indigenous')) return 2;
          if (x.startsWith('promising')) return 3;
          return 4;
        };
        const d = rank(a.evidence_level) - rank(b.evidence_level);
        if (d !== 0) return d;
        return a.name.localeCompare(b.name);
      }
      if (programSort === 'org') {
        return (a.org_name || '').localeCompare(b.org_name || '');
      }
      if (programSort === 'state') {
        const d = (a.org_state || 'ZZ').localeCompare(b.org_state || 'ZZ');
        if (d !== 0) return d;
        return a.name.localeCompare(b.name);
      }
      if (programSort === 'type') {
        const d = (a.type || 'ZZ').localeCompare(b.type || 'ZZ');
        if (d !== 0) return d;
        return a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return rows;
  }, [programs, search, stateFilter, ccOnly, strongOnly, programSort]);

  return (
    <>
      {/* Filter strip — shared by orgs + programs tabs, sits directly under the map */}
      <section className="border-b-2 border-black bg-gray-100">
        <div className="container-justice py-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === 'orgs' ? 'Search org, locality, LGA…' : 'Search program, org, type…'}
                className="w-full pl-10 pr-4 py-2 border-2 border-black bg-white focus:outline-none"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="border-2 border-black bg-white px-3 py-2 font-mono text-sm"
            >
              <option value="">All states</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => setCcOnly((c) => !c)}
              className={`px-3 py-2 border-2 text-xs font-bold uppercase tracking-widest font-mono ${ccOnly ? 'bg-red-600 text-white border-red-600' : 'border-black bg-white hover:bg-gray-100'}`}
            >
              Community-controlled
            </button>
            {tab === 'orgs' && (
              <button
                onClick={() => setAcncOnly((c) => !c)}
                className={`px-3 py-2 border-2 text-xs font-bold uppercase tracking-widest font-mono ${acncOnly ? 'bg-emerald-700 text-white border-emerald-700' : 'border-black bg-white hover:bg-gray-100'}`}
              >
                ACNC-registered
              </button>
            )}
            <button
              onClick={() => setStrongOnly((c) => !c)}
              className={`px-3 py-2 border-2 text-xs font-bold uppercase tracking-widest font-mono ${strongOnly ? 'bg-amber-500 text-black border-amber-500' : 'border-black bg-white hover:bg-gray-100'}`}
            >
              Strong evidence
            </button>
          </div>
        </div>
      </section>

      {/* Tab toggle */}
      <section className="border-b-2 border-black bg-white">
        <div className="container-justice flex">
          <TabButton active={tab === 'orgs'} onClick={() => setTab('orgs')} count={filteredOrgs.length}>
            Organisations
          </TabButton>
          <TabButton active={tab === 'programs'} onClick={() => setTab('programs')} count={tab === 'programs' ? filteredPrograms.length : (programs.length || 1697)}>
            Programs
          </TabButton>
          <TabButton active={tab === 'funding'} onClick={() => setTab('funding')} count={tab === 'funding' ? fundingTotalCount : '157K+'}>
            Funding
          </TabButton>
          <div className="ml-auto flex items-center px-4 gap-3 text-xs font-mono text-gray-500">
            {tab === 'orgs' && (
              <select value={orgSort} onChange={(e) => setOrgSort(e.target.value as OrgSort)} className="border-2 border-black bg-white px-2 py-1 font-mono text-xs">
                <option value="funding_desc">Sort: funding ↓</option>
                <option value="programs_desc">Sort: programs ↓</option>
                <option value="state">Sort: state</option>
                <option value="remoteness">Sort: most remote first</option>
                <option value="name_asc">Sort: name A→Z</option>
              </select>
            )}
            {tab === 'programs' && (
              <select value={programSort} onChange={(e) => setProgramSort(e.target.value as ProgramSort)} className="border-2 border-black bg-white px-2 py-1 font-mono text-xs">
                <option value="evidence">Sort: evidence tier</option>
                <option value="state">Sort: state</option>
                <option value="type">Sort: program type</option>
                <option value="org">Sort: org A→Z</option>
                <option value="name">Sort: name A→Z</option>
              </select>
            )}
            {tab === 'funding' && (
              <>
                <select value={fundingSectorFilter} onChange={(e) => setFundingSectorFilter(e.target.value)} className="border-2 border-black bg-white px-2 py-1 font-mono text-xs">
                  <option value="">All sectors</option>
                  <option value="youth_justice">Youth justice (strict)</option>
                  <option value="community_services">Community services</option>
                  <option value="legal_services">Legal services</option>
                  <option value="child_protection">Child protection</option>
                  <option value="housing">Housing</option>
                </select>
                <select value={fundingSourceFilter} onChange={(e) => setFundingSourceFilter(e.target.value)} className="border-2 border-black bg-white px-2 py-1 font-mono text-xs">
                  <option value="">All sources</option>
                  <option value="dyjvs-contracts">QLD DYJVS contracts</option>
                  <option value="qgip">QGIP (QLD govt info portal)</option>
                  <option value="qld-historical-grants">QLD historical grants</option>
                  <option value="qld_contract_disclosure">QLD contract disclosure</option>
                  <option value="austender-direct">AusTender (federal)</option>
                  <option value="nsw-facs-ngo-grants">NSW FACS NGO grants</option>
                  <option value="nsw-dcj-ngo-grants">NSW DCJ NGO grants</option>
                  <option value="rogs-2026">ROGS 2026</option>
                  <option value="aihw-yj">AIHW YJ</option>
                  <option value="prf-portfolio">PRF portfolio</option>
                  <option value="foundation-notable-grants">Foundation grants</option>
                </select>
                <select value={fundingSort} onChange={(e) => setFundingSort(e.target.value as FundingSort)} className="border-2 border-black bg-white px-2 py-1 font-mono text-xs">
                  <option value="amount_desc">Sort: amount ↓</option>
                  <option value="date_desc">Sort: date ↓</option>
                  <option value="recipient">Sort: recipient A→Z</option>
                  <option value="state">Sort: state</option>
                </select>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Tab content */}
      <section className="container-justice py-6">
        {tab === 'orgs' && (
          loadingOrgs ? (
            <div className="text-sm text-gray-500 font-mono py-12">Loading organisations…</div>
          ) : (
            <ul className="border-2 border-black bg-white divide-y divide-gray-200">
              {filteredOrgs.map((r, i) => (
                <li key={r.org_id}>
                  <button
                    onClick={() => setActiveOrgId(r.org_id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{(i + 1).toString().padStart(3, '0')}</span>
                        <span className="font-bold text-sm md:text-base">{r.name}</span>
                        {r.community_controlled && <Badge color="bg-red-600">CC</Badge>}
                        {r.is_oric_corporation && <Badge color="bg-emerald-600">ORIC</Badge>}
                        {r.supply_nation_certified && <Badge color="bg-blue-600">SUPPLY NATION</Badge>}
                        {r.ben_aboriginal_tsi && !r.community_controlled && <BadgeOutline>FIRST NATIONS</BadgeOutline>}
                        {r.ben_youth && <BadgeOutline>YOUTH</BadgeOutline>}
                        {r.acnc_registered && <BadgeOutline>ACNC</BadgeOutline>}
                      </div>
                      <RecordTrustBadges
                        className="mb-2"
                        showReview={false}
                        hasLocation={Boolean(r.state || r.locality || r.lga_name)}
                        locationLabel={[r.locality, r.state].filter(Boolean).join(', ') || r.lga_name}
                        hasSource={Boolean(r.abn || r.acnc_registered || r.is_oric_corporation)}
                        sourceLabel={r.abn ? `ABN ${r.abn}` : 'Registry source'}
                        communityControlled={r.community_controlled}
                        extraBadges={
                          r.strong_evidence_count > 0
                            ? [{ label: 'Source linked', tone: 'source', title: `${r.strong_evidence_count} linked evidence signal${r.strong_evidence_count === 1 ? '' : 's'}.` }]
                            : undefined
                        }
                        compact
                        maxBadges={5}
                      />
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-600 font-mono">
                        {r.state && <span>{r.locality ? `${r.locality}, ` : ''}{r.state} {r.postcode ?? ''}</span>}
                        {r.lga_name && <span>LGA · {r.lga_name}</span>}
                        {r.remoteness && <span>{r.remoteness.replace(' Australia', '')}</span>}
                        {r.charity_size && <span>{r.charity_size}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 md:gap-8 text-right flex-shrink-0">
                      <Stat label="Programs" value={r.program_count.toString()} sub={r.strong_evidence_count > 0 ? `${r.strong_evidence_count} ★ strong` : undefined} />
                      <Stat
                        label="YJ funding"
                        value={fmtMoney(Number(r.funding_yj))}
                        sub={
                          r.funding_yj_records > 0
                            ? `${r.funding_yj_records} YJ grants${r.funding_all > r.funding_yj ? ` · ${fmtMoney(Number(r.funding_all))} all sectors` : ''}`
                            : r.funding_all > 0
                            ? `${fmtMoney(Number(r.funding_all))} all sectors`
                            : undefined
                        }
                      />
                    </div>
                  </button>
                </li>
              ))}
              {filteredOrgs.length === 0 && (
                <li className="px-4 py-12 text-center text-gray-500 font-mono text-sm">No organisations match the current filters.</li>
              )}
            </ul>
          )
        )}

        {tab === 'programs' && (
          loadingPrograms ? (
            <div className="text-sm text-gray-500 font-mono py-12">Loading programs…</div>
          ) : (
            <ul className="border-2 border-black bg-white divide-y divide-gray-200">
              {filteredPrograms.map((p, i) => (
                <li key={p.program_id}>
                  <button
                    onClick={() => p.org_id && setActiveOrgId(p.org_id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col md:flex-row md:items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{(i + 1).toString().padStart(4, '0')}</span>
                        <span className="font-bold text-sm md:text-base">{p.name}</span>
                        {p.type && <span className="text-[11px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-400 text-gray-700 font-mono">{p.type}</span>}
                        {p.org_community_controlled && <Badge color="bg-red-600">CC</Badge>}
                      </div>
                      <RecordTrustBadges
                        className="mb-2"
                        evidenceLevel={p.evidence_level}
                        hasLocation={Boolean(p.org_state || p.geography?.length)}
                        locationLabel={p.org_state || p.geography?.join(', ')}
                        hasSource={Boolean(p.org_id || p.cultural_authority)}
                        sourceLabel={p.org_name || p.cultural_authority || 'Linked organisation'}
                        communityControlled={p.org_community_controlled}
                        compact
                        maxBadges={5}
                      />
                      {p.description && (
                        <p className="text-[13px] text-gray-700 mb-1 line-clamp-2">{p.description.slice(0, 280)}{p.description.length > 280 ? '…' : ''}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-600 font-mono">
                        {p.org_name && <span className="text-emerald-700 font-bold">{p.org_name}</span>}
                        {p.org_state && <span>{p.org_locality ? `${p.org_locality}, ` : ''}{p.org_state}</span>}
                        {p.org_lga && <span>LGA · {p.org_lga}</span>}
                        {p.org_remoteness && <span>{p.org_remoteness.replace(' Australia', '')}</span>}
                      </div>
                    </div>
                    {p.org_id && (
                      <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-widest font-mono flex-shrink-0">
                        Org detail →
                      </div>
                    )}
                  </button>
                </li>
              ))}
              {filteredPrograms.length === 0 && (
                <li className="px-4 py-12 text-center text-gray-500 font-mono text-sm">No programs match the current filters.</li>
              )}
            </ul>
          )
        )}

        {tab === 'funding' && (
          loadingFunding ? (
            <div className="text-sm text-gray-500 font-mono py-12">Loading funding records…</div>
          ) : (
            <>
              <div className="text-xs text-gray-600 font-mono mb-3">
                Showing top <span className="font-bold">{funding.length.toLocaleString()}</span> records by amount
                {fundingSectorFilter && <> · sector <span className="font-bold">{fundingSectorFilter}</span></>}
                {fundingSourceFilter && <> · source <span className="font-bold">{fundingSourceFilter}</span></>}
                {stateFilter && <> · state <span className="font-bold">{stateFilter}</span></>}
                {' '}· total ${(funding.reduce((s, f) => s + Number(f.amount_dollars || 0), 0) / 1_000_000).toFixed(1)}M shown.
                {' '}<a href="https://civicgraph.app/share/qld-youth-justice" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">QLD deep dive on CivicGraph →</a>
              </div>
              <ul className="border-2 border-black bg-white divide-y divide-gray-200">
                {[...funding].sort((a, b) => {
                  if (fundingSort === 'amount_desc') return Number(b.amount_dollars || 0) - Number(a.amount_dollars || 0);
                  if (fundingSort === 'date_desc') return (b.announcement_date || '').localeCompare(a.announcement_date || '');
                  if (fundingSort === 'recipient') return (a.recipient_name || '').localeCompare(b.recipient_name || '');
                  return (a.state || 'ZZ').localeCompare(b.state || 'ZZ');
                }).map((f, i) => (
                  <li key={f.id}>
                    <button
                      onClick={() => f.alma_organization_id && setActiveOrgId(f.alma_organization_id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col md:flex-row md:items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{(i + 1).toString().padStart(4, '0')}</span>
                          <span className="font-bold text-sm md:text-base">{f.recipient_name || '(unnamed recipient)'}</span>
                          {f.state && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-gray-200 font-mono">{f.state}</span>}
                          {f.sector && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-400 text-gray-700 font-mono">{f.sector}</span>}
                          {f.funding_type && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-300 text-gray-500 font-mono">{f.funding_type}</span>}
                        </div>
                        <div className="text-[13px] text-gray-700 mb-1">
                          {f.program_name}{f.program_round ? ` · ${f.program_round}` : ''}
                        </div>
                        {f.project_description && (
                          <p className="text-[12px] text-gray-600 line-clamp-2">{f.project_description.slice(0, 220)}{f.project_description.length > 220 ? '…' : ''}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 font-mono mt-1">
                          {f.source && <span>source · {f.source}</span>}
                          {f.financial_year && <span>FY {f.financial_year}</span>}
                          {f.announcement_date && <span>{f.announcement_date}</span>}
                          {f.recipient_abn && <span>ABN {f.recipient_abn}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-bold font-mono text-emerald-700">{fmtMoney(Number(f.amount_dollars || 0))}</div>
                        {f.alma_organization_id && (
                          <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold font-mono mt-1">Org detail →</div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
                {funding.length === 0 && (
                  <li className="px-4 py-12 text-center text-gray-500 font-mono text-sm">No funding records match the current filters.</li>
                )}
              </ul>
            </>
          )
        )}
      </section>

      <OrgDetailPanel orgId={activeOrgId} onClose={() => setActiveOrgId(null)} />
    </>
  );
}

function TabButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number | string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 border-r-2 border-black text-sm font-bold uppercase tracking-widest transition-colors ${
        active ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
      }`}
    >
      {children}
      <span className="ml-2 text-xs opacity-70 font-mono">{count}</span>
    </button>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${color} text-white font-bold font-mono`}>
      {children}
    </span>
  );
}

function BadgeOutline({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-400 text-gray-700 font-bold font-mono">
      {children}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{label}</div>
      <div className="text-base font-bold font-mono">{value}</div>
      {sub && <div className="text-[10px] text-gray-500 font-mono">{sub}</div>}
    </div>
  );
}
