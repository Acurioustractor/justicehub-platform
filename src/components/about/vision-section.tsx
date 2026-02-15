import { SectionHeading } from "@/components/section-heading";

const visionTimeline = [
  {
    phase: "Foundation",
    timeframe: "2024-2025",
    status: "In Progress",
    milestones: [
      "Complete 1,000 transformation experiences",
      "Launch CON|X digital platform (Feb 2025)",
      "Establish partnerships in 5 Australian states",
      "Document and publish transformation methodology"
    ],
    description: "Proving the model works at scale in Australia"
  },
  {
    phase: "Expansion",
    timeframe: "2025-2027",
    status: "Planned",
    milestones: [
      "Build 10 additional container installations",
      "International partnerships in New Zealand & Pacific",
      "Train 100 certified transformation facilitators",
      "Integrate with 25+ youth justice systems"
    ],
    description: "Regional expansion and methodology replication"
  },
  {
    phase: "Revolution",
    timeframe: "2027-2030",
    status: "Vision",
    milestones: [
      "Transform youth justice in 50+ jurisdictions",
      "CON|X platform serves 10,000+ young people",
      "Research proves transformation cost-effectiveness",
      "Policy change at national and international levels"
    ],
    description: "Systemic transformation of youth justice globally"
  },
  {
    phase: "Legacy",
    timeframe: "2030+",
    status: "Future",
    milestones: [
      "Detention becomes obsolete for young people",
      "Transformation becomes standard practice",
      "Global network of healing-centered facilities",
      "Next generation grows up in transformed systems"
    ],
    description: "A world where no child is seen as disposable"
  }
];

const globalVision = [
  {
    region: "Australia & New Zealand",
    status: "Active",
    goal: "Transform Pacific youth justice systems",
    timeline: "2024-2026",
    progress: 65,
    keyPartners: ["Diagrama Foundation", "Youth Advocacy Centre", "Interlace Advisory"]
  },
  {
    region: "North America",
    status: "Planning",
    goal: "Address school-to-prison pipeline",
    timeline: "2026-2028",
    progress: 15,
    keyPartners: ["TBD - Seeking partnerships"]
  },
  {
    region: "Europe",
    status: "Research",
    goal: "Integrate with progressive justice models",
    timeline: "2027-2029",
    progress: 25,
    keyPartners: ["Diagrama Foundation Spain", "EU Youth Justice Network"]
  },
  {
    region: "Global South",
    status: "Vision",
    goal: "Address juvenile justice in developing nations",
    timeline: "2028+",
    progress: 5,
    keyPartners: ["UN agencies", "Local advocacy organizations"]
  }
];

const systemChanges = [
  {
    title: "Policy Transformation",
    description: "Evidence-based policy change that prioritizes healing over punishment",
    icon: "⚖️",
    currentState: "Detention-first approach",
    futureState: "Transformation-first intervention",
    impact: "Reduced recidivism, saved lives, economic benefits"
  },
  {
    title: "Professional Development",
    description: "Training justice workers in trauma-informed, healing-centered approaches",
    icon: "🎓",
    currentState: "Compliance-focused training",
    futureState: "Transformation methodology certification",
    impact: "Better outcomes, job satisfaction, community trust"
  },
  {
    title: "Infrastructure Revolution",
    description: "Replacing detention centers with healing-centered facilities",
    icon: "🏗️",
    currentState: "Cage-like detention facilities",
    futureState: "Dignified transformation spaces",
    impact: "Human dignity, successful interventions, cost savings"
  },
  {
    title: "Community Integration",
    description: "Involving communities in the healing and transformation process",
    icon: "🌍",
    currentState: "Isolated, punitive systems",
    futureState: "Community-embedded support networks",
    impact: "Stronger communities, prevention focus, collective healing"
  }
];

const measurableGoals = [
  {
    metric: "50,000",
    description: "Young people experiencing transformation by 2030",
    currentProgress: "500+",
    progressPercent: 1
  },
  {
    metric: "100",
    description: "Jurisdictions implementing transformation approaches",
    currentProgress: "15",
    progressPercent: 15
  },
  {
    metric: "80%",
    description: "Reduction in youth reoffending rates",
    currentProgress: "73%",
    progressPercent: 91
  },
  {
    metric: "$10B",
    description: "Economic savings from transformation approaches",
    currentProgress: "$50M",
    progressPercent: 0.5
  }
];

export function VisionSection() {
  return (
    <section id="vision" className="bg-color-container-black py-24">
      <div className="mx-auto max-w-6xl px-6 space-y-20">
        <SectionHeading
          eyebrow="The Future We're Building"
          title="Vision 2030: A World Without Cages"
          description="Revolution doesn't stop at three containers. This is just the beginning of a transformation that will make youth detention as obsolete as orphanages, as unthinkable as child labor."
          align="center"
        />

        {/* Vision timeline */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Transformation Roadmap
          </h3>

          <div className="space-y-6">
            {visionTimeline.map((phase, index) => (
              <div key={index} className={`relative p-6 rounded-2xl border-l-4 ${
                phase.status === 'In Progress'
                  ? 'bg-color-hope-green/10 border-l-color-hope-green'
                  : phase.status === 'Planned'
                  ? 'bg-color-warning-orange/10 border-l-color-warning-orange'
                  : 'bg-white/5 border-l-white/30'
              }`}>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-display text-lg uppercase tracking-tight text-white">
                        {phase.phase}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        phase.status === 'In Progress'
                          ? 'bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30'
                          : phase.status === 'Planned'
                          ? 'bg-color-warning-orange/20 text-color-warning-orange border border-color-warning-orange/30'
                          : 'bg-white/10 text-white/70 border border-white/20'
                      }`}>
                        {phase.status}
                      </span>
                    </div>
                    <div className="text-sm text-white/60">
                      {phase.timeframe}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {phase.description}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <h5 className="text-sm font-semibold text-white/90 mb-3 uppercase tracking-wide">
                      Key Milestones:
                    </h5>
                    <ul className="space-y-2">
                      {phase.milestones.map((milestone, i) => (
                        <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                          <span className="text-color-hope-green mt-0.5">✓</span>
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global expansion map */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Global Transformation Network
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {globalVision.map((region, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-color-hope-green">
                      {region.region}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      region.status === 'Active'
                        ? 'bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30'
                        : region.status === 'Planning'
                        ? 'bg-color-warning-orange/20 text-color-warning-orange border border-color-warning-orange/30'
                        : 'bg-white/10 text-white/70 border border-white/20'
                    }`}>
                      {region.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-white/80">
                      <strong>Goal:</strong> {region.goal}
                    </p>
                    <p className="text-sm text-white/60">
                      <strong>Timeline:</strong> {region.timeline}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>Progress</span>
                      <span>{region.progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-color-hope-green h-2 rounded-full transition-all duration-300"
                        style={{ width: `${region.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-white/60 uppercase tracking-wide">Key Partners:</p>
                    <div className="flex flex-wrap gap-1">
                      {region.keyPartners.map((partner, i) => (
                        <span key={i} className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded">
                          {partner}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System changes */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Systematic Transformation
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {systemChanges.map((change, index) => (
              <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{change.icon}</span>
                    <h4 className="font-semibold text-color-hope-green">
                      {change.title}
                    </h4>
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed">
                    {change.description}
                  </p>

                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-white/60 uppercase tracking-wide">Current:</span>
                        <p className="text-white/80 mt-1">{change.currentState}</p>
                      </div>
                      <div>
                        <span className="text-white/60 uppercase tracking-wide">Future:</span>
                        <p className="text-color-hope-green mt-1">{change.futureState}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-white/60 uppercase tracking-wide text-xs">Impact:</span>
                      <p className="text-white/80 text-xs mt-1">{change.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Measurable goals */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Measurable Impact Goals
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {measurableGoals.map((goal, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-gradient-to-br from-color-warning-orange/10 to-color-hope-green/10 border border-color-warning-orange/20">
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-color-warning-orange">
                    {goal.metric}
                  </div>
                  <div className="text-sm text-white/80 leading-relaxed">
                    {goal.description}
                  </div>

                  {/* Progress indicator */}
                  <div className="space-y-2">
                    <div className="text-xs text-white/60">
                      Current: {goal.currentProgress}
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div
                        className="bg-color-hope-green h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center space-y-6 p-8 rounded-3xl bg-gradient-to-r from-color-container-steel/60 to-color-container-black/80 border border-white/10">
          <h3 className="font-display text-xl uppercase tracking-tight text-color-hope-green">
            Join the Revolution
          </h3>
          <p className="text-white/90 max-w-3xl mx-auto text-lg leading-relaxed">
            This vision isn't a dream - it's a plan. Every container built, every experience delivered,
            every mind changed brings us closer to a world where no child is seen as disposable.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#get-involved"
              className="px-6 py-3 rounded-lg bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30 hover:bg-color-hope-green/30 transition-colors"
            >
              Get Involved
            </a>
            <a
              href="/vision-2030-report"
              className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Full Vision Report
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}