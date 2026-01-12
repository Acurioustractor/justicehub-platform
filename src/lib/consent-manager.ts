/**
 * Consent Manager for JusticeHub
 *
 * Handles consent workflows, verification, and integration with Empathy Ledger.
 * Ensures storytellers maintain control over their stories.
 */

import { createClient } from '@/lib/supabase/server';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import type {
  ConsentRecord,
  ConsentStatus,
  ConsentType,
  ConsentDetails,
  ConsentVerification,
  ConsentCheckResult,
  ConsentForm,
  ConsentSummary,
} from '@/types/consent';

// =============================================================================
// CONSENT CHECKING
// =============================================================================

/**
 * Verify all consent requirements for a story
 */
export async function verifyStoryConsent(storyId: string): Promise<ConsentVerification> {
  const supabase = await createClient();

  // Get all consent records for this story
  const { data: consents, error } = await supabase
    .from('consent_records')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching consent records:', error);
    return createEmptyVerification(storyId);
  }

  const validConsents = (consents || []).filter(
    (c) => c.status === 'granted' && !isConsentExpired(c)
  );

  const grantedTypes = new Set(validConsents.map((c) => c.consent_type));
  const requiredTypes: ConsentType[] = ['story_sharing', 'name_attribution'];
  const missingConsents = requiredTypes.filter((t) => !grantedTypes.has(t));

  // Check cultural requirements
  const culturalCheck = await checkCulturalRequirements(storyId);

  return {
    story_id: storyId,
    has_valid_consent: missingConsents.length === 0,
    consent_records: validConsents as ConsentRecord[],
    missing_consents: missingConsents,
    cultural_requirements_met: culturalCheck.met,
    cultural_warnings: culturalCheck.warnings,
    can_display: missingConsents.length === 0 && culturalCheck.met,
    can_share: grantedTypes.has('story_sharing') && culturalCheck.met,
    can_syndicate: grantedTypes.has('syndication') && culturalCheck.met,
    restrictions: culturalCheck.restrictions,
  };
}

/**
 * Check if user can access a story based on consent
 */
export async function checkStoryAccess(
  storyId: string,
  userId?: string,
  accessType: 'view' | 'share' | 'download' | 'embed' = 'view'
): Promise<ConsentCheckResult> {
  const verification = await verifyStoryConsent(storyId);

  // Check basic display permission
  if (!verification.can_display) {
    return {
      allowed: false,
      reason: 'Story does not have valid consent for display',
      required_actions: verification.missing_consents.map(
        (c) => `Obtain ${c} consent`
      ),
    };
  }

  // Check specific access type
  switch (accessType) {
    case 'share':
      if (!verification.can_share) {
        return {
          allowed: false,
          reason: 'Story sharing not permitted',
          required_actions: ['Obtain story_sharing consent'],
        };
      }
      break;

    case 'download':
    case 'embed':
      // These require explicit media_usage consent
      const hasMediaConsent = verification.consent_records.some(
        (c) => c.consent_type === 'media_usage'
      );
      if (!hasMediaConsent) {
        return {
          allowed: false,
          reason: `${accessType} requires media usage consent`,
          required_actions: ['Obtain media_usage consent'],
        };
      }
      break;
  }

  // Check cultural restrictions
  if (verification.restrictions.length > 0) {
    return {
      allowed: true,
      reason: 'Access allowed with restrictions',
      required_actions: verification.restrictions,
    };
  }

  return { allowed: true };
}

// =============================================================================
// CONSENT MANAGEMENT
// =============================================================================

/**
 * Request consent from a storyteller
 */
export async function requestConsent(
  storytellerId: string,
  storyId: string,
  consentType: ConsentType,
  requestedBy: string
): Promise<{ success: boolean; form_id?: string; error?: string }> {
  const supabase = await createClient();

  // Check if there's already a pending request
  const { data: existing } = await supabase
    .from('consent_records')
    .select('id, status')
    .eq('story_id', storyId)
    .eq('storyteller_id', storytellerId)
    .eq('consent_type', consentType)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return { success: false, error: 'Consent request already pending' };
  }

  // Create new consent record
  const { data: record, error } = await supabase
    .from('consent_records')
    .insert({
      story_id: storyId,
      storyteller_id: storytellerId,
      consent_type: consentType,
      status: 'pending',
      consent_details: {
        requested_by: requestedBy,
        requested_at: new Date().toISOString(),
      },
      version: 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating consent request:', error);
    return { success: false, error: 'Failed to create consent request' };
  }

  // TODO: See issue #3 in justicehub-platform: Send notification to storyteller

  return { success: true, form_id: record.id };
}

/**
 * Grant consent
 */
export async function grantConsent(
  recordId: string,
  details: Partial<ConsentDetails>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('consent_records')
    .update({
      status: 'granted',
      granted_at: new Date().toISOString(),
      consent_details: details,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error granting consent:', error);
    return { success: false, error: 'Failed to grant consent' };
  }

  // Log consent event
  await logConsentEvent(recordId, 'granted', details);

  return { success: true };
}

/**
 * Revoke consent
 */
export async function revokeConsent(
  recordId: string,
  reason?: string,
  revokedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('consent_records')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      consent_details: {
        revocation_reason: reason,
        revoked_by: revokedBy,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('status', 'granted');

  if (error) {
    console.error('Error revoking consent:', error);
    return { success: false, error: 'Failed to revoke consent' };
  }

  // Log consent event
  await logConsentEvent(recordId, 'revoked', { reason, revoked_by: revokedBy });

  // Trigger downstream effects (remove from syndication, etc.)
  await handleConsentRevocation(recordId);

  return { success: true };
}

/**
 * Get consent summary for a story
 */
export async function getConsentSummary(storyId: string): Promise<ConsentSummary | null> {
  const supabase = await createClient();

  // Get story with storyteller info
  const { data: story } = await supabase
    .from('stories')
    .select('id, storyteller_id, storytellers(display_name)')
    .eq('id', storyId)
    .single();

  if (!story) return null;

  // Get consent records
  const { data: consents } = await supabase
    .from('consent_records')
    .select('*')
    .eq('story_id', storyId)
    .order('updated_at', { ascending: false });

  const validConsents = (consents || []).filter(
    (c) => c.status === 'granted' && !isConsentExpired(c)
  );
  const pendingConsents = (consents || []).filter((c) => c.status === 'pending');

  // Get cultural protocols
  const culturalCheck = await checkCulturalRequirements(storyId);

  return {
    story_id: storyId,
    storyteller_name: (story as any).storytellers?.display_name || 'Unknown',
    consent_status: validConsents.length > 0 ? 'granted' : 'pending',
    granted_permissions: validConsents.map((c) => c.consent_type) as ConsentType[],
    pending_permissions: pendingConsents.map((c) => c.consent_type) as ConsentType[],
    cultural_protocols: culturalCheck.protocols,
    requires_elder_approval: culturalCheck.requiresElderApproval,
    elder_approval_status: culturalCheck.elderApprovalStatus,
    last_updated: consents?.[0]?.updated_at || new Date().toISOString(),
  };
}

// =============================================================================
// EMPATHY LEDGER SYNC
// =============================================================================

/**
 * Sync consent status with Empathy Ledger
 */
export async function syncConsentWithEmpathyLedger(
  storyId: string,
  empathyLedgerStoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get local consent status
    const verification = await verifyStoryConsent(storyId);

    // Update Empathy Ledger story
    const { error } = await empathyLedgerClient
      .from('stories')
      .update({
        has_explicit_consent: verification.has_valid_consent,
        consent_details: {
          justicehub_consent: verification.consent_records.map((c) => ({
            type: c.consent_type,
            status: c.status,
            granted_at: c.granted_at,
          })),
          synced_at: new Date().toISOString(),
        },
      })
      .eq('id', empathyLedgerStoryId);

    if (error) {
      console.error('Error syncing consent to Empathy Ledger:', error);
      return { success: false, error: 'Sync failed' };
    }

    return { success: true };
  } catch (err) {
    console.error('Empathy Ledger sync error:', err);
    return { success: false, error: 'Sync failed' };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function isConsentExpired(consent: any): boolean {
  if (!consent.expires_at) return false;
  return new Date(consent.expires_at) < new Date();
}

function createEmptyVerification(storyId: string): ConsentVerification {
  return {
    story_id: storyId,
    has_valid_consent: false,
    consent_records: [],
    missing_consents: ['story_sharing', 'name_attribution'],
    cultural_requirements_met: false,
    cultural_warnings: [],
    can_display: false,
    can_share: false,
    can_syndicate: false,
    restrictions: [],
  };
}

async function checkCulturalRequirements(storyId: string): Promise<{
  met: boolean;
  warnings: string[];
  restrictions: string[];
  protocols: string[];
  requiresElderApproval: boolean;
  elderApprovalStatus?: 'pending' | 'approved' | 'rejected';
}> {
  const supabase = await createClient();

  // Get story with organization
  const { data: story } = await supabase
    .from('stories')
    .select('*, organizations(*)')
    .eq('id', storyId)
    .single();

  if (!story) {
    return {
      met: true,
      warnings: [],
      restrictions: [],
      protocols: [],
      requiresElderApproval: false,
    };
  }

  const org = (story as any).organizations;
  const warnings: string[] = [];
  const restrictions: string[] = [];
  const protocols: string[] = [];

  // Check if organization requires elder approval
  const requiresElderApproval = org?.elder_approval_required || false;

  if (requiresElderApproval) {
    if (!story.elder_approved_by) {
      warnings.push('This story requires elder approval before sharing');
      restrictions.push('Obtain elder approval');
    }
  }

  // Check cultural sensitivity
  if (story.cultural_sensitivity_level === 'restricted') {
    warnings.push('This story contains culturally sensitive content');
  }

  // Add cultural warnings from story
  if (story.cultural_warnings?.length > 0) {
    warnings.push(...story.cultural_warnings);
  }

  // Add organization protocols
  if (org?.cultural_protocols) {
    const orgProtocols = Array.isArray(org.cultural_protocols)
      ? org.cultural_protocols
      : [];
    protocols.push(...orgProtocols);
  }

  return {
    met: restrictions.length === 0,
    warnings,
    restrictions,
    protocols,
    requiresElderApproval,
    elderApprovalStatus: story.elder_approved_by ? 'approved' : requiresElderApproval ? 'pending' : undefined,
  };
}

async function logConsentEvent(
  recordId: string,
  action: string,
  details: any
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('consent_audit_log').insert({
    consent_record_id: recordId,
    action,
    details,
    created_at: new Date().toISOString(),
  });
}

async function handleConsentRevocation(recordId: string): Promise<void> {
  const supabase = await createClient();

  // Get the consent record
  const { data: consent } = await supabase
    .from('consent_records')
    .select('story_id, consent_type')
    .eq('id', recordId)
    .single();

  if (!consent) return;

  // If syndication consent was revoked, remove from Empathy Ledger syndication
  if (consent.consent_type === 'syndication') {
    // Mark story as no longer syndicated
    await supabase
      .from('stories')
      .update({ syndication_enabled: false })
      .eq('id', consent.story_id);
  }

  // Deactivate any active shares
  if (consent.consent_type === 'story_sharing') {
    await supabase
      .from('story_shares')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('story_id', consent.story_id);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  verifyStoryConsent,
  checkStoryAccess,
  requestConsent,
  grantConsent,
  revokeConsent,
  getConsentSummary,
  syncConsentWithEmpathyLedger,
};
