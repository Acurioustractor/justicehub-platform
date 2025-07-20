export interface Mentor {
  id: string;
  userId: string;
  skills: string[];
  availability: Availability;
  status: MentorStatus;
  backgroundCheck: BackgroundCheck;
  specializations: string[];
  experience: MentorExperience;
  preferences: MentorPreferences;
  rating: number;
  totalMentees: number;
  activeMentees: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorshipRelationship {
  id: string;
  mentorId: string;
  youthProfileId: string;
  status: RelationshipStatus;
  goals: string[];
  notes: string;
  meetingFrequency: MeetingFrequency;
  communicationMethod: CommunicationMethod[];
  startDate: Date;
  endDate?: Date;
  lastContactAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface BackgroundCheck {
  status: BackgroundCheckStatus;
  completedAt?: Date;
  expiresAt?: Date;
  provider: string;
  reference: string;
  notes?: string;
}

export interface MentorExperience {
  yearsOfExperience: number;
  previousMentees: number;
  industries: string[];
  roleTypes: string[];
  achievements: string[];
  testimonials: MentorTestimonial[];
}

export interface MentorTestimonial {
  id: string;
  fromUserId: string;
  fromUserName: string;
  content: string;
  rating: number;
  isPublic: boolean;
  createdAt: Date;
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

export interface MentorApplication {
  id: string;
  userId: string;
  motivation: string;
  experience: string;
  skills: string[];
  availability: Availability;
  references: Reference[];
  status: ApplicationStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  submittedAt: Date;
}

export interface Reference {
  name: string;
  relationship: string;
  email: string;
  phone?: string;
  contacted: boolean;
  contactedAt?: Date;
  feedback?: string;
}

export interface MentorMatch {
  mentorId: string;
  youthProfileId: string;
  matchScore: number;
  matchFactors: MatchFactor[];
  status: MatchStatus;
  createdAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface MatchFactor {
  type: MatchFactorType;
  weight: number;
  score: number;
  description: string;
}

export interface MentorStats {
  totalHours: number;
  activeSessions: number;
  completedSessions: number;
  averageRating: number;
  totalMentees: number;
  activeMentees: number;
  successfulMatches: number;
  responseRate: number;
  lastActive: Date;
}

export interface MentorTraining {
  id: string;
  mentorId: string;
  courseId: string;
  courseName: string;
  status: TrainingStatus;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  certificateUrl?: string;
}

export interface MentorSession {
  id: string;
  mentorshipRelationshipId: string;
  scheduledAt: Date;
  duration: number; // minutes
  type: SessionType;
  agenda?: string;
  notes?: string;
  followUpTasks: FollowUpTask[];
  status: SessionStatus;
  rating?: SessionRating;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowUpTask {
  id: string;
  description: string;
  assignedTo: 'mentor' | 'youth';
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface SessionRating {
  overallRating: number;
  helpfulness: number;
  preparation: number;
  communication: number;
  feedback?: string;
  ratedBy: string;
  ratedAt: Date;
}

// Enums and types
export type MentorStatus = 'pending' | 'approved' | 'active' | 'inactive' | 'suspended' | 'rejected';
export type RelationshipStatus = 'pending' | 'active' | 'paused' | 'completed' | 'terminated';
export type BackgroundCheckStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'expired';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type CommunicationMethod = 'video_call' | 'phone_call' | 'text_message' | 'email' | 'in_person';
export type MeetingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
export type CommunicationStyle = 'formal' | 'informal' | 'structured' | 'flexible';
export type MentorshipDuration = 'short_term' | 'medium_term' | 'long_term' | 'ongoing';
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'pending_background_check';
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type MatchFactorType = 'skills' | 'interests' | 'location' | 'availability' | 'goals' | 'experience';
export type TrainingStatus = 'not_started' | 'in_progress' | 'completed' | 'expired';
export type SessionType = 'initial' | 'regular' | 'goal_setting' | 'progress_review' | 'crisis_support' | 'final';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

// Mentor management types
export interface MentorCreate {
  userId: string;
  skills: string[];
  availability: Availability;
  experience: Partial<MentorExperience>;
  preferences: MentorPreferences;
}

export interface MentorUpdate {
  skills?: string[];
  availability?: Partial<Availability>;
  status?: MentorStatus;
  preferences?: Partial<MentorPreferences>;
  specializations?: string[];
}

export interface MentorSearch {
  skills?: string[];
  specializations?: string[];
  availability?: Partial<Availability>;
  status?: MentorStatus;
  rating?: number;
  location?: string;
  maxMentees?: number;
}

export interface MentorSearchResult {
  mentors: Mentor[];
  total: number;
  page: number;
  limit: number;
}

export interface MentorshipGoal {
  id: string;
  relationshipId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate?: Date;
  status: GoalStatus;
  progress: number; // 0-100
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  evidence?: string[];
}

export type GoalCategory = 'education' | 'career' | 'personal' | 'skill' | 'health' | 'financial';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';