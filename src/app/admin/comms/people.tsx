'use client';

import { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  organization: string | null;
  entity_type: string;
  alignment_category: string;
  composite_score: number;
  outreach_status: string;
  campaign_list: string;
  alignment_signals: unknown;
  warm_paths: unknown;
  recommended_approach: string | null;
  email: string | null;
  notes: string | null;
}

const LISTS = [
  { key: 'allies_to_activate', label: 'Allies' },
  { key: 'funders_to_pitch', label: 'Funders' },
  { key: 'decision_makers', label: 'Decision Makers' },
  { key: 'warm_intros', label: 'Warm Intros' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'ally': '#059669',
  'potential_ally': '#16a34a',
  'neutral': '#6b7280',
  'opponent': '#DC2626',
  'unknown': '#9ca3af',
};

const OUTREACH_LABELS: Record<string, { label: string; color: string }> = {
  'pending': { label: 'Pending', color: '#6b7280' },
  'contacted': { label: 'Contacted', color: '#d97706' },
  'responded': { label: 'Responded', color: '#2563eb' },
  'meeting_scheduled': { label: 'Meeting', color: '#7c3aed' },
  'committed': { label: 'Committed', color: '#059669' },
};

export default function People() {
  const [activeList, setActiveList] = useState('allies_to_activate');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [total, setTotal] = useState(0);
  const [listCounts, setListCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchList(activeList);
  }, [activeList]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/campaign-alignment/stats');
      const data = await res.json();
      if (data.by_list) setListCounts(data.by_list);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchList = async (list: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaign-alignment/lists?list=${list}&limit=100`);
      const data = await res.json();
      if (data.entities) {
        setEntities(data.entities);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('List fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 border-b border-white/10 pb-2">
        {LISTS.map(list => (
          <button
            key={list.key}
            onClick={() => setActiveList(list.key)}
            className="px-3 py-1.5 text-xs font-medium rounded-t transition-colors flex items-center gap-1.5"
            style={{
              backgroundColor: activeList === list.key ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeList === list.key ? '#F5F0E8' : 'rgba(245,240,232,0.5)',
              borderBottom: activeList === list.key ? '2px solid #DC2626' : '2px solid transparent',
            }}
          >
            {list.label}
            {listCounts[list.key] !== undefined && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                {listCounts[list.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin mr-2" size={20} />
          <span className="text-sm opacity-60">Loading people...</span>
        </div>
      ) : (
        <>
          <div className="text-xs opacity-40 mb-3">
            Showing {entities.length} of {total} entities
          </div>

          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Organization</th>
                  <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Score</th>
                  <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Outreach</th>
                  <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Category</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 opacity-40 text-sm">
                      <Users size={20} className="inline mr-2 opacity-30" />
                      No entities in this list yet.
                    </td>
                  </tr>
                ) : (
                  entities.map(entity => (
                    <EntityRow
                      key={entity.id}
                      entity={entity}
                      isExpanded={expandedId === entity.id}
                      onToggle={() => setExpandedId(expandedId === entity.id ? null : entity.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function EntityRow({
  entity,
  isExpanded,
  onToggle,
}: {
  entity: Entity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const outreach = OUTREACH_LABELS[entity.outreach_status] || { label: entity.outreach_status, color: '#6b7280' };
  const catColor = CATEGORY_COLORS[entity.alignment_category] || '#6b7280';

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-2.5 font-medium">
          <div className="flex items-center gap-1.5">
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {entity.name}
          </div>
        </td>
        <td className="px-4 py-2.5 text-xs opacity-70">{entity.organization || '--'}</td>
        <td className="px-4 py-2.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          <span className="text-xs font-medium">{entity.composite_score?.toFixed(1) || '0.0'}</span>
        </td>
        <td className="px-4 py-2.5">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ backgroundColor: outreach.color, color: '#fff' }}
          >
            {outreach.label}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: catColor }}
          />
          <span className="text-xs opacity-70 capitalize">{entity.alignment_category?.replace('_', ' ')}</span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-white/5">
          <td colSpan={5} className="px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-medium opacity-50 mb-1 uppercase tracking-wider text-[10px]">Alignment Signals</div>
                <pre className="whitespace-pre-wrap opacity-70 text-[11px]">
                  {entity.alignment_signals ? JSON.stringify(entity.alignment_signals, null, 2) : 'None recorded'}
                </pre>
              </div>
              <div>
                <div className="font-medium opacity-50 mb-1 uppercase tracking-wider text-[10px]">Warm Paths</div>
                <pre className="whitespace-pre-wrap opacity-70 text-[11px]">
                  {entity.warm_paths ? JSON.stringify(entity.warm_paths, null, 2) : 'None recorded'}
                </pre>
              </div>
              <div>
                <div className="font-medium opacity-50 mb-1 uppercase tracking-wider text-[10px]">Recommended Approach</div>
                <p className="opacity-70 text-[11px] leading-relaxed">
                  {entity.recommended_approach || 'No recommendation yet.'}
                </p>
                {entity.email && (
                  <div className="mt-2">
                    <span className="opacity-50">Email: </span>
                    <span className="opacity-70">{entity.email}</span>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
