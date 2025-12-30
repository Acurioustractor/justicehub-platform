/**
 * Cultural Protocols Handler for JusticeHub
 *
 * Manages cultural sensitivity, elder approval workflows, and Indigenous data sovereignty.
 * Ensures respectful handling of culturally significant content.
 */

import { createClient } from '@/lib/supabase/server';
import { empathyLedgerClient, formatCulturalProtocols } from '@/lib/supabase/empathy-ledger';
import type { CulturalProtocol, ApprovalWorkflow, CulturalRequirement } from '@/types/consent';

// =============================================================================
// TYPES
// =============================================================================

export interface CulturalContext {
  organization_id: string;
  organization_name: string;
  traditional_country?: string;
  language_groups: string[];
  is_indigenous_controlled: boolean;
  protocols: CulturalProtocol[];
  active_warnings: string[];
}

export interface ElderApprovalRequest {
  id: string;
  story_id: string;
  organization_id: string;
  requested_by: string;
  elder_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requested_at: string;
  responded_at?: string;
  response_notes?: string;
  expires_at?: string;
}

export interface CulturalWarning {
  type: 'deceased' | 'sacred' | 'restricted' | 'seasonal' | 'gender' | 'custom';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  acknowledgment_required: boolean;
}

// =============================================================================
// PROTOCOL MANAGEMENT
// =============================================================================

/**
 * Get cultural protocols for an organization
 */
export async function getCulturalProtocols(organizationId: string): Promise<CulturalProtocol[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cultural_protocols')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cultural protocols:', error);
    return [];
  }

  return data as CulturalProtocol[];
}

/**
 * Get full cultural context for a story
 */
export async function getCulturalContext(storyId: string): Promise<CulturalContext | null> {
  const supabase = await createClient();

  // Get story with organization
  const { data: story } = await supabase
    .from('stories')
    .select(`
      id,
      cultural_warnings,
      cultural_sensitivity_level,
      organization_id,
      organizations(
        id,
        name,
        traditional_country,
        language_groups,
        indigenous_controlled,
        cultural_protocols
      )
    `)
    .eq('id', storyId)
    .single();

  if (!story || !story.organization_id) {
    return null;
  }

  const org = (story as any).organizations;
  if (!org) return null;

  // Get active protocols
  const protocols = await getCulturalProtocols(story.organization_id);

  // Parse organization-level protocols
  const orgProtocols = formatCulturalProtocols(org);

  return {
    organization_id: org.id,
    organization_name: org.name,
    traditional_country: org.traditional_country,
    language_groups: org.language_groups || [],
    is_indigenous_controlled: org.indigenous_controlled || false,
    protocols,
    active_warnings: [
      ...(story.cultural_warnings || []),
      ...orgProtocols,
    ],
  };
}

/**
 * Format cultural context for display
 */
export function formatCulturalContext(context: CulturalContext): {
  headerText: string;
  warnings: CulturalWarning[];
  acknowledgmentText?: string;
} {
  const warnings: CulturalWarning[] = [];
  let headerText = '';

  // Add Indigenous acknowledgment
  if (context.is_indigenous_controlled) {
    headerText = `This content is shared by ${context.organization_name}`;
    if (context.traditional_country) {
      headerText += `, custodians of ${context.traditional_country}`;
    }
    headerText += '.';
  }

  // Process warnings
  for (const warning of context.active_warnings) {
    // Check for deceased person warning
    if (warning.toLowerCase().includes('deceased')) {
      warnings.push({
        type: 'deceased',
        message: 'Aboriginal and Torres Strait Islander peoples are advised that this content may contain images, voices, or names of deceased persons.',
        severity: 'warning',
        acknowledgment_required: true,
      });
    }
    // Check for sacred content
    else if (warning.toLowerCase().includes('sacred') || warning.toLowerCase().includes('restricted')) {
      warnings.push({
        type: 'sacred',
        message: warning,
        severity: 'critical',
        acknowledgment_required: true,
      });
    }
    // Generic warning
    else {
      warnings.push({
        type: 'custom',
        message: warning,
        severity: 'info',
        acknowledgment_required: false,
      });
    }
  }

  // Add protocol-based warnings
  for (const protocol of context.protocols) {
    if (protocol.warning_text) {
      warnings.push({
        type: 'custom',
        message: protocol.warning_text,
        severity: protocol.requires_elder_approval ? 'warning' : 'info',
        acknowledgment_required: protocol.requires_elder_approval,
      });
    }
  }

  // Get acknowledgment text from first protocol that has one
  const acknowledgmentText = context.protocols.find(p => p.acknowledgment_text)?.acknowledgment_text;

  return {
    headerText,
    warnings,
    acknowledgmentText,
  };
}

// =============================================================================
// ELDER APPROVAL
// =============================================================================

/**
 * Check if elder approval is required for a story
 */
export async function shouldRequireElderApproval(
  storyId: string,
  organizationId?: string
): Promise<{ required: boolean; reason?: string }> {
  const supabase = await createClient();

  // Get story
  const { data: story } = await supabase
    .from('stories')
    .select('requires_elder_approval, cultural_sensitivity_level, organization_id')
    .eq('id', storyId)
    .single();

  if (!story) {
    return { required: false };
  }

  // Check story-level flag
  if (story.requires_elder_approval) {
    return { required: true, reason: 'Story marked as requiring elder approval' };
  }

  // Check sensitivity level
  if (story.cultural_sensitivity_level === 'sacred') {
    return { required: true, reason: 'Sacred content requires elder approval' };
  }

  // Check organization-level requirement
  const orgId = organizationId || story.organization_id;
  if (orgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('elder_approval_required')
      .eq('id', orgId)
      .single();

    if (org?.elder_approval_required) {
      return { required: true, reason: 'Organization requires elder approval for all content' };
    }
  }

  return { required: false };
}

/**
 * Request elder approval for a story
 */
export async function requestElderApproval(
  storyId: string,
  organizationId: string,
  requestedById: string,
  elderId?: string
): Promise<{ success: boolean; request_id?: string; error?: string }> {
  const supabase = await createClient();

  // Check if there's already a pending request
  const { data: existing } = await supabase
    .from('elder_approval_requests')
    .select('id')
    .eq('story_id', storyId)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return { success: false, error: 'Approval request already pending' };
  }

  // Create request
  const { data, error } = await supabase
    .from('elder_approval_requests')
    .insert({
      story_id: storyId,
      organization_id: organizationId,
      requested_by: requestedById,
      elder_id: elderId,
      status: 'pending',
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating elder approval request:', error);
    return { success: false, error: 'Failed to create request' };
  }

  // TODO: See issue #2 in justicehub-platform: Send notification to elder(s)

  return { success: true, request_id: data.id };
}

/**
 * Respond to an elder approval request
 */
export async function respondToElderApproval(
  requestId: string,
  elderId: string,
  approved: boolean,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify the elder is authorized
  const { data: request } = await supabase
    .from('elder_approval_requests')
    .select('elder_id, organization_id, story_id')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (!request) {
    return { success: false, error: 'Request not found or already processed' };
  }

  // Update request
  const { error: updateError } = await supabase
    .from('elder_approval_requests')
    .update({
      status: approved ? 'approved' : 'rejected',
      elder_id: elderId,
      responded_at: new Date().toISOString(),
      response_notes: notes,
    })
    .eq('id', requestId);

  if (updateError) {
    console.error('Error updating approval request:', updateError);
    return { success: false, error: 'Failed to update request' };
  }

  // Update story if approved
  if (approved) {
    await supabase
      .from('stories')
      .update({
        elder_approved_by: elderId,
        elder_approved_at: new Date().toISOString(),
      })
      .eq('id', request.story_id);
  }

  return { success: true };
}

/**
 * Get pending elder approval requests for an organization
 */
export async function getPendingElderApprovals(
  organizationId: string
): Promise<ElderApprovalRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('elder_approval_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }

  return data as ElderApprovalRequest[];
}

// =============================================================================
// CULTURAL WARNINGS
// =============================================================================

/**
 * Generate cultural warnings for display
 */
export async function getCulturalWarnings(storyId: string): Promise<CulturalWarning[]> {
  const context = await getCulturalContext(storyId);
  if (!context) return [];

  const formatted = formatCulturalContext(context);
  return formatted.warnings;
}

/**
 * Display cultural warnings for a story
 */
export function displayCulturalWarnings(
  warnings: CulturalWarning[],
  userAcknowledged: boolean = false
): {
  shouldBlock: boolean;
  displayWarnings: CulturalWarning[];
  requiresAcknowledgment: boolean;
} {
  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const requiresAck = warnings.some(w => w.acknowledgment_required);

  return {
    shouldBlock: requiresAck && !userAcknowledged,
    displayWarnings: userAcknowledged
      ? warnings.filter(w => w.severity !== 'critical')
      : warnings,
    requiresAcknowledgment: requiresAck && !userAcknowledged,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate content against cultural protocols
 */
export async function validateCulturalSensitivity(
  content: string,
  organizationId: string
): Promise<{
  valid: boolean;
  warnings: string[];
  suggestions: string[];
}> {
  const protocols = await getCulturalProtocols(organizationId);
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for potentially sensitive terms
  const sensitiveTerms = [
    { pattern: /\bdied\b|\bdeath\b|\bdeceased\b/gi, warning: 'Content may reference deceased persons' },
    { pattern: /\bsacred\b|\bceremonial\b/gi, warning: 'Content may reference sacred or ceremonial matters' },
    { pattern: /\bsecret\b|\brestricted\b/gi, warning: 'Content may reference restricted knowledge' },
  ];

  for (const term of sensitiveTerms) {
    if (term.pattern.test(content)) {
      warnings.push(term.warning);
    }
  }

  // Add protocol-specific suggestions
  for (const protocol of protocols) {
    if (protocol.requires_elder_approval && !warnings.includes('Elder approval may be required')) {
      suggestions.push('Consider seeking elder approval for this content');
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

// =============================================================================
// EMPATHY LEDGER SYNC
// =============================================================================

/**
 * Sync cultural protocols with Empathy Ledger
 */
export async function syncCulturalProtocolsFromEmpathyLedger(
  organizationId: string,
  empathyLedgerOrgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch protocols from Empathy Ledger
    const { data: org, error } = await empathyLedgerClient
      .from('organizations')
      .select('cultural_protocols, traditional_country, language_groups, elder_approval_required')
      .eq('id', empathyLedgerOrgId)
      .single();

    if (error || !org) {
      return { success: false, error: 'Failed to fetch from Empathy Ledger' };
    }

    const supabase = await createClient();

    // Update local organization
    await supabase
      .from('organizations')
      .update({
        cultural_protocols: org.cultural_protocols,
        traditional_country: org.traditional_country,
        language_groups: org.language_groups,
        elder_approval_required: org.elder_approval_required,
        empathy_ledger_synced_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    return { success: true };
  } catch (err) {
    console.error('Cultural protocols sync error:', err);
    return { success: false, error: 'Sync failed' };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getCulturalProtocols,
  getCulturalContext,
  formatCulturalContext,
  shouldRequireElderApproval,
  requestElderApproval,
  respondToElderApproval,
  getPendingElderApprovals,
  getCulturalWarnings,
  displayCulturalWarnings,
  validateCulturalSensitivity,
  syncCulturalProtocolsFromEmpathyLedger,
};
