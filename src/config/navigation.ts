export interface NavigationItem {
    label: string;
    href?: string;
    description?: string;
    type?: 'dropdown';
    items?: NavigationItem[];
}

/**
 * Navigation Configuration
 *
 * NOTE: Some descriptions contain counts that need periodic review:
 * - Basecamps: 4 founding hubs (verified Jan 2026)
 * - Research Library: 27+ studies (use X+ format for growth)
 * - Best Practice: 4 Australian frameworks (QLD, NSW, VIC, NT)
 * - Global Map: 16+ international models
 *
 * These are intentionally static for performance. Update quarterly
 * or when significant changes occur.
 */
export const navigationItems: NavigationItem[] = [
    {
        label: 'Stories',
        href: '/stories',
        description: 'Voices and insights from the movement'
    },
    {
        label: 'Discover',
        type: 'dropdown',
        items: [
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
                description: 'Explore by disability, health, housing, and more'
            }
        ]
    },
    {
        label: 'Intelligence',
        type: 'dropdown',
        items: [
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
            }
        ]
    },
    {
        label: 'Centre of Excellence',
        type: 'dropdown',
        items: [
            {
                label: 'Overview',
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
                label: 'Global Insights',
                href: '/centre-of-excellence/global-insights',
                description: 'International best practice'
            },
            {
                label: 'International Exchange',
                href: '/international-exchange',
                description: 'June 2026 learning mission'
            }
        ]
    },
    {
        label: 'Platform',
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
                label: 'Stewards',
                href: '/stewards',
                description: 'Protect what works'
            },
            {
                label: 'Transparency',
                href: '/transparency',
                description: 'Track funding and outcomes'
            },
            {
                label: 'Gallery',
                href: '/gallery',
                description: 'Programs in action'
            },
            {
                label: 'Art & Innovation',
                href: '/art-innovation',
                description: 'Creative solutions'
            },
            {
                label: 'Roadmap',
                href: '/about/roadmap',
                description: 'Our 2026-2028 journey to community ownership'
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
            { label: 'Impact Calculator', href: '/intelligence/impact-calculator', description: 'Cost comparison' }
        ]
    },
    {
        title: 'Platform',
        links: [
            { label: 'Blog', href: '/blog', description: 'News and updates' },
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
            { label: 'International Exchange', href: '/international-exchange', description: 'June 2026 mission' },
            { label: 'How It Works', href: '/how-it-works', description: 'Platform overview' },
            { label: 'Privacy Policy', href: '/privacy', description: 'Your data protection' },
            { label: 'Terms of Service', href: '/terms', description: 'Usage guidelines' }
        ]
    },
    {
        title: 'Connect',
        links: [
            { label: 'Contact Us', href: '/contact', description: 'Get in touch' },
        ]
    }
];
