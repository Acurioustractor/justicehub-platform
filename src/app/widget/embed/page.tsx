'use client';

import { useState, useEffect, useRef } from 'react';

interface WidgetData {
  region: string | null;
  state: string | null;
  sa3_code: string | null;
  message?: string;
  stats: {
    total_reports: number;
    system_types_reported: number;
    top_system: string | null;
    top_system_pct: number;
  } | null;
  alerts: Array<{ type: string; message: string; priority: string }>;
  services: Array<{ name: string; phone: string | null; types: string | null }>;
}

const SYSTEM_LABELS: Record<string, string> = {
  education: 'Education',
  health: 'Health',
  policing: 'Policing',
  housing: 'Housing',
  employment: 'Employment',
  'anti-discrimination': 'Anti-Discrimination',
  other: 'Other',
};

const SYSTEM_COLORS: Record<string, string> = {
  education: '#3b82f6',
  health: '#10b981',
  policing: '#ef4444',
  housing: '#f59e0b',
  employment: '#8b5cf6',
  'anti-discrimination': '#ec4899',
  other: '#6b7280',
};

export default function WidgetEmbedPage() {
  const [inputValue, setInputValue] = useState('');
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFetched = useRef<string | null>(null);

  // Auto-fetch on mount from URL params (bypasses useSearchParams hydration issues)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pc = params.get('postcode')?.trim() || '';
    if (pc && /^\d{4}$/.test(pc)) {
      setInputValue(pc);
      lastFetched.current = pc;
      fetchData(pc);
    }
  }, []);

  const fetchData = async (pc: string) => {
    setLoading(true);
    setError(null);
    setRevealed(false);
    try {
      const res = await fetch(`/api/signal-engine/widget?postcode=${pc}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const result = await res.json();
      setData(result);
      // Stagger reveal
      setTimeout(() => setRevealed(true), 100);
    } catch {
      setError('Unable to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{4}$/.test(inputValue)) {
      lastFetched.current = inputValue;
      fetchData(inputValue);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes countUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(226, 114, 91, 0.4); } 50% { box-shadow: 0 0 20px 2px rgba(226, 114, 91, 0.2); } }
        .reveal { animation: slideUp 0.4s ease-out both; }
        .count-reveal { animation: countUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .skeleton { background: linear-gradient(90deg, #1a1a2e 25%, #222244 50%, #1a1a2e 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .glow-pulse { animation: pulseGlow 2s ease-in-out infinite; }
      `}</style>

      <div className="w-full max-w-[380px]">
        {/* Widget Card */}
        <div className="bg-[#16213e] rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-800/30">

          {/* Header with subtle gradient */}
          <div className="relative px-6 pt-7 pb-5 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#e2725b]/5 to-transparent" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e2725b] to-[#d4634c] flex items-center justify-center mx-auto mb-3 glow-pulse">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Check Your Area</h2>
              <p className="text-xs text-gray-500 mt-1">Community discrimination data from JusticeHub</p>
            </div>
          </div>

          {/* Postcode Input */}
          <form onSubmit={handleSubmit} className="px-6 pb-5">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  inputMode="numeric"
                  className="w-full py-3.5 px-4 bg-[#0f0f1a] border-2 border-gray-800 rounded-xl text-white text-center text-xl font-bold tracking-[0.4em] placeholder:text-gray-700 placeholder:font-normal placeholder:tracking-[0.4em] focus:outline-none focus:border-[#e2725b] transition-all duration-200"
                />
                {inputValue.length > 0 && inputValue.length < 4 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < inputValue.length ? 'bg-[#e2725b]' : 'bg-gray-700'}`} />
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={inputValue.length !== 4 || loading}
                className="px-6 py-3.5 bg-[#e2725b] text-white rounded-xl font-bold text-sm hover:bg-[#d4634c] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                )}
              </button>
            </div>
          </form>

          {/* Loading skeleton */}
          {loading && (
            <div className="border-t border-gray-700/30 px-6 py-5 space-y-4">
              <div className="skeleton h-6 w-32 mx-auto rounded" />
              <div className="space-y-3">
                <div className="skeleton h-12 rounded-lg" />
                <div className="skeleton h-12 rounded-lg" />
                <div className="skeleton h-12 rounded-lg" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 pb-5">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-center">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* Data Display */}
          {!loading && data && (
            <div className="border-t border-gray-700/30">
              {data.region ? (
                <div>
                  {/* Region header */}
                  <div className={`px-6 pt-5 pb-3 text-center ${revealed ? 'reveal' : 'opacity-0'}`}>
                    <div className="inline-flex items-center gap-2 bg-[#0f0f1a] rounded-full px-4 py-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e2725b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span className="text-sm font-bold text-white">{data.region}</span>
                      <span className="text-xs text-gray-500">{data.state}</span>
                    </div>
                  </div>

                  {/* Alerts */}
                  {data.alerts.length > 0 && (
                    <div className={`px-6 pb-3 ${revealed ? 'reveal' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
                      {data.alerts.map((alert, i) => (
                        <div key={i} className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/15 rounded-lg px-3.5 py-2.5 mb-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="mt-0.5 flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          <p className="text-xs text-amber-200/80 leading-relaxed">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  {data.stats && (
                    <div className="px-6 pb-2">
                      {/* Big number */}
                      <div className={`text-center py-4 ${revealed ? 'count-reveal' : 'opacity-0'}`} style={{ animationDelay: '150ms' }}>
                        <div className="text-5xl font-black text-white tabular-nums">
                          {data.stats.total_reports}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">
                          Discrimination Reports
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className={`grid grid-cols-2 gap-2 ${revealed ? 'reveal' : 'opacity-0'}`} style={{ animationDelay: '250ms' }}>
                        <div className="bg-[#0f0f1a] rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-white">{data.stats.system_types_reported}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">System Types</div>
                        </div>
                        {data.stats.top_system && (
                          <div className="bg-[#0f0f1a] rounded-lg p-3 text-center">
                            <div className="text-sm font-bold text-white capitalize">{SYSTEM_LABELS[data.stats.top_system] || data.stats.top_system}</div>
                            <div className="text-[10px] uppercase tracking-wide" style={{ color: SYSTEM_COLORS[data.stats.top_system] || '#6b7280' }}>
                              Top System ({data.stats.top_system_pct}%)
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Visual bar for top system */}
                      {data.stats.top_system && (
                        <div className={`mt-3 ${revealed ? 'reveal' : 'opacity-0'}`} style={{ animationDelay: '350ms' }}>
                          <div className="h-1.5 bg-[#0f0f1a] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: revealed ? `${data.stats.top_system_pct}%` : '0%',
                                backgroundColor: SYSTEM_COLORS[data.stats.top_system] || '#6b7280',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services */}
                  {data.services.length > 0 && (
                    <div className={`px-6 pt-3 pb-2 ${revealed ? 'reveal' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
                      <h4 className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">Nearest Support</h4>
                      {data.services.map((service, i) => (
                        <div key={i} className="py-2 border-b border-gray-800/30 last:border-0 group">
                          <div className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors">{service.name}</div>
                          {service.phone && (
                            <a href={`tel:${service.phone}`} className="text-[11px] text-[#e2725b] hover:underline mt-0.5 inline-block">
                              {service.phone}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTAs */}
                  <div className={`px-6 pb-6 pt-4 space-y-2.5 ${revealed ? 'reveal' : 'opacity-0'}`} style={{ animationDelay: '450ms' }}>
                    <a
                      href={`/call-it-out?region=${encodeURIComponent(data.region)}&state=${data.state}`}
                      className="block w-full text-center bg-[#e2725b] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#d4634c] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#e2725b]/20"
                    >
                      Report an Incident in {data.region}
                    </a>
                    <a
                      href="/community-map"
                      className="flex items-center justify-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-400 transition-colors py-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      View full map on JusticeHub
                    </a>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#0f0f1a] flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">{data.message || 'No data for this postcode yet'}</p>
                  <a href="/call-it-out" className="text-xs text-[#e2725b] hover:underline font-medium">
                    Be the first to report
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-black/20 border-t border-gray-800/20 text-center">
            <a
              href="https://justicehub.org.au"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-700 hover:text-gray-500 transition-colors font-medium tracking-wide"
            >
              Powered by JusticeHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
