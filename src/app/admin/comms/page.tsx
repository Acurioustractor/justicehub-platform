'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Send, CalendarDays, Users, DollarSign, PenTool } from 'lucide-react';
import Pipeline from './pipeline';
import Calendar from './calendar';
import People from './people';
import Budget from './budget';
import Compose from './compose';
import BrandSidebar from './brand-sidebar';

type Tab = 'pipeline' | 'calendar' | 'people' | 'budget' | 'compose';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'pipeline', label: 'Pipeline', icon: <Send size={14} /> },
  { key: 'calendar', label: 'Calendar', icon: <CalendarDays size={14} /> },
  { key: 'people', label: 'People', icon: <Users size={14} /> },
  { key: 'budget', label: 'Budget', icon: <DollarSign size={14} /> },
  { key: 'compose', label: 'Compose', icon: <PenTool size={14} /> },
];

export default function AdminCommsPage() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const [pendingStat, setPendingStat] = useState<string>('');

  const handleInsertStat = (text: string) => {
    setTab('compose');
    setPendingStat(text);
  };

  return (
    <div className="min-h-screen page-content" style={{ backgroundColor: '#0A0A0A', color: '#F5F0E8' }}>
      <Navigation />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Header */}
            <div className="mb-6">
              <Link href="/admin" className="text-xs opacity-40 hover:opacity-70 transition-opacity">
                ← Back to Admin
              </Link>
              <h1
                className="text-3xl font-bold tracking-tight mt-1 text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                CONTAINED Comms
              </h1>
              <p className="text-sm opacity-40 mt-1">Campaign command centre — pipeline, calendar, people, budget, compose</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-white/10 pb-0">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors"
                  style={{
                    color: tab === t.key ? '#F5F0E8' : 'rgba(245,240,232,0.4)',
                    borderBottom: tab === t.key ? '2px solid #DC2626' : '2px solid transparent',
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'pipeline' && <Pipeline />}
            {tab === 'calendar' && <Calendar onSelectPost={() => setTab('pipeline')} />}
            {tab === 'people' && <People />}
            {tab === 'budget' && <Budget />}
            {tab === 'compose' && <Compose onInsertStat={pendingStat} />}
          </div>
        </div>

        {/* Brand sidebar */}
        <BrandSidebar onInsertStat={handleInsertStat} />
      </div>
    </div>
  );
}
