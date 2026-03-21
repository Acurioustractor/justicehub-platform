'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type SearchableItem = {
  id: string;
  type: 'statement' | 'commitment' | 'funding' | 'program' | 'hansard';
  title: string;
  subtitle: string;
  tags: string[];
  url?: string;
  isYJ?: boolean;
};

export function CivicSearch({
  statements,
  charter,
  funding,
  interventions,
  yjStatements,
  hansard,
}: {
  statements: any[];
  charter: any[];
  funding: any[];
  interventions: any[];
  yjStatements: any[];
  hansard: any[];
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  if (!query.trim()) return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search statements, Hansard, commitments, funding, programs..."
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#0A0A0A] placeholder:text-gray-400 font-mono focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
      />
    </div>
  );

  const q = query.toLowerCase();

  // Build searchable items
  const items: SearchableItem[] = [];

  for (const s of statements) {
    const text = `${s.headline} ${s.minister_name || ''} ${s.body_text || ''}`.toLowerCase();
    if (text.includes(q)) {
      items.push({
        id: s.id,
        type: 'statement',
        title: s.headline,
        subtitle: `${s.minister_name?.replace('The Honourable ', '') || 'Unknown'} — ${s.published_at ? new Date(s.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'undated'}`,
        tags: (s.mentioned_amounts || []).slice(0, 2),
        url: s.source_url,
        isYJ: yjStatements.some((yj: any) => yj.id === s.id),
      });
    }
  }

  for (const c of charter) {
    const text = `${c.commitment_text} ${c.minister_name} ${c.portfolio} ${c.category}`.toLowerCase();
    if (text.includes(q)) {
      items.push({
        id: c.id,
        type: 'commitment',
        title: c.commitment_text,
        subtitle: `${c.minister_name} — ${c.portfolio}`,
        tags: [c.status, c.commitment_type],
      });
    }
  }

  for (const f of funding) {
    const text = `${f.program_name || ''} ${f.recipient_name || ''} ${f.source || ''}`.toLowerCase();
    if (text.includes(q)) {
      items.push({
        id: f.id,
        type: 'funding',
        title: f.program_name || 'Untitled program',
        subtitle: `${f.recipient_name || 'Unknown'} — ${f.financial_year}`,
        tags: f.amount_dollars ? [`$${(f.amount_dollars / 1_000_000).toFixed(1)}M`] : [],
      });
    }
  }

  for (const i of interventions) {
    const text = `${i.name} ${i.evidence_level || ''}`.toLowerCase();
    if (text.includes(q)) {
      items.push({
        id: i.id,
        type: 'program',
        title: i.name,
        subtitle: i.evidence_level?.split('(')[0].trim() || 'Untested',
        tags: i.cost_per_young_person ? [`$${Math.round(i.cost_per_young_person).toLocaleString()}/person`] : [],
      });
    }
  }

  for (const h of hansard) {
    const text = `${h.subject || ''} ${h.speaker_name || ''} ${h.body_text || ''} ${h.speaker_party || ''}`.toLowerCase();
    if (text.includes(q)) {
      items.push({
        id: h.id,
        type: 'hansard',
        title: h.subject || 'Untitled speech',
        subtitle: `${h.speaker_name}${h.speaker_party ? ` (${h.speaker_party})` : ''} — ${h.sitting_date ? new Date(h.sitting_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'undated'}`,
        tags: [h.speech_type, h.speaker_role].filter(Boolean),
        url: h.source_url || undefined,
      });
    }
  }

  const typeColors: Record<string, string> = {
    statement: 'text-blue-700 bg-blue-100',
    commitment: 'text-amber-700 bg-amber-100',
    funding: 'text-emerald-700 bg-emerald-100',
    program: 'text-purple-700 bg-purple-100',
    hansard: 'text-indigo-700 bg-indigo-100',
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search statements, Hansard, commitments, funding, programs..."
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-[#0A0A0A] placeholder:text-gray-400 font-mono focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
      />

      <div className="mt-4 space-y-2">
        <p className="text-xs font-mono text-gray-500">
          {items.length} result{items.length !== 1 ? 's' : ''} for &quot;{query}&quot;
        </p>

        {items.slice(0, 20).map(item => (
          <div
            key={`${item.type}-${item.id}`}
            className={`p-3 rounded-lg border ${
              item.isYJ ? 'bg-red-50 border-[#DC2626]/30' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ${typeColors[item.type]}`}>
                {item.type}
              </span>
              <div className="flex-1 min-w-0">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#0A0A0A] hover:text-[#DC2626]">
                    {item.title}
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-[#0A0A0A]">{item.title}</p>
                )}
                <p className="text-xs font-mono text-gray-500 mt-0.5">{item.subtitle}</p>
                {item.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {items.length > 20 && (
          <p className="text-xs font-mono text-gray-500">
            Showing 20 of {items.length} results. Refine your search for more specific results.
          </p>
        )}

        {items.length === 0 && (
          <p className="text-sm text-gray-500 py-4">
            No results found. Try searching for a minister name, program, or keyword.
          </p>
        )}
      </div>
    </div>
  );
}
