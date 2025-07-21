'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

interface NavigationProps {
  variant?: 'default' | 'transparent';
}

export function Navigation({ variant = 'default' }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationItems = [
    {
      label: 'Stories',
      href: '/stories',
      description: 'Youth voices and experiences'
    },
    {
      label: 'Service Finder',
      href: '/services',
      description: 'AI-powered comprehensive directory'
    },
    {
      label: 'Community Programs',
      href: '/community-programs',
      description: 'Curated grassroots solutions'
    },
    {
      label: 'Gallery',
      href: '/gallery',
      description: 'Programs in action'
    },
    {
      label: 'Art & Innovation',
      href: '/art-innovation',
      description: 'Creative works and tech solutions'
    },
    {
      label: 'Money Trail',
      href: '/transparency',
      description: 'Track funding and outcomes'
    },
    {
      label: 'Roadmap',
      href: '/roadmap',
      description: 'Community-driven feature roadmap'
    }
  ];

  const isActivePath = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  const headerClasses = variant === 'transparent' 
    ? "fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200"
    : "fixed top-0 left-0 right-0 w-full bg-white z-50 border-b-2 border-black";

  return (
    <header className={headerClasses}>
      <div className="container-justice">
        {/* Top Row - Logo Centered */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
          {/* Left spacer for mobile menu */}
          <div className="w-10 lg:w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-black hover:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Centered Logo with Rad Wordmark */}
          <Link 
            href="/" 
            className="group transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 no-underline"
            aria-label="JusticeHub - Home"
          >
            <div className="text-center">
              <div className="relative">
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent group-hover:from-red-600 group-hover:via-black group-hover:to-red-600 transition-all duration-500">
                    JUSTICE
                  </span>
                  <span className="text-black group-hover:text-red-600 transition-colors duration-500">
                    HUB
                  </span>
                </h1>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="text-xs font-bold tracking-widest text-gray-600 group-hover:text-black transition-colors duration-300 mt-1">
                TRUTH • ACTION • JUSTICE
              </div>
            </div>
          </Link>

          {/* Right spacer for balance */}
          <div className="w-10 lg:w-0"></div>
        </div>

        {/* Bottom Row - Navigation */}
        <div className="hidden lg:flex items-center justify-center py-3">
          <nav className="flex items-center gap-8" role="navigation" aria-label="Main navigation">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 relative group ${
                  isActivePath(item.href)
                    ? 'text-red-600'
                    : 'text-black'
                }`}
                aria-current={isActivePath(item.href) ? 'page' : undefined}
                title={item.description}
              >
                {item.label}
                <div className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600 transition-all duration-300 ${
                  isActivePath(item.href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}></div>
              </Link>
            ))}
            
            {/* Youth Scout CTA - Special Floating Button */}
            <div className="ml-4 relative">
              <Link 
                href="/youth-scout" 
                className="relative youth-scout-button text-white px-5 py-2.5 font-bold text-xs uppercase tracking-wider hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 group rounded-sm no-underline"
                aria-label="Youth Scout - Your personalized journey"
              >
                <span className="relative z-10">
                  YOUTH SCOUT
                </span>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </nav>
        </div>

        {/* Mobile Navigation */}
        {mounted && isMobileMenuOpen && (
          <nav 
            id="mobile-menu"
            className="lg:hidden mt-4 pb-4 border-t border-gray-200"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-4 mt-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-bold px-3 py-2 rounded transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 block ${
                    isActivePath(item.href)
                      ? 'text-black bg-gray-100'
                      : 'text-black hover:text-black hover:bg-gray-100'
                  }`}
                  aria-current={isActivePath(item.href) ? 'page' : undefined}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                    </div>
                    <div className="text-sm text-black mt-1 font-normal">{item.description}</div>
                  </div>
                </Link>
              ))}
              
              <Link 
                href="/youth-scout"
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative youth-scout-button text-white px-6 py-3 font-bold text-sm uppercase tracking-wider hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 group text-center rounded-sm no-underline"
                aria-label="Youth Scout - Your personalized journey"
              >
                <span className="relative z-10">
                  YOUTH SCOUT
                </span>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

// Quick action navigation for specific contexts
export function QuickNav({ 
  backLink, 
  backLabel = "Back",
  title,
  actions = []
}: {
  backLink?: string;
  backLabel?: string;
  title?: string;
  actions?: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }>;
}) {
  return (
    <section className="pt-24 pb-4 border-b border-gray-200 bg-gray-50">
      <div className="container-justice">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backLink && (
              <Link 
                href={backLink} 
                className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                aria-label={`${backLabel} - Return to previous page`}
              >
                <ChevronDown className="h-4 w-4 rotate-90" aria-hidden="true" />
                {backLabel}
              </Link>
            )}
            {title && (
              <h1 className="text-xl font-bold text-black">{title}</h1>
            )}
          </div>
          
          {actions.length > 0 && (
            <div className="flex items-center gap-3">
              {actions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className={action.variant === 'primary' ? 'cta-primary' : 'cta-secondary'}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Footer component for consistency
export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, would handle newsletter subscription here
    setSubscribed(true);
    setEmail('');
  };

  const footerSections = [
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
        { label: 'Gallery', href: '/gallery', description: 'Programs in action' },
        { label: 'Money Trail', href: '/transparency', description: 'Financial transparency' },
        { label: 'Art & Innovation', href: '/art-innovation', description: 'Creative solutions' },
        { label: 'Roadmap', href: '/roadmap', description: 'Community-driven features' }
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
        { label: 'Partner With Us', href: '/partners', description: 'Collaboration opportunities' },
        { label: 'Media Kit', href: '/media', description: 'Press resources' },
        { label: 'Support', href: '/support', description: 'Help and resources' }
      ]
    }
  ];

  return (
    <footer className="border-t-2 border-black py-16 bg-white" role="contentinfo">
      <div className="container-justice">
        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-2 border-black p-8 mb-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-black mb-4">STAY CONNECTED</h3>
            <p className="text-gray-700 mb-6 font-medium">
              Get updates on new programs, success stories, and transparency reports. 
              Join thousands working to transform youth justice in Australia.
            </p>
            
            {!subscribed ? (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-all border-2 border-red-600"
                >
                  SUBSCRIBE
                </button>
              </form>
            ) : (
              <div className="bg-green-100 border-2 border-green-600 p-4 max-w-md mx-auto">
                <p className="font-bold text-green-800">✅ Thanks! You're now subscribed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold mb-4 text-black text-lg">{section.title}</h4>
              <ul className="space-y-3" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="text-gray-700 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 group font-medium text-sm"
                      title={link.description}
                    >
                      <span className="group-hover:underline">{link.label}</span>
                      <span className="sr-only"> - {link.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Brand Section */}
        <div className="text-center border-t-2 border-black pt-8">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tighter mb-2">
              <span className="bg-gradient-to-r from-black via-red-600 to-black bg-clip-text text-transparent">
                JUSTICE
              </span>
              <span className="text-black">HUB</span>
            </h2>
            <div className="text-xs font-bold tracking-widest text-gray-600">
              TRUTH • ACTION • JUSTICE
            </div>
          </div>
          
          <blockquote className="text-xl font-bold text-black mb-6 max-w-2xl mx-auto">
            "They used to call us the problem. Now we're building the solution."
          </blockquote>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm max-w-4xl mx-auto mb-6">
            <div>
              <h5 className="font-bold mb-2">🏛️ GOVERNMENT TRANSPARENCY</h5>
              <p className="text-gray-600">Real-time tracking of youth justice spending and outcomes</p>
            </div>
            <div>
              <h5 className="font-bold mb-2">🌱 GRASSROOTS SOLUTIONS</h5>
              <p className="text-gray-600">Amplifying community programs that actually work</p>
            </div>
            <div>
              <h5 className="font-bold mb-2">🚀 YOUTH EMPOWERMENT</h5>
              <p className="text-gray-600">Personalized pathways for growth and opportunity</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 font-medium">
            © 2024 JusticeHub. Built for Australia's youth, by people who care.
          </p>
        </div>
      </div>
    </footer>
  );
}