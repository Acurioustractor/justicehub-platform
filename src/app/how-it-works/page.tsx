'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Target,
  DollarSign,
  Shield,
  Lightbulb,
  Heart,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Play,
  BookOpen,
  Zap,
  Award
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function HowItWorksPage() {
  const platforms = [
    {
      title: 'Service Finder',
      icon: Search,
      color: 'blue',
      description: 'AI-powered directory of all support services',
      features: [
        'Comprehensive database of youth services across Australia',
        'AI-scraped from government and community sources',
        'Real-time updates and verification',
        'Search by location, category, and need'
      ],
      cta: 'Find Services',
      link: '/services'
    },
    {
      title: 'Grassroots Programs',
      icon: Target,
      color: 'green',
      description: 'Curated excellence from community programs',
      features: [
        'Editorially reviewed program deep-dives',
        'Behind-the-scenes methodology insights',
        'Verified impact data and success stories',
        'Money trail transparency tracking'
      ],
      cta: 'Explore Programs',
      link: '/community-programs'
    },
    {
      title: 'Youth Scout',
      icon: Users,
      color: 'purple',
      description: 'Personalized journey for young people',
      features: [
        'Track your goals and celebrate progress',
        'Connect with mentors who understand you',
        'Discover opportunities matched to your strengths',
        'Build a portfolio of achievements'
      ],
      cta: 'Start Journey',
      link: '/youth-scout'
    },
    {
      title: 'Money Trail',
      icon: DollarSign,
      color: 'orange',
      description: 'Financial transparency & accountability',
      features: [
        'Track government spending on youth justice',
        'See which programs deliver results',
        'Compare cost-effectiveness of interventions',
        'Evidence-based funding recommendations'
      ],
      cta: 'Follow Money',
      link: '/transparency'
    }
  ];

  const userTypes = [
    {
      title: 'For Young People',
      icon: Heart,
      description: 'No lectures. No judgment. Just tools that work.',
      benefits: [
        'Find services and support when you need it',
        'Share your story and inspire others',
        'Connect with mentors and opportunities',
        'Track your journey and celebrate wins'
      ],
      cta: 'Get Started',
      link: '/youth-scout'
    },
    {
      title: 'For Organizations',
      icon: Award,
      description: 'Amplify your impact and connect with talent.',
      benefits: [
        'Showcase your program to reach more youth',
        'Access transparent funding data',
        'Connect with emerging talent',
        'Demonstrate your outcomes with data'
      ],
      cta: 'Partner With Us',
      link: '/partners'
    },
    {
      title: 'For Decision Makers',
      icon: TrendingUp,
      description: 'Evidence-based insights for systemic change.',
      benefits: [
        'See what actually works in youth justice',
        'Compare cost-effectiveness of programs',
        'Access community-driven solutions',
        'Make informed funding decisions'
      ],
      cta: 'View Data',
      link: '/transparency'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="section-padding border-b-2 border-black bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50">
          <div className="container-justice text-center">
            <div className="inline-block bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-wider mb-6">
              Platform Overview
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6">
              HOW JUSTICEHUB WORKS
            </h1>

            <p className="text-xl md:text-2xl max-w-4xl mx-auto mb-8 text-gray-800 leading-relaxed">
              We're infrastructure for revolution. Connecting proven solutions with the people who need them,
              powered by transparency and community wisdom.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services" className="cta-primary">
                Start Exploring
              </Link>
              <Link href="/about" className="cta-secondary">
                Our Mission
              </Link>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">The Problem We're Solving</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-red-50 border-l-4 border-red-600 p-6">
                  <div className="text-4xl font-black text-red-600 mb-2">84.5%</div>
                  <p className="font-bold mb-2">Detention Failure Rate</p>
                  <p className="text-sm text-gray-700">Kids reoffend after detention</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
                  <div className="text-4xl font-black text-blue-600 mb-2">78%</div>
                  <p className="font-bold mb-2">Community Success</p>
                  <p className="text-sm text-gray-700">Youth succeed in community programs</p>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-600 p-6">
                  <div className="text-4xl font-black text-orange-600 mb-2">$1.1M</div>
                  <p className="font-bold mb-2">Annual Cost Per Child</p>
                  <p className="text-sm text-gray-700">Detention costs vs $58K for programs</p>
                </div>
              </div>

              <div className="bg-black text-white p-8 text-center">
                <p className="text-2xl font-bold mb-4">
                  The solutions exist. They're just invisible, underfunded, and disconnected.
                </p>
                <p className="text-lg">
                  That's what we're here to fix.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Platforms */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Four Interconnected Platforms</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Each platform serves a specific purpose, but together they create a complete ecosystem
                for youth justice transformation.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {platforms.map((platform, index) => {
                const Icon = platform.icon;
                return (
                  <div key={index} className="bg-white border-2 border-black p-8">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${platform.color}-800 text-white font-bold text-sm uppercase tracking-wider mb-4`}>
                      <Icon className="h-4 w-4" />
                      {platform.title}
                    </div>

                    <p className="text-lg font-medium mb-6">{platform.description}</p>

                    <ul className="space-y-3 mb-6">
                      {platform.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={platform.link}
                      className="inline-flex items-center gap-2 font-bold hover:underline"
                    >
                      {platform.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works for Different Users */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Built for Everyone in the Ecosystem</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Whether you're a young person seeking support, an organization creating impact,
                or a decision maker allocating resources—JusticeHub has tools for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {userTypes.map((userType, index) => {
                const Icon = userType.icon;
                return (
                  <div key={index} className="bg-white border-2 border-black p-6">
                    <Icon className="h-12 w-12 text-blue-800 mb-4" />
                    <h3 className="text-xl font-bold mb-3">{userType.title}</h3>
                    <p className="text-gray-700 mb-6 font-medium">{userType.description}</p>

                    <ul className="space-y-2 mb-6">
                      {userType.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-800 font-bold">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={userType.link}
                      className="inline-flex items-center gap-2 font-bold text-blue-800 hover:underline"
                    >
                      {userType.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How We're Different */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">What Makes Us Different</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-black p-6">
                  <Shield className="h-8 w-8 text-blue-800 mb-3" />
                  <h3 className="font-bold mb-2">Radical Transparency</h3>
                  <p className="text-sm text-gray-700">
                    Every dollar tracked. Every outcome measured. No hiding failure,
                    no inflating success. Just the truth.
                  </p>
                </div>

                <div className="bg-white border-2 border-black p-6">
                  <Users className="h-8 w-8 text-blue-800 mb-3" />
                  <h3 className="font-bold mb-2">Community-Led</h3>
                  <p className="text-sm text-gray-700">
                    Built by and for people with lived experience. Youth voices drive
                    every decision we make.
                  </p>
                </div>

                <div className="bg-white border-2 border-black p-6">
                  <Zap className="h-8 w-8 text-blue-800 mb-3" />
                  <h3 className="font-bold mb-2">AI-Powered Discovery</h3>
                  <p className="text-sm text-gray-700">
                    We use AI to find services buried in government databases,
                    making them accessible to everyone.
                  </p>
                </div>

                <div className="bg-white border-2 border-black p-6">
                  <Lightbulb className="h-8 w-8 text-blue-800 mb-3" />
                  <h3 className="font-bold mb-2">Evidence-Based</h3>
                  <p className="text-sm text-gray-700">
                    We amplify what works, not what sounds good. Data-driven insights
                    guide every recommendation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Started Steps */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
              <p className="text-lg max-w-2xl mx-auto text-white">
                Three simple steps to start making a difference today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">
                  1
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Choose Your Path</h3>
                <p className="text-white mb-4">
                  Are you a young person, organization, or decision maker? Select the platform that fits your needs.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">
                  2
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Explore & Connect</h3>
                <p className="text-white mb-4">
                  Search services, read stories, track data, or connect with programs and people who can help.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">
                  3
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Take Action</h3>
                <p className="text-white mb-4">
                  Share your story, access support, partner with programs, or use data to drive change.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/services" className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100">
                  Find Help Now
                </Link>
                <Link href="/stories/new" className="inline-block border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                  Share Your Story
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="section-padding border-t-2 border-black">
          <div className="container-justice">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
              <p className="text-gray-700">
                Check out our support center or get in touch
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/support" className="cta-secondary">
                Visit Help Center
              </Link>
              <Link href="/contact" className="cta-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}