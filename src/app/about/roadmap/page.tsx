import { Navigation, Footer } from '@/components/ui/navigation';

export const metadata = {
  title: 'Our Roadmap | JusticeHub',
  description: 'Our three-year journey from proving the model to transferring ownership to communities. Including international learning mission June 2026.',
};

const phases = [
  {
    id: 'prove',
    year: '2026',
    title: 'Prove It',
    subtitle: 'Does physical + digital integration work?',
    status: 'in-progress',
    description: 'PRF Fellowship research testing whether Contained installations combined with JusticeHub platform create deeper engagement than either alone.',
    milestones: [
      { text: 'Fellowship begins (March 2026)', complete: true },
      { text: 'Contained installation #1', complete: false },
      { text: 'First community revenue share', complete: false },
      { text: 'International trip (June 2026)', complete: false },
      { text: '10 grassroots orgs onboarded', complete: false },
    ],
    funding: 'Mindaroo Year 1: $1M',
  },
  {
    id: 'international',
    year: 'June 2026',
    title: 'International Learning',
    subtitle: 'Learn from global best practice',
    status: 'planned',
    description: 'Research mission to Spain, Netherlands, and potentially Norway to document youth justice models that work better than Australia\'s.',
    milestones: [
      { text: 'Spain: Diagrama Foundation', complete: false },
      { text: 'Netherlands: Diversion models', complete: false },
      { text: 'Partnership agreements signed', complete: false },
      { text: '"What Australia Can Learn" report', complete: false },
    ],
    funding: 'International partnerships: $150K',
  },
  {
    id: 'scale',
    year: '2027',
    title: 'Scale It',
    subtitle: 'Can communities earn sustainable income?',
    status: 'planned',
    description: 'Apply international learnings, scale from 3 to 20+ communities, and prove the revenue model works.',
    milestones: [
      { text: '20+ communities on JusticeHub', complete: false },
      { text: '$50K+ distributed to communities', complete: false },
      { text: '5 communities earning >$5K/year', complete: false },
      { text: 'Revenue transparency report', complete: false },
    ],
    funding: 'Mindaroo Year 2: $1.25M',
  },
  {
    id: 'own',
    year: '2028',
    title: 'Own It',
    subtitle: 'Does community ownership actually work?',
    status: 'planned',
    description: 'Transfer legal ownership to community-governed structure. Indigenous Advisory Board operational with veto power.',
    milestones: [
      { text: 'Legal ownership transfer complete', complete: false },
      { text: 'Community governance established', complete: false },
      { text: '60-70% self-sustainability achieved', complete: false },
      { text: 'Platform operates independently', complete: false },
    ],
    funding: 'Mindaroo Year 3: $1.25M',
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles = {
    complete: 'bg-green-100 text-green-900 border border-green-300',
    'in-progress': 'bg-ochre-100 text-ochre-900 border border-ochre-300',
    planned: 'bg-eucalyptus-100 text-eucalyptus-900 border border-eucalyptus-300',
  };
  const labels = {
    complete: 'Complete',
    'in-progress': 'In Progress',
    planned: 'Planned',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

function MilestoneItem({ text, complete }: { text: string; complete: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${complete ? 'bg-green-500 border-green-600' : 'bg-white border-neutral-400'}`}>
        {complete && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </span>
      <span className={complete ? 'text-neutral-900 font-medium' : 'text-neutral-600'}>{text}</span>
    </li>
  );
}

export default function RoadmapPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="header-offset">
        {/* Hero */}
        <section className="bg-neutral-900 text-white py-20 md:py-28 border-b-2 border-black">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-ochre-400 font-medium mb-4">2026—2028</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Where We're Going
              </h1>
              <p className="text-xl text-neutral-300 leading-relaxed">
                A three-year journey from proving the model to transferring ownership 
                to communities—including an international learning mission in June 2026.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline Visual */}
        <section className="py-16 bg-sand-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-stretch">
              {phases.filter(p => p.id !== 'international').map((phase, index) => (
                <div key={phase.id} className="flex-1 relative">
                  {/* Connector line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-ochre-300" />
                  )}
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold mb-4 border-2 ${
                      phase.status === 'complete' ? 'bg-green-500 text-white border-green-600' :
                      phase.status === 'in-progress' ? 'bg-ochre-500 text-white border-ochre-600' :
                      'bg-white text-neutral-700 border-neutral-300'
                    }`}>
                      {phase.year.slice(-2)}
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 leading-tight">{phase.title}</h3>
                    <p className="text-sm text-neutral-600 mt-2 leading-relaxed px-2">{phase.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* International trip highlight */}
            <div className="mt-8 md:mt-12 relative">
              <div className="hidden md:block absolute left-1/4 right-1/4 top-0 h-0.5 bg-gradient-to-r from-ochre-300 via-ochre-500 to-ochre-300" />
              <div className="bg-ochre-50 border-2 border-ochre-200 rounded-2xl p-6 md:p-8 text-center max-w-2xl mx-auto relative">
                <span className="inline-block px-3 py-1 bg-ochre-500 text-white text-sm font-medium rounded-full mb-3">
                  June 2026
                </span>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">International Learning Mission</h3>
                <p className="text-neutral-600">
                  Spain. Netherlands. Global best practice. Bringing lessons back to inform 
                  both the fellowship and scaling phases.
                </p>
                <a 
                  href="/international-exchange" 
                  className="inline-block mt-4 text-ochre-700 font-medium hover:text-ochre-800"
                >
                  Learn more about the trip →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Phases */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid gap-12">
              {phases.map((phase, index) => (
                <div 
                  key={phase.id}
                  id={phase.id}
                  className={`grid md:grid-cols-12 gap-8 pb-12 ${index < phases.length - 1 ? 'border-b border-neutral-200' : ''}`}
                >
                  {/* Left column - Year & Status */}
                  <div className="md:col-span-3">
                    <div className="sticky top-24">
                      <p className="text-5xl font-bold text-neutral-300">{phase.year}</p>
                      <div className="mt-4">
                        <StatusBadge status={phase.status} />
                      </div>
                      <p className="mt-4 text-sm font-medium text-neutral-600">{phase.funding}</p>
                    </div>
                  </div>

                  {/* Right column - Details */}
                  <div className="md:col-span-9">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-3">{phase.title}</h2>
                    <p className="text-lg text-ochre-800 font-semibold mb-4">{phase.subtitle}</p>
                    <p className="text-neutral-700 mb-8 leading-relaxed text-lg">{phase.description}</p>

                    <div className="bg-sand-50 rounded-xl p-6 border border-neutral-200">
                      <h4 className="font-bold text-neutral-900 mb-4 text-lg">Key Milestones</h4>
                      <ul className="space-y-3">
                        {phase.milestones.map((milestone, i) => (
                          <MilestoneItem key={i} {...milestone} />
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2036 Vision */}
        <section className="py-20 bg-neutral-900 text-white border-t-2 border-black">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-ochre-400 font-medium mb-4">2036</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The Long View</h2>
              <div className="space-y-6 text-neutral-300">
                <p className="text-lg">
                  JusticeHub is community-owned and governed. $10M+ flows to community programs annually. 
                  An international network connects Australia, New Zealand, Canada, and beyond.
                </p>
                <p>
                  But more importantly: communities control their own narratives. Knowledge creators are 
                  compensated fairly. Systems change because communities lead—not because researchers convince.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Get Involved */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">Get Involved</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-sand-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">For Communities</h3>
                <p className="text-neutral-600 mb-4">Share your solutions and get paid when your knowledge creates value.</p>
                <a href="/stories/share" className="text-ochre-700 font-medium hover:text-ochre-800">
                  Share your story →
                </a>
              </div>
              <div className="bg-sand-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">For Funders</h3>
                <p className="text-neutral-600 mb-4">Support the transition to community ownership and sustainable infrastructure.</p>
                <a href="/contact" className="text-ochre-700 font-medium hover:text-ochre-800">
                  Partner with us →
                </a>
              </div>
              <div className="bg-sand-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">For Practitioners</h3>
                <p className="text-neutral-600 mb-4">Learn from international best practice and find what works.</p>
                <a href="/centre-of-excellence" className="text-ochre-700 font-medium hover:text-ochre-800">
                  Explore solutions →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Last Updated */}
        <section className="py-8 border-t border-neutral-200">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-neutral-500">
            <p>Last updated: February 2026</p>
            <p className="mt-1">Next milestone: Contained installation #1 (April 2026)</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
