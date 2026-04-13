import { JUDGES_POSTCARD_CARDS } from '@/content/judges-postcards';
import {
  getStories,
  getStorytellers,
  isV2Configured,
  type V2Story,
  type V2Storyteller,
} from '@/lib/empathy-ledger/v2-client';

const STORYTELLER_IDS = {
  kristy: 'b59a1f4c-94fd-4805-a2c5-cac0922133e0',
  tanya: 'dc85700d-f139-46fa-9074-6afee55ea801',
  jackquann: '6a86acf2-1701-41a9-96ef-d3bae49d91b3',
  nigelPrimary: '8dab91aa-3a1f-4128-b41d-b89e532be1fa',
  laquisha: '7a0cd28a-ad12-4f70-b900-d869b42c9f88',
  fred: '4b35b1af-9815-4b66-89ed-84ac0f5b3a2b',
} as const;

const STORY_IDS = {
  kristyCountry: '128e7ad5-b0c7-4b0d-8ada-878e0d8f0a03',
} as const;

const PUBLIC_PROFILE_ROUTES: Record<string, string> = {
  [STORYTELLER_IDS.kristy]: '/people/kristy-bloomfield',
  [STORYTELLER_IDS.tanya]: '/people/tanya-turner',
};

type CardResolutionConfig = {
  storytellerIds: string[];
  preferredStoryIds?: string[];
  editorialNote?: string;
};

const CARD_RESOLUTION_CONFIG: Record<string, CardResolutionConfig> = {
  'card-1': {
    storytellerIds: [STORYTELLER_IDS.kristy, STORYTELLER_IDS.tanya],
    preferredStoryIds: [STORY_IDS.kristyCountry],
    editorialNote:
      'Kristy currently carries the public EL story record. Tanya is linked through her storyteller record and portrait.',
  },
  'card-2': {
    storytellerIds: [STORYTELLER_IDS.tanya],
  },
  'card-3': {
    storytellerIds: [STORYTELLER_IDS.jackquann],
    editorialNote:
      'The postcard front uses a contextual mentoring photo. The exact EL-linked image below is Jackquann’s storyteller avatar.',
  },
  'card-4': {
    storytellerIds: [STORYTELLER_IDS.nigelPrimary],
  },
  'card-5': {
    storytellerIds: [STORYTELLER_IDS.laquisha],
  },
  'card-6': {
    storytellerIds: [STORYTELLER_IDS.fred],
    editorialNote:
      'The postcard front uses a Country image. The exact EL-linked image below is Fred Campbell’s storyteller avatar.',
  },
};

export type ResolvedJudgesPostcardProfile = {
  id: string;
  displayName: string;
  location: string | null;
  avatarUrl: string | null;
  storyCount: number;
  href: string;
};

export type ResolvedJudgesPostcardStory = {
  id: string;
  title: string;
  publishedAt: string | null;
  imageUrl: string | null;
  storytellerId: string | null;
  storytellerName: string | null;
  href: string;
};

export type ResolvedJudgesPostcardMedia = {
  id: string;
  kind: 'avatar' | 'story-image';
  label: string;
  imageUrl: string;
  href: string;
  linkedRecordId: string;
};

export type ResolvedJudgesPostcardCard = {
  cardId: string;
  status: 'exact' | 'partial' | 'attention';
  profiles: ResolvedJudgesPostcardProfile[];
  stories: ResolvedJudgesPostcardStory[];
  media: ResolvedJudgesPostcardMedia[];
  notes: string[];
};

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveProfileHref(profileId: string) {
  return PUBLIC_PROFILE_ROUTES[profileId] ?? `/api/empathy-ledger/profiles/${profileId}?include_stories=true`;
}

function mapProfiles(
  storytellerIds: string[],
  storytellerMap: Map<string, V2Storyteller>
): ResolvedJudgesPostcardProfile[] {
  return storytellerIds
    .map((id) => storytellerMap.get(id))
    .filter((profile): profile is V2Storyteller => Boolean(profile))
    .map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      storyCount: profile.storyCount,
      href: resolveProfileHref(profile.id),
    }));
}

function mapStories(
  config: CardResolutionConfig,
  allStories: V2Story[]
): ResolvedJudgesPostcardStory[] {
  const preferredStories = (config.preferredStoryIds ?? [])
    .map((storyId) => allStories.find((story) => story.id === storyId))
    .filter((story): story is V2Story => Boolean(story));

  const storytellerStories = allStories.filter((story) => {
    const storytellerId = story.storyteller?.id;
    return storytellerId ? config.storytellerIds.includes(storytellerId) : false;
  });

  return uniqueBy([...preferredStories, ...storytellerStories], (story) => story.id).map((story) => ({
    id: story.id,
    title: story.title,
    publishedAt: story.publishedAt,
    imageUrl: story.imageUrl,
    storytellerId: story.storyteller?.id ?? null,
    storytellerName: story.storyteller?.displayName ?? null,
    href: story.storyteller?.id
      ? `/api/empathy-ledger/stories?limit=20&storyteller_id=${story.storyteller.id}`
      : '/api/empathy-ledger/stories?limit=20',
  }));
}

function mapMedia(
  profiles: ResolvedJudgesPostcardProfile[],
  stories: ResolvedJudgesPostcardStory[]
): ResolvedJudgesPostcardMedia[] {
  const avatarMedia = profiles
    .filter((profile) => profile.avatarUrl)
    .map((profile) => ({
      id: `avatar:${profile.id}`,
      kind: 'avatar' as const,
      label: `${profile.displayName} storyteller image`,
      imageUrl: profile.avatarUrl as string,
      href: resolveProfileHref(profile.id),
      linkedRecordId: profile.id,
    }));

  const storyMedia = stories
    .filter((story) => story.imageUrl)
    .map((story) => ({
      id: `story-image:${story.id}`,
      kind: 'story-image' as const,
      label: `${story.title} story image`,
      imageUrl: story.imageUrl as string,
      href: story.href,
      linkedRecordId: story.id,
    }));

  return uniqueBy([...avatarMedia, ...storyMedia], (item) => item.imageUrl);
}

function buildNotes(
  cardId: string,
  config: CardResolutionConfig,
  profiles: ResolvedJudgesPostcardProfile[],
  stories: ResolvedJudgesPostcardStory[]
): string[] {
  const notes: string[] = [];

  if (profiles.length !== config.storytellerIds.length) {
    notes.push('One or more expected EL storyteller records did not resolve in the current public feed.');
  }

  if (cardId === 'card-4' && profiles.length > 1) {
    notes.push('Two Nigel storyteller records are currently public in EL. Review both before editing quote, image, or attribution.');
  }

  if (stories.length === 0) {
    notes.push('No public EL story is syndicated for this card yet. The quote remains anchored to the local Oonchiumpa ALMA route.');
  }

  if (config.editorialNote) {
    notes.push(config.editorialNote);
  }

  return notes;
}

function buildStatus(
  cardId: string,
  profiles: ResolvedJudgesPostcardProfile[],
  stories: ResolvedJudgesPostcardStory[],
  media: ResolvedJudgesPostcardMedia[]
): ResolvedJudgesPostcardCard['status'] {
  if (cardId === 'card-4' && profiles.length > 1) {
    return 'attention';
  }

  if (profiles.length > 0 && stories.length > 0 && media.length > 0) {
    return 'exact';
  }

  if (profiles.length > 0 || media.length > 0) {
    return 'partial';
  }

  return 'attention';
}

export async function resolveJudgesPostcardCards(): Promise<ResolvedJudgesPostcardCard[]> {
  if (!isV2Configured) {
    return JUDGES_POSTCARD_CARDS.map((card) => ({
      cardId: card.id,
      status: 'attention',
      profiles: [],
      stories: [],
      media: [],
      notes: ['Empathy Ledger v2 is not configured in this environment.'],
    }));
  }

  const [storytellerResult, storyResult] = await Promise.all([
    getStorytellers({ limit: 200 }),
    getStories({ limit: 100 }),
  ]);

  const storytellerMap = new Map(storytellerResult.data.map((storyteller) => [storyteller.id, storyteller]));

  return JUDGES_POSTCARD_CARDS.map((card) => {
    const config = CARD_RESOLUTION_CONFIG[card.id];

    if (!config) {
      return {
        cardId: card.id,
        status: 'attention',
        profiles: [],
        stories: [],
        media: [],
        notes: ['No postcard source configuration exists for this card yet.'],
      };
    }

    const profiles = mapProfiles(config.storytellerIds, storytellerMap);
    const stories = mapStories(config, storyResult.data);
    const media = mapMedia(profiles, stories);
    const notes = buildNotes(card.id, config, profiles, stories);

    return {
      cardId: card.id,
      status: buildStatus(card.id, profiles, stories, media),
      profiles,
      stories,
      media,
      notes,
    };
  });
}
