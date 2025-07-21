'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Core interfaces for data visualization
export interface MetricData {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  format?: 'percentage' | 'currency' | 'number' | 'text';
  comparison?: string;
  icon?: React.ReactNode;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
  category?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface ComparisonData {
  label: string;
  current: number;
  comparison: number;
  format?: 'percentage' | 'currency' | 'number';
  comparisonLabel: string;
}

// Main metric display component
export function ImpactMetric({ data }: { data: MetricData }) {
  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="data-card text-center">
      {data.icon && (
        <div className="flex justify-center mb-4">
          {data.icon}
        </div>
      )}
      <div className="font-mono text-4xl md:text-6xl font-bold mb-2">
        {formatValue(data.value, data.format)}
      </div>
      <p className="text-lg font-bold mb-2">{data.label}</p>
      
      {data.trend && data.change && (
        <div className="flex items-center justify-center gap-2 mb-2">
          {getTrendIcon(data.trend)}
          <span className="text-sm font-medium">
            {data.change > 0 ? '+' : ''}{data.change}%
          </span>
        </div>
      )}
      
      {data.comparison && (
        <p className="text-sm text-gray-600">{data.comparison}</p>
      )}
    </div>
  );
}

// Success rate visualization with animated progress
export function SuccessRateDisplay({ 
  rate, 
  label, 
  comparison,
  animated = true 
}: { 
  rate: number; 
  label: string; 
  comparison?: string;
  animated?: boolean;
}) {
  const [displayRate, setDisplayRate] = useState(rate); // Start with final rate to prevent hydration issues
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!animated || !mounted) return;
    
    // Reset to 0 and start animation only after component mounts
    setDisplayRate(0);
    
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayRate(prev => {
          const next = prev + 2;
          if (next >= rate) {
            clearInterval(interval);
            return rate;
          }
          return next;
        });
      }, 30);
    }, 200);

    return () => clearTimeout(timer);
  }, [rate, animated, mounted]);

  return (
    <div className="relative">
      {/* Circular progress */}
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 144 144">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r="64"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r="64"
            fill="none"
            stroke="#000000"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(displayRate / 100) * 402.1} 402.1`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-mono text-5xl font-bold mb-2">
              {Math.round(displayRate)}%
            </div>
            <p className="text-sm font-bold uppercase">{label}</p>
          </div>
        </div>
      </div>
      
      {comparison && (
        <p className="text-center text-sm text-gray-600 mt-4">{comparison}</p>
      )}
    </div>
  );
}

// Cost comparison visualization
export function CostComparison({ data }: { data: ComparisonData[] }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.current, d.comparison)));

  return (
    <div className="space-y-6">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <h4 className="font-bold text-lg">{item.label}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current value */}
            <div className="data-card bg-green-50 border-green-600">
              <h5 className="font-bold mb-2">COMMUNITY PROGRAMS</h5>
              <div className="font-mono text-3xl font-bold mb-2">
                {item.format === 'currency' && '$'}
                {item.current.toLocaleString()}
                {item.format === 'percentage' && '%'}
              </div>
              <div 
                className="bg-green-600 h-2 rounded transition-all duration-1000"
                style={{ width: `${(item.current / maxValue) * 100}%` }}
              />
            </div>

            {/* Comparison value */}
            <div className="data-card bg-red-50 border-red-600">
              <h5 className="font-bold mb-2">{item.comparisonLabel}</h5>
              <div className="font-mono text-3xl font-bold mb-2">
                {item.format === 'currency' && '$'}
                {item.comparison.toLocaleString()}
                {item.format === 'percentage' && '%'}
              </div>
              <div 
                className="bg-red-600 h-2 rounded transition-all duration-1000"
                style={{ width: `${(item.comparison / maxValue) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Savings calculation */}
          <div className="text-center p-4 bg-black text-white">
            <p className="font-bold">
              SAVINGS: {item.format === 'currency' && '$'}
              {(item.comparison - item.current).toLocaleString()}
              {item.format === 'percentage' && '%'} per participant
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Geographic impact map placeholder
export function GeographicImpact({ data }: { data: Array<{ state: string; programs: number; participants: number }> }) {
  return (
    <div className="data-card">
      <h3 className="text-2xl font-bold mb-6">NATIONAL IMPACT</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {data.map((state, index) => (
          <div key={index} className="text-center">
            <div className="w-16 h-16 bg-black mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-xs">{state.state}</span>
            </div>
            <div className="font-mono text-xl font-bold">{state.programs}</div>
            <p className="text-xs">programs</p>
            <div className="font-mono text-sm">{state.participants}</div>
            <p className="text-xs">youth served</p>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Interactive map showing program distribution and impact across Australia
        </p>
      </div>
    </div>
  );
}

// Outcome timeline visualization
export function OutcomeTimeline({ data }: { data: TimeSeriesData[] }) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="data-card">
      <h3 className="text-2xl font-bold mb-6">OUTCOME TRENDS</h3>
      
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-sm font-mono">
          <span>{maxValue}%</span>
          <span>{Math.round(maxValue * 0.75)}%</span>
          <span>{Math.round(maxValue * 0.5)}%</span>
          <span>{Math.round(maxValue * 0.25)}%</span>
          <span>0%</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-12 border-l-2 border-b-2 border-black h-64 relative">
          <div className="absolute inset-0 flex items-end justify-between px-4">
            {data.map((point, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="bg-black w-8 transition-all duration-1000 delay-200"
                  style={{ height: `${(point.value / maxValue) * 240}px` }}
                />
                <div className="mt-2 text-xs font-bold transform -rotate-45 origin-bottom-left">
                  {point.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Success rates over time showing sustained impact
        </p>
      </div>
    </div>
  );
}

// Quick stats dashboard
export function QuickStats({ metrics }: { metrics: MetricData[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <ImpactMetric key={index} data={metric} />
      ))}
    </div>
  );
}

// Impact comparison dashboard
export function ImpactDashboard({ 
  title,
  primaryMetric,
  secondaryMetrics,
  costComparison,
  outcomeData
}: {
  title: string;
  primaryMetric: { rate: number; label: string; comparison?: string };
  secondaryMetrics: MetricData[];
  costComparison?: ComparisonData[];
  outcomeData?: TimeSeriesData[];
}) {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
      </div>

      {/* Primary success rate */}
      <div className="flex justify-center">
        <SuccessRateDisplay
          rate={primaryMetric.rate}
          label={primaryMetric.label}
          comparison={primaryMetric.comparison}
        />
      </div>

      {/* Secondary metrics */}
      <QuickStats metrics={secondaryMetrics} />

      {/* Cost comparison */}
      {costComparison && (
        <div>
          <h3 className="text-2xl font-bold mb-6 text-center">COST EFFECTIVENESS</h3>
          <CostComparison data={costComparison} />
        </div>
      )}

      {/* Outcome timeline */}
      {outcomeData && (
        <OutcomeTimeline data={outcomeData} />
      )}
    </div>
  );
}