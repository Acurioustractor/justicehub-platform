'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { navigationItems } from '@/config/navigation';
import { useNavigationAuth } from '@/hooks/useNavigationAuth';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import { QuickSearch } from '@/components/search/QuickSearch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NavigationProps {
    variant?: 'default' | 'transparent';
}

export function MainNavigation({ variant = 'default' }: NavigationProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
    const pathname = usePathname();

    const { user, userProfile, mounted, signOut } = useNavigationAuth();

    // Keyboard shortcut: Cmd/Ctrl + K to open search
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(true);
        }
        if (e.key === 'Escape') {
            setIsSearchOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        return () => {
            if (dropdownTimeout) {
                clearTimeout(dropdownTimeout);
            }
        };
    }, [dropdownTimeout]);

    const isActivePath = (href: string) => {
        if (!mounted) return false;
        if (href === '/' && pathname === '/') return true;
        if (href !== '/' && pathname.startsWith(href)) return true;
        return false;
    };

    const isDropdownActive = (items: typeof navigationItems[0]['items']) => {
        if (!mounted || !items) return false;
        return items.some(item => item.href && isActivePath(item.href));
    };

    const handleDropdownEnter = (label: string) => {
        if (dropdownTimeout) {
            clearTimeout(dropdownTimeout);
            setDropdownTimeout(null);
        }
        setActiveDropdown(label);
    };

    const handleDropdownLeave = () => {
        const timeout = setTimeout(() => {
            setActiveDropdown(null);
        }, 150);
        setDropdownTimeout(timeout);
    };

    const headerClasses = variant === 'transparent'
        ? "fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200"
        : "fixed top-0 left-0 right-0 w-full bg-white z-50 border-b-2 border-black";

    return (
        <header className={headerClasses} suppressHydrationWarning>
            <div className="container-justice" suppressHydrationWarning>
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
                            <div key={item.label} className="relative">
                                {item.type === 'dropdown' ? (
                                    <div
                                        className="relative"
                                        onMouseEnter={() => handleDropdownEnter(item.label)}
                                        onMouseLeave={handleDropdownLeave}
                                    >
                                        <button
                                            className={`font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 relative group flex items-center gap-1 ${item.items && isDropdownActive(item.items)
                                                ? 'text-red-600'
                                                : 'text-black'
                                                }`}
                                            aria-expanded={activeDropdown === item.label}
                                            aria-haspopup="true"
                                        >
                                            {item.label}
                                            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180' : ''
                                                }`} />
                                            <div className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600 transition-all duration-300 ${item.items && isDropdownActive(item.items) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                }`}></div>
                                        </button>

                                        {/* Bridge element to prevent hover gaps */}
                                        {activeDropdown === item.label && (
                                            <div className="absolute top-full left-0 w-64 h-2 bg-transparent z-40"></div>
                                        )}

                                        {activeDropdown === item.label && (
                                            <div className="absolute top-full left-0 mt-1 w-64 bg-white border-2 border-black shadow-lg z-50">
                                                {item.items?.map((dropdownItem) => (
                                                    dropdownItem.href && (
                                                        <Link
                                                            key={dropdownItem.href}
                                                            href={dropdownItem.href}
                                                            className={`block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 ${isActivePath(dropdownItem.href)
                                                                ? 'text-red-600 bg-red-50'
                                                                : 'text-black'
                                                                }`}
                                                            aria-current={isActivePath(dropdownItem.href) ? 'page' : undefined}
                                                        >
                                                            <div className="font-bold">{dropdownItem.label}</div>
                                                            <div className="text-xs text-gray-600 mt-1">{dropdownItem.description}</div>
                                                        </Link>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    item.href && (
                                        <Link
                                            href={item.href}
                                            className={`font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 relative group ${isActivePath(item.href)
                                                ? 'text-red-600'
                                                : 'text-black'
                                                }`}
                                            aria-current={isActivePath(item.href) ? 'page' : undefined}
                                            title={item.description}
                                        >
                                            {item.label}
                                            <div className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600 transition-all duration-300 ${isActivePath(item.href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                }`}></div>
                                        </Link>
                                    )
                                )}
                            </div>
                        ))}

                        {/* About Link */}
                        <Link
                            href="/about"
                            className={`px-4 py-2 font-bold text-sm uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${isActivePath('/about')
                                ? 'text-black underline decoration-2 underline-offset-4'
                                : 'text-gray-700 hover:text-black hover:underline hover:decoration-2 hover:underline-offset-4'
                                }`}
                            aria-current={isActivePath('/about') ? 'page' : undefined}
                            title="Learn about JusticeHub"
                        >
                            About
                        </Link>

                        {/* Search Button */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-md border border-gray-200 hover:border-gray-300"
                            aria-label="Search (⌘K)"
                            title="Search (⌘K)"
                        >
                            <Search className="h-4 w-4" />
                            <span className="hidden xl:inline text-xs text-gray-400">⌘K</span>
                        </button>

                        {/* Youth Scout CTA - Special Floating Button */}
                        <div className="ml-4 flex items-center gap-3">
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

                            {/* Show SIGN UP or Profile Dropdown based on auth state */}
                            {/* Use suppressHydrationWarning to prevent hydration mismatch due to client-only auth state */}
                            <div suppressHydrationWarning>
                                {mounted && user && userProfile ? (
                                    <UserMenu
                                        user={user}
                                        userProfile={userProfile}
                                        onSignOut={signOut}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href="/login"
                                            className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors border-2 border-black shadow-lg rounded-sm"
                                            aria-label="Log in to your account"
                                        >
                                            LOG IN
                                        </Link>
                                        <Link
                                            href="/signup"
                                            className="px-5 py-2.5 bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors border-2 border-black shadow-lg rounded-sm"
                                            aria-label="Create your profile"
                                        >
                                            SIGN UP
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>

                <MobileMenu
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    isActivePath={isActivePath}
                    user={user}
                    userProfile={userProfile}
                    onSignOut={signOut}
                    onSearchOpen={() => setIsSearchOpen(true)}
                />
            </div>

            {/* Search Modal */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent className="sm:max-w-2xl p-0 gap-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Search JusticeHub</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                        <QuickSearch
                            placeholder="Search programs, services, organizations..."
                            onClose={() => setIsSearchOpen(false)}
                            isModal={true}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </header>
    );
}
