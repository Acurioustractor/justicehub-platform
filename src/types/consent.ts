/**
 * Consent and Story Sharing Types for JusticeHub
 *
 * This module defines the consent framework for managing story ownership,
 * sharing permissions, and cultural protocols integration with Empathy Ledger.
 */

// =============================================================================
// CONSENT STATUS & TYPES
// =============================================================================

export type ConsentStatus = 'pending' | 'granted' | 'revoked' | 'expired';

export type ConsentType =
  | 'story_sharing'      // Permission to share story externally
  | 'media_usage'        // Permission to use photos/videos
  | 'name_attribution'   // Permission to display storyteller name
  | 'location_sharing'   // Permission to share location data
  | 'syndication'        // Permission for Empathy Ledger syndication
  | 'research'           // Permission for research/advocacy use
  | 'commercial';        // Permission for commercial use (rare)

export type CulturalSensitivityLevel =
  | 'public'             // Safe for general public
  | 'community'          // Suitable for community members
  | 'restricted'         // Requires cultural context
  | 'sacred';            // Requires elder approval

// =============================================================================
// CONSENT RECORDS
// =============================================================================

export interface ConsentRecord {
  id: string;
  story_id: string;
  storyteller_id: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  granted_at?: string;
  revoked_at?: string;
  expires_at?: string;
  consent_details: ConsentDetails;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ConsentDetails {
  // What was consented to
  scope: ConsentScope;
  // How consent was obtained
  method: 'written' | 'verbal' | 'digital' | 'recorded';
  // Who witnessed/verified
  witnessed_by?: string;
  witness_role?: string;
  // Cultural considerations
  elder_approved?: boolean;
  elder_id?: string;
  community_reviewed?: boolean;
  // Restrictions
  restrictions?: string[];
  // Digital signature or reference
  signature_url?: string;
  form_version?: string;
}

export interface ConsentScope {
  // Platforms allowed
  platforms: ('justicehub' | 'empathy_ledger' | 'external')[];
  // Audiences
  audiences: ('public' | 'community' | 'organization' | 'researchers')[];
  // Media types
  media_types: ('text' | 'photo' | 'video' | 'audio')[];
  // Time bounds
  duration?: 'permanent' | 'time_limited';
  expires_at?: string;
}

// =============================================================================
// CONSENT FORM
// =============================================================================

export interface ConsentForm {
  id: string;
  template_id: string;
  story_id: string;
  storyteller_id: string;
  organization_id?: string;

  // Form content
  title: string;
  description: string;
  sections: ConsentFormSection[];

  // State
  status: 'draft' | 'sent' | 'viewed' | 'completed' | 'expired';
  sent_at?: string;
  viewed_at?: string;
  completed_at?: string;

  // Cultural requirements
  requires_elder_approval: boolean;
  requires_community_review: boolean;
  cultural_protocol_id?: string;

  // Responses
  responses: ConsentFormResponse[];

  created_at: string;
  updated_at: string;
}

export interface ConsentFormSection {
  id: string;
  type: 'info' | 'checkbox' | 'signature' | 'media_consent' | 'cultural_acknowledgment';
  title: string;
  content: string;
  required: boolean;
  consent_type?: ConsentType;
}

export interface ConsentFormResponse {
  section_id: string;
  response: boolean | string;
  responded_at: string;
}

export interface ConsentTemplate {
  id: string;
  name: string;
  description: string;
  organization_id?: string; // Null = global template
  sections: ConsentFormSection[];
  cultural_protocols?: CulturalProtocol[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CULTURAL PROTOCOLS
// =============================================================================

export interface CulturalProtocol {
  id: string;
  organization_id: string;
  name: string;
  description: string;

  // Cultural context
  traditional_country?: string;
  language_groups?: string[];
  cultural_significance: string;

  // Requirements
  requirements: CulturalRequirement[];

  // Display
  warning_text?: string;
  acknowledgment_text?: string;

  // Approval workflow
  requires_elder_approval: boolean;
  elder_ids?: string[];
  approval_workflow?: ApprovalWorkflow;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CulturalRequirement {
  type: 'elder_approval' | 'community_review' | 'time_restriction' | 'audience_restriction' | 'custom';
  description: string;
  mandatory: boolean;
  metadata?: Record<string, unknown>;
}

export interface ApprovalWorkflow {
  steps: ApprovalStep[];
  current_step: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
}

export interface ApprovalStep {
  order: number;
  approver_type: 'elder' | 'community_leader' | 'organization_admin';
  approver_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  notes?: string;
}

// =============================================================================
// SHARING & PERMISSIONS
// =============================================================================

export type SharePermission = 'view' | 'comment' | 'share' | 'download' | 'embed';

export type ShareTargetType =
  | 'user'
  | 'organization'
  | 'role'
  | 'public'
  | 'community';

export interface StoryShareRecord {
  id: string;
  story_id: string;
  shared_by_id: string;

  // Target
  target_type: ShareTargetType;
  target_id?: string; // Null for public/community

  // Permissions
  permissions: SharePermission[];

  // Validity
  valid_from: string;
  valid_until?: string;
  is_active: boolean;

  // Tracking
  view_count: number;
  last_viewed_at?: string;

  // Revocation
  revoked_at?: string;
  revoked_by_id?: string;
  revocation_reason?: string;

  created_at: string;
  updated_at: string;
}

export interface ShareRequest {
  story_id: string;
  target_type: ShareTargetType;
  target_id?: string;
  permissions: SharePermission[];
  message?: string;
  valid_until?: string;
}

// =============================================================================
// ACCESS LOG
// =============================================================================

export interface StoryAccessLog {
  id: string;
  story_id: string;
  accessor_id?: string; // Null for anonymous
  accessor_type: 'user' | 'api' | 'embed' | 'anonymous';

  access_type: 'view' | 'download' | 'embed' | 'share' | 'export';
  access_context: 'justicehub' | 'empathy_ledger' | 'external' | 'api';

  // Request metadata
  ip_address?: string;
  user_agent?: string;
  referrer?: string;

  // Consent at time of access
  consent_record_id?: string;
  share_record_id?: string;

  accessed_at: string;
}

// =============================================================================
// CONSENT VERIFICATION
// =============================================================================

export interface ConsentVerification {
  story_id: string;
  has_valid_consent: boolean;
  consent_records: ConsentRecord[];
  missing_consents: ConsentType[];
  cultural_requirements_met: boolean;
  cultural_warnings: string[];
  can_display: boolean;
  can_share: boolean;
  can_syndicate: boolean;
  restrictions: string[];
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface ConsentCheckResult {
  allowed: boolean;
  reason?: string;
  required_actions?: string[];
  consent_form_url?: string;
}

export interface ShareResult {
  success: boolean;
  share_id?: string;
  error?: string;
  share_url?: string;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export interface ConsentSummary {
  story_id: string;
  storyteller_name: string;
  consent_status: ConsentStatus;
  granted_permissions: ConsentType[];
  pending_permissions: ConsentType[];
  cultural_protocols: string[];
  requires_elder_approval: boolean;
  elder_approval_status?: 'pending' | 'approved' | 'rejected';
  last_updated: string;
}

export interface StorySharingConfig {
  allow_public_sharing: boolean;
  allow_embedding: boolean;
  allow_download: boolean;
  require_attribution: boolean;
  attribution_text?: string;
  allowed_platforms: string[];
  blocked_platforms: string[];
}
