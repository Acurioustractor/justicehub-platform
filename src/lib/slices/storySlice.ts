import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Story, StoryType, VisibilityLevel } from '@/types/story';

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    storyType: StoryType | null;
    visibility: VisibilityLevel | null;
    tags: string[];
    searchQuery: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: StoryState = {
  stories: [],
  currentStory: null,
  isLoading: false,
  error: null,
  filters: {
    storyType: null,
    visibility: null,
    tags: [],
    searchQuery: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  },
};

const storySlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    setStories: (state, action: PayloadAction<Story[]>) => {
      state.stories = action.payload;
    },
    addStory: (state, action: PayloadAction<Story>) => {
      state.stories.unshift(action.payload);
    },
    updateStory: (state, action: PayloadAction<Story>) => {
      const index = state.stories.findIndex(story => story.id === action.payload.id);
      if (index !== -1) {
        state.stories[index] = action.payload;
      }
      if (state.currentStory?.id === action.payload.id) {
        state.currentStory = action.payload;
      }
    },
    deleteStory: (state, action: PayloadAction<string>) => {
      state.stories = state.stories.filter(story => story.id !== action.payload);
      if (state.currentStory?.id === action.payload) {
        state.currentStory = null;
      }
    },
    setCurrentStory: (state, action: PayloadAction<Story | null>) => {
      state.currentStory = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<StoryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        storyType: null,
        visibility: null,
        tags: [],
        searchQuery: '',
      };
    },
    setPagination: (state, action: PayloadAction<Partial<StoryState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    appendStories: (state, action: PayloadAction<Story[]>) => {
      state.stories = [...state.stories, ...action.payload];
    },
  },
});

export const {
  setStories,
  addStory,
  updateStory,
  deleteStory,
  setCurrentStory,
  setLoading,
  setError,
  setFilters,
  clearFilters,
  setPagination,
  appendStories,
} = storySlice.actions;

export default storySlice.reducer;