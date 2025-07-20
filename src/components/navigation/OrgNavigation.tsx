'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  BookOpen,
  Briefcase,
  Heart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/organization',
    icon: Home,
  },
  {
    label: 'Youth Members',
    href: '/admin/youth',
    icon: Users,
  },
  {
    label: 'Stories',
    href: '/admin/stories',
    icon: BookOpen,
  },
  {
    label: 'Opportunities',
    href: '/admin/opportunities',
    icon: Briefcase,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: Heart,
    badge: 'Empathy Ledger',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function OrgNavigation() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-800">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">JusticeHub</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary/10 text-primary'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center w-full">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || 'Organization Staff'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="ml-3"
            >
              <a href="/api/auth/logout">
                <LogOut className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 shadow-sm sm:px-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">JusticeHub</span>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-900/80" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-gray-900 shadow-xl">
              <div className="flex items-center justify-between p-4">
                <Link href="/dashboard" className="flex items-center">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">JusticeHub</span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <nav className="flex flex-col px-2 pb-3 pt-5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <Icon
                        className={cn(
                          'mr-3 h-6 w-6 flex-shrink-0',
                          isActive
                            ? 'text-white'
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          'ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/10 text-primary'
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                      {user?.name || 'Organization Staff'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="ml-3"
                  >
                    <a href="/api/auth/logout">
                      <LogOut className="h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}