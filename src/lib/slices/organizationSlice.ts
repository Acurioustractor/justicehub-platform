import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Organization } from '@/types/organization';

interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  members: any[]; // Will be properly typed when member types are defined
  settings: {
    notifications: boolean;
    publicProfile: boolean;
    allowMentorRequests: boolean;
  };
}

const initialState: OrganizationState = {
  currentOrganization: null,
  organizations: [],
  isLoading: false,
  error: null,
  members: [],
  settings: {
    notifications: true,
    publicProfile: true,
    allowMentorRequests: true,
  },
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<Organization>) => {
      state.currentOrganization = action.payload;
    },
    setOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = action.payload;
    },
    updateOrganization: (state, action: PayloadAction<Partial<Organization>>) => {
      if (state.currentOrganization) {
        state.currentOrganization = { ...state.currentOrganization, ...action.payload };
      }
      // Update in organizations list as well
      const index = state.organizations.findIndex(org => org.id === state.currentOrganization?.id);
      if (index !== -1 && state.currentOrganization) {
        state.organizations[index] = state.currentOrganization;
      }
    },
    addOrganization: (state, action: PayloadAction<Organization>) => {
      state.organizations.push(action.payload);
    },
    removeOrganization: (state, action: PayloadAction<string>) => {
      state.organizations = state.organizations.filter(org => org.id !== action.payload);
      if (state.currentOrganization?.id === action.payload) {
        state.currentOrganization = null;
      }
    },
    setMembers: (state, action: PayloadAction<any[]>) => {
      state.members = action.payload;
    },
    addMember: (state, action: PayloadAction<any>) => {
      state.members.push(action.payload);
    },
    removeMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter(member => member.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<OrganizationState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    clearOrganization: (state) => {
      state.currentOrganization = null;
      state.members = [];
      state.error = null;
    },
  },
});

export const {
  setCurrentOrganization,
  setOrganizations,
  updateOrganization,
  addOrganization,
  removeOrganization,
  setMembers,
  addMember,
  removeMember,
  setLoading,
  setError,
  updateSettings,
  clearOrganization,
} = organizationSlice.actions;

export default organizationSlice.reducer;