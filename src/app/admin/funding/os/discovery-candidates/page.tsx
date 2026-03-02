'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface DiscoveryCandidate {
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug?: string | null;
    type?: string | null;
    city?: string | null;
    state?: string | null;
    partnerTier?: string | null;
    verificationStatus?: string | null;
  };
  dataScore: number;
  hasCapabilityProfile: boolean;
  hasSharedProfile: boolean;
  nodeCount: number;
  profileLinkCount: number;
  publicProfileCount: number;
  featuredConnectorCount: number;
  cohortBucket: 'basecamp' | 'additional';
  recommended: boolean;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
}

function tierClass(tier?: string | null) {
  if (tier === 'basecamp') return 'bg-[#eef8f7] text-[#115e59]';
  if (tier === 'partner') return 'bg-[#eef4ff] text-[#1d4ed8]';
  return 'bg-gray-100 text-gray-700';
}

export default function FundingDiscoveryCandidatesPage() {
  const [items, setItems] = useState<DiscoveryCandidate[]>([]);
  const [sharedShortlistIds, setSharedShortlistIds] = useState<string[]>([]);
  const [sharedShortlistAvailable, setSharedShortlistAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [showInitialized, setShowInitialized] = useState(true);

  const loadCandidates = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '30');
      params.set('includeInitialized', showInitialized ? 'true' : 'false');
      const response = await fetch(`/api/admin/funding/os/discovery-candidates?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load discovery candidates');
      }

      setItems(Array.isArray(payload.data) ? payload.data : []);

      try {
        const shortlistResponse = await fetch('/api/admin/funding/os/shared-shortlist');
        const shortlistPayload = await shortlistResponse.json().catch(() => ({}));

        if (shortlistResponse.ok) {
          setSharedShortlistIds(
            Array.isArray(shortlistPayload.organizationIds)
              ? shortlistPayload.organizationIds
                  .map((value: unknown) => String(value || '').trim())
                  .filter(Boolean)
              : []
          );
          setSharedShortlistAvailable(true);
        } else {
          setSharedShortlistIds([]);
          setSharedShortlistAvailable(false);
        }
      } catch {
        setSharedShortlistIds([]);
        setSharedShortlistAvailable(false);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load discovery candidates'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [showInitialized]);

  const summary = useMemo(
    () => ({
      total: items.length,
      basecamps: items.filter((item) => item.cohortBucket === 'basecamp').length,
      ready: items.filter((item) => item.recommended).length,
      shared: items.filter((item) => item.hasSharedProfile).length,
    }),
    [items]
  );

  const basecamps = useMemo(
    () => items.filter((item) => item.cohortBucket === 'basecamp'),
    [items]
  );
  const additional = useMemo(
    () => items.filter((item) => item.cohortBucket === 'additional'),
    [items]
  );
  const recommendedBasecampIds = useMemo(
    () =>
      basecamps
        .filter((item) => item.recommended)
        .map((item) => item.organizationId),
    [basecamps]
  );
  const firstThreeBasecampIds = useMemo(
    () => recommendedBasecampIds.slice(0, 3),
    [recommendedBasecampIds]
  );
  const suggestedPilotSetIds = useMemo(() => {
    const basecampIds = basecamps
      .filter((item) => item.recommended)
      .map((item) => item.organizationId);
    const additionalIds = additional
      .filter((item) => item.recommended)
      .slice(0, 3)
      .map((item) => item.organizationId);

    return Array.from(new Set([...basecampIds, ...additionalIds]));
  }, [additional, basecamps]);
  const sharedShortlistCandidates = useMemo(() => {
    const byId = new Map(items.map((item) => [item.organizationId, item]));
    return sharedShortlistIds
      .map((organizationId) => byId.get(organizationId) || null)
      .filter(Boolean) as DiscoveryCandidate[];
  }, [items, sharedShortlistIds]);
  const hiddenSharedShortlistCount = Math.max(
    0,
    sharedShortlistIds.length - sharedShortlistCandidates.length
  );
  const sharedShortlistIdSet = useMemo(
    () => new Set(sharedShortlistIds),
    [sharedShortlistIds]
  );

  const createSharedProfile = async (candidate: DiscoveryCandidate) => {
    const activity = {
      id: `profile-init-${candidate.organizationId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'profile_initialized',
      detail: `Initialized shared profile for ${candidate.organization.name}.`,
      organizationId: candidate.organizationId,
      organizationName: candidate.organization.name,
    };

    const response = await fetch('/api/admin/funding/os/discovery-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: candidate.organizationId,
        activity,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to initialize shared profile');
    }
  };

  const createCapabilityProfile = async (candidate: DiscoveryCandidate) => {
    const response = await fetch('/api/admin/funding/os/capability-profiles/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationIds: [candidate.organizationId],
        limit: 1,
        overwriteExisting: false,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to seed capability profile');
    }
  };

  const loadSharedShortlistIds = async () => {
    const response = await fetch('/api/admin/funding/os/shared-shortlist');
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load shared shortlist');
    }

    return Array.isArray(payload.organizationIds)
      ? payload.organizationIds
          .map((value: unknown) => String(value || '').trim())
          .filter(Boolean)
      : [];
  };

  const saveSharedShortlistIds = async (organizationIds: string[]) => {
    const response = await fetch('/api/admin/funding/os/shared-shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationIds,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to update shared shortlist');
    }

    setSharedShortlistIds(
      Array.isArray(payload.organizationIds)
        ? payload.organizationIds
            .map((value: unknown) => String(value || '').trim())
            .filter(Boolean)
        : []
    );
    setSharedShortlistAvailable(true);
  };

  const initializeSharedProfile = async (candidate: DiscoveryCandidate) => {
    try {
      setWorkingId(candidate.organizationId);
      setNotice(null);
      await createSharedProfile(candidate);
      setNotice({
        type: 'success',
        message: `Initialized shared profile for ${candidate.organization.name}.`,
      });
      await loadCandidates(true);
    } catch (initError) {
      setNotice({
        type: 'error',
        message:
          initError instanceof Error
            ? initError.message
            : 'Failed to initialize shared profile',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const seedCapability = async (candidate: DiscoveryCandidate) => {
    try {
      setWorkingId(candidate.organizationId);
      setNotice(null);
      await createCapabilityProfile(candidate);
      setNotice({
        type: 'success',
        message: `Seeded capability profile for ${candidate.organization.name}.`,
      });
      await loadCandidates(true);
    } catch (seedError) {
      setNotice({
        type: 'error',
        message:
          seedError instanceof Error
            ? seedError.message
            : 'Failed to seed capability profile',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const addToSharedShortlist = async (candidate: DiscoveryCandidate) => {
    try {
      setWorkingId(candidate.organizationId);
      setNotice(null);
      const currentIds = await loadSharedShortlistIds();
      const nextIds = Array.from(new Set([...currentIds, candidate.organizationId]));
      await saveSharedShortlistIds(nextIds);

      setNotice({
        type: 'success',
        message: `${candidate.organization.name} is now in the shared shortlist cohort.`,
      });
    } catch (shortlistError) {
      setNotice({
        type: 'error',
        message:
          shortlistError instanceof Error
            ? shortlistError.message
            : 'Failed to update shared shortlist',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const removeFromSharedShortlist = async (candidate: DiscoveryCandidate) => {
    try {
      setWorkingId(candidate.organizationId);
      setNotice(null);
      const currentIds = await loadSharedShortlistIds();
      const nextIds = currentIds.filter((id: string) => id !== candidate.organizationId);
      await saveSharedShortlistIds(nextIds);

      setNotice({
        type: 'success',
        message: `${candidate.organization.name} was removed from the shared shortlist cohort.`,
      });
    } catch (shortlistError) {
      setNotice({
        type: 'error',
        message:
          shortlistError instanceof Error
            ? shortlistError.message
            : 'Failed to update shared shortlist',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const prepareAndAddToSharedShortlist = async (candidate: DiscoveryCandidate) => {
    try {
      setWorkingId(candidate.organizationId);
      setNotice(null);

      if (!candidate.hasSharedProfile) {
        await createSharedProfile(candidate);
      }

      if (!candidate.hasCapabilityProfile) {
        await createCapabilityProfile(candidate);
      }

      const currentIds = await loadSharedShortlistIds();
      const nextIds = Array.from(new Set([...currentIds, candidate.organizationId]));
      await saveSharedShortlistIds(nextIds);

      const completedSteps = [
        !candidate.hasSharedProfile ? 'shared profile' : null,
        !candidate.hasCapabilityProfile ? 'capability profile' : null,
      ].filter(Boolean);

      setNotice({
        type: 'success',
        message:
          completedSteps.length > 0
            ? `Prepared ${candidate.organization.name} and added it to the shared cohort by creating ${completedSteps.join(
                ' and '
              )}.`
            : `${candidate.organization.name} is already ready and was added to the shared cohort.`,
      });
      await loadCandidates(true);
    } catch (prepareError) {
      setNotice({
        type: 'error',
        message:
          prepareError instanceof Error
            ? prepareError.message
            : 'Failed to prepare and add organization',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const promoteSuggestedPilotSet = async () => {
    if (suggestedPilotSetIds.length === 0) {
      setNotice({
        type: 'error',
        message: 'No suggested pilot set is available yet.',
      });
      return;
    }

    try {
      setWorkingId('__pilot_set__');
      setNotice(null);
      const currentIds = await loadSharedShortlistIds();
      const nextIds = Array.from(new Set([...currentIds, ...suggestedPilotSetIds]));
      await saveSharedShortlistIds(nextIds);

      setNotice({
        type: 'success',
        message: `Promoted ${suggestedPilotSetIds.length} organizations into the shared pilot shortlist.`,
      });
    } catch (pilotError) {
      setNotice({
        type: 'error',
        message:
          pilotError instanceof Error
            ? pilotError.message
            : 'Failed to promote suggested pilot set',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const promoteRecommendedBasecamps = async () => {
    if (recommendedBasecampIds.length === 0) {
      setNotice({
        type: 'error',
        message: 'No recommended basecamps are available yet.',
      });
      return;
    }

    try {
      setWorkingId('__basecamp_set__');
      setNotice(null);
      const currentIds = await loadSharedShortlistIds();
      const nextIds = Array.from(new Set([...currentIds, ...recommendedBasecampIds]));
      await saveSharedShortlistIds(nextIds);

      setNotice({
        type: 'success',
        message: `Promoted ${recommendedBasecampIds.length} recommended basecamps into the shared pilot shortlist.`,
      });
    } catch (basecampError) {
      setNotice({
        type: 'error',
        message:
          basecampError instanceof Error
            ? basecampError.message
            : 'Failed to promote recommended basecamps',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const launchFirstThreeBasecamps = async () => {
    if (firstThreeBasecampIds.length === 0) {
      setNotice({
        type: 'error',
        message: 'No first basecamp cohort is available yet.',
      });
      return;
    }

    try {
      setWorkingId('__basecamp_three__');
      setNotice(null);
      const currentIds = await loadSharedShortlistIds();
      const nextIds = Array.from(new Set([...currentIds, ...firstThreeBasecampIds]));
      await saveSharedShortlistIds(nextIds);

      setNotice({
        type: 'success',
        message: `Launched the first basecamp cohort with ${firstThreeBasecampIds.length} organizations.`,
      });
    } catch (launchError) {
      setNotice({
        type: 'error',
        message:
          launchError instanceof Error
            ? launchError.message
            : 'Failed to launch first basecamp cohort',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const prepareCandidate = async (candidate: DiscoveryCandidate) => {
    const needsSharedProfile = !candidate.hasSharedProfile;
    const needsCapabilityProfile = !candidate.hasCapabilityProfile;

    if (!needsSharedProfile && !needsCapabilityProfile) {
      setNotice({
        type: 'success',
        message: `${candidate.organization.name} is already ready for pilot review.`,
      });
      return;
    }

    try {
      setWorkingId(candidate.organizationId);
      setNotice(null);

      if (needsSharedProfile) {
        await createSharedProfile(candidate);
      }

      if (needsCapabilityProfile) {
        await createCapabilityProfile(candidate);
      }

      const completedSteps = [
        needsSharedProfile ? 'shared profile' : null,
        needsCapabilityProfile ? 'capability profile' : null,
      ].filter(Boolean);

      setNotice({
        type: 'success',
        message: `Prepared ${candidate.organization.name} for pilot review by creating ${completedSteps.join(
          ' and '
        )}.`,
      });
      await loadCandidates(true);
    } catch (prepareError) {
      setNotice({
        type: 'error',
        message:
          prepareError instanceof Error ? prepareError.message : 'Failed to prepare candidate',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const renderCandidateSection = (title: string, description: string, candidates: DiscoveryCandidate[]) => (
    <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-5">
        <div className="text-xs uppercase font-bold text-gray-600 mb-1">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>

      {candidates.length === 0 ? (
        <div className="border border-gray-200 bg-[#f8fafc] p-4 text-sm text-gray-500">
          No candidates in this cohort yet.
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => {
            const isInSharedCohort = sharedShortlistIdSet.has(candidate.organizationId);

            return (
            <article key={candidate.organizationId} className="border border-gray-200 bg-[#f8fafc] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl font-black text-black">{candidate.organization.name}</h2>
                    <span className={`px-2 py-1 text-[10px] font-black border border-black ${tierClass(candidate.organization.partnerTier)}`}>
                      {candidate.organization.partnerTier || 'organization'}
                    </span>
                    {candidate.recommended && (
                      <span className="px-2 py-1 text-[10px] font-black border border-black bg-emerald-100 text-emerald-800">
                        Recommended pilot
                      </span>
                    )}
                    {candidate.hasSharedProfile && (
                      <span className="px-2 py-1 text-[10px] font-black border border-black bg-[#ecfdf5] text-[#115e59]">
                        Shared profile ready
                      </span>
                    )}
                    {isInSharedCohort && (
                      <span className="px-2 py-1 text-[10px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                        In shared cohort
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {[candidate.organization.type, candidate.organization.city, candidate.organization.state]
                      .filter(Boolean)
                      .join(' • ') || 'Community organization'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                    Data score {candidate.dataScore}
                  </span>
                  <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                    {candidate.organization.verificationStatus || 'unverified'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-[11px]">
                <div className="border border-gray-200 bg-white p-3">
                  <div className="font-bold text-gray-600">Nodes</div>
                  <div className="text-lg font-black text-black">{candidate.nodeCount}</div>
                </div>
                <div className="border border-gray-200 bg-white p-3">
                  <div className="font-bold text-gray-600">Linked People</div>
                  <div className="text-lg font-black text-black">{candidate.profileLinkCount}</div>
                </div>
                <div className="border border-gray-200 bg-white p-3">
                  <div className="font-bold text-gray-600">Public Profiles</div>
                  <div className="text-lg font-black text-black">{candidate.publicProfileCount}</div>
                </div>
                <div className="border border-gray-200 bg-white p-3">
                  <div className="font-bold text-gray-600">Featured</div>
                  <div className="text-lg font-black text-black">{candidate.featuredConnectorCount}</div>
                </div>
                <div className="border border-gray-200 bg-white p-3">
                  <div className="font-bold text-gray-600">Capability Profile</div>
                  <div className="text-sm font-black text-black">
                    {candidate.hasCapabilityProfile ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isInSharedCohort && (
                  <button
                    type="button"
                    onClick={() => prepareAndAddToSharedShortlist(candidate)}
                    disabled={!sharedShortlistAvailable || workingId === candidate.organizationId}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-[#111827] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    Prepare + Add to Cohort
                  </button>
                )}
                {(!candidate.hasSharedProfile || !candidate.hasCapabilityProfile) && (
                  <button
                    type="button"
                    onClick={() => prepareCandidate(candidate)}
                    disabled={workingId === candidate.organizationId}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f172a] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    Prepare for Pilot
                  </button>
                )}
                {!candidate.hasSharedProfile && (
                  <button
                    type="button"
                    onClick={() => initializeSharedProfile(candidate)}
                    disabled={workingId === candidate.organizationId}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f766e] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    Initialize Shared Profile
                  </button>
                )}
                {!candidate.hasCapabilityProfile && (
                  <button
                    type="button"
                    onClick={() => seedCapability(candidate)}
                    disabled={workingId === candidate.organizationId}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Seed Capability
                  </button>
                )}
                {candidate.hasSharedProfile && (
                  <Link
                    href={`/admin/funding/os/discovery-workspace?organizationIds=${candidate.organizationId}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#eef8f7] border-2 border-black text-xs font-black text-[#115e59] hover:bg-[#d7f0ee] transition-colors"
                  >
                    Build Shared Profile
                  </Link>
                )}
                <Link
                  href={`/funding/discovery/${candidate.organizationId}`}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                >
                  Open Discovery Detail
                </Link>
                {isInSharedCohort ? (
                  <button
                    type="button"
                    onClick={() => removeFromSharedShortlist(candidate)}
                    disabled={!sharedShortlistAvailable || workingId === candidate.organizationId}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-[#fff1f2] text-[#be123c] hover:bg-[#ffe4e6] transition-colors disabled:opacity-50"
                  >
                    Remove from Shared Cohort
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToSharedShortlist(candidate)}
                    disabled={!sharedShortlistAvailable || workingId === candidate.organizationId}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                  >
                    Add to Shared Shortlist
                  </button>
                )}
                <Link
                  href="/funding/discovery/shortlist"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                >
                  Open Shortlist
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/funding/os"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Funding OS
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Discovery Cohort Candidates</h1>
                  <p className="text-base text-gray-600">
                    Prioritize basecamps with strong existing data first, then add the next best organizations to build shared profiles out.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadCandidates(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Candidates
            </button>
          </div>

          {notice && (
            <div
              className={`border-2 p-4 mb-6 font-medium ${
                notice.type === 'success'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-red-500 bg-red-50 text-red-800'
              }`}
            >
              {notice.message}
            </div>
          )}

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Candidates</div>
              <div className="text-4xl font-black text-black">{summary.total}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Basecamps First</div>
              <div className="text-4xl font-black text-[#0f766e]">{summary.basecamps}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Pilot Ready</div>
              <div className="text-4xl font-black text-emerald-700">{summary.ready}</div>
            </div>
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Shared Ready</div>
              <div className="text-4xl font-black text-blue-700">{summary.shared}</div>
            </div>
          </div>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">View Scope</div>
                <div className="text-sm font-black text-black">
                  {showInitialized
                    ? 'Showing both ready and already-initialized organizations.'
                    : 'Showing organizations that still need shared-profile setup.'}
                </div>
                <div className="text-xs font-bold text-gray-500 mt-2">
                  First basecamp cohort: {firstThreeBasecampIds.length} orgs
                  {' • '}
                  Suggested pilot set: {suggestedPilotSetIds.length} orgs
                  {' • '}
                  Recommended basecamps: {recommendedBasecampIds.length}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={launchFirstThreeBasecamps}
                  disabled={
                    !sharedShortlistAvailable ||
                    workingId === '__basecamp_three__' ||
                    firstThreeBasecampIds.length === 0
                  }
                  className="px-3 py-2 text-xs font-black border-2 border-black bg-[#111827] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {workingId === '__basecamp_three__'
                    ? 'Launching First 3…'
                    : 'Launch First 3 Basecamps'}
                </button>
                <button
                  type="button"
                  onClick={promoteRecommendedBasecamps}
                  disabled={
                    !sharedShortlistAvailable ||
                    workingId === '__basecamp_set__' ||
                    recommendedBasecampIds.length === 0
                  }
                  className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f766e] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {workingId === '__basecamp_set__'
                    ? 'Promoting Basecamps…'
                    : 'Promote Recommended Basecamps'}
                </button>
                <button
                  type="button"
                  onClick={promoteSuggestedPilotSet}
                  disabled={
                    !sharedShortlistAvailable ||
                    workingId === '__pilot_set__' ||
                    suggestedPilotSetIds.length === 0
                  }
                  className="px-3 py-2 text-xs font-black border-2 border-black bg-[#0f172a] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {workingId === '__pilot_set__'
                    ? 'Promoting Pilot Set…'
                    : 'Promote Suggested Pilot Set'}
                </button>
                <Link
                  href="/funding/discovery/shortlist"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-xs font-black hover:bg-gray-100 transition-colors"
                >
                  Open Shared Shortlist
                </Link>
                <button
                  type="button"
                  onClick={() => setShowInitialized((current) => !current)}
                  className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors"
                >
                  {showInitialized ? 'Hide Initialized' : 'Show Initialized'}
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-4">
              <div>
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                  Selected Pilot Cohort
                </div>
                <div className="text-sm text-gray-600">
                  See which organizations are already in the shared shortlist pilot set.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                  Shared shortlist {sharedShortlistIds.length}
                </span>
                <span className="px-2 py-1 text-xs font-black border border-black bg-white">
                  Visible here {sharedShortlistCandidates.length}
                </span>
              </div>
            </div>

            {!sharedShortlistAvailable ? (
              <div className="border border-amber-300 bg-amber-50 text-amber-800 p-4 text-sm font-medium">
                Shared shortlist backend is not available yet. Apply the shared-shortlist migration
                to make the pilot cohort durable across admins.
              </div>
            ) : sharedShortlistIds.length === 0 ? (
              <div className="border border-gray-200 bg-[#f8fafc] p-4 text-sm text-gray-500">
                No organizations are in the shared pilot cohort yet.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {sharedShortlistCandidates.map((candidate) => (
                    <span
                      key={candidate.organizationId}
                      className="px-2 py-1 text-xs font-black border border-black bg-[#ecfdf5] text-[#115e59]"
                    >
                      {candidate.organization.name}
                    </span>
                  ))}
                  {hiddenSharedShortlistCount > 0 && (
                    <span className="px-2 py-1 text-xs font-black border border-black bg-white text-gray-700">
                      +{hiddenSharedShortlistCount} outside this view
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/funding/discovery/shortlist"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#eef8f7] border-2 border-black text-xs font-black text-[#115e59] hover:bg-[#d7f0ee] transition-colors"
                  >
                    Open Shared Shortlist
                  </Link>
                  <button
                    type="button"
                    onClick={() => loadCandidates(true)}
                    disabled={refreshing}
                    className="px-3 py-2 text-xs font-black border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Refresh Cohort
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="space-y-8">
            {loading ? (
              <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Loading discovery candidates…
              </div>
            ) : (
              <>
                {renderCandidateSection(
                  'Basecamp Ready First',
                  'Start with basecamps that already have the strongest people, node, and profile signals.',
                  basecamps
                )}
                {renderCandidateSection(
                  'Additional Test Cohort',
                  'Then widen the pilot with the next strongest organizations outside the basecamp lane.',
                  additional
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
