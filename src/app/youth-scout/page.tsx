'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Rocket, 
  Target, 
  Star, 
  Users, 
  ArrowRight,
  UserPlus,
  Building2,
  Zap,
  Award,
  Heart,
  Lightbulb,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function YouthScoutLandingPage() {
  const [adminMode, setAdminMode] = useState(false);

  // Toggle admin mode for easy preview
  const toggleAdminMode = () => {
    setAdminMode(!adminMode);
  };

  const youthFeatures = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Track Your Journey",
      description: "Set goals, track progress, and celebrate wins on your path to success"
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: "Discover Your Strengths", 
      description: "Find out what you're naturally good at and build on those superpowers"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Connect with Mentors",
      description: "Get matched with people who've been where you are and can guide your next steps"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Earn Recognition",
      description: "Build a portfolio of achievements that showcases your growth and potential"
    }
  ];

  const talentScoutFeatures = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "Discover Emerging Talent",
      description: "Find young people with untapped potential and unique perspectives"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Make Real Impact",
      description: "Be part of transforming lives and building stronger communities"
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Fresh Perspectives",
      description: "Gain insights from youth voices that can transform your organization"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Track Meaningful Outcomes",
      description: "See the real impact of your mentorship and support programs"
    }
  ];

  const successStories = [
    {
      name: "Marcus",
      age: 19,
      story: "From sleeping rough to qualified welder and mentor",
      program: "BackTrack Youth Works",
      achievement: "Now mentoring other youth and employed full-time"
    },
    {
      name: "Aisha", 
      age: 17,
      story: "Found her voice through youth organizing and advocacy",
      program: "Logan Youth Collective",
      achievement: "Leading community campaigns and studying social work"
    },
    {
      name: "Jayden",
      age: 18,
      story: "Reconnected with culture and healed from trauma",
      program: "Healing Circles Program", 
      achievement: "Now helping facilitate healing circles for other youth"
    }
  ];

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Admin Mode Toggle (hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={toggleAdminMode}
            className={`px-3 py-1 text-xs font-bold rounded ${
              adminMode 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-300 text-black'
            }`}
          >
            {adminMode ? 'ADMIN MODE ON' : 'ADMIN MODE OFF'}
          </button>
        </div>
      )}

      <main>
        {/* Hero Section - Youth-Focused Design */}
        <section className="header-offset pb-20 bg-gradient-to-br from-purple-100 via-blue-50 to-orange-50 border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold text-sm uppercase tracking-wider mb-6">
                <Rocket className="h-4 w-4" />
                Your Journey Starts Here
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-blue-800 via-purple-800 to-orange-600 bg-clip-text text-transparent">
                YOUTH SCOUT
              </h1>
              
              <p className="text-xl md:text-2xl max-w-4xl mx-auto mb-8 leading-relaxed text-gray-800">
                Your personalized platform for growth, connection, and success. 
                Track your journey, discover opportunities, and connect with people who believe in your potential.
              </p>

              <div className="max-w-2xl mx-auto mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 border-2 border-black">
                    <div className="text-3xl font-black text-blue-800">2,400+</div>
                    <div className="text-sm font-bold">Young People Connected</div>
                  </div>
                  <div className="bg-white p-4 border-2 border-black">
                    <div className="text-3xl font-black text-purple-800">850+</div>
                    <div className="text-sm font-bold">Success Stories</div>
                  </div>
                  <div className="bg-white p-4 border-2 border-black">
                    <div className="text-3xl font-black text-orange-600">95%</div>
                    <div className="text-sm font-bold">Achieve Their Goals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Login Options */}
        <section className="py-20 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold text-center mb-12">CHOOSE YOUR PATH</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Youth Path */}
              <div className="group">
                <div className="border-4 border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-800 text-white rounded-full mb-6">
                      <UserPlus className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 text-blue-800">I'M A YOUNG PERSON</h3>
                    <p className="text-lg mb-6">
                      Ready to level up your life? Track your journey, discover opportunities, 
                      and connect with mentors who've got your back.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {youthFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="text-blue-800 mt-1">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">{feature.title}</h4>
                          <p className="text-sm text-gray-700">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Link 
                      href={adminMode ? "/youth-scout/dashboard" : "/youth-scout/youth-login"}
                      className="block w-full bg-blue-800 hover:bg-blue-700 text-white text-center py-4 px-6 font-bold text-lg transition-all transform hover:scale-105"
                    >
                      {adminMode ? "ENTER YOUTH DASHBOARD" : "GET STARTED"}
                      <ArrowRight className="inline h-5 w-5 ml-2" />
                    </Link>
                    
                    <Link 
                      href="/youth-scout/youth-preview"
                      className="block w-full border-2 border-blue-800 text-blue-800 hover:bg-blue-800 hover:text-white text-center py-3 px-6 font-bold transition-all"
                    >
                      Take a Quick Tour
                    </Link>
                  </div>
                </div>
              </div>

              {/* Talent Scout Path */}
              <div className="group">
                <div className="border-4 border-orange-600 bg-gradient-to-br from-orange-50 to-yellow-50 p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 text-white rounded-full mb-6">
                      <Building2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 text-orange-600">I'M A TALENT SCOUT</h3>
                    <p className="text-lg mb-6">
                      Connect with emerging talent, make real impact, and help build 
                      the next generation of leaders and innovators.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {talentScoutFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="text-orange-600 mt-1">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">{feature.title}</h4>
                          <p className="text-sm text-gray-700">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Link 
                      href={adminMode ? "/youth-scout/talent-dashboard" : "/youth-scout/talent-login"}
                      className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-4 px-6 font-bold text-lg transition-all transform hover:scale-105"
                    >
                      {adminMode ? "ENTER TALENT DASHBOARD" : "JOIN AS SCOUT"}
                      <ArrowRight className="inline h-5 w-5 ml-2" />
                    </Link>
                    
                    <Link 
                      href="/youth-scout/talent-preview"
                      className="block w-full border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white text-center py-3 px-6 font-bold transition-all"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 bg-gray-50 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold text-center mb-4">REAL STORIES, REAL IMPACT</h2>
            <p className="text-center text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
              See how Youth Scout is helping young people across Australia transform their lives and build their futures.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {successStories.map((story, index) => (
                <div key={index} className="bg-white border-2 border-black p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {story.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{story.name}</h3>
                      <p className="text-sm text-gray-600">Age {story.age}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-4 font-medium">{story.story}</p>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-blue-800 font-bold mb-1">{story.program}</p>
                    <p className="text-sm text-gray-600">{story.achievement}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link href="/stories" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 font-bold hover:bg-gray-800 transition-all">
                Read More Success Stories
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Story Submission */}
        <section className="py-20 border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">GOT A STORY TO SHARE?</h2>
              <p className="text-xl mb-8 text-gray-700">
                Your journey matters. Share your story to inspire others and help build a stronger community.
                No login required - just your authentic voice.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link 
                  href="/stories/new"
                  className="group border-2 border-blue-800 bg-blue-50 p-6 hover:bg-blue-800 hover:text-white transition-all"
                  style={{textDecoration: 'none'}}
                >
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="font-bold text-lg mb-2">Share Your Journey</h3>
                  <p className="text-sm group-hover:text-white">Tell your story of growth, challenge, or success</p>
                </Link>
                
                <Link 
                  href="/stories/new?type=program"
                  className="group border-2 border-orange-600 bg-orange-50 p-6 hover:bg-orange-600 hover:text-white transition-all"
                  style={{textDecoration: 'none'}}
                >
                  <div className="text-4xl mb-4">🌟</div>
                  <h3 className="font-bold text-lg mb-2">Highlight a Program</h3>
                  <p className="text-sm group-hover:text-white">Showcase an organization making real difference</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Overview */}
        <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="container-justice">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6">WHY YOUTH SCOUT WORKS</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                We believe every young person has unique potential. Our platform connects that potential 
                with real opportunities and genuine support.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-800 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-3">Human-Centered</h3>
                <p className="text-gray-700">Built by and for young people who understand the real challenges and opportunities</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-800 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-3">Goal-Focused</h3>
                <p className="text-gray-700">Clear pathways and practical steps that lead to real outcomes and achievements</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-3">Community-Driven</h3>
                <p className="text-gray-700">Connected to real programs, mentors, and opportunities in your local area</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}