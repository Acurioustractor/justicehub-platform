'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Award,
  Calendar,
  ArrowRight,
  Plus,
  MessageSquare,
  Heart,
  Building2,
  Map,
  BookOpen,
  Settings,
  Bell,
  ChevronRight,
  Eye,
  UserPlus,
  Briefcase,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';

interface YouthProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  interests: string[];
  goals: string[];
  matchScore: number;
  status: 'new' | 'contacted' | 'connected' | 'mentoring';
}

interface Program {
  id: string;
  name: string;
  description: string;
  participants: number;
  successRate: number;
  nextIntake: string;
  status: 'active' | 'planning' | 'completed';
}

interface Metric {
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
}

export default function TalentScoutDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - would come from Supabase
  const organizationData = {
    name: "BackTrack Youth Works",
    type: "Community Program",
    location: "Armidale, NSW",
    established: "2009",
    totalYouthConnected: 847,
    activePrograms: 5,
    successRate: 87
  };

  const metrics: Metric[] = [
    { label: 'Youth Connected This Month', value: 23, change: '+12%', positive: true },
    { label: 'Program Completion Rate', value: '89%', change: '+5%', positive: true },
    { label: 'Mentor Engagement', value: '94%', change: '+2%', positive: true },
    { label: 'Community Impact Score', value: 95, change: '+8%', positive: true }
  ];

  const youthProfiles: YouthProfile[] = [
    {
      id: '1',
      name: 'Marcus T.',
      age: 18,
      location: 'Armidale, NSW',
      interests: ['Welding', 'Mechanics', 'Animal Care'],
      goals: ['Trade Certification', 'Stable Employment', 'Mentoring Others'],
      matchScore: 95,
      status: 'new'
    },
    {
      id: '2',
      name: 'Aisha P.',
      age: 17,
      location: 'Logan, QLD',
      interests: ['Social Justice', 'Community Organizing', 'Public Speaking'],
      goals: ['University Study', 'Youth Advocacy', 'Leadership Role'],
      matchScore: 88,
      status: 'contacted'
    },
    {
      id: '3',
      name: 'Jayden W.',
      age: 19,
      location: 'Alice Springs, NT',
      interests: ['Cultural Heritage', 'Traditional Arts', 'Healing Practices'],
      goals: ['Cultural Leadership', 'Healing Certification', 'Elder Mentorship'],
      matchScore: 92,
      status: 'connected'
    }
  ];

  const programs: Program[] = [
    {
      id: '1',
      name: 'Welding & Animal Therapy Program',
      description: 'Intensive 12-week program combining vocational training with animal therapy',
      participants: 15,
      successRate: 87,
      nextIntake: '2024-03-01',
      status: 'active'
    },
    {
      id: '2',
      name: 'Digital Skills Workshop',
      description: '6-week technology training for neurodivergent youth',
      participants: 8,
      successRate: 73,
      nextIntake: '2024-02-15',
      status: 'planning'
    },
    {
      id: '3',
      name: 'Community Leadership Intensive',
      description: '3-month program developing youth advocacy and organizing skills',
      participants: 12,
      successRate: 92,
      nextIntake: '2024-04-01',
      status: 'active'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'connected': return 'bg-green-100 text-green-800';
      case 'mentoring': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgramStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="container-justice py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                BT
              </div>
              <div>
                <h1 className="text-2xl font-black">{organizationData.name}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    {organizationData.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Map className="h-4 w-4 text-blue-600" />
                    {organizationData.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Since {organizationData.established}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Settings className="h-5 w-5" />
              </button>
              <Link href="/youth-scout" className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-all font-bold">
                Exit Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container-justice py-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white border-2 border-black p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-black">{metric.value}</div>
                <div className={`text-sm font-bold ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </div>
              </div>
              <div className="text-sm font-bold text-gray-700">{metric.label}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Matched Youth Profiles */}
            <section className="bg-white border-2 border-black p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Users className="h-6 w-6 text-orange-600" />
                  High-Potential Youth Matches
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all">
                  <Eye className="h-4 w-4" />
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {youthProfiles.map((youth) => (
                  <div key={youth.id} className="border border-gray-200 p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{youth.name}</h3>
                          <span className="text-sm text-gray-600">Age {youth.age}</span>
                          <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(youth.status)}`}>
                            {youth.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{youth.location}</p>
                        
                        <div className="mb-3">
                          <p className="text-xs font-bold text-gray-700 mb-1">INTERESTS:</p>
                          <div className="flex flex-wrap gap-1">
                            {youth.interests.map(interest => (
                              <span key={interest} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1">GOALS:</p>
                          <div className="flex flex-wrap gap-1">
                            {youth.goals.map(goal => (
                              <span key={goal} className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium">
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-orange-600 mb-1">{youth.matchScore}%</div>
                        <div className="text-xs text-gray-600 mb-3">Match Score</div>
                        <button className="px-4 py-2 bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-all">
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active Programs */}
            <section className="bg-white border-2 border-black p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  Program Portfolio
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all">
                  <Plus className="h-4 w-4" />
                  New Program
                </button>
              </div>
              
              <div className="space-y-4">
                {programs.map((program) => (
                  <div key={program.id} className="border border-gray-200 p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{program.name}</h3>
                          <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${getProgramStatusColor(program.status)}`}>
                            {program.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-bold text-blue-600">{program.participants}</div>
                            <div className="text-gray-600">Participants</div>
                          </div>
                          <div>
                            <div className="font-bold text-green-600">{program.successRate}%</div>
                            <div className="text-gray-600">Success Rate</div>
                          </div>
                          <div>
                            <div className="font-bold text-orange-600">{new Date(program.nextIntake).toLocaleDateString()}</div>
                            <div className="text-gray-600">Next Intake</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <button className="px-4 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-sm font-bold transition-all">
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <section className="bg-white border-2 border-black p-6">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 transition-all border border-orange-200">
                  <UserPlus className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-sm">Invite Youth</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-all border border-gray-200">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-sm">Post Opportunity</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-all border border-gray-200">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-sm">View Analytics</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </button>
                
                <Link href="/gallery" className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-all border border-gray-200">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-sm">Share Success Story</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white border-2 border-black p-6">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recent Activity
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Marcus T. completed welding module</p>
                    <p className="text-xs text-gray-600">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200">
                  <UserPlus className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New youth profile matched (88% compatibility)</p>
                    <p className="text-xs text-gray-600">1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200">
                  <Award className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Program success rate increased to 89%</p>
                    <p className="text-xs text-gray-600">3 days ago</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Impact Summary */}
            <section className="bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-black p-6">
              <h2 className="text-lg font-black mb-4">This Month's Impact</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Youth Connected</span>
                  <span className="font-bold text-orange-600">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Programs Completed</span>
                  <span className="font-bold text-blue-600">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Success Stories</span>
                  <span className="font-bold text-green-600">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Community Impact</span>
                  <span className="font-bold text-purple-600">+12%</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white border border-gray-200">
                <p className="text-sm font-medium text-center">
                  Outstanding month! You're making real difference in young lives.
                </p>
              </div>
            </section>

            {/* Organization Profile Link */}
            <section className="bg-white border-2 border-black p-6">
              <h2 className="text-lg font-black mb-4">Organization Profile</h2>
              <p className="text-sm text-gray-600 mb-4">
                Your organization profile is featured in Community Programs. 
                Keep it updated to attract the right youth and mentors.
              </p>
              <Link 
                href="/community-programs/1"
                className="block w-full bg-blue-600 text-white text-center py-3 font-bold hover:bg-blue-700 transition-all"
              >
                View Public Profile
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}