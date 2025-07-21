'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Trophy, 
  Star, 
  Users, 
  Calendar,
  ArrowRight,
  Plus,
  MessageSquare,
  Heart,
  Zap,
  Award,
  Map,
  BookOpen,
  Camera,
  Settings,
  Bell,
  ChevronRight,
  TrendingUp,
  Rocket,
  Lightbulb
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  targetDate: string;
  category: 'education' | 'skills' | 'career' | 'personal';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'milestone' | 'skill' | 'connection' | 'impact';
  points: number;
}

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: 'mentorship' | 'workshop' | 'job' | 'volunteer';
  location: string;
  deadline: string;
  matched: boolean;
}

export default function YouthDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - would come from Supabase
  const userData = {
    name: "Alex",
    level: 8,
    totalPoints: 2450,
    joinDate: "2024-01-15",
    streakDays: 12,
    avatar: "A"
  };

  const goals: Goal[] = [
    {
      id: '1',
      title: 'Complete Welding Certificate',
      description: 'Get certified in basic welding through BackTrack program',
      progress: 75,
      targetDate: '2024-03-15',
      category: 'skills'
    },
    {
      id: '2',
      title: 'Build Portfolio Website',
      description: 'Create an online portfolio to showcase my projects',
      progress: 30,
      targetDate: '2024-04-01',
      category: 'career'
    },
    {
      id: '3',
      title: 'Connect with 3 Mentors',
      description: 'Find mentors in trades, tech, and creative fields',
      progress: 66,
      targetDate: '2024-02-28',
      category: 'personal'
    }
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Story Shared',
      description: 'Shared your journey on the platform',
      date: '2024-01-20',
      type: 'milestone',
      points: 100
    },
    {
      id: '2',
      title: 'Skills Assessment Completed',
      description: 'Discovered your top strengths and interests',
      date: '2024-01-18',
      type: 'skill',
      points: 150
    },
    {
      id: '3',
      title: 'Mentor Connection',
      description: 'Successfully connected with a mentor',
      date: '2024-01-25',
      type: 'connection',
      points: 200
    }
  ];

  const opportunities: Opportunity[] = [
    {
      id: '1',
      title: 'Welding Workshop Series',
      organization: 'BackTrack Youth Works',
      type: 'workshop',
      location: 'Armidale, NSW',
      deadline: '2024-02-15',
      matched: true
    },
    {
      id: '2',
      title: 'Tech Mentorship Program',
      organization: 'TechStart Youth',
      type: 'mentorship',
      location: 'Adelaide, SA',
      deadline: '2024-02-20',
      matched: false
    },
    {
      id: '3',
      title: 'Community Art Project',
      organization: 'Logan Youth Collective',
      type: 'volunteer',
      location: 'Logan, QLD',
      deadline: '2024-02-25',
      matched: true
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-blue-600';
      case 'skills': return 'bg-green-600';
      case 'career': return 'bg-purple-600';
      case 'personal': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'mentorship': return <Users className="h-4 w-4" />;
      case 'workshop': return <BookOpen className="h-4 w-4" />;
      case 'job': return <Target className="h-4 w-4" />;
      case 'volunteer': return <Heart className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="container-justice py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {userData.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-black">Hey {userData.name}! 👋</h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    Level {userData.level}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-blue-600" />
                    {userData.totalPoints} points
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-orange-600" />
                    {userData.streakDays} day streak
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
        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-2 border-black p-6 text-center hover:shadow-lg transition-all">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-black">{goals.length}</div>
            <div className="text-sm font-bold">Active Goals</div>
          </div>
          <div className="bg-white border-2 border-black p-6 text-center hover:shadow-lg transition-all">
            <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-black">{achievements.length}</div>
            <div className="text-sm font-bold">Achievements</div>
          </div>
          <div className="bg-white border-2 border-black p-6 text-center hover:shadow-lg transition-all">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-black">3</div>
            <div className="text-sm font-bold">Connections</div>
          </div>
          <div className="bg-white border-2 border-black p-6 text-center hover:shadow-lg transition-all">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-black">+{userData.streakDays}</div>
            <div className="text-sm font-bold">Growth Streak</div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Goals */}
            <section className="bg-white border-2 border-black p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Target className="h-6 w-6 text-blue-600" />
                  Your Goals
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all">
                  <Plus className="h-4 w-4" />
                  Add Goal
                </button>
              </div>
              
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="border border-gray-200 p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(goal.category)}`} />
                          <h3 className="font-bold">{goal.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                        <p className="text-xs text-gray-500">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{goal.progress}%</div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-600 rounded-full transition-all"
                            style={{width: `${goal.progress}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Achievements */}
            <section className="bg-white border-2 border-black p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  Recent Wins
                </h2>
                <Link href="/youth-scout/achievements" className="text-sm font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>
              
              <div className="space-y-3">
                {achievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 transition-all">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-500">{new Date(achievement.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">+{achievement.points}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Matched Opportunities */}
            <section className="bg-white border-2 border-black p-6">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-green-600" />
                Perfect Matches
              </h2>
              
              <div className="space-y-3">
                {opportunities.filter(op => op.matched).map((opportunity) => (
                  <div key={opportunity.id} className="border border-green-200 bg-green-50 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="text-green-600 mt-1">
                        {getOpportunityIcon(opportunity.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{opportunity.title}</h3>
                        <p className="text-xs text-gray-600">{opportunity.organization}</p>
                        <p className="text-xs text-gray-500">{opportunity.location}</p>
                      </div>
                    </div>
                    <button className="w-full bg-green-600 text-white text-sm font-bold py-2 hover:bg-green-700 transition-all">
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>
              
              <Link href="/youth-scout/opportunities" className="block text-center text-sm font-bold text-green-600 hover:underline mt-4">
                See All Opportunities
              </Link>
            </section>

            {/* Quick Actions */}
            <section className="bg-white border-2 border-black p-6">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-orange-600" />
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <Link href="/youth-scout/story/new" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-all border border-gray-200">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-sm">Share Your Story</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                
                <Link href="/youth-scout/skills-assessment" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-all border border-gray-200">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-sm">Skills Assessment</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                
                <Link href="/youth-scout/mentors" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-all border border-gray-200">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-sm">Find Mentors</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                
                <Link href="/gallery" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-all border border-gray-200">
                  <Camera className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-sm">Upload Content</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
              </div>
            </section>

            {/* Progress Summary */}
            <section className="bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-black p-6">
              <h2 className="text-lg font-black mb-4">This Week's Progress</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Goals Advanced</span>
                  <span className="font-bold">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">New Connections</span>
                  <span className="font-bold">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Skills Developed</span>
                  <span className="font-bold">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Points Earned</span>
                  <span className="font-bold text-green-600">+350</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white border border-gray-200">
                <p className="text-sm font-medium text-center">
                  You're on track! Keep going to reach your monthly goals.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}