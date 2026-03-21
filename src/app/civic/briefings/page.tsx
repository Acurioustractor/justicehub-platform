import { createServiceClient } from '@/lib/supabase/service-lite';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour cache

type Digest = {
  id: string;
  period_start: string;
  period_end: string;
  digest_type: string;
  summary: string;
  statement_count: number;
  hansard_count: number;
  alert_count: number;
  new_links: number;
  status_changes: Array<{ commitment: string; from: string; to: string; minister: string }>;
  created_at: string;
};

export default async function BriefingsPage() {
  const supabase = createServiceClient();

  const { data: digests } = await supabase
    .from('civic_digests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  const items = (digests || []) as Digest[];

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-mono text-[#DC2626] tracking-widest uppercase mb-3">
            CivicScope / Intelligence Briefings
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Daily Briefings
          </h1>
          <p className="text-gray-300 max-w-2xl">
            AI-generated intelligence digests analyzing Queensland ministerial statements,
            parliamentary speeches, funding flows, and charter commitment progress.
            Updated daily at 6am UTC.
          </p>
          <div className="flex gap-4 mt-6">
            <Link href="/civic/qld-youth-justice" className="text-sm font-mono text-gray-400 hover:text-white">
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-mono text-sm">No briefings yet. First digest generates at 6am UTC.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((digest, i) => (
              <article
                key={digest.id}
                className={`p-6 rounded-lg border ${
                  i === 0
                    ? 'bg-white border-[#DC2626]/20 shadow-sm'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      digest.digest_type === 'weekly'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {digest.digest_type}
                    </span>
                    <span className="text-sm font-mono text-gray-500">
                      {formatDate(digest.period_start)} &mdash; {formatDate(digest.period_end)}
                    </span>
                    {i === 0 && (
                      <span className="text-xs font-mono text-[#DC2626] bg-red-50 px-2 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats bar */}
                <div className="flex gap-4 mb-4 flex-wrap">
                  {digest.statement_count > 0 && (
                    <Stat label="Statements" value={digest.statement_count} color="text-blue-600" />
                  )}
                  {digest.hansard_count > 0 && (
                    <Stat label="Hansard" value={digest.hansard_count} color="text-purple-600" />
                  )}
                  {digest.alert_count > 0 && (
                    <Stat label="Alerts" value={digest.alert_count} color="text-amber-600" />
                  )}
                  {digest.new_links > 0 && (
                    <Stat label="New Links" value={digest.new_links} color="text-emerald-600" />
                  )}
                  {(digest.status_changes?.length || 0) > 0 && (
                    <Stat label="Status Changes" value={digest.status_changes.length} color="text-[#DC2626]" />
                  )}
                </div>

                {/* Status changes */}
                {digest.status_changes?.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-mono text-amber-700 mb-2 font-semibold">Commitment Status Changes</p>
                    {digest.status_changes.map((change, j) => (
                      <p key={j} className="text-xs text-amber-800 mb-1">
                        <span className="font-semibold">{change.minister}</span>: &quot;{change.commitment}&quot;
                        <span className="font-mono ml-1">
                          {change.from} &rarr; {change.to}
                        </span>
                      </p>
                    ))}
                  </div>
                )}

                {/* Briefing text */}
                <div className="prose prose-sm max-w-none text-[#0A0A0A]">
                  {digest.summary.split('\n').map((para, j) => (
                    para.trim() ? <p key={j} className="mb-2 text-sm leading-relaxed">{para}</p> : null
                  ))}
                </div>

                {/* Footer */}
                <p className="text-xs font-mono text-gray-400 mt-4">
                  Generated {new Date(digest.created_at).toLocaleString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short',
  });
}
