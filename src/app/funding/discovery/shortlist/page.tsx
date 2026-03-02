'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, Link2, RefreshCw } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { FundingDiscoveryPipelineHandoff } from '@/components/funding/funding-discovery-pipeline-handoff';
import {
  FundingDiscoveryShortlistButton,
  getFundingDiscoveryShortlistIds,
  setFundingDiscoveryShortlistIds,
} from '@/components/funding/funding-discovery-shortlist';

interface ShortlistOrganizationDetail {
  id: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug?: string | null;
    type?: string | null;
    state?: string | null;
    city?: string | null;
    description?: string | null;
  } | null;
  capabilityTags: string[];
  serviceGeographies: string[];
  firstNationsLed: boolean;
  livedExperienceLed: boolean;
  fundingReadinessScore: number;
  complianceReadinessScore: number;
  deliveryConfidenceScore: number;
  communityTrustScore: number;
  reportingToCommunityScore: number;
  canManageGovernmentContracts: boolean;
  topMatches: Array<{
    id: string;
    recommendationId: string;
    matchScore: number;
    status: string;
    readinessScore: number;
    communityAlignmentScore: number;
    geographicFitScore: number;
    opportunity?: {
      id: string;
      name?: string | null;
      funder_name?: string | null;
      deadline?: string | null;
      max_grant_amount?: number | null;
    } | null;
  }>;
  recentAwards: Array<{
    id: string;
    status: string;
    awardAmount: number;
    amountDisbursed: number;
    communityReportDueAt?: string | null;
    fundingProgram?: {
      id: string;
      title?: string | null;
    } | null;
    fundingSource?: {
      id: string;
      name?: string | null;
      source_kind?: string | null;
    } | null;
  }>;
}

const SHORTLIST_NOTES_STORAGE_KEY = 'funding-discovery-shortlist-notes';
const SHORTLIST_ACTIVITY_STORAGE_KEY = 'funding-discovery-shortlist-activity';
const SHORTLIST_DECISION_STORAGE_KEY = 'funding-discovery-shortlist-decisions';
const STALE_SHORTLIST_HOURS = 72;

type ShortlistDecisionTag = 'advance' | 'hold' | 'needs_review';

interface ShortlistActivityEntry {
  id: string;
  timestamp: string;
  type:
    | 'share_link_copied'
    | 'shared_shortlist_adopted'
    | 'candidate_touched'
    | 'compare_added'
    | 'compare_removed'
    | 'compare_cleared'
    | 'note_created'
    | 'note_cleared'
    | 'decision_tag_set'
    | 'decision_tag_cleared'
    | 'pipeline_sent'
    | 'conversation_tracked'
    | 'conversation_requested';
  organizationId?: string;
  organizationName?: string;
  detail: string;
}

interface SharedShortlistWorkspaceEntry {
  organizationId: string;
  note?: string | null;
  decisionTag?: ShortlistDecisionTag | null;
  activityLog?: ShortlistActivityEntry[];
  lastReviewedAt?: string | null;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isSameLocalDay(value?: string | null, compareTo: Date = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === compareTo.getFullYear() &&
    date.getMonth() === compareTo.getMonth() &&
    date.getDate() === compareTo.getDate()
  );
}

function formatReviewTime(value?: string | null) {
  if (!value) return 'today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'today';

  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function hoursSinceTimestamp(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60)));
}

function isStaleShortlistCandidate(lastTouchedAt?: string | null) {
  const hours = hoursSinceTimestamp(lastTouchedAt);
  if (hours === null) {
    return true;
  }

  return hours >= STALE_SHORTLIST_HOURS;
}

function staleShortlistLabel(lastTouchedAt?: string | null) {
  const hours = hoursSinceTimestamp(lastTouchedAt);
  if (hours === null) {
    return `No recorded shortlist activity in the last ${STALE_SHORTLIST_HOURS}h.`;
  }

  if (hours < STALE_SHORTLIST_HOURS) {
    return null;
  }

  if (hours >= 24) {
    return `No shortlist activity for ${Math.floor(hours / 24)}d.`;
  }

  return `No shortlist activity for ${hours}h.`;
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreClass(score: number) {
  if (score >= 85) return 'bg-emerald-100 text-emerald-800';
  if (score >= 70) return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

function decisionTagConfig(tag?: ShortlistDecisionTag | null) {
  switch (tag) {
    case 'advance':
      return {
        label: 'Advance',
        className: 'bg-emerald-100 text-emerald-800',
      };
    case 'hold':
      return {
        label: 'Hold',
        className: 'bg-amber-100 text-amber-800',
      };
    case 'needs_review':
      return {
        label: 'Needs Review',
        className: 'bg-rose-100 text-rose-800',
      };
    default:
      return null;
  }
}

function strongestFitReason(match?: ShortlistOrganizationDetail['topMatches'][number]) {
  if (!match) {
    return 'No current fit signal yet.';
  }

  const dimensions = [
    {
      key: 'readiness',
      label: 'delivery and funding readiness',
      score: match.readinessScore,
    },
    {
      key: 'alignment',
      label: 'community alignment',
      score: match.communityAlignmentScore,
    },
    {
      key: 'geography',
      label: 'geographic fit',
      score: match.geographicFitScore,
    },
  ].sort((left, right) => right.score - left.score);

  const primary = dimensions[0];
  const secondary = dimensions[1];

  if (primary.score < 60) {
    return 'Current fit signal is weak and needs closer review.';
  }

  if (secondary.score >= 75) {
    return `Strongest because of ${primary.label} backed by ${secondary.label}.`;
  }

  return `Strongest because of ${primary.label}.`;
}

function compareRecommendationScore(item: ShortlistOrganizationDetail) {
  const topMatchScore = item.topMatches[0]?.matchScore || 0;
  return Math.round(
    topMatchScore * 0.5 +
      item.communityTrustScore * 0.3 +
      item.fundingReadinessScore * 0.2
  );
}

function compareRecommendationReason(item: ShortlistOrganizationDetail) {
  const topMatch = item.topMatches[0];
  const matchScore = topMatch?.matchScore || 0;

  if (matchScore >= 85 && item.communityTrustScore >= 80) {
    return 'Best balance of current fit strength and community trust.';
  }

  if (item.communityTrustScore >= item.fundingReadinessScore && item.communityTrustScore >= matchScore) {
    return 'Leads on community trust, which reduces downstream delivery risk.';
  }

  if (item.fundingReadinessScore >= matchScore) {
    return 'Leads on operational readiness, which lowers activation friction.';
  }

  return 'Leads on immediate fit against the current opportunity set.';
}

function compareCautionReason(item: ShortlistOrganizationDetail) {
  const topMatch = item.topMatches[0];
  const matchScore = topMatch?.matchScore || 0;

  if (matchScore < 80) {
    return null;
  }

  const concerns: string[] = [];

  if (item.communityTrustScore < 65) {
    concerns.push('community trust is still comparatively weak');
  }

  if (item.fundingReadinessScore < 65) {
    concerns.push('funding readiness still needs work');
  }

  if (item.deliveryConfidenceScore < 65) {
    concerns.push('delivery confidence is not yet strong');
  }

  if (concerns.length === 0) {
    return null;
  }

  if (concerns.length === 1) {
    return `Caution: fit is strong, but ${concerns[0]}.`;
  }

  if (concerns.length === 2) {
    return `Caution: fit is strong, but ${concerns[0]} and ${concerns[1]}.`;
  }

  return `Caution: fit is strong, but ${concerns[0]}, ${concerns[1]}, and ${concerns[2]}.`;
}

function parseSharedShortlistIds(rawValue: string | null) {
  if (!rawValue) {
    return [];
  }

  return Array.from(
    new Set(
      rawValue
        .split(',')
        .map((item) => decodeURIComponent(item).trim())
        .filter(Boolean)
    )
  );
}

function parseSharedShortlistNotes(rawValue: string | null) {
  if (!rawValue) {
    return {} as Record<string, string>;
  }

  try {
    return normalizeShortlistNotes(JSON.parse(rawValue));
  } catch {
    return {} as Record<string, string>;
  }
}

function normalizeShortlistNotes(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, string>;
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (accumulator, [key, noteValue]) => {
      const normalizedKey = String(key || '').trim();
      const normalizedValue = String(noteValue || '').trim();

      if (normalizedKey && normalizedValue) {
        accumulator[normalizedKey] = normalizedValue;
      }

      return accumulator;
    },
    {}
  );
}

function getLocalShortlistNotes() {
  try {
    const rawValue = window.localStorage.getItem(SHORTLIST_NOTES_STORAGE_KEY);
    return normalizeShortlistNotes(rawValue ? JSON.parse(rawValue) : {});
  } catch {
    return {} as Record<string, string>;
  }
}

function setLocalShortlistNotes(notes: Record<string, string>) {
  window.localStorage.setItem(
    SHORTLIST_NOTES_STORAGE_KEY,
    JSON.stringify(normalizeShortlistNotes(notes))
  );
}

function normalizeShortlistDecisions(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, ShortlistDecisionTag>;
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, ShortlistDecisionTag>
  >((accumulator, [key, tagValue]) => {
    const normalizedKey = String(key || '').trim();
    const normalizedValue = String(tagValue || '').trim() as ShortlistDecisionTag;

    if (
      normalizedKey &&
      (normalizedValue === 'advance' ||
        normalizedValue === 'hold' ||
        normalizedValue === 'needs_review')
    ) {
      accumulator[normalizedKey] = normalizedValue;
    }

    return accumulator;
  }, {});
}

function getLocalShortlistDecisions() {
  try {
    const rawValue = window.localStorage.getItem(SHORTLIST_DECISION_STORAGE_KEY);
    return normalizeShortlistDecisions(rawValue ? JSON.parse(rawValue) : {});
  } catch {
    return {} as Record<string, ShortlistDecisionTag>;
  }
}

function setLocalShortlistDecisions(decisions: Record<string, ShortlistDecisionTag>) {
  window.localStorage.setItem(
    SHORTLIST_DECISION_STORAGE_KEY,
    JSON.stringify(normalizeShortlistDecisions(decisions))
  );
}

function normalizeShortlistActivity(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ShortlistActivityEntry[];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const entry = item as Record<string, unknown>;
      const id = String(entry.id || '').trim();
      const timestamp = String(entry.timestamp || '').trim();
      const detail = String(entry.detail || '').trim();
      const type = String(entry.type || '').trim() as ShortlistActivityEntry['type'];

      if (!id || !timestamp || !detail || !type) {
        return null;
      }

      return {
        id,
        timestamp,
        type,
        detail,
        organizationId: entry.organizationId
          ? String(entry.organizationId).trim()
          : undefined,
        organizationName: entry.organizationName
          ? String(entry.organizationName).trim()
          : undefined,
      } satisfies ShortlistActivityEntry;
    })
    .filter(Boolean) as ShortlistActivityEntry[];
}

function getLocalShortlistActivity() {
  try {
    const rawValue = window.localStorage.getItem(SHORTLIST_ACTIVITY_STORAGE_KEY);
    return normalizeShortlistActivity(rawValue ? JSON.parse(rawValue) : []);
  } catch {
    return [] as ShortlistActivityEntry[];
  }
}

function setLocalShortlistActivity(entries: ShortlistActivityEntry[]) {
  window.localStorage.setItem(
    SHORTLIST_ACTIVITY_STORAGE_KEY,
    JSON.stringify(entries.slice(0, 20))
  );
}

function mergeShortlistActivityEntries(
  current: ShortlistActivityEntry[],
  incoming: ShortlistActivityEntry[]
) {
  const merged = new Map<string, ShortlistActivityEntry>();

  [...current, ...incoming].forEach((entry) => {
    if (!entry?.id) {
      return;
    }
    merged.set(entry.id, entry);
  });

  return Array.from(merged.values())
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )
    .slice(0, 20);
}

function activityCategory(type: ShortlistActivityEntry['type']) {
  switch (type) {
    case 'share_link_copied':
    case 'shared_shortlist_adopted':
      return 'share';
    case 'compare_added':
    case 'compare_removed':
    case 'compare_cleared':
      return 'compare';
    case 'note_created':
    case 'note_cleared':
    case 'candidate_touched':
    case 'decision_tag_set':
    case 'decision_tag_cleared':
      return 'decision';
    case 'pipeline_sent':
    case 'conversation_tracked':
    case 'conversation_requested':
      return 'pipeline';
    default:
      return 'all';
  }
}

export default function FundingDiscoveryShortlistPage() {
  const [items, setItems] = useState<ShortlistOrganizationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareFocusMode, setCompareFocusMode] = useState<'all' | 'recommended'>('all');
  const [notesByOrganizationId, setNotesByOrganizationId] = useState<Record<string, string>>({});
  const [decisionsByOrganizationId, setDecisionsByOrganizationId] = useState<
    Record<string, ShortlistDecisionTag>
  >({});
  const [decisionFilter, setDecisionFilter] = useState<
    'all' | 'untagged' | ShortlistDecisionTag
  >('all');
  const [staleOnly, setStaleOnly] = useState(false);
  const [activityFilter, setActivityFilter] = useState<
    'all' | 'share' | 'compare' | 'decision' | 'pipeline'
  >('all');
  const [activityLog, setActivityLog] = useState<ShortlistActivityEntry[]>([]);
  const [activeShortlistIds, setActiveShortlistIds] = useState<string[]>([]);
  const [isSharedView, setIsSharedView] = useState(false);
  const [copyingShareLink, setCopyingShareLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [sharedShortlistConnected, setSharedShortlistConnected] = useState(false);
  const hasHydratedSharedShortlistRef = useRef(false);

  const syncWorkspaceMutation = async (
    payload: {
      organizationId: string;
      note?: string | null;
      decisionTag?: ShortlistDecisionTag | null;
      activity?: ShortlistActivityEntry;
    },
    suppressError = true
  ) => {
    try {
      const response = await fetch('/api/admin/funding/os/discovery-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to sync shared review workspace');
      }
    } catch (syncError) {
      if (!suppressError) {
        setError(
          syncError instanceof Error
            ? syncError.message
            : 'Failed to sync shared review workspace'
        );
      }
    }
  };

  const loadSharedWorkspace = async (organizationIds: string[]) => {
    const normalizedIds = organizationIds.map((id) => String(id).trim()).filter(Boolean);
    if (normalizedIds.length === 0) {
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set('organizationIds', normalizedIds.join(','));
      const response = await fetch(
        `/api/admin/funding/os/discovery-workspace?${params.toString()}`
      );

      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => ({}));
      const data = Array.isArray(payload.data)
        ? (payload.data as SharedShortlistWorkspaceEntry[])
        : [];

      const nextNotes = data.reduce<Record<string, string>>((accumulator, entry) => {
        const note = String(entry.note || '').trim();
        if (entry.organizationId && note) {
          accumulator[entry.organizationId] = note;
        }
        return accumulator;
      }, {});

      const nextDecisions = data.reduce<Record<string, ShortlistDecisionTag>>(
        (accumulator, entry) => {
          if (
            entry.organizationId &&
            (entry.decisionTag === 'advance' ||
              entry.decisionTag === 'hold' ||
              entry.decisionTag === 'needs_review')
          ) {
            accumulator[entry.organizationId] = entry.decisionTag;
          }
          return accumulator;
        },
        {}
      );

      const sharedActivity = data.flatMap((entry) =>
        Array.isArray(entry.activityLog) ? entry.activityLog : []
      );

      setNotesByOrganizationId((current) => {
        const preserved = { ...current };
        normalizedIds.forEach((organizationId) => {
          delete preserved[organizationId];
        });
        return {
          ...preserved,
          ...nextNotes,
        };
      });

      setDecisionsByOrganizationId((current) => {
        const preserved = { ...current };
        normalizedIds.forEach((organizationId) => {
          delete preserved[organizationId];
        });
        return {
          ...preserved,
          ...nextDecisions,
        };
      });

      setActivityLog((current) => mergeShortlistActivityEntries(current, sharedActivity));
    } catch {
      // Best-effort only; local shortlist review stays usable without shared sync.
    }
  };

  const syncSharedShortlist = async (organizationIds: string[], suppressError = true) => {
    try {
      const response = await fetch('/api/admin/funding/os/shared-shortlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationIds,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to sync shared shortlist');
      }

      setSharedShortlistConnected(true);
    } catch (syncError) {
      if (!suppressError) {
        setError(
          syncError instanceof Error ? syncError.message : 'Failed to sync shared shortlist'
        );
      }
    }
  };

  const hydrateSharedShortlist = async (fallbackIds: string[]) => {
    if (hasHydratedSharedShortlistRef.current || isSharedView) {
      return;
    }

    hasHydratedSharedShortlistRef.current = true;

    try {
      const response = await fetch('/api/admin/funding/os/shared-shortlist');
      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => ({}));
      const organizationIds = Array.isArray(payload.organizationIds)
        ? payload.organizationIds
            .map((value: unknown) => String(value || '').trim())
            .filter(Boolean)
        : [];

      setSharedShortlistConnected(true);

      if (organizationIds.length === 0) {
        if (fallbackIds.length > 0) {
          void syncSharedShortlist(fallbackIds, true);
        }
        return;
      }

      setFundingDiscoveryShortlistIds(organizationIds);
    } catch {
      // Best-effort only; local shortlist remains usable without shared sync.
    }
  };

  const fetchShortlist = async (background = false, idsOverride?: string[]) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const shortlistIds =
      idsOverride && idsOverride.length > 0 ? idsOverride : activeShortlistIds;
    if (shortlistIds.length === 0) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const responses = await Promise.all(
        shortlistIds.map(async (organizationId) => {
          const response = await fetch(`/api/funding/discovery/${organizationId}`);
          const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(payload.error || 'Failed to load shortlisted organization');
          }

          return payload.data as ShortlistOrganizationDetail;
        })
      );

      setItems(responses);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : 'Failed to load shortlist'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const appendActivity = (
    entry: Omit<ShortlistActivityEntry, 'id' | 'timestamp'>
  ) => {
    const nextEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    } satisfies ShortlistActivityEntry;

    setActivityLog((current) => {
      const nextEntries = [nextEntry, ...current].slice(0, 20);

      setLocalShortlistActivity(nextEntries);
      return nextEntries;
    });

    if (!isSharedView && nextEntry.organizationId) {
      void syncWorkspaceMutation(
        {
          organizationId: nextEntry.organizationId,
          activity: nextEntry,
        },
        true
      );
    }
  };

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const sharedIds = parseSharedShortlistIds(params.get('ids'));
      const sharedNotes = parseSharedShortlistNotes(params.get('notes'));
      const nextIds = sharedIds.length > 0 ? sharedIds : getFundingDiscoveryShortlistIds();

      setIsSharedView(sharedIds.length > 0);
      setNotesByOrganizationId(sharedIds.length > 0 ? sharedNotes : getLocalShortlistNotes());
      setDecisionsByOrganizationId(getLocalShortlistDecisions());
      setActivityLog(getLocalShortlistActivity());
      setActiveShortlistIds(nextIds);
      fetchShortlist(false, nextIds);

      if (sharedIds.length === 0) {
        void hydrateSharedShortlist(nextIds);
      }
    };

    sync();
    window.addEventListener('funding-discovery-shortlist-updated', sync);
    window.addEventListener('storage', sync);
    window.addEventListener('popstate', sync);

    return () => {
      window.removeEventListener('funding-discovery-shortlist-updated', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  useEffect(() => {
    if (isSharedView) {
      return;
    }

    const syncNotes = () => {
      setNotesByOrganizationId(getLocalShortlistNotes());
      setDecisionsByOrganizationId(getLocalShortlistDecisions());
      setActivityLog(getLocalShortlistActivity());
    };

    syncNotes();
    window.addEventListener('storage', syncNotes);

    return () => {
      window.removeEventListener('storage', syncNotes);
    };
  }, [isSharedView]);

  useEffect(() => {
    if (isSharedView || activeShortlistIds.length === 0) {
      return;
    }

    void loadSharedWorkspace(activeShortlistIds);
  }, [activeShortlistIds, isSharedView]);

  useEffect(() => {
    if (isSharedView || !hasHydratedSharedShortlistRef.current) {
      return;
    }

    void syncSharedShortlist(activeShortlistIds, true);
  }, [activeShortlistIds, isSharedView]);

  useEffect(() => {
    if (!copiedShareLink) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedShareLink(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedShareLink]);

  useEffect(() => {
    setCompareIds((current) =>
      current.filter((organizationId) =>
        items.some((item) => item.organizationId === organizationId)
      )
    );
  }, [items]);

  const organizationLastTouchedAt = useMemo(() => {
    return activityLog.reduce<Record<string, string>>((accumulator, entry) => {
      if (!entry.organizationId) {
        return accumulator;
      }

      const currentValue = accumulator[entry.organizationId];
      if (!currentValue || new Date(entry.timestamp).getTime() > new Date(currentValue).getTime()) {
        accumulator[entry.organizationId] = entry.timestamp;
      }

      return accumulator;
    }, {});
  }, [activityLog]);

  const organizationLastReviewTouchAt = useMemo(() => {
    return activityLog.reduce<Record<string, string>>((accumulator, entry) => {
      if (entry.type !== 'candidate_touched' || !entry.organizationId) {
        return accumulator;
      }

      const currentValue = accumulator[entry.organizationId];
      if (!currentValue || new Date(entry.timestamp).getTime() > new Date(currentValue).getTime()) {
        accumulator[entry.organizationId] = entry.timestamp;
      }

      return accumulator;
    }, {});
  }, [activityLog]);

  const staleOrganizationIds = useMemo(
    () =>
      new Set(
        items
          .filter((item) =>
            isStaleShortlistCandidate(organizationLastTouchedAt[item.organizationId])
          )
          .map((item) => item.organizationId)
      ),
    [items, organizationLastTouchedAt]
  );

  const summary = useMemo(() => {
    const strongMatches = items.filter(
      (item) => (item.topMatches[0]?.matchScore || 0) >= 80
    ).length;
    const govReady = items.filter((item) => item.canManageGovernmentContracts).length;
    const needsReviewItems = items.filter(
      (item) => decisionsByOrganizationId[item.organizationId] === 'needs_review'
    );
    const avgTrust =
      items.length > 0
        ? Math.round(
            items.reduce((sum, item) => sum + item.communityTrustScore, 0) / items.length
          )
        : 0;

    return {
      total: items.length,
      strongMatches,
      govReady,
      avgTrust,
      noted:
        items.filter((item) => {
          const note = notesByOrganizationId[item.organizationId];
          return Boolean(String(note || '').trim());
        }).length,
      advance:
        items.filter((item) => decisionsByOrganizationId[item.organizationId] === 'advance')
          .length,
      hold:
        items.filter((item) => decisionsByOrganizationId[item.organizationId] === 'hold')
          .length,
      needsReview: needsReviewItems.length,
      needsReviewStale: needsReviewItems.filter((item) =>
        staleOrganizationIds.has(item.organizationId)
      ).length,
      needsReviewFresh: needsReviewItems.filter(
        (item) => !staleOrganizationIds.has(item.organizationId)
      ).length,
      stale:
        items.filter((item) => staleOrganizationIds.has(item.organizationId)).length,
    };
  }, [items, notesByOrganizationId, decisionsByOrganizationId, staleOrganizationIds]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || activeShortlistIds.length === 0) {
      return '';
    }

    const params = new URLSearchParams();
    params.set('ids', activeShortlistIds.join(','));
    const shareNotes = activeShortlistIds.reduce<Record<string, string>>((accumulator, organizationId) => {
      const note = String(notesByOrganizationId[organizationId] || '').trim();
      if (note) {
        accumulator[organizationId] = note;
      }
      return accumulator;
    }, {});

    if (Object.keys(shareNotes).length > 0) {
      params.set('notes', JSON.stringify(shareNotes));
    }

    return `${window.location.origin}/funding/discovery/shortlist?${params.toString()}`;
  }, [activeShortlistIds, notesByOrganizationId]);

  const visibleItems = useMemo(() => {
    const decisionScopedItems = (() => {
      if (decisionFilter === 'all') {
        return items;
      }

      if (decisionFilter === 'untagged') {
        return items.filter((item) => !decisionsByOrganizationId[item.organizationId]);
      }

      return items.filter(
        (item) => decisionsByOrganizationId[item.organizationId] === decisionFilter
      );
    })();

    if (!staleOnly) {
      return decisionScopedItems;
    }

    return decisionScopedItems.filter((item) =>
      staleOrganizationIds.has(item.organizationId)
    );
  }, [decisionFilter, decisionsByOrganizationId, items, staleOnly, staleOrganizationIds]);

  const touchCandidate = (item: ShortlistOrganizationDetail) => {
    appendActivity({
      type: 'candidate_touched',
      organizationId: item.organizationId,
      organizationName: item.organization?.name || undefined,
      detail: `Touched ${item.organization?.name || 'organization'} after review to keep the candidate active.`,
    });
  };

  const applyDecisionFilter = (value: 'all' | 'untagged' | ShortlistDecisionTag) => {
    setDecisionFilter(value);
    setStaleOnly(false);
  };

  const applyNeedsReviewStaleFocus = () => {
    setDecisionFilter('needs_review');
    setStaleOnly(true);
  };

  const applyDefaultQueueView = () => {
    setDecisionFilter('all');
    setStaleOnly(false);
  };

  const activeQueuePreset = useMemo(() => {
    if (decisionFilter === 'all' && !staleOnly) {
      return 'default';
    }

    if (decisionFilter === 'needs_review' && staleOnly) {
      return 'needs_review_stale';
    }

    return null;
  }, [decisionFilter, staleOnly]);

  const compareItems = useMemo(
    () =>
      compareIds
        .map((organizationId) =>
          visibleItems.find((item) => item.organizationId === organizationId) || null
        )
        .filter(Boolean) as ShortlistOrganizationDetail[],
    [compareIds, visibleItems]
  );

  const recommendedCompareOrganizationId = useMemo(() => {
    if (compareItems.length < 2) {
      return null;
    }

    return compareItems
      .map((item) => ({
        organizationId: item.organizationId,
        recommendationScore: compareRecommendationScore(item),
      }))
      .sort((left, right) => right.recommendationScore - left.recommendationScore)[0]
      ?.organizationId || null;
  }, [compareItems]);

  const recommendedCompareItem = useMemo(
    () =>
      recommendedCompareOrganizationId
        ? compareItems.find((item) => item.organizationId === recommendedCompareOrganizationId) ||
          null
        : null,
    [compareItems, recommendedCompareOrganizationId]
  );

  const compareDisplayItems = useMemo(() => {
    if (compareFocusMode !== 'recommended' || !recommendedCompareOrganizationId) {
      return compareItems;
    }

    return compareItems.filter((item) => {
      if (item.organizationId === recommendedCompareOrganizationId) {
        return true;
      }

      return Boolean(compareCautionReason(item));
    });
  }, [compareFocusMode, compareItems, recommendedCompareOrganizationId]);

  const visibleActivityLog = useMemo(() => {
    if (activityFilter === 'all') {
      return activityLog;
    }

    return activityLog.filter((entry) => activityCategory(entry.type) === activityFilter);
  }, [activityFilter, activityLog]);

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/funding/discovery"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Discovery
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Funder Shortlist</h1>
                  <p className="text-base text-gray-600">
                    Hold a live working set of community organizations while you compare fit, trust, and current funding context.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isSharedView && sharedShortlistConnected && (
                <div className="inline-flex items-center gap-2 px-4 py-3 bg-[#ecfdf5] border-2 border-black text-sm font-black text-[#115e59]">
                  Shared shortlist synced
                </div>
              )}
              {activeShortlistIds.length > 0 && (
                <>
                  <button
                    type="button"
                  onClick={async () => {
                      if (!shareUrl) return;

                      try {
                        setCopyingShareLink(true);
                        await navigator.clipboard.writeText(shareUrl);
                        setCopiedShareLink(true);
                        appendActivity({
                          type: 'share_link_copied',
                          detail: `Copied a shared shortlist link for ${activeShortlistIds.length} organization${activeShortlistIds.length === 1 ? '' : 's'}.`,
                        });
                      } catch {
                        setError('Failed to copy share link');
                      } finally {
                        setCopyingShareLink(false);
                      }
                    }}
                    disabled={copyingShareLink}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <Link2 className="w-4 h-4" />
                    {copyingShareLink ? 'Copying…' : copiedShareLink ? 'Copied' : 'Copy Share Link'}
                  </button>
                  <Link
                    href={shareUrl}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors"
                  >
                    <Link2 className="w-4 h-4" />
                    Open Share Link
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => fetchShortlist(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Shortlist
              </button>
            </div>
          </div>

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          {isSharedView && (
            <div className="border-2 border-[#0f766e] bg-[#ecfdf5] text-[#115e59] p-4 mb-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black">Shared shortlist view</div>
                  <div className="text-xs">
                    This link is showing {activeShortlistIds.length} shared organization
                    {activeShortlistIds.length === 1 ? '' : 's'} from the sender’s shortlist.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFundingDiscoveryShortlistIds(activeShortlistIds);
                    setLocalShortlistNotes(notesByOrganizationId);
                    window.history.replaceState({}, '', '/funding/discovery/shortlist');
                    setIsSharedView(false);
                    setActiveShortlistIds(activeShortlistIds);
                    appendActivity({
                      type: 'shared_shortlist_adopted',
                      detail: `Adopted a shared shortlist with ${activeShortlistIds.length} organization${activeShortlistIds.length === 1 ? '' : 's'}.`,
                    });
                    fetchShortlist(true, activeShortlistIds);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black text-sm font-black hover:bg-gray-100 transition-colors"
                >
                  Use This Shortlist
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Shortlisted</div>
              <div className="text-4xl font-black text-black">{summary.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Strong Lead Set</div>
              <div className="text-4xl font-black text-emerald-700">{summary.strongMatches}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Gov Ready</div>
              <div className="text-4xl font-black text-[#0f766e]">{summary.govReady}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Average Trust</div>
              <div className="text-4xl font-black text-blue-700">{summary.avgTrust}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Stale Candidates</div>
              <div className="text-4xl font-black text-[#b45309]">{summary.stale}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Review Queue</div>
              <div className="text-4xl font-black text-rose-700">
                {summary.needsReviewStale}
              </div>
              <div className="text-[11px] font-bold text-gray-500 mt-2">
                Needs review and stale
              </div>
              <button
                type="button"
                onClick={applyNeedsReviewStaleFocus}
                disabled={summary.needsReviewStale === 0}
                className={`mt-3 inline-flex items-center gap-2 px-3 py-2 text-[11px] font-black border-2 border-black transition-colors disabled:opacity-50 ${
                  activeQueuePreset === 'needs_review_stale'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {activeQueuePreset === 'needs_review_stale'
                  ? 'Working Review Queue'
                  : 'Work Review Queue'}
              </button>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Active Review</div>
              <div className="text-4xl font-black text-[#0f766e]">
                {summary.needsReviewFresh}
              </div>
              <div className="text-[11px] font-bold text-gray-500 mt-2">
                Needs review and fresh
              </div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:col-span-2 xl:col-span-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                    Working Notes And Decisions
                  </div>
                  <div className="text-sm font-black text-black">
                    {summary.noted} shortlisted org{summary.noted === 1 ? '' : 's'} have active funder notes
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-emerald-100 text-emerald-800">
                    Advance {summary.advance}
                  </span>
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-amber-100 text-amber-800">
                    Hold {summary.hold}
                  </span>
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-rose-100 text-rose-800">
                    Needs Review {summary.needsReview}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                    Working Presets
                  </div>
                  <div className="text-sm font-black text-black">
                    Move between the default review queue and the neglected review lane quickly.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyDefaultQueueView}
                    className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                      activeQueuePreset === 'default'
                        ? 'bg-[#0f766e] text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    Default Queue
                  </button>
                  <button
                    type="button"
                    onClick={applyNeedsReviewStaleFocus}
                    disabled={summary.needsReview === 0 || summary.stale === 0}
                    className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors disabled:opacity-50 ${
                      activeQueuePreset === 'needs_review_stale'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    Needs Review + Stale
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                  Decision Queue Filter
                </div>
                <div className="text-sm font-black text-black">
                  Showing {visibleItems.length} of {items.length} shortlisted organization
                  {items.length === 1 ? '' : 's'}
                </div>
                {activeQueuePreset === 'needs_review_stale' && (
                  <div className="text-xs font-bold text-rose-700 mt-1">
                    Active preset: Needs Review + Stale
                  </div>
                )}
                {staleOnly && (
                  <div className="text-xs font-bold text-[#9a3412] mt-1">
                    Stale-only focus is active.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {activeQueuePreset !== 'needs_review_stale' &&
                  summary.needsReview > 0 &&
                  summary.stale > 0 && (
                    <button
                      type="button"
                      onClick={applyNeedsReviewStaleFocus}
                      className="px-3 py-2 text-xs font-black border-2 border-black bg-rose-100 text-rose-800 hover:opacity-90 transition-colors"
                    >
                      Needs Review + Stale
                    </button>
                  )}
                {decisionFilter !== 'advance' && summary.advance > 0 && (
                  <button
                    type="button"
                    onClick={() => applyDecisionFilter('advance')}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-emerald-100 text-emerald-800 hover:opacity-90 transition-colors"
                  >
                    Only Advance
                  </button>
                )}
                {staleOnly && (
                  <button
                    type="button"
                    onClick={() => setStaleOnly(false)}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-[#fff7ed] text-[#9a3412] hover:opacity-90 transition-colors"
                  >
                    Show All Freshness States
                  </button>
                )}
                {(
                  [
                    ['all', 'All'],
                    ['untagged', 'Untagged'],
                    ['advance', 'Advance'],
                    ['hold', 'Hold'],
                    ['needs_review', 'Needs Review'],
                  ] as Array<[typeof decisionFilter, string]>
                ).map(([value, label]) => {
                  const tagConfig =
                    value === 'all' || value === 'untagged'
                      ? null
                      : decisionTagConfig(value);

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => applyDecisionFilter(value)}
                      className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                        decisionFilter === value
                          ? tagConfig?.className || 'bg-[#0f766e] text-white'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </section>

          {activityLog.length > 0 && (
            <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
              <div className="flex flex-col gap-3 mb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                    Shortlist Activity
                  </div>
                  <h2 className="text-xl font-black text-black">
                    Recent decision actions
                  </h2>
                </div>
                <div className="flex flex-col gap-3 lg:items-end">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['all', 'All'],
                        ['share', 'Share'],
                        ['compare', 'Compare'],
                        ['decision', 'Decision'],
                        ['pipeline', 'Pipeline'],
                      ] as Array<[typeof activityFilter, string]>
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setActivityFilter(value)}
                        className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                          activityFilter === value
                            ? 'bg-[#0f766e] text-white'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Local to this browser unless you explicitly share or adopt a shortlist
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {visibleActivityLog.length === 0 ? (
                  <div className="border border-gray-200 bg-[#f8fafc] p-4 text-sm text-gray-500">
                    No shortlist activity matches the current log filter.
                  </div>
                ) : (
                  visibleActivityLog.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="border border-gray-200 bg-[#f8fafc] p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                            {activityCategory(entry.type)}
                          </span>
                          {entry.type === 'candidate_touched' && isSameLocalDay(entry.timestamp) && (
                            <span className="px-2 py-1 text-[10px] font-black border border-black bg-[#ecfdf5] text-[#115e59]">
                              Reviewed today
                            </span>
                          )}
                          <div className="text-sm font-bold text-black">{entry.detail}</div>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {formatDateTime(entry.timestamp)}
                        </div>
                      </div>
                      {(entry.organizationName || entry.organizationId) && (
                        <div className="text-[11px] text-gray-600 mt-1">
                          {entry.organizationName || entry.organizationId}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {compareItems.length > 0 && (
            <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
              <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                    Compare Shortlisted Organizations
                  </div>
                  <h2 className="text-2xl font-black text-black">
                    Side-by-side decision view
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedCompareItem && (
                    <button
                      type="button"
                      onClick={() =>
                        setCompareFocusMode((current) =>
                          current === 'recommended' ? 'all' : 'recommended'
                        )
                      }
                      className={`inline-flex items-center gap-2 px-4 py-3 border-2 border-black text-sm font-black transition-colors ${
                        compareFocusMode === 'recommended'
                          ? 'bg-[#0f766e] text-white'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {compareFocusMode === 'recommended'
                        ? 'Showing Recommended + Warnings'
                        : 'Only Recommended + Warnings'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCompareIds([]);
                      setCompareFocusMode('all');
                      appendActivity({
                        type: 'compare_cleared',
                        detail: 'Cleared the current compare set.',
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black text-sm font-black hover:bg-gray-100 transition-colors"
                  >
                    Clear Compare
                  </button>
                </div>
              </div>

              {recommendedCompareItem && (
                <div className="border-2 border-[#0f766e] bg-[#ecfdf5] p-4 mb-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-xs uppercase font-bold text-[#115e59] mb-1">
                        Recommended Next Choice
                      </div>
                      <div className="text-lg font-black text-black">
                        {recommendedCompareItem.organization?.name || 'Organization'}
                      </div>
                      <div className="text-sm text-gray-700">
                        {compareRecommendationReason(recommendedCompareItem)}
                      </div>
                      {compareCautionReason(recommendedCompareItem) && (
                        <div className="text-sm font-bold text-[#9a3412] mt-2">
                          {compareCautionReason(recommendedCompareItem)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-[11px] font-black border border-black bg-white">
                        Decision score {compareRecommendationScore(recommendedCompareItem)}
                      </span>
                      <span className={`px-2 py-1 text-[11px] font-black border border-black ${scoreClass(recommendedCompareItem.topMatches[0]?.matchScore || 0)}`}>
                        Match {recommendedCompareItem.topMatches[0]?.matchScore || 0}
                      </span>
                      <span className={`px-2 py-1 text-[11px] font-black border border-black ${scoreClass(recommendedCompareItem.communityTrustScore)}`}>
                        Trust {recommendedCompareItem.communityTrustScore}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {compareFocusMode === 'recommended' && recommendedCompareItem && (
                <div className="text-xs text-gray-600 mb-4">
                  Focus mode is showing the recommended next choice and any caution-flagged alternatives.
                  Currently visible: {compareDisplayItems.length} of {compareItems.length}.
                </div>
              )}

              <div
                className={`grid gap-4 ${
                  compareDisplayItems.length >= 4
                    ? 'xl:grid-cols-4'
                    : compareDisplayItems.length === 3
                      ? 'xl:grid-cols-3'
                      : 'xl:grid-cols-2'
                }`}
              >
                {compareDisplayItems.map((item) => {
                  const topMatch = item.topMatches[0];
                  const strongestMatchScore = topMatch?.matchScore || 0;
                  const currentDecisionTag = decisionsByOrganizationId[item.organizationId];
                  const currentDecisionConfig = decisionTagConfig(currentDecisionTag);
                  const lastTouchedAt = organizationLastTouchedAt[item.organizationId];
                  const lastReviewTouchAt =
                    organizationLastReviewTouchAt[item.organizationId];
                  const reviewedToday = isSameLocalDay(lastReviewTouchAt);
                  const isStale = staleOrganizationIds.has(item.organizationId);

                  return (
                    <div
                      key={`compare-${item.organizationId}`}
                      className={`border-2 p-4 ${
                        item.organizationId === recommendedCompareOrganizationId
                          ? 'border-[#0f766e] bg-[#f0fdf4]'
                          : 'border-black bg-[#f8fafc]'
                      }`}
                    >
                      {item.organizationId === recommendedCompareOrganizationId && (
                        <div className="inline-flex px-2 py-1 mb-3 text-[10px] font-black border border-black bg-white">
                          Recommended next choice
                        </div>
                      )}
                      {currentDecisionConfig && (
                        <div className={`inline-flex px-2 py-1 mb-3 ml-2 text-[10px] font-black border border-black ${currentDecisionConfig.className}`}>
                          {currentDecisionConfig.label}
                        </div>
                      )}
                      {reviewedToday && (
                        <div className="inline-flex px-2 py-1 mb-3 ml-2 text-[10px] font-black border border-black bg-[#ecfdf5] text-[#115e59]">
                          Reviewed today {formatReviewTime(lastReviewTouchAt)}
                        </div>
                      )}
                      {isStale && (
                        <div className="inline-flex px-2 py-1 mb-3 ml-2 text-[10px] font-black border border-black bg-[#fffbeb] text-[#b45309]">
                          Stale Candidate
                        </div>
                      )}
                      {notesByOrganizationId[item.organizationId] && (
                        <div className="border border-gray-200 bg-[#fff7ed] p-3 mb-3">
                          <div className="text-[10px] font-bold uppercase text-[#9a3412] mb-1">
                            Funder Note
                          </div>
                          <div className="text-xs text-gray-700 whitespace-pre-wrap">
                            {notesByOrganizationId[item.organizationId]}
                          </div>
                        </div>
                      )}

                      {compareCautionReason(item) && (
                        <div className="border border-[#f59e0b] bg-[#fffbeb] p-3 mb-3">
                          <div className="text-[10px] font-bold uppercase text-[#b45309] mb-1">
                            Attention Flag
                          </div>
                          <div className="text-xs text-[#92400e]">
                            {compareCautionReason(item)}
                          </div>
                        </div>
                      )}

                      {isStale && (
                        <div className="border border-[#f59e0b] bg-[#fff7ed] p-3 mb-3">
                          <div className="text-[10px] font-bold uppercase text-[#b45309] mb-1">
                            Stale Queue Signal
                          </div>
                          <div className="text-xs text-[#92400e]">
                            {staleShortlistLabel(lastTouchedAt)}
                          </div>
                          <button
                            type="button"
                            onClick={() => touchCandidate(item)}
                            className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-[11px] font-black hover:bg-gray-100 transition-colors"
                          >
                            Touch Candidate
                          </button>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-lg font-black text-black">
                            {item.organization?.name || 'Organization'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {[item.organization?.city, item.organization?.state]
                              .filter(Boolean)
                              .join(' • ') || 'Community organization'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCompareIds((current) =>
                              current.filter((id) => id !== item.organizationId)
                            );
                            appendActivity({
                              type: 'compare_removed',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: `Removed ${item.organization?.name || 'organization'} from compare mode.`,
                            });
                          }}
                          className="px-2 py-1 text-[11px] font-black border border-black bg-white hover:bg-gray-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                        <div className="border border-gray-200 bg-white p-2">
                          <div className="font-bold text-gray-500">Top Match</div>
                          <div className={`inline-flex px-2 py-1 mt-1 text-[10px] font-black border border-black ${scoreClass(strongestMatchScore)}`}>
                            {strongestMatchScore}
                          </div>
                        </div>
                        <div className="border border-gray-200 bg-white p-2">
                          <div className="font-bold text-gray-500">Trust</div>
                          <div className="text-sm font-black text-black">{item.communityTrustScore}</div>
                        </div>
                        <div className="border border-gray-200 bg-white p-2">
                          <div className="font-bold text-gray-500">Readiness</div>
                          <div className="text-sm font-black text-black">{item.fundingReadinessScore}</div>
                        </div>
                        <div className="border border-gray-200 bg-white p-2">
                          <div className="font-bold text-gray-500">Delivery</div>
                          <div className="text-sm font-black text-black">{item.deliveryConfidenceScore}</div>
                        </div>
                      </div>

                      <div className="border border-gray-200 bg-white p-3 mb-3">
                        <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">
                          Why This Fits
                        </div>
                        <div className="text-xs text-gray-700 mb-2">
                          {strongestFitReason(topMatch)}
                        </div>
                        {topMatch ? (
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div>
                              <div className="font-bold text-gray-500">Readiness</div>
                              <div className="font-black text-black">{topMatch.readinessScore}</div>
                            </div>
                            <div>
                              <div className="font-bold text-gray-500">Alignment</div>
                              <div className="font-black text-black">{topMatch.communityAlignmentScore}</div>
                            </div>
                            <div>
                              <div className="font-bold text-gray-500">Geography</div>
                              <div className="font-black text-black">{topMatch.geographicFitScore}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500">No current recommendation signal.</div>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-600 mb-3">
                        {topMatch?.opportunity?.name || 'No current funding opportunity'}{topMatch?.opportunity?.funder_name ? ` • ${topMatch.opportunity.funder_name}` : ''}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <FundingDiscoveryPipelineHandoff
                          recommendationId={topMatch?.recommendationId}
                          organizationId={item.organizationId}
                          opportunityId={topMatch?.id}
                          organizationName={item.organization?.name}
                          opportunityName={topMatch?.opportunity?.name}
                          funderName={topMatch?.opportunity?.funder_name}
                          onPipelineSent={() =>
                            appendActivity({
                              type: 'pipeline_sent',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: `Sent ${item.organization?.name || 'organization'} into the funding pipeline.`,
                            })
                          }
                          onConversationTracked={() =>
                            appendActivity({
                              type: 'conversation_tracked',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: `Created a tracked conversation request for ${item.organization?.name || 'organization'}.`,
                            })
                          }
                          onConversationBriefCopied={() =>
                            appendActivity({
                              type: 'conversation_requested',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: `Copied a conversation request brief for ${item.organization?.name || 'organization'}.`,
                            })
                          }
                          compact
                        />
                        <Link
                          href={`/funding/discovery/${item.organizationId}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          View Detail
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {loading ? (
              <div className="xl:col-span-2 border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Loading shortlist…
              </div>
            ) : items.length === 0 ? (
              <div className="xl:col-span-2 border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                No organizations are shortlisted yet. Add organizations from the discovery list or detail pages.
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="xl:col-span-2 border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                No shortlisted organizations match the current queue focus.
              </div>
            ) : (
              visibleItems.map((item) => {
                const topMatch = item.topMatches[0];
                const strongestMatchScore = topMatch?.matchScore || 0;
                const currentDecisionTag = decisionsByOrganizationId[item.organizationId];
                const currentDecisionConfig = decisionTagConfig(currentDecisionTag);
                const lastTouchedAt = organizationLastTouchedAt[item.organizationId];
                const lastReviewTouchAt =
                  organizationLastReviewTouchAt[item.organizationId];
                const reviewedToday = isSameLocalDay(lastReviewTouchAt);
                const isStale = staleOrganizationIds.has(item.organizationId);

                return (
                  <article
                    key={item.organizationId}
                    className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-2xl font-black text-black">
                            {item.organization?.name || 'Organization'}
                          </h2>
                          {currentDecisionConfig && (
                            <span className={`px-2 py-1 text-[11px] font-black border border-black ${currentDecisionConfig.className}`}>
                              {currentDecisionConfig.label}
                            </span>
                          )}
                          {reviewedToday && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#ecfdf5] text-[#115e59]">
                              Reviewed today {formatReviewTime(lastReviewTouchAt)}
                            </span>
                          )}
                          {isStale && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#fffbeb] text-[#b45309]">
                              Stale Candidate
                            </span>
                          )}
                          {item.firstNationsLed && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#fff7ed] text-[#9a3412]">
                              First Nations led
                            </span>
                          )}
                          {item.livedExperienceLed && (
                            <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                              Lived experience led
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {[item.organization?.type, item.organization?.city, item.organization?.state]
                            .filter(Boolean)
                            .join(' • ') || 'Community organization'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 text-xs font-black border border-black ${scoreClass(strongestMatchScore)}`}>
                          Strongest match {strongestMatchScore}
                        </span>
                        <span className={`px-2 py-1 text-xs font-black border border-black ${scoreClass(item.communityTrustScore)}`}>
                          Trust {item.communityTrustScore}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-[11px]">
                      <div className="border border-gray-200 bg-gray-50 p-3">
                        <div className="font-bold text-gray-600">Readiness</div>
                        <div className="text-lg font-black text-black">{item.fundingReadinessScore}</div>
                      </div>
                      <div className="border border-gray-200 bg-gray-50 p-3">
                        <div className="font-bold text-gray-600">Compliance</div>
                        <div className="text-lg font-black text-black">{item.complianceReadinessScore}</div>
                      </div>
                      <div className="border border-gray-200 bg-gray-50 p-3">
                        <div className="font-bold text-gray-600">Delivery</div>
                        <div className="text-lg font-black text-black">{item.deliveryConfidenceScore}</div>
                      </div>
                      <div className="border border-gray-200 bg-gray-50 p-3">
                        <div className="font-bold text-gray-600">Community</div>
                        <div className="text-lg font-black text-black">{item.reportingToCommunityScore}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-sm font-black text-black mb-2">Top Match</div>
                        {topMatch ? (
                          <>
                            <div className="text-xs font-black text-black">
                              {topMatch.opportunity?.name || 'Funding opportunity'}
                            </div>
                            <div className="text-[11px] text-gray-600 mt-1">
                              {[topMatch.opportunity?.funder_name, topMatch.status]
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              Deadline {formatDate(topMatch.opportunity?.deadline)} • Max{' '}
                              {formatCurrency(topMatch.opportunity?.max_grant_amount)}
                            </div>
                            <div className="mt-3 border border-gray-200 bg-white p-3">
                              <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">
                                Why This Fits
                              </div>
                              <div className="text-[11px] font-medium text-gray-700 mb-3">
                                {strongestFitReason(topMatch)}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-[10px]">
                                <div className="border border-gray-200 bg-[#f8fafc] p-2">
                                  <div className="font-bold text-gray-500">Readiness</div>
                                  <div className="font-black text-black">
                                    {topMatch.readinessScore}
                                  </div>
                                </div>
                                <div className="border border-gray-200 bg-[#f8fafc] p-2">
                                  <div className="font-bold text-gray-500">Alignment</div>
                                  <div className="font-black text-black">
                                    {topMatch.communityAlignmentScore}
                                  </div>
                                </div>
                                <div className="border border-gray-200 bg-[#f8fafc] p-2">
                                  <div className="font-bold text-gray-500">Geography</div>
                                  <div className="font-black text-black">
                                    {topMatch.geographicFitScore}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500">No current recommendation signal.</div>
                        )}
                      </div>
                      <div className="border border-gray-200 bg-[#f8fafc] p-4">
                        <div className="text-sm font-black text-black mb-2">Recent Award Context</div>
                        {item.recentAwards[0] ? (
                          <>
                            <div className="text-xs font-black text-black">
                              {item.recentAwards[0].fundingProgram?.title || 'Funding program'}
                            </div>
                            <div className="text-[11px] text-gray-600 mt-1">
                              {[item.recentAwards[0].fundingSource?.name, item.recentAwards[0].status]
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              Awarded {formatCurrency(item.recentAwards[0].awardAmount)} • Due{' '}
                              {formatDate(item.recentAwards[0].communityReportDueAt)}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500">No recent award context recorded.</div>
                        )}
                      </div>
                    </div>

                    {isStale && (
                      <div className="border border-[#f59e0b] bg-[#fff7ed] p-4 mb-4">
                        <div className="text-[10px] font-bold uppercase text-[#b45309] mb-1">
                          Stale Queue Signal
                        </div>
                        <div className="text-xs text-[#92400e]">
                          {staleShortlistLabel(lastTouchedAt)}
                        </div>
                        <button
                          type="button"
                          onClick={() => touchCandidate(item)}
                          className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-[11px] font-black hover:bg-gray-100 transition-colors"
                        >
                          Touch Candidate
                        </button>
                      </div>
                    )}

                    <div className="border border-gray-200 bg-[#fffdf7] p-4 mb-4">
                        <div className="mb-3">
                          <div className="text-[10px] font-bold uppercase text-gray-600 mb-2">
                            Decision Tag
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(['advance', 'hold', 'needs_review'] as ShortlistDecisionTag[]).map(
                              (tag) => {
                                const tagConfig = decisionTagConfig(tag);
                                const isActive = currentDecisionTag === tag;

                                return (
                                  <button
                                    key={`${item.organizationId}-${tag}`}
                                    type="button"
                                    onClick={() => {
                                      setDecisionsByOrganizationId((current) => {
                                        const nextDecisions = { ...current };
                                        const nextTag =
                                          current[item.organizationId] === tag ? null : tag;

                                        if (nextTag) {
                                          nextDecisions[item.organizationId] = nextTag;
                                        } else {
                                          delete nextDecisions[item.organizationId];
                                        }

                                        setLocalShortlistDecisions(nextDecisions);
                                        if (!isSharedView) {
                                          void syncWorkspaceMutation(
                                            {
                                              organizationId: item.organizationId,
                                              decisionTag: nextTag,
                                            },
                                            true
                                          );
                                        }

                                        appendActivity({
                                          type: nextTag
                                            ? 'decision_tag_set'
                                            : 'decision_tag_cleared',
                                          organizationId: item.organizationId,
                                          organizationName:
                                            item.organization?.name || undefined,
                                          detail: nextTag
                                            ? `Marked ${item.organization?.name || 'organization'} as ${decisionTagConfig(nextTag)?.label || nextTag}.`
                                            : `Cleared the decision tag for ${item.organization?.name || 'organization'}.`,
                                        });

                                        return nextDecisions;
                                      });
                                    }}
                                    className={`px-3 py-2 text-[11px] font-black border-2 border-black transition-colors ${
                                      isActive
                                        ? tagConfig?.className || 'bg-white'
                                        : 'bg-white hover:bg-gray-100'
                                    }`}
                                  >
                                    {tagConfig?.label || tag}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>

                        <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">
                          Funder Working Note
                        </label>
                        <textarea
                          value={notesByOrganizationId[item.organizationId] || ''}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setNotesByOrganizationId((current) => {
                              const previousValue = String(current[item.organizationId] || '');
                              const nextNotes = { ...current };

                              if (nextValue.trim()) {
                                nextNotes[item.organizationId] = nextValue;
                              } else {
                                delete nextNotes[item.organizationId];
                              }

                              setLocalShortlistNotes(nextNotes);
                              if (!isSharedView) {
                                void syncWorkspaceMutation(
                                  {
                                    organizationId: item.organizationId,
                                    note: nextValue,
                                  },
                                  true
                                );
                              }

                              const previousHasValue = Boolean(previousValue.trim());
                              const nextHasValue = Boolean(nextValue.trim());

                              if (!previousHasValue && nextHasValue) {
                                appendActivity({
                                  type: 'note_created',
                                  organizationId: item.organizationId,
                                  organizationName: item.organization?.name || undefined,
                                  detail: `Added a funder note for ${item.organization?.name || 'organization'}.`,
                                });
                              }

                              if (previousHasValue && !nextHasValue) {
                                appendActivity({
                                  type: 'note_cleared',
                                  organizationId: item.organizationId,
                                  organizationName: item.organization?.name || undefined,
                                  detail: `Cleared the funder note for ${item.organization?.name || 'organization'}.`,
                                });
                              }

                              return nextNotes;
                            });
                          }}
                          placeholder={
                            isSharedView
                              ? 'Use This Shortlist to adopt and edit shared notes locally.'
                              : 'Record why this org is worth pursuing, concerns to verify, or next conversation points.'
                          }
                          rows={3}
                          disabled={isSharedView}
                          className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm font-medium outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-3 border-t-2 border-dashed border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {item.capabilityTags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-[11px] font-bold border border-black bg-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!isStale && (
                          <button
                            type="button"
                            onClick={() => touchCandidate(item)}
                            className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors"
                          >
                            Touch Candidate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const isCurrentlyInCompare = compareIds.includes(item.organizationId);

                            setCompareIds((current) => {
                              if (current.includes(item.organizationId)) {
                                return current.filter((id) => id !== item.organizationId);
                              }

                              if (current.length >= 4) {
                                return [...current.slice(1), item.organizationId];
                              }

                              return [...current, item.organizationId];
                            });

                            appendActivity({
                              type: isCurrentlyInCompare ? 'compare_removed' : 'compare_added',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: isCurrentlyInCompare
                                ? `Removed ${item.organization?.name || 'organization'} from compare mode.`
                                : `Added ${item.organization?.name || 'organization'} to compare mode.`,
                            });
                          }}
                          className={`px-3 py-2 text-xs font-black border-2 border-black transition-colors ${
                            compareIds.includes(item.organizationId)
                              ? 'bg-[#0f766e] text-white'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {compareIds.includes(item.organizationId)
                            ? 'In Compare'
                            : compareIds.length >= 4
                              ? 'Compare (replace oldest)'
                              : 'Add to Compare'}
                        </button>
                        <FundingDiscoveryPipelineHandoff
                          recommendationId={topMatch?.recommendationId}
                          organizationId={item.organizationId}
                          opportunityId={topMatch?.id}
                          organizationName={item.organization?.name}
                          opportunityName={topMatch?.opportunity?.name}
                          funderName={topMatch?.opportunity?.funder_name}
                          onPipelineSent={() =>
                            appendActivity({
                              type: 'pipeline_sent',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: `Sent ${item.organization?.name || 'organization'} into the funding pipeline.`,
                            })
                          }
                          onConversationTracked={() =>
                            appendActivity({
                              type: 'conversation_tracked',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: `Created a tracked conversation request for ${item.organization?.name || 'organization'}.`,
                            })
                          }
                          onConversationBriefCopied={() =>
                            appendActivity({
                              type: 'conversation_requested',
                              organizationId: item.organizationId,
                              organizationName: item.organization?.name || undefined,
                              detail: `Copied a conversation request brief for ${item.organization?.name || 'organization'}.`,
                            })
                          }
                          compact
                        />
                        <FundingDiscoveryShortlistButton
                          organizationId={item.organizationId}
                          compact
                        />
                        <Link
                          href={`/funding/discovery/${item.organizationId}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                        >
                          View organization detail
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
