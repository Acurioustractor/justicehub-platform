'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Network, MapPin, AlertTriangle } from 'lucide-react';

interface OrgContext {
  org: { id: string; name: string; state: string; isIndigenous: boolean };
  seifa: { decile: number; label: string } | null;
  relatedOrgs: Array<{ name: string; abn: string; programs: number; evidence: string }>;
  findings: Array<{ content: unknown; finding_type: string; confidence: string; sources: string[] }>;
  systemOverlap: {
    childProtection: boolean;
    disability: boolean;
    homelessness: boolean;
    poverty: boolean;
  };
  similarCharities: Array<{
    name: string;
    abn: string;
    size: string | null;
    location: string;
    tags: string[];
    matchScore: number;
  }>;
}

function evidenceColor(level: string): string {
  if (level === 'Proven' || level === 'Effective') return 'text-emerald-400';
  if (level === 'Indigenous-led') return 'text-purple-400';
  if (level === 'Promising') return 'text-amber-400';
  return 'text-gray-400';
}

export default function CrossSystemContext({
  abn,
  orgName,
  state,
}: {
  abn: string;
  orgName: string;
  state: string | null;
}) {
  const [data, setData] = useState<OrgContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/authority/org-context?abn=${abn}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [abn]);

  if (loading) {
    return (
      <section className="bg-gray-900 text-white rounded-lg p-6 mt-4">
        <div className="animate-pulse h-32 bg-gray-800 rounded" />
      </section>
    );
  }

  if (!data) return null;

  const overlapSystems = [
    data.systemOverlap.childProtection && 'Child Protection',
    data.systemOverlap.disability && 'Disability',
    data.systemOverlap.homelessness && 'Homelessness',
    data.systemOverlap.poverty && 'Poverty',
  ].filter(Boolean);

  const findingSummary = (content: unknown): string => {
    if (typeof content === 'string') return content.slice(0, 250);
    if (content && typeof content === 'object') {
      const obj = content as Record<string, unknown>;
      // Common shapes: { title, data } or { summary } or { detail }
      if ('title' in obj && 'data' in obj) {
        const data = obj.data as Record<string, unknown>;
        const detail = data.detail || data.implication || '';
        return `${obj.title}${detail ? ': ' + detail : ''}`.slice(0, 250);
      }
      if ('summary' in obj) return String(obj.summary).slice(0, 250);
      if ('detail' in obj) return String(obj.detail).slice(0, 250);
      if ('title' in obj) return String(obj.title).slice(0, 250);
      // Last resort: extract all string values
      const strings = Object.values(obj).filter(v => typeof v === 'string') as string[];
      if (strings.length) return strings.join(' — ').slice(0, 250);
    }
    return '';
  };

  return (
    <section className="bg-gray-900 text-white rounded-lg p-6 mt-4">
      <div className="flex items-center gap-2 mb-6">
        <Network className="w-5 h-5 text-red-500" />
        <h2 className="font-bold text-lg text-white">Cross-System Context</h2>
        <span className="text-sm text-gray-400 ml-1">— {state || 'national'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SEIFA */}
        {data.seifa && (
          <div className="border border-gray-700 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Disadvantage Index (SEIFA)
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {data.seifa.decile}
              </span>
              <span className="text-sm text-gray-400">/10 — {data.seifa.label}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              IRSD decile. Lower = more disadvantaged area.
              {data.seifa.decile <= 3 && ' This organisation operates in one of the most disadvantaged areas in Australia.'}
            </p>
          </div>
        )}

        {/* System overlap */}
        {overlapSystems.length > 0 && (
          <div className="border border-gray-700 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Cross-System Issues in {state}
            </div>
            <div className="flex flex-wrap gap-2">
              {overlapSystems.map(sys => (
                <span key={sys as string} className="px-3 py-1.5 bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-bold">
                  <AlertTriangle className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                  {sys}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Research links these systems to youth justice outcomes in {state}.
            </p>
          </div>
        )}
      </div>

      {/* Related orgs */}
      {data.relatedOrgs.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Other Organisations in {state} with Programs
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.relatedOrgs.map(org => (
              <Link
                key={org.abn || org.name}
                href={org.abn ? `/justice-funding/org/${org.abn}` : '#'}
                className="flex items-center justify-between p-3 border border-gray-800 hover:border-gray-600 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate group-hover:text-red-400 transition-colors">
                    {org.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {org.programs} program{org.programs !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className={`text-xs font-bold shrink-0 ml-2 ${evidenceColor(org.evidence)}`}>
                  {org.evidence}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Similar charities */}
      {data.similarCharities?.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Similar Charities
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.similarCharities.map(charity => (
              <Link
                key={charity.abn}
                href={`/justice-funding/org/${charity.abn}`}
                className="flex items-start justify-between p-3 border border-gray-800 hover:border-gray-600 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate group-hover:text-red-400 transition-colors">
                    {charity.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {charity.location && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{charity.location}
                      </span>
                    )}
                    {charity.size && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400">{charity.size}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {charity.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-800/60 text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Research findings */}
      {data.findings.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Key Research Findings
          </div>
          <div className="space-y-2">
            {data.findings.map((f, i) => {
              const summary = findingSummary(f.content);
              if (!summary) return null;
              const chatQuery = encodeURIComponent(summary.slice(0, 100));
              return (
                <Link
                  key={i}
                  href={`/intelligence/chat?q=${chatQuery}`}
                  className="block p-3 border border-gray-800 bg-gray-950/50 hover:border-gray-600 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {f.finding_type && (
                      <span className="px-1.5 py-0.5 bg-gray-800 text-gray-300 text-[10px] uppercase font-medium">
                        {f.finding_type.replace(/_/g, ' ')}
                      </span>
                    )}
                    {f.sources?.length > 0 && (
                      <span className="text-[10px] text-gray-500">
                        Source: {f.sources.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {summary}{summary.length >= 250 && '...'}
                  </p>
                  <span className="text-[10px] text-red-500 group-hover:text-red-400 mt-1.5 inline-block">
                    Ask ALMA about this →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Back to Authority Brief */}
      <div className="mt-8 pt-4 border-t border-gray-800">
        <Link
          href="/authority/explore"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
        >
          View in Authority Brief <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
