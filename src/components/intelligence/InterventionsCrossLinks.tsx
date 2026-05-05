import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface CrossLink {
  href: string;
  external?: boolean;
  kicker: string;
  title: string;
  body: string;
}

const LINKS: CrossLink[] = [
  {
    href: 'https://civicgraph.app/share/qld-youth-justice',
    external: true,
    kicker: 'CivicGraph · QLD deep dive',
    title: 'Where the money, the children, and the evidence go',
    body: '$1.88B detention vs $1.49B community spend. 91% of children in custody are First Nations. Live watchhouse data. The full Queensland investigative report.',
  },
  {
    href: '/intelligence/funding-map',
    kicker: 'JusticeHub · Funding map',
    title: 'LGA funding desert map',
    body: 'Local Government Areas where youth-justice funding does not reach. The geography of the access gap, plotted on a real map.',
  },
  {
    href: '/intelligence',
    kicker: 'JusticeHub · System map',
    title: 'The whole intelligence layer',
    body: 'ALMA dashboard, civic intelligence search, justice spending, NSW sector report, Ask ALMA. Every data surface in one place.',
  },
  {
    href: '/contained/tour/intelligence',
    kicker: 'Contained · Tour intelligence',
    title: 'The tour as civic intelligence',
    body: 'Nine cities mapped. Demand signals, key delivery orgs, political holders, philanthropic targets per stop. Side panel deep-dive.',
  },
];

export function InterventionsCrossLinks() {
  return (
    <section className="border-t-2 border-black bg-gray-50">
      <div className="container-justice py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold mb-2">
            Go deeper
          </p>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
            Reports + maps + reads
          </h2>
          <p className="text-gray-700 mt-2 max-w-2xl">
            This page indexes the programs. These pages take the same data and turn it into investigative reports, geographic maps, and live dashboards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {LINKS.map((link) => {
            const isExternal = link.external;
            const Wrapper = isExternal ? 'a' : Link;
            const props = isExternal
              ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' as const }
              : { href: link.href };

            return (
              <Wrapper
                key={link.href}
                {...(props as any)}
                className="border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-colors group block"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-700 group-hover:text-emerald-300">
                    {link.kicker}
                  </span>
                  {isExternal ? (
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 leading-tight">
                  {link.title}
                </h3>
                <p className="text-sm leading-relaxed">
                  {link.body}
                </p>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
