'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, DollarSign, ShieldCheck, Globe, PenSquare, Megaphone, UserRound, RefreshCw } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: 'dashboard' },
  { key: 'practice', label: 'Practice', icon: RefreshCw, href: 'practice' },
  { key: 'profile', label: 'Profile', icon: UserRound, href: 'profile' },
  { key: 'campaign', label: 'Campaign', icon: Megaphone, href: 'campaign' },
  { key: 'grants', label: 'Grants', icon: DollarSign, href: 'grants' },
  { key: 'compliance', label: 'Compliance', icon: ShieldCheck, href: 'compliance' },
  { key: 'basecamp', label: 'Basecamp', icon: Globe, href: 'basecamp' },
  { key: 'site-editor', label: 'Site Editor', icon: PenSquare, href: 'site-editor' },
] as const;

interface HubShellProps {
  orgName: string;
  orgSlug: string;
  orgPlan?: string;
  orgType?: string | null;
  partnerTier?: string | null;
  modules: string[];
  children: React.ReactNode;
}

export function HubShell({ orgName, orgSlug, orgPlan, orgType, partnerTier, modules, children }: HubShellProps) {
  const pathname = usePathname();
  const enabledItems = NAV_ITEMS.filter((item) => modules.includes(item.key));

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Workspace navigation */}
      <aside className="bg-white border-b-2 border-black lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r-2">
        <div className="border-b-2 border-black p-4 lg:p-6">
          <h1 className="truncate text-lg font-black">{orgName}</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">JusticeHub Organization Workspace</p>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:flex-1 lg:space-y-1 lg:p-4">
          {enabledItems.map((item) => {
            const Icon = item.icon;
            const href = `/hub/${orgSlug}/${item.href}`;
            const isActive = pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={item.key}
                href={href}
                className={`flex min-h-[44px] shrink-0 items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-all lg:shrink ${
                  isActive
                    ? 'bg-ochre-100 text-ochre-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black border-2 border-transparent'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="container-justice pt-8 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
