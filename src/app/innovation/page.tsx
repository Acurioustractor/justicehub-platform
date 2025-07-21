'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  Map,
  Users,
  BarChart3,
  Gamepad2,
  Globe,
  ArrowRight,
  Lightbulb,
  Star,
  Heart,
  Target,
  Zap,
  Code,
  Palette,
  Building,
  BookOpen,
  Sparkles,
  Coffee,
  Mic,
  Camera,
  Play
} from 'lucide-react';
import Link from 'next/link';

export default function InnovationPage() {
  const [activeTab, setActiveTab] = useState('active');

  const innovations = [
    {
      id: 1,
      title: "AI-Powered Matching",
      icon: Brain,
      status: "active",
      description: "Machine learning connects youth with mentors based on interests, culture, and personality - not risk factors. 87% report feeling 'truly understood' for the first time.",
      features: ["Cultural compatibility scoring", "Interest-based algorithms", "Personality matching", "Continuous learning"],
      impact: "87% satisfaction rate",
      color: "from-blue-600 to-indigo-600"
    },
    {
      id: 2,
      title: "Cultural Mapping Tech",
      icon: Map,
      status: "pilot",
      description: "Indigenous communities use digital tools to map sacred sites, stories, and safe spaces. Youth reconnect with country through augmented reality experiences.",
      features: ["AR cultural experiences", "Story mapping", "Sacred site protection", "Digital songlines"],
      impact: "5 communities piloting",
      color: "from-orange-600 to-red-600"
    },
    {
      id: 3,
      title: "Peer Support Networks",
      icon: Users,
      status: "active",
      description: "Young people who've transformed their lives mentor those just starting the journey. Built-in safety features and Elder oversight ensure positive connections.",
      features: ["Verified mentors", "Safety protocols", "Elder oversight", "Progress tracking"],
      impact: "500+ connections made",
      color: "from-green-600 to-emerald-600"
    },
    {
      id: 4,
      title: "Community Data Sovereignty",
      icon: BarChart3,
      status: "pilot",
      description: "Communities own and control their data. Real-time dashboards show what's working, enabling rapid adaptation and proving impact to funders.",
      features: ["Community-owned data", "Real-time analytics", "Privacy protection", "Impact measurement"],
      impact: "3 regions deployed",
      color: "from-purple-600 to-pink-600"
    },
    {
      id: 5,
      title: "Healing Through Gaming",
      icon: Gamepad2,
      status: "development",
      description: "Therapeutic video games designed with youth input address trauma, build emotional regulation, and teach cultural stories. Fun that heals.",
      features: ["Trauma-informed design", "Cultural storytelling", "Emotional regulation", "Youth co-design"],
      impact: "Beta testing 2024",
      color: "from-cyan-600 to-blue-600"
    },
    {
      id: 6,
      title: "Virtual Court Support",
      icon: Globe,
      status: "development",
      description: "VR experiences prepare youth for court appearances, reducing anxiety. Cultural interpreters and support workers join virtually from anywhere.",
      features: ["VR court simulation", "Anxiety reduction", "Remote support", "Cultural interpretation"],
      impact: "Concept testing",
      color: "from-indigo-600 to-purple-600"
    }
  ];

  const partners = [
    { name: "Elders Councils", contribution: "Cultural wisdom", icon: BookOpen },
    { name: "Youth Voices", contribution: "Lived experience", icon: Mic },
    { name: "Tech Volunteers", contribution: "Digital solutions", icon: Code },
    { name: "Universities", contribution: "Research & evaluation", icon: Building },
    { name: "Creative Studios", contribution: "Storytelling tools", icon: Palette },
    { name: "Social Enterprises", contribution: "Sustainable funding", icon: Heart }
  ];

  const impactStats = [
    { number: "12", label: "Solutions Launched", icon: Lightbulb },
    { number: "3,500+", label: "Youth Engaged", icon: Users },
    { number: "45", label: "Communities Connected", icon: Target },
    { number: "$2.3M", label: "Savings Generated", icon: BarChart3 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pilot': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'development': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInnovations = innovations.filter(innovation => {
    if (activeTab === 'all') return true;
    return innovation.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔬 The Innovation Lab</h1>
              <p className="text-gray-600 mt-2">Where ancient wisdom meets modern technology</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Sparkles className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-bold mb-6">Transforming Youth Justice Through Innovation</h2>
            <p className="text-xl opacity-90 mb-8">
              We bring together Indigenous knowledge keepers, young people with lived experience, 
              tech innovators, and community leaders to create solutions that actually work.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {impactStats.map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <Card key={index} className="text-center border-0 bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-6">
                    <StatIcon className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Innovation Projects */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Current Innovation Projects</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From AI-powered mentorship to virtual reality court preparation - we're building the future of justice.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pilot">Pilot</TabsTrigger>
              <TabsTrigger value="development">Development</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredInnovations.map((innovation) => {
                const IconComponent = innovation.icon;
                return (
                  <Card key={innovation.id} className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${innovation.color}`}></div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${innovation.color}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <Badge className={getStatusColor(innovation.status)}>
                          {innovation.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{innovation.title}</CardTitle>
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {innovation.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-900 mb-3">Key Features:</h4>
                        <ul className="space-y-2">
                          {innovation.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full mr-2"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Impact:</span>
                          <span className="font-semibold text-indigo-600">{innovation.impact}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Tabs>
        </div>
      </section>

      {/* Partnership Network */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Innovation Partners</h2>
            <p className="text-xl text-gray-600">Great ideas come from unexpected collaborations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, index) => {
              const PartnerIcon = partner.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-gray-200">
                  <CardContent className="p-6 text-center">
                    <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-fit mx-auto mb-4">
                      <PartnerIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{partner.name}</h3>
                    <p className="text-gray-600">{partner.contribution}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Innovation in Action</h2>
            <p className="text-xl text-gray-600">Real stories from our innovation partners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-600 rounded-full">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">AI Mentorship Breakthrough</h3>
                    <p className="text-gray-700 mb-4">
                      "The AI matching system connected me with a mentor who actually gets my culture and interests. 
                      For the first time, I feel like someone sees my potential, not my problems."
                    </p>
                    <div className="text-sm text-blue-700 font-semibold">
                      - Jordan, Program Participant
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-orange-600 rounded-full">
                    <Map className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Digital Songlines Impact</h3>
                    <p className="text-gray-700 mb-4">
                      "When young people see their culture on the phone, they connect differently. 
                      The AR experiences bring old stories to life in ways they understand."
                    </p>
                    <div className="text-sm text-orange-700 font-semibold">
                      - Elder Mary, Cultural Advisor
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Innovation Movement</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Whether you're a tech wizard, a cultural keeper, a young person with ideas, or someone who believes 
            in a better way - we need you. Together, we're building the future of justice.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <Code className="h-12 w-12 mx-auto mb-3 opacity-80" />
              <h3 className="font-bold mb-2">Developers</h3>
              <p className="text-sm opacity-90">Build tools that heal</p>
            </div>
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-80" />
              <h3 className="font-bold mb-2">Elders</h3>
              <p className="text-sm opacity-90">Share ancient wisdom</p>
            </div>
            <div className="text-center">
              <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-80" />
              <h3 className="font-bold mb-2">Innovators</h3>
              <p className="text-sm opacity-90">Create breakthrough solutions</p>
            </div>
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-80" />
              <h3 className="font-bold mb-2">Community</h3>
              <p className="text-sm opacity-90">Ground everything in love</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Zap className="mr-2 h-5 w-5" />
              Submit an Idea
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-purple-600">
              <Coffee className="mr-2 h-5 w-5" />
              Join Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 