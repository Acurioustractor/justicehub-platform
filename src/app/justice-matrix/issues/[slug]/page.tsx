import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { ArrowRight, Scale, Megaphone, Users, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Local research-tool tokens — matches /justice-matrix hub + explore. Scoped to
// this route; the global JusticeHub editorial design system is not used here.
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  accentSoft: 'rgba(74,37,96,0.08)',
  gold: '#d3b583',
};

interface Issue {
  id: string;
  slug: string;
  title: string;
  question: string;
  summary: string | null;
  category_tags: string[];
  hero_case_ids: string[] | null;
  playbook: string | null;
}
interface CaseRow {
  id: string;
  case_citation: string;
  court: string | null;
  year: number | null;
  jurisdiction: string;
  region: string | null;
  outcome: string | null;
  precedent_strength: string | null;
}
interface CampaignRow {
  id: string;
  campaign_name: string;
  country_region: string;
  start_year: number | null;
  is_ongoing: boolean | null;
  lead_organizations: string | null;
}

async function loadIssue(
  slug: string,
): Promise<{ issue: Issue; cases: CaseRow[]; campaigns: CampaignRow[] } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data: issue } = await supabase
    .from('justice_matrix_issues')
    .select('id,slug,title,question,summary,category_tags,hero_case_ids,playbook')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (!issue) return null;

  const [casesRes, campaignsRes] = await Promise.all([
    supabase
      .from('justice_matrix_cases')
      .select('id,case_citation,court,year,jurisdiction,region,outcome,precedent_strength')
      .overlaps('categories', issue.category_tags)
      .limit(40),
    supabase
      .from('justice_matrix_campaigns')
      .select('id,campaign_name,country_region,start_year,is_ongoing,lead_organizations')
      .overlaps('categories', issue.category_tags)
      .limit(30),
  ]);

  const heroSet = new Set<string>(issue.hero_case_ids ?? []);
  const strengthRank = (s: string | null) => (s === 'high' ? 0 : s === 'medium' ? 1 : s === 'low' ? 2 : 3);
  const cases = ((casesRes.data ?? []) as CaseRow[]).sort((a, b) => {
    const ah = heroSet.has(a.id) ? 0 : 1;
    const bh = heroSet.has(b.id) ? 0 : 1;
    if (ah !== bh) return ah - bh;
    const sr = strengthRank(a.precedent_strength) - strengthRank(b.precedent_strength);
    if (sr !== 0) return sr;
    return (b.year ?? 0) - (a.year ?? 0);
  });
  const campaigns = ((campaignsRes.data ?? []) as CampaignRow[]).sort(
    (a, b) => (b.start_year ?? 0) - (a.start_year ?? 0),
  );
  return { issue: issue as Issue, cases, campaigns };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await loadIssue(params.slug);
  if (!data) return { title: 'Issue · Justice Matrix' };
  return {
    title: `${data.issue.title} · Justice Matrix`,
    description: data.issue.question,
  };
}

export default async function IssuePage({ params }: { params: { slug: string } }) {
  const data = await loadIssue(params.slug);
  if (!data) notFound();
  const { issue, cases, campaigns } = data;

  const years = [...cases.map((c) => c.year), ...campaigns.map((m) => m.start_year)].filter(
    (y): y is number => typeof y === 'number',
  );
  const minY = years.length ? Math.min(...years) : null;
  const maxY = years.length ? Math.max(...years) : null;
  const exploreHref = `/justice-matrix/explore?cat=${encodeURIComponent(issue.category_tags.join(','))}&surface=refugee`;

  return (
    <main style={{ background: C.page, color: C.ink, fontFamily: SANS }} className="min-h-screen">
      {/* HERO — the question, not just a title */}
      <section className="relative overflow-hidden" style={{ background: 'radial-gradient(circle at 22% 0%, #3a1f4d, #1c1420 70%)' }}>
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-10 md:pb-12">
          <Link href="/justice-matrix/issues" className="inline-flex items-center gap-1.5 mb-5" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.gold }}>
            <span className="uppercase">Justice Matrix · Issues</span>
          </Link>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', color: '#cbb8d6' }} className="uppercase mb-3">
            {issue.title}
          </div>
          <h1 className="text-white font-semibold tracking-tight text-3xl md:text-5xl max-w-4xl leading-[1.08]">
            {issue.question}
          </h1>
          {issue.summary && (
            <p className="text-[15px] md:text-base max-w-2xl leading-7 mt-5" style={{ color: '#cbb8d6' }}>
              {issue.summary}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6" style={{ fontFamily: MONO, fontSize: 12, color: '#9f8bab' }}>
            <span>{cases.length} cases</span>
            <span>{campaigns.length} campaigns</span>
            {minY && maxY && <span>{minY === maxY ? minY : `${minY}–${maxY}`}</span>}
          </div>
        </div>
      </section>

      {/* TIMELINE SPINE */}
      {minY && maxY && (
        <section className="max-w-6xl mx-auto px-5 md:px-8 pt-7">
          <div className="relative h-9">
            <div className="absolute left-0 right-0 top-4 h-px" style={{ background: C.border }} />
            {cases.filter((c) => c.year).map((c) => {
              const x = maxY === minY ? 50 : ((c.year! - minY) / (maxY - minY)) * 100;
              return (
                <span
                  key={c.id}
                  title={`${c.case_citation} (${c.year})`}
                  className="absolute top-[10px] w-2.5 h-2.5 rounded-full -translate-x-1/2"
                  style={{ left: `${x}%`, background: C.accent, border: '2px solid #fff', boxShadow: '0 0 0 1px ' + C.border }}
                />
              );
            })}
            <span className="absolute left-0 top-6" style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{minY}</span>
            <span className="absolute right-0 top-6" style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{maxY}</span>
          </div>
        </section>
      )}

      {/* THREE COLUMNS — the weave */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">
        <div className="grid lg:grid-cols-3 gap-5">
          <Column icon={<Scale className="w-4 h-4" />} label="The Law" count={cases.length} color="#4a2560">
            {cases.length === 0 ? (
              <Empty>No cases linked to this issue yet.</Empty>
            ) : (
              cases.map((c) => <CaseItem key={c.id} c={c} hero={(issue.hero_case_ids ?? []).includes(c.id)} />)
            )}
          </Column>
          <Column icon={<Megaphone className="w-4 h-4" />} label="The Movement" count={campaigns.length} color="#a96a1c">
            {campaigns.length === 0 ? (
              <Empty>No advocacy campaigns linked to this issue yet. The legal contrast is the story here.</Empty>
            ) : (
              campaigns.map((m) => <CampaignItem key={m.id} m={m} />)
            )}
          </Column>
          <Column icon={<Users className="w-4 h-4" />} label="The People" count={0} color="#1f6f78">
            <Empty>
              Lived-experience accounts for this issue are not in the matrix yet.{' '}
              <Link href="/justice-matrix/contribute" className="underline" style={{ color: C.accent }}>
                Contribute one
              </Link>
              .
            </Empty>
          </Column>
        </div>
      </section>

      {/* PLAYBOOK */}
      {issue.playbook && (
        <section className="max-w-6xl mx-auto px-5 md:px-8 pb-10 md:pb-14">
          <div className="rounded-lg border p-6 md:p-8" style={{ background: '#fff8ef', borderColor: C.border }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: C.muted }} className="uppercase mb-1">
              Playbook
            </div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4" style={{ color: C.ink }}>
              What worked, what failed, what is reusable.
            </h2>
            <div className="space-y-3 text-[15px] leading-7" style={{ color: C.body }}>
              {issue.playbook.split('\n\n').map((p, i) => (
                <p key={i}>{renderInline(p)}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER LINKS */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <div className="flex flex-wrap gap-3">
          <Link href={exploreHref} className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold" style={{ background: C.accent, color: '#fff' }}>
            Open these in explore <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/justice-matrix/issues" className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium" style={{ background: C.surface, color: C.ink, border: `1px solid ${C.border}` }}>
            All issues
          </Link>
        </div>
        <p className="text-[12px] leading-5 mt-6 max-w-2xl" style={{ color: C.muted }}>
          Research resource, not legal advice. Read the original source before acting. Cases and campaigns are gathered by shared issue tags; some may be machine-extracted and pending human review.
        </p>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Local UI (research-tool; not shared)
// ---------------------------------------------------------------------------

// Minimal inline markdown: **bold** and *italic* only (enough for the playbook).
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={i++}>{tok.slice(2, -2)}</strong>);
    else parts.push(<em key={i++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Column({
  icon,
  label,
  count,
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: C.border }}>
        <span className="inline-flex items-center justify-center rounded-md h-7 w-7" style={{ background: `${color}14`, color }}>
          {icon}
        </span>
        <span className="font-semibold text-[15px]" style={{ color: C.ink }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }} className="ml-auto tabular-nums">{count}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-[13px] leading-6" style={{ borderColor: C.border, color: C.muted }}>
      {children}
    </div>
  );
}

function outcomeStyle(outcome: string | null): { label: string; bg: string; fg: string } | null {
  if (!outcome) return null;
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    favorable: { label: 'Favorable', bg: 'rgba(5,150,105,0.10)', fg: '#047857' },
    adverse: { label: 'Adverse', bg: 'rgba(220,38,38,0.10)', fg: '#b91c1c' },
    pending: { label: 'Pending', bg: 'rgba(217,119,6,0.12)', fg: '#b45309' },
  };
  return map[outcome] ?? null;
}

function CaseItem({ c, hero }: { c: CaseRow; hero: boolean }) {
  const o = outcomeStyle(c.outcome);
  const meta = [c.court, c.year ? String(c.year) : null].filter(Boolean).join(' · ');
  return (
    <Link
      href={`/justice-matrix/cases/${c.id}`}
      className="group block rounded-lg border p-3.5 transition-colors hover:border-zinc-300"
      style={{ background: C.surface, borderColor: hero ? C.accent : C.border }}
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        {hero && (
          <span className="rounded px-1.5 py-0.5" style={{ fontFamily: MONO, fontSize: 9, background: C.accentSoft, color: C.accent }}>
            anchor
          </span>
        )}
        {o && (
          <span className="rounded px-1.5 py-0.5" style={{ fontFamily: MONO, fontSize: 9, background: o.bg, color: o.fg }}>
            {o.label}
          </span>
        )}
        {c.precedent_strength && (
          <span className="rounded px-1.5 py-0.5" style={{ fontFamily: MONO, fontSize: 9, background: C.accentSoft, color: C.accent }}>
            {c.precedent_strength}
          </span>
        )}
      </div>
      <div className="font-medium text-[13.5px] leading-snug line-clamp-2" style={{ color: C.ink }}>
        {c.case_citation}
      </div>
      {meta && (
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }} className="mt-1">
          {meta}
        </div>
      )}
    </Link>
  );
}

function CampaignItem({ m }: { m: CampaignRow }) {
  const status = m.is_ongoing
    ? { label: 'Active', bg: 'rgba(5,150,105,0.10)', fg: '#047857' }
    : { label: 'Concluded', bg: 'rgba(217,119,6,0.12)', fg: '#b45309' };
  return (
    <Link
      href={`/justice-matrix/campaigns/${m.id}`}
      className="group block rounded-lg border p-3.5 transition-colors hover:border-zinc-300"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        <span className="rounded px-1.5 py-0.5" style={{ fontFamily: MONO, fontSize: 9, background: status.bg, color: status.fg }}>
          {status.label}
        </span>
        {m.start_year && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{m.start_year}</span>
        )}
      </div>
      <div className="font-medium text-[13.5px] leading-snug line-clamp-2" style={{ color: C.ink }}>
        {m.campaign_name}
      </div>
      <div className="text-[11.5px] mt-1" style={{ color: C.muted }}>
        {m.country_region}
      </div>
    </Link>
  );
}
