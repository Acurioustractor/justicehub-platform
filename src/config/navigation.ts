export interface NavigationItem {
    label: string;
    href?: string;
    description?: string;
    type?: 'dropdown';
    items?: NavigationItem[];
}

/**
 * Navigation Configuration — 5 top-level items
 *
 * Explore: Content discovery (people, orgs, stories, services, map)
 * Intelligence: ALMA + evidence + research tools
 * Network: Centre of Excellence + partner pathways
 * Action: Blog, events, stewards, art, transparency
 * About: Mission, roadmap, how it works, contact
 */
export const navigationItems: NavigationItem[] = [
    {
        label: 'Explore',
        type: 'dropdown',
        items: [
            {
                label: 'Stories',
                href: '/stories',
                description: 'Voices from the movement'
            },
            {
                label: 'People',
                href: '/people',
                description: 'Advocates, artists, and changemakers'
            },
            {
                label: 'Organizations',
                href: '/organizations',
                description: 'Youth justice organizations'
            },
            {
                label: 'Programs',
                href: '/community-programs',
                description: 'Community-led solutions'
            },
            {
                label: 'Services',
                href: '/services',
                description: 'Support services directory'
            },
            {
                label: 'Service Map',
                href: '/community-map',
                description: 'Locate services nationwide'
            },
            {
                label: 'Thematic Areas',
                href: '/themes',
                description: 'Disability, health, housing, and more'
            },
            {
                label: 'Gallery',
                href: '/gallery',
                description: 'Programs in action'
            },
            {
                label: 'Opportunities',
                href: '/opportunities',
                description: 'Jobs, scholarships, and apprenticeships'
            }
        ]
    },
    {
        label: 'Intelligence',
        type: 'dropdown',
        items: [
            {
                label: 'This Week',
                href: '/this-week',
                description: 'What changed on JusticeHub this week'
            },
            {
                label: 'The Pulse',
                href: '/pulse',
                description: 'Live youth justice intelligence'
            },
            {
                label: 'ALMA Dashboard',
                href: '/intelligence/dashboard',
                description: 'AI-powered evidence engine'
            },
            {
                label: 'Ask ALMA',
                href: '/intelligence/chat',
                description: 'Chat with youth justice AI'
            },
            {
                label: 'System Map',
                href: '/intelligence/map',
                description: 'Detention centres & programs'
            },
            {
                label: 'Interventions',
                href: '/intelligence/interventions',
                description: 'Evidence-based programs database'
            },
            {
                label: 'Research Agent',
                href: '/intelligence/research',
                description: 'AI research assistant'
            },
            {
                label: 'Impact Calculator',
                href: '/intelligence/impact-calculator',
                description: 'Detention vs community costs'
            },
            {
                label: 'Evidence Library',
                href: '/intelligence/evidence',
                description: 'Research and studies'
            },
            {
                label: 'Funding',
                href: '/intelligence/funding',
                description: 'Grants and funding opportunities'
            },
            {
                label: 'The Case for Change',
                href: '/analysis',
                description: 'Data-driven analysis of youth justice'
            },
            {
                label: 'Sector Map',
                href: '/sector-map',
                description: 'Full sector landscape and funding flows'
            },
            {
                label: 'Justice Spending',
                href: '/justice-funding',
                description: 'Track where QLD justice dollars go'
            },
            {
                label: 'Reports',
                href: '/intelligence/reports',
                description: 'Weekly intelligence summaries'
            },
            {
                label: 'Youth Justice Report',
                href: '/youth-justice-report',
                description: 'National youth justice analysis'
            }
        ]
    },
    {
        label: 'Network',
        type: 'dropdown',
        items: [
            {
                label: 'Centre of Excellence',
                href: '/centre-of-excellence',
                description: 'Join the network proving what works'
            },
            {
                label: 'Basecamps',
                href: '/centre-of-excellence/map?category=basecamp',
                description: '4 founding network hubs'
            },
            {
                label: 'Key People',
                href: '/centre-of-excellence/people',
                description: 'Practitioners & researchers'
            },
            {
                label: 'Research Library',
                href: '/centre-of-excellence/research',
                description: '27+ peer-reviewed studies'
            },
            {
                label: 'Best Practice',
                href: '/centre-of-excellence/best-practice',
                description: '4 Australian state frameworks'
            },
            {
                label: 'Global Map',
                href: '/centre-of-excellence/map',
                description: '16+ international models'
            },
            {
                label: 'ALMA Network',
                href: '/network/alma',
                description: 'The alternative — community-led youth justice'
            },
            {
                label: 'Network Impact',
                href: '/network/alma/impact',
                description: 'Collective proof that alternatives work'
            },
            {
                label: 'Learning Trips',
                href: '/trips',
                description: 'Immersive exchanges between community orgs'
            },
            {
                label: 'National Gathering',
                href: '/network/alma/gathering',
                description: 'First national gathering — July 2026'
            },
            {
                label: 'Services',
                href: '/network/alma/services',
                description: 'Reports, consulting, and intelligence'
            },
            {
                label: 'Wall of Proof',
                href: '/proof',
                description: 'Every verified alternative model in Australia'
            },
            {
                label: 'Cost Calculator',
                href: '/calculator',
                description: 'Detention vs community — interactive tool'
            },
            {
                label: 'Community Voices',
                href: '/voices',
                description: 'Real stories from real people'
            },
            {
                label: 'Share the Data',
                href: '/share',
                description: 'Branded data cards for LinkedIn and funder packs'
            },
            {
                label: 'International Exchange',
                href: '/international-exchange',
                description: 'June 2026 learning mission'
            },
            {
                label: 'For Community Leaders',
                href: '/for-community-leaders',
                description: 'Practical tools for local leadership'
            },
            {
                label: 'For Funders',
                href: '/for-funders',
                description: 'Invest in proven community solutions'
            },
            {
                label: 'For Government',
                href: '/for-government',
                description: 'Evidence for policy and systems reform'
            },
            {
                label: 'For Researchers',
                href: '/for-researchers',
                description: 'Methods, datasets, and collaboration'
            }
        ]
    },
    {
        label: 'Action',
        type: 'dropdown',
        items: [
            {
                label: 'Blog',
                href: '/blog',
                description: 'News and updates'
            },
            {
                label: 'Events',
                href: '/events',
                description: 'Upcoming gatherings'
            },
            {
                label: 'The Contained Tour',
                href: '/contained/tour',
                description: 'Immersive youth justice experience'
            },
            {
                label: 'Basecamps',
                href: '/basecamps',
                description: 'The ALMA Network — community coordinators in every state'
            },
            {
                label: 'Stewards',
                href: '/stewards',
                description: 'Protect what works'
            },
            {
                label: 'Art Competitions',
                href: '/competitions',
                description: 'Monthly art competitions for young people'
            },
            {
                label: 'Gig Guide',
                href: '/gig-guide',
                description: 'Youth-friendly events near basecamps'
            },
            {
                label: 'Art & Innovation',
                href: '/art-innovation',
                description: 'Creative solutions'
            },
            {
                label: 'Follow the Money',
                href: '/follow-the-money',
                description: 'Where youth justice funding actually goes'
            },
            {
                label: 'Funders',
                href: '/funders',
                description: 'Who funds what — 200+ foundations profiled'
            },
            {
                label: 'State Scorecards',
                href: '/states/qld',
                description: 'Per-state youth justice intelligence'
            },
            {
                label: 'The Authority',
                href: '/authority',
                description: '$97.9B in justice funding, exposed'
            },
            {
                label: 'Transparency',
                href: '/transparency',
                description: 'Track funding and outcomes'
            },
            {
                label: 'Call It Out',
                href: '/call-it-out',
                description: 'Report racism and injustice'
            },
            {
                label: 'Back This',
                href: '/back-this',
                description: 'Fund the infrastructure'
            }
        ]
    },
    {
        label: 'About',
        type: 'dropdown',
        items: [
            {
                label: 'Our Vision',
                href: '/vision',
                description: 'The future of youth justice'
            },
            {
                label: 'Our Mission',
                href: '/about',
                description: 'Why JusticeHub exists'
            },
            {
                label: 'Roadmap',
                href: '/about/roadmap',
                description: '2026-2028 journey to community ownership'
            },
            {
                label: 'How It Works',
                href: '/how-it-works',
                description: 'Platform and collaboration model'
            },
            {
                label: 'Contact',
                href: '/contact',
                description: 'Get in touch'
            }
        ]
    }
];

export const footerSections = [
    {
        title: 'For Youth',
        links: [
            { label: 'Youth Scout', href: '/youth-scout', description: 'Your personalized journey' },
            { label: 'Find Services', href: '/services', description: 'AI-powered directory' },
            { label: 'Thematic Areas', href: '/themes', description: 'Explore by theme' },
            { label: 'Share Your Story', href: '/stories/new', description: 'Tell your story' },
            { label: 'Youth Login', href: '/youth-scout/youth-login', description: 'Access your dashboard' }
        ]
    },
    {
        title: 'For Organizations',
        links: [
            { label: 'Talent Scout', href: '/youth-scout/talent-login', description: 'Find emerging talent' },
            { label: 'Community Programs', href: '/community-programs', description: 'Grassroots solutions' },
            { label: 'Add Your Program', href: '/community-programs/add', description: 'Share your impact' },
            { label: 'Success Stories', href: '/stories', description: 'Celebrate wins' }
        ]
    },
    {
        title: 'Intelligence',
        links: [
            { label: 'ALMA Dashboard', href: '/intelligence/dashboard', description: 'AI evidence engine' },
            { label: 'Ask ALMA', href: '/intelligence/chat', description: 'Chat with AI' },
            { label: 'System Map', href: '/intelligence/map', description: 'Detention & programs' },
            { label: 'Interventions', href: '/intelligence/interventions', description: 'Evidence database' },
            { label: 'Impact Calculator', href: '/intelligence/impact-calculator', description: 'Cost comparison' },
            { label: 'Funding', href: '/intelligence/funding', description: 'Grants & opportunities' },
            { label: 'Justice Spending', href: '/justice-funding', description: 'Track where justice dollars go' },
            { label: 'Reports', href: '/intelligence/reports', description: 'Weekly summaries' }
        ]
    },
    {
        title: 'Network',
        links: [
            { label: 'ALMA Network', href: '/network/alma', description: 'Community-led youth justice' },
            { label: 'Basecamps', href: '/basecamps', description: 'ALMA Network coordinators' },
            { label: 'Network Impact', href: '/network/alma/impact', description: 'Collective proof' },
            { label: 'Learning Trips', href: '/trips', description: 'Immersive exchanges' },
            { label: 'National Gathering', href: '/network/alma/gathering', description: 'July 2026' },
            { label: 'Services', href: '/network/alma/services', description: 'Reports & consulting' },
            { label: 'Funders', href: '/funders', description: '200+ foundations profiled' },
            { label: 'Centre of Excellence', href: '/centre-of-excellence', description: 'Proving what works' },
            { label: 'Global Map', href: '/centre-of-excellence/map', description: 'International models' },
            { label: 'International Exchange', href: '/international-exchange', description: 'June 2026 mission' }
        ]
    },
    {
        title: 'Action',
        links: [
            { label: 'Blog', href: '/blog', description: 'News and updates' },
            { label: "What's On", href: '/whats-on', description: 'Events, tours, grants' },
            { label: 'Events', href: '/events', description: 'Upcoming gatherings' },
            { label: 'Stewards', href: '/stewards', description: 'Protect what works' },
            { label: 'Gallery', href: '/gallery', description: 'Programs in action' },
            { label: 'Transparency', href: '/transparency', description: 'Financial transparency' }
        ]
    },
    {
        title: 'About',
        links: [
            { label: 'Our Mission', href: '/about', description: 'Why we exist' },
            { label: 'Roadmap', href: '/about/roadmap', description: '2026-2028 journey' },
            { label: 'How It Works', href: '/how-it-works', description: 'Platform overview' },
            { label: 'Privacy Policy', href: '/privacy', description: 'Your data protection' },
            { label: 'Terms of Service', href: '/terms', description: 'Usage guidelines' },
            { label: 'Contact Us', href: '/contact', description: 'Get in touch' },
            { label: 'Developer API', href: '/developer-api', description: 'Empathy Ledger API docs' }
        ]
    }
];
