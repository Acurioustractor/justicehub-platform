'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Headphones,
  Music,
  Mic,
  Radio,
  Star,
  TrendingUp,
  Target,
  Trophy,
  Play,
  Pause,
  Volume2,
  Heart,
  Users,
  Calendar,
  Award,
  Zap,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  Download,
  Share,
  BarChart3,
  PieChart,
  LineChart,
  Clock,
  DollarSign,
  MapPin,
  BookOpen,
  Camera,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface DreamTrackStats {
  totalTracks: number;
  totalPlays: number;
  totalLikes: number;
  totalShares: number;
  skillPoints: number;
  achievements: number;
  mentorConnections: number;
  opportunitiesUnlocked: number;
  streakDays: number;
  level: number;
  momentum: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  points: number;
}

interface Skill {
  name: string;
  level: number;
  maxLevel: number;
  category: string;
}

interface Track {
  id: string;
  title: string;
  description: string;
  duration: string;
  plays: number;
  likes: number;
  shares: number;
  createdDate: string;
  tags: string[];
  status: 'draft' | 'published' | 'featured';
}

export default function DreamTrackDashboard() {
  const [stats, setStats] = useState<DreamTrackStats>({
    totalTracks: 12,
    totalPlays: 2847,
    totalLikes: 459,
    totalShares: 127,
    skillPoints: 3420,
    achievements: 18,
    mentorConnections: 3,
    opportunitiesUnlocked: 7,
    streakDays: 23,
    level: 8,
    momentum: 85
  });

  const [activeTab, setActiveTab] = useState('studio');
  const [isPlaying, setIsPlaying] = useState(false);

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Track',
      description: 'Published your first story track',
      icon: '🎵',
      earned: true,
      earnedDate: '2024-12-01',
      points: 100
    },
    {
      id: '2',
      title: 'Rising Star',
      description: 'Reached 1000 total plays',
      icon: '⭐',
      earned: true,
      earnedDate: '2024-12-15',
      points: 250
    },
    {
      id: '3',
      title: 'Collaboration King',
      description: 'Connected with 3 mentors',
      icon: '🤝',
      earned: true,
      earnedDate: '2024-12-20',
      points: 200
    },
    {
      id: '4',
      title: 'Chart Topper',
      description: 'Get 100 likes on a single track',
      icon: '🔥',
      earned: false,
      points: 300
    },
    {
      id: '5',
      title: 'Platinum Producer',
      description: 'Create 20 tracks',
      icon: '💿',
      earned: false,
      points: 500
    }
  ];

  const skills: Skill[] = [
    { name: 'Storytelling', level: 7, maxLevel: 10, category: 'Creative' },
    { name: 'Communication', level: 6, maxLevel: 10, category: 'Social' },
    { name: 'Leadership', level: 4, maxLevel: 10, category: 'Social' },
    { name: 'Problem Solving', level: 8, maxLevel: 10, category: 'Technical' },
    { name: 'Cultural Knowledge', level: 9, maxLevel: 10, category: 'Cultural' },
    { name: 'Digital Skills', level: 5, maxLevel: 10, category: 'Technical' }
  ];

  const recentTracks: Track[] = [
    {
      id: '1',
      title: 'My Journey Home',
      description: 'A story about finding my way back to culture and family',
      duration: '4:32',
      plays: 234,
      likes: 47,
      shares: 12,
      createdDate: '2024-12-20',
      tags: ['Culture', 'Family', 'Growth'],
      status: 'published'
    },
    {
      id: '2',
      title: 'Breaking Barriers',
      description: 'Overcoming challenges in education and finding my voice',
      duration: '3:15',
      plays: 189,
      likes: 38,
      shares: 8,
      createdDate: '2024-12-18',
      tags: ['Education', 'Resilience', 'Achievement'],
      status: 'featured'
    },
    {
      id: '3',
      title: 'Community Dreams',
      description: 'Vision for giving back and creating change in my community',
      duration: '5:47',
      plays: 156,
      likes: 29,
      shares: 6,
      createdDate: '2024-12-15',
      tags: ['Community', 'Dreams', 'Change'],
      status: 'published'
    }
  ];

  const getSkillColor = (category: string) => {
    switch (category) {
      case 'Creative': return 'bg-purple-500';
      case 'Social': return 'bg-blue-500';
      case 'Technical': return 'bg-green-500';
      case 'Cultural': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'featured': return 'bg-yellow-500';
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getMomentumDescription = (momentum: number) => {
    if (momentum >= 80) return { text: '🔥 On Fire!', color: 'text-red-500' };
    if (momentum >= 60) return { text: '🚀 Rising Fast', color: 'text-orange-500' };
    if (momentum >= 40) return { text: '📈 Building Up', color: 'text-yellow-500' };
    if (momentum >= 20) return { text: '🌱 Growing Steady', color: 'text-green-500' };
    return { text: '💤 Need Boost', color: 'text-gray-500' };
  };

  const momentumDesc = getMomentumDescription(stats.momentum);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Headphones className="h-8 w-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">DreamTrack Studio</h1>
            </div>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              Level {stats.level} Producer
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-yellow-400 font-semibold">{stats.skillPoints} XP</p>
              <p className="text-white/60 text-sm">{momentumDesc.text}</p>
            </div>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <Plus className="mr-2 h-4 w-4" />
              New Track
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Tracks</p>
                  <p className="text-2xl font-bold">{stats.totalTracks}</p>
                </div>
                <Music className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Plays</p>
                  <p className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</p>
                </div>
                <Play className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Streak Days</p>
                  <p className="text-2xl font-bold">{stats.streakDays}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Momentum</p>
                  <p className="text-2xl font-bold">{stats.momentum}%</p>
                </div>
                <TrendingUp className={`h-8 w-8 ${momentumDesc.color.replace('text-', 'text-')}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="studio" className="data-[state=active]:bg-yellow-600">
              <Mic className="mr-2 h-4 w-4" />
              Studio
            </TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-yellow-600">
              <Target className="mr-2 h-4 w-4" />
              Skills Radar
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-yellow-600">
              <Trophy className="mr-2 h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-yellow-600">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="studio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Tracks */}
              <div className="lg:col-span-2">
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Radio className="mr-2 h-5 w-5 text-yellow-400" />
                      Recent Tracks
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Your latest story recordings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentTracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center space-x-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-white">{track.title}</h4>
                              <Badge 
                                className={`${getStatusColor(track.status)} text-white text-xs`}
                              >
                                {track.status}
                              </Badge>
                            </div>
                            <p className="text-white/60 text-sm">{track.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-white/40 text-xs">{track.duration}</span>
                              <span className="text-white/40 text-xs flex items-center">
                                <Play className="mr-1 h-3 w-3" />
                                {track.plays}
                              </span>
                              <span className="text-white/40 text-xs flex items-center">
                                <Heart className="mr-1 h-3 w-3" />
                                {track.likes}
                              </span>
                              <span className="text-white/40 text-xs flex items-center">
                                <Share className="mr-1 h-3 w-3" />
                                {track.shares}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white/60 hover:text-white">
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recording Tools */}
              <div className="space-y-6">
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Mic className="mr-2 h-5 w-5 text-red-400" />
                      Recording Studio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Camera className="mr-2 h-4 w-4" />
                      Video Story
                    </Button>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Edit className="mr-2 h-4 w-4" />
                      Written Story
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-yellow-400" />
                      Daily Challenge
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm mb-4">
                      "Share a moment when you helped someone in your community"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-400 text-sm">+150 XP</span>
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Skills Radar</CardTitle>
                  <CardDescription className="text-white/60">
                    Track your growth across different areas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{skill.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getSkillColor(skill.category)} text-white text-xs`}>
                            {skill.category}
                          </Badge>
                          <span className="text-white/60 text-sm">
                            {skill.level}/{skill.maxLevel}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(skill.level / skill.maxLevel) * 100} 
                        className="bg-white/10"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Skill Development Plan</CardTitle>
                  <CardDescription className="text-white/60">
                    Recommended actions to level up
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-2">Next: Leadership +1</h4>
                    <p className="text-white/80 text-sm mb-3">
                      Complete a mentorship session and share your experience
                    </p>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Start Challenge
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">Available: Digital Skills +1</h4>
                    <p className="text-white/80 text-sm mb-3">
                      Create a multimedia story using our video tools
                    </p>
                    <Button size="sm" variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earned Achievements */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
                    Earned Achievements
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {achievements.filter(a => a.earned).length} unlocked
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.filter(a => a.earned).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <h4 className="font-semibold text-yellow-400">{achievement.title}</h4>
                          <p className="text-white/80 text-sm">{achievement.description}</p>
                          {achievement.earnedDate && (
                            <p className="text-white/40 text-xs">
                              Earned {format(new Date(achievement.earnedDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-yellow-600 text-white">
                        +{achievement.points} XP
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Available Achievements */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="mr-2 h-5 w-5 text-gray-400" />
                    Available Achievements
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {achievements.filter(a => !a.earned).length} to unlock
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.filter(a => !a.earned).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl opacity-50">{achievement.icon}</span>
                        <div>
                          <h4 className="font-semibold text-white/60">{achievement.title}</h4>
                          <p className="text-white/50 text-sm">{achievement.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-white/60">
                        +{achievement.points} XP
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Track Performance</CardTitle>
                  <CardDescription className="text-white/60">
                    Your top performing stories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTracks.map((track, index) => (
                      <div key={track.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-yellow-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="text-white font-medium">{track.title}</p>
                            <p className="text-white/60 text-sm">{track.plays} plays</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{track.likes} likes</p>
                          <p className="text-white/60 text-sm">{track.shares} shares</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Growth Metrics</CardTitle>
                  <CardDescription className="text-white/60">
                    Your journey over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Weekly Goal Progress</span>
                        <span className="text-white/60">4/5 tracks</span>
                      </div>
                      <Progress value={80} className="bg-white/10" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Skill Development</span>
                        <span className="text-white/60">6.5/10 avg</span>
                      </div>
                      <Progress value={65} className="bg-white/10" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Community Engagement</span>
                        <span className="text-white/60">85%</span>
                      </div>
                      <Progress value={85} className="bg-white/10" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Impact Summary</CardTitle>
                <CardDescription className="text-white/60">
                  Your story is inspiring others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats.totalPlays.toLocaleString()}</p>
                    <p className="text-white/60 text-sm">Total Listens</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats.totalLikes}</p>
                    <p className="text-white/60 text-sm">Hearts Received</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats.mentorConnections}</p>
                    <p className="text-white/60 text-sm">Mentor Connections</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats.opportunitiesUnlocked}</p>
                    <p className="text-white/60 text-sm">Opportunities Unlocked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-white/10 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <BookOpen className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/youth">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Switch to Classic Dashboard
                </Button>
              </Link>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 