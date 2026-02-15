import Link from 'next/link';
import { Lightbulb, ArrowRight, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const recommendations = [
  {
    category: 'Policy Reform',
    priority: 'high',
    items: [
      {
        title: 'Raise the minimum age of criminal responsibility to 14',
        status: 'advocating',
        evidence: 'Supported by medical, legal, and human rights bodies. Aligns with international standards.',
        action: 'Federal and state legislation required.',
      },
      {
        title: 'Mandate diversion for first-time minor offenders',
        status: 'partial',
        evidence: 'Diversion reduces recidivism by 20-40% compared to court processing.',
        action: 'Expand existing conferencing programs; legislate presumption of diversion.',
      },
      {
        title: 'Establish statutory targets to reduce Indigenous youth incarceration',
        status: 'advocating',
        evidence: 'Indigenous youth are 17x more likely to be in detention. Closing the Gap targets needed.',
        action: 'Include justice targets in Closing the Gap framework.',
      },
    ],
  },
  {
    category: 'Funding & Investment',
    priority: 'high',
    items: [
      {
        title: 'Redirect detention funding to community-based programs',
        status: 'advocating',
        evidence: 'Community programs cost 1/10th of detention with better outcomes.',
        action: 'Justice reinvestment pilots in high-need areas; redirect savings.',
      },
      {
        title: 'Fund Indigenous-controlled youth justice services',
        status: 'partial',
        evidence: 'Community-controlled programs show 2x engagement rates.',
        action: 'Direct funding to ACCOs; support capacity building.',
      },
      {
        title: 'Invest in early intervention and prevention',
        status: 'partial',
        evidence: 'Prevention delivers $3-8 return for every $1 invested.',
        action: 'Expand family support, education engagement, and mental health services.',
      },
    ],
  },
  {
    category: 'Practice & Programs',
    priority: 'medium',
    items: [
      {
        title: 'Expand restorative justice conferencing',
        status: 'partial',
        evidence: 'Restorative approaches reduce reoffending and improve victim satisfaction.',
        action: 'Train more facilitators; expand eligibility criteria.',
      },
      {
        title: 'Implement trauma-informed approaches across the system',
        status: 'partial',
        evidence: 'Most system-involved youth have trauma histories.',
        action: 'Staff training; therapeutic models in all settings.',
      },
      {
        title: 'Develop transition support for young people leaving detention',
        status: 'advocating',
        evidence: 'Critical period for reoffending is first 72 hours after release.',
        action: 'Fund dedicated transition workers; housing and education support.',
      },
    ],
  },
  {
    category: 'Data & Transparency',
    priority: 'medium',
    items: [
      {
        title: 'Publish real-time youth justice data by jurisdiction',
        status: 'partial',
        evidence: 'Transparency drives accountability and informed policy.',
        action: 'AIHW dashboard expansion; standardized data collection.',
      },
      {
        title: 'Track and report on inquiry recommendation implementation',
        status: 'advocating',
        evidence: 'Hundreds of recommendations remain unimplemented across inquiries.',
        action: 'Public implementation tracker; annual progress reports.',
      },
      {
        title: 'Fund independent program evaluations',
        status: 'partial',
        evidence: 'Evidence base is limited by lack of rigorous evaluation.',
        action: 'Require evaluation for funded programs; publish results.',
      },
    ],
  },
];

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  implemented: { label: 'Implemented', color: 'bg-eucalyptus-100 text-eucalyptus-800', icon: CheckCircle },
  partial: { label: 'Partially Implemented', color: 'bg-ochre-100 text-ochre-800', icon: Clock },
  advocating: { label: 'Advocating For', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
};

export default function RecommendationsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-eucalyptus-50 via-sand-50 to-white py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-earth-600 mb-4">
            <Link href="/youth-justice-report" className="hover:text-ochre-600">Report</Link>
            <span>/</span>
            <span>Recommendations</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-eucalyptus-100 border-2 border-black">
              <Lightbulb className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Recommendations</h1>
              <p className="text-earth-600">Evidence-based actions for reform</p>
            </div>
          </div>

          <p className="text-lg text-earth-700 max-w-2xl">
            Based on the evidence, research, and international best practices documented in this report,
            these are the key actions needed to transform youth justice in Australia.
          </p>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="py-6 border-b-2 border-black bg-white">
        <div className="container-justice max-w-5xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-eucalyptus-600">
                {recommendations.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'implemented').length, 0)}
              </div>
              <div className="text-xs uppercase tracking-wider text-earth-600">Implemented</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-ochre-600">
                {recommendations.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'partial').length, 0)}
              </div>
              <div className="text-xs uppercase tracking-wider text-earth-600">Partial Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {recommendations.reduce((sum, cat) => sum + cat.items.filter(i => i.status === 'advocating').length, 0)}
              </div>
              <div className="text-xs uppercase tracking-wider text-earth-600">Advocating For</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations by Category */}
      <section className="py-12">
        <div className="container-justice max-w-5xl">
          {recommendations.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold">{category.category}</h2>
                {category.priority === 'high' && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-red-100 text-red-800">
                    High Priority
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {category.items.map((item, itemIndex) => {
                  const status = statusLabels[item.status];
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={itemIndex}
                      className="border-2 border-black p-6 bg-white"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded ${status.color}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-bold">{item.title}</h3>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${status.color} whitespace-nowrap`}>
                              {status.label}
                            </span>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-earth-600 mb-1">
                                Evidence
                              </h4>
                              <p className="text-sm text-earth-700">{item.evidence}</p>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-earth-600 mb-1">
                                Required Action
                              </h4>
                              <p className="text-sm text-earth-700">{item.action}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 border-t-2 border-black bg-black text-white">
        <div className="container-justice max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-4">Take Action</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            This report is a living document. Help us advocate for these recommendations,
            track implementation progress, and build the evidence base for reform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup?role=steward"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold hover:bg-gray-100 transition-colors"
            >
              Become a Steward
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
