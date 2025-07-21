export interface User {
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
  name?: string;
  youthProfile?: YouthProfile;
  mentorProfile?: any; // Will be properly typed once mentor types are imported
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  name?: string;
  picture?: string;
  location?: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: Address;
  profilePicture?: string;
  bio?: string;
  pronouns?: string;
  website?: string;
  socialLinks?: SocialLinks;
}

export interface YouthProfile {
  id: string;
  userId: string;
  demographics: Demographics;
  journeyTimeline: JourneyEvent[];
  skillsInterests: SkillsInterests;
  achievements: Achievement[];
  privacyControls: PrivacyControls;
  mentorshipStatus: MentorshipStatus;
  apprenticeshipEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Demographics {
  age?: number;
  gender?: string;
  ethnicity?: string[];
  languages?: string[];
  location?: Location;
  educationLevel?: string;
  employmentStatus?: string;
  housingStatus?: string;
  accessNeeds?: string[];
}

export interface JourneyEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: JourneyCategory;
  impact: ImpactLevel;
  tags: string[];
  isPrivate: boolean;
  evidence?: string[];
}

export interface SkillsInterests {
  skills: Skill[];
  interests: string[];
  careerGoals: string[];
  learningPreferences: string[];
  strengths: string[];
  challenges: string[];
}

export interface Skill {
  name: string;
  level: SkillLevel;
  verified: boolean;
  source: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  evidence?: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: AchievementCategory;
  verified: boolean;
  evidence?: string[];
  verifiedBy?: string;
  isPublic: boolean;
  tags: string[];
}

export interface PrivacyControls {
  shareWithMentors: boolean;
  shareWithOrganization: boolean;
  allowAnalytics: boolean;
  publicProfile: boolean;
  contactable: boolean;
  shareStories: ShareStorySettings;
  shareAchievements: boolean;
  shareJourney: boolean;
}

export interface ShareStorySettings {
  withMentors: boolean;
  withOrganization: boolean;
  publicSharing: boolean;
  requireApproval: boolean;
}

export interface PrivacySettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  profileVisibility: ProfileVisibility;
  dataSharing: boolean;
  analytics: boolean;
  marketingEmails: boolean;
  mentorContact: boolean;
  allowMentorContact?: boolean;
  organizationContact: boolean;
  shareStories?: boolean;
  showProfile?: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  remote?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilitySettings;
}

export interface NotificationPreferences {
  email: {
    stories: boolean;
    mentorship: boolean;
    opportunities: boolean;
    system: boolean;
  };
  sms: {
    urgent: boolean;
    reminders: boolean;
  };
  push: {
    enabled: boolean;
    stories: boolean;
    mentorship: boolean;
    opportunities: boolean;
  };
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
}

export interface UserActivity {
  userId: string;
  lastLoginAt: Date;
  storiesCreated: number;
  storiesShared: number;
  mentorshipHours: number;
  opportunitiesApplied: number;
  achievementsEarned: number;
  engagementScore: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
  usersByOrganization: Record<string, number>;
  averageEngagement: number;
}

// Enums and types
export type UserRole = 'youth' | 'mentor' | 'organization_staff' | 'admin' | 'apprentice';
export type ProfileVisibility = 'private' | 'organization' | 'public';
export type JourneyCategory = 'education' | 'employment' | 'housing' | 'health' | 'legal' | 'family' | 'personal' | 'achievement';
export type ImpactLevel = 'positive' | 'negative' | 'neutral';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type AchievementCategory = 'education' | 'employment' | 'personal' | 'community' | 'skill' | 'milestone';
export type MentorshipStatus = 'none' | 'seeking' | 'matched' | 'active' | 'completed';

// User management types
export interface UserCreate {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: UserRole;
  profile?: Partial<UserProfile>;
  sendWelcomeEmail?: boolean;
}

export interface UserUpdate {
  profile?: Partial<UserProfile>;
  privacySettings?: Partial<PrivacySettings>;
  preferences?: Partial<UserPreferences>;
  active?: boolean;
}

export interface UserSearch {
  query?: string;
  role?: UserRole;
  organizationId?: string;
  active?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  hasYouthProfile?: boolean;
  hasMentorProfile?: boolean;
}

export interface UserSearchResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

// Additional types needed for API and mentor functionality
export interface Availability {
  timezone: string;
  preferredDays: DayOfWeek[];
  preferredTimes: TimeSlot[];
  hoursPerWeek: number;
  flexibleSchedule: boolean;
  unavailableDates: DateRange[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface DateRange {
  start: Date;
  end: Date;
  reason?: string;
}

export interface Reference {
  name: string;
  relationship: string;
  organization: string;
  email: string;
  phone?: string;
  contacted: boolean;
  feedback?: string;
}

export interface MentorPreferences {
  maxMentees: number;
  preferredAgeRange: AgeRange;
  preferredGenders: string[];
  focusAreas: string[];
  communicationStyle: CommunicationStyle;
  mentorshipDuration: MentorshipDuration;
  groupMentoring: boolean;
}

export interface AgeRange {
  min: number;
  max: number;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type CommunicationStyle = 'formal' | 'informal' | 'structured' | 'flexible';
export type MentorshipDuration = 'short_term' | 'medium_term' | 'long_term' | 'ongoing';