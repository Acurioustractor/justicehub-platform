'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { CostEffectivenessChart } from '@/components/visualizations/CostEffectivenessChart';
import { EvidenceMatrixHeatMap } from '@/components/visualizations/EvidenceMatrixHeatMap';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  DollarSign,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  AlertTriangle,
  Target,
  Sparkles,
} from 'lucide-react';

interface DashboardStats {
  services: number;
  interventions: number;
  evidence: number;
  funding_opportunities: number;
  organizations: number;
  coverage_by_state: Record<string, number>;
}

interface Provenance {
  mode: 'authoritative' | 'computed';
  summary: string;
  generated_at: string;
}

export default function IntelligenceOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Record<string, boolean>>({
    coverage: true,
    effectiveness: false,
    evidence: false,
    funding: false,
  });

  const [coverageData, setCoverageData] = useState<Array<{
    state: string;
    services_count: number;
    interventions_count: number;
    funding_opportunities: number;
    coverage_score: number;
  }>>([]);

  const [interventionData, setInterventionData] = useState<Array<{
    id: string;
    name: string;
    type: string;
    cost_per_participant: number;
    effectiveness_score: number;
    reach: number;
    evidence_level: string;
    state: string;
    organization: string;
  }>>([]);

  const [evidenceMatrix, setEvidenceMatrix] = useState<Array<{
    topic: string;
    jurisdiction: string;
    count: number;
  }>>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/intelligence/overview-summary', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Overview summary request failed with ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load overview summary');
      }

      setStats({
        services: data.stats?.services || 0,
        interventions: data.stats?.interventions || 0,
        evidence: data.stats?.evidence || 0,
        funding_opportunities: data.stats?.funding_opportunities || 0,
        organizations: data.stats?.organizations || 0,
        coverage_by_state: data.stats?.coverage_by_state || {},
      });

      setCoverageData(data.coverageData || []);
      setInterventionData(data.interventionData || []);
      setEvidenceMatrix(data.evidenceMatrix || []);
      setProvenance(data.provenance || null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-black text-black">
                Intelligence Overview
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Data-driven insights for youth justice decision making
            </p>
            {provenance && (
              <div className="mt-3 inline-flex items-center gap-2 border border-black bg-white px-3 py-1 text-xs">
                <span className={`font-bold uppercase ${provenance.mode === 'authoritative' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {provenance.mode}
                </span>
                <span className="text-gray-700">{provenance.summary}</span>
              </div>
            )}
          </div>

          {/* Tier 1: Glance - Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard
              icon={MapPin}
              label="Services"
              value={stats?.services || 0}
              color="blue"
              trend="+12%"
            />
            <MetricCard
              icon={Target}
              label="Interventions"
              value={stats?.interventions || 0}
              color="purple"
              trend="+8%"
            />
            <MetricCard
              icon={BookOpen}
              label="Evidence Items"
              value={stats?.evidence || 0}
              color="green"
              trend="+15%"
            />
            <MetricCard
              icon={DollarSign}
              label="Funding Opps"
              value={stats?.funding_opportunities || 0}
              color="amber"
              trend="Active"
            />
            <MetricCard
              icon={Users}
              label="Organizations"
              value={stats?.organizations || 0}
              color="cyan"
              trend="+3%"
            />
          </div>

          {/* Tier 2 & 3: Expandable Sections */}
          <div className="space-y-6">
            {/* Coverage Map Section */}
            <ExpandableCard
              title="Service Coverage Map"
              subtitle="Geographic distribution of youth justice services across Australia"
              icon={MapPin}
              iconColor="text-blue-600"
              expanded={sections.coverage}
              onToggle={() => toggleSection('coverage')}
            >
              <div className="p-6">
                <div className="border-2 border-black bg-blue-50 p-6 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black text-black mb-2">
                        Interactive map available in System Map
                      </h4>
                      <p className="text-sm text-gray-700 max-w-2xl">
                        The live map module is available on the dedicated intelligence map route.
                        This overview now surfaces state-level coverage snapshots for faster page
                        load and more stable local development.
                      </p>
                    </div>
                    <a
                      href="/intelligence/map"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border-2 border-black font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Open System Map
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  {['NSW', 'VIC', 'QLD', 'NT'].map((state) => {
                    const data = coverageData.find((d) => d.state === state);
                    return (
                      <div
                        key={state}
                        className="p-3 bg-gray-50 border border-gray-200"
                      >
                        <div className="text-sm font-bold text-gray-800">
                          {state}
                        </div>
                        <div className="text-2xl font-black text-blue-600">
                          {data?.services_count || 0}
                        </div>
                        <div className="text-xs text-gray-500">services</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ExpandableCard>

            {/* Cost-Effectiveness Section */}
            <ExpandableCard
              title="Cost-Effectiveness Analysis"
              subtitle="Compare intervention costs against effectiveness outcomes"
              icon={TrendingUp}
              iconColor="text-green-600"
              expanded={sections.effectiveness}
              onToggle={() => toggleSection('effectiveness')}
            >
              <div className="p-6">
                {interventionData.length > 0 ? (
                  <CostEffectivenessChart
                    data={interventionData}
                    height={500}
                    showQuadrants
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No intervention data available for analysis</p>
                  </div>
                )}
              </div>
            </ExpandableCard>

            {/* Evidence Matrix Section */}
            <ExpandableCard
              title="Evidence Coverage Matrix"
              subtitle="Research coverage by topic and jurisdiction - identify gaps"
              icon={Layers}
              iconColor="text-purple-600"
              expanded={sections.evidence}
              onToggle={() => toggleSection('evidence')}
            >
              <div className="p-6">
                <EvidenceMatrixHeatMap
                  data={evidenceMatrix}
                  showGaps
                  onCellClick={(topic, jurisdiction) => {
                    console.log(`Clicked: ${topic} - ${jurisdiction}`);
                    // Could open filtered evidence view
                  }}
                />
              </div>
            </ExpandableCard>

            {/* Funding Pipeline Section */}
            <ExpandableCard
              title="Funding Pipeline"
              subtitle="Track and prioritize funding opportunities for basecamps"
              icon={DollarSign}
              iconColor="text-amber-600"
              expanded={sections.funding}
              onToggle={() => toggleSection('funding')}
            >
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Kanban-style columns */}
                  <FundingColumn
                    title="Closing Soon"
                    count={3}
                    color="red"
                    items={[
                      {
                        name: 'Indigenous Youth Justice Grant',
                        funder: 'Paul Ramsay Foundation',
                        deadline: '5 days',
                        amount: '$500K',
                      },
                      {
                        name: 'Community Diversion Program',
                        funder: 'QLD Government',
                        deadline: '12 days',
                        amount: '$200K',
                      },
                    ]}
                  />
                  <FundingColumn
                    title="Open"
                    count={8}
                    color="green"
                    items={[
                      {
                        name: 'Mental Health Support',
                        funder: 'Minderoo Foundation',
                        deadline: '45 days',
                        amount: '$1M',
                      },
                      {
                        name: 'Education Pathways',
                        funder: 'Ian Potter Foundation',
                        deadline: '60 days',
                        amount: '$250K',
                      },
                    ]}
                  />
                  <FundingColumn
                    title="Upcoming"
                    count={5}
                    color="blue"
                    items={[
                      {
                        name: 'National Youth Strategy',
                        funder: 'Federal Government',
                        deadline: 'Opens Jan',
                        amount: 'TBA',
                      },
                    ]}
                  />
                </div>

                <div className="mt-6 text-center">
                  <a
                    href="/admin/funding"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white border-2 border-black font-bold hover:bg-amber-700 transition-colors"
                  >
                    View Full Pipeline
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </ExpandableCard>
          </div>

          {/* Action Items */}
          <div className="mt-12 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-black text-black">
                Recommended Actions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                priority="high"
                title="Review Closing Funding"
                description="3 funding opportunities close within 14 days"
                action="Review Now"
                href="/admin/funding?status=closing_soon"
              />
              <ActionCard
                priority="medium"
                title="Fill Evidence Gaps"
                description="12 topic-jurisdiction combinations need research"
                action="View Gaps"
                href="/admin/research"
              />
              <ActionCard
                priority="low"
                title="Expand NT Coverage"
                description="Northern Territory has lowest service density"
                action="View Services"
                href="/admin/services?state=NT"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  trend?: string;
}

function MetricCard({ icon: Icon, label, value, color, trend }: MetricCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-600' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`${colors.bg} border-2 ${colors.border} p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${colors.text}`} />
        {trend && (
          <span className={`text-xs font-bold ${colors.text}`}>{trend}</span>
        )}
      </div>
      <div className="text-3xl font-black text-black">{value.toLocaleString()}</div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
    </div>
  );
}

interface ExpandableCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ExpandableCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  expanded,
  onToggle,
  children,
}: ExpandableCardProps) {
  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <Icon className={`w-6 h-6 ${iconColor}`} />
          <div className="text-left">
            <h3 className="text-xl font-bold text-black">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expanded && <div className="border-t-2 border-black">{children}</div>}
    </div>
  );
}

interface FundingColumnProps {
  title: string;
  count: number;
  color: string;
  items: Array<{
    name: string;
    funder: string;
    deadline: string;
    amount: string;
  }>;
}

function FundingColumn({ title, count, color, items }: FundingColumnProps) {
  const colorClasses: Record<string, { header: string; badge: string }> = {
    red: { header: 'bg-red-100 border-red-600', badge: 'bg-red-600' },
    green: { header: 'bg-green-100 border-green-600', badge: 'bg-green-600' },
    blue: { header: 'bg-blue-100 border-blue-600', badge: 'bg-blue-600' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="border-2 border-gray-200">
      <div className={`p-3 ${colors.header} border-b-2 flex items-center justify-between`}>
        <span className="font-bold text-sm">{title}</span>
        <span className={`${colors.badge} text-white text-xs font-bold px-2 py-0.5`}>
          {count}
        </span>
      </div>
      <div className="p-3 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 border border-gray-200">
            <div className="font-bold text-sm text-gray-800 line-clamp-1">
              {item.name}
            </div>
            <div className="text-xs text-gray-600 mt-1">{item.funder}</div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-500">{item.deadline}</span>
              <span className="font-bold text-green-600">{item.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ActionCardProps {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  href: string;
}

function ActionCard({ priority, title, description, action, href }: ActionCardProps) {
  const priorityStyles = {
    high: 'border-red-600 bg-red-50',
    medium: 'border-amber-600 bg-amber-50',
    low: 'border-blue-600 bg-blue-50',
  };

  const priorityBadge = {
    high: 'bg-red-600 text-white',
    medium: 'bg-amber-600 text-white',
    low: 'bg-blue-600 text-white',
  };

  return (
    <div className={`p-4 border-2 ${priorityStyles[priority]}`}>
      <div className="flex items-start justify-between mb-2">
        <span
          className={`text-xs font-bold px-2 py-0.5 ${priorityBadge[priority]}`}
        >
          {priority.toUpperCase()}
        </span>
        {priority === 'high' && (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        )}
      </div>
      <h4 className="font-bold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <a
        href={href}
        className="inline-block mt-3 text-sm font-bold text-blue-600 hover:underline"
      >
        {action} →
      </a>
    </div>
  );
}
