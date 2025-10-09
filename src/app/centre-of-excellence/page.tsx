'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Award,
  Calendar,
  TrendingUp,
  Globe,
  Lightbulb,
  FileText,
  GraduationCap,
  Target,
  ArrowRight,
  ExternalLink,
  Map
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function CentreOfExcellencePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Hero Section */}
        <section className="section-padding bg-gradient-to-br from-yellow-50 via-white to-blue-50 border-b-2 border-black">
          <div className="container-justice text-center">
            <div className="inline-block px-4 py-2 bg-yellow-400 border-2 border-black mb-6">
              <span className="font-bold">AUSTRALIA'S FIRST</span>
            </div>
            <h1 className="headline-truth mb-6">
              Centre of Excellence for Youth Justice
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              Building Australia's capacity to lead the world in supporting young people through research, best practice, training, and innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/centre-of-excellence/map"
                className="px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2"
              >
                <Map className="h-5 w-5" />
                Global Excellence Map
              </Link>
              <a
                href="#research"
                className="px-8 py-4 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                Explore Research
              </a>
              <a
                href="#training"
                className="px-8 py-4 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center justify-center gap-2"
              >
                <GraduationCap className="h-5 w-5" />
                Training Opportunities
              </a>
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-black p-8 bg-white">
                <Target className="h-12 w-12 mb-4" />
                <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  To position Australia as a global leader in youth justice support, demonstrating best practice frameworks that transform young lives and inspire international change.
                </p>
              </div>
              <div className="border-2 border-black p-8 bg-white">
                <Globe className="h-12 w-12 mb-4" />
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  To build capacity across Australia through rigorous research, world-class training, international collaboration, and evidence-based practice that puts young people first.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Research & Best Practice */}
        <section id="research" className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="headline-truth mb-4">Research & Best Practice</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Evidence-based approaches that drive real outcomes for young people
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Research Areas */}
              <div className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                <BookOpen className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-3">Active Research</h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Trauma-informed youth justice approaches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Indigenous-led diversion programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Family engagement frameworks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Restorative justice outcomes</span>
                  </li>
                </ul>
                <Link href="/centre-of-excellence/research" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  View All Research <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Best Practice */}
              <div className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                <Award className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-3">Best Practice</h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Queensland Diversion Model</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>NSW Youth Koori Court</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Victoria's Therapeutic Services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>WA Aboriginal Youth Programs</span>
                  </li>
                </ul>
                <Link href="/centre-of-excellence/best-practice" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Explore Frameworks <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* International Learning */}
              <div className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                <Globe className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-3">Global Insights</h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>New Zealand Oranga Tamariki</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Scottish Children's Hearings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Nordic Welfare Models</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>Canadian Youth Justice Act</span>
                  </li>
                </ul>
                <Link href="/centre-of-excellence/global-insights" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  International Studies <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="headline-truth mb-4">Case Studies & Impact</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Real stories of transformation and positive outcomes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-black p-6 bg-white">
                <div className="inline-block px-3 py-1 bg-green-100 text-green-800 font-bold text-sm mb-4">
                  YOUTH DIVERSION
                </div>
                <h3 className="text-2xl font-bold mb-3">85% Reduction in Reoffending</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  How Queensland's Indigenous-led diversion program achieved exceptional outcomes through cultural connection, family engagement, and community support.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    127 Young People
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2022-2024
                  </span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Read Full Case Study <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 font-bold text-sm mb-4">
                  FAMILY SUPPORT
                </div>
                <h3 className="text-2xl font-bold mb-3">Strengthening Family Connections</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  A breakthrough family engagement model that kept 92% of young people in family care while reducing justice involvement by 70%.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    84 Families
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2023-2024
                  </span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Read Full Case Study <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 font-bold text-sm mb-4">
                  EDUCATION
                </div>
                <h3 className="text-2xl font-bold mb-3">Pathways to Employment</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  How alternative education programs combined with wraparound support achieved 78% employment or training outcomes for system-involved youth.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    156 Young People
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2021-2024
                  </span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Read Full Case Study <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 font-bold text-sm mb-4">
                  MENTAL HEALTH
                </div>
                <h3 className="text-2xl font-bold mb-3">Trauma-Informed Care</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Implementing trauma-informed therapeutic approaches reduced mental health crises by 65% and improved wellbeing outcomes across all measures.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    203 Young People
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2020-2024
                  </span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Read Full Case Study <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Training & Development */}
        <section id="training" className="section-padding border-b-2 border-black bg-yellow-50">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="headline-truth mb-4">Training & Expert Development</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Building Australia's next generation of youth justice experts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="border-2 border-black p-6 bg-white text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">1,200+</div>
                <div className="text-gray-700">Professionals Trained</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">24</div>
                <div className="text-gray-700">Certification Programs</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">180+</div>
                <div className="text-gray-700">Expert Practitioners</div>
              </div>
              <div className="border-2 border-black p-6 bg-white text-center">
                <Globe className="h-12 w-12 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">15</div>
                <div className="text-gray-700">International Partners</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Foundational Training</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Youth Justice Fundamentals</div>
                      <div className="text-sm text-gray-600">8-week online course</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Trauma-Informed Practice</div>
                      <div className="text-sm text-gray-600">Intensive workshop series</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Cultural Competency</div>
                      <div className="text-sm text-gray-600">Indigenous-led training</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Advanced Programs</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Diversion Program Design</div>
                      <div className="text-sm text-gray-600">12-month certification</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Research Methodology</div>
                      <div className="text-sm text-gray-600">Academic partnership</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Leadership Development</div>
                      <div className="text-sm text-gray-600">Executive program</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Specialist Pathways</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Family Engagement Specialist</div>
                      <div className="text-sm text-gray-600">6-month intensive</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Restorative Justice Facilitator</div>
                      <div className="text-sm text-gray-600">Accredited program</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Youth Advocacy Expert</div>
                      <div className="text-sm text-gray-600">Rights-based training</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="#"
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all"
              >
                <GraduationCap className="h-5 w-5" />
                View All Training Programs
              </Link>
            </div>
          </div>
        </section>

        {/* Workshops & Events */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="headline-truth mb-4">Workshops & Events</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Connect, learn, and collaborate with Australia's best practitioners
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border-2 border-black p-6 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-block px-3 py-1 bg-red-100 text-red-800 font-bold text-sm">
                    UPCOMING
                  </div>
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">National Youth Justice Summit 2025</h3>
                <p className="text-gray-600 mb-4">Brisbane Convention Centre • June 15-17, 2025</p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Australia's premier youth justice conference bringing together 500+ practitioners, policymakers, researchers, and lived experience experts.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium">3 Days</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium">40+ Sessions</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium">International Speakers</span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Register Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 font-bold text-sm">
                    MONTHLY
                  </div>
                  <Lightbulb className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Practice Innovation Workshops</h3>
                <p className="text-gray-600 mb-4">Virtual & In-Person • First Friday Each Month</p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Interactive sessions exploring cutting-edge approaches, new research findings, and practical tools for frontline practitioners.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium">Free</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium">CPD Points</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium">Recordings Available</span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  View Schedule <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-800 font-bold text-sm">
                    QUARTERLY
                  </div>
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Regional Practitioner Forums</h3>
                <p className="text-gray-600 mb-4">Rotating Locations • Every Quarter</p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Bringing expertise to regional areas with hands-on workshops, peer learning, and networking opportunities for local practitioners.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium">Regional Focus</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium">Peer Learning</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium">Networking</span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Find Your Region <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-2 border-black p-6 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 font-bold text-sm">
                    ANNUAL
                  </div>
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">International Study Tours</h3>
                <p className="text-gray-600 mb-4">Multiple Destinations • Applications Open Soon</p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Visit world-leading youth justice systems in New Zealand, Scotland, and Nordic countries to learn from international best practice.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium">10-14 Days</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium">Site Visits</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium">Scholarships</span>
                </div>
                <Link href="#" className="text-black font-bold hover:underline inline-flex items-center gap-1">
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Expert Directory */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="text-center mb-12">
              <h2 className="headline-truth mb-4">Expert Directory</h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Connect with Australia's leading youth justice practitioners and researchers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Expert Cards - Placeholder */}
              <div className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                <div className="w-full aspect-square bg-gray-200 border-2 border-black mb-4" />
                <h3 className="text-lg font-bold mb-1">Dr. Sarah Chen</h3>
                <p className="text-sm text-gray-600 mb-3">Trauma-Informed Practice</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">Research</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium">Training</span>
                </div>
                <Link href="#" className="text-sm font-bold hover:underline">View Profile →</Link>
              </div>

              <div className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                <div className="w-full aspect-square bg-gray-200 border-2 border-black mb-4" />
                <h3 className="text-lg font-bold mb-1">Marcus Williams</h3>
                <p className="text-sm text-gray-600 mb-3">Indigenous Youth Justice</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium">Cultural</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium">Policy</span>
                </div>
                <Link href="#" className="text-sm font-bold hover:underline">View Profile →</Link>
              </div>

              <div className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                <div className="w-full aspect-square bg-gray-200 border-2 border-black mb-4" />
                <h3 className="text-lg font-bold mb-1">Prof. James Liu</h3>
                <p className="text-sm text-gray-600 mb-3">Restorative Justice</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium">Academic</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">International</span>
                </div>
                <Link href="#" className="text-sm font-bold hover:underline">View Profile →</Link>
              </div>

              <div className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                <div className="w-full aspect-square bg-gray-200 border-2 border-black mb-4" />
                <h3 className="text-lg font-bold mb-1">Emma Thompson</h3>
                <p className="text-sm text-gray-600 mb-3">Family Engagement</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium">Practice</span>
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium">Lived Experience</span>
                </div>
                <Link href="#" className="text-sm font-bold hover:underline">View Profile →</Link>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="#"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
              >
                <Users className="h-5 w-5" />
                Browse All Experts (180+)
              </Link>
            </div>
          </div>
        </section>

        {/* Get Involved CTA */}
        <section className="section-padding bg-gradient-to-br from-yellow-400 to-yellow-300 border-b-2 border-black">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-6">Join Australia's Centre of Excellence</h2>
            <p className="text-xl text-gray-900 max-w-3xl mx-auto mb-8 leading-relaxed">
              Whether you're a practitioner, researcher, policymaker, or advocate, you have a role in building Australia's capacity to lead the world in youth justice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#"
                className="px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Become a Member
              </Link>
              <Link
                href="#"
                className="px-8 py-4 border-2 border-black bg-white font-bold hover:bg-black hover:text-white transition-all inline-flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                Partner With Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
