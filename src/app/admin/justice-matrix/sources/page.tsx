import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { ArrowLeft, AlertTriangle, CheckCircle2, Pause, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SourceRow {
  id: string;
  name: string;
  source_type: string;
  url: string;
  region: string | null;
  organization: string | null;
  data_format: string | null;
  scrape_frequency: string | null;
  scrape_priority: number | null;
  is_active: boolean;
  last_scraped_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  success_rate: number | null;
  total_items_found: number | null;
  total_items_approved: number | null;
}

function fmtRel(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function SourcesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string; type?: string }>;
}) {
  await requireAdmin('/admin/justice-matrix/sources');
  const sp = await searchParams;
  const showAll = sp.all === '1';
  const typeFilter = sp.type || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  let q = supabase
    .from('justice_matrix_sources')
    .select(
      'id,name,source_type,url,region,organization,data_format,scrape_frequency,scrape_priority,is_active,last_scraped_at,last_success_at,last_error,success_rate,total_items_found,total_items_approved',
    )
    .order('is_active', { ascending: false })
    .order('scrape_priority', { ascending: true, nullsFirst: false })
    .order('name');
  if (!showAll) q = q.eq('is_active', true);
  if (typeFilter) q = q.eq('source_type', typeFilter);
  const { data } = await q;
  const sources = (data ?? []) as SourceRow[];

  const stats = {
    total: sources.length,
    active: sources.filter((s) => s.is_active).length,
    erroring: sources.filter((s) => s.is_active && s.last_error).length,
    everScanned: sources.filter((s) => s.last_scraped_at).length,
  };

  // Build distinct source_type list for the filter
  const typesSet = new Set(sources.map((s) => s.source_type));
  const types = Array.from(typesSet).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/justice-matrix" className="flex items-center gap-2 text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="w-px h-6 bg-gray-300" />
            <div>
              <h1 className="text-2xl font-black text-black">Source health</h1>
              <p className="text-sm text-gray-600">
                {stats.active} active · {stats.erroring} erroring · {stats.everScanned}/{stats.total} ever scanned
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/justice-matrix/sources${typeFilter ? `?type=${typeFilter}` : ''}`}
              className={`px-3 py-1.5 border-2 font-bold text-sm ${!showAll ? 'bg-black text-white border-black' : 'bg-white border-gray-300'}`}
            >
              Active only
            </Link>
            <Link
              href={`/admin/justice-matrix/sources?all=1${typeFilter ? `&type=${typeFilter}` : ''}`}
              className={`px-3 py-1.5 border-2 font-bold text-sm ${showAll ? 'bg-black text-white border-black' : 'bg-white border-gray-300'}`}
            >
              Show all
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/admin/justice-matrix/sources${showAll ? '?all=1' : ''}`}
              className={`px-2.5 py-1 border-2 font-semibold text-xs ${!typeFilter ? 'bg-gray-100 border-gray-500' : 'bg-white border-gray-300'}`}
            >
              all types
            </Link>
            {types.map((t) => {
              const params = new URLSearchParams();
              if (showAll) params.set('all', '1');
              params.set('type', t);
              return (
                <Link
                  key={t}
                  href={`/admin/justice-matrix/sources?${params}`}
                  className={`px-2.5 py-1 border-2 font-semibold text-xs ${typeFilter === t ? 'bg-gray-100 border-gray-500' : 'bg-white border-gray-300'}`}
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr className="text-left">
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Region</Th>
                <Th>Pri</Th>
                <Th>Format</Th>
                <Th>Last scan</Th>
                <Th>Last error</Th>
                <Th className="text-right">Found</Th>
                <Th className="text-right">Approved</Th>
                <Th className="text-right">Success</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => {
                const erroring = s.is_active && !!s.last_error;
                const neverScanned = !s.last_scraped_at;
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-200 ${!s.is_active ? 'opacity-50' : ''} ${erroring ? 'bg-red-50' : neverScanned && s.is_active ? 'bg-yellow-50' : ''}`}
                  >
                    <Td>
                      <div className="font-bold text-black">{s.name}</div>
                      {s.organization && <div className="text-[11px] text-gray-500">{s.organization}</div>}
                    </Td>
                    <Td><Mono>{s.source_type}</Mono></Td>
                    <Td>{s.region ?? '—'}</Td>
                    <Td><Mono>{s.scrape_priority ?? '—'}</Mono></Td>
                    <Td>
                      <Mono>{s.data_format ?? 'html'}</Mono>
                      <div className="text-[10px] text-gray-500">{s.scrape_frequency ?? '—'}</div>
                    </Td>
                    <Td>
                      <div className={erroring ? 'text-red-700 font-semibold' : ''}>{fmtRel(s.last_scraped_at)}</div>
                      {s.last_success_at && s.last_success_at !== s.last_scraped_at && (
                        <div className="text-[10px] text-gray-500">last ok: {fmtRel(s.last_success_at)}</div>
                      )}
                    </Td>
                    <Td className="max-w-[280px]">
                      {erroring ? (
                        <span className="text-xs text-red-700 line-clamp-2" title={s.last_error ?? ''}>
                          {s.last_error}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">{s.total_items_found ?? 0}</Td>
                    <Td className="text-right tabular-nums">{s.total_items_approved ?? 0}</Td>
                    <Td className="text-right tabular-nums">{s.success_rate != null ? `${Number(s.success_rate).toFixed(0)}%` : '—'}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {!s.is_active ? (
                          <Pause className="w-4 h-4 text-gray-400" />
                        ) : erroring ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : s.last_success_at ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : null}
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-black"
                          title="Open source URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                    No sources match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Adding sources is currently a SQL <code>INSERT</code> into <code>justice_matrix_sources</code>. JSON-API sources (<code>data_format=&apos;json&apos;</code>) are scanned by the Vercel cron at <code>/api/cron/justice-matrix/scan-json</code>; everything else runs via <code>npx tsx scripts/scan-justice-matrix.ts --apply</code>.
        </p>
      </div>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-700 ${className ?? ''}`}>
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className ?? ''}`}>{children}</td>;
}
function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[12px]">{children}</span>;
}
