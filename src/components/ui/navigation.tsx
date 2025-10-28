'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface NavigationProps {
  variant?: 'default' | 'transparent';
}

interface NavigationItem {
  label: string;
  href?: string;
  description?: string;
  type?: 'dropdown';
  items?: NavigationItem[];
}

interface UserProfile {
  slug: string;
  full_name: string;
  photo_url: string | null;
  user_role?: string;
}

export function Navigation({ variant = 'default' }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    // Create Supabase client only on client-side
    const supabase = createClient();

    // Check auth state
    const checkAuth = async () => {
      console.log('🔍 Navigation: Checking auth...');
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('🔍 Navigation: User:', user?.email || 'Not logged in', error?.message || '');
      setUser(user);

      if (user) {
        // Fetch user's profile and role
        console.log('🔍 Navigation: Fetching profile for user:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('public_profiles')
          .select(`
            slug,
            full_name,
            photo_url,
            users!public_profiles_user_id_fkey(user_role)
          `)
          .eq('user_id', user.id)
          .single();

        console.log('🔍 Navigation: Profile data:', profile, profileError?.message || '');
        console.log('🔍 Navigation: Profile.users:', profile?.users);

        // Extract user_role from the joined data
        if (profile && profile.users) {
          console.log('🔍 Navigation: users is array?', Array.isArray(profile.users));
          console.log('🔍 Navigation: users content:', profile.users);

          if (Array.isArray(profile.users) && profile.users[0]) {
            profile.user_role = profile.users[0].user_role;
            console.log('🔍 Navigation: Extracted user_role (array):', profile.user_role);
          } else if (typeof profile.users === 'object' && profile.users.user_role) {
            // Sometimes Supabase returns single object instead of array
            profile.user_role = profile.users.user_role;
            console.log('🔍 Navigation: Extracted user_role (object):', profile.user_role);
          }
        }

        console.log('🔍 Navigation: Final profile with user_role:', profile);
        setUserProfile(profile);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout);
      }
    };
  }, [dropdownTimeout]);

  const navigationItems: NavigationItem[] = [
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

  const isActivePath = (href: string) => {
    if (!mounted) return false; // Prevent hydration mismatch
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  const isDropdownActive = (items: NavigationItem[]) => {
    if (!mounted) return false; // Prevent hydration mismatch
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
    }, 150); // 150ms delay before hiding
    setDropdownTimeout(timeout);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setProfileDropdownOpen(false);
    window.location.href = '/';
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
              <div key={item.label} className="relative">
                {item.type === 'dropdown' ? (
                  <div
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(item.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      className={`font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 relative group flex items-center gap-1 ${
                        item.items && isDropdownActive(item.items)
                          ? 'text-red-600'
                          : 'text-black'
                      }`}
                      aria-expanded={activeDropdown === item.label}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`} />
                      <div className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600 transition-all duration-300 ${
                        item.items && isDropdownActive(item.items) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                              className={`block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 ${
                                isActivePath(dropdownItem.href)
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
                  )
                )}
              </div>
            ))}

            {/* About Link */}
            <Link
              href="/about"
              className={`px-4 py-2 font-bold text-sm uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                isActivePath('/about')
                  ? 'text-black underline decoration-2 underline-offset-4'
                  : 'text-gray-700 hover:text-black hover:underline hover:decoration-2 hover:underline-offset-4'
              }`}
              aria-current={isActivePath('/about') ? 'page' : undefined}
              title="Learn about JusticeHub"
            >
              About
            </Link>

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
              {mounted && user && userProfile ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    onBlur={() => setTimeout(() => setProfileDropdownOpen(false), 200)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                  >
                    {userProfile.photo_url ? (
                      <Image
                        src={userProfile.photo_url}
                        alt={userProfile.full_name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border-2 border-black"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <ChevronDown className={`w-3 h-3 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-black shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-bold text-black">{userProfile.full_name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                      <Link
                        href={`/people/${userProfile.slug}`}
                        className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          View Profile
                        </div>
                      </Link>
                      <Link
                        href={`/people/${userProfile.slug}/edit`}
                        className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Edit Profile
                        </div>
                      </Link>
                      {userProfile.user_role === 'admin' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Admin Dashboard
                          </div>
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : mounted ? (
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
              ) : null}
            </div>
          </nav>
        </div>

        {/* Mobile Navigation */}
        <nav 
          id="mobile-menu"
          className={`lg:hidden mt-4 pb-4 border-t border-gray-200 ${
            mounted && isMobileMenuOpen ? 'block' : 'hidden'
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
            <div className="flex flex-col space-y-4 mt-4">
              {navigationItems.map((item) => (
                <div key={item.label}>
                  {item.type === 'dropdown' ? (
                    <div>
                      <div className="text-sm font-bold text-gray-700 uppercase tracking-wider px-3 py-2 border-b border-gray-200">
                        {item.label}
                      </div>
                      {item.items?.map((dropdownItem) => (
                        dropdownItem.href && (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`text-base font-bold px-6 py-2 rounded transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 block ml-3 ${
                              isActivePath(dropdownItem.href)
                                ? 'text-black bg-gray-100'
                                : 'text-black hover:text-black hover:bg-gray-100'
                            }`}
                            aria-current={isActivePath(dropdownItem.href) ? 'page' : undefined}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span>{dropdownItem.label}</span>
                              </div>
                              <div className="text-sm text-black mt-1 font-normal">{dropdownItem.description}</div>
                            </div>
                          </Link>
                        )
                      ))}
                    </div>
                  ) : (
                    item.href && (
                      <Link
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
                    )
                  )}
                </div>
              ))}

              {/* About Link - Mobile (Distinct Style) */}
              <div className="border-t-2 border-gray-200 pt-4 mt-4">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-bold px-3 mb-2">
                  Learn More
                </div>
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`border-2 mx-3 px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 block ${
                    isActivePath('/about')
                      ? 'border-blue-800 bg-blue-800 text-white'
                      : 'border-gray-400 text-gray-700 hover:border-blue-800 hover:bg-blue-800 hover:text-white'
                  }`}
                  aria-current={isActivePath('/about') ? 'page' : undefined}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">About JusticeHub</span>
                      <span className="text-xs opacity-75">?</span>
                    </div>
                    <div className="text-sm mt-1 font-normal opacity-90">How our platform works</div>
                  </div>
                </Link>
              </div>

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

              {/* Mobile: Show SIGN UP or Profile Links based on auth state */}
              {mounted && user && userProfile ? (
                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <div className="flex items-center gap-3 px-3 mb-4">
                    {userProfile.photo_url ? (
                      <Image
                        src={userProfile.photo_url}
                        alt={userProfile.full_name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-black"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-black">{userProfile.full_name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href={`/people/${userProfile.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-6 py-3 bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition-colors mb-2 rounded-sm"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      View Profile
                    </div>
                  </Link>
                  <Link
                    href={`/people/${userProfile.slug}/edit`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-6 py-3 bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition-colors mb-2 rounded-sm"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Edit Profile
                    </div>
                  </Link>
                  {userProfile.user_role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-6 py-3 bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition-colors mb-2 rounded-sm"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Admin Dashboard
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full px-6 py-3 bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors rounded-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </div>
                  </button>
                </div>
              ) : mounted ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-6 py-3 bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors border-2 border-black text-center shadow-lg rounded-sm"
                    aria-label="Log in to your account"
                  >
                    LOG IN
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-6 py-3 bg-black text-white font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors border-2 border-black text-center shadow-lg rounded-sm"
                    aria-label="Create your profile"
                  >
                    SIGN UP
                  </Link>
                </div>
              ) : null}
            </div>
        </nav>
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
        { label: 'Roadmap', href: '/roadmap', description: 'Community-driven features' },
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

          <div className="mt-4 flex space-x-4">
            <Link
              href="/wiki"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Wiki
            </Link>
            <Link
              href="/preplanning"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Preplanning
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
