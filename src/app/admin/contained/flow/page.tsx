import { requireAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getGHLClient, CONTAINED_PIPELINES } from '@/lib/ghl/client';
import { eoiReceipt, supporterReceipt, nominatorReceipt } from '@/content/contained-receipts';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ENGAGEMENT_STAGES: { id: string; name: string; you: string }[] = [
  { id: 'e0fdce64-5102-458c-95b5-6ab6629f5296', name: 'Identified', you: 'New arrivals land here automatically. Read who they are.' },
  { id: '78090229-0c6b-4d41-abae-78879a5a35c7', name: 'Personal outreach', you: 'You send the first human message. Never a template.' },
  { id: 'e3aa0ddf-4dac-4fba-a02f-c6afb54cce5d', name: 'In conversation', you: 'Replying, listening, matching them to a door.' },
  { id: 'be9e4be0-69da-4517-af52-370b70f4d2de', name: 'Invited to experience', you: 'You decided they should walk through. Invitation sent.' },
  { id: '0e001622-b333-4990-b004-da0c655cb892', name: 'Experienced', you: 'They walked through. The 48-hour debrief window starts.' },
  { id: '0825728b-fb20-4c91-a9c3-9c5b69e114e1', name: 'Follow-up / debrief', you: 'The advocate-conversion touch. What will they do next?' },
  { id: '92737d7b-7258-45f0-a717-44c45a168b99', name: 'Partner / committed', you: 'Money, hosting, or partnership on the table.' },
  { id: '2f647634-79c7-49f5-aec0-561b233b1834', name: 'Future city', you: 'They want it where they live. Feeds the tour.' },
  { id: 'bd33b9c4-51c1-4912-97cc-11a50bd78fab', name: 'Parked / closed', you: 'Not now. Stay warm, no pressure.' },
];

const ADELAIDE_STAGES: { id: string; name: string; you: string }[] = [
  { id: 'f8d2acd7-8ced-43c7-a485-3950d190bbc9', name: 'Captured', you: 'EOIs land here automatically. Read their why.' },
  { id: '9b0d68a5-35e6-4885-96bb-17dc9feff1fe', name: 'Needs enrichment', you: 'Who are they really? Quick research before triage.' },
  { id: '07942700-ea35-4bc4-b1ba-fa7c84093faa', name: 'Warm - review', you: 'Your triage queue. Decision-makers move forward.' },
  { id: 'd98cb7a7-64ee-44f8-aeff-1bb5e20eda0b', name: 'Personal invite', you: 'You write it, referencing what THEY wrote.' },
  { id: 'bc4251de-61f3-477f-b00e-606368154e1f', name: 'Booking link sent', you: 'Slot offered. Watch for the booking.' },
  { id: 'db5d37e7-35c5-4161-ab5b-780c08ab9af6', name: 'Booked', you: 'Confirmed. Day-of logistics.' },
  { id: 'acbdf4cd-ba6a-41ac-ac52-2e5508b0c8f6', name: 'Experienced', you: 'They walked through.' },
  { id: 'f9365cf1-5cf8-4976-8ee8-96fc52678251', name: 'Activated', you: 'They are doing something with it. Support them.' },
  { id: '76a5ba5a-aa3d-4919-be1f-ca0c4bad7052', name: 'Post-week nurture', you: 'Recap stream and the long game.' },
  { id: '7dee91e5-11f3-432c-9e39-0cc41a5c190c', name: 'Future city / partner', you: 'Hand to the Engagement board for the next stop.' },
  { id: '2db54fe2-9051-4411-a0ba-220e31f43dd9', name: 'Closed / no contact', you: 'No slot this time. They stay in Engagement.' },
];

const SAMPLE_EOI = eoiReceipt('Alex');
const SAMPLE_SUPPORT = supporterReceipt('Alex');
const SAMPLE_NOM = nominatorReceipt({
  nominatorName: 'Alex',
  nomineeName: 'A magistrate you nominated',
  nomineeOrg: 'Their court',
  reason: 'Their decisions touch children every day.',
  nominationCount: 2,
});

function StageRow({ stages, counts }: { stages: { id: string; name: string; you: string }[]; counts: Record<string, number> }) {
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.id} className="flex items-start gap-4 border border-[#0A0A0A]/15 bg-[#F5F0E8] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#0A0A0A] font-mono text-lg font-medium text-[#F5F0E8]">
            {counts[s.id] || 0}
          </div>
          <div>
            <div className="font-display font-bold tracking-tight">
              {i + 1}. {s.name}
            </div>
            <div className="font-mono text-xs text-[#0A0A0A]/70">{s.you}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmailCard({ title, trigger, email }: { title: string; trigger: string; email: { subject: string; preheader: string; body: string } }) {
  return (
    <details className="border border-[#0A0A0A]/20 bg-white/60">
      <summary className="cursor-pointer p-4 font-display font-bold">
        {title}
        <span className="ml-2 font-mono text-xs font-normal text-[#0A0A0A]/60">{trigger}</span>
      </summary>
      <div className="border-t border-[#0A0A0A]/10 p-4">
        <div className="font-mono text-xs text-[#0A0A0A]/60">Subject</div>
        <div className="mb-2 font-bold">{email.subject}</div>
        <div className="font-mono text-xs text-[#0A0A0A]/60">Preheader</div>
        <div className="mb-2">{email.preheader}</div>
        <div className="font-mono text-xs text-[#0A0A0A]/60">Body</div>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{email.body}</pre>
      </div>
    </details>
  );
}

export default async function ContainedFlowPage() {
  await requireAdmin('/admin/contained/flow');
  const sc = createServiceClient() as any;
  const ghl = getGHLClient();

  const [engagementOpps, adelaideOpps, { data: recent }, { data: nominees }] = await Promise.all([
    ghl.getPipelineOpportunities(CONTAINED_PIPELINES.CONTAINED_ENGAGEMENT.id),
    ghl.getPipelineOpportunities(CONTAINED_PIPELINES.CONTAINED_ADELAIDE.id),
    sc
      .from('event_registrations')
      .select('full_name, email, organization, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(40),
    sc
      .from('campaign_nominations')
      .select('nominee_name, nominee_title, nominee_org, reason, nominator_name, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const countByStage = (opps: any[]) =>
    opps.reduce((acc: Record<string, number>, o: any) => {
      acc[o.pipelineStageId] = (acc[o.pipelineStageId] || 0) + 1;
      return acc;
    }, {});
  const engagementCounts = countByStage(engagementOpps);
  const adelaideCounts = countByStage(adelaideOpps);

  const containedRecent = (recent || []).filter((r: any) =>
    String(r.metadata?.event_name || '').toUpperCase().includes('CONTAINED')
  );

  const doorOf = (r: any) => {
    const tags: string[] = r.metadata?.tags || [];
    if (tags.includes('experience:eoi')) return 'EOI';
    if (tags.includes('engagement:supporter')) return 'Stands with it';
    return 'Capture';
  };

  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="font-mono text-xs uppercase tracking-widest text-[#DC2626]">CONTAINED Mission Control</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">The whole flow, one page</h1>
        <p className="mt-2 max-w-2xl text-[#0A0A0A]/75">
          Three doors in, one receipt each, then every move is human. The numbers are live from
          GoHighLevel; the emails below are the exact copy people receive.
        </p>

        {/* The journey */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">How a person flows through</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ['1. They act', 'Nominate someone, ask to be inside (EOI), or stand with it. One form, three doors: /contained/eoi'],
              ['2. The machine answers once', 'One receipt email, matched to their door. Tags + a pipeline card are created automatically. Then the machine goes quiet.'],
              ['3. You warm them up', 'Morning digest in your inbox at 7am. Read their why, move their card, send the personal message. Every invitation is yours.'],
              ['4. They walk through', 'Thirty minutes. Then the 48-hour debrief, and the ask that fits who they are.'],
            ].map(([t, d]) => (
              <div key={t} className="border border-[#0A0A0A]/15 bg-white/50 p-4">
                <div className="font-display font-bold">{t}</div>
                <div className="mt-1 text-sm text-[#0A0A0A]/75">{d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Live boards */}
        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Engagement board</h2>
            <p className="mb-3 font-mono text-xs text-[#0A0A0A]/60">
              The wide front door · {engagementOpps.length} people ·{' '}
              <a className="underline" href="https://app.gohighlevel.com/v2/location/agzsSZWgovjwgpcoASWG/opportunities/list" target="_blank">
                open in GHL
              </a>
            </p>
            <StageRow stages={ENGAGEMENT_STAGES} counts={engagementCounts} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Adelaide experience board</h2>
            <p className="mb-3 font-mono text-xs text-[#0A0A0A]/60">
              Scarce by design · {adelaideOpps.length} people · EOI + nominated only
            </p>
            <StageRow stages={ADELAIDE_STAGES} counts={adelaideCounts} />
          </div>
        </section>

        {/* The emails */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Every automated email (this is all of them)</h2>
          <p className="mb-4 text-sm text-[#0A0A0A]/75">
            Three receipts. Nothing else sends without you. The nominee invitation is switched off;
            those are written by hand.
          </p>
          <div className="space-y-3">
            <EmailCard title="EOI receipt" trigger="fires when someone asks to be inside" email={SAMPLE_EOI} />
            <EmailCard title="Supporter receipt" trigger="fires when someone stands with it" email={SAMPLE_SUPPORT} />
            <EmailCard title="Nominator receipt" trigger="fires when someone nominates a person" email={SAMPLE_NOM} />
          </div>
        </section>

        {/* Latest people */}
        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Latest people in</h2>
            <div className="mt-3 space-y-2">
              {containedRecent.length === 0 && (
                <div className="border border-[#0A0A0A]/15 p-4 font-mono text-sm text-[#0A0A0A]/60">
                  Nobody yet today. The campaign changes that.
                </div>
              )}
              {containedRecent.slice(0, 12).map((r: any, i: number) => (
                <div key={i} className="border border-[#0A0A0A]/15 bg-white/50 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">{r.full_name}</span>
                    <span className="font-mono text-xs text-[#DC2626]">{doorOf(r)}</span>
                  </div>
                  <div className="font-mono text-xs text-[#0A0A0A]/60">
                    {r.email}
                    {r.organization ? ` · ${r.organization}` : ''}
                  </div>
                  {r.metadata?.how_heard && (
                    <div className="mt-1 text-sm text-[#0A0A0A]/80">“{String(r.metadata.how_heard).slice(0, 160)}”</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Nominees (never auto-emailed, on purpose)</h2>
            <p className="mb-3 font-mono text-xs text-[#0A0A0A]/60">
              3+ nominations = your personal outreach. Public wall:{' '}
              <Link className="underline" href="/contained/nominations">
                /contained/nominations
              </Link>
            </p>
            <div className="space-y-2">
              {(() => {
                const noms: any[] = nominees || [];
                if (noms.length === 0)
                  return (
                    <div className="border border-[#0A0A0A]/15 p-4 font-mono text-sm text-[#0A0A0A]/60">No nominations yet.</div>
                  );
                const counts: Record<string, number> = {};
                for (const n of noms) counts[n.nominee_name] = (counts[n.nominee_name] || 0) + 1;
                const unique = Object.keys(counts).map((name) => noms.find((n) => n.nominee_name === name));
                return unique.slice(0, 15).map((n: any, i: number) => {
                  const count = counts[n.nominee_name];
                  return (
                    <div key={i} className={`border p-3 ${count >= 3 ? 'border-[#DC2626] bg-[#DC2626]/5' : 'border-[#0A0A0A]/15 bg-white/50'}`}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold">{n.nominee_name}</span>
                        <span className={`font-mono text-xs ${count >= 3 ? 'text-[#DC2626] font-medium' : 'text-[#0A0A0A]/60'}`}>
                          {count} nomination{count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-[#0A0A0A]/60">
                        {[n.nominee_title, n.nominee_org].filter(Boolean).join(' · ')}
                      </div>
                      {n.reason && <div className="mt-1 text-sm text-[#0A0A0A]/80">“{String(n.reason).slice(0, 120)}”</div>}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-[#0A0A0A]/15 pt-6 font-mono text-xs text-[#0A0A0A]/60">
          Receipts live in src/content/contained-receipts.ts (edit there, routes + this page update together) ·{' '}
          <Link className="underline" href="/contained/eoi">
            the three-door form
          </Link>{' '}
          · digest lands 7am Brisbane
        </footer>
      </div>
    </main>
  );
}
