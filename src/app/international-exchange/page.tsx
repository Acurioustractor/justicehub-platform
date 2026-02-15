import { Navigation, Footer } from '@/components/ui/navigation';

export const metadata = {
  title: 'International Exchange | JusticeHub',
  description: 'Learning from global youth justice innovation. Research mission June 2026: Spain, Netherlands, and beyond.',
};

const destinations = [
  {
    country: 'Spain',
    organization: 'Diagrama Foundation',
    focus: 'Rehabilitation over punishment',
    outcome: '73% success rate, 3% reoffending',
    description: 'Spain\'s Diagrama Foundation operates a model where young people live in small group homes rather than detention centres. The focus is on education, therapy, and reintegration—not punishment.',
    learnings: [
      'Small group homes vs. large detention centres',
      'Therapeutic rather than punitive approach',
      'Education and vocational training as core',
      'Family reintegration support',
    ],
  },
  {
    country: 'Netherlands',
    organization: 'Youth Care & Justice System',
    focus: 'Diversion and community alternatives',
    outcome: 'Lowest youth incarceration in Europe',
    description: 'The Netherlands has one of the lowest youth incarceration rates in Europe. Their system prioritizes diversion, community-based programs, and keeping young people connected to family and school.',
    learnings: [
      'Diversion as default, not exception',
      'Community-based alternatives infrastructure',
      'Family-centered intervention models',
      'Integration with education and employment',
    ],
  },
  {
    country: 'Norway',
    organization: 'Bastøy Prison & Youth System',
    focus: 'Human dignity in justice',
    outcome: 'Lowest recidivism globally',
    description: 'Norway\'s approach treats young people with dignity even when they\'ve caused harm. The focus is on what happened to the young person, not just what they did.',
    learnings: [
      'Dignity-centered justice approach',
      'Understanding trauma and circumstances',
      'Restorative practices integration',
      'Long-term outcomes focus',
    ],
  },
];

const comparisonPoints = [
  {
    aspect: 'Daily Cost',
    australia: '$2,355 per day (Brisbane Youth Detention)',
    international: '$150-400 per day (community-based models)',
  },
  {
    aspect: 'Reoffending Rate',
    australia: '84% within 2 years (Brisbane)',
    international: '3-27% (varies by model)',
  },
  {
    aspect: 'Default Response',
    australia: 'Detention for serious offences',
    international: 'Community-based alternatives for most',
  },
  {
    aspect: 'Focus',
    australia: 'Punishment and control',
    international: 'Rehabilitation and reintegration',
  },
  {
    aspect: 'Family Connection',
    australia: 'Often disrupted',
    international: 'Preserved and strengthened',
  },
];

export default function InternationalExchangePage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="header-offset">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ochre-500 to-ochre-600 text-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-ochre-100 font-medium mb-4">June 2026</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                International Learning Mission
              </h1>
              <p className="text-xl text-ochre-100 leading-relaxed">
                Not a holiday. A research mission to learn from youth justice systems 
                that actually work—and bring those lessons back to Australia.
              </p>
            </div>
          </div>
        </section>

        {/* The Why */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">Why We're Going</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  Australia locks up young people at rates that would shock most Europeans. 
                  In Queensland, Brisbane Youth Detention costs <strong>$2,355 per day</strong> and 
                  has an <strong>84% reoffending rate</strong>.
                </p>
                <p>
                  Meanwhile, countries like Spain achieve <strong>73% success rates</strong> with 
                  <strong>3% reoffending</strong>—at a fraction of the cost. The Netherlands has one 
                  of the lowest youth incarceration rates in the world.
                </p>
                <p>
                  These aren't just statistics. They represent thousands of young lives. 
                  And they prove that better systems are possible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-sand-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">Australia vs. International Models</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-100 border-b-2 border-black">
                  <tr>
                    <th className="text-left px-6 py-4 font-bold text-neutral-900">Aspect</th>
                    <th className="text-left px-6 py-4 font-bold text-neutral-900">Australia</th>
                    <th className="text-left px-6 py-4 font-bold text-ochre-800">International</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {comparisonPoints.map((point, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 font-bold text-neutral-900">{point.aspect}</td>
                      <td className="px-6 py-4 text-neutral-700">{point.australia}</td>
                      <td className="px-6 py-4 text-ochre-800 font-bold">{point.international}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-neutral-900 mb-12">Where We're Going</h2>
            <div className="grid gap-8">
              {destinations.map((dest, index) => (
                <div key={index} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                  <div className="grid md:grid-cols-3">
                    {/* Left - Country & Org */}
                    <div className="bg-neutral-900 text-white p-8 flex flex-col justify-center border-r-2 border-black">
                      <p className="text-4xl font-bold mb-2">{dest.country}</p>
                      <p className="text-ochre-400 font-medium">{dest.organization}</p>
                    </div>
                    
                    {/* Middle - Description */}
                    <div className="p-8 md:col-span-2">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-eucalyptus-100 text-eucalyptus-900 text-sm font-bold rounded-full border border-eucalyptus-200">
                          {dest.focus}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-900 text-sm font-bold rounded-full border border-green-200">
                          {dest.outcome}
                        </span>
                      </div>
                      <p className="text-neutral-600 mb-6 leading-relaxed">{dest.description}</p>
                      <div>
                        <p className="font-bold text-neutral-900 mb-3">What We'll Learn:</p>
                        <ul className="grid md:grid-cols-2 gap-3">
                          {dest.learnings.map((learning, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-ochre-600 mt-1 flex-shrink-0">→</span>
                              <span className="text-neutral-700">{learning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Mission */}
        <section className="py-20 bg-ochre-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-6">What We're Bringing Back</h2>
                <div className="space-y-4 text-neutral-700">
                  <p className="text-lg leading-relaxed">
                    This isn't tourism. It's research with deliverables that will shape 
                    JusticeHub and potentially influence Australian youth justice policy.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-ochre-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <span><strong>Video documentary series:</strong> Interviews with international practitioners, young people, and system leaders</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-ochre-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <span><strong>"What Australia Can Learn" report:</strong> Specific recommendations transferable to Australian context</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-ochre-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <span><strong>Partnership agreements:</strong> Formal relationships for ongoing knowledge exchange</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-ochre-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <span><strong>Platform features:</strong> International comparison tools on JusticeHub</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">Trip Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-20 text-sm font-bold text-neutral-700">Week 1</div>
                    <div>
                      <p className="font-bold text-neutral-900">Spain</p>
                      <p className="text-sm text-neutral-600">Diagrama Foundation, Madrid</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-20 text-sm font-bold text-neutral-700">Week 2</div>
                    <div>
                      <p className="font-bold text-neutral-900">Netherlands</p>
                      <p className="text-sm text-neutral-600">Youth Justice & Care system</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-20 text-sm font-bold text-neutral-700">Week 3</div>
                    <div>
                      <p className="font-bold text-neutral-900">Norway (TBC)</p>
                      <p className="text-sm text-neutral-600">Bastøy and youth models</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <p className="text-sm text-neutral-500">
                    <strong>Returns:</strong> July 2026 with findings published by September 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Connects */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">How This Connects to Everything</h2>
            <div className="bg-neutral-900 text-white rounded-2xl p-8 md:p-12 border-2 border-black">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <p className="text-ochre-400 font-medium mb-2">PRF Fellowship</p>
                  <p className="text-neutral-300">
                    International learnings inform the second half of the research—testing 
                    whether Australian communities can adopt and adapt global best practices.
                  </p>
                </div>
                <div>
                  <p className="text-ochre-400 font-medium mb-2">Mindaroo Funding</p>
                  <p className="text-neutral-300">
                    Year 2 scaling is shaped by international insights. What works elsewhere? 
                    What needs Australian adaptation?
                  </p>
                </div>
                <div>
                  <p className="text-ochre-400 font-medium mb-2">JusticeHub Platform</p>
                  <p className="text-neutral-300">
                    New features: International comparison tools, "Could this work here?" 
                    analysis, and global best practice database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Follow Along */}
        <section className="py-20 bg-sand-50">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Follow the Journey</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
              We'll be documenting everything—video interviews, written reflections, 
              and real-time updates from the road.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="/about/roadmap" 
                className="inline-flex items-center px-6 py-3 bg-ochre-500 text-white rounded-lg font-medium hover:bg-ochre-600 transition-colors"
              >
                View Full Roadmap
              </a>
              <a 
                href="/stories" 
                className="inline-flex items-center px-6 py-3 bg-white text-neutral-700 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Read Stories
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
