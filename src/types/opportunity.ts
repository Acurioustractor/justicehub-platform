export interface Opportunity {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  type: OpportunityType;
  category: OpportunityCategory;
  requirements: OpportunityRequirement[];
  benefits: string[];
  location: OpportunityLocation;
  schedule: OpportunitySchedule;
  compensation?: Compensation;
  applicationProcess: ApplicationProcess;
  contacts: OpportunityContact[];
  tags: string[];
  status: OpportunityStatus;
  visibility: VisibilityLevel;
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
  applicationsReceived: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface OpportunityRequirement {
  type: RequirementType;
  description: string;
  mandatory: boolean;
  verifiable: boolean;
}

export interface OpportunityLocation {
  type: LocationType;
  address?: Address;
  city: string;
  state: string;
  country: string;
  postcode?: string;
  remote: boolean;
  hybrid: boolean;
  travelRequired: boolean;
  accessibility?: AccessibilityFeature[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface OpportunitySchedule {
  type: ScheduleType;
  hoursPerWeek?: number;
  daysPerWeek?: number;
  preferredDays?: DayOfWeek[];
  preferredTimes?: TimeSlot[];
  flexible: boolean;
  shiftWork: boolean;
  duration?: Duration;
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface Duration {
  amount: number;
  unit: DurationUnit;
}

export interface Compensation {
  type: CompensationType;
  amount?: number;
  currency: string;
  period?: PayPeriod;
  benefits?: string[];
  negotiable: boolean;
}

export interface ApplicationProcess {
  method: ApplicationMethod[];
  requiredDocuments: DocumentRequirement[];
  steps: ApplicationStep[];
  estimatedProcessingTime: string;
  interviewRequired: boolean;
  backgroundCheckRequired: boolean;
}

export interface DocumentRequirement {
  type: DocumentType;
  name: string;
  required: boolean;
  description?: string;
}

export interface ApplicationStep {
  order: number;
  name: string;
  description: string;
  estimatedDuration: string;
  automated: boolean;
}

export interface OpportunityContact {
  name: string;
  role: string;
  email: string;
  phone?: string;
  preferredContact: ContactMethod;
  availability?: string;
}

export interface OpportunityMatch {
  id: string;
  opportunityId: string;
  youthProfileId: string;
  matchScore: number;
  matchFactors: MatchFactor[];
  status: MatchStatus;
  recommendationReason: string;
  createdAt: Date;
  viewedAt?: Date;
  appliedAt?: Date;
  updatedAt: Date;
}

export interface MatchFactor {
  type: MatchFactorType;
  weight: number;
  score: number;
  description: string;
  evidence?: string[];
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  youthProfileId: string;
  status: ApplicationStatus;
  applicationData: ApplicationData;
  documents: ApplicationDocument[];
  coverLetter?: string;
  customResponses: CustomResponse[];
  submittedAt: Date;
  lastModifiedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  interviewScheduledAt?: Date;
  outcome?: ApplicationOutcome;
}

export interface ApplicationData {
  personalInfo: PersonalApplicationInfo;
  experience: ExperienceInfo[];
  skills: string[];
  availability: ApplicantAvailability;
  motivation: string;
  references?: Reference[];
}

export interface PersonalApplicationInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
  dateOfBirth?: Date;
  emergencyContact?: EmergencyContact;
}

export interface ExperienceInfo {
  type: ExperienceType;
  title: string;
  organization: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  skills: string[];
}

export interface ApplicantAvailability {
  startDate: Date;
  hoursPerWeek: number;
  preferredDays: DayOfWeek[];
  flexibility: FlexibilityLevel;
  restrictions?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
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

export interface CustomResponse {
  questionId: string;
  question: string;
  response: string;
  required: boolean;
}

export interface ApplicationDocument {
  id: string;
  type: DocumentType;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  url: string;
}

export interface ApplicationOutcome {
  decision: ApplicationDecision;
  reason?: string;
  feedback?: string;
  nextSteps?: string;
  decidedAt: Date;
  decidedBy: string;
}

export interface OpportunityStats {
  totalOpportunities: number;
  activeOpportunities: number;
  totalApplications: number;
  averageApplicationsPerOpportunity: number;
  successfulPlacements: number;
  placementRate: number;
  averageTimeToFill: number;
  topCategories: CategoryStats[];
  topLocations: LocationStats[];
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface LocationStats {
  location: string;
  count: number;
  percentage: number;
}

// Enums and types
export type OpportunityType = 'job' | 'internship' | 'apprenticeship' | 'volunteer' | 'training' | 'education' | 'mentorship';
export type OpportunityCategory = 'technology' | 'healthcare' | 'education' | 'construction' | 'hospitality' | 'retail' | 'finance' | 'arts' | 'social_services' | 'government' | 'other';
export type RequirementType = 'education' | 'experience' | 'skill' | 'certification' | 'age' | 'location' | 'availability' | 'background_check';
export type LocationType = 'on_site' | 'remote' | 'hybrid';
export type ScheduleType = 'full_time' | 'part_time' | 'casual' | 'contract' | 'flexible';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type DurationUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type CompensationType = 'hourly' | 'salary' | 'stipend' | 'volunteer' | 'commission' | 'piece_rate';
export type PayPeriod = 'hour' | 'day' | 'week' | 'fortnight' | 'month' | 'year';
export type ApplicationMethod = 'online_form' | 'email' | 'phone' | 'in_person' | 'external_link';
export type DocumentType = 'resume' | 'cover_letter' | 'portfolio' | 'transcript' | 'certificate' | 'reference' | 'identification' | 'other';
export type ContactMethod = 'email' | 'phone' | 'text' | 'video_call';
export type MatchFactorType = 'skills' | 'interests' | 'location' | 'availability' | 'experience' | 'education' | 'goals';
export type MatchStatus = 'pending' | 'viewed' | 'interested' | 'applied' | 'not_interested';
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' | 'interview_completed' | 'reference_check' | 'offer_extended' | 'accepted' | 'rejected' | 'withdrawn';
export type ExperienceType = 'work' | 'volunteer' | 'education' | 'project' | 'internship';
export type FlexibilityLevel = 'low' | 'medium' | 'high';
export type ApplicationDecision = 'accepted' | 'rejected' | 'waitlisted' | 'pending';
export type OpportunityStatus = 'draft' | 'active' | 'paused' | 'filled' | 'cancelled' | 'expired';
export type VisibilityLevel = 'private' | 'organization' | 'public' | 'partner_organizations';
export type AccessibilityFeature = 'wheelchair_accessible' | 'elevator_access' | 'accessible_parking' | 'hearing_loop' | 'sign_language_support' | 'accessible_restrooms';

// Opportunity management types
export interface OpportunityCreate {
  title: string;
  description: string;
  type: OpportunityType;
  category: OpportunityCategory;
  requirements: OpportunityRequirement[];
  location: OpportunityLocation;
  schedule: OpportunitySchedule;
  compensation?: Compensation;
  applicationProcess: ApplicationProcess;
  contacts: OpportunityContact[];
  tags: string[];
  visibility: VisibilityLevel;
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
}

export interface OpportunityUpdate {
  title?: string;
  description?: string;
  requirements?: OpportunityRequirement[];
  location?: Partial<OpportunityLocation>;
  schedule?: Partial<OpportunitySchedule>;
  compensation?: Partial<Compensation>;
  applicationProcess?: Partial<ApplicationProcess>;
  contacts?: OpportunityContact[];
  tags?: string[];
  status?: OpportunityStatus;
  visibility?: VisibilityLevel;
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
}

export interface OpportunitySearch {
  query?: string;
  type?: OpportunityType;
  category?: OpportunityCategory;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  compensation?: {
    minAmount?: number;
    maxAmount?: number;
    type?: CompensationType;
  };
  schedule?: ScheduleType;
  tags?: string[];
  status?: OpportunityStatus;
  organizationId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface OpportunitySearchResult {
  opportunities: Opportunity[];
  total: number;
  page: number;
  limit: number;
  facets: {
    types: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    schedules: { name: string; count: number }[];
  };
}

export interface OpportunityRecommendation {
  opportunityId: string;
  score: number;
  reason: string;
  matchFactors: MatchFactor[];
  context: 'skills_match' | 'location_match' | 'interests_match' | 'career_goals';
}