import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

export interface LinkSuggestion {
  sourceType: 'profile' | 'organization' | 'program' | 'service' | 'story';
  sourceId: string;
  targetType: 'profile' | 'organization' | 'program' | 'service' | 'story';
  targetId: string;
  suggestedRole?: string;
  confidence: number;
  reasoning: string;
  evidence: any;
}

interface Profile {
  id: string;
  full_name: string;
  bio: string | null;
  current_organization?: string;
  location?: string;
  role_tags?: string[];
}

/**
 * Generate link suggestions for a profile
 */
export async function generateProfileLinkSuggestions(profileId: string): Promise<LinkSuggestion[]> {
  const suggestions: LinkSuggestion[] = [];

  // Get the profile
  const { data: profile, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error || !profile) {
    console.error('Error fetching profile:', error);
    return [];
  }

  // Run all matching strategies
  suggestions.push(...await matchByOrganizationName(profile));
  suggestions.push(...await matchByBioKeywords(profile));
  suggestions.push(...await matchByLocation(profile));

  // Remove duplicates and sort by confidence
  const uniqueSuggestions = deduplicateSuggestions(suggestions);
  return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match profile to organizations by current_organization field
 */
async function matchByOrganizationName(profile: Profile): Promise<LinkSuggestion[]> {
  if (!profile.current_organization) return [];

  const suggestions: LinkSuggestion[] = [];
  const orgName = profile.current_organization.trim();

  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .ilike('name', orgName)
    .single();

  if (exactMatch) {
    const role = inferRoleFromBio(profile.bio || '');
    suggestions.push({
      sourceType: 'profile',
      sourceId: profile.id,
      targetType: 'organization',
      targetId: exactMatch.id,
      suggestedRole: role,
      confidence: 0.95,
      reasoning: `Profile's current_organization field matches organization: "${orgName}"`,
      evidence: {
        matchType: 'exact',
        fieldName: 'current_organization',
        fieldValue: orgName,
        orgName: exactMatch.name
      }
    });
    return suggestions; // Return early if exact match
  }

  // Try fuzzy match
  const { data: fuzzyMatches } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .ilike('name', `%${orgName}%`);

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    for (const org of fuzzyMatches) {
      const similarity = calculateStringSimilarity(orgName, org.name);
      if (similarity >= 0.7) { // 70% similarity threshold
        const role = inferRoleFromBio(profile.bio || '');
        suggestions.push({
          sourceType: 'profile',
          sourceId: profile.id,
          targetType: 'organization',
          targetId: org.id,
          suggestedRole: role,
          confidence: similarity * 0.9, // Slightly lower confidence for fuzzy matches
          reasoning: `Profile mentions organization "${orgName}" which closely matches "${org.name}"`,
          evidence: {
            matchType: 'fuzzy',
            fieldName: 'current_organization',
            fieldValue: orgName,
            orgName: org.name,
            similarity
          }
        });
      }
    }
  }

  return suggestions;
}

/**
 * Extract organization mentions from bio text
 */
async function matchByBioKeywords(profile: Profile): Promise<LinkSuggestion[]> {
  if (!profile.bio) return [];

  const suggestions: LinkSuggestion[] = [];
  const bio = profile.bio;

  // Patterns to match organization mentions with role context
  const patterns = [
    { regex: /(?:founded?|co-founded?)\s+([A-Z][a-zA-Z\s&-]+(?:Ltd|Inc|Pty|Foundation|Organization|Consultancy)?)/g, role: 'Founder', confidence: 0.90 },
    { regex: /(?:chair|chairs)\s+([A-Z][a-zA-Z\s&-]+(?:Ltd|Inc|Pty|Foundation|Organization|Consultancy)?)/g, role: 'Chair', confidence: 0.88 },
    { regex: /(?:director|CEO|executive director)\s+(?:of|at)\s+([A-Z][a-zA-Z\s&-]+(?:Ltd|Inc|Pty|Foundation|Organization|Consultancy)?)/g, role: 'Director', confidence: 0.87 },
    { regex: /(?:works?|working)\s+(?:at|for|with)\s+([A-Z][a-zA-Z\s&-]+(?:Ltd|Inc|Pty|Foundation|Organization|Consultancy)?)/g, role: 'Team Member', confidence: 0.75 },
    { regex: /(?:board member|board)\s+(?:of|at)\s+([A-Z][a-zA-Z\s&-]+(?:Ltd|Inc|Pty|Foundation|Organization|Consultancy)?)/g, role: 'Board Member', confidence: 0.85 },
  ];

  for (const pattern of patterns) {
    const matches = [...bio.matchAll(pattern.regex)];

    for (const match of matches) {
      const orgName = match[1].trim();

      // Skip if too short or too generic
      if (orgName.length < 3 || isGenericWord(orgName)) continue;

      // Search for matching organization
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .or(`name.ilike.%${orgName}%,slug.ilike.%${orgName.toLowerCase().replace(/\s+/g, '-')}%`)
        .limit(3);

      if (orgs && orgs.length > 0) {
        for (const org of orgs) {
          const similarity = calculateStringSimilarity(orgName, org.name);
          if (similarity >= 0.6) {
            suggestions.push({
              sourceType: 'profile',
              sourceId: profile.id,
              targetType: 'organization',
              targetId: org.id,
              suggestedRole: pattern.role,
              confidence: pattern.confidence * similarity,
              reasoning: `Bio mentions: "${match[0].substring(0, 80)}..."`,
              evidence: {
                matchType: 'bio_keyword',
                bioExcerpt: match[0],
                extractedName: orgName,
                orgName: org.name,
                similarity,
                pattern: pattern.regex.source
              }
            });
          }
        }
      }
    }
  }

  return suggestions;
}

/**
 * Match by location - link to organizations/programs in same location
 */
async function matchByLocation(profile: Profile): Promise<LinkSuggestion[]> {
  if (!profile.location) return [];

  const suggestions: LinkSuggestion[] = [];

  // Find organizations in same location
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, location')
    .ilike('location', `%${profile.location}%`)
    .limit(5);

  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      suggestions.push({
        sourceType: 'profile',
        sourceId: profile.id,
        targetType: 'organization',
        targetId: org.id,
        suggestedRole: 'Team Member',
        confidence: 0.50, // Low confidence - location alone isn't strong evidence
        reasoning: `Both located in ${profile.location}`,
        evidence: {
          matchType: 'location',
          profileLocation: profile.location,
          orgLocation: org.location
        }
      });
    }
  }

  return suggestions;
}

/**
 * Infer role from bio text
 */
function inferRoleFromBio(bio: string): string {
  const bioLower = bio.toLowerCase();

  if (bioLower.includes('founded') || bioLower.includes('co-founded') || bioLower.includes('co-founder')) {
    return 'Founder';
  }
  if (bioLower.includes('chair') || bioLower.includes('chairs')) {
    return 'Chair';
  }
  if (bioLower.includes('director') || bioLower.includes('ceo') || bioLower.includes('executive director')) {
    return 'Director';
  }
  if (bioLower.includes('board member') || bioLower.includes('board of')) {
    return 'Board Member';
  }
  if (bioLower.includes('volunteer')) {
    return 'Volunteer';
  }
  if (bioLower.includes('coordinator')) {
    return 'Coordinator';
  }
  if (bioLower.includes('manager')) {
    return 'Manager';
  }

  return 'Team Member';
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  // Simple containment check
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }

  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Check if word is too generic to be an organization name
 */
function isGenericWord(word: string): boolean {
  const genericWords = [
    'the', 'and', 'for', 'with', 'organization', 'company', 'group',
    'team', 'people', 'community', 'service', 'project', 'program'
  ];
  return genericWords.includes(word.toLowerCase());
}

/**
 * Remove duplicate suggestions (same source/target pair)
 */
function deduplicateSuggestions(suggestions: LinkSuggestion[]): LinkSuggestion[] {
  const seen = new Set<string>();
  const unique: LinkSuggestion[] = [];

  for (const suggestion of suggestions) {
    const key = `${suggestion.sourceType}:${suggestion.sourceId}->${suggestion.targetType}:${suggestion.targetId}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(suggestion);
    } else {
      // If duplicate, keep the one with higher confidence
      const existingIndex = unique.findIndex(s =>
        s.sourceType === suggestion.sourceType &&
        s.sourceId === suggestion.sourceId &&
        s.targetType === suggestion.targetType &&
        s.targetId === suggestion.targetId
      );

      if (existingIndex >= 0 && suggestion.confidence > unique[existingIndex].confidence) {
        unique[existingIndex] = suggestion;
      }
    }
  }

  return unique;
}

/**
 * Save suggestions to database
 */
export async function saveSuggestions(suggestions: LinkSuggestion[]): Promise<void> {
  for (const suggestion of suggestions) {
    const { error } = await supabase
      .from('content_link_suggestions')
      .upsert({
        source_type: suggestion.sourceType,
        source_id: suggestion.sourceId,
        target_type: suggestion.targetType,
        target_id: suggestion.targetId,
        suggested_role: suggestion.suggestedRole,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
        evidence: suggestion.evidence,
        status: 'pending'
      }, {
        onConflict: 'source_type,source_id,target_type,target_id'
      });

    if (error) {
      console.error('Error saving suggestion:', error);
    }
  }
}

/**
 * Auto-apply high confidence suggestions
 */
export async function autoApplyHighConfidenceSuggestions(suggestions: LinkSuggestion[]): Promise<number> {
  let applied = 0;

  for (const suggestion of suggestions) {
    // Only auto-apply very high confidence suggestions
    if (suggestion.confidence >= 0.90 && suggestion.targetType === 'organization') {
      const { error } = await supabase
        .from('organizations_profiles')
        .upsert({
          organization_id: suggestion.targetId,
          public_profile_id: suggestion.sourceId,
          role: suggestion.suggestedRole || 'Team Member',
          is_current: true,
          is_featured: suggestion.confidence >= 0.95
        }, {
          onConflict: 'organization_id,public_profile_id'
        });

      if (!error) {
        // Mark suggestion as auto-applied
        await supabase
          .from('content_link_suggestions')
          .update({
            status: 'auto-applied',
            auto_applied: true,
            applied_at: new Date().toISOString()
          })
          .eq('source_id', suggestion.sourceId)
          .eq('target_id', suggestion.targetId);

        applied++;
      }
    }
  }

  return applied;
}
