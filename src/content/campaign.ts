export const campaignMetadata = {
  name: "CONTAINED",
  tagline: "Transform Youth Justice Through Immersive Advocacy",
  launchDate: "2025-10-22",
  location: "Brisbane, Queensland",
  primaryCta: {
    label: "Nominate a Leader",
    href: "#nominate",
  },
  secondaryCta: {
    label: "Book Your Experience",
    href: "#book",
  },
  counters: {
    baseNominations: 1247,
    goalNominations: 2500,
    goalLabel: "Nominations to secure political attendance",
    slotsPerDay: 24,
  },
  progress: {
    label: "Premier Nominated",
    goal: 100,
    current: 47,
  },
  description:
    "Thirty minutes inside three containers reveals the urgency, the evidence, and the solution for Queensland's youth justice system.",
};

export const journeyContainers = [
  {
    id: "current-reality",
    step: 1,
    title: "Current Reality",
    headline: "Queensland Detention",
    summary:
      "Experience the isolation, cold infrastructure, and compounding harm that defines youth detention today.",
    stats: [
      { label: "Daily Cost", value: "$3,320" },
      { label: "Annual Cost", value: "$1.212M" },
      { label: "Reoffending", value: "84%" },
      { label: "Education Completion", value: "18%" },
    ],
    duration: "10 minutes locked inside",
    tone: "critical",
  },
  {
    id: "therapeutic-model",
    step: 2,
    title: "Therapeutic Alternative",
    headline: "Diagrama (Spain)",
    summary:
      "Embodied empathy, 1:1 staffing, and family-centred support that rebuilds lives instead of warehousing them.",
    stats: [
      { label: "Staff Ratio", value: "1:1" },
      { label: "Family Engagement", value: "Weekly" },
      { label: "Social Return", value: "€5.64 per €1" },
      { label: "Success Rate", value: "73%" },
    ],
    duration: "10 minutes of possibility",
    tone: "transitional",
  },
  {
    id: "future-vision",
    step: 3,
    title: "Australia's Future",
    headline: "Con|X",
    summary:
      "Co-design a future where community-led programs, credible messengers, and restorative practice are the norm.",
    stats: [
      { label: "Community Programs", value: "$75/day" },
      { label: "Credible Messengers", value: "3% reoffend" },
      { label: "Restorative Justice", value: "88% success" },
      { label: "Lives Impacted", value: "Thousands" },
    ],
    duration: "10 minutes to act",
    tone: "hopeful",
  },
];

export const actionTracks = {
  nomination: {
    id: "nominate",
    title: "Nominate a Decision Maker",
    description: "Create the public pressure that forces participation.",
    items: [
      "State and federal politicians",
      "Justice and youth detention officials",
      "Media directors and editors",
      "Business and philanthropy leaders",
      "Community power brokers",
    ],
    buttonLabel: "Nominate Now",
  },
  booking: {
    id: "book",
    title: "Experience It Yourself",
    description: "Thirty minutes that change how you see youth justice forever.",
    items: [
      "24 slots available daily",
      "Trauma-informed facilitation",
      "Action toolkit takeaway",
      "Join the alumni pressure network",
      "Pay what you can ($0-$50)",
    ],
    buttonLabel: "Book Experience",
  },
};

export type EvidenceHighlight = {
  label: string;
  value: string;
  source?: string;
};

export const evidenceHighlights: EvidenceHighlight[] = [
  {
    label: "Cost per detained youth",
    value: "$1.212M",
    source: "Queensland Treasury Budget 2024",
  },
  {
    label: "Detention reoffending",
    value: "84%",
    source: "Queensland Youth Justice Strategy 2023",
  },
  {
    label: "Community reoffending",
    value: "3%",
    source: "Community Accountability Pilot 2024",
  },
  {
    label: "Youth helped for same cost",
    value: "16×",
    source: "Queensland Productivity Commission 2024",
  },
  {
    label: "Youth detained in Finland",
    value: "4",
    source: "Finnish Ministry of Justice 2024",
  },
  {
    label: "Restorative justice success",
    value: "88%",
    source: "Queensland Department of Justice 2024",
  },
  {
    label: "Daily cost of alternatives",
    value: "$75",
    source: "Community Services Benchmark Study 2024",
  },
  {
    label: "Brisbane launch window",
    value: "45 days",
    source: "CONTAINED Campaign Operations Plan",
  },
];

export const narrativePillars = [
  {
    title: "Truth Through Experience",
    description:
      "Immersive storytelling grounded in lived experience turns statistics into undeniable reality.",
  },
  {
    title: "Evidence-Based Hope",
    description:
      "International models prove therapeutic approaches work. Queensland can invest in what already succeeds.",
  },
  {
    title: "Collective Accountability",
    description:
      "Political change follows public pressure. Every nomination, booking, and story fuels momentum.",
  },
];
