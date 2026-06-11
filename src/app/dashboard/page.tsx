/**
 * /dashboard — org home (dashboard backend increment 2: shell + profile read).
 *
 * Read-only over existing tables: organizations, organization_members,
 * alma_interventions, justice_funding. No new tables, no writes. The story
 * panel (Empathy Ledger) and outcome tracking arrive in later increments and
 * say so honestly rather than pretending.
 *
 * Membership rules: any ACTIVE organization_members row gets the org home.
 * Multiple orgs get a picker. Admins are not implicit members.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navigation, Footer } from '@/components/ui/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your organisation | JusticeHub',
};

const SERIF = "'Cormorant Garamond', Georgia, serif";
const OWNER_ROLES = ['owner', 'admin'];

function formatAud(n: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org: orgParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard');

  const { data: membershipRows } = await supabase
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active');
  const memberships = membershipRows ?? [];

  // No org yet: point at the claim path instead of a dead end.
  if (memberships.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f1e6] text-[#2b2530] flex flex-col">
        <Navigation />
        <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
            Your organisation
          </p>
          <h1
            className="mt-3 text-4xl"
            style={{ fontFamily: SERIF, fontWeight: 500 }}
          >
            No organisation linked to this account yet
          </h1>
          <p className="mt-5 text-base leading-7">
            If your organisation has a profile on JusticeHub, the way in is the
            claim button on that profile. A real person talks with you to
            confirm, then sends an invite that makes this account the editor of
            record.
          </p>
          <Link
            href="/communities"
            className="mt-7 inline-flex rounded-full bg-[#4a2560] px-6 py-3 text-sm font-semibold text-[#f1e6f7]"
          >
            Find your community&apos;s profile
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const orgIds = memberships.map((m) => m.organization_id);
  const { data: orgRows } = await supabase
    .from('organizations')
    .select('id, name, slug, description, state, website_url, website, abn, is_indigenous_org')
    .in('id', orgIds);
  const orgs = orgRows ?? [];
  const roleByOrg = new Map(memberships.map((m) => [m.organization_id, m.role]));

  // More than one org and none chosen: picker.
  const selected =
    (orgParam && orgs.find((o) => o.id === orgParam)) ||
    (orgs.length === 1 ? orgs[0] : null);

  if (!selected) {
    return (
      <div className="min-h-screen bg-[#f8f1e6] text-[#2b2530] flex flex-col">
        <Navigation />
        <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
            Your organisations
          </p>
          <h1
            className="mt-3 text-4xl"
            style={{ fontFamily: SERIF, fontWeight: 500 }}
          >
            Choose an organisation
          </h1>
          <div className="mt-8 grid gap-4">
            {orgs.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard?org=${o.id}`}
                className="rounded-[18px] border border-[#e2d5c0] bg-[#fffaf3] p-5 transition-colors hover:border-[#4a2560]"
              >
                <span
                  className="text-2xl"
                  style={{ fontFamily: SERIF, fontWeight: 500 }}
                >
                  {o.name}
                </span>
                <span className="ml-3 text-xs uppercase tracking-[0.14em] text-[#8d6a44]">
                  {roleByOrg.get(o.id)}
                </span>
              </Link>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const myRole = roleByOrg.get(selected.id) ?? 'member';
  const holdsThePen = OWNER_ROLES.includes(myRole);

  // Claim status, derived: an org with an active owner/admin is org-confirmed.
  // (community-verified arrives with org_settings in increment 3.)
  const { data: ownerRows } = await supabase
    .from('organization_members')
    .select('id, role, status')
    .eq('organization_id', selected.id)
    .eq('status', 'active');
  const roster = ownerRows ?? [];
  const orgConfirmed = roster.some((m) => OWNER_ROLES.includes(m.role));

  // Programs on the public record (ai_generated never reaches members either).
  const { data: programRows } = await supabase
    .from('alma_interventions')
    .select('id, name, description')
    .eq('operating_organization_id', selected.id)
    .neq('verification_status', 'ai_generated')
    .order('name')
    .limit(8);
  const programs = programRows ?? [];

  // Funding on the public record, provenance attached.
  const { data: fundingRows } = await supabase
    .from('justice_funding')
    .select('id, program_name, amount_dollars, financial_year, source, source_url, announcement_date')
    .eq('alma_organization_id', selected.id)
    .order('announcement_date', { ascending: false, nullsFirst: false })
    .limit(6);
  const funding = fundingRows ?? [];
  const fundingTotal = funding.reduce((sum, f) => sum + (Number(f.amount_dollars) || 0), 0);

  // Profile completeness: share of the public-identity fields that are filled.
  const fields = [
    selected.name,
    selected.description,
    selected.website_url || selected.website,
    selected.state,
    selected.abn,
  ];
  const completeness = Math.round(
    (fields.filter((f) => f && String(f).trim().length > 0).length / fields.length) * 100
  );

  const kicker = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]';
  const card = 'rounded-[20px] border border-[#e2d5c0] bg-[#fffaf3] p-6';

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#2b2530] flex flex-col">
      <Navigation />

      <section className="bg-[#4a2560] text-[#f1e6f7]">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9add8]">
            Org dashboard
          </p>
          <h1
            className="mt-3 text-5xl leading-tight"
            style={{ fontFamily: SERIF, fontWeight: 500 }}
          >
            {selected.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full border border-[#c9add8] px-3 py-1 uppercase tracking-[0.14em]">
              {orgConfirmed ? 'Org-confirmed' : 'Unclaimed'}
            </span>
            <span className="rounded-full border border-[#c9add8] px-3 py-1 uppercase tracking-[0.14em]">
              Your role: {myRole}
            </span>
            {selected.state ? (
              <span className="rounded-full border border-[#c9add8] px-3 py-1 uppercase tracking-[0.14em]">
                {selected.state}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className={card}>
            <p className={kicker}>Profile completeness</p>
            <p
              className="mt-3 text-5xl"
              style={{ fontFamily: SERIF, fontWeight: 500 }}
            >
              {completeness}%
            </p>
            <p className="mt-2 text-sm leading-6">
              Name, story, website, state and ABN on the public record.
            </p>
          </div>
          <div className={card}>
            <p className={kicker}>Programs listed</p>
            <p
              className="mt-3 text-5xl"
              style={{ fontFamily: SERIF, fontWeight: 500 }}
            >
              {programs.length}
            </p>
            <p className="mt-2 text-sm leading-6">
              What the public record shows today, not everything you run.
            </p>
          </div>
          <div className={card}>
            <p className={kicker}>People with access</p>
            <p
              className="mt-3 text-5xl"
              style={{ fontFamily: SERIF, fontWeight: 500 }}
            >
              {roster.length}
            </p>
            <p className="mt-2 text-sm leading-6">
              Active members of this dashboard.
              {holdsThePen ? ' You hold the pen.' : ''}
            </p>
          </div>
        </div>

        <section className="mt-10">
          <p className={kicker}>About</p>
          <p className="mt-3 max-w-3xl text-base leading-7">
            {selected.description ??
              'No description on the public record yet. Profile editing lands in the next increment; this is where your own words will go.'}
          </p>
          {selected.slug ? (
            <Link
              href={`/communities/${selected.slug}`}
              className="mt-4 inline-flex text-sm font-semibold text-[#4a2560] underline decoration-[#c9add8] underline-offset-2"
            >
              See your public profile
            </Link>
          ) : null}
        </section>

        <section className="mt-12">
          <p className={kicker}>Programs on the record</p>
          {programs.length === 0 ? (
            <p className="mt-3 text-sm leading-6">
              No programs linked yet. The Australian Living Map of Alternatives
              team can link your programs, or they arrive when your profile is
              confirmed.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {programs.map((p) => (
                <div key={p.id} className={card}>
                  <h3
                    className="text-xl leading-6"
                    style={{ fontFamily: SERIF, fontWeight: 500 }}
                  >
                    {p.name}
                  </h3>
                  {p.description ? (
                    <p className="mt-2 text-sm leading-6 line-clamp-3">{p.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <p className={kicker}>Funding on the public record</p>
          {funding.length === 0 ? (
            <p className="mt-3 text-sm leading-6">
              No grants attributed to this organisation in the public funding
              record yet.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6">
                {funding.length} most recent entries totalling{' '}
                <strong>{formatAud(fundingTotal)}</strong>. Every line carries
                its source.
              </p>
              <div className="mt-4 overflow-hidden rounded-[20px] border border-[#e2d5c0]">
                <table className="w-full bg-[#fffaf3] text-sm">
                  <thead>
                    <tr className="border-b border-[#e2d5c0] text-left">
                      <th className="px-4 py-3 font-semibold">Program</th>
                      <th className="px-4 py-3 font-semibold">Year</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funding.map((f) => (
                      <tr key={f.id} className="border-b border-[#efe5d2] last:border-0">
                        <td className="px-4 py-3">{f.program_name ?? 'Unnamed grant'}</td>
                        <td className="px-4 py-3">{f.financial_year ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {f.amount_dollars ? formatAud(Number(f.amount_dollars)) : 'n/a'}
                        </td>
                        <td className="px-4 py-3">
                          {f.source_url ? (
                            <a
                              href={f.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#4a2560] underline decoration-[#c9add8] underline-offset-2"
                            >
                              {f.source ?? 'source'}
                            </a>
                          ) : (
                            f.source ?? 'unsourced'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className={card}>
            <p className={kicker}>Stories</p>
            <p className="mt-3 text-sm leading-6">
              The story panel connects to Empathy Ledger in a later increment.
              Stories stay in Empathy Ledger with their consent settings; this
              panel will show counts and consent state, never copies.
            </p>
          </div>
          <div className={card}>
            <p className={kicker}>Outcomes</p>
            <p className="mt-3 text-sm leading-6">
              Outcome tracking arrives after the co-design conversation. Your
              community defines what success is and how it is measured, in your
              own words, not a government KPI list.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
