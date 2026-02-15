/**
 * Role Taxonomy Types for JusticeHub
 *
 * This module provides TypeScript types and utilities for the standardized
 * role system used across all junction tables (organizations_profiles,
 * art_innovation_profiles, community_programs_profiles, etc.)
 *
 * Roles are stored in the `role_taxonomy` database table but are also
 * defined here for TypeScript type safety and autocompletion.
 */

/**
 * All valid role identifiers in the system.
 * These match the `id` column in the `role_taxonomy` table.
 */
export type ProfileRole =
  // Leadership roles
  | 'founder'
  | 'co-founder'
  | 'director'
  | 'coordinator'
  | 'board-member'
  // Staff roles
  | 'staff'
  | 'researcher'
  | 'evaluator'
  | 'facilitator'
  | 'case-worker'
  | 'youth-worker'
  // Community roles
  | 'participant'
  | 'community-elder'
  | 'elder'
  | 'mentor'
  | 'graduate'
  | 'family-member'
  | 'peer-support'
  // Supporting roles
  | 'volunteer'
  | 'contributor'
  | 'collaborator'
  | 'supporter'
  | 'advisor'
  | 'ambassador'
  // Content roles
  | 'creator'
  | 'author'
  | 'subject'
  | 'mentioned'
  | 'photographer'
  | 'interviewer'
  // Testimonial roles
  | 'testimonial'
  | 'storyteller'
  | 'voice';

/**
 * Role category groupings
 */
export type RoleCategory =
  | 'leadership'
  | 'staff'
  | 'community'
  | 'supporting'
  | 'content'
  | 'testimonial';

/**
 * Human-readable display names for each role
 */
export const ROLE_DISPLAY_NAMES: Record<ProfileRole, string> = {
  // Leadership
  founder: 'Founder',
  'co-founder': 'Co-Founder',
  director: 'Director',
  coordinator: 'Coordinator',
  'board-member': 'Board Member',
  // Staff
  staff: 'Staff',
  researcher: 'Researcher',
  evaluator: 'Evaluator',
  facilitator: 'Facilitator',
  'case-worker': 'Case Worker',
  'youth-worker': 'Youth Worker',
  // Community
  participant: 'Participant',
  'community-elder': 'Community Elder',
  elder: 'Elder',
  mentor: 'Mentor',
  graduate: 'Graduate',
  'family-member': 'Family Member',
  'peer-support': 'Peer Support',
  // Supporting
  volunteer: 'Volunteer',
  contributor: 'Contributor',
  collaborator: 'Collaborator',
  supporter: 'Supporter',
  advisor: 'Advisor',
  ambassador: 'Ambassador',
  // Content
  creator: 'Creator',
  author: 'Author',
  subject: 'Subject',
  mentioned: 'Mentioned',
  photographer: 'Photographer',
  interviewer: 'Interviewer',
  // Testimonial
  testimonial: 'Testimonial',
  storyteller: 'Storyteller',
  voice: 'Voice',
};

/**
 * Category assignment for each role
 */
export const ROLE_CATEGORIES: Record<ProfileRole, RoleCategory> = {
  // Leadership
  founder: 'leadership',
  'co-founder': 'leadership',
  director: 'leadership',
  coordinator: 'leadership',
  'board-member': 'leadership',
  // Staff
  staff: 'staff',
  researcher: 'staff',
  evaluator: 'staff',
  facilitator: 'staff',
  'case-worker': 'staff',
  'youth-worker': 'staff',
  // Community
  participant: 'community',
  'community-elder': 'community',
  elder: 'community',
  mentor: 'community',
  graduate: 'community',
  'family-member': 'community',
  'peer-support': 'community',
  // Supporting
  volunteer: 'supporting',
  contributor: 'supporting',
  collaborator: 'supporting',
  supporter: 'supporting',
  advisor: 'supporting',
  ambassador: 'supporting',
  // Content
  creator: 'content',
  author: 'content',
  subject: 'content',
  mentioned: 'content',
  photographer: 'content',
  interviewer: 'content',
  // Testimonial
  testimonial: 'testimonial',
  storyteller: 'testimonial',
  voice: 'testimonial',
};

/**
 * Category display names
 */
export const CATEGORY_DISPLAY_NAMES: Record<RoleCategory, string> = {
  leadership: 'Leadership',
  staff: 'Staff',
  community: 'Community',
  supporting: 'Supporting',
  content: 'Content',
  testimonial: 'Testimonial',
};

/**
 * Get roles grouped by category
 */
export function getRolesByCategory(): Record<RoleCategory, ProfileRole[]> {
  const grouped: Record<RoleCategory, ProfileRole[]> = {
    leadership: [],
    staff: [],
    community: [],
    supporting: [],
    content: [],
    testimonial: [],
  };

  for (const [role, category] of Object.entries(ROLE_CATEGORIES)) {
    grouped[category].push(role as ProfileRole);
  }

  return grouped;
}

/**
 * Get display name for a role, with fallback for unknown roles
 */
export function getRoleDisplayName(role: string): string {
  if (role in ROLE_DISPLAY_NAMES) {
    return ROLE_DISPLAY_NAMES[role as ProfileRole];
  }
  // Fallback: capitalize and replace dashes with spaces
  return role
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a string is a valid ProfileRole
 */
export function isValidRole(role: string): role is ProfileRole {
  return role in ROLE_DISPLAY_NAMES;
}

/**
 * Get all roles for a specific category
 */
export function getRolesForCategory(category: RoleCategory): ProfileRole[] {
  return Object.entries(ROLE_CATEGORIES)
    .filter(([, cat]) => cat === category)
    .map(([role]) => role as ProfileRole);
}

/**
 * Role option for select components
 */
export interface RoleOption {
  value: ProfileRole;
  label: string;
  category: RoleCategory;
}

/**
 * Get all roles as options for select components
 */
export function getRoleOptions(): RoleOption[] {
  return Object.entries(ROLE_DISPLAY_NAMES).map(([value, label]) => ({
    value: value as ProfileRole,
    label,
    category: ROLE_CATEGORIES[value as ProfileRole],
  }));
}

/**
 * Get roles grouped as options for select components
 */
export function getGroupedRoleOptions(): { category: RoleCategory; label: string; options: RoleOption[] }[] {
  const grouped = getRolesByCategory();

  return (Object.entries(grouped) as [RoleCategory, ProfileRole[]][]).map(([category, roles]) => ({
    category,
    label: CATEGORY_DISPLAY_NAMES[category],
    options: roles.map((role) => ({
      value: role,
      label: ROLE_DISPLAY_NAMES[role],
      category,
    })),
  }));
}
