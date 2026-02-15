/**
 * Features Roadmap Page
 * 
 * Community-driven roadmap showcasing upcoming features and development priorities
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowRight,
  Calendar,
  Users,
  Star,
  Clock,
  CheckCircle,
  Circle,
  Play,
  Zap,
  Lightbulb,
  MessageCircle,
  Heart,
  TrendingUp,
  Filter,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Target,
  Rocket,
  Code,
  Smartphone,
  Shield,
  Globe,
  Brain,
  Network,
  BarChart3,
  Settings,
  Bell,
  FileText,
  Video,
  Camera,
  Mic,
  Building2,
  MapPin,
  UserPlus,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'platform' | 'content' | 'community' | 'mobile' | 'ai' | 'integration';
  status: 'planned' | 'in_progress' | 'testing' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  quarter: 'Q1 2024' | 'Q2 2024' | 'Q3 2024' | 'Q4 2024' | 'Q1 2025';
  votes: number;
  comments: number;
  contributors: string[];
  tags: string[];
  estimatedCompletion?: string;
  dependencies?: string[];
  details: string[];
}

interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  votes: number;
  category: string;
  status: 'submitted' | 'under_review' | 'approved' | 'declined';
}

export default function RoadmapPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roadmapItems: RoadmapItem[] = [
    {
      id: 'ai-matching',
      title: 'AI-Powered Mentor Matching',
      description: 'Intelligent mentor-youth pairing based on interests, goals, and personality compatibility',
      category: 'ai',
      status: 'in_progress',
      priority: 'high',
      quarter: 'Q2 2024',
      votes: 234,
      comments: 45,
      contributors: ['AI Team', 'Mentorship Team'],
      tags: ['AI', 'mentorship', 'matching', 'algorithms'],
      estimatedCompletion: 'June 2024',
      dependencies: ['user-profiles-v2'],
      details: [
        'Machine learning algorithm development for compatibility scoring',
        'Integration with existing mentor and youth profiles',
        'A/B testing with pilot mentorship programs',
        'Feedback loop implementation for continuous improvement'
      ]
    },
    {
      id: 'mobile-app',
      title: 'JusticeHub Mobile App',
      description: 'Native mobile application for iOS and Android with offline capabilities',
      category: 'mobile',
      status: 'planned',
      priority: 'critical',
      quarter: 'Q3 2024',
      votes: 512,
      comments: 89,
      contributors: ['Mobile Team', 'Design Team'],
      tags: ['mobile', 'iOS', 'Android', 'offline', 'native'],
      estimatedCompletion: 'September 2024',
      dependencies: ['api-v2', 'user-auth-revamp'],
      details: [
        'React Native development for cross-platform compatibility',
        'Offline story reading and service discovery',
        'Push notifications for mentor connections and opportunities',
        'Location-based service recommendations',
        'Biometric authentication for secure access'
      ]
    },
    {
      id: 'video-calling',
      title: 'Integrated Video Calling',
      description: 'Secure, built-in video calling for mentor sessions and group meetings',
      category: 'platform',
      status: 'planned',
      priority: 'medium',
      quarter: 'Q4 2024',
      votes: 156,
      comments: 23,
      contributors: ['Platform Team', 'Security Team'],
      tags: ['video', 'communication', 'security', 'mentorship'],
      estimatedCompletion: 'November 2024',
      dependencies: ['mobile-app'],
      details: [
        'WebRTC integration for peer-to-peer video calls',
        'End-to-end encryption for all communications',
        'Recording capabilities with consent management',
        'Screen sharing for educational sessions',
        'Group video calls for community meetings'
      ]
    },
    {
      id: 'gamification',
      title: 'Achievement & Progress System',
      description: 'Gamified journey tracking with badges, milestones, and community recognition',
      category: 'community',
      status: 'testing',
      priority: 'medium',
      quarter: 'Q2 2024',
      votes: 189,
      comments: 34,
      contributors: ['Community Team', 'UX Team'],
      tags: ['gamification', 'achievements', 'progress', 'motivation'],
      estimatedCompletion: 'May 2024',
      details: [
        'Personal progress tracking across all platform activities',
        'Community challenges and collaborative goals',
        'Peer recognition system and endorsements',
        'Integration with external certifications and qualifications',
        'Mentorship milestone celebrations'
      ]
    },
    {
      id: 'analytics-dashboard',
      title: 'Community Impact Analytics',
      description: 'Comprehensive analytics dashboard showing community-wide impact metrics',
      category: 'platform',
      status: 'planned',
      priority: 'high',
      quarter: 'Q3 2024',
      votes: 298,
      comments: 67,
      contributors: ['Data Team', 'Community Team'],
      tags: ['analytics', 'impact', 'metrics', 'reporting'],
      estimatedCompletion: 'August 2024',
      dependencies: ['data-pipeline-v2'],
      details: [
        'Real-time impact metrics and success stories',
        'Geographic distribution of community engagement',
        'Service utilization and effectiveness tracking',
        'Mentorship outcome measurement and analysis',
        'Automated report generation for stakeholders'
      ]
    },
    {
      id: 'api-integrations',
      title: 'Third-Party Service Integrations',
      description: 'Connect with government services, employment agencies, and education platforms',
      category: 'integration',
      status: 'planned',
      priority: 'high',
      quarter: 'Q4 2024',
      votes: 167,
      comments: 41,
      contributors: ['Integration Team', 'Partnerships Team'],
      tags: ['API', 'integration', 'government', 'employment', 'education'],
      estimatedCompletion: 'December 2024',
      dependencies: ['api-v2', 'security-audit'],
      details: [
        'Centrelink and government services integration',
        'Job search platform connections (SEEK, Indeed)',
        'Educational institution partnerships and course recommendations',
        'Legal aid service directory integration',
        'Healthcare and mental health service connections'
      ]
    },
    {
      id: 'ai-content-generation',
      title: 'AI Story and Content Assistance',
      description: 'AI-powered tools to help users create and enhance their stories and profiles',
      category: 'ai',
      status: 'planned',
      priority: 'medium',
      quarter: 'Q1 2025',
      votes: 143,
      comments: 28,
      contributors: ['AI Team', 'Content Team'],
      tags: ['AI', 'content', 'writing', 'assistance', 'stories'],
      estimatedCompletion: 'March 2025',
      dependencies: ['ai-matching'],
      details: [
        'Writing assistance for personal stories and profiles',
        'Grammar and tone suggestions for better communication',
        'Content translation for multilingual accessibility',
        'Image and video captioning for accessibility',
        'Personalized content recommendations based on interests'
      ]
    },
    {
      id: 'offline-mode',
      title: 'Enhanced Offline Capabilities',
      description: 'Full offline access to stories, resources, and cached content',
      category: 'mobile',
      status: 'planned',
      priority: 'medium',
      quarter: 'Q4 2024',
      votes: 201,
      comments: 52,
      contributors: ['Mobile Team', 'Platform Team'],
      tags: ['offline', 'sync', 'accessibility', 'rural'],
      estimatedCompletion: 'October 2024',
      dependencies: ['mobile-app'],
      details: [
        'Offline story reading with bookmark sync',
        'Cached service directory for remote areas',
        'Offline form completion with auto-sync',
        'Emergency contact information always available',
        'Optimized content delivery for low-bandwidth areas'
      ]
    }
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: Star, color: 'text-gray-600' },
    { id: 'platform', label: 'Platform', icon: Code, color: 'text-blue-600' },
    { id: 'content', label: 'Content', icon: FileText, color: 'text-green-600' },
    { id: 'community', label: 'Community', icon: Users, color: 'text-purple-600' },
    { id: 'mobile', label: 'Mobile', icon: Smartphone, color: 'text-orange-600' },
    { id: 'ai', label: 'AI & ML', icon: Brain, color: 'text-pink-600' },
    { id: 'integration', label: 'Integrations', icon: Network, color: 'text-indigo-600' }
  ];

  const statusOptions = [
    { id: 'all', label: 'All Status', icon: Circle, color: 'text-gray-600' },
    { id: 'planned', label: 'Planned', icon: Calendar, color: 'text-gray-500' },
    { id: 'in_progress', label: 'In Progress', icon: Play, color: 'text-blue-500' },
    { id: 'testing', label: 'Testing', icon: Zap, color: 'text-yellow-500' },
    { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-500' }
  ];

  const quarters = [
    { id: 'all', label: 'All Quarters' },
    { id: 'Q1 2024', label: 'Q1 2024' },
    { id: 'Q2 2024', label: 'Q2 2024' },
    { id: 'Q3 2024', label: 'Q3 2024' },
    { id: 'Q4 2024', label: 'Q4 2024' },
    { id: 'Q1 2025', label: 'Q1 2025' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'testing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredItems = roadmapItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (selectedQuarter !== 'all' && item.quarter !== selectedQuarter) return false;
    return true;
  });

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Unified Navigation */}
      <Navigation />

      <main id="main-content">
        {/* Hero Section */}
        <section className="header-offset pb-16 border-b-2 border-black bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container-justice">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-4 text-sm uppercase tracking-wider text-green-600 font-bold flex items-center justify-center gap-2">
                <Rocket className="h-5 w-5" />
                COMMUNITY ROADMAP
              </div>
              <h1 className="headline-truth mb-6">
                Building the Future Together
              </h1>
              <p className="text-xl text-black mb-10 leading-relaxed font-medium">
                Discover what's coming to JusticeHub, vote on features you want most, 
                and suggest ideas that will help transform communities across Australia.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  onClick={() => setShowSuggestionForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Suggest a Feature
                </Button>
                <Button variant="outline" size="lg" className="border-2 border-black hover:bg-gray-50">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Join Discussion
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container-justice py-8">
          {/* Roadmap Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Target className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <div className="text-3xl font-bold text-black">{roadmapItems.length}</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Features Planned</div>
            </div>
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Play className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <div className="text-3xl font-bold text-black">
                {roadmapItems.filter(item => item.status === 'in_progress').length}
              </div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">In Development</div>
            </div>
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Heart className="h-8 w-8 mx-auto mb-3 text-red-600" />
              <div className="text-3xl font-bold text-black">
                {roadmapItems.reduce((sum, item) => sum + item.votes, 0)}
              </div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Community Votes</div>
            </div>
            <div className="text-center py-6">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <div className="text-3xl font-bold text-black">
                {roadmapItems.reduce((sum, item) => sum + item.comments, 0)}
              </div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Community Comments</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 p-6 bg-gray-50 border-2 border-black">
            <h3 className="text-lg font-bold text-black mb-4">Filter Roadmap</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold text-black mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-2 text-sm font-medium rounded border-2 transition-all flex items-center gap-2 ${
                          selectedCategory === category.id
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-bold text-black mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.id}
                        onClick={() => setSelectedStatus(status.id)}
                        className={`px-3 py-2 text-sm font-medium rounded border-2 transition-all flex items-center gap-2 ${
                          selectedStatus === status.id
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quarter Filter */}
              <div>
                <label className="block text-sm font-bold text-black mb-2">Timeline</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black text-black font-medium"
                >
                  {quarters.map((quarter) => (
                    <option key={quarter.id} value={quarter.id}>
                      {quarter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Roadmap Items */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">
                Roadmap Features ({filteredItems.length})
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Most Voted
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  By Timeline
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredItems.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const categoryData = categories.find(c => c.id === item.category);
                const CategoryIcon = categoryData?.icon || Circle;

                return (
                  <Card key={item.id} className="border-2 border-gray-200 hover:border-blue-300 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 bg-gray-100`}>
                              <CategoryIcon className={`h-5 w-5 ${categoryData?.color}`} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(item.status)} border font-medium`}>
                                {item.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge className={`${getPriorityColor(item.priority)} border font-medium`}>
                                {item.priority.toUpperCase()} PRIORITY
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.quarter}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-xl text-black mb-2">{item.title}</CardTitle>
                          <CardDescription className="text-black font-medium text-base">
                            {item.description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(item.id)}
                          className="ml-4"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span className="font-medium">{item.votes} votes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-medium">{item.comments} comments</span>
                          </div>
                          {item.estimatedCompletion && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">Est. {item.estimatedCompletion}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Heart className="h-4 w-4 mr-1" />
                            Vote
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Discuss
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Tags */}
                          <div>
                            <h4 className="font-bold text-black mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Details */}
                          <div>
                            <h4 className="font-bold text-black mb-2">Implementation Details</h4>
                            <ul className="space-y-1">
                              {item.details.map((detail, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-black">
                                  <Circle className="h-3 w-3 mt-1 flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Contributors & Dependencies */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-bold text-black mb-2">Contributors</h4>
                              <div className="space-y-1">
                                {item.contributors.map((contributor, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm text-black">
                                    <Users className="h-3 w-3" />
                                    {contributor}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {item.dependencies && item.dependencies.length > 0 && (
                              <div>
                                <h4 className="font-bold text-black mb-2">Dependencies</h4>
                                <div className="space-y-1">
                                  {item.dependencies.map((dependency, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-black">
                                      <ArrowRight className="h-3 w-3" />
                                      {dependency}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Feature Suggestion Form */}
          {showSuggestionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-black">Suggest a Feature</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowSuggestionForm(false)}
                    >
                      ×
                    </Button>
                  </div>
                  <CardDescription className="text-black font-medium">
                    Have an idea that could help young people in your community? We'd love to hear it!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Feature Title</label>
                    <Input 
                      placeholder="Brief, descriptive title for your feature idea"
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Category</label>
                    <select className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500">
                      <option value="">Select a category</option>
                      {categories.slice(1).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Description</label>
                    <Textarea 
                      placeholder="Describe your feature idea in detail. What problem does it solve? How would it help young people?"
                      rows={4}
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Why is this important?</label>
                    <Textarea 
                      placeholder="Explain the impact this feature would have on your community or other young people"
                      rows={3}
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button className="bg-green-600 hover:bg-green-700 text-white flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Suggestion
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSuggestionForm(false)}
                      className="border-2 border-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Community Engagement CTA */}
          <div className="border-t-2 border-black pt-12">
            <div className="text-center py-12 bg-gray-50 border-2 border-black">
              <h2 className="text-3xl font-bold text-black mb-4">Shape the Future of JusticeHub</h2>
              <p className="text-lg text-black font-medium mb-8 max-w-2xl mx-auto">
                Your voice matters. Vote on features, suggest ideas, and help us build a platform 
                that truly serves young people across Australia.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  onClick={() => setShowSuggestionForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Suggest a Feature
                </Button>
                <Link href="/stories/new">
                  <Button variant="outline" size="lg" className="border-2 border-black hover:bg-gray-50">
                    <FileText className="h-5 w-5 mr-2" />
                    Share Your Story
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant="outline" size="lg" className="border-2 border-black hover:bg-gray-50">
                    <Users className="h-5 w-5 mr-2" />
                    Join Community
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}