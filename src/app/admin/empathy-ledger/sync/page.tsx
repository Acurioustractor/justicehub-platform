'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Check, X, AlertCircle, Clock, User, Download, Eye, EyeOff } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';

interface EmpathyLedgerProfile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  justicehub_enabled?: boolean;
  justicehub_role?: string | null;
  justicehub_featured?: boolean;
  is_justicehub_featured?: boolean;
  location?: string | null;
  created_at: string;
  updated_at?: string;
}

interface LocalProfile {
  id: string;
  full_name: string;
  bio: string | null;
  photo_url: string | null;
  empathy_ledger_profile_id: string | null;
  last_synced_at: string | null;
  synced_from_empathy_ledger: boolean | null;
}

interface SyncCandidate {
  empathyLedgerProfile: EmpathyLedgerProfile;
  localProfile: LocalProfile | null;
  status: 'new' | 'update' | 'synced' | 'conflict';
  changes: string[];
  selected: boolean;
}

export default function EmpathyLedgerSyncPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [candidates, setCandidates] = useState<SyncCandidate[]>([]);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    failed: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin access and load candidates
  useEffect(() => {
    async function checkAccessAndLoad() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/admin/empathy-ledger/sync');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (!profileData?.is_super_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await loadCandidates();
    }

    checkAccessAndLoad();
  }, [router]);

  async function loadCandidates() {
    setLoading(true);
    setError(null);

    try {
      // Fetch profiles from API that gets EL profiles with justicehub_enabled
      const response = await fetch('/api/empathy-ledger/profiles?justicehub_enabled=true');

      if (!response.ok) {
        throw new Error('Failed to fetch Empathy Ledger profiles');
      }

      const { profiles: elProfiles } = await response.json();

      // Fetch local profiles that are synced from EL
      const supabase = createClient();
      const { data: localProfiles } = await supabase
        .from('public_profiles')
        .select('id, full_name, bio, photo_url, empathy_ledger_profile_id, last_synced_at, synced_from_empathy_ledger')
        .not('empathy_ledger_profile_id', 'is', null);

      // Build sync candidates
      const candidateList: SyncCandidate[] = (elProfiles || []).map((elProfile: EmpathyLedgerProfile) => {
        const localProfile = localProfiles?.find(
          (lp: LocalProfile) => lp.empathy_ledger_profile_id === elProfile.id
        ) || null;

        let status: 'new' | 'update' | 'synced' | 'conflict' = 'new';
        const changes: string[] = [];

        if (localProfile) {
          // Compare fields to detect changes
          if (localProfile.full_name !== elProfile.display_name) {
            changes.push('name');
          }
          if (localProfile.bio !== elProfile.bio) {
            changes.push('bio');
          }
          if (localProfile.photo_url !== elProfile.avatar_url) {
            changes.push('photo');
          }

          if (changes.length > 0) {
            // Check if EL data is newer (if updated_at available)
            if (elProfile.updated_at) {
              const elUpdated = new Date(elProfile.updated_at).getTime();
              const localSynced = localProfile.last_synced_at
                ? new Date(localProfile.last_synced_at).getTime()
                : 0;

              if (elUpdated > localSynced) {
                status = 'update';
              } else {
                status = 'conflict'; // Local may have edits
              }
            } else {
              // No updated_at, assume it needs updating
              status = 'update';
            }
          } else {
            status = 'synced';
          }
        }

        return {
          empathyLedgerProfile: elProfile,
          localProfile,
          status,
          changes,
          selected: status === 'new' || status === 'update',
        };
      });

      setCandidates(candidateList);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sync candidates');
    } finally {
      setLoading(false);
    }
  }

  function toggleCandidate(index: number) {
    setCandidates(prev => prev.map((c, i) =>
      i === index ? { ...c, selected: !c.selected } : c
    ));
  }

  function selectAll() {
    setCandidates(prev => prev.map(c => ({ ...c, selected: true })));
  }

  function selectNone() {
    setCandidates(prev => prev.map(c => ({ ...c, selected: false })));
  }

  async function performSync() {
    const selectedCandidates = candidates.filter(c => c.selected);

    if (selectedCandidates.length === 0) {
      setError('No profiles selected for sync');
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/sync-empathy-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds: selectedCandidates.map(c => c.empathyLedgerProfile.id)
        })
      });

      if (!response.ok) {
        throw new Error('Sync request failed');
      }

      const result = await response.json();
      setSyncResult(result);

      // Reload candidates to reflect changes
      await loadCandidates();
    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  const newCount = candidates.filter(c => c.status === 'new').length;
  const updateCount = candidates.filter(c => c.status === 'update').length;
  const conflictCount = candidates.filter(c => c.status === 'conflict').length;
  const syncedCount = candidates.filter(c => c.status === 'synced').length;
  const selectedCount = candidates.filter(c => c.selected).length;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white page-content">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Checking access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <Link
            href="/admin/empathy-ledger"
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 mb-4 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Empathy Ledger
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-2">
            Sync Profiles
          </h1>
          <p className="text-lg text-earth-700">
            Review and sync profiles from Empathy Ledger to JusticeHub
          </p>
        </div>
      </section>

      <div className="container-justice py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-bold text-red-900">Error</div>
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {syncResult && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-600 flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-bold text-green-900">Sync Complete</div>
              <div className="text-green-800">{syncResult.message}</div>
              <div className="text-sm text-green-700 mt-1">
                Created: {syncResult.created} | Updated: {syncResult.updated} | Failed: {syncResult.failed}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="border-2 border-black p-4 bg-green-50">
            <div className="text-2xl font-black text-green-600">{newCount}</div>
            <div className="text-sm font-bold">New</div>
          </div>
          <div className="border-2 border-black p-4 bg-blue-50">
            <div className="text-2xl font-black text-blue-600">{updateCount}</div>
            <div className="text-sm font-bold">Updates</div>
          </div>
          <div className="border-2 border-black p-4 bg-orange-50">
            <div className="text-2xl font-black text-orange-600">{conflictCount}</div>
            <div className="text-sm font-bold">Conflicts</div>
          </div>
          <div className="border-2 border-black p-4 bg-gray-50">
            <div className="text-2xl font-black text-gray-600">{syncedCount}</div>
            <div className="text-sm font-bold">Up to Date</div>
          </div>
          <div className="border-2 border-black p-4 bg-violet-50">
            <div className="text-2xl font-black text-violet-600">{selectedCount}</div>
            <div className="text-sm font-bold">Selected</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            onClick={loadCandidates}
            disabled={loading}
            className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100"
          >
            Select All
          </button>
          <button
            onClick={selectNone}
            className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100"
          >
            Select None
          </button>
          <div className="flex-1" />
          <button
            onClick={performSync}
            disabled={syncing || selectedCount === 0}
            className="px-6 py-3 bg-violet-600 text-white border-2 border-black font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Download className="h-5 w-5" />
            {syncing ? 'Syncing...' : `Sync ${selectedCount} Profile${selectedCount !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-bold">Loading profiles...</p>
            </div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="border-2 border-black p-8 bg-gray-50 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-xl font-bold text-gray-700 mb-2">No Profiles Available</div>
            <div className="text-gray-600">
              No profiles in Empathy Ledger have JusticeHub sync enabled.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate, index) => (
              <div
                key={candidate.empathyLedgerProfile.id}
                className={`border-2 border-black p-4 ${
                  candidate.selected ? 'bg-violet-50' : 'bg-white'
                } hover:bg-violet-50 transition-colors`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCandidate(index)}
                    className={`w-6 h-6 border-2 border-black flex items-center justify-center ${
                      candidate.selected ? 'bg-violet-600 text-white' : 'bg-white'
                    }`}
                  >
                    {candidate.selected && <Check className="h-4 w-4" />}
                  </button>

                  {/* Avatar */}
                  {candidate.empathyLedgerProfile.avatar_url ? (
                    <img
                      src={candidate.empathyLedgerProfile.avatar_url}
                      alt={candidate.empathyLedgerProfile.display_name}
                      className="w-16 h-16 object-cover border-2 border-black"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 border-2 border-black flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">
                        {candidate.empathyLedgerProfile.display_name}
                      </span>
                      {/* Status Badge */}
                      {candidate.status === 'new' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold border border-green-800">
                          NEW
                        </span>
                      )}
                      {candidate.status === 'update' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold border border-blue-800">
                          UPDATE
                        </span>
                      )}
                      {candidate.status === 'conflict' && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold border border-orange-800">
                          CONFLICT
                        </span>
                      )}
                      {candidate.status === 'synced' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold border border-gray-800">
                          UP TO DATE
                        </span>
                      )}
                      {(candidate.empathyLedgerProfile.justicehub_featured || candidate.empathyLedgerProfile.is_justicehub_featured) && (
                        <span className="px-2 py-1 bg-violet-100 text-violet-800 text-xs font-bold border border-violet-800">
                          FEATURED
                        </span>
                      )}
                    </div>

                    {candidate.empathyLedgerProfile.justicehub_role && (
                      <div className="text-sm text-earth-600 mb-1">
                        Role: {candidate.empathyLedgerProfile.justicehub_role}
                      </div>
                    )}

                    {candidate.empathyLedgerProfile.bio && (
                      <p className="text-sm text-earth-700 line-clamp-2 mb-2">
                        {candidate.empathyLedgerProfile.bio}
                      </p>
                    )}

                    {/* Changes indicator */}
                    {candidate.changes.length > 0 && (
                      <div className="text-xs text-earth-600">
                        Changes: {candidate.changes.join(', ')}
                      </div>
                    )}

                    {/* Local profile link */}
                    {candidate.localProfile && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Clock className="h-4 w-4 text-earth-500" />
                        <span className="text-earth-600">
                          Last synced: {candidate.localProfile.last_synced_at
                            ? new Date(candidate.localProfile.last_synced_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                        <Link
                          href={`/admin/profiles/${candidate.localProfile.id}/connections`}
                          className="text-violet-600 hover:underline font-bold"
                        >
                          View Local
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
