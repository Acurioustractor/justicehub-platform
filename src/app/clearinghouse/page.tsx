import { createAdminClient } from '@/lib/supabase/server';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  Globe2,
  Shield,
  ArrowUpRight,
  ExternalLink,
  FilePlus,
  AlertCircle,
  Scale,
  Megaphone,
  Search
} from 'lucide-react';
import ChatWidget from './chat-widget';

type ClearinghouseService = {
  id: string;
  name: string;
  website_url: string | null;
  data_source: string | null;
  data_source_url: string | null;
  verification_status: string | null;
};

type ClearinghouseDoc = {
  id: string;
  title: string;
  source_system: string;
  summary: string | null;
  status: string | null;
  format: string | null;
};

type ClearinghouseCase = {
  id: string;
  title: string;
  jurisdiction: string | null;
  matter_type: string | null;
  status: string | null;
  issue_tags: string[] | null;
  source_system: string | null;
  source_url: string | null;
};

type ClearinghouseCampaign = {
  id: string;
  title: string;
  status: string | null;
  issue_tags: string[] | null;
  source_system: string | null;
  source_url: string | null;
};

export default async function ClearinghousePage() {
  const supabase = await createAdminClient();

  const [
    { data: services },
    { data: documents },
    { count: verifiedServiceCount },
    { count: verifiedDocCount },
    { data: cases },
    { data: campaigns },
    { count: verifiedCaseCount },
    { count: verifiedCampaignCount }
  ] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, website_url, data_source, data_source_url, verification_status')
      .eq('project', 'clearinghouse')
      .eq('verification_status', 'verified')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('clearinghouse_documents')
      .select('id, title, source_system, summary, status, format')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('project', 'clearinghouse')
      .eq('verification_status', 'verified'),
    supabase
      .from('clearinghouse_documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),
    supabase
      .from('clearinghouse_cases')
      .select('id, title, jurisdiction, matter_type, status, issue_tags, source_system, source_url')
      .eq('sensitivity', 'public')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('clearinghouse_campaigns')
      .select('id, title, status, issue_tags, source_system, source_url')
      .eq('sensitivity', 'public')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('clearinghouse_cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')
      .eq('sensitivity', 'public'),
    supabase
      .from('clearinghouse_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')
      .eq('sensitivity', 'public'),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="border-b-2 border-black bg-gradient-to-br from-yellow-50 to-blue-50 py-16">
          <div className="container-justice">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white font-bold text-xs uppercase">
                <Shield className="h-4 w-4" />
                Clearinghouse
              </span>
              <h1 className="headline-truth">Trusted services from community partners</h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                This directory showcases verified submissions from partner systems (e.g. AlternativeFirstResponders.com.au). Everything here is attribution-first: we show the source and link back to the original record.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/clearinghouse/how-to"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Add your data
                </Link>
                <Link
                  href="/admin/clearinghouse"
                  className="inline-flex items-center gap-2 px-5 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Admin view
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Search / Chat */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Ask the clearinghouse
                </h2>
                <p className="text-gray-700 mb-3">
                  Search verified public services, documents, cases, and campaigns. Answers are grounded in clearinghouse content.
                </p>
                <ChatWidget />
              </div>
              <div className="flex-1 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-bold mb-2">Tips</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>“What did the Banksia Hill judgment say about solitary confinement?”</li>
                  <li>“Show campaigns on non-police mental health response.”</li>
                  <li>“Summarize the AHRC ‘Help Way Earlier’ recommendations.”</li>
                </ul>
                <p className="mt-3 text-xs text-gray-600">
                  Uses clearinghouse embeddings. Only public, verified items are included here. Restricted items remain admin-only.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={Globe2}
                label="Verified services"
                value={verifiedServiceCount || 0}
                tone="blue"
              />
              <StatCard
                icon={FilePlus}
                label="Verified documents"
                value={verifiedDocCount || 0}
                tone="purple"
              />
              <StatCard
                icon={Scale}
                label="Verified cases"
                value={verifiedCaseCount || 0}
                tone="blue"
              />
              <StatCard
                icon={Megaphone}
                label="Verified campaigns"
                value={verifiedCampaignCount || 0}
                tone="purple"
              />
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black">Partner services</h2>
              <span className="text-sm text-gray-600">Showing up to 50 most recent verified</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(services as ClearinghouseService[] | null)?.length ? (
                (services as ClearinghouseService[]).map((svc) => (
                  <div key={svc.id} className="border-2 border-black bg-white p-4 hover:shadow-brutal transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-lg">{svc.name}</div>
                        <div className="text-sm text-gray-700">
                          Source: {svc.data_source || 'Unknown'}
                        </div>
                      </div>
                      <StatusPill status={svc.verification_status || 'verified'} />
                    </div>
                    {svc.website_url && (
                      <Link href={svc.website_url} target="_blank" className="text-sm text-blue-600 hover:underline">
                        Visit website
                      </Link>
                    )}
                    {svc.data_source_url && (
                      <div className="mt-2">
                        <Link href={svc.data_source_url} target="_blank" className="inline-flex items-center gap-1 text-sm text-gray-700 hover:underline">
                          Source record
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <EmptyCard message="No verified clearinghouse services yet. Submit via the How-To page." />
              )}
            </div>
          </div>
        </section>

        {/* Cases */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black">Strategic cases</h2>
              <span className="text-sm text-gray-600">Public + verified only</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cases as ClearinghouseCase[] | null)?.length ? (
                (cases as ClearinghouseCase[]).map((c) => (
                  <div key={c.id} className="border-2 border-black bg-white p-4 hover:shadow-brutal transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-lg">{c.title}</div>
                        <div className="text-sm text-gray-700">
                          {c.jurisdiction || 'Jurisdiction tbc'} {c.matter_type ? `• ${c.matter_type}` : ''}
                        </div>
                      </div>
                      <StatusPill status={c.status || 'verified'} />
                    </div>
                    {c.issue_tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.issue_tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs font-bold border border-gray-800 bg-gray-100 uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {c.source_url && (
                      <div className="mt-3">
                        <Link href={c.source_url} target="_blank" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          Source record
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-600">Source: {c.source_system || 'Unknown'}</div>
                  </div>
                ))
              ) : (
                <EmptyCard message="No public verified cases yet." />
              )}
            </div>
          </div>
        </section>

        {/* Campaigns */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black">Advocacy campaigns</h2>
              <span className="text-sm text-gray-600">Public + verified only</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(campaigns as ClearinghouseCampaign[] | null)?.length ? (
                (campaigns as ClearinghouseCampaign[]).map((c) => (
                  <div key={c.id} className="border-2 border-black bg-white p-4 hover:shadow-brutal transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-lg">{c.title}</div>
                        <div className="text-sm text-gray-700">Source: {c.source_system || 'Unknown'}</div>
                      </div>
                      <StatusPill status={c.status || 'verified'} />
                    </div>
                    {c.issue_tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.issue_tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs font-bold border border-gray-800 bg-gray-100 uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {c.source_url && (
                      <div className="mt-3">
                        <Link href={c.source_url} target="_blank" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          Source record
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <EmptyCard message="No public verified campaigns yet." />
              )}
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black">Playbooks & documents</h2>
              <span className="text-sm text-gray-600">Verified submissions only</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(documents as ClearinghouseDoc[] | null)?.length ? (
                (documents as ClearinghouseDoc[]).map((doc) => (
                  <div key={doc.id} className="border-2 border-black bg-white p-4 hover:shadow-brutal transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-lg">{doc.title}</div>
                        <div className="text-sm text-gray-700">Source: {doc.source_system}</div>
                      </div>
                      <StatusPill status={doc.status || 'verified'} />
                    </div>
                    {doc.summary && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-3">{doc.summary}</p>
                    )}
                    <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold px-2 py-1 border border-gray-800 bg-gray-100 uppercase">
                      <FileText className="h-4 w-4" />
                      {doc.format || 'doc'}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyCard message="No verified documents yet. Share your playbooks via the How-To page." />
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice text-center">
            <h3 className="text-3xl font-black mb-3">Want your system featured?</h3>
            <p className="text-lg text-gray-700 mb-5">
              We welcome community-led platforms to share services and playbooks. Attribution stays with you.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/clearinghouse/how-to"
                className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5" />
                Start publishing
              </Link>
              <Link
                href="/admin/clearinghouse"
                className="inline-flex items-center gap-2 px-5 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors"
              >
                <ArrowUpRight className="h-5 w-5" />
                Admin moderation
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: 'blue' | 'purple' }) {
  const colors: Record<'blue' | 'purple', string> = {
    blue: 'bg-blue-50 text-blue-900 border-blue-800',
    purple: 'bg-purple-50 text-purple-900 border-purple-800',
  };
  return (
    <div className={`border-2 ${colors[tone]} p-4 flex items-center gap-3`}>
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
    verified: 'bg-green-100 text-green-800 border-green-700',
    pending: 'bg-amber-100 text-amber-800 border-amber-700',
    unverified: 'bg-gray-100 text-gray-800 border-gray-600',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-800 border-gray-600';
  return (
    <span className={`px-2 py-1 text-xs font-bold border ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="border-2 border-dashed border-gray-400 bg-white p-6 text-center text-gray-700">
      <AlertCircle className="h-6 w-6 mx-auto mb-2 text-gray-500" />
      {message}
    </div>
  );
}
