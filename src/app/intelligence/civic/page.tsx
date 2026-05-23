import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';

import RhetoricTimeline from '@/components/intelligence/RhetoricTimeline';
import AccountabilityLoop from '@/components/intelligence/AccountabilityLoop';
import OversightList from '@/components/intelligence/OversightList';
import HansardList from '@/components/intelligence/HansardList';
import LivedExperienceContrast from '@/components/intelligence/LivedExperienceContrast';

import { SnapshotStatCard } from '@/components/intelligence/civic/SnapshotStatCard';
import { ChapterCitationsPanel } from '@/components/intelligence/civic/ChapterCitationsPanel';
import { getAllClaims, getEvidenceSummary, getYjHansardSample, getOversightRecommendations, getCharterCommitments, getConfirmedTier1Orgs } from '@/lib/civic-intelligence/queries';
import { createServiceClient } from '@/lib/supabase/service';
import { getFeaturedJusticeStories } from '@/lib/supabase/empathy-ledger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Civic Intelligence · Access · Promises · Oversight | JusticeHub',
  description:
    'Three chapters on what governments said about youth justice, where the money went, and what oversight bodies recommended. Senate-grade citations on every claim.',
  openGraph: {
    title: 'Civic Intelligence · Access · Promises · Oversight',
    description: 'Three chapters on what governments said, where the money went, and what oversight recommended.',
  },
};

const REGIONS = ['QLD', 'NT', 'NSW', 'VIC', 'WA', 'SA', 'ACT', 'TAS'] as const;
const COMING_V2_REGIONS = [] as const;

export default async function CivicIntelligencePage(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = props.searchParams ? await props.searchParams : {};
  const region = params?.region;

  const [claims, evidence, hansard, oversight, commitments, tier1Qld, tier1Nt, stories] = await Promise.all([
    getAllClaims(),
    getEvidenceSummary(),
    getYjHansardSample(12),
    getOversightRecommendations(25),
    getCharterCommitments(25),
    getConfirmedTier1Orgs('QLD'),
    getConfirmedTier1Orgs('NT'),
    getFeaturedJusticeStories(4).catch(() => []),
  ]);

  // Helper to extract evidence props for a claim
  const evid = (claimId: string) => ({
    triangulationTier: evidence[claimId]?.triangulation_tier as any,
    supportingSources: evidence[claimId]?.supporting_sources,
  });

  const accessClaims = Object.values(claims).filter((c) => c.chapter === 'access');
  const promiseClaims = Object.values(claims).filter((c) => c.chapter === 'promises');
  const oversightClaims = Object.values(claims).filter((c) => c.chapter === 'oversight');

  const headlineRatio = claims['access.ratio.consultancy_vs_tier1_funding.qld'];
  const consultancySpend = claims['access.sum.consultancy_yj_spend.qld'];
  const tier1Funding = claims['access.sum.tier_1_grant_inflows.qld'];
  const meetingAsymmetry = claims['access.ratio.dept_vs_frontline_meetings.qld'];
  const indigenousShare = claims['access.indigenous_share.qld'];
  const tier1QldClaim = claims['access.count.tier_1_orgs.qld'];
  const tier1NtClaim = claims['access.count.tier_1_orgs.nt'];

  // Detention vs community supervision claims (ROGS 2024-25)
  const detentionMultipleNational = claims['access.ratio.detention_vs_community_cost.national'];
  const detentionAnnualNational = claims['access.cost.detention_per_youth.annual.national'];
  const communityAnnualNational = claims['access.cost.community_per_youth.annual.national'];
  const detentionTotalNational = claims['access.cost.detention_total.national'];
  const communityTotalNational = claims['access.cost.community_total.national'];
  const detentionPopNational = claims['access.count.detention_avg_daily_pop.national'];
  const communityPopNational = claims['access.count.community_avg_daily_pop.national'];
  const detentionBedsNational = claims['access.count.detention_beds.national'];

  // Commitment stats for Promises chapter
  const commitmentsByStatus = commitments.reduce<Record<string, any[]>>((acc, c) => {
    const key = ((c.status as string) || 'unknown').toLowerCase().replace(/[\s-]+/g, '_');
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  // Oversight by status for Oversight chapter
  const oversightByStatus = oversight.reduce<Record<string, any[]>>((acc, r) => {
    const key = ((r.status as string) || 'unknown').toLowerCase().replace(/[\s-]+/g, '_');
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const supabase = createServiceClient() as any;
  const { count: hansardTotalCount } = await supabase
    .from('civic_hansard')
    .select('id', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />

      {/* Hero */}
      <section className="bg-stone-900 text-stone-50 px-6 py-20 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">Civic Intelligence · v1 · NT + QLD</p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Three chapters on the access gap.
          </h1>
          <p className="mt-5 max-w-2xl text-lg md:text-xl text-stone-300">
            What governments said. Where the money went. What oversight bodies recommended.
            Every claim on this page is anchored to a record you can audit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {REGIONS.map((r) => (
              <Link
                key={r}
                href={r === region ? '/intelligence/civic' : `/intelligence/civic?region=${r}`}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded border ${
                  r === region
                    ? 'bg-stone-50 text-stone-900 border-stone-50'
                    : 'bg-transparent text-stone-300 border-stone-600 hover:border-stone-400'
                }`}
              >
                {r}
              </Link>
            ))}
            {COMING_V2_REGIONS.map((r) => (
              <span
                key={r}
                className="px-4 py-2 text-xs font-mono uppercase tracking-widest rounded border border-stone-700 text-stone-500 italic"
                title="Coming in v2"
              >
                {r} · v2
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs font-mono text-stone-500">
            <Link href="/intelligence/civic/methodology" className="underline underline-offset-2 hover:text-stone-300">
              Read the full methodology →
            </Link>
          </p>
        </div>
      </section>

      {/* ──────────────────── Chapter 1: Access ──────────────────── */}
      <ChapterShell number="01" name="Access" tagline="Where the money goes when government talks about fixing youth justice.">
        {/* Detention vs Community comparison — the structural cost gap */}
        {detentionMultipleNational && (
          <div className="mb-10 border-2 border-rose-300 bg-rose-50 rounded-lg p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-rose-700 mb-3">Headline · ROGS 2024-25</p>
            <SnapshotStatCard claim={detentionMultipleNational} accent="urgent" size="lg" {...evid(detentionMultipleNational.claim_id)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {detentionAnnualNational && <SnapshotStatCard claim={detentionAnnualNational} accent="urgent" {...evid(detentionAnnualNational.claim_id)} />}
              {communityAnnualNational && <SnapshotStatCard claim={communityAnnualNational} accent="positive" {...evid(communityAnnualNational.claim_id)} />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {detentionTotalNational && <SnapshotStatCard claim={detentionTotalNational} accent="urgent" size="sm" {...evid(detentionTotalNational.claim_id)} />}
              {communityTotalNational && <SnapshotStatCard claim={communityTotalNational} accent="positive" size="sm" {...evid(communityTotalNational.claim_id)} />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {detentionPopNational && <SnapshotStatCard claim={detentionPopNational} accent="urgent" size="sm" {...evid(detentionPopNational.claim_id)} />}
              {communityPopNational && <SnapshotStatCard claim={communityPopNational} accent="positive" size="sm" {...evid(communityPopNational.claim_id)} />}
              {detentionBedsNational && <SnapshotStatCard claim={detentionBedsNational} size="sm" {...evid(detentionBedsNational.claim_id)} />}
            </div>
            <p className="mt-5 text-sm text-stone-700">
              Community supervision serves nearly four times as many young people for less than half the spend.
              The cost gap is not subtle. The numbers are pulled live from the Productivity Commission&apos;s Report
              on Government Services, table 17A.20 (detention) and 17A.21 (community-based supervision).
            </p>
          </div>
        )}

        {headlineRatio && (
          <div className="mb-6">
            <SnapshotStatCard claim={headlineRatio} accent="urgent" size="lg" context="Confirmed funding records, 2026-05-15 snapshot." {...evid(headlineRatio.claim_id)} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {consultancySpend && <SnapshotStatCard claim={consultancySpend} accent="urgent" {...evid(consultancySpend.claim_id)} />}
          {tier1Funding && <SnapshotStatCard claim={tier1Funding} accent="positive" {...evid(tier1Funding.claim_id)} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {tier1QldClaim && <SnapshotStatCard claim={tier1QldClaim} size="sm" {...evid(tier1QldClaim.claim_id)} />}
          {tier1NtClaim && <SnapshotStatCard claim={tier1NtClaim} size="sm" {...evid(tier1NtClaim.claim_id)} />}
          {indigenousShare && (
            <SnapshotStatCard
              claim={indigenousShare}
              displayValue={indigenousShare.value_numeric != null ? `${Math.round(Number(indigenousShare.value_numeric) * 100)}%` : 'n/a'}
              size="sm"
              {...evid(indigenousShare.claim_id)}
            />
          )}
        </div>

        {meetingAsymmetry && (
          <Callout label="Secondary claim · meeting register">
            <SnapshotStatCard claim={meetingAsymmetry} size="sm" {...evid(meetingAsymmetry.claim_id)} />
            <p className="mt-3 text-sm text-stone-700">
              The ministerial diary register contains near-zero direct consultancy meetings. That is not a sign that consultancies don't shape policy. It is a sign that procurement, not meetings, is where the access happens. The funding ratio above is the honest proxy. This number complements but does not replace it.
            </p>
          </Callout>
        )}

        <Subhead>The confirmed Tier 1 universe</Subhead>
        <p className="text-stone-700 mb-4">
          {tier1Qld.length + tier1Nt.length} primary frontline organisations make up the v1 Tier 1 universe across QLD and NT.
          Each classification starts as a machine proposal scored for confidence, then passes a review step against the
          Tier 1 definition before it counts here. Lower-confidence proposals remain in the curation queue.
        </p>
        <Tier1List qld={tier1Qld} nt={tier1Nt} />

        <ChapterCitationsPanel
          chapter="access"
          claims={accessClaims}
          liveSources={[
            { label: 'Confirmed Tier 1 organisations', href: '#tier-1-list', count: tier1Qld.length + tier1Nt.length },
          ]}
        />
      </ChapterShell>

      {/* ──────────────────── Chapter 2: Promises ──────────────────── */}
      <ChapterShell number="02" name="Promises" tagline="What governments said they would do. What state of completion those promises are in.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <PromiseStatusCard label="Made" count={commitmentsByStatus.made?.length || 0} accent="neutral" />
          <PromiseStatusCard label="In progress" count={commitmentsByStatus.in_progress?.length || 0} accent="positive" />
          <PromiseStatusCard label="No public evidence" count={commitmentsByStatus.unknown?.length || 0} accent="urgent" />
        </div>

        {promiseClaims.map((claim) => (
          <div key={claim.claim_id} className="mb-4">
            <SnapshotStatCard claim={claim} size="md" {...evid(claim.claim_id)} />
          </div>
        ))}

        <Callout label="Rhetoric over time">
          <RhetoricTimeline />
          <p className="mt-3 text-sm text-stone-700">
            Ministerial statements naming detention vs naming alternatives. The shape of the curve says more than any single quote.
          </p>
        </Callout>

        <Subhead>Tracked commitments</Subhead>
        {commitments.length > 0 ? (
          <ul className="space-y-3">
            {commitments.slice(0, 8).map((c, i) => (
              <li key={i} className="p-4 bg-white border border-stone-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1 text-xs font-mono uppercase tracking-widest text-stone-500">
                  <span>{(c.status as string) || 'status unknown'}</span>
                  {c.category && <><span>·</span><span>{c.category}</span></>}
                </div>
                <p className="text-stone-900 text-sm">{c.commitment_text}</p>
                {c.minister_name && <p className="mt-1 text-xs text-stone-500">{c.minister_name}{c.portfolio && `, ${c.portfolio}`}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-stone-600 italic">No commitments loaded for this region.</p>
        )}

        <ChapterCitationsPanel
          chapter="promises"
          claims={promiseClaims}
          liveSources={[
            { label: 'civic_charter_commitments', href: '/intelligence/civic/methodology#promises', count: commitments.length },
            { label: 'civic_hansard (YJ-filtered)', href: '#hansard', count: hansardTotalCount || 0 },
          ]}
        />
      </ChapterShell>

      {/* ──────────────────── Chapter 3: Oversight ──────────────────── */}
      <ChapterShell number="03" name="Oversight" tagline="What independent reviewers recommended. What happened next.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <PromiseStatusCard label="Accepted" count={oversightByStatus.accepted?.length || 0} accent="positive" />
          <PromiseStatusCard label="Accepted in principle" count={oversightByStatus.accepted_in_principle?.length || 0} accent="neutral" />
          <PromiseStatusCard label="Rejected" count={oversightByStatus.rejected?.length || 0} accent="urgent" />
          <PromiseStatusCard label="Deferred / silent" count={(oversightByStatus.deferred?.length || 0) + (oversightByStatus.no_response?.length || 0)} accent="urgent" />
        </div>

        {oversightClaims.map((claim) => (
          <div key={claim.claim_id} className="mb-4">
            <SnapshotStatCard claim={claim} size="md" {...evid(claim.claim_id)} />
          </div>
        ))}

        <Callout label="Lived experience vs policy rhetoric">
          <LivedExperienceContrast hansard={hansard as any} stories={stories as any} />
          <p className="mt-3 text-sm text-stone-700">
            Where the people inside the system describe the system differently than the people setting policy.
          </p>
        </Callout>

        <Subhead>Recommendations from named bodies</Subhead>
        <OversightList initialData={oversight as any} />

        <ChapterCitationsPanel
          chapter="oversight"
          claims={oversightClaims}
          liveSources={[
            { label: 'oversight_recommendations', href: '/intelligence/civic/methodology#oversight', count: oversight.length },
          ]}
        />
      </ChapterShell>

      {/* Footer: Hansard deep-dive + AccountabilityLoop + EL stories link */}
      <section id="hansard" className="bg-white border-t border-stone-200 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Deep dive · Hansard</p>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-4">Speeches and statements on youth justice</h2>
          <HansardList initialData={hansard.slice(0, 8) as any} />
        </div>
      </section>

      <section className="bg-stone-100 border-t border-stone-200 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Deep dive · Accountability loop</p>
          <AccountabilityLoop />
        </div>
      </section>

      {/* Methodology CTA */}
      <section className="bg-stone-900 text-stone-50 px-6 py-12 border-t border-stone-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">Source-grade transparency</p>
            <h3 className="text-2xl font-bold tracking-tight">Every claim on this page traces to a record you can audit.</h3>
          </div>
          <Link
            href="/intelligence/civic/methodology"
            className="inline-flex items-center gap-2 px-5 py-3 bg-stone-50 text-stone-900 font-medium rounded hover:bg-stone-200"
          >
            Read the methodology <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Building blocks ────────────────────────────────────────── */

function Nav() {
  return (
    <nav className="bg-white border-b border-stone-200 px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm">
        <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
        <Link href="/intelligence" className="text-stone-600 hover:text-stone-900">Intelligence Hub</Link>
        <span className="text-stone-400">/</span>
        <span className="text-stone-900 font-medium">Civic Intelligence</span>
        <Link href="/intelligence/civic/methodology" className="ml-auto text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
          Methodology
        </Link>
      </div>
    </nav>
  );
}

function ChapterShell({ number, name, tagline, children }: { number: string; name: string; tagline: string; children: React.ReactNode }) {
  return (
    <section className="px-6 py-16 border-b border-stone-200">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500">Chapter {number}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900">{name}</h2>
          <p className="mt-3 text-lg text-stone-700 max-w-2xl">{tagline}</p>
        </header>
        {children}
      </div>
    </section>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-10 mb-3 text-xs font-mono uppercase tracking-widest text-stone-500">{children}</h3>;
}

function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-8 p-5 border-l-4 border-stone-400 bg-stone-100 rounded-r">
      <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-2">{label}</p>
      {children}
    </div>
  );
}

function PromiseStatusCard({ label, count, accent }: { label: string; count: number; accent: 'neutral' | 'urgent' | 'positive' }) {
  const accentClass =
    accent === 'urgent' ? 'border-rose-300 bg-rose-50 text-rose-900'
    : accent === 'positive' ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
    : 'border-stone-300 bg-white text-stone-900';
  return (
    <div className={`p-4 border rounded-lg ${accentClass}`}>
      <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">{label}</p>
      <p className="text-3xl font-bold">{count}</p>
    </div>
  );
}

function Tier1List({ qld, nt }: { qld: any[]; nt: any[] }) {
  if (qld.length === 0 && nt.length === 0) {
    return (
      <div id="tier-1-list" className="p-5 bg-stone-100 border border-stone-300 rounded text-stone-700 italic text-sm">
        No Tier 1 organisations confirmed yet. The hand-curation sweep at <code>/admin/civic/tier-1-curation</code> populates this list. v1 ships once the sweep is complete.
      </div>
    );
  }

  return (
    <div id="tier-1-list" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">QLD · {qld.length}</p>
        <ul className="space-y-1.5 text-sm">
          {qld.map((o) => <Tier1Row key={o.organization_id} org={o} />)}
        </ul>
      </div>
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">NT · {nt.length}</p>
        <ul className="space-y-1.5 text-sm">
          {nt.map((o) => <Tier1Row key={o.organization_id} org={o} />)}
        </ul>
      </div>
    </div>
  );
}

function Tier1Row({ org }: { org: any }) {
  const href = org.org_slug ? `/intelligence/civic/orgs/${org.org_slug}` : null;
  return (
    <li className="flex items-center gap-2">
      {href ? (
        <Link href={href} className="text-stone-900 hover:underline underline-offset-2 flex-1 truncate">{org.org_name}</Link>
      ) : (
        <span className="text-stone-700 flex-1 truncate">{org.org_name}</span>
      )}
      {org.is_indigenous_org && (
        <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-amber-100 text-amber-900 rounded">Indigenous</span>
      )}
      <ChevronRight className="w-3 h-3 text-stone-400 flex-shrink-0" />
    </li>
  );
}
