import { SectionHeading } from "@/components/section-heading";

const costComparisons = [
  {
    category: "Traditional Detention",
    dailyCost: "$2,800",
    annualCost: "$1,022,000",
    successRate: "27%",
    description: "Current cost per young person in Australian youth detention",
    color: "text-red-400"
  },
  {
    category: "CONTAINED Experience",
    dailyCost: "$85",
    annualCost: "$31,025",
    successRate: "73%*",
    description: "Cost per experience delivery (30 minutes that changes everything)",
    color: "text-color-hope-green",
    note: "*Based on Diagrama Foundation outcomes"
  }
];

const economicImpact = [
  {
    metric: "$990,975",
    label: "Annual Savings per Young Person",
    description: "The difference between detention and transformation approaches"
  },
  {
    metric: "32x",
    label: "Cost Effectiveness Ratio",
    description: "Return on investment compared to traditional detention"
  },
  {
    metric: "$4.2M",
    label: "Build Cost (One-Time)",
    description: "Total investment for three-container transformation system"
  },
  {
    metric: "∞",
    label: "Lifetime Value",
    description: "Immeasurable human potential unlocked through intervention"
  }
];

const revenueStreams = [
  {
    stream: "Experience Bookings",
    description: "Organizations book transformative experiences for their teams, leaders, and stakeholders",
    pricing: "$150-500 per person",
    scalability: "High",
    impact: "Direct transformation"
  },
  {
    stream: "Consultation & Design",
    description: "Supporting other regions to build their own transformation infrastructure",
    pricing: "$50,000-200,000 per project",
    scalability: "Global",
    impact: "System change"
  },
  {
    stream: "Training & Certification",
    description: "Educating facilitators, social workers, and advocates on transformation methodologies",
    pricing: "$2,000-5,000 per person",
    scalability: "Scalable",
    impact: "Capacity building"
  },
  {
    stream: "Research Partnerships",
    description: "Universities and research institutions studying transformation outcomes",
    pricing: "$25,000-100,000 per study",
    scalability: "Academic",
    impact: "Evidence base"
  },
  {
    stream: "CON|X Platform",
    description: "Digital architecture connecting young people to mentors and opportunities (launching Feb 2025)",
    pricing: "Subscription model",
    scalability: "Exponential",
    impact: "Network effects"
  }
];

const investmentOpportunities = [
  {
    level: "Transformation Partner",
    investment: "$50,000+",
    benefits: [
      "Named recognition on all containers",
      "Quarterly board observer rights",
      "Priority access to outcomes data",
      "Custom experience sessions"
    ],
    slots: "Limited to 5 partners"
  },
  {
    level: "System Change Investor",
    investment: "$100,000+",
    benefits: [
      "Board seat and strategic input",
      "International expansion rights",
      "Revenue sharing on consultation",
      "Co-branded research publications"
    ],
    slots: "Limited to 3 investors"
  },
  {
    level: "Revolutionary Founder",
    investment: "$250,000+",
    benefits: [
      "Co-founder recognition",
      "Equity participation",
      "Global expansion leadership",
      "Legacy naming rights"
    ],
    slots: "By invitation only"
  }
];

export function EconomicsSection() {
  return (
    <section id="economics" className="bg-color-container-steel py-24">
      <div className="mx-auto max-w-6xl px-6 space-y-20">
        <SectionHeading
          eyebrow="Economic Reality"
          title="The Mathematics of Transformation"
          description="Revolution isn't just morally imperative - it's economically inevitable. The current system burns money while burning futures. Transformation pays for itself."
          align="center"
        />

        {/* Cost comparison */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Cost Comparison: Detention vs. Transformation
          </h3>

          <div className="grid gap-8 md:grid-cols-2">
            {costComparisons.map((item, index) => (
              <div key={index} className={`p-8 rounded-3xl border-2 ${
                index === 0
                  ? 'bg-red-500/10 border-red-400/30'
                  : 'bg-color-hope-green/10 border-color-hope-green/30'
              }`}>
                <div className="space-y-4">
                  <h4 className="font-display text-xl uppercase tracking-tight text-white">
                    {item.category}
                  </h4>

                  <div className="space-y-2">
                    <div className={`text-4xl font-bold ${item.color}`}>
                      {item.dailyCost}
                      <span className="text-lg font-normal text-white/60">/day</span>
                    </div>
                    <div className={`text-2xl font-semibold ${item.color}`}>
                      {item.annualCost}
                      <span className="text-sm font-normal text-white/60">/year</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-sm text-white/70">Success Rate</span>
                    <span className={`text-lg font-bold ${item.color}`}>
                      {item.successRate}
                    </span>
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed">
                    {item.description}
                  </p>

                  {item.note && (
                    <p className="text-xs text-white/60 italic">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Economic impact metrics */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Economic Impact
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {economicImpact.map((item, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-gradient-to-br from-color-warning-orange/10 to-color-hope-green/10 border border-color-warning-orange/20">
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-color-warning-orange">
                    {item.metric}
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-white">
                    {item.label}
                  </div>
                  <div className="text-xs text-white/70 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue streams */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Sustainable Revenue Model
          </h3>

          <div className="space-y-4">
            {revenueStreams.map((stream, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-color-hope-green/30 transition-all">
                <div className="grid gap-4 md:grid-cols-4 items-center">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-color-hope-green">
                      {stream.stream}
                    </h4>
                    <p className="text-sm text-white/80">
                      {stream.description}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-semibold text-color-warning-orange">
                      {stream.pricing}
                    </div>
                    <div className="text-xs text-white/60">Pricing</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-semibold text-white">
                      {stream.scalability}
                    </div>
                    <div className="text-xs text-white/60">Scalability</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-semibold text-color-hope-green">
                      {stream.impact}
                    </div>
                    <div className="text-xs text-white/60">Impact Type</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment opportunities */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Investment Opportunities
          </h3>

          <div className="grid gap-8 md:grid-cols-3">
            {investmentOpportunities.map((opportunity, index) => (
              <div key={index} className={`p-6 rounded-3xl border-2 ${
                index === 2
                  ? 'bg-color-warning-orange/10 border-color-warning-orange/30'
                  : 'bg-color-hope-green/10 border-color-hope-green/30'
              }`}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-display text-lg uppercase tracking-tight text-white">
                      {opportunity.level}
                    </h4>
                    <div className={`text-2xl font-bold ${
                      index === 2 ? 'text-color-warning-orange' : 'text-color-hope-green'
                    }`}>
                      {opportunity.investment}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Benefits Include:
                    </h5>
                    <ul className="space-y-2">
                      {opportunity.benefits.map((benefit, i) => (
                        <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                          <span className="text-color-hope-green mt-0.5">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <div className="text-xs text-white/60 italic">
                      {opportunity.slots}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center space-y-6 p-8 rounded-3xl bg-gradient-to-r from-color-container-black/60 to-color-container-black/80 border border-white/10">
          <h3 className="font-display text-xl uppercase tracking-tight text-color-hope-green">
            Invest in Transformation
          </h3>
          <p className="text-white/90 max-w-2xl mx-auto">
            This isn't charity - it's the smartest investment in human potential you'll ever make.
            Every dollar spent on transformation saves thirty-two in the system.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:funding@acurioustractor.com"
              className="px-6 py-3 rounded-lg bg-color-warning-orange/20 text-color-warning-orange border border-color-warning-orange/30 hover:bg-color-warning-orange/30 transition-colors"
            >
              Investment Inquiry
            </a>
            <a
              href="/economics-report"
              className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Full Economic Report
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}