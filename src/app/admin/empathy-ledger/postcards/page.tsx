'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Save,
  Undo2,
} from 'lucide-react';
import type {
  JudgesPostcardCard,
  JudgesPostcardCardOverride,
  JudgesPostcardDestinationKey,
  JudgesPostcardOverridesDocument,
  JudgesPostcardProvenance,
  JudgesPostcardProvenanceKind,
  JudgesPostcardProvenanceStatus,
  JudgesPostcardPublicationPlan,
  JudgesPostcardSource,
  JudgesPostcardSourceKind,
} from '@/content/judges-postcards';
import { JUDGES_POSTCARD_DESTINATIONS } from '@/content/judges-postcards';

type ContentResponse = {
  success: boolean;
  cards: JudgesPostcardCard[];
  overrides: JudgesPostcardOverridesDocument;
};

type ELProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  location: string | null;
  storyCount: number;
};

type ELStory = {
  id: string;
  title: string;
  excerpt: string;
  storytellerId: string | null;
  storytellerName: string | null;
  imageUrl: string | null;
};

type ELMedia = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  altText: string | null;
  attributionText: string | null;
  culturalSensitivity: string | null;
};

const DESTINATION_KEYS = Object.keys(
  JUDGES_POSTCARD_DESTINATIONS
) as JudgesPostcardDestinationKey[];
const SOURCE_KIND_OPTIONS: JudgesPostcardSourceKind[] = [
  'admin',
  'storyteller',
  'story',
  'media',
  'route',
  'api',
];
const PROVENANCE_KIND_OPTIONS: JudgesPostcardProvenanceKind[] = ['quote', 'image', 'context'];
const PROVENANCE_STATUS_OPTIONS: JudgesPostcardProvenanceStatus[] = [
  'editorial',
  'local',
  'el',
  'route',
];

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptySource(kind: JudgesPostcardSourceKind = 'storyteller'): JudgesPostcardSource {
  return {
    kind,
    label: '',
    href: '',
    note: '',
  };
}

function emptyProvenance(
  kind: JudgesPostcardProvenanceKind = 'quote',
  status: JudgesPostcardProvenanceStatus = 'editorial'
): JudgesPostcardProvenance {
  return {
    kind,
    status,
    label: '',
    href: '',
    note: '',
  };
}

function emptyPublicationPlan(): JudgesPostcardPublicationPlan {
  return {
    storytellerId: '',
    storytellerName: '',
    proposedTitle: '',
    quoteExcerpt: '',
    summary: '',
    storyType: 'community_story',
    themes: [],
    sourceHref: '',
    destinationHref: '',
  };
}

export default function JudgesPostcardEditorPage() {
  const [cards, setCards] = useState<JudgesPostcardCard[]>([]);
  const [overrides, setOverrides] = useState<JudgesPostcardOverridesDocument>({ cards: {} });
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [cardDraft, setCardDraft] = useState<JudgesPostcardCard | null>(null);
  const [paragraphsText, setParagraphsText] = useState('');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [profiles, setProfiles] = useState<ELProfile[]>([]);
  const [stories, setStories] = useState<ELStory[]>([]);
  const [mediaAssets, setMediaAssets] = useState<ELMedia[]>([]);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [mediaOffset, setMediaOffset] = useState(0);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaGalleryId, setMediaGalleryId] = useState('');
  const [mediaGalleries, setMediaGalleries] = useState<Array<{ id: string; title: string; mediaCount: number }>>([]);
  const [mediaLoadingMore, setMediaLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) || null,
    [cards, selectedCardId]
  );

  const hydrateEditor = useCallback((card: JudgesPostcardCard) => {
    setCardDraft(structuredClone(card));
    setParagraphsText(card.back.paragraphs.join('\n\n'));
  }, []);

  const loadContent = useCallback(
    async (preferredCardId?: string) => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch('/api/admin/judges-postcards/content');
        if (!response.ok) {
          throw new Error(`Editor content returned ${response.status}`);
        }

        const data = (await response.json()) as ContentResponse;
        const nextCards = data.cards || [];
        const nextSelectedId =
          preferredCardId && nextCards.some((card) => card.id === preferredCardId)
            ? preferredCardId
            : nextCards[0]?.id || '';

        setCards(nextCards);
        setOverrides(data.overrides || { cards: {} });
        setSelectedCardId(nextSelectedId);

        const nextCard = nextCards.find((card) => card.id === nextSelectedId);
        if (nextCard) {
          hydrateEditor(nextCard);
        } else {
          setCardDraft(null);
        }
      } catch (loadError) {
        console.error('Failed to load judges postcard editor:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load editor');
      } finally {
        setLoading(false);
      }
    },
    [hydrateEditor]
  );

  const loadMedia = useCallback(async (options: { search?: string; galleryId?: string; offset?: number; append?: boolean } = {}) => {
    const { search = '', galleryId = '', offset = 0, append = false } = options;
    if (append) {
      setMediaLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ type: 'media', limit: '60', offset: String(offset) });
      if (search) params.set('search', search);
      if (galleryId) params.set('galleryId', galleryId);

      const response = await fetch(`/api/empathy-ledger/media-browser?${params}`);
      if (!response.ok) throw new Error(`Media browser returned ${response.status}`);

      const result = (await response.json()) as {
        data: Array<{
          id: string;
          url: string;
          thumbnail_url?: string | null;
          medium_url?: string | null;
          cdn_url?: string | null;
          title?: string | null;
          alt_text?: string | null;
          caption?: string | null;
          cultural_sensitivity_level?: string | null;
          filename?: string | null;
        }>;
      };

      const mapped: ELMedia[] = (result.data || []).map((asset) => ({
        id: asset.id,
        url: asset.cdn_url || asset.medium_url || asset.url,
        thumbnailUrl: asset.thumbnail_url || asset.medium_url || asset.url,
        title: asset.title || asset.filename || null,
        altText: asset.alt_text || asset.caption || null,
        attributionText: asset.caption || null,
        culturalSensitivity: asset.cultural_sensitivity_level || null,
      }));

      if (append) {
        setMediaAssets((prev) => [...prev, ...mapped]);
      } else {
        setMediaAssets(mapped);
      }
      setMediaTotal(mapped.length === 60 ? offset + 60 + 1 : offset + mapped.length);
      setMediaOffset(offset + mapped.length);
    } catch (mediaError) {
      console.error('Failed to load EL media:', mediaError);
      if (!append) setMediaAssets([]);
    } finally {
      setMediaLoadingMore(false);
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryError(null);

    try {
      const [profilesResponse, storiesResponse, galleriesResponse] = await Promise.all([
        fetch('/api/empathy-ledger/profiles?limit=100&include_stories=true'),
        fetch('/api/empathy-ledger/stories?limit=50'),
        fetch('/api/empathy-ledger/media-browser?type=galleries&limit=50'),
      ]);

      if (!profilesResponse.ok || !storiesResponse.ok) {
        throw new Error('One or more EL source feeds failed to load');
      }

      const profilesData = (await profilesResponse.json()) as {
        profiles?: Array<{
          id: string;
          display_name: string;
          avatar_url: string | null;
          location: string | null;
          story_count?: number;
        }>;
      };
      const storiesData = (await storiesResponse.json()) as {
        stories?: Array<{
          id: string;
          title: string;
          excerpt?: string;
          storyteller_id?: string | null;
          storyteller_name?: string | null;
          story_image_url?: string | null;
        }>;
      };

      setProfiles(
        (profilesData.profiles || []).map((profile) => ({
          id: profile.id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          location: profile.location,
          storyCount: profile.story_count || 0,
        }))
      );
      setStories(
        (storiesData.stories || []).map((story) => ({
          id: story.id,
          title: story.title,
          excerpt: story.excerpt || '',
          storytellerId: story.storyteller_id || null,
          storytellerName: story.storyteller_name || null,
          imageUrl: story.story_image_url || null,
        }))
      );

      if (galleriesResponse.ok) {
        const galleriesData = (await galleriesResponse.json()) as {
          data?: Array<{ id: string; title: string; mediaCount: number }>;
        };
        setMediaGalleries(galleriesData.data || []);
      }

      // Load initial media batch via the full media-browser endpoint
      await loadMedia();
    } catch (nextError) {
      console.error('Failed to load postcard EL source library:', nextError);
      setLibraryError(
        nextError instanceof Error ? nextError.message : 'Failed to load EL source library'
      );
    } finally {
      setLibraryLoading(false);
    }
  }, [loadMedia]);

  useEffect(() => {
    void loadContent();
    void loadLibrary();
  }, [loadContent, loadLibrary]);

  useEffect(() => {
    if (!selectedCard) return;
    hydrateEditor(selectedCard);
  }, [hydrateEditor, selectedCard]);

  const updateDraft = (updater: (current: JudgesPostcardCard) => JudgesPostcardCard) => {
    setCardDraft((current) => (current ? updater(current) : current));
  };

  const updateFrontField = (field: string, value: string) => {
    updateDraft((current) => ({
      ...current,
      front: {
        ...current.front,
        [field]: value,
      } as JudgesPostcardCard['front'],
    }));
  };

  const setFrontKind = (kind: 'photo' | 'voice') => {
    updateDraft((current) => {
      if (current.front.kind === kind) {
        return current;
      }

      if (kind === 'photo') {
        return {
          ...current,
          front: {
            kind: 'photo',
            kicker: current.front.kicker,
            title: 'title' in current.front ? current.front.title : current.front.quote,
            quote: 'quote' in current.front ? current.front.quote : '',
            attribution: 'name' in current.front ? current.front.name : '',
            imageSrc: '',
            imageAlt: '',
            accent: current.front.accent,
            footerLabel: current.front.footerLabel,
          },
        };
      }

      return {
        ...current,
        front: {
          kind: 'voice',
          kicker: current.front.kicker,
          name: 'attribution' in current.front
            ? (current.front.attribution || '').split('|')[0]?.trim() || current.navTitle
            : current.front.name,
          age: '',
          quote: 'quote' in current.front ? current.front.quote || '' : '',
          supporting:
            'title' in current.front ? current.front.title : current.front.supporting,
          accent: current.front.accent,
          background: '#0A0A0A',
          footerLabel: current.front.footerLabel,
        },
      };
    });
  };

  const updateBackField = (field: string, value: string) => {
    updateDraft((current) => ({
      ...current,
      back: {
        ...current.back,
        [field]: value,
      } as JudgesPostcardCard['back'],
    }));
  };

  const updateActionItem = (index: number, field: 'number' | 'title' | 'path', value: string) => {
    updateDraft((current) => ({
      ...current,
      back: {
        ...current.back,
        actionList: (current.back.actionList || []).map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const addActionItem = () => {
    updateDraft((current) => ({
      ...current,
      back: {
        ...current.back,
        actionList: [
          ...(current.back.actionList || []),
          {
            number: String((current.back.actionList || []).length + 1),
            title: '',
            path: '',
          },
        ],
      },
    }));
  };

  const removeActionItem = (index: number) => {
    updateDraft((current) => ({
      ...current,
      back: {
        ...current.back,
        actionList: (current.back.actionList || []).filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  };

  const updateSourceField = (
    index: number,
    field: keyof JudgesPostcardSource,
    value: string | undefined
  ) => {
    updateDraft((current) => ({
      ...current,
      sourceStack: current.sourceStack.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value || (field === 'recordId' ? undefined : ''),
            }
          : item
      ),
    }));
  };

  const addSource = (kind: JudgesPostcardSourceKind = 'storyteller') => {
    updateDraft((current) => ({
      ...current,
      sourceStack: [...current.sourceStack, emptySource(kind)],
    }));
  };

  const removeSource = (index: number) => {
    updateDraft((current) => ({
      ...current,
      sourceStack: current.sourceStack.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateProvenanceField = (
    index: number,
    field: keyof JudgesPostcardProvenance,
    value: string | undefined
  ) => {
    updateDraft((current) => ({
      ...current,
      provenance: current.provenance.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value || undefined,
            }
          : item
      ),
    }));
  };

  const addProvenance = (
    kind: JudgesPostcardProvenanceKind = 'quote',
    status: JudgesPostcardProvenanceStatus = 'editorial'
  ) => {
    updateDraft((current) => ({
      ...current,
      provenance: [...current.provenance, emptyProvenance(kind, status)],
    }));
  };

  const removeProvenance = (index: number) => {
    updateDraft((current) => ({
      ...current,
      provenance: current.provenance.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const setPublicationPlanEnabled = (enabled: boolean) => {
    updateDraft((current) => ({
      ...current,
      publicationPlan: enabled ? current.publicationPlan || emptyPublicationPlan() : undefined,
    }));
  };

  const updatePublicationPlanField = (
    field: keyof JudgesPostcardPublicationPlan,
    value: string | string[]
  ) => {
    updateDraft((current) => {
      const nextPlan = current.publicationPlan || emptyPublicationPlan();
      return {
        ...current,
        publicationPlan: {
          ...nextPlan,
          [field]: value,
        },
      };
    });
  };

  const upsertSource = useCallback(
    (nextSource: JudgesPostcardSource) => {
      updateDraft((current) => {
        const matchIndex = current.sourceStack.findIndex((source) => {
          if (nextSource.recordId && source.recordId) {
            return source.recordId === nextSource.recordId;
          }
          return source.kind === nextSource.kind && source.label === nextSource.label;
        });

        if (matchIndex === -1) {
          return {
            ...current,
            sourceStack: [...current.sourceStack, nextSource],
          };
        }

        return {
          ...current,
          sourceStack: current.sourceStack.map((source, index) =>
            index === matchIndex ? { ...source, ...nextSource } : source
          ),
        };
      });
    },
    []
  );

  const upsertProvenance = useCallback((nextItem: JudgesPostcardProvenance) => {
    updateDraft((current) => {
      const matchIndex = current.provenance.findIndex((item) => item.kind === nextItem.kind);
      if (matchIndex === -1) {
        return {
          ...current,
          provenance: [...current.provenance, nextItem],
        };
      }

      return {
        ...current,
        provenance: current.provenance.map((item, index) =>
          index === matchIndex ? { ...item, ...nextItem } : item
        ),
      };
    });
  }, []);

  const applyProfileToCard = (profile: ELProfile) => {
    const personHref = `/people/${slugifyName(profile.displayName)}`;

    updateDraft((current) => {
      const nextPlan = current.publicationPlan
        ? {
            ...current.publicationPlan,
            storytellerId: profile.id,
            storytellerName: profile.displayName,
          }
        : current.publicationPlan;

      return {
        ...current,
        navTitle: current.navTitle || profile.displayName,
        front:
          current.front.kind === 'photo'
            ? {
                ...current.front,
                attribution: current.front.attribution || profile.displayName,
              }
            : {
                ...current.front,
                name: profile.displayName,
              },
        publicationPlan: nextPlan,
      };
    });

    upsertSource({
      kind: 'storyteller',
      label: `${profile.displayName} person page`,
      href: personHref,
      note: 'Selected from the EL storyteller picker in the postcard editor.',
      recordId: profile.id,
    });
  };

  const applyStoryToCard = (story: ELStory) => {
    updateDraft((current) => {
      const nextPlan = current.publicationPlan
        ? {
            ...current.publicationPlan,
            storytellerId: story.storytellerId || current.publicationPlan.storytellerId,
            storytellerName: story.storytellerName || current.publicationPlan.storytellerName,
            proposedTitle: current.publicationPlan.proposedTitle || story.title,
            quoteExcerpt: story.excerpt || current.publicationPlan.quoteExcerpt,
            sourceHref: `/api/empathy-ledger/stories?limit=50`,
          }
        : current.publicationPlan;

      return {
        ...current,
        front:
          current.front.kind === 'photo'
            ? {
                ...current.front,
                quote: story.excerpt || current.front.quote || '',
                attribution:
                  current.front.attribution ||
                  story.storytellerName ||
                  current.front.attribution,
              }
            : {
                ...current.front,
                quote: story.excerpt || current.front.quote,
                name: story.storytellerName || current.front.name,
              },
        publicationPlan: nextPlan,
      };
    });

    upsertSource({
      kind: 'story',
      label: story.title,
      href: '/api/empathy-ledger/stories?limit=50',
      note: 'Selected from the EL stories picker in the postcard editor.',
      recordId: story.id,
    });

    upsertProvenance({
      kind: 'quote',
      status: 'el',
      label: story.title,
      href: '/api/empathy-ledger/stories?limit=50',
      note: 'Front quote pulled from an EL public story excerpt.',
      excerpt: story.excerpt,
      previewSrc: story.imageUrl || undefined,
    });
  };

  const applyMediaToCard = (asset: ELMedia) => {
    updateDraft((current) => {
      if (current.front.kind !== 'photo') {
        return current;
      }

      return {
        ...current,
        front: {
          ...current.front,
          imageSrc: asset.url,
          imageAlt: asset.altText || asset.title || current.front.imageAlt,
        },
      };
    });

    upsertSource({
      kind: 'media',
      label: asset.title || 'EL media asset',
      href: '/api/sync/empathy-ledger?organization=oonchiumpa&type=image&limit=24',
      note: 'Selected from the Oonchiumpa EL media picker in the postcard editor.',
      recordId: asset.id,
    });

    upsertProvenance({
      kind: 'image',
      status: 'el',
      label: asset.title || 'EL media asset',
      href: '/api/sync/empathy-ledger?organization=oonchiumpa&type=image&limit=24',
      note: asset.attributionText || 'Front image pulled from the Oonchiumpa EL media feed.',
      assetPath: asset.url,
      previewSrc: asset.thumbnailUrl || asset.url,
    });
  };

  const saveCard = async () => {
    if (!cardDraft) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const override: JudgesPostcardCardOverride = {
        navTitle: cardDraft.navTitle,
        front: cardDraft.front,
        back: {
          ...cardDraft.back,
          paragraphs: paragraphsText
            .split(/\n\s*\n/)
            .map((item) => item.trim())
            .filter(Boolean),
        },
        sourceStack: cardDraft.sourceStack,
        provenance: cardDraft.provenance,
        publicationPlan: cardDraft.publicationPlan ?? null,
      };

      const response = await fetch('/api/admin/judges-postcards/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: cardDraft.id,
          override,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || `Save returned ${response.status}`);
      }

      setMessage(`Saved ${cardDraft.number} / ${cardDraft.navTitle}`);
      await loadContent(cardDraft.id);
    } catch (saveError) {
      console.error('Failed to save postcard editor card:', saveError);
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save postcard changes'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetCard = async () => {
    if (!cardDraft) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/judges-postcards/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: cardDraft.id,
          reset: true,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || `Reset returned ${response.status}`);
      }

      setMessage(`Reset overrides for ${cardDraft.number} / ${cardDraft.navTitle}`);
      await loadContent(cardDraft.id);
    } catch (resetError) {
      console.error('Failed to reset postcard override:', resetError);
      setError(
        resetError instanceof Error ? resetError.message : 'Failed to reset postcard override'
      );
    } finally {
      setSaving(false);
    }
  };

  const hasOverride = Boolean(selectedCardId && overrides.cards[selectedCardId]);
  const selectedDestination = cardDraft
    ? JUDGES_POSTCARD_DESTINATIONS[cardDraft.back.destination]
    : null;
  const normalizedQuery = libraryQuery.trim().toLowerCase();

  const filteredProfiles = useMemo(() => {
    if (!normalizedQuery) return profiles;
    return profiles.filter((profile) =>
      [profile.displayName, profile.location, profile.id].some((value) =>
        (value || '').toLowerCase().includes(normalizedQuery)
      )
    );
  }, [normalizedQuery, profiles]);

  const filteredStories = useMemo(() => {
    if (!normalizedQuery) return stories;
    return stories.filter((story) =>
      [story.title, story.excerpt, story.storytellerName, story.id].some((value) =>
        (value || '').toLowerCase().includes(normalizedQuery)
      )
    );
  }, [normalizedQuery, stories]);

  // Media filtering is now server-side via media-browser API search param

  return (
    <div className="min-h-screen bg-[#F7F3EC] page-content">
      <section className="border-b-2 border-black bg-white py-8">
        <div className="container-justice">
          <Link
            href="/admin/empathy-ledger/content"
            className="mb-4 inline-flex items-center gap-2 font-bold text-earth-700 hover:text-earth-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to EL Content
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[#0E7490]">
                Judges On Country
              </p>
              <h1 className="text-3xl font-black text-[#0A0A0A]">Postcard Editor</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4F463F]">
                Change the person, quote, photo, source trail, and publication plan without hand-editing
                JSON or the base postcard TS file.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/judges-on-country/postcards"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
              >
                <ExternalLink className="h-4 w-4" />
                Open live postcards
              </Link>
              <button
                type="button"
                onClick={() => {
                  void loadContent(selectedCardId);
                  void loadLibrary();
                }}
                disabled={loading || saving || libraryLoading}
                className="inline-flex items-center gap-2 border-2 border-black bg-[#0A0A0A] px-4 py-2 font-bold text-white disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading || libraryLoading ? 'animate-spin' : ''}`} />
                Reload
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-justice py-8">
        {error ? (
          <div className="mb-6 border-2 border-red-300 bg-red-50 p-4 text-red-800">{error}</div>
        ) : null}
        {message ? (
          <div className="mb-6 border-2 border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-2 border-black bg-white p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8B8178]">
              Cards
            </p>
            <div className="space-y-2">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-full border-2 px-3 py-3 text-left transition-colors ${
                    selectedCardId === card.id
                      ? 'border-black bg-[#0A0A0A] text-white'
                      : 'border-black bg-[#F7F3EC] text-[#0A0A0A] hover:bg-[#EFE8DB]'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] opacity-70">
                    Card {card.number}
                  </p>
                  <p className="font-bold">{card.navTitle}</p>
                  <p className="text-xs opacity-80">
                    {card.front.kind === 'photo'
                      ? card.front.attribution || card.front.title
                      : card.front.name}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            {loading || !cardDraft ? (
              <div className="border-2 border-black bg-white p-8 text-[#4F463F]">
                Loading postcard editor…
              </div>
            ) : (
              <>
                <div className="border-2 border-black bg-white p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[#8B8178]">
                        Card {cardDraft.number}
                      </p>
                      <h2 className="text-2xl font-black text-[#0A0A0A]">{cardDraft.navTitle}</h2>
                      <p className="mt-2 text-sm text-[#4F463F]">
                        Override active: <span className="font-bold">{hasOverride ? 'yes' : 'no'}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/judges-on-country/postcards#${cardDraft.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 border border-black px-3 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open this card live
                      </Link>
                      <button
                        type="button"
                        onClick={resetCard}
                        disabled={saving}
                        className="inline-flex items-center gap-2 border border-black px-3 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#F7F3EC] disabled:opacity-60"
                      >
                        <Undo2 className="h-4 w-4" />
                        Reset override
                      </button>
                      <button
                        type="button"
                        onClick={saveCard}
                        disabled={saving}
                        className="inline-flex items-center gap-2 border border-black bg-[#0A0A0A] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving…' : 'Save card'}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="space-y-6">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-[#0A0A0A]">Navigation title</label>
                        <input
                          value={cardDraft.navTitle}
                          onChange={(event) =>
                            setCardDraft((current) =>
                              current ? { ...current, navTitle: event.target.value } : current
                            )
                          }
                          className="w-full border border-black px-3 py-2"
                        />
                      </div>

                      <div className="border border-black p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-bold text-[#0A0A0A]">Front</p>
                          <div className="rounded-full bg-[#F7F3EC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B625B]">
                            {cardDraft.front.kind}
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-bold">Type</label>
                            <select
                              value={cardDraft.front.kind}
                              onChange={(event) => setFrontKind(event.target.value as 'photo' | 'voice')}
                              className="w-full border border-black px-3 py-2"
                            >
                              <option value="photo">Photo</option>
                              <option value="voice">Voice</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-bold">Kicker</label>
                            <input
                              value={cardDraft.front.kicker}
                              onChange={(event) => updateFrontField('kicker', event.target.value)}
                              className="w-full border border-black px-3 py-2"
                            />
                          </div>
                          {'title' in cardDraft.front ? (
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-sm font-bold">Front title</label>
                              <textarea
                                value={cardDraft.front.title}
                                onChange={(event) => updateFrontField('title', event.target.value)}
                                className="min-h-[96px] w-full border border-black px-3 py-2"
                              />
                            </div>
                          ) : null}
                          {'quote' in cardDraft.front ? (
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-sm font-bold">Front quote</label>
                              <textarea
                                value={cardDraft.front.quote || ''}
                                onChange={(event) => updateFrontField('quote', event.target.value)}
                                className="min-h-[96px] w-full border border-black px-3 py-2"
                              />
                            </div>
                          ) : null}
                          {'attribution' in cardDraft.front ? (
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-sm font-bold">Attribution</label>
                              <input
                                value={cardDraft.front.attribution || ''}
                                onChange={(event) => updateFrontField('attribution', event.target.value)}
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                          ) : null}
                          {'name' in cardDraft.front ? (
                            <>
                              <div>
                                <label className="mb-1 block text-sm font-bold">Person name</label>
                                <input
                                  value={cardDraft.front.name}
                                  onChange={(event) => updateFrontField('name', event.target.value)}
                                  className="w-full border border-black px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-bold">Age label</label>
                                <input
                                  value={cardDraft.front.age}
                                  onChange={(event) => updateFrontField('age', event.target.value)}
                                  className="w-full border border-black px-3 py-2"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-bold">Supporting line</label>
                                <textarea
                                  value={cardDraft.front.supporting}
                                  onChange={(event) => updateFrontField('supporting', event.target.value)}
                                  className="min-h-[96px] w-full border border-black px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-bold">Background</label>
                                <input
                                  value={cardDraft.front.background || ''}
                                  onChange={(event) => updateFrontField('background', event.target.value)}
                                  className="w-full border border-black px-3 py-2"
                                />
                              </div>
                            </>
                          ) : null}
                          {'imageSrc' in cardDraft.front ? (
                            <>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-bold">Image path</label>
                                <input
                                  value={cardDraft.front.imageSrc}
                                  onChange={(event) => updateFrontField('imageSrc', event.target.value)}
                                  className="w-full border border-black px-3 py-2"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-bold">Image alt</label>
                                <input
                                  value={cardDraft.front.imageAlt}
                                  onChange={(event) => updateFrontField('imageAlt', event.target.value)}
                                  className="w-full border border-black px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-bold">Image filter</label>
                                <input
                                  value={cardDraft.front.imageFilter || ''}
                                  onChange={(event) => updateFrontField('imageFilter', event.target.value)}
                                  className="w-full border border-black px-3 py-2"
                                />
                              </div>
                            </>
                          ) : null}
                          <div>
                            <label className="mb-1 block text-sm font-bold">Accent color</label>
                            <input
                              value={cardDraft.front.accent || ''}
                              onChange={(event) => updateFrontField('accent', event.target.value)}
                              className="w-full border border-black px-3 py-2"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-bold">Footer label</label>
                            <input
                              value={cardDraft.front.footerLabel}
                              onChange={(event) => updateFrontField('footerLabel', event.target.value)}
                              className="w-full border border-black px-3 py-2"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border border-black p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-bold text-[#0A0A0A]">Back</p>
                          {selectedDestination ? (
                            <div className="max-w-[320px] text-right text-xs text-[#6B625B]">
                              <p className="font-bold text-[#0A0A0A]">{selectedDestination.label}</p>
                              <p>{selectedDestination.description}</p>
                            </div>
                          ) : null}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-bold">Back title</label>
                            <input
                              value={cardDraft.back.title}
                              onChange={(event) => updateBackField('title', event.target.value)}
                              className="w-full border border-black px-3 py-2"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-bold">Subtitle</label>
                            <input
                              value={cardDraft.back.subtitle || ''}
                              onChange={(event) => updateBackField('subtitle', event.target.value)}
                              className="w-full border border-black px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-bold">Destination</label>
                            <select
                              value={cardDraft.back.destination}
                              onChange={(event) =>
                                updateBackField('destination', event.target.value)
                              }
                              className="w-full border border-black px-3 py-2"
                            >
                              {DESTINATION_KEYS.map((key) => (
                                <option key={key} value={key}>
                                  {key}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-bold">Back accent</label>
                            <input
                              value={cardDraft.back.accent || ''}
                              onChange={(event) => updateBackField('accent', event.target.value)}
                              className="w-full border border-black px-3 py-2"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-bold">Paragraphs</label>
                            <textarea
                              value={paragraphsText}
                              onChange={(event) => setParagraphsText(event.target.value)}
                              className="min-h-[180px] w-full border border-black px-3 py-2"
                            />
                            <p className="mt-1 text-xs text-[#6B625B]">
                              Separate paragraphs with a blank line.
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-bold">Action line</label>
                            <textarea
                              value={cardDraft.back.action || ''}
                              onChange={(event) => updateBackField('action', event.target.value)}
                              className="min-h-[96px] w-full border border-black px-3 py-2"
                            />
                          </div>
                        </div>

                        <div className="mt-5 border-t border-black/10 pt-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="font-bold text-[#0A0A0A]">Action list</p>
                            <button
                              type="button"
                              onClick={addActionItem}
                              className="inline-flex items-center gap-2 border border-black px-3 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
                            >
                              <Plus className="h-4 w-4" />
                              Add item
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(cardDraft.back.actionList || []).map((item, index) => (
                              <div key={`${item.number}-${index}`} className="border border-black/10 p-3">
                                <div className="grid gap-3 md:grid-cols-[80px_minmax(0,1fr)]">
                                  <div>
                                    <label className="mb-1 block text-xs font-bold">No.</label>
                                    <input
                                      value={item.number}
                                      onChange={(event) =>
                                        updateActionItem(index, 'number', event.target.value)
                                      }
                                      className="w-full border border-black px-3 py-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-bold">Title</label>
                                    <input
                                      value={item.title}
                                      onChange={(event) =>
                                        updateActionItem(index, 'title', event.target.value)
                                      }
                                      className="w-full border border-black px-3 py-2"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-bold">Path</label>
                                    <input
                                      value={item.path}
                                      onChange={(event) =>
                                        updateActionItem(index, 'path', event.target.value)
                                      }
                                      className="w-full border border-black px-3 py-2"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeActionItem(index)}
                                  className="mt-3 text-sm font-bold text-[#9F1D1D]"
                                >
                                  Remove item
                                </button>
                              </div>
                            ))}
                            {(cardDraft.back.actionList || []).length === 0 ? (
                              <p className="text-sm text-[#6B625B]">
                                No action list yet. Add one if this card needs multiple next steps on the back.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="border border-black p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-bold text-[#0A0A0A]">Source stack</p>
                          <button
                            type="button"
                            onClick={() => addSource()}
                            className="inline-flex items-center gap-2 border border-black px-3 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
                          >
                            <Plus className="h-4 w-4" />
                            Add source
                          </button>
                        </div>
                        <div className="space-y-3">
                          {cardDraft.sourceStack.map((source, index) => (
                            <div key={`${source.kind}-${index}`} className="border border-black/10 p-3">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-bold">Kind</label>
                                  <select
                                    value={source.kind}
                                    onChange={(event) =>
                                      updateSourceField(
                                        index,
                                        'kind',
                                        event.target.value as JudgesPostcardSourceKind
                                      )
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  >
                                    {SOURCE_KIND_OPTIONS.map((kind) => (
                                      <option key={kind} value={kind}>
                                        {kind}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-bold">Record ID</label>
                                  <input
                                    value={source.recordId || ''}
                                    onChange={(event) =>
                                      updateSourceField(index, 'recordId', event.target.value)
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-bold">Label</label>
                                  <input
                                    value={source.label}
                                    onChange={(event) =>
                                      updateSourceField(index, 'label', event.target.value)
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-bold">Href</label>
                                  <input
                                    value={source.href}
                                    onChange={(event) =>
                                      updateSourceField(index, 'href', event.target.value)
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-bold">Note</label>
                                  <textarea
                                    value={source.note}
                                    onChange={(event) =>
                                      updateSourceField(index, 'note', event.target.value)
                                    }
                                    className="min-h-[88px] w-full border border-black px-3 py-2"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSource(index)}
                                className="mt-3 text-sm font-bold text-[#9F1D1D]"
                              >
                                Remove source
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border border-black p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-bold text-[#0A0A0A]">Provenance</p>
                          <button
                            type="button"
                            onClick={() => addProvenance()}
                            className="inline-flex items-center gap-2 border border-black px-3 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
                          >
                            <Plus className="h-4 w-4" />
                            Add provenance
                          </button>
                        </div>
                        <div className="space-y-3">
                          {cardDraft.provenance.map((item, index) => (
                            <div key={`${item.kind}-${index}`} className="border border-black/10 p-3">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-bold">Kind</label>
                                  <select
                                    value={item.kind}
                                    onChange={(event) =>
                                      updateProvenanceField(
                                        index,
                                        'kind',
                                        event.target.value as JudgesPostcardProvenanceKind
                                      )
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  >
                                    {PROVENANCE_KIND_OPTIONS.map((kind) => (
                                      <option key={kind} value={kind}>
                                        {kind}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-bold">Status</label>
                                  <select
                                    value={item.status}
                                    onChange={(event) =>
                                      updateProvenanceField(
                                        index,
                                        'status',
                                        event.target.value as JudgesPostcardProvenanceStatus
                                      )
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  >
                                    {PROVENANCE_STATUS_OPTIONS.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-bold">Label</label>
                                  <input
                                    value={item.label}
                                    onChange={(event) =>
                                      updateProvenanceField(index, 'label', event.target.value)
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-bold">Href</label>
                                  <input
                                    value={item.href}
                                    onChange={(event) =>
                                      updateProvenanceField(index, 'href', event.target.value)
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-bold">Note</label>
                                  <textarea
                                    value={item.note}
                                    onChange={(event) =>
                                      updateProvenanceField(index, 'note', event.target.value)
                                    }
                                    className="min-h-[88px] w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-bold">Excerpt</label>
                                  <textarea
                                    value={item.excerpt || ''}
                                    onChange={(event) =>
                                      updateProvenanceField(index, 'excerpt', event.target.value)
                                    }
                                    className="min-h-[88px] w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-bold">Asset path</label>
                                  <input
                                    value={item.assetPath || ''}
                                    onChange={(event) =>
                                      updateProvenanceField(index, 'assetPath', event.target.value)
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-bold">Preview src</label>
                                  <input
                                    value={item.previewSrc || ''}
                                    onChange={(event) =>
                                      updateProvenanceField(index, 'previewSrc', event.target.value)
                                    }
                                    className="w-full border border-black px-3 py-2"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProvenance(index)}
                                className="mt-3 text-sm font-bold text-[#9F1D1D]"
                              >
                                Remove provenance
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border border-black p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-bold text-[#0A0A0A]">Publication plan</p>
                          {cardDraft.publicationPlan ? (
                            <button
                              type="button"
                              onClick={() => setPublicationPlanEnabled(false)}
                              className="text-sm font-bold text-[#9F1D1D]"
                            >
                              Remove publication plan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPublicationPlanEnabled(true)}
                              className="inline-flex items-center gap-2 border border-black px-3 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
                            >
                              <Plus className="h-4 w-4" />
                              Add publication plan
                            </button>
                          )}
                        </div>

                        {cardDraft.publicationPlan ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold">Storyteller ID</label>
                              <input
                                value={cardDraft.publicationPlan.storytellerId}
                                onChange={(event) =>
                                  updatePublicationPlanField('storytellerId', event.target.value)
                                }
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold">Storyteller name</label>
                              <input
                                value={cardDraft.publicationPlan.storytellerName}
                                onChange={(event) =>
                                  updatePublicationPlanField('storytellerName', event.target.value)
                                }
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-bold">Proposed title</label>
                              <input
                                value={cardDraft.publicationPlan.proposedTitle}
                                onChange={(event) =>
                                  updatePublicationPlanField('proposedTitle', event.target.value)
                                }
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-bold">Quote excerpt</label>
                              <textarea
                                value={cardDraft.publicationPlan.quoteExcerpt}
                                onChange={(event) =>
                                  updatePublicationPlanField('quoteExcerpt', event.target.value)
                                }
                                className="min-h-[88px] w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-bold">Summary</label>
                              <textarea
                                value={cardDraft.publicationPlan.summary}
                                onChange={(event) =>
                                  updatePublicationPlanField('summary', event.target.value)
                                }
                                className="min-h-[100px] w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold">Story type</label>
                              <input
                                value={cardDraft.publicationPlan.storyType}
                                onChange={(event) =>
                                  updatePublicationPlanField('storyType', event.target.value)
                                }
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold">Themes</label>
                              <input
                                value={cardDraft.publicationPlan.themes.join(', ')}
                                onChange={(event) =>
                                  updatePublicationPlanField(
                                    'themes',
                                    event.target.value
                                      .split(',')
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                  )
                                }
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold">Source href</label>
                              <input
                                value={cardDraft.publicationPlan.sourceHref}
                                onChange={(event) =>
                                  updatePublicationPlanField('sourceHref', event.target.value)
                                }
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold">Destination href</label>
                              <input
                                value={cardDraft.publicationPlan.destinationHref}
                                onChange={(event) =>
                                  updatePublicationPlanField('destinationHref', event.target.value)
                                }
                                className="w-full border border-black px-3 py-2"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-bold">Blocker</label>
                              <textarea
                                value={cardDraft.publicationPlan.blocker || ''}
                                onChange={(event) =>
                                  updatePublicationPlanField('blocker', event.target.value)
                                }
                                className="min-h-[88px] w-full border border-black px-3 py-2"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-[#6B625B]">
                            Add a publication plan when a card should turn into a first-class EL story.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {'imageSrc' in cardDraft.front ? (
                        <div className="border border-black bg-[#F7F3EC] p-4">
                          <div className="mb-3 flex items-center gap-2 font-bold text-[#0A0A0A]">
                            <ImageIcon className="h-4 w-4" />
                            Front image preview
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cardDraft.front.imageSrc}
                            alt={cardDraft.front.imageAlt}
                            className="mb-3 h-56 w-full border border-black object-cover"
                          />
                          <p className="mb-0 text-xs text-[#6B625B]">
                            Use a local route like <code>/images/…</code> or apply a selected EL media
                            asset below.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-black bg-[#F7F3EC] p-4 text-sm text-[#6B625B]">
                          This is a voice-led front. Keep it text-first unless you decide to convert it to a
                          photo card.
                        </div>
                      )}

                      <div className="border border-black p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#0A0A0A]">EL source picker</p>
                            <p className="text-sm text-[#6B625B]">
                              Pull approved people, stories, and media into the current postcard.
                            </p>
                          </div>
                          <input
                            value={libraryQuery}
                            onChange={(event) => setLibraryQuery(event.target.value)}
                            placeholder="Filter profiles, stories, media…"
                            className="w-full border border-black px-3 py-2 md:max-w-[220px]"
                          />
                        </div>

                        {libraryError ? (
                          <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                            {libraryError}
                          </div>
                        ) : null}

                        <div className="space-y-5">
                          <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-[#0A0A0A]">Storytellers</p>
                              <span className="text-xs text-[#6B625B]">
                                {libraryLoading ? 'Loading…' : `${filteredProfiles.length} visible`}
                              </span>
                            </div>
                            <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                              {filteredProfiles.map((profile) => (
                                <div key={profile.id} className="border border-black/10 p-3">
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-bold text-[#0A0A0A]">{profile.displayName}</p>
                                      <p className="text-xs text-[#6B625B]">
                                        {profile.location || 'No location'} · {profile.storyCount} stories
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => applyProfileToCard(profile)}
                                      className="border border-black px-3 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
                                    >
                                      Use person
                                    </button>
                                  </div>
                                  <p className="break-all text-[11px] text-[#8B8178]">{profile.id}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-[#0A0A0A]">Stories</p>
                              <span className="text-xs text-[#6B625B]">
                                {libraryLoading ? 'Loading…' : `${filteredStories.length} visible`}
                              </span>
                            </div>
                            <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                              {filteredStories.map((story) => (
                                <div key={story.id} className="border border-black/10 p-3">
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-bold text-[#0A0A0A]">{story.title}</p>
                                      <p className="text-xs text-[#6B625B]">
                                        {story.storytellerName || 'No storyteller attached'}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => applyStoryToCard(story)}
                                      className="border border-black px-3 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#F7F3EC]"
                                    >
                                      Use quote
                                    </button>
                                  </div>
                                  <p className="mb-2 line-clamp-3 text-sm leading-relaxed text-[#4F463F]">
                                    {story.excerpt || 'No public excerpt available.'}
                                  </p>
                                  <p className="break-all text-[11px] text-[#8B8178]">{story.id}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-[#0A0A0A]">Media</p>
                              <span className="text-xs text-[#6B625B]">
                                {libraryLoading ? 'Loading…' : `${mediaAssets.length} loaded`}
                              </span>
                            </div>

                            <div className="mb-3 flex flex-wrap gap-2">
                              <input
                                value={mediaSearch}
                                onChange={(event) => setMediaSearch(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    setMediaOffset(0);
                                    void loadMedia({ search: mediaSearch, galleryId: mediaGalleryId });
                                  }
                                }}
                                placeholder="Search photos…"
                                className="min-w-0 flex-1 border border-black px-3 py-2 text-sm"
                              />
                              <select
                                value={mediaGalleryId}
                                onChange={(event) => {
                                  setMediaGalleryId(event.target.value);
                                  setMediaOffset(0);
                                  void loadMedia({ search: mediaSearch, galleryId: event.target.value });
                                }}
                                className="border border-black px-3 py-2 text-sm"
                              >
                                <option value="">All galleries</option>
                                {mediaGalleries.map((gallery) => (
                                  <option key={gallery.id} value={gallery.id}>
                                    {gallery.title} ({gallery.mediaCount})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaOffset(0);
                                  void loadMedia({ search: mediaSearch, galleryId: mediaGalleryId });
                                }}
                                className="border border-black px-3 py-2 text-xs font-bold hover:bg-[#F7F3EC]"
                              >
                                Search
                              </button>
                            </div>

                            <div className="max-h-[480px] overflow-y-auto pr-1">
                              <div className="grid grid-cols-3 gap-2">
                                {mediaAssets.map((asset) => (
                                  <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => applyMediaToCard(asset)}
                                    disabled={cardDraft.front.kind !== 'photo'}
                                    className="group relative aspect-square overflow-hidden border border-black/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    title={asset.title || asset.altText || 'EL media'}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={asset.thumbnailUrl || asset.url}
                                      alt={asset.altText || asset.title || 'Empathy Ledger media'}
                                      className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-disabled:hidden">
                                      <div className="w-full p-2">
                                        <p className="truncate text-[10px] font-bold text-white">
                                          {asset.title || 'Untitled'}
                                        </p>
                                        <p className="text-[10px] text-white/80">Use on front</p>
                                      </div>
                                    </div>
                                    {asset.culturalSensitivity ? (
                                      <span className="absolute right-1 top-1 bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                        {asset.culturalSensitivity}
                                      </span>
                                    ) : null}
                                  </button>
                                ))}
                              </div>
                              {mediaAssets.length > 0 && mediaAssets.length >= 60 ? (
                                <button
                                  type="button"
                                  onClick={() => void loadMedia({ search: mediaSearch, galleryId: mediaGalleryId, offset: mediaOffset, append: true })}
                                  disabled={mediaLoadingMore}
                                  className="mt-3 w-full border border-black py-2 text-sm font-bold hover:bg-[#F7F3EC] disabled:opacity-60"
                                >
                                  {mediaLoadingMore ? 'Loading…' : 'Load more photos'}
                                </button>
                              ) : null}
                              {mediaAssets.length === 0 && !libraryLoading ? (
                                <p className="py-6 text-center text-sm text-[#6B625B]">No photos found.</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
