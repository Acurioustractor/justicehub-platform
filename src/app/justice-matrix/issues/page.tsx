import Link from 'next/link';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Issues · Justice Matrix',
  description: 'Start from a question. Each issue gathers the law, the movement, and the people on one strategic problem.',
};

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
  gold: '#d3b583',
};

interface IssueCard {
  slug: string;
  title: string;
  question: string;
  summary: string | null;
  category_tags: string[];
  cases: number;
  campaigns: number;
}

async function loadIssues(): Promise<IssueCard[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { data: issues } = await supabase
    .from('justice_matrix_issues')
    .select('slug,title,question,summary,category_tags')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  const rows: IssueCard[] = [];
  for (const it of (issues ?? []) as Omit<IssueCard, 'cases' | 'campaigns'>[]) {
    const [casesRes, campaignsRes] = await Promise.all([
      supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }).overlaps('categories', it.category_tags),
      supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }).overlaps('categories', it.category_tags),
    ]);
    rows.push({ ...it, cases: casesRes.count ?? 0, campaigns: campaignsRes.count ?? 0 });
  }
  return rows;
}

export default async function IssuesIndexPage() {
  const issues = await loadIssues();

  return (
    <main style={{ background: C.page, color: C.ink, fontFamily: SANS }} className="min-h-screen">
      <section className="relative overflow-hidden" style={{ background: 'radial-gradient(circle at 22% 0%, #3a1f4d, #1c1420 70%)' }}>
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-10 md:pb-12">
          <Link href="/justice-matrix" className="inline-block mb-5 uppercase" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', color: C.gold }}>
            Justice Matrix
          </Link>
          <h1 className="text-white font-semibold tracking-tight text-3xl md:text-5xl max-w-3xl leading-[1.08] mb-4">
            Start from a question.
          </h1>
          <p className="text-[15px] md:text-base max-w-2xl leading-7" style={{ color: '#cbb8d6' }}>
            Each issue gathers the law, the movement, and the people on one strategic problem, with a playbook of what worked and what failed.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {issues.length === 0 ? (
          <p className="text-[15px]" style={{ color: C.muted }}>No issues published yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {issues.map((it) => (
              <Link
                key={it.slug}
                href={`/justice-matrix/issues/${it.slug}`}
                className="group block rounded-lg border p-5 md:p-6 transition-colors hover:border-zinc-300"
                style={{ background: C.surface, borderColor: C.border }}
              >
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: C.muted }} className="uppercase mb-2">
                  {it.title}
                </div>
                <h2 className="font-semibold text-lg md:text-xl tracking-tight leading-snug mb-2" style={{ color: C.ink }}>
                  {it.question}
                </h2>
                {it.summary && (
                  <p className="text-[14px] leading-6 mb-4" style={{ color: C.body }}>
                    {it.summary}
                  </p>
                )}
                <div className="flex items-center gap-4" style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                  <span>{it.cases} cases</span>
                  <span>{it.campaigns} campaigns</span>
                  <span className="ml-auto inline-flex items-center gap-1 font-medium group-hover:underline" style={{ color: C.accent }}>
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
