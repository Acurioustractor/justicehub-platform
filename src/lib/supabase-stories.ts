import { supabase } from "./supabase";
import type { Story, CampaignMetric, ActivityItem } from "@/types/supabase";

/**
 * Fetch all published stories from Supabase
 */
export async function getStories(options?: {
  category?: string;
  limit?: number;
  orderBy?: "display_order" | "created_at";
}) {
  let query = supabase
    .from("stories")
    .select("*")
    .eq("is_published", true);

  // Apply category filter if provided
  if (options?.category) {
    query = query.eq("category", options.category);
  }

  // Apply ordering
  const orderColumn = options?.orderBy || "display_order";
  query = query.order(orderColumn, { ascending: true });

  // Apply limit if provided
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching stories:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch a single story by ID
 */
export async function getStoryById(storyId: string) {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", storyId)
    .eq("is_published", true)
    .single();

  if (error) {
    console.error("Error fetching story:", error);
    return null;
  }

  return data;
}

/**
 * Fetch stories by category (youth, expert, leader, community)
 */
export async function getStoriesByCategory(category: "youth" | "expert" | "leader" | "community") {
  return getStories({ category });
}

/**
 * Fetch campaign metrics from Supabase
 */
export async function getCampaignMetrics() {
  const { data, error } = await supabase
    .from("campaign_metrics")
    .select("*")
    .order("metric_name");

  if (error) {
    console.error("Error fetching campaign metrics:", error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific metric by name
 */
export async function getMetricByName(metricName: string) {
  const { data, error } = await supabase
    .from("campaign_metrics")
    .select("*")
    .eq("metric_name", metricName)
    .single();

  if (error) {
    console.error("Error fetching metric:", error);
    return null;
  }

  return data;
}

/**
 * Fetch recent activity items for the activity feed
 */
export async function getActivityFeed(limit: number = 10) {
  const { data, error } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching activity feed:", error);
    return [];
  }

  return data || [];
}

/**
 * Transform Supabase story data to match the existing CampaignStory interface
 * This allows gradual migration from static data to database
 */
export function transformStoryData(story: Story) {
  return {
    id: story.id,
    name: story.name,
    role: story.role || "",
    quote: story.quote || "",
    bio: story.bio,
    storyText: story.story_text,
    mediaType: story.media_type,
    videoSource: story.video_source,
    supabaseVideoUrl: story.video_url,
    mediaSrc: story.profile_photo_url,
    posterImage: story.video_thumbnail_url,
    transcriptionUrl: story.transcript_url,
    highlightStat: story.highlight_stat_label && story.highlight_stat_value
      ? {
          label: story.highlight_stat_label,
          value: story.highlight_stat_value,
        }
      : undefined,
    category: story.category,
    ageGroup: story.age_group,
    tags: story.tags,
  };
}

/**
 * Real-time subscription to story updates
 */
export function subscribeToStories(callback: (payload: any) => void) {
  return supabase
    .channel("stories-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "stories",
      },
      callback
    )
    .subscribe();
}

/**
 * Real-time subscription to activity feed
 */
export function subscribeToActivityFeed(callback: (payload: any) => void) {
  return supabase
    .channel("activity-feed-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "activity_feed",
      },
      callback
    )
    .subscribe();
}