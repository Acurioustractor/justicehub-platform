'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PowerStats from '@/components/power/PowerStats';
import TopFundedOrgs from './top-funded-orgs';
import DonationsTable from './donations-table';

const SankeyFlow = dynamic(() => import('@/components/power/SankeyFlow'), { ssr: false });
const PowerNetwork = dynamic(() => import('@/components/power/PowerNetwork'), { ssr: false });
const PowerMap = dynamic(() => import('@/components/power/PowerMap'), { ssr: false });

const STATES = ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

export default function PowerPage() {
  const [state, setState] = useState<string>('QLD');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">JusticeHub Power Page</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Follow the Money</h1>
              <p className="text-lg text-gray-600 mt-2 max-w-2xl">
                Where justice dollars flow, who controls them, and what actually works.
                Exposing $8.7 billion in funding patterns across 51,000+ grants.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-gray-500">State:</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="border-2 border-black px-3 py-2 font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <PowerStats state={state} />
      </section>

      {/* Section 1: Map */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <SectionHeader
          number={1}
          title="Community Capital Map"
          subtitle="Every organisation receiving justice funding, mapped by location and size"
        />
        <PowerMap state={state} />
      </section>

      {/* Section 2: Sankey */}
      <section className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-100">
        <SectionHeader
          number={2}
          title="Follow the Money"
          subtitle="How funding flows from source through sector to organisation type"
        />
        <SankeyFlow state={state} />
      </section>

      {/* Section 3: Network */}
      <section className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-100">
        <SectionHeader
          number={3}
          title="Political Donation Network"
          subtitle="Which justice-funded organisations donate to political parties — click a node to explore"
        />
        <PowerNetwork state={state} />
      </section>

      {/* Section 4: Top Funded Orgs */}
      <section className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-100">
        <SectionHeader
          number={4}
          title="Top Funded Organisations"
          subtitle="Who receives the most justice funding — concentration of dollars across organisations"
        />
        <TopFundedOrgs state={state} />
      </section>

      {/* Section 5: Political Connections */}
      <section className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-100">
        <SectionHeader
          number={5}
          title="Political Connections"
          subtitle="Organisations that receive justice funding AND make political donations"
        />
        <DonationsTable state={state} />
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-black mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-500">
          <p>Data: AusTender, state government grants, political donations (AEC), ACNC charities, ALMA evidence engine.</p>
          <p className="mt-1">Built by JusticeHub. Community-owned infrastructure for justice accountability.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="bg-black text-white w-7 h-7 flex items-center justify-center text-sm font-black">{number}</span>
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      </div>
      <p className="text-sm text-gray-500 ml-10">{subtitle}</p>
    </div>
  );
}
