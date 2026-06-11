export interface NavigationItem {
    label: string;
    href?: string;
    description?: string;
    type?: 'dropdown';
    items?: NavigationItem[];
}

// Gate ALMA Network nav links behind an env flag.
// Default is ENABLED — set NEXT_PUBLIC_ALMA_ENABLED=false to hide them.
// The pages themselves still work by direct URL; only nav links are gated.
const almaEnabled = process.env.NEXT_PUBLIC_ALMA_ENABLED !== 'false';

/**
 * Public navigation is intentionally small. The site has hundreds of useful
 * routes, but first-time visitors need guided doors rather than a catalogue.
 * Search, footer links, and the all-pages modal carry the deeper platform.
 */
export const navigationItems: NavigationItem[] = [
    {
        label: 'Experience it',
        type: 'dropdown',
        items: [
            {
                label: 'Adelaide launch',
                href: '/adelaide',
                description: 'June 23 public pathway for CONTAINED'
            },
            {
                label: 'THE CONTAINED',
                href: '/contained',
                description: 'The immersive youth detention experience'
            },
            {
                label: 'Tour',
                href: '/contained/tour',
                description: 'National tour stops and host pathway'
            },
            {
                label: 'Share a reaction',
                href: '/contained/reaction',
                description: 'Capture what changed after the walk-through'
            }
        ]
    },
    {
        label: 'Understand it',
        type: 'dropdown',
        items: [
            {
                label: 'Youth Remand evidence',
                href: '/remand',
                description: 'The sendable evidence path after CONTAINED'
            },
            {
                label: 'Youth Remand vertical',
                href: '/justice-network/youth-remand',
                description: 'Law, campaigns, alternatives, money, and stories'
            },
            {
                label: 'Justice Matrix',
                href: '/justice-matrix',
                description: 'Cases, campaigns, issues, and strategy'
            },
            {
                label: 'UN / OHCHR Matrix pack',
                href: '/justice-matrix/un',
                description: 'Public review pack and source files'
            },
            {
                label: 'Wall of Proof',
                href: '/proof',
                description: 'Evidence, claims, and verified alternatives'
            }
        ]
    },
    {
        label: 'Find support',
        type: 'dropdown',
        items: [
            {
                label: 'National directory',
                href: '/directory',
                description: 'One public index for services, programs, orgs, grants, and funding'
            },
            {
                label: 'Find services',
                href: '/services',
                description: 'Legal help, housing, mentoring, and crisis support'
            },
            {
                label: 'Search ALMA',
                href: '/alma',
                description: 'Australian Living Map of Alternatives'
            },
            {
                label: 'Community map',
                href: '/community-map',
                description: 'Locate programs and local alternatives'
            },
            {
                label: 'Add your model',
                href: '/join',
                description: 'Put a program, service, or local model into the network'
            }
        ]
    },
    {
        label: 'Back or build it',
        type: 'dropdown',
        items: [
            {
                label: 'Follow the money',
                href: '/follow-the-money',
                description: 'Compare detention spend with community capability'
            },
            {
                label: 'For funders',
                href: '/for-funders',
                description: 'Back proven alternatives and field infrastructure'
            },
            {
                label: 'Back this',
                href: '/back-this',
                description: 'Fund the JusticeHub and CONTAINED infrastructure'
            },
            {
                label: 'Contact',
                href: '/contact',
                description: 'Start a partner, venue, media, or support conversation'
            }
        ]
    }
];

export const footerSections = [
    {
        title: 'For Youth',
        links: [
            { label: 'Youth Scout', href: '/youth-scout', description: 'Your personalized journey' },
            { label: 'National Directory', href: '/directory', description: 'Find support, programs, organisations, and grants' },
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
            { label: 'National Directory', href: '/directory', description: 'Coverage and trust layer' },
            { label: 'Community Programs', href: '/community-programs', description: 'Grassroots solutions' },
            { label: 'Add Your Program', href: '/community-programs/add', description: 'Share your impact' },
            { label: 'Success Stories', href: '/stories', description: 'Celebrate wins' }
        ]
    },
    {
        title: 'Intelligence',
        links: [
            { label: 'Justice Matrix', href: '/justice-matrix', description: 'Strategic cases, campaigns, and issues' },
            { label: 'Justice Network', href: '/justice-network', description: 'Issue verticals for action' },
            { label: 'Youth Remand', href: '/justice-network/youth-remand', description: 'Flagship remand vertical' },
            { label: 'Country Reports', href: '/justice-network/countries', description: 'Africa and Europe learning reports' },
            { label: 'ALMA Dashboard', href: '/intelligence/dashboard', description: 'AI evidence engine' },
            { label: 'Ask ALMA', href: '/intelligence/chat', description: 'Chat with AI' },
            { label: 'Directory Methodology', href: '/directory/methodology', description: 'How source coverage and trust labels work' },
            { label: 'System Map', href: '/intelligence/map', description: 'Detention & programs' },
            { label: 'Interventions', href: '/intelligence/interventions', description: 'Evidence database' },
            { label: 'Impact Calculator', href: '/intelligence/impact-calculator', description: 'Cost comparison' },
            { label: 'Funding', href: '/intelligence/funding', description: 'Grants & opportunities' },
            { label: 'Justice Spending', href: '/justice-funding', description: 'Track where justice dollars go' },
            { label: 'Reports', href: '/intelligence/reports', description: 'Weekly summaries' },
            { label: 'NSW Sector Report', href: '/intelligence/nsw', description: 'NSW youth justice sector report' }
        ]
    },
    {
        title: 'Network',
        links: [
            { label: 'Adelaide Launch', href: '/adelaide', description: 'June 23 public visitor pathway' },
            { label: 'Justice Network', href: '/justice-network', description: 'Art, evidence, law, campaigns, and briefs' },
            { label: 'Youth Remand Vertical', href: '/justice-network/youth-remand', description: 'First promoted vertical' },
            { label: 'Country Reports', href: '/justice-network/countries', description: 'World-tour comparison reports' },
            ...(almaEnabled ? [
            { label: 'ALMA Network', href: '/network/alma', description: 'Community-led youth justice' },
            { label: 'Basecamps', href: '/basecamps', description: 'ALMA Network coordinators' },
            { label: 'Network Impact', href: '/network/alma/impact', description: 'Collective proof' },
            { label: 'Learning Trips', href: '/trips', description: 'Immersive exchanges' },
            { label: 'National Gathering', href: '/network/alma/gathering', description: 'July 2026' },
            { label: 'Services', href: '/network/alma/services', description: 'Reports & consulting' },
            ] : []),
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
