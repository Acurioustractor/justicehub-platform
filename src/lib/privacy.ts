export type PrivacyLevel = 'public' | 'organization' | 'mentors' | 'private' | 'anonymous';

interface Story {
  id: string;
  userId: string;
  organizationId?: string | null;
  visibility: string;
  published: boolean;
  [key: string]: any;
}

interface User {
  id: string;
  role: string;
  organizationId?: string | null;
  [key: string]: any;
}

interface PrivacyCheckParams {
  story: Story;
  viewer: User | null;
  authorProfile?: any;
}

/**
 * Check if a user can view a story based on privacy settings
 */
export function canViewStory({ story, viewer, authorProfile }: PrivacyCheckParams): boolean {
  // Author can always view their own stories
  if (viewer && story.userId === viewer.id) {
    return true;
  }

  // Check based on privacy level
  switch (story.visibility) {
    case 'public':
      // Anyone can view public stories
      return true;

    case 'anonymous':
      // Anyone can view anonymous stories if they're published
      return story.published === true;

    case 'organization':
      // Only members of the same organization can view
      if (!viewer) return false;
      return viewer.organizationId === story.organizationId;

    case 'mentors':
      // Only connected mentors can view
      // TODO: Implement mentor connection check
      if (!viewer) return false;
      return viewer.role === 'mentor' && checkMentorConnection(story.userId, viewer.id);

    case 'private':
      // Only the author can view
      return false;

    default:
      // Default to private if visibility is not recognized
      return false;
  }
}

/**
 * Check if a user can edit a story
 */
export function canEditStory(story: Story, user: User | null): boolean {
  if (!user) return false;
  
  // Only the author can edit their stories
  return story.userId === user.id;
}

/**
 * Check if a user can delete a story
 */
export function canDeleteStory(story: Story, user: User | null): boolean {
  if (!user) return false;
  
  // Author can delete their own stories
  if (story.userId === user.id) return true;
  
  // Admins can delete any story
  if (user.role === 'admin') return true;
  
  return false;
}

/**
 * Get privacy filter conditions for database queries
 */
export function getPrivacyFilter(viewer: User | null) {
  if (!viewer) {
    // Non-authenticated users can only see public and anonymous published stories
    return {
      or: [
        { visibility: 'public' as PrivacyLevel },
        { 
          and: [
            { visibility: 'anonymous' as PrivacyLevel },
            { published: true }
          ]
        }
      ]
    };
  }

  // Authenticated users can see:
  // 1. Their own stories (any visibility)
  // 2. Public stories
  // 3. Anonymous published stories
  // 4. Organization stories (if same org)
  // 5. Mentor-only stories (if connected mentor)
  
  const conditions: any[] = [
    { userId: viewer.id }, // Own stories
    { visibility: 'public' as PrivacyLevel }, // Public stories
    { 
      and: [
        { visibility: 'anonymous' as PrivacyLevel },
        { published: true }
      ]
    }
  ];

  // Add organization filter if user belongs to one
  if (viewer.organizationId) {
    conditions.push({
      and: [
        { visibility: 'organization' as PrivacyLevel },
        { organizationId: viewer.organizationId }
      ]
    });
  }

  // TODO: Add mentor connection filter
  if (viewer.role === 'mentor') {
    // This would need to be implemented with proper mentor-youth connections
    // conditions.push({ visibility: 'mentors', userId: { in: connectedYouthIds } });
  }

  return { or: conditions };
}

/**
 * Sanitize story data based on privacy settings
 */
export function sanitizeStoryForViewer(story: Story, viewer: User | null): Partial<Story> {
  const sanitized = { ...story };

  // If anonymous, remove author information
  if (story.visibility === 'anonymous' && (!viewer || story.userId !== viewer.id)) {
    delete sanitized.userId;
    delete sanitized.author;
    // Keep only essential fields
    return {
      id: sanitized.id,
      title: sanitized.title,
      content: sanitized.content,
      storyType: sanitized.storyType,
      visibility: sanitized.visibility,
      tags: sanitized.tags,
      media: sanitized.media,
      published: sanitized.published,
      publishedAt: sanitized.publishedAt,
      createdAt: sanitized.createdAt,
      updatedAt: sanitized.updatedAt
    };
  }

  return sanitized;
}

/**
 * Check if two users have a mentor connection
 * TODO: Implement this based on mentor_connections table
 */
function checkMentorConnection(youthId: string, mentorId: string): boolean {
  // Placeholder - this should query the mentor_connections table
  return false;
}

/**
 * Get displayable privacy label
 */
export function getPrivacyLabel(visibility: PrivacyLevel): string {
  const labels: Record<PrivacyLevel, string> = {
    public: 'Public',
    organization: 'Organization Only',
    mentors: 'Mentors Only',
    private: 'Private',
    anonymous: 'Anonymous'
  };

  return labels[visibility] || 'Unknown';
}

/**
 * Get privacy level description
 */
export function getPrivacyDescription(visibility: PrivacyLevel): string {
  const descriptions: Record<PrivacyLevel, string> = {
    public: 'Anyone can view this story',
    organization: 'Only members of your organization can view',
    mentors: 'Only your connected mentors can view',
    private: 'Only you can view this story',
    anonymous: 'Public but your identity is hidden'
  };

  return descriptions[visibility] || 'Unknown privacy setting';
}