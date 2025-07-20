export interface ContractDetails {
  duration: string; // e.g., "6 months", "1 year"
  hoursPerWeek: number;
  stipend?: number;
  learningObjectives: string[];
  responsibilities: string[];
  supervisorName: string;
  supervisorEmail: string;
  evaluationSchedule?: string;
  completionCriteria?: string[];
}

export interface Apprenticeship {
  id: string;
  youthProfileId: string;
  organizationId: string;
  opportunityId?: string; // Link to original opportunity
  status: 'pending' | 'active' | 'completed' | 'terminated' | 'on_hold';
  contractDetails: ContractDetails;
  startDate: Date;
  endDate?: Date;
  completedAt?: Date;
  terminatedAt?: Date;
  terminationReason?: string;
  progressNotes?: string;
  evaluations?: Array<{
    date: Date;
    rating: number;
    feedback: string;
    evaluatorId: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApprenticeshipDto {
  youthProfileId: string;
  organizationId: string;
  opportunityId?: string;
  contractDetails: ContractDetails;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateApprenticeshipDto {
  status?: Apprenticeship['status'];
  contractDetails?: Partial<ContractDetails>;
  startDate?: Date;
  endDate?: Date;
  progressNotes?: string;
  terminationReason?: string;
}

export interface ApprenticeshipWithRelations extends Apprenticeship {
  youth?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };
  opportunity?: {
    id: string;
    title: string;
    description: string;
  };
}

export interface ApprenticeshipFilters {
  status?: Apprenticeship['status'] | Apprenticeship['status'][];
  organizationId?: string;
  youthProfileId?: string;
  startDate?: {
    from?: Date;
    to?: Date;
  };
}

export interface ApprenticeshipStats {
  total: number;
  active: number;
  completed: number;
  averageDuration: number; // in days
  completionRate: number; // percentage
  byStatus: Record<Apprenticeship['status'], number>;
}