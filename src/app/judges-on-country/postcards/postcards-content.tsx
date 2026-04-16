'use client';

import { startTransition, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { buildQrUrl } from '@/lib/qr';
import { ELPhotoPickerModal } from '@/components/empathy-ledger/ELPhotoPickerModal';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Printer,
  QrCode,
  Scale,
  Search,
  Video,
} from 'lucide-react';
import {
  JUDGES_POSTCARD_CARDS,
  JUDGES_POSTCARD_DESTINATIONS,
  JUDGES_POSTCARD_DOMAIN,
  JUDGES_POSTCARD_PRINT_SETUP,
  JUDGES_POSTCARD_SOURCE_WORKFLOW,
  JUDGES_POSTCARD_TRIP_USE,
  type JudgesPostcardCard,
  type JudgesPostcardDestinationKey,
  type JudgesPostcardPublicationPlan,
  type JudgesPostcardProvenance,
} from '@/content/judges-postcards';
import type {
  ResolvedJudgesPostcardCard,
  ResolvedJudgesPostcardMedia,
  ResolvedJudgesPostcardProfile,
  ResolvedJudgesPostcardStory,
} from '@/lib/judges-postcard-source-resolver';

export type PostcardsPageMode = 'public' | 'admin';

const CARD_STYLE: CSSProperties = {
  width: '148mm',
  height: '105mm',
  margin: '10mm auto',
  pageBreakAfter: 'always',
  pageBreakInside: 'avoid',
};

type JudgesPostcardFront = JudgesPostcardCard['front'];
type JudgesPostcardBack = JudgesPostcardCard['back'];
type JudgesPostcardCallout = NonNullable<JudgesPostcardBack['callout']>;
type JudgesPostcardSource = JudgesPostcardCard['sourceStack'][number];
type JudgesPostcardPublication = JudgesPostcardPublicationPlan;
type JudgesPostcardProvenanceItem = JudgesPostcardProvenance;
type ResolutionState = 'loading' | 'ready' | 'error';
type DraftCreationStateEntry =
  | { status: 'idle' }
  | { status: 'creating' }
  | { status: 'created'; storyId: string }
  | { status: 'existing'; storyId: string }
  | { status: 'error'; message: string };
type DraftCreationState = Record<string, DraftCreationStateEntry>;
type DraftsAccessState = 'loading' | 'enabled' | 'disabled';

const SOURCE_KIND_STYLES: Record<JudgesPostcardSource['kind'], { label: string; className: string }> = {
  admin: {
    label: 'EL admin',
    className: 'bg-[#0A0A0A] text-white',
  },
  storyteller: {
    label: 'Storyteller',
    className: 'bg-[#FCE7E5] text-[#9F1D1D]',
  },
  story: {
    label: 'Story',
    className: 'bg-[#E8F4EF] text-[#1E5E4B]',
  },
  media: {
    label: 'Media',
    className: 'bg-[#F2E9FF] text-[#5B21B6]',
  },
  route: {
    label: 'Route',
    className: 'bg-[#FFF4DE] text-[#92400E]',
  },
  api: {
    label: 'API',
    className: 'bg-[#E6F0FF] text-[#1D4ED8]',
  },
};

const RESOLUTION_STATUS_STYLES: Record<
  ResolvedJudgesPostcardCard['status'],
  { label: string; className: string }
> = {
  exact: {
    label: 'Exact EL link',
    className: 'bg-[#E8F4EF] text-[#1E5E4B]',
  },
  partial: {
    label: 'Partial EL link',
    className: 'bg-[#FFF4DE] text-[#92400E]',
  },
  attention: {
    label: 'Needs review',
    className: 'bg-[#FCE7E5] text-[#9F1D1D]',
  },
};

const PROVENANCE_STATUS_STYLES: Record<
  JudgesPostcardProvenanceItem['status'],
  { label: string; className: string }
> = {
  editorial: {
    label: 'Editorial',
    className: 'bg-[#FCE7E5] text-[#9F1D1D]',
  },
  local: {
    label: 'Local asset',
    className: 'bg-[#FFF4DE] text-[#92400E]',
  },
  el: {
    label: 'EL linked',
    className: 'bg-[#E8F4EF] text-[#1E5E4B]',
  },
  route: {
    label: 'Route',
    className: 'bg-[#E6F0FF] text-[#1D4ED8]',
  },
};

const PROVENANCE_KIND_LABELS: Record<JudgesPostcardProvenanceItem['kind'], string> = {
  quote: 'Quote source',
  image: 'Front image source',
  context: 'Context route',
};

const PUBLICATION_STATUS_STYLES: Record<'ready' | 'blocked', { label: string; className: string }> = {
  ready: {
    label: 'Ready to publish',
    className: 'bg-[#E8F4EF] text-[#1E5E4B]',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-[#FCE7E5] text-[#9F1D1D]',
  },
};

function qr(path: string, size = 180) {
  return buildQrUrl({
    data: `https://${JUDGES_POSTCARD_DOMAIN}${path}`,
    size,
    fg: '0A0A0A',
    bg: 'F5F0E8',
  });
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function CardFooter({ label }: { label: string }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-2"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
    >
      <span
        className="text-[9px] uppercase tracking-[0.18em]"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#8B8B8B' }}
      >
        {label}
      </span>
      <span
        className="text-[9px]"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#8B8B8B' }}
      >
        Judges on Country 2026
      </span>
    </div>
  );
}

function BackFooter() {
  return (
    <div
      className="mt-3 flex items-center justify-between border-t pt-2"
      style={{ borderColor: 'rgba(10,10,10,0.16)' }}
    >
      <span
        className="text-[9px]"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#8B8B8B' }}
      >
        {JUDGES_POSTCARD_DOMAIN}
      </span>
      <span
        className="text-[9px]"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#8B8B8B' }}
      >
        A6 field card
      </span>
    </div>
  );
}

function QRBlock({ path, size = '21mm' }: { path: string; size?: string }) {
  return (
    <div
      className="flex-shrink-0 overflow-hidden border border-[#0A0A0A]/15 bg-white"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr(path)} alt="QR code" className="h-full w-full" loading="eager" />
    </div>
  );
}

function FrontQr() {
  return (
    <div
      className="absolute z-20"
      style={{ bottom: '11mm', right: '6mm' }}
      aria-hidden={false}
    >
      <div
        className="overflow-hidden bg-white p-[2px]"
        style={{ width: '18mm', height: '18mm', border: '1px solid rgba(255,255,255,0.35)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr(JUDGES_POSTCARD_DESTINATIONS.judges.path, 240)}
          alt="Scan to open the Judges on Country trip kit"
          className="h-full w-full"
          loading="eager"
        />
      </div>
    </div>
  );
}

function QrCallout({
  destination,
  accent = '#059669',
}: {
  destination: JudgesPostcardDestinationKey;
  accent?: string;
}) {
  const item = JUDGES_POSTCARD_DESTINATIONS[destination];

  return (
    <div
      className="border p-3"
      style={{ borderColor: accent, backgroundColor: 'rgba(255,255,255,0.72)' }}
    >
      <div className="flex items-start gap-3">
        <QRBlock path={item.path} />
        <div className="min-w-0">
          <p
            className="mb-1 text-[9px] uppercase tracking-[0.18em]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: accent }}
          >
            Scan to open
          </p>
          <p
            className="mb-1 text-sm font-bold text-[#0A0A0A]"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {item.label}
          </p>
          <p
            className="mb-1 break-words text-[10px]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666666' }}
          >
            {item.displayPath}
          </p>
          <p className="mb-0 text-xs leading-relaxed text-[#303030]">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

function SourcePill({ source }: { source: JudgesPostcardSource }) {
  const style = SOURCE_KIND_STYLES[source.kind];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${style.className}`}
      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
    >
      {style.label}
    </span>
  );
}

function SourceLinkCard({ source }: { source: JudgesPostcardSource }) {
  return (
    <Link
      href={source.href}
      prefetch={false}
      target="_blank"
      rel="noreferrer"
      className="block border border-[#0A0A0A]/10 bg-white p-3 transition-colors hover:border-[#DC2626]"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <SourcePill source={source} />
        <ExternalLink className="h-4 w-4 text-[#8B8178]" />
      </div>
      <p className="mb-1 text-sm font-bold text-[#0A0A0A]">{source.label}</p>
      <p
        className="mb-2 break-words text-[10px] text-[#7B6D61]"
        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
      >
        {source.href}
      </p>
      {source.recordId ? (
        <p
          className="mb-2 break-words text-[10px] text-[#A16207]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Record: {source.recordId}
        </p>
      ) : null}
      <p className="mb-0 text-xs leading-relaxed text-[#4F463F]">{source.note}</p>
    </Link>
  );
}

function SourceWorkflowPanel() {
  return (
    <div className="mt-6 border-2 border-[#0A0A0A] bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-[#DC2626]" />
        <p
          className="mb-0 text-[11px] uppercase tracking-[0.22em] text-[#DC2626]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Source workflow
        </p>
      </div>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-[#4F463F]">
        Review the Empathy Ledger records and the Oonchiumpa media feed before changing any quote,
        portrait, or contextual image. Each card below also carries its own source stack.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {JUDGES_POSTCARD_SOURCE_WORKFLOW.map((source) => (
          <SourceLinkCard key={`${source.kind}-${source.label}`} source={source} />
        ))}
      </div>
    </div>
  );
}

function PublicationStatusPill({ status }: { status: 'ready' | 'blocked' }) {
  const style = PUBLICATION_STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${style.className}`}
      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
    >
      {style.label}
    </span>
  );
}

function PublicationQueuePanel({
  cards,
  resolvedCards,
  resolutionState,
  draftsAccessState,
  draftCreationState,
  onCreateDraft,
}: {
  cards: JudgesPostcardCard[];
  resolvedCards: Record<string, ResolvedJudgesPostcardCard>;
  resolutionState: ResolutionState;
  draftsAccessState: DraftsAccessState;
  draftCreationState: DraftCreationState;
  onCreateDraft: (cardId: string) => void;
}) {
  const queue = cards
    .filter((card) => card.publicationPlan)
    .map((card) => {
      const plan = card.publicationPlan as JudgesPostcardPublication;
      const resolution = resolvedCards[card.id];
      const hasPublicStory = (resolution?.stories.length ?? 0) > 0;

      if (hasPublicStory) {
        return null;
      }

      const status = plan.blocker || resolution?.status === 'attention' ? 'blocked' : 'ready';

      return {
        card,
        plan,
        status,
      };
    })
    .filter((item): item is { card: JudgesPostcardCard; plan: JudgesPostcardPublication; status: 'ready' | 'blocked' } => Boolean(item));

  if (resolutionState === 'loading' && queue.length === 0) {
    return (
      <div className="mt-6 border-2 border-[#0A0A0A] bg-[#FCFAF6] p-6">
        <p
          className="mb-1 text-[11px] uppercase tracking-[0.22em] text-[#DC2626]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          EL publication queue
        </p>
        <p className="mb-0 text-sm text-[#4F463F]">Loading publish-ready cards.</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return null;
  }

  const readyCount = queue.filter((item) => item.status === 'ready').length;
  const blockedCount = queue.filter((item) => item.status === 'blocked').length;

  return (
    <div className="mt-6 border-2 border-[#0A0A0A] bg-[#FCFAF6] p-6">
      <div className="mb-4 flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-[#DC2626]" />
        <p
          className="mb-0 text-[11px] uppercase tracking-[0.22em] text-[#DC2626]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          EL publication queue
        </p>
      </div>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-[#4F463F]">
        These cards still rely on ALMA or JusticeHub editorial framing for their quote lines. Publish the ready items as public EL stories to move more of the postcard set from partial sourcing to exact end-to-end provenance.
      </p>
      <div className="mb-4 flex flex-wrap gap-3">
        <Link
          href="/api/judges-on-country/postcards/publication-plan"
          prefetch={false}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-[#0A0A0A] bg-white px-3 py-2 text-sm font-bold text-[#0A0A0A] transition-colors hover:border-[#DC2626]"
        >
          <ExternalLink className="h-4 w-4" />
          Open JSON handoff
        </Link>
        <Link
          href="/api/judges-on-country/postcards/publication-plan?format=markdown"
          prefetch={false}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-[#0A0A0A] bg-white px-3 py-2 text-sm font-bold text-[#0A0A0A] transition-colors hover:border-[#DC2626]"
        >
          <ExternalLink className="h-4 w-4" />
          Open Markdown brief
        </Link>
        <Link
          href="/admin/empathy-ledger/content"
          prefetch={false}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-[#0A0A0A] bg-white px-3 py-2 text-sm font-bold text-[#0A0A0A] transition-colors hover:border-[#DC2626]"
        >
          <ExternalLink className="h-4 w-4" />
          Open EL content manager
        </Link>
      </div>
      <p className="mb-4 text-sm text-[#6B625B]">
        {pluralize(readyCount, 'card')} ready to publish. {pluralize(blockedCount, 'card')} blocked.
      </p>
      {draftsAccessState === 'disabled' ? (
        <p className="mb-4 text-sm text-[#7B6D61]">
          EL draft creation controls are available in admin sessions only. The review queue remains visible, but draft lookup and creation are hidden on this session.
        </p>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {queue.map(({ card, plan, status }) => {
          const draftState = draftCreationState[card.id] ?? { status: 'idle' as const };

          return (
            <div key={card.id} className="border border-[#0A0A0A]/10 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p
                    className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#8B8178]"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    Card {card.number}
                  </p>
                  <p className="mb-0 text-sm font-bold text-[#0A0A0A]">{plan.proposedTitle}</p>
                </div>
                <PublicationStatusPill status={status} />
              </div>

              <p className="mb-2 text-sm leading-relaxed text-[#4F463F]">{plan.summary}</p>
              <p className="mb-3 text-sm font-bold text-[#0A0A0A]">{plan.quoteExcerpt}</p>

              <div className="space-y-2 text-[10px]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <p className="mb-0 break-words text-[#7B6D61]">Storyteller: {plan.storytellerName}  |  {plan.storytellerId}</p>
                <p className="mb-0 break-words text-[#7B6D61]">Current source: {plan.sourceHref}</p>
                <p className="mb-0 break-words text-[#7B6D61]">Target route: {plan.destinationHref}</p>
              </div>

              {status === 'ready' && draftsAccessState === 'enabled' ? (
                <div className="mt-4 border-t border-[#0A0A0A]/10 pt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onCreateDraft(card.id)}
                      disabled={
                        draftState.status === 'creating' ||
                        draftState.status === 'created' ||
                        draftState.status === 'existing'
                      }
                      className="inline-flex items-center gap-2 border border-[#0A0A0A] bg-[#0A0A0A] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1C1C1C] disabled:cursor-not-allowed disabled:border-[#B8B8B8] disabled:bg-[#E7E2D9] disabled:text-[#7B6D61]"
                    >
                      {draftState.status === 'creating'
                        ? 'Creating EL draft…'
                        : draftState.status === 'created'
                          ? 'EL draft created'
                          : draftState.status === 'existing'
                            ? 'EL draft exists'
                            : 'Create EL draft'}
                    </button>
                    {draftState.status === 'created' ? (
                      <p className="mb-0 text-sm text-[#1E5E4B]">
                        EL draft created. Story ID:{' '}
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{draftState.storyId}</span>
                      </p>
                    ) : null}
                    {draftState.status === 'existing' ? (
                      <p className="mb-0 text-sm text-[#92400E]">
                        Draft already exists. Story ID:{' '}
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{draftState.storyId}</span>
                      </p>
                    ) : null}
                    {draftState.status === 'error' ? (
                      <p className="mb-0 text-sm text-[#9F1D1D]">{draftState.message}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {plan.blocker ? (
                <p className="mt-3 mb-0 text-sm leading-relaxed text-[#9F1D1D]">{plan.blocker}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProvenanceStatusPill({ item }: { item: JudgesPostcardProvenanceItem }) {
  const style = PROVENANCE_STATUS_STYLES[item.status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${style.className}`}
      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
    >
      {style.label}
    </span>
  );
}

function ProvenanceLinkCard({ item }: { item: JudgesPostcardProvenanceItem }) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden border border-[#0A0A0A]/10 bg-[#FCFAF6] transition-colors hover:border-[#DC2626]"
    >
      {item.previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.previewSrc} alt={item.label} className="h-28 w-full object-cover" loading="lazy" />
      ) : null}
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceStatusPill item={item} />
            <span
              className="text-[10px] uppercase tracking-[0.18em] text-[#8B8178]"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {PROVENANCE_KIND_LABELS[item.kind]}
            </span>
          </div>
          <ExternalLink className="h-4 w-4 text-[#8B8178]" />
        </div>
        <p className="mb-1 text-sm font-bold text-[#0A0A0A]">{item.label}</p>
        {item.excerpt ? (
          <p className="mb-2 text-sm leading-relaxed text-[#4F463F]">{item.excerpt}</p>
        ) : null}
        <p
          className="mb-2 break-words text-[10px] text-[#7B6D61]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {item.href}
        </p>
        {item.assetPath ? (
          <p
            className="mb-2 break-words text-[10px] text-[#A16207]"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Asset: {item.assetPath}
          </p>
        ) : null}
        <p className="mb-0 text-xs leading-relaxed text-[#4F463F]">{item.note}</p>
      </div>
    </Link>
  );
}

function ProvenancePanel({ card }: { card: JudgesPostcardCard }) {
  return (
    <div className="mt-4 border-t border-[#0A0A0A]/10 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p
            className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#8B8178]"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Editorial provenance
          </p>
          <p className="mb-0 text-sm text-[#4F463F]">
            This split makes clear what is still held in JusticeHub editorial routes and local assets versus what already resolves through EL.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {card.provenance.map((item) => (
          <ProvenanceLinkCard key={`${card.id}-${item.kind}-${item.label}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function ResolutionStatusPill({ status }: { status: ResolvedJudgesPostcardCard['status'] }) {
  const style = RESOLUTION_STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${style.className}`}
      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
    >
      {style.label}
    </span>
  );
}

function ResolvedRecordCard({
  title,
  href,
  meta,
  imageUrl,
  pill,
}: {
  title: string;
  href: string;
  meta: string;
  imageUrl?: string | null;
  pill: ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden border border-[#0A0A0A]/10 bg-[#F8F4EC] transition-colors hover:border-[#DC2626]"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} className="h-28 w-full object-cover" loading="lazy" />
      ) : null}
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          {pill}
          <ExternalLink className="h-4 w-4 text-[#8B8178]" />
        </div>
        <p className="mb-1 text-sm font-bold text-[#0A0A0A]">{title}</p>
        <p
          className="mb-0 break-words text-[10px] text-[#7B6D61]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {meta}
        </p>
      </div>
    </Link>
  );
}

function ResolvedProfileCard({ profile }: { profile: ResolvedJudgesPostcardProfile }) {
  return (
    <ResolvedRecordCard
      title={profile.displayName}
      href={profile.href}
      meta={[profile.id, profile.location, `${pluralize(profile.storyCount, 'public story')}`].filter(Boolean).join('  |  ')}
      imageUrl={profile.avatarUrl}
      pill={<SourcePill source={{ kind: 'storyteller', label: profile.displayName, href: profile.href, note: '' }} />}
    />
  );
}

function ResolvedStoryCard({ story }: { story: ResolvedJudgesPostcardStory }) {
  return (
    <ResolvedRecordCard
      title={story.title}
      href={story.href}
      meta={[story.id, story.storytellerName, story.publishedAt].filter(Boolean).join('  |  ')}
      imageUrl={story.imageUrl}
      pill={<SourcePill source={{ kind: 'story', label: story.title, href: story.href, note: '' }} />}
    />
  );
}

function ResolvedMediaCard({ media }: { media: ResolvedJudgesPostcardMedia }) {
  return (
    <ResolvedRecordCard
      title={media.label}
      href={media.href}
      meta={[media.linkedRecordId, media.kind === 'avatar' ? 'Storyteller image' : 'Story image'].join('  |  ')}
      imageUrl={media.imageUrl}
      pill={<SourcePill source={{ kind: 'media', label: media.label, href: media.href, note: '' }} />}
    />
  );
}

function ResolvedEvidencePanel({
  resolution,
  resolutionState,
}: {
  resolution?: ResolvedJudgesPostcardCard;
  resolutionState: ResolutionState;
}) {
  if (resolutionState === 'loading' && !resolution) {
    return (
      <div className="mt-4 border-t border-[#0A0A0A]/10 pt-4">
        <p
          className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#8B8178]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Resolved EL records
        </p>
        <p className="mb-0 text-sm text-[#6B625B]">Loading exact storyteller, story, and image links.</p>
      </div>
    );
  }

  if (resolutionState === 'error' && !resolution) {
    return (
      <div className="mt-4 border-t border-[#0A0A0A]/10 pt-4">
        <p
          className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#8B8178]"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Resolved EL records
        </p>
        <p className="mb-0 text-sm text-[#9F1D1D]">
          The resolver did not load. The source stack above is still valid, but the exact EL preview is unavailable.
        </p>
      </div>
    );
  }

  if (!resolution) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-[#0A0A0A]/10 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#8B8178]"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Resolved EL records
          </p>
          <p className="mb-0 text-sm text-[#4F463F]">
            {pluralize(resolution.profiles.length, 'storyteller record')},{' '}
            {pluralize(resolution.stories.length, 'public story')},{' '}
            {pluralize(resolution.media.length, 'exact image link')}.
          </p>
        </div>
        <ResolutionStatusPill status={resolution.status} />
      </div>

      {resolution.notes.length ? (
        <div className="mb-4 space-y-2 border border-[#0A0A0A]/10 bg-[#FFF9F2] p-3">
          {resolution.notes.map((note) => (
            <p key={note} className="mb-0 text-sm leading-relaxed text-[#6B625B]">
              {note}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {resolution.profiles.map((profile) => (
          <ResolvedProfileCard key={profile.id} profile={profile} />
        ))}
        {resolution.stories.map((story) => (
          <ResolvedStoryCard key={story.id} story={story} />
        ))}
        {resolution.media.map((media) => (
          <ResolvedMediaCard key={media.id} media={media} />
        ))}
      </div>
    </div>
  );
}

function CardSourcePanel({
  card,
  resolution,
  resolutionState,
}: {
  card: JudgesPostcardCard;
  resolution?: ResolvedJudgesPostcardCard;
  resolutionState: ResolutionState;
}) {
  return (
    <div className="mx-auto mt-4 max-w-5xl px-4 print:hidden">
      <div className="border border-[#0A0A0A]/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p
              className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#8B8178]"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Card {card.number}
            </p>
            <p className="mb-0 text-sm font-bold text-[#0A0A0A]">{card.navTitle} source stack</p>
          </div>
          <p
            className="mb-0 hidden text-[10px] uppercase tracking-[0.18em] text-[#8B8178] md:block"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Review before editing quote or image
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {card.sourceStack.map((source) => (
            <SourceLinkCard key={`${card.id}-${source.label}`} source={source} />
          ))}
        </div>
        <ProvenancePanel card={card} />
        <ResolvedEvidencePanel resolution={resolution} resolutionState={resolutionState} />
      </div>
    </div>
  );
}

function PhotoFront({
  front,
  cardId,
  overrideSrc,
  swapMode,
  onRequestSwap,
}: {
  front: Extract<JudgesPostcardFront, { kind: 'photo' }>;
  cardId?: string;
  overrideSrc?: string;
  swapMode?: boolean;
  onRequestSwap?: (cardId: string) => void;
}) {
  const accent = front.accent ?? '#059669';
  const imageFilter = front.imageFilter ?? 'brightness(0.42)';
  const effectiveSrc = overrideSrc || front.imageSrc;

  return (
    <div className="postcard-page relative overflow-hidden" style={{ ...CARD_STYLE, backgroundColor: '#0A0A0A' }}>
      <div
        className={`absolute inset-0 ${swapMode && cardId ? 'cursor-pointer group/swap' : ''}`}
        onClick={swapMode && cardId && onRequestSwap ? () => onRequestSwap(cardId) : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={effectiveSrc}
          alt={front.imageAlt}
          className="h-full w-full object-cover"
          style={{ filter: imageFilter }}
        />
        {swapMode && cardId ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#DC2626]/0 transition-colors group-hover/swap:bg-[#DC2626]/40 print:hidden">
            <span
              className="bg-[#DC2626] px-3 py-2 text-xs font-bold uppercase tracking-widest text-white opacity-0 transition-opacity group-hover/swap:opacity-100"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Swap photo
            </span>
          </div>
        ) : null}
        {overrideSrc && swapMode ? (
          <span
            className="absolute top-2 left-2 bg-[#059669] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white print:hidden"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Swapped
          </span>
        ) : null}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.08) 0%, rgba(10,10,10,0.74) 72%, rgba(10,10,10,0.92) 100%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between px-8 py-7 text-white">
        <div>
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.28em]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: accent }}
          >
            {front.kicker}
          </p>
          <h2
            className="max-w-[9.75rem]"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '30px',
              fontWeight: 700,
              lineHeight: 1.02,
              color: '#F5F0E8',
            }}
          >
            {front.title}
          </h2>
        </div>

        {(front.quote || front.attribution) ? (
          <div className="max-w-[12rem]">
            {front.quote ? (
              <p
                className="mb-2 text-[15px] leading-snug text-[#F5F0E8]"
                style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}
              >
                {front.quote}
              </p>
            ) : null}
            {front.attribution ? (
              <p
                className="mb-0 text-[9px] uppercase tracking-[0.18em]"
                style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#D4D4D4' }}
              >
                {front.attribution}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <FrontQr />
      <CardFooter label={front.footerLabel} />
    </div>
  );
}

function VoiceFront({
  front,
}: {
  front: Extract<JudgesPostcardFront, { kind: 'voice' }>;
}) {
  const accent = front.accent ?? '#DC2626';
  const background = front.background ?? '#0A0A0A';

  return (
    <div
      className="postcard-page relative overflow-hidden"
      style={{ ...CARD_STYLE, backgroundColor: background, color: '#F5F0E8' }}
    >
      <div className="flex h-full flex-col justify-between px-8 py-7">
        <div>
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.28em]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: accent }}
          >
            {front.kicker}
          </p>
          <p
            className="mb-2 text-[11px] uppercase tracking-[0.18em]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#A3A3A3' }}
          >
            {front.name}  |  {front.age}
          </p>
          <h2
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '30px',
              fontWeight: 700,
              lineHeight: 1.08,
              color: '#F5F0E8',
            }}
          >
            {front.quote}
          </h2>
        </div>
        <p
          className="max-w-[13rem] text-[12px] leading-relaxed"
          style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#B8B8B8' }}
        >
          {front.supporting}
        </p>
      </div>
      <FrontQr />
      <CardFooter label={front.footerLabel} />
    </div>
  );
}

function renderCallout(callout: JudgesPostcardCallout, accent: string) {
  if (callout.style === 'dark-panel') {
    return (
      <div className="mb-3 border border-[#0A0A0A] bg-[#0A0A0A] p-3 text-white">
        {callout.label ? (
          <p
            className="mb-1 text-xs uppercase tracking-[0.16em]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: accent }}
          >
            {callout.label}
          </p>
        ) : null}
        <p className="mb-0 text-sm text-[#D4D4D4]">{callout.text}</p>
      </div>
    );
  }

  if (callout.style === 'light-panel') {
    return (
      <div className="mb-3 border border-[#0A0A0A] bg-white p-3">
        {callout.label ? (
          <p
            className="mb-1 text-xs uppercase tracking-[0.16em]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: accent }}
          >
            {callout.label}
          </p>
        ) : null}
        <p className="mb-0 text-sm text-[#303030]">{callout.text}</p>
      </div>
    );
  }

  return (
    <div className="mb-3 border-l-4 pl-3" style={{ borderColor: accent }}>
      {callout.label ? (
        <p
          className="mb-1 text-xs uppercase tracking-[0.16em]"
          style={{ fontFamily: 'IBM Plex Mono, monospace', color: accent }}
        >
          {callout.label}
        </p>
      ) : null}
      <p className="mb-0 text-sm italic text-[#303030]">{callout.text}</p>
    </div>
  );
}

function BackActionList({ items }: { items: NonNullable<JudgesPostcardBack['actionList']> }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.number} className="flex gap-3">
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: '#0A0A0A',
              color: '#059669',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            {item.number}
          </span>
          <div>
            <p className="mb-0 text-sm font-bold text-[#0A0A0A]">{item.title}</p>
            <p
              className="mb-0 text-[10px]"
              style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666666' }}
            >
              {item.path}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BackBody({ back }: { back: JudgesPostcardBack }) {
  const accent = back.accent ?? '#059669';

  return (
    <>
      {back.paragraphs.map((paragraph, index) => (
        <p
          key={`${back.title}-${index}`}
          className={index === back.paragraphs.length - 1 && !back.callout && !back.action && !back.actionList ? 'mb-0' : 'mb-3'}
        >
          {paragraph}
        </p>
      ))}
      {back.callout ? renderCallout(back.callout, accent) : null}
      {back.action ? <p className="mb-0 font-bold text-[#0A0A0A]">{back.action}</p> : null}
      {back.actionList ? <BackActionList items={back.actionList} /> : null}
    </>
  );
}

function BackCard({
  back,
}: {
  back: JudgesPostcardBack;
}) {
  return (
    <div className="postcard-page" style={{ ...CARD_STYLE, backgroundColor: '#F5F0E8', color: '#0A0A0A' }}>
      <div className="flex h-full flex-col p-5">
        <div className="mb-3">
          <h3
            className="mb-1 text-[16px] font-bold leading-tight text-[#0A0A0A]"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {back.title}
          </h3>
          {back.subtitle ? (
            <p
              className="mb-0 text-[10px]"
              style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666666' }}
            >
              {back.subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex-1 text-sm leading-relaxed text-[#303030]">
          <BackBody back={back} />
        </div>
        <div className="mt-3">
          <QrCallout destination={back.destination} accent={back.accent} />
        </div>
        <BackFooter />
      </div>
    </div>
  );
}

function CardFront({
  front,
  cardId,
  overrideSrc,
  swapMode,
  onRequestSwap,
}: {
  front: JudgesPostcardFront;
  cardId?: string;
  overrideSrc?: string;
  swapMode?: boolean;
  onRequestSwap?: (cardId: string) => void;
}) {
  if (front.kind === 'photo') {
    return (
      <PhotoFront
        front={front}
        cardId={cardId}
        overrideSrc={overrideSrc}
        swapMode={swapMode}
        onRequestSwap={onRequestSwap}
      />
    );
  }

  return <VoiceFront front={front} />;
}

function ScreenHeader({
  mode = 'public',
  resolvedCards,
  resolutionState,
  draftsAccessState,
  draftCreationState,
  onCreateDraft,
}: {
  mode?: PostcardsPageMode;
  resolvedCards: Record<string, ResolvedJudgesPostcardCard>;
  resolutionState: ResolutionState;
  draftsAccessState: DraftsAccessState;
  draftCreationState: DraftCreationState;
  onCreateDraft: (cardId: string) => void;
}) {
  const tripUseIcons = [Video, Search, Scale];

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A] px-4 py-4 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p
              className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[#059669]"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Judges on Country trip kit
            </p>
            <h1
              className="text-xl font-bold text-white md:text-2xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              QR Postcard Field Pack
            </h1>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-[#DC2626] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            <Printer className="h-4 w-4" />
            Print full set
          </button>
        </div>
      </div>

      <div className="border-b border-[#0A0A0A]/10 bg-[#F5F0E8] px-4 py-10 print:hidden">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/judges-on-country"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#0A0A0A] transition-colors hover:text-[#DC2626]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Judges on Country
          </Link>

          <div className="mb-6 border-2 border-[#0A0A0A] bg-[#0A0A0A] p-5 text-white md:p-6">
            <p
              className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[#059669]"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Before you read the cards
            </p>
            <p
              className="mb-4 text-lg font-bold leading-snug text-white md:text-xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              “Our young people are just collateral in a bigger issue.” — Kristy &amp; Tanya, Oonchiumpa
            </p>
            <p className="mb-4 text-sm leading-relaxed text-gray-300 md:text-base">
              Without that sentence, the six cards are just quotes. With it, they’re evidence. Read the
              founders’ story first — it’s the frame every other card hangs on.
            </p>
            <Link
              href="/stories/start-here-kristy-and-tanya"
              className="inline-flex items-center gap-2 bg-[#DC2626] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
            >
              Read the founders’ story
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-2 border-[#0A0A0A] bg-white p-6 md:p-8">
              <p
                className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#DC2626]"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                Print brief
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.02 }}
              >
                Six A6 field cards grounded in real Oonchiumpa people, photos, voices, and follow-through.
              </h2>
              <p className="max-w-3xl text-base leading-relaxed text-gray-700 md:text-lg">
                This set now runs from one source-linked card model. Each front stays close to real
                Oonchiumpa people and consented youth lines, and each back now points directly into
                JusticeHub or ALMA while the screen view carries the Empathy Ledger review links needed
                to work through quotes, stories, and photos.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="border border-[#0A0A0A]/10 bg-[#F5F0E8] p-4">
                  <p
                    className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#059669]"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    Print setup
                  </p>
                  <div className="space-y-3 text-sm text-gray-700">
                    {JUDGES_POSTCARD_PRINT_SETUP.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-[#0A0A0A]/10 bg-[#F5F0E8] p-4">
                  <p
                    className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#059669]"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    Use on the trip
                  </p>
                  <div className="space-y-3 text-sm text-gray-700">
                    {JUDGES_POSTCARD_TRIP_USE.map((item, index) => {
                      const Icon = tripUseIcons[index] ?? Scale;

                      return (
                        <div key={item} className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#DC2626]" />
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-[#0A0A0A] bg-[#0A0A0A] p-6 md:p-8">
              <div className="mb-5 flex items-center gap-2 text-[#059669]">
                <QrCode className="h-4 w-4" />
                <p
                  className="mb-0 text-[11px] uppercase tracking-[0.22em]"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  QR destinations
                </p>
              </div>
              <div className="space-y-4">
                {JUDGES_POSTCARD_CARDS.map((card) => {
                  const destination = JUDGES_POSTCARD_DESTINATIONS[card.back.destination];

                  return (
                    <div key={card.id} className="border border-white/10 bg-white/5 p-4">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span
                          className="text-[10px] uppercase tracking-[0.18em] text-[#059669]"
                          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                        >
                          Card {card.number}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-[0.18em] text-gray-500"
                          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                        >
                          {destination.label}
                        </span>
                      </div>
                      <p className="mb-1 text-sm font-bold text-white">{card.navTitle}</p>
                      <p
                        className="mb-0 text-[11px]"
                        style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#9CA3AF' }}
                      >
                        {destination.displayPath}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {JUDGES_POSTCARD_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => document.getElementById(card.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="border border-[#0A0A0A]/15 bg-white p-3 text-left transition-all hover:border-[#DC2626] hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.25)]"
              >
                <span
                  className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-gray-500"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  Card {card.number}
                </span>
                <span className="block text-sm font-bold text-[#0A0A0A]">{card.navTitle}</span>
              </button>
            ))}
          </div>

          {mode === 'admin' ? (
            <>
              <SourceWorkflowPanel />
              <PublicationQueuePanel
                cards={JUDGES_POSTCARD_CARDS}
                resolvedCards={resolvedCards}
                resolutionState={resolutionState}
                draftsAccessState={draftsAccessState}
                draftCreationState={draftCreationState}
                onCreateDraft={onCreateDraft}
              />
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

/**
 * Shared postcards page body. Two modes:
 *  - 'public' (default, mounted at /judges-on-country/postcards) — print-ready
 *    view with swap mode and the "Before you read" intro. No source panels,
 *    no publication queue, no draft admin.
 *  - 'admin' (mounted at /admin/judges-on-country/postcards) — everything
 *    above plus source resolution panels, publication queue, and EL draft
 *    creation UI.
 */
export function PostcardsPageContent({ mode = 'public' }: { mode?: PostcardsPageMode } = {}) {
  const [resolvedCards, setResolvedCards] = useState<Record<string, ResolvedJudgesPostcardCard>>({});
  const [resolutionState, setResolutionState] = useState<ResolutionState>('loading');
  const [draftCreationState, setDraftCreationState] = useState<DraftCreationState>({});
  const [draftsAccessState, setDraftsAccessState] = useState<DraftsAccessState>('loading');

  // Photo swap mode — enabled via ?swap=true. Overrides persist in localStorage.
  const [swapMode, setSwapMode] = useState(false);
  const [swapTargetCardId, setSwapTargetCardId] = useState<string | null>(null);
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).has('swap')) {
      setSwapMode(true);
    }
    // Load shared overrides from server so every visitor sees the same photos.
    fetch('/api/judges-on-country/photo-overrides?scope=postcards')
      .then((r) => r.json())
      .then((data) => {
        if (data.overrides && typeof data.overrides === 'object') {
          setPhotoOverrides(data.overrides);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== 'admin') return; // Public mode skips admin source resolution.
    let isCancelled = false;

    const loadResolvedCards = async () => {
      try {
        const response = await fetch('/api/judges-on-country/postcards/sources');
        if (!response.ok) {
          throw new Error(`Resolver returned ${response.status}`);
        }

        const data = (await response.json()) as {
          cards?: ResolvedJudgesPostcardCard[];
        };

        if (isCancelled) return;

        const nextMap = Object.fromEntries((data.cards ?? []).map((card) => [card.cardId, card]));
        startTransition(() => {
          setResolvedCards(nextMap);
          setResolutionState('ready');
        });
      } catch (error) {
        console.error('Failed to resolve judges postcard sources:', error);
        if (isCancelled) return;
        startTransition(() => {
          setResolutionState('error');
        });
      }
    };

    loadResolvedCards();

    return () => {
      isCancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'admin') return; // Public mode skips draft state.
    let isCancelled = false;

    const loadDraftState = async () => {
      try {
        const response = await fetch('/api/admin/empathy-ledger/judges-postcards/drafts');

        if (response.status === 401 || response.status === 403) {
          if (isCancelled) return;
          startTransition(() => {
            setDraftsAccessState('disabled');
          });
          return;
        }

        if (!response.ok) {
          throw new Error(`Draft lookup returned ${response.status}`);
        }

        const data = (await response.json()) as {
          items?: Array<{
            cardId: string;
            storyId: string | null;
          }>;
        };

        if (isCancelled) return;

        startTransition(() => {
          setDraftCreationState((current) => {
            const nextState = { ...current };

            for (const item of data.items ?? []) {
              if (!item.storyId) continue;
              if (current[item.cardId]?.status === 'created') continue;
              nextState[item.cardId] = { status: 'existing', storyId: item.storyId };
            }

            return nextState;
          });
          setDraftsAccessState('enabled');
        });
      } catch (error) {
        console.error('Failed to load judges postcard draft state:', error);
        if (isCancelled) return;
        startTransition(() => {
          setDraftsAccessState('disabled');
        });
      }
    };

    loadDraftState();

    return () => {
      isCancelled = true;
    };
  }, [mode]);

  const createDraft = async (cardId: string) => {
    startTransition(() => {
      setDraftCreationState((current) => ({
        ...current,
        [cardId]: { status: 'creating' },
      }));
    });

    try {
      const response = await fetch('/api/admin/empathy-ledger/judges-postcards/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      });

      const data = (await response.json()) as {
        error?: string;
        created?: boolean;
        existing?: boolean;
        storyId?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || `Draft creation failed with ${response.status}`);
      }

      startTransition(() => {
        setDraftCreationState((current) => ({
          ...current,
          [cardId]: data.created
            ? { status: 'created', storyId: data.storyId || 'unknown' }
            : data.existing
              ? { status: 'existing', storyId: data.storyId || 'unknown' }
              : { status: 'idle' },
        }));
      });
    } catch (error) {
      console.error('Failed to create EL postcard draft:', error);
      startTransition(() => {
        setDraftCreationState((current) => ({
          ...current,
          [cardId]: {
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to create EL draft',
          },
        }));
      });
    }
  };

  return (
    <>
      <ScreenHeader
        mode={mode}
        resolvedCards={resolvedCards}
        resolutionState={resolutionState}
        draftsAccessState={draftsAccessState}
        draftCreationState={draftCreationState}
        onCreateDraft={createDraft}
      />

      {swapMode ? (
        <div className="sticky top-[72px] z-40 border-b border-[#059669]/40 bg-[#059669]/10 px-4 py-2 print:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[#059669]" />
            <span
              className="text-xs font-bold uppercase tracking-widest text-[#0A0A0A]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Photo swap mode — click any card front to change its photo
            </span>
            <button
              onClick={() => {
                setSwapMode(false);
                setSwapTargetCardId(null);
              }}
              className="ml-auto text-xs font-bold text-gray-600 underline"
            >
              Exit swap mode
            </button>
            {Object.keys(photoOverrides).length > 0 ? (
              <button
                onClick={() => {
                  setPhotoOverrides({});
                  fetch('/api/judges-on-country/photo-overrides?scope=postcards', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ overrides: {} }),
                  }).catch(() => {});
                }}
                className="text-xs font-bold text-[#DC2626] underline"
              >
                Reset {Object.keys(photoOverrides).length} override
                {Object.keys(photoOverrides).length === 1 ? '' : 's'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="bg-[#D9D4CB] pb-10 print:bg-transparent print:pb-0">
        {JUDGES_POSTCARD_CARDS.map((card) => (
          <div key={card.id} id={card.id}>
            <CardFront
              front={card.front}
              cardId={card.id}
              overrideSrc={photoOverrides[card.id]}
              swapMode={swapMode}
              onRequestSwap={(id) => setSwapTargetCardId(id)}
            />
            <BackCard back={card.back} />
            {mode === 'admin' ? (
              <CardSourcePanel
                card={card}
                resolution={resolvedCards[card.id]}
                resolutionState={resolutionState}
              />
            ) : null}
          </div>
        ))}
      </div>

      {swapMode && swapTargetCardId ? (
        <ELPhotoPickerModal
          title={`Oonchiumpa — Pick a photo for ${swapTargetCardId}`}
          source="oonchiumpa"
          onPick={(url) => {
            const next = { ...photoOverrides, [swapTargetCardId]: url };
            setPhotoOverrides(next);
            // Save to server so the photo applies for every visitor.
            fetch('/api/judges-on-country/photo-overrides?scope=postcards', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ overrides: next }),
            }).catch(() => {});
            setSwapTargetCardId(null);
          }}
          onClose={() => setSwapTargetCardId(null)}
        />
      ) : null}

      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
          }

          .postcard-page {
            margin: 0 !important;
            box-shadow: none !important;
            break-after: page;
          }

          @page {
            size: 148mm 105mm;
            margin: 0;
          }
        }

        @media screen {
          .postcard-page {
            box-shadow: 0 16px 40px rgba(10, 10, 10, 0.18);
          }
        }
      `}</style>
    </>
  );
}

