export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  contactInfo: ContactInfo;
  settings: OrganizationSettings;
  airtableConfig?: AirtableConfig;
  branding: OrganizationBranding;
  subscription: OrganizationSubscription;
  stats: OrganizationStats;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: Address;
  website?: string;
  socialLinks?: SocialLinks;
  primaryContact: ContactPerson;
  emergencyContact?: ContactPerson;
}

export interface ContactPerson {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
}

export interface OrganizationSettings {
  allowPublicStories: boolean;
  requireMentorApproval: boolean;
  autoMatchOpportunities: boolean;
  enableAnalytics: boolean;
  enableAirtableSync: boolean;
  enableApprenticeships: boolean;
  requireParentalConsent: boolean;
  enableGroupMentoring: boolean;
  customDomainEnabled: boolean;
  ssoEnabled: boolean;
}

export interface AirtableConfig {
  baseId: string;
  apiKey: string;
  storiesTable: string;
  syncEnabled: boolean;
  syncFrequency: SyncFrequency;
  lastSyncAt?: Date;
  fieldMapping: AirtableFieldMapping;
  syncFilters: AirtableSyncFilters;
}

export interface AirtableFieldMapping {
  title: string;
  content: string;
  tags: string;
  storyType: string;
  visibility: string;
  createdDate: string;
  author: string;
  media: string;
}

export interface AirtableSyncFilters {
  includePublished: boolean;
  includeDrafts: boolean;
  tagFilters: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface OrganizationBranding {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCss?: string;
  favicon?: string;
  headerImage?: string;
}

export interface OrganizationSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  features: string[];
  limits: SubscriptionLimits;
  billing: BillingInfo;
}

export interface SubscriptionLimits {
  maxUsers: number;
  maxStoriesPerMonth: number;
  maxStorageGB: number;
  maxMentors: number;
  maxApprentices: number;
}

export interface BillingInfo {
  frequency: BillingFrequency;
  amount: number;
  currency: string;
  nextBillingDate?: Date;
  paymentMethod?: string;
  invoiceEmail: string;
}

export interface OrganizationStats {
  totalUsers: number;
  activeUsers: number;
  totalStories: number;
  storiesThisMonth: number;
  totalMentorships: number;
  activeMentorships: number;
  totalOpportunities: number;
  activeOpportunities: number;
  engagementRate: number;
  storageUsedGB: number;
  lastUpdated: Date;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  status: InviteStatus;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  permissions: Permission[];
  joinedAt: Date;
  isActive: boolean;
  lastActiveAt: Date;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface OrganizationReport {
  id: string;
  organizationId: string;
  type: ReportType;
  title: string;
  description: string;
  period: ReportPeriod;
  data: Record<string, any>;
  generatedAt: Date;
  generatedBy: string;
  isPublic: boolean;
  downloadUrl?: string;
}

export interface OrganizationIntegration {
  id: string;
  organizationId: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  status: IntegrationStatus;
  lastSyncAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums and types
export type OrganizationType = 'nonprofit' | 'government' | 'educational' | 'community' | 'corporate' | 'other';
export type SyncFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired';
export type BillingFrequency = 'monthly' | 'yearly';
export type UserRole = 'youth' | 'mentor' | 'organization_staff' | 'admin' | 'apprentice';
export type OrganizationRole = 'member' | 'moderator' | 'admin' | 'owner';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type ReportType = 'impact' | 'engagement' | 'stories' | 'mentorship' | 'opportunities' | 'custom';
export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type IntegrationType = 'airtable' | 'salesforce' | 'mailchimp' | 'slack' | 'teams' | 'zoom';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

// Organization management types
export interface OrganizationCreate {
  name: string;
  type: OrganizationType;
  contactInfo: ContactInfo;
  settings?: Partial<OrganizationSettings>;
  branding?: Partial<OrganizationBranding>;
}

export interface OrganizationUpdate {
  name?: string;
  type?: OrganizationType;
  contactInfo?: Partial<ContactInfo>;
  settings?: Partial<OrganizationSettings>;
  branding?: Partial<OrganizationBranding>;
  active?: boolean;
}

export interface OrganizationSearch {
  query?: string;
  type?: OrganizationType;
  active?: boolean;
  plan?: SubscriptionPlan;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface OrganizationSearchResult {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}

export interface OrganizationDashboard {
  organization: Organization;
  stats: OrganizationStats;
  recentActivity: ActivityFeed[];
  upcomingEvents: Event[];
  alerts: Alert[];
}

export interface ActivityFeed {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: EventType;
  attendees: string[];
  location?: string;
  isVirtual: boolean;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

export type ActivityType = 'story_created' | 'story_shared' | 'mentorship_started' | 'opportunity_posted' | 'user_joined' | 'achievement_earned';
export type EventType = 'mentorship_session' | 'training' | 'workshop' | 'meeting' | 'celebration';
export type AlertType = 'system' | 'billing' | 'security' | 'integration' | 'user_action';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';