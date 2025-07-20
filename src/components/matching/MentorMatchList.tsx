'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Filter,
  Star,
  Users,
  MapPin,
  Clock,
  Briefcase,
  Heart,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { MatchingAlgorithm, type MentorMatch, type MatchingFilters } from '@/lib/matching-algorithm';
import type { AssessmentData } from '@/components/skills/SkillsAssessment';
import type { MentorExpertiseData } from '@/components/mentors/MentorExpertiseForm';
import { ConnectionRequestModal, type ConnectionRequest } from '@/components/connections/ConnectionRequestModal';

interface MentorMatchListProps {
  youthAssessment: AssessmentData;
  mentors: Array<{
    profile: { 
      id: string; 
      name: string; 
      role: string; 
      organization: string;
      avatar?: string;
      location?: string;
      rating?: number;
      responseRate?: number;
    };
    expertise: MentorExpertiseData;
  }>;
  onRequestConnection: (mentorId: string) => void;
  onViewProfile: (mentorId: string) => void;
}

export function MentorMatchList({ 
  youthAssessment, 
  mentors, 
  onRequestConnection, 
  onViewProfile 
}: MentorMatchListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MatchingFilters>({
    minScore: 50,
    maxResults: 20,
    requireSharedSkills: false,
    requireSharedInterests: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // Calculate matches using the matching algorithm
  const matches = useMemo(() => {
    const filteredMentors = mentors.filter(mentor => 
      !searchQuery || 
      mentor.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.profile.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.profile.organization.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return MatchingAlgorithm.findMatches(youthAssessment, filteredMentors, filters);
  }, [youthAssessment, mentors, searchQuery, filters]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleConnectionRequest = (mentorId: string) => {
    setSelectedMentor(mentorId);
    setShowConnectionModal(true);
  };

  const handleSubmitConnectionRequest = async (request: ConnectionRequest) => {
    // In real app, this would call an API
    console.log('Connection request:', request);
    onRequestConnection(request.mentorId);
    setShowConnectionModal(false);
    setSelectedMentor(null);
  };

  const selectedMentorData = selectedMentor ? 
    mentors.find(m => m.profile.id === selectedMentor) : null;
  
  const selectedMatch = selectedMentor ? 
    matches.find(m => m.mentorId === selectedMentor) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Mentor Matches</h2>
          <p className="text-gray-600">
            Found {matches.length} mentor{matches.length !== 1 ? 's' : ''} that match your profile
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search mentors by name, role, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Match Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Minimum Match Score</Label>
                  <Select
                    value={filters.minScore?.toString()}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minScore: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30% or higher</SelectItem>
                      <SelectItem value="50">50% or higher</SelectItem>
                      <SelectItem value="70">70% or higher</SelectItem>
                      <SelectItem value="80">80% or higher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Maximum Results</Label>
                  <Select
                    value={filters.maxResults?.toString()}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, maxResults: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 mentors</SelectItem>
                      <SelectItem value="20">20 mentors</SelectItem>
                      <SelectItem value="50">50 mentors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Meeting Preference</Label>
                  <Select
                    value={filters.meetingPreference || 'any'}
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      meetingPreference: value === 'any' ? undefined : value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any format</SelectItem>
                      <SelectItem value="virtual">Virtual only</SelectItem>
                      <SelectItem value="in-person">In-person only</SelectItem>
                      <SelectItem value="both">Both formats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-skills"
                    checked={filters.requireSharedSkills}
                    onCheckedChange={(checked) => setFilters(prev => ({ 
                      ...prev, 
                      requireSharedSkills: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="require-skills">Require shared skills</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-interests"
                    checked={filters.requireSharedInterests}
                    onCheckedChange={(checked) => setFilters(prev => ({ 
                      ...prev, 
                      requireSharedInterests: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="require-interests">Require shared interests</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Match Results */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search criteria to find more mentors.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setFilters({ minScore: 30, maxResults: 20 });
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const mentor = mentors.find(m => m.profile.id === match.mentorId);
            if (!mentor) return null;

            return (
              <Card key={match.mentorId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {mentor.profile.avatar ? (
                          <img 
                            src={mentor.profile.avatar} 
                            alt={mentor.profile.name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-8 w-8 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold">{match.mentorName}</h3>
                          <Badge className={getConfidenceColor(match.score.confidence)}>
                            {match.score.confidence} confidence
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-1">{match.mentorRole}</p>
                        <p className="text-sm text-gray-500 mb-2">{match.mentorOrganization}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {mentor.profile.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {mentor.profile.location}
                            </div>
                          )}
                          {mentor.profile.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              {mentor.profile.rating.toFixed(1)}
                            </div>
                          )}
                          {mentor.profile.responseRate && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {mentor.profile.responseRate}% response rate
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-2xl font-bold ${getScoreColor(match.score.total)}`}>
                          {match.score.total}%
                        </span>
                        <span className="text-sm text-gray-500">match</span>
                      </div>
                      <Progress value={match.score.total} className="w-24 h-2" />
                    </div>
                  </div>

                  {/* Match Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-sm font-medium mb-1">Skills</div>
                      <div className={`text-lg font-bold ${getScoreColor(match.score.breakdown.skills)}`}>
                        {Math.round(match.score.breakdown.skills)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium mb-1">Interests</div>
                      <div className={`text-lg font-bold ${getScoreColor(match.score.breakdown.interests)}`}>
                        {Math.round(match.score.breakdown.interests)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium mb-1">Schedule</div>
                      <div className={`text-lg font-bold ${getScoreColor(match.score.breakdown.availability)}`}>
                        {Math.round(match.score.breakdown.availability)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium mb-1">Experience</div>
                      <div className={`text-lg font-bold ${getScoreColor(match.score.breakdown.experience)}`}>
                        {Math.round(match.score.breakdown.experience)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium mb-1">Goals</div>
                      <div className={`text-lg font-bold ${getScoreColor(match.score.breakdown.goals)}`}>
                        {Math.round(match.score.breakdown.goals)}%
                      </div>
                    </div>
                  </div>

                  {/* Shared Skills and Interests */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {match.sharedSkills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Shared Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {match.sharedSkills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.sharedSkills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.sharedSkills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {match.sharedInterests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Shared Interests</h4>
                        <div className="flex flex-wrap gap-1">
                          {match.sharedInterests.slice(0, 3).map((interest, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {match.sharedInterests.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.sharedInterests.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {match.recommendationReason}
                    </p>
                  </div>

                  {/* Compatibility Factors */}
                  {match.compatibilityFactors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Why this might work well:</h4>
                      <ul className="space-y-1">
                        {match.compatibilityFactors.map((factor, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => handleConnectionRequest(match.mentorId)}
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Request Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onViewProfile(match.mentorId)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connection Request Modal */}
      {selectedMentorData && selectedMatch && (
        <ConnectionRequestModal
          isOpen={showConnectionModal}
          onClose={() => {
            setShowConnectionModal(false);
            setSelectedMentor(null);
          }}
          onSubmit={handleSubmitConnectionRequest}
          mentor={{
            id: selectedMentorData.profile.id,
            name: selectedMentorData.profile.name,
            role: selectedMentorData.profile.role,
            organization: selectedMentorData.profile.organization,
            avatar: selectedMentorData.profile.avatar,
            sharedSkills: selectedMatch.sharedSkills,
            sharedInterests: selectedMatch.sharedInterests
          }}
        />
      )}
    </div>
  );
}