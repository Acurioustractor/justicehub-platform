export interface NavigationItem {
    label: string;
    href?: string;
    description?: string;
    type?: 'dropdown';
    items?: NavigationItem[];
}

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
                label: 'Map',
                href: '/community-map',
                description: 'Locate services nationwide'
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
                description: 'Australian youth justice leadership'
            },
            {
                label: 'ALMA Dashboard',
                href: '/intelligence/dashboard',
                description: 'System-wide intelligence '
            },
            {
                label: 'Intelligence Hub',
                href: '/intelligence',
                description: 'ALMA intelligence & portfolio analytics'
            },
            {
                label: 'Research',
                href: '/centre-of-excellence/research',
                description: 'Evidence-based insights'
            },
            {
                label: 'Best Practice',
                href: '/centre-of-excellence/best-practice',
                description: 'Proven approaches'
            },
            {
                label: 'Global Insights',
                href: '/centre-of-excellence/global-insights',
                description: 'International perspectives'
            }
        ]
    },
    {
        label: 'Platform',
        type: 'dropdown',
        items: [
            {
                label: 'Ask ALMA',
                href: '#alma-chat',
                description: 'AI-powered youth justice guide'
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
                href: '/roadmap',
                description: 'Community-driven features'
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
        title: 'Platform',
        links: [
            { label: 'Ask ALMA', href: '#alma-chat', description: 'AI youth justice guide' },
            { label: 'Stewards', href: '/stewards', description: 'Protect what works' },
            { label: 'Gallery', href: '/gallery', description: 'Programs in action' },
            { label: 'Money Trail', href: '/transparency', description: 'Financial transparency' },
            { label: 'Centre of Excellence', href: '/centre-of-excellence', description: 'Research and best practice' }
        ]
    },
    {
        title: 'About',
        links: [
            { label: 'Our Mission', href: '/about', description: 'Why we exist' },
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
