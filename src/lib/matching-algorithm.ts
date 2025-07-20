// Advanced matching algorithm for JusticeHub mentor-youth connections
import { 
  calculateSkillMatch, 
  calculateInterestMatch, 
  findSkillById, 
  findInterestById,
  type Skill,
  type Interest 
} from './skills-taxonomy';
import type { AssessmentData } from '@/components/skills/SkillsAssessment';
import type { MentorExpertiseData } from '@/components/mentors/MentorExpertiseForm';

export interface MatchScore {
  total: number;
  breakdown: {
    skills: number;
    interests: number;
    availability: number;
    experience: number;
    goals: number;
  };
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[];
}

export interface MentorMatch {
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  mentorOrganization: string;
  score: MatchScore;
  sharedSkills: string[];
  sharedInterests: string[];
  compatibilityFactors: string[];
  recommendationReason: string;
}

export interface MatchingFilters {
  minScore?: number;
  maxResults?: number;
  requireSharedSkills?: boolean;
  requireSharedInterests?: boolean;
  meetingPreference?: 'in-person' | 'virtual' | 'both';
  experienceLevel?: 'any' | 'beginner-friendly' | 'advanced';
}

export class MatchingAlgorithm {
  /**
   * Calculate comprehensive match score between youth and mentor
   */
  static calculateMatch(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData,
    mentorProfile: {
      id: string;
      name: string;
      role: string;
      organization: string;
    }
  ): MentorMatch {
    const breakdown = {
      skills: this.calculateSkillsScore(youthData, mentorData),
      interests: this.calculateInterestsScore(youthData, mentorData),
      availability: this.calculateAvailabilityScore(youthData, mentorData),
      experience: this.calculateExperienceScore(youthData, mentorData),
      goals: this.calculateGoalsScore(youthData, mentorData)
    };

    // Weighted scoring - skills and interests are most important
    const weights = {
      skills: 0.35,
      interests: 0.25,
      availability: 0.20,
      experience: 0.15,
      goals: 0.05
    };

    const total = Object.entries(breakdown).reduce(
      (sum, [category, score]) => sum + (score * weights[category as keyof typeof weights]),
      0
    );

    const confidence = this.determineConfidence(total, breakdown);
    const reasoning = this.generateReasoning(youthData, mentorData, breakdown);
    const sharedSkills = this.findSharedSkills(youthData, mentorData);
    const sharedInterests = this.findSharedInterests(youthData, mentorData);
    const compatibilityFactors = this.identifyCompatibilityFactors(youthData, mentorData);
    const recommendationReason = this.generateRecommendation(youthData, mentorData, breakdown);

    return {
      mentorId: mentorProfile.id,
      mentorName: mentorProfile.name,
      mentorRole: mentorProfile.role,
      mentorOrganization: mentorProfile.organization,
      score: {
        total: Math.round(total),
        breakdown,
        confidence,
        reasoning
      },
      sharedSkills,
      sharedInterests,
      compatibilityFactors,
      recommendationReason
    };
  }

  /**
   * Find best mentor matches for a youth
   */
  static findMatches(
    youthData: AssessmentData,
    mentors: Array<{
      profile: { id: string; name: string; role: string; organization: string };
      expertise: MentorExpertiseData;
    }>,
    filters: MatchingFilters = {}
  ): MentorMatch[] {
    const {
      minScore = 50,
      maxResults = 10,
      requireSharedSkills = false,
      requireSharedInterests = false,
      meetingPreference,
      experienceLevel
    } = filters;

    let matches = mentors
      .map(mentor => this.calculateMatch(youthData, mentor.expertise, mentor.profile))
      .filter(match => {
        // Apply filters
        if (match.score.total < minScore) return false;
        if (requireSharedSkills && match.sharedSkills.length === 0) return false;
        if (requireSharedInterests && match.sharedInterests.length === 0) return false;
        
        // Meeting preference filter would require mentor availability data
        if (meetingPreference) {
          // Implementation depends on mentor availability structure
        }
        
        return true;
      })
      .sort((a, b) => b.score.total - a.score.total);

    return matches.slice(0, maxResults);
  }

  /**
   * Calculate skills compatibility score (0-100)
   */
  private static calculateSkillsScore(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): number {
    const youthSkillIds = youthData.skills.map(s => s.id);
    const mentorSkillIds = mentorData.expertise.map(e => e.id);
    
    if (youthSkillIds.length === 0 || mentorSkillIds.length === 0) return 0;

    // Direct skill matches
    const directMatches = youthSkillIds.filter(skillId => mentorSkillIds.includes(skillId));
    
    // Experience level compatibility
    let experienceBonus = 0;
    directMatches.forEach(skillId => {
      const youthSkill = youthData.skills.find(s => s.id === skillId);
      const mentorExpertise = mentorData.expertise.find(e => e.id === skillId);
      
      if (youthSkill && mentorExpertise) {
        // Bonus for appropriate experience gap (mentor should be more experienced)
        const youthLevel = ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(youthSkill.level);
        const mentorLevel = ['proficient', 'expert', 'master'].indexOf(mentorExpertise.level);
        
        if (mentorLevel > youthLevel) {
          experienceBonus += 10; // Bonus for appropriate mentoring gap
        }
      }
    });

    const baseScore = (directMatches.length / Math.max(youthSkillIds.length, mentorSkillIds.length)) * 100;
    return Math.min(100, baseScore + experienceBonus);
  }

  /**
   * Calculate interests compatibility score (0-100)
   */
  private static calculateInterestsScore(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): number {
    return calculateInterestMatch(youthData.interests, mentorData.interests) * 100;
  }

  /**
   * Calculate availability compatibility score (0-100)
   */
  private static calculateAvailabilityScore(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): number {
    let score = 70; // Base compatibility score
    
    // Meeting preference compatibility
    const youthPreference = youthData.preferences.meetingPreference;
    const mentorTypes = mentorData.availability.meetingTypes;
    
    if (youthPreference === 'both' || 
        (youthPreference === 'virtual' && mentorTypes.includes('virtual')) ||
        (youthPreference === 'in-person' && mentorTypes.includes('in-person'))) {
      score += 20;
    }
    
    // Communication frequency compatibility
    const youthFreq = youthData.preferences.communicationFrequency;
    const mentorResponse = mentorData.availability.responseTime;
    
    // Bonus for quick responders with frequent communication needs
    if (youthFreq === 'weekly' && mentorResponse === 'within-24-hours') {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate experience level compatibility score (0-100)
   */
  private static calculateExperienceScore(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): number {
    let score = 60; // Base score
    
    // Mentor experience in mentoring
    if (mentorData.mentoring.previousExperience) {
      score += 20;
      
      if (mentorData.mentoring.yearsAsMentor >= 2) {
        score += 10;
      }
      
      if (mentorData.mentoring.numberOfMentees >= 5) {
        score += 10;
      }
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate goals alignment score (0-100)
   */
  private static calculateGoalsScore(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): number {
    let score = 50; // Base alignment score
    
    // Career path alignment
    if (youthData.goals.careerPath) {
      const careerKeywords = youthData.goals.careerPath.toLowerCase().split(' ');
      
      // Check if mentor's role/organization aligns with career interests
      const mentorContext = `${mentorData.experience.currentRole} ${mentorData.experience.organization}`.toLowerCase();
      
      const alignmentCount = careerKeywords.filter(keyword => 
        keyword.length > 3 && mentorContext.includes(keyword)
      ).length;
      
      score += Math.min(30, alignmentCount * 10);
    }
    
    // Goal-oriented mentorship style preference
    if (youthData.preferences.mentorshipStyle === 'goal-oriented') {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  /**
   * Determine confidence level based on scores
   */
  private static determineConfidence(
    total: number,
    breakdown: MatchScore['breakdown']
  ): 'low' | 'medium' | 'high' {
    if (total >= 80 && breakdown.skills >= 70 && breakdown.interests >= 60) {
      return 'high';
    }
    if (total >= 60 && (breakdown.skills >= 50 || breakdown.interests >= 50)) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate reasoning for the match
   */
  private static generateReasoning(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData,
    breakdown: MatchScore['breakdown']
  ): string[] {
    const reasons: string[] = [];
    
    if (breakdown.skills >= 70) {
      reasons.push('Strong skill alignment for effective mentoring');
    }
    
    if (breakdown.interests >= 60) {
      reasons.push('Shared interests for engaging conversations');
    }
    
    if (breakdown.availability >= 80) {
      reasons.push('Compatible schedules and communication preferences');
    }
    
    if (mentorData.mentoring.previousExperience) {
      reasons.push(`Experienced mentor with ${mentorData.mentoring.yearsAsMentor}+ years of mentoring`);
    }
    
    if (breakdown.goals >= 70) {
      reasons.push('Career goals align with mentor\'s background');
    }
    
    return reasons;
  }

  /**
   * Find skills shared between youth and mentor
   */
  private static findSharedSkills(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): string[] {
    const youthSkillIds = youthData.skills.map(s => s.id);
    const mentorSkillIds = mentorData.expertise.map(e => e.id);
    
    return youthSkillIds
      .filter(skillId => mentorSkillIds.includes(skillId))
      .map(skillId => {
        const skill = findSkillById(skillId);
        return skill?.name || skillId;
      });
  }

  /**
   * Find interests shared between youth and mentor
   */
  private static findSharedInterests(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): string[] {
    return youthData.interests
      .filter(interestId => mentorData.interests.includes(interestId))
      .map(interestId => {
        const interest = findInterestById(interestId);
        return interest?.name || interestId;
      });
  }

  /**
   * Identify specific compatibility factors
   */
  private static identifyCompatibilityFactors(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData
  ): string[] {
    const factors: string[] = [];
    
    // Meeting preferences
    if (youthData.preferences.meetingPreference === 'virtual' && 
        mentorData.availability.meetingTypes.includes('virtual')) {
      factors.push('Both prefer virtual meetings');
    }
    
    // Communication style
    if (youthData.preferences.mentorshipStyle === 'structured' && 
        mentorData.mentoring.approach.toLowerCase().includes('structured')) {
      factors.push('Both value structured mentorship approach');
    }
    
    // Response time compatibility
    if (youthData.preferences.communicationFrequency === 'weekly' && 
        mentorData.availability.responseTime === 'within-24-hours') {
      factors.push('Quick response time matches communication needs');
    }
    
    return factors;
  }

  /**
   * Generate a personalized recommendation reason
   */
  private static generateRecommendation(
    youthData: AssessmentData,
    mentorData: MentorExpertiseData,
    breakdown: MatchScore['breakdown']
  ): string {
    const sharedSkills = this.findSharedSkills(youthData, mentorData);
    const sharedInterests = this.findSharedInterests(youthData, mentorData);
    
    if (sharedSkills.length > 0 && sharedInterests.length > 0) {
      return `Great match! You both share expertise in ${sharedSkills[0]} and interest in ${sharedInterests[0]}. This mentor can help you advance your skills while connecting over common interests.`;
    }
    
    if (sharedSkills.length > 0) {
      return `This mentor has strong expertise in ${sharedSkills[0]}, which aligns perfectly with your current skill level. They can guide you to the next level.`;
    }
    
    if (sharedInterests.length > 0) {
      return `While you have different skill focuses, you both share a passion for ${sharedInterests[0]}. This common ground can lead to meaningful mentoring conversations.`;
    }
    
    if (breakdown.experience >= 70) {
      return `This experienced mentor brings valuable perspective from their background in ${mentorData.experience.currentRole}. Their mentoring experience can help you navigate challenges effectively.`;
    }
    
    return `This mentor's background and approach align well with your preferences. They can provide valuable guidance for your journey.`;
  }

  /**
   * Bulk match multiple youth to available mentors
   */
  static bulkMatch(
    youthProfiles: Array<{
      id: string;
      name: string;
      assessment: AssessmentData;
    }>,
    mentors: Array<{
      profile: { id: string; name: string; role: string; organization: string };
      expertise: MentorExpertiseData;
    }>,
    filters: MatchingFilters = {}
  ): Record<string, MentorMatch[]> {
    const results: Record<string, MentorMatch[]> = {};
    
    youthProfiles.forEach(youth => {
      results[youth.id] = this.findMatches(youth.assessment, mentors, filters);
    });
    
    return results;
  }

  /**
   * Get mentor utilization metrics
   */
  static getMentorUtilization(
    matches: Record<string, MentorMatch[]>
  ): Record<string, { matchCount: number; avgScore: number }> {
    const utilization: Record<string, { scores: number[]; count: number }> = {};
    
    Object.values(matches).forEach(mentorMatches => {
      mentorMatches.forEach(match => {
        if (!utilization[match.mentorId]) {
          utilization[match.mentorId] = { scores: [], count: 0 };
        }
        utilization[match.mentorId].scores.push(match.score.total);
        utilization[match.mentorId].count++;
      });
    });
    
    const results: Record<string, { matchCount: number; avgScore: number }> = {};
    Object.entries(utilization).forEach(([mentorId, data]) => {
      results[mentorId] = {
        matchCount: data.count,
        avgScore: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
      };
    });
    
    return results;
  }
}

// Export utility functions for external use
export const matchingUtils = {
  calculateSkillMatch: MatchingAlgorithm.calculateMatch,
  findMatches: MatchingAlgorithm.findMatches,
  bulkMatch: MatchingAlgorithm.bulkMatch,
  getMentorUtilization: MatchingAlgorithm.getMentorUtilization
};