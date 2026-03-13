'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, DollarSign, ShieldCheck, Globe, PenSquare } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: 'dashboard' },
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-2 border-black flex flex-col shrink-0">
        <div className="p-6 border-b-2 border-black">
          <h1 className="text-lg font-black truncate">{orgName}</h1>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wide">Shared Services Hub</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {enabledItems.map((item) => {
            const Icon = item.icon;
            const href = `/hub/${orgSlug}/${item.href}`;
            const isActive = pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={item.key}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
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
      <main className="flex-1 overflow-auto">
        <div className="container-justice pt-8 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
