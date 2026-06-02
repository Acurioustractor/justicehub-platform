'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  ChevronRight,
  ExternalLink,
  Filter,
  GraduationCap,
  HeartPulse,
  Home,
  LifeBuoy,
  List,
  MapPin,
  Phone,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { trackJourneyEvent } from '@/lib/analytics/journey';
import { RecordTrustBadges, TrustBadgeLegend } from '@/components/trust/RecordTrustBadges';

type ServiceCategory =
  | 'legal'
  | 'education'
  | 'housing'
  | 'health'
  | 'employment'
  | 'emergency'
  | 'family'
  | 'substance'
  | 'disability';

interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  location: string;
  contact: string;
  cost: 'free' | 'low' | 'moderate' | 'unknown';
  verified: boolean;
  verificationStatus?: string | null;
  lastUpdated: string | null;
  source?: string | null;
  eligibility?: string[];
  subcategory?: string;
}

interface ApiServiceRecord {
  id: string;
  name?: string | null;
  categories?: string[] | null;
  description?: string | null;
  location?:
    | {
        city?: string | null;
        region?: string | null;
        state?: string | null;
      }
    | string
    | null;
  contact?: {
    phone?: string | null;
    email?: string | null;
  } | null;
  cost?: string | null;
  verification_status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  data_source_url?: string | null;
  eligibility_criteria?: string[] | null;
}

interface CategoryOption {
  id: 'all' | ServiceCategory;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

interface StateOption {
  value: string;
  label: string;
  tokens: string[];
}

const categories: CategoryOption[] = [
  { id: 'all', label: 'All Support', shortLabel: 'All', icon: Target },
  { id: 'emergency', label: 'Crisis & Emergency', shortLabel: 'Crisis', icon: LifeBuoy },
  { id: 'legal', label: 'Legal Aid & Justice', shortLabel: 'Legal', icon: Scale },
  { id: 'housing', label: 'Housing & Accommodation', shortLabel: 'Housing', icon: Home },
  { id: 'health', label: 'Mental Health & Medical', shortLabel: 'Health', icon: HeartPulse },
  { id: 'education', label: 'Education & Training', shortLabel: 'Learning', icon: GraduationCap },
  { id: 'employment', label: 'Employment & Skills', shortLabel: 'Work', icon: Briefcase },
  { id: 'family', label: 'Family Support', shortLabel: 'Family', icon: Users },
  { id: 'substance', label: 'Substance Use Support', shortLabel: 'Substance', icon: ShieldCheck },
  { id: 'disability', label: 'Disability Support', shortLabel: 'Disability', icon: Sparkles },
];

const australianStates: StateOption[] = [
  { value: 'QLD', label: 'Queensland', tokens: ['QLD', 'Queensland'] },
  { value: 'NSW', label: 'New South Wales', tokens: ['NSW', 'New South Wales'] },
  { value: 'VIC', label: 'Victoria', tokens: ['VIC', 'Victoria'] },
  { value: 'SA', label: 'South Australia', tokens: ['SA', 'South Australia'] },
  { value: 'WA', label: 'Western Australia', tokens: ['WA', 'Western Australia'] },
  { value: 'TAS', label: 'Tasmania', tokens: ['TAS', 'Tasmania'] },
  { value: 'NT', label: 'Northern Territory', tokens: ['NT', 'Northern Territory'] },
  { value: 'ACT', label: 'Australian Capital Territory', tokens: ['ACT', 'Australian Capital Territory'] },
];

const quickNeeds = [
  {
    label: 'Crisis now',
    body: 'Safety, emergency, urgent help',
    category: 'emergency' as const,
    query: '',
    icon: LifeBuoy,
  },
  {
    label: 'Legal help',
    body: 'Court, rights, legal aid',
    category: 'legal' as const,
    query: '',
    icon: Scale,
  },
  {
    label: 'Somewhere safe',
    body: 'Housing, accommodation, family support',
    category: 'housing' as const,
    query: '',
    icon: Home,
  },
  {
    label: 'Mental health',
    body: 'Health, counselling, wellbeing',
    category: 'health' as const,
    query: '',
    icon: HeartPulse,
  },
  {
    label: 'Mentoring & learning',
    body: 'Learning, skills, trusted adults',
    category: 'education' as const,
    query: '',
    icon: GraduationCap,
  },
  {
    label: 'Family support',
    body: 'Family, kin, practical help',
    category: 'family' as const,
    query: '',
    icon: Users,
  },
];

const supportRoutes = [
  {
    label: 'Ask ALMA',
    body: 'Search the alternatives map for stronger community models.',
    href: '/alma',
  },
  {
    label: 'Curated programs',
    body: 'Open the smaller set of profiled community programs.',
    href: '/community-programs?source=services&intent=support',
  },
  {
    label: 'Youth remand guide',
    body: 'Understand why this support matters before court and detention.',
    href: '/remand',
  },
];

const RESULTS_STEP = 36;

function mapCategory(dbCategory: string): ServiceCategory {
  const categoryMap: Record<string, ServiceCategory> = {
    legal_aid: 'legal',
    legal: 'legal',
    court_support: 'legal',
    advocacy: 'legal',
    mental_health: 'health',
    medical: 'health',
    health: 'health',
    crisis_support: 'emergency',
    emergency: 'emergency',
    education_training: 'education',
    education: 'education',
    employment: 'employment',
    work: 'employment',
    housing: 'housing',
    accommodation: 'housing',
    substance_abuse: 'substance',
    substance: 'substance',
    family_support: 'family',
    family: 'family',
    case_management: 'family',
    disability: 'disability',
    disability_support: 'disability',
    ndis: 'disability',
  };

  return categoryMap[dbCategory] || 'family';
}

function formatLocation(location: ApiServiceRecord['location']): string {
  if (!location) return 'Australia-wide or location unknown';
  if (typeof location === 'string') return location;

  const parts = [location.city, location.region, location.state]
    .filter((part): part is string => Boolean(part))
    .filter((part, index, list) => list.findIndex((other) => other.toLowerCase() === part.toLowerCase()) === index);

  return parts.length ? parts.join(', ') : 'Australia-wide or location unknown';
}

function formatCost(cost: string | null | undefined): Service['cost'] {
  if (cost === 'free' || cost === 'low' || cost === 'moderate') return cost;
  return 'unknown';
}

function costLabel(cost: Service['cost']): string {
  switch (cost) {
    case 'free':
      return 'Free';
    case 'low':
      return 'Low cost';
    case 'moderate':
      return 'Moderate cost';
    default:
      return 'Cost unknown';
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Date unknown';
  try {
    return new Intl.DateTimeFormat('en-AU', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return 'Date unknown';
  }
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

function categoryLabel(categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.label || categoryId;
}

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [sortBy, setSortBy] = useState<string>('traceable');
  const [resultLimit, setResultLimit] = useState(RESULTS_STEP);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const state = params.get('state');
    const cost = params.get('cost');
    const query = params.get('q') || params.get('query');

    if (category) setSelectedCategory(category === 'all' ? 'all' : mapCategory(category));
    if (state) setSelectedState(state.toUpperCase());
    if (cost) setSelectedCost(cost);
    if (query) setSearchQuery(query);
  }, []);

  useEffect(() => {
    void loadServices();
  }, []);

  useEffect(() => {
    setResultLimit(RESULTS_STEP);
  }, [searchQuery, selectedCategory, selectedState, selectedCost, sortBy]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services?limit=1000');
      const data = await response.json();

      if (response.ok && data.success) {
        const formattedServices = ((data.data || []) as ApiServiceRecord[]).map((service) => {
          const primaryCategory = service.categories?.[0] || 'family';
          const source = normalizeUrl(service.data_source_url);

          return {
            id: service.id,
            name: service.name || 'Unnamed service',
            category: mapCategory(primaryCategory),
            description: service.description || 'No public description is available yet.',
            location: formatLocation(service.location),
            contact: service.contact?.phone || service.contact?.email || 'Open record for contact details',
            cost: formatCost(service.cost),
            verified: service.verification_status === 'verified',
            verificationStatus: service.verification_status || null,
            lastUpdated: service.updated_at || service.created_at || null,
            source,
            eligibility: service.eligibility_criteria || [],
            subcategory: primaryCategory,
          };
        });

        setServices(formattedServices);
      } else {
        console.error('Failed to load services:', data.error);
        setServices([]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services.length };
    for (const service of services) {
      counts[service.category] = (counts[service.category] || 0) + 1;
    }
    return counts;
  }, [services]);

  const verifiedCount = useMemo(() => services.filter((service) => service.verified).length, [services]);
  const sourceLinkedCount = useMemo(() => services.filter((service) => service.source).length, [services]);
  const needsReviewCount = Math.max(services.length - verifiedCount, 0);

  const filteredServices = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);

    return services.filter((service) => {
      const haystack = [
        service.name,
        service.description,
        service.location,
        service.contact,
        service.category,
        service.subcategory,
        ...(service.eligibility || []),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        searchTerms.length === 0 || searchTerms.every((term) => haystack.includes(term));
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      const selectedStateOption = australianStates.find((state) => state.value === selectedState);
      const matchesState =
        selectedState === 'all' ||
        selectedStateOption?.tokens.some((token) =>
          service.location.toLowerCase().includes(token.toLowerCase()),
        );
      const matchesCost = selectedCost === 'all' || service.cost === selectedCost;

      return matchesSearch && matchesCategory && matchesState && matchesCost;
    });
  }, [services, searchQuery, selectedCategory, selectedState, selectedCost]);

  const sortedServices = useMemo(() => {
    return [...filteredServices].sort((a, b) => {
      switch (sortBy) {
        case 'traceable': {
          const aTraceable = Number(Boolean(a.source)) + Number(a.verified);
          const bTraceable = Number(Boolean(b.source)) + Number(b.verified);
          if (aTraceable !== bTraceable) return bTraceable - aTraceable;
          return a.name.localeCompare(b.name);
        }
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'location-asc':
          return a.location.localeCompare(b.location);
        case 'updated-desc':
          return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [filteredServices, sortBy]);

  const hasFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedState !== 'all' ||
    selectedCost !== 'all';

  const activeFilterCount = [
    searchQuery.trim().length > 0,
    selectedCategory !== 'all',
    selectedState !== 'all',
    selectedCost !== 'all',
  ].filter(Boolean).length;

  const visibleServices = sortedServices.slice(0, resultLimit);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedState('all');
    setSelectedCost('all');
    setSortBy('traceable');
  };

  const applyQuickNeed = (need: (typeof quickNeeds)[number]) => {
    setSelectedCategory(need.category);
    setSearchQuery(need.query);
    setSelectedCost('all');

    void trackJourneyEvent({
      eventName: 'service_action_clicked',
      properties: {
        source: 'services_quick_need',
        action: 'quick_filter',
        category: need.category,
        query: need.query,
      },
    });

    window.setTimeout(() => {
      document.getElementById('service-results')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const trackOpenService = (service: Service, source: string) => {
    void trackJourneyEvent({
      eventName: 'service_action_clicked',
      properties: {
        source,
        action: 'view_service_details',
        service_id: service.id,
        category: service.category,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#0A0A0A]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navigation />

      <main id="main-content">
        <section className="border-b border-[#0A0A0A] bg-[#0A0A0A] pt-48 pb-10 text-white md:pt-52">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-[1.3fr_0.7fr] md:px-10 lg:px-12">
            <div>
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.28em] text-[#F97316]">
                Find support
              </p>
              <h1 className="mb-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
                Find support near the moment it matters.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Search youth justice support records across Australia. These are catalogue records,
                not endorsements, so check the badges, source link, and service details before
                relying on any record.
              </p>

              <div className="mt-7 rounded-lg border border-white/15 bg-white p-2 shadow-2xl">
                <div className="flex items-center gap-3 rounded-md bg-[#F7F3EA] px-4 py-3">
                  <Search className="h-5 w-5 shrink-0 text-[#0A0A0A]/45" />
                  <input
                    type="text"
                    placeholder="Search by need, place, service, or keyword"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base text-[#0A0A0A] placeholder:text-[#0A0A0A]/45 focus:outline-none md:text-lg"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="rounded-full p-1 text-[#0A0A0A]/45 transition-colors hover:bg-black/5 hover:text-[#0A0A0A]"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {quickNeeds.map((need) => {
                  const Icon = need.icon;
                  return (
                    <button
                      key={need.label}
                      type="button"
                      onClick={() => applyQuickNeed(need)}
                      className="group rounded-lg border border-white/15 bg-white/8 p-3 text-left transition-colors hover:border-white/35 hover:bg-white/14"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Icon className="h-4 w-4 text-[#F97316]" />
                        {need.label}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-white/55">{need.body}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-lg border border-white/15 bg-white/8 p-5">
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.24em] text-white/50">
                Use this safely
              </p>
              <div className="space-y-4 text-sm leading-6 text-white/70">
                <p>
                  Start broad, then narrow by state, category, and cost. Open the record before
                  contacting anyone, and prefer records with a source trail or human review.
                </p>
                <TrustBadgeLegend className="border-white/10 bg-white text-[#0A0A0A]" />
              </div>
              <div className="mt-5 grid gap-2">
                {supportRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => {
                      void trackJourneyEvent({
                        eventName: 'service_action_clicked',
                        properties: {
                          source: 'services_support_routes',
                          action: 'open_route',
                          route: route.href,
                        },
                      });
                    }}
                    className="group rounded-md border border-white/15 px-3 py-3 text-sm transition-colors hover:border-white/35 hover:bg-white/10"
                  >
                    <span className="flex items-center justify-between gap-3 font-bold text-white">
                      {route.label}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-white/55">{route.body}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#F7F3EA] text-[#0A0A0A]">
          <div className="mx-auto grid max-w-7xl gap-px bg-[#0A0A0A] px-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Records loaded',
                value: loading ? '...' : services.length.toLocaleString(),
                body: 'Broad catalogue, still being reviewed.',
              },
              {
                label: 'Source linked',
                value: loading ? '...' : sourceLinkedCount.toLocaleString(),
                body: 'Records with a public source trail.',
              },
              {
                label: 'Human verified',
                value: loading ? '...' : verifiedCount.toLocaleString(),
                body: 'Confirmed records where metadata allows it.',
              },
              {
                label: 'Needs review',
                value: loading ? '...' : needsReviewCount.toLocaleString(),
                body: 'Useful leads, not final recommendations.',
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#F7F3EA] px-6 py-5 text-[#0A0A0A]">
                <div className="text-2xl font-black text-[#0A0A0A]">{stat.value}</div>
                <div className="mt-1 text-sm font-bold text-[#0A0A0A]">{stat.label}</div>
                <p className="mt-1 text-xs leading-5 text-[#0A0A0A]/70">{stat.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#F7F3EA]">
          <div className="mx-auto max-w-7xl px-6 py-6 md:px-10 lg:px-12">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#0A0A0A]/50">
                  Choose a door
                </p>
                <h2 className="mt-1 text-2xl font-black">Filter by what someone needs.</h2>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0A0A0A]/20 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const active = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition-colors ${
                      active
                        ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                        : 'border-[#0A0A0A]/15 bg-white text-[#0A0A0A] hover:border-[#0A0A0A]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.shortLabel}</span>
                    <span className={active ? 'text-white/55' : 'text-[#0A0A0A]/40'}>
                      {categoryCounts[category.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="service-results" className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
            <div className="mb-6 grid gap-4 rounded-lg border border-[#0A0A0A]/10 bg-[#F7F3EA] p-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0A0A0A]/55">
                    <Filter className="h-3.5 w-3.5" />
                    State
                  </span>
                  <select
                    value={selectedState}
                    onChange={(event) => setSelectedState(event.target.value)}
                    className="w-full rounded-md border border-[#0A0A0A]/20 bg-white px-3 py-2 text-sm font-medium focus:border-[#0A0A0A] focus:outline-none"
                  >
                    <option value="all">All states</option>
                    {australianStates.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-[#0A0A0A]/55">
                    Cost
                  </span>
                  <select
                    value={selectedCost}
                    onChange={(event) => setSelectedCost(event.target.value)}
                    className="w-full rounded-md border border-[#0A0A0A]/20 bg-white px-3 py-2 text-sm font-medium focus:border-[#0A0A0A] focus:outline-none"
                  >
                    <option value="all">Any cost</option>
                    <option value="free">Free</option>
                    <option value="low">Low cost</option>
                    <option value="moderate">Moderate cost</option>
                    <option value="unknown">Cost unknown</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-[#0A0A0A]/55">
                    Sort
                  </span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="w-full rounded-md border border-[#0A0A0A]/20 bg-white px-3 py-2 text-sm font-medium focus:border-[#0A0A0A] focus:outline-none"
                  >
                    <option value="traceable">Most traceable first</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="location-asc">Location A-Z</option>
                    <option value="updated-desc">Recently updated</option>
                  </select>
                </label>
              </div>

              <div className="flex rounded-full border border-[#0A0A0A]/15 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    viewMode === 'cards' ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A]/60 hover:text-[#0A0A0A]'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    viewMode === 'list' ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A]/60 hover:text-[#0A0A0A]'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  {loading ? 'Loading services' : `${sortedServices.length.toLocaleString()} services found`}
                </h2>
                <p className="mt-1 text-sm text-[#0A0A0A]/60">
                  {loading
                    ? 'Loading catalogue records'
                    : [
                        sortedServices.length > 0 ? `Showing ${visibleServices.length.toLocaleString()} now` : null,
                        selectedCategory === 'all' ? 'All support types' : categoryLabel(selectedCategory),
                        selectedState !== 'all'
                          ? australianStates.find((state) => state.value === selectedState)?.label || selectedState
                          : null,
                        selectedCost !== 'all' ? costLabel(selectedCost as Service['cost']) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
              </div>
              <Link
                href="/contact?source=services&type=support&intent=support&route=/services"
                onClick={() => {
                  void trackJourneyEvent({
                    eventName: 'service_action_clicked',
                    properties: {
                      source: 'services_results_header',
                      action: 'request_support_call',
                    },
                  });
                }}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-[#DC2626] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B91C1C]"
              >
                Need help navigating this?
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-lg border border-[#0A0A0A]/10 bg-white p-5">
                    <div className="h-4 w-24 animate-pulse rounded bg-[#0A0A0A]/10" />
                    <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-[#0A0A0A]/10" />
                    <div className="mt-3 h-20 animate-pulse rounded bg-[#0A0A0A]/10" />
                  </div>
                ))}
              </div>
            ) : sortedServices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#0A0A0A]/25 bg-[#F7F3EA] p-8 text-center">
                <h3 className="text-xl font-black">No services matched that search.</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#0A0A0A]/60">
                  Try a broader need like “housing”, “legal”, “family”, or clear filters and start
                  again. If this is urgent, use the support call route.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-[#0A0A0A] bg-white px-4 py-2 text-sm font-bold hover:bg-[#0A0A0A] hover:text-white"
                  >
                    Clear filters
                  </button>
                  <Link
                    href="/contact?source=services&type=support&intent=support&route=/services"
                    className="rounded-full bg-[#0A0A0A] px-4 py-2 text-sm font-bold text-white"
                  >
                    Request support call
                  </Link>
                </div>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onOpen={() => trackOpenService(service, 'services_cards')}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleServices.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    onOpen={() => trackOpenService(service, 'services_list')}
                  />
                ))}
              </div>
            )}

            {!loading && visibleServices.length < sortedServices.length && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setResultLimit((current) => current + RESULTS_STEP)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A] bg-white px-5 py-3 text-sm font-bold transition-colors hover:bg-[#0A0A0A] hover:text-white"
                >
                  Show {Math.min(RESULTS_STEP, sortedServices.length - visibleServices.length)} more
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-[1fr_1fr] md:px-10 lg:px-12">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#F97316]">
                Better next step
              </p>
              <h2 className="mt-2 text-3xl font-black">Need an alternative model, not just a service listing?</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/alma"
                className="group rounded-lg border border-white/15 p-4 transition-colors hover:border-white/35 hover:bg-white/10"
              >
                <span className="flex items-center justify-between font-bold">
                  Search ALMA
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  See local alternative models with evidence, cost, and source badges.
                </p>
              </Link>
              <Link
                href="/justice-network/youth-remand"
                className="group rounded-lg border border-white/15 p-4 transition-colors hover:border-white/35 hover:bg-white/10"
              >
                <span className="flex items-center justify-between font-bold">
                  Understand remand
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Connect support records back to the bigger case for keeping children out of custody.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ServiceCard({ service, onOpen }: { service: Service; onOpen: () => void }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-[#0A0A0A]/12 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0A0A0A] hover:shadow-[0_16px_40px_rgba(10,10,10,0.08)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <span className="rounded-full bg-[#F7F3EA] px-2.5 py-1 text-xs font-bold text-[#0A0A0A]/70">
          {categoryLabel(service.category)}
        </span>
        <span className="text-xs font-medium text-[#0A0A0A]/45">Updated {formatDate(service.lastUpdated)}</span>
      </div>

      <h3 className="text-xl font-black leading-tight">{service.name}</h3>

      <RecordTrustBadges
        className="mt-3"
        verificationStatus={service.verificationStatus}
        hasLocation={Boolean(service.location)}
        locationLabel={service.location}
        hasCostData={service.cost !== 'unknown'}
        hasSource={Boolean(service.source)}
        sourceLabel={service.source ? 'Service source' : null}
        maxBadges={4}
      />

      <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#0A0A0A]/65">{service.description}</p>

      <div className="mt-5 space-y-2 text-sm text-[#0A0A0A]/70">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]/35" />
          <span>{service.location}</span>
        </div>
        <div className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]/35" />
          <span>{service.contact}</span>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]/35" />
          <span>{costLabel(service.cost)}</span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link
          href={`/services/${service.id}`}
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#DC2626]"
        >
          Open record
          <ChevronRight className="h-4 w-4" />
        </Link>
        {service.source && (
          <a
            href={service.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A]/15 px-4 py-2 text-sm font-bold transition-colors hover:border-[#0A0A0A]"
          >
            Source
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

function ServiceRow({ service, onOpen }: { service: Service; onOpen: () => void }) {
  return (
    <article className="rounded-lg border border-[#0A0A0A]/12 bg-white p-4 transition-colors hover:border-[#0A0A0A]">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F7F3EA] px-2.5 py-1 text-xs font-bold text-[#0A0A0A]/70">
              {categoryLabel(service.category)}
            </span>
            <RecordTrustBadges
              verificationStatus={service.verificationStatus}
              hasLocation={Boolean(service.location)}
              locationLabel={service.location}
              hasCostData={service.cost !== 'unknown'}
              hasSource={Boolean(service.source)}
              compact
              maxBadges={4}
            />
          </div>
          <h3 className="text-lg font-black">{service.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#0A0A0A]/60">{service.description}</p>
        </div>
        <div className="space-y-1 text-sm text-[#0A0A0A]/65">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0A0A0A]/35" />
            <span>{service.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0A0A0A]/35" />
            <span>{costLabel(service.cost)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            href={`/services/${service.id}`}
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#DC2626]"
          >
            Open
            <ArrowRight className="h-4 w-4" />
          </Link>
          {service.source && (
            <a
              href={service.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A]/15 px-4 py-2 text-sm font-bold transition-colors hover:border-[#0A0A0A]"
            >
              Source
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
