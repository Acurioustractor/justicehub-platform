'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  Flag,
  ArrowRight
} from 'lucide-react';

// Core interfaces for timeline tracking
export interface Milestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  completion_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'at_risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deliverables: string[];
  dependencies?: string[];
  assigned_to?: string;
  progress_percentage: number;
  category: 'planning' | 'setup' | 'implementation' | 'evaluation' | 'sustainability';
  budget_allocated?: number;
  budget_spent?: number;
  notes?: string;
}

export interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'completed' | 'delayed';
  milestones: Milestone[];
  success_criteria: string[];
  key_risks: string[];
  total_budget: number;
  spent_budget: number;
}

export interface ProjectTimeline {
  id: string;
  project_name: string;
  project_type: string;
  start_date: string;
  target_completion: string;
  actual_completion?: string;
  overall_status: 'planning' | 'active' | 'completed' | 'on_hold' | 'at_risk';
  overall_progress: number;
  phases: TimelinePhase[];
  program_manager: string;
  stakeholders: string[];
  total_budget: number;
  spent_budget: number;
}

// Timeline status indicators
export function StatusIndicator({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-600', icon: CheckCircle, label: 'Completed' };
      case 'in_progress':
        return { color: 'bg-blue-600', icon: Clock, label: 'In Progress' };
      case 'pending':
        return { color: 'bg-gray-400', icon: Target, label: 'Pending' };
      case 'overdue':
        return { color: 'bg-red-600', icon: AlertTriangle, label: 'Overdue' };
      case 'at_risk':
        return { color: 'bg-yellow-600', icon: AlertTriangle, label: 'At Risk' };
      default:
        return { color: 'bg-gray-400', icon: Target, label: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${config.color}`} />
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

// Progress bar component
export function ProgressBar({ 
  progress, 
  showPercentage = true,
  size = 'medium',
  color = 'blue'
}: { 
  progress: number; 
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm font-mono font-bold min-w-[3rem]">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

// Individual milestone card
export function MilestoneCard({ 
  milestone, 
  onUpdate,
  isExpanded = false,
  onToggleExpanded 
}: { 
  milestone: Milestone;
  onUpdate?: (milestone: Milestone) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const isOverdue = milestone.status !== 'completed' && new Date(milestone.target_date) < new Date();
  const daysUntilDue = Math.ceil((new Date(milestone.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-600 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getPriorityColor(milestone.priority)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-bold text-lg">{milestone.title}</h4>
            <StatusIndicator status={milestone.status} />
          </div>
          <p className="text-gray-700 mb-2">{milestone.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Due: {new Date(milestone.target_date).toLocaleDateString()}</span>
            </div>
            {daysUntilDue > 0 ? (
              <span className="text-blue-600">({daysUntilDue} days remaining)</span>
            ) : daysUntilDue === 0 ? (
              <span className="text-yellow-600 font-bold">(Due today)</span>
            ) : (
              <span className="text-red-600 font-bold">({Math.abs(daysUntilDue)} days overdue)</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl font-bold mb-1">{milestone.progress_percentage}%</div>
          <p className="text-xs uppercase font-bold text-gray-600">Progress</p>
          
          {onToggleExpanded && (
            <button 
              onClick={onToggleExpanded}
              className="mt-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      <ProgressBar 
        progress={milestone.progress_percentage} 
        color={milestone.status === 'completed' ? 'green' : 
               milestone.status === 'overdue' ? 'red' : 'blue'}
      />

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-bold mb-2">Deliverables</h5>
              <ul className="space-y-1">
                {milestone.deliverables.map((deliverable, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>

            {milestone.budget_allocated && (
              <div>
                <h5 className="font-bold mb-2">Budget</h5>
                <div className="space-y-1 text-sm">
                  <div>Allocated: ${milestone.budget_allocated.toLocaleString()}</div>
                  {milestone.budget_spent && (
                    <div>Spent: ${milestone.budget_spent.toLocaleString()}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {milestone.notes && (
            <div className="mt-4">
              <h5 className="font-bold mb-2">Notes</h5>
              <p className="text-sm text-gray-700">{milestone.notes}</p>
            </div>
          )}

          {onUpdate && (
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => onUpdate({...milestone, status: 'completed', progress_percentage: 100})}
                className="cta-primary text-sm px-4 py-2"
                disabled={milestone.status === 'completed'}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Mark Complete
              </button>
              <button className="cta-secondary text-sm px-4 py-2">
                <Edit3 className="mr-1 h-4 w-4" />
                Edit Milestone
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Phase timeline view
export function PhaseTimeline({ 
  phase, 
  isActive = false,
  onMilestoneUpdate 
}: { 
  phase: TimelinePhase;
  isActive?: boolean;
  onMilestoneUpdate?: (milestone: Milestone) => void;
}) {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-600 bg-green-50';
      case 'active': return 'border-blue-600 bg-blue-50';
      case 'delayed': return 'border-red-600 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const completedMilestones = phase.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = phase.milestones.length;
  const phaseProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className={`border-2 rounded-lg p-6 ${getPhaseStatusColor(phase.status)} ${isActive ? 'ring-2 ring-blue-600' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">{phase.title}</h3>
          <p className="text-gray-700 mb-4">{phase.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-bold">Start:</span> {new Date(phase.start_date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-bold">End:</span> {new Date(phase.end_date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-bold">Budget:</span> ${phase.total_budget.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-right">
          <StatusIndicator status={phase.status} />
          <div className="mt-2">
            <div className="font-mono text-xl font-bold">{Math.round(phaseProgress)}%</div>
            <p className="text-xs text-gray-600">Phase Progress</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ProgressBar 
          progress={phaseProgress} 
          color={phase.status === 'completed' ? 'green' : 
                 phase.status === 'delayed' ? 'red' : 'blue'}
        />
      </div>

      <div className="mb-6">
        <h4 className="font-bold mb-3">Milestones ({completedMilestones}/{totalMilestones} completed)</h4>
        <div className="space-y-3">
          {phase.milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onUpdate={onMilestoneUpdate}
              isExpanded={expandedMilestone === milestone.id}
              onToggleExpanded={() => 
                setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)
              }
            />
          ))}
        </div>
      </div>

      {phase.success_criteria.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-bold mb-2">Success Criteria</h5>
            <ul className="space-y-1">
              {phase.success_criteria.map((criteria, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          {phase.key_risks.length > 0 && (
            <div>
              <h5 className="font-bold mb-2">Key Risks</h5>
              <ul className="space-y-1">
                {phase.key_risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Complete project timeline dashboard
export function ProjectTimelineDashboard({ 
  timeline,
  onUpdate
}: { 
  timeline: ProjectTimeline;
  onUpdate?: (timeline: ProjectTimeline) => void;
}) {
  const [selectedPhase, setSelectedPhase] = useState<string>(timeline.phases[0]?.id);

  const currentPhase = timeline.phases.find(p => p.id === selectedPhase);
  const overallProgress = timeline.overall_progress;
  
  const totalMilestones = timeline.phases.reduce((acc, phase) => acc + phase.milestones.length, 0);
  const completedMilestones = timeline.phases.reduce((acc, phase) => 
    acc + phase.milestones.filter(m => m.status === 'completed').length, 0
  );

  const upcomingMilestones = timeline.phases
    .flatMap(phase => phase.milestones)
    .filter(milestone => 
      milestone.status !== 'completed' && 
      new Date(milestone.target_date) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    )
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Project Overview */}
      <div className="data-card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">{timeline.project_name}</h2>
            <p className="text-gray-600">{timeline.project_type}</p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div>
                <span className="font-bold">Started:</span> {new Date(timeline.start_date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-bold">Target:</span> {new Date(timeline.target_completion).toLocaleDateString()}
              </div>
              <div>
                <span className="font-bold">Manager:</span> {timeline.program_manager}
              </div>
            </div>
          </div>

          <div className="text-right">
            <StatusIndicator status={timeline.overall_status} />
            <div className="mt-3">
              <div className="font-mono text-3xl font-bold">{Math.round(overallProgress)}%</div>
              <p className="text-sm text-gray-600">Overall Progress</p>
            </div>
          </div>
        </div>

        <ProgressBar 
          progress={overallProgress} 
          size="large"
          color={timeline.overall_status === 'completed' ? 'green' : 
                 timeline.overall_status === 'at_risk' ? 'red' : 'blue'}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="font-mono text-2xl font-bold">{completedMilestones}/{totalMilestones}</div>
            <p className="text-sm text-gray-600">Milestones</p>
          </div>
          <div className="text-center">
            <div className="font-mono text-2xl font-bold">{timeline.phases.length}</div>
            <p className="text-sm text-gray-600">Phases</p>
          </div>
          <div className="text-center">
            <div className="font-mono text-2xl font-bold">${timeline.spent_budget.toLocaleString()}</div>
            <p className="text-sm text-gray-600">Budget Spent</p>
          </div>
          <div className="text-center">
            <div className="font-mono text-2xl font-bold">{timeline.stakeholders.length}</div>
            <p className="text-sm text-gray-600">Stakeholders</p>
          </div>
        </div>
      </div>

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <div className="data-card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Upcoming Milestones (Next 2 Weeks)
          </h3>
          <div className="space-y-3">
            {upcomingMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <h4 className="font-bold">{milestone.title}</h4>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{new Date(milestone.target_date).toLocaleDateString()}</div>
                  <StatusIndicator status={milestone.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase Navigation */}
      <div className="flex flex-wrap gap-2">
        {timeline.phases.map((phase, index) => (
          <button
            key={phase.id}
            onClick={() => setSelectedPhase(phase.id)}
            className={`px-4 py-2 font-bold transition-all ${
              selectedPhase === phase.id
                ? 'bg-black text-white'
                : 'border-2 border-black hover:bg-black hover:text-white'
            }`}
          >
            Phase {index + 1}: {phase.title}
          </button>
        ))}
      </div>

      {/* Selected Phase Detail */}
      {currentPhase && (
        <PhaseTimeline
          phase={currentPhase}
          isActive={timeline.overall_status === 'active'}
          onMilestoneUpdate={(milestone) => {
            // Handle milestone updates
            console.log('Milestone updated:', milestone);
          }}
        />
      )}
    </div>
  );
}

// Quick timeline summary for cards/dashboards
export function TimelineSummary({ 
  timeline,
  showDetails = false 
}: { 
  timeline: ProjectTimeline;
  showDetails?: boolean;
}) {
  const nextMilestone = timeline.phases
    .flatMap(phase => phase.milestones)
    .filter(milestone => milestone.status !== 'completed')
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())[0];

  return (
    <div className="data-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{timeline.project_name}</h3>
          <p className="text-sm text-gray-600">{timeline.project_type}</p>
        </div>
        <StatusIndicator status={timeline.overall_status} />
      </div>

      <ProgressBar progress={timeline.overall_progress} />

      {nextMilestone && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Next Milestone</p>
              <p className="text-sm">{nextMilestone.title}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-mono">{new Date(nextMilestone.target_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-mono font-bold">{timeline.phases.length}</div>
              <p className="text-gray-600">Phases</p>
            </div>
            <div>
              <div className="font-mono font-bold">${Math.round(timeline.spent_budget / 1000)}k</div>
              <p className="text-gray-600">Spent</p>
            </div>
            <div>
              <div className="font-mono font-bold">{timeline.stakeholders.length}</div>
              <p className="text-gray-600">Stakeholders</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}