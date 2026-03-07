'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Cpu, Globe, Zap, RefreshCw } from 'lucide-react';

interface Provider {
  name: string;
  available: boolean;
  disabled: boolean;
}

interface ScrapingTier {
  name: string;
  type: string;
  status: string;
  cost: string;
}

interface Pipeline {
  name: string;
  description: string;
  engine: string;
  status: string;
}

interface SystemStatusData {
  providers: Provider[];
  scrapingTiers: ScrapingTier[];
  pipelines: Pipeline[];
  infrastructure: { name: string; status: string }[];
  summary: {
    aiProviders: string;
    freeProviders: number;
    scrapingTiers: number;
    pipelines: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  };
}

const PROVIDER_META: Record<string, { label: string; cost: string }> = {
  groq: { label: 'Groq', cost: 'FREE' },
  gemini: { label: 'Gemini', cost: 'FREE' },
  minimax: { label: 'MiniMax', cost: 'Cheap' },
  deepseek: { label: 'DeepSeek', cost: '$0.27/M' },
  openai: { label: 'OpenAI', cost: '$0.15/M' },
  anthropic: { label: 'Anthropic', cost: '$3/M' },
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'operational' || status === 'healthy') {
    return (
      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 border border-green-600">
        OPERATIONAL
      </span>
    );
  }
  if (status === 'degraded') {
    return (
      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 border border-yellow-600">
        DEGRADED
      </span>
    );
  }
  return (
    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 border border-red-600">
      DOWN
    </span>
  );
}

export function SystemStatus() {
  const [data, setData] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/admin/system-status');
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchStatus(); }, []);

  if (loading) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 className="text-xl font-black text-black mb-4">System Status</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 className="text-xl font-black text-black mb-4">System Status</h3>
        <p className="text-sm text-gray-500">Failed to load system status</p>
      </div>
    );
  }

  const healthIcon = data.summary.overallHealth === 'healthy'
    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
    : data.summary.overallHealth === 'degraded'
    ? <AlertTriangle className="w-5 h-5 text-yellow-600" />
    : <XCircle className="w-5 h-5 text-red-600" />;

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-black">System Status</h3>
        <div className="flex items-center gap-2">
          {healthIcon}
          <button
            onClick={() => { setLoading(true); fetchStatus(); }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Infrastructure */}
      <div className="space-y-2 mb-5">
        {data.infrastructure.map((item) => (
          <div key={item.name} className="flex items-center justify-between py-1.5">
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>

      {/* AI Providers */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-900">
            AI Providers ({data.summary.aiProviders})
          </span>
          {data.summary.freeProviders > 0 && (
            <span className="text-xs text-green-600 font-bold">{data.summary.freeProviders} free</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {data.providers.map((p) => {
            const meta = PROVIDER_META[p.name] || { label: p.name, cost: '' };
            const isActive = p.available && !p.disabled;
            return (
              <div
                key={p.name}
                className={`flex items-center justify-between px-2 py-1.5 text-xs border ${
                  isActive
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : p.disabled
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                <span className="font-bold">{meta.label}</span>
                <span className={isActive && meta.cost === 'FREE' ? 'text-green-600 font-bold' : ''}>
                  {!p.available ? 'No key' : p.disabled ? 'Quota' : meta.cost}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scraping Tiers */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-900">Scraping Tiers</span>
        </div>
        <div className="space-y-1.5">
          {data.scrapingTiers.map((tier) => (
            <div key={tier.name} className="flex items-center justify-between px-2 py-1.5 text-xs border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-bold">{tier.name}</span>
                <span className={`px-1.5 py-0.5 ${
                  tier.type === 'free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                } font-bold`}>
                  {tier.cost}
                </span>
              </div>
              <span className={tier.status === 'operational' ? 'text-green-600' : 'text-gray-400'}>
                {tier.status === 'operational' ? 'Active' : 'No key'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Pipelines */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-900">Data Pipelines ({data.pipelines.length})</span>
        </div>
        <div className="space-y-1.5">
          {data.pipelines.map((pipeline) => (
            <div key={pipeline.name} className="flex items-center justify-between px-2 py-1.5 text-xs border border-gray-200">
              <div>
                <span className="font-bold">{pipeline.name}</span>
                <span className="text-gray-500 ml-2">{pipeline.engine}</span>
              </div>
              <span className={pipeline.status === 'operational' ? 'text-green-600' : 'text-yellow-600'}>
                {pipeline.status === 'operational' ? 'OK' : 'Degraded'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
