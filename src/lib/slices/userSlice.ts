import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, YouthProfile } from '@/types/user';

interface UserState {
  currentUser: User | null;
  youthProfile: YouthProfile | null;
  isLoading: boolean;
  error: string | null;
  profileCompletion: number;
}

const initialState: UserState = {
  currentUser: null,
  youthProfile: null,
  isLoading: false,
  error: null,
  profileCompletion: 0,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.youthProfile = action.payload.youthProfile || null;
      state.profileCompletion = calculateProfileCompletion(action.payload);
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        state.profileCompletion = calculateProfileCompletion(state.currentUser);
      }
    },
    updateYouthProfile: (state, action: PayloadAction<Partial<YouthProfile>>) => {
      if (state.youthProfile) {
        state.youthProfile = { ...state.youthProfile, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.youthProfile = null;
      state.profileCompletion = 0;
      state.error = null;
    },
  },
});

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(user: User): number {
  const requiredFields = [
    user.profile.firstName,
    user.profile.lastName,
    user.email,
    user.profile.dateOfBirth,
    user.profile.phone,
  ];
  
  const completedFields = requiredFields.filter(field => field && field.toString().trim() !== '').length;
  return Math.round((completedFields / requiredFields.length) * 100);
}

export const {
  setUser,
  updateProfile,
  updateYouthProfile,
  setLoading,
  setError,
  clearUser,
} = userSlice.actions;

export default userSlice.reducer;