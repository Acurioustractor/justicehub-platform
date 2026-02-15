'use client';

import { Activity, Database, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface SystemHealthCardProps {
  sources: {
    total: number;
    active: number;
    stale: number;
    byType: Record<string, number>;
  };
  queue: {
    pending: number;
    avgPriority: number;
    oldestDays: number;
  };
  health: {
    successRate24h: number;
    entitiesExtracted24h: number;
    scrapesLast24h: number;
  };
}

export function SystemHealthCard({ sources, queue, health }: SystemHealthCardProps) {
  const healthStatus = health.successRate24h >= 80 ? 'healthy' : health.successRate24h >= 50 ? 'degraded' : 'critical';

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-black">System Health</h2>
        <div className={`flex items-center gap-2 px-3 py-1 border-2 ${
          healthStatus === 'healthy'
            ? 'border-green-600 bg-green-50 text-green-700'
            : healthStatus === 'degraded'
            ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
            : 'border-red-600 bg-red-50 text-red-700'
        }`}>
          {healthStatus === 'healthy' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-xs font-bold uppercase">{healthStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sources */}
        <div className="p-4 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase">Sources</span>
          </div>
          <div className="text-3xl font-black text-blue-900">{sources.total}</div>
          <div className="text-xs text-blue-600">
            {sources.active} active, {sources.stale} stale
          </div>
        </div>

        {/* 24h Success Rate */}
        <div className={`p-4 border-2 ${
          health.successRate24h >= 80
            ? 'bg-green-50 border-green-200'
            : health.successRate24h >= 50
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-4 h-4 ${
              health.successRate24h >= 80
                ? 'text-green-600'
                : health.successRate24h >= 50
                ? 'text-yellow-600'
                : 'text-red-600'
            }`} />
            <span className={`text-xs font-bold uppercase ${
              health.successRate24h >= 80
                ? 'text-green-600'
                : health.successRate24h >= 50
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>24h Success</span>
          </div>
          <div className={`text-3xl font-black ${
            health.successRate24h >= 80
              ? 'text-green-900'
              : health.successRate24h >= 50
              ? 'text-yellow-900'
              : 'text-red-900'
          }`}>{health.successRate24h}%</div>
          <div className={`text-xs ${
            health.successRate24h >= 80
              ? 'text-green-600'
              : health.successRate24h >= 50
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}>
            {health.scrapesLast24h} scrapes
          </div>
        </div>

        {/* Entities Extracted */}
        <div className="p-4 bg-purple-50 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-600 uppercase">Entities (24h)</span>
          </div>
          <div className="text-3xl font-black text-purple-900">{health.entitiesExtracted24h}</div>
          <div className="text-xs text-purple-600">extracted today</div>
        </div>

        {/* Queue Depth */}
        <div className={`p-4 border-2 ${
          queue.pending > 100
            ? 'bg-orange-50 border-orange-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-4 h-4 ${queue.pending > 100 ? 'text-orange-600' : 'text-gray-600'}`} />
            <span className={`text-xs font-bold uppercase ${queue.pending > 100 ? 'text-orange-600' : 'text-gray-600'}`}>
              Queue
            </span>
          </div>
          <div className={`text-3xl font-black ${queue.pending > 100 ? 'text-orange-900' : 'text-gray-900'}`}>
            {queue.pending}
          </div>
          <div className={`text-xs ${queue.pending > 100 ? 'text-orange-600' : 'text-gray-600'}`}>
            {queue.oldestDays > 0 ? `oldest: ${queue.oldestDays}d` : 'queue empty'}
          </div>
        </div>
      </div>

      {/* Source Types Breakdown */}
      {Object.keys(sources.byType).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase mb-3">Sources by Type</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sources.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <span
                  key={type}
                  className="px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-700"
                >
                  {type}: {count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
