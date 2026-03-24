import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  BookOpen,
  ArrowRight,
  Clock,
  Newspaper,
  Zap,
  Calendar,
} from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'This Week | JusticeHub',
  description:
    'What changed on JusticeHub this week — new models, funding updates, stories, evidence, and network activity.',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default async function ThisWeekPage() {
  const supabase = createServiceClient() as any;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch this week's activity in parallel
  const [
    newModelsRes,
    newEvidenceRes,
    newStoriesRes,
    newFundingRes,
    newMediaRes,
    newOppsRes,
    newValidationsRes,
    newMembersRes,
    // Totals for context
    totalModelsRes,
    totalFundingRes,
  ] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id, name, type, evidence_level, created_at, organizations!alma_interventions_operating_organization_id_fkey(name, state)')
      .neq('verification_status', 'ai_generated')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('alma_evidence')
      .select('id, title, source_url, created_at')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('alma_stories')
      .select('id, title, story_type, created_at, organizations(name, state)')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('justice_funding')
      .select('id, amount_dollars, source, created_at')
      .gte('created_at', oneWeekAgo)
      .gt('amount_dollars', 0)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('alma_media_articles')
      .select('id, headline, source_name, created_at')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('youth_opportunities')
      .select('id, title, organization_name, created_at')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('peer_validations')
      .select('id, created_at')
      .gte('created_at', oneWeekAgo)
      .eq('is_public', true),
    supabase
      .from('network_memberships')
      .select('id, created_at')
      .gte('created_at', oneWeekAgo)
      .eq('status', 'active'),
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('justice_funding')
      .select('amount_dollars')
      .gt('amount_dollars', 0),
  ]);

  const newModels = newModelsRes.data || [];
  const newEvidence = newEvidenceRes.data || [];
  const newStories = newStoriesRes.data || [];
  const newFunding = newFundingRes.data || [];
  const newMedia = newMediaRes.data || [];
  const newOpps = newOppsRes.data || [];
  const newValidations = newValidationsRes.data || [];
  const newMembers = newMembersRes.data || [];

  const newFundingTotal = newFunding.reduce((s: number, f: any) => s + (Number(f.amount_dollars) || 0), 0);
  const totalModels = totalModelsRes.count || 0;
  const allFunding = totalFundingRes.data || [];
  const totalFunding = allFunding.reduce((s: number, f: any) => s + (Number(f.amount_dollars) || 0), 0);

  const hasActivity = newModels.length > 0 || newEvidence.length > 0 || newStories.length > 0 ||
    newFunding.length > 0 || newMedia.length > 0 || newOpps.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-[#059669]" />
              <p
                className="text-sm uppercase tracking-[0.3em] text-[#059669]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                This Week on JusticeHub
              </p>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              What Changed
            </h1>

            {/* Week summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { value: `+${newModels.length}`, label: 'new models', icon: TrendingUp, color: '#059669' },
                { value: `+${newEvidence.length}`, label: 'evidence items', icon: BookOpen, color: '#059669' },
                { value: newFundingTotal > 0 ? `+${fmt(newFundingTotal)}` : '+0', label: 'funding tracked', icon: DollarSign, color: '#DC2626' },
                { value: `+${newMembers.length}`, label: 'network members', icon: Users, color: '#059669' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {s.value}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12 space-y-12">
          {/* New Models */}
          {newModels.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#059669]" />
                <h2 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  New ALMA Models
                </h2>
                <span className="text-xs text-[#0A0A0A]/30">+{newModels.length} this week</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {newModels.slice(0, 10).map((m: any) => (
                  <div key={m.id} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4 flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#059669]/10 shrink-0 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{m.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.organizations && (
                          <span className="text-xs text-[#0A0A0A]/40">{m.organizations.name} · {m.organizations.state}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {m.type && <span className="text-[10px] px-1.5 py-0.5 bg-[#0A0A0A]/5 rounded text-[#0A0A0A]/50">{m.type}</span>}
                        {m.evidence_level && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#059669]/10 rounded text-[#059669]">
                            {m.evidence_level.split('(')[0].trim()}
                          </span>
                        )}
                        <span className="text-[10px] text-[#0A0A0A]/30">
                          <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                          {timeAgo(m.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {newModels.length > 10 && (
                <p className="text-xs text-[#0A0A0A]/30 mt-2">+ {newModels.length - 10} more this week</p>
              )}
            </section>
          )}

          {/* New Evidence */}
          {newEvidence.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-[#059669]" />
                <h2 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  New Evidence
                </h2>
                <span className="text-xs text-[#0A0A0A]/30">+{newEvidence.length} this week</span>
              </div>
              <div className="space-y-2">
                {newEvidence.slice(0, 8).map((e: any) => (
                  <div key={e.id} className="bg-white rounded-xl border border-[#0A0A0A]/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title || 'Evidence item'}</p>
                    </div>
                    <span className="text-[10px] text-[#0A0A0A]/30 shrink-0 ml-3">{timeAgo(e.created_at)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* New Media */}
          {newMedia.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-[#DC2626]" />
                <h2 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Media Coverage
                </h2>
                <span className="text-xs text-[#0A0A0A]/30">+{newMedia.length} this week</span>
              </div>
              <div className="space-y-2">
                {newMedia.slice(0, 6).map((m: any) => (
                  <div key={m.id} className="bg-white rounded-xl border border-[#0A0A0A]/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.headline}</p>
                      <p className="text-xs text-[#0A0A0A]/40">{m.source_name}</p>
                    </div>
                    <span className="text-[10px] text-[#0A0A0A]/30 shrink-0 ml-3">{timeAgo(m.created_at)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* New Opportunities */}
          {newOpps.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-[#059669]" />
                <h2 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  New Opportunities
                </h2>
                <span className="text-xs text-[#0A0A0A]/30">+{newOpps.length} this week</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {newOpps.slice(0, 6).map((o: any) => (
                  <div key={o.id} className="bg-white rounded-xl border border-[#0A0A0A]/10 px-4 py-3">
                    <p className="text-sm font-medium truncate">{o.title}</p>
                    {o.organization_name && (
                      <p className="text-xs text-[#0A0A0A]/40 mt-0.5">{o.organization_name}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No activity fallback */}
          {!hasActivity && (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 text-[#0A0A0A]/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Quiet week
              </h2>
              <p className="text-sm text-[#0A0A0A]/50 mb-6">
                No new activity this week. Check back soon — the crons run daily.
              </p>
            </div>
          )}

          {/* Platform totals */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Platform Totals
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {totalModels.toLocaleString()}
                </p>
                <p className="text-xs text-white/40">ALMA models</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {fmt(totalFunding)}
                </p>
                <p className="text-xs text-white/40">funding tracked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {allFunding.length.toLocaleString()}
                </p>
                <p className="text-xs text-white/40">funding records</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {(newValidations.length || 0)}
                </p>
                <p className="text-xs text-white/40">validations this week</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-3">
              <Link href="/proof" className="text-sm text-[#059669] font-semibold hover:underline flex items-center gap-1">
                Wall of Proof <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href="/follow-the-money" className="text-sm text-[#DC2626] font-semibold hover:underline flex items-center gap-1">
                Follow the Money <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href="/share" className="text-sm text-white/60 font-semibold hover:underline flex items-center gap-1">
                Share the Data <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
