// Navigation structure for Queensland Youth Justice Accountability Platform
export interface NavItem {
  label: string
  href: string
  icon: string
  description?: string
  badge?: string
  children?: NavItem[]
}

export interface NavSection {
  title: string
  icon: string
  description: string
  items: NavItem[]
}

export const navigationSections: NavSection[] = [
  {
    title: "THE EVIDENCE",
    icon: "📊",
    description: "Legitimacy & credibility first",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: "🏠",
        description: "Real-time accountability metrics",
        badge: "LIVE"
      },
      {
        label: "Data Explorer",
        href: "/data-explorer",
        icon: "🔍",
        description: "Interactive visualizations"
      },
      {
        label: "Sources & Methods",
        href: "/sources",
        icon: "🔗",
        description: "Complete transparency"
      },
      {
        label: "Download Centre",
        href: "/downloads",
        icon: "💾",
        description: "All data, all formats"
      }
    ]
  },
  {
    title: "THE STORIES",
    icon: "📖",
    description: "Human impact at the center",
    items: [
      {
        label: "Youth Voices",
        href: "/stories/youth-voices",
        icon: "🗣️",
        description: "First-person accounts"
      },
      {
        label: "Case Studies",
        href: "/stories/case-studies",
        icon: "👤",
        description: "Individual journeys through the system"
      },
      {
        label: "Community Impact",
        href: "/stories/community",
        icon: "👨‍👩‍👧‍👦",
        description: "Ripple effects on families"
      },
      {
        label: "Success Stories",
        href: "/stories/success",
        icon: "✨",
        description: "What works elsewhere"
      }
    ]
  },
  {
    title: "THE INVESTIGATION",
    icon: "🔍",
    description: "Deep dive capabilities",
    items: [
      {
        label: "Inquiries Hub",
        href: "/investigation/inquiries",
        icon: "🏛️",
        description: "Past/current commission findings"
      },
      {
        label: "RTI Tracker",
        href: "/investigation/rti",
        icon: "📄",
        description: "Government transparency failures"
      },
      {
        label: "Parliamentary Watch",
        href: "/investigation/parliament",
        icon: "🗳️",
        description: "Hansard analysis"
      },
      {
        label: "Cost Analysis",
        href: "/investigation/costs",
        icon: "💰",
        description: "Where money really goes"
      }
    ]
  },
  {
    title: "TAKE ACTION",
    icon: "🚨",
    description: "Convert outrage to outcomes",
    items: [
      {
        label: "Live Alerts",
        href: "/alerts",
        icon: "🔔",
        description: "Breaking accountability failures",
        badge: "3 NEW"
      },
      {
        label: "Campaign Toolkit",
        href: "/action/campaigns",
        icon: "📢",
        description: "Share-ready content"
      },
      {
        label: "Contact Representatives",
        href: "/action/contact",
        icon: "📧",
        description: "Direct action tools"
      },
      {
        label: "Join Movement",
        href: "/action/join",
        icon: "🤝",
        description: "Community organizing"
      }
    ]
  },
  {
    title: "TRANSPARENCY HUB",
    icon: "🛠️",
    description: "Build trust through openness",
    items: [
      {
        label: "How We Work",
        href: "/transparency/methodology",
        icon: "📋",
        description: "Complete methodology"
      },
      {
        label: "Data Pipeline",
        href: "/transparency/pipeline",
        icon: "⚡",
        description: "Technical transparency"
      },
      {
        label: "Update Schedule",
        href: "/transparency/schedule",
        icon: "📅",
        description: "When/how data refreshes"
      },
      {
        label: "Contribute",
        href: "/transparency/contribute",
        icon: "🤲",
        description: "Add data/stories/research"
      }
    ]
  }
]

// Quick access items for mobile/header
export const quickAccessItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "🏠"
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: "🔔",
    badge: "3"
  },
  {
    label: "Take Action",
    href: "/action/campaigns",
    icon: "🚨"
  }
]

// User type specific journeys
export const userJourneys = {
  journalist: {
    title: "For Journalists",
    icon: "📰",
    path: [
      { label: "Quick Stats", href: "/" },
      { label: "Fact Check", href: "/sources" },
      { label: "Download Press Kit", href: "/downloads?type=press" },
      { label: "Expert Contacts", href: "/transparency/contribute#experts" }
    ]
  },
  researcher: {
    title: "For Researchers",
    icon: "🔬",
    path: [
      { label: "Methodology", href: "/transparency/methodology" },
      { label: "Raw Data", href: "/downloads" },
      { label: "Historical Trends", href: "/data-explorer?view=trends" },
      { label: "API Access", href: "/transparency/pipeline#api" }
    ]
  },
  advocate: {
    title: "For Advocates",
    icon: "📢",
    path: [
      { label: "Key Failures", href: "/?view=failures" },
      { label: "Share Tools", href: "/action/campaigns" },
      { label: "Campaign Resources", href: "/action/campaigns#resources" },
      { label: "Action Templates", href: "/action/campaigns#templates" }
    ]
  },
  policymaker: {
    title: "For Policymakers",
    icon: "🏛️",
    path: [
      { label: "Executive Summary", href: "/reports?type=executive" },
      { label: "Cost Analysis", href: "/investigation/costs" },
      { label: "Comparison Data", href: "/data-explorer?view=comparison" },
      { label: "Reform Examples", href: "/stories/success" }
    ]
  }
}

// Legacy route mapping for backwards compatibility
export const legacyRouteMap: Record<string, string> = {
  '/public-dashboard': '/',
  '/accountability-dashboard': '/',
  '/visualization': '/data-explorer',
  '/visualizations': '/data-explorer',
  '/data-sources': '/sources',
  '/raw-data': '/downloads',
  '/debug-data': '/transparency/pipeline',
  '/transparency': '/investigation/rti',
  '/spending': '/investigation/costs',
  '/youth-statistics': '/data-explorer?focus=youth',
  '/reports': '/downloads?type=reports',
  '/monitoring': '/transparency/pipeline',
  '/live-demo': '/',
  '/community': '/action/join'
}