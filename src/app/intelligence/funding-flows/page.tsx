import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Building2, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import SankeyDiagram from '@/components/intelligence/SankeyDiagram';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Funding Flow Sankey | JusticeHub Intelligence',
  description:
    'Interactive Sankey diagram showing how youth justice funding flows from source to program category to organisation type across Australia. $114.9B tracked across 157K records.',
  openGraph: {
    title: 'Where Does Youth Justice Money Go?',
    description:
      'Follow the money: $114.9B in justice funding tracked from source through program type to organisation. See who gets funded — and who gets left out.',
  },
};

/* ── Stat card ──────────────────────────────────────────────── */

function StatCard({
  value,
  label,
  sublabel,
  urgent,
}: {
  value: string;
  label: string;
  sublabel?: string;
  urgent?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl bg-[#0A0A0A]">
      <div
        className={`text-2xl md:text-3xl font-bold font-mono tracking-tight ${
          urgent ? 'text-[#DC2626]' : 'text-white'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-white/50 font-mono uppercase mt-1">{label}</div>
      {sublabel && (
        <div className="text-[10px] text-white/30 font-mono mt-0.5">{sublabel}</div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function FundingFlowsPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Navigation */}
      <nav className="border-b border-[#0A0A0A]/10 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/intelligence"
            className="flex items-center gap-2 text-sm font-mono text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Intelligence Hub
          </Link>
          <Link
            href="/"
            className="text-sm font-mono font-bold text-[#0A0A0A] tracking-tight"
          >
            JUSTICEHUB
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-[#0A0A0A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-[#059669]" />
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
              National Funding Intelligence
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Where Does Youth Justice
            <br />
            Money Actually Go?
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-3xl leading-relaxed">
            Follow the money. This Sankey diagram traces every dollar we can track — from
            government and philanthropic sources, through program categories, to the
            organisations that receive funding. The picture it paints is stark.
          </p>
        </div>
      </header>

      {/* Key Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="$114.9B" label="Total Funding Tracked" sublabel="35 sources" />
          <StatCard value="148K+" label="Funding Records" sublabel="National coverage" />
          <StatCard
            value="3.2%"
            label="Govt $ to Indigenous Orgs"
            sublabel="vs 70.9% philanthropic"
            urgent
          />
          <StatCard value="98K+" label="Organisations" sublabel="1,724 Indigenous-led" />
        </div>
      </section>

      {/* Key Insight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="p-6 rounded-xl border-2 border-[#DC2626]/20 bg-[#DC2626]/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div>
              <p
                className="font-bold text-[#0A0A0A]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                The Funding Paradox
              </p>
              <p className="text-sm text-[#0A0A0A]/70 mt-1">
                Government funding — which makes up the vast majority of youth justice
                spending — directs just 3.2% to Indigenous-led organisations, despite
                Indigenous young people comprising 65% of those in detention. Philanthropic
                funders direct 70.9% to Indigenous orgs — but their total pool is a fraction
                of government spending. The Sankey below shows this structural imbalance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sankey Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#0A0A0A]/5">
              <TrendingUp className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
            >
              Funding Flow Diagram
            </h2>
          </div>
          <p className="text-[#0A0A0A]/60 max-w-3xl">
            Source (left) to program category (middle) to organisation type (right).
            Width of each flow is proportional to dollar amount. Hover for details,
            click a node to highlight its connections.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#0A0A0A]/5">
          <SankeyDiagram />
        </div>
      </section>

      {/* Methodology */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-[#0A0A0A]/5 rounded-2xl p-6 md:p-8">
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            Methodology & Limitations
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-[#0A0A0A]/70">
            <div>
              <h4 className="font-bold text-[#0A0A0A] mb-2 font-mono text-xs uppercase">
                Data Sources
              </h4>
              <p>
                Funding data is aggregated from 35 sources including government contract
                disclosures (QLD, NSW, federal), AusTender, ROGS, AIHW, and philanthropic
                grant databases. Records span multiple financial years.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[#0A0A0A] mb-2 font-mono text-xs uppercase">
                Limitations
              </h4>
              <p>
                Not all funding records are linked to organisations (45.1% linkage rate).
                Program categorisation is automated from program names and may misclassify
                some records. State-level ROGS aggregates have no org recipient. Flows below
                0.1% of total are hidden for readability.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[#0A0A0A] mb-2 font-mono text-xs uppercase">
                Organisation Classification
              </h4>
              <p>
                Organisations are classified as Indigenous-led based on their
                &ldquo;is_indigenous_org&rdquo; flag (ORIC registration, ACNC data, manual
                verification). Control types include government, community-controlled,
                university, and NFP categories.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[#0A0A0A] mb-2 font-mono text-xs uppercase">
                Updates
              </h4>
              <p>
                This data is refreshed from the JusticeHub database. New funding records
                are added daily through automated scrapers and manual research. The Sankey
                recomputes on each page load.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Pages */}
      <section className="border-t border-[#0A0A0A]/10 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h3
            className="text-lg font-bold mb-6"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            Related Intelligence
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/intelligence/qld-dyjvs"
              className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="p-2 rounded-lg bg-[#0A0A0A]/5">
                <Building2 className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              <div>
                <p
                  className="font-bold text-sm text-[#0A0A0A] group-hover:text-[#059669] transition-colors"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  QLD Youth Justice Report
                </p>
                <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                  $536M/year, 484 programs, DYJVS contracts
                </p>
              </div>
            </Link>

            <Link
              href="/intelligence/national"
              className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="p-2 rounded-lg bg-[#0A0A0A]/5">
                <Users className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              <div>
                <p
                  className="font-bold text-sm text-[#0A0A0A] group-hover:text-[#059669] transition-colors"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  National Overview
                </p>
                <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                  Cross-state comparison and national trends
                </p>
              </div>
            </Link>

            <Link
              href="/intelligence/funding"
              className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="p-2 rounded-lg bg-[#0A0A0A]/5">
                <DollarSign className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              <div>
                <p
                  className="font-bold text-sm text-[#0A0A0A] group-hover:text-[#059669] transition-colors"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Funding Explorer
                </p>
                <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                  Search and filter individual funding records
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0A0A0A]/10 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs font-mono text-[#0A0A0A]/30 text-center">
            JusticeHub Intelligence &middot; Data sourced from 35 public and philanthropic
            databases &middot; Community-owned, open-access
          </p>
        </div>
      </footer>
    </div>
  );
}
