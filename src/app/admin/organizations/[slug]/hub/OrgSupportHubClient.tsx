'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, DollarSign, ShieldCheck, Layers, ArrowRightLeft, BookOpen, MessageSquare, Inbox, Mail, Image as ImageIcon, Users, BarChart3 } from 'lucide-react';
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
  { key: 'communications', label: 'Communications', icon: MessageSquare },
  { key: 'messages', label: 'Messages', icon: Mail },
  { key: 'inbox', label: 'Tasks', icon: Inbox },
] as const;

type TabKey = typeof TABS[number]['key'];

export function OrgSupportHubClient({ organization, isPortal }: { organization: Organization; isPortal?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="container-justice py-6">
          <Link
            href={isPortal ? '/portal' : `/admin/organizations/${organization.slug || ''}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-earth-700 hover:text-black mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            {isPortal ? 'Back to Portal' : `Back to ${organization.name}`}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">{organization.name}</h1>
              <p className="text-sm text-gray-600 font-medium mt-1">Support Hub</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="container-justice">
          <div className="flex gap-0 overflow-x-auto -mb-[2px]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-b-4 border-ochre-600 text-ochre-600'
                      : 'border-b-4 border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container-justice py-8">
        {activeTab === 'overview' && <OverviewTab orgId={organization.id} orgSlug={organization.slug || ''} />}
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
      </div>
    </div>
  );
}
