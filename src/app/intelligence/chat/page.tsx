'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { AlmaChat } from '@/components/bot/AlmaChat';
import {
  MessageCircle,
  Brain,
  Shield,
  Heart,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-white text-black font-sans overflow-hidden">
      <Navigation />

      {/* Fixed height container - no scrolling on main page */}
      {/* pt-40 accounts for fixed navigation height */}
      <main className="flex-1 flex flex-col overflow-hidden pt-40">
        {/* Compact Header */}
        <div className="border-b-2 border-black bg-white shrink-0">
          <div className="container-justice py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MessageCircle className="w-7 h-7" />
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">
                    Ask ALMA
                  </h1>
                  <p className="text-xs text-gray-600">
                    Chat with youth justice AI — evidence, costs, programs
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  Conversational Interface
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Fixed height, no page scroll */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="container-justice h-full py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Main Chat Panel - Takes full available height */}
              <div className="lg:col-span-2 h-full min-h-[400px]">
                <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
                  <AlmaChat className="h-full" />
                </div>
              </div>

              {/* Sidebar - Scrolls independently */}
              <div className="hidden lg:block h-full overflow-y-auto">
                <div className="space-y-4 pb-4">
              {/* What ALMA means */}
              <div className="border-2 border-black bg-white p-4">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> What is ALMA?
                </h3>
                <div className="space-y-2 text-xs text-gray-700">
                  <p>
                    <strong className="text-black">ALMA</strong> = {' '}
                    <strong className="text-orange-600">
                      Authentic Learning for Meaningful Accountability
                    </strong>
                  </p>
                  <p>
                    From Spanish <em>&quot;alma&quot;</em> meaning <strong>&quot;soul&quot;</strong>
                  </p>
                  <div className="pt-2 border-t border-gray-200">
                    <ul className="space-y-0.5">
                      <li>• See patterns in youth justice systems</li>
                      <li>• Connect evidence to interventions</li>
                      <li>• Translate research into plain language</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sacred Boundaries */}
              <div className="border-2 border-orange-500 bg-orange-50 p-4">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2 text-orange-800">
                  <Shield className="w-4 h-4" /> Sacred Boundaries
                </h3>
                <div className="text-xs text-orange-900">
                  <ul className="space-y-1">
                    <li><strong>No profiling</strong> — We watch systems, not people</li>
                    <li><strong>No predictions</strong> — Risk scores entrench bias</li>
                    <li><strong>No legal advice</strong> — We connect to services</li>
                  </ul>
                </div>
              </div>

              {/* Example Questions */}
              <div className="border-2 border-gray-200 bg-white p-4">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Try Asking
                </h3>
                <div className="text-xs space-y-2">
                  <ul className="space-y-0.5 text-gray-800">
                    <li>&quot;How much does detention cost?&quot;</li>
                    <li>&quot;What reduces reoffending?&quot;</li>
                    <li>&quot;Find diversion programs in NT&quot;</li>
                    <li>&quot;Indigenous-led interventions&quot;</li>
                  </ul>
                </div>
              </div>

              {/* Links */}
              <div className="border-2 border-black bg-black text-white p-4">
                <h3 className="font-bold uppercase tracking-widest text-xs mb-3">
                  Related Tools
                </h3>
                <div className="space-y-2 text-sm">
                  <Link
                    href="/intelligence/research"
                    className="flex items-center justify-between py-1.5 hover:text-emerald-300 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Research Agent
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/intelligence/dashboard"
                    className="flex items-center justify-between py-1.5 hover:text-emerald-300 transition-colors"
                  >
                    <span>ALMA Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/intelligence/impact-calculator"
                    className="flex items-center justify-between py-1.5 hover:text-emerald-300 transition-colors"
                  >
                    <span>Impact Calculator</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/intelligence/interventions"
                    className="flex items-center justify-between py-1.5 hover:text-emerald-300 transition-colors"
                  >
                    <span>Browse Interventions</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
