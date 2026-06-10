import { Metadata } from 'next';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ANCHOR_COMMUNITIES } from '@/lib/communities/anchors';
import { loadAnchorIdentity } from '@/lib/communities/data';
import { serifDisplay } from '@/lib/communities/style';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Communities | Founding action-profiles | JusticeHub',
  description:
    'Community-controlled action-profiles for the founding anchor communities. Each profile is held by the organisation itself, built from public records, and confirmed by the community.',
};

export default async function CommunitiesIndexPage() {
  const profiles = await Promise.all(
    ANCHOR_COMMUNITIES.map(async (anchor) => ({
      anchor,
      identity: await loadAnchorIdentity(anchor),
    }))
  );

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
            The unit the work is made of
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-none md:text-6xl" style={serifDisplay}>
            Community action-profiles
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-7 text-[#eadff2]">
            One community-controlled organisation. What it runs, what it costs
            against detention, and what it is building. Each profile is held by
            the community that lives inside it.
          </p>
        </div>
      </section>

      {/* Founding profiles */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
          Founding profiles
        </p>
        <h2 className="mt-3 font-serif text-5xl leading-none" style={serifDisplay}>
          Four communities, building the model
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
          These four communities are shaping the profile with us before anyone
          else is listed. They are existing partners, and each one is the editor
          of record for its own page.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {profiles.map(({ anchor, identity }) => (
            <Link
              key={anchor.slug}
              href={`/communities/${anchor.slug}`}
              className="group block rounded-[24px] border border-[#eadfce] bg-[#fff8ef] p-6 shadow-[0_16px_40px_rgba(49,31,15,0.06)] transition-colors duration-150 hover:border-[#dbc7a9]"
            >
              <div className="flex flex-wrap items-center gap-2">
                {identity.state ? (
                  <span className="rounded-full border border-[#e6d7c1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d5f3d]">
                    {identity.state}
                  </span>
                ) : null}
                {identity.isIndigenousOrg ? (
                  <span className="rounded-full border border-[#dbc7a9] bg-[#f3eadb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]">
                    Aboriginal community-controlled
                  </span>
                ) : null}
                <span className="rounded-full border border-[#e6d7c1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d5f3d]">
                  Unclaimed profile
                </span>
              </div>

              <h3 className="mt-5 font-serif text-3xl leading-none group-hover:underline" style={serifDisplay}>
                {anchor.name}
              </h3>
              <p className="mt-3 text-sm font-medium text-[#7d5f3d]">
                {anchor.place}
              </p>
              <p className="mt-4 text-base leading-7 text-[#584b40]">
                {anchor.summary}
              </p>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Open profile
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* The justice reinvestment map */}
      <section className="border-t border-[#eadfce] bg-[#faf5ec]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
            The justice reinvestment map
          </p>
          <h2 className="mt-3 font-serif text-5xl leading-none" style={serifDisplay}>
            The whole movement, on one map
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
            Beyond the four founding profiles sits the wider network. Every
            justice reinvestment initiative we can find, grouped by the place it
            serves, with the lead organisation named wherever the record holds
            one and the gaps shown openly.
          </p>

          <Link
            href="/communities/justice-reinvestment"
            className="group mt-8 block rounded-[24px] border border-[#4a2560]/30 bg-[#4a2560] p-8 text-[#f1e6f7] shadow-[0_18px_44px_rgba(49,18,68,0.18)] transition-colors duration-150 hover:bg-[#5a2f6f]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d7c2e3]">
              The Network
            </p>
            <h3
              className="mt-4 font-serif text-3xl leading-none group-hover:underline"
              style={serifDisplay}
            >
              Open the justice reinvestment network view
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#eadff2]">
              The view the network co-directors see: an honest count, grouped by
              state, with a clear section for the initiatives whose place is
              still to confirm.
            </p>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#cbb1dc]">
              See the map
            </p>
          </Link>
        </div>
      </section>

      {/* How the model works */}
      <section className="border-t border-[#eadfce] bg-[#faf5ec]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
            How a profile works
          </p>
          <h2 className="mt-3 font-serif text-5xl leading-none" style={serifDisplay}>
            The community holds the pen
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
            A profile is never written about a community. It is written by the
            community. We can stage a page from public records, but nothing
            becomes confirmed until the organisation reviews it and chooses what
            the world may see.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-[22px] border border-[#eadfce] bg-[#fffaf3] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Editor of record
              </p>
              <h3 className="mt-3 font-serif text-2xl leading-7" style={serifDisplay}>
                The organisation owns its page
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#584b40]">
                Each profile has an owning community organisation. We can stage,
                they publish. Nothing reaches their page without their approval.
              </p>
            </div>
            <div className="rounded-[22px] border border-[#eadfce] bg-[#fffaf3] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Visibility by section
              </p>
              <h3 className="mt-3 font-serif text-2xl leading-7" style={serifDisplay}>
                Public, community, or private
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#584b40]">
                Every section carries its own visibility. Some things are for
                everyone, some are shared by permission, some are held only for
                the community's own use.
              </p>
            </div>
            <div className="rounded-[22px] border border-[#eadfce] bg-[#fffaf3] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Verification ladder
              </p>
              <h3 className="mt-3 font-serif text-2xl leading-7" style={serifDisplay}>
                Honest about what is confirmed
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#584b40]">
                A profile climbs a public trust ladder: unclaimed, then
                org-confirmed, then community-verified. We show exactly which
                rung a page is on.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[22px] border border-[#e6d7c1] bg-[#f3eadb] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d5f3d]">
              The ladder, in plain words
            </p>
            <dl className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <dt className="font-serif text-xl" style={serifDisplay}>Unclaimed</dt>
                <dd className="mt-1 text-sm leading-6 text-[#584b40]">
                  Built from public records. The community has not yet confirmed
                  it.
                </dd>
              </div>
              <div>
                <dt className="font-serif text-xl" style={serifDisplay}>Org-confirmed</dt>
                <dd className="mt-1 text-sm leading-6 text-[#584b40]">
                  The organisation reviewed the page and approved what it shows.
                </dd>
              </div>
              <div>
                <dt className="font-serif text-xl" style={serifDisplay}>Community-verified</dt>
                <dd className="mt-1 text-sm leading-6 text-[#584b40]">
                  Outcomes confirmed with the community's own evidence.
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-8 max-w-3xl text-sm leading-6 text-[#5e5145]">
            Only these founding communities are listed for now. Every other
            organisation stays unlisted until it has been through co-design.
            That order is the point: the community decides before the page goes
            public.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
