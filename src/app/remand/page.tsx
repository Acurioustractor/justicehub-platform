import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  FileText,
  HandHeart,
  KeyRound,
  MapPinned,
  Network,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export const metadata: Metadata = {
  title: 'What Is Remand? | JusticeHub',
  description:
    'A plain-English guide to remand in Australia: custody before sentence, why children are held, what drives the system, and what support could change the path.',
};

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const stats = [
  {
    value: '42%',
    label: 'Adult prisoners unsentenced',
    detail: '19,850 of 46,998 adult prisoners at 30 June 2025.',
    source: 'ABS Prisoners in Australia 2025',
  },
  {
    value: '4 in 5',
    label: 'Children in detention unsentenced',
    detail: 'Average day in 2024-25, reported by JRI citing AIHW.',
    source: 'JRI, 12 May 2026',
  },
  {
    value: '$1.1B',
    label: 'Youth detention spend',
    detail: 'Detention-based supervision share of recurrent youth justice expenditure in 2024-25.',
    source: 'Productivity Commission RoGS 2026',
  },
  {
    value: '10.5pts',
    label: 'Bail help made a difference',
    detail: 'Placed NSW Bail Assistance Line young people were less likely to be in custody six months later.',
    source: 'NSW BOCSAR 2021',
  },
];

const pathway = [
  {
    title: 'A child is charged',
    body: 'A charge is an accusation. It is not a finding of guilt.',
    icon: FileText,
  },
  {
    title: 'Bail needs a plan',
    body: 'The court needs to know where the child will sleep, who can support them, and how they will come back.',
    icon: KeyRound,
  },
  {
    title: 'Support is missing',
    body: 'Housing, transport, legal help, family safety, health support, or a trusted adult may not be there in time.',
    icon: ShieldAlert,
  },
  {
    title: 'Risk replaces care',
    body: 'The system can call the child a risk and use custody before the case has finished.',
    icon: Scale,
  },
  {
    title: 'Remand becomes the door',
    body: 'A child can enter detention before sentence because care arrived too late.',
    icon: CalendarClock,
  },
];

const supports = [
  'A lawyer before the bail decision',
  'A safe bed and address',
  'A trusted adult or cultural worker',
  'Transport to court and appointments',
  'School, training, work, or daily structure',
  'Family, healing, health, and disability support',
];

const nextSteps = [
  {
    title: 'Walk through THE CONTAINED',
    body: 'The experience turns the policy question into a physical pathway.',
    href: '/contained',
    icon: MapPinned,
  },
  {
    title: 'Open the full remand vertical',
    body: 'Search law, campaigns, alternatives, funding, stories, and source records.',
    href: '/justice-network/youth-remand',
    icon: Network,
  },
  {
    title: 'Find what works instead',
    body: 'See verified alternatives and the evidence base that sits behind them.',
    href: '/proof',
    icon: BookOpenCheck,
  },
  {
    title: 'Find support or add a model',
    body: 'Use JusticeHub to locate services, organisations, and missing local supports.',
    href: '/directory',
    icon: HandHeart,
  },
];

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-[#DC2626]/40 underline-offset-4 hover:text-[#DC2626]">
      {children}
    </a>
  );
}

export default function RemandPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="pt-32">
        <section className="bg-[#0A0A0A] text-[#F5F0E8]">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#DC2626]" style={{ fontFamily: MONO }}>
              Youth Remand Explainer
            </p>
            <h1 className="max-w-5xl text-4xl font-black leading-[1.02] tracking-tight md:text-7xl">
              Remand is custody before care has arrived.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#F5F0E8]/75 md:text-lg">
              Remand means being held in custody before sentence. A child on remand has not been sentenced.
              Many have not been convicted. They are held while the court process continues.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contained" className="inline-flex min-h-11 items-center gap-2 bg-[#DC2626] px-5 text-sm font-bold text-white">
                Walk through CONTAINED <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/justice-network/youth-remand" className="inline-flex min-h-11 items-center gap-2 border border-[#F5F0E8]/30 px-5 text-sm font-bold text-[#F5F0E8]">
                Go deeper <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-[#0A0A0A] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8 md:px-12">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>Charged</p>
                <p className="mt-2 text-sm leading-6">Police allege an offence. This is an accusation, not a finding of guilt.</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>Bail</p>
                <p className="mt-2 text-sm leading-6">A decision to release someone while the case continues, usually with conditions.</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>Remand</p>
                <p className="mt-2 text-sm leading-6">Custody before sentence. The legal status is different from sentenced detention.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14 md:px-12">
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                Composite pathway
              </p>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">The child is not the exhibit. The chain is.</h2>
              <p className="mt-4 text-sm leading-6 text-[#514a42]">
                This pathway is built from documented remand drivers: bail refusal, housing, court delay,
                service gaps, bail conditions, breach, watch house custody, and detention. It is not one
                child&apos;s private story.
              </p>
            </div>
            <div className="grid gap-3">
              {pathway.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="grid gap-4 border-2 border-[#0A0A0A] bg-white p-4 md:grid-cols-[56px_1fr]">
                    <div className="flex h-12 w-12 items-center justify-center bg-[#0A0A0A] text-[#F5F0E8]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#DC2626]" style={{ fontFamily: MONO }}>
                        Step {index + 1}
                      </div>
                      <h3 className="mt-1 text-lg font-black">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#514a42]">{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#0A0A0A] text-[#F5F0E8]">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
            <div className="mb-8 max-w-3xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#DC2626]" style={{ fontFamily: MONO }}>
                Source-checked facts
              </p>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">The exception has become a normal door into detention.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <article key={stat.label} className="border border-[#F5F0E8]/18 bg-white/7 p-4">
                  <div className="text-4xl font-black text-[#F5F0E8]">{stat.value}</div>
                  <h3 className="mt-3 text-sm font-bold">{stat.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#F5F0E8]/65">{stat.detail}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[#F5F0E8]/45" style={{ fontFamily: MONO }}>
                    {stat.source}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14 md:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                The hinge
              </p>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Bail was redefined from a promise into a prediction.</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-[#514a42]">
                <p>
                  Bail once asked a narrow question: will this person come back to court? In recent decades,
                  Australian bail law has shifted toward risk and community safety, with tests such as unacceptable
                  risk, show cause, compelling reason, and exceptional circumstances.
                </p>
                <p>
                  That shift matters because risk follows poverty, racism, homelessness, disability, family violence,
                  remote geography, and service gaps. When support is missing, detention starts to look like the only
                  option. That is the design failure.
                </p>
              </div>
            </div>
            <aside className="border-2 border-[#0A0A0A] bg-white p-5">
              <h3 className="text-xl font-black">What would change the path?</h3>
              <ul className="mt-4 space-y-3">
                {supports.map((support) => (
                  <li key={support} className="flex gap-3 text-sm leading-6">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 bg-[#059669]" />
                    <span>{support}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="border-y-2 border-[#0A0A0A] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
            <div className="mb-8 max-w-3xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                JusticeHub pathways
              </p>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Do not leave with outrage only.</h2>
              <p className="mt-4 text-sm leading-6 text-[#514a42]">
                Use JusticeHub to move from the experience into evidence, alternatives, services, and action.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {nextSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <Link key={step.href} href={step.href} className="group border-2 border-[#0A0A0A] p-4 hover:bg-[#0A0A0A] hover:text-[#F5F0E8]">
                    <Icon className="h-6 w-6 text-[#DC2626]" />
                    <h3 className="mt-4 text-lg font-black">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#514a42] group-hover:text-[#F5F0E8]/75">{step.body}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">
                      Open <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-10 md:px-12">
          <h2 className="text-xl font-black">Sources</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-[#514a42] md:grid-cols-2">
            <p><SourceLink href="https://www.abs.gov.au/statistics/people/crime-and-justice/prisoners-australia/latest-release">ABS Prisoners in Australia 2025</SourceLink></p>
            <p><SourceLink href="https://www.pc.gov.au/ongoing/report-on-government-services/community-services/youth-justice/">Productivity Commission RoGS 2026 youth justice</SourceLink></p>
            <p><SourceLink href="https://www.aic.gov.au/sites/default/files/2026-02/ijc_bail_and_remand_across_australia.pdf">Australian Institute of Criminology, Bail and remand across Australia, 2026</SourceLink></p>
            <p><SourceLink href="https://www.justicereforminitiative.org.au/media_release_four_in_five_children_in_detention_haven_t_been_sentenced_new_data_shows_alarming_increase_in_locking_up_kids">Justice Reform Initiative, 12 May 2026</SourceLink></p>
            <p><SourceLink href="https://bocsar.nsw.gov.au/documents/publications/cjb/cjb201-250/cjb237-report-evaluation-of-bail-assistance-line-2021.pdf">NSW BOCSAR Youth Bail Assistance Line evaluation</SourceLink></p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
