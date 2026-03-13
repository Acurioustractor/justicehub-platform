'use client';

import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight, Heart, Users, BarChart3, Scale, Globe, Shield,
  Building2, GraduationCap, Briefcase, MapPin, Lock, Unlock,
  DollarSign, TrendingUp, CheckCircle, Zap
} from 'lucide-react';

const audiences = [
  {
    icon: Heart,
    title: 'Community Organisations',
    subtitle: 'ATSILS, CLCs, Grassroots Orgs',
    tier: 'Free — forever',
    tierColor: 'bg-green-700',
    description:
      'You do the work. You shouldn\'t pay for data about it. Full access to Call It Out, program discovery, and basic analytics. No credit card, no trial, no upsell.',
    gets: [
      'Search 826 verified interventions',
      'Browse $8.7B in funding data',
      'Program discovery tools',
      'Up to 5 team members',
    ],
    cta: 'Get Started Free',
    ctaHref: '/login',
  },
  {
    icon: Users,
    title: 'Mid-Size NFPs & Legal Services',
    subtitle: 'Advocacy groups, Legal Aid offices, Service providers',
    tier: '$299/mo',
    tierColor: 'bg-black',
    description:
      'You need to show funders what works. Grant management, outcome tracking, and full intervention intelligence — the evidence infrastructure that makes your next application undeniable.',
    gets: [
      'Full ALMA intervention details + evidence',
      'Grant management hub',
      'Outcome tracking & compliance',
      'Org-level funding intelligence',
      'API access + data export',
      'Up to 25 team members',
    ],
    cta: 'Start 14-Day Trial',
    ctaHref: '/login?tier=organisation',
  },
  {
    icon: GraduationCap,
    title: 'Universities & Research Institutions',
    subtitle: 'Legal Aid commissions, Large charities, Think tanks',
    tier: '$2,499/mo',
    tierColor: 'bg-black',
    description:
      'You need datasets, not dashboards. Research-grade intervention data, place-based proof reports, CSV exports, and governed proof packs — without extracting from communities.',
    gets: [
      'Research datasets + CSV export',
      'Governed Proof place-based reports',
      'Custom reports',
      'Unlimited team members',
      'SLA (24h response)',
    ],
    cta: 'Contact Sales',
    ctaHref: 'mailto:benjamin@act.place?subject=JusticeHub Institution Tier',
  },
  {
    icon: Building2,
    title: 'Government Departments',
    subtitle: 'State/federal justice, Closing the Gap, Policy units',
    tier: 'Custom (~$10K/mo)',
    tierColor: 'bg-black',
    description:
      'You\'re spending billions on youth justice and can\'t tell which programs reduce reoffending. Cross-agency dashboards, policy modelling, and Closing the Gap tracking — with data that\'s actually current.',
    gets: [
      'Cross-agency data integration',
      'Policy modelling tools',
      'Closing the Gap dashboards (targets 10 & 11)',
      'Dedicated account manager',
      'Custom SLA (4h response)',
      'White-label option',
    ],
    cta: 'Talk to Us',
    ctaHref: 'mailto:benjamin@act.place?subject=JusticeHub Government Tier',
  },
];

const basecampBenefits = [
  { icon: Globe, label: 'Free mini-site on JusticeHub' },
  { icon: Unlock, label: 'Every feature unlocked — always' },
  { icon: DollarSign, label: '30% revenue share from citations' },
  { icon: Shield, label: 'Data sovereignty guaranteed' },
  { icon: Users, label: 'Self-service content management' },
  { icon: TrendingUp, label: 'Impact metrics dashboard' },
];

const dataAssets = [
  { value: '$8.7B', label: 'Justice funding tracked', detail: '51,000+ grants across all states' },
  { value: '826', label: 'Verified interventions', detail: 'Community-governed, evidence-linked' },
  { value: '64K', label: 'ACNC charities indexed', detail: 'Cross-linked with ABN + governance data' },
  { value: '7/8', label: 'States covered', detail: 'National jurisdiction mapping' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice text-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-8 max-w-5xl mx-auto leading-[0.9]">
              Community orgs get it free.<br />
              Those with budgets pay<br />
              for intelligence.
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
              JusticeHub tracks which youth justice interventions actually work — $8.7 billion in
              funding data, 826 verified programs, political donation cross-links. The communities
              most affected should never be the ones paying for the data about it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="cta-primary">
                See Pricing <ArrowRight className="inline w-5 h-5 ml-2" />
              </Link>
              <Link href="/basecamps/apply" className="cta-secondary">
                Apply as Basecamp
              </Link>
            </div>
          </div>
        </section>

        {/* The Data */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-4">
              What You Get Access To
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              The largest open dataset of Australian youth justice interventions,
              funding flows, and governance data — in one place.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {dataAssets.map((asset) => (
                <div key={asset.label} className="border-2 border-black p-6 bg-white">
                  <div className="text-4xl font-black mb-2">{asset.value}</div>
                  <div className="text-sm font-bold uppercase tracking-wider mb-2">{asset.label}</div>
                  <div className="text-xs text-gray-500">{asset.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How Access Works */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-4">
              How It Works
            </h2>
            <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
              A cross-subsidy model. Institutions and government pay for intelligence.
              That revenue funds the platform and flows back to basecamps.
            </p>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="border-2 border-black p-8 bg-white text-center">
                  <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-xl mb-3">Institutions Pay</h3>
                  <p className="text-gray-600 text-sm">
                    Universities, Legal Aid, government departments subscribe for
                    research-grade data, place-based reports, and policy dashboards.
                  </p>
                </div>

                <div className="border-2 border-black p-8 bg-white text-center">
                  <div className="w-16 h-16 bg-ochre-600 text-white flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-xl mb-3">Platform Grows</h3>
                  <p className="text-gray-600 text-sm">
                    Revenue funds more intervention cataloguing, evidence discovery,
                    and engineering — making the data better for everyone.
                  </p>
                </div>

                <div className="border-2 border-black p-8 bg-white text-center">
                  <div className="w-16 h-16 bg-green-700 text-white flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-xl mb-3">Communities Benefit</h3>
                  <p className="text-gray-600 text-sm">
                    30% of Institution+ revenue flows back to basecamps.
                    Communities get free tools and a direct revenue share
                    from their knowledge.
                  </p>
                </div>
              </div>

              {/* Revenue flow */}
              <div className="border-2 border-black bg-ochre-50 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <DollarSign className="w-6 h-6 text-ochre-700" />
                  <h3 className="font-black text-lg">Revenue Flow</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <div className="font-black text-2xl text-ochre-800 mb-1">30%</div>
                    <div className="text-gray-700">Back to basecamps via revenue share — the communities whose knowledge powers the platform</div>
                  </div>
                  <div>
                    <div className="font-black text-2xl text-gray-800 mb-1">50%</div>
                    <div className="text-gray-700">Platform operations — engineering, evidence discovery, data quality, support</div>
                  </div>
                  <div>
                    <div className="font-black text-2xl text-gray-800 mb-1">20%</div>
                    <div className="text-gray-700">Growth — new basecamps, new states, new data sources, impact measurement</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audience Breakdown */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-4">
              Built for Four Audiences
            </h2>
            <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
              Different organisations need different things. The access model reflects that.
            </p>

            <div className="space-y-8 max-w-5xl mx-auto">
              {audiences.map((audience) => {
                const Icon = audience.icon;
                return (
                  <div key={audience.title} className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="md:flex">
                      <div className="md:w-2/5 p-8 border-b-2 md:border-b-0 md:border-r-2 border-black">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 text-white ${audience.tierColor}`}>
                            {audience.tier}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black mb-1">{audience.title}</h3>
                        <p className="text-sm font-bold text-gray-500 mb-4">{audience.subtitle}</p>
                        <p className="text-gray-700 leading-relaxed">{audience.description}</p>
                      </div>
                      <div className="md:w-3/5 p-8">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">What you get</h4>
                        <ul className="grid sm:grid-cols-2 gap-3 mb-6">
                          {audience.gets.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        {audience.ctaHref.startsWith('mailto:') ? (
                          <a
                            href={audience.ctaHref}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold text-sm hover:bg-gray-800"
                          >
                            {audience.cta} <ArrowRight className="w-4 h-4" />
                          </a>
                        ) : (
                          <Link
                            href={audience.ctaHref}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold text-sm hover:bg-gray-800"
                          >
                            {audience.cta} <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Basecamps */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-5xl mx-auto">
              <div className="md:flex gap-12 items-start">
                <div className="md:w-1/2 mb-8 md:mb-0">
                  <div className="inline-flex items-center gap-2 bg-green-700 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                    <MapPin className="h-3.5 w-3.5" />
                    Basecamps
                  </div>
                  <h2 className="text-4xl font-black tracking-tight mb-6">
                    The organisations doing the work get everything. Free. Always.
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    Basecamps are Indigenous and community organisations on the ground — running youth
                    programs, cultural camps, diversion services. They get full platform access, a
                    self-service mini-site, and a direct revenue share from institutional subscriptions.
                  </p>
                  <p className="text-gray-600 mb-8">
                    This isn't charity. Basecamps are the knowledge holders. Their programs, their
                    evidence, their stories are what makes JusticeHub valuable to institutions. Revenue
                    flowing back is their right, not a favour.
                  </p>
                  <Link
                    href="/basecamps/apply"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white font-bold hover:bg-green-800"
                  >
                    Apply to Become a Basecamp <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="md:w-1/2">
                  <div className="grid grid-cols-2 gap-4">
                    {basecampBenefits.map((benefit) => {
                      const Icon = benefit.icon;
                      return (
                        <div key={benefit.label} className="border-2 border-black p-5 bg-white">
                          <Icon className="w-6 h-6 text-green-700 mb-3" />
                          <span className="text-sm font-bold">{benefit.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free vs Paid comparison */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-4">
              Free vs Paid — No Tricks
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Summaries are free. Full intelligence is paid. Basecamps get everything.
            </p>

            <div className="max-w-4xl mx-auto">
              <div className="border-2 border-black bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black bg-black text-white">
                      <th className="text-left p-4 font-black">Feature</th>
                      <th className="text-center p-4 font-black">Free</th>
                      <th className="text-center p-4 font-black">Organisation</th>
                      <th className="text-center p-4 font-black">Institution+</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Intervention summaries', free: true, org: true, inst: true },
                      { feature: 'Funding search & browse', free: true, org: true, inst: true },
                      { feature: 'Call It Out tools', free: true, org: true, inst: true },
                      { feature: 'Full intervention details + evidence', free: false, org: true, inst: true },
                      { feature: 'Grant management hub', free: false, org: true, inst: true },
                      { feature: 'Outcome tracking', free: false, org: true, inst: true },
                      { feature: 'Org-level funding intelligence', free: false, org: true, inst: true },
                      { feature: 'CSV / data export', free: false, org: false, inst: true },
                      { feature: 'Governed Proof reports', free: false, org: false, inst: true },
                      { feature: 'API access', free: false, org: false, inst: true },
                      { feature: 'Custom reports', free: false, org: false, inst: 'Enterprise' as any },
                    ].map((row) => (
                      <tr key={row.feature} className="border-b border-gray-200">
                        <td className="p-4 font-bold">{row.feature}</td>
                        <td className="text-center p-4">
                          {row.free === true ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center p-4">
                          {row.org === true ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="text-center p-4">
                          {row.inst === true ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : typeof row.inst === 'string' ? (
                            <span className="text-xs font-bold text-gray-500">{row.inst}</span>
                          ) : (
                            <Lock className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                Basecamps get the Institution column — for free.
              </p>
            </div>
          </div>
        </section>

        {/* Industry Benchmarking */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-4">
              How We Compare
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              JusticeHub is 50-75% cheaper than comparable platforms — and the only one
              that combines funding intelligence with intervention evidence and community ownership.
            </p>

            <div className="max-w-5xl mx-auto">
              {/* Pricing comparison table */}
              <div className="border-2 border-black bg-white overflow-hidden mb-12">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black bg-black text-white">
                      <th className="text-left p-4 font-black">Platform</th>
                      <th className="text-left p-4 font-black">What It Does</th>
                      <th className="text-right p-4 font-black">Annual Cost</th>
                      <th className="text-center p-4 font-black">Community Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Salesforce Nonprofit', what: 'CRM + case management', cost: '$7,200-14,400', rev: 'None', highlight: false },
                      { name: 'SocialSuite', what: 'Impact measurement', cost: '$9,500+', rev: 'None', highlight: false },
                      { name: 'Blackbaud', what: 'Fundraising + grants', cost: '$10,000+', rev: 'None', highlight: false },
                      { name: 'Bonterra (Apricot)', what: 'Case management', cost: '$5,000+', rev: 'None', highlight: false },
                      { name: 'JusticeHub Organisation', what: 'Funding intel + grants + outcomes', cost: '$3,588', rev: '30% to basecamps', highlight: true },
                      { name: 'JusticeHub Institution', what: 'Full research datasets + proof', cost: '$29,988', rev: '30% to basecamps', highlight: true },
                      { name: 'CrimeSolutions (US)', what: 'Evidence clearinghouse', cost: 'Free (gov funded)', rev: 'None', highlight: false },
                      { name: 'What Works (UK)', what: 'Evidence clearinghouse', cost: 'Free (gov funded)', rev: 'None', highlight: false },
                    ].map((row) => (
                      <tr key={row.name} className={`border-b border-gray-200 ${row.highlight ? 'bg-ochre-50' : ''}`}>
                        <td className="p-4 font-bold">{row.name}</td>
                        <td className="p-4 text-gray-600">{row.what}</td>
                        <td className="p-4 text-right font-bold">{row.cost}</td>
                        <td className="p-4 text-center">
                          {row.rev === 'None' ? (
                            <span className="text-gray-300">None</span>
                          ) : (
                            <span className="font-bold text-green-700">{row.rev}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Key differentiators */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="border-2 border-black p-6 bg-white">
                  <div className="text-4xl font-black text-green-700 mb-2">50-75%</div>
                  <div className="font-bold mb-2">Cheaper than enterprise NFP tools</div>
                  <p className="text-sm text-gray-600">
                    Salesforce Nonprofit costs $7,200-14,400/year for 10 users.
                    JusticeHub Organisation is $3,588/year for 25 users — per-org, not per-seat.
                  </p>
                </div>
                <div className="border-2 border-black p-6 bg-white">
                  <div className="text-4xl font-black text-ochre-700 mb-2">Only</div>
                  <div className="font-bold mb-2">Platform combining all three</div>
                  <p className="text-sm text-gray-600">
                    No other platform combines $8.7B in funding data + 826 verified interventions +
                    political donation cross-links. The UK and US have evidence clearinghouses.
                    None have funding intelligence.
                  </p>
                </div>
                <div className="border-2 border-black p-6 bg-white">
                  <div className="text-4xl font-black text-green-700 mb-2">30%</div>
                  <div className="font-bold mb-2">Revenue to communities</div>
                  <p className="text-sm text-gray-600">
                    No comparable data platform shares revenue with the communities whose knowledge
                    powers it. This isn't CSR — it's the business model.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Cooperative Model */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-4">
              Not a Startup. A Community Platform.
            </h2>
            <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto">
              JusticeHub borrows from the cooperative movement — the knowledge holders
              aren't just users, they're the reason the platform has value. Revenue flows accordingly.
            </p>

            <div className="max-w-5xl mx-auto">
              {/* Cooperative comparison */}
              <div className="md:flex gap-8 mb-16">
                <div className="md:w-1/2 mb-8 md:mb-0">
                  <h3 className="text-xl font-black mb-6 text-red-800">Extractive Model (Industry Standard)</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Salesforce', detail: 'Community data powers their product. $0 goes back to communities.' },
                      { label: 'Blackbaud', detail: 'NFPs pay to manage data they created. Hidden fees, lock-in.' },
                      { label: 'University research', detail: 'Extract community knowledge. Publish behind paywalls. Communities get nothing.' },
                      { label: 'Government data portals', detail: 'Collect data from communities. Aggregate it. Communities can\'t access their own data.' },
                    ].map((item) => (
                      <div key={item.label} className="border-l-4 border-red-300 pl-4">
                        <div className="font-bold text-sm">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:w-1/2">
                  <h3 className="text-xl font-black mb-6 text-green-800">Cooperative Model (JusticeHub)</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Basecamps control their data', detail: 'Self-service editing. Choose what\'s public. Revoke access anytime.' },
                      { label: '30% revenue flows back', detail: 'Not a donation. A share of the value their knowledge creates.' },
                      { label: 'Summaries are free for everyone', detail: 'The intelligence belongs to the sector. Depth is the paid product.' },
                      { label: 'Community-governed evidence', detail: 'ALMA principles ensure knowledge holders control how data is used.' },
                    ].map((item) => (
                      <div key={item.label} className="border-l-4 border-green-500 pl-4">
                        <div className="font-bold text-sm">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform co-op benchmarks */}
              <div className="border-2 border-black bg-white p-8">
                <h3 className="font-black text-lg mb-6">How Our Revenue Share Compares to Platform Cooperatives</h3>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { name: 'Up&Go', type: 'Cleaning co-op', share: '95%', context: 'to workers (5% platform fee)' },
                    { name: 'Stocksy', type: 'Photo co-op', share: '50-75%', context: 'to photographers' },
                    { name: 'Resonate', type: 'Music co-op', share: '45%', context: 'to artists' },
                    { name: 'JusticeHub', type: 'Data intelligence', share: '30%', context: 'to basecamps (knowledge holders)', highlight: true },
                  ].map((coop) => (
                    <div key={coop.name} className={`text-center p-4 ${coop.highlight ? 'border-2 border-black bg-ochre-50' : 'border border-gray-200'}`}>
                      <div className="text-3xl font-black mb-1">{coop.share}</div>
                      <div className="font-bold text-sm mb-1">{coop.name}</div>
                      <div className="text-xs text-gray-500">{coop.type}</div>
                      <div className="text-xs text-gray-600 mt-2">{coop.context}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-6">
                  Platform co-ops share revenue with workers who deliver a service.
                  JusticeHub shares revenue with communities whose <em>knowledge</em> creates value —
                  a model with no direct equivalent in the cooperative movement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Indigenous Data Sovereignty */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-5xl mx-auto">
              <div className="md:flex gap-12 items-start">
                <div className="md:w-1/2 mb-8 md:mb-0">
                  <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                    <Shield className="h-3.5 w-3.5" />
                    Data Sovereignty
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mb-6">
                    Built on CARE Principles.<br />
                    Not just compliance — conviction.
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Most platforms bolt on Indigenous data governance as an afterthought.
                    JusticeHub is architected around it. The CARE Principles for Indigenous Data
                    Governance aren't a checkbox — they shaped the business model.
                  </p>
                  <p className="text-gray-600 mb-6">
                    We align with the work of Maiam nayri Wingara (the Australian Aboriginal and
                    Torres Strait Islander Data Sovereignty Collective), the OCAP principles from
                    Canada, and Te Mana Raraunga from Aotearoa New Zealand.
                  </p>
                </div>
                <div className="md:w-1/2">
                  <div className="space-y-4">
                    {[
                      {
                        letter: 'C',
                        title: 'Collective Benefit',
                        description: 'Data ecosystems should benefit Indigenous communities. Revenue share, free access, and community-owned mini-sites ensure basecamps benefit directly.',
                        color: 'bg-green-700',
                      },
                      {
                        letter: 'A',
                        title: 'Authority to Control',
                        description: 'Communities control what data is shared, how it\'s presented, and who accesses it. Self-service editing and revocable consent are built in.',
                        color: 'bg-ochre-700',
                      },
                      {
                        letter: 'R',
                        title: 'Responsibility',
                        description: 'Those who use this data have a responsibility to the communities it describes. ALMA\'s verification workflow ensures accuracy and cultural appropriateness.',
                        color: 'bg-blue-700',
                      },
                      {
                        letter: 'E',
                        title: 'Ethics',
                        description: 'Data should be used to advance community self-determination. 30% revenue share isn\'t charity — it\'s an ethical obligation to the knowledge holders.',
                        color: 'bg-purple-700',
                      },
                    ].map((principle) => (
                      <div key={principle.letter} className="flex gap-4 border-2 border-black p-5 bg-white">
                        <div className={`w-12 h-12 ${principle.color} text-white flex items-center justify-center font-black text-xl shrink-0`}>
                          {principle.letter}
                        </div>
                        <div>
                          <h3 className="font-black mb-1">{principle.title}</h3>
                          <p className="text-sm text-gray-600">{principle.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Global alignment */}
              <div className="mt-12 border-2 border-black bg-gray-50 p-8">
                <h3 className="font-black text-lg mb-6 text-center">Global Data Sovereignty Alignment</h3>
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  {[
                    { framework: 'CARE Principles', origin: 'Global', focus: 'Indigenous data governance', status: 'Core alignment' },
                    { framework: 'OCAP', origin: 'Canada', focus: 'Ownership, Control, Access, Possession', status: 'Architectural influence' },
                    { framework: 'Maiam nayri Wingara', origin: 'Australia', focus: 'Aboriginal & Torres Strait Islander data sovereignty', status: 'Active engagement' },
                    { framework: 'Te Mana Raraunga', origin: 'Aotearoa NZ', focus: 'Maori data sovereignty', status: 'Reference framework' },
                  ].map((f) => (
                    <div key={f.framework} className="border border-gray-300 bg-white p-4">
                      <div className="font-black text-sm mb-1">{f.framework}</div>
                      <div className="text-xs text-gray-500 mb-2">{f.origin}</div>
                      <div className="text-xs text-gray-600 mb-3">{f.focus}</div>
                      <div className="text-xs font-bold text-green-700">{f.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why It Costs What It Costs */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-4">
              Where the Money Goes
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Every dollar is accounted for. No VC extraction. No exit strategy.
              This platform exists to serve communities — the business model reflects that.
            </p>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-3">
                {[
                  { category: 'Community Revenue Share', pct: 30, color: 'bg-green-600', detail: 'Direct payments to basecamps — the communities whose knowledge creates value' },
                  { category: 'Evidence Discovery & Data Quality', pct: 20, color: 'bg-ochre-600', detail: 'ALMA cataloguing, source verification, AI-assisted evidence discovery, data integrity' },
                  { category: 'Engineering & Infrastructure', pct: 20, color: 'bg-blue-600', detail: 'Platform development, hosting, security, API infrastructure, uptime' },
                  { category: 'Support & Operations', pct: 10, color: 'bg-purple-600', detail: 'Onboarding, customer support, documentation, basecamp training' },
                  { category: 'Growth & New Basecamps', pct: 15, color: 'bg-gray-600', detail: 'Expanding to new states, onboarding new basecamps, new data sources' },
                  { category: 'Reserve & Sustainability', pct: 5, color: 'bg-gray-400', detail: 'Operational reserve to ensure the platform survives downturns' },
                ].map((item) => (
                  <div key={item.category} className="border-2 border-black bg-white p-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-16 text-right font-black text-lg">{item.pct}%</div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-100 border border-gray-200 overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.pct * 3.3}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="ml-20">
                      <div className="font-bold text-sm">{item.category}</div>
                      <div className="text-xs text-gray-500">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ROI */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-12">
              The Maths
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="border-2 border-black p-8 bg-red-50">
                <div className="text-4xl font-black text-red-800 mb-2">$1.3M</div>
                <div className="text-sm font-bold uppercase tracking-wider text-red-700 mb-2">Per child per year</div>
                <div className="text-xs text-gray-600">Cost of youth detention in Australia</div>
              </div>
              <div className="border-2 border-black p-8 bg-green-50">
                <div className="text-4xl font-black text-green-800 mb-2">$100K</div>
                <div className="text-sm font-bold uppercase tracking-wider text-green-700 mb-2">Per child per year</div>
                <div className="text-xs text-gray-600">Cost of community supervision</div>
              </div>
              <div className="border-2 border-black p-8 bg-ochre-50">
                <div className="text-4xl font-black text-ochre-800 mb-2">$1.55M</div>
                <div className="text-sm font-bold uppercase tracking-wider text-ochre-700 mb-2">Saved per diversion</div>
                <div className="text-xs text-gray-600">One child diverted pays for the platform 23x</div>
              </div>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              An Institution subscription costs $2,499/month. If JusticeHub helps identify one
              effective diversion program that keeps one child out of detention, the savings are
              $1.55 million. The ROI isn't a question.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-8">
              Ready to start?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-black font-bold text-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/basecamps/apply"
                className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Apply as Basecamp
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Compare Plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
