'use client';

import { AlertTriangle, AlertCircle, Info, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  sourceId?: string;
  sourceName?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface AlertsListProps {
  alerts: Alert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AlertsList({ alerts, summary, onRefresh, isLoading }: AlertsListProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMins = Math.floor(diffMs / (60 * 1000));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'just now';
  };

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-black">Alerts & Issues</h2>
          <p className="text-sm text-gray-600">
            {summary.total} active alerts
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Summary badges */}
          <div className="flex items-center gap-2">
            {summary.critical > 0 && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold">
                {summary.critical} critical
              </span>
            )}
            {summary.warning > 0 && (
              <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold">
                {summary.warning} warning
              </span>
            )}
            {summary.info > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
                {summary.info} info
              </span>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">No active alerts</p>
          <p className="text-sm">All systems operating normally</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 border-2 transition-colors ${getSeverityStyles(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 text-sm">{alert.message}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimeAgo(alert.createdAt)}
                    </span>
                  </div>
                  {alert.sourceId && (
                    <div className="mt-2">
                      <Link
                        href={`/admin/data-operations?source=${alert.sourceId}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        View source
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                  {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(alert.metadata).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-0.5 bg-white/50 text-xs text-gray-600 border border-gray-300"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
