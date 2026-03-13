'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, DollarSign, ShieldCheck, Layers, ArrowRightLeft, BookOpen, MessageSquare, Inbox, Mail, Image as ImageIcon, Users, BarChart3, Handshake, Menu, X } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { GrantsTab } from './tabs/GrantsTab';
import { ComplianceTab } from './tabs/ComplianceTab';
import { ProgramsTab } from './tabs/ProgramsTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { StoriesTab } from './tabs/StoriesTab';
import { CommunicationsTab } from './tabs/CommunicationsTab';
import { InboxTab } from './tabs/InboxTab';
import { MessagesTab } from './tabs/MessagesTab';
import { MediaTab } from './tabs/MediaTab';
import { PeopleTab } from './tabs/PeopleTab';
import { AnalysisTab } from './tabs/AnalysisTab';
import { SupportNetworkTab } from './tabs/SupportNetworkTab';
import { ALMAChat } from '@/components/ui/alma-chat';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  description: string | null;
  location: string | null;
  state: string | null;
  tags: string[] | null;
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'grants', label: 'Grants & Finance', icon: DollarSign },
  { key: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { key: 'people', label: 'People', icon: Users },
  { key: 'programs', label: 'Programs', icon: Layers },
  { key: 'referrals', label: 'Referrals', icon: ArrowRightLeft },
  { key: 'stories', label: 'Stories', icon: BookOpen },
  { key: 'analysis', label: 'Analysis', icon: BarChart3 },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'communications', label: 'Comms', icon: MessageSquare },
  { key: 'messages', label: 'Messages', icon: Mail },
  { key: 'inbox', label: 'Tasks', icon: Inbox },
  { key: 'support_network', label: 'Support Network', icon: Handshake },
] as const;

type TabKey = typeof TABS[number]['key'];

export function OrgSupportHubClient({ organization, isPortal }: { organization: Organization; isPortal?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header - compact */}
      <div className="bg-white border-b-2 border-black">
        <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 -ml-2 hover:bg-gray-100"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            href={isPortal ? '/portal' : `/admin/organizations/${organization.slug || ''}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-earth-700 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{isPortal ? 'Back to Portal' : `Back to ${organization.name}`}</span>
          </Link>

          <div className="flex-1">
            <h1 className="text-xl font-black">{organization.name}</h1>
            <p className="text-xs text-gray-500 font-medium">Support Hub</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - always visible on desktop, toggleable on mobile */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed top-0 left-0 z-40 h-full w-56 bg-white border-r-2 border-black pt-[60px] overflow-y-auto
          transition-transform duration-200 ease-in-out
          lg:sticky lg:top-0 lg:z-0 lg:h-[calc(100vh-60px)] lg:translate-x-0 lg:pt-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors text-left ${
                    isActive
                      ? 'bg-ochre-50 text-ochre-700 border-r-4 border-ochre-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 lg:p-8">
          {activeTab === 'overview' && <OverviewTab orgId={organization.id} orgSlug={organization.slug || ''} onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'grants' && <GrantsTab orgId={organization.id} />}
          {activeTab === 'compliance' && <ComplianceTab orgId={organization.id} />}
          {activeTab === 'people' && <PeopleTab orgId={organization.id} />}
          {activeTab === 'programs' && <ProgramsTab orgId={organization.id} />}
          {activeTab === 'referrals' && <ReferralsTab orgId={organization.id} />}
          {activeTab === 'stories' && <StoriesTab orgId={organization.id} />}
          {activeTab === 'analysis' && <AnalysisTab orgId={organization.id} />}
          {activeTab === 'media' && <MediaTab orgId={organization.id} />}
          {activeTab === 'communications' && <CommunicationsTab orgId={organization.id} />}
          {activeTab === 'messages' && <MessagesTab orgId={organization.id} />}
          {activeTab === 'inbox' && <InboxTab orgId={organization.id} />}
          {activeTab === 'support_network' && <SupportNetworkTab orgId={organization.id} />}
        </main>
      </div>

      {/* ALMA Chat - floating button */}
      <ALMAChat />
    </div>
  );
}
