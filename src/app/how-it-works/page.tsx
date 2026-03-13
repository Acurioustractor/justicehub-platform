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
