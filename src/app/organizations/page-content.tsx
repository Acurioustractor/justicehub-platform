'use client';

import type { ReactNode } from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Building2,
  Briefcase,
  Heart,
  Users,
  MapPin,
  Link2,
  ArrowUpRight,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
  X,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  abn: string | null;
  gs_entity_id: string | null;
  description: string | null;
  verification_status: string | null;
  city: string | null;
  state: string | null;
  tags: string[] | null;
}

interface OrganizationsPageContentProps {
  organizations: Organization[];
  totalOrgCount: number;
  programCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  claimedOrgIds: string[];
  dataStatus?: 'live' | 'partial';
}

interface DirectoryResponse {
  organizations?: Organization[];
  total?: number;
  programCounts?: Record<string, number>;
  serviceCounts?: Record<string, number>;
  teamCounts?: Record<string, number>;
  centrePartnerships?: Record<string, CentrePartnershipSummary>;
  claimedOrgIds?: string[];
  error?: string;
}

type DirectoryView = 'cards' | 'list';
type QuickFilter = 'all' | 'linked' | 'claimed' | 'with-services' | 'centre-partners' | 'needs-profile';
type CentrePartnershipSummary = { count: number; centres: string[]; types: string[] };

const DIRECTORY_PAGE_SIZE = 60;
const DIRECTORY_DISPLAY_INCREMENT = 60;
const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const QUICK_FILTERS: QuickFilter[] = ['all', 'linked', 'claimed', 'with-services', 'centre-partners', 'needs-profile'];
const VERIFICATION_FILTERS = ['all', 'verified', 'claimed', 'unverified'];
const SORT_OPTIONS = ['name-asc', 'name-desc', 'most-programs', 'most-services'];

function isVerifiedStatus(status: string | null) {
  return status === 'verified' || status === 'acnc_verified';
}

function mergeOrganizations(existing: Organization[], incoming: Organization[]) {
  const byId = new Map(existing.map((org) => [org.id, org]));
  incoming.forEach((org) => byId.set(org.id, org));
  return Array.from(byId.values());
}

function mergeCountMaps(existing: Record<string, number>, incoming: Record<string, number> | undefined) {
  return { ...existing, ...(incoming || {}) };
}

function mergeIds(existing: string[], incoming: string[] | undefined) {
  return Array.from(new Set([...existing, ...(incoming || [])]));
}

function mergeCentrePartnerships(
  existing: Record<string, CentrePartnershipSummary>,
  incoming: Record<string, CentrePartnershipSummary> | undefined
) {
  return { ...existing, ...(incoming || {}) };
}

function formatOrgType(type: string | null) {
  return type ? type.replace(/-/g, ' ') : null;
}

function formatLocation(org: Organization) {
  return [org.city, org.state].filter(Boolean).join(', ') || 'Location open';
}

function DirectoryBadge({
  children,
  tone = 'neutral',
  icon,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'blue' | 'purple' | 'ochre' | 'red';
  icon?: ReactNode;
}) {
  const tones = {
    neutral: 'border-earth-300 bg-white text-earth-700',
    green: 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800',
    blue: 'border-blue-700 bg-blue-50 text-blue-800',
    purple: 'border-purple-700 bg-purple-50 text-purple-800',
    ochre: 'border-ochre-700 bg-ochre-50 text-ochre-800',
    red: 'border-red-700 bg-red-50 text-red-800',
  };

  return (
    <span className={`inline-flex max-w-full items-center gap-1 border px-2 py-1 text-[11px] font-bold uppercase leading-none ${tones[tone]}`}>
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

function LinkSummary({
  programCount,
  serviceCount,
  teamCount,
  centreCount,
}: {
  programCount: number;
  serviceCount: number;
  teamCount: number;
  centreCount: number;
}) {
  const items = [
    { label: 'centre link', count: centreCount, icon: <Building2 className="h-3.5 w-3.5" />, className: 'text-red-700' },
    { label: 'program', count: programCount, icon: <Heart className="h-3.5 w-3.5" />, className: 'text-eucalyptus-700' },
    { label: 'service', count: serviceCount, icon: <Briefcase className="h-3.5 w-3.5" />, className: 'text-ochre-700' },
    { label: 'team', count: teamCount, icon: <Users className="h-3.5 w-3.5" />, className: 'text-blue-700' },
  ].filter((item) => item.count > 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-wrap gap-2 text-xs font-bold text-earth-500">
        <span className="border border-earth-200 bg-sand-50 px-2 py-1">Claim ready</span>
        <span className="border border-earth-200 bg-sand-50 px-2 py-1">Services open</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <span key={item.label} className={`inline-flex items-center gap-1 text-xs font-bold ${item.className}`}>
          {item.icon}
          {item.count} {item.label}{item.count === 1 ? '' : 's'}
        </span>
      ))}
    </div>
  );
}

function OrganizationCard({
  org,
  isClaimed,
  programCount,
  serviceCount,
  teamCount,
  centrePartnership,
}: {
  org: Organization;
  isClaimed: boolean;
  programCount: number;
  serviceCount: number;
  teamCount: number;
  centrePartnership?: CentrePartnershipSummary;
}) {
  const isVerified = isVerifiedStatus(org.verification_status);
  const hasGrantScope = Boolean(org.gs_entity_id || org.abn);
  const typeLabel = formatOrgType(org.type);
  const description = org.description || 'No public summary available yet.';
  const centreCount = centrePartnership?.count || 0;
  const centreNames = centrePartnership?.centres?.slice(0, 2) || [];

  return (
    <Link
      href={`/organizations/${org.slug || org.id}`}
      className={`group flex h-full min-h-[260px] flex-col border-2 border-black bg-white p-5 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] ${
        isClaimed ? 'shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]' : ''
      }`}
    >
      <div className="mb-4 flex min-h-[28px] flex-wrap items-start gap-1.5">
        {isClaimed && (
          <DirectoryBadge tone="purple" icon={<CheckCircle2 className="h-3 w-3" />}>
            Claimed
          </DirectoryBadge>
        )}
        {isVerified && (
          <DirectoryBadge tone="green" icon={<CheckCircle2 className="h-3 w-3" />}>
            Verified
          </DirectoryBadge>
        )}
        {hasGrantScope && (
          <DirectoryBadge tone="blue" icon={<Link2 className="h-3 w-3" />}>
            Civic graph
          </DirectoryBadge>
        )}
        {centreCount > 0 && (
          <DirectoryBadge tone="red" icon={<Building2 className="h-3 w-3" />}>
            Centre partner
          </DirectoryBadge>
        )}
        {typeLabel && <DirectoryBadge>{typeLabel}</DirectoryBadge>}
      </div>

      <h3 className="line-clamp-3 break-words text-xl font-bold leading-tight text-earth-900 transition-colors group-hover:text-ochre-700">
        {org.name}
      </h3>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-earth-600">
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="truncate">{formatLocation(org)}</span>
      </div>

      <p className={`mt-3 line-clamp-3 text-sm leading-relaxed ${org.description ? 'text-earth-600' : 'text-earth-400'}`}>
        {description}
      </p>

      {centreCount > 0 && (
        <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
          <div className="font-bold uppercase">Works with detention centre{centreCount === 1 ? '' : 's'}</div>
          <div className="mt-1 line-clamp-2">
            {centreNames.length > 0 ? centreNames.join(' · ') : `${centreCount} centre link${centreCount === 1 ? '' : 's'} recorded`}
          </div>
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="border-t border-earth-200 pt-4">
          <LinkSummary programCount={programCount} serviceCount={serviceCount} teamCount={teamCount} centreCount={centreCount} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-xs font-medium text-earth-500">
            {org.abn ? `ABN ${org.abn}` : hasGrantScope ? 'GrantScope linked' : 'Identity link open'}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-blue-700">
            Open
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function OrganizationListRow({
  org,
  isClaimed,
  programCount,
  serviceCount,
  teamCount,
  centrePartnership,
}: {
  org: Organization;
  isClaimed: boolean;
  programCount: number;
  serviceCount: number;
  teamCount: number;
  centrePartnership?: CentrePartnershipSummary;
}) {
  const isVerified = isVerifiedStatus(org.verification_status);
  const hasGrantScope = Boolean(org.gs_entity_id || org.abn);
  const typeLabel = formatOrgType(org.type);
  const centreCount = centrePartnership?.count || 0;
  const linkedCount = programCount + serviceCount + teamCount + centreCount;

  return (
    <Link
      href={`/organizations/${org.slug || org.id}`}
      className="grid gap-3 border-b border-earth-200 p-4 transition-colors last:border-b-0 hover:bg-sand-50 md:grid-cols-[minmax(0,1.4fr)_minmax(170px,0.45fr)_minmax(240px,0.7fr)_auto]"
    >
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 break-words font-bold leading-tight text-earth-900">{org.name}</h3>
          {isClaimed && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-earth-500">
          {typeLabel && <span className="font-bold uppercase">{typeLabel}</span>}
          {org.abn && <span>ABN {org.abn}</span>}
          {org.gs_entity_id && <span>GrantScope linked</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 text-sm text-earth-600">
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="truncate">{formatLocation(org)}</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        {isVerified && <DirectoryBadge tone="green">Verified</DirectoryBadge>}
        {isClaimed && <DirectoryBadge tone="purple">Claimed</DirectoryBadge>}
        {hasGrantScope && <DirectoryBadge tone="blue">Civic graph</DirectoryBadge>}
        {centreCount > 0 && <DirectoryBadge tone="red">Centre partner</DirectoryBadge>}
        <DirectoryBadge tone={linkedCount > 0 ? 'ochre' : 'neutral'}>
          {linkedCount > 0 ? `${linkedCount} linked item${linkedCount === 1 ? '' : 's'}` : 'Profile open'}
        </DirectoryBadge>
      </div>

      <div className="flex items-center justify-end gap-1 text-sm font-bold text-blue-700">
        Open
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

export function OrganizationsPageContent({
  organizations,
  totalOrgCount,
  programCounts,
  serviceCounts,
  teamCounts,
  claimedOrgIds,
  dataStatus = 'live',
}: OrganizationsPageContentProps) {
  const [directoryOrgs, setDirectoryOrgs] = useState<Organization[]>(organizations);
  const [directoryTotal, setDirectoryTotal] = useState(totalOrgCount || organizations.length);
  const [loadedProgramCounts, setLoadedProgramCounts] = useState<Record<string, number>>(programCounts);
  const [loadedServiceCounts, setLoadedServiceCounts] = useState<Record<string, number>>(serviceCounts);
  const [loadedTeamCounts, setLoadedTeamCounts] = useState<Record<string, number>>(teamCounts);
  const [loadedCentrePartnerships, setLoadedCentrePartnerships] = useState<Record<string, CentrePartnershipSummary>>({});
  const [loadedClaimedOrgIds, setLoadedClaimedOrgIds] = useState<string[]>(claimedOrgIds);
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const filtersHaveMounted = useRef(false);
  const claimedSet = useMemo(() => new Set(loadedClaimedOrgIds), [loadedClaimedOrgIds]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState<DirectoryView>('cards');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  useEffect(() => {
    setDirectoryOrgs(organizations);
    setDirectoryTotal(totalOrgCount || organizations.length);
    setLoadedProgramCounts(programCounts);
    setLoadedServiceCounts(serviceCounts);
    setLoadedTeamCounts(teamCounts);
    setLoadedCentrePartnerships({});
    setLoadedClaimedOrgIds(claimedOrgIds);
  }, [organizations, totalOrgCount, programCounts, serviceCounts, teamCounts, claimedOrgIds]);

  // Derive unique states and types from the loaded working set.
  const states = useMemo(() => {
    const set = new Set<string>(AU_STATES);
    directoryOrgs.forEach((org) => {
      if (org.state) set.add(org.state);
    });
    return Array.from(set).sort();
  }, [directoryOrgs]);

  const types = useMemo(() => {
    const set = new Set<string>();
    directoryOrgs.forEach((org) => {
      if (org.type) set.add(org.type);
    });
    return Array.from(set).sort();
  }, [directoryOrgs]);

  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quick = params.get('quick') as QuickFilter | null;
    const verification = params.get('verification');
    const sort = params.get('sort');
    const state = params.get('state');
    const type = params.get('type');
    const q = params.get('q');
    const view = params.get('view');

    if (quick && QUICK_FILTERS.includes(quick)) setQuickFilter(quick);
    if (verification && VERIFICATION_FILTERS.includes(verification)) setVerificationFilter(verification);
    if (sort && SORT_OPTIONS.includes(sort)) setSortBy(sort);
    if (state) setStateFilter(state);
    if (type) setTypeFilter(type);
    if (q) setSearchQuery(q);
    if (view === 'list' || view === 'cards') setViewMode(view);
  }, []);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    stateFilter !== 'all' ||
    typeFilter !== 'all' ||
    verificationFilter !== 'all' ||
    quickFilter !== 'all';

  const fetchDirectoryPage = async ({ reset = false, offset }: { reset?: boolean; offset?: number } = {}) => {
    const requestedOffset = reset ? 0 : offset ?? directoryOrgs.length;
    const params = new URLSearchParams({
      offset: String(requestedOffset),
      limit: String(DIRECTORY_PAGE_SIZE),
      sort: sortBy,
      quick: quickFilter,
      verification: verificationFilter,
    });

    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (stateFilter !== 'all') params.set('state', stateFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);

    setIsDirectoryLoading(true);
    setDirectoryError(null);

    try {
      const response = await fetch(`/api/organizations/directory?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as DirectoryResponse;

      if (!response.ok) {
        throw new Error(payload.error || 'Organization directory failed to load');
      }

      const incomingOrgs = payload.organizations || [];
      setDirectoryOrgs((current) => (reset ? incomingOrgs : mergeOrganizations(current, incomingOrgs)));
      setDirectoryTotal((current) =>
        typeof payload.total === 'number'
          ? payload.total
          : Math.max(current, requestedOffset + incomingOrgs.length)
      );
      setLoadedProgramCounts((current) =>
        reset ? payload.programCounts || {} : mergeCountMaps(current, payload.programCounts)
      );
      setLoadedServiceCounts((current) =>
        reset ? payload.serviceCounts || {} : mergeCountMaps(current, payload.serviceCounts)
      );
      setLoadedTeamCounts((current) =>
        reset ? payload.teamCounts || {} : mergeCountMaps(current, payload.teamCounts)
      );
      setLoadedCentrePartnerships((current) =>
        reset ? payload.centrePartnerships || {} : mergeCentrePartnerships(current, payload.centrePartnerships)
      );
      setLoadedClaimedOrgIds((current) =>
        reset ? payload.claimedOrgIds || [] : mergeIds(current, payload.claimedOrgIds)
      );
      if (reset) setVisibleCount(30);
    } catch (error) {
      setDirectoryError(error instanceof Error ? error.message : 'Organization directory failed to load');
    } finally {
      setIsDirectoryLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return directoryOrgs
      .filter((org) => {
        // Search
        if (query) {
          const haystack = [
            org.name,
            org.description,
            org.city,
            org.state,
            org.type,
            org.abn,
            org.gs_entity_id,
            ...(org.tags || []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        // State
        if (stateFilter !== 'all' && org.state !== stateFilter) return false;
        // Type
        if (typeFilter !== 'all' && org.type !== typeFilter) return false;
        // Verification
        if (verificationFilter === 'verified' && !isVerifiedStatus(org.verification_status)) return false;
        if (verificationFilter === 'claimed' && !claimedSet.has(org.id)) return false;
        if (verificationFilter === 'unverified' && isVerifiedStatus(org.verification_status)) return false;
        // Quick filters
        if (quickFilter === 'linked' && !(org.gs_entity_id || org.abn)) return false;
        if (quickFilter === 'claimed' && !claimedSet.has(org.id)) return false;
        if (quickFilter === 'with-services' && !((loadedProgramCounts[org.id] || 0) + (loadedServiceCounts[org.id] || 0))) return false;
        if (quickFilter === 'centre-partners' && !(loadedCentrePartnerships[org.id]?.count > 0)) return false;
        if (quickFilter === 'needs-profile' && (claimedSet.has(org.id) || isVerifiedStatus(org.verification_status) || org.description)) return false;
        return true;
      })
      .sort((a, b) => {
        // Always sort claimed orgs first in default sort
        if (sortBy === 'name-asc' || sortBy === 'name-desc') {
          const aClaimed = claimedSet.has(a.id) ? 1 : 0;
          const bClaimed = claimedSet.has(b.id) ? 1 : 0;
          if (aClaimed !== bClaimed) return bClaimed - aClaimed;
        }

        switch (sortBy) {
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'most-programs': {
            const ap = (loadedProgramCounts[a.id] || 0) + (loadedServiceCounts[a.id] || 0);
            const bp = (loadedProgramCounts[b.id] || 0) + (loadedServiceCounts[b.id] || 0);
            return bp - ap || a.name.localeCompare(b.name);
          }
          case 'most-services': {
            const as2 = loadedServiceCounts[a.id] || 0;
            const bs = loadedServiceCounts[b.id] || 0;
            return bs - as2 || a.name.localeCompare(b.name);
          }
          default: // name-asc
            return a.name.localeCompare(b.name);
        }
      });
  }, [directoryOrgs, searchQuery, stateFilter, typeFilter, verificationFilter, quickFilter, sortBy, loadedProgramCounts, loadedServiceCounts, loadedCentrePartnerships, claimedSet]);

  useEffect(() => {
    if (!filtersHaveMounted.current) {
      filtersHaveMounted.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchDirectoryPage({ reset: true, offset: 0 });
    }, searchQuery.trim() ? 350 : 100);

    return () => window.clearTimeout(timeout);
  }, [searchQuery, stateFilter, typeFilter, verificationFilter, quickFilter, sortBy]);

  const visibleOrgs = filtered.slice(0, visibleCount);
  const shownCount = Math.min(visibleCount, filtered.length);
  const hasMore = visibleCount < filtered.length || directoryOrgs.length < directoryTotal;

  const handleLoadMore = async () => {
    const nextVisibleCount = visibleCount + DIRECTORY_DISPLAY_INCREMENT;
    if (nextVisibleCount > filtered.length && directoryOrgs.length < directoryTotal) {
      await fetchDirectoryPage({ offset: directoryOrgs.length });
    }
    setVisibleCount(nextVisibleCount);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStateFilter('all');
    setTypeFilter('all');
    setVerificationFilter('all');
    setQuickFilter('all');
    setSortBy('name-asc');
  };

  return (
    <>
      {/* Filter Bar */}
      <section className="py-6 border-b-2 border-black bg-white sticky top-0 z-30">
        <div className="container-justice">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-earth-900">Organization Directory</h2>
              <p className="text-sm text-earth-600">
                Search the full organization table, then open a record to build out programs, services, stories, funding, and claim status.
              </p>
            </div>
            <div className="flex border-2 border-black bg-white">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-bold ${viewMode === 'cards' ? 'bg-black text-white' : 'bg-white text-black hover:bg-sand-50'}`}
                aria-pressed={viewMode === 'cards'}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 border-l-2 border-black px-3 py-2 text-sm font-bold ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-black hover:bg-sand-50'}`}
                aria-pressed={viewMode === 'list'}
              >
                <ListIcon className="h-4 w-4" />
                List
              </button>
            </div>
          </div>

          {/* Search + Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
              <input
                type="text"
                placeholder="Search name, place, ABN, GrantScope, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400"
              />
            </div>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="all">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t.replace('-', ' ')}
                </option>
              ))}
            </select>

            {/* Verification Filter */}
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="claimed">Active (Claimed)</option>
              <option value="unverified">Unverified</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="most-programs">Most Programs</option>
              <option value="most-services">Most Services</option>
            </select>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 border-2 border-black bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All records' },
              { key: 'linked', label: 'ABN / GrantScope linked' },
              { key: 'claimed', label: 'Claimed' },
              { key: 'with-services', label: 'Programs or services' },
              { key: 'centre-partners', label: 'Centre partners' },
              { key: 'needs-profile', label: 'Needs profile work' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setQuickFilter(item.key as QuickFilter)}
                className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  quickFilter === item.key
                    ? 'border-black bg-black text-white'
                    : 'border-earth-300 bg-white text-earth-700 hover:border-black'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Result Count */}
          <div className="mt-3 text-sm text-earth-600 font-medium">
            Showing{' '}
            <span className="font-bold text-earth-900">{shownCount.toLocaleString()}</span>{' '}
            of {directoryTotal.toLocaleString()} organizations
            {directoryOrgs.length < directoryTotal && (
              <span className="text-earth-400"> ({directoryOrgs.length.toLocaleString()} loaded)</span>
            )}
            {isDirectoryLoading && (
              <span className="ml-2 text-blue-700">Loading directory...</span>
            )}
            {directoryError && (
              <span className="ml-2 text-red-700">{directoryError}</span>
            )}
          </div>
        </div>
      </section>

      {/* Filtered Organizations Grid */}
      <section className="py-12">
        <div className="container-justice">
          {filtered.length > 0 ? (
            <>
            {viewMode === 'cards' ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleOrgs.map((org) => {
                return (
                  <OrganizationCard
                    key={org.id}
                    org={org}
                    isClaimed={claimedSet.has(org.id)}
                    programCount={loadedProgramCounts[org.id] || 0}
                    serviceCount={loadedServiceCounts[org.id] || 0}
                    teamCount={loadedTeamCounts[org.id] || 0}
                    centrePartnership={loadedCentrePartnerships[org.id]}
                  />
                );
              })}
            </div>
            ) : (
              <div className="overflow-hidden border-2 border-black bg-white">
                {visibleOrgs.map((org) => {
                  return (
                    <OrganizationListRow
                      key={org.id}
                      org={org}
                      isClaimed={claimedSet.has(org.id)}
                      programCount={loadedProgramCounts[org.id] || 0}
                      serviceCount={loadedServiceCounts[org.id] || 0}
                      teamCount={loadedTeamCounts[org.id] || 0}
                      centrePartnership={loadedCentrePartnerships[org.id]}
                    />
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isDirectoryLoading}
                  className="px-6 py-3 border-2 border-black bg-ochre-50 text-earth-900 font-bold hover:bg-ochre-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  {isDirectoryLoading
                    ? 'Loading organizations...'
                    : `Load more (${Math.max(directoryTotal - shownCount, 0).toLocaleString()} remaining)`}
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-16">
              {dataStatus === 'partial' && organizations.length === 0 ? (
                <>
                  <p className="text-xl font-bold text-earth-900 mb-2">
                    Organization records are temporarily unavailable.
                  </p>
                  <p className="mx-auto max-w-2xl text-earth-600">
                    The centre map and cards remain available. Organization search will repopulate when the CivicGraph/Supabase source responds again.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl text-earth-600 mb-4">
                    No organizations match your filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border-2 border-black bg-ochre-100 text-ochre-800 font-bold hover:bg-ochre-200 transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

    </>
  );
}
