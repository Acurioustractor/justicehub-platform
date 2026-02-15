'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  FileText,
  Calendar,
  ChevronRight,
  Loader2,
  BarChart3,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface WeeklyReport {
  id: string;
  title: string;
  summary: string | null;
  report_data: Record<string, any> | null;
  week_start: string | null;
  week_end: string | null;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    async function fetchReports() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('alma_weekly_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(52);

      if (error) {
        console.error('Error fetching reports:', error);
      } else {
        setReports(data || []);
        if (data && data.length > 0) {
          setSelectedReport(data[0]);
        }
      }
      setLoading(false);
    }
    fetchReports();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content bg-gray-50 min-h-screen">
        {/* Header */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-8">
            <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              Intelligence Reports
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Weekly Intelligence Reports
            </h1>
            <p className="text-lg text-gray-700 mt-2">
              AI-generated summaries of youth justice developments, new evidence, and system changes across Australia.
            </p>
          </div>
        </section>

        <div className="container-justice py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500 font-mono">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="border-2 border-black p-12 text-center bg-white">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Reports Yet</h3>
              <p className="text-gray-600 mb-4">
                Weekly intelligence reports will appear here once the automated reporting pipeline is active.
              </p>
              <p className="text-sm text-gray-500">
                Reports summarize new interventions, evidence updates, and scraper health.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Report List */}
              <div className="lg:col-span-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                  All Reports ({reports.length})
                </h2>
                <div className="space-y-2">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-4 border-2 transition-all ${
                        selectedReport?.id === report.id
                          ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          : 'border-gray-200 bg-white hover:border-black'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-mono text-gray-500">
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm leading-tight">
                        {report.title || `Report — ${formatDate(report.created_at)}`}
                      </h3>
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Detail */}
              <div className="lg:col-span-2">
                {selectedReport && (
                  <div className="bg-white border-2 border-black p-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-mono text-gray-500">
                        {formatDate(selectedReport.created_at)}
                        {selectedReport.week_start && selectedReport.week_end && (
                          <> &mdash; Week of {formatDate(selectedReport.week_start)} to {formatDate(selectedReport.week_end)}</>
                        )}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black mb-6">
                      {selectedReport.title || `Intelligence Report`}
                    </h2>

                    {selectedReport.summary && (
                      <div className="prose max-w-none mb-8">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {selectedReport.summary}
                        </div>
                      </div>
                    )}

                    {selectedReport.report_data && (
                      <div className="space-y-6">
                        {selectedReport.report_data.new_interventions !== undefined && (
                          <div className="flex items-center gap-4 p-4 border-2 border-gray-200 bg-gray-50">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                            <div>
                              <div className="font-bold">New Interventions</div>
                              <div className="text-2xl font-mono font-black text-emerald-600">
                                {selectedReport.report_data.new_interventions}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedReport.report_data.evidence_updates !== undefined && (
                          <div className="flex items-center gap-4 p-4 border-2 border-gray-200 bg-gray-50">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                            <div>
                              <div className="font-bold">Evidence Updates</div>
                              <div className="text-2xl font-mono font-black text-blue-600">
                                {selectedReport.report_data.evidence_updates}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedReport.report_data.scraper_health && (
                          <div className="flex items-center gap-4 p-4 border-2 border-gray-200 bg-gray-50">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                            <div>
                              <div className="font-bold">Scraper Health</div>
                              <div className="text-sm text-gray-600">
                                {selectedReport.report_data.scraper_health}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
