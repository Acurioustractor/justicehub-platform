'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DailyData {
  date: string;
  success: number;
  failed: number;
  entities: number;
  successRate: number | null;
}

interface Summary {
  totalScrapes: number;
  totalSuccess: number;
  totalFailed: number;
  overallSuccessRate: number;
  totalEntities: number;
  avgDailyEntities: number;
  periodDays: number;
}

interface ScrapeTimelineProps {
  daily: DailyData[];
  summary: Summary;
}

export function ScrapeTimeline({ daily, summary }: ScrapeTimelineProps) {
  // Calculate trend
  const trend = useMemo(() => {
    if (daily.length < 7) return 0;
    const recentWeek = daily.slice(-7);
    const previousWeek = daily.slice(-14, -7);

    const recentAvg = recentWeek.reduce((sum, d) => sum + d.entities, 0) / 7;
    const previousAvg = previousWeek.length > 0
      ? previousWeek.reduce((sum, d) => sum + d.entities, 0) / previousWeek.length
      : recentAvg;

    if (previousAvg === 0) return 0;
    return Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
  }, [daily]);

  // Calculate max values for scaling
  const maxScrapes = useMemo(() => {
    return Math.max(...daily.map(d => d.success + d.failed), 1);
  }, [daily]);

  const maxEntities = useMemo(() => {
    return Math.max(...daily.map(d => d.entities), 1);
  }, [daily]);

  const TrendIcon = trend > 5 ? TrendingUp : trend < -5 ? TrendingDown : Minus;
  const trendColor = trend > 5 ? 'text-green-600' : trend < -5 ? 'text-red-600' : 'text-gray-600';

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-black">Scrape Timeline</h2>
          <p className="text-sm text-gray-600">
            Last {summary.periodDays} days activity
          </p>
        </div>
        <div className={`flex items-center gap-2 ${trendColor}`}>
          <TrendIcon className="w-5 h-5" />
          <span className="font-bold">
            {trend > 0 ? '+' : ''}{trend}% vs prev week
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-gray-50 border border-gray-200">
          <div className="text-2xl font-black text-gray-900">{summary.totalScrapes}</div>
          <div className="text-xs text-gray-600">Total Scrapes</div>
        </div>
        <div className="p-3 bg-green-50 border border-green-200">
          <div className="text-2xl font-black text-green-700">{summary.overallSuccessRate}%</div>
          <div className="text-xs text-green-600">Success Rate</div>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200">
          <div className="text-2xl font-black text-purple-700">{summary.totalEntities.toLocaleString()}</div>
          <div className="text-xs text-purple-600">Entities Extracted</div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200">
          <div className="text-2xl font-black text-blue-700">{summary.avgDailyEntities}</div>
          <div className="text-xs text-blue-600">Daily Average</div>
        </div>
      </div>

      {/* Scrapes Bar Chart */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-xs font-bold text-gray-500 uppercase">Scrapes per Day</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500"></span> Success
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500"></span> Failed
            </span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-32">
          {daily.map((day, index) => {
            const totalHeight = ((day.success + day.failed) / maxScrapes) * 100;
            const successHeight = day.success + day.failed > 0
              ? (day.success / (day.success + day.failed)) * totalHeight
              : 0;
            const failedHeight = totalHeight - successHeight;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col justify-end group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  <div className="font-bold">{formatDate(day.date)}</div>
                  <div>Success: {day.success}</div>
                  <div>Failed: {day.failed}</div>
                </div>

                {/* Failed bar (top) */}
                {failedHeight > 0 && (
                  <div
                    className="w-full bg-red-500 transition-all"
                    style={{ height: `${failedHeight}%` }}
                  />
                )}
                {/* Success bar (bottom) */}
                {successHeight > 0 && (
                  <div
                    className="w-full bg-green-500 transition-all"
                    style={{ height: `${successHeight}%` }}
                  />
                )}
                {/* Show empty state */}
                {totalHeight === 0 && (
                  <div className="w-full h-1 bg-gray-200" />
                )}

                {/* Date label (show every 5th) */}
                {index % 5 === 0 && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">
                    {formatDate(day.date).split(' ')[1]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Entities Line */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs font-bold text-gray-500 uppercase mb-3">Entities Extracted</div>
        <div className="flex items-end gap-1 h-16">
          {daily.map((day) => {
            const height = (day.entities / maxEntities) * 100;
            return (
              <div
                key={`entities-${day.date}`}
                className="flex-1 group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  <div className="font-bold">{formatDate(day.date)}</div>
                  <div>{day.entities} entities</div>
                </div>

                <div
                  className="w-full bg-purple-500 transition-all hover:bg-purple-600"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
