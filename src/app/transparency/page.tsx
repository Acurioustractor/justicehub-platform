'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  FileText,
  Search,
  Users,
  Building2,
  Eye,
  ArrowRight,
  Zap,
  Target,
  Map as MapIcon,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { SimpleEcosystemMap } from '@/components/SimpleEcosystemMap';

interface Stats {
  programs_documented: number;
  programs_verified: number;
  programs_under_review: number;
  total_organizations: number;
  total_evidence: number;
  total_evidence_links: number;
  orgs_linked: number;
  indigenous_orgs: number;
  orgs_with_abn: number;
  org_size_small: number;
  org_size_medium: number;
  org_size_large: number;
  rogs_youth_detention_millions: number;
  rogs_youth_community_millions: number;
  rogs_youth_total_millions: number;
  rogs_prison_billions: number;
  rogs_police_billions: number;
  rogs_indigenous_detention_ratio: number;
  rogs_total_punitive_billions: number;
  rogs_year: string;
}

export default function TransparencyPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/homepage-stats')
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = stats;
  const detentionM = s?.rogs_youth_detention_millions || 1141;
  const communityM = s?.rogs_youth_community_millions || 520;
  const totalYouthM = s?.rogs_youth_total_millions || 1723;
  const prisonB = s?.rogs_prison_billions || 6.8;
  const policeB = s?.rogs_police_billions || 18.4;
  const punitiveB = s?.rogs_total_punitive_billions || 26.4;
  const indigenousRatio = s?.rogs_indigenous_detention_ratio || 23.1;
  const costPerChild = Math.round(detentionM * 1000000 / 734); // 734 children in detention nationally
  const costPerDay = Math.round(costPerChild / 365);
  const detentionPct = Math.round((detentionM / totalYouthM) * 100);
  const communityPct = 100 - detentionPct;

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main className="header-offset">
        {/* Banner */}
        <section className="bg-emerald-600 text-white py-4 border-b-2 border-emerald-800">
          <div className="container-justice">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-bold">
                  Search $9B+ in real justice funding data — 52,000+ grants across 29,000 organisations.
                </p>
              </div>
              <Link
                href="/justice-funding"
                className="px-4 py-2 bg-white text-emerald-700 font-bold text-sm uppercase tracking-widest hover:bg-emerald-50 transition-colors flex items-center gap-2 flex-shrink-0"
              >
                Justice Spending Tracker <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="pb-16 border-b-2 border-black bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
          <div className="container-justice">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-sm uppercase tracking-wider mb-6">
                <DollarSign className="h-4 w-4" />
                Following The Money
              </div>

              <h1 className="headline-truth mb-6">MONEY TRAIL</h1>

              <p className="text-xl max-w-4xl mx-auto mb-8 leading-relaxed text-gray-800">
                Real data from the Productivity Commission Report on Government Services (ROGS 2024-25)
                and QLD open data. Every number on this page is sourced from official publications.
              </p>

              {/* Key Stats from ROGS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center justify-center mb-3 text-red-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-black mb-1">${punitiveB}B</div>
                  <div className="text-sm font-bold text-gray-700 mb-1">Total Punitive Spending</div>
                  <div className="text-xs font-bold text-gray-500">Police + Prisons + Youth Detention</div>
                </div>
                <div className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center justify-center mb-3 text-red-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-black mb-1">${(costPerChild / 1000000).toFixed(2)}M</div>
                  <div className="text-sm font-bold text-gray-700 mb-1">Per Child in Detention</div>
                  <div className="text-xs font-bold text-gray-500">${costPerDay.toLocaleString()}/day for 734 children</div>
                </div>
                <div className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center justify-center mb-3 text-green-600">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-black mb-1">${communityM}M</div>
                  <div className="text-sm font-bold text-gray-700 mb-1">Community Programs</div>
                  <div className="text-xs font-bold text-gray-500">{communityPct}% of youth justice budget</div>
                </div>
                <div className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center justify-center mb-3 text-orange-600">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-black mb-1">{indigenousRatio}x</div>
                  <div className="text-sm font-bold text-gray-700 mb-1">Indigenous Overrepresentation</div>
                  <div className="text-xs font-bold text-gray-500">In youth detention nationally</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Source Banner */}
        <section className="py-8 bg-green-600 text-white border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center justify-center gap-4 text-center">
              <Zap className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-black mb-1">LIVE DATA FROM OFFICIAL SOURCES</h2>
                <p className="text-green-100">
                  Productivity Commission ROGS {s?.rogs_year || '2024-25'} · ALMA Program Catalogue ({s?.programs_documented || 939} programs) · QLD Open Data (51,728 grants)
                </p>
              </div>
              <Zap className="h-8 w-8" />
            </div>
          </div>
        </section>

        {/* The Numbers */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              NATIONAL JUSTICE SPENDING — ROGS {s?.rogs_year || '2024-25'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Budget Breakdown */}
              <div className="border-2 border-black overflow-hidden">
                <div className="bg-gray-50 border-b-2 border-black p-4">
                  <h3 className="font-bold text-lg">NATIONAL SPENDING BY SECTOR</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-black">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Sector</th>
                        <th className="px-4 py-3 text-right font-bold">Amount</th>
                        <th className="px-4 py-3 text-right font-bold">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sector: 'Police Services', amount: policeB, unit: 'B', color: 'text-red-600' },
                        { sector: 'Prisons & Corrections', amount: prisonB, unit: 'B', color: 'text-red-600' },
                        { sector: 'Youth Detention', amount: detentionM, unit: 'M', color: 'text-red-600' },
                        { sector: 'Youth Community Programs', amount: communityM, unit: 'M', color: 'text-green-600' },
                      ].map((row, i) => {
                        const totalM = policeB * 1000 + prisonB * 1000 + detentionM + communityM;
                        const rowM = row.unit === 'B' ? row.amount * 1000 : row.amount;
                        const pct = ((rowM / totalM) * 100).toFixed(1);
                        return (
                          <tr key={row.sector} className={`border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-4 py-4 font-bold">{row.sector}</td>
                            <td className={`px-4 py-4 text-right font-mono font-bold ${row.color}`}>
                              ${row.amount.toLocaleString()}{row.unit}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-gray-600">{pct}%</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-black text-white">
                        <td className="px-4 py-4 font-bold">Total</td>
                        <td className="px-4 py-4 text-right font-mono font-bold">${punitiveB}B</td>
                        <td className="px-4 py-4 text-right font-mono">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="space-y-6">
                <div className="border-2 border-black p-6 bg-red-50">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Target className="h-6 w-6 text-red-600" />
                    COST PER CHILD — ROGS {s?.rogs_year || '2024-25'}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white border border-gray-200">
                      <div>
                        <div className="font-bold">Youth Detention</div>
                        <div className="text-sm text-gray-600">${detentionM}M ÷ 734 children</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">${(costPerChild / 1000000).toFixed(2)}M</div>
                        <div className="text-sm text-red-600">${costPerDay.toLocaleString()}/day</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white border border-gray-200">
                      <div>
                        <div className="font-bold">Community Programs</div>
                        <div className="text-sm text-gray-600">${communityM}M across thousands of young people</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">~$15-50K</div>
                        <div className="text-sm text-green-600">per participant</div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-orange-600 mb-1">{detentionPct}% vs {communityPct}%</div>
                        <div className="text-sm font-bold">
                          {detentionPct}% of youth justice budget goes to detention (734 children).
                          {communityPct}% goes to community programs (thousands).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black p-6 bg-blue-50">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                    INDIGENOUS OVERREPRESENTATION
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white border border-gray-200">
                      <span className="text-sm font-bold">National detention ratio</span>
                      <span className="font-bold text-red-600">{indigenousRatio}x overrepresented</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white border border-gray-200">
                      <span className="text-sm font-bold">NT detention ratio</span>
                      <span className="font-bold text-red-600">~28x overrepresented</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white border border-gray-200">
                      <span className="text-sm font-bold">Indigenous-led organisations</span>
                      <span className="font-bold text-green-600">{s?.indigenous_orgs || 197} organisations</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Source: Productivity Commission ROGS Table 17A.7 (2024-25)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WORKS VS WHAT WE SPEND */}
        <section className="py-16 border-b-2 border-black bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-amber-600" />
              WHAT WORKS vs WHAT WE SPEND
            </h2>
            <p className="text-gray-700 mb-8 max-w-3xl">
              Australia spends ${punitiveB}B/year on punitive responses. Meanwhile, {s?.programs_documented || 939} community
              programs catalogued in ALMA show what actually reduces reoffending,
              strengthens families, and keeps communities safe — at a fraction of the cost.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* The Spending Side */}
              <div className="border-2 border-red-300 bg-white p-6">
                <h3 className="font-bold text-lg mb-4 text-red-700 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  WHAT WE SPEND (Punitive)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200">
                    <span className="font-bold text-sm">Youth Detention</span>
                    <div className="text-right">
                      <span className="font-bold text-red-600">${detentionM}M/yr</span>
                      <div className="text-xs text-gray-500">734 children · ${costPerDay.toLocaleString()}/day each</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200">
                    <span className="font-bold text-sm">Adult Prisons</span>
                    <span className="font-bold text-red-600">${prisonB}B/yr</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200">
                    <span className="font-bold text-sm">Police Services</span>
                    <span className="font-bold text-red-600">${policeB}B/yr</span>
                  </div>
                  <div className="p-3 bg-red-100 border-2 border-red-300 text-center">
                    <div className="text-sm font-bold text-red-800">Evidence of reducing reoffending?</div>
                    <div className="text-2xl font-black text-red-600">Minimal</div>
                    <div className="text-xs text-red-700">Recidivism rates remain 50-80% within 2 years</div>
                  </div>
                </div>
              </div>

              {/* The Evidence Side */}
              <div className="border-2 border-green-300 bg-white p-6">
                <h3 className="font-bold text-lg mb-4 text-green-700 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  WHAT WORKS (Community Evidence)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200">
                    <span className="font-bold text-sm">Community Programs Budget</span>
                    <div className="text-right">
                      <span className="font-bold text-green-600">${communityM}M/yr</span>
                      <div className="text-xs text-gray-500">{communityPct}% of youth justice budget</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200">
                    <span className="font-bold text-sm">Programs Catalogued</span>
                    <span className="font-bold text-green-600">{s?.programs_documented || 939}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200">
                    <span className="font-bold text-sm">Evidence Items</span>
                    <span className="font-bold text-green-600">{s?.total_evidence || 334}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200">
                    <span className="font-bold text-sm">Organisations Linked</span>
                    <span className="font-bold text-green-600">{s?.orgs_linked || 527}</span>
                  </div>
                  <div className="p-3 bg-green-100 border-2 border-green-300 text-center">
                    <div className="text-sm font-bold text-green-800">Community programs show</div>
                    <div className="text-2xl font-black text-green-600">78% Success</div>
                    <div className="text-xs text-green-700">vs 15.5% for detention (AIHW data)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* The Gap */}
            <div className="border-2 border-black bg-white p-8">
              <h3 className="font-bold text-xl mb-6 text-center">THE INVESTMENT GAP</h3>
              <div className="max-w-3xl mx-auto">
                {/* Visual bar comparison */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Punitive spending (detention + prisons)</span>
                      <span className="text-red-600">${(prisonB + detentionM/1000).toFixed(1)}B</span>
                    </div>
                    <div className="w-full bg-gray-200 h-8 border border-gray-300">
                      <div className="bg-red-500 h-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Community programs (what works)</span>
                      <span className="text-green-600">${communityM}M</span>
                    </div>
                    <div className="w-full bg-gray-200 h-8 border border-gray-300">
                      <div className="bg-green-500 h-full" style={{ width: `${Math.round((communityM / (prisonB * 1000 + detentionM)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-700">
                  For every <strong className="text-green-700">$1</strong> spent on community programs that work,
                  <strong className="text-red-700"> ${Math.round((prisonB * 1000 + detentionM) / communityM)}</strong> goes to
                  punitive responses with minimal evidence of reducing reoffending.
                </p>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/intelligence/interventions"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 font-bold hover:bg-green-700 transition-all"
                >
                  Explore What Works <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contained"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-red-600 transition-all ml-3"
                >
                  CONTAINED Tour <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ALMA Data Quality Journey */}
        <section className="py-16 border-b-2 border-black bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <Search className="h-8 w-8 text-blue-600" />
              ALMA PROGRAM CATALOGUE — DATA QUALITY
            </h2>
            <p className="text-gray-700 mb-8 max-w-3xl">
              We catalogue community programs working in youth justice across Australia.
              Here is an honest breakdown of our data quality — what we know, what needs review,
              and what we are still verifying.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { value: s?.programs_documented || 939, label: 'Programs Catalogued', color: 'text-blue-600', icon: <Search className="h-5 w-5" /> },
                { value: s?.programs_verified || 0, label: 'Verified', color: 'text-green-600', icon: <CheckCircle2 className="h-5 w-5" /> },
                { value: s?.programs_under_review || 0, label: 'Under Review', color: 'text-amber-600', icon: <Clock className="h-5 w-5" /> },
                { value: s?.total_evidence || 334, label: 'Evidence Items', color: 'text-purple-600', icon: <FileText className="h-5 w-5" /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border-2 border-black p-6 text-center">
                  <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
                  <div className={`text-3xl font-black ${stat.color}`}>
                    {loading ? '...' : stat.value.toLocaleString()}
                  </div>
                  <div className="text-sm font-bold text-gray-700 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Data Quality Transparency Box */}
            <div className="border-2 border-amber-400 bg-amber-50 p-6 mb-8">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                Our Data Integrity Commitment
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                We recently audited our ALMA data and removed fabricated content that had been
                AI-generated without verification. This included template-generated program entries,
                unverified scoring, and placeholder outcomes. We believe honest data — even incomplete
                data — is more valuable than inflated numbers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 border border-amber-200">
                  <div className="font-bold text-amber-700 mb-1">Removed</div>
                  <ul className="space-y-1 text-gray-600">
                    <li>AI-generated portfolio scores</li>
                    <li>Placeholder outcomes</li>
                    <li>Template-generated entries</li>
                  </ul>
                </div>
                <div className="bg-white p-3 border border-green-200">
                  <div className="font-bold text-green-700 mb-1">Kept (Real)</div>
                  <ul className="space-y-1 text-gray-600">
                    <li>Programs with source documents</li>
                    <li>Scraped evidence items</li>
                    <li>Organisation links (ABN-verified)</li>
                  </ul>
                </div>
                <div className="bg-white p-3 border border-blue-200">
                  <div className="font-bold text-blue-700 mb-1">Next Steps</div>
                  <ul className="space-y-1 text-gray-600">
                    <li>Human verification workflow</li>
                    <li>Real evaluation data</li>
                    <li>Community-validated scoring</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-black p-6">
                <h3 className="font-bold text-lg mb-3">Organisation Coverage</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total organisations</span>
                    <span className="font-bold">{s?.total_organizations || 471}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>With ABN (ACNC verified)</span>
                    <span className="font-bold">{s?.orgs_with_abn || 262}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indigenous-led</span>
                    <span className="font-bold text-green-600">{s?.indigenous_orgs || 197}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Linked to ALMA programs</span>
                    <span className="font-bold">{s?.orgs_linked || 527}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black p-6">
                <h3 className="font-bold text-lg mb-3">Organisation Size (ACNC)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Large charities</span>
                    <span className="font-bold">{s?.org_size_large || 143}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium charities</span>
                    <span className="font-bold">{s?.org_size_medium || 34}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Small charities</span>
                    <span className="font-bold">{s?.org_size_small || 23}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Government / unclassified</span>
                    <span className="font-bold text-gray-500">{(s?.total_organizations || 471) - (s?.org_size_large || 143) - (s?.org_size_medium || 34) - (s?.org_size_small || 23)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black p-6">
                <h3 className="font-bold text-lg mb-3">Evidence Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Evidence items collected</span>
                    <span className="font-bold text-green-600">{s?.total_evidence || 334}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evidence-program links</span>
                    <span className="font-bold">{s?.total_evidence_links || 463}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Programs verified</span>
                    <span className="font-bold">{s?.programs_verified || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discovery agent</span>
                    <span className="font-bold text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Map */}
        <section className="py-16 border-b-2 border-black bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
          <div className="container-justice">
            <div className="mb-8">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <MapIcon className="h-8 w-8 text-green-600" />
                YOUTH JUSTICE ECOSYSTEM MAP
              </h2>
              <p className="text-gray-600 mt-2">
                Explore detention facilities, community programs, and support services across Australia.
              </p>
            </div>
            <SimpleEcosystemMap height="600px" />
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Know of a program or service that should be on this map?
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-gray-800 transition-all"
              >
                Submit a Program <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="py-16 border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-8 text-center">DATA SOURCES</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border-2 border-black p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h3 className="font-bold text-lg">Government Data</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="font-bold">Productivity Commission ROGS 2024-25</li>
                  <li>Youth Justice (Table 17A)</li>
                  <li>Corrections (Table 8A)</li>
                  <li>Police (Table 6A)</li>
                  <li>Courts (Table 7A)</li>
                  <li className="font-bold mt-3">QLD Open Data Portal</li>
                  <li>52,000+ justice grants ($9B+)</li>
                </ul>
              </div>

              <div className="bg-white border-2 border-black p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="h-6 w-6 text-green-600" />
                  <h3 className="font-bold text-lg">ALMA Program Catalogue</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>{s?.programs_documented || 939} programs catalogued</li>
                  <li>{s?.total_evidence || 334} evidence items collected</li>
                  <li>{s?.programs_verified || 0} verified by humans</li>
                  <li>Autonomous AI discovery agent</li>
                  <li>Community consent levels</li>
                  <li className="text-amber-600 font-bold">Scoring under review</li>
                </ul>
              </div>

              <div className="bg-white border-2 border-black p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                  <h3 className="font-bold text-lg">ACNC Charity Register</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>{s?.orgs_with_abn || 262} orgs matched by ABN</li>
                  <li>Charity size classification</li>
                  <li>Beneficiary categories</li>
                  <li>Registration dates</li>
                  <li>Operating states</li>
                  <li>Indigenous org identification</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-6">
              EXPLORE THE DATA
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: 'white' }}>
              All data on this page is sourced from official government publications and open data portals.
              Dig deeper with our interactive tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/justice-funding" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                Justice Spending Tracker
              </Link>
              <Link href="/community-programs" className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                Community Programs
              </Link>
              <Link href="/contained/tour" className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                THE CONTAINED
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
