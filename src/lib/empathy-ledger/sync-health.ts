import {
  empathyLedgerClient,
  isEmpathyLedgerConfigured,
} from '@/lib/supabase/empathy-ledger';
import { createServiceClient } from '@/lib/supabase/service';

export interface ELSyncHealth {
  status: 'healthy' | 'stale' | 'broken' | 'unconfigured';
  configured: boolean;
  lastSyncedAt: string | null;
  elStoryCount: number | null;
  jhStoryCount: number;
  jhSyncedOrgCount: number;
  storyDelta: number | null;
  recommendations: string[];
}

/**
 * Check the health of the Empathy Ledger <-> JusticeHub sync.
 * Compares story counts and checks last sync timestamps.
 */
export async function getELSyncHealth(): Promise<ELSyncHealth> {
  const supabase = createServiceClient() as any;

  // JH side: count synced orgs and last sync time
  const { data: syncedOrgs } = await supabase
    .from('organizations')
    .select('id, last_synced_at')
    .eq('synced_from_empathy_ledger', true);

  const jhSyncedOrgCount = syncedOrgs?.length ?? 0;

  // Find most recent sync timestamp
  let lastSyncedAt: string | null = null;
  if (syncedOrgs && syncedOrgs.length > 0) {
    const timestamps = syncedOrgs
      .map((o: any) => o.last_synced_at)
      .filter(Boolean)
      .sort()
      .reverse();
    lastSyncedAt = timestamps[0] || null;
  }

  // JH side: count partner stories (synced from EL)
  const { count: jhStoryCount } = await supabase
    .from('partner_stories')
    .select('id', { count: 'exact', head: true });

  if (!isEmpathyLedgerConfigured) {
    return {
      status: 'unconfigured',
      configured: false,
      lastSyncedAt,
      elStoryCount: null,
      jhStoryCount: jhStoryCount ?? 0,
      jhSyncedOrgCount,
      storyDelta: null,
      recommendations: [
        'Empathy Ledger env vars not configured (EMPATHY_LEDGER_URL, EMPATHY_LEDGER_API_KEY)',
      ],
    };
  }

  // EL side: count public stories
  let elStoryCount: number | null = null;
  try {
    const { count } = await empathyLedgerClient
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true)
      .eq('privacy_level', 'public');
    elStoryCount = count;
  } catch {
    return {
      status: 'broken',
      configured: true,
      lastSyncedAt,
      elStoryCount: null,
      jhStoryCount: jhStoryCount ?? 0,
      jhSyncedOrgCount,
      storyDelta: null,
      recommendations: [
        'Failed to connect to Empathy Ledger database. Check env vars and network.',
      ],
    };
  }

  const recommendations: string[] = [];
  const storyDelta =
    elStoryCount !== null ? elStoryCount - (jhStoryCount ?? 0) : null;

  // Check staleness
  let status: ELSyncHealth['status'] = 'healthy';

  if (lastSyncedAt) {
    const daysSinceSync = Math.floor(
      (Date.now() - new Date(lastSyncedAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceSync > 7) {
      status = 'stale';
      recommendations.push(
        `Last sync was ${daysSinceSync} days ago. Run push-sync to refresh.`,
      );
    }
  } else if (jhSyncedOrgCount === 0) {
    status = 'stale';
    recommendations.push(
      'No organizations synced from Empathy Ledger yet. Run initial sync.',
    );
  }

  if (storyDelta !== null && storyDelta > 10) {
    recommendations.push(
      `${storyDelta} public EL stories not yet synced to JH partner_stories.`,
    );
  }

  if (jhSyncedOrgCount === 0) {
    recommendations.push(
      'No orgs linked to EL. Check empathy_ledger_org_id on organizations table.',
    );
  }

  return {
    status,
    configured: true,
    lastSyncedAt,
    elStoryCount,
    jhStoryCount: jhStoryCount ?? 0,
    jhSyncedOrgCount,
    storyDelta,
    recommendations,
  };
}
