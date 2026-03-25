'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  ArrowLeft,
  Linkedin,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Repeat2,
  ThumbsUp,
  Plus,
  Save,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-[#059669]/10 text-[#059669]',
    ready: 'bg-[#DC2626]/10 text-[#DC2626]',
    draft: 'bg-[#0A0A0A]/10 text-[#0A0A0A]/60',
    scheduled: 'bg-blue-100 text-blue-800',
    hot: 'bg-[#DC2626]/10 text-[#DC2626]',
    warm: 'bg-amber-100 text-amber-800',
    cold: 'bg-blue-100 text-blue-800',
    overdue: 'bg-[#DC2626] text-white',
    active: 'bg-[#059669]/10 text-[#059669]',
    'follow-up': 'bg-amber-100 text-amber-800',
    tentative: 'bg-amber-100 text-amber-800',
    planning: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-[#059669]/10 text-[#059669]',
    closed: 'bg-[#0A0A0A]/10 text-[#0A0A0A]/30',
  };
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-600" />;
    case 'article': return <FileText className="w-4 h-4 text-[#059669]" />;
    case 'email': return <Send className="w-4 h-4 text-amber-600" />;
    case 'op-ed': return <FileText className="w-4 h-4 text-[#DC2626]" />;
    default: return <Circle className="w-4 h-4" />;
  }
}

export default function CampaignContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [outreach, setOutreach] = useState<any[]>([]);
  const [tourStops, setTourStops] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'outreach' | 'tour'>('content');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingOutreach, setEditingOutreach] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const supabase = createClient() as any;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [contentRes, outreachRes, tourRes] = await Promise.all([
      supabase.from('campaign_content').select('*').order('sort_order'),
      supabase.from('campaign_outreach').select('*').order('priority').order('status'),
      supabase.from('tour_stops').select('*').order('date'),
    ]);
    setContent(contentRes.data || []);
    setOutreach(outreachRes.data || []);
    setTourStops(tourRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateContentStatus = async (id: string, status: string) => {
    setSaving(id);
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'published' && !content.find(c => c.id === id)?.published_at) {
      updates.published_at = new Date().toISOString();
    }
    await supabase.from('campaign_content').update(updates).eq('id', id);
    setContent(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setSaving(null);
  };

  const updateOutreachStatus = async (id: string, status: string) => {
    setSaving(id);
    await supabase.from('campaign_outreach').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setOutreach(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    setSaving(null);
  };

  const saveOutreachEdit = async (id: string) => {
    setSaving(id);
    await supabase.from('campaign_outreach').update({
      next_action: editForm.next_action,
      notes: editForm.notes,
      status: editForm.status,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setOutreach(prev => prev.map(c => c.id === id ? { ...c, ...editForm } : c));
    setEditingOutreach(null);
    setSaving(null);
  };

  const updateContentMetrics = async (id: string, metrics: any) => {
    setSaving(id);
    await supabase.from('campaign_content').update({ metrics, updated_at: new Date().toISOString() }).eq('id', id);
    setContent(prev => prev.map(c => c.id === id ? { ...c, metrics } : c));
    setSaving(null);
  };

  // Derived stats
  const publishedLinkedin = content.filter(c => c.type === 'linkedin' && c.status === 'published');
  const readyContent = content.filter(c => c.status === 'ready');
  const hotContacts = outreach.filter(c => c.status === 'hot' || c.status === 'overdue');
  const priorityA = outreach.filter(c => c.priority === 'A');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-6 h-6 animate-spin text-[#0A0A0A]/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <div className="max-w-5xl mx-auto px-6 sm:px-12 py-8">
          {/* Header */}
          <Link href="/admin/contained" className="inline-flex items-center gap-2 text-sm text-[#0A0A0A]/50 hover:text-[#0A0A0A] mb-6">
            <ArrowLeft className="w-3 h-3" /> Campaign Dashboard
          </Link>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                CONTAINED — Campaign Hub
              </h1>
              <p className="text-[#0A0A0A]/50 mt-1">Content plan, outreach tracker, tour schedule</p>
            </div>
            <button onClick={fetchData} className="p-2 rounded-lg hover:bg-[#0A0A0A]/5 transition-colors">
              <RefreshCw className="w-4 h-4 text-[#0A0A0A]/40" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-lg border border-[#0A0A0A]/10 p-1 mb-8 w-fit">
            {(['content', 'outreach', 'tour'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  activeTab === tab ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A]/50 hover:text-[#0A0A0A]'
                }`}
              >
                {tab === 'content' ? `Content (${content.length})` : tab === 'outreach' ? `Outreach (${outreach.length})` : `Tour (${tourStops.length})`}
              </button>
            ))}
          </div>

          {/* ===== CONTENT TAB ===== */}
          {activeTab === 'content' && (
            <div className="space-y-3">
              {/* Arc visualisation */}
              <div className="bg-[#0A0A0A] text-white rounded-xl p-6 mb-6">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  LinkedIn Campaign Arc
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {content.filter(c => c.type === 'linkedin').slice(0, 3).map((item, i) => (
                    <div key={item.id} className={`rounded-lg p-4 ${item.status === 'ready' ? 'border-2 border-[#DC2626]' : item.status === 'published' ? 'border border-white/20' : 'border border-white/10'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {item.status === 'published' ? <CheckCircle2 className="w-4 h-4 text-[#059669]" /> : item.status === 'ready' ? <Clock className="w-4 h-4 text-[#DC2626]" /> : <Circle className="w-4 h-4 text-white/20" />}
                        <span className={`text-xs font-bold ${item.status === 'ready' ? 'text-[#DC2626]' : item.status === 'published' ? 'text-white/50' : 'text-white/30'}`}>
                          POST {i + 1}{item.status === 'ready' ? ' — READY' : ''}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold ${item.status === 'draft' ? 'text-white/50' : 'text-white'}`}>{item.title.replace(/^Room \d: /, '')}</p>
                      <p className="text-xs text-white/40 mt-1">{item.angle}</p>
                      {item.metrics?.likes > 0 && (
                        <div className="flex gap-3 mt-3 text-xs text-white/30">
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {item.metrics.likes}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {item.metrics.comments}</span>
                          <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {item.metrics.reposts}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content items */}
              {content.map((item) => (
                <div key={item.id} className="bg-white border border-[#0A0A0A]/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#0A0A0A]/[0.02] transition-colors"
                  >
                    <TypeIcon type={item.type} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-[#0A0A0A]/40 mt-0.5">{item.angle}</p>
                    </div>
                    <StatusBadge status={item.status} />
                    {item.metrics?.likes > 0 && (
                      <div className="hidden sm:flex gap-3 text-xs text-[#0A0A0A]/30">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {item.metrics.likes}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {item.metrics.comments}</span>
                        <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {item.metrics.reposts}</span>
                      </div>
                    )}
                    {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" /> : <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />}
                  </button>
                  {expandedId === item.id && (
                    <div className="px-4 pb-4 border-t border-[#0A0A0A]/5">
                      <div className="mt-3 space-y-3">
                        <div className="bg-[#F5F0E8] rounded-lg p-4">
                          <p className="text-sm whitespace-pre-line leading-relaxed">{item.content}</p>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-[#0A0A0A]/50"><strong>Notes:</strong> {item.notes}</p>
                        )}
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#DC2626] font-semibold hover:underline">
                            <ExternalLink className="w-3 h-3" /> {item.link}
                          </a>
                        )}
                        {item.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag: string) => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-[#0A0A0A]/5 rounded-full text-[#0A0A0A]/40">{tag}</span>
                            ))}
                          </div>
                        )}
                        {/* Status actions */}
                        <div className="flex gap-2 pt-2">
                          {['draft', 'ready', 'scheduled', 'published'].map((s) => (
                            <button
                              key={s}
                              onClick={() => updateContentStatus(item.id, s)}
                              disabled={item.status === s}
                              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                                item.status === s
                                  ? 'bg-[#0A0A0A] text-white'
                                  : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/50 hover:bg-[#0A0A0A]/10'
                              }`}
                            >
                              {saving === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ===== OUTREACH TAB ===== */}
          {activeTab === 'outreach' && (
            <div className="space-y-3">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-[#DC2626] text-white rounded-lg p-4">
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{hotContacts.length}</p>
                  <p className="text-xs text-white/60 mt-1">Hot / Overdue</p>
                </div>
                <div className="bg-white border border-[#0A0A0A]/10 rounded-lg p-4">
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{priorityA.length}</p>
                  <p className="text-xs text-[#0A0A0A]/40 mt-1">Priority A</p>
                </div>
                <div className="bg-white border border-[#0A0A0A]/10 rounded-lg p-4">
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{outreach.length}</p>
                  <p className="text-xs text-[#0A0A0A]/40 mt-1">Total Contacts</p>
                </div>
                <div className="bg-white border border-[#0A0A0A]/10 rounded-lg p-4">
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {outreach.filter(c => c.sector === 'Corporate/Philanthropy').length}
                  </p>
                  <p className="text-xs text-[#0A0A0A]/40 mt-1">Funders</p>
                </div>
              </div>

              {/* Contact list */}
              {outreach.map((contact) => (
                <div key={contact.id} className="bg-white border border-[#0A0A0A]/10 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] text-white text-sm font-bold">
                      {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{contact.name}</p>
                        <span className="text-xs text-[#0A0A0A]/30">{contact.location}</span>
                      </div>
                      <p className="text-xs text-[#0A0A0A]/40">{contact.org}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <StatusBadge status={contact.status} />
                        <p className="text-xs text-[#0A0A0A]/40 mt-1 max-w-[200px] truncate">{contact.next_action}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${contact.priority === 'A' ? 'bg-[#DC2626]/10 text-[#DC2626]' : contact.priority === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/40'}`}>
                        {contact.priority}
                      </span>
                      <button
                        onClick={() => {
                          if (editingOutreach === contact.id) {
                            setEditingOutreach(null);
                          } else {
                            setEditingOutreach(contact.id);
                            setEditForm({ next_action: contact.next_action, notes: contact.notes, status: contact.status });
                          }
                        }}
                        className="p-1 rounded hover:bg-[#0A0A0A]/5"
                      >
                        <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />
                      </button>
                    </div>
                  </div>
                  {editingOutreach === contact.id && (
                    <div className="px-4 pb-4 border-t border-[#0A0A0A]/5 space-y-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs font-bold text-[#0A0A0A]/40 block mb-1">Next Action</label>
                          <input
                            value={editForm.next_action || ''}
                            onChange={(e) => setEditForm({ ...editForm, next_action: e.target.value })}
                            className="w-full text-sm border border-[#0A0A0A]/10 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#0A0A0A]/40 block mb-1">Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full text-sm border border-[#0A0A0A]/10 rounded-lg px-3 py-2"
                          >
                            {['hot', 'warm', 'cold', 'active', 'follow-up', 'overdue', 'closed'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#0A0A0A]/40 block mb-1">Notes</label>
                        <textarea
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={2}
                          className="w-full text-sm border border-[#0A0A0A]/10 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveOutreachEdit(contact.id)}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#0A0A0A] text-white rounded-lg font-semibold"
                        >
                          {saving === contact.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                        <button
                          onClick={() => setEditingOutreach(null)}
                          className="text-xs px-3 py-1.5 bg-[#0A0A0A]/5 rounded-lg font-semibold text-[#0A0A0A]/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ===== TOUR TAB ===== */}
          {activeTab === 'tour' && (
            <div className="space-y-3">
              {tourStops.map((stop) => (
                <div key={stop.id} className="bg-white border border-[#0A0A0A]/10 rounded-lg p-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0A] text-white">
                    <span className="text-xs font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{stop.state}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{stop.city}</p>
                    <p className="text-xs text-[#0A0A0A]/40">{stop.partner}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {stop.date ? new Date(stop.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                    </p>
                    <StatusBadge status={stop.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
