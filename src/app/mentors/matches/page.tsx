'use client';

import { useState, useEffect } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { MentorMatchList } from '@/components/matching/MentorMatchList';
import { SkillsAssessment, type AssessmentData } from '@/components/skills/SkillsAssessment';
import { 
  Users,
  Sparkles,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Settings,
  Star
} from 'lucide-react';
import Link from 'next/link';

// Mock data - in real app this would come from API/database
const mockMentors = [
  {
    profile: {
      id: 'mentor-1',
      name: 'Sarah Chen',
      role: 'Senior Software Engineer',
      organization: 'Tech for Justice',
      avatar: undefined,
      location: 'San Francisco, CA',
      rating: 4.8,
      responseRate: 95
    },
    expertise: {
      expertise: [
        { id: 'web-dev', name: 'Web Development', level: 'expert' as const, yearsExperience: 5, description: 'Full-stack development with React and Node.js', verified: true },
        { id: 'leadership', name: 'Leadership', level: 'proficient' as const, yearsExperience: 3, description: 'Team leadership and project management', verified: false }
      ],
      interests: ['technology', 'education-equity', 'mentorship'],
      experience: {
        currentRole: 'Senior Software Engineer',
        organization: 'Tech for Justice',
        yearsExperience: 8,
        previousRoles: [],
        education: [],
        certifications: []
      },
      mentoring: {
        previousExperience: true,
        yearsAsMentor: 3,
        numberOfMentees: 12,
        specializations: ['web-development', 'career-guidance'],
        approach: 'I focus on hands-on learning and goal-oriented mentorship',
        successStories: 'Helped 5 mentees land their first tech jobs'
      },
      availability: {
        hoursPerWeek: 3,
        preferredDays: ['tuesday', 'thursday'],
        timeZone: 'PST',
        meetingTypes: ['virtual', 'in-person'] as const,
        responseTime: 'within-24-hours'
      },
      verification: {
        references: [],
        backgroundCheck: true
      }
    }
  },
  {
    profile: {
      id: 'mentor-2',
      name: 'Marcus Williams',
      role: 'Community Organizer',
      organization: 'Justice Alliance',
      avatar: undefined,
      location: 'Chicago, IL',
      rating: 4.9,
      responseRate: 88
    },
    expertise: {
      expertise: [
        { id: 'community-organizing', name: 'Community Organizing', level: 'master' as const, yearsExperience: 10, description: 'Grassroots organizing and campaign management', verified: true },
        { id: 'advocacy', name: 'Advocacy & Activism', level: 'expert' as const, yearsExperience: 8, description: 'Policy advocacy and social justice campaigns', verified: true }
      ],
      interests: ['criminal-justice', 'youth-advocacy', 'education-equity'],
      experience: {
        currentRole: 'Community Organizer',
        organization: 'Justice Alliance',
        yearsExperience: 12,
        previousRoles: [],
        education: [],
        certifications: []
      },
      mentoring: {
        previousExperience: true,
        yearsAsMentor: 5,
        numberOfMentees: 20,
        specializations: ['advocacy', 'leadership'],
        approach: 'Empowerment-focused mentoring with emphasis on community impact',
        successStories: 'Mentored organizers who led successful policy campaigns'
      },
      availability: {
        hoursPerWeek: 4,
        preferredDays: ['monday', 'wednesday', 'friday'],
        timeZone: 'CST',
        meetingTypes: ['virtual', 'in-person'] as const,
        responseTime: 'within-48-hours'
      },
      verification: {
        references: [],
        backgroundCheck: true
      }
    }
  },
  {
    profile: {
      id: 'mentor-3',
      name: 'Dr. Elena Rodriguez',
      role: 'Clinical Psychologist',
      organization: 'Mental Health First',
      avatar: undefined,
      location: 'Austin, TX',
      rating: 4.7,
      responseRate: 92
    },
    expertise: {
      expertise: [
        { id: 'mental-health', name: 'Mental Health Advocacy', level: 'master' as const, yearsExperience: 15, description: 'Clinical psychology and mental health advocacy', verified: true },
        { id: 'peer-counseling', name: 'Peer Counseling', level: 'expert' as const, yearsExperience: 12, description: 'Training peer counselors and support systems', verified: true }
      ],
      interests: ['mental-health', 'youth-advocacy', 'education-equity'],
      experience: {
        currentRole: 'Clinical Psychologist',
        organization: 'Mental Health First',
        yearsExperience: 15,
        previousRoles: [],
        education: [],
        certifications: []
      },
      mentoring: {
        previousExperience: true,
        yearsAsMentor: 7,
        numberOfMentees: 25,
        specializations: ['mental-health', 'wellness', 'academic-support'],
        approach: 'Holistic approach focusing on mental wellness and personal growth',
        successStories: 'Supported students through academic and personal challenges'
      },
      availability: {
        hoursPerWeek: 2,
        preferredDays: ['tuesday', 'saturday'],
        timeZone: 'CST',
        meetingTypes: ['virtual'] as const,
        responseTime: 'within-24-hours'
      },
      verification: {
        references: [],
        backgroundCheck: true
      }
    }
  }
];

export default function MentorMatchesPage() {
  const { user, isLoading } = useUserContext();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Check if user has completed assessment
  useEffect(() => {
    // In real app, fetch user's assessment from database
    // For demo, check localStorage or use mock data
    const savedAssessment = localStorage.getItem('youthAssessment');
    if (savedAssessment) {
      try {
        setAssessment(JSON.parse(savedAssessment));
      } catch (error) {
        console.error('Error parsing saved assessment:', error);
      }
    }
  }, []);

  const handleAssessmentComplete = (data: AssessmentData) => {
    setAssessment(data);
    localStorage.setItem('youthAssessment', JSON.stringify(data));
    setShowAssessment(false);
  };

  const handleRequestConnection = (mentorId: string) => {
    // In real app, this would send a connection request
    console.log('Requesting connection with mentor:', mentorId);
    // Could show a modal or redirect to messaging system
  };

  const handleViewProfile = (mentorId: string) => {
    // In real app, this would navigate to mentor profile
    console.log('Viewing mentor profile:', mentorId);
    // Could redirect to /mentors/[id] page
  };

  const refreshMatches = () => {
    setLoadingMatches(true);
    // Simulate API call
    setTimeout(() => {
      setLoadingMatches(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'youth') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>This page is for youth members only.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show assessment if not completed
  if (!assessment || showAssessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Find Your Perfect Mentor</h1>
            <p className="text-gray-600">
              Complete your skills assessment to get personalized mentor recommendations
            </p>
          </div>
          
          <SkillsAssessment 
            onComplete={handleAssessmentComplete}
            initialData={assessment || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Your Mentor Matches</h1>
              <p className="text-gray-600">
                Personalized mentor recommendations based on your skills and interests
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAssessment(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Update Assessment
              </Button>
              <Button
                variant="outline"
                onClick={refreshMatches}
                disabled={loadingMatches}
              >
                {loadingMatches ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Matches
              </Button>
            </div>
          </div>

          {/* Assessment Summary */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Assessment Complete</p>
                    <p className="text-sm text-gray-600">
                      {assessment.skills.length} skills • {assessment.interests.length} interests • 
                      {assessment.goals.shortTerm.length + assessment.goals.longTerm.length} goals
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssessment(true)}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Our matching algorithm considers your skills, interests, goals, and preferences to find mentors 
              who can best support your journey. Higher percentages indicate better compatibility.
            </AlertDescription>
          </Alert>
        </div>

        {/* Loading State */}
        {loadingMatches ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Match Results */
          <MentorMatchList
            youthAssessment={assessment}
            mentors={mockMentors}
            onRequestConnection={handleRequestConnection}
            onViewProfile={handleViewProfile}
          />
        )}

        {/* Additional Resources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help Finding the Right Mentor?</CardTitle>
            <CardDescription>
              Here are some resources to help you make the most of your mentoring experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/mentors/guide" className="block">
                <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <h4 className="font-medium mb-2">Mentoring Guide</h4>
                  <p className="text-sm text-gray-600">
                    Learn how to build successful mentoring relationships
                  </p>
                </div>
              </Link>
              <Link href="/mentors/browse" className="block">
                <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <h4 className="font-medium mb-2">Browse All Mentors</h4>
                  <p className="text-sm text-gray-600">
                    Explore our full network of available mentors
                  </p>
                </div>
              </Link>
              <Link href="/support" className="block">
                <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <h4 className="font-medium mb-2">Get Support</h4>
                  <p className="text-sm text-gray-600">
                    Contact our team for help with matching
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}