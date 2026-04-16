import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  MapPinned,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Alice Springs Local Context | Judges on Country | JusticeHub',
  description:
    'A public Mparntwe / Alice Springs snapshot linking Oonchiumpa, postcode 0870 funding data, and the next JusticeHub routes to open after Judges on Country.',
};

type CapitalRow = {
  total_funding: number | null;
  community_controlled_funding: number | null;
  entity_count: number | null;
  community_controlled_count: number | null;
  relationship_count: number | null;
  remoteness: string | null;
  seifa_irsd_decile: number | null;
};

type FundingRow = {
  program_name: string | null;
  amount_dollars: number | null;
  financial_year: string | null;
  source: string | null;
  location: string | null;
};

function formatCurrency(value: number | null | undefined, compact = false): string {
  if (value == null || !Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}

function formatWhole(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-AU').format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'N/A';
  return `${value.toFixed(1)}%`;
}

async function getAliceSpringsSnapshot(): Promise<{
  capital: CapitalRow | null;
  funding: FundingRow | null;
  communityControlledFundingShare: number | null;
}> {
  // Cast to a loosely-typed client to avoid TS2589 (excessively deep) from the
  // generated Database types when chaining .from().select() on wide views.
  const supabase = createServiceClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq?: (column: string, value: string) => {
            order: (column: string, opts: { ascending: boolean }) => {
              limit: (n: number) => {
                maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
              };
            };
          };
          order: (column: string, opts: { ascending: boolean }) => {
            limit: (n: number) => {
              maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
            };
          };
        };
      };
    };
  };

  const [capitalResult, fundingResult] = await Promise.all([
    supabase
      .from('mv_funding_by_postcode')
      .select(
        'total_funding, community_controlled_funding, entity_count, community_controlled_count, relationship_count, remoteness, seifa_irsd_decile'
      )
      .eq('postcode', '0870')
      .eq!('state', 'NT')
      .order('total_funding', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('justice_funding')
      .select('program_name, amount_dollars, financial_year, source, location')
      .eq('recipient_abn', '53658668627')
      .order('amount_dollars', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const capital = (capitalResult.data ?? null) as CapitalRow | null;
  const funding = (fundingResult.data ?? null) as FundingRow | null;
  const communityControlledFundingShare =
    capital?.total_funding && capital.community_controlled_funding != null
      ? Number(((capital.community_controlled_funding / capital.total_funding) * 100).toFixed(1))
      : null;

  return {
    capital,
    funding,
    communityControlledFundingShare,
  };
}

const CORE_STATS = [
  { value: '95%', label: 'Diversion success' },
  { value: '72%', label: 'School re-engagement' },
  { value: '97.6%', label: 'Cheaper than detention' },
  { value: '32+', label: 'Partner organisations' },
] as const;

const NEXT_ROUTES = [
  {
    title: 'Open the Oonchiumpa profile',
    description: 'Start with the founders, the core service context, and the judiciary lens.',
    href: '/organizations/oonchiumpa',
  },
  {
    title: 'Read the long-form story',
    description: 'Keep the consented youth voices, Xavier story, and the practice model close.',
    href: '/alma/oonchiumpa',
  },
  {
    title: 'See Atnarpa and the on-country route',
    description: 'Open the site page for place, gallery, and cultural practice context.',
    href: '/sites/oonchiumpa',
  },
  {
    title: 'Search your own local area',
    description: 'Move from Alice Springs into the alternatives, interventions, and routes near your court.',
    href: '/judges-on-country#search',
  },
] as const;

const PASS_IT_ON = [
  'Write one sentence about what changed for you in Alice Springs.',
  'Send this page to one judge, police leader, child protection worker, or MP.',
  'Ask them to search their own area before they speak about youth justice again.',
] as const;

export default async function AliceSpringsJudgesContextPage() {
  const { capital, funding, communityControlledFundingShare } = await getAliceSpringsSnapshot();

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        <section className="border-b-2 border-black bg-[#0A0A0A] text-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="mb-4 font-mono text-sm uppercase tracking-[0.28em] text-[#059669]">
              Judges on Country
            </p>
            <h1 className="mb-4 text-4xl font-black tracking-tight md:text-6xl">
              Alice Springs / Mparntwe
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-white/75 md:text-xl">
              This is the public local-context route for the Oonchiumpa postcards. Start with the
              people leading the work, keep postcode 0870 in view, and use the links below to move
              from one story in Alice Springs to the local systems picture and then back into your
              own community.
            </p>
          </div>
        </section>

        <section className="border-b-2 border-black">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 py-10 md:grid-cols-4">
            {CORE_STATS.map((stat) => (
              <div key={stat.label} className="border-2 border-black bg-white p-5">
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border-2 border-black bg-white p-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Users className="h-5 w-5 text-[#DC2626]" />
              </div>
              <h2 className="mb-3 text-2xl font-black">What Oonchiumpa proves locally</h2>
              <p className="mb-4 text-sm leading-relaxed text-gray-700">
                Oonchiumpa is an Aboriginal community-controlled organisation working across 7
                language groups within 150km of Mparntwe. The strongest public story stack in
                JusticeHub is simple: diversion works better, school re-engagement is possible, and
                community-led responses cost far less than detention.
              </p>
              <p className="text-sm leading-relaxed text-gray-700">
                This is why Kristy Bloomfield, Tanya Turner, Jackquann, Nigel, Laquisha, Fred, and
                Xavier belong on the cards before any abstract policy language does.
              </p>
            </div>

            <div className="border-2 border-black bg-white p-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#059669]/10">
                <MapPinned className="h-5 w-5 text-[#059669]" />
              </div>
              <h2 className="mb-3 text-2xl font-black">What postcode 0870 shows</h2>
              <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                <p>
                  <strong>{formatCurrency(capital?.total_funding, true)}</strong> tracked into postcode
                  0870 across <strong>{formatWhole(capital?.entity_count)}</strong> mapped entities and{' '}
                  <strong>{formatWhole(capital?.relationship_count)}</strong> funding relationships.
                </p>
                <p>
                  <strong>{formatWhole(capital?.community_controlled_count)}</strong> mapped entities are
                  community-controlled, but only{' '}
                  <strong>{formatPercent(communityControlledFundingShare)}</strong> of traced funding is
                  flowing to community-controlled organisations.
                </p>
                <p>
                  GrantScope also holds a verified Oonchiumpa line item:{' '}
                  <strong>{formatCurrency(funding?.amount_dollars)}</strong> for{' '}
                  <strong>{funding?.program_name ?? 'NIAA Central Australia Youth Safety'}</strong> in{' '}
                  <strong>{funding?.financial_year ?? '2023-24'}</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y-2 border-black bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="mb-8 max-w-3xl">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                Where To Go Next
              </p>
              <h2 className="mb-4 text-3xl font-black">Use this route stack deliberately.</h2>
              <p className="text-sm leading-relaxed text-gray-700">
                Each page does a different job. The profile holds the service frame. The story holds
                the voices. The site page holds country. The search route turns Alice Springs into a
                question for every other local area.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {NEXT_ROUTES.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group border-2 border-black p-6 transition-colors hover:bg-[#F5F0E8]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-[#059669]" />
                    <h3 className="text-xl font-black">{route.title}</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-700">{route.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0A0A0A]">
                    Open route
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="border-2 border-black bg-[#0A0A0A] p-8 text-white">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                <Shield className="h-5 w-5 text-[#059669]" />
              </div>
              <h2 className="mb-4 text-3xl font-black">Pass it on like a campaign, not a souvenir.</h2>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-gray-300">
                The point of the postcard is not to remember the visit politely. It is to move one
                more person into contact with what community-led practice in Alice Springs actually
                looks like, and then force the question back onto their own jurisdiction.
              </p>
              <div className="space-y-3">
                {PASS_IT_ON.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-gray-200">
                    <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#059669] text-[11px] font-bold text-white">
                      <span>+</span>
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-black bg-white p-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Search className="h-5 w-5 text-[#DC2626]" />
              </div>
              <h2 className="mb-3 text-2xl font-black">Take it back to chambers</h2>
              <p className="mb-5 text-sm leading-relaxed text-gray-700">
                Use the judges field guide after the trip. Search the live alternatives, hold onto
                the local proof, and keep the Alice Springs lesson in the room when your own matters
                are being heard.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/judges-on-country#connect"
                  className="inline-flex items-center justify-center gap-2 bg-[#DC2626] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
                >
                  Open take-back-to-chambers
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/intelligence/civic?region=NT"
                  className="inline-flex items-center justify-center gap-2 border-2 border-black px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-[#F5F0E8]"
                >
                  Open NT accountability view
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
