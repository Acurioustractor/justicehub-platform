import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { Globe, ExternalLink, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const internationalApproaches = [
  {
    country: 'New Zealand',
    flag: '🇳🇿',
    approach: 'Family Group Conferencing',
    summary: 'New Zealand pioneered Family Group Conferencing in 1989, embedding Maori cultural values of whānau (family) and community responsibility into youth justice. Young offenders are diverted from courts to family-led conferences that develop culturally appropriate responses.',
    outcomes: ['80% of cases resolved without court', 'Strong cultural reconnection', 'Lower reoffending rates'],
    relevance: 'Highly applicable to Australia, especially for First Nations communities. Similar cultural context and legal frameworks.',
  },
  {
    country: 'Finland',
    flag: '🇫🇮',
    approach: 'Child Welfare First',
    summary: 'Finland treats youth offending primarily as a child welfare issue rather than a criminal justice matter. Under-15s cannot be prosecuted; 15-17 year olds receive strong welfare supports. Detention is rarely used.',
    outcomes: ['Lowest youth incarceration in Europe', 'High educational outcomes', 'Strong rehabilitation focus'],
    relevance: 'Demonstrates what\'s possible with a welfare-first approach. Requires significant policy shift.',
  },
  {
    country: 'Canada',
    flag: '🇨🇦',
    approach: 'Youth Criminal Justice Act (YCJA)',
    summary: 'Canada\'s 2003 YCJA prioritizes diversion, community-based responses, and rehabilitation. Indigenous courts and Gladue principles ensure culturally appropriate responses for First Nations youth.',
    outcomes: ['40% reduction in custody since 2003', 'Indigenous courts growing', 'Strong extrajudicial measures'],
    relevance: 'Provides legislative model for Australia. Gladue principles similar to Australian sentencing considerations.',
  },
  {
    country: 'Scotland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    approach: 'Children\'s Hearing System',
    summary: 'Scotland\'s unique system keeps most children under 16 out of courts entirely. Lay panels of trained community members make decisions focused on the child\'s needs rather than punishment.',
    outcomes: ['Community-based decision making', 'Child-centered approach', 'Lower court involvement'],
    relevance: 'Model for community panels. Could inform Australian youth justice conferencing.',
  },
  {
    country: 'Norway',
    flag: '🇳🇴',
    approach: 'Restorative Justice & Low Incarceration',
    summary: 'Norway has one of the lowest youth incarceration rates in the world. Focus on restorative justice conferencing and community service. Age of criminal responsibility is 15.',
    outcomes: ['Very low recidivism', 'High rehabilitation rates', 'Strong community reintegration'],
    relevance: 'Demonstrates effectiveness of restorative approaches at scale.',
  },
];

export default async function InternationalPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-white py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-earth-600 mb-4">
            <Link href="/youth-justice-report" className="hover:text-ochre-600">Report</Link>
            <span>/</span>
            <span>International Best Practices</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-ochre-100 border-2 border-black">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black">International Best Practices</h1>
              <p className="text-earth-600">Effective approaches from around the world</p>
            </div>
          </div>

          <p className="text-lg text-earth-700 max-w-2xl">
            What works elsewhere? We document effective youth justice approaches from
            New Zealand, Scandinavia, Canada, and other jurisdictions with relevance to Australia.
          </p>
        </div>
      </section>

      {/* Approaches */}
      <section className="py-12">
        <div className="container-justice max-w-5xl">
          <div className="space-y-8">
            {internationalApproaches.map((approach, index) => (
              <div
                key={index}
                className="border-2 border-black p-8 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="flex items-start gap-6">
                  <div className="text-5xl">{approach.flag}</div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{approach.country}</h3>
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-ochre-100 border border-black">
                        {approach.approach}
                      </span>
                    </div>

                    <p className="text-earth-700 mb-4">{approach.summary}</p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-earth-600 mb-2">
                          Key Outcomes
                        </h4>
                        <ul className="space-y-1">
                          {approach.outcomes.map((outcome, i) => (
                            <li key={i} className="text-sm text-earth-700 flex items-start gap-2">
                              <span className="text-eucalyptus-600 mt-1">✓</span>
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-earth-600 mb-2">
                          Relevance to Australia
                        </h4>
                        <p className="text-sm text-earth-700">{approach.relevance}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Lessons */}
      <section className="py-12 border-t-2 border-black bg-ochre-50">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">Key Lessons for Australia</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-l-4 border-ochre-500 pl-6">
              <h3 className="text-xl font-bold mb-2">Raise the Age</h3>
              <p className="text-earth-600">
                Most comparable nations have higher ages of criminal responsibility (14-15).
                Evidence supports raising Australia&apos;s age from 10.
              </p>
            </div>

            <div className="border-l-4 border-eucalyptus-500 pl-6">
              <h3 className="text-xl font-bold mb-2">Diversion Works</h3>
              <p className="text-earth-600">
                Every successful jurisdiction prioritizes diversion over prosecution.
                Australia can expand existing conferencing programs.
              </p>
            </div>

            <div className="border-l-4 border-ochre-500 pl-6">
              <h3 className="text-xl font-bold mb-2">Indigenous-Led Solutions</h3>
              <p className="text-earth-600">
                New Zealand and Canada show the value of Indigenous-led justice processes.
                Australia must invest in community-controlled responses.
              </p>
            </div>

            <div className="border-l-4 border-eucalyptus-500 pl-6">
              <h3 className="text-xl font-bold mb-2">Welfare Not Punishment</h3>
              <p className="text-earth-600">
                Scandinavian models demonstrate that treating youth offending as a welfare issue
                produces better outcomes than punitive responses.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/youth-justice-report/recommendations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
            >
              View Recommendations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
