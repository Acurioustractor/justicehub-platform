'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Zap, CheckCircle2, XCircle, Clock, AlertTriangle,
  Play, RefreshCw, ChevronDown, ChevronUp, Loader2,
  ArrowLeft, Eye, Radio, Pen, Sparkles, Send,
  FileText, MessageSquare, Bell, Copy, Check,
  TrendingUp, MapPin, Shield, Activity
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface SignalContent {
  id: string;
  format: string;
  title: string | null;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  created_at: string;
}

interface SignalEvent {
  id: string;
  signal_type: string;
  source_table: string;
  region_code: string | null;
  region_name: string | null;
  state: string | null;
  payload: Record<string, unknown>;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  created_at: string;
  signal_content: SignalContent[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

// ─── Constants ──────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/40', dot: 'bg-red-500', icon: AlertTriangle },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500', icon: TrendingUp },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500', icon: Activity },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400', icon: Bell },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-sky-500/15', text: 'text-sky-400', label: 'New' },
  composing: { bg: 'bg-violet-500/15', text: 'text-violet-400', label: 'Composing' },
  queued: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'In Review' },
  published: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Published' },
  dismissed: { bg: 'bg-gray-500/15', text: 'text-gray-500', label: 'Dismissed' },
};

const SIGNAL_TYPE_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  milestone: { label: 'Report Milestone', icon: TrendingUp, color: 'text-amber-400' },
  report_spike: { label: 'Report Spike', icon: Activity, color: 'text-red-400' },
  system_concentration: { label: 'System Pattern', icon: Shield, color: 'text-purple-400' },
  service_gap: { label: 'Service Gap', icon: AlertTriangle, color: 'text-red-400' },
  pledge_milestone: { label: 'Pledge Milestone', icon: CheckCircle2, color: 'text-green-400' },
  new_evidence: { label: 'New Evidence', icon: FileText, color: 'text-blue-400' },
  trending: { label: 'Trending', icon: TrendingUp, color: 'text-pink-400' },
  weekly_digest: { label: 'Weekly Digest', icon: Send, color: 'text-cyan-400' },
};

const FORMAT_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  data_story: { label: 'Data Story', icon: FileText, color: 'text-blue-400' },
  social_card: { label: 'Social Card', icon: MessageSquare, color: 'text-pink-400' },
  instagram_carousel: { label: 'Instagram', icon: Copy, color: 'text-purple-400' },
  whatsapp_card: { label: 'WhatsApp', icon: Send, color: 'text-green-400' },
  email_segment: { label: 'Email', icon: Send, color: 'text-cyan-400' },
  widget_alert: { label: 'Widget Alert', icon: Bell, color: 'text-amber-400' },
};

// ─── Helpers ────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function describePayload(event: SignalEvent): string {
  const { signal_type, payload } = event;
  switch (signal_type) {
    case 'milestone':
      return `${payload.total_reports} total reports — crossed the ${payload.milestone}-report milestone`;
    case 'system_concentration':
      return `${payload.concentration_pct}% of reports (${payload.system_count}/${payload.total_reports}) involve ${payload.system_type}`;
    case 'service_gap':
      return `${payload.total_reports} reports but ${payload.services_in_state} support services in state`;
    case 'report_spike':
      return `${payload.current_count} reports this period — ${payload.change_pct}% change`;
    default:
      return JSON.stringify(payload).slice(0, 120);
  }
}

// ─── Toast Component ────────────────────────────────────────────────

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium shadow-xl backdrop-blur-sm animate-in slide-in-from-right-5 ${
            toast.type === 'success' ? 'bg-emerald-600/90 text-white' :
            toast.type === 'error' ? 'bg-red-600/90 text-white' :
            'bg-[#16213e]/90 text-gray-200 border border-gray-700/50'
          }`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// ─── Pipeline Visualization ─────────────────────────────────────────

function PipelineHeader({ stats, scanning, composing, onScan, onCompose }: {
  stats: { total: number; new: number; queued: number; published: number; dismissed: number };
  scanning: boolean;
  composing: boolean;
  onScan: () => void;
  onCompose: () => void;
}) {
  const steps = [
    { label: 'SENTINEL', desc: 'Scan thresholds', icon: Radio, count: stats.new, color: 'text-sky-400', bgActive: 'bg-sky-500', action: onScan, loading: scanning, actionLabel: 'Scan' },
    { label: 'COMPOSER', desc: 'Draft content', icon: Pen, count: stats.new, color: 'text-violet-400', bgActive: 'bg-violet-500', action: onCompose, loading: composing, actionLabel: 'Compose', disabled: stats.new === 0 },
    { label: 'REVIEW', desc: 'Human approval', icon: Eye, count: stats.queued, color: 'text-amber-400', bgActive: 'bg-amber-500' },
    { label: 'PUBLISH', desc: 'Distribute', icon: Send, count: stats.published, color: 'text-emerald-400', bgActive: 'bg-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-gray-800/50">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.label} className="bg-[#16213e] px-4 py-4 relative group">
            {/* Connector arrow */}
            {i < steps.length - 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-gray-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1 L10 6 L2 11z" /></svg>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${step.color}`} />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{step.label}</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">{step.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${step.count > 0 ? step.bgActive : 'bg-gray-700'} ${step.count > 0 ? 'animate-pulse' : ''}`} />
                <span className={`text-xl font-black ${step.count > 0 ? 'text-white' : 'text-gray-600'}`}>{step.count}</span>
              </div>
              {step.action && (
                <button
                  onClick={step.action}
                  disabled={step.loading || step.disabled}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all disabled:opacity-30 ${
                    step.loading
                      ? 'bg-gray-700 text-gray-400'
                      : `${step.bgActive}/20 ${step.color} hover:${step.bgActive}/30`
                  }`}
                >
                  {step.loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    step.actionLabel
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Content Preview Card ───────────────────────────────────────────

function ContentCard({ content, onAction, loading }: {
  content: SignalContent;
  onAction: (action: string, contentId: string) => void;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const config = FORMAT_CONFIG[content.format] || { label: content.format, icon: FileText, color: 'text-gray-400' };
  const Icon = config.icon;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-black/20 rounded-lg overflow-hidden hover:bg-black/30 transition-colors">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700/20">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          <span className="text-xs font-semibold text-gray-300">{config.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            content.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
            content.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
            content.status === 'published' ? 'bg-emerald-500/25 text-emerald-300' :
            'bg-amber-500/15 text-amber-400'
          }`}>{content.status}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={copyToClipboard}
            className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        {content.title && (
          <h4 className="text-sm font-semibold text-white mb-2">{content.title}</h4>
        )}
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
          content.format === 'social_card' ? 'text-gray-200' :
          content.format === 'widget_alert' ? 'text-amber-300 text-xs' :
          'text-gray-400 text-[13px]'
        }`}>
          {content.format === 'data_story' && content.body.length > 300
            ? content.body.slice(0, 300) + '...'
            : content.body
          }
        </div>
        {content.format === 'social_card' && (
          <div className="mt-2 text-[10px] text-gray-600">{content.body.length}/280 characters</div>
        )}
      </div>
      {content.status === 'pending' && (
        <div className="px-4 py-2.5 border-t border-gray-700/20 flex items-center gap-2">
          <button
            onClick={() => onAction('approve', content.id)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" /> Approve
          </button>
          <button
            onClick={() => onAction('reject', content.id)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 hover:bg-red-600/10 text-red-400/60 hover:text-red-400 rounded text-xs font-medium transition-colors"
          >
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Widget Preview (Inline) ────────────────────────────────────────

function WidgetPreview() {
  const [postcode, setPostcode] = useState('2200');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWidget = async (pc: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/signal-engine/widget?postcode=${pc}`);
      const result = await res.json();
      setData(result);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWidget('2200'); }, []);

  return (
    <div className="bg-[#0f0f23] rounded-xl border border-gray-800/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Widget Preview</span>
        </div>
        <Link href="/widget/embed?postcode=2200" className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
          Open fullscreen
        </Link>
      </div>
      <div className="p-5">
        <div className="bg-[#16213e] rounded-xl p-5 max-w-xs mx-auto shadow-2xl">
          <h3 className="text-base font-bold text-white text-center mb-1">Check Your Area</h3>
          <p className="text-xs text-gray-500 text-center mb-4">Community discrimination data</p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={postcode}
              onChange={e => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              className="flex-1 py-2 px-3 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-center text-sm tracking-[0.2em] focus:outline-none focus:border-[#e2725b] transition-colors"
            />
            <button
              onClick={() => fetchWidget(postcode)}
              disabled={postcode.length !== 4 || loading}
              className="px-4 py-2 bg-[#e2725b] text-white rounded-lg text-sm font-semibold hover:bg-[#d4634c] disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
            </button>
          </div>

          {data && (data as { region?: string }).region ? (
            <div className="border-t border-gray-700/50 pt-4">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <MapPin className="w-3 h-3 text-[#e2725b]" />
                <span className="text-sm font-semibold text-white">
                  {(data as { region: string }).region}, {(data as { state: string }).state}
                </span>
              </div>
              {(data as { stats?: { total_reports: number; top_system: string | null; top_system_pct: number } }).stats && (
                <div className="space-y-0 divide-y divide-gray-700/30 text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Reports</span>
                    <span className="text-white font-bold">{((data as Record<string, Record<string, number>>).stats).total_reports}</span>
                  </div>
                  {((data as Record<string, Record<string, string | null>>).stats).top_system && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Top system</span>
                      <span className="text-white font-semibold capitalize">
                        {((data as Record<string, Record<string, string>>).stats).top_system}
                        <span className="text-[#e2725b] ml-1 text-[10px]">{((data as Record<string, Record<string, number>>).stats).top_system_pct}%</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
              <button className="w-full mt-4 py-2 bg-[#e2725b] text-white rounded-lg text-xs font-semibold hover:bg-[#d4634c] transition-colors">
                Report an Incident
              </button>
            </div>
          ) : data ? (
            <p className="text-xs text-gray-500 text-center py-3">No data for this postcode yet</p>
          ) : null}
        </div>
        <div className="mt-3 text-center">
          <code className="text-[10px] text-gray-600 bg-black/40 px-2 py-1 rounded">
            &lt;script src=&quot;justicehub.org.au/widget.js&quot;&gt;
          </code>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function SignalEnginePage() {
  const [events, setEvents] = useState<SignalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [composing, setComposing] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/signal-engine/events${params}`);
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/signal-engine/scan', { method: 'POST' });
      const data = await res.json();
      addToast(
        data.signals_new > 0
          ? `SENTINEL found ${data.signals_new} new signal${data.signals_new !== 1 ? 's' : ''}`
          : `Scan complete — no new thresholds crossed`,
        data.signals_new > 0 ? 'success' : 'info'
      );
      fetchEvents();
    } catch {
      addToast('Scan failed', 'error');
    } finally {
      setScanning(false);
    }
  };

  const runCompose = async () => {
    setComposing(true);
    try {
      const res = await fetch('/api/signal-engine/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all_new: true }),
      });
      const data = await res.json();
      addToast(`COMPOSER generated content for ${data.composed} event${data.composed !== 1 ? 's' : ''}`, 'success');
      fetchEvents();
    } catch {
      addToast('Content generation failed', 'error');
    } finally {
      setComposing(false);
    }
  };

  const handleAction = async (action: string, eventId?: string, contentId?: string) => {
    const key = contentId || eventId || '';
    setActionLoading(key);
    try {
      await fetch('/api/signal-engine/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, content_id: contentId, action }),
      });
      const labels: Record<string, string> = { approve: 'Approved', reject: 'Rejected', dismiss: 'Dismissed' };
      addToast(labels[action] || action, action === 'approve' ? 'success' : 'info');
      fetchEvents();
    } catch {
      addToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: events.length,
    new: events.filter(e => e.status === 'new').length,
    queued: events.filter(e => e.status === 'queued').length,
    published: events.filter(e => e.status === 'published').length,
    dismissed: events.filter(e => e.status === 'dismissed').length,
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-200">
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .event-card { animation: fadeIn 0.3s ease-out both; }
      `}</style>

      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="border-b border-gray-800/60 bg-[#12122a]">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Signal Engine</h1>
                <p className="text-xs text-gray-500">Autonomous content pipeline</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#1a1a2e] border border-gray-800 text-gray-400 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gray-600"
            >
              <option value="all">All signals ({stats.total})</option>
              <option value="new">New ({stats.new})</option>
              <option value="queued">In Review ({stats.queued})</option>
              <option value="published">Published ({stats.published})</option>
              <option value="dismissed">Dismissed ({stats.dismissed})</option>
            </select>
            <button
              onClick={fetchEvents}
              className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="border-b border-gray-800/60">
        <div className="max-w-[1600px] mx-auto">
          <PipelineHeader stats={stats} scanning={scanning} composing={composing} onScan={runScan} onCompose={runCompose} />
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] min-h-[calc(100vh-160px)]">
          {/* Left: Event Queue */}
          <div className="px-6 py-5 border-r border-gray-800/40">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading signals...</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-[#16213e] flex items-center justify-center mx-auto mb-4">
                    <Radio className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-300 mb-2">No signals detected</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Run a SENTINEL scan to check data sources for threshold-crossing events.
                  </p>
                  <button
                    onClick={runScan}
                    disabled={scanning}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Play className="w-4 h-4 inline mr-2" />
                    Run First Scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, i) => {
                  const isExpanded = expandedEvent === event.id;
                  const pendingContent = event.signal_content?.filter(c => c.status === 'pending') || [];
                  const hasContent = event.signal_content && event.signal_content.length > 0;
                  const priorityConfig = PRIORITY_CONFIG[event.priority] || PRIORITY_CONFIG.medium;
                  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.new;
                  const signalConfig = SIGNAL_TYPE_CONFIG[event.signal_type] || { label: event.signal_type, icon: Zap, color: 'text-gray-400' };
                  const SignalIcon = signalConfig.icon;

                  return (
                    <div
                      key={event.id}
                      className={`event-card border rounded-xl overflow-hidden transition-all ${
                        isExpanded ? 'ring-1 ring-gray-700/50' : ''
                      } ${
                        event.priority === 'critical' ? 'border-red-500/30 bg-[#14142e]' :
                        event.status === 'queued' ? 'border-amber-500/15 bg-[#14142e]' :
                        'border-gray-800/60 bg-[#14142e]'
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div
                        className="px-5 py-4 cursor-pointer hover:bg-white/[0.015] transition-colors"
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
                                {event.priority}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                {statusConfig.label}
                              </span>
                              <span className={`flex items-center gap-1 text-[11px] ${signalConfig.color}`}>
                                <SignalIcon className="w-3 h-3" />
                                {signalConfig.label}
                              </span>
                            </div>
                            <h3 className="text-[15px] font-semibold text-white truncate">
                              {event.region_name ? `${event.region_name}, ${event.state}` : 'National'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">{describePayload(event)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-gray-600">{timeAgo(event.created_at)}</span>
                            {hasContent && (
                              <div className="flex -space-x-1">
                                {event.signal_content.slice(0, 3).map(c => {
                                  const fc = FORMAT_CONFIG[c.format];
                                  const FIcon = fc?.icon || FileText;
                                  return <div key={c.id} className="w-5 h-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center"><FIcon className={`w-2.5 h-2.5 ${fc?.color || 'text-gray-500'}`} /></div>;
                                })}
                                {event.signal_content.length > 3 && (
                                  <div className="w-5 h-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[9px] text-gray-500">+{event.signal_content.length - 3}</div>
                                )}
                              </div>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Inline quick actions */}
                        {!isExpanded && event.status === 'queued' && pendingContent.length > 0 && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800/40" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleAction('approve', event.id)}
                              disabled={actionLoading === event.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve All
                            </button>
                            <button
                              onClick={() => handleAction('reject', event.id)}
                              disabled={actionLoading === event.id}
                              className="px-3 py-1.5 text-gray-500 hover:text-red-400 rounded-md text-xs font-medium transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAction('dismiss', event.id)}
                              disabled={actionLoading === event.id}
                              className="px-3 py-1.5 text-gray-600 hover:text-gray-400 rounded-md text-xs font-medium transition-colors ml-auto"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-gray-800/40">
                          {hasContent ? (
                            <div className="p-4 space-y-3">
                              {event.signal_content.map(content => (
                                <ContentCard
                                  key={content.id}
                                  content={content}
                                  onAction={(action, cid) => handleAction(action, undefined, cid)}
                                  loading={actionLoading === content.id}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 text-center">
                              <Sparkles className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                              <p className="text-sm text-gray-500 mb-3">No content generated yet</p>
                              {event.status === 'new' && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setActionLoading(event.id);
                                    try {
                                      await fetch('/api/signal-engine/compose', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ event_id: event.id }),
                                      });
                                      addToast('Content generated', 'success');
                                      fetchEvents();
                                    } catch {
                                      addToast('Generation failed', 'error');
                                    } finally {
                                      setActionLoading(null);
                                    }
                                  }}
                                  disabled={actionLoading === event.id}
                                  className="text-xs px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-lg transition-colors font-medium"
                                >
                                  {actionLoading === event.id ? (
                                    <><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Generating...</>
                                  ) : (
                                    <><Sparkles className="w-3 h-3 inline mr-1" /> Generate Content</>
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Bottom bar */}
                          <div className="px-4 py-2.5 bg-black/20 flex items-center justify-between border-t border-gray-800/30">
                            <div className="flex items-center gap-2">
                              {event.status === 'queued' && pendingContent.length > 0 && (
                                <>
                                  <button
                                    onClick={() => handleAction('approve', event.id)}
                                    disabled={actionLoading === event.id}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve All ({pendingContent.length})
                                  </button>
                                  <button
                                    onClick={() => handleAction('reject', event.id)}
                                    disabled={actionLoading === event.id}
                                    className="px-3 py-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Reject All
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-600 font-mono">{event.id.slice(0, 8)}</span>
                              <button
                                onClick={() => handleAction('dismiss', event.id)}
                                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Widget Preview + Info */}
          <div className="px-5 py-5 space-y-4 bg-[#0c0c1a]">
            <WidgetPreview />

            {/* How it works */}
            <div className="bg-[#14142e] rounded-xl border border-gray-800/50 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">How the Pipeline Works</h3>
              <div className="space-y-4">
                {[
                  { step: '1', icon: Radio, label: 'SENTINEL scans', desc: 'Monitors data sources hourly for threshold-crossing events', color: 'text-sky-400', bg: 'bg-sky-500/10' },
                  { step: '2', icon: Sparkles, label: 'COMPOSER drafts', desc: 'AI generates data stories, social cards, and widget alerts', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                  { step: '3', icon: Eye, label: 'Human reviews', desc: 'Admin approves, edits, or rejects each content piece', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { step: '4', icon: Send, label: 'Publisher distributes', desc: 'Approved content goes to articles, social, email, widget', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-300">{s.label}</p>
                        <p className="text-[11px] text-gray-600 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
