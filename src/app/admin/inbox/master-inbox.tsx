'use client';

import { useState } from 'react';
import { Mail, CalendarCheck, Newspaper, UserPlus } from 'lucide-react';
import { InboxTable } from './inbox-table';
import { RegistrationsTable } from './registrations-table';
import { SubscribersTable } from './subscribers-table';
import { SignupsTable } from './signups-table';

const TABS = [
  { key: 'messages', label: 'Messages', icon: Mail },
  { key: 'registrations', label: 'Registrations', icon: CalendarCheck },
  { key: 'subscribers', label: 'Subscribers', icon: Newspaper },
  { key: 'signups', label: 'Signups', icon: UserPlus },
] as const;

type TabKey = typeof TABS[number]['key'];

interface MasterInboxProps {
  submissions: any[];
  submissionCounts: { new: number; read: number; replied: number; archived: number };
  registrations: any[];
  subscribers: any[];
  signups: any[];
  tabCounts: { messages: number; registrations: number; subscribers: number; signups: number };
}

export function MasterInbox({
  submissions,
  submissionCounts,
  registrations,
  subscribers,
  signups,
  tabCounts,
}: MasterInboxProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('messages');

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex border-2 border-black bg-white mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-4 ${
                isActive
                  ? 'border-black bg-black text-white'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 font-black ${
                  isActive
                    ? 'bg-white text-black'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'messages' && (
        <InboxTable initialSubmissions={submissions} counts={submissionCounts} />
      )}
      {activeTab === 'registrations' && (
        <RegistrationsTable registrations={registrations} />
      )}
      {activeTab === 'subscribers' && (
        <SubscribersTable subscribers={subscribers} />
      )}
      {activeTab === 'signups' && (
        <SignupsTable signups={signups} />
      )}
    </div>
  );
}
