/**
 * Story Sharing Module for JusticeHub
 *
 * Manages story visibility, sharing permissions, and access control.
 * Integrates with consent framework to ensure storyteller control.
 */

import { createClient } from '@/lib/supabase/server';
import { checkStoryAccess, verifyStoryConsent } from './consent-manager';
import type {
  StoryShareRecord,
  ShareRequest,
  ShareResult,
  SharePermission,
  ShareTargetType,
  StoryAccessLog,
  StorySharingConfig,
} from '@/types/consent';

// =============================================================================
// VISIBILITY CHECKING
// =============================================================================

export type UserRole = 'anonymous' | 'user' | 'mentor' | 'organization_admin' | 'storyteller' | 'admin';

interface VisibilityResult {
  canView: boolean;
  canShare: boolean;
  canDownload: boolean;
  canEmbed: boolean;
  reason?: string;
  restrictions: string[];
}

/**
 * Check what a user can do with a story
 */
export async function getStoryVisibility(
  storyId: string,
  userId?: string,
  userRole: UserRole = 'anonymous'
): Promise<VisibilityResult> {
  const supabase = await createClient();

  // Get story details
  const { data: story } = await supabase
    .from('stories')
    .select('*, storyteller_id, organization_id, privacy_level, is_public')
    .eq('id', storyId)
    .single();

  if (!story) {
    return {
      canView: false,
      canShare: false,
      canDownload: false,
      canEmbed: false,
      reason: 'Story not found',
      restrictions: [],
    };
  }

  // Storyteller always has full access
  if (userId && story.storyteller_id === userId) {
    return {
      canView: true,
      canShare: true,
      canDownload: true,
      canEmbed: true,
      restrictions: [],
    };
  }

  // Admin has full access
  if (userRole === 'admin') {
    return {
      canView: true,
      canShare: true,
      canDownload: true,
      canEmbed: true,
      restrictions: [],
    };
  }

  // Check consent status
  const consentCheck = await verifyStoryConsent(storyId);
  const restrictions: string[] = [...consentCheck.restrictions];

  // Check privacy level
  switch (story.privacy_level) {
    case 'private':
      // Only storyteller and explicit shares
      if (!userId) {
        return {
          canView: false,
          canShare: false,
          canDownload: false,
          canEmbed: false,
          reason: 'Private story',
          restrictions,
        };
      }
      // Check for explicit share
      const hasShare = await checkExplicitShare(storyId, userId);
      return {
        canView: hasShare,
        canShare: false,
        canDownload: false,
        canEmbed: false,
        reason: hasShare ? undefined : 'No access granted',
        restrictions,
      };

    case 'community':
    case 'organization':
      // Check organization membership
      if (!userId) {
        return {
          canView: false,
          canShare: false,
          canDownload: false,
          canEmbed: false,
          reason: 'Community-only content',
          restrictions,
        };
      }
      const isMember = await checkOrganizationMembership(userId, story.organization_id);
      return {
        canView: isMember,
        canShare: isMember && consentCheck.can_share,
        canDownload: false,
        canEmbed: false,
        reason: isMember ? undefined : 'Not a community member',
        restrictions,
      };

    case 'public':
    default:
      // Public stories - check consent
      return {
        canView: consentCheck.can_display,
        canShare: consentCheck.can_share,
        canDownload: consentCheck.consent_records.some(c => c.consent_type === 'media_usage'),
        canEmbed: consentCheck.can_share,
        reason: consentCheck.can_display ? undefined : 'Missing consent',
        restrictions,
      };
  }
}

/**
 * Check if a specific user can view a story
 */
export async function canUserViewStory(
  storyId: string,
  userId?: string
): Promise<boolean> {
  const visibility = await getStoryVisibility(storyId, userId);
  return visibility.canView;
}

// =============================================================================
// SHARING MANAGEMENT
// =============================================================================

/**
 * Share a story with a target
 */
export async function shareStory(request: ShareRequest, sharedById: string): Promise<ShareResult> {
  const supabase = await createClient();

  // Verify user can share this story
  const visibility = await getStoryVisibility(request.story_id, sharedById, 'user');
  if (!visibility.canShare) {
    return {
      success: false,
      error: 'You do not have permission to share this story',
    };
  }

  // Check consent
  const consentCheck = await checkStoryAccess(request.story_id, sharedById, 'share');
  if (!consentCheck.allowed) {
    return {
      success: false,
      error: consentCheck.reason || 'Sharing not permitted',
    };
  }

  // Create share record
  const { data: share, error } = await supabase
    .from('story_shares')
    .insert({
      story_id: request.story_id,
      shared_by_id: sharedById,
      target_type: request.target_type,
      target_id: request.target_id,
      permissions: request.permissions,
      valid_from: new Date().toISOString(),
      valid_until: request.valid_until,
      is_active: true,
      view_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating share:', error);
    return { success: false, error: 'Failed to create share' };
  }

  // Generate share URL if public
  let shareUrl: string | undefined;
  if (request.target_type === 'public') {
    shareUrl = `/stories/${request.story_id}?share=${share.id}`;
  }

  // Log access
  await logStoryAccess(request.story_id, sharedById, 'share', 'justicehub');

  return {
    success: true,
    share_id: share.id,
    share_url: shareUrl,
  };
}

/**
 * Revoke a share
 */
export async function revokeShare(
  shareId: string,
  revokedById: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get share and verify ownership
  const { data: share } = await supabase
    .from('story_shares')
    .select('*, stories(storyteller_id)')
    .eq('id', shareId)
    .single();

  if (!share) {
    return { success: false, error: 'Share not found' };
  }

  // Only storyteller or share creator can revoke
  const isOwner =
    share.shared_by_id === revokedById ||
    (share as any).stories?.storyteller_id === revokedById;

  if (!isOwner) {
    return { success: false, error: 'Not authorized to revoke this share' };
  }

  const { error } = await supabase
    .from('story_shares')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by_id: revokedById,
      revocation_reason: reason,
    })
    .eq('id', shareId);

  if (error) {
    console.error('Error revoking share:', error);
    return { success: false, error: 'Failed to revoke share' };
  }

  return { success: true };
}

/**
 * Get all shares for a story
 */
export async function getStoryShares(
  storyId: string,
  includeRevoked = false
): Promise<StoryShareRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from('story_shares')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false });

  if (!includeRevoked) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching shares:', error);
    return [];
  }

  return data as StoryShareRecord[];
}

/**
 * Update share permissions
 */
export async function updateSharePermissions(
  shareId: string,
  permissions: SharePermission[],
  updatedById: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify ownership
  const { data: share } = await supabase
    .from('story_shares')
    .select('shared_by_id')
    .eq('id', shareId)
    .single();

  if (!share || share.shared_by_id !== updatedById) {
    return { success: false, error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('story_shares')
    .update({
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shareId);

  if (error) {
    console.error('Error updating permissions:', error);
    return { success: false, error: 'Failed to update permissions' };
  }

  return { success: true };
}

// =============================================================================
// ACCESS LOGGING
// =============================================================================

/**
 * Log story access for analytics and audit
 */
export async function logStoryAccess(
  storyId: string,
  accessorId: string | undefined,
  accessType: StoryAccessLog['access_type'],
  accessContext: StoryAccessLog['access_context'],
  metadata?: {
    userAgent?: string;
    referrer?: string;
    shareRecordId?: string;
  }
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('story_access_log').insert({
    story_id: storyId,
    accessor_id: accessorId,
    accessor_type: accessorId ? 'user' : 'anonymous',
    access_type: accessType,
    access_context: accessContext,
    user_agent: metadata?.userAgent,
    referrer: metadata?.referrer,
    share_record_id: metadata?.shareRecordId,
    accessed_at: new Date().toISOString(),
  });

  // Update view count on share if applicable
  if (metadata?.shareRecordId) {
    await supabase.rpc('increment_share_view_count', {
      share_id: metadata.shareRecordId,
    });
  }
}

/**
 * Get access history for a story
 */
export async function getStoryAccessHistory(
  storyId: string,
  limit = 100
): Promise<StoryAccessLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('story_access_log')
    .select('*')
    .eq('story_id', storyId)
    .order('accessed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching access history:', error);
    return [];
  }

  return data as StoryAccessLog[];
}

// =============================================================================
// SHARING CONFIG
// =============================================================================

/**
 * Get sharing configuration for a story
 */
export async function getStorySharingConfig(storyId: string): Promise<StorySharingConfig> {
  const supabase = await createClient();

  const { data: story } = await supabase
    .from('stories')
    .select('sharing_config, organization_id')
    .eq('id', storyId)
    .single();

  // Default config
  const defaultConfig: StorySharingConfig = {
    allow_public_sharing: true,
    allow_embedding: false,
    allow_download: false,
    require_attribution: true,
    attribution_text: 'Story shared via JusticeHub with storyteller consent',
    allowed_platforms: ['justicehub', 'empathy_ledger'],
    blocked_platforms: [],
  };

  if (!story?.sharing_config) {
    return defaultConfig;
  }

  return { ...defaultConfig, ...story.sharing_config };
}

/**
 * Update sharing configuration
 */
export async function updateStorySharingConfig(
  storyId: string,
  config: Partial<StorySharingConfig>,
  updatedById: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify storyteller owns this story
  const { data: story } = await supabase
    .from('stories')
    .select('storyteller_id')
    .eq('id', storyId)
    .single();

  if (!story || story.storyteller_id !== updatedById) {
    return { success: false, error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('stories')
    .update({
      sharing_config: config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storyId);

  if (error) {
    console.error('Error updating sharing config:', error);
    return { success: false, error: 'Failed to update' };
  }

  return { success: true };
}

// =============================================================================
// HELPERS
// =============================================================================

async function checkExplicitShare(storyId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('story_shares')
    .select('id')
    .eq('story_id', storyId)
    .eq('target_id', userId)
    .eq('is_active', true)
    .single();

  return !!data;
}

async function checkOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  return !!data;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getStoryVisibility,
  canUserViewStory,
  shareStory,
  revokeShare,
  getStoryShares,
  updateSharePermissions,
  logStoryAccess,
  getStoryAccessHistory,
  getStorySharingConfig,
  updateStorySharingConfig,
};
