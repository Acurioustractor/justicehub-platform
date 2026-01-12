import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { FileText, Globe2, ShieldCheck, ArrowUpRight, Download, FilePlus, Filter, Scale, Megaphone, Search } from 'lucide-react';
import ChatWidget from '@/app/clearinghouse/chat-widget';

type SearchParams = {
  source?: string;
  status?: string;
};

export default async function ClearinghouseAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/clearinghouse');

  const { data: userData } = await supabase
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (userData?.user_role !== 'admin') redirect('/');

  const sourceFilter = searchParams.source?.trim() || '';
  const statusFilter = searchParams.status?.trim() || '';

  // Counts
  const [
    { count: serviceCount },
    { count: pendingServices },
    { count: docCount },
    { count: pendingDocs },
    { count: caseCount },
    { count: pendingCases },
    { count: campaignCount },
    { count: pendingCampaigns }
  ] = await Promise.all([
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('project', 'clearinghouse'),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('project', 'clearinghouse').eq('verification_status', 'pending'),
    supabase.from('clearinghouse_documents').select('*', { count: 'exact', head: true }),
    supabase.from('clearinghouse_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('clearinghouse_cases').select('*', { count: 'exact', head: true }),
    supabase.from('clearinghouse_cases').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('clearinghouse_campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('clearinghouse_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Services query
  let serviceQuery = supabase
    .from('services')
    .select('id, name, website_url, data_source, data_source_url, verification_status, created_at')
    .eq('project', 'clearinghouse')
    .order('created_at', { ascending: false })
    .limit(25);

  if (sourceFilter) {
    serviceQuery = serviceQuery.eq('data_source', sourceFilter);
  }
  if (statusFilter) {
    serviceQuery = serviceQuery.eq('verification_status', statusFilter);
  }

  const { data: services } = await serviceQuery;

  // Documents query
  let docQuery = supabase
    .from('clearinghouse_documents')
    .select('id, title, source_system, status, format, summary, tags, created_at')
    .order('created_at', { ascending: false })
    .limit(25);

  if (sourceFilter) {
    docQuery = docQuery.eq('source_system', sourceFilter);
  }
  if (statusFilter) {
    docQuery = docQuery.eq('status', statusFilter);
  }

  const { data: documents } = await docQuery;

  // Cases query
  let caseQuery = supabase
    .from('clearinghouse_cases')
    .select('id, title, jurisdiction, matter_type, status, source_system, source_url, issue_tags, sensitivity, created_at')
    .order('created_at', { ascending: false })
    .limit(25);

  if (sourceFilter) caseQuery = caseQuery.eq('source_system', sourceFilter);
  if (statusFilter) caseQuery = caseQuery.eq('status', statusFilter);

  const { data: cases } = await caseQuery;

  // Campaigns query
  let campaignQuery = supabase
    .from('clearinghouse_campaigns')
    .select('id, title, status, source_system, source_url, issue_tags, sensitivity, created_at')
    .order('created_at', { ascending: false })
    .limit(25);

  if (sourceFilter) campaignQuery = campaignQuery.eq('source_system', sourceFilter);
  if (statusFilter) campaignQuery = campaignQuery.eq('status', statusFilter);

  const { data: campaigns } = await campaignQuery;

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-black text-black mb-2">Clearinghouse</h1>
              <p className="text-lg text-gray-600">
                Shared intake for partner services and documents (attribution-first, dedupbed).
              </p>
            </div>
            <Link
              href="/clearinghouse/how-to"
              className="px-5 py-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              How-To
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Services" value={serviceCount || 0} icon={Globe2} tone="blue" />
            <StatCard label="Pending Services" value={pendingServices || 0} icon={ShieldCheck} tone="amber" />
            <StatCard label="Documents" value={docCount || 0} icon={FileText} tone="purple" />
            <StatCard label="Pending Docs" value={pendingDocs || 0} icon={FilePlus} tone="red" />
            <StatCard label="Cases" value={caseCount || 0} icon={Scale} tone="blue" />
            <StatCard label="Pending Cases" value={pendingCases || 0} icon={ShieldCheck} tone="amber" />
            <StatCard label="Campaigns" value={campaignCount || 0} icon={Megaphone} tone="purple" />
            <StatCard label="Pending Campaigns" value={pendingCampaigns || 0} icon={ShieldCheck} tone="amber" />
          </div>

          {/* Filters */}
          <div className="bg-white border-2 border-black p-4 mb-8 flex flex-col md:flex-row md:items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 font-bold text-sm uppercase text-gray-700">
              <Filter className="h-4 w-4" /> Filters
            </div>
            <form className="flex flex-col md:flex-row gap-3 w-full" method="GET">
              <input
                type="text"
                name="source"
                defaultValue={sourceFilter}
                placeholder="Source system (e.g. alternativefirstresponders.com.au)"
                className="flex-1 px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
              <select
                name="status"
                defaultValue={statusFilter}
                className="px-3 py-2 border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
            </form>
            <div className="flex gap-2">
              <DownloadButton href={`/api/clearinghouse?format=csv${sourceFilter ? `&source=${encodeURIComponent(sourceFilter)}` : ''}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ''}`} label="Export Services CSV" />
              <DownloadButton href={`/api/clearinghouse/documents?format=csv${sourceFilter ? `&source=${encodeURIComponent(sourceFilter)}` : ''}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ''}`} label="Export Docs CSV" />
            </div>
          </div>

          {/* Services table */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-black">Recent Services</h2>
              <span className="text-sm text-gray-600">Latest 25 entries</span>
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {(services || []).map((service) => (
                    <tr key={service.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{service.name}</div>
                        {service.website_url && (
                          <Link href={service.website_url} target="_blank" className="text-sm text-blue-600 hover:underline">
                            {service.website_url}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{service.data_source || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={service.verification_status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(service.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        {service.data_source_url ? (
                          <Link href={service.data_source_url} target="_blank" className="hover:underline">
                            Source URL
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                  {!services?.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-600">
                        No services found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Documents table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-black">Recent Documents</h2>
              <span className="text-sm text-gray-600">Latest 25 entries</span>
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Tags</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(documents || []).map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{doc.title}</div>
                        {doc.summary && <div className="text-sm text-gray-600 line-clamp-2">{doc.summary}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{doc.source_system}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={doc.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {(doc.tags || []).length ? doc.tags.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(doc.created_at)}</td>
                    </tr>
                  ))}
                  {!documents?.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-600">
                        No documents found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cases table */}
          <div className="mt-10 mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-black">Recent Cases</h2>
              <span className="text-sm text-gray-600">Latest 25 entries</span>
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Jurisdiction</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(cases || []).map((c) => (
                    <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{c.title}</div>
                        {c.issue_tags?.length ? (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                            {c.issue_tags.join(', ')}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {c.jurisdiction || '—'} {c.matter_type ? `• ${c.matter_type}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {c.source_system || '—'}
                        {c.source_url && (
                          <div>
                            <Link href={c.source_url} target="_blank" className="text-blue-600 hover:underline text-xs">
                              Source
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                  {!cases?.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-600">
                        No cases found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaigns table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-black">Recent Campaigns</h2>
              <span className="text-sm text-gray-600">Latest 25 entries</span>
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Tags</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(campaigns || []).map((c) => (
                    <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{c.title}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {c.source_system || '—'}
                        {c.source_url && (
                          <div>
                            <Link href={c.source_url} target="_blank" className="text-blue-600 hover:underline text-xs">
                              Source
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {(c.issue_tags || []).length ? c.issue_tags.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                  {!campaigns?.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-600">
                        No campaigns found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chat for admins */}
          <div className="mt-10">
            <h2 className="text-2xl font-black mb-3 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Ask the clearinghouse (admin)
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              Grounded responses from embeddings of public/verified content. Restricted data stays hidden.
            </p>
            <ChatWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: 'blue' | 'amber' | 'purple' | 'red' }) {
  const tones: Record<'blue' | 'amber' | 'purple' | 'red', string> = {
    blue: 'bg-blue-50 text-blue-800 border-blue-800',
    amber: 'bg-amber-50 text-amber-800 border-amber-800',
    purple: 'bg-purple-50 text-purple-800 border-purple-800',
    red: 'bg-red-50 text-red-800 border-red-800',
  };

  return (
    <div className={`border-2 ${tones[tone]} p-4 flex items-center gap-3`}>
      <Icon className="h-6 w-6" />
      <div>
        <div className="text-sm font-bold uppercase">{label}</div>
        <div className="text-2xl font-black">{value}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: 'bg-green-100 text-green-800 border-green-600',
    pending: 'bg-amber-100 text-amber-800 border-amber-600',
    unverified: 'bg-gray-100 text-gray-800 border-gray-600',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-800 border-gray-600';
  return (
    <span className={`px-2 py-1 text-xs font-bold border ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black bg-white font-bold hover:bg-black hover:text-white transition-colors text-sm"
    >
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
