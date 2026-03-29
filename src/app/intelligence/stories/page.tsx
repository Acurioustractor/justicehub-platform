import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, BookOpen, DollarSign, Building2,
  Heart, MessageCircle, MapPin, AlertTriangle, ExternalLink,
} from 'lucide-react';
import {
  DETENTION_COST_PER_CHILD,
  formatDollars,
} from '@/lib/intelligence/regional-computations';
import { Navigation, Footer } from '@/components/ui/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Story Bridge: The People Behind the Numbers | JusticeHub Intelligence',
  description:
    'Every data point on JusticeHub represents a real community. These are their stories — connecting human experience with funding, programs, and systemic evidence.',
  openGraph: {
    title: 'Story Bridge: The People Behind the Numbers',
    description:
      'Real stories from real communities, connected to the data that should be driving change.',
  },
};

/* ── Constants ──────────────────────────────────────────────── */

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'bg-emerald-600',
  'Effective (strong evaluation, positive outcomes)': 'bg-green-600',
  'Promising (community-endorsed, emerging evidence)': 'bg-amber-500',
  'Indigenous-led (culturally grounded, community authority)': 'bg-purple-600',
  'Untested (theory/pilot stage)': 'bg-gray-400',
};

const ALL_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];

/* ── Types ──────────────────────────────────────────────────── */

interface OrgContext {
  id: string;
  name: string;
  state: string | null;
  is_indigenous_org: boolean;
  control_type: string | null;
  funding_total: number;
  intervention_count: number;
  interventions: {
    name: string;
    evidence_level: string | null;
    cost_per_young_person: number | null;
  }[];
}

interface StoryRow {
  id: string;
  title: string | null;
  summary: string | null;
  full_story: string | null;
  story_type: string | null;
  region_slug: string | null;
  featured: boolean | null;
  published_at: string | null;
  created_at: string;
  linked_organization_ids: string[] | null;
}

/* ── Data Fetching ─────────────────────────────────────────── */

async function fetchStoryData() {
  const supabase = createServiceClient();

  // Parallel queries
  const [almaRes, syncedRes] = await Promise.all([
    supabase
      .from('alma_stories')
      .select('id, title, summary, full_story, story_type, region_slug, featured, published_at, created_at, linked_organization_ids')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('synced_stories')
      .select('id, title, summary, story_type, themes, is_featured, created_at, source')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const almaStories: StoryRow[] = (almaRes.data || []) as any[];
  const syncedStories = syncedRes.data || [];

  // Collect org IDs
  const orgIds = new Set<string>();
  for (const story of almaStories) {
    if (story.linked_organization_ids) {
      for (const id of story.linked_organization_ids) orgIds.add(id);
    }
  }

  let orgMap: Record<string, OrgContext> = {};

  if (orgIds.size > 0) {
    const orgIdArr = Array.from(orgIds);

    const [orgsRes, fundingRes, interventionsRes] = await Promise.all([
      supabase
        .from('organizations')
        .select('id, name, state, is_indigenous_org, control_type')
        .in('id', orgIdArr),
      supabase
        .from('justice_funding')
        .select('alma_organization_id, amount_dollars')
        .in('alma_organization_id', orgIdArr)
        .gt('amount_dollars', 0),
      supabase
        .from('alma_interventions')
        .select('name, evidence_level, cost_per_young_person, operating_organization_id')
        .in('operating_organization_id', orgIdArr)
        .neq('verification_status', 'ai_generated'),
    ]);

    const orgs = orgsRes.data || [];
    const funding = fundingRes.data || [];
    const interventions = (interventionsRes.data || []) as any[];

    // Build funding totals
    const fundingByOrg: Record<string, number> = {};
    for (const f of funding) {
      const oid = f.alma_organization_id;
      if (oid) fundingByOrg[oid] = (fundingByOrg[oid] || 0) + (Number(f.amount_dollars) || 0);
    }

    // Build interventions per org
    const interventionsByOrg: Record<string, any[]> = {};
    for (const i of interventions) {
      const oid = i.operating_organization_id;
      if (oid) {
        if (!interventionsByOrg[oid]) interventionsByOrg[oid] = [];
        interventionsByOrg[oid].push(i);
      }
    }

    for (const org of orgs) {
      orgMap[org.id] = {
        id: org.id,
        name: org.name,
        state: org.state,
        is_indigenous_org: org.is_indigenous_org ?? false,
        control_type: org.control_type,
        funding_total: fundingByOrg[org.id] || 0,
        intervention_count: interventionsByOrg[org.id]?.length || 0,
        interventions: (interventionsByOrg[org.id] || []).map((i: any) => ({
          name: i.name,
          evidence_level: i.evidence_level,
          cost_per_young_person: i.cost_per_young_person,
        })),
      };
    }
  }

  // Stats for data gap section
  const { count: totalIndigenousOrgs } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_indigenous_org', true);

  const statesWithStories = new Set<string>();
  for (const story of almaStories) {
    if (story.linked_organization_ids) {
      for (const id of story.linked_organization_ids) {
        const org = orgMap[id];
        if (org?.state) statesWithStories.add(org.state);
      }
    }
  }

  return {
    almaStories,
    syncedStories,
    orgMap,
    totalIndigenousOrgs: totalIndigenousOrgs || 0,
    statesWithStories,
  };
}

/* ── Page ───────────────────────────────────────────────────── */

export default async function StoryBridgePage() {
  const { almaStories, syncedStories, orgMap, totalIndigenousOrgs, statesWithStories } = await fetchStoryData();

  // Separate featured story (Mounty Yarns / "In Their Own Words")
  const featuredStory = almaStories.find(
    (s) => s.featured || (s.title && s.title.toLowerCase().includes('own words'))
  );
  const otherStories = almaStories.filter((s) => s.id !== featuredStory?.id);

  // Community voices = stories with story_type = 'community_voice'
  const communityVoices = almaStories.filter((s) => s.story_type === 'community_voice');
  const caseStudies = almaStories.filter((s) => s.story_type === 'case_study');

  const statesWithout = ALL_STATES.filter((s) => !statesWithStories.has(s));

  // Get orgs for the featured story
  const featuredOrgs = featuredStory?.linked_organization_ids
    ?.map((id) => orgMap[id])
    .filter(Boolean) || [];

  // Total funding across featured orgs
  const featuredTotalFunding = featuredOrgs.reduce((sum, o) => sum + o.funding_total, 0);
  const featuredTotalPrograms = featuredOrgs.reduce((sum, o) => sum + o.intervention_count, 0);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-[#059669]" />
              <p
                className="text-sm uppercase tracking-[0.3em] text-[#059669]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Story Bridge
              </p>
            </div>
            <h1
              className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The People Behind the Numbers
            </h1>
            <p className="text-lg text-white/70 max-w-3xl leading-relaxed">
              Every data point on JusticeHub represents a real community.
              Every funding gap has names and faces.
              These are the stories of people building alternatives to incarceration
              — often with little support and less funding.
            </p>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {[
                { value: String(almaStories.length), label: 'stories collected', icon: BookOpen },
                { value: String(communityVoices.length), label: 'community voices', icon: MessageCircle },
                { value: String(totalIndigenousOrgs.toLocaleString()), label: 'Indigenous orgs tracked', icon: Building2 },
                { value: String(statesWithout.length), label: 'states need stories', icon: MapPin },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-[#059669]" />
                    <span
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <p
                    className="text-xs text-white/50"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Story ──────────────────────────────────── */}
        {featuredStory && (
          <section className="py-16 border-b border-[#0A0A0A]/10">
            <div className="max-w-6xl mx-auto px-6 sm:px-12">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-4 h-4 text-[#DC2626]" />
                <p
                  className="text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/50"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Featured Story
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Story content — 2/3 width */}
                <div className="lg:col-span-2">
                  <h2
                    className="text-2xl md:text-3xl font-bold tracking-tight mb-4"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {featuredStory.title}
                  </h2>
                  {featuredStory.story_type && (
                    <span
                      className="inline-block text-xs px-2 py-1 rounded bg-[#0A0A0A]/5 mb-4"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {featuredStory.story_type === 'case_study' ? 'Case Study' : 'Community Voice'}
                    </span>
                  )}
                  <div className="text-[#0A0A0A]/70 leading-relaxed space-y-4">
                    {featuredStory.summary && (
                      <p className="text-lg font-medium text-[#0A0A0A]/90">
                        {featuredStory.summary}
                      </p>
                    )}
                    {featuredStory.full_story && (
                      <div className="prose prose-sm max-w-none">
                        {featuredStory.full_story.split('\n').filter(Boolean).slice(0, 8).map((para, i) => (
                          <p key={i} className="text-[#0A0A0A]/70">
                            {para}
                          </p>
                        ))}
                        {(featuredStory.full_story.split('\n').filter(Boolean).length > 8) && (
                          <p className="text-[#0A0A0A]/40 italic text-sm">
                            Story continues...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Data context sidebar — 1/3 width */}
                <div className="space-y-4">
                  <div className="bg-[#0A0A0A] text-white rounded-lg p-5">
                    <h3
                      className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Data Context
                    </h3>

                    {/* Funding */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-[#059669]" />
                        <span className="text-sm text-white/60">Total Funding Received</span>
                      </div>
                      <p
                        className={`text-xl font-bold ${featuredTotalFunding > 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {featuredTotalFunding > 0
                          ? formatDollars(featuredTotalFunding)
                          : '$0 from govt reoffending grants'}
                      </p>
                    </div>

                    {/* Programs */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-[#059669]" />
                        <span className="text-sm text-white/60">Programs Run</span>
                      </div>
                      <p
                        className="text-xl font-bold text-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {featuredTotalPrograms}
                      </p>
                    </div>

                    {/* Detention cost comparison */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <p className="text-xs text-white/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        For comparison
                      </p>
                      <p className="text-sm text-white/70">
                        Detention costs{' '}
                        <span className="font-bold text-[#DC2626]">
                          {formatDollars(DETENTION_COST_PER_CHILD)}/year
                        </span>
                        {' '}per child (ROGS 2026).
                      </p>
                      {featuredOrgs.some((o) =>
                        o.interventions.some((i) => i.cost_per_young_person)
                      ) && (
                        <p className="text-sm text-white/70 mt-2">
                          These community programs average{' '}
                          <span className="font-bold text-[#059669]">
                            {formatDollars(
                              Math.round(
                                featuredOrgs
                                  .flatMap((o) => o.interventions)
                                  .filter((i) => i.cost_per_young_person)
                                  .reduce((s, i) => s + (i.cost_per_young_person || 0), 0) /
                                  (featuredOrgs
                                    .flatMap((o) => o.interventions)
                                    .filter((i) => i.cost_per_young_person).length || 1)
                              )
                            )}/year
                          </span>
                          {' '}per young person.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Linked organizations */}
                  {featuredOrgs.length > 0 && (
                    <div className="bg-[#0A0A0A]/5 rounded-lg p-5">
                      <h3
                        className="text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/50 mb-3"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Linked Organizations
                      </h3>
                      <div className="space-y-3">
                        {featuredOrgs.map((org) => (
                          <div key={org.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3 h-3 text-[#0A0A0A]/40" />
                              <span className="font-medium">{org.name}</span>
                              {org.is_indigenous_org && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                  Indigenous-led
                                </span>
                              )}
                            </div>
                            {org.state && (
                              <span
                                className="text-xs text-[#0A0A0A]/40 ml-5"
                                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                              >
                                {org.state}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Story Cards Grid ─────────────────────────────────── */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  All Stories
                </h2>
                <p className="text-sm text-[#0A0A0A]/50 mt-1">
                  {almaStories.length} stories from communities across Australia
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherStories.map((story) => {
                const storyOrgs = (story.linked_organization_ids || [])
                  .map((id) => orgMap[id])
                  .filter(Boolean);
                const totalFunding = storyOrgs.reduce((s, o) => s + o.funding_total, 0);
                const totalPrograms = storyOrgs.reduce((s, o) => s + o.intervention_count, 0);

                return (
                  <div
                    key={story.id}
                    className="bg-white/60 border border-[#0A0A0A]/10 rounded-lg overflow-hidden hover:border-[#0A0A0A]/20 transition-colors"
                  >
                    {/* Card header */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        {story.story_type && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded ${
                              story.story_type === 'community_voice'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {story.story_type === 'community_voice' ? 'Community Voice' : 'Case Study'}
                          </span>
                        )}
                        {story.region_slug && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/50"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {story.region_slug}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-lg leading-tight mb-2">
                        {story.title || 'Untitled Story'}
                      </h3>

                      {story.summary && (
                        <p className="text-sm text-[#0A0A0A]/60 line-clamp-3">
                          {story.summary}
                        </p>
                      )}
                    </div>

                    {/* Data context footer */}
                    {storyOrgs.length > 0 && (
                      <div className="border-t border-[#0A0A0A]/5 bg-[#0A0A0A]/[0.02] px-5 py-3">
                        <div className="flex items-center gap-4 text-xs text-[#0A0A0A]/50"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {storyOrgs.length} org{storyOrgs.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {totalFunding > 0 ? formatDollars(totalFunding) : '$0'}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {totalPrograms} program{totalPrograms !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Show interventions with evidence levels */}
                        {storyOrgs.some((o) => o.interventions.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {storyOrgs
                              .flatMap((o) => o.interventions)
                              .slice(0, 4)
                              .map((intervention, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0A]/5"
                                >
                                  {intervention.evidence_level && (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        EVIDENCE_COLORS[intervention.evidence_level] || 'bg-gray-300'
                                      }`}
                                    />
                                  )}
                                  <span className="truncate max-w-[120px]">
                                    {intervention.name}
                                  </span>
                                </span>
                              ))}
                            {storyOrgs.flatMap((o) => o.interventions).length > 4 && (
                              <span className="text-[10px] text-[#0A0A0A]/30 self-center">
                                +{storyOrgs.flatMap((o) => o.interventions).length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Community Voices Grid ────────────────────────────── */}
        {communityVoices.length > 0 && (
          <section className="py-16 bg-[#0A0A0A] text-white">
            <div className="max-w-6xl mx-auto px-6 sm:px-12">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-[#059669]" />
                <p
                  className="text-sm uppercase tracking-[0.3em] text-[#059669]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Community Voices
                </p>
              </div>
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                In Their Own Words
              </h2>
              <p className="text-white/60 mb-10 max-w-2xl">
                Direct testimonies from community members, Elders, and practitioners
                — the people who know what works because they live it every day.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityVoices.map((voice) => (
                  <div
                    key={voice.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-5 hover:border-white/20 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-[#059669] mb-3" />
                    <h3 className="font-bold text-white mb-2 leading-tight">
                      {voice.title || 'Community Voice'}
                    </h3>
                    {voice.summary && (
                      <p className="text-sm text-white/60 line-clamp-4 mb-3">
                        &ldquo;{voice.summary}&rdquo;
                      </p>
                    )}
                    {voice.region_slug && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {voice.region_slug}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Synced Stories from Empathy Ledger ───────────────── */}
        {syncedStories.length > 0 && (
          <section className="py-16 border-t border-[#0A0A0A]/10">
            <div className="max-w-6xl mx-auto px-6 sm:px-12">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-[#059669]" />
                <p
                  className="text-sm uppercase tracking-[0.3em] text-[#059669]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Empathy Ledger
                </p>
              </div>
              <h2
                className="text-2xl font-bold tracking-tight mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Stories from the Field
              </h2>
              <p className="text-[#0A0A0A]/60 mb-8 max-w-2xl">
                Additional stories synced from the Empathy Ledger — our companion platform
                for ethical storytelling and community-owned narratives.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {syncedStories.slice(0, 12).map((story: any) => (
                  <div
                    key={story.id}
                    className="bg-white/60 border border-[#0A0A0A]/10 rounded-lg p-4 hover:border-[#0A0A0A]/20 transition-colors"
                  >
                    <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2">
                      {story.title || 'Untitled'}
                    </h3>
                    {story.summary && (
                      <p className="text-xs text-[#0A0A0A]/50 line-clamp-3">
                        {story.summary}
                      </p>
                    )}
                    {story.source && (
                      <p
                        className="text-[10px] text-[#0A0A0A]/30 mt-2"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        via {story.source}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Data Gap: Stories We Can't Tell Yet ──────────────── */}
        <section className="py-16 border-t border-[#0A0A0A]/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              <p
                className="text-sm uppercase tracking-[0.3em] text-[#DC2626]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Data Gap
              </p>
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Stories We Can&apos;t Tell Yet
            </h2>
            <p className="text-[#0A0A0A]/60 mb-8 max-w-2xl">
              We track {totalIndigenousOrgs.toLocaleString()} Indigenous organizations across Australia,
              but we only have stories from {statesWithStories.size} of 8 states and territories.
              Behind every data point is a community with a story to tell.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {ALL_STATES.map((state) => {
                const hasStories = statesWithStories.has(state);
                return (
                  <div
                    key={state}
                    className={`rounded-lg p-4 border ${
                      hasStories
                        ? 'bg-[#059669]/5 border-[#059669]/20'
                        : 'bg-[#DC2626]/5 border-[#DC2626]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-lg font-bold"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {state}
                      </span>
                      {hasStories ? (
                        <span className="text-xs text-[#059669] font-medium">Stories collected</span>
                      ) : (
                        <span className="text-xs text-[#DC2626] font-medium">No stories yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Call to action */}
            <div className="bg-[#0A0A0A] text-white rounded-lg p-8 text-center">
              <h3
                className="text-xl font-bold tracking-tight text-white mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Help Us Tell These Stories
              </h3>
              <p className="text-white/60 mb-6 max-w-lg mx-auto">
                If your community has a story about youth justice, diversion, or the impact
                of funding decisions, we want to hear it. Every story is owned by the teller
                — always.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="https://www.empathyledger.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#059669] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#059669]/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Share on Empathy Ledger
                </Link>
                <Link
                  href="/intelligence/national"
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
                >
                  Explore the data <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Evidence Legend ──────────────────────────────────── */}
        <section className="py-8 border-t border-[#0A0A0A]/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-xs text-[#0A0A0A]/40 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Evidence Level Key
            </p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(EVIDENCE_SHORT).map(([full, short]) => (
                <div key={full} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${EVIDENCE_COLORS[full]}`} />
                  <span
                    className="text-xs text-[#0A0A0A]/50"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {short}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
