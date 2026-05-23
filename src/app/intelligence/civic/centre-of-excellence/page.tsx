import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search, Coins, Building2, FileText, MapPin, Users, GitBranch, Scale, Sparkles } from 'lucide-react';

import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Australian Centre of Excellence for Youth Justice | JusticeHub',
  description:
    'A one-stop civic intelligence layer for youth justice in Australia. Search, see funding, surface community-led work, contribute your service.',
};

async function fetchHeadlines() {
  const supabase = createServiceClient() as any;
  const [orgsCount, t1Count, claimsRes, evidenceRes, programsCount, grantsCount, foundationsRes, accoOrgs, sourcesActive, openGaps, sourcedGaps] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('archived', false),
    supabase.from('civic_org_classifications').select('id', { count: 'exact', head: true }).eq('tier', 1).not('confirmed_at', 'is', null),
    supabase.from('civic_intelligence_claims').select('id', { count: 'exact', head: true }),
    supabase.from('v_claim_evidence_summary').select('triangulation_tier'),
    supabase.from('alma_government_programs').select('id', { count: 'exact', head: true }),
    supabase.from('grant_opportunities').select('id', { count: 'exact', head: true }),
    supabase.from('foundation_grantees').select('foundation_abn'),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('acco_certified', true),
    supabase.from('data_sources_inventory').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('data_gap_questions').select('id', { count: 'exact', head: true }).in('status', ['open', 'investigating']),
    supabase.from('data_gap_questions').select('id', { count: 'exact', head: true }).eq('status', 'sourced'),
  ]);
  const tierTally: Record<string, number> = {};
  for (const r of evidenceRes.data || []) tierTally[r.triangulation_tier] = (tierTally[r.triangulation_tier] || 0) + 1;
  const distinctFoundations = new Set((foundationsRes.data || []).map((r: any) => r.foundation_abn).filter(Boolean));
  return {
    orgs: orgsCount.count || 0,
    tier1: t1Count.count || 0,
    claims: claimsRes.count || 0,
    triangulated: tierTally.triangulated || 0,
    corroborated: tierTally.corroborated || 0,
    programs: programsCount.count || 0,
    grants: grantsCount.count || 0,
    foundations: distinctFoundations.size,
    accoOrgs: accoOrgs.count || 0,
    activeSources: sourcesActive.count || 0,
    openGaps: openGaps.count || 0,
    sourcedGaps: sourcedGaps.count || 0,
  };
}

export default async function COEPage() {
  const h = await fetchHeadlines();

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-sm">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/intelligence/civic" className="text-stone-600 hover:text-stone-900">Civic Intelligence</Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Centre of Excellence</span>
        </div>
      </nav>

      <section className="bg-stone-900 text-stone-50 px-6 py-24 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-4">Australian Centre of Excellence for Youth Justice</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.02]">
            The numbers, the names, and the stories.
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-stone-300 leading-relaxed">
            Australia spends $1.14 billion locking up roughly 860 young people on the average day. The
            community-led response costs a tenth of that and reaches four times more young people. JusticeHub
            holds both pictures in one place — searchable, source-cited, contributable.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/exhibition" className="px-6 py-3 rounded-md bg-stone-50 text-stone-900 font-medium hover:bg-stone-200 transition flex items-center gap-2">
              <Search className="w-4 h-4" /> Search the data
            </Link>
            <Link href="/intelligence/civic" className="px-6 py-3 rounded-md border border-stone-600 text-stone-50 font-medium hover:bg-stone-800 transition flex items-center gap-2">
              <FileText className="w-4 h-4" /> Read the findings
            </Link>
            <Link href="/find-funding" className="px-6 py-3 rounded-md border border-stone-600 text-stone-50 font-medium hover:bg-stone-800 transition flex items-center gap-2">
              <Coins className="w-4 h-4" /> Find funding
            </Link>
            <Link href="/add-service" className="px-6 py-3 rounded-md border border-stone-600 text-stone-50 font-medium hover:bg-stone-800 transition flex items-center gap-2">
              <Users className="w-4 h-4" /> Add your service
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-6">What&apos;s in the catalogue</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Organisations tracked" value={h.orgs.toLocaleString()} />
            <StatBox label="Confirmed Tier 1 frontline YJ" value={h.tier1.toString()} />
            <StatBox label="ACCO-certified orgs" value={h.accoOrgs.toLocaleString()} />
            <StatBox label="Government YJ programs" value={h.programs.toString()} />
            <StatBox label="Live grant opportunities" value={h.grants.toLocaleString()} />
            <StatBox label="Tracked foundations" value={h.foundations.toString()} />
            <StatBox label="Civic intelligence claims" value={h.claims.toString()} accent="urgent" />
            <StatBox label="Claims triangulated by 3+ sources" value={h.triangulated.toString()} accent="positive" />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-6">Why this exists</h2>
          <div className="space-y-5 text-lg text-stone-800 leading-relaxed">
            <p>Aboriginal and Torres Strait Islander young people are <strong>20 times more likely</strong> to be under youth justice supervision than non-Indigenous young people. The systems that should support communities to do this work have been treating community-led organisations as an afterthought.</p>
            <p>Across all of Australian foundation philanthropy we track, <strong>1.46% reaches Aboriginal Community Controlled Organisations</strong>. Of the youth-justice-specific share, it&apos;s <strong>8.46%</strong> — still well below parity. Government runs programs it announces as community-led but only delivers the label to a handful.</p>
            <p>JusticeHub holds these numbers next to the names. Search a place. See who&apos;s there. See who&apos;s funding what. See the source for every claim, with confidence weighted by how many independent datasets back it.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-8">What you can do here</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ActionCard icon={<Search className="w-5 h-5" />} title="Find a service in your area" body="Search by place, by topic, or by name. Touch-friendly for kiosk use." href="/exhibition" />
            <ActionCard icon={<Coins className="w-5 h-5" />} title="Find funding for your service" body="21,000+ live grants. Filter by state and amount. See which foundations support YJ." href="/find-funding" />
            <ActionCard icon={<Building2 className="w-5 h-5" />} title="See what government is doing" body="76 government programs catalogued by jurisdiction, budget, and whether they&apos;re community-delivered." href="/intelligence/civic/government-programs" />
            <ActionCard icon={<MapPin className="w-5 h-5" />} title="Read place-based stories" body="Five named locales with the local Tier 1 universe, state context, and detention nearest." href="/intelligence/civic/locale" />
            <ActionCard icon={<Scale className="w-5 h-5" />} title="See independent oversight" body="107 recommendations from Sentencing Advisory Councils, Auditors-General, Children&apos;s Commissioners." href="/intelligence/civic" />
            <ActionCard icon={<Users className="w-5 h-5" />} title="Add your service" body="Touch-friendly intake. Reviewer checks then publishes." href="/add-service" />
            <ActionCard icon={<Sparkles className="w-5 h-5" />} title="See what changed this week" body="Living feed: claims refreshed, evidence added, Tier 1 confirmations, grants classified, oversight indexed." href="/intelligence/civic/whats-new" />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-b border-stone-200 bg-stone-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-2">Browse by state</h2>
          <p className="text-stone-600 mb-8">Detention cost, community alternatives, frontline organisations, foundation flows, oversight findings — for one jurisdiction at a time.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { code: 'nsw', name: 'New South Wales' },
              { code: 'vic', name: 'Victoria' },
              { code: 'qld', name: 'Queensland' },
              { code: 'wa', name: 'Western Australia' },
              { code: 'sa', name: 'South Australia' },
              { code: 'tas', name: 'Tasmania' },
              { code: 'act', name: 'ACT' },
              { code: 'nt', name: 'Northern Territory' },
            ].map((s) => (
              <Link
                key={s.code}
                href={`/intelligence/civic/state/${s.code}`}
                className="block border-2 border-stone-300 bg-white p-4 hover:border-stone-900 transition-colors rounded text-center"
              >
                <span className="text-xs font-mono uppercase tracking-widest text-stone-500">{s.code.toUpperCase()}</span>
                <p className="mt-1 font-semibold text-stone-900">{s.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-6 flex items-baseline gap-3">
            <GitBranch className="w-7 h-7 self-center" /> How we know what we know
          </h2>
          <div className="space-y-5 text-stone-800 leading-relaxed">
            <p>Every claim on JusticeHub has a citation trail. The triangulation framework means a claim earns its headline only when multiple independent datasets agree.</p>
            <p>We classify claims as <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-sm">Triangulated</span> (3+ sources) or <span className="font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-sm ml-2">Corroborated</span> (2 sources). Sources include:</p>
            <ul className="list-disc list-inside space-y-1.5 text-stone-700">
              <li>Productivity Commission Report on Government Services (ROGS)</li>
              <li>Australian Institute of Health and Welfare (AIHW)</li>
              <li>Office of the Registrar of Indigenous Corporations (ORIC) — authoritative ACCO test</li>
              <li>Australian Business Register (20 million ABN backbone)</li>
              <li>State Sentencing Advisory Councils + Auditors-General + Children&apos;s Commissioners</li>
              <li>Standing Council of Attorneys-General (SCAG) communiques</li>
              <li>Ministerial diary registers and Hansard</li>
              <li>Foundation grant records and ACNC charity returns</li>
            </ul>
            <p>Where claims have lower confidence we say so. The data-quality audit at{' '}<Link href="/intelligence/civic/data-quality" className="underline">/intelligence/civic/data-quality</Link> shows where the gaps are.</p>
          </div>

          {/* Data sufficiency transparency */}
          <div className="mt-10 border-t-2 border-stone-200 pt-8">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-3">Live data inventory</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="border-2 border-emerald-300 bg-emerald-50 rounded p-3">
                <p className="text-2xl font-bold text-stone-900">{h.activeSources}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-600 mt-0.5">Active sources</p>
              </div>
              <div className="border-2 border-rose-300 bg-rose-50 rounded p-3">
                <p className="text-2xl font-bold text-stone-900">{h.openGaps}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-600 mt-0.5">Open data gaps</p>
              </div>
              <div className="border-2 border-stone-300 bg-white rounded p-3">
                <p className="text-2xl font-bold text-stone-900">{h.sourcedGaps}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-600 mt-0.5">Closed by research agent</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-stone-700 leading-relaxed">
              A research agent runs every night looking for more sources to close the gaps we name. A freshness watcher catches sources that have not been refreshed. A health probe catches URLs that have gone offline. The system reconsiders &quot;do we have enough&quot; continuously, not just on demand.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-stone-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-8">For different audiences</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <AudienceCard title="If you fund this work" points={['See where the money is going and where it isn\'t', 'Compare your portfolio to the ACCO-share asymmetry', 'Find under-resourced Tier 1 frontline orgs']} href="/intelligence/civic/foundations" cta="Foundation analysis" />
            <AudienceCard title="If you research this work" points={['Citation-grade claims with full source trail', 'Methodology page documents every aggregation', 'Open-source data layer']} href="/intelligence/civic/methodology" cta="Methodology" />
            <AudienceCard title="If you do this work" points={['Find peer programs working in your area', 'Find live grants matching your sector', 'Add your service if it\'s not listed']} href="/exhibition" cta="Search the data" />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-stone-900 text-stone-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built from the community up.</h2>
          <p className="text-stone-300 mb-8 text-lg">JusticeHub is open infrastructure. The data, the schemas, and the methodology are public. The Australian Centre of Excellence for Youth Justice is what gets built when we hold both the data and the people in one place.</p>
          <Link href="/exhibition" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-stone-50 text-stone-900 font-medium hover:bg-stone-200 transition">
            Start searching <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: 'urgent' | 'positive' }) {
  const accentCls = accent === 'urgent' ? 'border-rose-300 bg-rose-50' : accent === 'positive' ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white';
  return (
    <div className={`border-2 rounded-lg p-4 ${accentCls}`}>
      <div className="text-3xl font-bold text-stone-900">{value}</div>
      <div className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-1">{label}</div>
    </div>
  );
}

function ActionCard({ icon, title, body, href }: { icon: React.ReactNode; title: string; body: string; href: string }) {
  return (
    <Link href={href} className="border-2 border-stone-200 bg-white rounded-lg p-5 hover:border-stone-400 hover:shadow-md transition block">
      <div className="text-stone-700 mb-2">{icon}</div>
      <h3 className="text-lg font-bold text-stone-900 mb-1">{title}</h3>
      <p className="text-sm text-stone-700">{body}</p>
      <div className="mt-3 text-xs font-mono uppercase tracking-widest text-stone-600 flex items-baseline gap-1">Go <ArrowRight className="w-3 h-3 self-center" /></div>
    </Link>
  );
}

function AudienceCard({ title, points, href, cta }: { title: string; points: string[]; href: string; cta: string }) {
  return (
    <div className="border border-stone-200 bg-white rounded-lg p-5">
      <h3 className="text-lg font-bold text-stone-900 mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-stone-700 mb-4">
        {points.map((p, i) => (<li key={i} className="flex items-baseline gap-2"><span className="text-stone-400">·</span><span>{p}</span></li>))}
      </ul>
      <Link href={href} className="text-sm font-medium text-stone-900 underline">{cta} →</Link>
    </div>
  );
}
