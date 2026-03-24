import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  Mic,
  Heart,
  ArrowRight,
  Quote,
  Users,
  BookOpen,
  Camera,
} from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community Voices | JusticeHub',
  description:
    'Real stories from real people. Young people, community workers, Elders, and families sharing their experiences with the justice system and the alternatives that work.',
};

export default async function VoicesPage() {
  const supabase = createServiceClient() as any;

  // Get stories
  const { data: stories } = await supabase
    .from('alma_stories')
    .select('id, title, excerpt, story_type, created_at, organizations(name, slug, state)')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get storytellers from Empathy Ledger proxy (or fallback to stories count)
  const { data: storiesCount } = await supabase
    .from('alma_stories')
    .select('id', { count: 'exact', head: true });

  // Get media/photos count
  const { data: mediaCount } = await supabase
    .from('alma_media_articles')
    .select('id', { count: 'exact', head: true });

  // Get evidence items with story-like content
  const { data: findings } = await supabase
    .from('alma_research_findings')
    .select('id, content, finding_type, confidence, created_at')
    .eq('finding_type', 'lived_experience')
    .order('created_at', { ascending: false })
    .limit(10);

  const allStories = stories || [];
  const caseStudies = allStories.filter((s: any) => s.story_type === 'case_study');
  const communityVoices = allStories.filter((s: any) => s.story_type === 'community_voice');

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Real People, Real Stories
            </p>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Community Voices
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-8">
              The data proves the alternative works. But data doesn&apos;t change hearts.
              People do. These are the voices of young people, community workers, Elders,
              and families who live this every day.
            </p>

            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {storiesCount?.count || allStories.length}
                </p>
                <p className="text-xs text-white/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  stories shared
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {mediaCount?.count || 0}
                </p>
                <p className="text-xs text-white/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  media articles
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* Featured quote */}
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8 md:p-12 relative">
            <Quote className="w-12 h-12 text-[#0A0A0A]/5 absolute top-6 right-6" />
            <div className="max-w-3xl">
              <p className="text-xl md:text-2xl font-bold leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                &ldquo;This is time for alternative models of Australia to rise up, support
                our young kids, and build a safer community.&rdquo;
              </p>
              <p className="text-sm text-[#0A0A0A]/50 mt-4">
                — The ALMA Network founding statement
              </p>
            </div>
          </section>

          {/* Case Studies */}
          {caseStudies.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-5 h-5 text-[#059669]" />
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Case Studies
                </h2>
                <span className="text-xs text-[#0A0A0A]/30">{caseStudies.length} stories</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseStudies.map((story: any) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}

          {/* Community Voices */}
          {communityVoices.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Mic className="w-5 h-5 text-[#059669]" />
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Community Voices
                </h2>
                <span className="text-xs text-[#0A0A0A]/30">{communityVoices.length} voices</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communityVoices.map((story: any) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}

          {/* All stories fallback */}
          {caseStudies.length === 0 && communityVoices.length === 0 && allStories.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Stories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allStories.map((story: any) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}

          {/* Empathy Ledger Connection */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em] text-[#059669] mb-3"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Powered by Empathy Ledger
                </p>
                <h2
                  className="text-2xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Every Voice Is Protected
                </h2>
                <p className="text-white/70 mb-4">
                  Stories are captured through the Empathy Ledger — a platform built
                  specifically to protect the voices of vulnerable people. Storytellers
                  own their content. Consent is explicit. Nothing is published without
                  permission.
                </p>
                <p className="text-white/70">
                  Voice recordings, photos, and written stories are all stored securely
                  and attributed correctly. No exploitation. No parachute journalism. Just
                  real people sharing their truth on their own terms.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="space-y-4">
                  {[
                    { icon: Mic, label: 'Voice-first capture', desc: 'Record in your own words, in your own language' },
                    { icon: Camera, label: 'Photo documentation', desc: 'Real photos of real programs and real people' },
                    { icon: Heart, label: 'Consent-based', desc: 'Nothing published without explicit permission' },
                    { icon: Users, label: 'Community-owned', desc: 'Storytellers own their content, always' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3">
                        <Icon className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-white/40">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Share your story CTA */}
          <section className="text-center py-8">
            <h2
              className="text-2xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Share Your Story
            </h2>
            <p className="text-sm text-[#0A0A0A]/60 max-w-xl mx-auto mb-6">
              If you&apos;ve been affected by the youth justice system — as a young person,
              a family member, a worker, or a community member — your voice matters. Share
              your story through the ALMA Network.
            </p>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] text-white font-semibold rounded-lg hover:bg-[#0A0A0A]/90 transition-colors text-sm"
            >
              Share Your Story <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StoryCard({ story }: { story: any }) {
  const org = story.organizations;
  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#059669]/10 shrink-0">
          {story.story_type === 'case_study' ? (
            <BookOpen className="w-4 h-4 text-[#059669]" />
          ) : (
            <Mic className="w-4 h-4 text-[#059669]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{story.title}</h3>
          {org && (
            <p className="text-xs text-[#0A0A0A]/40 mt-0.5">
              {org.name} · {org.state}
            </p>
          )}
          {story.excerpt && (
            <p className="text-xs text-[#0A0A0A]/60 mt-2 line-clamp-3">
              {story.excerpt}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              story.story_type === 'case_study'
                ? 'bg-[#059669]/10 text-[#059669]'
                : 'bg-purple-500/10 text-purple-600'
            }`}>
              {story.story_type === 'case_study' ? 'Case Study' : 'Community Voice'}
            </span>
            <span className="text-[10px] text-[#0A0A0A]/30">
              {new Date(story.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
