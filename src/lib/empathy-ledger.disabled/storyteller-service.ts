/**
 * Storyteller Service
 * 
 * Manages storytellers in the Empathy Ledger database, including
 * registration, profile management, and story creation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database-types';

export interface StorytellerProfile {
  id?: string;
  name: string;
  email?: string;
  age?: number;
  location?: string;
  bio?: string;
  avatar_url?: string;
  project_id: string;
  organization_id: string;
  consent_status: 'pending' | 'granted' | 'revoked';
  privacy_settings: {
    show_name: boolean;
    show_location: boolean;
    show_age: boolean;
    allow_contact: boolean;
  };
  metadata?: any;
}

export interface StoryData {
  title: string;
  content: string;
  storyteller_id: string;
  project_id: string;
  organization_id: string;
  story_type: string;
  visibility: 'public' | 'organization' | 'private';
  tags: string[];
  media_urls?: string[];
  featured_image_url?: string;
  consent_verified: boolean;
  metadata?: any;
}

export interface StoryFilter {
  project_id?: string;
  organization_id?: string;
  storyteller_id?: string;
  story_type?: string;
  visibility?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export class StorytellerService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new storyteller profile
   */
  async createStoryteller(profile: Omit<StorytellerProfile, 'id'>): Promise<{
    success: boolean;
    storyteller?: StorytellerProfile;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('storytellers')
        .insert({
          name: profile.name,
          email: profile.email,
          age: profile.age,
          location: profile.location,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          project_id: profile.project_id,
          organization_id: profile.organization_id,
          consent_status: profile.consent_status,
          privacy_settings: profile.privacy_settings,
          is_active: true,
          metadata: profile.metadata
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, storyteller: data as StorytellerProfile };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get storyteller by ID
   */
  async getStoryteller(id: string): Promise<{
    success: boolean;
    storyteller?: StorytellerProfile;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('storytellers')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, storyteller: data as StorytellerProfile };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update storyteller profile
   */
  async updateStoryteller(id: string, updates: Partial<StorytellerProfile>): Promise<{
    success: boolean;
    storyteller?: StorytellerProfile;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('storytellers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, storyteller: data as StorytellerProfile };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new story
   */
  async createStory(story: Omit<StoryData, 'id'>): Promise<{
    success: boolean;
    story?: any;
    error?: string;
  }> {
    try {
      // Verify storyteller exists and has consent
      const { data: storyteller, error: storytellerError } = await this.supabase
        .from('storytellers')
        .select('consent_status')
        .eq('id', story.storyteller_id)
        .single();

      if (storytellerError || !storyteller) {
        return { success: false, error: 'Storyteller not found' };
      }

      if (storyteller.consent_status !== 'granted') {
        return { success: false, error: 'Storyteller consent required before creating stories' };
      }

      const { data, error } = await this.supabase
        .from('stories')
        .insert({
          title: story.title,
          content: story.content,
          storyteller_id: story.storyteller_id,
          project_id: story.project_id,
          organization_id: story.organization_id,
          story_type: story.story_type,
          visibility: story.visibility,
          status: 'draft',
          tags: story.tags,
          media_urls: story.media_urls,
          view_count: 0,
          like_count: 0,
          share_count: 0,
          featured_image_url: story.featured_image_url,
          consent_verified: story.consent_verified,
          metadata: story.metadata
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, story: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get stories with filtering
   */
  async getStories(filters: StoryFilter = {}): Promise<{
    success: boolean;
    stories?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = this.supabase
        .from('stories')
        .select(`
          *,
          storytellers!inner(
            id,
            name,
            privacy_settings
          ),
          projects!inner(
            id,
            name,
            slug
          ),
          organizations!inner(
            id,
            name,
            slug
          )
        `)
        .eq('status', 'published');

      // Apply filters
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id);
      }
      if (filters.storyteller_id) {
        query = query.eq('storyteller_id', filters.storyteller_id);
      }
      if (filters.story_type) {
        query = query.eq('story_type', filters.story_type);
      }
      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        stories: data || [], 
        total: count || data?.length || 0 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get story by ID with full details
   */
  async getStory(id: string): Promise<{
    success: boolean;
    story?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('stories')
        .select(`
          *,
          storytellers!inner(
            id,
            name,
            bio,
            location,
            privacy_settings
          ),
          projects!inner(
            id,
            name,
            slug,
            description
          ),
          organizations!inner(
            id,
            name,
            slug
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, story: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update story
   */
  async updateStory(id: string, updates: Partial<StoryData>): Promise<{
    success: boolean;
    story?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('stories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, story: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish story
   */
  async publishStory(id: string): Promise<{
    success: boolean;
    story?: any;
    error?: string;
  }> {
    try {
      // Verify consent is still valid
      const { data: story, error: storyError } = await this.supabase
        .from('stories')
        .select(`
          storyteller_id,
          storytellers!inner(consent_status)
        `)
        .eq('id', id)
        .single();

      if (storyError || !story) {
        return { success: false, error: 'Story not found' };
      }

      if ((story.storytellers as any).consent_status !== 'granted') {
        return { success: false, error: 'Cannot publish story without valid consent' };
      }

      const { data, error } = await this.supabase
        .from('stories')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, story: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Record story interaction
   */
  async recordInteraction(storyId: string, interactionType: 'view' | 'like' | 'share', storytellerId?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Record the interaction
      const { error: interactionError } = await this.supabase
        .from('story_interactions')
        .insert({
          story_id: storyId,
          storyteller_id: storytellerId,
          interaction_type: interactionType
        });

      if (interactionError) {
        return { success: false, error: interactionError.message };
      }

      // Update the story counters
      const updateField = `${interactionType}_count`;
      const { error: updateError } = await this.supabase
        .rpc('increment_story_counter', {
          story_id: storyId,
          counter_type: interactionType
        });

      if (updateError) {
        console.error('Failed to update story counter:', updateError);
        // Don't fail the interaction if counter update fails
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get projects for organization
   */
  async getProjects(organizationId?: string): Promise<{
    success: boolean;
    projects?: any[];
    error?: string;
  }> {
    try {
      let query = this.supabase
        .from('projects')
        .select('*')
        .eq('status', 'active');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, projects: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get organizations
   */
  async getOrganizations(): Promise<{
    success: boolean;
    organizations?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('is_verified', true)
        .order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, organizations: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Grant consent for storyteller
   */
  async grantConsent(storytellerId: string, consentDetails: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Update storyteller consent status
      const { error: storytellerError } = await this.supabase
        .from('storytellers')
        .update({
          consent_status: 'granted',
          updated_at: new Date().toISOString()
        })
        .eq('id', storytellerId);

      if (storytellerError) {
        return { success: false, error: storytellerError.message };
      }

      // Record consent details
      const { error: consentError } = await this.supabase
        .from('consent_records')
        .insert({
          storyteller_id: storytellerId,
          consent_type: 'storytelling',
          status: 'granted',
          consent_details: consentDetails,
          granted_by: storytellerId
        });

      if (consentError) {
        return { success: false, error: consentError.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Create default service instance
export function createStorytellerService(supabaseUrl: string, supabaseKey: string): StorytellerService {
  return new StorytellerService(supabaseUrl, supabaseKey);
}