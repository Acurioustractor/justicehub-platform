import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ANCHOR_COMMUNITIES, getAnchorBySlug } from '@/lib/communities/anchors';
import { serifDisplay } from '@/lib/communities/style';
import { ClaimProfile } from './ClaimProfile';

export const revalidate = 300;

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
    return { title: 'Claim a community profile | JusticeHub' };
  }
  return {
    title: `Claim ${anchor.name} | JusticeHub`,
    description: `Become the editor of record for the ${anchor.name} community profile on JusticeHub.`,
  };
}

export default async function ClaimProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const anchor = getAnchorBySlug(slug);
  if (!anchor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      <Navigation />

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
        <div className="relative mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">
          <Link
            href={`/communities/${anchor.slug}`}
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7c2e3] hover:underline"
          >
            Back to {anchor.name}
          </Link>
          <h1
            className="mt-6 max-w-3xl font-serif text-5xl leading-none md:text-6xl"
            style={serifDisplay}
          >
            Claim the {anchor.name} profile
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-7 text-[#eadff2]">
            {anchor.place}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* What claiming means */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
              What claiming means
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-none" style={serifDisplay}>
              The pen becomes yours
            </h2>

            <div className="mt-6 space-y-5 text-base leading-7 text-[#584b40]">
              <p>
                When you claim this profile, you become the editor of record. You
                decide what the page shows, what stays private, and what the world
                may see. The profile is your organisation's, under your hand.
              </p>
              <p>
                We confirm by talking to you, not by an automated check. There is
                no password to guess and no document to upload. A person from
                JusticeHub reaches out and confirms with you directly.
              </p>
              <p>
                Nothing on your profile changes until you approve it. The page you
                see today was built from public records and marked unclaimed.
                Claiming opens the door to editing, and you choose every change
                from there.
              </p>
            </div>

            <div className="mt-7 rounded-[20px] border border-[#eadfce] bg-[#fff8ef] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                After you claim
              </p>
              <ul className="mt-3 space-y-2 text-[15px] leading-6 text-[#584b40]">
                <li>You hold the pen on every section of the profile.</li>
                <li>
                  Your stories sit under your consent, told on your terms, shared
                  only where you choose.
                </li>
                <li>
                  Anything we hold goes in under consent, comes back out at your
                  request, and is deleted when you ask.
                </li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="lg:pt-[3.25rem]">
            <ClaimProfile orgSlug={anchor.slug} orgName={anchor.name} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
