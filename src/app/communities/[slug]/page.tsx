import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ANCHOR_COMMUNITIES, getAnchorBySlug } from '@/lib/communities/anchors';
import { loadCommunityProfile } from '@/lib/communities/data';
import { serifDisplay } from '@/lib/communities/style';

export const revalidate = 300;

const CLAIM_EMAIL = 'hello@justicehub.com.au';

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

export function generateStaticParams() {
  return ANCHOR_COMMUNITIES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const anchor = getAnchorBySlug(slug);
  if (!anchor) {
    return { title: 'Community profile | JusticeHub' };
  }
  return {
    title: `${anchor.name} | Community action-profile | JusticeHub`,
    description: `${anchor.name}: ${anchor.summary} An unclaimed community-controlled profile, built from public records.`,
  };
}

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const anchor = getAnchorBySlug(slug);
  if (!anchor) {
    notFound();
  }

  const profile = await loadCommunityProfile(anchor);
  const { org, programs, funding, matched } = profile;

  const claimSubject = encodeURIComponent(
    `Claim our profile: ${anchor.name}`
  );
  const claimBody = encodeURIComponent(
    `Kia ora, we are the organisation behind the ${anchor.name} profile on JusticeHub and would like to claim and confirm it.`
  );
  const claimHref = `mailto:${CLAIM_EMAIL}?subject=${claimSubject}&body=${claimBody}`;

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      <Navigation />

      {/* Hero / identity */}
      <section className="relative overflow-hidden bg-[#4a2560] text-[#f1e6f7]">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <Link
            href="/communities"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7c2e3] hover:underline"
          >
            Founding profiles
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {org.state ? (
              <span className="rounded-full border border-[#d3b583] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ead7f3]">
                {org.state}
              </span>
            ) : null}
            {org.isIndigenousOrg ? (
              <span className="rounded-full border border-[#d3b583] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f3e8f8]">
                Aboriginal community-controlled
              </span>
            ) : null}
            <span className="rounded-full border border-[#d3b583] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ead7f3]">
              Unclaimed profile
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-none md:text-6xl" style={serifDisplay}>
            {org.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium text-[#e8d7f0]">
            {anchor.place}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-[#eadff2]">
            {anchor.summary}
          </p>
        </div>
      </section>

      {/* Verification banner */}
      <section className="border-b border-[#e6d7c1] bg-[#f3eadb]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d5f3d]">
              Unclaimed profile
            </p>
            <p className="mt-2 text-sm leading-6 text-[#584b40]">
              This page was built from public records. This community has not
              yet confirmed it. Until it does, treat everything here as a draft
              awaiting the organisation's own review.
            </p>
          </div>
          <a
            href={claimHref}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#4a2560] bg-[#4a2560] px-5 py-2.5 text-sm font-semibold text-[#f5ecdf] transition-colors duration-150 hover:bg-[#3c1d50]"
          >
            This is your organisation?
          </a>
        </div>
      </section>

      {/* Programs + cost context */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr]">
          {/* Programs */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
              What this community runs
            </p>
            <h2 className="mt-3 font-serif text-5xl leading-none" style={serifDisplay}>Programs</h2>

            {programs.length === 0 ? (
              <p className="mt-6 max-w-2xl rounded-[22px] border border-[#eadfce] bg-[#fff8ef] p-6 text-base leading-7 text-[#584b40]">
                {matched
                  ? 'No programs are recorded against this organisation in the public map yet. The community will add what it runs once it claims the page.'
                  : 'This organisation has not yet been linked in the public map. The community will add what it runs once it claims the page.'}
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {programs.map((program) => (
                  <article
                    key={program.id}
                    className="rounded-[22px] border border-[#eadfce] bg-[#fff8ef] p-6 shadow-[0_16px_40px_rgba(49,31,15,0.06)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {program.type ? (
                        <span className="rounded-full border border-[#e6d7c1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d5f3d]">
                          {program.type}
                        </span>
                      ) : null}
                      {program.evidenceLevel ? (
                        <span className="rounded-full border border-[#e6d7c1] bg-[#f3eadb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]">
                          {program.evidenceLevel}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 font-serif text-2xl leading-7" style={serifDisplay}>
                      {program.name}
                    </h3>
                    {program.description ? (
                      <p className="mt-3 text-base leading-7 text-[#584b40]">
                        {program.description}
                      </p>
                    ) : null}
                    {program.costPerYoungPerson != null ? (
                      <p className="mt-4 text-sm font-medium text-[#5e5145]">
                        About {currency.format(program.costPerYoungPerson)} per
                        young person, per year.
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Cost context */}
          <aside className="lg:pt-[4.75rem]">
            <div className="rounded-[24px] border border-[#e6d7c1] bg-[#3c1d50] p-7 text-[#f1e6f7] shadow-[0_10px_30px_rgba(10,3,20,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7c2e3]">
                The comparison that matters
              </p>
              <p className="mt-4 font-serif text-3xl leading-none" style={serifDisplay}>
                {currency.format(1330000)}
              </p>
              <p className="mt-3 text-base leading-7 text-[#eadff2]">
                Detention costs about {currency.format(1330000)} per young
                person, per year.
              </p>
              <p className="mt-4 text-xs leading-5 text-[#d7c2e3]">
                Source: Report on Government Services 2024-25, national average.
              </p>
              <p className="mt-5 border-t border-[rgba(255,255,255,0.18)] pt-5 text-sm leading-6 text-[#e8d7f0]">
                Set the cost of a program beside that figure. The case for
                community-controlled work is made site by site, in this margin.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Funding */}
      {funding.length > 0 ? (
        <section className="border-t border-[#eadfce] bg-[#faf5ec]">
          <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
              Where the money came from
            </p>
            <h2 className="mt-3 font-serif text-5xl leading-none" style={serifDisplay}>
              Funding history
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
              Every figure is shown with the record it came from. The community
              chooses what stays here once it claims the page.
            </p>

            <div className="mt-8 overflow-hidden rounded-[22px] border border-[#eadfce] bg-[#fffaf3]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eadfce] text-[11px] uppercase tracking-[0.12em] text-[#7d5f3d]">
                    <th className="px-5 py-4 font-semibold">Program</th>
                    <th className="px-5 py-4 font-semibold">Year</th>
                    <th className="px-5 py-4 font-semibold">Source</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funding.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#f0e6d6] last:border-b-0 align-top text-[#584b40]"
                    >
                      <td className="px-5 py-4">
                        {row.programName || 'Not stated'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {row.financialYear || 'Not stated'}
                      </td>
                      <td className="px-5 py-4">{row.source || 'Not stated'}</td>
                      <td className="px-5 py-4 text-right tabular-nums font-medium text-[#2b2530]">
                        {row.amountDollars != null
                          ? currency.format(row.amountDollars)
                          : 'Not stated'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {/* Claim footer */}
      <section className="border-t border-[#eadfce]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
          <div className="rounded-[26px] border border-[#e6d7c1] bg-[#fff8ef] p-8 shadow-[0_16px_45px_rgba(49,31,15,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
              Claim this profile
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-none" style={serifDisplay}>
              If this is your organisation, the pen is yours
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#584b40]">
              Email us and we will hand you the page. You decide what it shows,
              what stays private, and what the world may see.
            </p>
            <a
              href={claimHref}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-[#4a2560] bg-[#4a2560] px-6 py-3 text-sm font-semibold text-[#f5ecdf] transition-colors duration-150 hover:bg-[#3c1d50]"
            >
              Email {CLAIM_EMAIL}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
