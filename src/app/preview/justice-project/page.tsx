'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Scale,
  MapPin,
  Shield,
  Heart,
  ExternalLink,
  Phone,
  MessageSquare,
  AlertTriangle,
  Users,
  FileText,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
  Building2,
  Handshake
} from 'lucide-react';

export default function JusticeProjectPreviewPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('justice-project-preview-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Password: justice2026
    if (password === 'justice2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('justice-project-preview-auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-3xl font-bold mb-2 text-white">Partnership Preview</h1>
            <p className="text-gray-400">JusticeHub x The Justice Project</p>
            <p className="text-gray-500 text-sm mt-2">This mockup is password protected</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-red-500 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 px-4 font-bold hover:bg-red-700 transition-colors rounded-lg"
            >
              Access Preview
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="bg-black text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-black">
              <span className="text-white">JUSTICE</span>
              <span className="text-red-500">HUB</span>
            </Link>
            <span className="text-gray-500">×</span>
            <span className="text-gray-300 font-medium">The Justice Project</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded">PREVIEW</span>
            <span>Not public</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Handshake className="w-8 h-8 text-red-500" />
              <span className="text-red-400 font-bold uppercase tracking-wider">Partnership Concept</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Shared Services for<br />
              <span className="text-red-500">Community Justice</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Integrating The Justice Project's proven tools with JusticeHub's platform
              to create a unified ecosystem for legal support, incident reporting,
              and community-led justice initiatives.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                <Scale className="w-5 h-5 text-blue-400" />
                <span>Legal Triage</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                <MapPin className="w-5 h-5 text-red-400" />
                <span>Incident Mapping</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Police Accountability</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                <Heart className="w-5 h-5 text-purple-400" />
                <span>Crisis Alternatives</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Tools Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Integrated Partner Tools</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four powerful tools from The Justice Project ecosystem,
              seamlessly integrated into JusticeHub.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Hear Me Out */}
            <div className="border-2 border-black p-8 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Scale className="w-8 h-8 text-blue-600" />
                </div>
                <a
                  href="https://www.hearmeout.org.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
                >
                  hearmeout.org.au <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-2xl font-black mb-3">Hear Me Out</h3>
              <p className="text-gray-600 mb-6">
                AI-powered complaint triage tool that helps people identify the right
                complaint pathway and connects them with support services. Coverage
                includes NSW, Victoria, and Federal matters.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Free to use, no legal advice given</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Connects to legal aid & community legal centres</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Mental health & crisis support resources</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">JusticeHub Integration:</p>
                <p className="text-sm text-blue-700">
                  ALMA detects legal queries and offers direct referral to Hear Me Out's
                  triage system. Organizations can access legal support pathway for their clients.
                </p>
              </div>
            </div>

            {/* Call It Out */}
            <div className="border-2 border-black p-8 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <a
                  href="https://callitout.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
                >
                  callitout.com.au <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-2xl font-black mb-3">Call It Out</h3>
              <p className="text-gray-600 mb-6">
                Secure incident reporting platform for racism and discrimination
                towards First Nations peoples. Creates a national map of reported incidents.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Secure, anonymous reporting option</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Location-based incident tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>First Nations community focused</span>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800 mb-2">JusticeHub Integration:</p>
                <p className="text-sm text-red-700">
                  Discrimination incident data overlaid on Community Map as a toggleable
                  layer, showing correlation between incidents and available services.
                </p>
              </div>
            </div>

            {/* Alternative First Responders */}
            <div className="border-2 border-black p-8 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <a
                  href="https://alternativefirstresponders.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
                >
                  alternativefirstresponders.com.au <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-2xl font-black mb-3">Alternative First Responders</h3>
              <p className="text-gray-600 mb-6">
                Advocacy campaign promoting community-centered emergency response
                systems that prioritize care over force. "The right response starts
                with the right people."
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Position papers & research</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Symposium recordings & education</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Community-led crisis response models</span>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-800 mb-2">JusticeHub Integration:</p>
                <p className="text-sm text-purple-700">
                  New /crisis-alternatives page with AFR resources, plus directory of
                  local alternative responders for mental health, DV, and youth crises.
                </p>
              </div>
            </div>

            {/* Cop Watch */}
            <div className="border-2 border-black p-8 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <a
                  href="https://www.copwatch.org.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
                >
                  copwatch.org.au <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-2xl font-black mb-3">Cop Watch</h3>
              <p className="text-gray-600 mb-6">
                Police accountability and civil rights organization focused on
                oversight, education, and community empowerment. Based in Sydney.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Know Your Rights resources</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Complaint filing support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>Contact: +61 2 9514 4440</span>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">JusticeHub Integration:</p>
                <p className="text-sm text-green-700">
                  New /know-your-rights page with Cop Watch resources, plus integration
                  of their educational content for young people encountering police.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Services Architecture */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Shared Services Layer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A unified infrastructure supporting community organizations with
              legal, governance, and philanthropic services.
            </p>
          </div>

          <div className="bg-white border-2 border-black p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Legal Triage */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Legal Triage</h3>
                <p className="text-gray-600 text-sm">
                  Organizations refer clients to Hear Me Out for complaint pathway support.
                  No direct-to-consumer legal advice.
                </p>
              </div>

              {/* Governance Support */}
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Governance Support</h3>
                <p className="text-gray-600 text-sm">
                  Centralized accounting, minute-taking, and governance support
                  for grassroots organizations.
                </p>
              </div>

              {/* Philanthropy Matching */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Handshake className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Philanthropy Matching</h3>
                <p className="text-gray-600 text-sm">
                  Reverse the grant model—funders discover vetted organizations
                  through JusticeHub's trusted network.
                </p>
              </div>
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="bg-black text-white p-8 rounded-lg font-mono text-sm">
            <pre className="overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────────┐
│                      JUSTICEHUB PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SHARED SERVICES LAYER                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   LEGAL     │  │  INCIDENT   │  │  CRISIS     │     │   │
│  │  │   TRIAGE    │  │  REPORTING  │  │  RESPONSE   │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │ Hear Me Out │  │ Call It Out │  │ Alt First   │     │   │
│  │  │    API      │  │    Map      │  │ Responders  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   POLICE    │  │ GOVERNANCE  │  │ PHILANTHROPY│     │   │
│  │  │   OVERSIGHT │  │   SUPPORT   │  │  MATCHING   │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │  Cop Watch  │  │  Minutes/   │  │  Funder     │     │   │
│  │  │  Resources  │  │  Accounting │  │  Discovery  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    CONSUMER LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   YOUTH     │  │   ORGS      │  │  FUNDERS    │             │
│  │ Direct help │  │ Support for │  │ Discover    │             │
│  │ via ALMA    │  │ operations  │  │ vetted orgs │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>
      </section>

      {/* New Pages Preview */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">New Pages to Create</h2>
            <p className="text-xl text-gray-600">
              Three new sections for partner content integration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Crisis Alternatives */}
            <div className="border-2 border-purple-600 rounded-lg overflow-hidden">
              <div className="bg-purple-600 text-white p-4">
                <h3 className="font-bold text-lg">/crisis-alternatives</h3>
              </div>
              <div className="p-6">
                <h4 className="font-bold mb-3">When Crisis Hits, Care Comes First</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• AFR position paper embed</li>
                  <li>• Symposium video recordings</li>
                  <li>• Local alternative responder directory</li>
                  <li>• Mental health crisis resources</li>
                  <li>• Non-police response options</li>
                </ul>
              </div>
            </div>

            {/* Know Your Rights */}
            <div className="border-2 border-green-600 rounded-lg overflow-hidden">
              <div className="bg-green-600 text-white p-4">
                <h3 className="font-bold text-lg">/know-your-rights</h3>
              </div>
              <div className="p-6">
                <h4 className="font-bold mb-3">Know Your Rights</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Rights during police encounters</li>
                  <li>• How to file complaints</li>
                  <li>• Cop Watch resources</li>
                  <li>• Hear Me Out triage link</li>
                  <li>• Legal aid by state</li>
                </ul>
              </div>
            </div>

            {/* Report Incident */}
            <div className="border-2 border-red-600 rounded-lg overflow-hidden">
              <div className="bg-red-600 text-white p-4">
                <h3 className="font-bold text-lg">/report-incident</h3>
              </div>
              <div className="p-6">
                <h4 className="font-bold mb-3">Report an Incident</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Gateway to Call It Out</li>
                  <li>• Racism/discrimination reporting</li>
                  <li>• Complaint pathways</li>
                  <li>• Anonymous options</li>
                  <li>• Support resources</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALMA Integration */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-8 h-8 text-red-500" />
                <span className="text-red-400 font-bold uppercase tracking-wider">ALMA Integration</span>
              </div>
              <h2 className="text-4xl font-black mb-6 text-white">
                Smart Referrals via AI
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                ALMA will be trained to recognize legal, discrimination, and crisis queries
                and route users to the appropriate partner service.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <p className="font-medium text-white">Legal queries</p>
                    <p className="text-sm text-gray-400">→ Hear Me Out triage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <p className="font-medium text-white">Discrimination reports</p>
                    <p className="text-sm text-gray-400">→ Call It Out</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <p className="font-medium text-white">Police encounters</p>
                    <p className="text-sm text-gray-400">→ Cop Watch + Know Your Rights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <p className="font-medium text-white">Crisis situations</p>
                    <p className="text-sm text-gray-400">→ Alternative First Responders</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="ml-2">ALMA Chat Preview</span>
              </div>
              <div className="space-y-4 text-sm">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-300">👤 I experienced racism at work and want to make a complaint</p>
                </div>
                <div className="bg-red-900/30 rounded-lg p-3 border-l-4 border-red-500">
                  <p className="text-gray-200 mb-2">
                    I'm sorry to hear that. I can help you find the right pathway.
                  </p>
                  <p className="text-gray-300 mb-3">
                    For reporting racism and discrimination, I recommend:
                  </p>
                  <div className="space-y-2">
                    <a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                      <Scale className="w-4 h-4" />
                      Hear Me Out - Legal complaint triage
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="#" className="flex items-center gap-2 text-red-400 hover:text-red-300">
                      <AlertTriangle className="w-4 h-4" />
                      Call It Out - Report racism incident
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Integration Preview */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Map Data Overlay</h2>
            <p className="text-xl text-gray-600">
              Call It Out incident data as a toggleable layer on the Community Map.
            </p>
          </div>

          <div className="border-2 border-black rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-4 border-b-2 border-black flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold">Community Map</span>
                <span className="text-gray-500 hidden sm:inline">|</span>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="services" className="rounded" defaultChecked />
                  <label htmlFor="services" className="text-sm flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
                    Services (47)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="programs" className="rounded" defaultChecked />
                  <label htmlFor="programs" className="text-sm flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
                    Programs (23)
                  </label>
                </div>
                <div className="flex items-center gap-2 bg-red-100 px-2 py-1 rounded border border-red-300">
                  <input type="checkbox" id="incidents" className="rounded border-red-400" defaultChecked />
                  <label htmlFor="incidents" className="text-sm text-red-700 font-medium flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500/60 rounded-full inline-block"></span>
                    Incidents (156)
                  </label>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Sydney Metro • Last 12 months
              </div>
            </div>

            {/* Mock Map with Visual Data */}
            <div className="relative h-[500px] bg-[#e8e4d8] overflow-hidden">
              {/* Simulated map background with street grid */}
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(200,200,200,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(200,200,200,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}></div>

              {/* Major roads simulation */}
              <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-300/50"></div>
              <div className="absolute top-2/3 left-0 right-0 h-1 bg-gray-300/40"></div>
              <div className="absolute left-1/4 top-0 bottom-0 w-2 bg-gray-300/50"></div>
              <div className="absolute left-2/3 top-0 bottom-0 w-1 bg-gray-300/40"></div>

              {/* Water feature (harbour) */}
              <div className="absolute top-0 right-0 w-1/3 h-1/4 bg-blue-200/40 rounded-bl-[100px]"></div>

              {/* Incident Heatmap Zones */}
              <div className="absolute top-[30%] left-[20%] w-32 h-32 bg-red-500/30 rounded-full blur-xl"></div>
              <div className="absolute top-[40%] left-[25%] w-20 h-20 bg-red-500/40 rounded-full blur-lg"></div>
              <div className="absolute top-[50%] left-[45%] w-40 h-40 bg-red-500/25 rounded-full blur-xl"></div>
              <div className="absolute top-[35%] left-[50%] w-24 h-24 bg-red-500/35 rounded-full blur-lg"></div>
              <div className="absolute top-[60%] left-[70%] w-28 h-28 bg-red-500/30 rounded-full blur-xl"></div>
              <div className="absolute top-[20%] left-[60%] w-16 h-16 bg-red-500/25 rounded-full blur-lg"></div>

              {/* Service Markers (Blue) */}
              <div className="absolute top-[25%] left-[15%] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Legal Aid NSW"></div>
              <div className="absolute top-[45%] left-[30%] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Redfern Legal Centre"></div>
              <div className="absolute top-[35%] left-[55%] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Aboriginal Legal Service"></div>
              <div className="absolute top-[55%] left-[40%] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Youth Law Australia"></div>
              <div className="absolute top-[65%] left-[65%] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Community Legal Centre"></div>
              <div className="absolute top-[30%] left-[75%] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Tenants Union"></div>
              <div className="absolute top-[70%] left-[25%] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Welfare Rights"></div>

              {/* Program Markers (Green) */}
              <div className="absolute top-[40%] left-[20%] w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Koori Youth Program"></div>
              <div className="absolute top-[50%] left-[50%] w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Weave Youth Program"></div>
              <div className="absolute top-[60%] left-[35%] w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="BackTrack Youth Works"></div>
              <div className="absolute top-[25%] left-[45%] w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="PCYC Outreach"></div>
              <div className="absolute top-[75%] left-[55%] w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" title="Youth Off The Streets"></div>

              {/* Incident cluster markers */}
              <div className="absolute top-[32%] left-[22%] w-8 h-8 bg-red-500/80 rounded-full border-2 border-red-600 shadow-lg flex items-center justify-center text-white text-xs font-bold">23</div>
              <div className="absolute top-[48%] left-[47%] w-10 h-10 bg-red-500/80 rounded-full border-2 border-red-600 shadow-lg flex items-center justify-center text-white text-xs font-bold">41</div>
              <div className="absolute top-[58%] left-[68%] w-7 h-7 bg-red-500/80 rounded-full border-2 border-red-600 shadow-lg flex items-center justify-center text-white text-xs font-bold">18</div>
              <div className="absolute top-[22%] left-[58%] w-6 h-6 bg-red-500/80 rounded-full border-2 border-red-600 shadow-lg flex items-center justify-center text-white text-xs font-bold">9</div>

              {/* Location labels */}
              <div className="absolute top-[15%] left-[18%] text-xs font-medium text-gray-600 bg-white/80 px-1 rounded">Redfern</div>
              <div className="absolute top-[42%] left-[42%] text-xs font-medium text-gray-600 bg-white/80 px-1 rounded">Sydney CBD</div>
              <div className="absolute top-[55%] left-[62%] text-xs font-medium text-gray-600 bg-white/80 px-1 rounded">Bondi Junction</div>
              <div className="absolute top-[68%] left-[20%] text-xs font-medium text-gray-600 bg-white/80 px-1 rounded">Bankstown</div>
              <div className="absolute top-[25%] left-[70%] text-xs font-medium text-gray-600 bg-white/80 px-1 rounded">Parramatta</div>

              {/* Map attribution */}
              <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 bg-white/80 px-1 rounded">
                © OpenStreetMap contributors
              </div>

              {/* Zoom controls mockup */}
              <div className="absolute top-4 left-4 bg-white rounded shadow-lg">
                <button className="w-8 h-8 flex items-center justify-center border-b text-gray-600 hover:bg-gray-100">+</button>
                <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100">−</button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="bg-gray-50 border-t-2 border-black p-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Incidents reported:</span>
                    <span className="font-bold ml-1">156</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Hotspot areas:</span>
                    <span className="font-bold ml-1 text-red-600">4</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Services nearby:</span>
                    <span className="font-bold ml-1 text-blue-600">47</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Programs active:</span>
                    <span className="font-bold ml-1 text-green-600">23</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Data from Call It Out • Updated daily
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Justice Matrix Project */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-8 h-8 text-blue-400" />
                <span className="text-blue-300 font-bold uppercase tracking-wider">Special Project</span>
              </div>
              <h2 className="text-4xl font-black mb-6 text-white">
                Global Justice Matrix
              </h2>
              <p className="text-xl text-blue-100 mb-6">
                A strategic litigation and advocacy clearing house for refugee protection
                across the Pacific, Asia, Europe, and Americas.
              </p>
              <p className="text-blue-200 mb-8">
                Share cases, coordinate campaigns, and build reusable legal playbooks
                across jurisdictions. Proposed partnership with OHCHR Regional Office.
              </p>
              <Link
                href="/preview/justice-matrix"
                className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
              >
                Explore Justice Matrix
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white/10 rounded-xl p-8 backdrop-blur">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">12</p>
                  <p className="text-blue-200 text-sm">Strategic Cases</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">10</p>
                  <p className="text-blue-200 text-sm">Advocacy Campaigns</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">6</p>
                  <p className="text-blue-200 text-sm">Regions Covered</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">50+</p>
                  <p className="text-blue-200 text-sm">Organizations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">Implementation Phases</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-2 border-black p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-black text-green-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Quick Wins (Week 1-2)</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Add 5 partner orgs to database</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Create organization profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Add partner links to footer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Update ALMA with partner awareness</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-black p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-black text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Content Integration (Week 3-4)</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Create /crisis-alternatives page</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Create /know-your-rights page</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Add Call It Out CTA to map</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Import partner resources to wiki</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-black p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-black text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Deep Integration (Month 2+)</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                  <span>API integration with Hear Me Out</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                  <span>Map data layer from Call It Out</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                  <span>Student developer program</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                  <span>Sydney partnership launch event</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-2xl font-black mb-2">
                <span className="text-white">JUSTICE</span>
                <span className="text-red-500">HUB</span>
                <span className="text-gray-500 text-lg font-normal ml-2">× The Justice Project</span>
              </p>
              <p className="text-gray-400 text-sm">
                Partnership Preview - Not for public distribution
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm">
                PREVIEW MODE
              </span>
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to JusticeHub →
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
