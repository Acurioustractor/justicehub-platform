'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { MainNavigation } from '@/components/navigation/MainNavigation';
import { Footer } from '@/components/navigation/Footer';
import dynamic from 'next/dynamic';
import {
  Search, Filter, ChevronDown, ChevronUp, ExternalLink,
  TrendingUp, TrendingDown, AlertTriangle, DollarSign,
  Building2, Users, Scale, BarChart3, X, ArrowLeft,
  BookOpen, Target, Shield, Heart, Sparkles, FileText,
  MapPin,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

interface Overview {
  total_records: number;
  total_dollars: number;
  unique_orgs: number;
  unique_programs: number;
  alma_linked: number;
  years_covered: number;
  indigenous_records: number;
  indigenous_dollars: number;
  indigenous_orgs: number;
  non_indigenous_dollars: number;
  top_sector: string;
  earliest_year: string;
  latest_year: string;
}

interface SectorRow {
  sector: string;
  record_count: number;
  total_dollars: number;
  org_count: number;
  indigenous_records: number;
  indigenous_dollars: number;
}

interface YearRow {
  financial_year: string;
  record_count: number;
  total_dollars: number;
  org_count: number;
  indigenous_records: number;
  indigenous_dollars: number;
  indigenous_orgs: number;
}

interface Recipient {
  recipient_name: string;
  recipient_abn: string | null;
  grant_count: number;
  total_dollars: number;
  years_funded: number;
  program_count: number;
  sectors: string[];
  is_indigenous: boolean;
  alma_linked: boolean;
  alma_org_id: string | null;
}

interface FundingRecord {
  id: string;
  recipient_name: string;
  recipient_abn: string | null;
  program_name: string | null;
  project_description: string | null;
  amount_dollars: number;
  financial_year: string | null;
  sector: string | null;
  location: string | null;
  source: string;
  alma_organization_id: string | null;
}

interface SearchResult {
  records: FundingRecord[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface AcncData {
  name: string;
  charity_size: string | null;
  pbi: boolean;
  hpc: boolean;
  registration_date: string | null;
  website: string | null;
  number_of_responsible_persons: number | null;
  date_established: string | null;
  operating_states: string[] | null;
  purpose_law_policy: boolean;
  purpose_reconciliation: boolean;
  purpose_social_welfare: boolean;
  purpose_human_rights: boolean;
  ben_aboriginal_tsi: boolean;
  ben_youth: boolean;
  ben_children: boolean;
  ben_pre_post_release: boolean;
  ben_victims_of_crime: boolean;
  ben_people_at_risk_of_homelessness: boolean;
}

interface AisFinancials {
  ais_year: number;
  total_revenue: number | null;
  total_expenses: number | null;
  net_assets_liabilities: number | null;
  total_assets: number | null;
  total_liabilities: number | null;
  staff_fte: number | null;
  staff_volunteers: number | null;
  revenue_from_government: number | null;
  employee_expenses: number | null;
}

interface StateTender {
  id: string;
  title: string;
  description: string | null;
  contract_value: number | null;
  state: string;
  status: string;
  buyer_name: string | null;
  supplier_name: string | null;
  source_url: string | null;
  published_date: string | null;
  closing_date: string | null;
  justice_keywords: string[];
}

interface OrgProfile {
  organization: {
    id: string; name: string; slug: string | null; type: string | null;
    state: string | null; city: string | null; description: string | null;
  };
  funding: {
    total_dollars: number; grant_count: number; years_funded: number;
    by_year: Array<{ financial_year: string; dollars: number; grants: number; programs: string[] }> | null;
    by_sector: Array<{ sector: string; dollars: number; grants: number }> | null;
  };
  interventions: Array<{
    id: string; name: string; type: string; description: string;
    target_cohort: string[]; geography: string[];
    portfolio_score: number; evidence_level: string;
    outcomes: Array<{
      type: string; description: string; measurement: string | null; beneficiary: string | null;
    }> | null;
    evidence_count: number;
  }> | null;
  is_indigenous: boolean;
  acnc?: AcncData;
  financials?: AisFinancials;
  recipient_abn?: string;
  tender_count?: number;
}

interface OrgDirectoryItem {
  recipient_name: string;
  recipient_abn: string | null;
  location: string | null;
  total_dollars: number;
  grant_count: number;
  years_funded: number;
  sectors: string[];
  is_indigenous: boolean;
  alma_linked: boolean;
  alma_org_id: string | null;
  charity_size: string | null;
  is_pbi: boolean;
  acnc_purposes: string[];
  acnc_beneficiaries: string[];
}

interface MapLocation {
  location: string;
  org_count: number;
  total_dollars: number;
  indigenous_org_count: number;
  alma_org_count: number;
}

interface OrgSummary {
  total_orgs: number;
  total_dollars: number;
  indigenous_orgs: number;
  alma_orgs: number;
}

// ── Helpers ────────────────────────────────────────────────

const SECTORS: Record<string, { label: string; color: string }> = {
  community_services: { label: 'Community Services', color: 'bg-blue-500' },
  legal_services: { label: 'Legal Services', color: 'bg-purple-500' },
  youth_justice: { label: 'Youth Justice', color: 'bg-orange-500' },
  corrections: { label: 'Corrections', color: 'bg-red-500' },
  justice_services: { label: 'Justice Services', color: 'bg-slate-500' },
  community_safety: { label: 'Community Safety', color: 'bg-green-500' },
  policing: { label: 'Policing', color: 'bg-gray-500' },
  indigenous_services: { label: 'Indigenous Services', color: 'bg-amber-500' },
  family_violence: { label: 'Family Violence', color: 'bg-pink-500' },
};

const YEARS = [
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
  '2019-20', '2018-19', '2017-18', '2016-17', '2015-16',
  '2014-15', '2013-14', '2012-13',
];

function fmt(n: number | null | undefined): string {
  if (n == null) return '$0';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtFull(n: number | null | undefined): string {
  if (n == null) return '$0';
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
}

function pct(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function sectorLabel(s: string): string {
  return SECTORS[s]?.label || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Components ─────────────────────────────────────────────

function InequalityCallout({ overview }: { overview: Overview }) {
  const indPct = overview.total_dollars ? ((overview.indigenous_dollars || 0) / overview.total_dollars) * 100 : 0;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-amber-900 text-lg">The Inequality Gap</h3>
          <p className="text-amber-800 mt-1">
            Aboriginal and Torres Strait Islander people are{' '}
            <span className="font-bold">23x overrepresented</span> in youth detention nationally,
            yet Indigenous-led organisations receive just{' '}
            <span className="font-bold text-amber-900">{indPct.toFixed(1)}%</span> of QLD
            justice funding ({fmt(overview.indigenous_dollars)} of {fmt(overview.total_dollars)}).
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-amber-600">Indigenous-led orgs:</span>{' '}
              <span className="font-bold text-amber-900">{overview.indigenous_orgs.toLocaleString()}</span>
              {' '}of {overview.unique_orgs.toLocaleString()}
            </div>
            <div>
              <span className="text-amber-600">Grants to Indigenous orgs:</span>{' '}
              <span className="font-bold text-amber-900">{overview.indigenous_records.toLocaleString()}</span>
              {' '}of {overview.total_records.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: string; sub?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function SectorChart({ sectors, total }: { sectors: SectorRow[]; total: number }) {
  const maxDollars = Math.max(...sectors.map(s => s.total_dollars || 0), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Funding by Sector
      </h3>
      <div className="space-y-3">
        {sectors.map(s => {
          const indPct = s.total_dollars ? (s.indigenous_dollars || 0) / s.total_dollars : 0;
          return (
            <div key={s.sector}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{sectorLabel(s.sector)}</span>
                <span className="font-medium text-gray-900">{fmt(s.total_dollars)}</span>
              </div>
              <div className="h-5 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gray-800 transition-all"
                  style={{ width: `${(s.total_dollars / maxDollars) * 100}%` }}
                >
                  {indPct > 0.005 && (
                    <div
                      className="h-full bg-amber-500 rounded-r-full"
                      style={{ width: `${indPct * 100}%` }}
                      title={`Indigenous: ${fmt(s.indigenous_dollars)} (${pct(s.indigenous_dollars, s.total_dollars)})`}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                <span>{s.org_count.toLocaleString()} orgs</span>
                <span>Indigenous: {pct(s.indigenous_dollars, s.total_dollars)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-800 rounded" /> Total funding
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-500 rounded" /> To Indigenous-led orgs
        </div>
      </div>
    </div>
  );
}

function YearTrend({ years }: { years: YearRow[] }) {
  const validYears = years.filter(y => y.total_dollars != null && y.total_dollars > 0);
  const maxDollars = Math.max(...validYears.map(y => y.total_dollars), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" /> Year-over-Year Trend
      </h3>
      <div className="space-y-2">
        {validYears.map(y => {
          const indPct = (y.indigenous_dollars || 0) / y.total_dollars;
          return (
            <div key={y.financial_year} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-14 flex-shrink-0">{y.financial_year}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
                <div
                  className="h-full bg-gray-800 transition-all"
                  style={{ width: `${(y.total_dollars / maxDollars) * 100}%` }}
                />
                {indPct > 0.005 && (
                  <div
                    className="absolute top-0 left-0 h-full bg-amber-500"
                    style={{ width: `${(y.indigenous_dollars / maxDollars) * 100}%` }}
                  />
                )}
              </div>
              <span className="text-xs font-medium text-gray-900 w-16 text-right flex-shrink-0">
                {fmt(y.total_dollars)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-800 rounded" /> Total
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-500 rounded" /> Indigenous-led
        </div>
      </div>
    </div>
  );
}

function RecipientTable({ recipients, onSearch, onViewProfile }: {
  recipients: Recipient[];
  onSearch: (q: string) => void;
  onViewProfile?: (orgId: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Organisation</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total Received</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Grants</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Years</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Sectors</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r, i) => (
              <tr
                key={`${r.recipient_name}-${i}`}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => r.alma_linked && r.alma_org_id && onViewProfile
                  ? onViewProfile(r.alma_org_id)
                  : onSearch(r.recipient_name)
                }
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 line-clamp-1">
                      {r.recipient_name || '(blank)'}
                    </span>
                    {r.is_indigenous && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex-shrink-0">
                        Indigenous-led
                      </span>
                    )}
                    {r.alma_linked && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded flex-shrink-0">
                        ALMA
                      </span>
                    )}
                  </div>
                  {r.recipient_abn && (
                    <div className="text-xs text-gray-400 mt-0.5">ABN {r.recipient_abn}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                  {fmtFull(r.total_dollars)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">
                  {r.grant_count}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">
                  {r.years_funded}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap justify-center gap-1">
                    {r.sectors?.slice(0, 3).map(s => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded"
                      >
                        {sectorLabel(s)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchResults({ results, loading, onViewProfile }: {
  results: SearchResult | null; loading: boolean; onViewProfile?: (orgId: string) => void;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        Searching...
      </div>
    );
  }
  if (!results) return null;
  if (results.records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        No records found. Try broadening your search.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {results.total?.toLocaleString()} results
          {results.has_more && ` (showing ${results.offset + 1}-${results.offset + results.records.length})`}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {results.records.map((r) => (
          <div
            key={r.id}
            className={`px-4 py-3 hover:bg-gray-50 transition-colors ${r.alma_organization_id ? 'cursor-pointer' : ''}`}
            onClick={() => r.alma_organization_id && onViewProfile?.(r.alma_organization_id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {r.recipient_name || '(blank)'}
                  {r.alma_organization_id && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded flex-shrink-0">
                      ALMA
                    </span>
                  )}
                </div>
                {r.program_name && (
                  <div className="text-sm text-gray-600 mt-0.5 line-clamp-1">{r.program_name}</div>
                )}
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500">
                  {r.financial_year && <span>{r.financial_year}</span>}
                  {r.sector && (
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">{sectorLabel(r.sector)}</span>
                  )}
                  {r.location && <span>{r.location}</span>}
                  {r.source && <span className="text-gray-400">{r.source}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-gray-900">
                  {r.amount_dollars ? fmtFull(r.amount_dollars) : '—'}
                </div>
                {r.recipient_abn && (
                  <div className="text-[10px] text-gray-400 mt-0.5">ABN {r.recipient_abn}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRIORITY_OPTIONS = [
  'Housing', 'Diversion', 'Family support', 'Cultural programs',
  'Mental health', 'Employment', 'Education', 'Legal help',
  'Drug & alcohol', 'Transport', 'Youth programs', 'Elder support',
];

function CommunityVoiceSection({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [voices, setVoices] = useState<Array<{
    id: string; location: string; author_role: string; what_is_needed: string;
    what_is_working?: string; what_is_harmful?: string; priority_areas: string[]; created_at: string;
  }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    location: '', author_role: '', what_is_needed: '', what_is_working: '',
    what_is_harmful: '', what_success_looks_like: '', priority_areas: [] as string[],
    author_anonymous: true,
  });

  useEffect(() => {
    fetch(`/api/justice-funding/voice?org=${orgId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setVoices(data); })
      .catch(() => {});
  }, [orgId]);

  const handleSubmit = async () => {
    if (!form.location || !form.what_is_needed) return;
    setSubmitting(true);
    try {
      await fetch('/api/justice-funding/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organization_id: orgId, organization_name: orgName }),
      });
      setSubmitted(true);
      setShowForm(false);
    } catch {}
    setSubmitting(false);
  };

  const togglePriority = (p: string) => {
    setForm(prev => ({
      ...prev,
      priority_areas: prev.priority_areas.includes(p)
        ? prev.priority_areas.filter(x => x !== p)
        : [...prev.priority_areas, p],
    }));
  };

  return (
    <section>
      <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-rose-600" />
        Community Ledger
        <span className="text-sm font-normal text-gray-500">— what people say is needed</span>
      </h3>

      {voices.length > 0 && (
        <div className="space-y-3 mb-4">
          {voices.map(v => (
            <div key={v.id} className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-sm">
              <div className="text-rose-900 font-medium">&ldquo;{v.what_is_needed}&rdquo;</div>
              {v.what_is_working && (
                <div className="text-rose-700 mt-1 text-xs">Working: {v.what_is_working}</div>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-rose-400">
                <span>{v.location}</span>
                {v.author_role && <span>&bull; {v.author_role}</span>}
                {v.priority_areas?.length > 0 && (
                  <span>&bull; {v.priority_areas.join(', ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          Thank you. Your voice has been submitted and will appear after moderation.
        </div>
      ) : showForm ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-gray-700">
            Share what your community actually needs
          </div>
          <input
            placeholder="Your location (e.g. Townsville, Logan, Cairns) *"
            value={form.location}
            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <select
            value={form.author_role}
            onChange={e => setForm(p => ({ ...p, author_role: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">Your role (optional)</option>
            <option value="community member">Community member</option>
            <option value="service user">Service user / young person</option>
            <option value="worker">Community worker</option>
            <option value="elder">Elder</option>
            <option value="family">Family member</option>
            <option value="researcher">Researcher</option>
          </select>
          <textarea
            placeholder="What does your community actually need? *"
            value={form.what_is_needed}
            onChange={e => setForm(p => ({ ...p, what_is_needed: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-20"
          />
          <textarea
            placeholder="What's actually working? (optional)"
            value={form.what_is_working}
            onChange={e => setForm(p => ({ ...p, what_is_working: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-16"
          />
          <textarea
            placeholder="What's harmful or wasteful? (optional)"
            value={form.what_is_harmful}
            onChange={e => setForm(p => ({ ...p, what_is_harmful: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-16"
          />
          <textarea
            placeholder="What would success look like locally? (optional)"
            value={form.what_success_looks_like}
            onChange={e => setForm(p => ({ ...p, what_success_looks_like: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-16"
          />
          <div>
            <div className="text-xs text-gray-500 mb-1.5">Priority areas (select all that apply)</div>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    form.priority_areas.includes(p)
                      ? 'bg-rose-100 border-rose-300 text-rose-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={form.author_anonymous}
                onChange={e => setForm(p => ({ ...p, author_anonymous: e.target.checked }))}
                className="rounded"
              />
              Submit anonymously
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-500">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.location || !form.what_is_needed}
                className="px-4 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-rose-200 rounded-lg text-sm text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
        >
          + Add your voice — what does your community need?
        </button>
      )}
    </section>
  );
}

interface NarrativeData {
  headline: string;
  narrative: string;
  key_finding: string;
  accountability_score: string;
  gaps: string[];
  questions: string[];
}

function NarrativeSection({ orgId }: { orgId: string }) {
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/justice-funding/narrative?org=${orgId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setNarrative(data);
      }
    } catch (err) {
      setError('Failed to generate narrative');
    }
    setLoading(false);
  };

  const scoreColor: Record<string, string> = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800',
    F: 'bg-red-100 text-red-800',
  };

  return (
    <section>
      <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        Narrative Engine
        <span className="text-sm font-normal text-gray-500">— AI-generated gap analysis</span>
      </h3>

      {narrative ? (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-indigo-900 text-lg">{narrative.headline}</div>
                <div className="text-sm text-indigo-700 mt-1 font-medium">{narrative.key_finding}</div>
              </div>
              {narrative.accountability_score && (
                <div className={`px-3 py-1.5 rounded-lg font-bold text-lg ${scoreColor[narrative.accountability_score[0]] || 'bg-gray-100 text-gray-800'}`}>
                  {narrative.accountability_score}
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {narrative.narrative}
          </div>

          {narrative.gaps?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gaps Identified</div>
              <ul className="space-y-1">
                {narrative.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {narrative.questions?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Questions to Ask</div>
              <ul className="space-y-1">
                {narrative.questions.map((q, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[10px] text-gray-400">
            Generated by AI from funding records + ALMA evidence. Verify claims independently.
          </div>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 border-2 border-dashed border-indigo-200 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
              Generating gap analysis...
            </span>
          ) : (
            'Generate AI gap analysis for this organisation'
          )}
        </button>
      )}
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </section>
  );
}

function OrgProfilePanel({ profile, onClose }: { profile: OrgProfile; onClose: () => void }) {
  const org = profile.organization;
  const funding = profile.funding;
  const interventions = profile.interventions || [];
  const totalOutcomes = interventions.reduce((n, i) => n + (i.outcomes?.length || 0), 0);
  const totalEvidence = interventions.reduce((n, i) => n + i.evidence_count, 0);
  const maxYearDollars = Math.max(...(funding.by_year || []).map(y => y.dollars || 0), 1);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-white overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`sticky top-0 z-10 ${profile.is_indigenous ? 'bg-amber-900' : 'bg-gray-900'} text-white p-6`}>
          <button onClick={onClose} className="flex items-center gap-1 text-sm text-white/60 hover:text-white mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to results
          </button>
          <h2 className="text-xl font-bold">{org.name}</h2>
          {org.description && <p className="text-sm text-white/70 mt-1">{org.description}</p>}
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            {org.city && <span className="text-white/60">{org.city}, {org.state}</span>}
            {profile.is_indigenous && (
              <span className="px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded text-xs font-bold">
                Indigenous-led
              </span>
            )}
            {org.slug && (
              <Link href={`/organizations/${org.slug}`} className="text-white/60 hover:text-white flex items-center gap-1">
                View profile <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* ── MONEY LEDGER ── */}
          <section>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              Money Ledger
              <span className="text-sm font-normal text-gray-500">— public funding received</span>
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{fmt(funding.total_dollars)}</div>
                <div className="text-xs text-gray-500">Total received</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{funding.grant_count}</div>
                <div className="text-xs text-gray-500">Grants</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{funding.years_funded}</div>
                <div className="text-xs text-gray-500">Years funded</div>
              </div>
            </div>

            {/* Funding by year mini chart */}
            {funding.by_year && funding.by_year.length > 0 && (
              <div className="space-y-1.5">
                {funding.by_year.map(y => (
                  <div key={y.financial_year} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-12 flex-shrink-0">{y.financial_year}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${profile.is_indigenous ? 'bg-amber-500' : 'bg-gray-800'} rounded transition-all`}
                        style={{ width: `${((y.dollars || 0) / maxYearDollars) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 w-14 text-right flex-shrink-0">
                      {y.dollars ? fmt(y.dollars) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Programs funded through */}
            {funding.by_sector && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {funding.by_sector.map(s => (
                  <span key={s.sector} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {sectorLabel(s.sector)}: {fmt(s.dollars)}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── GOVERNANCE (ACNC) ── */}
          {profile.acnc && (
            <section>
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-teal-600" />
                Governance
                <span className="text-sm font-normal text-gray-500">— ACNC registered charity</span>
              </h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {profile.acnc.charity_size && (
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      profile.acnc.charity_size === 'Large' ? 'bg-blue-100 text-blue-800' :
                      profile.acnc.charity_size === 'Medium' ? 'bg-sky-100 text-sky-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {profile.acnc.charity_size} Charity
                    </span>
                  )}
                  {profile.acnc.pbi && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800">PBI</span>
                  )}
                  {profile.acnc.hpc && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-800">HPC</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.acnc.purpose_law_policy && (
                    <span className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-700 rounded-full">Law &amp; Policy</span>
                  )}
                  {profile.acnc.purpose_reconciliation && (
                    <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-700 rounded-full">Reconciliation</span>
                  )}
                  {profile.acnc.purpose_social_welfare && (
                    <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded-full">Social Welfare</span>
                  )}
                  {profile.acnc.purpose_human_rights && (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-700 rounded-full">Human Rights</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.acnc.ben_aboriginal_tsi && (
                    <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full">First Nations</span>
                  )}
                  {profile.acnc.ben_youth && (
                    <span className="px-2 py-0.5 text-[10px] bg-orange-100 text-orange-800 rounded-full">Youth</span>
                  )}
                  {profile.acnc.ben_children && (
                    <span className="px-2 py-0.5 text-[10px] bg-pink-100 text-pink-800 rounded-full">Children</span>
                  )}
                  {profile.acnc.ben_pre_post_release && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-800 rounded-full">Pre/Post Release</span>
                  )}
                  {profile.acnc.ben_victims_of_crime && (
                    <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-800 rounded-full">Victims of Crime</span>
                  )}
                  {profile.acnc.ben_people_at_risk_of_homelessness && (
                    <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-800 rounded-full">Homelessness Risk</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {profile.acnc.number_of_responsible_persons != null && profile.acnc.number_of_responsible_persons > 0 && (
                    <span>Board: {profile.acnc.number_of_responsible_persons} members</span>
                  )}
                  {profile.acnc.date_established && (
                    <span>Est. {new Date(profile.acnc.date_established).getFullYear()}</span>
                  )}
                  {profile.acnc.registration_date && (
                    <span>Registered: {new Date(profile.acnc.registration_date).getFullYear()}</span>
                  )}
                  {profile.recipient_abn && <span>ABN: {profile.recipient_abn}</span>}
                  {profile.acnc.website && (
                    <a href={profile.acnc.website.startsWith('http') ? profile.acnc.website : `https://${profile.acnc.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800 flex items-center gap-1">
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {profile.acnc.operating_states && profile.acnc.operating_states.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.acnc.operating_states.map(s => (
                      <span key={s} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── FINANCIAL HEALTH (AIS) ── */}
          {profile.financials && (
            <section>
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Financial Health
                <span className="text-sm font-normal text-gray-500">— FY{profile.financials.ais_year} annual report</span>
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {profile.financials.total_revenue != null && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-800">{fmt(profile.financials.total_revenue)}</div>
                    <div className="text-[10px] text-green-600 font-medium">Revenue</div>
                  </div>
                )}
                {profile.financials.total_expenses != null && (
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-red-800">{fmt(profile.financials.total_expenses)}</div>
                    <div className="text-[10px] text-red-600 font-medium">Expenses</div>
                  </div>
                )}
                {profile.financials.net_assets_liabilities != null && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-800">{fmt(profile.financials.net_assets_liabilities)}</div>
                    <div className="text-[10px] text-blue-600 font-medium">Net Assets</div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                {profile.financials.revenue_from_government != null && profile.financials.total_revenue != null && profile.financials.total_revenue > 0 && (
                  <span>Govt revenue: {((profile.financials.revenue_from_government / profile.financials.total_revenue) * 100).toFixed(0)}%</span>
                )}
                {profile.financials.staff_fte != null && profile.financials.staff_fte > 0 && (
                  <span>{profile.financials.staff_fte.toLocaleString()} FTE staff</span>
                )}
                {profile.financials.staff_volunteers != null && profile.financials.staff_volunteers > 0 && (
                  <span>{profile.financials.staff_volunteers.toLocaleString()} volunteers</span>
                )}
              </div>
            </section>
          )}

          {/* ── IMPACT LEDGER ── */}
          {interventions.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                Impact Ledger
                <span className="text-sm font-normal text-gray-500">
                  — {interventions.length} intervention{interventions.length !== 1 ? 's' : ''}, {totalOutcomes} outcomes, {totalEvidence} evidence items
                </span>
              </h3>

              <div className="space-y-4">
                {interventions.map(intervention => (
                  <div key={intervention.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-gray-900">{intervention.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {intervention.type} &bull; {intervention.geography?.join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {intervention.portfolio_score != null && intervention.portfolio_score > 0 && (
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900">
                                {(intervention.portfolio_score * 100).toFixed(0)}
                              </div>
                              <div className="text-[9px] text-gray-500 uppercase">Score</div>
                            </div>
                          )}
                          {intervention.evidence_level && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              intervention.evidence_level.startsWith('Effective')
                                ? 'bg-green-100 text-green-800'
                                : intervention.evidence_level.startsWith('Promising')
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {intervention.evidence_level.split(' (')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      {intervention.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{intervention.description}</p>
                      )}
                    </div>

                    {/* Outcomes — the human story */}
                    {intervention.outcomes && intervention.outcomes.length > 0 && (
                      <div className="px-4 py-3 space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> What changed
                        </div>
                        {intervention.outcomes.slice(0, 5).map((outcome, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                              outcome.type?.includes('Reduced') ? 'bg-green-500' :
                              outcome.type?.includes('Educational') ? 'bg-blue-500' :
                              outcome.type?.includes('Mental') ? 'bg-purple-500' :
                              outcome.type?.includes('Family') ? 'bg-pink-500' :
                              outcome.type?.includes('Employment') ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`} />
                            <div>
                              <span className="text-gray-900">{outcome.description}</span>
                              {outcome.beneficiary && (
                                <span className="text-gray-400 text-xs ml-1">({outcome.beneficiary})</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {intervention.outcomes.length > 5 && (
                          <div className="text-xs text-gray-400">
                            +{intervention.outcomes.length - 5} more outcomes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── GAP ANALYSIS ── */}
          {interventions.length === 0 && funding.grant_count > 0 && (
            <section className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-bold text-red-900 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                Accountability Gap
              </h3>
              <p className="text-sm text-red-800">
                This organisation received {fmt(funding.total_dollars)} across {funding.years_funded} years,
                but we have <strong>no documented interventions or outcomes</strong> in our evidence base.
                What did this funding achieve? Who benefited?
              </p>
            </section>
          )}

          {interventions.length > 0 && totalOutcomes === 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                Outcome Gap
              </h3>
              <p className="text-sm text-amber-800">
                This organisation runs {interventions.length} documented intervention{interventions.length !== 1 ? 's' : ''} and
                received {fmt(funding.total_dollars)}, but we have <strong>no recorded outcomes</strong>.
                Are these programs being evaluated? What results are they producing?
              </p>
            </section>
          )}

          {/* ── COMMUNITY LEDGER ── */}
          <CommunityVoiceSection orgId={org.id} orgName={org.name} />

          {/* ── NARRATIVE ENGINE ── */}
          <NarrativeSection orgId={org.id} />

          {/* Provenance */}
          <section className="border-t border-gray-200 pt-4 text-xs text-gray-400">
            <div className="font-medium text-gray-500 mb-1">Provenance</div>
            <div>Funding data: Queensland Government Investment Portal (QGIP), Brisbane City Council, Ministerial Statements</div>
            <div>Intervention data: ALMA Evidence Engine (community-endorsed + AI-assisted extraction)</div>
            <div>Community voices: Self-reported, pending moderation</div>
            <div>Confidence: Funding amounts are official government records. Outcomes are extracted from published evaluations and reports.</div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── QLD Location Geocoding Lookup ──────────────────────────

const QLD_LOCATIONS: Record<string, [number, number]> = {
  brisbane: [-27.4698, 153.0251],
  'brisbane (c)': [-27.4698, 153.0251],
  'brisbane city': [-27.4698, 153.0251],
  'south brisbane': [-27.4805, 153.0205],
  'fortitude valley': [-27.4575, 153.0354],
  woolloongabba: [-27.4882, 153.0345],
  milton: [-27.4708, 152.9985],
  'west end (brisbane city)': [-27.4809, 153.0076],
  'west end': [-27.4809, 153.0076],
  kedron: [-27.4027, 153.0297],
  'spring hill': [-27.4615, 153.0268],
  'new farm': [-27.4672, 153.0477],
  inala: [-27.5968, 152.9741],
  zillmere: [-27.3576, 153.0369],
  'eight mile plains': [-27.5792, 153.1004],
  'slacks creek': [-27.6345, 153.1412],
  'logan central': [-27.6395, 153.1094],
  woodridge: [-27.6243, 153.1084],
  goodna: [-27.6138, 152.8896],
  'cannon hill': [-27.4654, 153.0919],
  townsville: [-19.2590, 146.8169],
  'townsville city': [-19.2590, 146.8169],
  'townsville (c)': [-19.2590, 146.8169],
  aitkenvale: [-19.2917, 146.7667],
  garbutt: [-19.2640, 146.7605],
  kirwan: [-19.3117, 146.7269],
  cairns: [-16.9186, 145.7781],
  'cairns city': [-16.9186, 145.7781],
  'cairns (r)': [-16.9186, 145.7781],
  'cairns north': [-16.9070, 145.7710],
  manunda: [-16.9263, 145.7473],
  bungalow: [-16.9330, 145.7594],
  westcourt: [-16.9270, 145.7405],
  woree: [-16.9500, 145.7375],
  edmonton: [-17.0167, 145.7333],
  gordonvale: [-17.0833, 145.7833],
  redlynch: [-16.8800, 145.6900],
  portsmith: [-16.9400, 145.7519],
  southport: [-27.9667, 153.4000],
  nerang: [-27.9881, 153.3350],
  robina: [-28.0769, 153.3869],
  'gold coast (c)': [-28.0167, 153.4000],
  'burleigh heads': [-28.0839, 153.4453],
  'palm beach': [-28.1114, 153.4571],
  coomera: [-27.8614, 153.3444],
  'surfers paradise': [-28.0021, 153.4295],
  helensvale: [-27.9106, 153.3450],
  labrador: [-27.9500, 153.3959],
  ashmore: [-27.9786, 153.3700],
  broadbeach: [-28.0283, 153.4300],
  oxenford: [-27.8864, 153.3150],
  'upper coomera': [-27.8750, 153.2950],
  mudgeeraba: [-28.0831, 153.3672],
  arundel: [-27.9414, 153.3650],
  miami: [-28.0650, 153.4450],
  maroochydore: [-26.6517, 153.0917],
  nambour: [-26.6267, 152.9583],
  buderim: [-26.6833, 153.0500],
  caloundra: [-26.8000, 153.1333],
  'coolum beach': [-26.5333, 153.0833],
  mooloolaba: [-26.6817, 153.1183],
  noosaville: [-26.3986, 153.0625],
  tewantin: [-26.3903, 153.0397],
  maleny: [-26.7500, 152.8500],
  'sunshine coast (r)': [-26.6500, 153.0667],
  ipswich: [-27.6144, 152.7609],
  toowoomba: [-27.5598, 151.9507],
  'toowoomba city': [-27.5598, 151.9507],
  'toowoomba (r)': [-27.5598, 151.9507],
  'east toowoomba': [-27.5550, 151.9700],
  rangeville: [-27.5700, 151.9600],
  caboolture: [-27.0847, 152.9511],
  'caboolture south': [-27.1050, 152.9500],
  redcliffe: [-27.2275, 153.0975],
  strathpine: [-27.3053, 152.9944],
  'deception bay': [-27.1925, 153.0261],
  kallangur: [-27.2564, 152.9892],
  morayfield: [-27.1056, 152.9517],
  burpengary: [-27.1578, 152.9578],
  mackay: [-21.1411, 149.1861],
  'west mackay': [-21.1500, 149.1700],
  'north mackay': [-21.1200, 149.1800],
  sarina: [-21.4167, 149.2167],
  cannonvale: [-20.2769, 148.6928],
  'mackay (r)': [-21.1411, 149.1861],
  rockhampton: [-23.3792, 150.5100],
  'rockhampton city': [-23.3792, 150.5100],
  berserker: [-23.3633, 150.5233],
  'north rockhampton': [-23.3583, 150.5083],
  'norman gardens': [-23.3517, 150.5217],
  yeppoon: [-23.1333, 150.7500],
  gladstone: [-23.8489, 151.2689],
  'gladstone central': [-23.8489, 151.2689],
  'west gladstone': [-23.8550, 151.2550],
  bundaberg: [-24.8661, 152.3489],
  'bundaberg central': [-24.8661, 152.3489],
  'bundaberg (r)': [-24.8661, 152.3489],
  maryborough: [-25.5411, 152.7011],
  'fraser coast (r)': [-25.5411, 152.7011],
  'hervey bay': [-25.2883, 152.8556],
  pialba: [-25.2833, 152.8333],
  urangan: [-25.2883, 152.9050],
  gympie: [-26.1894, 152.6656],
  atherton: [-17.2686, 145.4778],
  mareeba: [-16.9942, 145.4228],
  innisfail: [-17.5236, 146.0317],
  mossman: [-16.4600, 145.3700],
  cooktown: [-15.4736, 145.2500],
  kuranda: [-16.8167, 145.6333],
  ravenshoe: [-17.6000, 145.4833],
  malanda: [-17.3500, 145.5833],
  kingaroy: [-26.5403, 151.8397],
  murgon: [-26.2461, 151.9367],
  nanango: [-26.6733, 151.9917],
  wondai: [-26.3197, 151.8733],
  roma: [-26.5722, 148.7850],
  emerald: [-23.5272, 148.1642],
  longreach: [-23.4378, 144.2500],
  'mount isa': [-20.7256, 139.4927],
  townview: [-20.7350, 139.5050],
  cloncurry: [-20.7078, 140.5069],
  'charters towers': [-20.0764, 146.2614],
  bowen: [-20.0128, 148.2397],
  'st george': [-28.0400, 148.5800],
  charleville: [-26.4039, 146.2436],
  cunnamulla: [-28.0714, 145.6853],
  goondiwindi: [-28.5475, 150.3078],
  warwick: [-28.2150, 152.0350],
  stanthorpe: [-28.6564, 151.9331],
  dalby: [-27.1836, 151.2653],
  chinchilla: [-26.7397, 150.6300],
  gatton: [-27.5564, 152.2764],
  beaudesert: [-27.9872, 153.0064],
  jimboomba: [-27.8292, 153.0292],
  boonah: [-27.9978, 152.6842],
  biloela: [-24.4000, 150.5167],
  monto: [-24.8667, 151.1167],
  gayndah: [-25.6261, 151.6097],
  moranbah: [-22.0022, 148.0472],
  proserpine: [-20.4028, 148.5806],
  ingham: [-18.6528, 146.1617],
  tully: [-17.9333, 145.9250],
  ayr: [-19.5833, 147.4000],
  bamaga: [-10.8917, 142.3917],
  'thursday island': [-10.5833, 142.2167],
  pormpuraaw: [-14.8960, 141.6190],
  aurukun: [-13.3542, 141.7208],
  doomadgee: [-17.9333, 138.8333],
  normanton: [-17.6706, 141.0764],
  cherbourg: [-26.2867, 151.9500],
  barcaldine: [-23.5533, 145.2892],
  winton: [-22.3917, 143.0333],
  cleveland: [-27.5264, 153.2622],
  capalaba: [-27.5244, 153.1936],
  wynnum: [-27.4500, 153.1667],
  manly: [-27.4500, 153.1833],
  springwood: [-27.5964, 153.1282],
  shailer_park: [-27.6489, 153.1694],
  'shailer park': [-27.6489, 153.1694],
  loganholme: [-27.6517, 153.1775],
  eagleby: [-27.6944, 153.2150],
  beenleigh: [-27.7069, 153.2028],
  wacol: [-27.5828, 152.9306],
  'forest lake': [-27.6250, 152.9633],
  kenmore: [-27.5056, 152.9394],
  toowong: [-27.4833, 152.9833],
  auchenflower: [-27.4742, 152.9903],
  ashgrove: [-27.4425, 152.9883],
  paddington: [-27.4597, 152.9933],
  'north lakes': [-27.2339, 153.0281],
  sunnybank: [-27.5797, 153.0606],
  'sunnybank hills': [-27.5950, 153.0550],
  'upper mount gravatt': [-27.5556, 153.0825],
  'acacia ridge': [-27.5767, 153.0289],
  'bracken ridge': [-27.3167, 153.0333],
  chermside: [-27.3856, 153.0286],
  nundah: [-27.3939, 153.0522],
  newmarket: [-27.4333, 153.0083],
  mitchelton: [-27.4117, 152.9633],
  windsor: [-27.4350, 153.0283],
  wooloowin: [-27.4200, 153.0433],
  greenslopes: [-27.5050, 153.0467],
  coorparoo: [-27.4939, 153.0583],
  'camp hill': [-27.4933, 153.0733],
  annerley: [-27.5033, 153.0350],
  'stones corner': [-27.4992, 153.0450],
  morningside: [-27.4633, 153.0767],
  carina: [-27.4917, 153.1017],
  tingalpa: [-27.4733, 153.1150],
  banyo: [-27.3700, 153.0717],
  'bowen hills': [-27.4500, 153.0383],
  varsity_lakes: [-28.0889, 153.4100],
  'varsity lakes': [-28.0889, 153.4100],
  'parramatta park': [-16.9250, 145.7550],
  manoora: [-16.9350, 145.7450],
};

// Dynamically import map to avoid SSR issues with Leaflet
const OrgMapClient = dynamic(() => Promise.all([
  import('react-leaflet'),
  import('leaflet/dist/leaflet.css'),
]).then(([mod]) => {
  const { MapContainer, TileLayer, CircleMarker, Tooltip: LeafletTooltip } = mod;

  function OrgMap({ mapLocations, onLocationClick }: {
    mapLocations: MapLocation[];
    orgs?: OrgDirectoryItem[];
    onLocationClick?: (location: string) => void;
  }) {
    const locationGroups = useMemo(() => {
      const groups: Array<{ lat: number; lng: number; location: string; orgCount: number; totalDollars: number; hasIndigenous: boolean; almaCount: number }> = [];
      for (const loc of mapLocations) {
        const coords = QLD_LOCATIONS[loc.location];
        if (!coords) continue;
        groups.push({
          lat: coords[0], lng: coords[1],
          location: loc.location,
          orgCount: loc.org_count,
          totalDollars: loc.total_dollars,
          hasIndigenous: loc.indigenous_org_count > 0,
          almaCount: loc.alma_org_count,
        });
      }
      return groups;
    }, [mapLocations]);

    const maxDollars = Math.max(...locationGroups.map(g => g.totalDollars), 1);

    return (
      <MapContainer
        center={[-23, 148]}
        zoom={5}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ background: '#1a1a2e' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {locationGroups.map((group, i) => {
          const radius = Math.max(6, Math.min(30, 6 + (group.totalDollars / maxDollars) * 24));
          return (
            <CircleMarker
              key={i}
              center={[group.lat, group.lng]}
              radius={radius}
              pathOptions={{
                color: '#1f2937',
                weight: 1.5,
                fillColor: group.hasIndigenous ? '#f59e0b' : '#3b82f6',
                fillOpacity: 0.7,
              }}
              eventHandlers={{
                click: () => onLocationClick?.(group.location),
              }}
            >
              <LeafletTooltip direction="top" offset={[0, -radius]}>
                <div className="text-center">
                  <div className="font-bold capitalize">{group.location}</div>
                  <div className="text-xs text-gray-600">{group.orgCount} org{group.orgCount !== 1 ? 's' : ''}</div>
                  <div className="text-xs font-medium">{fmt(group.totalDollars)}</div>
                  {group.almaCount > 0 && (
                    <div className="text-xs text-green-600">{group.almaCount} ALMA-linked</div>
                  )}
                </div>
              </LeafletTooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    );
  }

  return OrgMap;
}), { ssr: false, loading: () => <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">Loading map...</div> });

// ── Main Page ──────────────────────────────────────────────

type Tab = 'overview' | 'search' | 'recipients' | 'organisations' | 'power' | 'tenders';

export default function JusticeFundingPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [years, setYears] = useState<YearRow[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSector, setSearchSector] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [indigenousOnly, setIndigenousOnly] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);

  // Recipients filter
  const [recipientSector, setRecipientSector] = useState('');
  const [recipientYear, setRecipientYear] = useState('');
  const [recipientIndigenous, setRecipientIndigenous] = useState(false);

  // Power ledger
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [power, setPower] = useState<any>(null);

  // Organisations directory
  const [orgDirectory, setOrgDirectory] = useState<OrgDirectoryItem[]>([]);
  const [orgDirTotal, setOrgDirTotal] = useState(0);
  const [orgDirLocations, setOrgDirLocations] = useState<Array<{ location: string; org_count: number }>>([]);
  const [orgDirLoading, setOrgDirLoading] = useState(false);
  const [orgDirSearch, setOrgDirSearch] = useState('');
  const [orgDirSector, setOrgDirSector] = useState('');
  const [orgDirLocation, setOrgDirLocation] = useState('');
  const [orgDirIndigenous, setOrgDirIndigenous] = useState(false);
  const [orgDirOffset, setOrgDirOffset] = useState(0);
  // Enhanced filters
  const [orgDirBeneficiary, setOrgDirBeneficiary] = useState('');
  const [orgDirPurpose, setOrgDirPurpose] = useState('');
  const [orgDirCharitySize, setOrgDirCharitySize] = useState('');
  const [orgDirFundingType, setOrgDirFundingType] = useState('');
  const [orgDirSource, setOrgDirSource] = useState('');
  const [orgDirAlmaOnly, setOrgDirAlmaOnly] = useState(false);
  const [orgDirSort, setOrgDirSort] = useState('funding');
  // Map data (all locations, not just current page)
  const [orgMapLocations, setOrgMapLocations] = useState<MapLocation[]>([]);
  const [orgDirSummary, setOrgDirSummary] = useState<OrgSummary | null>(null);

  // Tenders
  const [tenders, setTenders] = useState<StateTender[]>([]);

  // Org profile panel
  const [orgProfile, setOrgProfile] = useState<OrgProfile | null>(null);
  const [orgProfileLoading, setOrgProfileLoading] = useState(false);

  // Load dashboard data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ovRes, secRes, yrRes, recRes] = await Promise.all([
          fetch('/api/justice-funding?view=overview&state=QLD'),
          fetch('/api/justice-funding?view=by_sector&state=QLD'),
          fetch('/api/justice-funding?view=by_year&state=QLD'),
          fetch('/api/justice-funding?view=top_recipients&state=QLD&limit=25'),
        ]);
        const ovData = await ovRes.json();
        const secData = await secRes.json();
        const yrData = await yrRes.json();
        const recData = await recRes.json();

        // overview comes wrapped as {justice_funding_overview: {...}} from rpc
        const ov = ovData?.justice_funding_overview || ovData;
        if (ov && !ov.error && ov.total_records != null) setOverview(ov);
        setSectors(secData?.justice_funding_by_sector || (Array.isArray(secData) ? secData : []));
        setYears(yrData?.justice_funding_by_year || (Array.isArray(yrData) ? yrData : []));
        setRecipients(recData?.justice_funding_top_recipients || (Array.isArray(recData) ? recData : []));
      } catch (err) {
        console.error('Failed to load funding data:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Search handler
  const doSearch = useCallback(async (offset = 0) => {
    if (!searchQuery && !searchSector && !searchYear && !indigenousOnly) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({ state: 'QLD', limit: '50', offset: String(offset) });
      if (searchQuery) params.set('q', searchQuery);
      if (searchSector) params.set('sector', searchSector);
      if (searchYear) params.set('year', searchYear);
      if (indigenousOnly) params.set('indigenous', 'true');
      const res = await fetch(`/api/justice-funding?${params}`);
      const data = await res.json();
      setSearchResults(data);
      setSearchOffset(offset);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setSearchLoading(false);
  }, [searchQuery, searchSector, searchYear, indigenousOnly]);

  // Trigger search on filter change
  useEffect(() => {
    if (tab !== 'search') return;
    const timer = setTimeout(() => doSearch(0), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchSector, searchYear, indigenousOnly, tab, doSearch]);

  // Load recipients with filters
  useEffect(() => {
    if (tab !== 'recipients') return;
    async function loadRecipients() {
      const params = new URLSearchParams({ state: 'QLD', limit: '50' });
      if (recipientSector) params.set('sector', recipientSector);
      if (recipientYear) params.set('year', recipientYear);
      if (recipientIndigenous) params.set('indigenous', 'true');
      const res = await fetch(`/api/justice-funding?view=top_recipients&${params}`);
      const data = await res.json();
      setRecipients(data?.justice_funding_top_recipients || data || []);
    }
    loadRecipients();
  }, [tab, recipientSector, recipientYear, recipientIndigenous]);

  // Load power data
  useEffect(() => {
    if (tab !== 'power' || power) return;
    fetch('/api/justice-funding?view=power&state=QLD')
      .then(r => r.json())
      .then(data => setPower(data?.justice_funding_power_concentration || data))
      .catch(console.error);
  }, [tab, power]);

  // Build shared filter params for org directory + map
  const buildOrgFilterParams = useCallback(() => {
    const params = new URLSearchParams({ state: 'QLD' });
    if (orgDirSearch) params.set('q', orgDirSearch);
    if (orgDirSector) params.set('sector', orgDirSector);
    if (orgDirLocation) params.set('location', orgDirLocation);
    if (orgDirIndigenous) params.set('indigenous', 'true');
    if (orgDirBeneficiary) params.set('beneficiary', orgDirBeneficiary);
    if (orgDirPurpose) params.set('purpose', orgDirPurpose);
    if (orgDirCharitySize) params.set('charity_size', orgDirCharitySize);
    if (orgDirFundingType) params.set('funding_type', orgDirFundingType);
    if (orgDirSource) params.set('source', orgDirSource);
    if (orgDirAlmaOnly) params.set('alma_only', 'true');
    return params;
  }, [orgDirSearch, orgDirSector, orgDirLocation, orgDirIndigenous, orgDirBeneficiary, orgDirPurpose, orgDirCharitySize, orgDirFundingType, orgDirSource, orgDirAlmaOnly]);

  // Load organisations directory
  const loadOrgDirectory = useCallback(async (offset = 0) => {
    setOrgDirLoading(true);
    try {
      const params = buildOrgFilterParams();
      params.set('view', 'organizations');
      params.set('limit', '100');
      params.set('offset', String(offset));
      params.set('sort', orgDirSort);

      // Load org list and map data in parallel
      const mapParams = buildOrgFilterParams();
      mapParams.set('view', 'org_map');

      const [orgRes, mapRes] = await Promise.all([
        fetch(`/api/justice-funding?${params}`),
        offset === 0 ? fetch(`/api/justice-funding?${mapParams}`) : Promise.resolve(null),
      ]);
      const data = await orgRes.json();
      setOrgDirectory(data?.organizations || []);
      setOrgDirTotal(data?.total || 0);
      if (offset === 0 && data?.locations) setOrgDirLocations(data.locations);
      if (data?.summary) setOrgDirSummary(data.summary);
      setOrgDirOffset(offset);

      if (mapRes) {
        const mapData = await mapRes.json();
        setOrgMapLocations(Array.isArray(mapData) ? mapData : []);
      }
    } catch (err) {
      console.error('Failed to load org directory:', err);
    }
    setOrgDirLoading(false);
  }, [buildOrgFilterParams, orgDirSort]);

  useEffect(() => {
    if (tab !== 'organisations') return;
    const timer = setTimeout(() => loadOrgDirectory(0), 300);
    return () => clearTimeout(timer);
  }, [tab, orgDirSearch, orgDirSector, orgDirLocation, orgDirIndigenous, orgDirBeneficiary, orgDirPurpose, orgDirCharitySize, orgDirFundingType, orgDirSource, orgDirAlmaOnly, orgDirSort, loadOrgDirectory]);

  // Load tenders
  useEffect(() => {
    if (tab !== 'tenders' || tenders.length > 0) return;
    fetch('/api/justice-funding?view=tenders')
      .then(r => r.json())
      .then(data => setTenders(data?.tenders || []))
      .catch(console.error);
  }, [tab, tenders.length]);

  const switchToSearch = (q: string) => {
    setSearchQuery(q);
    setTab('search');
  };

  // Open org profile panel — load full money + impact + outcomes
  const openOrgProfile = useCallback(async (orgId: string) => {
    setOrgProfileLoading(true);
    try {
      const res = await fetch(`/api/justice-funding?view=org_profile&org=${orgId}`);
      const data = await res.json();
      setOrgProfile(data?.justice_funding_org_profile || data);
    } catch (err) {
      console.error('Failed to load org profile:', err);
    }
    setOrgProfileLoading(false);
  }, []);

  if (loading) {
    return (
      <>
        <MainNavigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading QLD justice funding data...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNavigation />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 pt-40 sm:pt-44 pb-12 sm:pb-16">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-3">
              <Scale className="w-4 h-4" />
              Queensland Justice Funding Tracker
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white">
              Where the Money Goes
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg">
              {overview && overview.unique_orgs != null && (
                <>
                  {fmt(overview.total_dollars)} in QLD justice spending across{' '}
                  {overview.unique_orgs.toLocaleString()} organisations over {overview.years_covered} years.{' '}
                  Search every dollar. See who&apos;s funded and who&apos;s missing out.
                </>
              )}
            </p>
            <div className="text-xs text-gray-500 mt-3">
              Source: Queensland Government Investment Portal (QGIP), Brisbane City Council,
              Ministerial Statements &bull; {overview?.earliest_year} to {overview?.latest_year}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-0">
              {([
                { id: 'overview' as Tab, label: 'Dashboard', icon: BarChart3 },
                { id: 'search' as Tab, label: 'Search', icon: Search },
                { id: 'recipients' as Tab, label: 'Top Recipients', icon: Building2 },
                { id: 'organisations' as Tab, label: 'Organisations', icon: MapPin },
                { id: 'tenders' as Tab, label: 'Tenders', icon: FileText },
                { id: 'power' as Tab, label: 'Power Ledger', icon: Shield },
              ]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* ─── OVERVIEW TAB ─── */}
          {tab === 'overview' && overview && overview.total_records != null && (
            <div className="space-y-8">
              {/* Inequality callout */}
              <InequalityCallout overview={overview} />

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  icon={DollarSign}
                  label="Total Funding"
                  value={fmt(overview.total_dollars)}
                  sub={`${overview.years_covered} years`}
                />
                <StatCard
                  icon={Building2}
                  label="Organisations"
                  value={overview.unique_orgs.toLocaleString()}
                  sub={`${overview.alma_linked.toLocaleString()} linked to ALMA`}
                />
                <StatCard
                  icon={Users}
                  label="Indigenous-Led Orgs"
                  value={overview.indigenous_orgs.toLocaleString()}
                  sub={`${pct(overview.indigenous_dollars, overview.total_dollars)} of funding`}
                />
                <StatCard
                  icon={Scale}
                  label="Grants"
                  value={overview.total_records.toLocaleString()}
                  sub={`${overview.unique_programs} programs`}
                />
              </div>

              {/* Charts side by side */}
              <div className="grid lg:grid-cols-2 gap-6">
                <SectorChart sectors={sectors} total={overview.total_dollars} />
                <YearTrend years={years} />
              </div>

              {/* Quick top recipients */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Top 25 Recipients</h3>
                  <button
                    onClick={() => setTab('recipients')}
                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                  >
                    View all <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <RecipientTable recipients={recipients} onSearch={switchToSearch} onViewProfile={openOrgProfile} />
              </div>
            </div>
          )}

          {/* ─── SEARCH TAB ─── */}
          {tab === 'search' && (
            <div className="space-y-6">
              {/* Search bar + filters */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by organisation, program, location, or ABN..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <select
                    value={searchSector}
                    onChange={e => setSearchSector(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">All sectors</option>
                    {Object.entries(SECTORS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select
                    value={searchYear}
                    onChange={e => setSearchYear(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">All years</option>
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={indigenousOnly}
                      onChange={e => setIndigenousOnly(e.target.checked)}
                      className="rounded"
                    />
                    Indigenous-led only
                  </label>
                  {(searchQuery || searchSector || searchYear || indigenousOnly) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchSector('');
                        setSearchYear('');
                        setIndigenousOnly(false);
                      }}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <SearchResults results={searchResults} loading={searchLoading} onViewProfile={openOrgProfile} />

              {/* Pagination */}
              {searchResults && searchResults.has_more && (
                <div className="flex justify-center gap-3">
                  {searchOffset > 0 && (
                    <button
                      onClick={() => doSearch(searchOffset - 50)}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => doSearch(searchOffset + 50)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Next page
                  </button>
                </div>
              )}

              {/* No query hint */}
              {!searchResults && !searchLoading && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p>Search for any organisation, program, place, or ABN</p>
                  <p className="text-sm mt-1">
                    Try &quot;Legal Aid&quot;, &quot;youth&quot;, &quot;Townsville&quot;, or an ABN like &quot;31665552196&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── RECIPIENTS TAB ─── */}
          {tab === 'recipients' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={recipientSector}
                  onChange={e => setRecipientSector(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All sectors</option>
                  {Object.entries(SECTORS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  value={recipientYear}
                  onChange={e => setRecipientYear(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All years</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={recipientIndigenous}
                    onChange={e => setRecipientIndigenous(e.target.checked)}
                    className="rounded"
                  />
                  Indigenous-led only
                </label>
              </div>

              <RecipientTable recipients={recipients} onSearch={switchToSearch} onViewProfile={openOrgProfile} />
            </div>
          )}

          {/* ─── ORGANISATIONS TAB ─── */}
          {tab === 'organisations' && (
            <div className="space-y-6">
              {/* Map — loads ALL matching locations */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Funding Map
                    <span className="text-sm font-normal text-gray-500">
                      — click a marker to filter by location
                    </span>
                  </h3>
                  <span className="text-xs text-gray-500">
                    {orgMapLocations.length} locations &bull; {orgDirTotal.toLocaleString()} orgs
                  </span>
                </div>
                <div className="h-[400px]">
                  <OrgMapClient
                    mapLocations={orgMapLocations}
                    onLocationClick={(loc) => setOrgDirLocation(loc)}
                  />
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> General
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Indigenous-led
                  </span>
                  <span className="text-gray-400">Size = funding amount</span>
                </div>
              </div>

              {/* Summary bar */}
              {orgDirSummary && (
                <div className="flex flex-wrap gap-4 px-1 text-sm">
                  <span className="text-gray-600">
                    Showing <span className="font-bold text-gray-900">{orgDirSummary.total_orgs.toLocaleString()}</span> organisations
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">
                    <span className="font-bold text-gray-900">{fmt(orgDirSummary.total_dollars)}</span> total funding
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">
                    <span className="font-bold text-amber-700">{orgDirSummary.indigenous_orgs.toLocaleString()}</span> Indigenous-led
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">
                    <span className="font-bold text-green-700">{orgDirSummary.alma_orgs.toLocaleString()}</span> ALMA-linked
                  </span>
                </div>
              )}

              {/* Quick filter chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Youth Justice Charities', beneficiary: 'ben_youth', sector: 'youth_justice' },
                  { label: 'Indigenous Pre/Post Release', beneficiary: 'ben_pre_post_release', indigenous: true },
                  { label: 'Large PBI Organisations', charitySize: 'Large', pbi: true },
                  { label: 'Reconciliation Orgs', purpose: 'purpose_reconciliation' },
                  { label: 'ALMA-Linked Only', almaOnly: true },
                ].map(chip => {
                  const isActive =
                    (chip.beneficiary && orgDirBeneficiary === chip.beneficiary) ||
                    (chip.purpose && orgDirPurpose === chip.purpose) ||
                    (chip.almaOnly && orgDirAlmaOnly);
                  return (
                    <button
                      key={chip.label}
                      onClick={() => {
                        // Reset all then apply chip
                        setOrgDirBeneficiary(chip.beneficiary || '');
                        setOrgDirPurpose(chip.purpose || '');
                        setOrgDirCharitySize(chip.charitySize || '');
                        setOrgDirSector(chip.sector || '');
                        setOrgDirIndigenous(!!chip.indigenous);
                        setOrgDirAlmaOnly(!!chip.almaOnly);
                        setOrgDirFundingType('');
                        setOrgDirSource('');
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        isActive
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* Enhanced filters */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={orgDirSearch}
                    onChange={e => setOrgDirSearch(e.target.value)}
                    placeholder="Search by organisation name, ABN, or location..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {orgDirSearch && (
                    <button onClick={() => setOrgDirSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                {/* Filter row */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <select value={orgDirLocation} onChange={e => setOrgDirLocation(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All locations</option>
                    {orgDirLocations.slice(0, 100).map(l => (
                      <option key={l.location} value={l.location}>
                        {l.location.replace(/\b\w/g, c => c.toUpperCase())} ({l.org_count})
                      </option>
                    ))}
                  </select>
                  <select value={orgDirSector} onChange={e => setOrgDirSector(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All sectors</option>
                    {Object.entries(SECTORS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select value={orgDirBeneficiary} onChange={e => setOrgDirBeneficiary(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All beneficiaries</option>
                    <option value="ben_youth">Youth</option>
                    <option value="ben_children">Children</option>
                    <option value="ben_aboriginal_tsi">First Nations</option>
                    <option value="ben_pre_post_release">Pre/Post Release</option>
                    <option value="ben_victims_of_crime">Victims of Crime</option>
                    <option value="ben_people_at_risk_of_homelessness">Homelessness Risk</option>
                  </select>
                  <select value={orgDirPurpose} onChange={e => setOrgDirPurpose(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All purposes</option>
                    <option value="purpose_law_policy">Law &amp; Policy</option>
                    <option value="purpose_reconciliation">Reconciliation</option>
                    <option value="purpose_human_rights">Human Rights</option>
                    <option value="purpose_social_welfare">Social Welfare</option>
                  </select>
                  <select value={orgDirCharitySize} onChange={e => setOrgDirCharitySize(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All sizes</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                  <select value={orgDirFundingType} onChange={e => setOrgDirFundingType(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All funding types</option>
                    <option value="grant">Grant</option>
                    <option value="capital">Capital</option>
                  </select>
                  <select value={orgDirSource} onChange={e => setOrgDirSource(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All sources</option>
                    <option value="qgip">QGIP</option>
                    <option value="brisbane_council">Brisbane Council</option>
                    <option value="qld_ministerial">Ministerial</option>
                  </select>
                  {/* Toggle filters */}
                  <label className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={orgDirIndigenous} onChange={e => setOrgDirIndigenous(e.target.checked)} className="rounded" />
                    Indigenous-led
                  </label>
                  <label className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={orgDirAlmaOnly} onChange={e => setOrgDirAlmaOnly(e.target.checked)} className="rounded" />
                    ALMA-linked
                  </label>
                  {/* Sort */}
                  <select value={orgDirSort} onChange={e => setOrgDirSort(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white ml-auto">
                    <option value="funding">Sort: Highest funded</option>
                    <option value="grants">Sort: Most grants</option>
                    <option value="name">Sort: Name A-Z</option>
                  </select>
                  {/* Clear all */}
                  {(orgDirSearch || orgDirSector || orgDirLocation || orgDirIndigenous || orgDirBeneficiary || orgDirPurpose || orgDirCharitySize || orgDirFundingType || orgDirSource || orgDirAlmaOnly) && (
                    <button
                      onClick={() => {
                        setOrgDirSearch(''); setOrgDirSector(''); setOrgDirLocation(''); setOrgDirIndigenous(false);
                        setOrgDirBeneficiary(''); setOrgDirPurpose(''); setOrgDirCharitySize('');
                        setOrgDirFundingType(''); setOrgDirSource(''); setOrgDirAlmaOnly(false);
                      }}
                      className="px-3 py-1.5 text-sm text-red-500 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              {orgDirLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                  Loading organisations...
                </div>
              ) : orgDirectory.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                  No organisations found. Try broadening your search.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                    {orgDirTotal.toLocaleString()} organisations
                    {orgDirTotal > 100 && ` (showing ${orgDirOffset + 1}-${orgDirOffset + orgDirectory.length})`}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Organisation</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Location</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Total Funding</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Grants</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Size</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgDirectory.map((org, i) => (
                          <tr
                            key={`${org.recipient_name}-${i}`}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => org.alma_linked && org.alma_org_id
                              ? openOrgProfile(org.alma_org_id)
                              : switchToSearch(org.recipient_name)
                            }
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-gray-900 line-clamp-1">
                                  {org.recipient_name || '(blank)'}
                                </span>
                                {org.is_indigenous && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex-shrink-0">
                                    Indigenous-led
                                  </span>
                                )}
                                {org.alma_linked && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded flex-shrink-0">
                                    ALMA
                                  </span>
                                )}
                                {org.is_pbi && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex-shrink-0">
                                    PBI
                                  </span>
                                )}
                              </div>
                              {org.recipient_abn && (
                                <div className="text-xs text-gray-400 mt-0.5">ABN {org.recipient_abn}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                              <span className="capitalize">{org.location?.toLowerCase() || '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                              {fmtFull(org.total_dollars)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">
                              {org.grant_count}
                            </td>
                            <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">
                              {org.charity_size ? (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  org.charity_size === 'Large' ? 'bg-blue-100 text-blue-800' :
                                  org.charity_size === 'Medium' ? 'bg-sky-100 text-sky-800' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {org.charity_size}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex flex-wrap justify-center gap-1">
                                {org.acnc_beneficiaries?.slice(0, 3).map(b => (
                                  <span key={b} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded">
                                    {b}
                                  </span>
                                ))}
                                {org.sectors?.slice(0, 2).map(s => (
                                  <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                                    {sectorLabel(s)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {orgDirTotal > 100 && (
                <div className="flex justify-center gap-3">
                  {orgDirOffset > 0 && (
                    <button
                      onClick={() => loadOrgDirectory(orgDirOffset - 100)}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  {orgDirOffset + 100 < orgDirTotal && (
                    <button
                      onClick={() => loadOrgDirectory(orgDirOffset + 100)}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Next page
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── TENDERS TAB ─── */}
          {tab === 'tenders' && (
            <div className="space-y-6">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-teal-900 text-lg">State Government Tenders</h3>
                    <p className="text-teal-800 mt-1">
                      Justice-related tenders and contracts from QLD, NSW, and VIC government procurement portals.
                      {tenders.length > 0 && ` ${tenders.length} tenders tracked.`}
                    </p>
                  </div>
                </div>
              </div>

              {tenders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Loading tenders...</div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {tenders.map(t => (
                      <div key={t.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {t.title}
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded flex-shrink-0 ${
                                t.status === 'open' ? 'bg-green-100 text-green-800' :
                                t.status === 'awarded' ? 'bg-blue-100 text-blue-800' :
                                t.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            {t.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{t.state}</span>
                              {t.buyer_name && <span>{t.buyer_name}</span>}
                              {t.supplier_name && <span>Supplier: {t.supplier_name}</span>}
                              {t.justice_keywords?.slice(0, 3).map(kw => (
                                <span key={kw} className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded">{kw}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {t.contract_value ? (
                              <div className="font-bold text-gray-900">{fmt(t.contract_value)}</div>
                            ) : (
                              <div className="text-sm text-gray-400">Value TBD</div>
                            )}
                            {t.source_url && (
                              <a href={t.source_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 justify-end mt-1">
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── POWER LEDGER TAB ─── */}
          {tab === 'power' && (
            <div className="space-y-8">
              {!power ? (
                <div className="text-center py-12 text-gray-500">Loading power analysis...</div>
              ) : (
                <>
                  {/* Concentration headline */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-red-900 text-lg">Power Concentration</h3>
                        <p className="text-red-800 mt-1">
                          <span className="font-bold">{power.concentration?.orgs_for_50pct}</span> organisations
                          control 50% of all QLD justice funding.{' '}
                          <span className="font-bold">{power.concentration?.orgs_for_80pct?.toLocaleString()}</span> control 80%.
                          Out of {overview?.unique_orgs.toLocaleString()} total orgs.
                        </p>
                        <p className="text-red-700 text-sm mt-2">
                          The top 10 alone hold <span className="font-bold">{power.top10_share?.pct}%</span> ({fmt(power.top10_share?.dollars || 0)}).
                          Zero of the top 25 repeat winners are Indigenous-led.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top 10 dominance */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Top 10 — Who Controls the Money</h3>
                    <div className="space-y-3">
                      {power.top10_share?.orgs?.map((org: { name: string; dollars: number }, i: number) => {
                        const barPct = (org.dollars / (power.top10_share.orgs[0]?.dollars || 1)) * 100;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 truncate mr-2">{org.name || '(blank)'}</span>
                              <span className="font-bold text-gray-900 whitespace-nowrap">{fmt(org.dollars)}</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${barPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Intermediaries */}
                  {power.intermediaries?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="font-bold text-gray-900 mb-2">
                        Intermediary Alert — Non-Indigenous Orgs in Community Service Delivery
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        These organisations received over $5M each in youth justice or community services
                        but are not Indigenous-led. Where money flows through external intermediaries instead
                        of community-controlled organisations.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="text-left px-3 py-2 font-medium text-gray-600">Organisation</th>
                              <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
                              <th className="text-right px-3 py-2 font-medium text-gray-600 hidden sm:table-cell">Grants</th>
                              <th className="text-center px-3 py-2 font-medium text-gray-600 hidden md:table-cell">Sectors</th>
                            </tr>
                          </thead>
                          <tbody>
                            {power.intermediaries.map((org: { recipient_name: string; total_dollars: number; grant_count: number; sectors: string[] }, i: number) => (
                              <tr key={i} className="border-b border-gray-100">
                                <td className="px-3 py-2 text-gray-900">{org.recipient_name}</td>
                                <td className="px-3 py-2 text-right font-bold text-gray-900">{fmt(org.total_dollars)}</td>
                                <td className="px-3 py-2 text-right text-gray-600 hidden sm:table-cell">{org.grant_count}</td>
                                <td className="px-3 py-2 hidden md:table-cell">
                                  <div className="flex flex-wrap justify-center gap-1">
                                    {org.sectors?.map(s => (
                                      <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                                        {sectorLabel(s)}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Repeat winners */}
                  {power.repeat_winners?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="font-bold text-gray-900 mb-2">Repeat Winners — Funded 10+ Years Straight</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Organisations receiving continuous government funding across a decade or more.
                        Continuity can mean stability — or entrenchment.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="text-left px-3 py-2 font-medium text-gray-600">Organisation</th>
                              <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
                              <th className="text-right px-3 py-2 font-medium text-gray-600">Years</th>
                              <th className="text-right px-3 py-2 font-medium text-gray-600 hidden sm:table-cell">Grants</th>
                            </tr>
                          </thead>
                          <tbody>
                            {power.repeat_winners.map((org: { recipient_name: string; total_dollars: number; years_active: number; grant_count: number; is_indigenous: boolean }, i: number) => (
                              <tr key={i} className="border-b border-gray-100">
                                <td className="px-3 py-2">
                                  <span className="text-gray-900">{org.recipient_name}</span>
                                  {org.is_indigenous && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                      Indigenous-led
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-gray-900">{fmt(org.total_dollars)}</td>
                                <td className="px-3 py-2 text-right text-gray-600">{org.years_active}</td>
                                <td className="px-3 py-2 text-right text-gray-600 hidden sm:table-cell">{org.grant_count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Org profile slide-over panel */}
      {orgProfileLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-3" />
            <div className="text-sm text-gray-600">Loading organisation profile...</div>
          </div>
        </div>
      )}
      {orgProfile && !orgProfileLoading && (
        <OrgProfilePanel profile={orgProfile} onClose={() => setOrgProfile(null)} />
      )}
    </>
  );
}
