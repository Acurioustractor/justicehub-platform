import {
  JUDGES_POSTCARD_CARDS,
  JUDGES_POSTCARD_DOMAIN,
  type JudgesPostcardCard,
  type JudgesPostcardPublicationPlan,
  type JudgesPostcardProvenance,
} from '@/content/judges-postcards';
import {
  resolveJudgesPostcardCards,
  type ResolvedJudgesPostcardCard,
} from '@/lib/judges-postcard-source-resolver';

type PublicationQueueStatus = 'ready' | 'blocked';

export type JudgesPostcardDraftStoryPayload = {
  title: string;
  storyteller_id: string;
  story_type: string;
  summary: string;
  content: string;
  status: 'draft';
  is_public: false;
  privacy_level: 'community';
  themes: string[];
  metadata: {
    source: 'judges-postcards-publication-queue';
    postcard_card_id: string;
    postcard_card_number: string;
    postcard_nav_title: string;
    quote_excerpt: string;
    source_route: string;
    destination_route: string;
    requires_editorial_review: true;
    blocker?: string;
    local_asset_path?: string;
  };
};

export type JudgesPostcardPublicationQueueItem = {
  cardId: string;
  cardNumber: string;
  navTitle: string;
  status: PublicationQueueStatus;
  storytellerId: string;
  storytellerName: string;
  proposedTitle: string;
  quoteExcerpt: string;
  summary: string;
  storyType: string;
  themes: string[];
  sourceHref: string;
  destinationHref: string;
  blocker?: string;
  sourceQuote?: JudgesPostcardProvenance;
  sourceImage?: JudgesPostcardProvenance;
  sourceContext?: JudgesPostcardProvenance;
  resolverStatus?: ResolvedJudgesPostcardCard['status'];
  draftStory: JudgesPostcardDraftStoryPayload;
};

export type JudgesPostcardPublicationQueue = {
  generatedAt: string;
  summary: {
    total: number;
    ready: number;
    blocked: number;
  };
  items: JudgesPostcardPublicationQueueItem[];
};

function absoluteJusticeHubUrl(path: string) {
  return `https://${JUDGES_POSTCARD_DOMAIN}${path}`;
}

function findProvenance(card: JudgesPostcardCard, kind: JudgesPostcardProvenance['kind']) {
  return card.provenance.find((item) => item.kind === kind);
}

function buildDraftStoryPayload(
  card: JudgesPostcardCard,
  plan: JudgesPostcardPublicationPlan,
  status: PublicationQueueStatus
): JudgesPostcardDraftStoryPayload {
  const quoteSource = findProvenance(card, 'quote');
  const imageSource = findProvenance(card, 'image');
  const contextSource = findProvenance(card, 'context');

  const contentSections = [
    `Proposed title: ${plan.proposedTitle}`,
    `Storyteller: ${plan.storytellerName} (${plan.storytellerId})`,
    `Quote excerpt: ${plan.quoteExcerpt}`,
    `Summary: ${plan.summary}`,
    quoteSource ? `Current quote source: ${absoluteJusticeHubUrl(quoteSource.href)}\n${quoteSource.note}` : null,
    imageSource ? `Current image source: ${absoluteJusticeHubUrl(imageSource.href)}\n${imageSource.note}` : null,
    contextSource ? `Target route after publication: ${absoluteJusticeHubUrl(contextSource.href)}\n${contextSource.note}` : null,
    status === 'blocked' && plan.blocker ? `Publishing blocker: ${plan.blocker}` : null,
  ].filter(Boolean);

  return {
    title: plan.proposedTitle,
    storyteller_id: plan.storytellerId,
    story_type: plan.storyType,
    summary: plan.summary,
    content: contentSections.join('\n\n'),
    status: 'draft',
    is_public: false,
    privacy_level: 'community',
    themes: plan.themes,
    metadata: {
      source: 'judges-postcards-publication-queue',
      postcard_card_id: card.id,
      postcard_card_number: card.number,
      postcard_nav_title: card.navTitle,
      quote_excerpt: plan.quoteExcerpt,
      source_route: absoluteJusticeHubUrl(plan.sourceHref),
      destination_route: absoluteJusticeHubUrl(plan.destinationHref),
      requires_editorial_review: true,
      blocker: plan.blocker,
      local_asset_path: imageSource?.assetPath,
    },
  };
}

function buildQueueItem(
  card: JudgesPostcardCard,
  resolution?: ResolvedJudgesPostcardCard
): JudgesPostcardPublicationQueueItem | null {
  const plan = card.publicationPlan;
  if (!plan) return null;

  const hasPublicStory = (resolution?.stories.length ?? 0) > 0;
  if (hasPublicStory) return null;

  const status: PublicationQueueStatus =
    plan.blocker || resolution?.status === 'attention' ? 'blocked' : 'ready';

  return {
    cardId: card.id,
    cardNumber: card.number,
    navTitle: card.navTitle,
    status,
    storytellerId: plan.storytellerId,
    storytellerName: plan.storytellerName,
    proposedTitle: plan.proposedTitle,
    quoteExcerpt: plan.quoteExcerpt,
    summary: plan.summary,
    storyType: plan.storyType,
    themes: plan.themes,
    sourceHref: plan.sourceHref,
    destinationHref: plan.destinationHref,
    blocker: plan.blocker,
    sourceQuote: findProvenance(card, 'quote'),
    sourceImage: findProvenance(card, 'image'),
    sourceContext: findProvenance(card, 'context'),
    resolverStatus: resolution?.status,
    draftStory: buildDraftStoryPayload(card, plan, status),
  };
}

export async function buildJudgesPostcardPublicationQueue(): Promise<JudgesPostcardPublicationQueue> {
  const resolvedCards = await resolveJudgesPostcardCards();
  const resolvedMap = Object.fromEntries(resolvedCards.map((card) => [card.cardId, card]));

  const items = JUDGES_POSTCARD_CARDS
    .map((card) => buildQueueItem(card, resolvedMap[card.id]))
    .filter((item): item is JudgesPostcardPublicationQueueItem => Boolean(item));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: items.length,
      ready: items.filter((item) => item.status === 'ready').length,
      blocked: items.filter((item) => item.status === 'blocked').length,
    },
    items,
  };
}

export async function buildJudgesPostcardPublicationMarkdown(): Promise<string> {
  const queue = await buildJudgesPostcardPublicationQueue();

  const lines: string[] = [
    '# Judges Postcard EL Publication Queue',
    '',
    `Generated: ${queue.generatedAt}`,
    '',
    `Ready: ${queue.summary.ready}`,
    `Blocked: ${queue.summary.blocked}`,
    `Total: ${queue.summary.total}`,
    '',
  ];

  for (const item of queue.items) {
    lines.push(`## Card ${item.cardNumber} / ${item.navTitle}`);
    lines.push(`Status: ${item.status}`);
    lines.push(`Storyteller: ${item.storytellerName} (${item.storytellerId})`);
    lines.push(`Proposed title: ${item.proposedTitle}`);
    lines.push(`Story type: ${item.storyType}`);
    lines.push(`Themes: ${item.themes.join(', ')}`);
    lines.push(`Quote: ${item.quoteExcerpt}`);
    lines.push(`Summary: ${item.summary}`);
    lines.push(`Current source: ${absoluteJusticeHubUrl(item.sourceHref)}`);
    lines.push(`Target route: ${absoluteJusticeHubUrl(item.destinationHref)}`);
    if (item.blocker) {
      lines.push(`Blocker: ${item.blocker}`);
    }
    if (item.sourceImage?.assetPath) {
      lines.push(`Local asset: ${item.sourceImage.assetPath}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
