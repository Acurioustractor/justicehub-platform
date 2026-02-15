'use client';

import { useEffect, useState, forwardRef } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import Link from 'next/link';

export default function PatternStory() {
  const [currentStep, setCurrentStep] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrolled / maxScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onStepEnter = ({ data }: { data: number }) => {
    console.log('Step entered:', data);
    setCurrentStep(data);
  };

  const onStepExit = ({ data }: { data: number }) => {
    console.log('Step exited:', data);
  };

  return (
    <main className="bg-white text-black min-h-screen">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-gray-200 z-50 border-b-2 border-black">
        <div
          className="h-full bg-black transition-all duration-300"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center border-b-2 border-black">
        <div className="container-justice text-center py-20">
          <div className="text-sm uppercase tracking-widest text-gray-600 mb-4 font-bold">
            Data-Driven Investigation
          </div>

          <h1 className="headline-truth mb-8">
            The Pattern<br />
            That Changed<br />
            Everything
          </h1>

          <p className="body-truth max-w-3xl mx-auto mb-12">
            24 Community Controlled programs are proving what Indigenous communities
            have always known
          </p>

          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="border-2 border-black p-6">
              <div className="text-4xl md:text-5xl font-mono font-bold">37</div>
              <div className="text-sm text-gray-700 mt-2">Articles Analyzed</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl md:text-5xl font-mono font-bold">30</div>
              <div className="text-sm text-gray-700 mt-2">Days Tracked</div>
            </div>
            <div className="border-2 border-black p-6">
              <div className="text-4xl md:text-5xl font-mono font-bold">24</div>
              <div className="text-sm text-gray-700 mt-2">Programs Found</div>
            </div>
          </div>

          <div className="mt-12">
            <div className="text-gray-600 text-sm mb-2">Scroll to explore the data</div>
            <svg
              className="w-6 h-6 text-black mx-auto animate-bounce"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* Scrollama Sections */}
      <Scrollama onStepEnter={onStepEnter} onStepExit={onStepExit} offset={0.3}>
        <Step data={1}>
          <CrisisSection active={currentStep === 1} />
        </Step>

        <Step data={2}>
          <EvidenceSection active={currentStep === 2} />
        </Step>

        <Step data={3}>
          <CommunityWisdomSection active={currentStep === 3} />
        </Step>

        <Step data={4}>
          <DataComparisonSection active={currentStep === 4} />
        </Step>

        <Step data={5}>
          <MediaSentimentSection active={currentStep === 5} />
        </Step>

        <Step data={6}>
          <PatternRevealSection active={currentStep === 6} />
        </Step>

        <Step data={7}>
          <CallToActionSection active={currentStep === 7} />
        </Step>
      </Scrollama>

      {/* Footer Navigation */}
      <div className="py-12 px-4 border-t-2 border-black">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link
            href="/stories"
            className="text-gray-600 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Stories
          </Link>

          <Link
            href="/stories/intelligence"
            className="cta-primary"
          >
            Explore Full Data →
          </Link>
        </div>
      </div>
    </main>
  );
}

// Section Components - Using forwardRef to allow Scrollama to track them

const CrisisSection = forwardRef<HTMLElement, { active: boolean }>(({ active }, ref) => {
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-b-2 border-black">
      <div
        className={`max-w-4xl transition-all duration-1000 ${
          active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="text-center space-y-8">
          <div className="text-8xl md:text-9xl font-mono font-bold text-red-600">
            {active ? '17' : '0'}<span className="text-6xl">x</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Indigenous youth are{' '}
            <span className="bg-red-600 text-white px-2">17 times more likely</span> to be
            detained than non-Indigenous youth
          </h2>

          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            The statistics are staggering. The crisis is undeniable. But there's
            something the data reveals that changes everything.
          </p>
        </div>
      </div>
    </section>
  );
});
CrisisSection.displayName = 'CrisisSection';

const EvidenceSection = forwardRef<HTMLElement, { active: boolean }>(({ active }, ref) => {
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-b-2 border-black bg-gray-50">
      <div
        className={`max-w-5xl transition-all duration-1000 ${
          active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center border-2 border-black p-8 bg-white">
            <div className="text-9xl font-mono font-bold text-green-600 mb-4">
              {active ? '60' : '0'}<span className="text-6xl">%</span>
            </div>

            <div className="text-2xl font-bold mb-2">
              Reduction in Reoffending
            </div>

            <div className="text-lg text-gray-700">
              Cultural camps & community programs
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              The evidence has always been there
            </h2>

            <p className="text-xl text-gray-800 leading-relaxed">
              University studies show cultural immersion programs reduce
              reoffending by 40-60%. Community-led initiatives achieve completion
              rates 3x higher than government detention.
            </p>

            <p className="text-lg text-gray-600">
              When young people connect with culture, Country, and Elders, healing
              happens.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});
EvidenceSection.displayName = 'EvidenceSection';

const CommunityWisdomSection = forwardRef<HTMLElement, { active: boolean }>(({ active }, ref) => {
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-b-2 border-black">
      <div
        className={`max-w-4xl transition-all duration-1000 ${
          active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="space-y-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            "These programs work because they're{' '}
            <span className="bg-green-600 text-white px-2">designed by community</span>, for
            community"
          </h2>

          <p className="text-lg text-gray-700 italic">
            — Aunty Margaret Wilson, Yolngu Elder
          </p>

          <p className="text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed">
            Cultural connection is key to breaking the cycle. When programs are run
            by community, for community, young people engage. Cultural safety is
            everything.
          </p>

          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
            <div className="border-2 border-black p-6 bg-white">
              <div className="text-4xl font-mono font-bold mb-2">24</div>
              <div className="text-sm text-gray-700">
                Community Controlled programs tracked
              </div>
            </div>

            <div className="border-2 border-black p-6 bg-white">
              <div className="text-4xl font-mono font-bold mb-2">100%</div>
              <div className="text-sm text-gray-700">
                Have cultural authority involved
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
CommunityWisdomSection.displayName = 'CommunityWisdomSection';

const DataComparisonSection = forwardRef<HTMLElement, { active: boolean }>(({ active }, ref) => {
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-b-2 border-black bg-gray-50">
      <div className={`max-w-6xl transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Let the <span className="bg-black text-white px-2">data</span> speak
        </h2>
        <p className="text-xl text-gray-700 text-center">Community programs: Lower cost, better outcomes</p>
      </div>
    </section>
  );
});
DataComparisonSection.displayName = 'DataComparisonSection';

const MediaSentimentSection = forwardRef<HTMLElement, { active: boolean }>(({ active }, ref) => {
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-b-2 border-black">
      <div className={`max-w-5xl transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          The media is starting to <span className="bg-green-600 text-white px-2">notice</span>
        </h2>
        <p className="text-xl text-gray-700 text-center">Coverage of community programs is increasingly positive</p>
      </div>
    </section>
  );
});
MediaSentimentSection.displayName = 'MediaSentimentSection';

const PatternRevealSection = forwardRef<HTMLElement, { active: boolean }>(({ active }, ref) => {
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-b-2 border-black bg-gray-50">
      <div className={`max-w-4xl text-center transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-5xl md:text-6xl font-bold mb-8">
          The Pattern Is Clear
        </h2>
        <p className="text-2xl font-bold text-green-600 mb-6">Community knows best</p>
        <p className="text-xl text-gray-700">When Indigenous communities lead, young people thrive</p>
      </div>
    </section>
  );
});
PatternRevealSection.displayName = 'PatternRevealSection';

const CallToActionSection = forwardRef<HTMLElement, { active: boolean }>(({ active }, ref) => {
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-b-2 border-black">
      <div className={`max-w-3xl text-center transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          Ready to explore the data?
        </h2>
        <Link
          href="/stories/intelligence"
          className="cta-primary inline-block"
        >
          View Full Intelligence Dashboard →
        </Link>
      </div>
    </section>
  );
});
CallToActionSection.displayName = 'CallToActionSection';
