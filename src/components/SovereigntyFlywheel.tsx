'use client';

import React, { useState } from 'react';
import { Download, Info } from 'lucide-react';

interface FlywheelStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

const steps: FlywheelStep[] = [
  {
    id: 1,
    title: 'Community Intelligence',
    subtitle: 'Communities paid for their knowledge',
    description: 'Communities compensated fairly ($80K+ per year) to share what works. Stories, programs, cultural practices documented. Knowledge valued, not extracted.',
    icon: '🧠',
  },
  {
    id: 2,
    title: 'Platform Value Grows',
    subtitle: 'Best practice library expands',
    description: 'Evidence base grows. Practitioners find what they need. Researchers access real-world data. Platform becomes the authoritative resource for youth justice reform.',
    icon: '📈',
  },
  {
    id: 3,
    title: 'Network Effect',
    subtitle: 'More communities want in',
    description: 'Communities see others being valued and compensated. Practitioners recommend it. Funders recognise the impact. Growth accelerates organically.',
    icon: '🌐',
  },
  {
    id: 4,
    title: 'Financial Sustainability',
    subtitle: 'Value creates revenue',
    description: 'Organisations pay for access to world-class intelligence. Consulting, licensing, subscriptions generate income. Platform breaks free from grant dependency.',
    icon: '💰',
  },
  {
    id: 5,
    title: 'Systemic Change',
    subtitle: 'Youth justice transforms',
    description: 'Policy makers use evidence. Practitioners implement proven programs. Young people benefit from better care. Whole system improves based on community intelligence.',
    icon: '⚡',
  },
  {
    id: 6,
    title: 'Community Ownership',
    subtitle: 'Communities govern the platform',
    description: 'Platform legally owned by communities. They control what is shared, who benefits, how it evolves. True self-determination. Cycle strengthens.',
    icon: '👑',
  },
];

export function SovereigntyFlywheel() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const exportAsPNG = () => {
    const element = document.getElementById('flywheel-container');
    if (!element) return;

    // For now, just alert - we'd need html2canvas library for actual implementation
    alert('Export feature coming soon! For now, take a screenshot of the visual.');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              The Sovereignty Flywheel
            </h1>
            <p className="text-xl text-gray-600">
              How community intelligence builds a world-class platform and drives systemic change
            </p>
          </div>
          <button
            onClick={exportAsPNG}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
          <p className="text-gray-700">
            <strong>💡 How to use:</strong> Click on any segment to learn more. Each step makes the next step easier,
            creating a self-reinforcing cycle that builds toward community ownership.
          </p>
        </div>
      </div>

      {/* Main Visual Container */}
      <div id="flywheel-container" className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12 border-4 border-gray-100">

        {/* The Why - Top Banner */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-lg">
            <div className="text-sm font-semibold uppercase tracking-wide mb-1">The Why</div>
            <div className="text-lg font-bold">
              Break Dependency • Indigenous Sovereignty • Fair Compensation
            </div>
          </div>
        </div>

        {/* Flywheel Circle */}
        <div className="relative max-w-4xl mx-auto mb-12">
          {/* Center Goal */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-full w-64 h-64 flex flex-col items-center justify-center shadow-2xl border-8 border-white">
              <div className="text-6xl mb-3">🎯</div>
              <div className="text-2xl font-bold text-center leading-tight">
                COMMUNITY
                <br />
                SOVEREIGNTY
              </div>
              <div className="text-sm opacity-90 mt-2">The Goal</div>
            </div>
          </div>

          {/* Flywheel Steps in Circle */}
          <div className="relative w-full aspect-square max-w-3xl mx-auto">
            {steps.map((step, index) => {
              const totalSteps = steps.length;
              const angle = (index * 360) / totalSteps - 90; // Start at top
              const radius = 42; // Percentage from center

              // Calculate position
              const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
              const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

              const isActive = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer group"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                  onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                >
                  {/* Step Circle */}
                  <div
                    className={`relative transition-all duration-300 ${
                      isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
                    }`}
                  >
                    <div
                      className={`w-32 h-32 rounded-full flex flex-col items-center justify-center text-center shadow-xl border-4 transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-white shadow-2xl'
                          : 'bg-white border-gray-300 group-hover:border-blue-400'
                      }`}
                    >
                      <div className={`text-4xl mb-1 ${isActive ? '' : 'grayscale group-hover:grayscale-0'}`}>
                        {step.icon}
                      </div>
                      <div className={`text-xs font-bold px-2 leading-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {step.title}
                      </div>
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {step.id}
                    </div>
                  </div>

                  {/* Arrow pointing to next step */}
                  {index < totalSteps - 1 && (
                    <div
                      className="absolute top-1/2 left-full ml-2"
                      style={{
                        transform: `rotate(${(360 / totalSteps)}deg)`,
                      }}
                    >
                      <div className="text-2xl opacity-50">→</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Step Details */}
        {activeStep && (
          <div className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{steps[activeStep - 1].icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Step {activeStep}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {steps[activeStep - 1].title}
                  </h3>
                </div>
                <p className="text-lg text-blue-700 font-semibold mb-3">
                  {steps[activeStep - 1].subtitle}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {steps[activeStep - 1].description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mb-12 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border-2 border-green-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How It Works: From Community Knowledge to Better Outcomes
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: 'Step 1',
                title: 'Communities Share',
                desc: 'Communities document what works - their programs, their stories, their cultural practices. They are compensated fairly for this intelligence.',
                icon: '🗣️',
                color: 'from-green-400 to-green-600',
              },
              {
                step: 'Step 2',
                title: 'Platform Connects',
                desc: 'Stories, programs, and evidence are documented, tagged, connected. A practitioner in Darwin finds what works in Alice Springs. Researchers access real data.',
                icon: '🔗',
                color: 'from-blue-400 to-blue-600',
              },
              {
                step: 'Step 3',
                title: 'Young People Benefit',
                desc: 'Practitioners implement proven approaches. Policy shifts toward what works. Young people get better care, stay with family, heal with culture.',
                icon: '🌟',
                color: 'from-purple-400 to-purple-600',
              },
            ].map((stage, i) => (
              <div key={i} className="relative">
                <div className={`bg-gradient-to-br ${stage.color} text-white p-6 rounded-xl shadow-lg h-full`}>
                  <div className="text-4xl mb-3">{stage.icon}</div>
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-2">
                    {stage.step}
                  </div>
                  <div className="text-xl font-bold mb-3">{stage.title}</div>
                  <div className="text-sm leading-relaxed opacity-95">{stage.desc}</div>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-3xl text-green-600">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center bg-white rounded-lg p-4 border-2 border-green-300">
            <p className="text-gray-900 font-semibold">
              It's this simple: value community knowledge → create world-class resource → transform youth justice → save lives
            </p>
          </div>
        </div>

        {/* What's On The Platform */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            What's On The Platform: Intelligence That Changes Lives
          </h3>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[
              {
                title: 'Stories From Young People',
                desc: 'Real voices, lived experiences. What actually helps. What makes things worse. The truth about the system from those who know it best.',
                icon: '💬',
                impact: 'Practitioners hear directly from young people',
              },
              {
                title: 'Programs That Work',
                desc: 'Community-led approaches proven in the real world. Not academic theories—actual programs keeping kids out of detention and supporting healing.',
                icon: '🌱',
                impact: 'Policy makers see what communities achieve',
              },
              {
                title: 'Best Practice Evidence',
                desc: 'What works in Alice Springs. What works in Bourke. What works internationally. Documented, connected, accessible to anyone working with young people.',
                icon: '📊',
                impact: 'Practitioners access proven approaches instantly',
              },
              {
                title: 'Cultural Knowledge',
                desc: 'How culture heals. How connection to country transforms. How elders guide. The wisdom that mainstream systems ignore.',
                icon: '🪃',
                impact: 'Young people reconnect with culture and identity',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-6 border-2 border-white/20">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-4xl">{item.icon}</span>
                  <h4 className="text-lg font-bold">{item.title}</h4>
                </div>
                <p className="text-sm leading-relaxed opacity-90 mb-3">
                  {item.desc}
                </p>
                <div className="pt-3 border-t border-white/20">
                  <p className="text-xs font-semibold text-blue-200">
                    → {item.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center bg-white/10 rounded-lg p-4">
            <p className="text-lg font-semibold">
              This isn't just a database. It's the evidence base for transforming how we care for young people in crisis.
            </p>
          </div>
        </div>

        {/* The Impact */}
        <div className="mt-12 text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 border-2 border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Why This Matters: Real Impact for Young People</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
            {[
              {
                title: 'Young People Get Better Care',
                desc: 'Practitioners use approaches proven to work—not punitive systems that cause more harm.',
                icon: '❤️',
              },
              {
                title: 'Families Stay Connected',
                desc: 'Programs that keep kids with family and on country, instead of locked away in detention.',
                icon: '👨‍👩‍👧‍👦',
              },
              {
                title: 'Culture Becomes Central',
                desc: 'Healing through connection to culture, elders, and country—not punishment and isolation.',
                icon: '🌏',
              },
              {
                title: 'Communities Lead Change',
                desc: 'Those closest to the problem design the solutions—not distant bureaucrats.',
                icon: '✊',
              },
              {
                title: 'Evidence Replaces Ideology',
                desc: 'Policy based on what actually works for young people, not political point-scoring.',
                icon: '📖',
              },
              {
                title: 'The System Transforms',
                desc: 'From punitive detention to healing and support. From harm to care. Because we finally listen.',
                icon: '⚖️',
              },
            ].map((impact, i) => (
              <div key={i} className="bg-white rounded-lg p-5 border-2 border-orange-200 shadow-sm">
                <div className="text-4xl mb-3">{impact.icon}</div>
                <h4 className="font-bold text-gray-900 mb-2">{impact.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{impact.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-white rounded-lg p-6 max-w-3xl mx-auto border-2 border-orange-300">
            <p className="text-lg font-bold text-gray-900 mb-2">
              This is about young people's futures.
            </p>
            <p className="text-gray-700">
              Every young person who gets support instead of detention. Every family that stays together.
              Every community that reclaims its kids. That's what this platform makes possible.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-gray-900 mb-2">What is a Flywheel?</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                A flywheel is a self-reinforcing cycle where each step makes the next step easier.
                Unlike linear programs that end when funding stops, flywheels build momentum that
                becomes self-sustaining. For JusticeHub, this means the more communities engage,
                the more valuable the platform becomes, which attracts more communities.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">🎯</span>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Why Community Intelligence?</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Communities know what works. They've developed effective approaches through lived
                experience. But this knowledge stays local, uncompensated, and invisible to the
                broader system. JusticeHub makes community intelligence the foundation for
                evidence-based reform—valued, compensated, and driving systemic change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
