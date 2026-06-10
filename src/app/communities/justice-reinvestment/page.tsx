import { Metadata } from 'next';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ANCHOR_COMMUNITIES } from '@/lib/communities/anchors';
import { loadJusticeReinvestmentNetwork } from '@/lib/communities/justice-reinvestment';
import { serifDisplay } from '@/lib/communities/style';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'The justice reinvestment network | JusticeHub',
  description:
    'Every justice reinvestment initiative we can find, on one map, grouped by place. An honest count, lead organisations named where known, and the gaps shown openly so the network can correct them.',
};

function VerificationChip({ status }: { status: string | null }) {
  if (status === 'community_verified') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7a9a6b] bg-[#eef3e6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a6138]">
        <span aria-hidden className="text-base leading-none">&#9733;</span>
        Community verified
      </span>
    );
  }
  if (status === 'verified') {
    return (
      <span className="rounded-full border border-[#e6d7c1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d5f3d]">
        Verified record
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#e6d7c1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d5f3d]">
      On record
    </span>
  );
}

export default async function JusticeReinvestmentNetworkPage() {
  const { groups, counts } = await loadJusticeReinvestmentNetwork();

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      <Navigation />

      {/* Hero */}
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d7c2e3]">
            The Network
          </p>
          <h1
            className="mt-5 max-w-4xl font-serif text-5xl leading-none md:text-6xl"
            style={serifDisplay}
          >
            The justice reinvestment movement, seeing itself on one map
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-7 text-[#eadff2]">
            A movement is easier to fund and harder to ignore once it can see
            its own shape. Here is every justice reinvestment initiative we have
            been able to find, grouped by the place it serves, with the lead
            organisation named wherever the record holds one.
          </p>

          <dl className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
            <div className="rounded-[18px] border border-[#6a4a82] bg-[#3c1d53] px-5 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbb1dc]">
                Initiatives on the map
              </dt>
              <dd className="mt-2 font-serif text-4xl" style={serifDisplay}>
                {counts.total}
              </dd>
            </div>
            <div className="rounded-[18px] border border-[#6a4a82] bg-[#3c1d53] px-5 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbb1dc]">
                With a known lead organisation
              </dt>
              <dd className="mt-2 font-serif text-4xl" style={serifDisplay}>
                {counts.withLeadOrg}
              </dd>
            </div>
            <div className="rounded-[18px] border border-[#6a4a82] bg-[#3c1d53] px-5 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbb1dc]">
                States and territories
              </dt>
              <dd className="mt-2 font-serif text-4xl" style={serifDisplay}>
                {counts.states}
              </dd>
            </div>
          </dl>

          <p className="mt-6 max-w-2xl text-sm leading-6 text-[#d7c2e3]">
            These numbers are what the public record shows today, not the whole
            movement. Where a place or a lead organisation is missing, we say so
            and ask the network to fill it in.
          </p>
        </div>
      </section>

      {/* Grouped sections by state */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
          Grouped by place
        </p>
        <h2 className="mt-3 font-serif text-5xl leading-none" style={serifDisplay}>
          The map, state by state
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
          Each initiative sits with the place it serves, drawn from the lead
          organisation on record. Read the verification mark beside each one as
          a trust signal: a record we hold, a record confirmed, or outcomes a
          community has verified with its own evidence.
        </p>

        <div className="mt-12 space-y-14">
          {groups.map((group) => {
            const isConfirmBucket = group.key === 'place-to-confirm';
            return (
              <div key={group.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#eadfce] pb-4">
                  <h3
                    className="font-serif text-4xl leading-none"
                    style={serifDisplay}
                  >
                    {group.label}
                  </h3>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6a44]">
                    {group.initiatives.length}{' '}
                    {group.initiatives.length === 1
                      ? 'initiative'
                      : 'initiatives'}
                  </p>
                </div>

                {isConfirmBucket ? (
                  <p className="mt-5 max-w-3xl rounded-[16px] border border-[#e6d7c1] bg-[#f3eadb] px-5 py-4 text-sm leading-6 text-[#5e5145]">
                    These initiatives are real and on the record, but we do not
                    yet hold the place or the lead organisation for them. If one
                    of these is yours, or you know where it belongs, tell us and
                    we will move it to its Country. The gap is the invitation.
                  </p>
                ) : null}

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {group.initiatives.map((initiative) => (
                    <div
                      key={initiative.id}
                      className="rounded-[20px] border border-[#eadfce] bg-[#fff8ef] p-6 shadow-[0_14px_36px_rgba(49,31,15,0.05)]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <VerificationChip
                          status={initiative.verificationStatus}
                        />
                        {initiative.isIndigenousOrg ? (
                          <span className="rounded-full border border-[#dbc7a9] bg-[#f3eadb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]">
                            Aboriginal community-controlled
                          </span>
                        ) : null}
                      </div>

                      <h4
                        className="mt-4 font-serif text-2xl leading-7"
                        style={serifDisplay}
                      >
                        {initiative.name}
                      </h4>

                      <p className="mt-3 text-sm font-medium text-[#7d5f3d]">
                        {initiative.orgName
                          ? initiative.orgName
                          : 'Lead organisation to confirm'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* From data to network */}
      <section className="border-t border-[#eadfce] bg-[#faf5ec]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
            What this becomes
          </p>
          <h2 className="mt-3 font-serif text-5xl leading-none" style={serifDisplay}>
            From data to network
          </h2>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3
                className="font-serif text-2xl leading-7"
                style={serifDisplay}
              >
                Profiles the community holds
              </h3>
              <p className="mt-3 text-base leading-7 text-[#584b40]">
                Today each line is a record we hold. Next it becomes a profile
                the organisation owns and edits, where the community decides what
                the world may see. We can stage a page; they publish it. See the{' '}
                <Link
                  href="/communities"
                  className="font-medium text-[#4a2560] underline decoration-[#c9add8] underline-offset-2"
                >
                  founding action-profiles
                </Link>{' '}
                for how that works.
              </p>
            </div>

            <div>
              <h3
                className="font-serif text-2xl leading-7"
                style={serifDisplay}
              >
                Evidence beside detention costs
              </h3>
              <p className="mt-3 text-base leading-7 text-[#584b40]">
                A profile carries what a program runs and what it costs, set
                against the price of detaining a child for a year. When the
                ledger sits in plain view, the question stops being whether to
                fund the community and starts being why we still fund the cell.
              </p>
            </div>

            <div>
              <h3
                className="font-serif text-2xl leading-7"
                style={serifDisplay}
              >
                The law reform case
              </h3>
              <p className="mt-3 text-base leading-7 text-[#584b40]">
                One site proves a model. Many sites, read together, become an
                argument a parliament cannot wave away. The map is how the
                movement makes that argument site by site, in its own words,
                with its own evidence.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-[22px] border border-[#e6d7c1] bg-[#f3eadb] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d5f3d]">
              The four founding profiles
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5e5145]">
              Four communities are shaping the profile with us before anyone
              else is listed. Each is the editor of record for its own page.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {ANCHOR_COMMUNITIES.map((anchor) => (
                <Link
                  key={anchor.slug}
                  href={`/communities/${anchor.slug}`}
                  className="rounded-full border border-[#dbc7a9] bg-[#fffaf3] px-4 py-2 text-sm font-medium text-[#6e5a42] transition-colors duration-150 hover:border-[#c9a877]"
                >
                  {anchor.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
