'use client';

import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, ArrowRight, Printer } from 'lucide-react';

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const evidence = [
  {
    value: '42%',
    label: 'adult prisoners unsentenced',
    detail: '19,850 of 46,998 adult prisoners at 30 June 2025.',
    source: 'ABS Prisoners in Australia 2025',
  },
  {
    value: '4 in 5',
    label: 'children in detention unsentenced',
    detail: 'Average day in 2024-25, reported by JRI citing AIHW.',
    source: 'JRI, 12 May 2026',
  },
  {
    value: '$1.1B',
    label: 'youth detention spend',
    detail: 'Detention-based supervision share of recurrent youth justice expenditure in 2024-25.',
    source: 'Productivity Commission RoGS 2026',
  },
  {
    value: '$1,414',
    label: 'NSW youth detention per day',
    detail: 'Compared with $135.51 per day for community-based supervision in 2018-19.',
    source: 'NSW BOCSAR 2021',
  },
];

const rooms = [
  {
    room: 'Room 1',
    title: 'The system that detains',
    body: 'A child can be held before sentence because the plan around them is missing: safe housing, transport, legal help, adult support, health care, or a realistic bail condition.',
    color: '#DC2626',
  },
  {
    room: 'Room 2',
    title: 'The supports that change the path',
    body: 'The alternative is not doing nothing. It is bail support, safe housing, legal help, cultural authority, family work, education, transport, and daily structure.',
    color: '#059669',
  },
  {
    room: 'Room 3',
    title: 'The work already happening',
    body: 'Local organisations name what they are doing, what evidence exists, what support is missing, and what needs to be funded before the next child reaches the cell.',
    color: '#0A0A0A',
  },
];

const actions = [
  'Walk through CONTAINED and send the /remand explainer to five people with decision power.',
  'Ask what youth detention receives compared with bail support, housing, legal help, and community-led programs.',
  'Use JusticeHub to find local services, verified alternatives, funding gaps, and source-backed claims.',
  'Back one practical support that would stop remand becoming the default answer.',
];

export default function DecisionMakerBriefPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="pt-40 print:pt-4">
        <section className="border-b-2 border-[#0A0A0A] py-8 print:py-3">
          <div className="container-justice">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  href="/contained"
                  className="mb-4 inline-flex items-center gap-2 py-3 text-sm font-bold uppercase tracking-widest text-[#756d63] hover:text-[#0A0A0A] print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to CONTAINED
                </Link>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626]" style={{ fontFamily: MONO }}>
                  CONTAINED 2026
                </p>
                <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                  Youth Remand Brief
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#514a42]">
                  A source-checked one-page brief for decision-makers walking through CONTAINED.
                  Research, not legal advice. Checked as of 3 June 2026 AEST.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-[#F5F0E8] print:hidden"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </section>

        <section className="py-8 print:py-4">
          <div className="container-justice max-w-4xl">
            <div className="mb-6 border-2 border-[#0A0A0A] bg-white p-6 print:p-4">
              <h2 className="mb-3 text-2xl font-black">
                Remand is custody before care has arrived.
              </h2>
              <p className="text-sm leading-7 text-[#514a42]">
                Remand means custody before sentence. A child on remand has not been sentenced.
                Many have not been convicted. They are held while the court process continues.
                The first question is not whether detention can hold them. The first question is what
                support would have kept the door open.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 print:grid-cols-4">
              {evidence.map((item) => (
                <article key={item.label} className="border-2 border-[#0A0A0A] bg-white p-4">
                  <div className="text-3xl font-black text-[#DC2626]" style={{ fontFamily: MONO }}>
                    {item.value}
                  </div>
                  <h3 className="mt-2 text-sm font-black uppercase leading-tight">{item.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#514a42]">{item.detail}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-[#756d63]" style={{ fontFamily: MONO }}>
                    {item.source}
                  </p>
                </article>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                <span className="inline-block h-1 w-8 bg-[#DC2626]" />
                What the three rooms show
              </h2>
              <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
                {rooms.map((room) => (
                  <article key={room.room} className="border-2 border-[#0A0A0A] bg-white p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: room.color, fontFamily: MONO }}>
                      {room.room}
                    </p>
                    <h3 className="text-lg font-black">{room.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#514a42]">{room.body}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-[1fr_320px]">
              <section className="border-2 border-[#0A0A0A] bg-white p-5">
                <h2 className="text-xl font-black">The design failure</h2>
                <p className="mt-3 text-sm leading-7 text-[#514a42]">
                  Bail was once a promise to return to court. It has become a prediction of risk.
                  Risk follows poverty, racism, homelessness, disability, family violence, remote geography,
                  and service gaps. When support is missing, detention starts to look like the only option.
                </p>
              </section>
              <aside className="border-2 border-[#0A0A0A] bg-[#0A0A0A] p-5 text-[#F5F0E8]">
                <h2 className="text-xl font-black text-[#F5F0E8]">The better question</h2>
                <p className="mt-3 text-sm leading-7 text-[#F5F0E8]/75">
                  What would it take to fund the supports that stop a child reaching the cell in the first place?
                </p>
              </aside>
            </div>

            <div className="border-2 border-[#0A0A0A] bg-white p-5">
              <h2 className="text-xl font-black">What you can do after walking through</h2>
              <ul className="mt-4 space-y-3">
                {actions.map((action) => (
                  <li key={action} className="flex gap-3 text-sm leading-6 text-[#514a42]">
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[#DC2626]" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid gap-2 border-t-2 border-[#0A0A0A] pt-4 text-sm font-bold md:grid-cols-4 print:grid-cols-4">
                <Link href="/remand" className="hover:text-[#DC2626]">justicehub.com.au/remand</Link>
                <Link href="/proof" className="hover:text-[#DC2626]">/proof</Link>
                <Link href="/follow-the-money" className="hover:text-[#DC2626]">/follow-the-money</Link>
                <Link href="/contained/reaction" className="hover:text-[#DC2626]">/contained/reaction</Link>
              </div>
            </div>

            <div className="mt-6 text-xs leading-5 text-[#756d63]">
              Sources: ABS Prisoners in Australia 2025; Productivity Commission RoGS 2026 Youth justice services;
              Australian Institute of Criminology, Bail and remand across Australia, 2026; Justice Reform Initiative
              releases dated 30 January 2026 and 12 May 2026; NSW BOCSAR Youth Bail Assistance Line evaluation, 2021.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
