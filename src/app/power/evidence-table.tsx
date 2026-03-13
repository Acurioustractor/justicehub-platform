'use client';

import { useEffect, useState } from 'react';

interface Intervention {
  id: string;
  name: string;
  type: string;
  portfolio_score: number;
  evidence_level: string;
  community_authority_signal: number;
  harm_risk_level: string;
  geography: string[];
}

function scoreBadge(score: number) {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-800';
  return 'bg-red-100 text-red-800 border-red-800';
}

function evidenceBadge(level: string) {
  if (level?.startsWith('Proven')) return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  if (level?.startsWith('Effective')) return 'bg-blue-50 text-blue-700 border-blue-300';
  if (level?.startsWith('Promising')) return 'bg-yellow-50 text-yellow-700 border-yellow-300';
  if (level?.startsWith('Indigenous')) return 'bg-purple-50 text-purple-700 border-purple-300';
  return 'bg-gray-50 text-gray-600 border-gray-300';
}

function evidenceShort(level: string) {
  if (!level) return '—';
  if (level.startsWith('Proven')) return 'Proven';
  if (level.startsWith('Effective')) return 'Effective';
  if (level.startsWith('Promising')) return 'Promising';
  if (level.startsWith('Indigenous')) return 'Indigenous-led';
  return level.split('(')[0].trim();
}

export default function EvidenceTable({ state }: { state: string }) {
  const [data, setData] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/power-page?view=evidence&state=${state}&limit=20`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [state]);

  if (loading) return <div className="h-64 bg-gray-50 animate-pulse border border-gray-200" />;
  if (!data.length) return <div className="h-64 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">NO EVIDENCE DATA</div>;

  return (
    <div className="overflow-x-auto border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600">Intervention</th>
            <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600">Type</th>
            <th className="text-center px-4 py-3 font-bold uppercase text-xs text-gray-600">Score</th>
            <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600">Evidence</th>
            <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600">Risk</th>
            <th className="text-left px-4 py-3 font-bold uppercase text-xs text-gray-600">Geography</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100 transition-colors`}>
              <td className="px-4 py-3 font-medium max-w-xs truncate">{row.name}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{row.type?.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block border text-xs font-bold px-2 py-0.5 ${scoreBadge(row.portfolio_score)}`}>
                  {row.portfolio_score}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block border text-[10px] font-bold px-2 py-0.5 ${evidenceBadge(row.evidence_level)}`} title={row.evidence_level}>
                  {evidenceShort(row.evidence_level)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs">
                <span className={row.harm_risk_level === 'High' ? 'text-red-600 font-bold' : row.harm_risk_level === 'Medium' ? 'text-yellow-600 font-bold' : 'text-gray-500'}>
                  {row.harm_risk_level || '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {(row.geography || []).join(', ') || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
