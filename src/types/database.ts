export interface DatabaseUser {
  id: string;
  organizationId: string;
  email: string;
  auth0Id: string;
  role: UserRole;
  profile: UserProfile;
  privacySettings: PrivacySettings;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  contactInfo: ContactInfo;
  settings: OrganizationSettings;
  airtableConfig?: AirtableConfig;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface YouthProfile {
  id: string;
  userId: string;
  demographics: Demographics;
  journeyTimeline: JourneyEvent[];
  skillsInterests: SkillsInterests;
  achievements: Achievement[];
  privacyControls: PrivacyControls;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  youthProfileId: string;
  airtableRecordId?: string;
  title: string;
  content: string;
  metadata: StoryMetadata;
  storyType: StoryType;
  visibility: VisibilityLevel;
  source: StorySource;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

export interface StoryMedia {
  id: string;
  storyId: string;
  filePath: string;
  airtableAttachmentId?: string;
  fileType: string;
  mimeType: string;
  metadata: MediaMetadata;
  createdAt: Date;
}

export interface Mentor {
  id: string;
  userId: string;
  skills: string[];
  availability: Availability;
  status: MentorStatus;
  backgroundCheck: BackgroundCheck;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorshipRelationship {
  id: string;
  mentorId: string;
  youthProfileId: string;
  status: RelationshipStatus;
  goals: string[];
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface Opportunity {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  type: OpportunityType;
  requirements: string[];
  location: Location;
  expiresAt: Date;
  createdAt: Date;
  active: boolean;
}

export interface OpportunityMatch {
  id: string;
  opportunityId: string;
  youthProfileId: string;
  matchScore: number;
  matchReasons: string[];
  status: MatchStatus;
  createdAt: Date;
}

export interface Apprenticeship {
  id: string;
  youthProfileId: string;
  organizationId: string;
  status: ApprenticeshipStatus;
  contractDetails: ContractDetails;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface AirtableSyncLog {
  id: string;
  organizationId: string;
  syncType: string;
  syncParams: Record<string, any>;
  recordsProcessed: number;
  recordsUpdated: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt?: Date;
  status: SyncStatus;
}

// Supporting types
export type UserRole = 'youth' | 'mentor' | 'organization_staff' | 'admin' | 'apprentice';
export type StoryType = 'reflection' | 'milestone' | 'challenge' | 'achievement' | 'goal';
export type VisibilityLevel = 'private' | 'mentors_only' | 'organization' | 'public';
export type StorySource = 'local' | 'airtable';
export type MentorStatus = 'pending' | 'approved' | 'active' | 'inactive' | 'suspended';
export type RelationshipStatus = 'active' | 'paused' | 'completed' | 'terminated';
export type OpportunityType = 'job' | 'education' | 'training' | 'volunteer' | 'apprenticeship';
export type MatchStatus = 'pending' | 'viewed' | 'applied' | 'accepted' | 'rejected';
export type ApprenticeshipStatus = 'pending' | 'active' | 'completed' | 'terminated';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: Address;
  profilePicture?: string;
  bio?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: Address;
  website?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface OrganizationSettings {
  allowPublicStories: boolean;
  requireMentorApproval: boolean;
  autoMatchOpportunities: boolean;
  enableAnalytics: boolean;
}

export interface AirtableConfig {
  baseId: string;
  apiKey: string;
  storiesTable: string;
  syncEnabled: boolean;
  syncFrequency: string;
  lastSyncAt?: Date;
}

export interface Demographics {
  age?: number;
  gender?: string;
  ethnicity?: string[];
  languages?: string[];
  location?: Location;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  remote?: boolean;
}

export interface JourneyEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

export interface SkillsInterests {
  skills: Skill[];
  interests: string[];
  careerGoals: string[];
  learningPreferences: string[];
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified: boolean;
  source: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: string;
  verified: boolean;
  evidence?: string[];
}

export interface PrivacyControls {
  shareWithMentors: boolean;
  shareWithOrganization: boolean;
  allowAnalytics: boolean;
  publicProfile: boolean;
  contactable: boolean;
}

export interface PrivacySettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  profileVisibility: 'private' | 'organization' | 'public';
  dataSharing: boolean;
  analytics: boolean;
}

export interface StoryMetadata {
  wordCount: number;
  readingTime: number;
  themes: string[];
  sentiment?: number;
  aiInsights?: AIInsight[];
  lastAnalyzed?: Date;
}

export interface AIInsight {
  type: string;
  confidence: number;
  description: string;
  suggestions?: string[];
}

export interface MediaMetadata {
  originalName: string;
  size: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  alt?: string;
  caption?: string;
}

export interface Availability {
  timezone: string;
  preferredDays: string[];
  preferredTimes: string[];
  hoursPerWeek: number;
}

export interface BackgroundCheck {
  status: 'pending' | 'approved' | 'rejected';
  completedAt?: Date;
  expiresAt?: Date;
  provider: string;
  reference: string;
}

export interface ContractDetails {
  hourlyRate: number;
  hoursPerWeek: number;
  responsibilities: string[];
  goals: string[];
  paymentSchedule: string;
}

export interface SyncError {
  recordId: string;
  error: string;
  timestamp: Date;
}