'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import type {
  JrSite,
  JrStateGroup,
  JrSiteDetailIndex,
  JrConnectionIndex,
} from '@/lib/communities/justice-reinvestment';

const JRMap = dynamic(() => import('./JRMap'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[460px] w-full rounded-[22px] border md:h-[560px]"
      style={{ borderColor: '#eadfce', background: '#fff8ef' }}
    />
  ),
});

const SERIF = "'Cormorant Garamond', Georgia, serif";

const STATE_CHIPS = ['All', 'NSW', 'NT', 'QLD', 'SA', 'WA', 'VIC', 'ACT'] as const;
type StateChip = (typeof STATE_CHIPS)[number];

/** Enrichment carried alongside a DB list row when a curated site matches it. */
export interface EnrichedInitiative {
  id: string;
  name: string;
  verificationStatus: string | null;
  orgName: string | null;
  state: string | null;
  isIndigenousOrg: boolean;
  website: string | null;
  blurb: string | null;
  /** Per-site detail-page slug when this row matches a curated site. */
  siteSlug?: string | null;
}

export interface EnrichedGroup extends Omit<JrStateGroup, 'initiatives'> {
  initiatives: EnrichedInitiative[];
}

function VerificationChip({ status }: { status: string | null }) {
  if (status === 'community_verified') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7a9a6b] bg-[#eef3e6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a6138]">
        <span aria-hidden className="text-base leading-none">
          &#9733;
        </span>
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

export default function JRNetworkExplorer({
  sites,
  groups,
  detailIndex,
  connectionIndex,
}: {
  sites: JrSite[];
  groups: EnrichedGroup[];
  detailIndex: JrSiteDetailIndex;
  connectionIndex: JrConnectionIndex;
}) {
  const [activeState, setActiveState] = useState<StateChip>('All');

  const filteredGroups = useMemo(() => {
    if (activeState === 'All') return groups;
    return groups.filter((group) => group.key === activeState);
  }, [groups, activeState]);

  return (
    <div>
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
          The national map
        </p>
        <h2
          className="mt-3 text-5xl leading-none"
          style={{ fontFamily: SERIF, fontWeight: 500 }}
        >
          Every placed site, on one map
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
          Filter by state to move the map and the list below in step. Each
          marker opens the lead organisation, the place it serves, and a link to
          its own site. The national bodies that hold the network together sit in
          a strip beneath the map.
        </p>

        <div className="mt-10">
          <JRMap
            sites={sites}
            detailIndex={detailIndex}
            connectionIndex={connectionIndex}
            onStateChange={(s) => setActiveState(s)}
          />
        </div>
      </section>

      {/* Grouped sections by state, filtered in step with the map chips */}
      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10 md:pb-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
          Grouped by place
        </p>
        <h2
          className="mt-3 text-5xl leading-none"
          style={{ fontFamily: SERIF, fontWeight: 500 }}
        >
          The network, state by state
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
          Each initiative sits with the place it serves, drawn from the lead
          organisation on record. Read the verification mark beside each one as a
          trust signal: a record we hold, a record confirmed, or outcomes a
          community has verified with its own evidence.
        </p>

        <div className="mt-12 space-y-14">
          {filteredGroups.length === 0 ? (
            <p className="rounded-[16px] border border-[#e6d7c1] bg-[#f3eadb] px-5 py-4 text-sm leading-6 text-[#5e5145]">
              No initiatives on record for {activeState} yet. If you know one,
              tell us and we will add it.
            </p>
          ) : null}
          {filteredGroups.map((group) => {
            const isConfirmBucket = group.key === 'place-to-confirm';
            return (
              <div key={group.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#eadfce] pb-4">
                  <h3
                    className="text-4xl leading-none"
                    style={{ fontFamily: SERIF, fontWeight: 500 }}
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
                        <VerificationChip status={initiative.verificationStatus} />
                        {initiative.isIndigenousOrg ? (
                          <span className="rounded-full border border-[#dbc7a9] bg-[#f3eadb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]">
                            Aboriginal community-controlled
                          </span>
                        ) : null}
                      </div>

                      <h4
                        className="mt-4 text-2xl leading-7"
                        style={{ fontFamily: SERIF, fontWeight: 500 }}
                      >
                        {initiative.name}
                      </h4>

                      <p className="mt-3 text-sm font-medium text-[#7d5f3d]">
                        {initiative.orgName
                          ? initiative.orgName
                          : 'Lead organisation to confirm'}
                      </p>

                      {initiative.blurb ? (
                        <p className="mt-3 text-sm leading-6 text-[#584b40]">
                          {initiative.blurb}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {initiative.siteSlug ? (
                          <Link
                            href={`/communities/justice-reinvestment/${initiative.siteSlug}`}
                            className="inline-flex text-xs font-semibold text-[#4a2560]"
                          >
                            View site profile &rarr;
                          </Link>
                        ) : null}
                        {initiative.website ? (
                          <Link
                            href={initiative.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-xs font-semibold text-[#7d5f3d]"
                          >
                            Visit website &rarr;
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
